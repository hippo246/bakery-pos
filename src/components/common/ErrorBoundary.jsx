import { Component } from 'react';
import { getSelfHealingEngine } from '../../operations/SelfHealingEngine.js';
import { getStatePersistence } from '../../operations/StatePersistence.js';
import { getDataValidator } from '../../operations/DataValidator.js';

// PERFORMANCE & RESILIENCE: Enhanced ErrorBoundary with self-healing
// - Logs errors to localStorage for debugging
// - Provides graceful fallback UI
// - Supports retry with state reset
// - Prevents error cascades
// - Integrates with SelfHealingEngine for intelligent error handling
// - Uses StatePersistence for crash recovery
// - Triggers automatic recovery actions based on error type

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorType: null,
      recoveryAction: null,
      isRecovering: false,
      showHealthMonitor: false,
      healthStatus: null
    };
    
    this.selfHealingEngine = getSelfHealingEngine();
    this.statePersistence = getStatePersistence();
    this.dataValidator = getDataValidator();
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Classify error type
    const errorType = this.selfHealingEngine.errorClassifier.classify(error.message);
    this.setState({ errorType });
    
    // Determine recovery action
    const recoveryAction = this.getRecoveryAction(errorType);
    this.setState({ recoveryAction });
    
    // Save state before error for recovery
    try {
      await this.statePersistence.saveBeforeRiskyOperation('error_boundary', {
        error: error.message,
        componentStack: errorInfo.componentStack
      });
    } catch (e) {
      console.error('[ErrorBoundary] Failed to save state:', e);
    }
    
    // Log error to localStorage for debugging in production
    try {
      const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
      errorLog.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorType,
        recoveryAction,
        userAgent: navigator.userAgent
      });
      // Keep only last 50 errors to prevent localStorage bloat
      if (errorLog.length > 50) errorLog.shift();
      localStorage.setItem('cafeos_error_log', JSON.stringify(errorLog));
    } catch (_e) {
      // Ignore localStorage errors
    }
    
    // Trigger automatic recovery if applicable
    if (recoveryAction === 'auto_retry') {
      this.handleAutoRecovery();
    }
  }

  getRecoveryAction(errorType) {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return 'queue_retry';
      case 'VALIDATION_ERROR':
        return 'show_form';
      case 'PERMISSION_ERROR':
        return 'redirect_login';
      case 'TRANSIENT_ERROR':
        return 'auto_retry';
      case 'PERMANENT_ERROR':
        return 'manual_intervention';
      default:
        return 'user_retry';
    }
  }

  handleAutoRecovery = async () => {
    this.setState({ isRecovering: true });
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Attempt to recover
    try {
      // Validate data integrity
      const validation = await this.dataValidator.validateAllData();
      
      if (Object.values(validation).every(v => v.valid || v.message)) {
        // Data is valid, try retry
        this.setState({ hasError: false, error: null, errorInfo: null, isRecovering: false });
      } else {
        // Data issues detected, stay in error state
        this.setState({ isRecovering: false });
      }
    } catch (error) {
      console.error('[ErrorBoundary] Auto-recovery failed:', error);
      this.setState({ isRecovering: false });
    }
  };

  handleRetry = async () => {
    this.setState({ isRecovering: true });
    
    try {
      // Attempt state recovery
      const recovery = await this.statePersistence.restoreAfterCrash();
      
      if (recovery.success) {
        console.log('[ErrorBoundary] State recovered successfully');
      }
      
      this.setState({ hasError: false, error: null, errorInfo: null, isRecovering: false });
    } catch (error) {
      console.error('[ErrorBoundary] Retry failed:', error);
      this.setState({ isRecovering: false });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleShowHealthMonitor = () => {
    // Get health status and show in modal
    const health = this.selfHealingEngine.getHealthStatus();
    this.setState({ 
      showHealthMonitor: true, 
      healthStatus: health 
    });
  };

  handleCloseHealthMonitor = () => {
    this.setState({ showHealthMonitor: false, healthStatus: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <>
          <div style={{ 
            padding: 32, 
            textAlign: 'center',
            background: '#1E1E1E',
            borderRadius: 12,
            maxWidth: 500,
            margin: '40px auto',
            border: '2px solid #E63946',
            color: '#FFFFFF'
          }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>
              {this.state.isRecovering ? '🔄' : '⚠️'}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#FFFFFF' }}>
              {this.state.isRecovering ? 'Recovering...' : 'Something went wrong'}
            </h3>
            <p style={{ fontSize: 14, color: '#AAA', marginBottom: 24, lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred. The app has recovered from this error.'}
            </p>
            
            {this.state.errorType && (
              <div style={{ 
                fontSize: 12, 
                color: '#FFD166', 
                marginBottom: 16,
                padding: '8px 12px',
                backgroundColor: '#2A2A2A',
                borderRadius: 4,
                display: 'inline-block'
              }}>
                Error Type: {this.state.errorType}
              </div>
            )}
            
            {this.state.recoveryAction && (
              <div style={{ 
                fontSize: 12, 
                color: '#2ECC71', 
                marginBottom: 16,
                padding: '8px 12px',
                backgroundColor: '#2A2A2A',
                borderRadius: 4,
                display: 'inline-block'
              }}>
                Recovery Action: {this.state.recoveryAction}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRecovering}
                style={{
                  padding: '12px 24px',
                  background: this.state.isRecovering ? '#444' : '#E63946',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  cursor: this.state.isRecovering ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {this.state.isRecovering ? 'Recovering...' : 'Try Again'}
              </button>
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: '#333',
                  color: '#FFFFFF',
                  border: '1px solid #444',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleShowHealthMonitor}
                style={{
                  padding: '12px 24px',
                  background: '#333',
                  color: '#FFFFFF',
                  border: '1px solid #444',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                Health Monitor
              </button>
            </div>
            {import.meta.env.DEV && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: 12, color: '#888' }}>
                  Error Details (Dev Only)
                </summary>
                <pre style={{ 
                  marginTop: 12, 
                  padding: 12, 
                  background: '#2A2A2A', 
                  borderRadius: 6, 
                  fontSize: 11, 
                  overflow: 'auto',
                  maxHeight: 200,
                  color: '#AAA'
                }}>
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
          
          {/* Health Monitor Modal */}
          {this.state.showHealthMonitor && this.state.healthStatus && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#2A2A2A',
                borderRadius: 12,
                padding: 24,
                maxWidth: 600,
                width: '90vw',
                maxHeight: '80vh',
                overflowY: 'auto',
                border: '1px solid #444'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
                    System Health Status
                  </h3>
                  <button
                    onClick={this.handleCloseHealthMonitor}
                    style={{
                      background: '#444',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {this.state.healthStatus.status && (
                  <div style={{
                    padding: '16px',
                    borderRadius: 8,
                    marginBottom: 16,
                    background: (this.state.healthStatus.status === 'healthy') ? '#1E3A1E' : '#3A1E1E',
                    border: `1px solid ${(this.state.healthStatus.status === 'healthy') ? '#2ECC71' : '#E63946'}`
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 4 }}>
                      Overall Status
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: (this.state.healthStatus.status === 'healthy') ? '#2ECC71' : '#E63946' }}>
                      {(this.state.healthStatus.status || 'UNKNOWN').toUpperCase()}
                    </div>
                  </div>
                )}
                
                {this.state.healthStatus.checks && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 12 }}>
                      Health Checks
                    </div>
                    {Object.entries(this.state.healthStatus.checks || {}).map(([name, check]) => (
                      <div
                        key={name}
                        style={{
                          padding: '12px',
                          borderRadius: 6,
                          marginBottom: 8,
                          background: '#333',
                          border: `1px solid ${check.healthy ? '#2ECC71' : '#E63946'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF' }}>
                            {name}
                          </span>
                          <span style={{
                            fontSize: 12,
                            padding: '4px 8px',
                            borderRadius: 4,
                            background: check.healthy ? '#1E3A1E' : '#3A1E1E',
                            color: check.healthy ? '#2ECC71' : '#E63946',
                            fontWeight: 600
                          }}>
                            {check.healthy ? 'HEALTHY' : 'UNHEALTHY'}
                          </span>
                        </div>
                        {check.message && (
                          <div style={{ fontSize: 12, color: '#AAA', marginTop: 4 }}>
                            {check.message}
                          </div>
                        )}
                        {check.lastChecked && (
                          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                            Last checked: {new Date(check.lastChecked).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={this.handleCloseHealthMonitor}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#444',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return this.props.children;
  }
}
