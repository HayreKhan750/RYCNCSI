import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../../store/slices/themeSlice';

export default function AuthLayout({ children }) {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);
  const theme = mode; // Alias for compatibility

  return (
    <div className={`auth-root ${theme}`}>
      {/* Background Blobs */}
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>
      <div className="auth-bg-blob blob-3"></div>

      {/* Theme Toggle - Fixed position to avoid overlap */}
      <button 
        className="theme-toggle" 
        onClick={() => dispatch(toggleTheme())} 
        title="Toggle Theme"
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '1.2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}
      >
        {theme === 'dark' ? '🌙' : '☀'}
      </button>

      {/* Content */}
      {children}
    </div>
  );
}
