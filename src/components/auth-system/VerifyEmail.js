import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase';
import { useAuthLogic } from './useAuthLogic';

export default function VerifyEmail({ onVerified }) {
  const { resendVerification, loading, error } = useAuthLogic();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
      const interval = setInterval(async () => {
          if (auth.currentUser) {
              await auth.currentUser.reload();
              if (auth.currentUser.emailVerified) {
                  clearInterval(interval);
                  onVerified();
              }
          }
      }, 3000);
      return () => clearInterval(interval);
  }, [onVerified]);

  return (
    <div className="auth-card" style={{textAlign:'center'}}>
      <div className="envelope-container">
        <div className="envelope-flap"></div>
        <div className="envelope-check">✔</div>
      </div>
      <h1 className="auth-title">Verify your Email</h1>
      <p className="auth-subtitle">
          We've sent a verification link to <br/>
          <strong>{user?.email}</strong>
      </p>

      {error && <div className="auth-alert">⚠ {error}</div>}

      <p style={{fontSize:'0.9rem', opacity:0.7, margin:'20px 0'}}>
          Please check your inbox and click the link to verify your account. 
          The page will auto-refresh once verified.
      </p>

      <button 
        className="auth-btn auth-btn-secondary" 
        onClick={() => resendVerification(user)}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Resend Verification Email'}
      </button>
      
      <div style={{marginTop:20, fontSize:'0.8rem', color:'var(--auth-text-secondary)'}}>
          Wrong email? <span className="auth-link" onClick={() => window.location.reload()}>Sign Out</span>
      </div>
    </div>
  );
}
