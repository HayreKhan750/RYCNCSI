import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { db } from '../firebase'; // Ensure db is imported if we save to firestore (logic below uses localStorage mostly but good to have)
import './RatingFeedback.css';

export default function RatingFeedback() {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || 'student';
  const isAdmin = userRole === 'admin';
  const isInstructor = userRole === 'instructor';
  
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseNo, setCourseNo] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [section, setSection] = useState('');

  const [ratings, setRatings] = useState({});
  const [viewMode, setViewMode] = useState(isAdmin || isInstructor ? 'all' : 'mine');

  // Load saved ratings from localStorage
  useEffect(() => {
    const savedRatings = localStorage.getItem('courseRatings');
    if (savedRatings) {
      setRatings(JSON.parse(savedRatings));
    }
  }, []);

  // Save ratings to localStorage
  const saveRating = () => {
    if (rating === 0) {
      alert('Please select a rating before saving.');
      return;
    }
    if (!courseTitle) {
       alert('Please enter a course title.');
       return;
    }

    const courseKey = `${section || 'default'}-${courseNo || '000'}-${user?.uid || Date.now()}`;
    const newRatings = {
      ...ratings,
      [courseKey]: {
        rating,
        feedback,
        courseTitle,
        courseNo,
        instructors: instructorName,
        section,
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        userName: user?.displayName || 'Anonymous',
        userRole: userRole || 'student',
        timestamp: new Date().toISOString()
      }
    };

    setRatings(newRatings);
    localStorage.setItem('courseRatings', JSON.stringify(newRatings));
    
    // Reset form
    setRating(0);
    setFeedback('');
    setCourseTitle('');
    setCourseNo('');
    setInstructorName('');
    alert('Rating saved successfully!');
  };

  return (
    <div className="rating-feedback-container">
      <h2>Course Rating & Feedback</h2>
      <p style={{marginBottom: 20, color: 'var(--text-secondary)'}}>
        Please enter the course details manually as we have migrated our database.
      </p>

      <div className="rating-form" style={{marginTop: 0}}>
          <div className="form-group">
            <label>Course Title:</label>
            <input 
                type="text" 
                value={courseTitle} 
                onChange={e => setCourseTitle(e.target.value)} 
                placeholder="e.g. Introduction to Programming"
                className="search-input"
            />
          </div>
          <div className="form-group">
            <label>Course No (Optional):</label>
            <input 
                type="text" 
                value={courseNo} 
                onChange={e => setCourseNo(e.target.value)} 
                placeholder="e.g. CS101"
                className="search-input"
            />
          </div>
          <div className="form-group">
            <label>Instructor (Optional):</label>
            <input 
                type="text" 
                value={instructorName} 
                onChange={e => setInstructorName(e.target.value)} 
                placeholder="e.g. Dr. Smith"
                className="search-input"
            />
          </div>

          <div className="form-group">
            <label>Rating:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`star ${star <= rating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Feedback:</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback about this course..."
              rows={5}
              className="feedback-textarea"
            />
          </div>

          <div className="form-actions">
            <button onClick={saveRating} className="save-button" disabled={rating === 0 || !courseTitle}>
              Save Rating
            </button>
          </div>
      </div>

      {/* View All Ratings */}
      <div className="all-ratings" style={{marginTop: 40}}>
        <h3>Recent Ratings</h3>
        {Object.keys(ratings).length === 0 ? (
          <p>No ratings yet.</p>
        ) : (
          <div className="ratings-list">
            {Object.entries(ratings)
              .sort(([,a], [,b]) => new Date(b.timestamp) - new Date(a.timestamp))
              .map(([key, ratingData]) => (
                <div key={key} className="rating-item">
                  <div className="rating-item-header">
                    <h4>{ratingData.courseTitle}</h4>
                    <span className="rating-stars">{ratingData.rating}★</span>
                  </div>
                  <p><strong>Course No:</strong> {ratingData.courseNo}</p>
                  {ratingData.instructors && (
                    <p><strong>Instructors:</strong> {ratingData.instructors}</p>
                  )}
                  {ratingData.feedback && (
                    <p><strong>Feedback:</strong> {ratingData.feedback}</p>
                  )}
                  <p className="rating-date">
                    {new Date(ratingData.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

