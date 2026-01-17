import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createInstructorProfile } from '../../store/slices/instructorSlice';
import Header from '../common/Header';

export default function InstructorSetup() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            setStatus('creating');
            try {
                console.log("Attempting to create instructor profile for:", user.uid);
                // Auto-create with data from Auth User
                await dispatch(createInstructorProfile({
                    uid: user.uid,
                    data: {
                        fullName: user.displayName || 'Instructor',
                        email: user.email,
                        department: 'General', // Default
                        photoURL: user.photoURL
                    }
                })).unwrap();
                
                console.log("Profile created successfully.");
                setStatus('success');
                setTimeout(() => {
                    // Use window location to FORCE a full state refresh of the dashboard
                    window.location.href = '/instructor/dashboard';
                }, 1500);
            } catch (e) {
                console.error("Setup Failed:", e);
                setError(e.message || "Failed to create profile");
                setStatus('failed');
            }
        };
        init();
    }, [user, dispatch]);

    return (
        <div style={{padding: 40, textAlign: 'center', background: '#0a0a0a', minHeight: '100vh', color: 'white'}}>
            <Header title="Account Recovery" />
            
            <div style={{marginTop: 100}}>
                {status === 'creating' && (
                    <>
                        <div className="spinner" style={{marginBottom: 20}}></div>
                        <h2>Initializing Instructor Profile...</h2>
                        <p>Repairing database record...</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <h2 style={{color: '#10b981'}}>✔ Success!</h2>
                        <p>Profile created. Redirecting to dashboard...</p>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <h2 style={{color: '#ef4444'}}>⚠ Recovery Failed</h2>
                        <p>{error}</p>
                        <button onClick={() => window.location.reload()} className="auth-btn auth-btn-primary" style={{marginTop: 20}}>Retry</button>
                    </>
                )}
            </div>
        </div>
    );
}
