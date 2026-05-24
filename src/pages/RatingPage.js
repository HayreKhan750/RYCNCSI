import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstructors } from '../store/slices/instructorSlice';
import { fetchFeedbacks, submitFeedback, updateFeedback, deleteFeedback } from '../store/slices/feedbackSlice';
import { selectInstructorById } from '../store/selectors/instructorSelectors';
import { selectFeedbacksByStudentId } from '../store/selectors/feedbackSelectors';
import StarRating from '../components/rating/StarRating';
import TagSelector from '../components/rating/TagSelector';
import ReviewList from '../components/common/ReviewList';
import Header from '../components/common/Header';
import '../components/student-dashboard/StudentDashboard.css';
import '../styles/RatingPage.css';

import PremiumModal from '../components/common/PremiumModal';
import useContentModeration from '../hooks/useContentModeration';

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
  const [selectedCourse, setSelectedCourse] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', type: 'alert' });

  // Content Moderation Hook
  const { validateContent, checkSpelling, isChecking, suggestion, applySuggestion, dismissSuggestion } = useContentModeration();

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
              setSelectedCourse(found.courseId || 'general');
              setIsAnonymous(found.isAnonymous || found.anonymous || false);
          }
      }
  }, [myFeedbacks, instructorId]);

  const showModal = (title, message, type = 'alert', onConfirm = null) => {
      setModalConfig({ isOpen: true, title, message, type, onConfirm });
  };

  const handleSubmit = async () => {
    if (ratingValue === 0) return showModal("Rating Required", "Please select a star rating before submitting.", "alert");
    if (!user) return showModal("Login Required", "You must be logged in to rate an instructor.", "alert");

    // 1. Validate Content (Foul Language)
    const isValid = validateContent(feedback);
    if (!isValid) return; // Modal will be opened by the hook

    // 2. Check Spelling (AI) - Optional: Could be triggered by a separate button or here
    // For now, we'll just proceed if valid, but let's check spelling if user hasn't seen it
    // If we want to force spelling check, we can do it here. 
    // Let's assume we just want to block foul language for sure.
    
    const ratingData = {
      instructorId,
      studentId: user.uid,
      studentName: user.displayName,
      ratingValue,
      rating: ratingValue,
      courseId: selectedCourse,
      tags: selectedTags,
      feedback,
      anonymous: isAnonymous,
      isAnonymous: isAnonymous,
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
      showModal("Error", error.message || "Failed to submit rating. Please try again.", "danger");
    }
  };

  const handleDelete = () => {
      if (!existingRating) return;
      showModal(
          "Delete Rating?", 
          "Are you sure you want to delete your rating? This cannot be undone.", 
          "danger",
          async () => {
              try {
                  await dispatch(deleteFeedback(existingRating.id)).unwrap();
                  setExistingRating(null);
                  setRatingValue(0);
                  setFeedback('');
                  setSelectedTags([]);
                  showModal("Deleted", "Your rating has been removed.", "alert");
              } catch (error) {
                  console.error("Delete Error:", error);
                  showModal("Error", error.message || "Failed to delete rating.", "danger");
              }
          }
      );
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
            <img 
                src={instructor.profilePictureUrl || instructor.photoURL || `https://ui-avatars.com/api/?name=${instructor.fullName || instructor.name}&size=128`} 
                alt={instructor.name} 
                style={{objectFit: 'cover'}}
            />
          </div>
          <div className="instructor-info">
            <h1>{instructor.fullName || instructor.displayName || instructor.instructorName || instructor.name || 'Instructor'}</h1>
            <p className="dept">{instructor.department || 'Department'}</p>
            <div className="rating-badge">
              <span className="star-icon">⭐</span>
              <span className="rating-score">
                  {(instructor.avgRating || instructor.rating || instructor.ratingStats?.average || 0).toFixed(1)}
              </span>
              <span className="rating-count">
                  ({instructor.totalRatings || instructor.reviews || instructor.ratingStats?.totalRatings || 0} ratings)
              </span>
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
            <label style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>Which course did you take with this instructor?</label>
            <select 
              className="premium-input"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-root)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer'
              }}
            >
              <option value="general">General Feedback</option>
              {instructor.courses?.map((course, idx) => (
                <option key={idx} value={course.id || course.code || course}>
                  {course.title || course.name || course.code || course}
                </option>
              ))}
            </select>
          </div>

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
            
            {/* AI Spelling Suggestion Preview */}
            {suggestion && (
                <div className="ai-suggestion-box" style={{
                    marginTop: '10px',
                    padding: '15px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid var(--primary)',
                    borderRadius: '12px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px', color:'var(--primary)', fontWeight:'bold'}}>
                        <span>✨ AI Suggestion</span>
                    </div>
                    <p style={{marginBottom:'10px', fontSize:'0.95rem', color:'var(--text-primary)'}}>
                        {suggestion.corrected}
                    </p>
                    <div style={{display:'flex', gap:'10px'}}>
                        <button 
                            onClick={() => setFeedback(applySuggestion())}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', border: 'none',
                                background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Apply Fix
                        </button>
                        <button 
                            onClick={dismissSuggestion}
                            style={{
                                padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)',
                                background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'8px'}}>
                 <button 
                    onClick={() => checkSpelling(feedback)}
                    disabled={isChecking || !feedback}
                    style={{
                        background: 'none', border: 'none', color: 'var(--primary)', 
                        cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px'
                    }}
                 >
                    {isChecking ? 'Checking...' : '✨ Check Spelling & Grammar'}
                 </button>
                 <div className="char-counter" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {feedback.length} chars
                 </div>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <input 
              type="checkbox" 
              id="anonymous" 
              checked={isAnonymous} 
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="anonymous" style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)', cursor: 'pointer' }}>
              Submit Anonymously
            </label>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}> (Your name will be hidden from everyone)</span>
          </div>

          <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
              {existingRating && (
                  <button 
                    onClick={handleDelete}
                    disabled={submitting}
                    style={{
                        padding: '16px', borderRadius: '12px', border: '1px solid var(--error)',
                        background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', cursor: 'pointer',
                        fontWeight: '600', flex: '1'
                    }}
                  >
                      Delete
                  </button>
              )}
              <button 
                className="action-btn-premium" 
                onClick={handleSubmit} 
                disabled={submitting || isChecking}
                style={{ padding: '16px', flex: '2' }}
              >
                {submitting ? "Submitting..." : (existingRating ? "Update Rating" : "Submit Rating")}
              </button>
          </div>
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
