import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useUser } from '../contexts/UserContext';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    const checkExistingAuth = async () => {
      if (user) {
        setLoading(true);
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            // If logged in but not admin, maybe show error or just stay (auth logic handles this usually)
            // For this page, we might want to force logout if they try to access admin with student account
            // But let's just let them try to login with admin creds
          }
        } catch (err) {
          console.error("Auth check error", err);
        } finally {
          setLoading(false);
        }
      }
    };
    checkExistingAuth();
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Authenticate
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      // 2. Verify Admin Role
      const userDocRef = doc(db, 'users', loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          // Success
          navigate('/admin/dashboard');
        } else {
          // Not an admin
          await auth.signOut();
          setError('Access Denied: You do not have administrator privileges.');
        }
      } else {
        // No user record found (shouldn't happen if auth worked, but safety check)
        await auth.signOut();
        setError('User record not found.');
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err.code === 'auth/user-not-found') setError('No admin account found with this email.');
      else if (err.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err.code === 'auth/too-many-requests') setError('Too many failed attempts. Try again later.');
      else setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-logo">🛡️</div>
          <h1>Admin Portal</h1>
          <p>Secure access for moderators</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="admin-form-group">
            <div className="admin-input-wrapper">
              <input
                type="email"
                className="admin-input"
                placeholder="Admin Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <div className="admin-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="admin-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span 
                className="input-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : "Access Dashboard"}
          </button>
        </form>

        <div className="admin-footer">
          <a href="/" className="admin-link">← Return to Main Site</a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
