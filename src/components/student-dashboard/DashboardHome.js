import React from 'react';
import { useDashboardData } from './useDashboardData';

export default function DashboardHome({ user, navigateTo }) {
  const { stats, topInstructors, activeReviewers, recentActivity, loading } = useDashboardData(user);

  if (loading) return <div className="dashboard-wrapper"><div className="glass-card" style={{padding:40, textAlign:'center'}}>Loading Dashboard...</div></div>;

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
      <div className="widgets-grid">
        {/* Top Instructors */}
        <div className="widget-section glass-card" style={{padding: 20}}>
          <h3>🏆 Top Rated Instructors</h3>
          <div className="list-container">
            {topInstructors.map(inst => (
              <div key={inst.id} className="list-item">
                <div className="avatar-small" style={{background: '#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  {inst.photo ? <img src={inst.photo} alt={inst.name} className="avatar-small"/> : inst.name[0]}
                </div>
                <div className="item-info">
                  <h4>{inst.name}</h4>
                  <p>⭐ {inst.avgRating} Average Rating</p>
                </div>
                <button className="action-btn-small">View</button>
              </div>
            ))}
            {topInstructors.length === 0 && <p style={{padding:20, textAlign:'center', opacity:0.6}}>No data yet.</p>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="widget-section glass-card" style={{padding: 20}}>
          <h3>⚡ Recent Activity</h3>
          <div className="list-container">
             {recentActivity.map(act => (
               <div key={act.id} className="list-item">
                 <div className="item-info">
                   <h4>Rated {act.instructorName || 'Course'}</h4>
                   <p>"{act.feedback?.substring(0, 30)}..."</p>
                 </div>
                 <span style={{fontSize:12, opacity:0.5}}>{act.rating}★</span>
               </div>
             ))}
             {recentActivity.length === 0 && <p style={{padding:20, textAlign:'center', opacity:0.6}}>No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
