// Session Manager
// Session security with timeout, idle detection, and auto-lock

import { SecurityInterface } from './SecurityInterface.js';
import { SessionStatus, SecurityStatus } from './SecurityTypes.js';

export class SessionManager extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.sessionTimeout = config.sessionTimeout || 30 * 60 * 1000; // 30 minutes
    this.idleTimeout = config.idleTimeout || 15 * 60 * 1000; // 15 minutes
    this.sessions = new Map();
    this.activeSessionId = null;
    this.lastActivity = Date.now();
    this.locked = false;
    this.storageKey = 'cafeos_session_manager';
    this.loadState();
    this.startActivityMonitoring();
  }

  /**
   * Initialize the session manager
   */
  async initialize() {
    this.status = SecurityStatus.SECURE;
    return { success: true };
  }

  /**
   * Start activity monitoring
   */
  startActivityMonitoring() {
    // Monitor user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    this.activityHandler = () => {
      this.lastActivity = Date.now();
    };

    events.forEach(event => {
      document.addEventListener(event, this.activityHandler);
    });

    // Start idle check interval
    this.idleCheckInterval = setInterval(() => {
      this.checkIdle();
    }, 1000);

    // Start session timeout check
    this.sessionCheckInterval = setInterval(() => {
      this.checkSessionTimeout();
    }, 5000);
  }

  /**
   * Check for idle timeout
   */
  checkIdle() {
    const idleTime = Date.now() - this.lastActivity;
    
    if (idleTime > this.idleTimeout && !this.locked) {
      this.lock();
    }
  }

  /**
   * Check for session timeout
   */
  checkSessionTimeout() {
    if (!this.activeSessionId) {
      return;
    }

    const session = this.sessions.get(this.activeSessionId);
    if (!session) {
      return;
    }

    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    
    if (sessionAge > this.sessionTimeout) {
      this.expireSession(this.activeSessionId);
    }
  }

  /**
   * Create a new session
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {object} metadata - Session metadata
   * @returns {object} Session creation result
   */
  createSession(userId, userRole, metadata = {}) {
    const sessionId = this.generateSessionId();
    
    const session = {
      sessionId,
      userId,
      userRole,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString(),
      device: this.getDeviceInfo(),
      metadata
    };

    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    this.lastActivity = Date.now();
    this.saveState();

    return { success: true, sessionId, session };
  }

  /**
   * Get active session
   * @returns {object|null} Active session
   */
  getActiveSession() {
    if (!this.activeSessionId) {
      return null;
    }

    return this.sessions.get(this.activeSessionId) || null;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {object|null} Session
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions for a user
   * @param {string} userId - User ID
   * @returns {Array} User sessions
   */
  getUserSessions(userId) {
    const sessions = [];
    for (const [_sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /**
   * Update session activity
   * @param {string} sessionId - Session ID
   * @returns {object} Update result
   */
  updateSessionActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    session.lastActivity = new Date().toISOString();
    session.expiresAt = new Date(Date.now() + this.sessionTimeout).toISOString();
    this.lastActivity = Date.now();
    this.saveState();

    return { success: true };
  }

  /**
   * Expire a session
   * @param {string} sessionId - Session ID
   * @returns {object} Expiration result
   */
  expireSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    session.status = SessionStatus.EXPIRED;
    session.expiredAt = new Date().toISOString();
    
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    this.saveState();
    return { success: true, sessionId };
  }

  /**
   * Terminate a session
   * @param {string} sessionId - Session ID
   * @returns {object} Termination result
   */
  terminateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    session.status = SessionStatus.TERMINATED;
    session.terminatedAt = new Date().toISOString();
    
    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    this.saveState();
    return { success: true, sessionId };
  }

  /**
   * Lock the session
   */
  lock() {
    this.locked = true;
    console.log('[SessionManager] Session locked due to inactivity');
  }

  /**
   * Unlock the session
   */
  unlock() {
    this.locked = false;
    this.lastActivity = Date.now();
    console.log('[SessionManager] Session unlocked');
  }

  /**
   * Check if session is locked
   * @returns {boolean} Locked status
   */
  isLocked() {
    return this.locked;
  }

  /**
   * Force logout all sessions for a user
   * @param {string} userId - User ID
   * @returns {object} Logout result
   */
  forceLogoutUser(userId) {
    const terminated = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        this.terminateSession(sessionId);
        terminated.push(sessionId);
      }
    }

    return { success: true, terminated };
  }

  /**
   * Get session statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const sessions = Array.from(this.sessions.values());
    const active = sessions.filter(s => s.status !== SessionStatus.EXPIRED && s.status !== SessionStatus.TERMINATED);
    const expired = sessions.filter(s => s.status === SessionStatus.EXPIRED);
    const terminated = sessions.filter(s => s.status === SessionStatus.TERMINATED);

    const byRole = {};
    sessions.forEach(s => {
      byRole[s.userRole] = (byRole[s.userRole] || 0) + 1;
    });

    return {
      total: sessions.length,
      active: active.length,
      expired: expired.length,
      terminated: terminated.length,
      byRole,
      locked: this.locked,
      lastActivity: new Date(this.lastActivity).toISOString()
    };
  }

  /**
   * Generate session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information
   * @returns {object} Device info
   */
  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    
    return {
      userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (this.sessionTimeout < 60000) {
      return { valid: false, reason: 'Session timeout too short (minimum 1 minute)' };
    }

    if (this.idleTimeout < 30000) {
      return { valid: false, reason: 'Idle timeout too short (minimum 30 seconds)' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    // Deduct for short session timeout
    if (this.sessionTimeout < 15 * 60 * 1000) {
      score -= 10;
    }

    // Deduct for short idle timeout
    if (this.idleTimeout < 10 * 60 * 1000) {
      score -= 10;
    }

    // Deduct if session is locked
    if (this.locked) {
      score -= 5;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (this.sessionTimeout < 15 * 60 * 1000) {
      recommendations.push({
        level: 'warning',
        message: 'Session timeout is less than 15 minutes',
        action: 'Consider increasing session timeout for better security'
      });
    }

    if (this.idleTimeout < 10 * 60 * 1000) {
      recommendations.push({
        level: 'warning',
        message: 'Idle timeout is less than 10 minutes',
        action: 'Consider increasing idle timeout for better security'
      });
    }

    if (this.locked) {
      recommendations.push({
        level: 'info',
        message: 'Session is currently locked',
        action: 'Unlock session to continue'
      });
    }

    return recommendations;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        sessions: Array.from(this.sessions.entries()),
        activeSessionId: this.activeSessionId,
        locked: this.locked,
        lastActivity: this.lastActivity
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save session manager state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.sessions = new Map(parsed.sessions || []);
        this.activeSessionId = parsed.activeSessionId || null;
        this.locked = parsed.locked || false;
        this.lastActivity = parsed.lastActivity || Date.now();
      }
    } catch (error) {
      console.error('Failed to load session manager state:', error);
      this.sessions = new Map();
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.sessions.clear();
    this.activeSessionId = null;
    this.locked = false;
    this.lastActivity = Date.now();
    localStorage.removeItem(this.storageKey);
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the session manager
   */
  async destroy() {
    // Clear event listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.activityHandler);
    });

    // Clear intervals
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }

    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    await this.reset();
    console.log('[SessionManager] Destroyed');
  }
}

// Singleton instance
let sessionManagerInstance = null;

/**
 * Get the singleton session manager instance
 * @returns {SessionManager} Session manager instance
 */
export function getSessionManager() {
  if (!sessionManagerInstance) {
    sessionManagerInstance = new SessionManager();
  }
  return sessionManagerInstance;
}

export default SessionManager;
