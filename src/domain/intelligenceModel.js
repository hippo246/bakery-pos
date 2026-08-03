// Operations Intelligence Domain Model for CafeOS
// AI-free, deterministic business intelligence system

/**
 * Insight categories
 */
export const INSIGHT_CATEGORIES = {
  REVENUE: 'REVENUE',
  INVENTORY: 'INVENTORY',
  KITCHEN: 'KITCHEN',
  FLOOR: 'FLOOR',
  MENU: 'MENU',
  STAFF: 'STAFF',
  RESERVATION: 'RESERVATION',
  DELIVERY: 'DELIVERY',
  PURCHASING: 'PURCHASING',
  OPERATIONAL: 'OPERATIONAL'
};

/**
 * Insight priority levels
 */
export const INSIGHT_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
};

/**
 * Insight status
 */
export const INSIGHT_STATUS = {
  ACTIVE: 'ACTIVE',
  DISMISSED: 'DISMISSED',
  COMPLETED: 'COMPLETED',
  SNOOZED: 'SNOOZED'
};

/**
 * Insight types
 */
export const INSIGHT_TYPES = {
  // Revenue insights
  REVENUE_TREND: 'REVENUE_TREND',
  REVENUE_DECLINE: 'REVENUE_DECLINE',
  PEAK_PERIOD: 'PEAK_PERIOD',
  SLOW_PERIOD: 'SLOW_PERIOD',
  AVERAGE_TICKET_CHANGE: 'AVERAGE_TICKET_CHANGE',
  
  // Inventory insights
  LOW_STOCK: 'LOW_STOCK',
  EXPIRY_SOON: 'EXPIRY_SOON',
  HIGH_WASTAGE: 'HIGH_WASTAGE',
  SLOW_MOVING: 'SLOW_MOVING',
  FAST_MOVING: 'FAST_MOVING',
  SUPPLIER_DELAY: 'SUPPLIER_DELAY',
  
  // Kitchen insights
  PREP_TIME_INCREASE: 'PREP_TIME_INCREASE',
  SLOW_STATION: 'SLOW_STATION',
  CANCELLATION_SPIKE: 'CANCELLATION_SPIKE',
  RUSH_PERIOD: 'RUSH_PERIOD',
  
  // Floor insights
  HIGH_DEMAND_TABLE: 'HIGH_DEMAND_TABLE',
  IDLE_TABLE: 'IDLE_TABLE',
  HIGH_TURNOVER: 'HIGH_TURNOVER',
  LOW_TURNOVER: 'LOW_TURNOVER',
  
  // Menu insights
  BEST_SELLER: 'BEST_SELLER',
  WORST_SELLER: 'WORST_SELLER',
  HIGH_MARGIN: 'HIGH_MARGIN',
  POOR_PERFORMANCE: 'POOR_PERFORMANCE',
  RARELY_ORDERED: 'RARELY_ORDERED',
  FREQUENTLY_MODIFIED: 'FREQUENTLY_MODIFIED',
  
  // Staff insights
  ATTENDANCE_PATTERN: 'ATTENDANCE_PATTERN',
  BUSY_PERIOD: 'BUSY_PERIOD',
  MANAGER_OVERRIDE: 'MANAGER_OVERRIDE',
  TRAINING_NEEDED: 'TRAINING_NEEDED',
  
  // Reservation insights
  NO_SHOW_HIGH: 'NO_SHOW_HIGH',
  UNASSIGNED: 'UNASSIGNED',
  PARTY_SIZE_TREND: 'PARTY_SIZE_TREND',
  WAITLIST_TREND: 'WAITLIST_TREND',
  
  // Delivery insights
  LATE_DELIVERY: 'LATE_DELIVERY',
  HIGH_CANCELLATION: 'HIGH_CANCELLATION',
  PLATFORM_PERFORMANCE: 'PLATFORM_PERFORMANCE',
  PEAK_DELIVERY: 'PEAK_DELIVERY',
  
  // Purchasing insights
  SUPPLIER_RELIABILITY: 'SUPPLIER_RELIABILITY',
  PRICE_FLUCTUATION: 'PRICE_FLUCTUATION',
  DELIVERY_DELAY: 'DELIVERY_DELAY',
  
  // Operational insights
  CASH_RECONCILIATION_PENDING: 'CASH_RECONCILIATION_PENDING',
  TEMPERATURE_LOG_MISSING: 'TEMPERATURE_LOG_MISSING',
  BATCH_EXPIRY: 'BATCH_EXPIRY',
  STAFF_ARRIVAL: 'STAFF_ARRIVAL'
};

/**
 * Action types
 */
export const ACTION_TYPES = {
  NAVIGATE: 'NAVIGATE',
  OPEN_DIALOG: 'OPEN_DIALOG',
  PRINT_REPORT: 'PRINT_REPORT',
  CREATE_RECORD: 'CREATE_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  SEND_NOTIFICATION: 'SEND_NOTIFICATION',
  EXTERNAL_LINK: 'EXTERNAL_LINK'
};

/**
 * Create an insight
 */
export function createInsight(data) {
  return {
    id: `INSIGHT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    category: data.category,
    priority: data.priority || INSIGHT_PRIORITY.MEDIUM,
    status: INSIGHT_STATUS.ACTIVE,
    title: data.title,
    description: data.description,
    value: data.value,
    comparison: data.comparison,
    trend: data.trend,
    metadata: data.metadata || {},
    actions: data.actions || [],
    createdAt: new Date().toISOString(),
    expiresAt: data.expiresAt || null,
    dismissedAt: null,
    completedAt: null,
    dismissedBy: null,
    completedBy: null
  };
}

/**
 * Normalize insight
 */
export function normalizeInsight(insight) {
  if (!insight) return null;
  
  return {
    ...insight,
    id: insight.id || `INSIGHT-${Date.now()}`,
    priority: insight.priority || INSIGHT_PRIORITY.MEDIUM,
    status: insight.status || INSIGHT_STATUS.ACTIVE,
    createdAt: insight.createdAt || new Date().toISOString(),
    metadata: insight.metadata || {},
    actions: insight.actions || []
  };
}

/**
 * Update insight status
 */
export function updateInsightStatus(insight, status, userId) {
  const updated = { ...insight, status };
  
  if (status === INSIGHT_STATUS.DISMISSED) {
    updated.dismissedAt = new Date().toISOString();
    updated.dismissedBy = userId;
  }
  
  if (status === INSIGHT_STATUS.COMPLETED) {
    updated.completedAt = new Date().toISOString();
    updated.completedBy = userId;
  }
  
  return updated;
}

/**
 * Check if insight is expired
 */
export function isInsightExpired(insight) {
  if (!insight.expiresAt) return false;
  return new Date(insight.expiresAt) < new Date();
}

/**
 * Filter insights by priority
 */
export function filterInsightsByPriority(insights, minPriority) {
  const priorityOrder = {
    [INSIGHT_PRIORITY.CRITICAL]: 4,
    [INSIGHT_PRIORITY.HIGH]: 3,
    [INSIGHT_PRIORITY.MEDIUM]: 2,
    [INSIGHT_PRIORITY.LOW]: 1,
    [INSIGHT_PRIORITY.INFO]: 0
  };
  
  const minLevel = priorityOrder[minPriority] || 0;
  
  return insights.filter(insight => {
    const level = priorityOrder[insight.priority] || 0;
    return level >= minLevel;
  });
}

/**
 * Filter insights by category
 */
export function filterInsightsByCategory(insights, category) {
  if (!category) return insights;
  return insights.filter(insight => insight.category === category);
}

/**
 * Filter active insights
 */
export function filterActiveInsights(insights) {
  return insights.filter(insight => 
    insight.status === INSIGHT_STATUS.ACTIVE && !isInsightExpired(insight)
  );
}

/**
 * Sort insights by priority
 */
export function sortInsightsByPriority(insights) {
  const priorityOrder = {
    [INSIGHT_PRIORITY.CRITICAL]: 0,
    [INSIGHT_PRIORITY.HIGH]: 1,
    [INSIGHT_PRIORITY.MEDIUM]: 2,
    [INSIGHT_PRIORITY.LOW]: 3,
    [INSIGHT_PRIORITY.INFO]: 4
  };
  
  return [...insights].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Create an action
 */
export function createAction(data) {
  return {
    id: `ACTION-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    label: data.label,
    target: data.target,
    params: data.params || {},
    icon: data.icon || null
  };
}

/**
 * Create daily brief
 */
export function createDailyBrief(data) {
  return {
    id: `BRIEF-${Date.now()}`,
    date: data.date || new Date().toISOString().split('T')[0],
    greeting: data.greeting || 'Good Morning.',
    highlights: data.highlights || [],
    priorities: data.priorities || [],
    metrics: data.metrics || {},
    generatedAt: new Date().toISOString()
  };
}

/**
 * Create intelligence timeline entry
 */
export function createTimelineEntry(data) {
  return {
    id: `TIMELINE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    title: data.title,
    description: data.description,
    timestamp: data.timestamp || new Date().toISOString(),
    insightId: data.insightId || null,
    actionTaken: data.actionTaken || null,
    metadata: data.metadata || {}
  };
}

/**
 * Intelligence notification subscription
 */
export function createNotificationSubscription(data) {
  return {
    id: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: data.userId,
    insightType: data.insightType,
    insightCategory: data.insightCategory,
    priority: data.priority || INSIGHT_PRIORITY.HIGH,
    enabled: data.enabled !== false,
    channels: data.channels || ['IN_APP'],
    createdAt: new Date().toISOString()
  };
}

/**
 * Check if user should be notified
 */
export function shouldNotify(subscription, insight) {
  if (!subscription || !subscription.enabled) return false;
  
  // Check insight type match
  if (subscription.insightType && subscription.insightType !== insight.type) {
    return false;
  }
  
  // Check category match
  if (subscription.insightCategory && subscription.insightCategory !== insight.category) {
    return false;
  }
  
  // Check priority
  const priorityOrder = {
    [INSIGHT_PRIORITY.CRITICAL]: 4,
    [INSIGHT_PRIORITY.HIGH]: 3,
    [INSIGHT_PRIORITY.MEDIUM]: 2,
    [INSIGHT_PRIORITY.LOW]: 1,
    [INSIGHT_PRIORITY.INFO]: 0
  };
  
  const insightLevel = priorityOrder[insight.priority] || 0;
  const subLevel = priorityOrder[subscription.priority] || 0;
  
  return insightLevel >= subLevel;
}

export default {
  INSIGHT_CATEGORIES,
  INSIGHT_PRIORITY,
  INSIGHT_STATUS,
  INSIGHT_TYPES,
  ACTION_TYPES,
  createInsight,
  normalizeInsight,
  updateInsightStatus,
  isInsightExpired,
  filterInsightsByPriority,
  filterInsightsByCategory,
  filterActiveInsights,
  sortInsightsByPriority,
  createAction,
  createDailyBrief,
  createTimelineEntry,
  createNotificationSubscription,
  shouldNotify
};
