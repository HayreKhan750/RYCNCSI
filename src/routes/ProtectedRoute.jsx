import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { user, loading, globalLoading, initialized } = useSelector((state) => state.auth);
  
  // Wait for initial auth check to complete
  if (!initialized || loading || globalLoading) {
      return <div style={{ padding: 16, textAlign: 'center' }}>Authenticating...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Relaxed check: Allow if verified OR if profile indicates they are fully registered
  // Also checking whitelist to prevent infinite loop
  const ALLOWED_UIDS = ['dH2UzGIvfigE7CgUUYtETtpnwsJ2', 'eLowMYFctOSpM8748S1rHXfx6NV2'];
  
  if (user && !user.emailVerified && !user.isRegistered && !ALLOWED_UIDS.includes(user.uid)) {
      return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
