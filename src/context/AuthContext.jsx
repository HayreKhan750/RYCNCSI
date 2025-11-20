import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub = null;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      // cleanup previous profile listener
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
      if (u) {
        // Auth is resolved; don't block UI on profile loading
        setLoading(false);
        try {
          // subscribe to profile changes so role reflects as soon as it's written
          const ref = doc(db, 'users', u.uid);
          profileUnsub = onSnapshot(ref, (snap) => {
            setProfile(snap.exists() ? { id: u.uid, ...snap.data() } : null);
          }, (e) => {
            console.error('Failed to subscribe to profile', e);
            setProfile(null);
          });
        } catch (e) {
          console.error('Failed to load profile', e);
          setProfile(null);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => { if (profileUnsub) profileUnsub(); unsub(); };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
