import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import scheduleData from '../assets/my-file.optimized.json';
import './Profile.css';

export default function InstructorProfile() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [activeSection, setActiveSection] = useState('courses');
  const [searchTerm, setSearchTerm] = useState('');

  // Load instructor's courses and ratings
  useEffect(() => {
    if (!user?.email) {
      setMyCourses([]);
      setMyRatings([]);
      return;
    }

    const loginEmail = String(user.email).toLowerCase();
    const courses = [];

    // scheduleData: { academic_year, semester, schedule: [ { department, courses: [...] } ] }
    const schedule = Array.isArray(scheduleData?.schedule) ? scheduleData.schedule : [];

    schedule.forEach((dept) => {
      const deptName = dept.department;
      const deptCourses = Array.isArray(dept.courses) ? dept.courses : [];

      deptCourses.forEach((course) => {
        // instructor can be array of { name, email } or a string
        let instructorsArr;
        if (Array.isArray(course.instructor)) {
          instructorsArr = course.instructor;
        } else if (course.instructor) {
          instructorsArr = [{ name: course.instructor, email: null }];
        } else {
          instructorsArr = [];
        }

        const teachesHere = instructorsArr.some((inst) =>
          inst?.email && String(inst.email).toLowerCase() === loginEmail
        );

        if (teachesHere) {
          courses.push({
            id: `${deptName || 'dept'}-${course.course_code || course.course_title}`,
            department: deptName,
            courseTitle: course.course_title,
            courseCode: course.course_code,
            lectureHours: course.lecture_hours,
            period: course.period,
            room: course.room,
            studentCount: course.student_count,
            instructors: instructorsArr,
          });
        }
      });
    });

    setMyCourses(courses);

    // Load ratings for this instructor from Firestore `feedbacks`
    const loadRatings = async () => {
      if (!db) {
        setMyRatings([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'feedbacks'),
          where('instructorId', '==', loginEmail),
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const data = d.data() || {};
          return {
            id: d.id,
            courseTitle: data.courseTitle || null,
            courseNo: data.courseCode || null,
            rating: typeof data.overall === 'number' ? data.overall : 0,
            feedback: data.comment || '',
            timestamp: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          };
        });
        setMyRatings(rows);
      } catch (e) {
        // On error, just show no ratings rather than breaking the profile
        setMyRatings([]);
      }
    };

    loadRatings();
  }, [user]);

  // Calculate statistics
  const averageRating = myRatings.length > 0
    ? (myRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / myRatings.length).toFixed(2)
    : 0;

  const filteredCourses = myCourses.filter(course => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      course.courseTitle?.toLowerCase().includes(search) ||
      course.courseNo?.toLowerCase().includes(search) ||
      course.section?.toLowerCase().includes(search)
    );
  });

  const filteredRatings = myRatings.filter(rating => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      rating.courseTitle?.toLowerCase().includes(search) ||
      rating.courseNo?.toLowerCase().includes(search) ||
      rating.feedback?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar instructor">
          <span>{user?.displayName?.charAt(0)?.toUpperCase() || 'I'}</span>
        </div>
        <div className="profile-info">
          <h2>{user?.displayName || 'Instructor'}</h2>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-role">Role: Instructor</p>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{myCourses.length}</span>
              <span className="stat-label">Courses</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{myRatings.length}</span>
              <span className="stat-label">Ratings</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{averageRating}</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeSection === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveSection('courses')}
        >
          My Courses ({myCourses.length})
        </button>
        <button
          className={`profile-tab ${activeSection === 'ratings' ? 'active' : ''}`}
          onClick={() => setActiveSection('ratings')}
        >
          Student Ratings ({myRatings.length})
        </button>
        <button
          className={`profile-tab ${activeSection === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSection('analytics')}
        >
          Analytics
        </button>
      </div>

      <div className="profile-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search courses or ratings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {activeSection === 'courses' && (
          <div className="courses-section">
            <h3>My Teaching Courses</h3>
            {filteredCourses.length === 0 ? (
              <div className="empty-state">
                <p>No courses found matching your search.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-card-header">
                      <h4>{course.courseTitle}</h4>
                      <span className="course-badge">{course.department}</span>
                    </div>
                    <div className="course-card-body">
                      <p><strong>Course Code:</strong> {course.courseCode}</p>
                      {course.department && <p><strong>Department:</strong> {course.department}</p>}
                      {course.lectureHours && <p><strong>Hours:</strong> {course.lectureHours}</p>}
                      {course.period && <p><strong>Period:</strong> {course.period}</p>}
                      {course.room && <p><strong>Room:</strong> {course.room}</p>}
                      {course.studentCount && <p><strong>Students:</strong> {course.studentCount}</p>}
                      {course.instructors && (
                        <p><strong>Instructors:</strong> {course.instructors.map((i) => i.name).join(', ')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'ratings' && (
          <div className="ratings-section">
            <h3>Student Ratings & Feedback</h3>
            {filteredRatings.length === 0 ? (
              <div className="empty-state">
                <p>No ratings received yet.</p>
              </div>
            ) : (
              <div className="ratings-list">
                {filteredRatings.map((rating, index) => (
                  <div key={index} className="rating-card">
                    <div className="rating-header">
                      <h4>{rating.courseTitle}</h4>
                      <span className="rating-stars">
                        {Array(5).fill(0).map((_, i) => (
                          <span key={i} className={i < rating.rating ? 'star-filled' : 'star-empty'}>
                            ★
                          </span>
                        ))}
                        <span className="rating-value">({rating.rating}/5)</span>
                      </span>
                    </div>
                    <p><strong>Course No:</strong> {rating.courseNo}</p>
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

        {activeSection === 'analytics' && (
          <div className="analytics-section">
            <h3>Teaching Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>Total Courses</h4>
                <p className="analytics-value">{myCourses.length}</p>
              </div>
              <div className="analytics-card">
                <h4>Total Ratings</h4>
                <p className="analytics-value">{myRatings.length}</p>
              </div>
              <div className="analytics-card">
                <h4>Average Rating</h4>
                <p className="analytics-value">{averageRating} / 5.0</p>
              </div>
              <div className="analytics-card">
                <h4>Total Students</h4>
                <p className="analytics-value">
                  {myCourses.reduce((sum, c) => sum + (c.studentCount || 0), 0)}
                </p>
              </div>
            </div>

            {myRatings.length > 0 && (
              <div className="rating-distribution">
                <h4>Rating Distribution</h4>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = myRatings.filter(r => r.rating === star).length;
                  const percentage = (count / myRatings.length) * 100;
                  return (
                    <div key={star} className="distribution-bar">
                      <span>{star}★</span>
                      <div className="bar-container">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span>{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}




