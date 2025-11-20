import React, { useEffect, useState } from 'react';

export default function Settings() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('rycncsi_theme');
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, []);

  const toggleTheme = (next) => {
    setTheme(next);
    localStorage.setItem('rycncsi_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="profile-container" style={{ maxWidth: 800 }}>
      <div className="profile-header" style={{ marginBottom: 20 }}>
        <div className="profile-avatar instructor">
          <span>⚙</span>
        </div>
        <div className="profile-info">
          <h2>Settings</h2>
          <p className="profile-email">Customize your Rate Your CNCS Instructors experience.</p>
        </div>
      </div>

      <div className="profile-content">
        <h3>Appearance</h3>
        <p style={{ marginBottom: 16 }}>Choose your preferred theme.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`nav-tab ${theme === 'light' ? 'active' : ''}`}
            onClick={() => toggleTheme('light')}
          >
            ☀ Light Mode
          </button>
          <button
            type="button"
            className={`nav-tab ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => toggleTheme('dark')}
          >
            🌙 Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
}
