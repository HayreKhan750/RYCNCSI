import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function GrantManagement() {
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
        await setDoc(userRef, {
            email: user.email,
            role: 'MANAGEMENT',
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            department: 'Administration',
            createdAt: new Date()
        });
        setStatus(`Created user doc and switched role to MANAGEMENT for ${user.email}`);
      } else {
        await updateDoc(userRef, {
            role: 'MANAGEMENT'
        });
        setStatus(`Success! Switched role to MANAGEMENT for ${user.email}`);
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
      <h1>Switch to Management Role</h1>
      <p>This is a development tool to test the Management Dashboard.</p>
      {user ? (
          <div>
              <p>Logged in as: <strong>{user.email}</strong></p>
              <button onClick={handleGrant} disabled={loading} style={{ padding: 10, fontSize: '1.2rem', cursor: 'pointer', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 5, marginTop: 20 }}>
                {loading ? 'Processing...' : 'Make Me a Manager'}
              </button>
          </div>
      ) : (
          <div>
              <p>Please log in to the application first.</p>
              <a href="/login" style={{color: 'blue'}}>Go to Login</a>
          </div>
      )}
      
      <p style={{ marginTop: 20, fontWeight: 'bold', color: status.includes('Success') ? 'green' : 'red' }}>{status}</p>
      
      <div style={{marginTop: 50, borderTop: '1px solid #ccc', paddingTop: 20}}>
          <p>Other Tools:</p>
          <div style={{display: 'flex', gap: 20, justifyContent: 'center'}}>
             <a href="/grant-admin">Grant Admin</a>
             <a href="/grant-instructor">Grant Instructor</a>
          </div>
      </div>
    </div>
  );
}
