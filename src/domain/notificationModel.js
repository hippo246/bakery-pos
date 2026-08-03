// Notification Domain Model
// Core notification logic for CafeOS Operational Inbox

const genId = () => "NOTIF-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const safeNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeBool = (v) => Boolean(v);

// Notification Categories
export const NOTIFICATION_CATEGORIES = {
  ORDERS: 'ORDERS',
  KITCHEN: 'KITCHEN',
  TABLES: 'TABLES',
  RESERVATIONS: 'RESERVATIONS',
  DELIVERY: 'DELIVERY',
  QR_ORDERING: 'QR_ORDERING',
  STOCK: 'STOCK',
  PURCHASING: 'PURCHASING',
  PRODUCTION: 'PRODUCTION',
  EXPENSES: 'EXPENSES',
  PAYMENTS: 'PAYMENTS',
  DOCUMENTS: 'DOCUMENTS',
  STAFF: 'STAFF',
  SECURITY: 'SECURITY',
  SYSTEM: 'SYSTEM'
};

// Priority Levels
export const NOTIFICATION_PRIORITY = {
  URGENT: 'URGENT',
  IMPORTANT: 'IMPORTANT',
  NORMAL: 'NORMAL',
  INFORMATIONAL: 'INFORMATIONAL'
};

// Notification Status
export const NOTIFICATION_STATUS = {
  NEW: 'NEW',
  READ: 'READ',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED'
};

// Notification Types by Category
export const NOTIFICATION_TYPES = {
  ORDERS: {
    NEW_ORDER: 'NEW_ORDER',
    ORDER_AWAITING_APPROVAL: 'ORDER_AWAITING_APPROVAL',
    ORDER_DELAYED: 'ORDER_DELAYED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    REFUND_REQUESTED: 'REFUND_REQUESTED',
    ITEM_UNAVAILABLE: 'ITEM_UNAVAILABLE',
    ORDER_READY: 'ORDER_READY',
    ORDER_NOT_COLLECTED: 'ORDER_NOT_COLLECTED'
  },
  KITCHEN: {
    NEW_TICKET: 'NEW_TICKET',
    TICKET_UNACCEPTED: 'TICKET_UNACCEPTED',
    PREPARATION_DELAY: 'PREPARATION_DELAY',
    ITEM_UNAVAILABLE: 'ITEM_UNAVAILABLE',
    RECALL_REQUESTED: 'RECALL_REQUESTED',
    ALLERGY_WARNING: 'ALLERGY_WARNING',
    TICKET_READY_NOT_SERVED: 'TICKET_READY_NOT_SERVED'
  },
  TABLES: {
    WAITER_CALL: 'WAITER_CALL',
    BILL_REQUESTED: 'BILL_REQUESTED',
    TABLE_NEEDS_CLEARING: 'TABLE_NEEDS_CLEARING',
    GUEST_SESSION_WAITING: 'GUEST_SESSION_WAITING',
    ORDER_ASSISTANCE: 'ORDER_ASSISTANCE'
  },
  RESERVATIONS: {
    RESERVATION_ARRIVING_SOON: 'RESERVATION_ARRIVING_SOON',
    GUEST_CHECKED_IN: 'GUEST_CHECKED_IN',
    GUEST_LATE: 'GUEST_LATE',
    WAITLIST_READY: 'WAITLIST_READY',
    TABLE_UNAVAILABLE: 'TABLE_UNAVAILABLE',
    RESERVATION_CONFLICT: 'RESERVATION_CONFLICT',
    NO_SHOW: 'NO_SHOW'
  },
  DELIVERY: {
    DELIVERY_UNASSIGNED: 'DELIVERY_UNASSIGNED',
    DRIVER_UNAVAILABLE: 'DRIVER_UNAVAILABLE',
    ROUTE_STARTED: 'ROUTE_STARTED',
    GPS_STALE: 'GPS_STALE',
    INVALID_LOCATION: 'INVALID_LOCATION',
    DELIVERY_DELAYED: 'DELIVERY_DELAYED',
    CUSTOMER_UNAVAILABLE: 'CUSTOMER_UNAVAILABLE',
    DELIVERY_FAILED: 'DELIVERY_FAILED',
    COD_MISMATCH: 'COD_MISMATCH',
    DELIVERY_COMPLETED: 'DELIVERY_COMPLETED'
  },
  STOCK: {
    LOW_STOCK: 'LOW_STOCK',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    BELOW_REORDER_LEVEL: 'BELOW_REORDER_LEVEL',
    EXPIRY_APPROACHING: 'EXPIRY_APPROACHING',
    EXPIRED: 'EXPIRED'
  },
  PURCHASING: {
    PO_OVERDUE: 'PO_OVERDUE',
    SUPPLIER_DELIVERY_EXPECTED: 'SUPPLIER_DELIVERY_EXPECTED',
    PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
    DAMAGED_GOODS: 'DAMAGED_GOODS',
    INVOICE_MISMATCH: 'INVOICE_MISMATCH',
    SUPPLIER_BILL_DUE: 'SUPPLIER_BILL_DUE'
  },
  PRODUCTION: {
    BATCH_AWAITING_QC: 'BATCH_AWAITING_QC',
    QC_FAILED: 'QC_FAILED',
    OUTPUT_BELOW_PLAN: 'OUTPUT_BELOW_PLAN',
    WASTAGE_HIGH: 'WASTAGE_HIGH',
    BATCH_EXPIRING_SOON: 'BATCH_EXPIRING_SOON',
    TRACEABILITY_INCOMPLETE: 'TRACEABILITY_INCOMPLETE',
    OVERALLOCATED: 'OVERALLOCATED',
    REPLACEMENT_RECORDED: 'REPLACEMENT_RECORDED',
    BATCH_MISSING_OPERATOR: 'BATCH_MISSING_OPERATOR'
  },
  EXPENSES: {
    EXPENSE_DUE: 'EXPENSE_DUE',
    EXPENSE_OVERDUE: 'EXPENSE_OVERDUE',
    RECURRING_GENERATED: 'RECURRING_GENERATED'
  },
  PAYMENTS: {
    SUPPLIER_INVOICE_UNPAID: 'SUPPLIER_INVOICE_UNPAID',
    PAYMENT_MISMATCH: 'PAYMENT_MISMATCH',
    CASH_DISCREPANCY: 'CASH_DISCREPANCY',
    INVOICE_OVERDUE: 'INVOICE_OVERDUE',
    PARTIAL_PAYMENT_OUTSTANDING: 'PARTIAL_PAYMENT_OUTSTANDING',
    REFUND_ISSUE: 'REFUND_ISSUE'
  },
  STAFF: {
    SHIFT_STARTING_SOON: 'SHIFT_STARTING_SOON',
    STAFF_LATE: 'STAFF_LATE',
    MISSED_CLOCK_IN: 'MISSED_CLOCK_IN',
    MISSED_CLOCK_OUT: 'MISSED_CLOCK_OUT',
    OVERTIME_THRESHOLD: 'OVERTIME_THRESHOLD',
    BREAK_OVERDUE: 'BREAK_OVERDUE',
    SHIFT_CONFLICT: 'SHIFT_CONFLICT'
  },
  SECURITY: {
    FAILED_LOGIN: 'FAILED_LOGIN',
    PERMISSION_CONFLICT: 'PERMISSION_CONFLICT',
    DATA_SYNC_FAILURE: 'DATA_SYNC_FAILURE'
  },
  WORKFLOWS: {
    WORKFLOW_ASSIGNED: 'WORKFLOW_ASSIGNED',
    WORKFLOW_OVERDUE: 'WORKFLOW_OVERDUE',
    WORKFLOW_FAILED: 'WORKFLOW_FAILED',
    WORKFLOW_INCOMPLETE: 'WORKFLOW_INCOMPLETE',
    WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
    TASK_FAILED: 'TASK_FAILED',
    WORKFLOW_REMINDER: 'WORKFLOW_REMINDER'
  },
  SYSTEM: {
    EXPORT_FAILED: 'EXPORT_FAILED',
    PRINTER_UNAVAILABLE: 'PRINTER_UNAVAILABLE',
    STORAGE_QUOTA_WARNING: 'STORAGE_QUOTA_WARNING',
    REALTIME_DISCONNECTED: 'REALTIME_DISCONNECTED',
    INTEGRATION_UNAVAILABLE: 'INTEGRATION_UNAVAILABLE'
  }
};

// Safe category/type getter
export const getNotificationType = (category, type) => {
  const catTypes = NOTIFICATION_TYPES[category];
  if (!catTypes) return null;
  return Object.values(catTypes).includes(type) ? type : null;
};

// Normalize a notification object
export const normalizeNotification = (notif) => {
  const id = safeStr(notif?.id) || genId();
  const category = Object.values(NOTIFICATION_CATEGORIES).includes(notif?.category) 
    ? notif.category 
    : NOTIFICATION_CATEGORIES.SYSTEM;
  const type = getNotificationType(category, notif?.type) || 'SYSTEM_NOTICE';
  const priority = Object.values(NOTIFICATION_PRIORITY).includes(notif?.priority)
    ? notif.priority
    : NOTIFICATION_PRIORITY.NORMAL;
  const status = Object.values(NOTIFICATION_STATUS).includes(notif?.status)
    ? notif.status
    : NOTIFICATION_STATUS.NEW;

  return {
    id,
    category,
    type,
    title: safeStr(notif?.title),
    summary: safeStr(notif?.summary),
    priority,
    status,
    unread: safeBool(notif?.unread),
    acknowledged: safeBool(notif?.acknowledged),
    acknowledgedBy: notif?.acknowledgedBy || null,
    acknowledgedAt: notif?.acknowledgedAt || null,
    resolved: safeBool(notif?.resolved),
    resolvedBy: notif?.resolvedBy || null,
    resolvedAt: notif?.resolvedAt || null,
    resolvedNote: notif?.resolvedNote || null,
    dismissed: safeBool(notif?.dismissed),
    dismissedBy: notif?.dismissedBy || null,
    dismissedAt: notif?.dismissedAt || null,
    assignedTo: notif?.assignedTo || null,
    assignedBy: notif?.assignedBy || null,
    assignedAt: notif?.assignedAt || null,
    sourceModule: safeStr(notif?.sourceModule),
    sourceRecordId: safeStr(notif?.sourceRecordId),
    sourceRecordType: safeStr(notif?.sourceRecordType),
    branchId: safeStr(notif?.branchId),
    createdAt: notif?.createdAt ? new Date(notif.createdAt).getTime() : Date.now(),
    updatedAt: notif?.updatedAt ? new Date(notif.updatedAt).getTime() : Date.now(),
    viewedAt: notif?.viewedAt ? new Date(notif.viewedAt).getTime() : null,
    metadata: notif?.metadata || {},
    activity: safeArr(notif?.activity),
    snoozedUntil: notif?.snoozedUntil ? new Date(notif.snoozedUntil).getTime() : null,
    groupId: notif?.groupId || null,
    groupCount: safeNum(notif?.groupCount, 1),
    isGrouped: safeBool(notif?.isGrouped)
  };
};

// Create a new notification
export const createNotification = (data) => {
  return normalizeNotification({
    ...data,
    id: data.id || genId(),
    status: NOTIFICATION_STATUS.NEW,
    unread: true,
    acknowledged: false,
    resolved: false,
    dismissed: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    activity: [{
      action: 'created',
      timestamp: Date.now(),
      actor: data.createdBy || 'system'
    }]
  });
};

// Mark notification as read
export const markAsRead = (notification, actor = 'current-user') => {
  if (notification.unread === false) return notification;
  
  return {
    ...notification,
    unread: false,
    status: NOTIFICATION_STATUS.READ,
    viewedAt: Date.now(),
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'viewed',
        timestamp: Date.now(),
        actor
      }
    ]
  };
};

// Acknowledge notification
export const acknowledgeNotification = (notification, actor = 'current-user') => {
  if (notification.acknowledged === true) return notification;
  
  return {
    ...notification,
    acknowledged: true,
    acknowledgedBy: actor,
    acknowledgedAt: Date.now(),
    status: NOTIFICATION_STATUS.ACKNOWLEDGED,
    unread: false,
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'acknowledged',
        timestamp: Date.now(),
        actor
      }
    ]
  };
};

// Resolve notification
export const resolveNotification = (notification, actor = 'current-user', note = null) => {
  if (notification.resolved === true) return notification;
  
  return {
    ...notification,
    resolved: true,
    resolvedBy: actor,
    resolvedAt: Date.now(),
    resolvedNote: note,
    status: NOTIFICATION_STATUS.RESOLVED,
    unread: false,
    acknowledged: true,
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'resolved',
        timestamp: Date.now(),
        actor,
        note
      }
    ]
  };
};

// Dismiss notification
export const dismissNotification = (notification, actor = 'current-user', reason = null) => {
  if (notification.dismissed === true) return notification;
  
  return {
    ...notification,
    dismissed: true,
    dismissedBy: actor,
    dismissedAt: Date.now(),
    status: NOTIFICATION_STATUS.DISMISSED,
    unread: false,
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'dismissed',
        timestamp: Date.now(),
        actor,
        reason
      }
    ]
  };
};

// Assign notification
export const assignNotification = (notification, assignee, actor = 'current-user') => {
  return {
    ...notification,
    assignedTo: assignee,
    assignedBy: actor,
    assignedAt: Date.now(),
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'assigned',
        timestamp: Date.now(),
        actor,
        assignee
      }
    ]
  };
};

// Reopen notification
export const reopenNotification = (notification, actor = 'current-user', reason = null) => {
  return {
    ...notification,
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    resolvedNote: null,
    status: NOTIFICATION_STATUS.NEW,
    unread: true,
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'reopened',
        timestamp: Date.now(),
        actor,
        reason
      }
    ]
  };
};

// Snooze notification
export const snoozeNotification = (notification, until, actor = 'current-user') => {
  const snoozedUntil = new Date(until).getTime();
  if (isNaN(snoozedUntil)) return notification;

  return {
    ...notification,
    snoozedUntil,
    updatedAt: Date.now(),
    activity: [
      ...(notification.activity || []),
      {
        action: 'snoozed',
        timestamp: Date.now(),
        actor,
        until: snoozedUntil
      }
    ]
  };
};

// Check if notification is actionable
export const isActionable = (notification) => {
  return !notification.resolved && 
         !notification.dismissed && 
         !notification.snoozedUntil ||
         notification.snoozedUntil < Date.now();
};

// Check if notification is overdue
export const isOverdue = (notification) => {
  if (!notification.metadata?.dueAt) return false;
  return new Date(notification.metadata.dueAt).getTime() < Date.now();
};

// Get notification age in minutes
export const getNotificationAge = (notification) => {
  const created = notification.createdAt || Date.now();
  const ageMs = Date.now() - created;
  return Math.floor(ageMs / (1000 * 60));
};

// Format notification age
export const formatNotificationAge = (notification) => {
  const ageMinutes = getNotificationAge(notification);
  
  if (ageMinutes < 1) return 'Just now';
  if (ageMinutes < 60) return `${ageMinutes}m ago`;
  
  const ageHours = Math.floor(ageMinutes / 60);
  if (ageHours < 24) return `${ageHours}h ago`;
  
  const ageDays = Math.floor(ageHours / 24);
  if (ageDays < 7) return `${ageDays}d ago`;
  
  const ageWeeks = Math.floor(ageDays / 7);
  return `${ageWeeks}w ago`;
};

// Calculate notification statistics
export const calculateNotificationStats = (notifications) => {
  const safeNotifs = safeArr(notifications);
  const now = Date.now();
  
  return {
    total: safeNotifs.length,
    unread: safeNotifs.filter(n => n.unread && !n.dismissed).length,
    urgent: safeNotifs.filter(n => n.priority === NOTIFICATION_PRIORITY.URGENT && !n.resolved && !n.dismissed).length,
    needsAttention: safeNotifs.filter(n => isActionable(n) && n.priority !== NOTIFICATION_PRIORITY.INFORMATIONAL).length,
    assignedToMe: safeNotifs.filter(n => n.assignedTo === 'current-user' && !n.resolved && !n.dismissed).length,
    overdue: safeNotifs.filter(n => isOverdue(n) && !n.resolved && !n.dismissed).length,
    resolvedToday: safeNotifs.filter(n => {
      if (!n.resolvedAt) return false;
      const resolvedDate = new Date(n.resolvedAt);
      const today = new Date();
      return resolvedDate.toDateString() === today.toDateString();
    }).length,
    systemIssues: safeNotifs.filter(n => 
      n.category === NOTIFICATION_CATEGORIES.SYSTEM || 
      n.category === NOTIFICATION_CATEGORIES.SECURITY
    ).filter(n => !n.resolved && !n.dismissed).length,
    snoozed: safeNotifs.filter(n => n.snoozedUntil && n.snoozedUntil > now).length
  };
};

// Filter notifications by category
export const filterByCategory = (notifications, category) => {
  return safeArr(notifications).filter(n => n.category === category);
};

// Filter notifications by priority
export const filterByPriority = (notifications, priority) => {
  return safeArr(notifications).filter(n => n.priority === priority);
};

// Filter notifications by status
export const filterByStatus = (notifications, status) => {
  return safeArr(notifications).filter(n => n.status === status);
};

// Filter notifications by assignee
export const filterByAssignee = (notifications, assignee) => {
  return safeArr(notifications).filter(n => n.assignedTo === assignee);
};

// Filter notifications by branch
export const filterByBranch = (notifications, branchId) => {
  return safeArr(notifications).filter(n => n.branchId === branchId);
};

// Search notifications
export const searchNotifications = (notifications, query) => {
  const q = safeStr(query).toLowerCase();
  if (!q) return safeArr(notifications);
  
  return safeArr(notifications).filter(n => {
    const title = safeStr(n.title).toLowerCase();
    const summary = safeStr(n.summary).toLowerCase();
    const sourceId = safeStr(n.sourceRecordId).toLowerCase();
    const sourceType = safeStr(n.sourceRecordType).toLowerCase();
    
    return title.includes(q) || 
           summary.includes(q) || 
           sourceId.includes(q) || 
           sourceType.includes(q);
  });
};

// Sort notifications
export const sortNotifications = (notifications, sortBy = 'newest') => {
  const safeNotifs = [...safeArr(notifications)];
  
  switch (sortBy) {
    case 'newest':
      return safeNotifs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    case 'oldest':
      return safeNotifs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    case 'priority': {
      const priorityOrder = { URGENT: 0, IMPORTANT: 1, NORMAL: 2, INFORMATIONAL: 3 };
      return safeNotifs.sort((a, b) => {
        const aPriority = priorityOrder[a.priority] || 999;
        const bPriority = priorityOrder[b.priority] || 999;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    }
    case 'unread_first':
      return safeNotifs.sort((a, b) => {
        if (a.unread !== b.unread) return b.unread ? 1 : -1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    case 'overdue_first':
      return safeNotifs.sort((a, b) => {
        const aOverdue = isOverdue(a);
        const bOverdue = isOverdue(b);
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    case 'recently_updated':
      return safeNotifs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    default:
      return safeNotifs;
  }
};

// Group notifications by source
export const groupNotifications = (notifications) => {
  const groups = {};
  
  safeArr(notifications).forEach(n => {
    const key = `${n.category}-${n.type}-${n.sourceRecordId || 'no-source'}`;
    if (!groups[key]) {
      groups[key] = {
        id: key,
        category: n.category,
        type: n.type,
        sourceRecordId: n.sourceRecordId,
        notifications: [],
        count: 0,
        newest: n.createdAt,
        oldest: n.createdAt
      };
    }
    groups[key].notifications.push(n);
    groups[key].count++;
    if (n.createdAt > groups[key].newest) groups[key].newest = n.createdAt;
    if (n.createdAt < groups[key].oldest) groups[key].oldest = n.createdAt;
  });
  
  return Object.values(groups);
};

// Prevent duplicate notifications
export const preventDuplicate = (notifications, newNotification) => {
  const safeNotifs = safeArr(notifications);
  const duplicate = safeNotifs.find(n => 
    n.category === newNotification.category &&
    n.type === newNotification.type &&
    n.sourceRecordId === newNotification.sourceRecordId &&
    !n.resolved &&
    !n.dismissed
  );
  
  if (duplicate) {
    // Update existing instead of creating new
    return {
      ...duplicate,
      updatedAt: Date.now(),
      groupCount: (duplicate.groupCount || 1) + 1,
      activity: [
        ...(duplicate.activity || []),
        {
          action: 'duplicate_prevented',
          timestamp: Date.now(),
          actor: 'system'
        }
      ]
    };
  }
  
  return newNotification;
};

// Check if notification should be visible based on role
export const isVisibleForRole = (notification, role) => {
  // Role-based visibility rules
  const roleVisibility = {
    CASHIER: ['ORDERS', 'PAYMENTS', 'DOCUMENTS'],
    KITCHEN: ['KITCHEN', 'ORDERS'],
    WAITER: ['TABLES', 'ORDERS', 'RESERVATIONS'],
    DELIVERY: ['DELIVERY', 'TRACKING'],
    MANAGER: null // Manager sees all
  };
  
  const allowedCategories = roleVisibility[role];
  if (allowedCategories === null) return true; // Manager sees all
  if (!allowedCategories) return false;
  
  return allowedCategories.includes(notification.category);
};

// Export notification model
export const notificationModel = {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_STATUS,
  NOTIFICATION_TYPES,
  normalizeNotification,
  createNotification,
  markAsRead,
  acknowledgeNotification,
  resolveNotification,
  dismissNotification,
  assignNotification,
  reopenNotification,
  snoozeNotification,
  isActionable,
  isOverdue,
  getNotificationAge,
  formatNotificationAge,
  calculateNotificationStats,
  filterByCategory,
  filterByPriority,
  filterByStatus,
  filterByAssignee,
  filterByBranch,
  searchNotifications,
  sortNotifications,
  groupNotifications,
  preventDuplicate,
  isVisibleForRole
};
