// Operations Notifications System for CafeOS
// Manages notifications for task events, deadlines, and approvals

import { TASK_STATUS, TASK_PRIORITY } from "../domain/operationsModel.js";

const NOTIFICATIONS_KEY = 'cafeos_operations_notifications';
const SUBSCRIPTIONS_KEY = 'cafeos_operations_subscriptions';

/**
 * Get operations notifications
 */
export function getOperationsNotifications() {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[OperationsNotifications] Failed to load notifications:', e);
    return [];
  }
}

/**
 * Save operations notifications
 */
function saveOperationsNotifications(notifications) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (e) {
    console.error('[OperationsNotifications] Failed to save notifications:', e);
  }
}

/**
 * Add an operations notification
 */
export function addOperationsNotification(notification) {
  const notifications = getOperationsNotifications();
  const newNotification = {
    id: `OP-NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...notification,
    createdAt: new Date().toISOString(),
    read: false
  };
  notifications.unshift(newNotification);
  
  // Keep only last 500 notifications
  if (notifications.length > 500) {
    notifications.splice(500);
  }
  
  saveOperationsNotifications(notifications);
  return newNotification;
}

/**
 * Mark notification as read
 */
export function markNotificationAsRead(notificationId) {
  const notifications = getOperationsNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  
  if (index !== -1) {
    notifications[index].read = true;
    saveOperationsNotifications(notifications);
    return notifications[index];
  }
  
  return null;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead() {
  const notifications = getOperationsNotifications();
  notifications.forEach(n => n.read = true);
  saveOperationsNotifications(notifications);
  return notifications;
}

/**
 * Get unread notifications
 */
export function getUnreadNotifications() {
  return getOperationsNotifications().filter(n => !n.read);
}

/**
 * Get notification subscriptions
 */
export function getNotificationSubscriptions() {
  try {
    const stored = localStorage.getItem(SUBSCRIPTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[OperationsNotifications] Failed to load subscriptions:', e);
    return [];
  }
}

/**
 * Save notification subscriptions
 */
function saveNotificationSubscriptions(subscriptions) {
  try {
    localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('[OperationsNotifications] Failed to save subscriptions:', e);
  }
}

/**
 * Create a notification subscription
 */
export function createNotificationSubscription(data) {
  const subscriptions = getNotificationSubscriptions();
  const subscription = {
    id: `OP-SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    eventType: data.eventType,
    category: data.category,
    priority: data.priority,
    enabled: data.enabled !== false,
    userId: data.userId,
    createdAt: new Date().toISOString()
  };
  subscriptions.push(subscription);
  saveNotificationSubscriptions(subscriptions);
  return subscription;
}

/**
 * Notify task completed
 */
export function notifyTaskCompleted(task, userId) {
  return addOperationsNotification({
    type: 'TASK_COMPLETED',
    title: 'Task Completed',
    message: `"${task.title}" has been completed by ${userId}`,
    taskId: task.id,
    category: task.category,
    priority: task.priority,
    requiresApproval: task.requiresApproval
  });
}

/**
 * Notify task overdue
 */
export function notifyTaskOverdue(task) {
  return addOperationsNotification({
    type: 'TASK_OVERDUE',
    title: 'Task Overdue',
    message: `"${task.title}" is overdue`,
    taskId: task.id,
    category: task.category,
    priority: task.priority
  });
}

/**
 * Notify task awaiting approval
 */
export function notifyTaskAwaitingApproval(task) {
  return addOperationsNotification({
    type: 'TASK_AWAITING_APPROVAL',
    title: 'Task Awaiting Approval',
    message: `"${task.title}" requires manager approval`,
    taskId: task.id,
    category: task.category,
    priority: task.priority
  });
}

/**
 * Notify task approved
 */
export function notifyTaskApproved(task, approverId) {
  return addOperationsNotification({
    type: 'TASK_APPROVED',
    title: 'Task Approved',
    message: `"${task.title}" has been approved by ${approverId}`,
    taskId: task.id,
    category: task.category,
    priority: task.priority
  });
}

/**
 * Notify task rejected
 */
export function notifyTaskRejected(task, approverId, reason) {
  return addOperationsNotification({
    type: 'TASK_REJECTED',
    title: 'Task Rejected',
    message: `"${task.title}" was rejected by ${approverId}. Reason: ${reason}`,
    taskId: task.id,
    category: task.category,
    priority: task.priority
  });
}

/**
 * Notify opening incomplete
 */
export function notifyOpeningIncomplete(progress) {
  return addOperationsNotification({
    type: 'OPENING_INCOMPLETE',
    title: 'Opening Checklist Incomplete',
    message: `Opening progress is at ${progress}%`,
    category: 'OPENING',
    priority: progress < 50 ? TASK_PRIORITY.CRITICAL : TASK_PRIORITY.HIGH
  });
}

/**
 * Notify closing incomplete
 */
export function notifyClosingIncomplete(progress) {
  return addOperationsNotification({
    type: 'CLOSING_INCOMPLETE',
    title: 'Closing Checklist Incomplete',
    message: `Closing progress is at ${progress}%`,
    category: 'CLOSING',
    priority: progress < 50 ? TASK_PRIORITY.CRITICAL : TASK_PRIORITY.HIGH
  });
}

/**
 * Check and notify overdue tasks
 */
export function checkAndNotifyOverdueTasks(tasks) {
  const now = new Date();
  const overdueTasks = tasks.filter(t => {
    if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.APPROVED) return false;
    if (!t.dueTime) return false;
    const dueTime = new Date(t.dueTime);
    return dueTime < now;
  });

  overdueTasks.forEach(task => {
    notifyTaskOverdue(task);
  });

  return overdueTasks.length;
}

/**
 * Get notification summary
 */
export function getNotificationSummary() {
  const notifications = getOperationsNotifications();
  const unread = getUnreadNotifications();
  
  return {
    total: notifications.length,
    unread: unread.length,
    byType: {
      TASK_COMPLETED: notifications.filter(n => n.type === 'TASK_COMPLETED').length,
      TASK_OVERDUE: notifications.filter(n => n.type === 'TASK_OVERDUE').length,
      TASK_AWAITING_APPROVAL: notifications.filter(n => n.type === 'TASK_AWAITING_APPROVAL').length,
      TASK_APPROVED: notifications.filter(n => n.type === 'TASK_APPROVED').length,
      TASK_REJECTED: notifications.filter(n => n.type === 'TASK_REJECTED').length,
      OPENING_INCOMPLETE: notifications.filter(n => n.type === 'OPENING_INCOMPLETE').length,
      CLOSING_INCOMPLETE: notifications.filter(n => n.type === 'CLOSING_INCOMPLETE').length
    }
  };
}

/**
 * Clear old notifications (older than 30 days)
 */
export function clearOldNotifications() {
  const notifications = getOperationsNotifications();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const filtered = notifications.filter(n => new Date(n.createdAt) >= thirtyDaysAgo);
  saveOperationsNotifications(filtered);
  
  return notifications.length - filtered.length;
}

/**
 * Create default notification subscriptions
 */
export function createDefaultSubscriptions(userId) {
  const defaultSubscriptions = [
    { eventType: 'TASK_OVERDUE', category: null, priority: TASK_PRIORITY.HIGH, userId },
    { eventType: 'TASK_AWAITING_APPROVAL', category: null, priority: TASK_PRIORITY.CRITICAL, userId },
    { eventType: 'OPENING_INCOMPLETE', category: 'OPENING', priority: TASK_PRIORITY.HIGH, userId },
    { eventType: 'CLOSING_INCOMPLETE', category: 'CLOSING', priority: TASK_PRIORITY.HIGH, userId }
  ];

  defaultSubscriptions.forEach(sub => createNotificationSubscription(sub));
  return defaultSubscriptions;
}

export default {
  getOperationsNotifications,
  addOperationsNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotifications,
  getNotificationSubscriptions,
  createNotificationSubscription,
  notifyTaskCompleted,
  notifyTaskOverdue,
  notifyTaskAwaitingApproval,
  notifyTaskApproved,
  notifyTaskRejected,
  notifyOpeningIncomplete,
  notifyClosingIncomplete,
  checkAndNotifyOverdueTasks,
  getNotificationSummary,
  clearOldNotifications,
  createDefaultSubscriptions
};
