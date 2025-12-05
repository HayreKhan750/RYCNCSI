import React, { useState } from 'react';
import useContentModeration from '../../hooks/useContentModeration';

export default function ProfileEditForm({ profile, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    department: profile?.department || '',
    bio: profile?.bio || '',
  });
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const { validateContent } = useContentModeration();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate Name
    if (!validateContent(form.name)) return;
    
    // Validate Bio
    if (!validateContent(form.bio)) return;

    onSave(form, imageFile);
  };

  return (
    <div className="profile-content" style={{ marginBottom: '20px' }}>
      <h3>Edit Profile</h3>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px', maxWidth: '600px' }}>
        <div>
          <label><strong>Name</strong></label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="search-input"
          />
        </div>
        <div>
          <label><strong>Department</strong></label>
          <input
            type="text"
            name="department"
            value={form.department}
            onChange={handleChange}
            className="search-input"
          />
        </div>
        <div>
          <label><strong>Bio</strong></label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            className="search-input"
            rows={3}
          />
        </div>
        <div>
          <label><strong>Profile Picture</strong></label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button type="submit" className="enroll-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="unenroll-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
