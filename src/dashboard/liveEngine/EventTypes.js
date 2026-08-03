/**
 * Event Types for Live Operations Engine
 * Defines all event types that can be emitted through the event bus
 */

// Event categories
export const EventCategories = {
  ORDERS: 'orders',
  KITCHEN: 'kitchen',
  WAITERS: 'waiters',
  TABLES: 'tables',
  PAYMENTS: 'payments',
  INVENTORY: 'inventory',
  RESERVATIONS: 'reservations',
  STAFF: 'staff',
  HEALTH: 'health',
  ALERTS: 'alerts',
  ACTIVITY: 'activity',
  SYSTEM: 'system'
};

// Order events
export const OrderEvents = {
  ORDER_CREATED: 'order.created',
  ORDER_ACCEPTED: 'order.accepted',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready',
  ORDER_SERVED: 'order.served',
  ORDER_COMPLETED: 'order.completed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_DELAYED: 'order.delayed',
  ORDER_MODIFIED: 'order.modified',
  ORDER_PAID: 'order.paid',
  ORDER_REFUNDED: 'order.refunded'
};

// Kitchen events
export const KitchenEvents = {
  KITCHEN_TICKET_CREATED: 'kitchen.ticket_created',
  KITCHEN_STARTED: 'kitchen.started',
  KITCHEN_READY: 'kitchen.ready',
  KITCHEN_COLLECTED: 'kitchen.collected',
  KITCHEN_DELAYED: 'kitchen.delayed',
  KITCHEN_PRIORITY: 'kitchen.priority',
  STATION_STATUS: 'kitchen.station_status'
};

// Waiter events
export const WaiterEvents = {
  ORDER_ASSIGNED: 'waiter.order_assigned',
  ORDER_PICKUP_READY: 'waiter.pickup_ready',
  ORDER_DELIVERED: 'waiter.delivered',
  BILL_REQUESTED: 'waiter.bill_requested',
  ASSISTANCE_REQUESTED: 'waiter.assistance_requested',
  TABLE_ASSIGNED: 'waiter.table_assigned'
};

// Table events
export const TableEvents = {
  TABLE_OCCUPIED: 'table.occupied',
  TABLE_VACATED: 'table.vacated',
  TABLE_RESERVED: 'table.reserved',
  TABLE_CLEANING: 'table.cleaning',
  TABLE_READY: 'table.ready',
  TABLE_OVERSTAY: 'table.overstay',
  BILL_REQUESTED: 'table.bill_requested'
};

// Payment events
export const PaymentEvents = {
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',
  CASH_DRAWER_OPENED: 'payment.cash_drawer_opened',
  SPLIT_PAYMENT: 'payment.split'
};

// Inventory events
export const InventoryEvents = {
  STOCK_CRITICAL: 'inventory.critical',
  STOCK_LOW: 'inventory.low',
  STOCK_OUT: 'inventory.out',
  STOCK_EXPIRING: 'inventory.expiring',
  STOCK_RESTOCKED: 'inventory.restocked',
  DELIVERY_RECEIVED: 'inventory.delivery_received',
  DELIVERY_DELAYED: 'inventory.delivery_delayed'
};

// Reservation events
export const ReservationEvents = {
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CONFIRMED: 'reservation.confirmed',
  RESERVATION_CHECKED_IN: 'reservation.checked_in',
  RESERVATION_LATE: 'reservation.late',
  RESERVATION_NO_SHOW: 'reservation.no_show',
  RESERVATION_COMPLETED: 'reservation.completed',
  WALK_IN: 'reservation.walk_in'
};

// Staff events
export const StaffEvents = {
  STAFF_CLOCKED_IN: 'staff.clocked_in',
  STAFF_CLOCKED_OUT: 'staff.clocked_out',
  STAFF_BREAK_STARTED: 'staff.break_started',
  STAFF_BREAK_ENDED: 'staff.break_ended',
  STAFF_IDLE: 'staff.idle',
  STAFF_ACTIVE: 'staff.active',
  SHIFT_ENDING: 'staff.shift_ending'
};

// Health events
export const HealthEvents = {
  COMPONENT_HEALTHY: 'health.healthy',
  COMPONENT_WARNING: 'health.warning',
  COMPONENT_CRITICAL: 'health.critical',
  COMPONENT_OFFLINE: 'health.offline',
  BACKUP_COMPLETED: 'health.backup_completed',
  BACKUP_FAILED: 'health.backup_failed',
  SYNC_COMPLETED: 'health.sync_completed',
  SYNC_FAILED: 'health.sync_failed'
};

// Alert events
export const AlertEvents = {
  ALERT_CREATED: 'alert.created',
  ALERT_ACKNOWLEDGED: 'alert.acknowledged',
  ALERT_RESOLVED: 'alert.resolved',
  ALERT_ESCALATED: 'alert.escalated'
};

// Activity events
export const ActivityEvents = {
  ACTIVITY_LOGGED: 'activity.logged'
};

// System events
export const SystemEvents = {
  SYSTEM_STARTED: 'system.started',
  SYSTEM_SHUTDOWN: 'system.shutdown',
  CONFIG_CHANGED: 'system.config_changed',
  USER_LOGIN: 'system.user_login',
  USER_LOGOUT: 'system.user_logout'
};

/**
 * Base event structure
 */
export class LiveEvent {
  constructor(type, data, metadata = {}) {
    this.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.category = this.getCategory(type);
    this.data = data;
    this.timestamp = Date.now();
    this.metadata = {
      source: metadata.source || 'system',
      userId: metadata.userId,
      sessionId: metadata.sessionId,
      ...metadata
    };
  }

  getCategory(type) {
    if (type.startsWith('order.')) return EventCategories.ORDERS;
    if (type.startsWith('kitchen.')) return EventCategories.KITCHEN;
    if (type.startsWith('waiter.')) return EventCategories.WAITERS;
    if (type.startsWith('table.')) return EventCategories.TABLES;
    if (type.startsWith('payment.')) return EventCategories.PAYMENTS;
    if (type.startsWith('inventory.')) return EventCategories.INVENTORY;
    if (type.startsWith('reservation.')) return EventCategories.RESERVATIONS;
    if (type.startsWith('staff.')) return EventCategories.STAFF;
    if (type.startsWith('health.')) return EventCategories.HEALTH;
    if (type.startsWith('alert.')) return EventCategories.ALERTS;
    if (type.startsWith('activity.')) return EventCategories.ACTIVITY;
    if (type.startsWith('system.')) return EventCategories.SYSTEM;
    return EventCategories.SYSTEM;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      category: this.category,
      data: this.data,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }
}
