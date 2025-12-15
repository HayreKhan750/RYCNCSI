import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { user, loading, globalLoading, initialized } = useSelector((state) => state.auth);
  
  if (!initialized || loading || globalLoading) {
       return <div style={{ padding: 16, textAlign: 'center' }}>Verifying Admin Privileges...</div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
