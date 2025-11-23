import React from 'react';

export default function ProfileHeader({ profile, onEdit }) {
  return (
    <div className="glass-card profile-header">
      <div className="avatar-wrapper">
        <div className="avatar-glow"></div>
        <img 
            src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.name}&background=random`} 
            alt="Instructor" 
            className="profile-avatar"
        />
      </div>
      
      <div className="header-content">
         <h1>{profile.name}</h1>
         <span className="dept-badge">{profile.dept} Department</span>
         <p style={{fontSize:'1.1rem', opacity:0.8, marginTop:10, maxWidth: 600}}>
             {profile.bio}
         </p>
         <div style={{marginTop:15, fontSize:'0.9rem', opacity:0.6, display:'flex', gap:20}}>
             <span>📧 {profile.email}</span>
             <span>🎓 {profile.role}</span>
         </div>
      </div>

      <button className="edit-profile-btn" onClick={onEdit}>
          Edit Profile
      </button>
    </div>
  );
}
