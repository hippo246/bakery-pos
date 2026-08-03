// Dashboard Types and Constants
// Operational Command Center Foundation

export const BusinessHealthStatus = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

export const WidgetType = {
  BUSINESS_HEALTH: 'business_health',
  QUICK_ACTIONS: 'quick_actions',
  TODAY_REVENUE: 'today_revenue',
  TODAY_ORDERS: 'today_orders',
  ACTIVE_ORDERS: 'active_orders',
  KITCHEN_QUEUE: 'kitchen_queue',
  WAITER_QUEUE: 'waiter_queue',
  ACTIVE_TABLES: 'active_tables',
  RESERVATIONS: 'reservations',
  INVENTORY_ALERTS: 'inventory_alerts',
  STAFF_ON_DUTY: 'staff_on_duty',
  PAYMENT_OVERVIEW: 'payment_overview',
  RECENT_ACTIVITY: 'recent_activity',
  OPERATIONAL_ALERTS: 'operational_alerts',
  QUICK_NOTES: 'quick_notes',
  WEATHER: 'weather',
  AI_ASSISTANT: 'ai_assistant'
};

export const WidgetSize = {
  SMALL: 'small', // 1x1
  MEDIUM: 'medium', // 2x1
  LARGE: 'large', // 2x2
  WIDE: 'wide', // 3x1
  TALL: 'tall' // 1x2
};

export const WidgetLayout = {
  DESKTOP: {
    columns: 12,
    rows: 'auto'
  },
  TABLET: {
    columns: 8,
    rows: 'auto'
  },
  MOBILE: {
    columns: 1,
    rows: 'auto'
  }
};

export const QuickActionType = {
  NEW_ORDER: 'new_order',
  RESERVATION: 'reservation',
  INVENTORY: 'inventory',
  PURCHASE_ORDER: 'purchase_order',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  SUPPORT: 'support',
  BACKUPS: 'backups'
};

export const SystemStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  WARNING: 'warning',
  ERROR: 'error'
};

export const ActivityType = {
  ORDER_CREATED: 'order_created',
  ORDER_COMPLETED: 'order_completed',
  RESERVATION_CHECKED_IN: 'reservation_checked_in',
  RESERVATION_CHECKED_OUT: 'reservation_checked_out',
  INVENTORY_UPDATED: 'inventory_updated',
  PURCHASE_RECEIVED: 'purchase_received',
  BACKUP_COMPLETED: 'backup_completed',
  CUSTOMER_ADDED: 'customer_added',
  PAYMENT_COMPLETED: 'payment_completed',
  STAFF_CLOCKED_IN: 'staff_clocked_in',
  STAFF_CLOCKED_OUT: 'staff_clocked_out'
};

export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

export const AlertCategory = {
  KITCHEN: 'kitchen',
  PRINTER: 'printer',
  INVENTORY: 'inventory',
  QUEUE: 'queue',
  CUSTOMER: 'customer',
  CLOUD: 'cloud',
  SYNC: 'sync',
  PAYMENT: 'payment'
};

export const DEFAULT_QUICK_ACTIONS = [
  { type: QuickActionType.NEW_ORDER, label: 'New Order', icon: 'Plus' },
  { type: QuickActionType.RESERVATION, label: 'Reservation', icon: 'Calendar' },
  { type: QuickActionType.INVENTORY, label: 'Inventory', icon: 'Package' },
  { type: QuickActionType.CUSTOMER, label: 'Customer', icon: 'Users' },
  { type: QuickActionType.REPORTS, label: 'Reports', icon: 'BarChart' },
  { type: QuickActionType.SETTINGS, label: 'Settings', icon: 'Settings' }
];

export const DEFAULT_WIDGETS = [
  WidgetType.BUSINESS_HEALTH,
  WidgetType.QUICK_ACTIONS,
  WidgetType.TODAY_REVENUE,
  WidgetType.TODAY_ORDERS,
  WidgetType.ACTIVE_ORDERS,
  WidgetType.KITCHEN_QUEUE,
  WidgetType.WAITER_QUEUE,
  WidgetType.ACTIVE_TABLES,
  WidgetType.RESERVATIONS,
  WidgetType.INVENTORY_ALERTS,
  WidgetType.STAFF_ON_DUTY,
  WidgetType.PAYMENT_OVERVIEW,
  WidgetType.RECENT_ACTIVITY,
  WidgetType.OPERATIONAL_ALERTS
];

export const WIDGET_REFRESH_INTERVALS = {
  REALTIME: 5000, // 5 seconds
  FAST: 15000, // 15 seconds
  NORMAL: 30000, // 30 seconds
  SLOW: 60000 // 1 minute
};

export const WIDGET_REFRESH_CONFIG = {
  [WidgetType.BUSINESS_HEALTH]: WIDGET_REFRESH_INTERVALS.NORMAL,
  [WidgetType.QUICK_ACTIONS]: null, // No refresh
  [WidgetType.TODAY_REVENUE]: WIDGET_REFRESH_INTERVALS.SLOW,
  [WidgetType.TODAY_ORDERS]: WIDGET_REFRESH_INTERVALS.SLOW,
  [WidgetType.ACTIVE_ORDERS]: WIDGET_REFRESH_INTERVALS.FAST,
  [WidgetType.KITCHEN_QUEUE]: WIDGET_REFRESH_INTERVALS.REALTIME,
  [WidgetType.WAITER_QUEUE]: WIDGET_REFRESH_INTERVALS.REALTIME,
  [WidgetType.ACTIVE_TABLES]: WIDGET_REFRESH_INTERVALS.FAST,
  [WidgetType.RESERVATIONS]: WIDGET_REFRESH_INTERVALS.NORMAL,
  [WidgetType.INVENTORY_ALERTS]: WIDGET_REFRESH_INTERVALS.SLOW,
  [WidgetType.STAFF_ON_DUTY]: WIDGET_REFRESH_INTERVALS.SLOW,
  [WidgetType.PAYMENT_OVERVIEW]: WIDGET_REFRESH_INTERVALS.NORMAL,
  [WidgetType.RECENT_ACTIVITY]: WIDGET_REFRESH_INTERVALS.FAST,
  [WidgetType.OPERATIONAL_ALERTS]: WIDGET_REFRESH_INTERVALS.REALTIME,
  [WidgetType.QUICK_NOTES]: null // No refresh
};

export const BUSINESS_HEALTH_WEIGHTS = {
  orders: 0.25,
  kitchen: 0.20,
  waiters: 0.15,
  inventory: 0.15,
  reservations: 0.10,
  payments: 0.10,
  cloud: 0.05
};

export const HEALTH_THRESHOLDS = {
  orders: {
    healthy: 0.8,
    warning: 0.6
  },
  kitchen: {
    healthy: 0.8,
    warning: 0.6
  },
  waiters: {
    healthy: 0.8,
    warning: 0.6
  },
  inventory: {
    healthy: 0.9,
    warning: 0.7
  },
  reservations: {
    healthy: 0.8,
    warning: 0.6
  },
  payments: {
    healthy: 0.9,
    warning: 0.7
  },
  cloud: {
    healthy: 1.0,
    warning: 0.5
  }
};
