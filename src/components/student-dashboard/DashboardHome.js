import React from 'react';
import useDashboardData from './useDashboardData';
import TopInstructors from '../student/TopInstructors';
import PopularReviewers from '../student/PopularReviewers';
import SkeletonLoader from '../common/SkeletonLoader';

export default function DashboardHome({ user, navigateTo }) {
  const { stats, topInstructors, activeReviewers, recentActivity, loading } = useDashboardData(user);

  if (loading) return (
    <div className="dashboard-home">
        <div className="welcome-hero" style={{height: 200, display: 'flex', alignItems: 'center', gap: 20}}>
            <SkeletonLoader width="100px" height="100px" borderRadius="50%" />
            <div style={{flex: 1}}>
                <SkeletonLoader width="60%" height="40px" style={{marginBottom: 10}} />
                <SkeletonLoader width="40%" height="20px" style={{marginBottom: 20}} />
                <div style={{display: 'flex', gap: 20}}>
                    <SkeletonLoader width="80px" height="30px" borderRadius="20px" />
                    <SkeletonLoader width="80px" height="30px" borderRadius="20px" />
                    <SkeletonLoader width="80px" height="30px" borderRadius="20px" />
                </div>
            </div>
        </div>
        <div className="quick-nav" style={{marginTop: 30}}>
            <SkeletonLoader height="150px" borderRadius="16px" />
            <SkeletonLoader height="150px" borderRadius="16px" />
            <SkeletonLoader height="150px" borderRadius="16px" />
        </div>
    </div>
  );

  return (
    <div className="dashboard-home">
      {/* Welcome Hero */}
      <div className="welcome-hero" onClick={() => navigateTo('profile')} style={{cursor:'pointer'}}>
        <img 
          src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`} 
          alt="Profile" 
          className="student-avatar-large"
        />
        <div className="hero-content">
          <h1 style={{margin:0, fontSize: 32}}>Welcome back, {user.displayName?.split(' ')[0] || 'Student'}!</h1>
          <p style={{opacity: 0.8, marginTop: 8}}>Ready to shape the future of education at CNCS?</p>
          
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
      <div className="widgets-grid" style={{display:'flex', flexDirection:'column', gap: 30}}>
        
        {/* Top Instructors Discovery */}
        <div className="widget-section">
           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
              <h3 style={{margin:0, fontSize:'1.2rem', opacity:0.9}}>🏆 Top Instructors (Discovery)</h3>
           </div>
           <TopInstructors instructors={topInstructors} />
           <div style={{textAlign: 'center', marginTop: 20}}>
              <button 
                className="text-btn" 
                onClick={() => navigateTo('rate')} 
                style={{
                  color:'var(--neon-primary)', 
                  background:'rgba(99, 102, 241, 0.1)', 
                  border:'1px solid rgba(99, 102, 241, 0.3)', 
                  padding: '8px 24px',
                  borderRadius: '20px',
                  cursor:'pointer',
                  fontSize:'0.95rem',
                  fontWeight:500,
                  transition:'all 0.2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = 'var(--neon-primary)'; e.target.style.color = 'white'; }}
                onMouseLeave={(e) => { e.target.style.background = 'rgba(99, 102, 241, 0.1)'; e.target.style.color = 'var(--neon-primary)'; }}
              >
                See More Instructors →
              </button>
           </div>
        </div>

        {/* Top Reviewers */}
        <div className="widget-section">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
              <h3 style={{margin:0, fontSize:'1.2rem', opacity:0.9}}>🌟 Top Reviewers</h3>
              <button 
                className="text-btn" 
                onClick={() => navigateTo('profile')} 
                style={{
                  color:'var(--neon-secondary)', 
                  background:'none', 
                  border:'none', 
                  cursor:'pointer',
                  fontSize:'0.95rem',
                  fontWeight:500,
                  transition:'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
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
