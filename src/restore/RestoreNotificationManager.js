// Restore Notification Manager
// Manages notifications for restore events

class RestoreNotificationManager {
  constructor() {
    this.listeners = new Set();
    this.notificationHistory = [];
    this.maxHistorySize = 100;
    this.storageKey = 'cafeos_restore_notifications';
    this.loadFromStorage();
  }

  /**
   * Notification types
   */
  static NotificationType = {
    RESTORE_STARTED: 'restore_started',
    RESTORE_COMPLETED: 'restore_completed',
    RESTORE_FAILED: 'restore_failed',
    RESTORE_CANCELLED: 'restore_cancelled',
    ROLLBACK_STARTED: 'rollback_started',
    ROLLBACK_COMPLETED: 'rollback_completed',
    VERIFICATION_FAILED: 'verification_failed',
    COMPATIBILITY_ISSUES: 'compatibility_issues',
    CONFLICTS_DETECTED: 'conflicts_detected',
    SAFETY_BACKUP_CREATED: 'safety_backup_created',
    DRY_RUN_COMPLETED: 'dry_run_completed'
  };

  /**
   * Notification priority levels
   */
  static Priority = {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent'
  };

  /**
   * Send a notification
   * @param {object} notification - Notification object
   */
  send(notification) {
    const fullNotification = {
      id: this.generateNotificationId(),
      timestamp: new Date().toISOString(),
      type: notification.type || RestoreNotificationManager.NotificationType.RESTORE_WARNING,
      priority: notification.priority || RestoreNotificationManager.Priority.NORMAL,
      title: notification.title || 'Restore Notification',
      message: notification.message || '',
      restoreId: notification.restoreId || null,
      details: notification.details || {},
      read: false,
      dismissed: false
    };

    this.notificationHistory.push(fullNotification);
    this.trimHistory();
    this.saveToStorage();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(fullNotification);
      } catch (error) {
        console.error('[RestoreNotificationManager] Error in listener:', error);
      }
    });

    // Show browser notification if permission granted
    this.showBrowserNotification(fullNotification);

    console.log(`[RestoreNotificationManager] ${fullNotification.type}:`, fullNotification);
  }

  /**
   * Generate a unique notification ID
   * @returns {string} Notification ID
   */
  generateNotificationId() {
    return `restore_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show browser notification
   * @param {object} notification - Notification object
   */
  async showBrowserNotification(notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.restoreId || 'restore',
          priority: notification.priority
        });
      } catch (error) {
        console.error('[RestoreNotificationManager] Failed to show browser notification:', error);
      }
    } else if (Notification.permission !== 'denied') {
      await Notification.requestPermission();
    }
  }

  /**
   * Subscribe to notifications
   * @param {function} listener - Notification listener function
   * @returns {function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  /**
   * Unsubscribe from notifications
   * @param {function} listener - Notification listener function
   */
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Get notification history
   * @param {object} filters - Optional filters
   * @returns {Array} Filtered notifications
   */
  getNotifications(filters = {}) {
    let notifications = [...this.notificationHistory];

    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }

    if (filters.priority) {
      notifications = notifications.filter(n => n.priority === filters.priority);
    }

    if (filters.restoreId) {
      notifications = notifications.filter(n => n.restoreId === filters.restoreId);
    }

    if (filters.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (filters.since) {
      notifications = notifications.filter(n => new Date(n.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      notifications = notifications.slice(-filters.limit);
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return notifications;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   */
  markAsRead(notificationId) {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notificationHistory.forEach(n => n.read = true);
    this.saveToStorage();
  }

  /**
   * Dismiss notification
   * @param {string} notificationId - Notification ID
   */
  dismiss(notificationId) {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      this.saveToStorage();
    }
  }

  /**
   * Get unread count
   * @returns {number} Number of unread notifications
   */
  getUnreadCount() {
    return this.notificationHistory.filter(n => !n.read && !n.dismissed).length;
  }

  /**
   * Clear notification history
   * @param {object} filters - Optional filters
   */
  clearHistory(filters = {}) {
    if (Object.keys(filters).length === 0) {
      this.notificationHistory = [];
    } else {
      this.notificationHistory = this.notificationHistory.filter(n => {
        if (filters.type && n.type === filters.type) return false;
        if (filters.priority && n.priority === filters.priority) return false;
        if (filters.restoreId && n.restoreId === filters.restoreId) return false;
        return true;
      });
    }
    this.saveToStorage();
  }

  /**
   * Trim history to max size
   */
  trimHistory() {
    if (this.notificationHistory.length > this.maxHistorySize) {
      this.notificationHistory = this.notificationHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Save to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.notificationHistory));
    } catch (error) {
      console.error('[RestoreNotificationManager] Failed to save notifications:', error);
    }
  }

  /**
   * Load from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.notificationHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[RestoreNotificationManager] Failed to load notifications:', error);
      this.notificationHistory = [];
    }
  }

  /**
   * Convenience methods for common notifications
   */
  notifyRestoreStarted(restoreId, restoreType) {
    this.send({
      type: RestoreNotificationManager.NotificationType.RESTORE_STARTED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Restore Started',
      message: `Restore operation (${restoreType}) has started`,
      restoreId,
      details: { restoreType }
    });
  }

  notifyRestoreCompleted(restoreId, duration, modules) {
    this.send({
      type: RestoreNotificationManager.NotificationType.RESTORE_COMPLETED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Restore Completed',
      message: `Restore completed successfully in ${Math.round(duration / 1000)}s`,
      restoreId,
      details: { duration, modules }
    });
  }

  notifyRestoreFailed(restoreId, error) {
    this.send({
      type: RestoreNotificationManager.NotificationType.RESTORE_FAILED,
      priority: RestoreNotificationManager.Priority.HIGH,
      title: 'Restore Failed',
      message: `Restore failed: ${error}`,
      restoreId,
      details: { error }
    });
  }

  notifyRestoreCancelled(restoreId) {
    this.send({
      type: RestoreNotificationManager.NotificationType.RESTORE_CANCELLED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Restore Cancelled',
      message: 'Restore operation was cancelled',
      restoreId,
      details: {}
    });
  }

  notifyRollbackStarted(restoreId) {
    this.send({
      type: RestoreNotificationManager.NotificationType.ROLLBACK_STARTED,
      priority: RestoreNotificationManager.Priority.HIGH,
      title: 'Rollback Started',
      message: 'Rollback to safety backup has started',
      restoreId,
      details: {}
    });
  }

  notifyRollbackCompleted(restoreId, rollbackId) {
    this.send({
      type: RestoreNotificationManager.NotificationType.ROLLBACK_COMPLETED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Rollback Completed',
      message: 'Rollback completed successfully',
      restoreId,
      details: { rollbackId }
    });
  }

  notifyVerificationFailed(restoreId, issues) {
    this.send({
      type: RestoreNotificationManager.NotificationType.VERIFICATION_FAILED,
      priority: RestoreNotificationManager.Priority.HIGH,
      title: 'Verification Failed',
      message: `Post-restore verification found ${issues.length} issues`,
      restoreId,
      details: { issues }
    });
  }

  notifyCompatibilityIssues(restoreId, issues, warnings) {
    this.send({
      type: RestoreNotificationManager.NotificationType.COMPATIBILITY_ISSUES,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Compatibility Issues',
      message: `Backup has ${issues.length} issues and ${warnings.length} warnings`,
      restoreId,
      details: { issues, warnings }
    });
  }

  notifyConflictsDetected(restoreId, conflicts) {
    this.send({
      type: RestoreNotificationManager.NotificationType.CONFLICTS_DETECTED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Conflicts Detected',
      message: `Detected ${conflicts.length} potential conflicts`,
      restoreId,
      details: { conflicts }
    });
  }

  notifySafetyBackupCreated(restoreId, safetyBackupId) {
    this.send({
      type: RestoreNotificationManager.NotificationType.SAFETY_BACKUP_CREATED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Safety Backup Created',
      message: 'Safety backup created before restore',
      restoreId,
      details: { safetyBackupId }
    });
  }

  notifyDryRunCompleted(restoreId, preview) {
    this.send({
      type: RestoreNotificationManager.NotificationType.DRY_RUN_COMPLETED,
      priority: RestoreNotificationManager.Priority.NORMAL,
      title: 'Dry Run Completed',
      message: 'Test restore completed without making changes',
      restoreId,
      details: { preview }
    });
  }

  /**
   * Destroy the notification manager
   */
  destroy() {
    this.listeners.clear();
    this.notificationHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[RestoreNotificationManager] Destroyed');
  }
}

// Singleton instance
let notificationManagerInstance = null;

/**
 * Get the singleton notification manager instance
 * @returns {RestoreNotificationManager} Notification manager instance
 */
export function getRestoreNotificationManager() {
  if (!notificationManagerInstance) {
    notificationManagerInstance = new RestoreNotificationManager();
  }
  return notificationManagerInstance;
}

export default RestoreNotificationManager;
