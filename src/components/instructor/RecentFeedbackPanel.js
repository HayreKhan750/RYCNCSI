import React, { useState } from 'react';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import ReplyModal from './ReplyModal';

// Helper for sentiment badge
const SentimentBadge = ({ sentiment }) => {
    let color = 'bg-slate-100 text-slate-600';
    if (sentiment === 'positive') color = 'bg-emerald-100 text-emerald-700';
    if (sentiment === 'constructive') color = 'bg-amber-100 text-amber-700';
    if (sentiment === 'negative') color = 'bg-rose-100 text-rose-700';

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${color}`}>
            {sentiment || 'Neutral'}
        </span>
    );
};

const FeedbackCard = ({ feedback, onReply }) => {
    const rating = Number(feedback.rating || 0);

    return (
        <div className="feedback-card-premium">
            <div className="fc-header">
                <div className="flex items-center gap-2">
                    <span className="fc-rating-star">★ {rating.toFixed(1)}</span>
                    <SentimentBadge sentiment={feedback.sentiment || (rating >= 4 ? 'positive' : 'constructive')} />
                </div>
                <span className="fc-date">
                    {new Date(feedback.createdAt || feedback.timestamp).toLocaleDateString()}
                </span>
            </div>

            <p className="fc-text">
                "{feedback.feedback || feedback.text}"
            </p>

            <div className="fc-tags">
                {(feedback.tags || ['Clarty', 'Pacing']).slice(0, 3).map((tag, i) => (
                    <span key={i} className="fc-tag">#{tag}</span>
                ))}
            </div>

            <div className="fc-footer">
                <div className="fc-actions">
                    <span className="text-xs text-slate-400">
                        {feedback.likes || 0} found helpful
                    </span>
                </div>
                <button onClick={() => onReply(feedback)} className="btn-reply-link">
                    Reply
                </button>
            </div>
        </div>
    );
};

const RecentFeedbackPanel = () => {
    const { feedbacks, loading, postReply } = useInstructorProfile();
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter valid reviews (has text) and sort by newest
    const recentReviews = (feedbacks || [])
        .filter(f => f.feedback || f.text) // Compatibility with both schemas
        .sort((a,b) => new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp))
        .slice(0, 3);

    const handleReplyClick = (feedback) => {
        setSelectedFeedback(feedback);
        setIsModalOpen(true);
    };

    const handleReplySubmit = async (feedbackId, replyData) => {
        const success = await postReply(feedbackId, replyData);
        if (success) {
            // Toast success could go here
        }
        return success;
    };

    if (loading) return <div className="animate-pulse h-32 bg-slate-100 rounded-xl" />;
    
    if (recentReviews.length === 0) {
        return (
            <div className="empty-feedback-premium">
                <div className="text-4xl mb-2">📭</div>
                <p>No feedback available yet.</p>
                <span className="text-xs mt-2">Share your profile link to get reviews</span>
            </div>
        );
    }

    return (
        <div className="feedback-list-premium">
            {recentReviews.map((review) => (
                <FeedbackCard 
                    key={review.id} 
                    feedback={review} 
                    onReply={handleReplyClick} 
                />
            ))}

            <ReplyModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                feedback={selectedFeedback}
                onSubmit={handleReplySubmit}
            />
        </div>
    );
};

export default RecentFeedbackPanel;
