// Sync Audit Logger
// Logs all sync operations for audit purposes

import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';

export class SyncAuditLogger {
  constructor() {
    this.auditLog = [];
    this.maxLogSize = 500;
    this.storageKey = 'cafeos_sync_audit';
    this.providerAuditLogger = getProviderAuditLogger();
    this.loadState();
  }

  /**
   * Log a sync operation
   * @param {object} logEntry - Log entry
   */
  log(logEntry) {
    const entry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      ...logEntry
    };

    this.auditLog.push(entry);
    this.trimLog();
    this.saveState();

    // Also log to provider audit logger
    this.providerAuditLogger.log({
      level: logEntry.level || 'info',
      operation: logEntry.operation,
      providerId: logEntry.providerId || 'sync',
      details: logEntry.details || {},
      success: logEntry.success !== false
    });

    console.log(`[SyncAuditLogger] ${logEntry.operation}:`, entry);
  }

  /**
   * Generate a unique log ID
   * @returns {string} Log ID
   */
  generateLogId() {
    return `sync_audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log sync queued
   * @param {string} syncId - Sync ID
   * @param {string} module - Module name
   * @param {string} operator - Operator
   */
  logSyncQueued(syncId, module, operator) {
    this.log({
      level: 'info',
      operation: 'sync_queued',
      syncId,
      module,
      operator,
      success: true
    });
  }

  /**
   * Log sync started
   * @param {string} syncId - Sync ID
   * @param {string} module - Module name
   */
  logSyncStarted(syncId, module) {
    this.log({
      level: 'info',
      operation: 'sync_started',
      syncId,
      module,
      success: true
    });
  }

  /**
   * Log sync completed
   * @param {string} syncId - Sync ID
   * @param {number} duration - Duration in ms
   * @param {number} size - Data size
   */
  logSyncCompleted(syncId, duration, size) {
    this.log({
      level: 'info',
      operation: 'sync_completed',
      syncId,
      duration,
      size,
      success: true
    });
  }

  /**
   * Log sync failed
   * @param {string} syncId - Sync ID
   * @param {string} error - Error message
   * @param {string} step - Step where it failed
   */
  logSyncFailed(syncId, error, step) {
    this.log({
      level: 'error',
      operation: 'sync_failed',
      syncId,
      error,
      step,
      success: false
    });
  }

  /**
   * Log sync cancelled
   * @param {string} syncId - Sync ID
   * @param {string} operator - Operator
   */
  logSyncCancelled(syncId, operator) {
    this.log({
      level: 'warning',
      operation: 'sync_cancelled',
      syncId,
      operator,
      success: true
    });
  }

  /**
   * Log sync paused
   * @param {string} syncId - Sync ID
   * @param {string} operator - Operator
   */
  logSyncPaused(syncId, operator) {
    this.log({
      level: 'info',
      operation: 'sync_paused',
      syncId,
      operator,
      success: true
    });
  }

  /**
   * Log sync resumed
   * @param {string} syncId - Sync ID
   * @param {string} operator - Operator
   */
  logSyncResumed(syncId, operator) {
    this.log({
      level: 'info',
      operation: 'sync_resumed',
      syncId,
      operator,
      success: true
    });
  }

  /**
   * Log conflict detected
   * @param {string} syncId - Sync ID
   * @param {string} conflictId - Conflict ID
   * @param {Array} conflicts - Conflict details
   */
  logConflictDetected(syncId, conflictId, conflicts) {
    this.log({
      level: 'warning',
      operation: 'conflict_detected',
      syncId,
      conflictId,
      conflicts,
      success: true
    });
  }

  /**
   * Log conflict resolved
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution action
   * @param {string} operator - Operator
   */
  logConflictResolved(conflictId, resolution, operator) {
    this.log({
      level: 'info',
      operation: 'conflict_resolved',
      conflictId,
      resolution,
      operator,
      success: true
    });
  }

  /**
   * Log retry attempted
   * @param {string} syncId - Sync ID
   * @param {number} retryCount - Retry count
   * @param {string} strategy - Retry strategy
   */
  logRetryAttempted(syncId, retryCount, strategy) {
    this.log({
      level: 'info',
      operation: 'retry_attempted',
      syncId,
      retryCount,
      strategy,
      success: true
    });
  }

  /**
   * Log network status change
   * @param {string} status - Network status
   * @param {object} details - Network details
   */
  logNetworkStatusChange(status, details) {
    this.log({
      level: 'info',
      operation: 'network_status_change',
      status,
      details,
      success: true
    });
  }

  /**
   * Log offline mode enabled
   */
  logOfflineModeEnabled() {
    this.log({
      level: 'warning',
      operation: 'offline_mode_enabled',
      success: true
    });
  }

  /**
   * Log internet restored
   */
  logInternetRestored() {
    this.log({
      level: 'info',
      operation: 'internet_restored',
      success: true
    });
  }

  /**
   * Get audit log
   * @param {object} filters - Optional filters
   * @returns {Array} Filtered audit log
   */
  getAuditLog(filters = {}) {
    let log = [...this.auditLog];

    if (filters.operation) {
      log = log.filter(entry => entry.operation === filters.operation);
    }

    if (filters.syncId) {
      log = log.filter(entry => entry.syncId === filters.syncId);
    }

    if (filters.level) {
      log = log.filter(entry => entry.level === filters.level);
    }

    if (filters.success !== undefined) {
      log = log.filter(entry => entry.success === filters.success);
    }

    if (filters.since) {
      log = log.filter(entry => new Date(entry.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      log = log.slice(-filters.limit);
    }

    // Sort by timestamp descending
    log.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return log;
  }

  /**
   * Get audit statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const total = this.auditLog.length;
    const successful = this.auditLog.filter(e => e.success).length;
    const failed = total - successful;

    const byOperation = {};
    this.auditLog.forEach(entry => {
      byOperation[entry.operation] = (byOperation[entry.operation] || 0) + 1;
    });

    const byLevel = {};
    this.auditLog.forEach(entry => {
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;
    });

    const byModule = {};
    this.auditLog.forEach(entry => {
      if (entry.module) {
        byModule[entry.module] = (byModule[entry.module] || 0) + 1;
      }
    });

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byOperation,
      byLevel,
      byModule
    };
  }

  /**
   * Trim log to max size
   */
  trimLog() {
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Clear audit log
   * @param {object} filters - Optional filters
   */
  clearAuditLog(filters = {}) {
    if (Object.keys(filters).length === 0) {
      this.auditLog = [];
    } else {
      this.auditLog = this.auditLog.filter(entry => {
        if (filters.operation && entry.operation === filters.operation) return false;
        if (filters.syncId && entry.syncId === filters.syncId) return false;
        if (filters.level && entry.level === filters.level) return false;
        return true;
      });
    }
    this.saveState();
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.auditLog));
    } catch (error) {
      console.error('Failed to save sync audit state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        this.auditLog = JSON.parse(state);
      }
    } catch (error) {
      console.error('Failed to load sync audit state:', error);
      this.auditLog = [];
    }
  }

  /**
   * Destroy the audit logger
   */
  destroy() {
    this.auditLog = [];
    localStorage.removeItem(this.storageKey);
    console.log('[SyncAuditLogger] Destroyed');
  }
}

// Singleton instance
let auditLoggerInstance = null;

/**
 * Get the singleton audit logger instance
 * @returns {SyncAuditLogger} Audit logger instance
 */
export function getSyncAuditLogger() {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new SyncAuditLogger();
  }
  return auditLoggerInstance;
}

export default SyncAuditLogger;
