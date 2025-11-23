import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

export function useInstructorData(user) {
  const [loading, setLoading] = useState(true);
  const [instructorProfile, setInstructorProfile] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalRatings: 0,
    engagementScore: 0,
    topTags: []
  });
  const [chartData, setChartData] = useState({
    trend: [], // { label: 'Jan', value: 4.5 }
    tags: [],  // { label: 'Helpful', value: 12 }
    courses: [] // { label: 'CS101', value: 4.8 }
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Profile Data (Merge Auth + Firestore)
        // Assuming 'user' prop already contains basic auth info
        setInstructorProfile({
          uid: user.uid,
          name: user.displayName || 'Instructor',
          email: user.email,
          photoURL: user.photoURL,
          department: user.department || 'General',
          bio: user.bio || 'Dedicated educator committed to student success.'
        });

        // 2. Ratings Fetch
        // In a real app, filtering by instructorId is crucial.
        // Assuming 'feedbacks' collection has instructorId field matching user.uid
        // OR user.email. For now, querying by instructorId (uid).
        
        // NOTE: If no ratings found with UID, might try email or name for demo continuity
        let q = query(
          collection(db, 'feedbacks'), 
          where('instructorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        let snap = await getDocs(q);
        
        // Fallback for demo: if empty, maybe try name match (unreliable but good for demo if data mixed)
        if (snap.empty && user.displayName) {
             q = query(collection(db, 'feedbacks'), where('instructorName', '==', user.displayName), orderBy('createdAt', 'desc'));
             snap = await getDocs(q);
        }

        const loadedRatings = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRatings(loadedRatings);

        // 3. Calculate Stats
        const total = loadedRatings.length;
        const sum = loadedRatings.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        const avg = total ? (sum / total).toFixed(1) : 0;

        // Engagement: simple sum of likes + replies count
        const engagement = loadedRatings.reduce((acc, r) => acc + (r.likesCount || 0) + (r.repliesCount || 0), 0);

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
        
        // A. Trend (Ratings over time - simplified to last 6 groups)
        // For demo, just grouping by arbitrary chunks or individual ratings if few
        const trendData = loadedRatings
            .slice(0, 10)
            .reverse()
            .map((r, i) => ({ label: i+1, value: r.rating }));
        
        // B. Tags Bar Chart
        const tagChartData = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([label, value]) => ({ label, value }));

        // C. Course Distribution (Pie/Radar equiv)
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

      } catch (err) {
        console.error("Error fetching instructor data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const replyToFeedback = async (feedbackId, text) => {
    if (!user) return;
    try {
       // Subcollection or root collection 'replies'? 
       // Using a root collection for simplicity or updating the feedback doc array
       // Let's update feedback doc array "replies" for easy fetching
       // Warning: arrayUnion can be tricky with objects. 
       // For robust app: add to 'replies' collection.
       // For this demo: assume we just log it or add a sub-doc.
       // Let's simply add to a 'replies' collection linked by feedbackId
       await addDoc(collection(db, 'replies'), {
           feedbackId,
           instructorId: user.uid,
           text,
           createdAt: serverTimestamp(),
           authorName: user.displayName
       });
       return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  };

  return { loading, instructorProfile, ratings, stats, chartData, replyToFeedback };
}
