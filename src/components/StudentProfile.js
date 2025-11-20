import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import scheduleData from '../assets/my-file.optimized.json';
import './Profile.css';

export default function StudentProfile() {
  const { user, userData } = useUser();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [activeSection, setActiveSection] = useState('courses');

  // Load enrolled courses from localStorage (in a real app, this would come from a database)
  useEffect(() => {
    const savedEnrollments = localStorage.getItem(`enrolledCourses_${user?.uid || 'default'}`);
    if (savedEnrollments) {
      setEnrolledCourses(JSON.parse(savedEnrollments));
    }

    // Load user's ratings
    const allRatings = JSON.parse(localStorage.getItem('courseRatings') || '{}');
    const userRatings = Object.values(allRatings).filter(rating => 
      rating.userId === user?.uid || rating.email === user?.email
    );
    setMyRatings(userRatings);
  }, [user]);

  // Get all available courses
  const getAllCourses = () => {
    const allCourses = [];
    Object.keys(scheduleData).forEach(section => {
      scheduleData[section].forEach(course => {
        allCourses.push({
          ...course,
          section,
          id: `${section}-${course.courseNo}`
        });
      });
    });
    return allCourses;
  };

  const availableCourses = getAllCourses();

  const handleEnroll = (course) => {
    if (!enrolledCourses.find(c => c.id === course.id)) {
      const newEnrollments = [...enrolledCourses, course];
      setEnrolledCourses(newEnrollments);
      localStorage.setItem(`enrolledCourses_${user?.uid || 'default'}`, JSON.stringify(newEnrollments));
    }
  };

  const handleUnenroll = (courseId) => {
    const newEnrollments = enrolledCourses.filter(c => c.id !== courseId);
    setEnrolledCourses(newEnrollments);
    localStorage.setItem(`enrolledCourses_${user?.uid || 'default'}`, JSON.stringify(newEnrollments));
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <span>{user?.displayName?.charAt(0)?.toUpperCase() || 'S'}</span>
        </div>
        <div className="profile-info">
          <h2>{user?.displayName || 'Student'}</h2>
          <p className="profile-email">{user?.email}</p>
          {userData?.studentId && <p className="profile-id">Student ID: {userData.studentId}</p>}
          <p className="profile-role">Role: Student</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeSection === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveSection('courses')}
        >
          My Courses ({enrolledCourses.length})
        </button>
        <button
          className={`profile-tab ${activeSection === 'available' ? 'active' : ''}`}
          onClick={() => setActiveSection('available')}
        >
          Available Courses
        </button>
        <button
          className={`profile-tab ${activeSection === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveSection('ratings')}
        >
          My Ratings ({myRatings.length})
        </button>
      </div>

      <div className="profile-content">
        {activeSection === 'courses' && (
          <div className="courses-section">
            <h3>Enrolled Courses</h3>
            {enrolledCourses.length === 0 ? (
              <div className="empty-state">
                <p>You haven't enrolled in any courses yet.</p>
                <p>Go to "Available Courses" to enroll.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-card-header">
                      <h4>{course.courseTitle}</h4>
                      <button
                        onClick={() => handleUnenroll(course.id)}
                        className="unenroll-button"
                      >
                        Unenroll
                      </button>
                    </div>
                    <div className="course-card-body">
                      <p><strong>Course No:</strong> {course.courseNo}</p>
                      {course.dept && <p><strong>Department:</strong> {course.dept}</p>}
                      {course.lectureHours && <p><strong>Hours:</strong> {course.lectureHours}</p>}
                      {course.period && <p><strong>Period:</strong> {course.period}</p>}
                      {course.room && <p><strong>Room:</strong> {course.room}</p>}
                      {course.instructors && <p><strong>Instructor:</strong> {course.instructors}</p>}
                      <p><strong>Section:</strong> {course.section}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'available' && (
          <div className="courses-section">
            <h3>Available Courses</h3>
            <div className="section-filter">
              <label>Filter by Section:</label>
              <select
                onChange={(e) => {
                  // Filter logic can be added here
                }}
                className="section-select"
              >
                <option value="">All Sections</option>
                {Object.keys(scheduleData).map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            <div className="courses-grid">
              {availableCourses.slice(0, 50).map((course) => {
                const isEnrolled = enrolledCourses.find(c => c.id === course.id);
                return (
                  <div key={course.id} className="course-card">
                    <div className="course-card-header">
                      <h4>{course.courseTitle}</h4>
                      {!isEnrolled ? (
                        <button
                          onClick={() => handleEnroll(course)}
                          className="enroll-button"
                        >
                          Enroll
                        </button>
                      ) : (
                        <span className="enrolled-badge">Enrolled</span>
                      )}
                    </div>
                    <div className="course-card-body">
                      <p><strong>Course No:</strong> {course.courseNo}</p>
                      {course.dept && <p><strong>Department:</strong> {course.dept}</p>}
                      {course.lectureHours && <p><strong>Hours:</strong> {course.lectureHours}</p>}
                      {course.period && <p><strong>Period:</strong> {course.period}</p>}
                      {course.room && <p><strong>Room:</strong> {course.room}</p>}
                      {course.instructors && <p><strong>Instructor:</strong> {course.instructors}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSection === 'ratings' && (
          <div className="ratings-section">
            <h3>My Ratings</h3>
            {myRatings.length === 0 ? (
              <div className="empty-state">
                <p>You haven't rated any courses yet.</p>
                <p>Go to "Rate Courses" to provide feedback.</p>
              </div>
            ) : (
              <div className="ratings-list">
                {myRatings.map((rating, index) => (
                  <div key={index} className="rating-card">
                    <div className="rating-header">
                      <h4>{rating.courseTitle}</h4>
                      <span className="rating-stars">{'★'.repeat(rating.rating)}{'☆'.repeat(5 - rating.rating)}</span>
                    </div>
                    <p><strong>Course No:</strong> {rating.courseNo}</p>
                    {rating.instructors && <p><strong>Instructor:</strong> {rating.instructors}</p>}
                    {rating.feedback && (
                      <div className="rating-feedback">
                        <strong>Feedback:</strong>
                        <p>{rating.feedback}</p>
                      </div>
                    )}
                    <p className="rating-date">
                      Rated on: {new Date(rating.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




