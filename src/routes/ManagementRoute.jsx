import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ManagementRoute = ({ children }) => {
  const { user, loading, globalLoading, initialized } = useSelector((state) => state.auth);

  if (!initialized || loading || globalLoading) {
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

  // Strict Role Check
  if (user.role !== 'MANAGEMENT') {
      return <Navigate to="/" replace />;
  }

  // Optional: Enforce AAU Email Domain if required strictly here
  // const isAAUEmail = user.email.endsWith('@aau.edu.et'); 
  // if (!isAAUEmail) return <Navigate to="/" replace />;

  return children;
};

export default ManagementRoute;
