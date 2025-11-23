import React, { useState } from 'react';

export default function FeedbackSection({ feedbacks, onReply }) {
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState({});

  const handleReply = async (feedbackId) => {
      if(!replyText[feedbackId]) return;
      const success = await onReply(feedbackId, replyText[feedbackId]);
      if(success) {
          setReplyText({...replyText, [feedbackId]: ''});
          // Ideally we'd refetch or optimistic update here
          alert('Reply posted!'); 
      }
  };

  return (
    <div className="glass-card" style={{padding: 40}}>
       <h2 className="feedback-section-title">Student Feedback</h2>
       
       <div className="review-list">
          {feedbacks.map(review => (
              <div key={review.id} className="review-item" style={{background: expandedId === review.id ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: 16}}>
                  <div className="review-header-row">
                      <div>
                          <span className="student-name">{review.studentName || 'Student'}</span>
                          <span className="review-date">{new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="star-display">
                          {'★'.repeat(Math.round(review.rating))}
                      </div>
                  </div>
                  
                  <p className="review-text">"{review.feedback}"</p>
                  
                  {review.tags && (
                      <div className="review-tags-row">
                          {review.tags.map(t => <span key={t} className="review-tag">{t}</span>)}
                      </div>
                  )}

                  <div className="review-actions-bar">
                      <span className="action-link">👍 {review.likesCount || 0}</span>
                      <span className="action-link">👎 {review.dislikesCount || 0}</span>
                      <span className="action-link">🚩 Report</span>
                      <span 
                        className="action-link" 
                        style={{marginLeft:'auto', color: expandedId === review.id ? '#bc13fe' : 'inherit'}}
                        onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                      >
                          {expandedId === review.id ? 'Hide Replies' : `View Replies (${review.repliesCount || 0})`}
                      </span>
                  </div>

                  {expandedId === review.id && (
                      <div className="replies-container">
                          {/* Assuming replies would be fetched here. For demo, just showing input */}
                          {review.repliesCount === 0 && <p style={{opacity:0.5, fontStyle:'italic'}}>No replies yet.</p>}
                          
                          {/* Reply Input */}
                          <div className="reply-input-area">
                              <input 
                                  type="text" 
                                  className="modern-input" 
                                  placeholder="Write a reply..." 
                                  value={replyText[review.id] || ''}
                                  onChange={(e) => setReplyText({...replyText, [review.id]: e.target.value})}
                              />
                              <button className="send-reply-btn" onClick={() => handleReply(review.id)}>Reply</button>
                          </div>
                      </div>
                  )}
              </div>
          ))}
          {feedbacks.length === 0 && <p style={{opacity:0.6, textAlign:'center'}}>No feedback available.</p>}
       </div>
    </div>
  );
}
