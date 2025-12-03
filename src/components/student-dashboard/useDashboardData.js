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
              const userPromises = topReviewerIds.map(async (uid) => {
                  try {
                      // Check if we already have name? 
                      // Ideally we should cache users in Redux too (usersSlice), but for now fetch if missing
                      const userDoc = await getDoc(doc(db, 'users', uid));
                      if (userDoc.exists()) {
                          return { uid, data: userDoc.data() };
                      }
                      return { uid, data: null };
                  } catch (err) {
                      console.warn("Offline: Could not fetch reviewer details", err);
                      return { uid, data: null };
                  }
              });

              const userResults = await Promise.all(userPromises);
              
              userResults.forEach(({ uid, data }) => {
                  if (data && reviewerStats[uid]) {
                      reviewerStats[uid].name = data.displayName || data.email?.split('@')[0] || 'Student';
                      reviewerStats[uid].department = data.department || 'CNCS';
                      reviewerStats[uid].photoURL = data.photoURL || data.profilePictureUrl; // Fetch photoURL
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
      loading: (instructors.length === 0 && instructorsLoading) || (allFeedbacks.length === 0 && feedbacksLoading) 
  };
}
