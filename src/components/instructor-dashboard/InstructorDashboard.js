import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import RoleSwitcher from '../RoleSwitcher';
import InstructorTools from './InstructorTools';
import PerformanceMetrics from '../instructor-profile/PerformanceMetrics';
import StudentAISummary from '../instructor-profile/StudentAISummary';
import VisualCharts from '../instructor-profile/VisualCharts';
import FeedbackSection from '../instructor-profile/FeedbackSection';
import EditProfileModal from '../instructor-profile/EditProfileModal';
import PremiumModal from '../common/PremiumModal';
import '../instructor-profile/InstructorProfile.css';
import './InstructorDashboard.css';

export default function InstructorDashboard({ user }) {
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
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showCoursesModal, setShowCoursesModal] = useState(false);
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
          case 'View My Profile':
              if (user?.uid) navigate(`/instructor/${user.uid}`);
              break;
          case 'Private Messages':
              navigate('/messages');
              break;
          case 'Download Analytics Report':
              setShowAnalyticsModal(true);
              break;
          case 'Manage My Courses':
              setShowCoursesModal(true);
              break;
          default:
              break;
      }
  };

  return (
    <div className={`profile-page-container ${!isDarkMode ? 'light-mode' : ''}`} style={{paddingTop: 20}}>
      
      {/* Dashboard Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30}}>
         <div>
             <h1 style={{margin:0, fontSize:'2rem', background: 'linear-gradient(to right, var(--text-primary), var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Welcome back, {profile?.name?.split(' ')[0] || user.displayName?.split(' ')[0]}!
             </h1>
             <p style={{opacity:0.7, marginTop:5}}>Here's what's happening with your courses today.</p>
         </div>
         <div style={{display:'flex', gap:15, alignItems:'center'}}>
            <RoleSwitcher />
         </div>
      </div>

      {/* Quick Tools Section */}
      <InstructorTools onAction={handleToolAction} />

      {/* Main Dashboard Grid */}
      <div style={{display:'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: 30, alignItems: 'start'}}>
          
          {/* Left Column */}
          <div style={{display:'flex', flexDirection:'column', gap: 24}}>
              {/* Key Metrics */}
              <PerformanceMetrics stats={stats} />

              {/* Recent Feedback Widget */}
              <div id="feedback-panel" className="glass-panel">
                  <h3 style={{marginTop:0, marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      Recent Feedback
                      <span style={{fontSize:'0.8rem', opacity:0.7, fontWeight:'normal'}}>Latest 5 reviews</span>
                  </h3>
                  <FeedbackSection 
                      feedbacks={feedbacks.slice(0, 5)} 
                      onReply={postReply} 
                      onLike={toggleLike}
                      onReplyDelete={deleteReply}
                      onReplyVote={voteReply}
                      canReply={true}
                      compact={true} // Hint for compact rendering if supported
                  />
                  {feedbacks.length > 5 && (
                      <button className="btn-text" style={{marginTop:15, width:'100%'}} onClick={() => navigate(`/instructor/${user.uid}`)}>
                          View All Reviews →
                      </button>
                  )}
              </div>
          </div>

          {/* Right Column */}
          <div style={{display:'flex', flexDirection:'column', gap: 24, minWidth: 0}}>
              {/* AI Summary */}
              <StudentAISummary stats={stats} feedbacks={feedbacks} />

              {/* Analytics Preview */}
              <div className="glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
                  <h3 style={{marginTop:0, marginBottom:15}}>Analytics Preview</h3>
                  <div style={{height: 250, width: '100%', position: 'relative'}}>
                      <VisualCharts data={chartData} compact={true} />
                  </div>
                  <button className="btn-premium-glass" style={{width:'100%', marginTop:15}} onClick={() => handleToolAction('Download Analytics Report')}>
                      Full Report
                  </button>
              </div>

              {/* Course Overview (Placeholder for now) */}
              <div className="glass-panel">
                  <h3 style={{marginTop:0, marginBottom:15}}>My Courses</h3>
                  <div style={{opacity:0.7, textAlign:'center', padding:20, background:'rgba(0,0,0,0.1)', borderRadius:12}}>
                      <div style={{fontSize:'2rem', marginBottom:10}}>📚</div>
                      <div>Course management coming soon</div>
                  </div>
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

      {/* Analytics Modal */}
      <PremiumModal
          isOpen={showAnalyticsModal}
          onClose={() => setShowAnalyticsModal(false)}
          title="Analytics Report"
          message="Your comprehensive performance report is ready for download."
          confirmText="Download PDF"
          onConfirm={() => {
              // Mock download
              const link = document.createElement('a');
              link.href = '#';
              link.download = 'analytics_report.pdf';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setShowAnalyticsModal(false);
          }}
          type="confirm"
      />

      {/* Course Management Modal */}
      <PremiumModal
          isOpen={showCoursesModal}
          onClose={() => setShowCoursesModal(false)}
          title="Manage My Courses"
          confirmText="Done"
          onConfirm={() => setShowCoursesModal(false)}
          type="confirm"
          cancelText="Close"
      >
          <div style={{textAlign: 'left', maxHeight: '300px', overflowY: 'auto', marginBottom: 20}}>
              {profile?.courses && profile.courses.length > 0 ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                      {profile.courses.map((course, i) => (
                          <div key={i} style={{
                              padding: 15, 
                              background: 'var(--bg-root)', 
                              borderRadius: 12,
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                          }}>
                              <div>
                                  <div style={{fontWeight: 600, color: 'var(--text-primary)'}}>{course}</div>
                                  <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>Active • 0 Students</div>
                              </div>
                              <button style={{
                                  padding: '6px 12px', 
                                  fontSize: '0.8rem', 
                                  background: 'var(--primary-soft)', 
                                  color: 'white', 
                                  border: 'none', 
                                  borderRadius: 6,
                                  cursor: 'pointer'
                              }}>Edit</button>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div style={{textAlign: 'center', padding: 20, color: 'var(--text-secondary)'}}>
                      No courses assigned yet.
                  </div>
              )}
          </div>
      </PremiumModal>
    </div>
  );
}
