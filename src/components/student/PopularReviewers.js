import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PopularReviewers({ reviewers }) {
  const navigate = useNavigate();

  if (!reviewers?.length) return <div className="glass-panel" style={{padding:20, textAlign:'center', opacity:0.6}}>No data yet.</div>;

  return (
    <div className="discovery-grid-premium">
      {reviewers.map((reviewer, index) => (
        <div key={reviewer.studentId} className="premium-card reviewer-card">
           <div className="card-content-row">
               <div className="premium-avatar-small">
                  {(reviewer.name || 'S').charAt(0)}
               </div>
               <div className="reviewer-info">
                   <h4 className="reviewer-name">{reviewer.name || 'Student'}</h4>
                   <p className="reviewer-dept">{reviewer.department || 'Student'}</p>
               </div>
           </div>
           
           <div className="stats-grid-premium">
               <div className="stat-item-premium">
                   <span className="stat-icon">📝</span>
                   <span className="stat-val">{reviewer.count}</span>
                   <span className="stat-lbl">Reviews</span>
               </div>
               <div className="stat-item-premium">
                   <span className="stat-icon">👍</span>
                   <span className="stat-val">{reviewer.helpfulVotes || 0}</span>
                   <span className="stat-lbl">Helpful</span>
               </div>
           </div>

           <button 
              className="view-profile-btn-premium small-btn" 
              onClick={() => navigate(`/student/${reviewer.studentId}`)} 
           >
              View Profile
           </button>
        </div>
      ))}
    </div>
  );
}
