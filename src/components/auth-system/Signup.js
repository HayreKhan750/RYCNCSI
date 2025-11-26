import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import AuthInput from './AuthInput';

export default function Signup({ onNavigate }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: 'General',
    role: 'student'
  });
  const [photo, setPhoto] = useState(null);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    dispatch(clearError());
    const resultAction = await dispatch(registerUser({ ...formData, file: photo }));
    if (registerUser.fulfilled.match(resultAction)) {
        onNavigate('verify'); // Redirect to verification
    }
  };

  return (
    <div className="auth-card" style={{maxWidth: 480}}>
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">Join the CNCS community today</p>

      {error && <div className="auth-alert">⚠ {error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{display:'flex', gap:12}}>
             <AuthInput 
                label="Full Name" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{flex:1}}
             />
             <div className="auth-input-group" style={{flex:1}}>
                <select 
                    className="auth-input" 
                    name="department" 
                    value={formData.department} 
                    onChange={handleChange}
                    style={{appearance:'none'}}
                >
                    <option value="General">General Dept</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Tech">Information Tech</option>
                    <option value="Software Eng">Software Eng</option>
                </select>
                <label className="auth-label" style={{transform:'translateY(-26px) translateX(-4px) scale(0.85)', color:'var(--auth-accent)', fontWeight:600}}>Department</label>
             </div>
        </div>

        <AuthInput 
          label="Email Address" 
          type="email" 
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <div style={{display:'flex', gap:12}}>
            <AuthInput 
              label="Password" 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <AuthInput 
              label="Confirm" 
              type="password" 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
        </div>

        {/* Role Selection */}
        <div style={{display:'flex', gap:20, marginBottom:20}}>
            <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                <input 
                    type="radio" 
                    name="role" 
                    value="student" 
                    checked={formData.role === 'student'} 
                    onChange={handleChange}
                /> 
                Student
            </label>
            <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                <input 
                    type="radio" 
                    name="role" 
                    value="instructor" 
                    checked={formData.role === 'instructor'} 
                    onChange={handleChange}
                /> 
                Instructor
            </label>
        </div>

        {/* Profile Upload */}
        <div style={{marginBottom:20}}>
            <label style={{display:'block', fontSize:'0.9rem', color:'var(--auth-text-secondary)', marginBottom:8}}>
                Profile Picture (Optional)
            </label>
            <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                style={{fontSize:'0.9rem'}}
            />
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? <div className="spinner"></div> : 'Create Account'}
        </button>
      </form>

      <p style={{textAlign:'center', marginTop:24, fontSize:'0.9rem', color:'var(--auth-text-secondary)'}}>
        Already have an account? <span className="auth-link" onClick={() => onNavigate('login')}>Log In</span>
      </p>
    </div>
  );
}
