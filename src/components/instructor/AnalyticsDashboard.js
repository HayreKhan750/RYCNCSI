import React from 'react';

export default function AnalyticsDashboard({ myCourses, myRatings, stats }) {
    const { averageRating, totalRatings, totalStudents } = stats;

  return (
    <div className="analytics-section">
      <h3>Teaching Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Total Courses</h4>
          <p className="analytics-value">{myCourses.length}</p>
        </div>
        <div className="analytics-card">
          <h4>Total Ratings</h4>
          <p className="analytics-value">{totalRatings}</p>
        </div>
        <div className="analytics-card">
          <h4>Average Rating</h4>
          <p className="analytics-value">{averageRating} / 5.0</p>
        </div>
        <div className="analytics-card">
          <h4>Total Students</h4>
          <p className="analytics-value">{totalStudents}</p>
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
  );
}
