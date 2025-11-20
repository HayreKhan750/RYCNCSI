import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import scheduleData from '../assets/my-file.optimized.json';
import './RatingFeedback.css';

export default function RatingFeedback() {
  const { user, userRole, isAdmin, isInstructor } = useUser();
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ratings, setRatings] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(isAdmin || isInstructor ? 'all' : 'mine');

  // Get all sections from the schedule data
  const sections = Object.keys(scheduleData);

  // Get courses for the selected section and filter by search term
  const allCourses = selectedSection ? scheduleData[selectedSection] || [] : [];
  const courses = allCourses.filter(course => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (course.courseTitle && course.courseTitle.toLowerCase().includes(searchLower)) ||
      (course.courseNo && course.courseNo.toLowerCase().includes(searchLower)) ||
      (course.instructors && course.instructors.toLowerCase().includes(searchLower)) ||
      (course.dept && course.dept.toLowerCase().includes(searchLower))
    );
  });

  // Load saved ratings from localStorage
  useEffect(() => {
    const savedRatings = localStorage.getItem('courseRatings');
    if (savedRatings) {
      setRatings(JSON.parse(savedRatings));
    }
  }, []);

  // Save ratings to localStorage
  const saveRating = () => {
    if (!selectedCourse) return;
    if (rating === 0) {
      alert('Please select a rating before saving.');
      return;
    }

    const courseKey = `${selectedSection}-${selectedCourse.courseNo}-${user?.uid || Date.now()}`;
    const newRatings = {
      ...ratings,
      [courseKey]: {
        rating,
        feedback,
        courseTitle: selectedCourse.courseTitle,
        courseNo: selectedCourse.courseNo,
        instructors: selectedCourse.instructors,
        section: selectedSection,
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
    setSelectedCourse(null);
    alert('Rating saved successfully!');
  };

  // Get rating for a course
  const getCourseRating = (course) => {
    const courseKey = `${selectedSection}-${course.courseNo}`;
    return ratings[courseKey];
  };

  // Handle course selection
  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    const existingRating = getCourseRating(course);
    if (existingRating) {
      setRating(existingRating.rating);
      setFeedback(existingRating.feedback);
    } else {
      setRating(0);
      setFeedback('');
    }
  };

  return (
    <div className="rating-feedback-container">
      <h2>Course Rating & Feedback</h2>
      
      {/* Section Selection */}
      <div className="section-selector">
        <label htmlFor="section-select">Select Section:</label>
        <select
          id="section-select"
          value={selectedSection}
          onChange={(e) => {
            setSelectedSection(e.target.value);
            setSelectedCourse(null);
            setRating(0);
            setFeedback('');
            setSearchTerm('');
          }}
          className="section-dropdown"
        >
          <option value="">-- Select a Section --</option>
          {sections.map((section) => (
            <option key={section} value={section}>
              {section} ({scheduleData[section]?.length || 0} courses)
            </option>
          ))}
        </select>
      </div>

      {selectedSection && (
        <>
          {/* Search Filter */}
          <div className="search-filter">
            <label htmlFor="course-search">Search Courses:</label>
            <input
              id="course-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by course title, number, instructor, or department..."
              className="search-input"
            />
            {searchTerm && (
              <span className="search-results">
                Found {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Course List */}
          <div className="courses-list">
            <h3>Courses in {selectedSection} {searchTerm && `(${courses.length} found)`}</h3>
            {courses.length === 0 ? (
              <p className="no-courses">No courses found matching your search.</p>
            ) : (
              <div className="courses-grid">
              {courses.map((course, index) => {
                const courseRating = getCourseRating(course);
                return (
                  <div
                    key={index}
                    className={`course-card ${selectedCourse?.courseNo === course.courseNo ? 'selected' : ''}`}
                    onClick={() => handleCourseSelect(course)}
                  >
                    <div className="course-header">
                      <h4>{course.courseTitle || 'N/A'}</h4>
                      {courseRating && (
                        <div className="rating-badge">
                          {courseRating.rating}★
                        </div>
                      )}
                    </div>
                    <div className="course-details">
                      <p><strong>Course No:</strong> {course.courseNo || 'N/A'}</p>
                      {course.dept && <p><strong>Department:</strong> {course.dept}</p>}
                      {course.lectureHours !== undefined && course.lectureHours !== null && (
                        <p><strong>Lecture Hours:</strong> {course.lectureHours}</p>
                      )}
                      {course.period && <p><strong>Period:</strong> {course.period}</p>}
                      {course.room && <p><strong>Room:</strong> {course.room}</p>}
                      {course.instructors && (
                        <p><strong>Instructors:</strong> {course.instructors}</p>
                      )}
                      {course.studentNumber !== undefined && course.studentNumber !== null && (
                        <p><strong>Students:</strong> {course.studentNumber}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>

          {/* Rating Form */}
          {selectedCourse && (
            <div className="rating-form">
              <h3>Rate & Provide Feedback</h3>
              <div className="form-group">
                <label>Course: {selectedCourse.courseTitle}</label>
                <p>Course No: {selectedCourse.courseNo}</p>
                {selectedCourse.instructors && (
                  <p>Instructors: {selectedCourse.instructors}</p>
                )}
              </div>

              <div className="form-group">
                <label>Rating:</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= rating ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={(e) => {
                        if (e.buttons === 0) {
                          // Visual feedback on hover
                        }
                      }}
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
                <button onClick={saveRating} className="save-button" disabled={rating === 0}>
                  Save Rating
                </button>
                <button
                  onClick={() => {
                    setSelectedCourse(null);
                    setRating(0);
                    setFeedback('');
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* View All Ratings */}
          <div className="all-ratings">
            <h3>All Ratings</h3>
            {Object.keys(ratings).length === 0 ? (
              <p>No ratings yet. Be the first to rate a course!</p>
            ) : (
              <div className="ratings-list">
                {Object.entries(ratings)
                  .filter(([key]) => key.startsWith(selectedSection))
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
        </>
      )}
    </div>
  );
}

