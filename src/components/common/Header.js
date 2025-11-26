import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser, setUser } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import './Header.css'; // We'll create this CSS file

export default function Header({ user, activeView, setActiveView, isDark }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRoleSwitch = (newRole) => {
      const updatedUser = { ...user, role: newRole };
      dispatch(setUser(updatedUser));
  };

  return (
    <div className="nav-header glass-header">
      <div className="logo-area" onClick={() => setActiveView ? setActiveView('home') : navigate('/')}>
        <span style={{fontSize:28}}>🎓</span>
        <span className="logo-text">CNCS Rate</span>
      </div>
      
      <div className="header-actions">
          <div className="user-actions">
              <button className="action-btn-small" onClick={() => setActiveView ? setActiveView('profile') : navigate('/profile')}>
                 My Profile
              </button>
              <button className="action-btn-small logout-btn" onClick={() => dispatch(logoutUser())}>
                  Logout
              </button>
          </div>

          <div className="system-actions">
              <select 
                  value={user?.role || 'student'} 
                  onChange={(e) => handleRoleSwitch(e.target.value)}
                  className="role-switcher"
                  title="Switch User Role (Dev Tool)"
              >
                  <option value="student">Student View</option>
                  <option value="instructor">Instructor View</option>
                  <option value="admin">Admin View</option>
              </select>

              <button className="theme-toggle" onClick={() => dispatch(toggleTheme())}>
                  {isDark ? '☀' : '🌙'}
              </button>
          </div>
      </div>
    </div>
  );
}
