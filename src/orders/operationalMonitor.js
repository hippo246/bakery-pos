// Operational Monitor
// Live operations panel for enterprise restaurant management

import { now } from '../domain/dates.js';
import { getTerminalManager } from './terminalManager.js';

const OPERATIONAL_DATA_KEY = 'cafeos_operational_data';

/**
 * Alert Types
 */
export const ALERT_TYPES = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

/**
 * Alert Categories
 */
export const ALERT_CATEGORIES = {
  TERMINAL: 'TERMINAL',
  KITCHEN: 'KITCHEN',
  PAYMENT: 'PAYMENT',
  INVENTORY: 'INVENTORY',
  NETWORK: 'NETWORK',
  WORKFLOW: 'WORKFLOW',
  STAFF: 'STAFF',
  GENERAL: 'GENERAL'
};

/**
 * Operational Monitor class
 * Live operations panel for enterprise restaurant management
 */
export class OperationalMonitor {
  constructor() {
    this.operationalData = new Map();
    this.alerts = new Map();
    this.subscribers = new Map();
    this.loadOperationalData();
    this.loadAlerts();
    this.startAutoRefresh();
  }

  /**
   * Load operational data from localStorage
   */
  loadOperationalData() {
    try {
      const stored = localStorage.getItem(OPERATIONAL_DATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.data) {
          data.data.forEach(item => {
            this.operationalData.set(item.key, item);
          });
 }
      }
    } catch (error) {
      console.error('[OperationalMonitor] Failed to load operational data:', error);
    }
  }

  /**
   * Save operational data to localStorage
   */
  saveOperationalData() {
    try {
      const data = Array.from(this.operationalData.values());
      localStorage.setItem(OPERATIONAL_DATA_KEY, JSON.stringify({ data }));
    } catch (error) {
      console.error('[OperationalMonitor] Failed to save operational data:', error);
    }
  }

  /**
   * Load alerts from localStorage
   */
  loadAlerts() {
    try {
      const stored = localStorage.getItem('cafeos_operational_alerts');
      if (stored) {
        const alerts = JSON.parse(stored);
        alerts.forEach(alert => {
          this.alerts.set(alert.id, alert);
        });
      }
    } catch (error) {
      console.error('[OperationalMonitor] Failed to load alerts:', error);
    }
  }

  /**
   * Save alerts to localStorage
   */
  saveAlerts() {
    try {
      const alerts = Array.from(this.alerts.values());
      localStorage.setItem('cafeos_operational_alerts', JSON.stringify(alerts));
    } catch (error) {
      console.error('[OperationalMonitor] Failed to save alerts:', error);
    }
  }

  /**
   * Start auto refresh
   */
  startAutoRefresh() {
    // Refresh every 30 seconds
    setInterval(() => {
      this.refreshOperationalData();
    }, 30000);
  }

  /**
   * Refresh operational data
   */
  refreshOperationalData() {
    const terminalManager = getTerminalManager();
    const terminals = terminalManager.getAllTerminals();
    const sessions = terminalManager.getActiveSessions();

    // Update terminal counts
    this.updateOperationalMetric('active_terminals', terminals.filter(t => t.status === 'ONLINE').length);
    this.updateOperationalMetric('offline_terminals', terminals.filter(t => t.status === 'OFFLINE').length);
    this.updateOperationalMetric('busy_terminals', terminals.filter(t => t.status === 'BUSY').length);
    this.updateOperationalMetric('locked_terminals', terminals.filter(t => t.status === 'LOCKED').length);
    this.updateOperationalMetric('total_terminals', terminals.length);

    // Update session counts
    this.updateOperationalMetric('active_sessions', sessions.length);
    this.updateOperationalMetric('busy_cashiers', sessions.filter(s => s.cashDrawerOpen).length);

    // Notify subscribers
    this.notifySubscribers('refresh');
  }

  /**
   * Update operational metric
   * @param {string} key - Metric key
   * @param {*} value - Metric value
   */
  updateOperationalMetric(key, value) {
    this.operationalData.set(key, {
      key,
      value,
      updatedAt: now()
    });
    this.saveOperationalData();
  }

  /**
   * Get operational metric
   * @param {string} key - Metric key
   * @returns {*} Metric value
   */
  getOperationalMetric(key) {
    const data = this.operationalData.get(key);
    return data ? data.value : null;
  }

  /**
   * Get live operational status
   * @returns {Object} Live operational status
   */
  getLiveOperationalStatus() {
    const terminalManager = getTerminalManager();
    const terminals = terminalManager.getAllTerminals();
    const sessions = terminalManager.getActiveSessions();

    return {
      // Terminals
      activeTerminals: terminals.filter(t => t.status === 'ONLINE').length,
      offlineTerminals: terminals.filter(t => t.status === 'OFFLINE').length,
      busyTerminals: terminals.filter(t => t.status === 'BUSY').length,
      lockedTerminals: terminals.filter(t => t.status === 'LOCKED').length,
      totalTerminals: terminals.length,

      // Sessions
      activeSessions: sessions.length,
      busyCashiers: sessions.filter(s => s.cashDrawerOpen).length,

      // Queues (placeholder - would integrate with actual queue systems)
      heldBills: this.getOperationalMetric('held_bills') || 0,
      kitchenQueue: this.getOperationalMetric('kitchen_queue') || 0,
      pickupQueue: this.getOperationalMetric('pickup_queue') || 0,
      deliveryQueue: this.getOperationalMetric('delivery_queue') || 0,
      paymentQueue: this.getOperationalMetric('payment_queue') || 0,

      // Approvals
      pendingApprovals: this.getOperationalMetric('pending_approvals') || 0,

      // Alerts
      activeAlerts: this.getActiveAlerts().length,
      criticalAlerts: this.getActiveAlerts().filter(a => a.type === ALERT_TYPES.CRITICAL || a.type === ALERT_TYPES.EMERGENCY).length,

      // Timestamp
      lastUpdated: now()
    };
  }

  /**
   * Update queue metric
   * @param {string} queueType - Queue type
   * @param {number} count - Queue count
   */
  updateQueueMetric(queueType, count) {
    const key = `${queueType}_queue`;
    this.updateOperationalMetric(key, count);
    this.notifySubscribers('queue_update', { queueType, count });
  }

  /**
   * Update pending approvals
   * @param {number} count - Approval count
   */
  updatePendingApprovals(count) {
    this.updateOperationalMetric('pending_approvals', count);
    this.notifySubscribers('approval_update', { count });
  }

  /**
   * Create alert
   * @param {Object} alertData - Alert data
   * @returns {Object} Created alert
   */
  createAlert(alertData) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: alertData.type || ALERT_TYPES.INFO,
      category: alertData.category || ALERT_CATEGORIES.GENERAL,
      title: alertData.title || 'Untitled Alert',
      message: alertData.message || '',
      
      // Targeting
      targetBranchId: alertData.targetBranchId || null,
      targetTerminalId: alertData.targetTerminalId || null,
      targetStaffId: alertData.targetStaffId || null,
      targetRole: alertData.targetRole || null,
      
      // Status
      status: 'ACTIVE',
      acknowledged: false,
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolved: false,
      resolvedBy: null,
      resolvedAt: null,
      
      // Priority
      priority: alertData.priority || 'MEDIUM',
      
      // Timestamps
      createdAt: now(),
      expiresAt: alertData.expiresAt || null,
      
      // Metadata
      metadata: alertData.metadata || {}
    };

    this.alerts.set(alert.id, alert);
    this.saveAlerts();
    this.notifySubscribers('alert_created', alert);

    return alert;
  }

  /**
   * Get alert by ID
   * @param {string} alertId - Alert ID
   * @returns {Object|null} Alert or null
   */
  getAlert(alertId) {
    return this.alerts.get(alertId) || null;
  }

  /**
   * Get all alerts
   * @returns {Array} Array of alerts
   */
  getAllAlerts() {
    return Array.from(this.alerts.values());
  }

  /**
   * Get active alerts
   * @returns {Array} Array of active alerts
   */
  getActiveAlerts() {
    const currentTime = now();
    return this.getAllAlerts().filter(a => 
      a.status === 'ACTIVE' && 
      (!a.expiresAt || currentTime < a.expiresAt)
    );
  }

  /**
   * Get alerts by type
   * @param {string} type - Alert type
   * @returns {Array} Array of alerts
   */
  getAlertsByType(type) {
    return this.getAllAlerts().filter(a => a.type === type);
  }

  /**
   * Get alerts by category
   * @param {string} category - Alert category
   * @returns {Array} Array of alerts
   */
  getAlertsByCategory(category) {
    return this.getAllAlerts().filter(a => a.category === category);
  }

  /**
   * Get alerts for target
   * @param {Object} target - Target filter
   * @returns {Array} Array of alerts
   */
  getAlertsForTarget(target) {
    return this.getAllAlerts().filter(a => {
      if (target.branchId && a.targetBranchId && a.targetBranchId !== target.branchId) return false;
      if (target.terminalId && a.targetTerminalId && a.targetTerminalId !== target.terminalId) return false;
      if (target.staffId && a.targetStaffId && a.targetStaffId !== target.staffId) return false;
      if (target.role && a.targetRole && a.targetRole !== target.role) return false;
      return true;
    });
  }

  /**
   * Acknowledge alert
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID
   * @returns {Object} Result
   */
  acknowledgeAlert(alertId, userId) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = now();

    this.alerts.set(alertId, alert);
    this.saveAlerts();
    this.notifySubscribers('alert_acknowledged', alert);

    return { success: true, alert };
  }

  /**
   * Resolve alert
   * @param {string} alertId - Alert ID
   * @param {string} userId - User ID
   * @param {string} resolution - Resolution notes
   * @returns {Object} Result
   */
  resolveAlert(alertId, userId, resolution = '') {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.status = 'RESOLVED';
    alert.resolved = true;
    alert.resolvedBy = userId;
    alert.resolvedAt = now();
    alert.resolution = resolution;

    this.alerts.set(alertId, alert);
    this.saveAlerts();
    this.notifySubscribers('alert_resolved', alert);

    return { success: true, alert };
  }

  /**
   * Escalate alert
   * @param {string} alertId - Alert ID
   * @param {string} newPriority - New priority
   * @returns {Object} Result
   */
  escalateAlert(alertId, newPriority) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.priority = newPriority;
    alert.escalatedAt = now();

    this.alerts.set(alertId, alert);
    this.saveAlerts();
    this.notifySubscribers('alert_escalated', alert);

    return { success: true, alert };
  }

  /**
   * Mute alert
   * @param {string} alertId - Alert ID
   * @param {number} duration - Duration in milliseconds
   * @returns {Object} Result
   */
  muteAlert(alertId, duration = 3600000) {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return { success: false, reason: 'Alert not found' };
    }

    alert.muted = true;
    alert.mutedUntil = now() + duration;

    this.alerts.set(alertId, alert);
    this.saveAlerts();

    return { success: true, alert };
  }

  /**
   * Delete alert
   * @param {string} alertId - Alert ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteAlert(alertId) {
    const deleted = this.alerts.delete(alertId);
    if (deleted) {
      this.saveAlerts();
      this.notifySubscribers('alert_deleted', { alertId });
    }
    return deleted;
  }

  /**
   * Subscribe to updates
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   * @returns {string} Subscription ID
   */
  subscribe(eventType, callback) {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }

    this.subscribers.get(eventType).set(subscriptionId, callback);

    return subscriptionId;
  }

  /**
   * Unsubscribe from updates
   * @param {string} eventType - Event type
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Whether unsubscription was successful
   */
  unsubscribe(eventType, subscriptionId) {
    const eventSubscribers = this.subscribers.get(eventType);
    if (!eventSubscribers) return false;

    const deleted = eventSubscribers.delete(subscriptionId);
    if (deleted && eventSubscribers.size === 0) {
      this.subscribers.delete(eventType);
    }

    return deleted;
  }

  /**
   * Notify subscribers
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  notifySubscribers(eventType, data) {
    const eventSubscribers = this.subscribers.get(eventType);
    if (!eventSubscribers) return;

    setTimeout(() => {
      eventSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[OperationalMonitor] Subscriber callback error:', error);
        }
      });
    }, 0);
  }

  /**
   * Get terminal status summary
   * @param {string} branchId - Branch ID
   * @returns {Object} Terminal status summary
   */
  getTerminalStatusSummary(branchId = null) {
    const terminalManager = getTerminalManager();
    let terminals = terminalManager.getAllTerminals();

    if (branchId) {
      terminals = terminals.filter(t => t.branchId === branchId);
    }

    return {
      total: terminals.length,
      online: terminals.filter(t => t.status === 'ONLINE').length,
      offline: terminals.filter(t => t.status === 'OFFLINE').length,
      busy: terminals.filter(t => t.status === 'BUSY').length,
      idle: terminals.filter(t => t.status === 'IDLE').length,
      locked: terminals.filter(t => t.status === 'LOCKED').length,
      disabled: terminals.filter(t => t.status === 'DISABLED').length,
      maintenance: terminals.filter(t => t.status === 'MAINTENANCE').length,
      healthy: terminals.filter(t => t.healthStatus === 'HEALTHY').length,
      warning: terminals.filter(t => t.healthStatus === 'WARNING').length,
      critical: terminals.filter(t => t.healthStatus === 'CRITICAL').length
    };
  }

  /**
   * Get operational summary
   * @returns {Object} Operational summary
   */
  getOperationalSummary() {
    return {
      liveStatus: this.getLiveOperationalStatus(),
      terminalStatus: this.getTerminalStatusSummary(),
      activeAlerts: this.getActiveAlerts(),
      alertSummary: {
        total: this.getAllAlerts().length,
        active: this.getActiveAlerts().length,
        byType: this.getAllAlerts().reduce((acc, a) => {
          acc[a.type] = (acc[a.type] || 0) + 1;
          return acc;
        }, {}),
        byCategory: this.getAllAlerts().reduce((acc, a) => {
          acc[a.category] = (acc[a.category] || 0) + 1;
          return acc;
        }, {})
      }
    };
  }

  /**
   * Clear old alerts
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of alerts cleared
   */
  clearOldAlerts(olderThan = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleared = 0;

    for (const [id, alert] of this.alerts) {
      if (alert.status === 'RESOLVED' && alert.resolvedAt && alert.resolvedAt < cutoff) {
        this.alerts.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveAlerts();
    }

    return cleared;
  }

  /**
   * Export operational data
   * @returns {Object} Exported data
   */
  exportOperationalData() {
    return {
      operationalData: Array.from(this.operationalData.values()),
      alerts: Array.from(this.alerts.values()),
      exportedAt: now()
    };
  }

  /**
   * Import operational data
   * @param {Object} data - Imported data
   * @returns {Object} Import result
   */
  importOperationalData(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.operationalData)) {
        data.operationalData.forEach(item => {
          this.operationalData.set(item.key, item);
        });
      }

      if (Array.isArray(data.alerts)) {
        data.alerts.forEach(alert => {
          this.alerts.set(alert.id, alert);
        });
      }

      this.saveOperationalData();
      this.saveAlerts();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let operationalMonitorInstance = null;

/**
 * Get the operational monitor singleton
 * @returns {OperationalMonitor} Operational monitor instance
 */
export function getOperationalMonitor() {
  if (!operationalMonitorInstance) {
    operationalMonitorInstance = new OperationalMonitor();
  }
  return operationalMonitorInstance;
}

/**
 * Reset the operational monitor (useful for testing)
 */
export function resetOperationalMonitor() {
  operationalMonitorInstance = null;
}

/**
 * Convenience function to create an alert
 * @param {Object} alertData - Alert data
 * @returns {Object} Created alert
 */
export function createOperationalAlert(alertData = {}) {
  const monitor = getOperationalMonitor();
  return monitor.createAlert(alertData);
}

/**
 * Convenience function to get live operational status
 * @returns {Object} Live operational status
 */
export function getLiveOperationalStatus() {
  const monitor = getOperationalMonitor();
  return monitor.getLiveOperationalStatus();
}
