import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export function useInstructorProfileData(user) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    avgRating: 0,
    ratingCount: 0,
    reviewCount: 0,
    engagement: 0,
    topTags: []
  });
  const [feedbacks, setFeedbacks] = useState([]);
  const [badges, setBadges] = useState([]);
  const [chartData, setChartData] = useState({ trend: [], tags: [], distribution: [] });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Profile
        // User data is likely passed from context, but we ensure we have the latest fields
        // For now, we use the passed user object merged with initial state if needed
        setProfile({
            uid: user.uid,
            name: user.displayName || 'Instructor',
            email: user.email,
            photoURL: user.photoURL,
            dept: user.department || 'General',
            bio: user.bio || 'Welcome to my profile.',
            role: user.role || 'Instructor'
        });

        // 2. Ratings & Feedbacks
        // Fetch all feedbacks for this instructor
        const q = query(
            collection(db, 'feedbacks'), 
            where('instructorId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const loadedFeedbacks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFeedbacks(loadedFeedbacks);

        // 3. Stats Calculation
        let sumRating = 0;
        let countRating = 0;
        let countReview = 0;
        let engagementScore = 0;
        const tagCounts = {};
        const trendMap = {}; // month -> avg
        const courseMap = {};

        loadedFeedbacks.forEach(f => {
            const r = Number(f.rating) || 0;
            if (r > 0) {
                sumRating += r;
                countRating++;
            }
            if (f.feedback) countReview++;
            
            // Engagement
            engagementScore += (f.likesCount || 0) + (f.repliesCount || 0);

            // Tags
            if (Array.isArray(f.tags)) {
                f.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
            }

            // Trend (Mocking time based buckets for demo)
            // Real app would parse createdAt
            const date = f.createdAt ? new Date(f.createdAt.seconds * 1000) : new Date();
            const monthKey = `${date.getMonth()+1}/${date.getFullYear().toString().substr(2)}`;
            if (!trendMap[monthKey]) trendMap[monthKey] = { sum:0, count:0 };
            trendMap[monthKey].sum += r;
            trendMap[monthKey].count++;

            // Course Dist
            const c = f.courseTitle || 'Unknown';
            if(!courseMap[c]) courseMap[c] = 0;
            courseMap[c]++;
        });

        const avg = countRating ? (sumRating / countRating).toFixed(1) : 0;
        const sortedTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).map(e => e[0]);

        setStats({
            avgRating: avg,
            ratingCount: countRating,
            reviewCount: countReview,
            engagement: engagementScore,
            topTags: sortedTags.slice(0, 5)
        });

        // 4. Badges
        const newBadges = [];
        if (Number(avg) >= 4.7 && countRating > 5) newBadges.push({ icon: '⭐', label: 'Top Rated' });
        if (engagementScore > 50) newBadges.push({ icon: '🔥', label: 'Highly Engaging' }); // Lower threshold for demo
        if (countRating > 20) newBadges.push({ icon: '💎', label: 'Popular' });
        if (sortedTags[0]) newBadges.push({ icon: '🧠', label: `Expert in ${sortedTags[0]}` });
        setBadges(newBadges);

        // 5. Charts
        setChartData({
            trend: Object.keys(trendMap).map(k => ({ label: k, value: (trendMap[k].sum / trendMap[k].count).toFixed(1) })).reverse(),
            tags: Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0,5).map(e => ({ label: e[0], value: e[1] })),
            distribution: Object.entries(courseMap).map(e => ({ label: e[0], value: e[1] }))
        });

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const updateProfile = async (data, file) => {
    if (!user) return;
    try {
        let newPhotoURL = profile.photoURL;
        if (file) {
            const storageRef = ref(storage, `profile_pics/${user.uid}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            newPhotoURL = await getDownloadURL(storageRef);
        }

        const updates = {
            ...data,
            photoURL: newPhotoURL,
            updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'users', user.uid), updates);
        setProfile(prev => ({ ...prev, ...updates }));
        return true;
    } catch (e) {
        console.error(e);
        throw e;
    }
  };

  const postReply = async (feedbackId, text) => {
      try {
          // Adding to subcollection as requested: feedbacks/{id}/replies
          const replyRef = collection(db, 'feedbacks', feedbackId, 'replies');
          await addDoc(replyRef, {
              text,
              authorId: user.uid,
              authorName: user.displayName || 'Instructor',
              createdAt: serverTimestamp()
          });
          
          // Also update generic repliesCount on feedback doc for UI
          // Note: Real app should use increment() transaction
          // await updateDoc(doc(db, 'feedbacks', feedbackId), { repliesCount: increment(1) });
          
          return true;
      } catch (e) {
          console.error(e);
          return false;
      }
  };

  return { loading, profile, stats, feedbacks, badges, chartData, updateProfile, postReply };
}
