import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useStudentProfile } from '../hooks/useStudentProfile';
import Header from './common/Header';
import ActivityDashboard from './student/ActivityDashboard';
import RatedInstructors from './student/RatedInstructors';
import EditProfileModal from './student/EditProfileModal';
import './Profile.css';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentProfile({ showHeader = true }) {
  const { id } = useParams(); // Get ID from URL if present
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDarkMode = mode === 'dark';
  const navigate = useNavigate();
  
  // Decide whose profile to show
  const targetUserId = id || user?.uid;
  const isOwnProfile = !id || (user?.uid === id);

  const {
    profile,
    myRatings,
    stats,
    ratedInstructors,
    userReactions,
    loading,
    error,
    updateProfile
  } = useStudentProfile(targetUserId ? { uid: targetUserId, email: null } : null);

  const [activeTab, setActiveTab] = useState('activity');
  const [showEditModal, setShowEditModal] = useState(false);

  if (loading) return <div className="loading-screen">Loading profile...</div>;
  if (!profile && !loading) return <div className="error-screen">Profile not found.</div>;
  
  // --- UNIFIED PREMIUM HERO COMPONENT ---
  const renderProfileHero = (isOwner) => (
      <div className="profile-hero glass-panel" style={{
          textAlign: 'center', padding: '50px 40px', marginBottom: '30px', margin: '20px auto', maxWidth: '900px',
          borderRadius: '32px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid var(--border-subtle)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
      }}>
          {/* Background Glow */}
          <div style={{
              position: 'absolute', top: '-50%', left: '50%', transform: 'translateX(-50%)',
              width: '60%', height: '100%', background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)',
              pointerEvents: 'none', zIndex: 0
          }} />

          <div style={{position: 'relative', zIndex: 1}}>
              {/* Action Button (Top Right) */}
              {isOwner ? (
                   <button 
                      onClick={() => setShowEditModal(true)}
                      style={{
                          position: 'absolute', top: -20, right: 0,
                          padding: '8px 20px', borderRadius: '20px',
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'var(--text-secondary)', cursor: 'pointer', backdropFilter: 'blur(5px)',
                          fontWeight: 500, fontSize: '0.85rem', transition: 'all 0.2s', display:'flex', alignItems:'center', gap: 6
                      }}
                      onMouseEnter={e => {e.currentTarget.style.background='rgba(255,255,255,0.1)'; e.currentTarget.style.color='white'}}
                      onMouseLeave={e => {e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='var(--text-secondary)'}}
                   >
                      <span>✎</span> Edit
                   </button>
              ) : (
                   <button 
                      onClick={() => navigate('/messages')} 
                      style={{
                          position: 'absolute', top: -20, right: 0,
                          padding: '10px 24px', borderRadius: '30px',
                          background: 'var(--primary-gradient)', border: 'none',
                          color: 'white', cursor: 'pointer',
                          fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', display:'flex', alignItems:'center', gap: 8,
                          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                   >
                      <span>💬</span> Message
                   </button>
              )}

              {/* Avatar with Ring */}
              <div className="avatar-large" style={{
                  width: 140, height: 140, borderRadius: '50%', margin: '0 auto 24px',
                  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3.5rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 0 0 8px rgba(255,255,255,0.02), 0 8px 30px rgba(0,0,0,0.2)', padding: 4
              }}>
                  <div style={{width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden', background:'var(--primary-gradient)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      {profile?.profilePictureUrl ? (
                          <img src={profile.profilePictureUrl} alt={profile.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                      ) : (
                          (profile?.name?.[0] || 'S').toUpperCase()
                      )}
                  </div>
              </div>
              
              {/* Name & Title */}
              <h1 style={{margin: '0 0 12px 0', fontSize: '3rem', fontWeight: 800, letterSpacing: '-1.5px', color: 'var(--text-primary)'}}>
                  {profile?.name || 'Student'}
              </h1>
              
              <div style={{display:'flex', justifyContent:'center', gap: 12, alignItems:'center', marginBottom: 36}}>
                   <span style={{
                       background: 'rgba(99, 102, 241, 0.15)', padding:'6px 16px', borderRadius: 30, 
                       fontSize: '0.85rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1
                   }}>
                       {profile?.role || 'Student'}
                   </span>
                   <span style={{fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500}}>
                      {profile?.department || 'General'}
                   </span>
              </div>
              
              {/* Stats Row */}
              <div style={{display:'flex', gap: 60, justifyContent: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 30, maxWidth: 600, margin: '0 auto'}}>
                  <div className="stat">
                      <strong style={{fontSize: '2rem', display: 'block', lineHeight: 1, marginBottom: 8, color: 'var(--text-primary)'}}>{myRatings?.length || stats?.totalRatings || 0}</strong>
                      <span style={{fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600}}>Reviews</span>
                  </div>
                  <div className="stat">
                      <strong style={{fontSize: '2rem', display: 'block', lineHeight: 1, marginBottom: 8, color: 'var(--text-primary)'}}>{profile?.helpfulCount || stats?.helpfulVotes || 0}</strong>
                      <span style={{fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600}}>Helpful</span>
                  </div>
                  {isOwner && (
                     <div className="stat">
                          <strong style={{fontSize: '2rem', display: 'block', lineHeight: 1, marginBottom: 8, color: '#818cf8'}}>{stats?.avgGiven || 0}</strong>
                          <span style={{fontSize: '0.75rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600}}>Avg Given</span>
                     </div>
                  )}
              </div>
              
              {profile?.bio && <p style={{opacity: 0.8, marginTop: 24, maxWidth: 600, margin: '30px auto 0', lineHeight: 1.6, fontSize: '1.05rem', color: 'var(--text-secondary)'}}>{profile.bio}</p>}
          </div>
      </div>
  );

  return (
    <div className={`student-profile-page ${!isDarkMode ? 'light-mode' : ''}`}>
      {showHeader && <Header user={user} isDark={isDarkMode} title={isOwnProfile ? "My Profile" : `${profile?.name}'s Profile`} showBack={!isOwnProfile} />}
      
      {/* Unified Hero Container */}
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 20px'}}>
          {renderProfileHero(isOwnProfile)}
      </div>

      {showEditModal && (
        <EditProfileModal 
           profile={profile} 
           onClose={() => setShowEditModal(false)} 
           onSave={updateProfile} 
        />
      )}

      {/* Tabs - Only show for Owner, otherwise just show Activity */}
      {isOwnProfile ? (
          <div className="profile-tabs modern-tabs" style={{justifyContent: 'center', marginTop: 20}}>
            <button 
               className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
               onClick={() => setActiveTab('activity')}
            >
               Recent Activities
            </button>
            <button 
               className={`tab-btn ${activeTab === 'rated' ? 'active' : ''}`}
               onClick={() => setActiveTab('rated')}
            >
               Rated Instructors
            </button>
          </div>
      ) : (
          <div style={{maxWidth: '900px', margin: '0 auto', marginTop: 40, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, marginBottom: 30}}>
               <h3 style={{fontSize: '1.2rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600}}>Recent Activity</h3>
          </div>
      )}

      {/* Content Area */}
      <div className="tab-content" style={{maxWidth: '900px', margin: '0 auto', paddingBottom: 60}}>
        {activeTab === 'activity' && (
           <>
               {isOwnProfile && (
                   <h3 style={{marginBottom: '24px', fontSize: '1.5rem', display:'flex', alignItems:'center', gap: 12}}>
                       <span style={{background:'var(--primary)', width:4, height: 24, borderRadius: 2}}></span>
                       Recent Activity
                   </h3>
               )}
               <ActivityDashboard 
                  ratings={myRatings} 
                  userReactions={userReactions} 
                  user={user} 
                  isOwnProfile={isOwnProfile}
               />
           </>
        )}
        
        {isOwnProfile && activeTab === 'rated' && (
           <>
               <h3 style={{marginBottom: '24px', fontSize: '1.5rem', display:'flex', alignItems:'center', gap: 12}}>
                   <span style={{background:'var(--primary)', width:4, height: 24, borderRadius: 2}}></span>
                   Rated Instructors
               </h3>
               <RatedInstructors instructors={ratedInstructors} />
           </>
        )}
      </div>
    </div>
  );
}
