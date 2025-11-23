import React, { useState } from 'react';
import { useAuthLogic } from './useAuthLogic';
import AuthInput from './AuthInput';

export default function ForgotPassword({ onNavigate }) {
  const { resetPassword, loading, error } = useAuthLogic();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await resetPassword(email);
    if (success) setSent(true);
  };

  if (sent) {
      return (
        <div className="auth-card" style={{textAlign:'center'}}>
            <div style={{fontSize:'3rem', marginBottom:20}}>📧</div>
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-subtitle">We've sent a password reset link to {email}</p>
            <button className="auth-btn auth-btn-secondary" onClick={() => onNavigate('login')}>
                Return to Login
            </button>
        </div>
      );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Reset Password</h1>
      <p className="auth-subtitle">Enter your email to receive instructions</p>

      {error && <div className="auth-alert">⚠ {error}</div>}

      <form onSubmit={handleSubmit}>
        <AuthInput 
          label="Email Address" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading} style={{marginTop:20}}>
          {loading ? <div className="spinner"></div> : 'Send Reset Link'}
        </button>
      </form>

      <div style={{textAlign:'center', marginTop:20}}>
          <span className="auth-link" onClick={() => onNavigate('login')}>Back to Login</span>
      </div>
    </div>
  );
}
