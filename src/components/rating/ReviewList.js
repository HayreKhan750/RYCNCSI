import React from 'react';
import StarRating from './StarRating';
import TagSelector from './TagSelector';
import { toggleLikeReview, replyToReview } from '../../utils/ratingService';
import { useUser } from '../../contexts/UserContext';

const ReviewList = ({ reviews, setReviews }) => {
  const { user } = useUser();

  const handleLike = async (reviewId, currentLikes) => {
    if (!user) return alert("Please login to like reviews");
    
    // Optimistic update
    const updatedReviews = reviews.map(r => {
      if (r.id === reviewId) {
        return { ...r, likes: (r.likes || 0) + 1 };
      }
      return r;
    });
    setReviews(updatedReviews);

    await toggleLikeReview(reviewId, user.uid, true);
  };

  if (!reviews || reviews.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', opacity: 0.7 }}>No reviews yet. Be the first to rate!</div>;
  }

  return (
    <div className="review-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {reviews.map((review) => (
        <div key={review.id} className="glass-card review-card" style={{ padding: '20px', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ddd', overflow: 'hidden' }}>
                 {/* Placeholder for student photo if available in review data, else generic */}
                 <img src={`https://ui-avatars.com/api/?name=${review.studentId}&background=random`} alt="Student" style={{ width: '100%', height: '100%' }} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Student</div>
                <div style={{ fontSize: '12px', opacity: 0.6 }}>{review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString() : 'Just now'}</div>
              </div>
            </div>
            <StarRating rating={review.ratingValue} readOnly size={20} />
          </div>

          <TagSelector selectedTags={review.tags || []} readOnly />

          <p style={{ margin: '15px 0', lineHeight: '1.6' }}>
            {review.feedback}
          </p>

          <div style={{ display: 'flex', gap: '15px', marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            <button 
              onClick={() => handleLike(review.id, review.likes)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'inherit', opacity: 0.8 }}
            >
              <span>👍</span> {review.likes || 0}
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'inherit', opacity: 0.8 }}>
              <span>💬</span> Reply
            </button>
             <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', color: 'inherit', opacity: 0.8, marginLeft: 'auto' }}>
              <span>🚩</span> Report
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
