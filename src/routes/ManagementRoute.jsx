import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ManagementRoute = ({ children }) => {
  const { user, authStatus } = useSelector((state) => state.auth);

  // Loading State
  if (authStatus === 'checking' || authStatus === 'authenticated') {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          color: 'var(--text-primary)' 
        }}>
          Loading...
        </div>
      );
  }

  if (!user) {
      return <Navigate to="/login" replace />;
  }

  // Flexible Role Check (Case-insensitive)
  const userRole = user.role ? user.role.toLowerCase() : '';
  if (!['management', 'admin'].includes(userRole)) {
      return <Navigate to="/" replace />;
  }

  // Optional: Enforce AAU Email Domain if required strictly here
  // const isAAUEmail = user.email.endsWith('@aau.edu.et'); 
  // if (!isAAUEmail) return <Navigate to="/" replace />;

  return children;
};

export default ManagementRoute;
