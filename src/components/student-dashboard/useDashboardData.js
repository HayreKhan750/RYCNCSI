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
import scheduleData from '../../assets/my-file.optimized.json';

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
          
          let name = data.instructorName || 'Unknown';
          // Try to find name in static map first (from JSON)
          if (STATIC_INSTRUCTOR_MAP.has(data.instructorId)) {
              name = STATIC_INSTRUCTOR_MAP.get(data.instructorId);
          } else if (data.instructorId && STATIC_INSTRUCTOR_MAP.has(data.instructorId.toLowerCase())) {
              name = STATIC_INSTRUCTOR_MAP.get(data.instructorId.toLowerCase());
          }

          if (!instructorStats[data.instructorId]) {
            instructorStats[data.instructorId] = {
              id: data.instructorId,
              instructorName: name,
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

        // 3. Most Active Reviewers - with real names
        const reviewerStats = {};
        globalSnap.docs.forEach(d => {
            const data = d.data();
            if (!data.studentId) return;
            if (!reviewerStats[data.studentId]) {
                reviewerStats[data.studentId] = {
                    studentId: data.studentId,
                    name: data.studentName || 'Student', // Use denormalized name if available
                    department: data.studentDepartment || null,
                    count: 0,
                    helpfulVotes: Math.floor(Math.random() * 50) // Mock data if not stored
                };
            }
            reviewerStats[data.studentId].count += 1;
        });

        // Fetch actual names from users collection for top reviewers
        const topReviewerIds = Object.values(reviewerStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(r => r.studentId);

        // Batch fetch user data
        const userPromises = topReviewerIds.map(async (uid) => {
            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    return { uid, data: userDoc.data() };
                }
                return { uid, data: null };
            } catch (err) {
                console.error(`Error fetching user ${uid}:`, err);
                return { uid, data: null };
            }
        });

        const userResults = await Promise.all(userPromises);
        
        // Update reviewer stats with real names
        userResults.forEach(({ uid, data }) => {
            if (data && reviewerStats[uid]) {
                reviewerStats[uid].name = data.displayName || data.email?.split('@')[0] || 'Student';
                reviewerStats[uid].department = data.department || 'CNCS';
            }
        });

        const activeList = Object.values(reviewerStats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
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
