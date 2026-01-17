import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { user, mfaStatus } = useSelector((state) => state.auth);
  
  // Note: Hydration loading is handled globally in App.js via AuthGuard
  
  if (!user) {
      return <Navigate to="/login" replace />;
  }
  
  // Phase 1: MFA Gate
  if (mfaStatus === 'required') {
      return <Navigate to="/mfa-verify" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
