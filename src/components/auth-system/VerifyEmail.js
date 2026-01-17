import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resendVerification, checkAuthState } from '../../store/slices/authSlice';
import { auth } from '../../firebase';
import { authService } from '../../services/authService';

export default function VerifyEmail({ onVerified }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [user, setUser] = useState(auth.currentUser);

  const handleVerification = async (currentUser) => {
      try {
          // Explicitly finalize registration (Write to DB)
          // This moves data from 'pending_registrations' to 'users'
          await authService.finalizeRegistration(currentUser);
      } catch (e) {
          console.error("Finalization failed:", e);
          alert(`Verification Failed: ${e.message}`);
          return; // Stop execution
      }
      // Then sync state (Read) which will trigger AuthEntry redirect
      dispatch(checkAuthState()); 
  };

  useEffect(() => {
      // Check immediately on mount (for reloads)
      if (auth.currentUser?.emailVerified) {
          handleVerification(auth.currentUser);
      }

      const interval = setInterval(async () => {
          if (auth.currentUser) {
              await auth.currentUser.reload();
              if (auth.currentUser.emailVerified) {
                  clearInterval(interval);
                  handleVerification(auth.currentUser);
              }
          }
      }, 3000);
      return () => clearInterval(interval);
  }, [dispatch]);

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
        onClick={() => dispatch(resendVerification(user))}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Resend Verification Email'}
      </button>

      {/* Force Refresh Button */}
      {/* Developer Bypass Button */}
      {process.env.NODE_ENV === 'development' && (
          <button 
            className="auth-btn auth-btn-primary" 
            style={{marginTop: 10, background: '#10b981'}} // Green for success
            onClick={async () => {
                // Manually trigger finalization (as if email was clicked)
                await handleVerification(user); 
                window.location.href = '/dashboard';
            }}
          >
            Developer: Verify & Continue
          </button>
      )}


      
      <div style={{marginTop:20, fontSize:'0.8rem', color:'var(--auth-text-secondary)'}}>
          Wrong email? <span className="auth-link" onClick={() => {
              auth.signOut();
              window.location.href = '/login';
          }}>Sign Out</span>
      </div>

      {/* Debug Info */}
      <div style={{marginTop: 10, fontSize: '0.7rem', opacity: 0.3}}>
          UID: {user?.uid || 'Unknown'} <br/>
      </div>
    </div>
  );
}
