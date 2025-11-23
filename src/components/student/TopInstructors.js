import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopInstructors({ instructors }) {
  const navigate = useNavigate();

  if (!instructors?.length) return <div className="empty-state">No data available.</div>;

  return (
    <div className="instructors-grid">
      {instructors.map((inst, index) => (
        <div key={inst.instructorId} className="instructor-card glass-panel highlight-card">
           <div className="rank-badge">#{index + 1}</div>
           <div className="instructor-info">
              <h4>{inst.instructorName}</h4>
              <p className="dept-name">{inst.deptName}</p>
              <div className="rating-highlight">
                 <span className="star-icon">⭐</span>
                 <span className="rating-score">{inst.avgRating}</span>
                 <span className="rating-count">({inst.count} reviews)</span>
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
