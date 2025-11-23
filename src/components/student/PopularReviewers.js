import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PopularReviewers({ reviewers }) {
  const navigate = useNavigate();

  if (!reviewers?.length) return <div className="glass-panel" style={{padding:20, textAlign:'center', opacity:0.6}}>No data yet.</div>;

  return (
    <div className="instructors-grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'}}>
      {reviewers.map((reviewer, index) => (
        <div key={reviewer.studentId} className="instructor-card glass-panel" style={{alignItems:'flex-start', textAlign:'left'}}>
           <div style={{display:'flex', alignItems:'center', gap: 15, marginBottom: 15}}>
               <div className="instructor-avatar-small" style={{width: 50, height: 50, fontSize: '1.2rem', margin:0}}>
                  {(reviewer.name || 'S').charAt(0)}
               </div>
               <div>
                   <h4 style={{margin:0}}>{reviewer.name || 'Student'}</h4>
                   <p style={{margin:0, fontSize:'0.8rem', opacity:0.6}}>{reviewer.department || 'Student'}</p>
               </div>
           </div>
           
           <div className="stats-row" style={{display:'flex', gap: 15, fontSize:'0.9rem', width:'100%', justifyContent:'space-between', opacity: 0.8}}>
               <span>📝 {reviewer.count} Reviews</span>
               <span>👍 {reviewer.helpfulVotes || 0} Helpful</span>
           </div>

           <button 
              className="view-profile-btn" 
              style={{marginTop: 15, fontSize:'0.9rem', padding: 8}}
              onClick={() => navigate(`/student/${reviewer.studentId}`)} 
           >
              View Profile
           </button>
        </div>
      ))}
    </div>
  );
}
