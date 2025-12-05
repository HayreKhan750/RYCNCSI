import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useStudentProfile } from '../hooks/useStudentProfile';
import Header from './common/Header';
import ProfileHeader from './student/ProfileHeader';
import ActivityDashboard from './student/ActivityDashboard';
import RatedInstructors from './student/RatedInstructors';
import TopInstructors from './student/TopInstructors';
import PopularReviewers from './student/PopularReviewers';
import EditProfileModal from './student/EditProfileModal';
import './Profile.css';

import { useParams } from 'react-router-dom';

export default function StudentProfile({ showHeader = true }) {
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDarkMode = mode === 'dark';
  const { id } = useParams();
  
  // Determine which user ID to fetch
  const targetUserId = id || user?.uid;
  const isOwnProfile = !id || id === user?.uid;

  const {
    profile,
    myRatings,
    stats,
    ratedInstructors,
    topInstructors,
    popularReviewers,
    userReactions,
    loading,
    error,
    updateProfile
  } = useStudentProfile(targetUserId ? { uid: targetUserId, email: null } : null); // Pass object mimicking user for hook compatibility

  const [activeTab, setActiveTab] = useState('activity');
  const [showEditModal, setShowEditModal] = useState(false);

  if (!user) return <div className="loading-screen">Please sign in to view profile.</div>;
  if (loading) return <div className="loading-screen">Loading profile...</div>;
  if (error) return <div className="error-screen">Error: {error}</div>;
  return (
    <div className={`student-profile-page ${!isDarkMode ? 'light-mode' : ''}`}>
      {showHeader && <Header user={user} isDark={isDarkMode} />}
      
      <ProfileHeader 
        profile={profile} 
        stats={stats} 
        onEdit={isOwnProfile ? () => setShowEditModal(true) : null}
        isOwnProfile={isOwnProfile}
      />

      {showEditModal && (
        <EditProfileModal 
           profile={profile} 
           onClose={() => setShowEditModal(false)} 
           onSave={updateProfile} 
        />
      )}

      <div className="profile-tabs modern-tabs">
        <button 
           className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
           onClick={() => setActiveTab('activity')}
        >
           Recent Activities
        </button>
        {isOwnProfile && (
          <>
            <button 
               className={`tab-btn ${activeTab === 'rated' ? 'active' : ''}`}
               onClick={() => setActiveTab('rated')}
            >
               Rated Instructors
            </button>
          </>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'activity' && (
           <ActivityDashboard 
              ratings={myRatings} 
              userReactions={userReactions} 
              user={user} 
              isOwnProfile={isOwnProfile}
           />
        )}
        
        {activeTab === 'rated' && (
           <RatedInstructors instructors={ratedInstructors} />
        )}
      </div>
    </div>
  );
}
