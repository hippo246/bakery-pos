// Terminal Session Manager
// Per-terminal session management with activity logging

import { getTerminalManager } from './TerminalManager.js';
import { getSessionManager } from '../operations/SessionManager.js';

export class TerminalSessionManager {
  constructor(options = {}) {
    this.options = {
      sessionTimeout: options.sessionTimeout || 30 * 60 * 1000, // 30 minutes
      activityLogging: options.activityLogging !== false,
      ...options
    };
    
    this.terminalManager = getTerminalManager();
    this.sessionManager = getSessionManager();
    this.terminalSessions = new Map(); // terminalId -> { staffId, loginTime, lastActivity, activities }
    this.eventHandlers = new Map();
    
    this.loadTerminalSessions();
  }

  /**
   * Load terminal sessions from localStorage
   */
  loadTerminalSessions() {
    try {
      const stored = localStorage.getItem('cafeos_terminal_sessions');
      if (stored) {
        this.terminalSessions = new Map(JSON.parse(stored));
      }
    } catch (error) {
      console.error('[TerminalSessionManager] Failed to load terminal sessions:', error);
    }
  }

  /**
   * Save terminal sessions to localStorage
   */
  saveTerminalSessions() {
    try {
      localStorage.setItem('cafeos_terminal_sessions', JSON.stringify(Array.from(this.terminalSessions)));
    } catch (error) {
      console.error('[TerminalSessionManager] Failed to save terminal sessions:', error);
    }
  }

  /**
   * Login staff to terminal
   */
  loginToTerminal(terminalId, staffId, staffName = null) {
    const terminal = this.terminalManager.getTerminal(terminalId);
    
    if (!terminal) {
      throw new Error(`Terminal not found: ${terminalId}`);
    }
    
    // Check if staff is already assigned to terminal
    if (!terminal.assignedStaff.includes(staffId)) {
      this.terminalManager.assignStaff(terminalId, staffId);
    }
    
    // Create terminal session
    const session = {
      terminalId,
      terminalName: terminal.name,
      staffId,
      staffName: staffName || staffId,
      loginTime: Date.now(),
      lastActivity: Date.now(),
      activities: [],
      isActive: true
    };
    
    this.terminalSessions.set(terminalId, session);
    this.saveTerminalSessions();
    
    console.log(`[TerminalSessionManager] Staff ${staffId} logged into terminal ${terminalId}`);
    
    this.emit('staffLoggedIn', { terminalId, staffId, session });
    
    return session;
  }

  /**
   * Logout staff from terminal
   */
  logoutFromTerminal(terminalId) {
    const session = this.terminalSessions.get(terminalId);
    
    if (!session) {
      return null;
    }
    
    session.isActive = false;
    session.logoutTime = Date.now();
    
    this.terminalSessions.set(terminalId, session);
    this.saveTerminalSessions();
    
    console.log(`[TerminalSessionManager] Staff logged out from terminal ${terminalId}`);
    
    this.emit('staffLoggedOut', { terminalId, session });
    
    return session;
  }

  /**
   * Get session for terminal
   */
  getTerminalSession(terminalId) {
    return this.terminalSessions.get(terminalId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const activeSessions = [];
    
    this.terminalSessions.forEach((session, _terminalId) => {
      if (session.isActive) {
        activeSessions.push(session);
      }
    });
    
    return activeSessions;
  }

  /**
   * Get session for staff
   */
  getStaffSessions(staffId) {
    const staffSessions = [];
    
    this.terminalSessions.forEach((session) => {
      if (session.staffId === staffId) {
        staffSessions.push(session);
      }
    });
    
    return staffSessions;
  }

  /**
   * Check if staff is logged into terminal
   */
  isStaffLoggedIn(terminalId, staffId) {
    const session = this.terminalSessions.get(terminalId);
    
    return session && session.isActive && session.staffId === staffId;
  }

  /**
   * Check if staff is logged into any terminal
   */
  isStaffLoggedInAnywhere(staffId) {
    const sessions = this.getStaffSessions(staffId);
    return sessions.some(s => s.isActive);
  }

  /**
   * Record activity for terminal session
   */
  recordActivity(terminalId, activity) {
    if (!this.options.activityLogging) {
      return;
    }
    
    const session = this.terminalSessions.get(terminalId);
    
    if (!session || !session.isActive) {
      return;
    }
    
    const activityRecord = {
      ...activity,
      timestamp: Date.now(),
      terminalId,
      staffId: session.staffId
    };
    
    session.activities.push(activityRecord);
    session.lastActivity = Date.now();
    
    // Keep only last 100 activities
    if (session.activities.length > 100) {
      session.activities.shift();
    }
    
    this.terminalSessions.set(terminalId, session);
    this.saveTerminalSessions();
    
    this.emit('activityRecorded', { terminalId, activity: activityRecord });
  }

  /**
   * Get activities for terminal
   */
  getTerminalActivities(terminalId, limit = 50) {
    const session = this.terminalSessions.get(terminalId);
    
    if (!session) {
      return [];
    }
    
    return session.activities.slice(-limit);
  }

  /**
   * Get activities for staff
   */
  getStaffActivities(staffId, limit = 50) {
    const allActivities = [];
    
    this.terminalSessions.forEach((session) => {
      if (session.staffId === staffId) {
        allActivities.push(...session.activities);
      }
    });
    
    // Sort by timestamp
    allActivities.sort((a, b) => b.timestamp - a.timestamp);
    
    return allActivities.slice(0, limit);
  }

  /**
   * Check session timeout
   */
  checkSessionTimeout(terminalId) {
    const session = this.terminalSessions.get(terminalId);
    
    if (!session || !session.isActive) {
      return false;
    }
    
    const inactiveTime = Date.now() - session.lastActivity;
    
    if (inactiveTime > this.options.sessionTimeout) {
      // Session expired
      this.logoutFromTerminal(terminalId);
      
      this.emit('sessionExpired', { terminalId, session });
      
      return true;
    }
    
    return false;
  }

  /**
   * Check all session timeouts
   */
  checkAllSessionTimeouts() {
    const expiredTerminals = [];
    
    this.terminalSessions.forEach((session, terminalId) => {
      if (this.checkSessionTimeout(terminalId)) {
        expiredTerminals.push(terminalId);
      }
    });
    
    return expiredTerminals;
  }

  /**
   * Get session statistics
   */
  getSessionStatistics() {
    const stats = {
      totalSessions: this.terminalSessions.size,
      activeSessions: 0,
      inactiveSessions: 0,
      byStaff: {},
      byTerminal: {},
      averageSessionDuration: 0
    };
    
    let totalDuration = 0;
    let sessionCount = 0;
    
    this.terminalSessions.forEach((session, terminalId) => {
      if (session.isActive) {
        stats.activeSessions++;
        totalDuration += (Date.now() - session.loginTime);
        sessionCount++;
      } else {
        stats.inactiveSessions++;
        totalDuration += (session.logoutTime - session.loginTime);
        sessionCount++;
      }
      
      // By staff
      if (!stats.byStaff[session.staffId]) {
        stats.byStaff[session.staffId] = {
          staffName: session.staffName,
          sessionCount: 0,
          terminalIds: []
        };
      }
      stats.byStaff[session.staffId].sessionCount++;
      stats.byStaff[session.staffId].terminalIds.push(terminalId);
      
      // By terminal
      if (!stats.byTerminal[terminalId]) {
        stats.byTerminal[terminalId] = {
          terminalName: session.terminalName,
          staffId: session.staffId,
          staffName: session.staffName,
          isActive: session.isActive
        };
      }
    });
    
    if (sessionCount > 0) {
      stats.averageSessionDuration = totalDuration / sessionCount;
    }
    
    return stats;
  }

  /**
   * Transfer session between terminals
   */
  transferSession(fromTerminalId, toTerminalId) {
    const fromSession = this.terminalSessions.get(fromTerminalId);
    
    if (!fromSession || !fromSession.isActive) {
      throw new Error('No active session on source terminal');
    }
    
    // Logout from source
    this.logoutFromTerminal(fromTerminalId);
    
    // Login to destination
    const toSession = this.loginToTerminal(toTerminalId, fromSession.staffId, fromSession.staffName);
    
    this.emit('sessionTransferred', {
      fromTerminalId,
      toTerminalId,
      staffId: fromSession.staffId
    });
    
    return toSession;
  }

  /**
   * Clear session history for terminal
   */
  clearTerminalHistory(terminalId) {
    const session = this.terminalSessions.get(terminalId);
    
    if (session) {
      session.activities = [];
      this.terminalSessions.set(terminalId, session);
      this.saveTerminalSessions();
    }
  }

  /**
   * Clear all inactive sessions
   */
  clearInactiveSessions() {
    const cleared = [];
    
    this.terminalSessions.forEach((session, terminalId) => {
      if (!session.isActive) {
        this.terminalSessions.delete(terminalId);
        cleared.push(terminalId);
      }
    });
    
    this.saveTerminalSessions();
    
    return cleared.length;
  }

  /**
   * Update session timeout
   */
  setSessionTimeout(timeout) {
    this.options.sessionTimeout = timeout;
  }

  /**
   * Enable/disable activity logging
   */
  setActivityLogging(enabled) {
    this.options.activityLogging = enabled;
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
          console.error(`[TerminalSessionManager] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the terminal session manager
   */
  destroy() {
    this.terminalSessions.clear();
    this.eventHandlers.clear();
    console.log('[TerminalSessionManager] Destroyed');
  }
}

// Singleton instance
let terminalSessionManagerInstance = null;

/**
 * Get the singleton terminal session manager instance
 */
export function getTerminalSessionManager(options = {}) {
  if (!terminalSessionManagerInstance) {
    terminalSessionManagerInstance = new TerminalSessionManager(options);
  }
  return terminalSessionManagerInstance;
}

export default TerminalSessionManager;
