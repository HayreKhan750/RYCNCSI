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
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>Edit Profile</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <div className="form-group image-upload-group">
            <div className="avatar-preview">
               {previewUrl ? (
                  <img src={previewUrl} alt="Preview" />
               ) : (
                  <div className="avatar-placeholder">{(formData.name || 'S').charAt(0)}</div>
               )}
            </div>
            <label className="upload-btn-label">
               Change Photo
               <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className="modern-input"
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <input 
              type="text" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              className="modern-input"
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea 
              name="bio" 
              value={formData.bio} 
              onChange={handleChange} 
              rows={3} 
              className="modern-input"
              placeholder="Tell us about yourself..."
            />
          </div>
          
          {error && <p className="error-msg">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
