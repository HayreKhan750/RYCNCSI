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

import Header from './common/Header';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, loading } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  
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
           <Header title="Instructor Dashboard" showBack={false} />
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
      <Header title="Student Dashboard" showBack={false} />

      <div className="dashboard-content fade-in">
        {renderContent()}
      </div>
    </div>
  );
}

