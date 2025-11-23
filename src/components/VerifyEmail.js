import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function VerifyEmail() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [polling, setPolling] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && user.emailVerified) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          navigate('/');
        }
      } catch (_) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [user, navigate, polling]);

  const handleResend = async () => {
    if (!auth.currentUser) return;
    if (cooldown > 0) return;
    setStatus('sending');
    setError('');
    try {
      await sendEmailVerification(auth.currentUser);
      setStatus('sent');
      setCooldown(30);
      setPolling(true);
      // start cooldown ticker
      const timer = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (e) {
      setError(e.message || 'Failed to send verification email.');
      setStatus('error');
    }
  };

  const handleIHaveVerified = async () => {
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        navigate('/');
      }
      // Not verified yet: stop polling and show an info message
      setPolling(false);
      setError('Not verified yet. Please check your inbox and try again, or resend the email.');
    } catch (_) {}
  };

  const handleBack = () => {
    navigate('/login');
  };

  if (loading) return <div style={{ padding: 16 }}>Checking your status…</div>;
  if (!user) return <div style={{ padding: 16 }}>You are not signed in.</div>;

  return (
    <div className="login-container" role="main" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📧</div>
      <h2 className="login-title">Verify your email</h2>
      <p className="login-sub">
        We sent a verification link to <span className="badge">{user.email}</span>
      </p>

      {error && <div className="error" role="alert" style={{ textAlign: 'left' }}>{error}</div>}

      <div className={`progress ${!polling ? 'paused' : ''}`} aria-hidden>
        <div className="progress-bar" />
      </div>
      <div style={{ marginTop: 8, color: '#555', fontSize: 13 }}>Waiting for verification… Checking every 3 seconds.</div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="login-btn" onClick={handleResend} disabled={status === 'sending' || cooldown > 0}>
          {status === 'sending' ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </button>
        <button className="ghost-btn" onClick={handleIHaveVerified}>I have verified</button>
        <button className="ghost-btn" onClick={handleBack}>Back</button>
      </div>

      <div style={{ marginTop: 12, color: '#6b7280', fontSize: 12 }}>
        Tip: Open your inbox in a new tab, click the link, and return here.
      </div>
    </div>
  );
}
