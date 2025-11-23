import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RatedInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="empty-state">No rated instructors yet.</div>;

  return (
    <div className="instructors-grid">
      {instructors.map((inst) => (
        <div key={inst.instructorId || inst.instructorName} className="instructor-card glass-panel">
           <div className="instructor-avatar-small">
              {(inst.instructorName || 'I').charAt(0)}
           </div>
           <div className="instructor-info">
              <h4>{inst.instructorName}</h4>
              <p className="dept-name">{inst.deptName}</p>
              <div className="rating-summary">
                 <span className="rating-val">Avg Given: {inst.lastRating}★</span>
                 <span className="rating-count">Rated {inst.count}x</span>
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
