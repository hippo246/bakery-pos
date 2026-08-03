/**
 * Widget Types and Constants
 * Core type definitions for the Widget Engine
 */

// Widget sizes
export const WidgetSizes = {
  SMALL: 'small',      // 2x2 grid cells
  MEDIUM: 'medium',    // 4x2 grid cells
  LARGE: 'large',      // 4x4 grid cells
  EXTRA_LARGE: 'xlarge' // 6x4 grid cells
};

// Grid dimensions for different screen sizes
export const GridConfig = {
  desktop: { columns: 12, rows: 12, cellWidth: 80, cellHeight: 80 },
  tablet: { columns: 8, rows: 10, cellWidth: 70, cellHeight: 70 },
  mobile: { columns: 4, rows: 8, cellWidth: 60, cellHeight: 60 },
  tv: { columns: 16, rows: 14, cellWidth: 90, cellHeight: 90 }
};

// Widget categories
export const WidgetCategories = {
  REVENUE: 'revenue',
  OPERATIONS: 'operations',
  KITCHEN: 'kitchen',
  ORDERS: 'orders',
  INVENTORY: 'inventory',
  RESERVATIONS: 'reservations',
  STAFF: 'staff',
  CUSTOMERS: 'customers',
  REPORTS: 'reports',
  CLOUD: 'cloud',
  HEALTH: 'health',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  SYSTEM: 'system'
};

// Widget states
export const WidgetState = {
  NORMAL: 'normal',
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded',
  FULLSCREEN: 'fullscreen',
  LOADING: 'loading',
  ERROR: 'error'
};

// Widget permissions by role
export const RolePermissions = {
  owner: ['*'],
  manager: ['revenue', 'operations', 'kitchen', 'orders', 'inventory', 'reservations', 'staff', 'customers', 'reports', 'health', 'notifications', 'analytics'],
  cashier: ['orders', 'customers', 'payments', 'shift'],
  kitchen: ['kitchen', 'orders', 'inventory'],
  waiter: ['orders', 'tables', 'reservations', 'customers'],
  inventory: ['inventory', 'orders'],
  administrator: ['*'],
  support: ['health', 'system', 'reports']
};

// Default refresh intervals (in milliseconds)
export const RefreshIntervals = {
  NEVER: 0,
  SLOW: 60000,      // 1 minute
  NORMAL: 30000,    // 30 seconds
  FAST: 10000,      // 10 seconds
  REALTIME: 5000    // 5 seconds
};

/**
 * Widget definition interface
 */
export class WidgetDefinition {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.category = config.category;
    this.icon = config.icon;
    this.component = config.component;
    this.defaultSize = config.defaultSize || WidgetSizes.MEDIUM;
    this.minSize = config.minSize || WidgetSizes.SMALL;
    this.maxSize = config.maxSize || WidgetSizes.EXTRA_LARGE;
    this.resizable = config.resizable !== false;
    this.collapsible = config.collapsible !== false;
    this.refreshable = config.refreshable !== false;
    this.defaultRefreshInterval = config.defaultRefreshInterval || RefreshIntervals.NORMAL;
    this.permissions = config.permissions || ['*'];
    this.settings = config.settings || [];
    this.keywords = config.keywords || [];
  }
}

/**
 * Widget instance interface (user's widget on dashboard)
 */
export class WidgetInstance {
  constructor(config) {
    this.id = config.id; // Unique instance ID
    this.widgetId = config.widgetId; // Widget definition ID
    this.position = config.position || { x: 0, y: 0 };
    this.size = config.size || WidgetSizes.MEDIUM;
    this.state = config.state || WidgetState.NORMAL;
    this.visible = config.visible !== false;
    this.collapsed = config.collapsed || false;
    this.pinned = config.pinned || false;
    this.locked = config.locked || false;
    this.settings = config.settings || {};
    this.refreshInterval = config.refreshInterval;
    this.order = config.order || 0;
    this.lastRefresh = config.lastRefresh || 0;
  }
}

/**
 * Dashboard layout interface
 */
export class DashboardLayout {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.role = config.role;
    this.widgets = config.widgets || []; // Array of WidgetInstance
    this.isDefault = config.isDefault || false;
    this.isLocked = config.isLocked || false;
    this.createdAt = config.createdAt || Date.now();
    this.updatedAt = config.updatedAt || Date.now();
  }
}

/**
 * Widget settings definition
 */
export class WidgetSetting {
  constructor(config) {
    this.key = config.key;
    this.type = config.type; // 'text', 'number', 'select', 'toggle', 'color', 'range'
    this.label = config.label;
    this.description = config.description;
    this.defaultValue = config.defaultValue;
    this.options = config.options; // For select type
    this.min = config.min; // For number/range
    this.max = config.max; // For number/range
    this.step = config.step; // For number/range
    this.required = config.required || false;
  }
}
