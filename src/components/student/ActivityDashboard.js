import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewList from '../common/ReviewList';

export default function ActivityDashboard({ ratings = [], isOwnProfile = false, user = {} }) {
  const navigate = useNavigate();

  if (!ratings || ratings.length === 0) {
    return (
      <div className="glass-panel" style={{padding: 40, textAlign: 'center', opacity: 0.7}}>
        <h3>No activity yet</h3>
        <p>Start rating instructors to see your timeline here!</p>
        <button className="action-btn" style={{margin:'20px auto'}} onClick={() => navigate('/dashboard')}>
            Rate Instructors
        </button>
      </div>
    );
  }

  return (
    <div className="activity-feed">
       <ReviewList 
          reviews={ratings} 
          isInstructorView={false}
          showInstructorInfo={true} // New prop to show Instructor name instead of Student name
       />
    </div>
  );
}
