import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RatedInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="empty-state">No rated instructors yet.</div>;

  return (
    <div className="discovery-grid-premium">
      {instructors.map((inst) => (
        <div key={inst.instructorId || inst.instructorName} className="premium-card">
           <div className="card-content">
             <div className="avatar-container">
                <div className="premium-avatar">
                  {(inst.instructorName || 'I').charAt(0)}
                </div>
             </div>

             <div className="instructor-info-premium">
                <h4 className="instructor-name-gradient">{inst.instructorName}</h4>
                <p className="dept-name-premium">{inst.deptName}</p>
                
                <div className="rating-pill">
                   <span className="star-icon">★</span>
                   <span className="rating-score">{inst.lastRating}</span>
                   <span className="rating-count">Avg Given</span>
                </div>
                
                <div className="engagement-badge" style={{marginTop: 8, background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)'}}>
                    Rated {inst.count} times
                </div>
             </div>

             <button 
                className="view-profile-btn-premium"
                onClick={() => navigate(`/instructor/${encodeURIComponent(inst.instructorId)}`)}
             >
                View Profile
             </button>
           </div>
        </div>
      ))}
    </div>
  );
}
