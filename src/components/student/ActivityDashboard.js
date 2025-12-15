import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toggleLike, addReply, flagFeedback } from '../../store/slices/feedbackSlice';
import { useNavigate } from 'react-router-dom';
import PremiumModal from '../common/PremiumModal';
import useContentModeration from '../../hooks/useContentModeration';

export default function ActivityDashboard({ ratings = [], isOwnProfile = false, user = {} }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'confirm' });
  const [replyText, setReplyText] = useState({});
  const { validateContent } = useContentModeration();
  
  // Optimistic UI state
  const [optimisticRatings, setOptimisticRatings] = useState(ratings);
  const [userReactions, setUserReactions] = useState({}); // Local state for demo/optimistic, ideally from Redux

  // Sync props to state when props change
  React.useEffect(() => {
    setOptimisticRatings(ratings);
  }, [ratings]);

  const handleReaction = async (feedbackId, type) => {
      if(!user?.uid) return;
      
      // Find the rating
      const ratingIndex = optimisticRatings.findIndex(r => r.id === feedbackId);
      if (ratingIndex === -1) return;
      const rating = optimisticRatings[ratingIndex];

      // Prevent self-voting (silently)
      if (rating.studentId === user.uid) {
          return;
      }

      // Optimistic update
      const currentReaction = userReactions[feedbackId]; // 'like' | 'dislike' | null
      const isRemoving = currentReaction === type;
      const isSwitching = currentReaction && currentReaction !== type;

      const newRatings = [...optimisticRatings];
      const target = { ...newRatings[ratingIndex] };

      if (type === 'like') {
          if (isRemoving) target.likesCount = Math.max(0, (target.likesCount || 0) - 1);
          else {
              target.likesCount = (target.likesCount || 0) + 1;
              if (isSwitching) target.dislikesCount = Math.max(0, (target.dislikesCount || 0) - 1);
          }
      } else {
          if (isRemoving) target.dislikesCount = Math.max(0, (target.dislikesCount || 0) - 1);
          else {
              target.dislikesCount = (target.dislikesCount || 0) + 1;
              if (isSwitching) target.likesCount = Math.max(0, (target.likesCount || 0) - 1);
          }
      }
      
      setOptimisticRatings(newRatings);
      setUserReactions(prev => ({ ...prev, [feedbackId]: isRemoving ? null : type }));
      
      try {
        await dispatch(toggleLike({ 
            feedbackId, 
            userId: user.uid, 
            isLike: type === 'like' 
        })).unwrap();
      } catch (e) {
        console.error("Failed to toggle reaction", e);
        // Revert optimistic? (Omitted for brevity, but recommended)
      }
  };

  const openFlagModal = (feedbackId) => {
      if(!user?.uid) return;
      setModalConfig({
          isOpen: true,
          title: 'Flag Content',
          message: 'Please provide a reason for flagging this content.',
          type: 'input',
          inputPlaceholder: 'e.g. Inappropriate language...',
          confirmText: 'Submit Report',
          onConfirm: (reason) => handleFlag(feedbackId, reason)
      });
  };

  const handleFlag = async (feedbackId, reason) => {
      await dispatch(flagFeedback({ feedbackId, userId: user.uid, reason, details: '' })).unwrap();
      setModalConfig({
          isOpen: true,
          title: 'Report Submitted',
          message: 'Thank you for keeping our community safe. We will review this shortly.',
          type: 'alert',
          confirmText: 'Done'
      });
  };

  const toggleReplies = (id) => {
      setExpandedId(expandedId === id ? null : id);
  };

  const submitReply = async (feedbackId) => {
      const text = replyText[feedbackId];
      if (!text || !text.trim()) return;

      // Content Moderation
      if (!validateContent(text)) return;

      // Optimistic Update for Reply
      const ratingIndex = optimisticRatings.findIndex(r => r.id === feedbackId);
      if (ratingIndex !== -1) {
          const newRatings = [...optimisticRatings];
          const target = { ...newRatings[ratingIndex] };
          
          const newReply = {
              id: Date.now().toString(), // Temp ID
              text: text,
              authorName: user.displayName || user.name || 'User',
              authorId: user.uid,
              createdAt: new Date().toISOString() // ISO string for immediate display
          };

          target.replies = [...(target.replies || []), newReply];
          newRatings[ratingIndex] = target;
          setOptimisticRatings(newRatings);
          setReplyText(prev => ({ ...prev, [feedbackId]: '' })); // Clear input
      }

      try {
        await dispatch(addReply({ 
            feedbackId, 
            replyData: {
                authorId: user.uid, 
                role: 'student', 
                authorName: user.displayName || user.name || 'User',
                text
            }
        })).unwrap();
      } catch (e) {
          console.error("Failed to submit reply", e);
          // Revert optimistic update if needed (omitted for brevity)
      }
  };


  if (!optimisticRatings?.length) {
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
    <div className="activity-feed-premium" style={{display:'flex', flexDirection:'column', gap: 24}}>
      {optimisticRatings.map((rating) => {
          const hasReplies = rating.replies && rating.replies.length > 0;
          // Logic: If own profile, can only reply if there are existing replies.
          const canReply = !isOwnProfile || hasReplies;

          return (
        <div key={rating.id} className="premium-card activity-card-premium" style={{
            flexDirection:'column', 
            padding: 0, 
            overflow:'hidden', // Changed to hidden to contain children
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '24px',
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div className="activity-header-premium" style={{
              padding: '20px 24px', 
              borderBottom: '1px solid var(--border-subtle)', 
              display:'flex', 
              justifyContent:'space-between', 
              alignItems:'center',
              background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)'
          }}>
             <div className="activity-meta" style={{display:'flex', alignItems:'center'}}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%', 
                    background: 'var(--primary-gradient)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', marginRight: 12, color: 'white'
                }}>
                    {(rating.instructorName || 'T').charAt(0)}
                </div>
                <div>
                    <h4 style={{margin:0, fontSize:'1.1rem', color:'var(--text-primary)', cursor:'pointer'}} onClick={() => navigate(`/instructor/${rating.instructorId}`)}>
                        {rating.instructorName || 'Instructor'}
                    </h4>
                    <span className="activity-date" style={{opacity: 0.5, fontSize:'0.85rem', color:'var(--text-secondary)'}}>
                        {rating.createdAt?.toDate ? rating.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                </div>
             </div>
             <div className="activity-rating" style={{
                 fontWeight:'800', 
                 color:'#fbbf24', 
                 fontSize:'1.4rem', 
                 background: 'rgba(251, 191, 36, 0.1)',
                 padding: '4px 12px',
                 borderRadius: '12px',
                 border: '1px solid rgba(251, 191, 36, 0.2)'
             }}>
                {rating.rating || rating.overall} <span style={{fontSize:'1rem'}}>★</span>
             </div>
          </div>
          
          {/* Content */}
          <div className="activity-content" style={{padding: '24px'}}>
             <p className="dept-name" style={{
                 opacity:0.7, fontSize:'0.85rem', marginBottom:12, 
                 textTransform:'uppercase', letterSpacing:'1px', fontWeight: 600, color: 'var(--primary)'
             }}>
                {rating.deptName || rating.courseTitle || 'General Course'}
             </p>
             
             {(rating.comment || rating.feedback) && (
                 <div className="activity-comment" style={{
                     background:'var(--bg-root)', 
                     padding:'20px', 
                     borderRadius:'16px', 
                     fontStyle:'italic', 
                     borderLeft:'4px solid var(--primary)',
                     color: 'var(--text-primary)',
                     lineHeight: 1.6,
                     fontSize: '1.05rem'
                 }}>
                     "{rating.comment || rating.feedback}"
                 </div>
             )}
             
             {rating.tags && (
                 <div style={{display:'flex', gap:8, marginTop:20, flexWrap:'wrap'}}>
                    {rating.tags.map(tag => (
                        <span key={tag} style={{
                            fontSize:'0.8rem', padding:'6px 14px', borderRadius:20, 
                            background:'var(--bg-root)', border:'1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)'
                        }}>
                            #{tag}
                        </span>
                    ))}
                 </div>
             )}
          </div>

          {/* Actions */}
          <div className="activity-actions" style={{
              padding: '16px 24px', 
              background:'rgba(0,0,0,0.02)', 
              display:'flex', gap: 16, 
              borderTop:'1px solid var(--border-subtle)'
          }}>
             <button className="action-btn-premium" onClick={() => handleReaction(rating.id, 'like')} style={{background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition: 'color 0.2s', fontSize: '0.95rem'}}>
                <span style={{color: userReactions[rating.id] === 'like' ? 'var(--primary)' : 'inherit'}}>👍</span> {rating.likesCount || 0}
             </button>
             <button className="action-btn-premium" onClick={() => handleReaction(rating.id, 'dislike')} style={{background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition: 'color 0.2s', fontSize: '0.95rem'}}>
                <span style={{color: userReactions[rating.id] === 'dislike' ? 'var(--danger)' : 'inherit'}}>👎</span> {rating.dislikesCount || 0}
             </button>
             <button className="action-btn-premium" onClick={() => toggleReplies(rating.id)} style={{background:'transparent', border:'none', color: expandedId === rating.id ? 'var(--primary)' : 'var(--text-secondary)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition: 'color 0.2s', fontSize: '0.95rem'}}>
                💬 {rating.replies?.length || 0} Replies
             </button>
             <button className="action-btn-premium secondary" style={{marginLeft:'auto', color:'var(--text-muted)', background:'transparent', border:'none', cursor:'pointer', fontSize: '0.9rem'}} onClick={() => openFlagModal(rating.id)}>
                🚩 Flag
             </button>
          </div>

          {/* Threaded Replies View */}
          {expandedId === rating.id && (
              <div className="replies-section" style={{padding: '0 24px 24px', background:'rgba(0,0,0,0.02)'}}>
                  {/* Existing Replies */}
                  {rating.replies && rating.replies.length > 0 ? (
                      <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20}}>
                          {rating.replies.map((reply, idx) => (
                              <div key={idx} style={{display: 'flex', gap: 12}}>
                                  <div style={{
                                      minWidth: 32, height: 32, borderRadius: '50%', 
                                      background: 'var(--bg-root)', border: '1px solid var(--border-subtle)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
                                  }}>
                                      {(reply.authorName || 'U').charAt(0)}
                                  </div>
                                  <div style={{flex: 1}}>
                                      <div style={{background: 'var(--bg-root)', padding: '12px 16px', borderRadius: '0 16px 16px 16px', border: '1px solid var(--border-subtle)'}}>
                                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                                              <span style={{fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)'}}>{reply.authorName || 'User'}</span>
                                              <span style={{fontSize: '0.75rem', opacity: 0.5}}>{new Date(reply.createdAt || Date.now()).toLocaleDateString()}</span>
                                          </div>
                                          <p style={{margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5}}>{reply.text}</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div style={{opacity: 0.6, fontStyle: 'italic', padding:'24px 0', textAlign: 'center', color: 'var(--text-secondary)'}}>No replies yet.</div>
                  )}

                  {/* Reply Input Area */}
                  <div style={{marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)'}}>
                      {canReply ? (
                          <div style={{display: 'flex', gap: 12}}>
                              <input 
                                  type="text" 
                                  placeholder="Write a reply..." 
                                  value={replyText[rating.id] || ''}
                                  onChange={(e) => setReplyText(prev => ({...prev, [rating.id]: e.target.value}))}
                                  style={{
                                      flex: 1, padding: '12px 16px', borderRadius: '24px', 
                                      border: '1px solid var(--border-subtle)', background: 'var(--bg-root)',
                                      color: 'var(--text-primary)', outline: 'none'
                                  }}
                                  onKeyDown={(e) => e.key === 'Enter' && submitReply(rating.id)}
                              />
                              <button 
                                  onClick={() => submitReply(rating.id)}
                                  disabled={!replyText[rating.id]}
                                  style={{
                                      background: replyText[rating.id] ? 'var(--primary-gradient)' : 'var(--bg-root)',
                                      color: replyText[rating.id] ? 'white' : 'var(--text-muted)',
                                      border: replyText[rating.id] ? 'none' : '1px solid var(--border-subtle)',
                                      padding: '0 20px', borderRadius: '24px', cursor: replyText[rating.id] ? 'pointer' : 'default',
                                      fontWeight: 600, transition: 'all 0.2s'
                                  }}
                              >
                                  Send
                              </button>
                          </div>
                      ) : (
                          <div style={{
                              padding: '12px', background: 'rgba(99, 102, 241, 0.1)', 
                              borderRadius: '12px', color: 'var(--primary)', fontSize: '0.9rem',
                              textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}>
                              🔒 Waiting for others to join the conversation before you can reply.
                          </div>
                      )}
                  </div>
              </div>
          )}
        </div>
      );
      })}
    </div>
    
    <PremiumModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        {...modalConfig}
    />
    </div>
  );
}
