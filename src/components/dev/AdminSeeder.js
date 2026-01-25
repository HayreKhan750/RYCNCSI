import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';

const AdminSeeder = () => {
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);

    const handleSeed = async () => {
        setStatus('loading');
        setError(null);
        try {
            // 1. Create Auth
            const email = "admin@aau.edu.et";
            const password = "admin123";
            
            let user;
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                user = cred.user;
            } catch (e) {
                if (e.code === 'auth/email-already-in-use') {
                    setError("User already exists! Please delete it from Firebase Console Authentication tab first, or try logging in.");
                    setStatus('error');
                    return;
                }
                throw e;
            }

            // 2. Create Admin Profile
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                displayName: "System Admin",
                role: 'admin', // THE KEY
                department: 'Management',
                isVerified: true,
                isRegistered: true,
                status: 'active',
                createdAt: serverTimestamp()
            });

            setStatus('success');
        } catch (err) {
            console.error(err);
            setError(err.message);
            setStatus('error');
        }
    };

    return (
        <div style={{ padding: 40, textAlign: 'center', color: 'white' }}>
            <h1>Admin Seeder</h1>
            <p>seed: admin@aau.edu.et / admin123</p>
            
            {status === 'idle' && (
                <button onClick={handleSeed} style={{ padding: 20, fontSize: 18, cursor: 'pointer' }}>
                    Create Admin Account
                </button>
            )}

            {status === 'loading' && <p>Creating...</p>}

            {status === 'success' && (
                <div style={{ color: '#4ade80' }}>
                    <h3>Success!</h3>
                    <p>Admin account created. You can now go to <a href="/login" style={{color:'white'}}>Login</a>.</p>
                </div>
            )}

            {status === 'error' && (
                <div style={{ color: '#ef4444' }}>
                    <h3>Error</h3>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};

export default AdminSeeder;
