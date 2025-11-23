import React from 'react';
import { useInstructorData } from './useInstructorData';
import StatsCards from './StatsCards';
import ChartsSection from './ChartsSection';
import FeedbackPanel from './FeedbackPanel';
import InstructorTools from './InstructorTools';
import './InstructorDashboard.css';

export default function InstructorDashboard({ user }) {
  const { loading, instructorProfile, ratings, stats, chartData, replyToFeedback } = useInstructorData(user);

  if (loading) {
      return <div className="loader-container"><div className="glass-panel" style={{padding:40}}>Loading Instructor Dashboard...</div></div>;
  }

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
        <button className="edit-btn">Edit Profile</button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <ChartsSection data={chartData} />

      {/* Feedback & Tools */}
      <div style={{display:'grid', gridTemplateColumns: '2fr 1fr', gap: 24}}>
          <div>
              <FeedbackPanel ratings={ratings} onReply={replyToFeedback} />
          </div>
          <div>
              <InstructorTools />
          </div>
      </div>
    </div>
  );
}
