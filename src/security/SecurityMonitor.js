// Security Monitor
// Continuous security monitoring and alerting

import { SecurityInterface } from './SecurityInterface.js';
import { SecurityStatus, SecurityLevel } from './SecurityTypes.js';

export class SecurityMonitor extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.monitors = new Map();
    this.alerts = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 200;
    this.checkInterval = 60000; // 1 minute
    this.intervalId = null;
    this.storageKey = 'cafeos_security_monitor';
    this.loadState();
  }

  /**
   * Initialize the security monitor
   */
  async initialize() {
    this.startMonitoring();
    this.status = SecurityStatus.SECURE;
    return { success: true };
  }

  /**
   * Start security monitoring
   */
  startMonitoring() {
    if (this.intervalId) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.performChecks();
    }, this.checkInterval);
  }

  /**
   * Stop security monitoring
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Perform all security checks
   */
  async performChecks() {
    const checks = [
      this.checkAuthenticationFailures(),
      this.checkCredentialProblems(),
      this.checkExpiredTokens(),
      this.checkProviderErrors(),
      this.checkBackupFailures(),
      this.checkRestoreFailures(),
      this.checkSyncFailures(),
      this.checkUnusualExportActivity(),
      this.checkStorageHealth(),
      this.checkPermissionViolations()
    ];

    const results = await Promise.allSettled(checks);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Security check ${index} failed:`, result.reason);
      }
    });
  }

  /**
   * Check for authentication failures
   */
  async checkAuthenticationFailures() {
    // This would check recent authentication attempts
    // Placeholder for implementation
    return { status: 'ok' };
  }

  /**
   * Check for credential problems
   */
  async checkCredentialProblems() {
    const { getCredentialVault } = await import('./CredentialVault.js');
    const vault = getCredentialVault();
    const health = vault.getHealth();

    if (health.expired > 0) {
      this.createAlert('critical', 'expired_credentials', 
        `${health.expired} credential(s) have expired`,
        { expiredCount: health.expired }
      );
    }

    if (health.expiringSoon > 0) {
      this.createAlert('warning', 'expiring_credentials',
        `${health.expiringSoon} credential(s) expire soon`,
        { expiringCount: health.expiringSoon }
      );
    }

    return { status: 'ok', health };
  }

  /**
   * Check for expired tokens
   */
  async checkExpiredTokens() {
    // Placeholder for token expiration checking
    return { status: 'ok' };
  }

  /**
   * Check for provider errors
   */
  async checkProviderErrors() {
    // Placeholder for provider error checking
    return { status: 'ok' };
  }

  /**
   * Check for repeated backup failures
   */
  async checkBackupFailures() {
    // Placeholder for backup failure checking
    return { status: 'ok' };
  }

  /**
   * Check for repeated restore failures
   */
  async checkRestoreFailures() {
    // Placeholder for restore failure checking
    return { status: 'ok' };
  }

  /**
   * Check for repeated synchronization failures
   */
  async checkSyncFailures() {
    // Placeholder for sync failure checking
    return { status: 'ok' };
  }

  /**
   * Check for unusual export activity
   */
  async checkUnusualExportActivity() {
    // Placeholder for export activity checking
    return { status: 'ok' };
  }

  /**
   * Check storage health
   */
  async checkStorageHealth() {
    // Placeholder for storage health checking
    return { status: 'ok' };
  }

  /**
   * Check for permission violations
   */
  async checkPermissionViolations() {
    const { getPermissionEngine } = await import('./PermissionEngine.js');
    const permissionEngine = getPermissionEngine();
    const stats = permissionEngine.getStatistics();

    if (stats.total > 10 && stats.allowRate < 50) {
      this.createAlert('warning', 'permission_denials',
        'High permission denial rate detected',
        { allowRate: stats.allowRate }
      );
    }

    return { status: 'ok', stats };
  }

  /**
   * Create a security alert
   * @param {string} severity - Alert severity
   * @param {string} type - Alert type
   * @param {string} message - Alert message
   * @param {object} details - Additional details
   */
  createAlert(severity, type, message, details = {}) {
    const alertId = this.generateAlertId();
    
    const alert = {
      alertId,
      severity,
      type,
      message,
      details,
      createdAt: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);
    this.trimHistory();
    this.saveState();

    console.log(`[SecurityMonitor] ${severity.toUpperCase()} ALERT: ${message}`);
  }

  /**
   * Acknowledge an alert
   * @param {string} alertId - Alert ID
   * @returns {object} Acknowledgment result
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    this.alerts.set(alertId, alert);
    this.saveState();

    return { success: true, alertId };
  }

  /**
   * Resolve an alert
   * @param {string} alertId - Alert ID
   * @returns {object} Resolution result
   */
  resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    this.alerts.set(alertId, alert);
    this.saveState();

    return { success: true, alertId };
  }

  /**
   * Get active alerts
   * @param {object} filters - Optional filters
   * @returns {Array} Active alerts
   */
  getAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values());

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.type) {
      alerts = alerts.filter(a => a.type === filters.type);
    }

    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
    }

    if (filters.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === filters.resolved);
    }

    // Sort by creation date descending
    alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return alerts;
  }

  /**
   * Get alert history
   * @param {object} filters - Optional filters
   * @returns {Array} Alert history
   */
  getAlertHistory(filters = {}) {
    let history = [...this.alertHistory];

    if (filters.severity) {
      history = history.filter(a => a.severity === filters.severity);
    }

    if (filters.type) {
      history = history.filter(a => a.type === filters.type);
    }

    if (filters.since) {
      history = history.filter(a => new Date(a.createdAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by creation date descending
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return history;
  }

  /**
   * Get monitoring statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const alerts = Array.from(this.alerts.values());
    const critical = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const warning = alerts.filter(a => a.severity === 'warning' && !a.resolved).length;
    const acknowledged = alerts.filter(a => a.acknowledged).length;
    const resolved = alerts.filter(a => a.resolved).length;

    const byType = {};
    alerts.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    return {
      total: alerts.length,
      critical,
      warning,
      acknowledged,
      resolved,
      byType,
      monitoringActive: this.intervalId !== null
    };
  }

  /**
   * Trim history to max size
   */
  trimHistory() {
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate alert ID
   * @returns {string} Alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (this.checkInterval < 30000) {
      return { valid: false, reason: 'Check interval too short (minimum 30 seconds)' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    const stats = this.getStatistics();
    
    // Deduct for critical alerts
    score -= (stats.critical * 15);
    
    // Deduct for warning alerts
    score -= (stats.warning * 5);
    
    // Deduct if monitoring not active
    if (!stats.monitoringActive) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    const stats = this.getStatistics();
    
    if (!stats.monitoringActive) {
      recommendations.push({
        level: 'critical',
        message: 'Security monitoring is not active',
        action: 'Start security monitoring'
      });
    }

    if (stats.critical > 0) {
      recommendations.push({
        level: 'critical',
        message: `${stats.critical} critical alert(s) pending`,
        action: 'Review and resolve critical alerts immediately'
      });
    }

    if (stats.warning > 5) {
      recommendations.push({
        level: 'warning',
        message: `${stats.warning} warning alert(s) pending`,
        action: 'Review warning alerts'
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
        alerts: Array.from(this.alerts.entries()),
        alertHistory: this.alertHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save security monitor state:', error);
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
        this.alerts = new Map(parsed.alerts || []);
        this.alertHistory = parsed.alertHistory || [];
      }
    } catch (error) {
      console.error('Failed to load security monitor state:', error);
      this.alerts = new Map();
      this.alertHistory = [];
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.stopMonitoring();
    this.alerts.clear();
    this.alertHistory = [];
    localStorage.removeItem(this.storageKey);
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the security monitor
   */
  async destroy() {
    await this.reset();
    console.log('[SecurityMonitor] Destroyed');
  }
}

// Singleton instance
let securityMonitorInstance = null;

/**
 * Get the singleton security monitor instance
 * @returns {SecurityMonitor} Security monitor instance
 */
export function getSecurityMonitor() {
  if (!securityMonitorInstance) {
    securityMonitorInstance = new SecurityMonitor();
  }
  return securityMonitorInstance;
}

export default SecurityMonitor;
