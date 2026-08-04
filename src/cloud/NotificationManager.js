// Notification Manager for Cloud Storage Platform
// Handles notification system for cloud events

/**
 * Notification Manager
 * Central notification system for cloud storage events
 * Supports multiple notification channels and event filtering
 */
class NotificationManager {
  constructor() {
    this.initialized = false;
    this.subscribers = new Map();
    this.notificationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Initialize the notification manager
   */
  async initialize() {
    if (this.initialized) return;
    
    // Load notification preferences
    this.loadPreferences();
    
    this.initialized = true;
  }

  /**
   * Load notification preferences
   */
  loadPreferences() {
    try {
      const preferences = localStorage.getItem('cafeos_notification_preferences');
      this.preferences = preferences ? JSON.parse(preferences) : this.getDefaultPreferences();
    } catch (error) {
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences
   * @returns {object}
   */
  getDefaultPreferences() {
    return {
      enabled: true,
      channels: {
        inApp: true,
        browser: false,
        email: false
      },
      events: {
        backup_completed: true,
        backup_failed: true,
        restore_completed: true,
        restore_failed: true,
        export_completed: true,
        export_failed: true,
        import_completed: true,
        import_failed: true,
        provider_connected: true,
        provider_disconnected: true,
        provider_health_warning: true,
        migration_completed: true,
        migration_failed: true,
        credential_rotated: true,
        attachment_uploaded: false,
        attachment_deleted: false
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  /**
   * Save notification preferences
   * @param {object} preferences 
   */
  savePreferences(preferences) {
    this.preferences = { ...this.preferences, ...preferences };
    localStorage.setItem('cafeos_notification_preferences', JSON.stringify(this.preferences));
  }

  /**
   * Send notification
   * @param {string} eventType 
   * @param {string} title 
   * @param {string} message 
   * @param {object} details 
   * @returns {Promise<{success: boolean, notificationId?: string}>}
   */
  async sendNotification(eventType, title, message, details = {}) {
    try {
      await this.initialize();
      
      // Check if notifications are enabled
      if (!this.preferences.enabled) {
        return { success: false, reason: 'Notifications disabled' };
      }

      // Check if event type is enabled
      if (!this.preferences.events[eventType]) {
        return { success: false, reason: 'Event type disabled' };
      }

      // Check quiet hours
      if (this.isQuietHours()) {
        return { success: false, reason: 'Quiet hours' };
      }

      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const notification = {
        notificationId,
        eventType,
        title,
        message,
        details,
        timestamp: new Date().toISOString(),
        read: false
      };

      // Send to enabled channels
      const channelResults = [];
      
      if (this.preferences.channels.inApp) {
        channelResults.push(await this.sendInAppNotification(notification));
      }
      
      if (this.preferences.channels.browser && this.checkBrowserPermission()) {
        channelResults.push(await this.sendBrowserNotification(notification));
      }
      
      if (this.preferences.channels.email) {
        channelResults.push(await this.queueEmailNotification(notification));
      }

      // Store notification
      await this.storeNotification(notification);

      // Notify subscribers
      this.notifySubscribers(eventType, notification);

      return { success: true, notificationId };
    } catch (error) {
      console.error('[NotificationManager] Failed to send notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if currently in quiet hours
   * @returns {boolean}
   */
  isQuietHours() {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime < endTime) {
      // Same day (e.g., 22:00 to 08:00 doesn't cross midnight)
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Crosses midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  /**
   * Check browser notification permission
   * @returns {boolean}
   */
  checkBrowserPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    
    return Notification.permission === 'granted';
  }

  /**
   * Request browser notification permission
   * @returns {Promise<boolean>}
   */
  async requestBrowserPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }

  /**
   * Send in-app notification
   * @param {object} notification 
   * @returns {Promise<{success: boolean}>}
   */
  async sendInAppNotification(notification) {
    try {
      // Store in localStorage for in-app display
      const inAppNotifications = JSON.parse(localStorage.getItem('cafeos_inapp_notifications') || '[]');
      inAppNotifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (inAppNotifications.length > 100) {
        inAppNotifications.splice(100);
      }
      
      localStorage.setItem('cafeos_inapp_notifications', JSON.stringify(inAppNotifications));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send browser notification
   * @param {object} notification 
   * @returns {Promise<{success: boolean}>}
   */
  async sendBrowserNotification(notification) {
    try {
      if (!this.checkBrowserPermission()) {
        return { success: false, error: 'Permission not granted' };
      }

      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        tag: notification.eventType,
        requireInteraction: false
      });

      browserNotification.onclick = () => {
        if (typeof window !== 'undefined') {
          window.focus();
        }
        browserNotification.close();
      };

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Queue email notification
   * @param {object} notification 
   * @returns {Promise<{success: boolean}>}
   */
  async queueEmailNotification(notification) {
    try {
      const emailQueue = JSON.parse(localStorage.getItem('cafeos_email_queue') || '[]');
      emailQueue.push({
        ...notification,
        queuedAt: new Date().toISOString()
      });
      
      localStorage.setItem('cafeos_email_queue', JSON.stringify(emailQueue));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Store notification
   * @param {object} notification 
   */
  async storeNotification(notification) {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      notifications.unshift(notification);
      
      // Keep only last 1000 notifications
      if (notifications.length > 1000) {
        notifications.splice(1000);
      }
      
      localStorage.setItem('cafeos_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('[NotificationManager] Failed to store notification:', error);
    }
  }

  /**
   * Get notifications
   * @param {object} options 
   * @returns {Array}
   */
  getNotifications(options = {}) {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      
      let filtered = notifications;
      
      if (options.eventType) {
        filtered = filtered.filter(n => n.eventType === options.eventType);
      }
      
      if (options.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get in-app notifications
   * @param {object} options 
   * @returns {Array}
   */
  getInAppNotifications(options = {}) {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_inapp_notifications') || '[]');
      
      let filtered = notifications;
      
      if (options.unreadOnly) {
        filtered = filtered.filter(n => !n.read);
      }
      
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId 
   */
  async markAsRead(notificationId) {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      const notification = notifications.find(n => n.notificationId === notificationId);
      
      if (notification) {
        notification.read = true;
        notification.readAt = new Date().toISOString();
        localStorage.setItem('cafeos_notifications', JSON.stringify(notifications));
      }

      // Also mark in-app notifications
      const inAppNotifications = JSON.parse(localStorage.getItem('cafeos_inapp_notifications') || '[]');
      const inAppNotification = inAppNotifications.find(n => n.notificationId === notificationId);
      
      if (inAppNotification) {
        inAppNotification.read = true;
        inAppNotification.readAt = new Date().toISOString();
        localStorage.setItem('cafeos_inapp_notifications', JSON.stringify(inAppNotifications));
      }
    } catch (error) {
      console.error('[NotificationManager] Failed to mark as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      notifications.forEach(n => {
        n.read = true;
        n.readAt = new Date().toISOString();
      });
      localStorage.setItem('cafeos_notifications', JSON.stringify(notifications));

      const inAppNotifications = JSON.parse(localStorage.getItem('cafeos_inapp_notifications') || '[]');
      inAppNotifications.forEach(n => {
        n.read = true;
        n.readAt = new Date().toISOString();
      });
      localStorage.setItem('cafeos_inapp_notifications', JSON.stringify(inAppNotifications));
    } catch (error) {
      console.error('[NotificationManager] Failed to mark all as read:', error);
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId 
   */
  async deleteNotification(notificationId) {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      const filtered = notifications.filter(n => n.notificationId !== notificationId);
      localStorage.setItem('cafeos_notifications', JSON.stringify(filtered));

      const inAppNotifications = JSON.parse(localStorage.getItem('cafeos_inapp_notifications') || '[]');
      const filteredInApp = inAppNotifications.filter(n => n.notificationId !== notificationId);
      localStorage.setItem('cafeos_inapp_notifications', JSON.stringify(filteredInApp));
    } catch (error) {
      console.error('[NotificationManager] Failed to delete notification:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    try {
      localStorage.setItem('cafeos_notifications', '[]');
      localStorage.setItem('cafeos_inapp_notifications', '[]');
    } catch (error) {
      console.error('[NotificationManager] Failed to clear notifications:', error);
    }
  }

  /**
   * Subscribe to event type
   * @param {string} eventType 
   * @param {Function} callback 
   * @returns {Function}
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  /**
   * Notify subscribers
   * @param {string} eventType 
   * @param {object} notification 
   */
  notifySubscribers(eventType, notification) {
    const callbacks = this.subscribers.get(eventType);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('[NotificationManager] Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Get unread count
   * @returns {number}
   */
  getUnreadCount() {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      return notifications.filter(n => !n.read).length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get notification statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const notifications = JSON.parse(localStorage.getItem('cafeos_notifications') || '[]');
      const inAppNotifications = JSON.parse(localStorage.getItem('cafeos_inapp_notifications') || '[]');
      
      const stats = {
        totalNotifications: notifications.length,
        unreadCount: notifications.filter(n => !n.read).length,
        byEventType: {},
        recent: notifications.slice(-10),
        preferences: this.preferences
      };
      
      for (const notification of notifications) {
        stats.byEventType[notification.eventType] = (stats.byEventType[notification.eventType] || 0) + 1;
      }
      
      return stats;
    } catch (error) {
      return {
        totalNotifications: 0,
        unreadCount: 0,
        byEventType: {},
        recent: [],
        preferences: this.preferences
      };
    }
  }

  /**
   * Get preferences
   * @returns {object}
   */
  getPreferences() {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   * @param {object} updates 
   */
  updatePreferences(updates) {
    this.preferences = { ...this.preferences, ...updates };
    localStorage.setItem('cafeos_notification_preferences', JSON.stringify(this.preferences));
  }
}

// Singleton instance
const notificationManager = new NotificationManager();

export default notificationManager;
