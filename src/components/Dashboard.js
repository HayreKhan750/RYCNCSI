import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, setUser } from '../store/slices/authSlice'; // setUser for role switch dev tool
import { toggleTheme } from '../store/slices/themeSlice';
import DashboardHome from './student-dashboard/DashboardHome';
import RateCourses from './student-dashboard/RateCourses';
import MyRatings from './student-dashboard/MyRatings';
import StudentProfile from './StudentProfile';
import InstructorDashboard from './instructor-dashboard/InstructorDashboard';
import InstructorProfile from './instructor-profile/InstructorProfile';
import './student-dashboard/StudentDashboard.css';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, loading } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  const [activeView, setActiveView] = useState('home');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="dashboard-wrapper" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>Loading...</div>;
  if (!user) return null; // Will redirect

  // Check if instructor
  const isInstructor = user.role === 'instructor';

  // Helper for dev tool role switch
  const handleRoleSwitch = (newRole) => {
      // Create a shallow copy with new role
      const updatedUser = { ...user, role: newRole };
      dispatch(setUser(updatedUser));
  };

  // Instructor View
  if (isInstructor) {
      // Simple router for instructor inside dashboard
      if (activeView === 'profile') {
          return <InstructorProfile user={user} />;
      }

      return (
        <div className={`dashboard-wrapper ${mode}`}>
           <div className="nav-header">
             <div className="logo-area" style={{fontWeight:'bold', fontSize:24, display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={() => setActiveView('home')}>
                <span style={{fontSize:28}}>🎓</span>
                <span style={{background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>CNCS Instructor</span>
             </div>
             <div style={{display:'flex', alignItems:'center', gap: 15, flexWrap: 'wrap'}}>
                 <button className="action-btn-small" onClick={() => setActiveView('profile')}>
                     My Profile
                 </button>
                 <button className="theme-toggle" onClick={() => dispatch(toggleTheme())} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                     {isDark ? '☀' : '🌙'}
                 </button>
                 <button className="action-btn-small" onClick={() => dispatch(logoutUser())} style={{background: 'rgba(239, 68, 68, 0.1)', color:'#ef4444'}}>
                     Logout
                 </button>
             </div>
           </div>
           <InstructorDashboard user={user} />
        </div>
      );
  }

  // Student View logic
  const renderContent = () => {
    switch(activeView) {
      case 'rate':
        return <RateCourses user={user} />;
      case 'my-ratings':
        return <MyRatings user={user} />;
      case 'profile':
        return <StudentProfile />;
      case 'feedback':
        return <div className="glass-card" style={{padding:40, textAlign:'center'}}>Feedback & Replies Module Coming Soon</div>;
      case 'home':
      default:
        return <DashboardHome user={user} navigateTo={setActiveView} />;
    }
  };

  return (
    <div className={`dashboard-wrapper ${mode}`}>
      <div className="nav-header">
        <div className="logo-area" style={{fontWeight:'bold', fontSize:24, display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={() => setActiveView('home')}>
          <span style={{fontSize:28}}>🎓</span>
          <span style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>CNCS Rate</span>
        </div>
        
        <div style={{display:'flex', alignItems:'center', gap: 15, flexWrap: 'wrap'}}>
            
            <div style={{display:'flex', gap: '10px', alignItems:'center', marginRight: '15px'}}>
                <button className="action-btn-small" onClick={() => setActiveView('profile')}>
                   My Profile
                </button>
                <button className="action-btn-small" onClick={() => dispatch(logoutUser())} style={{background: 'rgba(239, 68, 68, 0.1)', color:'#ef4444'}}>
                    Logout
                </button>
            </div>

            <div style={{borderLeft: '1px solid rgba(128,128,128,0.3)', paddingLeft: '15px', display:'flex', alignItems:'center', gap:10}}>
                <select 
                    value={user.role || 'student'} 
                    onChange={(e) => handleRoleSwitch(e.target.value)}
                    style={{padding: '5px', borderRadius: '5px', border: '1px solid #ccc', background: 'transparent', color: 'inherit', cursor:'pointer'}}
                    title="Switch User Role (Dev Tool)"
                >
                    <option value="student">Student View</option>
                    <option value="instructor">Instructor View</option>
                    <option value="admin">Admin View</option>
                </select>

                <button className="theme-toggle" onClick={() => dispatch(toggleTheme())} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    {isDark ? '☀' : '🌙'}
                </button>
            </div>
        </div>
      </div>

      <div className="dashboard-content fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
