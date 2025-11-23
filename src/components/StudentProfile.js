import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useStudentProfile } from '../hooks/useStudentProfile';
import ProfileHeader from './student/ProfileHeader';
import ActivityDashboard from './student/ActivityDashboard';
import RatedInstructors from './student/RatedInstructors';
import TopInstructors from './student/TopInstructors';
import PopularReviewers from './student/PopularReviewers';
import EditProfileModal from './student/EditProfileModal';
import './Profile.css';

export default function StudentProfile() {
  const { user } = useUser();
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
  } = useStudentProfile(user);

  const [activeTab, setActiveTab] = useState('activity');
  const [showEditModal, setShowEditModal] = useState(false);

  if (!user) return <div className="loading-screen">Please sign in to view profile.</div>;
  if (loading) return <div className="loading-screen">Loading profile...</div>;
  if (error) return <div className="error-screen">Error: {error}</div>;

  return (
    <div className="student-profile-container">
      <ProfileHeader 
        profile={profile} 
        stats={stats} 
        onEdit={() => setShowEditModal(true)} 
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
           My Activity
        </button>
        <button 
           className={`tab-btn ${activeTab === 'rated' ? 'active' : ''}`}
           onClick={() => setActiveTab('rated')}
        >
           Rated Instructors
        </button>
        <button 
           className={`tab-btn ${activeTab === 'discovery' ? 'active' : ''}`}
           onClick={() => setActiveTab('discovery')}
        >
           Discovery
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'activity' && (
           <ActivityDashboard 
              ratings={myRatings} 
              userReactions={userReactions} 
              user={user} 
           />
        )}
        
        {activeTab === 'rated' && (
           <RatedInstructors instructors={ratedInstructors} />
        )}

        {activeTab === 'discovery' && (
           <div className="discovery-grid">
              <div className="discovery-section">
                 <h3>Top Rated Instructors</h3>
                 <TopInstructors instructors={topInstructors} />
              </div>
              <div className="discovery-section">
                 <h3>Popular Reviewers</h3>
                 <PopularReviewers reviewers={popularReviewers} />
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
