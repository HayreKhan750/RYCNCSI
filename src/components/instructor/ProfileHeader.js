import React from 'react';

export default function ProfileHeader({ profile, stats, onEdit, isEditing }) {
  const { averageRating, totalRatings, myCoursesCount } = stats;

  return (
    <div className="profile-header">
        <div className="profile-avatar instructor">
          {profile?.profilePictureUrl ? (
            <img
              src={profile.profilePictureUrl}
              alt={profile.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span>{(profile?.name || 'I').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="profile-info">
          <h2>{profile?.name || 'Instructor'}</h2>
          <p className="profile-email">{profile?.email}</p>
          {profile?.department && (
            <p className="profile-id">Department: {profile.department}</p>
          )}
          <p className="profile-role">Role: Instructor</p>
          {profile?.bio && !isEditing && (
            <p style={{ marginTop: '8px', maxWidth: '600px' }}>{profile.bio}</p>
          )}
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{myCoursesCount}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{totalRatings}</span>
              <span className="stat-label">Ratings</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{averageRating}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
          {!isEditing && (
              <button
              className="enroll-button"
              style={{ marginTop: '10px' }}
              onClick={onEdit}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
  );
}
