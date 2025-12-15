import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { toggleTheme } from '../../store/slices/themeSlice';
import { logoutUser } from '../../store/slices/authSlice';
import { useSmartNavigation } from '../../hooks/useSmartNavigation';
import './Header.css';

export default function Header({ 
    title, 
    showBack = true, 
    showLogout = true, 
    onLogoClick,
    children 
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { goBack } = useSmartNavigation();
  
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';
  
  // 1. Role-Based Logo Redirection
  const handleLogoClick = () => {
      if (onLogoClick) {
          onLogoClick();
          return;
      }

      if (!user) {
          navigate('/login');
          return;
      }
      
      switch(user.role) {
          case 'admin':
              navigate('/admin');
              break;
          case 'instructor':
              navigate('/dashboard');
              break;
          case 'MANAGEMENT':
              navigate('/management/dashboard');
              break;
          case 'student':
          default:
              navigate('/dashboard');
              break;
      }
  };

  // 2. Smart Back Button Logic
  // Hide on root pages to prevent awkward navigation
  const rootPages = ['/', '/login', '/signup']; // Removed /dashboard to allow sub-views to show back button
  const isRootPage = rootPages.includes(location.pathname);
  // If showBack is explicitly false, hide it. Otherwise, show it unless it's a root page.
  const shouldShowBack = showBack && !isRootPage;

  // 3. Logout Flow
  const handleLogout = () => {
      dispatch(logoutUser()).then(() => {
          navigate('/login');
      });
  };

  return (
    <>
      <header className={`nav-header glass-header ${mode}`} role="banner">
        {/* Left Section: Navigation & Identity */}
        <div className="header-left">
          {shouldShowBack && (
              <button 
                  onClick={goBack} 
                  className="back-btn" 
                  aria-label="Go Back" 
                  title="Go Back"
              >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 18l-6-6 6-6"/>
                  </svg>
              </button>
          )}
          
          <div 
              className="logo-area" 
              onClick={handleLogoClick} 
              role="button" 
              tabIndex={0}
              title="Return to Dashboard"
              onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
          >
              <div className="logo-icon">⚡</div>
              <span className="logo-text">CNCS Rate</span>
          </div>
        </div>

        {/* Center Section: Context / Title */}
        {/* Center Section: Context / Title */}
        <div className="header-center">
            {title && <h1 className="header-title">{title}</h1>}
            {children}
            
                <button 
                    onClick={async (e) => {
                        e.stopPropagation();
                        if(!window.confirm("Run Database Migration?")) return;
                        try {
                            const { migrationService } = await import('../../services/migrationService');
                            const res = await migrationService.migrateStudentsToUsers();
                            alert(res.logs.join('\n'));
                            window.location.reload(); 
                        } catch(err) {
                            alert("Error: " + err.message);
                        }
                    }}
                    style={{
                        marginLeft: 15,
                        background: '#eab308',
                        color: 'black',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ⚠️ Fix Students
                </button>
            )}
            
            {/* Instructor Migration Trigger */}
            {user?.uid === 'dH2UzGIvfigE7CgUUYtETtpnwsJ2' && (
                <button 
                    onClick={async (e) => {
                        e.stopPropagation();
                        if(!window.confirm("Migrate Instructors?")) return;
                        try {
                            const { migrationService } = await import('../../services/migrationService');
                            const res = await migrationService.migrateInstructors();
                            alert(res.logs.join('\n'));
                            window.location.reload(); 
                        } catch(err) {
                            alert("Error: " + err.message);
                        }
                    }}
                    style={{
                        marginLeft: 10,
                        background: '#f97316', // Orange
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    ⚠️ Fix Instructors
                </button>
            )}
        </div>

        {/* Right Section: Actions */}
        <div className="header-right">
          <button 
              className="theme-toggle" 
              onClick={() => dispatch(toggleTheme())}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
          >
              {isDark ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
          </button>

          {showLogout && (
              <button 
                  onClick={handleLogout} 
                  className="logout-btn"
                  title="Sign Out"
              >
                  Logout
              </button>
          )}
        </div>
      </header>
    </>
  );
}
