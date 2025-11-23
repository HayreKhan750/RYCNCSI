import React from 'react';

export default function ProfileHeader({ profile, stats, onEdit }) {
  return (
    <div className="profile-header">
      <div className="profile-cover"></div>
      
      <div className="profile-info-wrapper">
        <div className="profile-avatar-wrapper">
          {profile?.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt={profile.name}
              className="profile-avatar-lg"
            />
          ) : (
            <div className="profile-avatar-lg" style={{display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem', background:'#e0e7ff', color:'#6366f1'}}>
               {(profile?.name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="profile-details">
          <h1>{profile?.name}</h1>
          <div className="profile-meta">
            <span className="role-badge">{profile?.role || 'Student'}</span>
            <span className="dept-badge">{profile?.department || 'General'}</span>
            <span style={{opacity:0.7, alignSelf:'center', fontSize:'0.9rem'}}>Joined {profile?.joinedAt}</span>
          </div>
          
          <p style={{marginTop: '15px', opacity: 0.8, maxWidth: '600px', lineHeight: '1.6'}}>
            {profile?.bio || "No bio yet. Click edit to add one!"}
          </p>

          <div className="profile-stats-row">
            <div className="stat-box">
              <span className="stat-value">{stats.totalRatings}</span>
              <span className="stat-label">Ratings</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{stats.totalComments}</span>
              <span className="stat-label">Reviews</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{stats.avgGiven}</span>
              <span className="stat-label">Avg Given</span>
            </div>
          </div>
        </div>

        <button className="edit-profile-btn" onClick={onEdit}>
          Edit Profile
        </button>
      </div>
    </div>
  );
}
