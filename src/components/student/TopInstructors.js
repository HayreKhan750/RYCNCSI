import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="empty-state-message">No data available.</div>;

  const getDisplayName = (inst) => {
      if (inst.name) return inst.name;
      if (inst.instructorName && !inst.instructorName.includes('@')) return inst.instructorName;
      if (inst.instructorName && inst.instructorName.includes('@')) return inst.instructorName.split('@')[0];
      return 'Instructor';
  };

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
                  {getDisplayName(inst).charAt(0)}
                </div>
                <div className="avatar-glow"></div>
             </div>
             <div className="instructor-info-premium">
                <h4 className="instructor-name-gradient">{getDisplayName(inst)}</h4>
                <p className="dept-name-premium">{inst.department || 'General'}</p>
                
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
