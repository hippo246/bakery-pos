import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Save error to localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
      errorLog.push({
        id: this.state.errorId,
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
      // Keep only last 50 errors
      if (errorLog.length > 50) errorLog.splice(0, errorLog.length - 50);
      localStorage.setItem('error_log', JSON.stringify(errorLog));
    } catch (e) {
      // Silent fail if localStorage is unavailable
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  handleCopyError = () => {
    const errorText = `Error ID: ${this.state.errorId}\n\nError: ${this.state.error?.toString()}\n\nStack Trace:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}\n\nTimestamp: ${new Date().toISOString()}\n\nURL: ${window.location.href}`;
    
    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy error details');
    });
  };

  handleDownloadLog = () => {
    const errorData = {
      id: this.state.errorId,
      timestamp: new Date().toISOString(),
      error: this.state.error?.toString(),
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      localStorage: { ...localStorage }
    };
    
    const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-${this.state.errorId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  handleClearErrorLog = () => {
    if (confirm('Clear all error history?')) {
      localStorage.removeItem('error_log');
      alert('Error log cleared');
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#f3f4f6',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: '#1a1a1a' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              Error ID: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{this.state.errorId}</code>
            </p>
            
            {this.state.error && (
              <details style={{ marginBottom: '16px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#2563eb', marginBottom: '8px', fontWeight: '600' }}>
                  View technical details
                </summary>
                <pre style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  background: '#f9fafb',
                  padding: '12px',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  border: '1px solid #e5e7eb'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={this.handleCopyError}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📋 Copy Error
              </button>
              <button
                onClick={this.handleDownloadLog}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💾 Download Log
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Refresh Page
              </button>
            </div>

            <button
              onClick={this.handleClearErrorLog}
              style={{
                width: '100%',
                padding: '8px 16px',
                background: 'transparent',
                color: '#9ca3af',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Clear error history
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
