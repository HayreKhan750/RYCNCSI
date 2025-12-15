import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { grantAdminAccess } from '../store/slices/adminSlice';
import { checkAuthState } from '../store/slices/authSlice';

export default function GrantAdmin() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { operationStatus, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    // Ensure we have fresh auth state
    if (!user) {
        dispatch(checkAuthState());
    }
  }, [dispatch, user]);

  const handleGrant = () => {
    if (!user) return;
    dispatch(grantAdminAccess({ uid: user.uid, email: user.email }));
  };

  return (
    <div style={{ padding: 50, textAlign: 'center' }}>
      <h1>Grant Admin Access</h1>
      {user ? (
          <div>
              <p>Logged in as: <strong>{user.email}</strong></p>
              <p>UID: {user.uid}</p>
              <button 
                onClick={handleGrant} 
                disabled={loading} 
                style={{ padding: 10, fontSize: '1.2rem', cursor: 'pointer' }}
              >
                {loading ? 'Processing...' : 'Promote Me to Admin'}
              </button>
          </div>
      ) : (
          <div>
              <p>Please log in to the application first, then refresh this page.</p>
              <a href="/login" style={{color: 'blue'}}>Go to Login</a>
          </div>
      )}
      
      {operationStatus && (
        <p style={{ marginTop: 20, fontWeight: 'bold', color: operationStatus.success ? 'green' : 'red' }}>
            {operationStatus.message}
        </p>
      )}
    </div>
  );
}
