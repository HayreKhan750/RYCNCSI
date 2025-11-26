import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: 'white', 
            background: '#1e1e2e', 
            height: '100vh', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center' 
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#ff6b6b' }}>Something went wrong.</h1>
          <p style={{ maxWidth: '600px', marginBottom: '20px', opacity: 0.8 }}>
            The application encountered an unexpected error. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
                padding: '12px 24px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem'
            }}
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '40px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '8px', maxWidth: '800px', overflow: 'auto' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px', color: '#fbbf24' }}>Error Details</summary>
              <pre style={{ color: '#ef4444' }}>{this.state.error.toString()}</pre>
              <pre style={{ fontSize: '0.8rem', opacity: 0.7 }}>{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
