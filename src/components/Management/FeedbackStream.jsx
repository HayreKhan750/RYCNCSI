import React from 'react';

const FeedbackStream = ({ feedback = [] }) => {
  const [expanded, setExpanded] = React.useState(false);
  
  // Use passed props
  const allFeedback = feedback.length > 0 ? feedback : [];
  const displayFeedback = expanded ? allFeedback : allFeedback.slice(0, 5);

  return (
    <div className="glass-panel feedback-stream">
        <div className="panel-header">
             <h2 className="panel-title">Recent Feedback</h2>
             {allFeedback.length > 5 && (
                 <button 
                    className="link-btn" 
                    style={{ fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setExpanded(!expanded)}
                 >
                    {expanded ? 'Show Less' : 'View All'}
                 </button>
             )}
        </div>

        <div className="stream-list custom-scrollbar">
            {displayFeedback.map((item, idx) => (
                <div key={item.id || idx} className="stream-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="tag" style={{ fontWeight: 700 }}>{item.department || 'General'}</span>
                            <div className="rating-stars">
                                {'★'.repeat(Math.round(item.rating || 0))}
                                <span style={{ opacity: 0.3 }}>{'★'.repeat(5 - Math.round(item.rating || 0))}</span>
                            </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{item.time || 'recent'}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{item.feedback || item.comment || 'No comment'}"</p>
                </div>
            ))}
            {allFeedback.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No recent feedback found.</p>}
        </div>
    </div>
  );
};

export default FeedbackStream;
