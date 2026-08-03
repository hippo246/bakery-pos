// Operations Notifications
// Notifications for operational events

import { getNotificationManager } from '../notifications/NotificationManager.js';

export class OperationsNotifications {
  constructor() {
    this.notificationManager = getNotificationManager();
    this.notificationTypes = [
      'critical_system_failure',
      'database_offline',
      'cloud_provider_failure',
      'backup_failure',
      'restore_failure',
      'security_warning',
      'performance_degradation',
      'storage_running_low'
    ];
  }

  /**
   * Notify critical system failure
   * @param {object} details - Failure details
   */
  notifyCriticalSystemFailure(details) {
    this.notificationManager.sendNotification({
      type: 'critical',
      title: 'Critical System Failure',
      message: details.message || 'A critical system failure has occurred',
      priority: 'high',
      metadata: {
        system: details.system,
        severity: details.severity,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify database offline
   * @param {object} details - Database details
   */
  notifyDatabaseOffline(details) {
    this.notificationManager.sendNotification({
      type: 'critical',
      title: 'Database Offline',
      message: details.message || 'The database is currently offline',
      priority: 'high',
      metadata: {
        database: details.database,
        lastOnline: details.lastOnline,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify cloud provider failure
   * @param {object} details - Cloud details
   */
  notifyCloudProviderFailure(details) {
    this.notificationManager.sendNotification({
      type: 'critical',
      title: 'Cloud Provider Failure',
      message: details.message || 'Cloud provider is experiencing issues',
      priority: 'high',
      metadata: {
        provider: details.provider,
        region: details.region,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify backup failure
   * @param {object} details - Backup details
   */
  notifyBackupFailure(details) {
    this.notificationManager.sendNotification({
      type: 'warning',
      title: 'Backup Failed',
      message: details.message || 'The backup operation failed',
      priority: 'medium',
      metadata: {
        backupId: details.backupId,
        reason: details.reason,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify restore failure
   * @param {object} details - Restore details
   */
  notifyRestoreFailure(details) {
    this.notificationManager.sendNotification({
      type: 'critical',
      title: 'Restore Failed',
      message: details.message || 'The restore operation failed',
      priority: 'high',
      metadata: {
        restoreId: details.restoreId,
        reason: details.reason,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify security warning
   * @param {object} details - Security details
   */
  notifySecurityWarning(details) {
    this.notificationManager.sendNotification({
      type: 'warning',
      title: 'Security Warning',
      message: details.message || 'A security issue has been detected',
      priority: 'high',
      metadata: {
        issue: details.issue,
        severity: details.severity,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify performance degradation
   * @param {object} details - Performance details
   */
  notifyPerformanceDegradation(details) {
    this.notificationManager.sendNotification({
      type: 'warning',
      title: 'Performance Degradation',
      message: details.message || 'System performance has degraded',
      priority: 'medium',
      metadata: {
        metric: details.metric,
        currentValue: details.currentValue,
        threshold: details.threshold,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Notify storage running low
   * @param {object} details - Storage details
   */
  notifyStorageRunningLow(details) {
    this.notificationManager.sendNotification({
      type: 'warning',
      title: 'Storage Running Low',
      message: details.message || 'Storage space is running low',
      priority: 'medium',
      metadata: {
        usagePercent: details.usagePercent,
        availableGB: details.availableGB,
        totalGB: details.totalGB,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send custom operational notification
   * @param {object} notification - Notification data
   */
  sendOperationalNotification(notification) {
    this.notificationManager.sendNotification({
      type: notification.type || 'info',
      title: notification.title || 'Operational Notification',
      message: notification.message || '',
      priority: notification.priority || 'medium',
      metadata: {
        ...notification.metadata,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get notification statistics
   * @returns {object} Statistics
   */
  getNotificationStatistics() {
    // Placeholder for notification statistics
    return {
      total: 0,
      byType: {},
      byPriority: {}
    };
  }

  /**
   * Destroy the operations notifications
   */
  destroy() {
    console.log('[OperationsNotifications] Destroyed');
  }
}

// Singleton instance
let operationsNotificationsInstance = null;

/**
 * Get the singleton operations notifications instance
 * @returns {OperationsNotifications} Operations notifications instance
 */
export function getOperationsNotifications() {
  if (!operationsNotificationsInstance) {
    operationsNotificationsInstance = new OperationsNotifications();
  }
  return operationsNotificationsInstance;
}

export default OperationsNotifications;
