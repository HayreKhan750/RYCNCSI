import React, { useState, useMemo } from 'react';
import useInstructorProfile from '../../hooks/useInstructorProfile';
import ReviewsFilterBar from './ReviewsFilterBar';
import ReviewCard from './ReviewCard';
import ReplyModal from './ReplyModal';
import Header from '../common/Header';

const InstructorReviewsPage = () => {
    const { feedbacks, loading, postReply } = useInstructorProfile();
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [isReplyOpen, setIsReplyOpen] = useState(false);
    
    // Filtering State
    const [filters, setFilters] = useState({
        rating: 'all', // all, positive, critical
        course: 'all', 
        sort: 'newest'
    });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleReplyClick = (feedback) => {
        setSelectedFeedback(feedback);
        setIsReplyOpen(true);
    };

    const handleReplySubmit = async (id, data) => {
        await postReply(id, data);
        // Optimistic update handled by hook usually, or we can force reload.
    };

    // Filter Logic
    const filteredReviews = useMemo(() => {
        if (!feedbacks) return [];
        
        return feedbacks.filter(review => {
            // Rating Filter
            const r = Number(review.rating);
            if (filters.rating === 'positive' && r < 4) return false;
            if (filters.rating === 'critical' && r > 3) return false;

            // Course Filter (Mock ID check)
            if (filters.course !== 'all' && review.courseId !== filters.course) return false;

            return true;
        }).sort((a,b) => {
            // Sort Logic
            const dateA = new Date(a.createdAt || a.timestamp);
            const dateB = new Date(b.createdAt || b.timestamp);
            return dateB - dateA; // Newest first
        });
    }, [feedbacks, filters]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="reviews-page-container">
             <Header title="Reviews" />
             
             <div className="reviews-content-wrapper">
                 {/* Page Header */}
                 <div className="reviews-page-header">
                     <h1 className="page-title-xl">Reviews</h1>
                     <p className="page-subtitle-lg">
                         Manage student feedback and ratings from all your courses.
                     </p>
                 </div>

                 {/* Filters */}
                 <ReviewsFilterBar filters={filters} onFilterChange={handleFilterChange} />

                 {/* Reviews List */}
                 <div className="reviews-list-stack">
                     {filteredReviews.length > 0 ? (
                         filteredReviews.map(review => (
                             <ReviewCard 
                                key={review.id} 
                                review={review} 
                                onReply={handleReplyClick} 
                             />
                         ))
                     ) : (
                         <div className="empty-reviews-state">
                             <div className="empty-icon-lg">🔍</div>
                             <h3 className="empty-title">No reviews found</h3>
                             <p className="empty-subtitle">Try adjusting your filters</p>
                         </div>
                     )}
                 </div>
             </div>

             <ReplyModal 
                isOpen={isReplyOpen}
                onClose={() => setIsReplyOpen(false)}
                feedback={selectedFeedback}
                onSubmit={handleReplySubmit}
             />
        </div>
    );
};

export default InstructorReviewsPage;
