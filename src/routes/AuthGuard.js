import React from 'react';
import { useSelector } from 'react-redux';
import GlobalLoader from '../components/common/GlobalLoader';

const AuthGuard = ({ children }) => {
  const { authStatus } = useSelector((state) => state.auth);

  if (authStatus === 'idle' || authStatus === 'checking' || authStatus === 'authenticated') {
    // Block rendering until technically 'hydrated' (profile loaded)
    return <GlobalLoader message="Hydrating User Session..." />;
  }

  return children;
};

export default AuthGuard;
