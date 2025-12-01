import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import RoleSwitcher from '../RoleSwitcher';
import InstructorTools from './InstructorTools';
import ProfileHeader from '../instructor-profile/ProfileHeader';
import PerformanceMetrics from '../instructor-profile/PerformanceMetrics';
import StudentAISummary from '../instructor-profile/StudentAISummary';
import VisualCharts from '../instructor-profile/VisualCharts';
import BadgesSection from '../instructor-profile/BadgesSection';
import FeedbackSection from '../instructor-profile/FeedbackSection';
import EditProfileModal from '../instructor-profile/EditProfileModal';
import '../instructor-profile/InstructorProfile.css'; // Reuse the profile styles
import './InstructorDashboard.css'; // Keep dashboard specific overrides if any

export default function InstructorDashboard({ user }) {
  // Use the same hook as the public profile
  const { 
    loading, 
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
  } = useInstructorProfile(user?.uid);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const navigate = useNavigate();
  
  const { mode } = useSelector((state) => state.theme);
  const isDarkMode = mode === 'dark';

  if (loading) {
      return (
        <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`} style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight: '50vh'}}>
            <div className="glass-card" style={{padding:40}}>Loading Instructor Dashboard...</div>
        </div>
      );
  }

  const handleToolAction = (action) => {
      switch(action) {
          case 'Respond to Reviews':
              document.getElementById('feedback-panel')?.scrollIntoView({ behavior: 'smooth' });
              break;
          case 'View My Public Profile':
              if (user?.uid) navigate(`/instructor/${user.uid}`);
              break;
          case 'Download Analytics Report':
              alert("Analytics Report download started...");
              break;
          case 'Manage My Courses':
              alert("Course Management feature coming soon!");
              break;
          default:
              break;
      }
  };

  return (
    <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`} style={{paddingTop: 0}}>
      
      {/* Dashboard Header with Tools */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
         <h2 style={{margin:0, color: isDarkMode ? '#a5f3fc' : '#0f172a'}}>
            Instructor Dashboard
         </h2>
         <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <RoleSwitcher />
         </div>
      </div>

      {/* Reusing Profile Header */}
      <ProfileHeader 
          profile={profile || { name: user.displayName, department: 'CS', bio: 'Welcome back!' }} 
          onEdit={() => setShowEditProfile(true)} 
          isOwnProfile={true}
      />

      {/* Stats */}
      <PerformanceMetrics stats={stats} />

      {/* AI Summary */}
      <StudentAISummary stats={stats} feedbacks={feedbacks} />

      {/* Charts & Badges */}
      <div className="mid-section">
         <VisualCharts data={chartData} />
         <BadgesSection badges={badges} />
      </div>

      {/* Feedback & Tools Split */}
      <div style={{display:'grid', gridTemplateColumns: '2fr 1fr', gap: 24}}>
          <div id="feedback-panel">
              <FeedbackSection 
                  feedbacks={feedbacks} 
                  onReply={postReply} 
                  onLike={toggleLike}
                  onReplyDelete={deleteReply}
                  onReplyVote={voteReply}
                  canReply={true}
              />
          </div>
          <div>
              <div style={{position: 'sticky', top: 20}}>
                <InstructorTools onAction={handleToolAction} />
              </div>
          </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
          <EditProfileModal 
              profile={profile} 
              onSave={updateProfile} 
              onClose={() => setShowEditProfile(false)} 
          />
      )}
    </div>
  );
}
