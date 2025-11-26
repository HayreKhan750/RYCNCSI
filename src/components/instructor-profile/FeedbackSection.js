import React, { useState } from 'react';
import { useSelector } from 'react-redux';

export default function FeedbackSection({ feedbacks, onReply, onLike, onReplyDelete, onReplyVote, canReply }) {
  const { user } = useSelector((state) => state.auth);
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState({});

  const handleReply = async (feedbackId) => {
      if(!replyText[feedbackId]) return;
      
      const replyData = {
          text: replyText[feedbackId],
          authorName: user?.displayName || 'User',
          authorId: user?.uid,
          role: user?.role || 'student' // Pass role for styling
      };

      const success = await onReply(feedbackId, replyData);
      if(success) {
          setReplyText({...replyText, [feedbackId]: ''});
      }
  };

  return (
    <div className="glass-card" style={{padding: 40}}>
       <h2 className="feedback-section-title">Student Feedback</h2>
       
       <div className="review-list">
          {feedbacks.map(review => (
              <div key={review.id} className="review-item fade-in" style={{
                  background: expandedId === review.id ? 'rgba(255,255,255,0.03)' : 'transparent', 
                  borderRadius: 16,
                  border: expandedId === review.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                  transition: 'all 0.3s ease'
              }}>
                  <div className="review-header-row">
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <div className="avatar-circle" style={{width:32, height:32, fontSize:'0.8rem', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                              {review.studentPhoto ? (
                                  <img src={review.studentPhoto} alt="S" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              ) : (
                                  review.studentName?.[0] || 'S'
                              )}
                          </div>
                          <div>
                              <span className="student-name" style={{display:'block', lineHeight:1}}>{review.studentName || 'Student'}</span>
                              <span className="review-date" style={{fontSize:'0.75rem', opacity:0.6}}>{new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}</span>
                          </div>
                      </div>
                      <div className="star-display">
                          {'★'.repeat(Math.round(review.rating))}
                          <span style={{opacity:0.3}}>{'★'.repeat(5 - Math.round(review.rating))}</span>
                      </div>
                  </div>
                  
                  <p className="review-text" style={{margin:'15px 0', lineHeight:1.6, fontSize:'1rem'}}>"{review.feedback}"</p>
                  
                  {review.tags && (
                      <div className="review-tags-row">
                          {review.tags.map(t => <span key={t} className="review-tag">{t}</span>)}
                      </div>
                  )}

                  <div className="review-actions-bar" style={{marginTop:15, paddingTop:15, borderTop:'1px solid rgba(255,255,255,0.05)'}}>
                      <span 
                        className="action-link" 
                        onClick={() => onLike && onLike(review.id, user?.uid, true)}
                        style={{cursor:'pointer'}}
                      >
                        👍 {review.likesCount || 0}
                      </span>
                      <span 
                        className="action-link" 
                        onClick={() => onLike && onLike(review.id, user?.uid, false)}
                        style={{cursor:'pointer'}}
                      >
                        👎 {review.dislikesCount || 0}
                      </span>
                      <span className="action-link">🚩 Report</span>
                      <span 
                        className="action-link" 
                        style={{marginLeft:'auto', color: expandedId === review.id ? '#bc13fe' : 'inherit', fontWeight:500}}
                        onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                      >
                          {expandedId === review.id ? 'Hide Discussion' : `Discussion (${(review.replies?.length || 0)})`}
                      </span>
                  </div>

                  {expandedId === review.id && (
                      <div className="replies-container fade-in" style={{marginTop:20, paddingLeft:20, borderLeft:'2px solid rgba(255,255,255,0.1)'}}>
                          
                          {/* Render Replies */}
                          {review.replies && review.replies.map((reply, idx) => {
                              // Safe Date Parsing
                              let dateStr = 'Just now';
                              if (reply.createdAt) {
                                  if (reply.createdAt.seconds) {
                                      dateStr = new Date(reply.createdAt.seconds * 1000).toLocaleDateString();
                                  } else if (typeof reply.createdAt === 'number') {
                                      dateStr = new Date(reply.createdAt).toLocaleDateString();
                                  } else if (reply.createdAt.toDate) {
                                      dateStr = reply.createdAt.toDate().toLocaleDateString();
                                  }
                              }

                              const isAuthor = user?.uid === reply.authorId;

                              return (
                                  <div key={reply.id || idx} className="reply-item" style={{marginBottom:15, background:'rgba(0,0,0,0.2)', padding:12, borderRadius:8}}>
                                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:5}}>
                                          <span style={{fontWeight:600, fontSize:'0.9rem', color: reply.role === 'instructor' ? '#bc13fe' : 'inherit'}}>
                                              {reply.authorName} {reply.role === 'instructor' && <span className="badge-instructor">Instructor</span>}
                                          </span>
                                          <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                              <span style={{fontSize:'0.7rem', opacity:0.5}}>{dateStr}</span>
                                              {isAuthor && (
                                                  <button 
                                                      onClick={() => onReplyDelete && onReplyDelete(review.id, reply.id)}
                                                      style={{background:'none', border:'none', color:'#ff4d4d', cursor:'pointer', fontSize:'0.7rem', padding:0}}
                                                  >
                                                      Delete
                                                  </button>
                                              )}
                                          </div>
                                      </div>
                                      <p style={{margin:0, fontSize:'0.95rem', opacity:0.9}}>{reply.text}</p>
                                      
                                      <div style={{marginTop:8, display:'flex', gap:15, fontSize:'0.8rem', opacity:0.7}}>
                                          <span 
                                              style={{cursor:'pointer'}} 
                                              onClick={() => onReplyVote && onReplyVote(review.id, reply.id, 'like')}
                                          >
                                              👍 {reply.likes || 0}
                                          </span>
                                          <span 
                                              style={{cursor:'pointer'}} 
                                              onClick={() => onReplyVote && onReplyVote(review.id, reply.id, 'dislike')}
                                          >
                                              👎 {reply.dislikes || 0}
                                          </span>
                                      </div>
                                  </div>
                              );
                          })}

                          {(!review.replies || review.replies.length === 0) && <p style={{opacity:0.5, fontStyle:'italic', fontSize:'0.9rem'}}>No replies yet. Be the first!</p>}
                          
                          {/* Reply Input */}
                          <div className="reply-input-area" style={{marginTop:15, display:'flex', gap:10}}>
                              <input 
                                  type="text" 
                                  className="modern-input" 
                                  placeholder="Write a reply..." 
                                  value={replyText[review.id] || ''}
                                  onChange={(e) => setReplyText({...replyText, [review.id]: e.target.value})}
                                  style={{flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'10px 15px', borderRadius:20, color:'inherit'}}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter' && replyText[review.id]) {
                                          handleReply(review.id);
                                      }
                                  }}
                              />
                              <button 
                                  className="send-reply-btn" 
                                  onClick={() => handleReply(review.id)}
                                  disabled={!replyText[review.id]}
                                  style={{
                                      background: replyText[review.id] ? 'linear-gradient(135deg, #bc13fe, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                                      color:'white', border:'none', padding:'0 20px', borderRadius:20, cursor: replyText[review.id] ? 'pointer' : 'default',
                                      opacity: replyText[review.id] ? 1 : 0.5
                                  }}
                              >
                                  Reply
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          ))}
          {feedbacks.length === 0 && <div style={{padding:40, textAlign:'center', opacity:0.6}}>No feedback available yet.</div>}
       </div>
    </div>
  );
}
