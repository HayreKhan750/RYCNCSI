import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      if (!user) { setProfile(null); return; }
      try {
        const refDoc = doc(db, 'users', user.uid);
        const snap = await getDoc(refDoc);
        if (snap.exists()) setProfile({ id: user.uid, ...snap.data() });
        else setProfile({ id: user.uid, email: user.email, role: 'student' });
      } catch (e) {
        console.error(e);
      }
    };
    run();
  }, [user?.uid]);

  const updateProfile = async (data) => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const refDoc = doc(db, 'users', user.uid);
      await setDoc(refDoc, { ...data, email: user.email, updatedAt: serverTimestamp() }, { merge: true });
      setProfile(prev => ({ ...(prev||{}), ...data }));
    } catch (e) {
      setError(e.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const uploadAvatar = async (file) => {
    if (!user || !file) return null;
    const r = ref(storage, `avatars/${user.uid}`);
    await uploadBytes(r, file);
    const url = await getDownloadURL(r);
    await updateProfile({ profilePic: url });
    return url;
  };

  const sendResetPassword = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
  };

  const softDeleteAccount = async () => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { inactive: true, updatedAt: serverTimestamp() });
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, error, updateProfile, uploadAvatar, sendResetPassword, softDeleteAccount }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfileData = () => useContext(ProfileContext);
