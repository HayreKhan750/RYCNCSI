import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="glass-panel" style={{padding:20, textAlign:'center', opacity:0.6}}>No data available.</div>;

  return (
    <div className="instructors-grid">
      {instructors.map((inst, index) => (
        <div key={inst.instructorId} className="instructor-card glass-panel highlight-card">
           <div className="rank-badge">#{index + 1}</div>
           
           <div className="instructor-avatar-small">
              {(inst.instructorName || 'I').charAt(0)}
           </div>

           <div className="instructor-info">
              <h4 style={{fontSize:'1.2rem', marginBottom: 5}}>{inst.instructorName}</h4>
              <p className="dept-name" style={{opacity:0.7, marginBottom: 15}}>{inst.deptName}</p>
              
              <div className="rating-highlight" style={{display:'flex', alignItems:'center', gap: 10, justifyContent:'center', marginBottom: 15}}>
                 <span className="star-icon" style={{color:'#fbbf24'}}>⭐</span>
                 <span className="rating-score" style={{fontWeight:'bold', fontSize:'1.2rem'}}>{inst.avgRating}</span>
                 <span className="rating-count" style={{opacity:0.6}}>({inst.count} reviews)</span>
              </div>

              {/* Engagement Insight */}
              <div style={{fontSize:'0.8rem', color:'var(--neon-secondary)', background:'rgba(236, 72, 153, 0.1)', padding:'4px 10px', borderRadius: 10}}>
                  🔥 High Engagement
              </div>
           </div>

           <button 
              className="view-profile-btn"
              onClick={() => navigate(`/instructor/${encodeURIComponent(inst.instructorId)}`)}
           >
              View Profile
           </button>
        </div>
      ))}
    </div>
  );
}
