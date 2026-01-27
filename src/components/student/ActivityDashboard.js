import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toggleLike, addReply, flagFeedback, deleteFeedback, deleteReply } from '../../store/slices/feedbackSlice';
import { useNavigate } from 'react-router-dom';
import PremiumModal from '../common/PremiumModal';
import useContentModeration from '../../hooks/useContentModeration';

export default function ActivityDashboard({ ratings = [], isOwnProfile = false, user = {}, userReactions: propUserReactions = {} }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'confirm' });
  const [replyText, setReplyText] = useState({});
  const { validateContent } = useContentModeration();
  
  // Optimistic UI state
  const [optimisticRatings, setOptimisticRatings] = useState(ratings);
  const [userReactions, setUserReactions] = useState(propUserReactions); 

  // Sync props to state when props change
  React.useEffect(() => {
    setOptimisticRatings(ratings);
  }, [ratings]);

  React.useEffect(() => {
    setUserReactions(propUserReactions);
  }, [propUserReactions]);
  
  // Helper for Time
  const timeAgo = (date) => {
      if (!date) return 'Just now';
      // Handle Firestore Timestamp or Date object or string
      const d = (date && typeof date === 'object' && date.seconds) ? new Date(date.seconds * 1000) : new Date(date);
      const seconds = Math.floor((new Date() - d) / 1000);
      
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return Math.floor(seconds) + " seconds ago";
  };

  // Helper for Sorting Replies
  const getSortedReplies = (replies) => {
      if (!replies) return [];
      return [...replies].sort((a, b) => {
          const tA = (a.createdAt && a.createdAt.seconds) ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
          const tB = (b.createdAt && b.createdAt.seconds) ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
          return tA - tB;
      });
  };

  const handleReaction = async (feedbackId, type) => {
      if(!user?.uid) return;
      
      const ratingIndex = optimisticRatings.findIndex(r => r.id === feedbackId);
      if (ratingIndex === -1) return;
      const rating = optimisticRatings[ratingIndex];

      if (rating.studentId === user.uid) return;

      const currentReaction = userReactions[feedbackId];
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
        await dispatch(toggleLike({ feedbackId, userId: user.uid, isLike: type === 'like' })).unwrap();
      } catch (e) {
        console.error("Failed to toggle reaction", e);
      }
  };

  const handleDeleteRating = async (id) => {
      if (window.confirm("Are you sure you want to delete this rating?")) {
          try {
              await dispatch(deleteFeedback(id)).unwrap();
          } catch(e) { console.error(e); }
      }
  };

  const handleDeleteReply = async (feedbackId, replyId) => {
       if (window.confirm("Delete this reply?")) {
           try {
               await dispatch(deleteReply({ feedbackId, replyId })).unwrap();
           } catch(e) { console.error(e); }
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

      if (!validateContent(text)) return;

      const ratingIndex = optimisticRatings.findIndex(r => r.id === feedbackId);
      if (ratingIndex !== -1) {
          const newRatings = [...optimisticRatings];
          const target = { ...newRatings[ratingIndex] };
          
          const newReply = {
              id: Date.now().toString(),
              text: text,
              authorName: user.displayName || user.name || 'User',
              authorId: user.uid,
              createdAt: new Date().toISOString()
          };

          target.replies = [...(target.replies || []), newReply];
          newRatings[ratingIndex] = target;
          setOptimisticRatings(newRatings);
          setReplyText(prev => ({ ...prev, [feedbackId]: '' }));
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
      }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const filteredRatings = React.useMemo(() => {
    let result = [...optimisticRatings];

    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(r => 
            (r.instructorName && r.instructorName.toLowerCase().includes(lower)) ||
            (r.comment && r.comment.toLowerCase().includes(lower)) ||
            (r.feedback && r.feedback.toLowerCase().includes(lower)) ||
            (r.deptName && r.deptName.toLowerCase().includes(lower))
        );
    }

    result.sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        if (sortBy === 'oldest') return (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0) - (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        if (sortBy === 'highest') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'lowest') return (a.rating || 0) - (b.rating || 0);
        return 0;
    });

    return result;
  }, [optimisticRatings, searchTerm, sortBy]);

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
      <div className="glass-card" style={{
          padding: '12px 24px', 
          marginBottom: '24px', 
          display: 'flex', flexWrap: 'wrap', gap: '20px', 
          alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-elevated)', backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)', borderRadius: '50px',
      }}>
          <div className="search-wrapper" style={{flex: '1', minWidth: '200px', maxWidth: '400px', position: 'relative'}}>
              <span style={{position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, color: 'var(--text-primary)'}}>🔍</span>
              <input 
                  type="text" placeholder="Search your reviews..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="premium-input"
                  style={{
                      width: '100%', padding: '10px 16px 10px 40px', 
                      borderRadius: '50px', background: 'var(--bg-root)', 
                      border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                      fontSize: '0.95rem', outline: 'none'
                  }}
              />
          </div>
          
          <div className="sort-wrapper" style={{display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0}}>
              <label style={{color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500, whiteSpace: 'nowrap'}}>Sort:</label>
              <select 
                  value={sortBy} onChange={(e) => setSortBy(e.target.value)} 
                  className="premium-select"
                  style={{
                      padding: '8px 16px', borderRadius: '12px', background: 'transparent',
                      border: '1px solid var(--border-subtle)', color: 'var(--text-primary)',
                      fontWeight: '500', cursor: 'pointer', outline: 'none', fontSize: '0.9rem'
                  }}
              >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
              </select>
          </div>
      </div>

    <div className="activity-feed-premium" style={{display:'flex', flexDirection:'column', gap: 24}}>
      {filteredRatings.map((rating) => {
          const hasReplies = rating.replies && rating.replies.length > 0;
          const canReply = !isOwnProfile || hasReplies;
          const replies = getSortedReplies(rating.replies || []);

          return (
        <div key={rating.id} className="premium-card activity-card-premium" style={{
            flexDirection:'column', padding: 0, overflow:'hidden',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
            borderRadius: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)'
        }}>
          <div className="activity-header-premium" style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', 
              display:'flex', justifyContent:'space-between', alignItems:'center',
              background: 'linear-gradient(to right, rgba(255,255,255,0.02), transparent)'
          }}>
             <div className="activity-meta" style={{display:'flex', alignItems:'center'}}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%', 
                    background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', marginRight: 12, color: 'white'
                }}>
                    {(rating.instructorName || 'T').charAt(0)}
                </div>
                <div>
                    <h4 style={{margin:0, fontSize:'1.1rem', color:'var(--text-primary)', cursor:'pointer'}} onClick={() => navigate(`/instructor/${rating.instructorId}`)}>
                        {rating.instructorName || 'Instructor'}
                    </h4>
                    <span className="activity-date" style={{opacity: 0.5, fontSize:'0.85rem', color:'var(--text-secondary)'}}>
                        {timeAgo(rating.createdAt || rating.timestamp)}
                    </span>
                </div>
             </div>
             <div className="activity-rating" style={{
                 fontWeight:'800', color:'#fbbf24', fontSize:'1.4rem', 
                 background: 'rgba(251, 191, 36, 0.1)', padding: '4px 12px',
                 borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)'
             }}>
                {rating.rating || rating.overall} <span style={{fontSize:'1rem'}}>★</span>
             </div>
          </div>
          
          <div className="activity-content" style={{padding: '24px'}}>
             <p className="dept-name" style={{
                 opacity:0.7, fontSize:'0.85rem', marginBottom:12, 
                 textTransform:'uppercase', letterSpacing:'1px', fontWeight: 600, color: 'var(--primary)'
             }}>
                {rating.deptName || rating.courseTitle || 'General Course'}
             </p>
             
             {(rating.comment || rating.feedback) && (
                 <div className="activity-comment" style={{
                     background:'var(--bg-root)', padding:'20px', borderRadius:'16px', 
                     fontStyle:'italic', borderLeft:'4px solid var(--primary)',
                     color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '1.05rem'
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

          <div className="activity-actions" style={{
              padding: '16px 24px', background:'rgba(0,0,0,0.02)', 
              display:'flex', gap: 16, alignItems: 'center',
              borderTop:'1px solid var(--border-subtle)'
          }}>
             <div style={{display:'flex', gap: 12}}>
                 <button 
                    className={`glass-pill-btn like ${userReactions[rating.id] === 'like' ? 'active' : ''}`}
                    onClick={() => handleReaction(rating.id, 'like')} 
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '20px',
                        background: userReactions[rating.id] === 'like' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid ' + (userReactions[rating.id] === 'like' ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
                        color: userReactions[rating.id] === 'like' ? 'var(--primary)' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                 >
                    <span style={{fontSize:'1.1rem'}}>👍</span>
                    <span style={{fontSize:'0.85rem', fontWeight: 600}}>Like {rating.likesCount > 0 && `(${rating.likesCount})`}</span>
                 </button>

                 <button 
                     className={`glass-pill-btn dislike ${userReactions[rating.id] === 'dislike' ? 'active' : ''}`}
                    onClick={() => handleReaction(rating.id, 'dislike')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '20px',
                        background: userReactions[rating.id] === 'dislike' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid ' + (userReactions[rating.id] === 'dislike' ? '#ef4444' : 'rgba(255,255,255,0.1)'),
                        color: userReactions[rating.id] === 'dislike' ? '#ef4444' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                 >
                    <span style={{fontSize:'1.1rem'}}>👎</span>
                 </button>
                 
                 <button 
                    className={`glass-pill-btn reply ${expandedId === rating.id ? 'active' : ''}`}
                    onClick={() => toggleReplies(rating.id)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '20px',
                        background: expandedId === rating.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                 >
                    <span style={{fontSize:'1.1rem'}}>💬</span>
                    <span style={{fontSize:'0.85rem', fontWeight: 600}}>Reply {rating.replies?.length > 0 && `(${rating.replies.length})`}</span>
                 </button>
             </div>
                
             {isOwnProfile && (
                 <div style={{marginLeft:'auto', display:'flex', gap: 10}}>
                     <button 
                        className="circular-action-btn edit" 
                        style={{color: 'var(--primary)', borderColor: 'var(--primary)'}} 
                        onClick={() => navigate(`/rate/${rating.instructorId}`)}
                        title="Edit Rating"
                     >✏️</button>
                     <button
                        className="circular-action-btn delete"
                        style={{color: '#ef4444', borderColor: '#ef4444'}}
                        onClick={() => handleDeleteRating(rating.id)}
                        title="Delete Rating"
                     >🗑️</button>
                 </div>
             )}

             <button 
                className="circular-action-btn flag secondary" 
                style={{marginLeft: isOwnProfile ? '10px' : 'auto'}} 
                onClick={() => openFlagModal(rating.id)} title="Report"
             >🚩</button>
          </div>

          {expandedId === rating.id && (
              <div className="replies-section" style={{padding: '0 24px 24px', background:'rgba(0,0,0,0.02)'}}>
                  {replies.length > 0 ? (
                      <div style={{display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20}}>
                          {replies.map((reply, idx) => (
                              <div key={idx} style={{display: 'flex', gap: 12}}>
                                  <div style={{
                                      minWidth: 32, height: 32, borderRadius: '50%', 
                                      background: 'var(--bg-root)', border: '1px solid var(--border-subtle)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
                                      overflow: 'hidden' 
                                  }}>
                                      {/* Try to show image first if available (checking logic if needed), simplistic fallback here */}
                                      {/* If we had user photo here, we would use it. Assuming text fallback mainly for replies unless expanded logic exists. 
                                          Actually, let's just make sure if we DO implement images later, we use the policy.
                                          For now, simply ensuring logic remains robust. 
                                      */}
                                      {(reply.authorName || 'U').charAt(0)}
                                  </div>
                                  <div style={{flex: 1}}>
                                      <div style={{background: 'var(--bg-root)', padding: '12px 16px', borderRadius: '0 16px 16px 16px', border: '1px solid var(--border-subtle)'}}>
                                          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                                              <span style={{fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)'}}>{reply.authorName || 'User'}</span>
                                                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                                                      <span style={{fontSize: '0.75rem', opacity: 0.5}}>{timeAgo(reply.createdAt)}</span>
                                                      {(user?.uid === reply.authorId) && (
                                                          <button 
                                                              onClick={() => handleDeleteReply(rating.id, reply.id)}
                                                              style={{background:'none', border:'none', cursor:'pointer', fontSize:'0.7rem', opacity:0.5}}
                                                              title="Delete Reply"
                                                          >❌</button>
                                                      )}
                                                  </div>
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

                  <div style={{marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-subtle)'}}>
                      {canReply ? (
                          <div style={{display: 'flex', gap: 12}}>
                              <input 
                                  type="text" placeholder="Write a reply..." 
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
                              >Send</button>
                          </div>
                      ) : (
                          <div style={{
                              padding: '12px', background: 'rgba(99, 102, 241, 0.1)', 
                              borderRadius: '12px', color: 'var(--primary)', fontSize: '0.9rem',
                              textAlign: 'center', border: '1px solid rgba(99, 102, 241, 0.2)'
                          }}>🔒 Waiting for others to join the conversation before you can reply.</div>
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
