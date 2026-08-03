import React, { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: 24, 
          textAlign: 'center',
          background: 'var(--cafe-bg)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 16px',
              background: 'var(--cafe-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
