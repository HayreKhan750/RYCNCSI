import { useState, useEffect, useMemo } from 'react';
import { db, storage } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
  startAfter,
  documentId
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fetchUserFlags, fetchUserReactions } from '../utils/feedbackInteractions';
import scheduleData from '../assets/my-file.optimized.json';

// Helper to build instructor lookup map from schedule data
const getInstructorMap = () => {
  const map = new Map();
  if (!scheduleData?.schedule) return map;
  
  scheduleData.schedule.forEach(dept => {
    if (dept.courses) {
      dept.courses.forEach(course => {
        if (course.instructor) {
          const instructors = Array.isArray(course.instructor) ? course.instructor : [{ name: course.instructor, email: null }];
          instructors.forEach(inst => {
            const key = (inst.email || inst.name || '').toLowerCase();
            if (key && inst.name) {
              map.set(key, inst.name);
            }
            // Also map name directly for robustness
            if (inst.name) {
                map.set(inst.name.toLowerCase(), inst.name);
                map.set(inst.name, inst.name);
            }
          });
        }
      });
    }
  });
  return map;
};

const STATIC_INSTRUCTOR_MAP = getInstructorMap();

export function useStudentProfile(user) {
  const [profile, setProfile] = useState(null);
  const [myRatings, setMyRatings] = useState([]);
  const [stats, setStats] = useState({ totalRatings: 0, totalComments: 0, avgGiven: 0 });
  const [ratedInstructors, setRatedInstructors] = useState([]);
  const [topInstructors, setTopInstructors] = useState([]);
  const [popularReviewers, setPopularReviewers] = useState([]);
  const [userReactions, setUserReactions] = useState([]);
  const [userFlags, setUserFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid || !db) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch User Profile
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        setProfile({
          name: userData.name || user.displayName || user.email,
          email: user.email,
          department: userData.department || 'Not set',
          bio: userData.bio || '',
          profilePictureUrl: userData.profilePictureUrl || user.photoURL || '',
          role: userData.role || 'Student',
          joinedAt: userData.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : new Date(user.metadata.creationTime).toLocaleDateString(),
        });

        // 2. Fetch User's Ratings
        const ratingsQ = query(
          collection(db, 'feedbacks'),
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const ratingsSnap = await getDocs(ratingsQ);
        const ratingsRows = ratingsSnap.docs.map((d) => {
            const data = d.data();
            // Enrich with static name if missing
            if (data.instructorId && STATIC_INSTRUCTOR_MAP.has(data.instructorId)) {
                data.instructorName = STATIC_INSTRUCTOR_MAP.get(data.instructorId);
            }
            return { id: d.id, ...data };
        });
        setMyRatings(ratingsRows);

        // 3. Calculate Stats
        const totalRatings = ratingsRows.length;
        const totalComments = ratingsRows.filter((r) => r.comment && r.comment.trim()).length;
        const avgGiven = totalRatings
          ? (ratingsRows.reduce((sum, r) => sum + (r.rating || 0), 0) / totalRatings).toFixed(1)
          : 0;
        setStats({ totalRatings, totalComments, avgGiven });

        // 4. Process Rated Instructors
        const instMap = new Map();
        ratingsRows.forEach((r) => {
          const key = r.instructorId || r.instructorName || 'unknown';
          if (!key || key === 'unknown') return;
          
          let name = r.instructorName;
          if (!name && r.instructorId && STATIC_INSTRUCTOR_MAP.has(r.instructorId)) {
              name = STATIC_INSTRUCTOR_MAP.get(r.instructorId);
          }
          
          const existing = instMap.get(key) || {
            instructorId: r.instructorId,
            instructorName: name || r.instructorId,
            deptName: r.deptName || null,
            count: 0,
            lastRating: r.rating || 0,
          };
          existing.count += 1;
          existing.lastRating = r.rating || existing.lastRating; // Simplification
          instMap.set(key, existing);
        });
        setRatedInstructors(Array.from(instMap.values()));

        // 5. Fetch Reactions & Flags
        const [reactions, flags] = await Promise.all([
          fetchUserReactions(user.uid),
          fetchUserFlags(user.uid),
        ]);
        setUserReactions(reactions);
        setUserFlags(flags);

        // 6. Fetch Top Instructors (Platform-wide)
        const topInstQ = query(
            collection(db, 'feedbacks'),
            orderBy('rating', 'desc'),
            limit(50)
        );
        const topInstSnap = await getDocs(topInstQ);
        const topInstMap = new Map();
        topInstSnap.docs.forEach(d => {
            const data = d.data();
            if(!data.instructorId) return;
            if(!topInstMap.has(data.instructorId)) {
                topInstMap.set(data.instructorId, {
                    instructorId: data.instructorId,
                    instructorName: data.instructorName || 'Instructor',
                    deptName: data.deptName || 'General',
                    ratingSum: 0,
                    count: 0
                });
            }
            const rec = topInstMap.get(data.instructorId);
            rec.ratingSum += data.rating || 0;
            rec.count++;
        });
        const topInstList = Array.from(topInstMap.values())
            .map(i => ({...i, avgRating: (i.ratingSum / i.count).toFixed(1)}))
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5);

        // 7. Fetch Popular Reviewers (Platform-wide)
        const popularQ = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(100));
        const popularSnap = await getDocs(popularQ);
        const reviewerMap = new Map();
        popularSnap.docs.forEach(d => {
            const data = d.data();
            if(!data.studentId) return;
            if(!reviewerMap.has(data.studentId)) {
                reviewerMap.set(data.studentId, {
                    studentId: data.studentId,
                    name: 'Student', 
                    department: 'Student',
                    count: 0
                });
            }
            reviewerMap.get(data.studentId).count++;
        });
        const popRevList = Array.from(reviewerMap.values()).sort((a,b) => b.count - a.count).slice(0,5);

        // 8. Enrich with Names from Users Collection
        const userIdsToFetch = new Set();
        topInstList.forEach(i => { if(i.instructorId) userIdsToFetch.add(i.instructorId); });
        popRevList.forEach(r => { if(r.studentId) userIdsToFetch.add(r.studentId); });

        if (userIdsToFetch.size > 0) {
            const ids = Array.from(userIdsToFetch);
            // Firestore 'in' query supports up to 10 values. Chunk if needed, but top 5+5=10 fits.
            const chunks = [];
            for (let i = 0; i < ids.length; i += 10) {
                chunks.push(ids.slice(i, i + 10));
            }

            const userNames = {};
            const userDepts = {};

            for (const chunk of chunks) {
                const usersQ = query(collection(db, 'users'), where(documentId(), 'in', chunk));
                const usersSnap = await getDocs(usersQ);
                usersSnap.forEach(doc => {
                    const d = doc.data();
                    const name = d.name || d.displayName || d.email || 'Unknown';
                    userNames[doc.id] = name;
                    userDepts[doc.id] = d.department || 'General';
                });
            }

            // Update lists
            topInstList.forEach(i => {
                // Try to find name in static map first (from JSON)
                if (STATIC_INSTRUCTOR_MAP.has(i.instructorId)) {
                    i.instructorName = STATIC_INSTRUCTOR_MAP.get(i.instructorId);
                } else if (i.instructorId && STATIC_INSTRUCTOR_MAP.has(i.instructorId.toLowerCase())) {
                    i.instructorName = STATIC_INSTRUCTOR_MAP.get(i.instructorId.toLowerCase());
                }
                // Then try users collection (if it was a UID)
                else if (userNames[i.instructorId]) {
                    i.instructorName = userNames[i.instructorId];
                    i.deptName = userDepts[i.instructorId] || i.deptName;
                }
            });
            popRevList.forEach(r => {
                 if (userNames[r.studentId]) {
                    r.name = userNames[r.studentId];
                    r.department = userDepts[r.studentId];
                }
            });
        } else {
             // If no user fetch needed (or failed), still try static map
             topInstList.forEach(i => {
                if (STATIC_INSTRUCTOR_MAP.has(i.instructorId)) {
                    i.instructorName = STATIC_INSTRUCTOR_MAP.get(i.instructorId);
                } else if (i.instructorId && STATIC_INSTRUCTOR_MAP.has(i.instructorId.toLowerCase())) {
                    i.instructorName = STATIC_INSTRUCTOR_MAP.get(i.instructorId.toLowerCase());
                }
             });
        }

        setTopInstructors(topInstList);
        setPopularReviewers(popRevList);

      } catch (err) {
        console.error("Error fetching student profile data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const updateProfile = async (formData, imageFile) => {
    if (!user?.uid) return;
    try {
      let profilePictureUrl = profile?.profilePictureUrl;

      if (imageFile) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      const updates = {
        ...formData,
        profilePictureUrl,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
      setProfile(prev => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      throw err;
    }
  };

  return {
    profile,
    myRatings,
    stats,
    ratedInstructors,
    topInstructors,
    popularReviewers,
    userReactions,
    userFlags,
    loading,
    error,
    updateProfile,
  };
}
