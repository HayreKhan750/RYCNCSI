import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import Header from '../common/Header'; // Global Nav
import EditProfileModal from './EditProfileModal';
import { instructorService } from '../../services/instructorService';
import ReviewList from '../common/ReviewList';

export default function InstructorProfile({ user: propUser }) {
  const { id } = useParams();
  const { user: authUser } = useSelector((state) => state.auth);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
      const resolveUser = async () => {
          setLoadingUser(true);
          if (id) setCurrentUser({ uid: id });
          else setCurrentUser(propUser || authUser);
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
    postReply 
  } = useInstructorProfile(id || currentUser?.uid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  // Robust ownership check: Matches ID (if user doc) OR userId (if instructor doc)
  // Robust ownership check: Matches ID (if user doc) OR userId (if instructor doc)
  const isOwnProfile = authUser?.uid && (
      (id && id === authUser.uid) || 
      (!id) || // If no ID param, it defaults to current user
      authUser.uid === profile?.id || 
      authUser.uid === profile?.userId
  );

  if (loadingUser || loadingData) {
      return (
          <div className="profile-page-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
              <div className="premium-card">Loading Profile...</div>
          </div>
      );
  }

  if (!profile) {
      if (isOwnProfile) {
          return (
            <div className="profile-page-container" style={{padding:40, textAlign:'center'}}>
                <div className="premium-card">
                    <h2>Public Profile Missing</h2>
                    <p style={{marginBottom:20, color:'#b0b0b0'}}>
                        It looks like your public instructor profile hasn't been created yet (likely due to a registration issue). 
                    </p>
                    <button 
                        className="btn-premium"
                        onClick={async () => {
                            try {
                            // Service imported at top
                            setLoadingUser(true);
                            await instructorService.createInstructorProfile(authUser.uid, authUser);
                                window.location.reload();
                            } catch (e) {
                                alert("Failed to create profile: " + e.message);
                                setLoadingUser(false);
                            }
                        }}
                    >
                        Initialize Public Profile
                    </button>
                </div>
            </div>
          );
      }
      return <div className="profile-page-container" style={{padding:40, textAlign:'center'}}>Instructor not found.</div>;
  }

  return (
    <div className="profile-page-container">
      <Header title="Back to Dashboard" />

      {/* --- Banner & Header Overlay --- */}
      <div className="profile-banner-container">
          <div className="profile-banner-bg"></div>
          <div className="profile-banner-pattern"></div>
          
          <div className="profile-header-overlay">
              <div className="profile-avatar-wrapper">
                  <img 
                      src={profile.photoURL || profile.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.instructorName || profile.fullName || profile.displayName || 'Instructor')}&background=random`} 
                      alt={profile.instructorName} 
                      className="profile-avatar" 
                  />
              </div>
              <div className="profile-header-info">
                  <h1 className="profile-name">{profile.instructorName || profile.fullName || profile.displayName || profile.name || "Instructor"}</h1>
                  <span className="profile-role-badge">{profile.department || "General Sciences"}</span>
              </div>
              
              {isOwnProfile && (
                  <div className="header-actions">
                      <button className="btn-premium" onClick={() => setIsEditOpen(true)}>
                          Edit Profile
                      </button>
                  </div>
              )}
          </div>
      </div>

      {/* --- Main Grid Layout --- */}
      <div className="profile-content-grid">
          
          {/* LEFT COLUMN: Activity & Bio */}
          <div className="profile-left-col">
              
              {/* Bio Card */}
              <div className="premium-card">
                  <h3>About Instructor</h3>
                  <p style={{lineHeight: 1.6, color: '#ecf0f1'}}>
                      {profile.bio || "No biography provided yet. This instructor is part of the extensive academic faculty."}
                  </p>
                  
                  <div style={{marginTop: 20, display:'flex', gap:10, flexWrap:'wrap'}}>
                      {badges.map((b, i) => (
                          <span key={i} style={{background:'rgba(255,255,255,0.1)', padding:'6px 12px', borderRadius:20, fontSize:'0.85rem'}}>
                              {b.icon} {b.label}
                          </span>
                      ))}
                  </div>
              </div>

              {/* Feedbacks Stream */}
              <div className="premium-card">
                  <h3>Recent Feedback</h3>
                  <ReviewList 
                      reviews={feedbacks} 
                      instructorId={profile.id} 
                      isInstructorView={isOwnProfile} 
                  />
              </div>
          </div>

          {/* RIGHT COLUMN: Stats & Details */}
              <div className="profile-right-col">
              
              {/* Quick Stats */}
              <div className="premium-card">
                  <h3>Performance</h3>
                  <div className="metrics-row">
                      <div className="metric-item">
                          <div className="metric-val" style={{color:'#fbbf24'}}>{stats.avgRating || 0}</div>
                          <div className="metric-label">Avg Rating</div>
                      </div>
                      <div className="metric-item">
                          <div className="metric-val" style={{color:'#8b5cf6'}}>{stats.ratingCount || 0}</div>
                          <div className="metric-label">Reviews</div>
                      </div>
                      <div className="metric-item">
                          <div className="metric-val" style={{color:'#34d399'}}>
                              {Math.floor((stats.avgRating / 5) * 100)}%
                          </div>
                          <div className="metric-label">Satisfied</div>
                      </div>
                  </div>
              </div>

              {/* Courses Taught */}
              <div className="premium-card">
                  <h3>Courses</h3>
                  <ul style={{listStyle:'none', padding:0, margin:0}}>
                      {(profile.courses || []).length > 0 ? (
                          profile.courses.map((c, i) => (
                              <li key={i} style={{padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                                  <div style={{fontWeight:'bold'}}>{c.title || c.code}</div>
                                  <div style={{fontSize:'0.85rem', color:'#94a3b8'}}>{c.code}</div>
                              </li>
                          ))
                      ) : (
                         <li style={{color:'#94a3b8'}}>No courses listed.</li>
                      )}
                  </ul>
              </div>

          </div>
      </div>

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
