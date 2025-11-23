import React from 'react';

export default function ProfileHeader({ profile, stats, onEdit }) {
  return (
    <div className="profile-header student-header">
      <div className="profile-avatar">
        {profile?.profilePictureUrl ? (
          <img
            src={profile.profilePictureUrl}
            alt={profile.name}
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <span>{(profile?.name || 'S').charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div className="profile-info">
        <h2>{profile?.name}</h2>
        <p className="profile-email">{profile?.email}</p>
        <p className="profile-role">Role: {profile?.role}</p>
        <p className="profile-id">Department: {profile?.department}</p>
        <p className="profile-id" style={{fontSize: '0.85em', opacity: 0.8}}>Joined: {profile?.joinedAt}</p>
        
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.totalRatings}</span>
            <span className="stat-label">Ratings Given</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.totalComments}</span>
            <span className="stat-label">Reviews</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.avgGiven}</span>
            <span className="stat-label">Avg Rating Given</span>
          </div>
        </div>

        <button className="edit-profile-btn" onClick={onEdit}>
          Edit Profile
        </button>
      </div>
    </div>
  );
}
