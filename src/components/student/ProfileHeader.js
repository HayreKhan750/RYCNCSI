import React from 'react';

export default function ProfileHeader({ profile, stats, onEdit }) {
  return (
    <div className="profile-header">

      
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
          <h1 style={{
              fontSize: '2.5rem', 
              fontWeight: '800', 
              marginBottom: '8px',
              background: 'linear-gradient(90deg, #fff, #a5b4fc)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-1px'
          }}>
            {profile?.name}
          </h1>
          
          <div className="profile-meta" style={{display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap'}}>
            <span className="role-badge" style={{textTransform:'uppercase', letterSpacing:'1px', fontSize:'0.75rem', padding:'4px 12px', borderRadius:'12px', background:'rgba(255,255,255,0.1)'}}>{profile?.role || 'Student'}</span>
            <span className="dept-badge" style={{color:'#a5b4fc', fontWeight:'600'}}>{profile?.department || 'General'}</span>
            <span style={{opacity:0.6, fontSize:'0.9rem'}}>
                Joined {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'recently'}
            </span>
          </div>
          
          <p style={{marginTop: '20px', opacity: 0.8, maxWidth: '600px', lineHeight: '1.7', fontSize: '1.05rem', fontStyle: profile?.bio ? 'normal' : 'italic'}}>
            {profile?.bio || "No bio yet. Click edit to add one!"}
          </p>

          <div className="profile-stats-row" style={{marginTop: '30px', display: 'flex', gap: '40px'}}>
            <div className="stat-box" style={{textAlign: 'left'}}>
              <span className="stat-value" style={{fontSize: '2rem', fontWeight: '800', color: '#fff', display: 'block', lineHeight: 1}}>
                  {stats.totalRatings}
              </span>
              <span className="stat-label" style={{textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.6, marginTop: '8px', display: 'block'}}>
                  Ratings
              </span>
            </div>
            
            <div className="stat-box" style={{textAlign: 'left'}}>
              <span className="stat-value" style={{fontSize: '2rem', fontWeight: '800', color: '#fff', display: 'block', lineHeight: 1}}>
                  {stats.reviewsCount || stats.totalComments || 0}
              </span>
              <span className="stat-label" style={{textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.6, marginTop: '8px', display: 'block'}}>
                  Reviews
              </span>
            </div>
            
            <div className="stat-box" style={{textAlign: 'left'}}>
              <span className="stat-value" style={{fontSize: '2rem', fontWeight: '800', color: '#818cf8', display: 'block', lineHeight: 1}}>
                  {stats.avgGiven}
              </span>
              <span className="stat-label" style={{textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.6, marginTop: '8px', display: 'block'}}>
                  Avg Given
              </span>
            </div>
          </div>
        </div>

        {onEdit && (
          <button className="edit-profile-btn" onClick={onEdit} style={{
              alignSelf: 'flex-start',
              padding: '12px 24px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
          }}>
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}
