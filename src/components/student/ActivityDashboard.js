import React from 'react';
import { toggleReaction, flagFeedback } from '../../utils/feedbackInteractions';

export default function ActivityDashboard({ ratings, userReactions, user }) {
  const handleReaction = async (feedbackId, type) => {
      if(!user?.uid) return;
      // Optimistic UI update could happen here in parent
      await toggleReaction({ feedbackId, userId: user.uid, type });
  };

  const handleFlag = async (feedbackId) => {
      if(!user?.uid) return;
      const reason = window.prompt('Reason for flagging?');
      if(reason) {
          await flagFeedback({ feedbackId, userId: user.uid, reason, details: '' });
      }
  };

  if (!ratings?.length) {
    return (
      <div className="empty-state glass-panel">
        <p>No activity yet. Start rating courses to see your timeline here!</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {ratings.map((rating) => (
        <div key={rating.id} className="activity-card glass-panel">
          <div className="activity-header">
             <div className="activity-meta">
                <span className="activity-type">Rated</span>
                <span className="activity-date">
                    {rating.createdAt?.toDate ? rating.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
             </div>
             <div className="activity-rating">
                {rating.overall}/5 ★
             </div>
          </div>
          
          <div className="activity-content">
             <h4>{rating.courseTitle || rating.courseCode}</h4>
             <p className="instructor-name">Instructor: {rating.instructorName}</p>
             {rating.comment && (
                 <div className="activity-comment">"{rating.comment}"</div>
             )}
          </div>

          <div className="activity-actions">
             <button className="action-btn" onClick={() => handleReaction(rating.id, 'like')}>
                👍 {rating.likesCount || 0}
             </button>
             <button className="action-btn" onClick={() => handleReaction(rating.id, 'dislike')}>
                👎 {rating.dislikesCount || 0}
             </button>
             <button className="action-btn secondary" onClick={() => handleFlag(rating.id)}>
                🚩 Flag
             </button>
          </div>
        </div>
      ))}
    </div>
  );
}
