// Trigger Library
// Support for Order, Payment, Kitchen, Reservation, Inventory, Workflow, Customer, Staff, Table, Cloud, Support, Health, Documents, Reports, Time, Date, Shift, Manual

import { now } from '../domain/dates.js';

/**
 * Trigger Types
 */
export const TRIGGER_TYPES = {
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  KITCHEN: 'KITCHEN',
  RESERVATION: 'RESERVATION',
  INVENTORY: 'INVENTORY',
  WORKFLOW: 'WORKFLOW',
  CUSTOMER: 'CUSTOMER',
  STAFF: 'STAFF',
  TABLE: 'TABLE',
  CLOUD: 'CLOUD',
  SUPPORT: 'SUPPORT',
  HEALTH: 'HEALTH',
  DOCUMENTS: 'DOCUMENTS',
  REPORTS: 'REPORTS',
  TIME: 'TIME',
  DATE: 'DATE',
  SHIFT: 'SHIFT',
  MANUAL: 'MANUAL'
};

/**
 * Trigger Subtypes by Type
 */
export const TRIGGER_SUBTYPES = {
  ORDER: [
    'ORDER_CREATED',
    'ORDER_UPDATED',
    'ORDER_COMPLETED',
    'ORDER_CANCELLED',
    'ORDER_REFUNDED',
    'ORDER_VOIDED',
    'ORDER_MODIFIED',
    'ORDER_HELD',
    'ORDER_RESUMED',
    'ORDER_ASSIGNED',
    'ORDER_UNASSIGNED'
  ],
  PAYMENT: [
    'PAYMENT_INITIATED',
    'PAYMENT_COMPLETED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED',
    'PAYMENT_PARTIAL',
    'PAYMENT_DECLINED',
    'PAYMENT_TIMEOUT'
  ],
  KITCHEN: [
    'KITCHEN_ORDER_SENT',
    'KITCHEN_ORDER_STARTED',
    'KITCHEN_ORDER_READY',
    'KITCHEN_ORDER_DELIVERED',
    'KITCHEN_ORDER_CANCELLED',
    'KITCHEN_ORDER_MODIFIED',
    'KITCHEN_QUEUE_HIGH',
    'KITCHEN_QUEUE_LOW'
  ],
  RESERVATION: [
    'RESERVATION_CREATED',
    'RESERVATION_CONFIRMED',
    'RESERVATION_CANCELLED',
    'RESERVATION_MODIFIED',
    'RESERVATION_ARRIVED',
    'RESERVATION_NO_SHOW',
    'RESERVATION_REMINDER_DUE'
  ],
  INVENTORY: [
    'INVENTORY_LOW',
    'INVENTORY_OUT',
    'INVENTORY_RESTOCKED',
    'INVENTORY_ADJUSTED',
    'INVENTORY_EXPIRED',
    'INVENTORY_THRESHOLD_REACHED'
  ],
  WORKFLOW: [
    'WORKFLOW_STARTED',
    'WORKFLOW_COMPLETED',
    'WORKFLOW_FAILED',
    'WORKFLOW_CANCELLED',
    'WORKFLOW_STEP_COMPLETED',
    'WORKFLOW_APPROVAL_REQUIRED',
    'WORKFLOW_TIMEOUT'
  ],
  CUSTOMER: [
    'CUSTOMER_CREATED',
    'CUSTOMER_UPDATED',
    'CUSTOMER_DELETED',
    'CUSTOMER_TIER_CHANGED',
    'CUSTOMER_BIRTHDAY',
    'CUSTOMER_VISIT_MILESTONE',
    'CUSTOMER_INACTIVE'
  ],
  STAFF: [
    'STAFF_LOGIN',
    'STAFF_LOGOUT',
    'STAFF_SHIFT_START',
    'STAFF_SHIFT_END',
    'STAFF_CREATED',
    'STAFF_UPDATED',
    'STAFF_DELETED',
    'STASSIGNMENT_CHANGED'
  ],
  TABLE: [
    'TABLE_ASSIGNED',
    'TABLE_RELEASED',
    'TABLE_MERGED',
    'TABLE_SPLIT',
    'TABLE_MOVED',
    'TABLE_STATUS_CHANGED'
  ],
  CLOUD: [
    'CLOUD_SYNC_STARTED',
    'CLOUD_SYNC_COMPLETED',
    'CLOUD_SYNC_FAILED',
    'CLOUD_BACKUP_COMPLETED',
    'CLOUD_BACKUP_FAILED',
    'CLOUD_DATA_RECEIVED',
    'CLOUD_CONNECTION_LOST',
    'CLOUD_CONNECTION_RESTORED'
  ],
  SUPPORT: [
    'SUPPORT_TICKET_CREATED',
    'SUPPORT_TICKET_UPDATED',
    'SUPPORT_TICKET_CLOSED',
    'SUPPORT_TICKET_ESCALATED',
    'SUPPORT_TICKET_ASSIGNED'
  ],
  HEALTH: [
    'HEALTH_WARNING',
    'HEALTH_CRITICAL',
    'HEALTH_RESTORED',
    'TERMINAL_OFFLINE',
    'TERMINAL_ONLINE',
    'PERIPHERAL_FAILURE',
    'NETWORK_LOSS',
    'NETWORK_RESTORED'
  ],
  DOCUMENTS: [
    'DOCUMENT_CREATED',
    'DOCUMENT_UPDATED',
    'DOCUMENT_DELETED',
    'DOCUMENT_SHARED',
    'DOCUMENT_SIGNED'
  ],
  REPORTS: [
    'REPORT_GENERATED',
    'REPORT_SCHEDULED',
    'REPORT_FAILED',
    'REPORT_DELIVERED'
  ],
  TIME: [
    'HOURLY',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'YEARLY'
  ],
  DATE: [
    'DATE_REACHED',
    'DATE_PASSED',
    'DATE_REMINDER'
  ],
  SHIFT: [
    'SHIFT_OPENED',
    'SHIFT_CLOSED',
    'SHIFT_HANDOVER',
    'SHIFT_START',
    'SHIFT_END'
  ],
  MANUAL: [
    'MANUAL_TRIGGER'
  ]
};

/**
 * Trigger Library class
 * Registry of all available triggers
 */
export class TriggerLibrary {
  constructor() {
    this.triggers = new Map();
    this.registerDefaultTriggers();
  }

  /**
   * Register default triggers
   */
  registerDefaultTriggers() {
    // Order triggers
    TRIGGER_SUBTYPES.ORDER.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.ORDER,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'ORDER',
        parameters: ['orderId', 'branchId', 'staffId', 'customerId']
      });
    });

    // Payment triggers
    TRIGGER_SUBTYPES.PAYMENT.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.PAYMENT,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'PAYMENT',
        parameters: ['paymentId', 'orderId', 'amount', 'method']
      });
    });

    // Kitchen triggers
    TRIGGER_SUBTYPES.KITCHEN.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.KITCHEN,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'KITCHEN',
        parameters: ['kitchenOrderId', 'orderId', 'branchId']
      });
    });

    // Reservation triggers
    TRIGGER_SUBTYPES.RESERVATION.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.RESERVATION,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'RESERVATION',
        parameters: ['reservationId', 'customerId', 'partySize', 'time']
      });
    });

    // Inventory triggers
    TRIGGER_SUBTYPES.INVENTORY.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.INVENTORY,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'INVENTORY',
        parameters: ['itemId', 'quantity', 'threshold', 'branchId']
      });
    });

    // Workflow triggers
    TRIGGER_SUBTYPES.WORKFLOW.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.WORKFLOW,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'WORKFLOW',
        parameters: ['workflowId', 'stepId', 'status']
      });
    });

    // Customer triggers
    TRIGGER_SUBTYPES.CUSTOMER.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.CUSTOMER,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'CRM',
        parameters: ['customerId', 'tier', 'visits', 'lastVisit']
      });
    });

    // Staff triggers
    TRIGGER_SUBTYPES.STAFF.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.STAFF,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'STAFF',
        parameters: ['staffId', 'shiftId', 'terminalId', 'branchId']
      });
    });

    // Table triggers
    TRIGGER_SUBTYPES.TABLE.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.TABLE,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'TABLES',
        parameters: ['tableId', 'orderId', 'branchId']
      });
    });

    // Cloud triggers
    TRIGGER_SUBTYPES.CLOUD.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.CLOUD,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'CLOUD',
        parameters: ['syncId', 'branchId', 'timestamp']
      });
    });

    // Support triggers
    TRIGGER_SUBTYPES.SUPPORT.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.SUPPORT,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'SUPPORT',
        parameters: ['ticketId', 'customerId', 'priority']
      });
    });

    // Health triggers
    TRIGGER_SUBTYPES.HEALTH.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.HEALTH,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'HEALTH',
        parameters: ['terminalId', 'branchId', 'metric', 'value']
      });
    });

    // Document triggers
    TRIGGER_SUBTYPES.DOCUMENTS.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.DOCUMENTS,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'DOCUMENTS',
        parameters: ['documentId', 'type', 'branchId']
      });
    });

    // Report triggers
    TRIGGER_SUBTYPES.REPORTS.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.REPORTS,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'REPORTS',
        parameters: ['reportId', 'type', 'branchId']
      });
    });

    // Time triggers
    TRIGGER_SUBTYPES.TIME.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.TIME,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered ${subtype.toLowerCase()}`,
        category: 'TIME',
        parameters: ['timestamp', 'timezone']
      });
    });

    // Date triggers
    TRIGGER_SUBTYPES.DATE.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.DATE,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when date ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'DATE',
        parameters: ['date', 'timezone']
      });
    });

    // Shift triggers
    TRIGGER_SUBTYPES.SHIFT.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.SHIFT,
        subtype,
        name: this.formatTriggerName(subtype),
        description: `Triggered when ${subtype.toLowerCase().replace(/_/g, ' ')}`,
        category: 'SHIFT',
        parameters: ['shiftId', 'branchId', 'staffId']
      });
    });

    // Manual trigger
    TRIGGER_SUBTYPES.MANUAL.forEach(subtype => {
      this.registerTrigger({
        type: TRIGGER_TYPES.MANUAL,
        subtype,
        name: this.formatTriggerName(subtype),
        description: 'Manually triggered by user',
        category: 'MANUAL',
        parameters: ['triggeredBy', 'branchId']
      });
    });
  }

  /**
   * Format trigger name
   * @param {string} subtype - Trigger subtype
   * @returns {string} Formatted name
   */
  formatTriggerName(subtype) {
    return subtype
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Register a custom trigger
   * @param {Object} triggerData - Trigger data
   * @returns {Object} Registered trigger
   */
  registerTrigger(triggerData) {
    const trigger = {
      id: `${triggerData.type}_${triggerData.subtype}`,
      type: triggerData.type,
      subtype: triggerData.subtype,
      name: triggerData.name || this.formatTriggerName(triggerData.subtype),
      description: triggerData.description || '',
      category: triggerData.category || 'CUSTOM',
      parameters: triggerData.parameters || [],
      metadata: triggerData.metadata || {},
      isCustom: triggerData.isCustom || false,
      registeredAt: now(),
      registeredBy: triggerData.registeredBy || null
    };

    this.triggers.set(trigger.id, trigger);
    return trigger;
  }

  /**
   * Unregister a trigger
   * @param {string} triggerId - Trigger ID
   * @returns {boolean} Whether unregistration was successful
   */
  unregisterTrigger(triggerId) {
    const trigger = this.triggers.get(triggerId);
    if (!trigger || !trigger.isCustom) {
      return false; // Cannot unregister default triggers
    }

    return this.triggers.delete(triggerId);
  }

  /**
   * Get trigger by ID
   * @param {string} triggerId - Trigger ID
   * @returns {Object|null} Trigger or null
   */
  getTrigger(triggerId) {
    return this.triggers.get(triggerId) || null;
  }

  /**
   * Get all triggers
   * @returns {Array} Array of triggers
   */
  getAllTriggers() {
    return Array.from(this.triggers.values());
  }

  /**
   * Get triggers by type
   * @param {string} type - Trigger type
   * @returns {Array} Array of triggers
   */
  getTriggersByType(type) {
    return this.getAllTriggers().filter(t => t.type === type);
  }

  /**
   * Get triggers by category
   * @param {string} category - Trigger category
   * @returns {Array} Array of triggers
   */
  getTriggersByCategory(category) {
    return this.getAllTriggers().filter(t => t.category === category);
  }

  /**
   * Get custom triggers
   * @returns {Array} Array of custom triggers
   */
  getCustomTriggers() {
    return this.getAllTriggers().filter(t => t.isCustom);
  }

  /**
   * Get default triggers
   * @returns {Array} Array of default triggers
   */
  getDefaultTriggers() {
    return this.getAllTriggers().filter(t => !t.isCustom);
  }

  /**
   * Search triggers
   * @param {string} query - Search query
   * @returns {Array} Array of matching triggers
   */
  searchTriggers(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllTriggers().filter(t => 
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.type.toLowerCase().includes(lowerQuery) ||
      t.subtype.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Validate trigger data
   * @param {Object} triggerData - Trigger data to validate
   * @returns {Object} Validation result
   */
  validateTriggerData(triggerData) {
    const trigger = this.triggers.get(`${triggerData.type}_${triggerData.subtype}`);
    
    if (!trigger) {
      return { valid: false, reason: 'Trigger not found' };
    }

    // Check required parameters
    const missingParams = trigger.parameters.filter(param => 
      !(param in triggerData)
    );

    if (missingParams.length > 0) {
      return { 
        valid: false, 
        reason: `Missing required parameters: ${missingParams.join(', ')}` 
      };
    }

    return { valid: true, trigger };
  }

  /**
   * Get trigger statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const triggers = this.getAllTriggers();

    return {
      total: triggers.length,
      custom: triggers.filter(t => t.isCustom).length,
      default: triggers.filter(t => !t.isCustom).length,
      byType: triggers.reduce((acc, t) => {
        acc[ t.type] = (acc[t.type] || 0) + 1;
        return acc;
      }, {}),
      byCategory: triggers.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Singleton instance
let triggerLibraryInstance = null;

/**
 * Get the trigger library singleton
 * @returns {TriggerLibrary} Trigger library instance
 */
export function getTriggerLibrary() {
  if (!triggerLibraryInstance) {
    triggerLibraryInstance = new TriggerLibrary();
  }
  return triggerLibraryInstance;
}

/**
 * Reset the trigger library (useful for testing)
 */
export function resetTriggerLibrary() {
  triggerLibraryInstance = null;
}

/**
 * Convenience function to get trigger
 * @param {string} type - Trigger type
 * @param {string} subtype - Trigger subtype
 * @returns {Object|null} Trigger or null
 */
export function getTrigger(type, subtype) {
  const library = getTriggerLibrary();
  return library.getTrigger(`${type}_${subtype}`);
}

/**
 * Convenience function to register custom trigger
 * @param {Object} triggerData - Trigger data
 * @returns {Object} Registered trigger
 */
export function registerCustomTrigger(triggerData) {
  const library = getTriggerLibrary();
  return library.registerTrigger({ ...triggerData, isCustom: true });
}
