import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateUserProfile, uploadProfilePicture } from '../store/slices/userSlice';
import { studentService } from '../services/studentService';
import { instructorService } from '../services/instructorService';
import { feedbackService } from '../services/feedbackService';

export function useStudentProfile(user) {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [myRatings, setMyRatings] = useState([]);
  const [stats, setStats] = useState({ totalRatings: 0, totalComments: 0, avgGiven: 0 });
  const [ratedInstructors, setRatedInstructors] = useState([]);
  // Discovery Data
  const [topInstructors, setTopInstructors] = useState([]);
  const [popularReviewers, setPopularReviewers] = useState([]);
  // Interactions
  const [userReactions, setUserReactions] = useState({});
  const [userFlags, setUserFlags] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // SWR: If we already have a profile for this ID, don't flash spinner
      const isCached = profile && (profile.uid === user.uid || profile.id === user.uid || profile.studentId === user.uid);
      if (!isCached) setLoading(true);
      
      setError(null);
      try {
          // Parallel Fetching
          const [profileData, topInst, topRev] = await Promise.all([
              studentService.fetchStudentProfile(user.uid),
              instructorService.fetchTopInstructors(), // Assuming this exists or using fallback
              feedbackService.fetchTopReviewers(5)
          ]);

          setProfile(profileData.profile);
          setProfile(profileData.profile);
          
          // Enhanced: Fetch replies for myRatings
          const ratingsWithReplies = await Promise.all(
              (profileData.myRatings || []).map(async (r) => {
                  try {
                      const replies = await feedbackService.fetchReplies(r.id);
                      return { ...r, replies: replies || [] };
                  } catch (e) {
                      console.error("Failed to fetch replies for profile rating:", r.id);
                      return r;
                  }
              })
          );
          setMyRatings(ratingsWithReplies);
          setStats(profileData.stats);
          setRatedInstructors(profileData.ratedInstructors);
          setUserReactions(profileData.userReactions);
          setUserFlags(profileData.userFlags);
          
          setTopInstructors(topInst || []);
          setPopularReviewers(topRev || []);

      } catch (err) {
        console.error("Error fetching student profile data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.uid]);

  const updateProfile = async (formData, imageFile) => {
    if (!user?.uid) return;
    try {
      let profilePictureUrl = profile?.profilePictureUrl;

      // 1. Check for Cloudinary URL in formData
      if (formData.photoURL) {
          profilePictureUrl = formData.photoURL;
      }
      // 2. Fallback to legacy file upload
      else if (imageFile) {
        const resultAction = await dispatch(uploadProfilePicture({ uid: user.uid, file: imageFile }));
        if (uploadProfilePicture.fulfilled.match(resultAction)) {
            profilePictureUrl = resultAction.payload;
        } else {
            throw new Error(resultAction.payload || 'Failed to upload image');
        }
      }

      // Remove photoURL from formData to avoid duplication/confusion
      const { photoURL, ...otherData } = formData;

      const updates = {
        ...otherData,
        profilePictureUrl,
        photoURL: profilePictureUrl 
      };

      const resultAction = await dispatch(updateUserProfile({ uid: user.uid, data: updates }));
      if (updateUserProfile.fulfilled.match(resultAction)) {
          setProfile(prev => ({ ...prev, ...updates }));
          return true;
      } else {
          throw new Error(resultAction.payload || 'Failed to update profile');
      }
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
