import React, { useState } from 'react';
import './Login.css';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  deleteUser,
} from 'firebase/auth';
import { auth, googleProvider, BYPASS_AUTH, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection, addDoc } from 'firebase/firestore';
import { getMultiFactorResolver } from 'firebase/auth';
import { useMfa } from '../contexts/MfaContext';

async function ensureUserProfile(u) {
  if (!u || !db) return;
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const role = inferRoleFromEmail(u.email);
  const payload = {
    email: u.email,
    displayName: u.displayName || u.email,
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
}

function inferRoleFromEmail(email) {
  const e = String(email || '').toLowerCase();
  if (e.includes('admin') || e.includes('@admin.')) return 'admin';
  if (e.includes('instructor') || e.includes('@instructor.') || e.includes('@teacher.')) return 'instructor';
  return 'student';
}

async function sendEmailOtp(u) {
  if (!u?.email) return;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const ref = doc(db, 'emailOtps', u.uid);
  const expiresAt = Timestamp.fromMillis(Date.now() + 10 * 60 * 1000); // 10 minutes
  await setDoc(ref, {
    email: u.email,
    code,
    createdAt: serverTimestamp(),
    expiresAt,
  }, { merge: true });
  // Send email via Firebase Trigger Email extension by writing to 'mail' collection
  const mail = {
    to: [u.email],
    message: {
      subject: 'Your sign-in code',
      text: `Your sign-in code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your sign-in code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`
    }
  };
  try { addDoc(collection(db, 'mail'), mail).catch(()=>{}); } catch (_) {}
  if (process.env.NODE_ENV === 'development') {
    // For local testing only; remove for production
    // eslint-disable-next-line no-console
    console.log('[DEV] Email OTP code:', code);
  }
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setResolver } = useMfa();

  const validate = () => {
    if (!email) return 'Please enter your email.';
    if (!password) return 'Please enter your password.';
    if (!isUniversityEmail(email)) return 'Please use your university email (@aau.edu.et).';
    return '';
  };

  const isUniversityEmail = (e) => {
    const lower = String(e || '').toLowerCase();
    return lower.endsWith('@aau.edu.et');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }
    
    
    if (BYPASS_AUTH) {
      // In development mode, go straight to the dashboard
      navigate('/');
      return;
    }
    
    if (!auth) {
      setError('Authentication service is not available. Please check your Firebase configuration.');
      return;
    }
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const u = userCredential.user;

      // Block unverified emails
      if (!u.emailVerified) {
        try { await auth.signOut(); } catch (_) {}
        setError('Please verify your email first. We have sent a verification link to your inbox.');
        setLoading(false);
        return;
      }

      // Ensure profile exists and get role for redirect
      try { await ensureUserProfile(u); } catch (_) {}

      let role = 'student';
      if (db && u?.uid) {
        try {
          const ref = doc(db, 'users', u.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            role = snap.data().role || 'student';
          }
        } catch (_) {}
      }

      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin/import');
      } else {
        navigate('/');
      }

      setLoading(false);
    } catch (err) {
      // If project enforces MFA, user must satisfy it in console settings. We keep generic errors here.
      // Provide friendly messages for common errors
      const code = err.code || '';
      if (code.includes('user-not-found')) {
        setError('No account found for this email.');
      } else if (code.includes('wrong-password')) {
        setError('Incorrect password.');
      } else if (code.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (code.includes('invalid-api-key')) {
        setError('Firebase is not configured correctly. Please check your configuration.');
      } else if (code.includes('network-request-failed')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to sign in.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  const handleGoogle = async () => {
    setError('');
    
    if (BYPASS_AUTH) {
      navigate('/');
      return;
    }
    
    if (!auth || !googleProvider) {
      setError('Authentication service is not available. Please check your Firebase configuration.');
      return;
    }
    
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred?.user;
      if (!isUniversityEmail(u?.email)) {
        setError('Please sign in with your university email (@aau.edu.et).');
        // Remove the non-allowed account from Firebase Auth
        try { await deleteUser(u); } catch (_) { try { await auth.signOut(); } catch (_) {} }
        return;
      }
      // Navigate immediately; do follow-up work in background
      // Navigate immediately to dashboard
      setLoading(false);
      navigate('/');
      // Fire-and-forget post actions; do not block navigation
      try { ensureUserProfile(u).catch(()=>{}); } catch (_) {}
      // try { sendEmailOtp(u).catch(()=>{}); } catch (_) {}
    } catch (err) {
      const code = err.code || '';
      if (code.includes('popup-closed-by-user')) {
        setError('Sign-in popup was closed. Please try again.');
      } else if (code.includes('invalid-api-key')) {
        setError('Firebase is not configured correctly. Please check your configuration.');
      } else if (code.includes('network-request-failed')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Google sign-in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container" role="main">
        <div className="login-header">
          <div className="login-logo">
            <span>🎓</span>
          </div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-sub">Sign in to access your dashboard and rate instructors.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <input
              className="login-input"
              placeholder="University Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <input
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="login-actions">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

          <div className="divider">or continue with</div>

          <button 
            type="button" 
            className="google-btn" 
            onClick={handleGoogle} 
            disabled={loading}
            aria-label="Sign in with Google"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              style={{ width: 20, height: 20 }} 
            />
            Sign in with Google
          </button>

          <div className="links-container">
            <Link to="/forgot-password" className="muted-link">
              Forgot your password?
            </Link>
            <Link to="/signup" className="muted-link">
              Don't have an account? <span style={{ fontWeight: 600 }}>Sign up</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
