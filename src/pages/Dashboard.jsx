import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Dashboard</h2>
      <div>
        <div>User: {user?.email}</div>
        <div>Role: {profile?.role || 'unknown'}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleLogout}>Logout</button>
      </div>
      {profile?.role === 'admin' && (
        <div style={{ marginTop: 16 }}>
          <strong>Admin Shortcuts</strong>
          <div>
            <button onClick={() => navigate('/admin/import')}>Open Importer</button>
          </div>
        </div>
      )}
    </div>
  );
}
