/**
 * Table Engine
 * Manages individual table state, transitions, and operations
 */

import moduleEventPublisher from '../dashboard/liveEngine/ModuleEventPublisher.js';

// Table states with their transitions
const TABLE_STATES = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  ORDERING: 'ordering',
  ORDER_CONFIRMED: 'order_confirmed',
  KITCHEN: 'kitchen',
  READY_FOR_PICKUP: 'ready_for_pickup',
  SERVING: 'serving',
  DINING: 'dining',
  BILL_REQUESTED: 'bill_requested',
  PAYMENT_PROCESSING: 'payment_processing',
  CLEANING: 'cleaning',
  MAINTENANCE: 'maintenance',
  DISABLED: 'disabled'
};

// State icons for UI
const STATE_ICONS = {
  [TABLE_STATES.AVAILABLE]: '✓',
  [TABLE_STATES.RESERVED]: '📅',
  [TABLE_STATES.OCCUPIED]: '👥',
  [TABLE_STATES.ORDERING]: '📝',
  [TABLE_STATES.ORDER_CONFIRMED]: '✓',
  [TABLE_STATES.KITCHEN]: '👨‍🍳',
  [TABLE_STATES.READY_FOR_PICKUP]: '🔔',
  [TABLE_STATES.SERVING]: '🍽️',
  [TABLE_STATES.DINING]: '🍴',
  [TABLE_STATES.BILL_REQUESTED]: '💳',
  [TABLE_STATES.PAYMENT_PROCESSING]: '💰',
  [TABLE_STATES.CLEANING]: '🧹',
  [TABLE_STATES.MAINTENANCE]: '🔧',
  [TABLE_STATES.DISABLED]: '🚫'
};

// State colors for UI
const STATE_COLORS = {
  [TABLE_STATES.AVAILABLE]: '#4caf50',
  [TABLE_STATES.RESERVED]: '#ff9800',
  [TABLE_STATES.OCCUPIED]: '#f44336',
  [TABLE_STATES.ORDERING]: '#9c27b0',
  [TABLE_STATES.ORDER_CONFIRMED]: '#2196f3',
  [TABLE_STATES.KITCHEN]: '#ff5722',
  [TABLE_STATES.READY_FOR_PICKUP]: '#00bcd4',
  [TABLE_STATES.SERVING]: '#795548',
  [TABLE_STATES.DINING]: '#607d8b',
  [TABLE_STATES.BILL_REQUESTED]: '#e91e63',
  [TABLE_STATES.PAYMENT_PROCESSING]: '#ffc107',
  [TABLE_STATES.CLEANING]: '#3f51b5',
  [TABLE_STATES.MAINTENANCE]: '#9e9e9e',
  [TABLE_STATES.DISABLED]: '#000000'
};

// State permissions (minimum role required)
const STATE_PERMISSIONS = {
  [TABLE_STATES.AVAILABLE]: 'waiter',
  [TABLE_STATES.RESERVED]: 'waiter',
  [TABLE_STATES.OCCUPIED]: 'waiter',
  [TABLE_STATES.ORDERING]: 'waiter',
  [TABLE_STATES.ORDER_CONFIRMED]: 'waiter',
  [TABLE_STATES.KITCHEN]: 'kitchen',
  [TABLE_STATES.READY_FOR_PICKUP]: 'waiter',
  [TABLE_STATES.SERVING]: 'waiter',
  [TABLE_STATES.DINING]: 'waiter',
  [TABLE_STATES.BILL_REQUESTED]: 'cashier',
  [TABLE_STATES.PAYMENT_PROCESSING]: 'cashier',
  [TABLE_STATES.CLEANING]: 'waiter',
  [TABLE_STATES.MAINTENANCE]: 'manager',
  [TABLE_STATES.DISABLED]: 'manager'
};

// State timer thresholds (in minutes)
const STATE_TIMER_THRESHOLDS = {
  [TABLE_STATES.OCCUPIED]: { warning: 90, critical: 120 },
  [TABLE_STATES.ORDERING]: { warning: 15, critical: 30 },
  [TABLE_STATES.KITCHEN]: { warning: 20, critical: 35 },
  [TABLE_STATES.READY_FOR_PICKUP]: { warning: 5, critical: 10 },
  [TABLE_STATES.DINING]: { warning: 60, critical: 90 },
  [TABLE_STATES.BILL_REQUESTED]: { warning: 10, critical: 15 },
  [TABLE_STATES.PAYMENT_PROCESSING]: { warning: 5, critical: 10 },
  [TABLE_STATES.CLEANING]: { warning: 10, critical: 15 }
};

// Valid state transitions
const STATE_TRANSITIONS = {
  [TABLE_STATES.AVAILABLE]: [TABLE_STATES.RESERVED, TABLE_STATES.OCCUPIED, TABLE_STATES.MAINTENANCE, TABLE_STATES.DISABLED],
  [TABLE_STATES.RESERVED]: [TABLE_STATES.OCCUPIED, TABLE_STATES.AVAILABLE],
  [TABLE_STATES.OCCUPIED]: [TABLE_STATES.ORDERING, TABLE_STATES.BILL_REQUESTED, TABLE_STATES.CLEANING, TABLE_STATES.AVAILABLE],
  [TABLE_STATES.ORDERING]: [TABLE_STATES.ORDER_CONFIRMED, TABLE_STATES.KITCHEN],
  [TABLE_STATES.ORDER_CONFIRMED]: [TABLE_STATES.KITCHEN, TABLE_STATES.SERVING],
  [TABLE_STATES.KITCHEN]: [TABLE_STATES.READY_FOR_PICKUP, TABLE_STATES.SERVING],
  [TABLE_STATES.READY_FOR_PICKUP]: [TABLE_STATES.SERVING, TABLE_STATES.DINING],
  [TABLE_STATES.SERVING]: [TABLE_STATES.DINING],
  [TABLE_STATES.DINING]: [TABLE_STATES.BILL_REQUESTED, TABLE_STATES.CLEANING],
  [TABLE_STATES.BILL_REQUESTED]: [TABLE_STATES.PAYMENT_PROCESSING, TABLE_STATES.CLEANING],
  [TABLE_STATES.PAYMENT_PROCESSING]: [TABLE_STATES.AVAILABLE, TABLE_STATES.CLEANING],
  [TABLE_STATES.CLEANING]: [TABLE_STATES.AVAILABLE],
  [TABLE_STATES.MAINTENANCE]: [TABLE_STATES.AVAILABLE, TABLE_STATES.DISABLED],
  [TABLE_STATES.DISABLED]: [TABLE_STATES.AVAILABLE, TABLE_STATES.MAINTENANCE]
};

// Transitions requiring manager override
const MANAGER_OVERRIDE_TRANSITIONS = {
  [TABLE_STATES.OCCUPIED]: [TABLE_STATES.AVAILABLE], // Skip payment
  [TABLE_STATES.DINING]: [TABLE_STATES.CLEANING], // Skip bill
  [TABLE_STATES.BILL_REQUESTED]: [TABLE_STATES.CLEANING], // Skip payment
  [TABLE_STATES.PAYMENT_PROCESSING]: [TABLE_STATES.CLEANING], // Skip payment completion
  [TABLE_STATES.MAINTENANCE]: [TABLE_STATES.DISABLED] // Disable table
};

// Section types
const SECTION_TYPES = {
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  VIP: 'vip',
  TERRACE: 'terrace',
  PRIVATE_ROOM: 'private_room',
  BAR: 'bar',
  COUNTER: 'counter',
  CUSTOM: 'custom'
};

// Table priorities
const TABLE_PRIORITIES = {
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
  VIP: 'vip',
  EMERGENCY: 'emergency'
};

// Priority colors
const PRIORITY_COLORS = {
  [TABLE_PRIORITIES.NORMAL]: '#9e9e9e',
  [TABLE_PRIORITIES.HIGH]: '#ff9800',
  [TABLE_PRIORITIES.URGENT]: '#f44336',
  [TABLE_PRIORITIES.VIP]: '#9c27b0',
  [TABLE_PRIORITIES.EMERGENCY]: '#d32f2f'
};

// Table alerts/badges
const TABLE_ALERTS = {
  VIP: 'vip',
  BIRTHDAY: 'birthday',
  ALLERGY: 'allergy',
  LATE_RESERVATION: 'late_reservation',
  FOOD_READY: 'food_ready',
  BILL_WAITING: 'bill_waiting',
  CLEANING_NEEDED: 'cleaning_needed',
  MANAGER_REQUESTED: 'manager_requested',
  WHEELCHAIR: 'wheelchair',
  HIGH_CHAIR: 'high_chair',
  WINDOW_SEAT: 'window_seat',
  LARGE_PARTY: 'large_party',
  SPECIAL_EVENT: 'special_event'
};

// Alert icons
const ALERT_ICONS = {
  [TABLE_ALERTS.VIP]: '⭐',
  [TABLE_ALERTS.BIRTHDAY]: '🎂',
  [TABLE_ALERTS.ALLERGY]: '⚠️',
  [TABLE_ALERTS.LATE_RESERVATION]: '⏰',
  [TABLE_ALERTS.FOOD_READY]: '🍽️',
  [TABLE_ALERTS.BILL_WAITING]: '💳',
  [TABLE_ALERTS.CLEANING_NEEDED]: '🧹',
  [TABLE_ALERTS.MANAGER_REQUESTED]: '👔',
  [TABLE_ALERTS.WHEELCHAIR]: '♿',
  [TABLE_ALERTS.HIGH_CHAIR]: '👶',
  [TABLE_ALERTS.WINDOW_SEAT]: '🪟',
  [TABLE_ALERTS.LARGE_PARTY]: '👥',
  [TABLE_ALERTS.SPECIAL_EVENT]: '🎉'
};

// Table shapes
const TABLE_SHAPES = {
  RECT: 'rect',
  SQUARE: 'square',
  CIRCLE: 'circle',
  OVAL: 'oval',
  BOOTH: 'booth',
  BAR_SEAT: 'bar_seat',
  CUSTOM: 'custom'
};

// Shape dimensions (default sizes)
const SHAPE_DEFAULTS = {
  [TABLE_SHAPES.RECT]: { width: 80, height: 60 },
  [TABLE_SHAPES.SQUARE]: { width: 70, height: 70 },
  [TABLE_SHAPES.CIRCLE]: { width: 70, height: 70 },
  [TABLE_SHAPES.OVAL]: { width: 90, height: 60 },
  [TABLE_SHAPES.BOOTH]: { width: 100, height: 80 },
  [TABLE_SHAPES.BAR_SEAT]: { width: 50, height: 50 },
  [TABLE_SHAPES.CUSTOM]: { width: 80, height: 80 }
};

// Minimum dimensions by shape
const SHAPE_MIN_DIMENSIONS = {
  [TABLE_SHAPES.RECT]: { width: 40, height: 30 },
  [TABLE_SHAPES.SQUARE]: { width: 40, height: 40 },
  [TABLE_SHAPES.CIRCLE]: { width: 40, height: 40 },
  [TABLE_SHAPES.OVAL]: { width: 50, height: 30 },
  [TABLE_SHAPES.BOOTH]: { width: 60, height: 50 },
  [TABLE_SHAPES.BAR_SEAT]: { width: 30, height: 30 },
  [TABLE_SHAPES.CUSTOM]: { width: 30, height: 30 }
};

// Maximum dimensions by shape
const SHAPE_MAX_DIMENSIONS = {
  [TABLE_SHAPES.RECT]: { width: 200, height: 150 },
  [TABLE_SHAPES.SQUARE]: { width: 150, height: 150 },
  [TABLE_SHAPES.CIRCLE]: { width: 150, height: 150 },
  [TABLE_SHAPES.OVAL]: { width: 200, height: 120 },
  [TABLE_SHAPES.BOOTH]: { width: 250, height: 150 },
  [TABLE_SHAPES.BAR_SEAT]: { width: 80, height: 80 },
  [TABLE_SHAPES.CUSTOM]: { width: 300, height: 300 }
};

class TableEngine {
  constructor() {
    this.tables = new Map(); // tableId -> table data
    this.tableJourneys = new Map(); // tableId -> journey history
    this.initialized = false;
  }

  /**
   * Initialize the table engine
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.loadTableData();
  }

  /**
   * Create or update a table
   * @param {Object} tableData - Table configuration
   * @returns {Object} Table data
   */
  upsertTable(tableData) {
    const shape = tableData.shape || TABLE_SHAPES.RECT;
    const dimensions = this.validateDimensions(tableData.dimensions, shape);
    const rotation = this.normalizeRotation(tableData.rotation || 0);

    const table = {
      ...tableData,
      id: tableData.id || `tbl-${Date.now()}`,
      number: tableData.number,
      capacity: tableData.capacity || 4,
      minCapacity: tableData.minCapacity || 1,
      maxCapacity: tableData.maxCapacity || tableData.capacity || 4,
      recommendedCapacity: tableData.recommendedCapacity || tableData.capacity || 4,
      standingCapacity: tableData.standingCapacity || 0,
      status: tableData.status || TABLE_STATES.AVAILABLE,
      type: tableData.type || 'indoor',
      area: tableData.area || 'main',
      sectionType: tableData.sectionType || SECTION_TYPES.INDOOR,
      sectionId: tableData.sectionId || null,
      floorId: tableData.floorId || 'floor-main',
      position: tableData.position || { x: 0, y: 0 },
      dimensions,
      rotation,
      shape,
      layer: tableData.layer || 0, // Visual layer (0 = tables, 1 = decor, 2 = walls, etc.)
      visible: tableData.visible !== false, // Visibility toggle
      assignedWaiter: tableData.assignedWaiter || null,
      currentOrder: tableData.currentOrder || null,
      currentGuests: tableData.currentGuests || 0,
      reservedFor: tableData.reservedFor || null,
      reservedTime: tableData.reservedTime || null,
      groupId: tableData.groupId || null, // For merged tables
      priority: tableData.priority || TABLE_PRIORITIES.NORMAL,
      alerts: tableData.alerts || [], // Array of alert badges
      timers: tableData.timers || {}, // State duration timers
      notes: tableData.notes || '',
      disabled: tableData.disabled || false,
      createdAt: tableData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.tables.set(table.id, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Validate table dimensions based on shape
   * @param {Object} dimensions - Width and height
   * @param {string} shape - Table shape
   * @returns {Object} Validated dimensions
   */
  validateDimensions(dimensions, shape) {
    const defaults = SHAPE_DEFAULTS[shape] || SHAPE_DEFAULTS[TABLE_SHAPES.RECT];
    const mins = SHAPE_MIN_DIMENSIONS[shape] || SHAPE_MIN_DIMENSIONS[TABLE_SHAPES.RECT];
    const maxs = SHAPE_MAX_DIMENSIONS[shape] || SHAPE_MAX_DIMENSIONS[TABLE_SHAPES.RECT];

    const width = Math.max(mins.width, Math.min(maxs.width, dimensions?.width || defaults.width));
    const height = Math.max(mins.height, Math.min(maxs.height, dimensions?.height || defaults.height));

    return { width, height };
  }

  /**
   * Normalize rotation to 0-360 degrees
   * @param {number} rotation - Rotation in degrees
   * @returns {number} Normalized rotation
   */
  normalizeRotation(rotation) {
    const normalized = rotation % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  }

  /**
   * Update table shape
   * @param {string} tableId - Table ID
   * @param {string} newShape - New shape
   * @returns {Object|null} Updated table
   */
  updateTableShape(tableId, newShape) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    if (!Object.values(TABLE_SHAPES).includes(newShape)) {
      console.warn(`[TableEngine] Invalid shape: ${newShape}`);
      return null;
    }

    table.shape = newShape;
    table.dimensions = this.validateDimensions(table.dimensions, newShape);
    table.updatedAt = new Date().toISOString();

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Update table rotation
   * @param {string} tableId - Table ID
   * @param {number} rotation - Rotation in degrees
   * @returns {Object|null} Updated table
   */
  updateTableRotation(tableId, rotation) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    table.rotation = this.normalizeRotation(rotation);
    table.updatedAt = new Date().toISOString();

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Update table dimensions
   * @param {string} tableId - Table ID
   * @param {Object} dimensions - New dimensions
   * @returns {Object|null} Updated table
   */
  updateTableDimensions(tableId, dimensions) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    table.dimensions = this.validateDimensions(dimensions, table.shape);
    table.updatedAt = new Date().toISOString();

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Update table layer
   * @param {string} tableId - Table ID
   * @param {number} layer - Layer number
   * @returns {Object|null} Updated table
   */
  updateTableLayer(tableId, layer) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    table.layer = Math.max(0, Math.min(10, layer));
    table.updatedAt = new Date().toISOString();

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Toggle table visibility
   * @param {string} tableId - Table ID
   * @returns {Object|null} Updated table
   */
  toggleTableVisibility(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    table.visible = !table.visible;
    table.updatedAt = new Date().toISOString();

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Validate state transition
   * @param {string} currentState - Current state
   * @param {string} newState - Desired state
   * @param {string} userRole - User role
   * @returns {Object} Validation result { valid: boolean, requiresOverride: boolean, reason: string }
   */
  validateStateTransition(currentState, newState, userRole = 'waiter') {
    const validTransitions = STATE_TRANSITIONS[currentState];
    if (!validTransitions || !validTransitions.includes(newState)) {
      return { valid: false, requiresOverride: false, reason: `Invalid transition from ${currentState} to ${newState}` };
    }

    // Check if transition requires manager override
    const overrideTransitions = MANAGER_OVERRIDE_TRANSITIONS[currentState] || [];
    if (overrideTransitions.includes(newState) && userRole !== 'manager' && userRole !== 'owner') {
      return { valid: false, requiresOverride: true, reason: 'Manager override required' };
    }

    // Check state permissions
    const requiredRole = STATE_PERMISSIONS[newState];
    if (requiredRole && !this.hasPermission(userRole, requiredRole)) {
      return { valid: false, requiresOverride: false, reason: `Insufficient permissions: ${requiredRole} required` };
    }

    return { valid: true, requiresOverride: false, reason: null };
  }

  /**
   * Check if user has permission
   * @param {string} userRole - User role
   * @param {string} requiredRole - Required role
   * @returns {boolean} Permission granted
   */
  hasPermission(userRole, requiredRole) {
    const roleHierarchy = ['owner', 'manager', 'supervisor', 'cashier', 'kitchen', 'waiter'];
    const userIndex = roleHierarchy.indexOf(userRole);
    const requiredIndex = roleHierarchy.indexOf(requiredRole);
    return userIndex !== -1 && userIndex <= requiredIndex;
  }

  /**
   * Change table state with validation
   * @param {string} tableId - Table ID
   * @param {string} newState - New state
   * @param {string} userRole - User role
   * @param {boolean} force - Force transition (manager override)
   * @returns {Object|null} Updated table or null if invalid
   */
  changeTableState(tableId, newState, userRole = 'waiter', force = false) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    const validation = this.validateStateTransition(table.status, newState, userRole);
    
    if (!validation.valid && !force) {
      console.warn(`[TableEngine] Invalid state transition: ${validation.reason}`);
      return null;
    }

    // Start timer for previous state
    if (table.status && STATE_TIMER_THRESHOLDS[table.status]) {
      const timerKey = `${table.status}_duration`;
      if (!table.timers) table.timers = {};
      table.timers[timerKey] = Date.now() - (table.timers[`${table.status}_start`] || Date.now());
      delete table.timers[`${table.status}_start`];
    }

    // Update state
    const oldStatus = table.status;
    table.status = newState;
    table.updatedAt = new Date().toISOString();

    // Start timer for new state
    if (STATE_TIMER_THRESHOLDS[newState]) {
      if (!table.timers) table.timers = {};
      table.timers[`${newState}_start`] = Date.now();
    }

    this.tables.set(tableId, table);
    this.saveTableData();

    // Record journey event
    this.recordJourneyEvent(tableId, {
      type: 'state_change',
      from: oldStatus,
      to: newState,
      timestamp: new Date().toISOString(),
      forced: force
    });

    // Publish event
    moduleEventPublisher.publishTableEvent('state_changed', {
      tableId,
      oldStatus,
      newStatus: newState,
      forced: force
    });

    return table;
  }

  /**
   * Validate capacity
   * @param {Object} table - Table data
   * @param {number} guestCount - Number of guests
   * @returns {Object} Validation result { valid: boolean, warnings: array, suggestions: array }
   */
  validateCapacity(table, guestCount) {
    const warnings = [];
    const suggestions = [];

    if (guestCount > table.maxCapacity) {
      warnings.push(`Over capacity: ${guestCount} guests exceeds maximum of ${table.maxCapacity}`);
      suggestions.push('Consider splitting the party or using nearby tables');
    }

    if (guestCount < table.minCapacity) {
      warnings.push(`Under capacity: ${guestCount} guests is below minimum of ${table.minCapacity}`);
    }

    if (guestCount > table.capacity) {
      warnings.push(`Exceeds standard capacity: ${guestCount} guests vs ${table.capacity} seats`);
    }

    if (guestCount > table.recommendedCapacity && guestCount <= table.capacity) {
      warnings.push(`Above recommended capacity: ${guestCount} guests vs ${table.recommendedCapacity} recommended`);
    }

    return { valid: warnings.length === 0, warnings, suggestions };
  }

  /**
   * Merge tables
   * @param {Array} tableIds - Array of table IDs to merge
   * @param {boolean} permanent - Permanent or temporary merge
   * @returns {Object|null} Merged table group info
   */
  mergeTables(tableIds, permanent = false) {
    const tables = tableIds.map(id => this.tables.get(id)).filter(t => t);
    
    if (tables.length < 2) {
      console.warn('[TableEngine] Need at least 2 tables to merge');
      return null;
    }

    // Check if any tables are already in a group
    const existingGroups = tables.filter(t => t.groupId);
    if (existingGroups.length > 0) {
      console.warn('[TableEngine] Some tables are already in a group');
      return null;
    }

    const groupId = `group-${Date.now()}`;
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

    tables.forEach(table => {
      table.groupId = groupId;
      table.merged = true;
      table.permanentMerge = permanent;
      table.updatedAt = new Date().toISOString();
      this.tables.set(table.id, table);
    });

    this.saveTableData();

    // Record journey events
    tables.forEach(table => {
      this.recordJourneyEvent(table.id, {
        type: 'merge',
        groupId,
        permanent,
        timestamp: new Date().toISOString()
      });
    });

    // Publish event
    moduleEventPublisher.publishTableEvent('tables_merged', {
      groupId,
      tableIds,
      permanent,
      totalCapacity
    });

    return { groupId, tableIds, totalCapacity, permanent };
  }

  /**
   * Split merged tables
   * @param {string} groupId - Group ID
   * @returns {boolean} Success
   */
  splitTables(groupId) {
    const tables = Array.from(this.tables.values()).filter(t => t.groupId === groupId);
    
    if (tables.length === 0) {
      console.warn('[TableEngine] No tables found in group');
      return false;
    }

    tables.forEach(table => {
      table.groupId = null;
      table.merged = false;
      table.permanentMerge = false;
      table.updatedAt = new Date().toISOString();
      this.tables.set(table.id, table);

      this.recordJourneyEvent(table.id, {
        type: 'split',
        groupId,
        timestamp: new Date().toISOString()
      });
    });

    this.saveTableData();

    moduleEventPublisher.publishTableEvent('tables_split', {
      groupId,
      tableIds: tables.map(t => t.id)
    });

    return true;
  }

  /**
   * Add alert to table
   * @param {string} tableId - Table ID
   * @param {string} alertType - Alert type
   * @returns {Object|null} Updated table
   */
  addTableAlert(tableId, alertType) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    if (!Object.values(TABLE_ALERTS).includes(alertType)) {
      console.warn(`[TableEngine] Invalid alert type: ${alertType}`);
      return null;
    }

    if (!table.alerts) table.alerts = [];
    if (!table.alerts.includes(alertType)) {
      table.alerts.push(alertType);
      table.updatedAt = new Date().toISOString();
      this.tables.set(tableId, table);
      this.saveTableData();

      moduleEventPublisher.publishTableEvent('alert_added', {
        tableId,
        alertType
      });
    }

    return table;
  }

  /**
   * Remove alert from table
   * @param {string} tableId - Table ID
   * @param {string} alertType - Alert type
   * @returns {Object|null} Updated table
   */
  removeTableAlert(tableId, alertType) {
    const table = this.tables.get(tableId);
    if (!table || !table.alerts) return null;

    table.alerts = table.alerts.filter(a => a !== alertType);
    table.updatedAt = new Date().toISOString();
    this.tables.set(tableId, table);
    this.saveTableData();

    moduleEventPublisher.publishTableEvent('alert_removed', {
      tableId,
      alertType
    });

    return table;
  }

  /**
   * Update table priority
   * @param {string} tableId - Table ID
   * @param {string} priority - Priority level
   * @returns {Object|null} Updated table
   */
  updateTablePriority(tableId, priority) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    if (!Object.values(TABLE_PRIORITIES).includes(priority)) {
      console.warn(`[TableEngine] Invalid priority: ${priority}`);
      return null;
    }

    table.priority = priority;
    table.updatedAt = new Date().toISOString();
    this.tables.set(tableId, table);
    this.saveTableData();

    moduleEventPublisher.publishTableEvent('priority_changed', {
      tableId,
      priority
    });

    return table;
  }

  /**
   * Get table timer status
   * @param {string} tableId - Table ID
   * @returns {Object} Timer status { state, duration, warning, critical }
   */
  getTableTimerStatus(tableId) {
    const table = this.tables.get(tableId);
    if (!table || !table.timers) return null;

    const thresholds = STATE_TIMER_THRESHOLDS[table.status];
    if (!thresholds) return null;

    const startTime = table.timers[`${table.status}_start`];
    if (!startTime) return null;

    const duration = Math.floor((Date.now() - startTime) / 60000); // minutes
    const warning = duration >= thresholds.warning;
    const critical = duration >= thresholds.critical;

    return {
      state: table.status,
      duration,
      warning,
      critical,
      thresholds
    };
  }

  /**
   * Get tables by priority
   * @param {string} priority - Priority level
   * @returns {Array} Tables with the specified priority
   */
  getTablesByPriority(priority) {
    return Array.from(this.tables.values())
      .filter(table => table.priority === priority && !table.disabled);
  }

  /**
   * Get tables with alerts
   * @param {string} alertType - Optional alert type filter
   * @returns {Array} Tables with alerts
   */
  getTablesWithAlerts(alertType = null) {
    return Array.from(this.tables.values())
      .filter(table => {
        if (table.disabled) return false;
        if (!table.alerts || table.alerts.length === 0) return false;
        if (alertType) return table.alerts.includes(alertType);
        return true;
      });
  }

  /**
   * Get tables exceeding timer thresholds
   * @returns {Array} Tables with critical timers
   */
  getCriticalTimers() {
    return Array.from(this.tables.values())
      .filter(table => {
        if (table.disabled) return false;
        const timerStatus = this.getTableTimerStatus(table.id);
        return timerStatus && timerStatus.critical;
      });
  }

  /**
   * Get table by ID
   * @param {string} tableId - Table ID
   * @returns {Object|null} Table data
   */
  getTable(tableId) {
    return this.tables.get(tableId) || null;
  }

  /**
   * Get all tables
   * @returns {Array} All tables
   */
  getAllTables() {
    return Array.from(this.tables.values());
  }

  /**
   * Get tables by status
   * @param {string} status - Table status
   * @returns {Array} Tables with the specified status
   */
  getTablesByStatus(status) {
    return Array.from(this.tables.values())
      .filter(table => table.status === status && !table.disabled);
  }

  /**
   * Get tables by section
   * @param {string} sectionId - Section ID
   * @returns {Array} Tables in the section
   */
  getTablesBySection(sectionId) {
    return Array.from(this.tables.values())
      .filter(table => table.sectionId === sectionId && !table.disabled);
  }

  /**
   * Get tables by floor
   * @param {string} floorId - Floor ID
   * @returns {Array} Tables on the floor
   */
  getTablesByFloor(floorId) {
    return Array.from(this.tables.values())
      .filter(table => table.floorId === floorId && !table.disabled);
  }

  /**
   * Get tables assigned to a waiter
   * @param {string} waiterId - Waiter ID
   * @returns {Array} Tables assigned to the waiter
   */
  getTablesByWaiter(waiterId) {
    return Array.from(this.tables.values())
      .filter(table => table.assignedWaiter === waiterId && !table.disabled);
  }

  /**
   * Assign waiter to table
   * @param {string} tableId - Table ID
   * @param {string} waiterId - Waiter ID
   * @returns {Object|null} Updated table
   */
  assignWaiter(tableId, waiterId) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    const previousWaiter = table.assignedWaiter;
    table.assignedWaiter = waiterId;
    table.updatedAt = new Date().toISOString();

    this.recordJourneyEvent(tableId, {
      type: 'waiter_assigned',
      previousWaiter,
      newWaiter: waiterId,
      timestamp: Date.now()
    });

    moduleEventPublisher.publishTableEvent('table.waiter_assigned', {
      tableId,
      previousWaiter,
      newWaiter: waiterId
    });

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Seat guests at table
   * @param {string} tableId - Table ID
   * @param {number} guestCount - Number of guests
   * @param {Object} metadata - Additional metadata
   * @returns {Object|null} Updated table
   */
  seatGuests(tableId, guestCount, metadata = {}) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    table.currentGuests = guestCount;
    table.status = TABLE_STATES.OCCUPIED;
    table.updatedAt = new Date().toISOString();

    this.recordJourneyEvent(tableId, {
      type: 'guests_seated',
      guestCount,
      timestamp: Date.now(),
      ...metadata
    });

    moduleEventPublisher.publishTableEvent('table.occupied', {
      tableId,
      guestCount,
      ...metadata
    });

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Clear table
   * @param {string} tableId - Table ID
   * @returns {Object|null} Updated table
   */
  clearTable(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    table.currentGuests = 0;
    table.currentOrder = null;
    table.assignedWaiter = null;
    table.status = TABLE_STATES.AVAILABLE;
    table.updatedAt = new Date().toISOString();

    this.recordJourneyEvent(tableId, {
      type: 'table_cleared',
      timestamp: Date.now()
    });

    moduleEventPublisher.publishTableEvent('table.available', {
      tableId,
      previousStatus: TABLE_STATES.CLEANING
    });

    this.tables.set(tableId, table);
    this.saveTableData();
    
    return table;
  }

  /**
   * Delete a table
   * @param {string} tableId - Table ID
   */
  deleteTable(tableId) {
    this.tables.delete(tableId);
    this.tableJourneys.delete(tableId);
    this.saveTableData();
  }

  /**
   * Record a journey event for a table
   * @param {string} tableId - Table ID
   * @param {Object} event - Journey event
   */
  recordJourneyEvent(tableId, event) {
    if (!this.tableJourneys.has(tableId)) {
      this.tableJourneys.set(tableId, []);
    }

    const journey = this.tableJourneys.get(tableId);
    journey.push({
      id: `journey-${Date.now()}`,
      timestamp: Date.now(),
      ...event
    });

    // Keep only last 100 events
    if (journey.length > 100) {
      journey.shift();
    }

    this.saveTableData();
  }

  /**
   * Get table journey
   * @param {string} tableId - Table ID
   * @returns {Array} Journey events
   */
  getTableJourney(tableId) {
    return this.tableJourneys.get(tableId) || [];
  }

  /**
   * Calculate table metrics from journey
   * @param {string} tableId - Table ID
   * @returns {Object} Table metrics
   */
  calculateTableMetrics(tableId) {
    const journey = this.getTableJourney(tableId);
    if (journey.length === 0) {
      return {
        avgOccupancyTime: 0,
        avgTurnover: 0,
        avgDiningTime: 0,
        totalSessions: 0,
        totalRevenue: 0,
        avgSpend: 0
      };
    }

    const seatingEvents = journey.filter(e => e.type === 'guests_seated');
    const clearingEvents = journey.filter(e => e.type === 'table_cleared');

    const sessions = [];
    for (let i = 0; i < Math.min(seatingEvents.length, clearingEvents.length); i++) {
      const seated = seatingEvents[i];
      const cleared = clearingEvents[i];
      if (cleared.timestamp > seated.timestamp) {
        sessions.push({
          duration: cleared.timestamp - seated.timestamp,
          seatedAt: seated.timestamp,
          clearedAt: cleared.timestamp,
          revenue: seated.revenue || 0
        });
      }
    }

    if (sessions.length === 0) {
      return {
        avgOccupancyTime: 0,
        avgTurnover: 0,
        avgDiningTime: 0,
        totalSessions: 0,
        totalRevenue: 0,
        avgSpend: 0
      };
    }

    const avgOccupancyTime = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
    const totalRevenue = sessions.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const avgSpend = sessions.length > 0 ? totalRevenue / sessions.length : 0;

    return {
      avgOccupancyTime: Math.round(avgOccupancyTime / 60000), // minutes
      avgTurnover: sessions.length,
      avgDiningTime: Math.round(avgOccupancyTime / 60000),
      totalSessions: sessions.length,
      totalRevenue,
      avgSpend
    };
  }

  /**
   * Get table history
   * @param {string} tableId - Table ID
   * @returns {Object} Table history
   */
  getTableHistory(tableId) {
    const table = this.tables.get(tableId);
    if (!table) return null;

    const journey = this.getTableJourney(tableId);
    const metrics = this.calculateTableMetrics(tableId);

    // Extract previous guests
    const guestEvents = journey.filter(e => e.type === 'guests_seated');
    const previousGuests = guestEvents.map(e => ({
      count: e.guestCount,
      timestamp: e.timestamp,
      reservedFor: e.reservedFor
    }));

    // Extract cleaning history
    const cleaningEvents = journey.filter(e => e.type === 'table_cleared');
    const cleaningHistory = cleaningEvents.map(e => ({
      timestamp: e.timestamp,
      duration: e.duration
    }));

    return {
      tableId: table.id,
      tableNumber: table.number,
      metrics,
      previousGuests,
      cleaningHistory,
      totalVisits: guestEvents.length,
      journey: journey.slice(-20) // Last 20 events
    };
  }

  /**
   * Validate table data
   * @param {Object} tableData - Table data to validate
   * @returns {Object} Validation result { valid: boolean, errors: array }
   */
  validateTableData(tableData) {
    const errors = [];

    // Check duplicate table number
    if (tableData.number) {
      const duplicate = Array.from(this.tables.values()).find(
        t => t.number === tableData.number && t.id !== tableData.id
      );
      if (duplicate) {
        errors.push(`Table number ${tableData.number} already exists`);
      }
    }

    // Validate capacity
    if (tableData.capacity) {
      if (tableData.capacity < 1) {
        errors.push('Capacity must be at least 1');
      }
      if (tableData.capacity > 20) {
        errors.push('Capacity cannot exceed 20');
      }
    }

    // Validate capacity ranges
    if (tableData.minCapacity && tableData.capacity && tableData.minCapacity > tableData.capacity) {
      errors.push('Minimum capacity cannot exceed standard capacity');
    }
    if (tableData.maxCapacity && tableData.capacity && tableData.maxCapacity < tableData.capacity) {
      errors.push('Maximum capacity cannot be less than standard capacity');
    }

    // Validate state
    if (tableData.status && !Object.values(TABLE_STATES).includes(tableData.status)) {
      errors.push(`Invalid state: ${tableData.status}`);
    }

    // Validate priority
    if (tableData.priority && !Object.values(TABLE_PRIORITIES).includes(tableData.priority)) {
      errors.push(`Invalid priority: ${tableData.priority}`);
    }

    // Validate section type
    if (tableData.sectionType && !Object.values(SECTION_TYPES).includes(tableData.sectionType)) {
      errors.push(`Invalid section type: ${tableData.sectionType}`);
    }

    // Validate shape
    if (tableData.shape && !Object.values(TABLE_SHAPES).includes(tableData.shape)) {
      errors.push(`Invalid shape: ${tableData.shape}`);
    }

    // Validate rotation
    if (tableData.rotation !== undefined && (tableData.rotation < 0 || tableData.rotation > 360)) {
      errors.push('Rotation must be between 0 and 360 degrees');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get nearby tables for capacity suggestions
   * @param {string} tableId - Table ID
   * @param {number} additionalGuests - Additional guests needed
   * @returns {Array} Nearby available tables
   */
  getNearbyAvailableTables(tableId, additionalGuests) {
    const table = this.tables.get(tableId);
    if (!table) return [];

    const nearbyTables = Array.from(this.tables.values())
      .filter(t => 
        t.id !== tableId &&
        t.status === TABLE_STATES.AVAILABLE &&
        !t.disabled &&
        t.floorId === table.floorId &&
        t.sectionId === table.sectionId &&
        t.capacity >= additionalGuests
      )
      .map(t => ({
        ...t,
        distance: Math.sqrt(
          Math.pow(t.position.x - table.position.x, 2) +
          Math.pow(t.position.y - table.position.y, 2)
        )
      }))
      .sort((a, b) => a.distance - b.distance);

    return nearbyTables.slice(0, 5); // Return top 5 nearby tables
  }

  /**
   * Batch update tables for performance
   * @param {Array} updates - Array of { tableId, updates }
   * @returns {Array} Updated tables
   */
  batchUpdateTables(updates) {
    const updatedTables = [];

    updates.forEach(({ tableId, ...tableUpdates }) => {
      const table = this.tables.get(tableId);
      if (table) {
        Object.assign(table, tableUpdates, { updatedAt: new Date().toISOString() });
        this.tables.set(tableId, table);
        updatedTables.push(table);
      }
    });

    this.saveTableData();

    moduleEventPublisher.publishTableEvent('batch_updated', {
      tableIds: updates.map(u => u.tableId),
      count: updatedTables.length
    });

    return updatedTables;
  }

  /**
   * Get tables by section type
   * @param {string} sectionType - Section type
   * @returns {Array} Tables in section type
   */
  getTablesBySectionType(sectionType) {
    return Array.from(this.tables.values())
      .filter(table => table.sectionType === sectionType && !table.disabled);
  }

  /**
   * Get merged tables group
   * @param {string} groupId - Group ID
   * @returns {Array} Tables in the group
   */
  getMergedTableGroup(groupId) {
    return Array.from(this.tables.values())
      .filter(table => table.groupId === groupId);
  }

  /**
   * Clear all table data
   */
  clearAll() {
    this.tables.clear();
    this.tableJourneys.clear();
    localStorage.removeItem('cafeos_table_data');
    localStorage.removeItem('cafeos_table_journeys');
  }

  /**
   * Save table data to storage
   */
  saveTableData() {
    try {
      const data = {
        tables: Array.from(this.tables.entries()),
        journeys: Array.from(this.tableJourneys.entries())
      };
      localStorage.setItem('cafeos_table_data', JSON.stringify(data));
    } catch (error) {
      console.error('[TableEngine] Failed to save table data:', error);
    }
  }

  /**
   * Load table data from storage
   */
  loadTableData() {
    try {
      const saved = localStorage.getItem('cafeos_table_data');
      if (saved) {
        const data = JSON.parse(saved);
        
        if (data.tables) {
          this.tables = new Map(data.tables);
        }
        
        if (data.journeys) {
          this.tableJourneys = new Map(data.journeys);
        }
      }
    } catch (error) {
      console.error('[TableEngine] Failed to load table data:', error);
    }
  }

  /**
   * Get state color
   * @param {string} status - Table status
   * @returns {string} Color code
   */
  getStateColor(status) {
    return STATE_COLORS[status] || '#9e9e9e';
  }

  /**
   * Check if state transition is valid
   * @param {string} from - Current state
   * @param {string} to - Target state
   * @returns {boolean}
   */
  isValidTransition(from, to) {
    const transitions = STATE_TRANSITIONS[from] || [];
    return transitions.includes(to);
  }
}

// Export constants
export { 
  TABLE_STATES, 
  STATE_TRANSITIONS, 
  STATE_COLORS, 
  STATE_ICONS,
  STATE_PERMISSIONS,
  STATE_TIMER_THRESHOLDS,
  MANAGER_OVERRIDE_TRANSITIONS,
  SECTION_TYPES,
  TABLE_PRIORITIES,
  PRIORITY_COLORS,
  TABLE_ALERTS,
  ALERT_ICONS,
  TABLE_SHAPES, 
  SHAPE_DEFAULTS, 
  SHAPE_MIN_DIMENSIONS, 
  SHAPE_MAX_DIMENSIONS 
};

// Singleton instance
const tableEngine = new TableEngine();

export default tableEngine;
