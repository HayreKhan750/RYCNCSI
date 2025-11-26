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

  // Fetch Data
  useEffect(() => {
    if (!instructor) {
        dispatch(fetchInstructors());
    }
    // Fetch feedbacks for this instructor to show reviews
    dispatch(fetchFeedbacks({ instructorId }));
    
    // Fetch my feedbacks to check if I already rated
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

  const handleSubmit = async () => {
    if (ratingValue === 0) return alert("Please select a star rating");
    if (!user) return alert("You must be logged in to rate");

    const ratingData = {
      instructorId,
      studentId: user.uid,
      studentName: user.displayName,
      ratingValue,
      rating: ratingValue, // Alias for service compatibility
      courseId: 'general', // Default course ID since we are rating instructor directly
      tags: selectedTags,
      feedback,
      timestamp: Date.now()
    };

    try {
      if (existingRating) {
          await dispatch(updateFeedback({ id: existingRating.id, updates: ratingData })).unwrap();
          alert("Rating updated successfully!");
      } else {
          await dispatch(submitFeedback(ratingData)).unwrap();
          alert("Rating submitted successfully!");
      }
      navigate('/dashboard');
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
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
      <Header />
      <div className="rating-page-container">
      {/* Header Section */}
      <div className="instructor-header glass-card">
        <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
        </button>
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
          <h2>{existingRating ? "Edit Your Rating" : "Rate this Instructor"}</h2>
          
          <div className="form-group">
            <label>Overall Rating</label>
            <StarRating rating={ratingValue} setRating={setRatingValue} size={40} />
          </div>

          <div className="form-group">
            <label>What was your experience like?</label>
            <TagSelector selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
          </div>

          <div className="form-group">
            <label>Detailed Feedback</label>
            <textarea
              className="feedback-input"
              placeholder="Tell students about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={5}
            />
            <div className="char-counter">{feedback.length} chars</div>
          </div>

          <button 
            className="submit-rating-btn" 
            onClick={handleSubmit} 
            disabled={submitting}
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
    </div>
  );
};

export default RatingPage;
