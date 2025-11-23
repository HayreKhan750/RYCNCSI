import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import DashboardHome from './student-dashboard/DashboardHome';
import RateCourses from './student-dashboard/RateCourses';
import MyRatings from './student-dashboard/MyRatings';
import StudentProfile from './StudentProfile';
import InstructorDashboard from './instructor-dashboard/InstructorDashboard';
import InstructorProfile from './instructor-profile/InstructorProfile'; // New Import
import './student-dashboard/StudentDashboard.css';

export default function Dashboard() {
  const { user, userData, loading, logout } = useUser();
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState('home');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  if (loading) return <div className="dashboard-wrapper" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>Loading...</div>;
  if (!user) return null; // Will redirect

  // Check if instructor
  const isInstructor = userData?.role === 'instructor';

  // Combine auth user with Firestore user data for display
  const displayUser = {
      uid: user.uid,
      displayName: userData?.name || user.displayName || 'User',
      email: user.email,
      photoURL: userData?.profilePictureUrl || user.photoURL,
      ...userData
  };

  // Instructor View
  if (isInstructor) {
      // Simple router for instructor inside dashboard
      if (activeView === 'profile') {
          return <InstructorProfile user={displayUser} />;
      }

      return (
        <div className={`dashboard-wrapper ${darkMode ? 'dark' : 'light'}`}>
           <div className="nav-header">
             <div className="logo-area" style={{fontWeight:'bold', fontSize:24, display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={() => setActiveView('home')}>
                <span style={{fontSize:28}}>🎓</span>
                <span style={{background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>CNCS Instructor</span>
             </div>
             <div style={{display:'flex', alignItems:'center', gap: 15, flexWrap: 'wrap'}}>
                 <button className="action-btn-small" onClick={() => setActiveView('profile')}>
                     My Profile
                 </button>
                 <button className="theme-toggle" onClick={toggleTheme} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                     {darkMode ? '☀' : '🌙'}
                 </button>
                 <button className="action-btn-small" onClick={logout} style={{background: 'rgba(239, 68, 68, 0.1)', color:'#ef4444'}}>
                     Logout
                 </button>
             </div>
           </div>
           <InstructorDashboard user={displayUser} />
        </div>
      );
  }

  // Student View logic
  const renderContent = () => {
    switch(activeView) {
      case 'rate':
        return <RateCourses user={displayUser} />;
      case 'my-ratings':
        return <MyRatings user={displayUser} />;
      case 'profile':
        return <StudentProfile />;
      case 'feedback':
        return <div className="glass-card" style={{padding:40, textAlign:'center'}}>Feedback & Replies Module Coming Soon</div>;
      case 'home':
      default:
        return <DashboardHome user={displayUser} navigateTo={setActiveView} />;
    }
  };

  return (
    <div className={`dashboard-wrapper ${darkMode ? 'dark' : 'light'}`}>
      <div className="nav-header">
        <div className="logo-area" style={{fontWeight:'bold', fontSize:24, display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={() => setActiveView('home')}>
          <span style={{fontSize:28}}>🎓</span>
          <span style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>CNCS Rate</span>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap: 15, flexWrap: 'wrap'}}>
            <button className="action-btn-small" onClick={() => setActiveView('profile')}>
               My Profile
            </button>
            <button className="theme-toggle" onClick={toggleTheme} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {darkMode ? '☀' : '🌙'}
            </button>
            <button className="action-btn-small" onClick={logout} style={{background: 'rgba(239, 68, 68, 0.1)', color:'#ef4444'}}>
                Logout
            </button>
        </div>
      </div>

      <div className="dashboard-content fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
