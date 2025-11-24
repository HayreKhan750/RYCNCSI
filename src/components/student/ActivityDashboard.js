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
    <div className="activity-feed-premium" style={{display:'flex', flexDirection:'column', gap: 24}}>
      {ratings.map((rating) => (
        <div key={rating.id} className="premium-card activity-card-premium" style={{flexDirection:'column', padding: 0, overflow:'visible'}}>
          <div className="activity-header-premium" style={{padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <div className="activity-meta">
                <span className="activity-type" style={{background:'rgba(99, 102, 241, 0.1)', color:'#818cf8', padding:'4px 12px', borderRadius:20, fontSize:'0.8rem', fontWeight:600}}>Rated Instructor</span>
                <span className="activity-date" style={{marginLeft: 12, opacity: 0.5, fontSize:'0.85rem'}}>
                    {rating.createdAt?.toDate ? rating.createdAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
             </div>
             <div className="activity-rating" style={{fontWeight:'800', color:'#fbbf24', fontSize:'1.4rem', textShadow:'0 0 10px rgba(251, 191, 36, 0.3)'}}>
                {rating.rating || rating.overall} ★
             </div>
          </div>
          
          <div className="activity-content" style={{padding: '24px'}}>
             <h4 style={{cursor:'pointer', fontSize:'1.2rem', margin:'0 0 8px', color:'white'}} onClick={() => navigate(`/instructor/${rating.instructorId}`)}>
                {rating.instructorName}
             </h4>
             <p className="dept-name" style={{opacity:0.6, fontSize:'0.9rem', marginBottom:16, textTransform:'uppercase', letterSpacing:'0.5px'}}>
                {rating.deptName || rating.courseTitle}
             </p>
             
             {rating.comment && (
                 <div className="activity-comment" style={{background:'rgba(0,0,0,0.2)', padding:'16px', borderRadius:'12px', fontStyle:'italic', borderLeft:'3px solid var(--neon-primary)'}}>"{rating.comment}"</div>
             )}
             
             {rating.tags && (
                 <div style={{display:'flex', gap:8, marginTop:16, flexWrap:'wrap'}}>
                    {rating.tags.map(tag => (
                        <span key={tag} style={{fontSize:'0.75rem', padding:'6px 14px', borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
                            #{tag}
                        </span>
                    ))}
                 </div>
             )}
          </div>

          <div className="activity-actions" style={{padding: '16px 24px', background:'rgba(0,0,0,0.1)', display:'flex', gap: 12, borderTop:'1px solid rgba(255,255,255,0.05)'}}>
             <button className="action-btn-premium" onClick={() => handleReaction(rating.id, 'like')} style={{background:'transparent', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                👍 {rating.likesCount || 0}
             </button>
             <button className="action-btn-premium" onClick={() => handleReaction(rating.id, 'dislike')} style={{background:'transparent', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                👎 {rating.dislikesCount || 0}
             </button>
             <button className="action-btn-premium" onClick={() => toggleReplies(rating.id)} style={{background:'transparent', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
                💬 {rating.replies?.length || 0} Replies
             </button>
             <button className="action-btn-premium secondary" style={{marginLeft:'auto', color:'#ef4444', background:'transparent', border:'none', cursor:'pointer'}} onClick={() => handleFlag(rating.id)}>
                🚩 Flag
             </button>
          </div>

          {/* Threaded Replies View */}
          {expandedId === rating.id && (
              <div className="replies-section" style={{padding: '0 24px 24px', background:'rgba(0,0,0,0.1)'}}>
                  {rating.replies && rating.replies.length > 0 ? (
                      rating.replies.map((reply, idx) => (
                          <div key={idx} style={{marginTop: 16, paddingLeft: 16, borderLeft: '2px solid var(--neon-primary)'}}>
                              <div style={{fontSize:'0.85rem', fontWeight:'bold', marginBottom: 4, color:'var(--neon-primary)'}}>{reply.authorName || 'User'}</div>
                              <div style={{fontSize:'0.9rem', opacity: 0.9}}>{reply.text}</div>
                              <div style={{fontSize:'0.75rem', opacity: 0.5, marginTop: 4}}>{new Date(reply.createdAt).toLocaleDateString()}</div>
                          </div>
                      ))
                  ) : (
                      <div style={{opacity: 0.6, fontStyle: 'italic', padding:'16px 0'}}>No replies yet. Be the first to reply!</div>
                  )}
              </div>
          )}
        </div>
      ))}
    </div>
    </div>
  );
}
