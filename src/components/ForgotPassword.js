import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Link } from 'react-router-dom';
import './Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!isUniversityEmail(email)) {
      setError('Please use your university email (@aau.edu.et).');
      return;
    }

    if (!auth) {
      setError('Authentication service is not available. Please check your Firebase configuration.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
      setError('');
    } catch (err) {
      const code = err.code || '';
      if (code.includes('user-not-found')) {
        setError('No account found with this email address.');
      } else if (code.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isUniversityEmail = (e) => String(e || '').toLowerCase().endsWith('@aau.edu.et');

  return (

    <div className="login-wrapper">
      <div className="login-container" role="main">
        <div className="login-header">
          <div className="login-logo">
            <span>🔑</span>
          </div>
          <h2 className="login-title">Reset Password</h2>
          <p className="login-sub">Enter your university email and we'll send you a link to reset your password.</p>
        </div>

        <form className="login-form" onSubmit={handleReset}>
          <div className="input-group">
            <input
              className="login-input"
              placeholder="University Email (@aau.edu.et)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          {error && (
            <div className="error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}
          
          {success && (
            <div className="success" role="alert">
              <span>✅</span> Password reset email sent! Please check your inbox.
            </div>
          )}

          <div className="login-actions">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </div>

          <div className="links-container">
            <Link to="/login" className="muted-link">
              ← Back to Sign In
            </Link>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
              If you don't see the email, check your spam folder.
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
