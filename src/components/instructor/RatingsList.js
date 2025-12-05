import React, { useState } from 'react';
import useContentModeration from '../../hooks/useContentModeration';

export default function RatingsList({ ratings, searchTerm, repliesByFeedback, onPostReply, user }) {
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyParents, setReplyParents] = useState({});

  const filteredRatings = ratings.filter(rating => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      rating.courseTitle?.toLowerCase().includes(search) ||
      rating.courseNo?.toLowerCase().includes(search) ||
      rating.feedback?.toLowerCase().includes(search)
    );
  });

  const handleReplyChange = (feedbackId, text) => {
    setReplyDrafts((prev) => ({ ...prev, [feedbackId]: text }));
  };

  const { validateContent } = useContentModeration();

  const handleReplySubmit = async (feedbackId) => {
    const text = (replyDrafts[feedbackId] || '').trim();
    const parentId = replyParents[feedbackId] || null;
    if (!text) return;
    
    // Validate Content
    if (!validateContent(text)) return;

    await onPostReply(feedbackId, text, parentId);
    
    // Clear draft
    setReplyDrafts((prev) => ({ ...prev, [feedbackId]: '' }));
    setReplyParents((prev) => ({ ...prev, [feedbackId]: null }));
  };

  return (
    <div className="ratings-section">
      <h3>Student Ratings & Feedback</h3>
      {filteredRatings.length === 0 ? (
        <div className="empty-state">
          <p>No ratings received yet.</p>
        </div>
      ) : (
        <div className="ratings-list">
          {filteredRatings.map((rating, index) => (
            <div key={rating.id || index} className="rating-card">
              <div className="rating-header">
                <h4>{rating.courseTitle}</h4>
                <span className="rating-stars">
                  {Array(5).fill(0).map((_, i) => (
                    <span key={i} className={i < rating.rating ? 'star-filled' : 'star-empty'}>
                      ★
                    </span>
                  ))}
                  <span className="rating-value">({rating.rating}/5)</span>
                </span>
              </div>
              <p><strong>Course No:</strong> {rating.courseNo}</p>
              {rating.feedback && (
                <div className="rating-feedback">
                  <strong>Feedback:</strong>
                  <p>{rating.feedback}</p>
                </div>
              )}
              <p className="rating-date">
                Rated on: {new Date(rating.timestamp).toLocaleDateString()}
              </p>
              
              {/* Replies Thread */}
              <div className="replies-section" style={{ marginTop: '12px' }}>
                <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Discussion</h4>
                <RepliesThread 
                    ratingId={rating.id}
                    replies={repliesByFeedback[rating.id] || []}
                    onReplyClick={(replyId) => setReplyParents(prev => ({...prev, [rating.id]: replyId}))}
                />

                {/* Reply Box */}
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    rows={2}
                    placeholder={replyParents[rating.id] ? 'Replying to a specific comment...' : 'Add a reply...'}
                    className="search-input"
                    value={replyDrafts[rating.id] || ''}
                    onChange={(e) => handleReplyChange(rating.id, e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                    {replyParents[rating.id] && (
                      <button
                        type="button"
                        className="unenroll-button"
                        onClick={() => setReplyParents((prev) => ({ ...prev, [rating.id]: null }))}
                      >
                        Clear Reply Target
                      </button>
                    )}
                    <button
                      type="button"
                      className="enroll-button"
                      onClick={() => handleReplySubmit(rating.id)}
                    >
                      Post Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper component for recursive replies
function RepliesThread({ ratingId, replies, onReplyClick }) {
    if (!replies.length) {
        return <p style={{ fontSize: '12px', opacity: 0.8 }}>No replies yet. Start the discussion below.</p>;
    }

    const childrenByParent = replies.reduce((acc, r) => {
        if (!r.parentReplyId || r.deleted) return acc;
        if (!acc[r.parentReplyId]) acc[r.parentReplyId] = [];
        acc[r.parentReplyId].push(r);
        return acc;
    }, {});

    const roots = replies.filter((r) => !r.parentReplyId && !r.deleted);

    const renderReply = (reply, depth = 0) => {
        const children = childrenByParent[reply.id] || [];
        return (
        <div
            key={reply.id}
            style={{
            marginTop: '6px',
            marginLeft: depth * 12,
            padding: '6px 8px',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div>
                <strong style={{ fontSize: '12px' }}>{reply.authorName || 'User'}</strong>
                <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: 6 }}>
                {reply.authorRole === 'instructor' ? 'Instructor' : reply.authorRole === 'student' ? 'Student' : ''}
                </span>
            </div>
            <button
                type="button"
                className="link-button"
                style={{ fontSize: '11px', opacity: 0.8 }}
                onClick={() => onReplyClick(reply.id)}
            >
                Reply
            </button>
            </div>
            <p style={{ fontSize: '12px', marginTop: 4 }}>{reply.text}</p>
            {children.map((child) => renderReply(child, depth + 1))}
        </div>
        );
    };

    return roots.map((root) => renderReply(root, 0));
}
