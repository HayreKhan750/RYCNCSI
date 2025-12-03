import React, { useState } from 'react';

export default function AdminRegisterUser({ onRegister }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student', // 'student' | 'instructor'
    department: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await onRegister(formData);
      setSuccess(`Successfully registered ${formData.role}: ${formData.email}`);
      setFormData({ name: '', email: '', role: 'student', department: '', bio: '' });
    } catch (err) {
      setError(err.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-glass" style={{padding: 30, maxWidth: 600, margin: '0 auto'}}>
      <h3 style={{marginBottom: 20}}>Register New User</h3>
      
      {success && <div className="status-badge success" style={{display:'block', marginBottom: 20, textAlign:'center'}}>{success}</div>}
      {error && <div className="status-badge danger" style={{display:'block', marginBottom: 20, textAlign:'center'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="adm-form-group">
          <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Full Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className="adm-input" 
            required 
            placeholder="e.g. John Doe"
          />
        </div>

        <div className="adm-form-group" style={{marginTop: 15}}>
          <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Email Address</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            className="adm-input" 
            required 
            placeholder="e.g. john@university.edu"
          />
        </div>

        <div className="adm-form-group" style={{marginTop: 15}}>
          <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Role</label>
          <select 
            name="role" 
            value={formData.role} 
            onChange={handleChange} 
            className="adm-select"
          >
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        {formData.role === 'instructor' && (
          <div className="adm-form-group" style={{marginTop: 15}}>
            <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Department</label>
            <input 
              type="text" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              className="adm-input" 
              required 
              placeholder="e.g. Computer Science"
            />
          </div>
        )}

        <div className="adm-form-group" style={{marginTop: 15}}>
          <label style={{display:'block', marginBottom: 8, fontSize:'0.9rem', opacity:0.8}}>Bio (Optional)</label>
          <textarea 
            name="bio" 
            value={formData.bio} 
            onChange={handleChange} 
            className="adm-input" 
            placeholder="Short bio..."
            rows={3}
          />
        </div>

        <div style={{marginTop: 30}}>
          <button 
            type="submit" 
            className="adm-btn primary" 
            disabled={loading}
            style={{width: '100%', padding: 14, fontSize: '1rem'}}
          >
            {loading ? 'Registering...' : 'Create User Profile'}
          </button>
          <p style={{fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', marginTop: 10}}>
            Note: This creates the user profile. The user must still sign up with this email to access the account.
          </p>
        </div>
      </form>
    </div>
  );
}
