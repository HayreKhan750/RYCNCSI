import React from 'react';

export default function CoursesList({ courses, searchTerm }) {
  const filteredCourses = courses.filter(course => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      course.courseTitle?.toLowerCase().includes(search) ||
      course.courseCode?.toLowerCase().includes(search) ||
      course.department?.toLowerCase().includes(search)
    );
  });

  return (
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
  );
}
