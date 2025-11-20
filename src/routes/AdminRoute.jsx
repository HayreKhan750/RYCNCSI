import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!profile || profile.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
