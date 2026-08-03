// Intelligence Notifications System for CafeOS
// Manages notification subscriptions for intelligence insights

import {
  createNotificationSubscription,
  shouldNotify,
  INSIGHT_CATEGORIES,
  INSIGHT_PRIORITY,
  INSIGHT_TYPES
} from "../domain/intelligenceModel.js";

const STORAGE_KEY = 'cafeos_intelligence_subscriptions';

/**
 * Get all notification subscriptions
 */
export function getSubscriptions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[IntelligenceNotifications] Failed to load subscriptions:', e);
    return [];
  }
}

/**
 * Save subscriptions to localStorage
 */
function saveSubscriptions(subscriptions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error('[IntelligenceNotifications] Failed to save subscriptions:', e);
  }
}

/**
 * Create a notification subscription
 */
export function createSubscription(data) {
  const subscriptions = getSubscriptions();
  const subscription = createNotificationSubscription(data);
  subscriptions.push(subscription);
  saveSubscriptions(subscriptions);
  return subscription;
}

/**
 * Update a subscription
 */
export function updateSubscription(subscriptionId, updates) {
  const subscriptions = getSubscriptions();
  const index = subscriptions.findIndex(s => s.id === subscriptionId);
  
  if (index !== -1) {
    subscriptions[index] = { ...subscriptions[index], ...updates };
    saveSubscriptions(subscriptions);
    return subscriptions[index];
  }
  
  return null;
}

/**
 * Delete a subscription
 */
export function deleteSubscription(subscriptionId) {
  const subscriptions = getSubscriptions();
  const filtered = subscriptions.filter(s => s.id !== subscriptionId);
  saveSubscriptions(filtered);
  return filtered;
}

/**
 * Get subscriptions for a user
 */
export function getUserSubscriptions(userId) {
  const subscriptions = getSubscriptions();
  return subscriptions.filter(s => s.userId === userId);
}

/**
 * Check if an insight should trigger a notification
 */
export function checkNotification(insight, userId) {
  const subscriptions = getUserSubscriptions(userId);
  return subscriptions.some(sub => shouldNotify(sub, insight));
}

/**
 * Get matching subscriptions for an insight
 */
export function getMatchingSubscriptions(insight) {
  const subscriptions = getSubscriptions();
  return subscriptions.filter(sub => shouldNotify(sub, insight));
}

/**
 * Create default subscriptions for a new user
 */
export function createDefaultSubscriptions(userId) {
  const defaultSubscriptions = [
    // Critical priority insights for all categories
    {
      userId,
      insightCategory: null,
      insightType: null,
      priority: INSIGHT_PRIORITY.CRITICAL,
      enabled: true,
      channels: ['IN_APP']
    },
    // High priority for operational issues
    {
      userId,
      insightCategory: INSIGHT_CATEGORIES.OPERATIONAL,
      insightType: null,
      priority: INSIGHT_PRIORITY.HIGH,
      enabled: true,
      channels: ['IN_APP']
    },
    // High priority for inventory issues
    {
      userId,
      insightCategory: INSIGHT_CATEGORIES.INVENTORY,
      insightType: null,
      priority: INSIGHT_PRIORITY.HIGH,
      enabled: true,
      channels: ['IN_APP']
    },
    // High priority for revenue decline
    {
      userId,
      insightCategory: INSIGHT_CATEGORIES.REVENUE,
      insightType: INSIGHT_TYPES.REVENUE_DECLINE,
      priority: INSIGHT_PRIORITY.HIGH,
      enabled: true,
      channels: ['IN_APP']
    }
  ];

  defaultSubscriptions.forEach(sub => createSubscription(sub));
  return defaultSubscriptions;
}

/**
 * Notification channel types
 */
export const NOTIFICATION_CHANNELS = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH'
};

/**
 * Create a notification from an insight
 */
export function createNotificationFromInsight(insight, userId) {
  return {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    insightId: insight.id,
    title: insight.title,
    message: insight.description,
    category: insight.category,
    priority: insight.priority,
    type: 'INTELLIGENCE',
    data: insight,
    read: false,
    createdAt: new Date().toISOString()
  };
}

/**
 * Format notification message
 */
export function formatNotificationMessage(insight) {
  const priorityEmojis = {
    [INSIGHT_PRIORITY.CRITICAL]: '🔴',
    [INSIGHT_PRIORITY.HIGH]: '🟠',
    [INSIGHT_PRIORITY.MEDIUM]: '🟡',
    [INSIGHT_PRIORITY.LOW]: '🟢',
    [INSIGHT_PRIORITY.INFO]: '🔵'
  };

  const emoji = priorityEmojis[insight.priority] || '🔵';
  return `${emoji} ${insight.title}: ${insight.description}`;
}

/**
 * Get notification preferences summary
 */
export function getNotificationPreferencesSummary(userId) {
  const subscriptions = getUserSubscriptions(userId);
  
  const summary = {
    total: subscriptions.length,
    enabled: subscriptions.filter(s => s.enabled).length,
    byPriority: {},
    byCategory: {}
  };

  subscriptions.forEach(sub => {
    if (!summary.byPriority[sub.priority]) {
      summary.byPriority[sub.priority] = 0;
    }
    summary.byPriority[sub.priority]++;

    if (sub.insightCategory) {
      if (!summary.byCategory[sub.insightCategory]) {
        summary.byCategory[sub.insightCategory] = 0;
      }
      summary.byCategory[sub.insightCategory]++;
    }
  });

  return summary;
}

export default {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getUserSubscriptions,
  checkNotification,
  getMatchingSubscriptions,
  createDefaultSubscriptions,
  NOTIFICATION_CHANNELS,
  createNotificationFromInsight,
  formatNotificationMessage,
  getNotificationPreferencesSummary
};
