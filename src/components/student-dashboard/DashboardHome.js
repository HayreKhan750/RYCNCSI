import React from 'react';
import useDashboardData from './useDashboardData';
import TopInstructors from '../student/TopInstructors';
import PopularReviewers from '../student/PopularReviewers';
import SkeletonLoader from '../common/SkeletonLoader';

export default function DashboardHome({ user, navigateTo }) {
  const { stats, topInstructors, activeReviewers, recentActivity, loading } = useDashboardData(user);

  if (loading) return (
    <div className="dashboard-home">
        <div className="welcome-hero skeleton-hero">
            <SkeletonLoader width="100px" height="100px" borderRadius="50%" />
            <div className="skeleton-content">
                <SkeletonLoader width="60%" height="40px" style={{marginBottom: 10}} />
                <SkeletonLoader width="40%" height="20px" style={{marginBottom: 20}} />
                <div className="skeleton-stats">
                    <SkeletonLoader width="80px" height="30px" borderRadius="20px" />
                    <SkeletonLoader width="80px" height="30px" borderRadius="20px" />
                    <SkeletonLoader width="80px" height="30px" borderRadius="20px" />
                </div>
            </div>
        </div>
        <div className="quick-nav skeleton-nav">
            <SkeletonLoader height="150px" borderRadius="16px" />
            <SkeletonLoader height="150px" borderRadius="16px" />
            <SkeletonLoader height="150px" borderRadius="16px" />
        </div>
    </div>
  );

  return (
    <div className="dashboard-home">
      {/* Welcome Hero */}
      <div className="welcome-hero clickable" onClick={() => navigateTo('profile')}>
        <img 
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
          alt="Profile" 
          className="student-avatar-large"
        />
        <div className="hero-content">
          <h1>Welcome back, {user.displayName?.split(' ')[0] || 'Student'}!</h1>
          <p className="hero-subtitle">Ready to shape the future of education at CNCS?</p>
          
          <div className="stats-row">
            <div className="stat-pill">
              <span>{stats.coursesTaken}</span>
              <span>Courses</span>
            </div>
            <div className="stat-pill">
              <span>{stats.instructorsRated}</span>
              <span>Rated</span>
            </div>
            <div className="stat-pill">
              <span>{stats.engagementScore}</span>
              <span>Score</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="quick-nav">
        <div className="nav-card glass-card" onClick={() => navigateTo('rate')}>
          <div className="icon">⭐</div>
          <h3>Rate Instructors</h3>
          <p>Share your experience and help others.</p>
        </div>
        <div className="nav-card glass-card" onClick={() => navigateTo('my-ratings')}>
          <div className="icon">📊</div>
          <h3>My Ratings</h3>
          <p>Manage and edit your past feedback.</p>
        </div>
        <div className="nav-card glass-card" onClick={() => navigateTo('feedback')}>
          <div className="icon">💬</div>
          <h3>My Feedback</h3>
          <p>View replies and reactions.</p>
        </div>
      </div>

      {/* Widgets */}
      <div className="widgets-grid">
        
        {/* Top Instructors Discovery */}
        <div className="widget-section">
           <div className="section-header">
              <h3>🏆 Top Instructors (Discovery)</h3>
           </div>
           <TopInstructors instructors={topInstructors} />
           <div className="section-footer">
              <button 
                className="btn-premium-glass" 
                onClick={() => navigateTo('rate')} 
              >
                See More Instructors →
              </button>
           </div>
        </div>

        {/* Top Reviewers */}
        <div className="widget-section">
          <div className="section-header">
              <h3>🌟 Top Reviewers</h3>
              <button 
                className="btn-premium-glass" 
                onClick={() => navigateTo('profile')} 
              >
                See More →
              </button>
          </div>
          <PopularReviewers reviewers={activeReviewers.slice(0, 3)} />
        </div>

      </div>
    </div>
  );
}
