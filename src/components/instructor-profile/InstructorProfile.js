import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext'; // Fallback context
import { useInstructorProfileData } from './useInstructorProfileData';
import ProfileHeader from './ProfileHeader';
import PerformanceMetrics from './PerformanceMetrics';
import VisualCharts from './VisualCharts';
import BadgesSection from './BadgesSection';
import FeedbackSection from './FeedbackSection';
import EditProfileModal from './EditProfileModal';
import './InstructorProfile.css';

export default function InstructorProfile({ user: propUser }) {
  const { user: contextUser } = useUser();
  const currentUser = propUser || contextUser;
  
  const { 
    loading, 
    profile, 
    stats, 
    feedbacks, 
    badges, 
    chartData, 
    updateProfile, 
    postReply 
  } = useInstructorProfileData(currentUser);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Local toggle if standalone

  // Load theme pref
  useEffect(() => {
      const saved = localStorage.getItem('theme');
      if(saved) setIsDarkMode(saved === 'dark');
  }, []);

  const toggleTheme = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  if (loading) {
      return (
          <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`} style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div className="glass-card" style={{padding:40}}>Loading Profile...</div>
          </div>
      );
  }

  if (!profile) return null;

  return (
    <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`}>
      {/* Theme Toggle (Floating) */}
      <button 
          onClick={toggleTheme}
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
      />

      <PerformanceMetrics stats={stats} />

      <div className="mid-section">
         <VisualCharts data={chartData} />
         <BadgesSection badges={badges} />
      </div>

      <FeedbackSection 
          feedbacks={feedbacks} 
          onReply={postReply} 
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
