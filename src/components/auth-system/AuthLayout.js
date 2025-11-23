import React, { useState, useEffect } from 'react';

export default function AuthLayout({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('auth-theme') || 'dark';
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('auth-theme', newTheme);
  };

  return (
    <div className={`auth-root ${theme}`}>
      {/* Background Blobs */}
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>
      <div className="auth-bg-blob blob-3"></div>

      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
        {theme === 'dark' ? '🌙' : '☀'}
      </button>

      {/* Content */}
      {children}
    </div>
  );
}
