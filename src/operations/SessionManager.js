// Session Timeout Handling
// Detect expired sessions, auto-refresh tokens, graceful session expiry, state persistence

export class SessionManager {
  constructor(options = {}) {
    this.options = {
      sessionTimeout: options.sessionTimeout || 30 * 60 * 1000, // 30 minutes default
      warningThreshold: options.warningThreshold || 5 * 60 * 1000, // 5 minutes warning
      tokenRefreshThreshold: options.tokenRefreshThreshold || 2 * 60 * 1000, // 2 minutes before expiry
      autoRefresh: options.autoRefresh !== false,
      persistState: options.persistState !== false,
      ...options
    };
    
    this.sessionTimeout = this.options.sessionTimeout;
    this.warningThreshold = this.options.warningThreshold;
    this.tokenRefreshThreshold = this.options.tokenRefreshThreshold;
    this.sessionExpiry = null;
    this.tokenExpiry = null;
    this.refreshTimer = null;
    this.warningTimer = null;
    this.sessionTimer = null;
    this.eventHandlers = new Map();
    this.sessionState = null;
    this.lastActivity = Date.now();
    this.isActive = false;
  }

  /**
   * Start session
   */
  startSession(token, tokenExpiry) {
    console.log('[SessionManager] Starting session');
    
    this.isActive = true;
    this.lastActivity = Date.now();
    this.tokenExpiry = tokenExpiry || (Date.now() + this.sessionTimeout);
    this.sessionExpiry = Date.now() + this.sessionTimeout;
    
    // Save session state
    this.saveSessionState();
    
    // Start timers
    this.startTimers();
    
    this.emit('sessionStarted', { tokenExpiry: this.tokenExpiry });
  }

  /**
   * Start timers
   */
  startTimers() {
    this.stopTimers();
    
    // Token refresh timer
    if (this.options.autoRefresh && this.tokenExpiry) {
      const refreshTime = this.tokenExpiry - this.tokenRefreshThreshold;
      const refreshDelay = Math.max(0, refreshTime - Date.now());
      
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshDelay);
    }
    
    // Warning timer
    const warningTime = this.sessionExpiry - this.warningThreshold;
    const warningDelay = Math.max(0, warningTime - Date.now());
    
    this.warningTimer = setTimeout(() => {
      this.emit('sessionWarning', { timeRemaining: this.warningThreshold });
    }, warningDelay);
    
    // Session expiry timer
    const expiryDelay = Math.max(0, this.sessionExpiry - Date.now());
    
    this.sessionTimer = setTimeout(() => {
      this.handleSessionExpiry();
    }, expiryDelay);
  }

  /**
   * Stop timers
   */
  stopTimers() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Refresh token
   */
  async refreshToken() {
    console.log('[SessionManager] Refreshing token');
    
    this.emit('tokenRefresh', { timestamp: Date.now() });
    
    // Token refresh should be handled by the caller
    // This is a hook for the application to implement
  }

  /**
   * Update token expiry
   */
  updateTokenExpiry(newExpiry) {
    console.log('[SessionManager] Updating token expiry');
    
    this.tokenExpiry = newExpiry;
    this.sessionExpiry = Date.now() + this.sessionTimeout;
    this.lastActivity = Date.now();
    
    this.saveSessionState();
    this.startTimers();
    
    this.emit('tokenUpdated', { tokenExpiry: this.tokenExpiry });
  }

  /**
   * Record activity
   */
  recordActivity() {
    this.lastActivity = Date.now();
    
    // Extend session if needed
    const timeUntilExpiry = this.sessionExpiry - Date.now();
    
    if (timeUntilExpiry < this.sessionTimeout / 2) {
      this.extendSession();
    }
  }

  /**
   * Extend session
   */
  extendSession() {
    console.log('[SessionManager] Extending session');
    
    this.sessionExpiry = Date.now() + this.sessionTimeout;
    this.saveSessionState();
    this.startTimers();
    
    this.emit('sessionExtended', { newExpiry: this.sessionExpiry });
  }

  /**
   * Handle session expiry
   */
  handleSessionExpiry() {
    console.log('[SessionManager] Session expired');
    
    this.isActive = false;
    this.stopTimers();
    
    // Save state before expiry
    if (this.options.persistState) {
      this.saveCurrentState();
    }
    
    this.emit('sessionExpired', { timestamp: Date.now() });
    
    // Clear session
    this.clearSession();
  }

  /**
   * End session
   */
  endSession() {
    console.log('[SessionManager] Ending session');
    
    this.isActive = false;
    this.stopTimers();
    
    this.emit('sessionEnded', { timestamp: Date.now() });
    
    this.clearSession();
  }

  /**
   * Clear session
   */
  clearSession() {
    this.sessionExpiry = null;
    this.tokenExpiry = null;
    this.sessionState = null;
    
    localStorage.removeItem('cafeos_session_state');
    localStorage.removeItem('cafeos_current_state');
  }

  /**
   * Save session state
   */
  saveSessionState() {
    const state = {
      isActive: this.isActive,
      sessionExpiry: this.sessionExpiry,
      tokenExpiry: this.tokenExpiry,
      lastActivity: this.lastActivity,
      timestamp: Date.now()
    };
    
    this.sessionState = state;
    
    try {
      localStorage.setItem('cafeos_session_state', JSON.stringify(state));
    } catch (error) {
      console.error('[SessionManager] Failed to save session state:', error);
    }
  }

  /**
   * Save current application state
   */
  saveCurrentState() {
    // This should be implemented by the application
    // Hook for saving current page, cart, etc.
    console.log('[SessionManager] Saving current state');
    
    this.emit('saveState', { timestamp: Date.now() });
  }

  /**
   * Load saved state
   */
  loadSavedState() {
    try {
      const saved = localStorage.getItem('cafeos_current_state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[SessionManager] Failed to load saved state:', error);
    }
    
    return null;
  }

  /**
   * Restore session
   */
  restoreSession() {
    try {
      const saved = localStorage.getItem('cafeos_session_state');
      if (saved) {
        const state = JSON.parse(saved);
        
        // Check if session is still valid
        if (state.sessionExpiry && Date.now() < state.sessionExpiry) {
          console.log('[SessionManager] Restoring session');
          
          this.isActive = state.isActive;
          this.sessionExpiry = state.sessionExpiry;
          this.tokenExpiry = state.tokenExpiry;
          this.lastActivity = state.lastActivity;
          this.sessionState = state;
          
          this.startTimers();
          
          this.emit('sessionRestored', { state });
          
          return true;
        } else {
          console.log('[SessionManager] Saved session expired');
          this.clearSession();
          return false;
        }
      }
    } catch (error) {
      console.error('[SessionManager] Failed to restore session:', error);
    }
    
    return false;
  }

  /**
   * Check if session is valid
   */
  isSessionValid() {
    if (!this.isActive || !this.sessionExpiry) {
      return false;
    }
    
    return Date.now() < this.sessionExpiry;
  }

  /**
   * Get time until expiry
   */
  getTimeUntilExpiry() {
    if (!this.sessionExpiry) {
      return 0;
    }
    
    return Math.max(0, this.sessionExpiry - Date.now());
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    return {
      isActive: this.isActive,
      sessionExpiry: this.sessionExpiry,
      tokenExpiry: this.tokenExpiry,
      lastActivity: this.lastActivity,
      timeUntilExpiry: this.getTimeUntilExpiry(),
      timeUntilWarning: Math.max(0, this.sessionExpiry - this.warningThreshold - Date.now()),
      timeUntilRefresh: Math.max(0, this.tokenExpiry - this.tokenRefreshThreshold - Date.now())
    };
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[SessionManager] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the session manager
   */
  destroy() {
    this.stopTimers();
    this.eventHandlers.clear();
    this.clearSession();
    console.log('[SessionManager] Destroyed');
  }
}

// Singleton instance
let sessionManagerInstance = null;

/**
 * Get the singleton session manager instance
 */
export function getSessionManager(options = {}) {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager(options);
  }
  return sessionManagerInstance;
}

export default SessionManager;
