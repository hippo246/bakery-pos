// Export/Import Notifications
// Notifications for export and import events

import { getNotificationManager } from '../notifications/NotificationManager.js';

export class ExportImportNotifications {
  constructor() {
    this.notificationManager = getNotificationManager();
  }

  /**
   * Notify export finished
   * @param {object} details - Export details
   */
  notifyExportFinished(details) {
    this.notificationManager.send({
      type: 'export_completed',
      title: 'Export Completed',
      message: `Export of ${details.module} completed successfully`,
      priority: 'info',
      data: {
        module: details.module,
        format: details.format,
        recordCount: details.recordCount,
        size: details.size
      }
    });
  }

  /**
   * Notify import finished
   * @param {object} details - Import details
   */
  notifyImportFinished(details) {
    this.notificationManager.send({
      type: 'import_completed',
      title: 'Import Completed',
      message: `Import of ${details.module} completed successfully`,
      priority: 'info',
      data: {
        module: details.module,
        format: details.format,
        recordsImported: details.recordsImported,
        recordsSkipped: details.recordsSkipped
      }
    });
  }

  /**
   * Notify validation failed
   * @param {object} details - Validation details
   */
  notifyValidationFailed(details) {
    this.notificationManager.send({
      type: 'validation_failed',
      title: 'Validation Failed',
      message: `${details.errorCount} validation errors found in ${details.module}`,
      priority: 'warning',
      data: {
        module: details.module,
        errorCount: details.errorCount,
        errors: details.errors
      }
    });
  }

  /**
   * Notify conflict detected
   * @param {object} details - Conflict details
   */
  notifyConflictDetected(details) {
    this.notificationManager.send({
      type: 'conflict_detected',
      title: 'Conflicts Detected',
      message: `${details.conflictCount} conflicts found in ${details.module}`,
      priority: 'warning',
      data: {
        module: details.module,
        conflictCount: details.conflictCount,
        conflicts: details.conflicts
      }
    });
  }

  /**
   * Notify large export completed
   * @param {object} details - Export details
   */
  notifyLargeExportCompleted(details) {
    this.notificationManager.send({
      type: 'large_export_completed',
      title: 'Large Export Completed',
      message: `Large export of ${details.module} completed (${(details.size / 1024 / 1024).toFixed(2)} MB)`,
      priority: 'info',
      data: {
        module: details.module,
        size: details.size,
        recordCount: details.recordCount
      }
    });
  }

  /**
   * Notify import cancelled
   * @param {object} details - Import details
   */
  notifyImportCancelled(details) {
    this.notificationManager.send({
      type: 'import_cancelled',
      title: 'Import Cancelled',
      message: `Import of ${details.module} was cancelled`,
      priority: 'warning',
      data: {
        module: details.module,
        reason: details.reason
      }
    });
  }

  /**
   * Notify export failed
   * @param {object} details - Export details
   */
  notifyExportFailed(details) {
    this.notificationManager.send({
      type: 'export_failed',
      title: 'Export Failed',
      message: `Export of ${details.module} failed: ${details.error}`,
      priority: 'error',
      data: {
        module: details.module,
        error: details.error
      }
    });
  }

  /**
   * Notify import failed
   * @param {object} details - Import details
   */
  notifyImportFailed(details) {
    this.notificationManager.send({
      type: 'import_failed',
      title: 'Import Failed',
      message: `Import of ${details.module} failed: ${details.error}`,
      priority: 'error',
      data: {
        module: details.module,
        error: details.error
      }
    });
  }

  /**
   * Subscribe to notifications
   * @param {string} type - Notification type
   * @param {function} callback - Callback function
   */
  subscribe(type, callback) {
    this.notificationManager.subscribe(type, callback);
  }

  /**
   * Unsubscribe from notifications
   * @param {string} type - Notification type
   * @param {function} callback - Callback function
   */
  unsubscribe(type, callback) {
    this.notificationManager.unsubscribe(type, callback);
  }

  /**
   * Get notification history
   * @param {object} filters - Optional filters
   * @returns {Array} Notification history
   */
  getNotificationHistory(filters = {}) {
    return this.notificationManager.getHistory(filters);
  }

  /**
   * Get notification statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.notificationManager.getHistory();
    const total = history.length;

    const byType = {};
    history.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1;
    });

    const byPriority = {};
    history.forEach(notification => {
      byPriority[notification.priority] = (byPriority[notification.priority] || 0) + 1;
    });

    return {
      total,
      byType,
      byPriority
    };
  }
}

// Singleton instance
let exportImportNotificationsInstance = null;

/**
 * Get the singleton export/import notifications instance
 * @returns {ExportImportNotifications} Export/import notifications instance
 */
export function getExportImportNotifications() {
  if (!exportImportNotificationsInstance) {
    exportImportNotificationsInstance = new ExportImportNotifications();
  }
  return exportImportNotificationsInstance;
}

export default ExportImportNotifications;
