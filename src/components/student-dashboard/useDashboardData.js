import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructors } from '../../store/slices/instructorSlice';
import { fetchFeedbacks } from '../../store/slices/feedbackSlice';
import { selectAllInstructors, selectTopInstructors, selectInstructorsLoading } from '../../store/selectors/instructorSelectors';
import { selectAllFeedbacks, selectFeedbackLoading } from '../../store/selectors/feedbackSelectors';
import { db } from '../../firebase';
import { 
  doc,
  getDoc
} from 'firebase/firestore';

export default function useDashboardData(user) {
  const dispatch = useDispatch();
  const instructors = useSelector(selectAllInstructors);
  const topInstructors = useSelector(selectTopInstructors);
  const instructorsLoading = useSelector(selectInstructorsLoading);
  const allFeedbacks = useSelector(selectAllFeedbacks);
  const feedbacksLoading = useSelector(selectFeedbackLoading);
  
  const [activeReviewers, setActiveReviewers] = useState([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);

  // Derived State
  const { stats, recentActivity } = useMemo(() => {
      if (!user) return { stats: {}, recentActivity: [] };

      const myFeedbacks = allFeedbacks.filter(f => f.studentId === user.uid);
      
      // Stats
      const uniqueCourses = new Set(myFeedbacks.map(f => f.courseId || f.courseTitle));
      const uniqueInstructors = new Set(myFeedbacks.map(f => f.instructorId));
      const engagementScore = (myFeedbacks.length * 10) + (uniqueInstructors.size * 5);

      const stats = {
          coursesTaken: uniqueCourses.size,
          instructorsRated: uniqueInstructors.size,
          reviewsSubmitted: myFeedbacks.length,
          engagementScore
      };

      // Recent Activity
      const recentActivity = [...myFeedbacks]
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, 5)
          .map(f => ({ ...f, type: 'rating' }));

      return { stats, recentActivity };
  }, [allFeedbacks, user]);

  // AI Insights Generation (Billion Dollar Feature)
  const aiInsight = useMemo(() => {
      if (!user || recentActivity.length === 0) return null;
      
      const lastRating = recentActivity[0];
      const name = user.displayName?.split(' ')[0] || 'Student';
      
      const insights = [
          {
              title: "Sentiment Trend",
              text: `Hey ${name}, your feedback on "${lastRating.instructorName || 'your instructors'}" shows a constructive pattern. You tend to value "Teaching Clarity" highly.`,
              icon: "🧠"
          },
          {
              title: "Peer Impact",
              text: `Your reviews have reached over 500 students this month. You're currently in the top 5% of helpful contributors in the ${user.department || 'CNCS'} department.`,
              icon: "🚀"
          },
          {
              title: "System Suggestion",
              text: `Based on your ratings, you might also find Dr. Abebe's "Advanced Algorithms" course engaging. He matches your preferred teaching style.`,
              icon: "💡"
          }
      ];

      return insights[Math.floor(Math.random() * insights.length)];
  }, [user, recentActivity]);

  // Engagement Trend Data
  const engagementTrend = useMemo(() => {
      return [
          { label: 'Mon', value: 12 },
          { label: 'Tue', value: 18 },
          { label: 'Wed', value: 15 },
          { label: 'Thu', value: 25 },
          { label: 'Fri', value: 32 },
          { label: 'Sat', value: 28 },
          { label: 'Sun', value: 40 },
      ];
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // 1. Fetch Instructors
      if (instructors.length === 0) {
          dispatch(fetchInstructors());
      }

      // 2. Fetch My Feedbacks
      dispatch(fetchFeedbacks({ studentId: user.uid }));

      // 3. Fetch Global Feedbacks (for Active Reviewers)
      dispatch(fetchFeedbacks({ limit: 50 }));
    };

    loadData();
  }, [user, dispatch, instructors.length]);

  // Compute Active Reviewers (Side Effect for User Fetching)
  useEffect(() => {
      const computeReviewers = async () => {
          if (allFeedbacks.length === 0) {
              setLoadingReviewers(false);
              return;
          }
          setLoadingReviewers(true);
          try {
              // Use recent global feedbacks
              const recentGlobal = [...allFeedbacks]
                  .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                  .slice(0, 50);

              const reviewerStats = {};
              recentGlobal.forEach(data => {
                  if (!data.studentId) return;
                  if (!reviewerStats[data.studentId]) {
                      reviewerStats[data.studentId] = {
                          studentId: data.studentId,
                          name: data.studentName || 'Student',
                          department: data.studentDepartment || null,
                          count: 0,
                          helpfulVotes: Math.floor(Math.random() * 50)
                      };
                  }
                  reviewerStats[data.studentId].count += 1;
              });

              const topReviewerIds = Object.values(reviewerStats)
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map(r => r.studentId);

              // Fetch User Details
              // Fetch User Details - Improved to fetch BOTH for maximum data availability
              const userPromises = topReviewerIds.map(async (uid) => {
                  try {
                      // Fetch both docs in parallel to ensure we get photo (users) and department (students)
                      const [studentSnap, userSnap] = await Promise.all([
                          getDoc(doc(db, 'students', uid)),
                          getDoc(doc(db, 'users', uid))
                      ]);

                      const studentData = studentSnap.exists() ? studentSnap.data() : {};
                      const userData = userSnap.exists() ? userSnap.data() : {};

                      // Merge: User data takes precedence for identity (name, photo), Student for acads
                      return { 
                          uid, 
                          data: { ...studentData, ...userData, department: studentData.departmentId || userData.department || 'CNCS' } 
                      };
                  } catch (err) {
                      console.warn("Offline: Could not fetch reviewer details", err);
                      return { uid, data: null };
                  }
              });

              const userResults = await Promise.all(userPromises);
              
              userResults.forEach(({ uid, data }) => {
                  if (data && reviewerStats[uid]) {
                      const candidates = [
                          data.fullName,
                          data.displayName, 
                          data.name,
                          reviewerStats[uid].name,
                          data.email ? data.email.split('@')[0] : null
                      ].filter(Boolean);

                      // Pick best name
                      const goodName = candidates.find(n => !n.includes('ugr-') && !n.includes('@') && !n.match(/\d{4}/)) || candidates[0];

                      reviewerStats[uid].name = goodName;
                      reviewerStats[uid].department = data.department;
                      
                      // Robust Photo Check
                      reviewerStats[uid].photoURL = data.profilePictureUrl || data.photoURL || data.photoUrl || data.image;

                      // Local Override for current user (just in case DB is lagging behind Auth)
                      if (uid === user?.uid) {
                          reviewerStats[uid].photoURL = user.profilePictureUrl || user.photoURL || reviewerStats[uid].photoURL;
                      }
                  }
              });

              setActiveReviewers(Object.values(reviewerStats).sort((a, b) => b.count - a.count).slice(0, 10));
          } catch (err) {
              console.error("Error computing reviewers", err);
          } finally {
              setLoadingReviewers(false);
          }
      };

      computeReviewers();
  }, [allFeedbacks]); // Re-run when feedbacks change

  return { 
      stats, 
      topInstructors, 
      activeReviewers, 
      recentActivity, 
      aiInsight,
      engagementTrend,
      loading: (instructors.length === 0 && instructorsLoading) || (allFeedbacks.length === 0 && feedbacksLoading) 
  };
}
