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
  startAfter
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { fetchUserFlags, fetchUserReactions } from '../utils/feedbackInteractions';

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
        const ratingsRows = ratingsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
          const existing = instMap.get(key) || {
            instructorId: r.instructorId,
            instructorName: r.instructorName || r.instructorId,
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
        // Note: Ideally this would be a dedicated 'stats' collection query or simpler
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
                    instructorName: data.instructorName,
                    deptName: data.deptName,
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
        setTopInstructors(topInstList);


        // 7. Fetch Popular Reviewers (Platform-wide)
        // Simplification: Get recent feedbacks and group by student
        const popularQ = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(100));
        const popularSnap = await getDocs(popularQ);
        const reviewerMap = new Map();
        popularSnap.docs.forEach(d => {
            const data = d.data();
            if(!data.studentId) return;
            if(!reviewerMap.has(data.studentId)) {
                reviewerMap.set(data.studentId, {
                    studentId: data.studentId,
                    name: 'Student', // Would need to fetch user doc for name if not stored in feedback
                    count: 0
                });
            }
            reviewerMap.get(data.studentId).count++;
        });
        // For demo, we might not fetch names to save reads, or assume anonymous if not stored
        setPopularReviewers(Array.from(reviewerMap.values()).sort((a,b) => b.count - a.count).slice(0,5));

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
