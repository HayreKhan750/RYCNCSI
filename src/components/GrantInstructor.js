import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { updateDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function GrantInstructor() {
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
      // 1. Create/Update Instructor Profile
      const instructorRef = doc(db, 'instructors', user.uid);
      const instructorDoc = await getDoc(instructorRef);

      const instructorData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          name: user.displayName || user.email.split('@')[0],
          role: 'instructor',
          department: 'General',
          bio: 'Instructor account granted via DevTools',
          photoURL: user.photoURL || '',
          courses: [],
          stats: { rating: 0, totalReviews: 0 },
          isRegistered: true
      };

      if (!instructorDoc.exists()) {
          await setDoc(instructorRef, { ...instructorData, createdAt: new Date() });
      } else {
          await updateDoc(instructorRef, { role: 'instructor' });
      }

      // 2. CLEANUP: Remove from 'users' and 'students' if exists
      // This ensures the strict "Instructors only in instructors collection" rule
      const userRef = doc(db, 'users', user.uid);
      const studentRef = doc(db, 'students', user.uid);
      
      await deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
      await deleteDoc(doc(db, 'students', user.uid)).catch(() => {});

      setStatus(`Success! Switched role to Instructor for ${user.email}. (Moved to 'instructors' collection, removed from 'users'/'students')`);

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
      <h1>Switch to Instructor Role</h1>
      {user ? (
          <div>
              <p>Logged in as: <strong>{user.email}</strong></p>
              <p>Current Role: {user.uid ? 'Checking...' : 'Unknown'}</p>
              <button onClick={handleGrant} disabled={loading} style={{ padding: 10, fontSize: '1.2rem', cursor: 'pointer', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 5 }}>
                {loading ? 'Processing...' : 'Make Me an Instructor'}
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
          <p>Want to go back to Admin?</p>
          <a href="/grant-admin">Go to Grant Admin Page</a>
      </div>
    </div>
  );
}
