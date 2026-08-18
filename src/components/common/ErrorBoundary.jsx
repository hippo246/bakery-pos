import { Component } from 'react';

// Simple, practical ErrorBoundary that actually helps users
// - Shows clear error message
// - Provides Refresh and Clear Cache buttons
// - Logs errors for debugging
// - No health monitor or complex self-healing that doesn't work

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
      errorLog.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent
      });
      // Keep only last 50 errors
      if (errorLog.length > 50) errorLog.shift();
      localStorage.setItem('cafeos_error_log', JSON.stringify(errorLog));
    } catch (_e) {
      // Ignore localStorage errors
    }
    
    this.setState({ errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleClearCache = () => {
    // Clear all localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
      // Also clear IndexedDB using a simpler approach
      if (window.indexedDB) {
        // Delete known databases
        const knownDbs = ['cafeos_db', 'cafeos_state', 'cafeos_cache'];
        knownDbs.forEach(dbName => {
          try {
            indexedDB.deleteDatabase(dbName);
          } catch (e) {
            console.error('Failed to delete database:', dbName, e);
          }
        });
      }
      // Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      // Even if clearing fails, try to reload
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: 40, 
          textAlign: 'center',
          background: '#1E1E1E',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>⚠️</div>
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16, color: '#FFFFFF' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 16, color: '#AAA', marginBottom: 32, lineHeight: 1.6, maxWidth: 500 }}>
            The application encountered an unexpected error. This might be a temporary issue.
          </p>
          
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRefresh}
              style={{
                padding: '16px 32px',
                background: '#E63946',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#C73E3E'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#E63946'}
            >
              Refresh Page
            </button>
            <button
              onClick={this.handleClearCache}
              style={{
                padding: '16px 32px',
                background: '#333',
                color: '#FFFFFF',
                border: '1px solid #444',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#444'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#333'}
            >
              Clear Browser Cache
            </button>
          </div>
          
          {import.meta.env.DEV && (
            <details style={{ marginTop: 32, textAlign: 'left', maxWidth: 600, width: '100%' }}>
              <summary style={{ cursor: 'pointer', fontSize: 14, color: '#888', marginBottom: 16 }}>
                Error Details (Dev Only)
              </summary>
              <pre style={{ 
                padding: 16, 
                background: '#2A2A2A', 
                borderRadius: 8, 
                fontSize: 12, 
                overflow: 'auto',
                maxHeight: 400,
                color: '#AAA',
                border: '1px solid #444'
              }}>
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
