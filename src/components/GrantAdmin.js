import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function GrantAdmin() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
      });
      return () => unsubscribe();
  }, []);

  const handleGrant = async () => {
    if (!user) {
        setStatus('Please sign in first!');
        return;
    }
    setLoading(true);
    setStatus('Processing...');
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create doc if missing
        await setDoc(userRef, {
            email: user.email,
            role: 'admin',
            uid: user.uid
        });
        setStatus(`Created user doc and granted Admin access to ${user.email}`);
      } else {
        await updateDoc(userRef, {
            role: 'admin'
        });
        setStatus(`Success! Granted Admin access to ${user.email}`);
      }

    } catch (error) {
      console.error(error);
      if (error.message.includes('offline')) {
          setStatus('Network Error: You seem to be offline. Please check your connection and try again.');
      } else {
          setStatus('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 50, textAlign: 'center' }}>
      <h1>Grant Admin Access</h1>
      {user ? (
          <div>
              <p>Logged in as: <strong>{user.email}</strong></p>
              <p>UID: {user.uid}</p>
              <button onClick={handleGrant} disabled={loading} style={{ padding: 10, fontSize: '1.2rem', cursor: 'pointer' }}>
                {loading ? 'Processing...' : 'Promote Me to Admin'}
              </button>
          </div>
      ) : (
          <div>
              <p>Please log in to the application first, then refresh this page.</p>
              <a href="/login" style={{color: 'blue'}}>Go to Login</a>
          </div>
      )}
      
      <p style={{ marginTop: 20, fontWeight: 'bold', color: status.includes('Success') ? 'green' : 'red' }}>{status}</p>
    </div>
  );
}
