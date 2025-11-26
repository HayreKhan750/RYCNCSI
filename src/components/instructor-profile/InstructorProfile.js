import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import useInstructorProfile from '../../hooks/useInstructorProfile';
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
              try {
                  const userDoc = await getDoc(doc(db, 'users', id));
                  if (userDoc.exists()) {
                      setCurrentUser({ uid: id, ...userDoc.data() });
                  } else {
                      console.error("Instructor not found");
                      setCurrentUser(null);
                  }
              } catch (err) {
                  console.error("Error fetching instructor:", err);
              }
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
  } = useInstructorProfile(currentUser?.uid);

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
      {/* Theme Toggle (Floating) */}
      <button 
          onClick={() => dispatch(toggleTheme())}
          style={{
              position: 'absolute', top: 20, right: 20, 
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: 'inherit', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', zIndex: 10
          }}
      >
          {isDarkMode ? '☀ Light Mode' : '🌙 Dark Mode'}
      </button>

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
