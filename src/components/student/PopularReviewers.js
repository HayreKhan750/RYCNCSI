import React from 'react';

export default function PopularReviewers({ reviewers }) {
  if (!reviewers?.length) return <div className="empty-state">No active reviewers yet.</div>;

  return (
    <div className="reviewers-list">
      {reviewers.map((reviewer, index) => (
        <div key={reviewer.studentId} className="reviewer-row glass-panel">
           <div className="reviewer-rank">{index + 1}</div>
           <div className="reviewer-avatar">
              {(reviewer.name || 'S').charAt(0)}
           </div>
           <div className="reviewer-details">
              <h4>{reviewer.name}</h4>
              <p>{reviewer.count} Reviews Contributed</p>
           </div>
        </div>
      ))}
    </div>
  );
}
