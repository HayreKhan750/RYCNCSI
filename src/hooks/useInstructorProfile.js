import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorProfile, updateInstructorProfile } from '../store/slices/instructorSlice';
import { addReply, deleteReply, voteReply } from '../store/slices/feedbackSlice';
import { selectActiveProfile } from '../store/selectors/instructorSelectors';
// Service calls moved to Thunk

export default function useInstructorProfile(routeInstructorId) {
  const dispatch = useDispatch();
  const { data: profile, ratings: myRatings, replies: repliesByFeedback, loading, error } = useSelector(selectActiveProfile);
  const { user } = useSelector((state) => state.auth);

  const instructorKey = (routeInstructorId || (user?.email || '')).toLowerCase();

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const targetId = routeInstructorId || user?.uid;
    
    // Check if we already have this data to avoid "Loading..." flash
    const isCached = profile && (profile.id === targetId || profile.userId === targetId || profile.uid === targetId);

    if (targetId) {
        if (!isCached) setIsInitializing(true);
        
        dispatch(fetchInstructorProfile(targetId))
            .finally(() => setIsInitializing(false));
    } else {
        setIsInitializing(false);
    }
  }, [dispatch, routeInstructorId, user]); // Note: We rely on 'profile' from closure value at effect run time which is acceptable here

  // Calculate Stats
  const stats = useMemo(() => {
      // Base stats from Profile (Server-Side Source of Truth)
      let averageRating = profile?.avgRating !== undefined ? Number(profile.avgRating).toFixed(1) : 0;
      let totalRatings = profile?.totalRatings !== undefined ? Number(profile.totalRatings) : 0;

      // Derived stats from downloaded ratings (Client-Side / Recent Activity)
      const visibleRatings = myRatings || [];
      const reviewCount = visibleRatings.filter(r => r.feedback && r.feedback.trim().length > 0).length;
      const engagement = visibleRatings.reduce((acc, r) => acc + (r.likes || 0) + (r.replies?.length || 0), 0);
      
      const tagCounts = {};
      visibleRatings.forEach(f => {
          if (Array.isArray(f.tags)) {
              f.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
          }
      });
      const topTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).map(e => e[0]);

      // Fallback if profile stats are missing (e.g. legacy data) but we have ratings
      if ((!averageRating || averageRating === 0) && visibleRatings.length > 0) {
           averageRating = (visibleRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / visibleRatings.length).toFixed(1);
           totalRatings = visibleRatings.length;
      }

      return {
          averageRating,
          avgRating: averageRating,
          totalRatings,
          ratingCount: totalRatings, // Alias
          totalStudents: 0, 
          reviewCount, // This is technically "Visible Review Count", but acceptable for now
          engagement,
          topTags
      };
  }, [profile, myRatings]);

  // Calculate Courses
  const myCourses = useMemo(() => {
      // Use the courses already populated in the profile object from Firestore (via AdminImporter)
      if (profile && Array.isArray(profile.courses)) {
          return profile.courses;
      }
      return [];
  }, [profile]);

  // Calculate Badges & Chart Data
  const { badges, chartData } = useMemo(() => {
      if (!myRatings || myRatings.length === 0) {
          return { badges: [], chartData: { trend: [], tags: [], distribution: [] } };
      }

      // Stats for Badges
      const avg = stats.averageRating;
      const countRating = myRatings.length;
      const engagementScore = myRatings.reduce((acc, r) => acc + (r.likes || 0) + (r.replies?.length || 0), 0);
      
      const tagCounts = {};
      const trendMap = {}; 
      const courseMap = {};

      myRatings.forEach(f => {
          // Tags
          if (Array.isArray(f.tags)) {
              f.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
          }
          // Trend
          const date = f.timestamp ? new Date(f.timestamp) : new Date();
          const monthKey = `${date.getMonth()+1}/${date.getFullYear().toString().substr(2)}`;
          if (!trendMap[monthKey]) trendMap[monthKey] = { sum:0, count:0 };
          trendMap[monthKey].sum += (f.rating || 0);
          trendMap[monthKey].count++;

          // Course Dist
          const c = f.courseTitle || 'Unknown';
          if(!courseMap[c]) courseMap[c] = 0;
          courseMap[c]++;
      });

      const sortedTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).map(e => e[0]);

      // Badges
      const newBadges = [];
      if (Number(avg) >= 4.7 && countRating > 5) newBadges.push({ icon: '⭐', label: 'Top Rated' });
      if (engagementScore > 50) newBadges.push({ icon: '🔥', label: 'Highly Engaging' });
      if (countRating > 20) newBadges.push({ icon: '💎', label: 'Popular' });
      if (sortedTags[0]) newBadges.push({ icon: '🧠', label: `Expert in ${sortedTags[0]}` });

      // Charts
      const newChartData = {
          trend: Object.keys(trendMap).map(k => ({ label: k, value: (trendMap[k].sum / trendMap[k].count).toFixed(1) })).reverse(),
          tags: Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).slice(0,5).map(e => ({ label: e[0], value: e[1] })),
          distribution: Object.entries(courseMap).map(e => ({ label: e[0], value: e[1] }))
      };

      return { badges: newBadges, chartData: newChartData };
  }, [myRatings, stats]);

  const updateProfile = async (newProfileData, imageFile) => {
     if (!user?.uid) return;
     
     try {
        await dispatch(updateInstructorProfile({ 
            uid: user.uid, 
            data: newProfileData, 
            imageFile 
        })).unwrap();
        
        // Refresh to ensure everything is synced
        dispatch(fetchInstructorProfile(user.uid));
     } catch (e) {
         console.error("Failed to update profile", e);
         throw e;
     }
  };

  const postReply = async (feedbackId, replyData) => {
      try {
          await dispatch(addReply({ feedbackId, replyData })).unwrap();
          return true;
      } catch (e) {
          console.error("Failed to post reply:", e);
          return false;
      }
  };

  const toggleLike = async (feedbackId, userId, isLike) => {
      try {
          console.log("Like toggled:", feedbackId, isLike);
          // Implement like logic
      } catch (e) {
          console.error(e);
      }
  };

  const handleDeleteReply = async (feedbackId, replyId) => {
      try {
          await dispatch(deleteReply({ feedbackId, replyId })).unwrap();
          return true;
      } catch (e) {
          console.error("Failed to delete reply:", e);
          return false;
      }
  };

  const handleVoteReply = async (feedbackId, replyId, type) => {
      try {
          await dispatch(voteReply({ feedbackId, replyId, type })).unwrap();
          return true;
      } catch (e) {
          console.error("Failed to vote reply:", e);
          return false;
      }
  };

  // Stale-While-Revalidate Logic
  // If we already have the correct profile loaded, don't show a spinner (background refresh).
  // Only show spinner if we have NO profile, or the profile ID doesn't match the target.
  const targetId = routeInstructorId || user?.uid;
  const isProfileMatch = profile && (profile.id === targetId || profile.userId === targetId || profile.uid === targetId);
  const showLoading = (loading && !isProfileMatch) || (isInitializing && !isProfileMatch);

  return {
    instructorKey,
    myCourses,
    myRatings: myRatings || [],
    feedbacks: myRatings || [], // Alias for compatibility
    profile,
    loading: showLoading,
    error,
    stats: stats,
    badges,
    chartData,
    repliesByFeedback: repliesByFeedback || {},
    setRepliesByFeedback: () => {}, // No-op or dispatch action if needed
    updateProfile,
    postReply,
    deleteReply: handleDeleteReply,
    voteReply: handleVoteReply,
    toggleLike
  };
}
