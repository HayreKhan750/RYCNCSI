import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useSelector((state) => state.auth);
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
