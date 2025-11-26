import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import Header from '../common/Header';
import ProfileHeader from './ProfileHeader';
import PerformanceMetrics from './PerformanceMetrics';
import VisualCharts from './VisualCharts';
import BadgesSection from './BadgesSection';
import FeedbackSection from './FeedbackSection';
import StudentAISummary from './StudentAISummary';
import EditProfileModal from './EditProfileModal';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './InstructorProfile.css';

export default function InstructorProfile({ user: propUser }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDarkMode = mode === 'dark';

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
      const resolveUser = async () => {
          setLoadingUser(true);
          // 1. If ID is present in URL, fetch that user
          if (id) {
              // We rely on useInstructorProfile to fetch data by ID
              // So we just set a minimal object to trigger the hook
              setCurrentUser({ uid: id });
          } 
          // 2. Fallback to propUser or authUser (e.g. "My Profile" route)
          else {
              setCurrentUser(propUser || authUser);
          }
          setLoadingUser(false);
      };

      resolveUser();
  }, [id, propUser, authUser]);
  
  const { 
    loading: loadingData, 
    profile, 
    stats, 
    feedbacks, 
    badges, 
    chartData, 
    updateProfile, 
    postReply,
    deleteReply,
    voteReply,
    toggleLike
  } = useInstructorProfile(id || currentUser?.uid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  if (loadingUser || loadingData) {
      return (
          <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`} style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div className="glass-card" style={{padding:40}}>Loading Profile...</div>
          </div>
      );
  }

  if (!profile) return <div style={{padding:40, textAlign:'center', color:'white'}}>Instructor not found.</div>;

  return (
    <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <Header user={authUser} isDark={isDarkMode} />

      <ProfileHeader 
          profile={profile} 
          onEdit={() => setIsEditOpen(true)} 
          isOwnProfile={authUser?.uid === profile.uid}
      />

      <PerformanceMetrics stats={stats} />

      <StudentAISummary stats={stats} feedbacks={feedbacks} />

      <div className="mid-section">
         <VisualCharts data={chartData} />
         <BadgesSection badges={badges} />
      </div>

      <FeedbackSection 
          feedbacks={feedbacks} 
          onReply={postReply} 
          onLike={toggleLike}
          onReplyDelete={deleteReply}
          onReplyVote={voteReply}
          canReply={!!authUser}
      />

      {isEditOpen && (
          <EditProfileModal 
              profile={profile} 
              onSave={updateProfile} 
              onClose={() => setIsEditOpen(false)} 
          />
      )}
    </div>
  );
}
