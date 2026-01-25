import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import DashboardHome from './student-dashboard/DashboardHome';
import RateCourses from './student-dashboard/RateCourses';
import MyRatings from './student-dashboard/MyRatings'; // Kept as fallback/alias source
import StudentProfile from './StudentProfile';
import InstructorDashboard from './instructor/InstructorDashboard';
import InstructorProfile from './instructor-profile/InstructorProfile';
import ReviewsAndActivity from './student-dashboard/ReviewsAndActivity';
import PrivateMessages from './student-dashboard/PrivateMessages';
import ReviewersDirectory from './student-dashboard/ReviewersDirectory';
import './student-dashboard/StudentDashboard.css';
import Header from './common/Header';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { user, loading } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  
  // Initialize activeView from URL param or default to 'home'
  const activeView = searchParams.get('view') || 'home';

  // Helper to switch views while preserving other params
  const setActiveView = (view) => {
      setSearchParams({ view });
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="dashboard-wrapper" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>Loading...</div>;
  if (!user) return null; // Will redirect

  // Check if instructor
  const isInstructor = user.role === 'instructor';
  
  if (user.role === 'MANAGEMENT') {
      setTimeout(() => navigate('/management/dashboard'), 0);
      return null;
  }

  // Instructor View
  if (isInstructor) {
      if (activeView === 'profile') {
          return <InstructorProfile user={user} />;
      }
      return (
        <div className={`dashboard-wrapper ${mode}`}>
           <InstructorDashboard />
        </div>
      );
  }

  // Student View logic
  const renderContent = () => {
    switch(activeView) {
      case 'rate':
        return <RateCourses user={user} />;
      case 'activity': // Unified View
      case 'my-ratings': // Alias
      case 'feedback': // Alias
        return <ReviewsAndActivity user={user} />;
      case 'messages':
        return <PrivateMessages user={user} />;
      case 'profile':
        return <StudentProfile showHeader={false} />;
      case 'reviewers':
        return <ReviewersDirectory />;
      case 'home':
      default:
        return <DashboardHome user={user} navigateTo={setActiveView} />;
    }
  };

  // Show back button if we are not on the home view
  const showBack = activeView !== 'home';

  // Dynamic Header Title
  const getHeaderTitle = () => {
      switch(activeView) {
          case 'rate': return 'Rate Instructors';
          case 'activity': 
          case 'my-ratings':
          case 'feedback': 
                return 'Reviews & Activity';
          case 'messages': return 'Private Messages';
          case 'profile': return 'My Profile';
          case 'reviewers': return 'Top Reviewers';
          case 'home':
          default: return 'Student Dashboard';
      }
  };

  return (
    <div className={`dashboard-wrapper ${mode}`}>
      <Header 
        title={getHeaderTitle()} 
        showBack={showBack} 
        onLogoClick={() => setActiveView('home')}
      />

      <div className="dashboard-content fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
