import React from 'react'; // Header component
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';
import { logoutUser } from '../../store/slices/authSlice';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { mode } = useSelector((state) => state.theme);
  const isDark = mode === 'dark';

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <div className="nav-header">
      <div className="logo-area" style={{fontWeight:'bold', fontSize:24, display:'flex', alignItems:'center', gap:10, cursor:'pointer'}} onClick={() => navigate('/dashboard')}>
        <span style={{fontSize:28}}>🎓</span>
        <span style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>CNCS Rate</span>
      </div>
      
      <div style={{display:'flex', alignItems:'center', gap: 15, flexWrap: 'wrap'}}>
          
          <div style={{display:'flex', gap: '10px', alignItems:'center', marginRight: '15px'}}>
              <button className="action-btn-small" onClick={() => navigate('/settings')}>
                 My Profile
              </button>
              <button className="action-btn-small" onClick={handleLogout} style={{background: 'rgba(239, 68, 68, 0.1)', color:'#ef4444'}}>
                  Logout
              </button>
          </div>

          <div style={{borderLeft: '1px solid rgba(128,128,128,0.3)', paddingLeft: '15px', display:'flex', alignItems:'center', gap:10}}>
              {/* Role Switcher removed for standard header, or can be added if needed */}
              <button className="theme-toggle" onClick={() => dispatch(toggleTheme())} style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {isDark ? '☀' : '🌙'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default Header;
