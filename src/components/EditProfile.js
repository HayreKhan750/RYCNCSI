import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useProfileData } from '../contexts/ProfileContext';

export default function EditProfile() {
  const { user } = useSelector((state) => state.auth);
  const { profile, loading, error, updateProfile, uploadAvatar, sendResetPassword, softDeleteAccount } = useProfileData();
  const [form, setForm] = useState({ name: '', department: '', bio: '', coursesTaught: [], officeHours: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        department: profile.department || '',
        bio: profile.bio || '',
        coursesTaught: Array.isArray(profile.coursesTaught) ? profile.coursesTaught : [],
        officeHours: profile.officeHours || '',
      });
    }
  }, [profile]);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMessage('');
    try {
      if (avatarFile) {
        await uploadAvatar(avatarFile);
      }
      const data = {
        ...form,
        // ensure coursesTaught is an array of strings
        coursesTaught: (form.coursesTaught || []).map(x => String(x).trim()).filter(Boolean),
      };
      await updateProfile(data);
      setMessage('Profile updated');
    } catch (e) {
      setMessage(e.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const onResetPassword = async () => {
    await sendResetPassword();
    setMessage('Password reset email sent');
  };

  const onSoftDelete = async () => {
    if (!window.confirm('Mark your account as inactive? You can contact admin to restore.')) return;
    await softDeleteAccount();
    setMessage('Account marked as inactive');
  };

  if (!user) return <div style={{ padding: 12 }}>Please sign in.</div>;

  return (
    <div className="profile-container" style={{ maxWidth: 820 }}>
      <div className="profile-header">
        <div className="profile-avatar">
          <span>{user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'S'}</span>
        </div>
        <div className="profile-info">
          <h2>Edit Profile</h2>
          <p className="profile-email">{user.email}</p>
          <p className="profile-role">Update your information so instructors and admins can recognize you.</p>
        </div>
      </div>

      <div className="profile-content">
        <form onSubmit={onSubmit} className="profile-form-grid">
          <div className="profile-field-card">
            <div className="profile-field-header">
              <span className="profile-field-label">Name</span>
              <span className="profile-field-meta">Required</span>
            </div>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Your full name"
              className="search-input"
            />
          </div>
          <div className="profile-field-card">
            <div className="profile-field-header">
              <span className="profile-field-label">Department</span>
              <span className="profile-field-meta">e.g. Computer Science</span>
            </div>
            <input
              name="department"
              value={form.department}
              onChange={onChange}
              placeholder="Computer Science"
              className="search-input"
            />
          </div>

          <div className="profile-field-card profile-field-span">
            <div className="profile-field-header">
              <span className="profile-field-label">Courses Taught</span>
              <span className="profile-field-meta">Paste comma- or line-separated values</span>
            </div>
            <textarea
              name="coursesTaught"
              value={(form.coursesTaught || []).join('\n')}
              onChange={(e)=> setForm(f => ({ ...f, coursesTaught: e.target.value.split(/\n|,/) }))}
              rows={3}
              placeholder={"One course per line, e.g.\nCS101 - Intro to CS\nMATH201 - Calculus II"}
              className="search-input"
            />
            <div className="profile-field-helper">Stored as a smart list so we can show your teaching history elegantly.</div>
          </div>

          <div className="profile-field-card">
            <div className="profile-field-header">
              <span className="profile-field-label">Office Hours</span>
              <span className="profile-field-meta">Optional</span>
            </div>
            <input
              name="officeHours"
              value={form.officeHours}
              onChange={onChange}
              placeholder="Mon/Wed 2:00–4:00 PM"
              className="search-input"
            />
          </div>

          <div className="profile-field-card">
            <div className="profile-field-header">
              <span className="profile-field-label">Bio</span>
              <span className="profile-field-meta">How should students see you?</span>
            </div>
            <textarea
              name="bio"
              value={form.bio}
              onChange={onChange}
              rows={4}
              placeholder="Share a short introduction, interests, or teaching philosophy."
              className="search-input"
            />
          </div>

          <div className="profile-field-card profile-field-span">
            <div className="profile-field-header">
              <span className="profile-field-label">Profile Picture</span>
              <span className="profile-field-meta">Helps classmates and instructors recognize you</span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e)=> setAvatarFile(e.target.files?.[0] || null)}
            />
            {profile?.profilePic && (
              <div className="profile-avatar-preview">
                <img src={profile.profilePic} alt="avatar" />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving || loading}
              className="enroll-button"
            >
              {saving ? 'Saving…' : 'Update Profile'}
            </button>
            <button
              type="button"
              onClick={onResetPassword}
              className="enroll-button"
              style={{ background: '#0ea5e9' }}
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={onSoftDelete}
              className="unenroll-button"
            >
              Delete Account
            </button>
          </div>
        </form>

        {error && <div style={{ color: '#b00020', marginTop: 12 }}>{error}</div>}
        {message && <div style={{ color: '#065f46', marginTop: 8 }}>{message}</div>}
      </div>
    </div>
  );
}
