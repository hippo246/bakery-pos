// Operations Audit Logger
// Audit logging for operations platform

import { getSecurityEventManager } from '../security/SecurityEventManager.js';

export class OperationsAuditLogger {
  constructor() {
    this.securityEventManager = getSecurityEventManager();
  }

  /**
   * Log configuration change
   * @param {object} details - Configuration details
   */
  logConfigurationChange(details) {
    this.securityEventManager.logSecurityAlert('Configuration Changed', {
      component: details.component,
      setting: details.setting,
      oldValue: details.oldValue,
      newValue: details.newValue,
      changedBy: details.changedBy
    });
  }

  /**
   * Log health change
   * @param {object} details - Health change details
   */
  logHealthChange(details) {
    this.securityEventManager.logSecurityAlert('Health Changed', {
      system: details.system,
      oldStatus: details.oldStatus,
      newStatus: details.newStatus,
      reason: details.reason
    });
  }

  /**
   * Log alert generated
   * @param {object} details - Alert details
   */
  logAlertGenerated(details) {
    this.securityEventManager.logSecurityAlert('Alert Generated', {
      alertType: details.alertType,
      severity: details.severity,
      message: details.message,
      source: details.source
    });
  }

  /**
   * Log alert acknowledged
   * @param {object} details - Acknowledgement details
   */
  logAlertAcknowledged(details) {
    this.securityEventManager.logSecurityAlert('Alert Acknowledged', {
      alertId: details.alertId,
      acknowledgedBy: details.acknowledgedBy,
      acknowledgedAt: new Date().toISOString()
    });
  }

  /**
   * Log alert resolved
   * @param {object} details - Resolution details
   */
  logAlertResolved(details) {
    this.securityEventManager.logSecurityAlert('Alert Resolved', {
      alertId: details.alertId,
      resolvedBy: details.resolvedBy,
      resolvedAt: new Date().toISOString()
    });
  }

  /**
   * Log diagnostics generated
   * @param {object} details - Diagnostics details
   */
  logDiagnosticsGenerated(details) {
    this.securityEventManager.logSecurityAlert('Diagnostics Generated', {
      reportId: details.reportId,
      generatedBy: details.generatedBy,
      components: details.components
    });
  }

  /**
   * Log support mode enabled
   * @param {object} details - Support mode details
   */
  logSupportModeEnabled(details) {
    this.securityEventManager.logSecurityAlert('Support Mode Enabled', {
      enabledBy: details.enabledBy,
      reason: details.reason,
      duration: details.duration
    });
  }

  /**
   * Log support mode disabled
   * @param {object} details - Support mode details
   */
  logSupportModeDisabled(details) {
    this.securityEventManager.logSecurityAlert('Support Mode Disabled', {
      disabledBy: details.disabledBy,
      duration: details.duration
    });
  }

  /**
   * Log self-healing action
   * @param {object} details - Self-healing details
   */
  logSelfHealingAction(details) {
    this.securityEventManager.logSecurityAlert('Self-Healing Action', {
      action: details.action,
      success: details.success,
      attempts: details.attempts,
      error: details.error
    });
  }

  /**
   * Log metrics collection
   * @param {object} details - Metrics details
   */
  logMetricsCollection(details) {
    this.securityEventManager.logSecurityAlert('Metrics Collected', {
      metrics: details.metrics,
      count: details.count,
      collectedAt: new Date().toISOString()
    });
  }

  /**
   * Log service restart
   * @param {object} details - Service restart details
   */
  logServiceRestart(details) {
    this.securityEventManager.logSecurityAlert('Service Restarted', {
      service: details.service,
      restartedBy: details.restartedBy,
      reason: details.reason
    });
  }

  /**
   * Get operations audit log
   * @param {object} filters - Optional filters
   * @returns {Array} Audit log
   */
  getAuditLog(filters = {}) {
    const allEvents = this.securityEventManager.getEventHistory({ limit: 500 });
    
    // Filter for operations-related events
    const operationsEvents = allEvents.filter(event => {
      const message = event.details?.message || '';
      return message.includes('Configuration') || message.includes('Health') ||
             message.includes('Alert') || message.includes('Diagnostics') ||
             message.includes('Support Mode') || message.includes('Self-Healing') ||
             message.includes('Metrics') || message.includes('Service');
    });

    if (filters.since) {
      return operationsEvents.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      return operationsEvents.slice(-filters.limit);
    }

    return operationsEvents;
  }

  /**
   * Get audit statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const auditLog = this.getAuditLog();
    const total = auditLog.length;

    const byType = {};
    auditLog.forEach(event => {
      const message = event.details?.message || 'Unknown';
      byType[message] = (byType[message] || 0) + 1;
    });

    return {
      total,
      byType
    };
  }
}

// Singleton instance
let operationsAuditLoggerInstance = null;

/**
 * Get the singleton operations audit logger instance
 * @returns {OperationsAuditLogger} Operations audit logger instance
 */
export function getOperationsAuditLogger() {
  if (!operationsAuditLoggerInstance) {
    operationsAuditLoggerInstance = new OperationsAuditLogger();
  }
  return operationsAuditLoggerInstance;
}

export default OperationsAuditLogger;
