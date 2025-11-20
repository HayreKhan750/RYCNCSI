import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import '../components/Login.css';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isUniversityEmail = (val) => {
    const lower = String(val || '').toLowerCase();
    return lower.endsWith('@aau.edu.et');
  };

  const validate = () => {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email) return 'Please enter your email.';
    if (!isUniversityEmail(email)) return 'Please use your university email (@aau.edu.et).';
    if (!password) return 'Please enter a password.';
    if (password.length < 6) return 'Password should be at least 6 characters.';
    if (!confirmPassword) return 'Please confirm your password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    if (!role) return 'Please select a role.';
    return '';
  };

  const createProfileDoc = async (uid, data) => {
    await setDoc(doc(db, 'users', uid), {
      name: data.name,
      email: data.email,
      role: data.role,
      departmentId: data.department || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: auth.currentUser?.emailVerified || false,
    }, { merge: true });

    if (data.role === 'instructor') {
      await setDoc(doc(db, 'instructors', uid), {
        displayName: data.name,
        departmentId: data.department || null,
        photoURL: '',
        bio: '',
        aggregates: { avgRating: 0, ratingCount: 0, tagsMap: {} },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setError('');
    const v = validate();
    if (v) { setError(v); return; }

    if (!auth) {
      setError('Authentication service is not available. Please check your Firebase configuration.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createProfileDoc(cred.user.uid, { name, email, role, department });
      // Send verification email
      try { await sendEmailVerification(cred.user); } catch (_) {}
      // After successful signup, send user to /verify so they can confirm their email
      navigate('/verify');
    } catch (err) {
      const code = err.code || '';
      if (code.includes('email-already-in-use')) {
        setError('An account already exists with this email. Please log in instead.');
      } else if (code.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (code.includes('weak-password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (code.includes('invalid-api-key')) {
        setError('Firebase is not configured correctly. Please check your configuration.');
      } else if (code.includes('network-request-failed')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');

    if (!auth || !googleProvider) {
      setError('Authentication service is not available. Please check your Firebase configuration.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const u = cred.user;
      if (!isUniversityEmail(u?.email)) {
        setError('Please sign up with your university email (@aau.edu.et).');
        try { await deleteUser(u); } catch (_) { try { await auth.signOut(); } catch (_) {} }
        return;
      }
      await createProfileDoc(u.uid, {
        name: u.displayName || name || u.email,
        email: u.email,
        role,
        department,
      });
      // Send verification email
      try { await sendEmailVerification(u); } catch (_) {}
      // After signup, go to /verify so they can confirm their email
      navigate('/verify');
    } catch (err) {
      const code = err.code || '';
      if (code.includes('popup-closed-by-user')) {
        setError('Sign-up popup was closed. Please try again.');
      } else if (code.includes('invalid-api-key')) {
        setError('Firebase is not configured correctly. Please check your configuration.');
      } else if (code.includes('network-request-failed')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Google sign-up failed.');
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
          <h2 className="login-title">Create your account</h2>
          <p className="login-sub">Sign up to start rating and reviewing your CNCS instructors.</p>
        </div>

        <form className="login-form" onSubmit={handleEmailSignup}>
          <div className="input-group">
            <input
              className="login-input"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              type="text"
              required
            />
          </div>

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
              autoComplete="new-password"
              required
            />
          </div>

          <div className="input-group">
            <input
              className="login-input"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="input-group">
            <select
              className="login-input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="input-group">
            <input
              className="login-input"
              placeholder="Department (optional)"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              type="text"
            />
          </div>

          {error && (
            <div className="error" role="alert">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="login-actions">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </div>

          <div className="divider">or continue with</div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogle}
            disabled={loading}
            aria-label="Sign up with Google"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              style={{ width: 20, height: 20 }}
            />
            Sign up with Google
          </button>

          <div className="links-container">
            <Link to="/login" className="muted-link">
              Already have an account? <span style={{ fontWeight: 600 }}>Log in</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
