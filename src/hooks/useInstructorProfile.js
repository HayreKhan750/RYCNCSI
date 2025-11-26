import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructorProfile } from '../store/slices/instructorSlice';
import { fetchInstructorProfile } from '../store/slices/instructorSlice';
import { addReply, deleteReply, voteReply } from '../store/slices/feedbackSlice';
import { selectActiveProfile } from '../store/selectors/instructorSelectors';
import { db, storage } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import scheduleData from '../assets/my-file.optimized.json';

export default function useInstructorProfile(routeInstructorId) {
  const dispatch = useDispatch();
  const { data: profile, ratings: myRatings, replies: repliesByFeedback, loading } = useSelector(selectActiveProfile);
  const { user } = useSelector((state) => state.auth);

  const instructorKey = (routeInstructorId || (user?.email || '')).toLowerCase();


  useEffect(() => {
    const targetId = routeInstructorId || user?.uid;
    if (targetId) {
        dispatch(fetchInstructorProfile(targetId));
    }
  }, [dispatch, routeInstructorId, user]);

  // Calculate Stats
  const stats = useMemo(() => {
      if (!myRatings || myRatings.length === 0) {
          return { 
              averageRating: 0, 
              avgRating: 0,
              totalRatings: 0, 
              ratingCount: 0,
              totalStudents: 0,
              reviewCount: 0,
              engagement: 0,
              topTags: []
          };
      }
      const avg = (myRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / myRatings.length).toFixed(1);
      const reviewCount = myRatings.filter(r => r.feedback && r.feedback.trim().length > 0).length;
      const engagement = myRatings.reduce((acc, r) => acc + (r.likes || 0) + (r.replies?.length || 0), 0);
      
      const tagCounts = {};
      myRatings.forEach(f => {
          if (Array.isArray(f.tags)) {
              f.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
          }
      });
      const topTags = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]).map(e => e[0]);

      return {
          averageRating: avg,
          avgRating: avg,
          totalRatings: myRatings.length,
          ratingCount: myRatings.length,
          totalStudents: 0, // Will calculate with courses
          reviewCount,
          engagement,
          topTags
      };
  }, [myRatings]);

  // Calculate Courses
  const myCourses = useMemo(() => {
      if (!profile) return [];
      
      const courses = [];
      const schedule = Array.isArray(scheduleData?.schedule) ? scheduleData.schedule : [];
      const emailForMatching = profile.email;

      schedule.forEach((dept) => {
        const deptName = dept.department;
        const deptCourses = Array.isArray(dept.courses) ? dept.courses : [];

        deptCourses.forEach((course) => {
          let instructorsArr;
          if (Array.isArray(course.instructor)) {
            instructorsArr = course.instructor;
          } else if (course.instructor) {
            instructorsArr = [{ name: course.instructor, email: null }];
          } else {
            instructorsArr = [];
          }

          const teachesHere = instructorsArr.some((inst) => {
            if (emailForMatching && inst.email) {
                return inst.email.toLowerCase() === emailForMatching.toLowerCase();
            }
            return (inst.name || '').toLowerCase() === (profile.instructorName || profile.name || '').toLowerCase();
          });

          if (teachesHere) {
            courses.push({
              id: `${deptName || 'dept'}-${course.course_code || course.course_title}`,
              department: deptName,
              courseTitle: course.course_title,
              courseCode: course.course_code,
              lectureHours: course.lecture_hours,
              period: course.period,
              room: course.room,
              studentCount: course.student_count,
              instructors: instructorsArr,
            });
          }
        });
      });
      return courses;
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
     if (!user?.uid || !db) return;
     
     let profilePictureUrl = profile?.profilePictureUrl || '';

      if (imageFile && storage) {
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      const payload = {
        ...newProfileData,
        profilePictureUrl,
        updatedAt: serverTimestamp(),
        email: user.email,
        role: profile?.role || 'instructor',
      };

      await setDoc(userRef, payload, { merge: true });
      // Dispatch update to Redux if needed, or rely on fetch
      dispatch(fetchInstructorProfile(user.uid));
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

  return {
    instructorKey,
    myCourses,
    myRatings: myRatings || [],
    feedbacks: myRatings || [], // Alias for compatibility
    profile,
    loading,
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
