import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SentimentBadge = ({ sentiment }) => {
    const config = {
        positive: 'sentiment-badge positive',
        neutral: 'sentiment-badge neutral',
        constructive: 'sentiment-badge constructive',
        negative: 'sentiment-badge negative'
    };
    const styleClass = config[sentiment] || config.neutral;
    const icons = {
        positive: '😊', neutral: '😐', constructive: '🔧', negative: '😟'
    };

    return (
        <span className={styleClass}>
            <span>{icons[sentiment] || icons.neutral}</span>
            {sentiment}
        </span>
    );
};

const ReviewCard = ({ review, onReply }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Safety checks
    const rating = Number(review.rating || 0);
    const date = new Date(review.createdAt || review.timestamp).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const replies = review.replies || [];
    const hasReplies = replies.length > 0;

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="review-card-premium"
        >
            {/* Header */}
            <div className="review-card-header">
                <div className="review-info-group">
                    <div className={`rating-box ${
                        rating >= 4 ? 'high' : rating >= 3 ? 'mid' : 'low'
                    }`}>
                        {rating.toFixed(1)}
                    </div>
                    <div>
                        <h4 className="student-name">
                            {review.isAnonymous ? 'Anonymous Student' : (review.studentName || 'Student')}
                        </h4>
                        <div className="review-meta">
                            <span>{review.courseId || 'General Feedback'}</span>
                            <span>•</span>
                            <span>{date}</span>
                        </div>
                    </div>
                </div>
                
                <SentimentBadge sentiment={review.sentiment || (rating >= 4 ? 'positive' : 'constructive')} />
            </div>

            {/* Content */}
            <div className="review-content">
                <p className="review-text">
                    "{review.feedback || review.text}"
                </p>
                {/* Tags */}
                {review.tags && review.tags.length > 0 && (
                    <div className="review-tags">
                        {review.tags.map((tag, i) => (
                            <span key={i} className="review-tag">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="review-footer">
                <div className="review-footer-left">
                    <button 
                        className={`btn-view-replies ${hasReplies ? 'has-replies' : 'empty'}`}
                        onClick={() => hasReplies && setIsExpanded(!isExpanded)}
                        disabled={!hasReplies}
                    >
                        {hasReplies ? (isExpanded ? 'Hide Replies' : `View ${replies.length} Repli${replies.length > 1 ? 'es' : 'y'}`) : 'No replies yet'}
                    </button>
                    {!hasReplies && (
                         <span className="badge-needs-reply">Needs Reply</span>
                    )}
                </div>

                <button 
                    onClick={() => onReply(review)}
                    className="btn-reply-action"
                >
                    <span>↩️</span> Reply
                </button>
            </div>

            {/* Expandable Replies Section */}
            <AnimatePresence>
                {isExpanded && hasReplies && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="replies-wrapper"
                    >
                        <div className="replies-container">
                            {replies.map((reply, idx) => (
                                <div key={idx} className="reply-item">
                                    <div className="reply-avatar">
                                        🎓
                                    </div>
                                    <div>
                                        <div className="reply-meta">
                                            <span className="reply-author">You</span>
                                            <span className="reply-date">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="reply-text">{reply.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ReviewCard;
