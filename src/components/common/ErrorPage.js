import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ErrorPage.css'; // We'll create this next

const ErrorPage = ({ error, resetErrorBoundary }) => {
  const navigate = useNavigate();

  const handleHome = () => {
    if (resetErrorBoundary) resetErrorBoundary();
    navigate('/');
    window.location.reload(); // Hard reload to clear bad state
  };

  return (
    <div className="error-page-container">
      <div className="glass-card error-card">
        <div className="error-icon">⚠️</div>
        <h1>Something went wrong</h1>
        <p className="error-message">
          {error?.message || "An unexpected error occurred. Our team has been notified."}
        </p>
        
        <div className="error-actions">
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
          <button onClick={handleHome} className="home-btn">
            Go Home
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="error-details">
            <summary>Error Details</summary>
            <pre>{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
