import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructors } from '../store/slices/instructorSlice';
import { fetchFeedbacks, submitFeedback, updateFeedback } from '../store/slices/feedbackSlice';
import { selectInstructorById } from '../store/selectors/instructorSelectors';
import { selectFeedbacksByStudentId } from '../store/selectors/feedbackSelectors';
import StarRating from '../components/rating/StarRating';
import TagSelector from '../components/rating/TagSelector';
import ReviewList from '../components/rating/ReviewList';
import Header from '../components/common/Header';
import '../components/student-dashboard/StudentDashboard.css';
import '../styles/RatingPage.css';

import PremiumModal from '../components/common/PremiumModal';

const RatingPage = () => {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  const instructor = useSelector((state) => selectInstructorById(state, instructorId));
  const myFeedbacks = useSelector((state) => selectFeedbacksByStudentId(state, user?.uid));
  const { submitting } = useSelector((state) => state.feedbacks);
  
  const [ratingValue, setRatingValue] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [existingRating, setExistingRating] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

  // Fetch Data
  useEffect(() => {
    if (!instructor) {
        dispatch(fetchInstructors());
    }
    dispatch(fetchFeedbacks({ instructorId }));
    if (user?.uid) {
        dispatch(fetchFeedbacks({ studentId: user.uid }));
    }
  }, [dispatch, instructorId, user, instructor]);

  // Check for existing rating
  useEffect(() => {
      if (myFeedbacks && instructorId) {
          const found = myFeedbacks.find(f => f.instructorId === instructorId);
          if (found) {
              setExistingRating(found);
              setRatingValue(found.ratingValue);
              setSelectedTags(found.tags || []);
              setFeedback(found.feedback || '');
          }
      }
  }, [myFeedbacks, instructorId]);

  const showModal = (title, message, type = 'alert', onConfirm = null) => {
      setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const handleSubmit = async () => {
    if (ratingValue === 0) return showModal("Rating Required", "Please select a star rating before submitting.", "alert");
    if (!user) return showModal("Login Required", "You must be logged in to rate an instructor.", "alert");

    const ratingData = {
      instructorId,
      studentId: user.uid,
      studentName: user.displayName,
      ratingValue,
      rating: ratingValue,
      courseId: 'general',
      tags: selectedTags,
      feedback,
      timestamp: Date.now()
    };

    try {
      if (existingRating) {
          await dispatch(updateFeedback({ id: existingRating.id, updates: ratingData })).unwrap();
          showModal("Success!", "Your rating has been updated successfully.", "alert", () => navigate('/dashboard'));
      } else {
          await dispatch(submitFeedback(ratingData)).unwrap();
          showModal("Success!", "Your rating has been submitted successfully.", "alert", () => navigate('/dashboard'));
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      showModal("Error", "Failed to submit rating. Please try again.", "danger");
    }
  };

  // Get reviews for this instructor from store
  const reviews = useSelector((state) => 
      state.feedbacks.allIds
          .map(id => state.feedbacks.byId[id])
          .filter(f => f.instructorId === instructorId && !f.deleted)
  );

  if (!instructor) return <div className="rating-page-loading">Loading Instructor...</div>;

  return (
    <div className={`dashboard-wrapper ${isDark ? 'dark' : 'light'}`}>
      <Header title="Rate Instructor" showBack={true} />
      <div className="rating-page-container">
      {/* Header Section */}
      <div className="instructor-header glass-card">
        <div className="header-content">
          <div className="instructor-avatar-large">
            <img src={instructor.photoURL || `https://ui-avatars.com/api/?name=${instructor.name}&size=128`} alt={instructor.name} />
          </div>
          <div className="instructor-info">
            <h1>{instructor.name || instructor.instructorName || 'Instructor'}</h1>
            <p className="dept">{instructor.department || 'Department'}</p>
            <div className="rating-badge">
              <span className="star-icon">⭐</span>
              <span className="rating-score">{instructor.rating?.toFixed(1) || 'New'}</span>
              <span className="rating-count">({instructor.reviews || 0} ratings)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rating-content-grid">
        {/* Rating Form */}
        <div className="rating-form-section glass-card">
          <h2 style={{ fontSize: '1.8rem', marginBottom: '24px', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {existingRating ? "Edit Your Rating" : "Rate this Instructor"}
          </h2>
          
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>Overall Rating</label>
            <div style={{ background: 'var(--bg-root)', padding: '16px', borderRadius: '16px', display: 'inline-block', border: '1px solid var(--border-subtle)' }}>
                <StarRating rating={ratingValue} setRating={setRatingValue} size={40} />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>What was your experience like?</label>
            <TagSelector selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>Detailed Feedback</label>
            <textarea
              className="feedback-input premium-input"
              placeholder="Tell students about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
              style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-root)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
              }}
              onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1)';
              }}
              onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-subtle)';
                  e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.05)';
              }}
            />
            <div className="char-counter" style={{ textAlign: 'right', marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {feedback.length} chars
            </div>
          </div>

          <button 
            className="action-btn-premium" 
            onClick={handleSubmit} 
            disabled={submitting}
            style={{ marginTop: '16px', fontSize: '1.1rem', padding: '16px' }}
          >
            {submitting ? "Submitting..." : (existingRating ? "Update Rating" : "Submit Rating")}
          </button>
        </div>

        {/* Reviews List */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h3>Student Reviews</h3>
          </div>
          <ReviewList reviews={reviews} />
        </div>
      </div>
      </div>

      <PremiumModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={() => {
            if (modalConfig.onConfirm) modalConfig.onConfirm();
            setModalConfig({ ...modalConfig, isOpen: false });
        }}
        confirmText="OK"
      />
    </div>
  );
};

export default RatingPage;
