import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, setTheme } from '../store/slices/themeSlice';

export default function Settings() {
  const dispatch = useDispatch();
  const { mode } = useSelector((state) => state.theme);

  const handleThemeChange = (newTheme) => {
    if (newTheme !== mode) {
        dispatch(setTheme(newTheme));
    }
  };

  return (
    <div className="profile-container" style={{ maxWidth: 800 }}>
      <div className="profile-header" style={{ marginBottom: 20 }}>
        <div className="profile-avatar instructor">
          <span>⚙</span>
        </div>
        <div className="profile-info">
          <h2>Settings</h2>
          <p className="profile-email">Customize your AcademicPulses experience.</p>
        </div>
      </div>

      <div className="profile-content">
        <h3>Appearance</h3>
        <p style={{ marginBottom: 16 }}>Choose your preferred theme.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`nav-tab ${mode === 'light' ? 'active' : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            ☀ Light Mode
          </button>
          <button
            type="button"
            className={`nav-tab ${mode === 'dark' ? 'active' : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            🌙 Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
}
