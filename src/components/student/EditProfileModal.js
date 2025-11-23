import React, { useState } from 'react';

export default function EditProfileModal({ profile, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    department: profile?.department || '',
    bio: profile?.bio || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(profile?.profilePictureUrl);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
          setError("Image size must be less than 5MB");
          return;
      }
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        setError("Full Name is required");
        return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(formData, imageFile);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()}>
      <div className="modal-content glass-panel">
        <div className="modal-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
          <h3 style={{margin:0, fontSize:'1.5rem'}}>Edit Profile</h3>
          <button className="close-btn" onClick={onClose} style={{background:'none', border:'none', fontSize:'1.5rem', cursor:'pointer', color:'inherit'}}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group" style={{textAlign:'center', marginBottom: 20}}>
            <div className="avatar-preview" style={{width: 100, height: 100, borderRadius: '50%', margin: '0 auto 10px', overflow: 'hidden', border: '3px solid var(--neon-primary)'}}>
               {previewUrl ? (
                  <img src={previewUrl} alt="Preview" style={{width:'100%', height:'100%', objectFit:'cover'}} />
               ) : (
                  <div style={{width:'100%', height:'100%', background:'#e0e7ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem'}}>
                      {(formData.name || 'S').charAt(0)}
                  </div>
               )}
            </div>
            <label className="upload-btn-label" style={{color: 'var(--neon-primary)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'}}>
               Change Photo
               <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>

          <div className="form-group">
            <label style={{fontWeight:'600', fontSize:'0.9rem', marginLeft: 5}}>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="modern-input"
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group" style={{marginTop: 15}}>
            <label style={{fontWeight:'600', fontSize:'0.9rem', marginLeft: 5}}>Email (Read-only)</label>
            <input 
              type="text" 
              value={profile?.email || ''} 
              disabled
              className="modern-input"
              style={{opacity: 0.6, cursor: 'not-allowed'}}
            />
          </div>

          <div className="form-group" style={{marginTop: 15}}>
            <label style={{fontWeight:'600', fontSize:'0.9rem', marginLeft: 5}}>Department</label>
            <input 
              type="text" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              className="modern-input"
              placeholder="e.g. Computer Science"
            />
          </div>

          <div className="form-group" style={{marginTop: 15}}>
            <label style={{fontWeight:'600', fontSize:'0.9rem', marginLeft: 5}}>Bio</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              rows={3} 
              className="modern-input"
              placeholder="Tell us about yourself..."
            />
          </div>
          
          {error && <p className="error-msg" style={{color:'#ef4444', marginTop: 10, fontSize:'0.9rem'}}>{error}</p>}

          <div className="modal-actions" style={{display:'flex', gap: 15, marginTop: 30}}>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading} style={{flex:1, padding: 12, borderRadius: 12, border:'1px solid var(--glass-border)', background:'transparent', color:'inherit', cursor:'pointer'}}>
                Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading} style={{flex:1, padding: 12, borderRadius: 12, border:'none', background:'var(--neon-primary)', color:'white', fontWeight:'bold', cursor:'pointer'}}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
