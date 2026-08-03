// Provider Audit Logger
// Logs all cloud storage provider operations for security and compliance

class ProviderAuditLogger {
  constructor() {
    this.auditLogs = [];
    this.maxLogSize = 1000;
    this.storageKey = 'cafeos_provider_audit_logs';
    this.loadFromStorage();
  }

  /**
   * Log levels for audit entries
   */
  static LogLevel = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
  };

  /**
   * Operation types for audit entries
   */
  static OperationType = {
    // Connection operations
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    AUTHENTICATE: 'authenticate',
    TEST_CONNECTION: 'test_connection',

    // File operations
    UPLOAD: 'upload',
    DOWNLOAD: 'download',
    DELETE: 'delete',
    RENAME: 'rename',
    MOVE: 'move',
    COPY: 'copy',
    LIST: 'list',
    EXISTS: 'exists',
    METADATA: 'metadata',
    QUOTA: 'quota',

    // Provider operations
    CONFIGURE: 'configure',
    SWITCH: 'switch',
    HEALTH_CHECK: 'health_check',

    // Security operations
    CREDENTIALS_UPDATE: 'credentials_update',
    CREDENTIALS_VALIDATE: 'credentials_validate',
    AUTH_REFRESH: 'auth_refresh'
  };

  /**
   * Log an audit entry
   * @param {object} entry - Audit entry
   */
  log(entry) {
    const auditEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: entry.level || ProviderAuditLogger.LogLevel.INFO,
      operation: entry.operation,
      providerId: entry.providerId,
      userId: entry.userId || 'system',
      details: entry.details || {},
      success: entry.success !== false,
      error: entry.error || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null
    };

    this.auditLogs.push(auditEntry);
    this.trimLogs();
    this.saveToStorage();

    console.log(`[ProviderAuditLogger] ${auditEntry.operation}:`, auditEntry);
  }

  /**
   * Generate a unique log ID
   * @returns {string} Log ID
   */
  generateLogId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Trim logs to max size
   */
  trimLogs() {
    if (this.auditLogs.length > this.maxLogSize) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogSize);
    }
  }

  /**
   * Save logs to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.auditLogs));
    } catch (error) {
      console.error('[ProviderAuditLogger] Failed to save logs to storage:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.auditLogs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[ProviderAuditLogger] Failed to load logs from storage:', error);
      this.auditLogs = [];
    }
  }

  /**
   * Get audit logs with optional filters
   * @param {object} filters - Filters to apply
   * @returns {array} Filtered audit logs
   */
  getLogs(filters = {}) {
    let logs = [...this.auditLogs];

    if (filters.providerId) {
      logs = logs.filter(log => log.providerId === filters.providerId);
    }

    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }

    if (filters.operation) {
      logs = logs.filter(log => log.operation === filters.operation);
    }

    if (filters.level) {
      logs = logs.filter(log => log.level === filters.level);
    }

    if (filters.success !== undefined) {
      logs = logs.filter(log => log.success === filters.success);
    }

    if (filters.since) {
      logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.since));
    }

    if (filters.until) {
      logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.until));
    }

    if (filters.limit) {
      logs = logs.slice(-filters.limit);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return logs;
  }

  /**
   * Get audit statistics
   * @param {object} filters - Optional filters
   * @returns {object} Audit statistics
   */
  getStatistics(filters = {}) {
    const logs = this.getLogs(filters);

    const stats = {
      total: logs.length,
      byLevel: {},
      byOperation: {},
      byProvider: {},
      byUser: {},
      successRate: 0,
      failureCount: 0,
      recent: logs.slice(0, 10)
    };

    let successCount = 0;

    logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Count by operation
      stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;

      // Count by provider
      if (log.providerId) {
        stats.byProvider[log.providerId] = (stats.byProvider[log.providerId] || 0) + 1;
      }

      // Count by user
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      }

      // Count success/failure
      if (log.success) {
        successCount++;
      } else {
        stats.failureCount++;
      }
    });

    stats.successRate = logs.length > 0 ? (successCount / logs.length) * 100 : 0;

    return stats;
  }

  /**
   * Export audit logs as JSON
   * @param {object} filters - Optional filters
   * @returns {string} JSON string of logs
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear audit logs
   * @param {object} filters - Optional filters to clear specific logs
   */
  clearLogs(filters = {}) {
    if (Object.keys(filters).length === 0) {
      this.auditLogs = [];
    } else {
      this.auditLogs = this.auditLogs.filter(log => {
        if (filters.providerId && log.providerId === filters.providerId) return false;
        if (filters.userId && log.userId === filters.userId) return false;
        if (filters.operation && log.operation === filters.operation) return false;
        if (filters.level && log.level === filters.level) return false;
        if (filters.since && new Date(log.timestamp) >= new Date(filters.since)) return false;
        if (filters.until && new Date(log.timestamp) <= new Date(filters.until)) return false;
        return true;
      });
    }
    this.saveToStorage();
  }

  /**
   * Get security events (critical and error level logs)
   * @param {object} filters - Optional filters
   * @returns {array} Security events
   */
  getSecurityEvents(filters = {}) {
    return this.getLogs({
      ...filters,
      level: [ProviderAuditLogger.LogLevel.ERROR, ProviderAuditLogger.LogLevel.CRITICAL]
    });
  }

  /**
   * Get user activity logs
   * @param {string} userId - User ID
   * @param {object} filters - Optional filters
   * @returns {array} User activity logs
   */
  getUserActivity(userId, filters = {}) {
    return this.getLogs({ ...filters, userId });
  }

  /**
   * Get provider activity logs
   * @param {string} providerId - Provider ID
   * @param {object} filters - Optional filters
   * @returns {array} Provider activity logs
   */
  getProviderActivity(providerId, filters = {}) {
    return this.getLogs({ ...filters, providerId });
  }

  /**
   * Check for suspicious activity patterns
   * @returns {array} Suspicious activity alerts
   */
  detectSuspiciousActivity() {
    const alerts = [];
    const logs = this.getLogs();
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    // Check for multiple failed authentication attempts
    const failedAuths = logs.filter(log => 
      log.operation === ProviderAuditLogger.OperationType.AUTHENTICATE &&
      !log.success &&
      new Date(log.timestamp) >= oneHourAgo
    );

    if (failedAuths.length >= 5) {
      alerts.push({
        type: 'multiple_failed_auth',
        severity: 'high',
        message: `${failedAuths.length} failed authentication attempts in the last hour`,
        count: failedAuths.length
      });
    }

    // Check for credential updates from different IPs
    const credentialUpdates = logs.filter(log => 
      log.operation === ProviderAuditLogger.OperationType.CREDENTIALS_UPDATE &&
      new Date(log.timestamp) >= oneHourAgo
    );

    const uniqueIPs = new Set(credentialUpdates.map(log => log.ipAddress));
    if (uniqueIPs.size >= 3) {
      alerts.push({
        type: 'credential_updates_multiple_ips',
        severity: 'medium',
        message: `Credential updates from ${uniqueIPs.size} different IPs in the last hour`,
        count: uniqueIPs.size
      });
    }

    // Check for provider switches
    const providerSwitches = logs.filter(log => 
      log.operation === ProviderAuditLogger.OperationType.SWITCH &&
      new Date(log.timestamp) >= oneHourAgo
    );

    if (providerSwitches.length >= 2) {
      alerts.push({
        type: 'frequent_provider_switches',
        severity: 'medium',
        message: `${providerSwitches.length} provider switches in the last hour`,
        count: providerSwitches.length
      });
    }

    return alerts;
  }

  /**
   * Destroy the audit logger
   */
  destroy() {
    this.auditLogs = [];
    this.saveToStorage();
    console.log('[ProviderAuditLogger] Destroyed');
  }
}

// Singleton instance
let auditLoggerInstance = null;

/**
 * Get the singleton audit logger instance
 * @returns {ProviderAuditLogger} Audit logger instance
 */
export function getProviderAuditLogger() {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new ProviderAuditLogger();
  }
  return auditLoggerInstance;
}

export default ProviderAuditLogger;
