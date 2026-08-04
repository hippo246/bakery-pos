// Live Audit Stream
// Real-time operational timeline showing orders, payments, kitchen, staff, tables, inventory, approvals, incidents

import { now } from '../domain/dates.js';

const AUDIT_STREAM_KEY = 'cafeos_audit_stream';

/**
 * Audit Event Types
 */
export const AUDIT_EVENT_TYPES = {
  ORDER: 'ORDER',
  PAYMENT: 'PAYMENT',
  KITCHEN: 'KITCHEN',
  STAFF: 'STAFF',
  TABLE: 'TABLE',
  INVENTORY: 'INVENTORY',
  APPROVAL: 'APPROVAL',
  INCIDENT: 'INCIDENT',
  TERMINAL: 'TERMINAL',
  SHIFT: 'SHIFT',
  BROADCAST: 'BROADCAST',
  INTERVENTION: 'INTERVENTION',
  QUEUE: 'QUEUE',
  SYSTEM: 'SYSTEM'
};

/**
 * Audit Event Actions
 */
export const AUDIT_ACTIONS = {
  // Order actions
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_UPDATED: 'ORDER_UPDATED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_REFUNDED: 'ORDER_REFUNDED',
  ORDER_VOIDED: 'ORDER_VOIDED',
  
  // Payment actions
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  
  // Kitchen actions
  KITCHEN_ORDER_SENT: 'KITCHEN_ORDER_SENT',
  KITCHEN_ORDER_STARTED: 'KITCHEN_ORDER_STARTED',
  KITCHEN_ORDER_READY: 'KITCHEN_ORDER_READY',
  KITCHEN_ORDER_DELIVERED: 'KITCHEN_ORDER_DELIVERED',
  
  // Staff actions
  STAFF_LOGIN: 'STAFF_LOGIN',
  STAFF_LOGOUT: 'STAFF_LOGOUT',
  STAFF_SHIFT_START: 'STAFF_SHIFT_START',
  STAFF_SHIFT_END: 'STAFF_SHIFT_END',
  
  // Table actions
  TABLE_ASSIGNED: 'TABLE_ASSIGNED',
  TABLE_RELEASED: 'TABLE_RELEASED',
  TABLE_MOVED: 'TABLE_MOVED',
  
  // Inventory actions
  INVENTORY_ADJUSTED: 'INVENTORY_ADJUSTED',
  INVENTORY_LOW: 'INVENTORY_LOW',
  INVENTORY_OUT: 'INVENTORY_OUT',
  
  // Approval actions
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_GRANTED: 'APPROVAL_GRANTED',
  APPROVAL_DENIED: 'APPROVAL_DENIED',
  
  // Incident actions
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_ASSIGNED: 'INCIDENT_ASSIGNED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  INCIDENT_ESCALATED: 'INCIDENT_ESCALATED',
  
  // Terminal actions
  TERMINAL_ONLINE: 'TERMINAL_ONLINE',
  TERMINAL_OFFLINE: 'TERMINAL_OFFLINE',
  TERMINAL_LOCKED: 'TERMINAL_LOCKED',
  TERMINAL_UNLOCKED: 'TERMINAL_UNLOCKED',
  
  // Shift actions
  SHIFT_OPENED: 'SHIFT_OPENED',
  SHIFT_CLOSED: 'SHIFT_CLOSED',
  SHIFT_HANDOVER: 'SHIFT_HANDOVER',
  
  // Broadcast actions
  BROADCAST_SENT: 'BROADCAST_SENT',
  BROADCAST_ACKNOWLEDGED: 'BROADCAST_ACKNOWLEDGED',
  
  // Intervention actions
  INTERVENTION_REQUESTED: 'INTERVENTION_REQUESTED',
  INTERVENTION_APPROVED: 'INTERVENTION_APPROVED',
  INTERVENTION_EXECUTED: 'INTERVENTION_EXECUTED',
  
  // Queue actions
  QUEUE_ITEM_ADDED: 'QUEUE_ITEM_ADDED',
  QUEUE_ITEM_STARTED: 'QUEUE_ITEM_STARTED',
  QUEUE_ITEM_COMPLETED: 'QUEUE_ITEM_COMPLETED',
  
  // System actions
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  SYSTEM_WARNING: 'SYSTEM_WARNING',
  SYSTEM_INFO: 'SYSTEM_INFO'
};

/**
 * Audit Stream class
 * Real-time operational timeline showing orders, payments, kitchen, staff, tables, inventory, approvals, incidents
 */
export class AuditStream {
  constructor() {
    this.events = new Map();
    this.subscribers = new Map();
    this.loadEvents();
    this.startCleanup();
  }

  /**
   * Load events from localStorage
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem(AUDIT_STREAM_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.events) {
          data.events.forEach(event => {
            this.events.set(event.id, event);
          });
        }
      }
    } catch (error) {
      console.error('[AuditStream] Failed to load events:', error);
    }
  }

  /**
   * Save events to localStorage
   */
  saveEvents() {
    try {
      const events = Array.from(this.events.values());
      localStorage.setItem(AUDIT_STREAM_KEY, JSON.stringify({ events }));
    } catch (error) {
      console.error('[AuditStream] Failed to save events:', error);
    }
  }

  /**
   * Start cleanup of old events
   */
  startCleanup() {
    // Clean up events older than 30 days every hour
    setInterval(() => {
      this.cleanupOldEvents(30 * 24 * 60 * 60 * 1000);
    }, 60 * 60 * 1000);
  }

  /**
   * Create an audit event
   * @param {Object} eventData - Event data
   * @returns {Object} Created event
   */
  createEvent(eventData) {
    const event = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Type & Action
      type: eventData.type || AUDIT_EVENT_TYPES.SYSTEM,
      action: eventData.action || AUDIT_ACTIONS.SYSTEM_INFO,
      
      // Description
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      
      // References
      orderId: eventData.orderId || null,
      paymentId: eventData.paymentId || null,
      tableId: eventData.tableId || null,
      customerId: eventData.customerId || null,
      staffId: eventData.staffId || null,
      terminalId: eventData.terminalId || null,
      branchId: eventData.branchId || null,
      shiftId: eventData.shiftId || null,
      incidentId: eventData.incidentId || null,
      approvalId: eventData.approvalId || null,
      
      // Actor
      actorId: eventData.actorId || null,
      actorRole: eventData.actorRole || null,
      actorName: eventData.actorName || null,
      
      // Changes
      changes: eventData.changes || null,
      oldValue: eventData.oldValue || null,
      newValue: eventData.newValue || null,
      
      // Metadata
      metadata: eventData.metadata || {},
      
      // Timestamp
      timestamp: now()
    };

    this.events.set(event.id, event);
    this.saveEvents();

    // Notify subscribers
    this.notifySubscribers('event_created', event);

    return event;
  }

  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {Object|null} Event or null
   */
  getEvent(eventId) {
    return this.events.get(eventId) || null;
  }

  /**
   * Get all events
   * @returns {Array} Array of events
   */
  getAllEvents() {
    return Array.from(this.events.values());
  }

  /**
   * Get events by type
   * @param {string} type - Event type
   * @returns {Array} Array of events
   */
  getEventsByType(type) {
    return this.getAllEvents().filter(e => e.type === type);
  }

  /**
   * Get events by action
   * @param {string} action - Event action
   * @returns {Array} Array of events
   */
  getEventsByAction(action) {
    return this.getAllEvents().filter(e => e.action === action);
  }

  /**
   * Get events by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of events
   */
  getEventsByOrder(orderId) {
    return this.getAllEvents().filter(e => e.orderId === orderId);
  }

  /**
   * Get events by staff
   * @param {string} staffId - Staff ID
   * @returns {Array} Array of events
   */
  getEventsByStaff(staffId) {
    return this.getAllEvents().filter(e => e.staffId === staffId || e.actorId === staffId);
  }

  /**
   * Get events by terminal
   * @param {string} terminalId - Terminal ID
   * @returns {Array} Array of events
   */
  getEventsByTerminal(terminalId) {
    return this.getAllEvents().filter(e => e.terminalId === terminalId);
  }

  /**
   * Get events by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of events
   */
  getEventsByBranch(branchId) {
    return this.getAllEvents().filter(e => e.branchId === branchId);
  }

  /**
   * Get events by table
   * @param {string} tableId - Table ID
   * @returns {Array} Array of events
   */
  getEventsByTable(tableId) {
    return this.getAllEvents().filter(e => e.tableId === tableId);
  }

  /**
   * Get events by time range
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {Array} Array of events
   */
  getEventsByTimeRange(startTime, endTime) {
    return this.getAllEvents().filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Get recent events
   * @param {number} limit - Number of events to return
   * @returns {Array} Array of events
   */
  getRecentEvents(limit = 100) {
    return this.getAllEvents()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get filtered events
   * @param {Object} filters - Filter criteria
   * @returns {Array} Array of events
   */
  getFilteredEvents(filters = {}) {
    let events = this.getAllEvents();

    if (filters.type) {
      events = events.filter(e => e.type === filters.type);
    }
    if (filters.action) {
      events = events.filter(e => e.action === filters.action);
    }
    if (filters.orderId) {
      events = events.filter(e => e.orderId === filters.orderId);
    }
    if (filters.staffId) {
      events = events.filter(e => e.staffId === filters.staffId || e.actorId === filters.staffId);
    }
    if (filters.terminalId) {
      events = events.filter(e => e.terminalId === filters.terminalId);
    }
    if (filters.branchId) {
      events = events.filter(e => e.branchId === filters.branchId);
    }
    if (filters.tableId) {
      events = events.filter(e => e.tableId === filters.tableId);
    }
    if (filters.startTime) {
      events = events.filter(e => e.timestamp >= filters.startTime);
    }
    if (filters.endTime) {
      events = events.filter(e => e.timestamp <= filters.endTime);
    }

    // Sort by timestamp descending
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  /**
   * Get event timeline for order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of events
   */
  getOrderTimeline(orderId) {
    const events = this.getEventsByOrder(orderId);
    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get event timeline for staff
   * @param {string} staffId - Staff ID
   * @param {Object} options - Options
   * @returns {Array} Array of events
   */
  getStaffTimeline(staffId, options = {}) {
    let events = this.getEventsByStaff(staffId);

    if (options.startTime) {
      events = events.filter(e => e.timestamp >= options.startTime);
    }
    if (options.endTime) {
      events = events.filter(e => e.timestamp <= options.endTime);
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get event timeline for terminal
   * @param {string} terminalId - Terminal ID
   * @param {Object} options - Options
   * @returns {Array} Array of events
   */
  getTerminalTimeline(terminalId, options = {}) {
    let events = this.getEventsByTerminal(terminalId);

    if (options.startTime) {
      events = events.filter(e => e.timestamp >= options.startTime);
    }
    if (options.endTime) {
      events = events.filter(e => e.timestamp <= options.endTime);
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get event statistics
   * @param {Object} options - Options
   * @returns {Object} Statistics
   */
  getStatistics(options = {}) {
    const { branchId, startTime, endTime } = options;
    
    let events = this.getAllEvents();
    
    if (branchId) {
      events = events.filter(e => e.branchId === branchId);
    }
    if (startTime) {
      events = events.filter(e => e.timestamp >= startTime);
    }
    if (endTime) {
      events = events.filter(e => e.timestamp <= endTime);
    }

    return {
      total: events.length,
      byType: events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      byAction: events.reduce((acc, e) => {
        acc[e.action] = (acc[e.action] || 0) + 1;
        return acc;
      }, {}),
      byBranch: events.reduce((acc, e) => {
        if (e.branchId) {
          acc[e.branchId] = (acc[e.branchId] || 0) + 1;
        }
        return acc;
      }, {}),
      byTerminal: events.reduce((acc, e) => {
        if (e.terminalId) {
          acc[e.terminalId] = (acc[e.terminalId] || 0) + 1;
        }
        return acc;
      }, {}),
      byStaff: events.reduce((acc, e) => {
        if (e.staffId) {
          acc[e.staffId] = (acc[e.staffId] || 0) + 1;
        }
        return acc;
      }, {})
    };
  }

  /**
   * Subscribe to events
   * @param {string} eventType - Event type
   * @param {Function} callback - Callback function
   * @returns {string} Subscription ID
   */
  subscribe(eventType, callback) {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Map());
    }

    this.subscribers.get(eventType).set(subscriptionId, callback);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   * @param {string} eventType - Event type
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Whether unsubscription was successful
   */
  unsubscribe(eventType, subscriptionId) {
    const eventSubscribers = this.subscribers.get(eventType);
    if (!eventSubscribers) return false;

    const deleted = eventSubscribers.delete(subscriptionId);
    if (deleted && eventSubscribers.size === 0) {
      this.subscribers.delete(eventType);
    }

    return deleted;
  }

  /**
   * Notify subscribers
   * @param {string} eventType - Event type
   * @param {*} data - Event data
   */
  notifySubscribers(eventType, data) {
    const eventSubscribers = this.subscribers.get(eventType);
    if (!eventSubscribers) return;

    setTimeout(() => {
      eventSubscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[AuditStream] Subscriber callback error:', error);
        }
      });
    }, 0);
  }

  /**
   * Cleanup old events
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of events cleaned up
   */
  cleanupOldEvents(olderThan = 30 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleaned = 0;

    for (const [id, event] of this.events) {
      if (event.timestamp < cutoff) {
        this.events.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveEvents();
    }

    return cleaned;
  }

  /**
   * Export events
   * @param {Object} options - Export options
   * @returns {Object} Exported events
   */
  exportEvents(options = {}) {
    const { branchId, startTime, endTime, limit } = options;
    
    let events = this.getAllEvents();
    
    if (branchId) {
      events = events.filter(e => e.branchId === branchId);
    }
    if (startTime) {
      events = events.filter(e => e.timestamp >= startTime);
    }
    if (endTime) {
      events = events.filter(e => e.timestamp <= endTime);
    }
    if (limit) {
      events = events.slice(0, limit);
    }

    return {
      events,
      exportedAt: now(),
      totalEvents: events.length
    };
  }

  /**
   * Import events
   * @param {Object} data - Imported events data
   * @returns {Object} Import result
   */
  importEvents(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.events)) {
        data.events.forEach(event => {
          this.events.set(event.id, event);
        });
      }

      this.saveEvents();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let auditStreamInstance = null;

/**
 * Get the audit stream singleton
 * @returns {AuditStream} Audit stream instance
 */
export function getAuditStream() {
  if (!auditStreamInstance) {
    auditStreamInstance = new AuditStream();
  }
  return auditStreamInstance;
}

/**
 * Reset the audit stream (useful for testing)
 */
export function resetAuditStream() {
  auditStreamInstance = null;
}

/**
 * Convenience function to create an audit event
 * @param {Object} eventData - Event data
 * @returns {Object} Created event
 */
export function createAuditEvent(eventData = {}) {
  const stream = getAuditStream();
  return stream.createEvent(eventData);
}

/**
 * Convenience function to get recent events
 * @param {number} limit - Number of events to return
 * @returns {Array} Array of events
 */
export function getRecentAuditEvents(limit = 100) {
  const stream = getAuditStream();
  return stream.getRecentEvents(limit);
}
