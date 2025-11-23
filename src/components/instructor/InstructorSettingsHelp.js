import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function InstructorSettingsHelp() {
  const { user } = useAuth();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setEmailNotifs(Boolean(snap.data()?.notificationPrefs?.email !== false));
      }
    };
    run();
  }, [user?.uid]);

  const save = async () => {
    if (!user) return;
    setSaving(true); setMessage('');
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, { notificationPrefs: { email: emailNotifs } }, { merge: true });
      setMessage('Settings saved');
    } catch (e) {
      setMessage(e.message || 'Failed to save settings');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <h2>Settings & Help</h2>
      <div style={{ marginTop: 12, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={emailNotifs} onChange={(e)=>setEmailNotifs(e.target.checked)} />
          Email notifications for new feedback
        </label>
        <div style={{ marginTop: 12 }}>
          <button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
          {message && <span style={{ marginLeft: 8, color: '#065f46' }}>{message}</span>}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Help / FAQ</h3>
        <ul>
          <li>How to view feedback: Open “Feedbacks”.</li>
          <li>How to analyze performance: Open “Analytics”.</li>
          <li>Contact admin: admin@cncs.edu</li>
        </ul>
      </div>
    </div>
  );
}
