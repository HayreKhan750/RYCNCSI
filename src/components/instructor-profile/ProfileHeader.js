import React from 'react';

export default function ProfileHeader({ profile, onEdit, isOwnProfile }) {
  return (
    <div className="glass-card profile-header">
      <div className="avatar-wrapper">
        <div className="avatar-glow"></div>
        {profile.photoURL ? (
            <img 
                src={profile.photoURL} 
                alt="Instructor" 
                className="profile-avatar"
            />
        ) : (
            <div className="profile-avatar" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                fontSize: '4rem', fontWeight: 'bold', color: 'white'
            }}>
                {(profile.instructorName || profile.name || 'I').charAt(0).toUpperCase()}
            </div>
        )}
      </div>
      
      <div className="header-content">
         <h1>{profile.instructorName || profile.name}</h1>
         <span className="dept-badge">{profile.department || profile.dept || 'Department'}</span>
         <p style={{fontSize:'1.1rem', opacity:0.8, marginTop:10, maxWidth: 600}}>
             {profile.bio}
         </p>
         
         {isOwnProfile && (
             <div style={{marginTop:15, fontSize:'0.9rem', opacity:0.6, display:'flex', gap:20}}>
                 <span>📧 {profile.email}</span>
                 <span>🎓 {profile.role}</span>
             </div>
         )}
      </div>

      {isOwnProfile && (
          <button className="edit-profile-btn" onClick={onEdit}>
              Edit Profile
          </button>
      )}
    </div>
  );
}
