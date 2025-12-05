import React, { useState } from 'react';
import useContentModeration from '../../hooks/useContentModeration';

export default function FeedbackPanel({ ratings, stats, onReply }) {
  const [replyText, setReplyText] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const { validateContent } = useContentModeration();

  const handleReplySubmit = async (ratingId) => {
      const text = replyText[ratingId];
      if (!text) return;

      // Validate Content
      if (!validateContent(text)) return;

      const success = await onReply(ratingId, text);
      if (success) {
          alert('Reply posted!');
          setReplyText(prev => ({ ...prev, [ratingId]: '' }));
      } else {
          alert('Failed to post reply.');
      }
  };

  return (
    <div className="glass-panel feedback-panel">
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
          <h3 style={{margin:0}}>Recent Feedback</h3>
          <button style={{background:'transparent', border:'none', color:'#3b82f6', cursor:'pointer'}}>View All</button>
      </div>

      <div className="feedback-section">
        <div className="reviews-list">
          {ratings.slice(0, 5).map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div style={{fontWeight:'bold'}}>{review.studentName || 'Student'} <span style={{opacity:0.5, fontWeight:'normal', fontSize:'0.8em'}}>{new Date(review.createdAt?.seconds * 1000).toLocaleDateString()}</span></div>
                <div className="review-stars">{'★'.repeat(Math.round(review.rating))}{'☆'.repeat(5 - Math.round(review.rating))}</div>
              </div>
              
              <div className="review-body">"{review.feedback}"</div>
              
              <div className="review-tags">
                 {review.tags?.map(tag => <span key={tag} className="tag-badge">{tag}</span>)}
              </div>

              <div className="review-actions">
                  <span>👍 {review.likesCount || 0}</span>
                  <span>👎 {review.dislikesCount || 0}</span>
                  <span 
                    style={{cursor:'pointer', color:'#3b82f6'}} 
                    onClick={() => setExpandedId(expandedId === review.id ? null : review.id)}
                  >
                      Reply {review.repliesCount > 0 && `(${review.repliesCount})`}
                  </span>
              </div>

              {expandedId === review.id && (
                  <div className="reply-area">
                      <input 
                        type="text" 
                        className="reply-input" 
                        placeholder="Write a reply..."
                        value={replyText[review.id] || ''}
                        onChange={(e) => setReplyText(prev => ({...prev, [review.id]: e.target.value}))}
                      />
                      <button className="action-btn-small" onClick={() => handleReplySubmit(review.id)}>Post Reply</button>
                  </div>
              )}
            </div>
          ))}
          {ratings.length === 0 && <p style={{opacity:0.5, textAlign:'center'}}>No feedback received yet.</p>}
        </div>

        {/* Highlights Panel */}
        <div className="glass-panel" style={{border:'none', background:'rgba(255,255,255,0.05)'}}>
            <h4 style={{marginTop:0}}>💡 AI Insights</h4>
            <div style={{fontSize:'0.9rem', opacity:0.8, lineHeight:1.6}}>
                <p><strong>Sentiment:</strong> {stats?.averageRating >= 4 ? 'Very Positive' : stats?.averageRating >= 3 ? 'Generally Positive' : 'Mixed'}</p>
                <p><strong>Key Strength:</strong> Students find your classes very {stats?.topTags?.[0] || 'engaging'} and appreciate your clarity.</p>
                <p><strong>Improvement Area:</strong> {stats?.averageRating < 4.5 ? 'Consider providing more examples in future lectures based on recent comments.' : 'Keep up the great work! Students love your teaching style.'}</p>
            </div>
        </div>
      </div>
    </div>
  );
}
