import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedbacks } from '../../store/slices/feedbackSlice';
import { selectFeedbacksByStudentId, selectFeedbackLoading } from '../../store/selectors/feedbackSelectors';
import SkeletonLoader from '../common/SkeletonLoader';

export default function MyFeedback({ user }) {
  const dispatch = useDispatch();
  const ratings = useSelector((state) => selectFeedbacksByStudentId(state, user?.uid));
  const loading = useSelector(selectFeedbackLoading);
  const [filter, setFilter] = useState('all'); // 'all', 'replied'

  useEffect(() => {
    if (user?.uid) {
        dispatch(fetchFeedbacks({ studentId: user.uid }));
    }
  }, [user, dispatch]);

  const activeRatings = ratings.filter(r => !r.deleted);
  
  const filteredRatings = activeRatings.filter(r => {
      if (filter === 'replied') return r.replies && r.replies.length > 0;
      return true;
  });

  if (loading && ratings.length === 0) {
      return (
          <div className="my-feedback-page">
              <SkeletonLoader height="60px" width="200px" style={{marginBottom: 30}} />
              {[1,2,3].map(i => <SkeletonLoader key={i} height="150px" borderRadius="16px" style={{marginBottom: 20}} />)}
          </div>
      );
  }

  return (
    <div className="my-feedback-page fade-in">
      <div className="feedback-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 30}}>
          <div>
            <h2 style={{margin:0, fontSize:'1.8rem', background:'linear-gradient(135deg, var(--primary) 0%, var(--accent-pink) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Feedback & Replies</h2>
            <p style={{margin:'8px 0 0', opacity:0.7}}>Track your interactions and instructor responses.</p>
          </div>
          
          <div className="filter-pills" style={{display:'flex', gap:10, background:'var(--bg-elevated)', padding:5, borderRadius:30, border:'1px solid var(--border-subtle)'}}>
              <button 
                onClick={() => setFilter('all')}
                style={{
                    background: filter === 'all' ? 'var(--primary)' : 'transparent',
                    color: filter === 'all' ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.3s'
                }}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('replied')}
                style={{
                    background: filter === 'replied' ? 'var(--primary)' : 'transparent',
                    color: filter === 'replied' ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.3s'
                }}
              >
                Replied
              </button>
          </div>
      </div>

      <div className="feedback-list" style={{display:'flex', flexDirection:'column', gap: 24}}>
        {filteredRatings.map(rating => (
          <div key={rating.id} className="glass-card feedback-card" style={{padding: 0, overflow:'hidden'}}>
             {/* Header Section */}
             <div style={{padding: '24px 24px 16px', borderBottom: '1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div style={{display:'flex', gap: 16}}>
                    <div className="premium-avatar-small" style={{width:50, height:50, fontSize:'1.2rem'}}>
                        {(rating.instructorName || 'T').charAt(0)}
                    </div>
                    <div>
                        <h4 style={{margin:0, fontSize:'1.1rem', color:'var(--text-primary)'}}>{rating.instructorName}</h4>
                        <p style={{margin:'4px 0 0', fontSize:'0.9rem', color:'var(--primary)', fontWeight:500}}>{rating.courseTitle}</p>
                        <span style={{fontSize:'0.8rem', opacity:0.6}}>{new Date(rating.timestamp || rating.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="rating-badge" style={{background:'rgba(251, 191, 36, 0.1)', color:'#fbbf24', padding:'6px 12px', borderRadius:12, fontWeight:700, border:'1px solid rgba(251, 191, 36, 0.2)'}}>
                    {rating.rating} ★
                </div>
             </div>

             {/* Content Section */}
             <div style={{padding: '24px'}}>
                 <div style={{background:'var(--bg-root)', padding: 20, borderRadius: 16, position:'relative'}}>
                    <span style={{position:'absolute', top:-10, left:20, background:'var(--bg-elevated)', padding:'0 10px', fontSize:'0.8rem', color:'var(--text-secondary)', fontWeight:600}}>Your Review</span>
                    <p style={{margin:0, fontStyle:'italic', color:'var(--text-primary)', lineHeight:1.6}}>"{rating.feedback}"</p>
                 </div>

                 {/* Replies Section */}
                 {rating.replies && rating.replies.length > 0 ? (
                     <div style={{marginTop: 24, paddingLeft: 20, borderLeft:'2px solid var(--primary)'}}>
                         {rating.replies.map((reply, idx) => (
                             <div key={idx} style={{marginBottom: 16}}>
                                 <div style={{display:'flex', alignItems:'center', gap: 8, marginBottom: 8}}>
                                     <span style={{fontWeight:700, color:'var(--primary)', fontSize:'0.9rem'}}>Instructor Reply</span>
                                     <span style={{fontSize:'0.8rem', opacity:0.5}}>{new Date(reply.timestamp || Date.now()).toLocaleDateString()}</span>
                                 </div>
                                 <p style={{margin:0, fontSize:'0.95rem', color:'var(--text-secondary)'}}>{reply.content || reply.text || reply}</p>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div style={{marginTop: 20, display:'flex', alignItems:'center', gap: 8, opacity: 0.5, fontSize:'0.9rem'}}>
                         <span>⏳</span>
                         <span>Waiting for instructor reply...</span>
                     </div>
                 )}
             </div>
             
             {/* Footer Actions */}
             <div style={{padding: '16px 24px', background:'rgba(0,0,0,0.02)', display:'flex', gap: 20, fontSize:'0.9rem', color:'var(--text-secondary)'}}>
                 <span style={{display:'flex', alignItems:'center', gap:6}}>👍 {rating.likes || 0} Helpful</span>
                 <span style={{display:'flex', alignItems:'center', gap:6}}>💬 {rating.replies?.length || 0} Replies</span>
             </div>
          </div>
        ))}

        {filteredRatings.length === 0 && (
            <div className="empty-state" style={{textAlign:'center', padding: 60, background:'var(--bg-elevated)', borderRadius:24, border:'1px dashed var(--border-subtle)'}}>
                <div style={{fontSize: 40, marginBottom: 20}}>📭</div>
                <h3 style={{margin:0, color:'var(--text-primary)'}}>No feedback found</h3>
                <p style={{color:'var(--text-secondary)'}}>
                    {filter === 'replied' ? "You haven't received any replies yet." : "You haven't submitted any feedback yet."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
}
