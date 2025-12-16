import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { auth } from '../../firebase';
import AuthLayout from './AuthLayout';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';
import VerifyEmail from './VerifyEmail';
import WelcomeSplash from './WelcomeSplash';
import './AuthSystem.css';

export default function AuthEntry() {
  const [view, setView] = useState('login'); // login, signup, forgot, verify
  const [showSplash, setShowSplash] = useState(true);
  const { user, loading, initialized } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Check auth state on mount (Synced with Redux)
  useEffect(() => {
    // Only redirect if Redux is initialized and we have a user
    if (initialized && user) {
       // Relaxed check: Allow if verified OR if profile indicates they are fully registered
       // EMERGENCY BYPASS: Allow specific UID to enter to run migration
       const ALLOWED_UIDS = ['dH2UzGIvfigE7CgUUYtETtpnwsJ2', 'eLowMYFctOSpM8748S1rHXfx6NV2'];
       
       if (user.isRegistered || ALLOWED_UIDS.includes(user.uid)) {
           // Already verified or registered, redirect to dashboard
           setTimeout(() => {
               if (user.role === 'MANAGEMENT') navigate('/management/dashboard');
               else if (user.role === 'admin') navigate('/admin');
               else navigate('/dashboard');
           }, 500);
       } else {
           setView('verify');
       }
    }
  }, [user, initialized, navigate]);

  // Removed duplicate user declaration

  const handleAuthSuccess = () => {
      // Primary handling is via useEffect, but we add a failsafe here.
      console.log("Login success callback triggered.");
      
      // If user is already loaded in Redux (via the await dispatch in Login.js), we can redirect immediately
      if (user) {
           if (user.role === 'MANAGEMENT') navigate('/management/dashboard');
           else if (user.role === 'admin') navigate('/admin');
           else navigate('/dashboard');
      }
  };

  if (showSplash) {
      return <WelcomeSplash onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AuthLayout>
        {view === 'login' && (
            <Login 
                onNavigate={setView} 
                onLoginSuccess={handleAuthSuccess} 
            />
        )}
        {view === 'signup' && (
            <Signup 
                onNavigate={setView} 
            />
        )}
        {view === 'forgot' && (
            <ForgotPassword 
                onNavigate={setView} 
            />
        )}
        {view === 'verify' && (
            <VerifyEmail />
        )}
    </AuthLayout>
  );
}
