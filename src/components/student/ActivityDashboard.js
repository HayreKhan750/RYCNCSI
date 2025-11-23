import React, { useState } from 'react';
import { toggleReaction, flagFeedback } from '../../utils/feedbackInteractions';
import { useNavigate } from 'react-router-dom';

export default function ActivityDashboard({ ratings, userReactions, user }) {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  const handleReaction = async (feedbackId, type) => {
      if(!user?.uid) return;
      await toggleReaction({ feedbackId, userId: user.uid, type });
  };

  const handleFlag = async (feedbackId) => {
      if(!user?.uid) return;
      const reason = window.prompt('Reason for flagging?');
      if(reason) {
          await flagFeedback({ feedbackId, userId: user.uid, reason, details: '' });
      }
  };

  const toggleReplies = (id) => {
      setExpandedId(expandedId === id ? null : id);
  };

  if (!ratings?.length) {
    return (
      <div className="glass-panel" style={{padding: 40, textAlign: 'center', opacity: 0.7}}>
        <h3>No activity yet</h3>
        <p>Start rating instructors to see your timeline here!</p>
        <button className="action-btn" style={{margin:'20px auto'}} onClick={() => navigate('/dashboard')}>
            Rate Instructors
        </button>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {ratings.map((rating) => (
        <div key={rating.id} className="activity-card glass-panel">
          <div className="activity-header">
             <div className="activity-meta">
                <span className="activity-type">Rated Instructor</span>
                <span className="activity-date">
                    {rating.createdAt?.toDate ? rating.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
             </div>
             <div className="activity-rating" style={{fontWeight:'bold', color:'#fbbf24', fontSize:'1.2rem'}}>
                {rating.rating || rating.overall} ★
             </div>
          </div>
          
          <div className="activity-content">
             <h4 style={{cursor:'pointer'}} onClick={() => navigate(`/instructor/${rating.instructorId}`)}>
                {rating.instructorName}
             </h4>
             <p className="dept-name" style={{opacity:0.6, fontSize:'0.9rem', marginBottom:10}}>
                {rating.deptName || rating.courseTitle}
             </p>
             
             {rating.comment && (
                 <div className="activity-comment">"{rating.comment}"</div>
             )}
             
             {rating.tags && (
                 <div style={{display:'flex', gap:8, marginTop:10, flexWrap:'wrap'}}>
                    {rating.tags.map(tag => (
                        <span key={tag} style={{fontSize:'0.75rem', padding:'4px 10px', borderRadius:15, background:'rgba(255,255,255,0.1)'}}>
                            #{tag}
                        </span>
                    ))}
                 </div>
             )}
          </div>

          <div className="activity-actions">
             <button className="action-btn" onClick={() => handleReaction(rating.id, 'like')}>
                👍 {rating.likesCount || 0} Likes
             </button>
             <button className="action-btn" onClick={() => handleReaction(rating.id, 'dislike')}>
                👎 {rating.dislikesCount || 0} Dislikes
             </button>
             <button className="action-btn" onClick={() => toggleReplies(rating.id)}>
                💬 {rating.replies?.length || 0} Replies
             </button>
             <button className="action-btn secondary" style={{marginLeft:'auto', color:'#ef4444'}} onClick={() => handleFlag(rating.id)}>
                🚩 Flag
             </button>
          </div>

          {/* Threaded Replies View */}
          {expandedId === rating.id && (
              <div className="replies-section" style={{marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--glass-border)'}}>
                  {rating.replies && rating.replies.length > 0 ? (
                      rating.replies.map((reply, idx) => (
                          <div key={idx} style={{marginBottom: 15, paddingLeft: 15, borderLeft: '2px solid var(--neon-primary)'}}>
                              <div style={{fontSize:'0.85rem', fontWeight:'bold', marginBottom: 4}}>{reply.authorName || 'User'}</div>
                              <div style={{fontSize:'0.9rem', opacity: 0.9}}>{reply.text}</div>
                              <div style={{fontSize:'0.75rem', opacity: 0.5, marginTop: 4}}>{new Date(reply.createdAt).toLocaleDateString()}</div>
                          </div>
                      ))
                  ) : (
                      <div style={{opacity: 0.6, fontStyle: 'italic'}}>No replies yet.</div>
                  )}
              </div>
          )}
        </div>
      ))}
    </div>
  );
}
