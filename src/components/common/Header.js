import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleTheme } from '../../store/slices/themeSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import LogoutModal from './LogoutModal';
import './Header.css';

export default function Header({ 
    title, 
    showBack = true, 
    showLogout = true, 
    children 
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack } = useSmartNavigation();
  
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Smart Logo Logic: Redirect based on role
  const handleLogoClick = () => {
      if (user?.role === 'admin') {
          navigate('/admin');
      } else if (user?.role === 'instructor') {
          navigate('/dashboard'); // Instructor Dashboard
      } else {
          navigate('/dashboard'); // Student Dashboard
      }
  };

  // Smart Back Button Logic
  // Hide on main dashboards to prevent "back to login" weirdness
  const isMainPage = ['/', '/dashboard', '/admin'].includes(location.pathname);
  const shouldShowBack = showBack && !isMainPage;

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    dispatch(logoutUser()).then(() => {
        navigate('/login');
    });
  };

  return (
    <>
    <header className={`nav-header glass-header ${mode}`}>
      {/* Left: Logo & Back */}
      <div className="header-left">
        {shouldShowBack && (
            <button onClick={goBack} className="back-btn" aria-label="Go Back" title="Go Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </button>
        )}
        
        <div className="logo-area" onClick={handleLogoClick} title="Go to Dashboard">
            <div className="logo-icon">⚡</div>
            <span className="logo-text">CNCS Rate</span>
        </div>

        {title && <div className="header-divider"></div>}
        {title && <h1 className="header-title">{title}</h1>}
      </div>

      {/* Center: Context/Children */}
      <div className="header-center">
          {children}
      </div>

      {/* Right: Actions */}
      <div className="header-right">
        <button 
            className="theme-toggle" 
            onClick={() => dispatch(toggleTheme())}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
        >
            {isDark ? '🌙' : '☀'}
        </button>

        {showLogout && (
            <button 
                onClick={() => setIsLogoutModalOpen(true)} 
                className="action-btn-small logout-btn"
                title="Sign Out"
            >
                Logout
            </button>
        )}
      </div>
    </header>

    <LogoutModal 
        isOpen={isLogoutModalOpen} 
        onClose={() => setIsLogoutModalOpen(false)} 
        onConfirm={handleLogoutConfirm}
        isDark={isDark}
    />
    </>
  );
}
