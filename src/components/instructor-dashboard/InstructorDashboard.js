import React, { useState } from 'react';
import { useInstructorData } from './useInstructorData';
import StatsCards from './StatsCards';
import ChartsSection from './ChartsSection';
import FeedbackPanel from './FeedbackPanel';
import RoleSwitcher from '../RoleSwitcher';
import InstructorTools from './InstructorTools';
import EditProfile from '../EditProfile';
import { useNavigate } from 'react-router-dom';
import './InstructorDashboard.css';

export default function InstructorDashboard({ user }) {
  const { loading, instructorProfile, ratings, stats, chartData, replyToFeedback } = useInstructorData(user);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const navigate = useNavigate();

  if (loading) {
      return <div className="loader-container"><div className="glass-panel" style={{padding:40}}>Loading Instructor Dashboard...</div></div>;
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
    <div className="instructor-dashboard fade-in">
      {/* Header */}
      <div className="glass-panel instructor-header">
        <div className="profile-ring">
            <img 
                src={instructorProfile.photoURL || `https://ui-avatars.com/api/?name=${instructorProfile.name}&background=random`} 
                alt="Profile" 
                className="profile-img"
            />
        </div>
        <div className="header-info">
            <h1>{instructorProfile.name}</h1>
            <p>{instructorProfile.department} Department</p>
            <p style={{fontSize:'0.9rem'}}>{instructorProfile.bio}</p>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <RoleSwitcher />
            <button className="edit-btn" onClick={() => setShowEditProfile(true)}>Edit Profile</button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <ChartsSection data={chartData} />

      {/* Feedback & Tools */}
      <div style={{display:'grid', gridTemplateColumns: '2fr 1fr', gap: 24}}>
          <div id="feedback-panel">
              <FeedbackPanel ratings={ratings} stats={stats} onReply={replyToFeedback} />
          </div>
          <div>
              <InstructorTools onAction={handleToolAction} />
          </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
          <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="close-modal-btn" onClick={() => setShowEditProfile(false)}>×</button>
                  <EditProfile />
              </div>
          </div>
      )}
    </div>
  );
}
