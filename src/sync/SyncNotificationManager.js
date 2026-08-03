// Sync Notification Manager
// Manages notifications for sync events

class SyncNotificationManager {
  constructor() {
    this.listeners = new Set();
    this.notificationHistory = [];
    this.maxHistorySize = 100;
    this.storageKey = 'cafeos_sync_notifications';
    this.loadState();
  }

  /**
   * Notification types
   */
  static NotificationType = {
    SYNC_STARTED: 'sync_started',
    SYNC_COMPLETED: 'sync_completed',
    SYNC_FAILED: 'sync_failed',
    SYNC_CANCELLED: 'sync_cancelled',
    SYNC_PAUSED: 'sync_paused',
    SYNC_RESUMED: 'sync_resumed',
    OFFLINE_MODE_ENABLED: 'offline_mode_enabled',
    INTERNET_RESTORED: 'internet_restored',
    CONFLICT_DETECTED: 'conflict_detected',
    RETRY_LIMIT_REACHED: 'retry_limit_reached',
    CLOUD_UNAVAILABLE: 'cloud_unavailable',
    QUEUE_GROWING: 'queue_growing',
    BACKGROUND_SYNC_STARTED: 'background_sync_started',
    BACKGROUND_SYNC_COMPLETED: 'background_sync_completed'
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
      type: notification.type || SyncNotificationManager.NotificationType.SYNC_COMPLETED,
      priority: notification.priority || SyncNotificationManager.Priority.NORMAL,
      title: notification.title || 'Sync Notification',
      message: notification.message || '',
      syncId: notification.syncId || null,
      details: notification.details || {},
      read: false,
      dismissed: false
    };

    this.notificationHistory.push(fullNotification);
    this.trimHistory();
    this.saveState();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(fullNotification);
      } catch (error) {
        console.error('[SyncNotificationManager] Error in listener:', error);
      }
    });

    // Show browser notification if permission granted
    this.showBrowserNotification(fullNotification);

    console.log(`[SyncNotificationManager] ${fullNotification.type}:`, fullNotification);
  }

  /**
   * Generate a unique notification ID
   * @returns {string} Notification ID
   */
  generateNotificationId() {
    return `sync_notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          tag: notification.syncId || 'sync',
          priority: notification.priority
        });
      } catch (error) {
        console.error('[SyncNotificationManager] Failed to show browser notification:', error);
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

    if (filters.syncId) {
      notifications = notifications.filter(n => n.syncId === filters.syncId);
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
      this.saveState();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead() {
    this.notificationHistory.forEach(n => n.read = true);
    this.saveState();
  }

  /**
   * Dismiss notification
   * @param {string} notificationId - Notification ID
   */
  dismiss(notificationId) {
    const notification = this.notificationHistory.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      this.saveState();
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
        if (filters.syncId && n.syncId === filters.syncId) return false;
        return true;
      });
    }
    this.saveState();
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
      console.error('[SyncNotificationManager] Failed to save notifications:', error);
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
      console.error('[SyncNotificationManager] Failed to load notifications:', error);
      this.notificationHistory = [];
    }
  }

  /**
   * Convenience methods for common notifications
   */
  notifySyncStarted(syncId, module) {
    this.send({
      type: SyncNotificationManager.NotificationType.SYNC_STARTED,
      priority: SyncNotificationManager.Priority.NORMAL,
      title: 'Sync Started',
      message: `Sync operation (${module}) has started`,
      syncId,
      details: { module }
    });
  }

  notifySyncCompleted(syncId, duration, module) {
    this.send({
      type: SyncNotificationManager.NotificationType.SYNC_COMPLETED,
      priority: SyncNotificationManager.Priority.NORMAL,
      title: 'Sync Completed',
      message: `Sync completed successfully in ${Math.round(duration / 1000)}s`,
      syncId,
      details: { duration, module }
    });
  }

  notifySyncFailed(syncId, error, module) {
    this.send({
      type: SyncNotificationManager.NotificationType.SYNC_FAILED,
      priority: SyncNotificationManager.Priority.HIGH,
      title: 'Sync Failed',
      message: `Sync failed: ${error}`,
      syncId,
      details: { error, module }
    });
  }

  notifySyncCancelled(syncId, module) {
    this.send({
      type: SyncNotificationManager.NotificationType.SYNC_CANCELLED,
      priority: SyncNotificationManager.Priority.NORMAL,
      title: 'Sync Cancelled',
      message: 'Sync operation was cancelled',
      syncId,
      details: { module }
    });
  }

  notifyOfflineModeEnabled() {
    this.send({
      type: SyncNotificationManager.NotificationType.OFFLINE_MODE_ENABLED,
      priority: SyncNotificationManager.Priority.HIGH,
      title: 'Offline Mode Enabled',
      message: 'Internet connection lost. Working in offline mode.',
      details: {}
    });
  }

  notifyInternetRestored() {
    this.send({
      type: SyncNotificationManager.NotificationType.INTERNET_RESTORED,
      priority: SyncNotificationManager.Priority.NORMAL,
      title: 'Internet Restored',
      message: 'Internet connection restored. Sync will resume.',
      details: {}
    });
  }

  notifyConflictDetected(syncId, conflictCount) {
    this.send({
      type: SyncNotificationManager.NotificationType.CONFLICT_DETECTED,
      priority: SyncNotificationManager.Priority.NORMAL,
      title: 'Conflicts Detected',
      message: `Detected ${conflictCount} conflict(s) during sync`,
      syncId,
      details: { conflictCount }
    });
  }

  notifyRetryLimitReached(syncId, retryCount) {
    this.send({
      type: SyncNotificationManager.NotificationType.RETRY_LIMIT_REACHED,
      priority: SyncNotificationManager.Priority.HIGH,
      title: 'Retry Limit Reached',
      message: `Sync failed after ${retryCount} retries`,
      syncId,
      details: { retryCount }
    });
  }

  notifyCloudUnavailable() {
    this.send({
      type: SyncNotificationManager.NotificationType.CLOUD_UNAVAILABLE,
      priority: SyncNotificationManager.Priority.URGENT,
      title: 'Cloud Unavailable',
      message: 'Cloud storage provider is unavailable',
      details: {}
    });
  }

  notifyQueueGrowing(queueSize) {
    this.send({
      type: SyncNotificationManager.NotificationType.QUEUE_GROWING,
      priority: SyncNotificationManager.Priority.NORMAL,
      title: 'Sync Queue Growing',
      message: `Sync queue has ${queueSize} items pending`,
      details: { queueSize }
    });
  }

  /**
   * Destroy the notification manager
   */
  destroy() {
    this.listeners.clear();
    this.notificationHistory = [];
    localStorage.removeItem(this.storageKey);
    console.log('[SyncNotificationManager] Destroyed');
  }
}

// Singleton instance
let notificationManagerInstance = null;

/**
 * Get the singleton notification manager instance
 * @returns {SyncNotificationManager} Notification manager instance
 */
export function getSyncNotificationManager() {
  if (!notificationManagerInstance) {
    notificationManagerInstance = new SyncNotificationManager();
  }
  return notificationManagerInstance;
}

export default SyncNotificationManager;
