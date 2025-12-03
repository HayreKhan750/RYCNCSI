import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleLogin, clearError } from '../store/slices/authSlice';
import '../styles/AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === 'admin') {
        navigate('/admin');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const resultAction = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(resultAction)) {
        const loggedInUser = resultAction.payload;
        if (loggedInUser.role !== 'admin') {
            // If not admin, maybe logout or show error?
            // For now, let's just show alert and not navigate
            alert("Access Denied: You do not have administrator privileges.");
        } else {
            navigate('/admin');
        }
    }
  };

  const handleGoogleLogin = async () => {
      dispatch(clearError());
      const resultAction = await dispatch(googleLogin());
      if (googleLogin.fulfilled.match(resultAction)) {
          const loggedInUser = resultAction.payload;
          if (loggedInUser.role !== 'admin') {
              alert("Access Denied: You do not have administrator privileges.");
          } else {
              navigate('/admin');
          }
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

        <div className="divider" style={{margin: '20px 0', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem'}}>or</div>

        <button 
            type="button" 
            className="admin-login-btn google-btn" 
            onClick={handleGoogleLogin} 
            disabled={loading}
            style={{background: '#fff', color: '#333', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}
        >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              style={{ width: 18, height: 18 }} 
            />
            Sign in with Google
        </button>

        <div className="admin-footer">
          <a href="/" className="admin-link">← Return to Main Site</a>
        </div>
        

      </div>
    </div>
  );
};

export default AdminLogin;
