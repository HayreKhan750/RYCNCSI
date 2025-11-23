import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Optional if using router
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
  const navigate = useNavigate();

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
       if (user) {
           if (user.emailVerified) {
               // Already verified, redirect to dashboard
               // Delay slightly for splash if needed
               setTimeout(() => navigate('/'), 500);
           } else {
               setView('verify');
           }
       }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleAuthSuccess = () => {
      // Force check verification or redirect
      if (auth.currentUser?.emailVerified) {
          navigate('/');
      } else {
          setView('verify');
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
            <VerifyEmail 
                onVerified={() => navigate('/')} 
            />
        )}
    </AuthLayout>
  );
}
