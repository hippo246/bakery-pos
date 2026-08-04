// Enterprise Notifications
// Priority levels: Info, Success, Warning, Critical, Emergency. Support Acknowledge, Assign, Resolve, Escalate, Mute, History

import { now } from '../domain/dates.js';

const NOTIFICATIONS_KEY = 'cafeos_notifications';

/**
 * Notification Priority
 */
export const NOTIFICATION_PRIORITY = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  EMERGENCY: 'EMERGENCY'
};

/**
 * Notification Status
 */
export const NOTIFICATION_STATUS = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  ASSIGNED: 'ASSIGNED',
  RESOLVED: 'RESOLVED',
  ESCALATED: 'ESCALATED',
  MUTED: 'MUTED',
  DISMISSED: 'DISMISSED'
};

/**
 * Notification Categories
 */
export const NOTIFICATION_CATEGORIES = {
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  KITCHEN: 'KITCHEN',
  STAFF: 'STAFF',
  TERMINAL: 'TERMINAL',
  INVENTORY: 'INVENTORY',
  INCIDENT: 'INCIDENT',
  APPROVAL: 'APPROVAL',
  SHIFT: 'SHIFT',
  SYSTEM: 'SYSTEM',
  GENERAL: 'GENERAL'
};

/**
 * Enterprise Notifications class
 * Priority levels: Info, Success, Warning, Critical, Emergency. Support Acknowledge, Assign, Resolve, Escalate, Mute, History
 */
export class EnterpriseNotifications {
  constructor() {
    this.notifications = new Map();
    this.subscribers = new Map();
    this.loadNotifications();
    this.startCleanup();
  }

  /**
   * Load notifications from localStorage
   */
  loadNotifications() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        notifications.forEach(notification => {
          this.notifications.set(notification.id, notification);
        });
      }
    } catch (error) {
      console.error('[EnterpriseNotifications] Failed to load notifications:', error);
    }
  }

  /**
   * Save notifications to localStorage
   */
  saveNotifications() {
    try {
      const notifications = Array.from(this.notifications.values());
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('[EnterpriseNotifications] Failed to save notifications:', error);
    }
  }

  /**
   * Start cleanup of old notifications
   */
  startCleanup() {
    // Clean up notifications older than 90 days every hour
    setInterval(() => {
      this.cleanupOldNotifications(90 * 24 * 60 * 60 * 1000);
    }, 60 * 60 * 1000);
  }

  /**
   * Create a notification
   * @param {Object} notificationData - Notification data
   * @returns {Object} Created notification
   */
  createNotification(notificationData) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Content
      title: notificationData.title || 'Untitled Notification',
      message: notificationData.message || '',
      category: notificationData.category || NOTIFICATION_CATEGORIES.GENERAL,
      
      // Priority & Status
      priority: notificationData.priority || NOTIFICATION_PRIORITY.INFO,
      status: NOTIFICATION_STATUS.UNREAD,
      
      // Targeting
      userId: notificationData.userId || null,
      branchId: notificationData.branchId || null,
      terminalId: notificationData.terminalId || null,
      staffId: notificationData.staffId || null,
      role: notificationData.role || null,
      
      // References
      orderId: notificationData.orderId || null,
      paymentId: notificationData.paymentId || null,
      incidentId: notificationData.incidentId || null,
      shiftId: notificationData.shiftId || null,
      
      // Assignment
      assignedTo: notificationData.assignedTo || null,
      assignedBy: null,
      assignedAt: null,
      
      // Acknowledgment
      acknowledgedBy: null,
      acknowledgedAt: null,
      
      // Resolution
      resolvedBy: null,
      resolvedAt: null,
      resolution: '',
      
      // Escalation
      escalated: false,
      escalatedTo: null,
      escalatedAt: null,
      escalationReason: '',
      
      // Muting
      muted: false,
      mutedUntil: null,
      
      // Actions
      actions: notificationData.actions || [],
      
      // Metadata
      metadata: notificationData.metadata || {},
      
      // Timestamps
      createdAt: now(),
      expiresAt: notificationData.expiresAt || null
    };

    this.notifications.set(notification.id, notification);
    this.saveNotifications();

    // Notify subscribers
    this.notifySubscribers('notification_created', notification);

    return notification;
  }

  /**
   * Get notification by ID
   * @param {string} notificationId - Notification ID
   * @returns {Object|null} Notification or null
   */
  getNotification(notificationId) {
    return this.notifications.get(notificationId) || null;
  }

  /**
   * Get all notifications
   * @returns {Array} Array of notifications
   */
  getAllNotifications() {
    return Array.from(this.notifications.values());
  }

  /**
   * Get notifications by user
   * @param {string} userId - User ID
   * @returns {Array} Array of notifications
   */
  getNotificationsByUser(userId) {
    return this.getAllNotifications().filter(n => n.userId === userId);
  }

  /**
   * Get notifications by status
   * @param {string} status - Notification status
   * @returns {Array} Array of notifications
   */
  getNotificationsByStatus(status) {
    return this.getAllNotifications().filter(n => n.status === status);
  }

  /**
   * Get notifications by priority
   * @param {string} priority - Notification priority
   * @returns {Array} Array of notifications
   */
  getNotificationsByPriority(priority) {
    return this.getAllNotifications().filter(n => n.priority === priority);
  }

  /**
   * Get notifications by category
   * @param {string} category - Notification category
   * @returns {Array} Array of notifications
   */
  getNotificationsByCategory(category) {
    return this.getAllNotifications().filter(n => n.category === category);
  }

  /**
   * Get unread notifications
   * @param {string} userId - User ID
   * @returns {Array} Array of unread notifications
   */
  getUnreadNotifications(userId = null) {
    const currentTime = now();
    let notifications = this.getAllNotifications().filter(n => 
      n.status === NOTIFICATION_STATUS.UNREAD &&
      (!n.expiresAt || currentTime < n.expiresAt)
    );

    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    return notifications;
  }

  /**
   * Get active notifications
   * @param {string} userId - User ID
   * @returns {Array} Array of active notifications
   */
  getActiveNotifications(userId = null) {
    const currentTime = now();
    let notifications = this.getAllNotifications().filter(n => 
      !n.muted &&
      (!n.expiresAt || currentTime < n.expiresAt) &&
      n.status !== NOTIFICATION_STATUS.RESOLVED &&
      n.status !== NOTIFICATION_STATUS.DISMISSED
    );

    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    return notifications;
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Object} Result
   */
  markAsRead(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.status = NOTIFICATION_STATUS.READ;
    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    this.notifySubscribers('notification_read', notification);

    return { success: true, notification };
  }

  /**
   * Mark notification as unread
   * @param {string} notificationId - Notification ID
   * @returns {Object} Result
   */
  markAsUnread(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.status = NOTIFICATION_STATUS.UNREAD;
    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    return { success: true, notification };
  }

  /**
   * Acknowledge notification
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Object} Result
   */
  acknowledgeNotification(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.status = NOTIFICATION_STATUS.ACKNOWLEDGED;
    notification.acknowledgedBy = userId;
    notification.acknowledgedAt = now();

    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    this.notifySubscribers('notification_acknowledged', notification);

    return { success: true, notification };
  }

  /**
   * Assign notification
   * @param {string} notificationId - Notification ID
   * @param {string} assigneeId - Assignee ID
   * @param {string} assignedBy - Who assigned it
   * @returns {Object} Result
   */
  assignNotification(notificationId, assigneeId, assignedBy) {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.assignedTo = assigneeId;
    notification.assignedBy = assignedBy;
    notification.assignedAt = now();
    notification.status = NOTIFICATION_STATUS.ASSIGNED;

    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    this.notifySubscribers('notification_assigned', notification);

    return { success: true, notification };
  }

  /**
   * Resolve notification
   * @param {string} notificationId - Notification ID
   * @param {string} resolvedBy - Who resolved it
   * @param {string} resolution - Resolution description
   * @returns {Object} Result
   */
  resolveNotification(notificationId, resolvedBy, resolution = '') {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.status = NOTIFICATION_STATUS.RESOLVED;
    notification.resolvedBy = resolvedBy;
    notification.resolvedAt = now();
    notification.resolution = resolution;

    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    this.notifySubscribers('notification_resolved', notification);

    return { success: true, notification };
  }

  /**
   * Escalate notification
   * @param {string} notificationId - Notification ID
   * @param {string} escalatedTo - Who to escalate to
   * @param {string} escalationReason - Reason for escalation
   * @returns {Object} Result
   */
  escalateNotification(notificationId, escalatedTo, escalationReason = '') {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.escalated = true;
    notification.escalatedTo = escalatedTo;
    notification.escalatedAt = now();
    notification.escalationReason = escalationReason;
    notification.status = NOTIFICATION_STATUS.ESCALATED;

    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    this.notifySubscribers('notification_escalated', notification);

    return { success: true, notification };
  }

  /**
   * Mute notification
   * @param {string} notificationId - Notification ID
   * @param {number} duration - Duration in milliseconds
   * @returns {Object} Result
   */
  muteNotification(notificationId, duration = 3600000) {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.muted = true;
    notification.mutedUntil = now() + duration;

    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    return { success: true, notification };
  }

  /**
   * Unmute notification
   * @param {string} notificationId - Notification ID
   * @returns {Object} Result
   */
  unmuteNotification(notificationId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) {
      return { success: false, reason: 'Notification not found' };
    }

    notification.muted = false;
    notification.mutedUntil = null;

    this.notifications.set(notificationId, notification);
    this.saveNotifications();

    return { success: true, notification };
  }

  /**
   * Dismiss notification
   * @param {string} notificationId - Notification ID
   * @returns {Object} Result
   */
  dismissNotification(notificationId) {
    resolveNotification(notificationId, null, 'Dismissed');
    
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = NOTIFICATION_STATUS.DISMISSED;
      this.notifications.set(notificationId, notification);
      this.saveNotifications();
    }

    return { success: true, notification };
  }

  /**
   * Update notification
   * @param {string} notificationId - Notification ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated notification or null
   */
  updateNotification(notificationId, updates) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return null;

    const updated = {
      ...notification,
      ...updates,
      updatedAt: now()
    };

    this.notifications.set(notificationId, updated);
    this.saveNotifications();

    return updated;
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteNotification(notificationId) {
    const deleted = this.notifications.delete(notificationId);
    if (deleted) {
      this.saveNotifications();
      this.notifySubscribers('notification_deleted', { notificationId });
    }
    return deleted;
  }

  /**
   * Mark all as read for user
   * @param {string} userId - User ID
   * @returns {number} Number of notifications marked as read
   */
  markAllAsRead(userId) {
    let count = 0;

    for (const [id, notification] of this.notifications) {
      if (notification.userId === userId && notification.status === NOTIFICATION_STATUS.UNREAD) {
        notification.status = NOTIFICATION_STATUS.READ;
        this.notifications.set(id, notification);
        count++;
      }
    }

    if (count > 0) {
      this.saveNotifications();
    }

    return count;
  }

  /**
   * Get notification history
   * @param {string} userId - User ID
   * @param {Object} options - Options
   * @returns {Array} Array of notifications
   */
  getNotificationHistory(userId, options = {}) {
    let notifications = this.getNotificationsByUser(userId);

    if (options.startTime) {
      notifications = notifications.filter(n => n.createdAt >= options.startTime);
    }
    if (options.endTime) {
      notifications = notifications.filter(n => n.createdAt <= options.endTime);
    }
    if (options.priority) {
      notifications = notifications.filter(n => n.priority === options.priority);
    }
    if (options.category) {
      notifications = notifications.filter(n => n.category === options.category);
    }

    // Sort by creation time descending
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Apply limit
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * Subscribe to notifications
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
   * Unsubscribe from notifications
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
          console.error('[EnterpriseNotifications] Subscriber callback error:', error);
        }
      });
    }, 0);
  }

  /**
   * Get statistics
   * @param {string} userId - User ID
   * @returns {Object} Statistics
   */
  getStatistics(userId = null) {
    let notifications = this.getAllNotifications();

    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    return {
      total: notifications.length,
      unread: notifications.filter(n => n.status === NOTIFICATION_STATUS.UNREAD).length,
      read: notifications.filter(n => n.status === NOTIFICATION_STATUS.READ).length,
      acknowledged: notifications.filter(n => n.status === NOTIFICATION_STATUS.ACKNOWLEDGED).length,
      resolved: notifications.filter(n => n.status === NOTIFICATION_STATUS.RESOLVED).length,
      escalated: notifications.filter(n => n.escalated).length,
      byPriority: notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {}),
      byCategory: notifications.reduce((acc, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Cleanup old notifications
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of notifications cleaned up
   */
  cleanupOldNotifications(olderThan = 90 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleaned = 0;

    for (const [id, notification] of this.notifications) {
      if ((notification.status === NOTIFICATION_STATUS.RESOLVED ||
           notification.status === NOTIFICATION_STATUS.DISMISSED) &&
          notification.createdAt && notification.createdAt < cutoff) {
        this.notifications.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveNotifications();
    }

    return cleaned;
  }

  /**
   * Export notifications
   * @param {Object} options - Export options
   * @returns {Object} Exported notifications
   */
  exportNotifications(options = {}) {
    const { userId, startTime, endTime } = options;
    
    let notifications = this.getAllNotifications();
    
    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }
    if (startTime) {
      notifications = notifications.filter(n => n.createdAt >= startTime);
    }
    if (endTime) {
      notifications = notifications.filter(n => n.createdAt <= endTime);
    }

    return {
      notifications,
      exportedAt: now(),
      totalNotifications: notifications.length
    };
  }

  /**
   * Import notifications
   * @param {Object} data - Imported notifications data
   * @returns {Object} Import result
   */
  importNotifications(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.notifications)) {
        data.notifications.forEach(notification => {
          this.notifications.set(notification.id, notification);
        });
      }

      this.saveNotifications();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let enterpriseNotificationsInstance = null;

/**
 * Get the enterprise notifications singleton
 * @returns {EnterpriseNotifications} Enterprise notifications instance
 */
export function getEnterpriseNotifications() {
  if (!enterpriseNotificationsInstance) {
    enterpriseNotificationsInstance = new EnterpriseNotifications();
  }
  return enterpriseNotificationsInstance;
}

/**
 * Reset the enterprise notifications (useful for testing)
 */
export function resetEnterpriseNotifications() {
  enterpriseNotificationsInstance = null;
}

/**
 * Convenience function to create a notification
 * @param {Object} notificationData - Notification data
 * @returns {Object} Created notification
 */
export function createNotification(notificationData = {}) {
  const notifications = getEnterpriseNotifications();
  return notifications.createNotification(notificationData);
}

/**
 * Convenience function to get unread notifications
 * @param {string} userId - User ID
 * @returns {Array} Array of unread notifications
 */
export function getUnreadNotifications(userId) {
  const notifications = getEnterpriseNotifications();
  return notifications.getUnreadNotifications(userId);
}
