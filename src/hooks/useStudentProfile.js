import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserProfile, uploadProfilePicture } from '../store/slices/userSlice';
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  documentId
} from 'firebase/firestore';
import { fetchUserFlags, fetchUserReactions } from '../utils/feedbackInteractions';
import scheduleData from '../assets/my-file.optimized.json';

import { getInstructorMap } from '../utils/getInstructorMap';

const STATIC_INSTRUCTOR_MAP = getInstructorMap();

export function useStudentProfile(user) {
  const dispatch = useDispatch();
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
        
        let joinedDate = 'Unknown';
        if (userData.createdAt) {
            if (userData.createdAt.toDate) {
                joinedDate = userData.createdAt.toDate().toLocaleDateString();
            } else if (typeof userData.createdAt === 'string') {
                joinedDate = new Date(userData.createdAt).toLocaleDateString();
            } else if (typeof userData.createdAt === 'number') {
                joinedDate = new Date(userData.createdAt).toLocaleDateString();
            }
        }

        setProfile({
          name: userData.name || userData.displayName || user.displayName || user.email || 'Student',
          email: userData.email || user.email || '',
          department: userData.department || 'Not set',
          bio: userData.bio || '',
          profilePictureUrl: userData.profilePictureUrl || userData.photoURL || user.photoURL || '',
          role: userData.role || 'Student',
          joinedAt: joinedDate,
        });

        // 2. Fetch User's Ratings
        const ratingsQ = query(
          collection(db, 'feedbacks'),
          where('studentId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const ratingsSnap = await getDocs(ratingsQ);
        
        // Pre-fetch missing instructor names
        const missingInstructorIds = new Set();
        ratingsSnap.docs.forEach(d => {
            const data = d.data();
            if (data.instructorId && !STATIC_INSTRUCTOR_MAP.has(data.instructorId) && !STATIC_INSTRUCTOR_MAP.has(data.instructorId.toLowerCase())) {
                missingInstructorIds.add(data.instructorId);
            }
        });

        const fetchedInstructorNames = {};
        if (missingInstructorIds.size > 0) {
            const ids = Array.from(missingInstructorIds);
            // Simple batch fetch (chunking if needed, but assuming < 10 for now or using Promise.all)
            const promises = ids.map(id => getDoc(doc(db, 'users', id)));
            const snaps = await Promise.all(promises);
            snaps.forEach(snap => {
                if (snap.exists()) {
                    const d = snap.data();
                    fetchedInstructorNames[snap.id] = d.displayName || d.name || 'Unknown Instructor';
                }
            });
        }

        const ratingsRows = ratingsSnap.docs.map((d) => {
            const data = d.data();
            let instructorName = data.instructorName;
            
            if (!instructorName) {
                if (data.instructorId && STATIC_INSTRUCTOR_MAP.has(data.instructorId)) {
                    instructorName = STATIC_INSTRUCTOR_MAP.get(data.instructorId);
                } else if (data.instructorId && STATIC_INSTRUCTOR_MAP.has(data.instructorId.toLowerCase())) {
                    instructorName = STATIC_INSTRUCTOR_MAP.get(data.instructorId.toLowerCase());
                } else if (data.instructorId && fetchedInstructorNames[data.instructorId]) {
                    instructorName = fetchedInstructorNames[data.instructorId];
                } else {
                    instructorName = data.instructorId || 'Unknown Instructor';
                }
            }

            return { 
                id: d.id, 
                ...data,
                instructorName,
                comment: data.feedback || data.comment // Ensure feedback is mapped to comment
            };
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
          const key = r.instructorId || 'unknown';
          if (!key || key === 'unknown') return;
          
          const existing = instMap.get(key) || {
            instructorId: r.instructorId,
            instructorName: r.instructorName,
            deptName: r.deptName || null,
            count: 0,
            lastRating: r.rating || 0,
          };
          existing.count += 1;
          existing.lastRating = r.rating || existing.lastRating; 
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

        // 6. Fetch Top Instructors
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

        // 7. Fetch Popular Reviewers
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

        // 8. Enrich with Names
        const userIdsToFetch = new Set();
        topInstList.forEach(i => { if(i.instructorId) userIdsToFetch.add(i.instructorId); });
        popRevList.forEach(r => { if(r.studentId) userIdsToFetch.add(r.studentId); });

        if (userIdsToFetch.size > 0) {
            const ids = Array.from(userIdsToFetch);
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

            topInstList.forEach(i => {
                if (STATIC_INSTRUCTOR_MAP.has(i.instructorId)) {
                    i.instructorName = STATIC_INSTRUCTOR_MAP.get(i.instructorId);
                } else if (i.instructorId && STATIC_INSTRUCTOR_MAP.has(i.instructorId.toLowerCase())) {
                    i.instructorName = STATIC_INSTRUCTOR_MAP.get(i.instructorId.toLowerCase());
                }
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
  }, [user?.uid]);

  const updateProfile = async (formData, imageFile) => {
    if (!user?.uid) return;
    try {
      let profilePictureUrl = profile?.profilePictureUrl;

      if (imageFile) {
        const resultAction = await dispatch(uploadProfilePicture({ uid: user.uid, file: imageFile }));
        if (uploadProfilePicture.fulfilled.match(resultAction)) {
            profilePictureUrl = resultAction.payload;
        } else {
            throw new Error(resultAction.payload || 'Failed to upload image');
        }
      }

      const updates = {
        ...formData,
        profilePictureUrl,
      };

      const resultAction = await dispatch(updateUserProfile({ uid: user.uid, data: updates }));
      if (updateUserProfile.fulfilled.match(resultAction)) {
          setProfile(prev => ({ ...prev, ...updates }));
          return true;
      } else {
          throw new Error(resultAction.payload || 'Failed to update profile');
      }
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
