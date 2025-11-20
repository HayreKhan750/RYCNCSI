import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfileData } from '../contexts/ProfileContext';

export default function EditProfile() {
  const { user } = useAuth();
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
    <div style={{ maxWidth: 720 }}>
      <h2>Edit Profile</h2>
      <p style={{ color: '#6b7280' }}>Email: {user.email}</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <div>
          <label>Name</label>
          <input name="name" value={form.name} onChange={onChange} placeholder="Your full name" style={{ width: '100%' }} />
        </div>
        <div>
          <label>Department</label>
          <input name="department" value={form.department} onChange={onChange} placeholder="e.g. Computer Science" style={{ width: '100%' }} />
        </div>
        <div>
          <label>Courses Taught</label>
          <textarea
            name="coursesTaught"
            value={(form.coursesTaught || []).join('\n')}
            onChange={(e)=> setForm(f => ({ ...f, coursesTaught: e.target.value.split(/\n|,/) }))}
            rows={3}
            placeholder={"One course per line, e.g.\nCS101 - Intro to CS\nMATH201 - Calculus II"}
            style={{ width: '100%' }}
          />
          <small style={{ color: '#6b7280' }}>Stored as a list. You can paste comma- or newline-separated values.</small>
        </div>
        <div>
          <label>Office Hours</label>
          <input name="officeHours" value={form.officeHours} onChange={onChange} placeholder="e.g. Mon/Wed 2:00–4:00 PM" style={{ width: '100%' }} />
        </div>
        <div>
          <label>Bio</label>
          <textarea name="bio" value={form.bio} onChange={onChange} rows={4} placeholder="Tell us about yourself" style={{ width: '100%' }} />
        </div>
        <div>
          <label>Profile Picture</label>
          <input type="file" accept="image/*" onChange={(e)=> setAvatarFile(e.target.files?.[0] || null)} />
          {profile?.profilePic && (
            <div style={{ marginTop: 8 }}>
              <img src={profile.profilePic} alt="avatar" style={{ width: 80, height: 80, borderRadius: 999 }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={saving || loading}>{saving ? 'Saving…' : 'Update'}</button>
          <button type="button" onClick={onResetPassword}>Change Password</button>
          <button type="button" onClick={onSoftDelete}>Delete Account</button>
        </div>
      </form>

      {error && <div style={{ color: '#b00020', marginTop: 8 }}>{error}</div>}
      {message && <div style={{ color: '#065f46', marginTop: 8 }}>{message}</div>}
    </div>
  );
}
