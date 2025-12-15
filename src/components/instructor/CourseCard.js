import React from 'react';
import { motion } from 'framer-motion';

const CourseCard = ({ course }) => {
    // Mock metrics if missing
    const students = course.studentCount || Math.floor(Math.random() * 100) + 20;
    const rating = course.avgRating || (4 + Math.random()).toFixed(1);
    const code = course.courseCode || course.code || 'CS-101';
    const title = course.courseTitle || course.title || 'Introduction to Computer Science';

    return (
        <motion.div 
            whileHover={{ y: -5 }}
            className="course-card-premium"
        >
            {/* Gradient Header */}
            <div className="course-card-header">
                <div className="course-badge">
                    {course.semester || 'Fall 2024'}
                </div>
                <div className="course-code-label">
                    {code}
                </div>
                <h3 className="course-title">
                    {title}
                </h3>
                
                {/* Deco Circles */}
                <div className="course-deco-circle"></div>
            </div>

            {/* Metrics Bar */}
            <div className="course-metrics-bar">
                <div className="metric-cell">
                    <div className="metric-val">{students}</div>
                    <div className="metric-label">Students</div>
                </div>
                <div className="metric-cell">
                    <div className="metric-val amber">{rating}</div>
                    <div className="metric-label">Rating</div>
                </div>
                <div className="metric-cell">
                    <div className="metric-val indigo">Active</div>
                    <div className="metric-label">Status</div>
                </div>
            </div>

            {/* Body */}
            <div className="course-body">
                <div className="course-details-list">
                     <div className="course-detail-row">
                        <span className="detail-icon">📍</span>
                        <span>{course.room || 'Main Hall B'}</span>
                     </div>
                     <div className="course-detail-row">
                        <span className="detail-icon">⏰</span>
                        <span>{course.schedule || 'Mon, Wed 10:00 AM'}</span>
                     </div>
                </div>

                <div className="course-actions">
                    <button className="btn-course-action secondary">
                        View Details
                    </button>
                    <button className="btn-course-action primary">
                        Resources
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default CourseCard;
