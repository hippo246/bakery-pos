// Terminal Manager
// Multi-terminal management for enterprise POS operations

import { now } from '../domain/dates.js';

const TERMINALS_KEY = 'cafeos_terminals';
const TERMINAL_SESSIONS_KEY = 'cafeos_terminal_sessions';

/**
 * Terminal Status
 */
export const TERMINAL_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  BUSY: 'BUSY',
  IDLE: 'IDLE',
  LOCKED: 'LOCKED',
  DISABLED: 'DISABLED',
  MAINTENANCE: 'MAINTENANCE'
};

/**
 * Device Types
 */
export const DEVICE_TYPES = {
  POS_TERMINAL: 'POS_TERMINAL',
  KIOSK: 'KIOSK',
  TABLET: 'TABLET',
  MOBILE: 'MOBILE',
  KITCHEN_DISPLAY: 'KITCHEN_DISPLAY',
  CUSTOMER_DISPLAY: 'CUSTOMER_DISPLAY'
};

/**
 * Health Status
 */
export const HEALTH_STATUS = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Terminal Manager class
 * Multi-terminal management for enterprise POS operations
 */
export class TerminalManager {
  constructor() {
    this.terminals = new Map();
    this.sessions = new Map();
    this.loadTerminals();
    this.loadSessions();
  }

  /**
   * Load terminals from localStorage
   */
  loadTerminals() {
    try {
      const stored = localStorage.getItem(TERMINALS_KEY);
      if (stored) {
        const terminals = JSON.parse(stored);
        terminals.forEach(terminal => {
          this.terminals.set(terminal.id, terminal);
        });
      }
    } catch (error) {
      console.error('[TerminalManager] Failed to load terminals:', error);
    }
  }

  /**
   * Save terminals to localStorage
   */
  saveTerminals() {
    try {
      const terminals = Array.from(this.terminals.values());
      localStorage.setItem(TERMINALS_KEY, JSON.stringify(terminals));
    } catch (error) {
      console.error('[TerminalManager] Failed to save terminals:', error);
    }
  }

  /**
   * Load sessions from localStorage
   */
  loadSessions() {
    try {
      const stored = localStorage.getItem(TERMINAL_SESSIONS_KEY);
      if (stored) {
        const sessions = JSON.parse(stored);
        sessions.forEach(session => {
          this.sessions.set(session.id, session);
        });
      }
    } catch (error) {
      console.error('[TerminalManager] Failed to load sessions:', error);
    }
  }

  /**
   * Save sessions to localStorage
   */
  saveSessions() {
    try {
      const sessions = Array.from(this.sessions.values());
      localStorage.setItem(TERMINAL_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('[TerminalManager] Failed to save sessions:', error);
    }
  }

  /**
   * Create a terminal
   * @param {Object} terminalData - Terminal data
   * @returns {Object} Created terminal
   */
  createTerminal(terminalData) {
    const terminal = {
      id: terminalData.id || `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: terminalData.name || 'Untitled Terminal',
      
      // Location
      branchId: terminalData.branchId || null,
      location: terminalData.location || '',
      
      // Device
      deviceType: terminalData.deviceType || DEVICE_TYPES.POS_TERMINAL,
      deviceModel: terminalData.deviceModel || null,
      serialNumber: terminalData.serialNumber || null,
      
      // Software
      softwareVersion: terminalData.softwareVersion || '1.0.0',
      lastSync: null,
      
      // Staff assignment
      assignedStaffId: terminalData.assignedStaffId || null,
      assignedShift: terminalData.assignedShift || null,
      
      // Status
      status: terminalData.status || TERMINAL_STATUS.OFFLINE,
      healthStatus: terminalData.healthStatus || HEALTH_STATUS.UNKNOWN,
      
      // Session
      currentSessionId: terminalData.currentSessionId || null,
      
      // Configuration
      capabilities: terminalData.capabilities || [],
      peripherals: terminalData.peripherals || [],
      
      // Audit
      createdAt: now(),
      createdBy: terminalData.createdBy || null,
      lastActivity: null
    };

    this.terminals.set(terminal.id, terminal);
    this.saveTerminals();

    return terminal;
  }

  /**
   * Get terminal by ID
   * @param {string} terminalId - Terminal ID
   * @returns {Object|null} Terminal or null
   */
  getTerminal(terminalId) {
    return this.terminals.get(terminalId) || null;
  }

  /**
   * Get all terminals
   * @returns {Array} Array of terminals
   */
  getAllTerminals() {
    return Array.from(this.terminals.values());
  }

  /**
   * Get terminals by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of terminals
   */
  getTerminalsByBranch(branchId) {
    return this.getAllTerminals().filter(t => t.branchId === branchId);
  }

  /**
   * Get terminals by status
   * @param {string} status - Terminal status
   * @returns {Array} Array of terminals
   */
  getTerminalsByStatus(status) {
    return this.getAllTerminals().filter(t => t.status === status);
  }

  /**
   * Get terminals by device type
   * @param {string} deviceType - Device type
   * @returns {Array} Array of terminals
   */
  getTerminalsByDeviceType(deviceType) {
    return this.getAllTerminals().filter(t => t.deviceType === deviceType);
  }

  /**
   * Get terminals by staff
   * @param {string} staffId - Staff ID
   * @returns {Array} Array of terminals
   */
  getTerminalsByStaff(staffId) {
    return this.getAllTerminals().filter(t => t.assignedStaffId === staffId);
  }

  /**
   * Update terminal
   * @param {string} terminalId - Terminal ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated terminal or null
   */
  updateTerminal(terminalId, updates) {
    const terminal = this.terminals.get(terminalId);
    if (!terminal) return null;

    const updated = {
      ...terminal,...updates,
      updatedAt: now()
    };

    this.terminals.set(terminalId, updated);
    this.saveTerminals();

    return updated;
  }

  /**
   * Delete terminal
   * @param {string} terminalId - Terminal ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteTerminal(terminalId) {
    const deleted = this.terminals.delete(terminalId);
    if (deleted) {
      this.saveTerminals();
    }
    return deleted;
  }

  /**
   * Enable terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Result
   */
  enableTerminal(terminalId) {
    return this.updateTerminal(terminalId, { status: TERMINAL_STATUS.ONLINE });
  }

  /**
   * Disable terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Result
   */
  disableTerminal(terminalId) {
    return this.updateTerminal(terminalId, { status: TERMINAL_STATUS.DISABLED });
  }

  /**
   * Lock terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Result
   */
  lockTerminal(terminalId) {
    return this.updateTerminal(terminalId, { status: TERMINAL_STATUS.LOCKED });
  }

  /**
   * Unlock terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Result
   */
  unlockTerminal(terminalId) {
    return this.updateTerminal(terminalId, { status: TERMINAL_STATUS.ONLINE });
  }

  /**
   * Set terminal status
   * @param {string} terminalId - Terminal ID
   * @param {string} status - New status
   * @returns {Object} Result
   */
  setTerminalStatus(terminalId, status) {
    return this.updateTerminal(terminalId, { status });
  }

  /**
   * Update terminal health
   * @param {string} terminalId - Terminal ID
   * @param {string} healthStatus - Health status
   * @returns {Object} Result
   */
  updateTerminalHealth(terminalId, healthStatus) {
    return this.updateTerminal(terminalId, { healthStatus });
  }

  /**
   * Update last activity
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Result
   */
  updateLastActivity(terminalId) {
    return this.updateTerminal(terminalId, { lastActivity: now() });
  }

  /**
   * Sync terminal
   * @param {string} terminalId - Terminal ID
   * @param {string} softwareVersion - Software version
   * @returns {Object} Result
   */
  syncTerminal(terminalId, softwareVersion) {
    return this.updateTerminal(terminalId, {
      lastSync: now(),
      softwareVersion
    });
  }

  /**
   * Assign staff to terminal
   * @param {string} terminalId - Terminal ID
   * @param {string} staffId - Staff ID
   * @returns {Object} Result
   */
  assignStaff(terminalId, staffId) {
    return this.updateTerminal(terminalId, { assignedStaffId: staffId });
  }

  /**
   * Assign shift to terminal
   * @param {string} terminalId - Terminal ID
   * @param {string} shift - Shift
   * @returns {Object} Result
   */
  assignShift(terminalId, shift) {
    return this.updateTerminal(terminalId, { assignedShift: shift });
  }

  /**
   * Rename terminal
   * @param {string} terminalId - Terminal ID
   * @param {string} name - New name
   * @returns {Object} Result
   */
  renameTerminal(terminalId, name) {
    return this.updateTerminal(terminalId, { name });
  }

  /**
   * Transfer session
   * @param {string} fromTerminalId - Source terminal ID
   * @param {string} toTerminalId - Target terminal ID
   * @returns {Object} Result
   */
  transferSession(fromTerminalId, toTerminalId) {
    const fromTerminal = this.terminals.get(fromTerminalId);
    const toTerminal = this.terminals.get(toTerminalId);

    if (!fromTerminal || !toTerminal) {
      return { success: false, reason: 'Terminal not found' };
    }

    const sessionId = fromTerminal.currentSessionId;
    if (!sessionId) {
      return { success: false, reason: 'No active session to transfer' };
    }

    // Update source terminal
    fromTerminal.currentSessionId = null;
    fromTerminal.status = TERMINAL_STATUS.IDLE;

    // Update target terminal
    toTerminal.currentSessionId = sessionId;
    toTerminal.status = TERMINAL_STATUS.BUSY;

    this.saveTerminals();

    return {
      success: true,
      sessionId,
      fromTerminalId,
      toTerminalId
    };
  }

  /**
   * Get terminal activity
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Terminal activity data
   */
  getTerminalActivity(terminalId) {
    const terminal = this.getTerminal(terminalId);
    if (!terminal) return null;

    const session = terminal.currentSessionId ? this.getSession(terminal.currentSessionId) : null;

    return {
      terminalId: terminal.id,
      terminalName: terminal.name,
      status: terminal.status,
      healthStatus: terminal.healthStatus,
      assignedStaffId: terminal.assignedStaffId,
      currentSessionId: terminal.currentSessionId,
      lastActivity: terminal.lastActivity,
      lastSync: terminal.lastSync,
      session
    };
  }

  /**
   * Create session
   * @param {Object} sessionData - Session data
   * @returns {Object} Created session
   */
  createSession(sessionData) {
    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      terminalId: sessionData.terminalId,
      staffId: sessionData.staffId,
      branchId: sessionData.branchId,
      shift: sessionData.shift || null,
      
      // Status
      status: 'ACTIVE',
      
      // Timestamps
      loginTime: now(),
      logoutTime: null,
      shiftStartTime: sessionData.shiftStartTime || now(),
      shiftEndTime: null,
      
      // Activity
      ordersProcessed: 0,
      refunds: 0,
      voids: 0,
      discounts: 0,
      totalSales: 0,
      
      // Cash drawer
      cashDrawerOpen: false,
      cashDrawerOpenTime: null,
      cashDrawerCloseTime: null,
      
      // Performance
      idleTime: 0,
      downtime: 0,
      
      // Metadata
      metadata: sessionData.metadata || {}
    };

    this.sessions.set(session.id, session);
    this.saveSessions();

    // Link session to terminal
    if (session.terminalId) {
      this.updateTerminal(session.terminalId, {
        currentSessionId: session.id,
        status: TERMINAL_STATUS.BUSY,
        assignedStaffId: session.staffId
      });
    }

    return session;
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session or null
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions
   * @returns {Array} Array of sessions
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Get sessions by terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Array} Array of sessions
   */
  getSessionsByTerminal(terminalId) {
    return this.getAllSessions().filter(s => s.terminalId === terminalId);
  }

  /**
   * Get sessions by staff
   * @param {string} staffId - Staff ID
   * @returns {Array} Array of sessions
   */
  getSessionsByStaff(staffId) {
    return this.getAllSessions().filter(s => s.staffId === staffId);
  }

  /**
   * Get active sessions
   * @returns {Array} Array of active sessions
   */
  getActiveSessions() {
    return this.getAllSessions().filter(s => s.status === 'ACTIVE');
  }

  /**
   * End session
   * @param {string} sessionId - Session ID
   * @returns {Object} Result
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    session.status = 'ENDED';
    session.logoutTime = now();
    session.shiftEndTime = now();

    this.sessions.set(sessionId, session);
    this.saveSessions();

    // Unlink from terminal
    if (session.terminalId) {
      this.updateTerminal(session.terminalId, {
        currentSessionId: null,
        status: TERMINAL_STATUS.IDLE
      });
    }

    return { success: true, session };
  }

  /**
   * Update session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated session or null
   */
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const updated = {
      ...session,
      ...updates
    };

    this.sessions.set(sessionId, updated);
    this.saveSessions();

    return updated;
  }

  /**
   * Record order processed
   * @param {string} sessionId - Session ID
   * @param {number} amount - Order amount
   * @returns {Object} Result
   */
  recordOrderProcessed(sessionId, amount) {
    return this.updateSession(sessionId, {
      ordersProcessed: (this.sessions.get(sessionId)?.ordersProcessed || 0) + 1,
      totalSales: (this.sessions.get(sessionId)?.totalSales || 0) + amount
    });
  }

  /**
   * Record refund
   * @param {string} sessionId - Session ID
   * @returns {Object} Result
   */
  recordRefund(sessionId) {
    return this.updateSession(sessionId, {
      refunds: (this.sessions.get(sessionId)?.refunds || 0) + 1
    });
  }

  /**
   * Record void
   * @param {string} sessionId - Session ID
   * @returns {Object} Result
   */
  recordVoid(sessionId) {
    return this.updateSession(sessionId, {
      voids: (this.sessions.get(sessionId)?.voids || 0) + 1
    });
  }

  /**
   * Record discount
   * @param {string} sessionId - Session ID
   * @returns {Object} Result
   */
  recordDiscount(sessionId) {
    return this.updateSession(sessionId, {
      discounts: (this.sessions.get(sessionId)?.discounts || 0) + 1
    });
  }

  /**
   * Open cash drawer
   * @param {string} sessionId - Session ID
   * @returns {Object} Result
   */
  openCashDrawer(sessionId) {
    return this.updateSession(sessionId, {
      cashDrawerOpen: true,
      cashDrawerOpenTime: now()
    });
  }

  /**
   * Close cash drawer
   * @param {string} sessionId - Session ID
   * @returns {Object} Result
   */
  closeCashDrawer(sessionId) {
    return this.updateSession(sessionId, {
      cashDrawerOpen: false,
      cashDrawerCloseTime: now()
    });
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const terminals = this.getAllTerminals();
    const sessions = this.getAllSessions();
    const activeSessions = this.getActiveSessions();

    return {
      totalTerminals: terminals.length,
      byStatus: terminals.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {}),
      byDeviceType: terminals.reduce((acc, t) => {
        acc[t.deviceType] = (acc[t.deviceType] || 0) + 1;
        return acc;
      }, {}),
      byHealthStatus: terminals.reduce((acc, t) => {
        acc[t.healthStatus] = (acc[t.healthStatus] || 0) + 1;
        return acc;
      }, {}),
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      onlineTerminals: terminals.filter(t => t.status === TERMINAL_STATUS.ONLINE).length,
      offlineTerminals: terminals.filter(t => t.status === TERMINAL_STATUS.OFFLINE).length
    };
  }

  /**
   * Export terminals
   * @returns {Object} Exported terminals
   */
  exportTerminals() {
    return {
      terminals: Array.from(this.terminals.values()),
      sessions: Array.from(this.sessions.values()),
      exportedAt: now()
    };
  }

  /**
   * Import terminals
   * @param {Object} data - Imported terminals data
   * @returns {Object} Import result
   */
  importTerminals(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.terminals)) {
        data.terminals.forEach(terminal => {
          this.terminals.set(terminal.id, terminal);
        });
      }

      if (Array.isArray(data.sessions)) {
        data.sessions.forEach(session => {
          this.sessions.set(session.id, session);
        });
      }

      this.saveTerminals();
      this.saveSessions();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let terminalManagerInstance = null;

/**
 * Get the terminal manager singleton
 * @returns {TerminalManager} Terminal manager instance
 */
export function getTerminalManager() {
  if (!terminalManagerInstance) {
    terminalManagerInstance = new TerminalManager();
  }
  return terminalManagerInstance;
}

/**
 * Reset the terminal manager (useful for testing)
 */
export function resetTerminalManager() {
  terminalManagerInstance = null;
}

/**
 * Convenience function to create a terminal
 * @param {Object} terminalData - Terminal data
 * @returns {Object} Created terminal
 */
export function createTerminal(terminalData = {}) {
  const manager = getTerminalManager();
  return manager.createTerminal(terminalData);
}

/**
 * Convenience function to create a session
 * @param {Object} sessionData - Session data
 * @returns {Object} Created session
 */
export function createTerminalSession(sessionData = {}) {
  const manager = getTerminalManager();
  return manager.createSession(sessionData);
}
