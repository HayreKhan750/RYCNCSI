import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorProfile } from '../../store/slices/instructorSlice';
import { selectActiveProfile } from '../../store/selectors/instructorSelectors';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

export function useInstructorData(user) {
  const dispatch = useDispatch();
  const { data: profileData, loading } = useSelector(selectActiveProfile);
  
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    engagementScore: 0,
    topTags: []
  });
  
  const [chartData, setChartData] = useState({
    trend: [],
    tags: [],
    courses: []
  });

  useEffect(() => {
    if (user?.uid) {
      dispatch(fetchInstructorProfile(user.uid));
    }
  }, [user, dispatch]);

  useEffect(() => {
    if (!profileData || !profileData.ratings) return;

    const loadedRatings = profileData.ratings;

    // 3. Calculate Stats
    const total = loadedRatings.length;
    const sum = loadedRatings.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = total ? (sum / total).toFixed(1) : 0;

    // Engagement: simple sum of likes + replies count (if available)
    // Note: replies count might not be in rating object depending on service
    const engagement = loadedRatings.reduce((acc, r) => acc + (r.likes || 0) + (r.replies?.length || 0), 0);

    // Tag Frequency
    const tagCounts = {};
    loadedRatings.forEach(r => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
      }
    });
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);

    setStats({
      averageRating: avg,
      totalRatings: total,
      engagementScore: engagement,
      topTags: sortedTags
    });

    // 4. Process Chart Data
    
    // A. Trend (Ratings over time - simplified)
    const trendData = loadedRatings
        .slice(0, 10)
        .reverse()
        .map((r, i) => ({ label: i+1, value: r.rating }));
    
    // B. Tags Bar Chart
    const tagChartData = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, value]) => ({ label, value }));

    // C. Course Distribution
    const courseRatings = {};
    loadedRatings.forEach(r => {
        const c = r.courseId || r.courseTitle || 'Unknown';
        if(!courseRatings[c]) courseRatings[c] = { sum: 0, count: 0 };
        courseRatings[c].sum += (Number(r.rating) || 0);
        courseRatings[c].count++;
    });
    const courseChartData = Object.entries(courseRatings)
        .map(([label, data]) => ({ label, value: (data.sum / data.count).toFixed(1) }))
        .slice(0, 5);

    setChartData({
        trend: trendData.length ? trendData : [{label:'Start', value:5}],
        tags: tagChartData,
        courses: courseChartData
    });

  }, [profileData]);

  const replyToFeedback = async (feedbackId, text) => {
    if (!user) return;
    try {
       await addDoc(collection(db, 'replies'), {
           feedbackId,
           instructorId: user.uid,
           text,
           createdAt: serverTimestamp(),
           authorName: user.displayName
       });
       // Optimistic update or re-fetch could be done here
       // For now, we rely on the next fetch
       return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

  return { 
      loading, 
      instructorProfile: profileData?.profile || (user ? {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          department: user.department,
          bio: user.bio
      } : null), 
      ratings: profileData?.ratings || [], 
      stats, 
      chartData, 
      replyToFeedback 
  };
}
