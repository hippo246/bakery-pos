// Backup Notification Manager
// Manages notifications for backup events

class BackupNotificationManager {
  constructor() {
    this.listeners = new Set();
    this.notificationHistory = [];
    this.maxHistorySize = 100;
    this.storageKey = 'cafeos_backup_notifications';
    this.loadFromStorage();
  }

  /**
   * Notification types
   */
  static NotificationType = {
    BACKUP_STARTED: 'backup_started',
    BACKUP_COMPLETED: 'backup_completed',
    BACKUP_FAILED: 'backup_failed',
    BACKUP_CANCELLED: 'backup_cancelled',
    VERIFICATION_FAILED: 'verification_failed',
    BACKUP_SKIPPED: 'backup_skipped',
    RETENTION_CLEANUP: 'retention_cleanup',
    STORAGE_FULL: 'storage_full',
    SCHEDULE_MISSED: 'schedule_missed',
    BACKUP_WARNING: 'backup_warning',
    BACKUP_CRITICAL: 'backup_critical'
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
      type: notification.type || BackupNotificationManager.NotificationType.BACKUP_WARNING,
      priority: notification.priority || BackupNotificationManager.Priority.NORMAL,
      title: notification.title || 'Backup Notification',
      message: notification.message || '',
      backupId: notification.backupId || null,
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
        console.error('[BackupNotificationManager] Error in listener:', error);
      }
    });

    // Show browser notification if permission granted
    this.showBrowserNotification(fullNotification);

    console.log(`[BackupNotificationManager] ${fullNotification.type}:`, fullNotification);
  }

  /**
   * Generate a unique notification ID
   * @returns {string} Notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          tag: notification.backupId || 'backup',
          priority: notification.priority
        });
      } catch (error) {
        console.error('[BackupNotificationManager] Failed to show browser notification:', error);
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

    if (filters.backupId) {
      notifications = notifications.filter(n => n.backupId === filters.backupId);
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
        if (filters.backupId && n.backupId === filters.backupId) return false;
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
      console.error('[BackupNotificationManager] Failed to save notifications:', error);
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
      console.error('[BackupNotificationManager] Failed to load notifications:', error);
      this.notificationHistory = [];
    }
  }

  /**
   * Convenience methods for common notifications
   */
  notifyBackupStarted(backupId, backupName) {
    this.send({
      type: BackupNotificationManager.NotificationType.BACKUP_STARTED,
      priority: BackupNotificationManager.Priority.NORMAL,
      title: 'Backup Started',
      message: `Backup "${backupName}" has started`,
      backupId,
      details: { backupName }
    });
  }

  notifyBackupCompleted(backupId, backupName, duration, size) {
    this.send({
      type: BackupNotificationManager.NotificationType.BACKUP_COMPLETED,
      priority: BackupNotificationManager.Priority.NORMAL,
      title: 'Backup Completed',
      message: `Backup "${backupName}" completed successfully`,
      backupId,
      details: { backupName, duration, size }
    });
  }

  notifyBackupFailed(backupId, backupName, error) {
    this.send({
      type: BackupNotificationManager.NotificationType.BACKUP_FAILED,
      priority: BackupNotificationManager.Priority.HIGH,
      title: 'Backup Failed',
      message: `Backup "${backupName}" failed: ${error}`,
      backupId,
      details: { backupName, error }
    });
  }

  notifyBackupCancelled(backupId, backupName) {
    this.send({
      type: BackupNotificationManager.NotificationType.BACKUP_CANCELLED,
      priority: BackupNotificationManager.Priority.NORMAL,
      title: 'Backup Cancelled',
      message: `Backup "${backupName}" was cancelled`,
      backupId,
      details: { backupName }
    });
  }

  notifyVerificationFailed(backupId, backupName, reason) {
    this.send({
      type: BackupNotificationManager.NotificationType.VERIFICATION_FAILED,
      priority: BackupNotificationManager.Priority.HIGH,
      title: 'Verification Failed',
      message: `Backup "${backupName}" verification failed: ${reason}`,
      backupId,
      details: { backupName, reason }
    });
  }

  notifyRetentionCleanup(deletedCount) {
    this.send({
      type: BackupNotificationManager.NotificationType.RETENTION_CLEANUP,
      priority: BackupNotificationManager.Priority.NORMAL,
      title: 'Retention Cleanup',
      message: `Cleaned up ${deletedCount} old backups`,
      details: { deletedCount }
    });
  }

  notifyStorageFull() {
    this.send({
      type: BackupNotificationManager.NotificationType.STORAGE_FULL,
      priority: BackupNotificationManager.Priority.URGENT,
      title: 'Storage Full',
      message: 'Storage is nearly full. Please clean up old backups.',
      details: {}
    });
  }

  notifyScheduleMissed(scheduleId, scheduleName) {
    this.send({
      type: BackupNotificationManager.NotificationType.SCHEDULE_MISSED,
      priority: BackupNotificationManager.Priority.HIGH,
      title: 'Schedule Missed',
      message: `Scheduled backup "${scheduleName}" was missed`,
      details: { scheduleId, scheduleName }
    });
  }

  notifyBackupWarning(backupId, backupName, warning) {
    this.send({
      type: BackupNotificationManager.NotificationType.BACKUP_WARNING,
      priority: BackupNotificationManager.Priority.NORMAL,
      title: 'Backup Warning',
      message: `Backup "${backupName}": ${warning}`,
      backupId,
      details: { backupName, warning }
    });
  }

  notifyBackupCritical(backupId, backupName, critical) {
    this.send({
      type: BackupNotificationManager.NotificationType.BACKUP_CRITICAL,
      priority: BackupNotificationManager.Priority.URGENT,
      title: 'Backup Critical',
      message: `Backup "${backupName}": ${critical}`,
      backupId,
      details: { backupName, critical }
    });
  }

  /**
   * Destroy the notification manager
   */
  destroy() {
    this.listeners.clear();
    this.notificationHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[BackupNotificationManager] Destroyed');
  }
}

// Singleton instance
let notificationManagerInstance = null;

/**
 * Get the singleton notification manager instance
 * @returns {BackupNotificationManager} Notification manager instance
 */
export function getBackupNotificationManager() {
  if (!notificationManagerInstance) {
    notificationManagerInstance = new BackupNotificationManager();
  }
  return notificationManagerInstance;
}

export default BackupNotificationManager;
