import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import AuthInput from './AuthInput';
import { collection, getDocs, query, orderBy } from 'firebase/firestore'; 
import { db } from '../../firebase';
import { instructorService } from '../../services/instructorService';

export default function Signup({ onNavigate }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loading = status === 'loading' || isSubmitting;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'student'
  });
  const [photo, setPhoto] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    // Fetch departments dynamically from Instructor Data
    const fetchDepts = async () => {
        try {
            const instructors = await instructorService.fetchAllInstructors();
            const uniqueDepts = [...new Set(instructors.map(i => i.department || i.Dept).filter(Boolean))].sort();
            
            if (uniqueDepts.length > 0) {
                setDepartments(uniqueDepts);
            }
        } catch (e) {
            console.error("Failed to fetch depts", e);
        }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
        alert("Password must be at least 6 characters long");
        return;
    }
    
    if (!formData.email.endsWith('@aau.edu.et')) {
        alert("Verification Error: Please use your official university email (@aau.edu.et) to sign up.");
        return;
    }
    
    setIsSubmitting(true);
    dispatch(clearError());
    
    try {
        const resultAction = await dispatch(registerUser({ ...formData, file: photo }));
        if (registerUser.fulfilled.match(resultAction)) {
            onNavigate('verify'); 
        } else {
            console.error(resultAction.payload);
            setIsSubmitting(false); // Reset on failure
        }
    } catch (err) {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-card" style={{maxWidth: 480}}>
      <h1 className="auth-title">Create Account</h1>
      <p className="auth-subtitle">Join the AcademicPulse community today</p>

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
             
             {/* Dynamic Department Input with Datalist */}
             <div className="auth-input-group" style={{flex:1}}>
                <input 
                    list="dept-list"
                    className="auth-input" 
                    name="department" 
                    value={formData.department} 
                    onChange={handleChange}
                    placeholder=" "
                    required
                />
                <label className="auth-label">Department</label>
                <datalist id="dept-list">
                    {departments.map((dept, i) => <option key={i} value={dept} />)}
                    {/* Fallbacks if DB is empty */}
                    {!departments.length && (
                        <>
                            <option value="Computer Science" />
                            <option value="Information Systems" />
                            <option value="Software Engineering" />
                        </>
                    )}
                </datalist>
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
        <div style={{display:'flex', gap:20, marginBottom:20, justifyContent:'center'}}>
            <label style={radioStyle}>
                <input type="radio" name="role" value="student" checked={formData.role === 'student'} onChange={handleChange} style={{marginRight:8}} /> 
                Student
            </label>
            <label style={radioStyle}>
                <input type="radio" name="role" value="instructor" checked={formData.role === 'instructor'} onChange={handleChange} style={{marginRight:8}} /> 
                Instructor
            </label>
            <label style={radioStyle}>
                <input type="radio" name="role" value="MANAGEMENT" checked={formData.role === 'MANAGEMENT'} onChange={handleChange} style={{marginRight:8}} /> 
                Management
            </label>
        </div>

        {/* Premium File Upload */}
        <div style={{marginBottom:24, textAlign:'center'}}>
            <input 
                id="file-upload"
                type="file" 
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files[0])}
                style={{display:'none'}}
            />
            <label htmlFor="file-upload" className="auth-btn auth-btn-secondary" style={{cursor:'pointer', display:'inline-block', width:'auto', padding:'8px 24px', fontSize:'0.9rem'}}>
                {photo ? `📷 ${photo.name.substring(0, 15)}${photo.name.length>15?'...':''}` : '📷 Choose Profile Picture'}
            </label>
            {photo && <div style={{fontSize:'0.75rem', color:'var(--auth-accent)', marginTop:4}}>Image Selected</div>}
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

const radioStyle = {
    display:'flex', alignItems:'center', cursor:'pointer', fontSize:'0.95rem', fontWeight:500, color:'var(--auth-text)'
};
