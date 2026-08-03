// Alert Center
// Generates and manages operational alerts

import { AlertSeverity, AlertStatus, AlertType } from './OperationsTypes.js';

export class AlertCenter {
  constructor() {
    this.alerts = new Map();
    this.storageKey = 'cafeos_alert_center';
    this.maxAlerts = 500;
    this.loadState();
  }

  /**
   * Generate alert
   * @param {object} alertData - Alert data
   * @returns {object} Alert result
   */
  generateAlert(alertData) {
    const alertId = this.generateAlertId();
    
    const alert = {
      alertId,
      type: alertData.type || AlertType.SYSTEM_FAILURE,
      severity: alertData.severity || AlertSeverity.WARNING,
      title: alertData.title || 'Alert',
      message: alertData.message || '',
      source: alertData.source || 'system',
      timestamp: new Date().toISOString(),
      status: AlertStatus.ACTIVE,
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      metadata: alertData.metadata || {}
    };

    this.alerts.set(alertId, alert);
    this.trimAlerts();
    this.saveState();

    return { success: true, alertId, alert };
  }

  /**
   * Get alert by ID
   * @param {string} alertId - Alert ID
   * @returns {object|null} Alert
   */
  getAlert(alertId) {
    return this.alerts.get(alertId) || null;
  }

  /**
   * Get all alerts
   * @param {object} filters - Optional filters
   * @returns {Array} Alerts
   */
  getAlerts(filters = {}) {
    let alerts = Array.from(this.alerts.values());

    if (filters.type) {
      alerts = alerts.filter(a => a.type === filters.type);
    }

    if (filters.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }

    if (filters.status) {
      alerts = alerts.filter(a => a.status === filters.status);
    }

    if (filters.source) {
      alerts = alerts.filter(a => a.source === filters.source);
    }

    if (filters.since) {
      alerts = alerts.filter(a => new Date(a.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      alerts = alerts.slice(-filters.limit);
    }

    // Sort by timestamp descending
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return alerts;
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} acknowledgedBy - Who acknowledged it
   * @returns {object} Acknowledge result
   */
  acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    if (alert.status !== AlertStatus.ACTIVE) {
      return { success: false, reason: 'Alert is not active' };
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = acknowledgedBy;

    this.alerts.set(alertId, alert);
    this.saveState();

    return { success: true, alertId };
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @param {string} resolvedBy - Who resolved it
   * @returns {object} Resolve result
   */
  resolveAlert(alertId, resolvedBy) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = resolvedBy;

    this.alerts.set(alertId, alert);
    this.saveState();

    return { success: true, alertId };
  }

  /**
   * Ignore alert
   * @param {string} alertId - Alert ID
   * @returns {object} Ignore result
   */
  ignoreAlert(alertId) {
    const alert = this.alerts.get(alertId);
    
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.status = AlertStatus.IGNORED;

    this.alerts.set(alertId, alert);
    this.saveState();

    return { success: true, alertId };
  }

  /**
   * Get alert statistics
   * @returns {object} Statistics
   */
  getAlertStatistics() {
    const alerts = Array.from(this.alerts.values());
    const total = alerts.length;

    const byType = {};
    alerts.forEach(a => {
      byType[a.type] = (byType[a.type] || 0) + 1;
    });

    const bySeverity = {};
    alerts.forEach(a => {
      bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
    });

    const byStatus = {};
    alerts.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    const active = byStatus[AlertStatus.ACTIVE] || 0;
    const acknowledged = byStatus[AlertStatus.ACKNOWLEDGED] || 0;
    const resolved = byStatus[AlertStatus.RESOLVED] || 0;

    return {
      total,
      byType,
      bySeverity,
      byStatus,
      active,
      acknowledged,
      resolved
    };
  }

  /**
   * Get active alerts
   * @returns {Array} Active alerts
   */
  getActiveAlerts() {
    return this.getAlerts({ status: AlertStatus.ACTIVE });
  }

  /**
   * Get critical alerts
   * @returns {Array} Critical alerts
   */
  getCriticalAlerts() {
    return this.getAlerts({ severity: AlertSeverity.CRITICAL, status: AlertStatus.ACTIVE });
  }

  /**
   * Get emergency alerts
   * @returns {Array} Emergency alerts
   */
  getEmergencyAlerts() {
    return this.getAlerts({ severity: AlertSeverity.EMERGENCY, status: AlertStatus.ACTIVE });
  }

  /**
   * Delete alert
   * @param {string} alertId - Alert ID
   * @returns {object} Delete result
   */
  deleteAlert(alertId) {
    const deleted = this.alerts.delete(alertId);
    this.saveState();
    return { success: deleted, alertId };
  }

  /**
   * Clear resolved alerts
   * @returns {object} Clear result
   */
  clearResolvedAlerts() {
    let cleared = 0;
    
    this.alerts.forEach((alert, alertId) => {
      if (alert.status === AlertStatus.RESOLVED || alert.status === AlertStatus.IGNORED) {
        this.alerts.delete(alertId);
        cleared++;
      }
    });

    this.saveState();
    return { success: true, cleared };
  }

  /**
   * Trim alerts to max size
   */
  trimAlerts() {
    while (this.alerts.size > this.maxAlerts) {
      const firstKey = this.alerts.keys().next().value;
      this.alerts.delete(firstKey);
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
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        alerts: Array.from(this.alerts.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save alert center state:', error);
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
      }
    } catch (error) {
      console.error('Failed to load alert center state:', error);
      this.alerts = new Map();
    }
  }

  /**
   * Destroy the alert center
   */
  destroy() {
    this.alerts.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[AlertCenter] Destroyed');
  }
}

// Singleton instance
let alertCenterInstance = null;

/**
 * Get the singleton alert center instance
 * @returns {AlertCenter} Alert center instance
 */
export function getAlertCenter() {
  if (!alertCenterInstance) {
    alertCenterInstance = new AlertCenter();
  }
  return alertCenterInstance;
}

export default AlertCenter;
