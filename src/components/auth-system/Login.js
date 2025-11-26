import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleLogin, clearError } from '../../store/slices/authSlice';
import AuthInput from './AuthInput';

export default function Login({ onNavigate, onLoginSuccess }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    const resultAction = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(resultAction)) {
        onLoginSuccess();
    }
  };

  const handleGoogle = async () => {
    dispatch(clearError());
    const resultAction = await dispatch(googleLogin());
    if (googleLogin.fulfilled.match(resultAction)) {
        onLoginSuccess();
    }
  };

  return (
    <div className="auth-card">
      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-subtitle">Sign in to continue your journey</p>

      {error && <div className="auth-alert">⚠ {error}</div>}

      <form onSubmit={handleSubmit}>
        <AuthInput 
          label="Email Address" 
          type="email" 
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <AuthInput 
          label="Password" 
          type="password" 
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />

        <div style={{textAlign:'right', marginBottom:20}}>
          <span className="auth-link" onClick={() => onNavigate('forgot')}>Forgot Password?</span>
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'Sign In'}
        </button>
      </form>

      <div className="auth-divider"><span>OR</span></div>

      <button className="auth-btn auth-btn-secondary" onClick={handleGoogle} disabled={loading}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{width:20, height:20}} />
        Continue with Google
      </button>

      <p style={{textAlign:'center', marginTop:24, fontSize:'0.9rem', color:'var(--auth-text-secondary)'}}>
        Don't have an account? <span className="auth-link" onClick={() => onNavigate('signup')}>Sign Up</span>
      </p>
    </div>
  );
}
