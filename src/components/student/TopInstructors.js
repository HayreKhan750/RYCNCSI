import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="glass-panel" style={{padding:20, textAlign:'center', opacity:0.6}}>No data available.</div>;

  return (
    <div className="discovery-grid-premium">
      {instructors.map((inst, index) => (
        <div key={inst.id} className={`premium-card rank-${index + 1}`}>
           <div className={`rank-badge-premium rank-${index + 1}`}>
             <span>#{index + 1}</span>
           </div>
           
           <div className="card-content">
             <div className="avatar-container">
                <div className="premium-avatar">
                  {(inst.instructorName || 'I').charAt(0)}
                </div>
                <div className="avatar-glow"></div>
             </div>
             <div className="instructor-info-premium">
                <h4 className="instructor-name-gradient">{inst.instructorName || 'Instructor'}</h4>
                <p className="dept-name-premium">{inst.department}</p>
                
                <div className="rating-pill">
                   <span className="star-icon">⭐</span>
                   <span className="rating-score">{typeof inst.avgRating === 'number' ? inst.avgRating.toFixed(1) : inst.avgRating}</span>
                   <span className="rating-count">({inst.ratingCount})</span>
                </div>

                {/* Engagement Insight */}
                <div className="engagement-badge">
                    🔥 High Engagement
                </div>
             </div>

             <button 
                className="view-profile-btn-premium"
                onClick={() => navigate(`/instructor/${encodeURIComponent(inst.id)}`)}
             >
                View Profile
             </button>
           </div>
        </div>
      ))}
    </div>
  );
}
