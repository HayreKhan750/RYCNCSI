import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { submitRating, getInstructorRatings, getStudentRatingForInstructor } from '../utils/ratingService';
import StarRating from '../components/rating/StarRating';
import TagSelector from '../components/rating/TagSelector';
import ReviewList from '../components/rating/ReviewList';
import { useTheme } from '../contexts/ThemeContext';
import '../components/student-dashboard/StudentDashboard.css';
import '../styles/RatingPage.css';

const RatingPage = () => {
  const { instructorId } = useParams();
  const { user } = useUser();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingRatingId, setExistingRatingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!instructorId) return;

      try {
        // Fetch Instructor Details
        const instructorDoc = await getDoc(doc(db, 'users', instructorId));
        if (instructorDoc.exists()) {
          setInstructor(instructorDoc.data());
        } else {
          console.error("Instructor not found");
          // navigate('/dashboard'); // Optional redirect
        }

        // Fetch Reviews
        const fetchedReviews = await getInstructorRatings(instructorId);
        setReviews(fetchedReviews);

        // Check if user already rated
        if (user) {
          const existingRating = await getStudentRatingForInstructor(user.uid, instructorId);
          if (existingRating) {
            setExistingRatingId(existingRating.id);
            setRatingValue(existingRating.ratingValue);
            setSelectedTags(existingRating.tags || []);
            setFeedback(existingRating.feedback || '');
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [instructorId, user, navigate]);

  const handleSubmit = async () => {
    if (ratingValue === 0) return alert("Please select a star rating");
    if (!user) return alert("You must be logged in to rate");

    setSubmitting(true);
    try {
      const ratingData = {
        ratingValue,
        tags: selectedTags,
        feedback
      };

      await submitRating(instructorId, user.uid, ratingData, existingRatingId);
      
      alert("Rating submitted successfully!");
      navigate('/dashboard'); // Or back to instructor profile
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="rating-page-loading">Loading...</div>;
  if (!instructor) return <div className="rating-page-error">Instructor not found</div>;

  return (
    <div className={`dashboard-wrapper ${isDark ? 'dark' : 'light'}`}>
      <div className="rating-page-container">
      {/* Header Section */}
      <div className="instructor-header glass-card">
        <button className="back-dashboard-btn" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
        </button>
        <div className="header-content">
          <div className="instructor-avatar-large">
            <img src={instructor.photoURL || `https://ui-avatars.com/api/?name=${instructor.displayName}&size=128`} alt={instructor.displayName} />
          </div>
          <div className="instructor-info">
            <h1>{instructor.displayName}</h1>
            <p className="dept">{instructor.department || 'Department'}</p>
            <div className="rating-badge">
              <span className="star-icon">⭐</span>
              <span className="rating-score">{instructor.averageRating?.toFixed(1) || 'New'}</span>
              <span className="rating-count">({instructor.ratingCount || 0} ratings)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rating-content-grid">
        {/* Rating Form */}
        <div className="rating-form-section glass-card">
          <h2>{existingRatingId ? "Edit Your Rating" : "Rate this Instructor"}</h2>
          
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
            {submitting ? "Submitting..." : (existingRatingId ? "Update Rating" : "Submit Rating")}
          </button>
        </div>

        {/* Reviews List */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h3>Student Reviews</h3>
            {/* Sorting controls could go here */}
          </div>
          <ReviewList reviews={reviews} setReviews={setReviews} />
        </div>
      </div>
      </div>
    </div>
  );
};

export default RatingPage;
