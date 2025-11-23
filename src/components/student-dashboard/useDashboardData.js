import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  getDoc
} from 'firebase/firestore';

export function useDashboardData(user) {
  const [stats, setStats] = useState({
    coursesTaken: 0,
    instructorsRated: 0,
    reviewsSubmitted: 0,
    engagementScore: 0
  });
  const [topInstructors, setTopInstructors] = useState([]);
  const [activeReviewers, setActiveReviewers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. User Stats
        const feedbackQ = query(
          collection(db, 'feedbacks'), 
          where('studentId', '==', user.uid)
        );
        const feedbackSnap = await getDocs(feedbackQ);
        const feedbacks = feedbackSnap.docs.map(d => d.data());

        const uniqueCourses = new Set(feedbacks.map(f => f.courseId || f.courseTitle));
        const uniqueInstructors = new Set(feedbacks.map(f => f.instructorId));
        
        // Calculate a mock engagement score based on reviews + reactions (reactions fetching omitted for speed if not stored on user)
        const engagementScore = (feedbacks.length * 10) + (uniqueInstructors.size * 5);

        setStats({
          coursesTaken: uniqueCourses.size,
          instructorsRated: uniqueInstructors.size,
          reviewsSubmitted: feedbacks.length,
          engagementScore
        });

        // 2. Top Rated Instructors (Aggregation usually done server-side or read from stats collection, doing client-side for demo)
        // Fetching a sample of recent feedbacks to determine top
        const globalFeedbacksQ = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'), limit(50));
        const globalSnap = await getDocs(globalFeedbacksQ);
        const instructorStats = {};
        
        globalSnap.docs.forEach(d => {
          const data = d.data();
          if (!data.instructorId) return;
          if (!instructorStats[data.instructorId]) {
            instructorStats[data.instructorId] = {
              id: data.instructorId,
              name: data.instructorName || 'Unknown',
              photo: data.instructorPhoto || null,
              totalRating: 0,
              count: 0,
              engagement: 'Normal'
            };
          }
          instructorStats[data.instructorId].totalRating += (data.rating || 0);
          instructorStats[data.instructorId].count += 1;
        });

        const topList = Object.values(instructorStats)
          .map(i => ({
            ...i,
            avgRating: (i.totalRating / i.count).toFixed(1)
          }))
          .sort((a, b) => b.avgRating - a.avgRating)
          .slice(0, 3);
        
        setTopInstructors(topList);

        // 3. Most Active Reviewers
        const reviewerStats = {};
        globalSnap.docs.forEach(d => {
            const data = d.data();
            if (!data.studentId) return;
            if (!reviewerStats[data.studentId]) {
                reviewerStats[data.studentId] = {
                    id: data.studentId,
                    name: 'Student', // Name would need user fetch
                    count: 0,
                    helpfulVotes: Math.floor(Math.random() * 50) // Mock data if not stored
                };
            }
            reviewerStats[data.studentId].count += 1;
        });

        const activeList = Object.values(reviewerStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        setActiveReviewers(activeList);

        // 4. Recent Activity (User's own)
        const recentQ = query(
            collection(db, 'feedbacks'),
            where('studentId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const recentSnap = await getDocs(recentQ);
        setRecentActivity(recentSnap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            type: 'rating' // Distinguish if we had mixed types
        })));

      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  return { stats, topInstructors, activeReviewers, recentActivity, loading };
}
