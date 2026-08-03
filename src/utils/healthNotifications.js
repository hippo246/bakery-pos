// Health Notifications System for CafeOS
// Manages notification subscriptions for health alerts

import {
  _createHealthAlert,
  HEALTH_STATUS,
  HEALTH_CATEGORIES,
  _ALERT_TYPES
} from "../domain/healthModel.js";

const NOTIFICATIONS_KEY = 'cafeos_health_notifications';
const SUBSCRIPTIONS_KEY = 'cafeos_health_subscriptions';

/**
 * Get health notifications
 */
export function getHealthNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[HealthNotifications] Failed to load notifications:', e);
    return [];
  }
}

/**
 * Save health notifications
 */
function saveHealthNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('[HealthNotifications] Failed to save notifications:', e);
  }
}

/**
 * Add a health notification
 */
export function addHealthNotification(alert) {
  const notifications = getHealthNotifications();
  const notification = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    alertId: alert.id,
    type: alert.type,
    category: alert.category,
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    impact: alert.impact,
    suggestedAction: alert.suggestedAction,
    actionTarget: alert.actionTarget,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifications.unshift(notification);
  
  // Keep only last 500 notifications
  if (notifications.length > 500) {
    notifications.splice(500);
  }
  
  saveHealthNotifications(notifications);
  return notification;
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId) {
  const notifications = getHealthNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    notifications[index].read = true;
    saveHealthNotifications(notifications);
    return notifications[index];
  }
  
  return null;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  const notifications = getHealthNotifications();
  notifications.forEach(n => n.read = true);
  saveHealthNotifications(notifications);
  return notifications;
}

/**
 * Get unread notifications
 */
export function getUnreadNotifications() {
  return getHealthNotifications().filter(n => !n.read);
}

/**
 * Get critical notifications
 */
export function getCriticalNotifications() {
  return getHealthNotifications().filter(n => n.severity === HEALTH_STATUS.CRITICAL && !n.read);
}

/**
 * Get notification subscriptions
 */
export function getHealthSubscriptions() {
  try {
    const stored = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[HealthNotifications] Failed to load subscriptions:', e);
    return [];
  }
}

/**
 * Save health subscriptions
 */
function saveHealthSubscriptions(subscriptions) {
  try {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('[HealthNotifications] Failed to save subscriptions:', e);
  }
}

/**
 * Create a health subscription
 */
export function createHealthSubscription(data) {
  const subscriptions = getHealthSubscriptions();
  const subscription = {
    id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: data.category,
    severity: data.severity,
    enabled: data.enabled !== false,
    channels: data.channels || ['IN_APP'],
    createdAt: new Date().toISOString()
  };
  subscriptions.push(subscription);
  saveHealthSubscriptions(subscriptions);
  return subscription;
}

/**
 * Update a health subscription
 */
export function updateHealthSubscription(subscriptionId, updates) {
  const subscriptions = getHealthSubscriptions();
  const index = subscriptions.findIndex(s => s.id === subscriptionId);
  
  if (index !== -1) {
    subscriptions[index] = { ...subscriptions[index], ...updates };
    saveHealthSubscriptions(subscriptions);
    return subscriptions[index];
  }
  
  return null;
}

/**
 * Delete a health subscription
 */
export function deleteHealthSubscription(subscriptionId) {
  const subscriptions = getHealthSubscriptions();
  const filtered = subscriptions.filter(s => s.id !== subscriptionId);
  saveHealthSubscriptions(filtered);
  return filtered;
}

/**
 * Check if alert should trigger notification based on subscriptions
 */
export function shouldNotifyForAlert(alert) {
  const subscriptions = getHealthSubscriptions();
  
  return subscriptions.some(sub => {
    if (!sub.enabled) return false;
    
    if (sub.category && sub.category !== alert.category) return false;
    if (sub.severity && sub.severity !== alert.severity) return false;
    
    return true;
  });
}

/**
 * Create default health subscriptions
 */
export function createDefaultHealthSubscriptions() {
  const defaultSubscriptions = [
    {
      category: null,
      severity: HEALTH_STATUS.CRITICAL,
      enabled: true,
      channels: ['IN_APP']
    },
    {
      category: HEALTH_CATEGORIES.STORAGE,
      severity: HEALTH_STATUS.WARNING,
      enabled: true,
      channels: ['IN_APP']
    },
    {
      category: HEALTH_CATEGORIES.DATABASE,
      severity: HEALTH_STATUS.WARNING,
      enabled: true,
      channels: ['IN_APP']
    },
    {
      category: HEALTH_CATEGORIES.BACKUP,
      severity: HEALTH_STATUS.CRITICAL,
      enabled: true,
      channels: ['IN_APP']
    },
    {
      category: HEALTH_CATEGORIES.DEVICE,
      severity: HEALTH_STATUS.WARNING,
      enabled: true,
      channels: ['IN_APP']
    }
  ];

  defaultSubscriptions.forEach(sub => createHealthSubscription(sub));
  return defaultSubscriptions;
}

/**
 * Process health alerts and create notifications
 */
export function processHealthAlerts(alerts) {
  const notifications = [];
  
  alerts.forEach(alert => {
    if (shouldNotifyForAlert(alert)) {
      const notification = addHealthNotification(alert);
      notifications.push(notification);
    }
  });
  
  return notifications;
}

/**
 * Get notification summary
 */
export function getNotificationSummary() {
  const notifications = getHealthNotifications();
  const unread = getUnreadNotifications();
  const critical = getCriticalNotifications();
  
  return {
    total: notifications.length,
    unread: unread.length,
    critical: critical.length,
    byCategory: {
      [HEALTH_CATEGORIES.STORAGE]: notifications.filter(n => n.category === HEALTH_CATEGORIES.STORAGE).length,
      [HEALTH_CATEGORIES.DATABASE]: notifications.filter(n => n.category === HEALTH_CATEGORIES.DATABASE).length,
      [HEALTH_CATEGORIES.DEVICE]: notifications.filter(n => n.category === HEALTH_CATEGORIES.DEVICE).length,
      [HEALTH_CATEGORIES.PERFORMANCE]: notifications.filter(n => n.category === HEALTH_CATEGORIES.PERFORMANCE).length,
      [HEALTH_CATEGORIES.BACKUP]: notifications.filter(n => n.category === HEALTH_CATEGORIES.BACKUP).length
    }
  };
}

/**
 * Clear old notifications (older than 30 days)
 */
export function clearOldNotifications() {
  const notifications = getHealthNotifications();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const filtered = notifications.filter(n => new Date(n.createdAt) >= thirtyDaysAgo);
  saveHealthNotifications(filtered);
  
  return notifications.length - filtered.length;
}

export default {
  getHealthNotifications,
  addHealthNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  getCriticalNotifications,
  getHealthSubscriptions,
  createHealthSubscription,
  updateHealthSubscription,
  deleteHealthSubscription,
  shouldNotifyForAlert,
  createDefaultHealthSubscriptions,
  processHealthAlerts,
  getNotificationSummary,
  clearOldNotifications
};
