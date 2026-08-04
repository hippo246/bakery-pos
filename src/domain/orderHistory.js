// Order History Timeline
// Audit trail for order lifecycle events

import { now } from './dates.js';

const ORDER_HISTORY_KEY = 'cafeos_order_history';

/**
 * Order History Event Types
 */
export const HISTORY_EVENT_TYPES = {
  // Order lifecycle
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_MODIFIED: 'ORDER_MODIFIED',
  ORDER_HELD: 'ORDER_HELD',
  ORDER_RESUMED: 'ORDER_RESUMED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_REFUNDED: 'ORDER_REFUNDED',
  ORDER_VOIDED: 'ORDER_VOIDED',
  ORDER_ARCHIVED: 'ORDER_ARCHIVED',
  
  // Item operations
  ITEM_ADDED: 'ITEM_ADDED',
  ITEM_REMOVED: 'ITEM_REMOVED',
  ITEM_MODIFIED: 'ITEM_MODIFIED',
  ITEM_QUANTITY_CHANGED: 'ITEM_QUANTITY_CHANGED',
  
  // Pricing
  DISCOUNT_APPLIED: 'DISCOUNT_APPLIED',
  DISCOUNT_REMOVED: 'DISCOUNT_REMOVED',
  PRICE_OVERRIDE: 'PRICE_OVERRIDE',
  
  // Kitchen operations
  SENT_TO_KITCHEN: 'SENT_TO_KITCHEN',
  KITCHEN_ACCEPTED: 'KITCHEN_ACCEPTED',
  KITCHEN_STARTED: 'KITCHEN_STARTED',
  KITCHEN_COMPLETED: 'KITCHEN_COMPLETED',
  
  // Service operations
  SERVED: 'SERVED',
  TABLE_CLEARED: 'TABLE_CLEARED',
  
  // Payment operations
  PAYMENT_ADDED: 'PAYMENT_ADDED',
  PAYMENT_MODIFIED: 'PAYMENT_MODIFIED',
  PAYMENT_REFUNDED: 'PAYMENT_REFUNDED',
  
  // Customer operations
  CUSTOMER_LINKED: 'CUSTOMER_LINKED',
  CUSTOMER_UNLINKED: 'CUSTOMER_UNLINKED',
  CUSTOMER_MODIFIED: 'CUSTOMER_MODIFIED',
  
  // Table operations
  TABLE_ASSIGNED: 'TABLE_ASSIGNED',
  TABLE_CHANGED: 'TABLE_CHANGED',
  TABLE_RELEASED: 'TABLE_RELEASED',
  
  // Staff operations
  STAFF_ASSIGNED: 'STAFF_ASSIGNED',
  STAFF_CHANGED: 'STAFF_CHANGED',
  
  // Notes
  NOTE_ADDED: 'NOTE_ADDED',
  NOTE_MODIFIED: 'NOTE_MODIFIED',
  NOTE_REMOVED: 'NOTE_REMOVED'
};

/**
 * Order History Manager class
 * Manages order history timeline for audit trail
 */
export class OrderHistoryManager {
  constructor() {
    this.history = new Map(); // orderId -> array of events
    this.loadHistory();
  }

  /**
   * Load history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(ORDER_HISTORY_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([orderId, events]) => {
          this.history.set(orderId, events);
        });
      }
    } catch (error) {
      console.error('[OrderHistoryManager] Failed to load history:', error);
    }
  }

  /**
   * Save history to localStorage
   */
  saveHistory() {
    try {
      const data = Object.fromEntries(this.history);
      localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[OrderHistoryManager] Failed to save history:', error);
    }
  }

  /**
   * Add a history event
   * @param {string} orderId - Order ID
   * @param {string} eventType - Event type from HISTORY_EVENT_TYPES
   * @param {Object} data - Event data
   * @param {string} staffId - Staff ID who performed the action
   * @param {string} terminalId - Terminal ID
   * @returns {Object} Created event
   */
  addEvent(orderId, eventType, data = {}, staffId = null, terminalId = null) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      eventType,
      timestamp: now(),
      staffId,
      terminalId,
      data
    };

    if (!this.history.has(orderId)) {
      this.history.set(orderId, []);
    }

    this.history.get(orderId).push(event);
    this.saveHistory();

    return event;
  }

  /**
   * Get order history
   * @param {string} orderId - Order ID
   * @returns {Array} Array of history events
   */
  getOrderHistory(orderId) {
    return this.history.get(orderId) || [];
  }

  /**
   * Get order history by event type
   * @param {string} orderId - Order ID
   * @param {string} eventType - Event type to filter by
   * @returns {Array} Filtered events
   */
  getEventsByType(orderId, eventType) {
    const events = this.getOrderHistory(orderId);
    return events.filter(event => event.eventType === eventType);
  }

  /**
   * Get order history by time range
   * @param {string} orderId - Order ID
   * @param {number} fromTime - Start timestamp
   * @param {number} toTime - End timestamp
   * @returns {Array} Filtered events
   */
  getEventsByTimeRange(orderId, fromTime, toTime) {
    const events = this.getOrderHistory(orderId);
    return events.filter(event => 
      event.timestamp >= fromTime && event.timestamp <= toTime
    );
  }

  /**
   * Get order history by staff
   * @param {string} orderId - Order ID
   * @param {string} staffId - Staff ID
   * @returns {Array} Filtered events
   */
  getEventsByStaff(orderId, staffId) {
    const events = this.getOrderHistory(orderId);
    return events.filter(event => event.staffId === staffId);
  }

  /**
   * Get order timeline (chronological summary)
   * @param {string} orderId - Order ID
   * @returns {Array} Timeline summary
   */
  getOrderTimeline(orderId) {
    const events = this.getOrderHistory(orderId);
    
    return events.map(event => ({
      timestamp: event.timestamp,
      eventType: event.eventType,
      staffId: event.staffId,
      summary: this.getEventSummary(event)
    })).sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get human-readable event summary
   * @param {Object} event - History event
   * @returns {string} Event summary
   */
  getEventSummary(event) {
    const summaries = {
      ORDER_CREATED: 'Order created',
      ORDER_MODIFIED: 'Order modified',
      ORDER_HELD: 'Order held',
      ORDER_RESUMED: 'Order resumed',
      ORDER_CANCELLED: 'Order cancelled',
      ORDER_REFUNDED: 'Order refunded',
      ORDER_VOIDED: 'Order voided',
      ORDER_ARCHIVED: 'Order archived',
      ITEM_ADDED: `Item added: ${event.data.itemName || 'Unknown'}`,
      ITEM_REMOVED: `Item removed: ${event.data.itemName || 'Unknown'}`,
      ITEM_MODIFIED: `Item modified: ${event.data.itemName || 'Unknown'}`,
      ITEM_QUANTITY_CHANGED: `Quantity changed: ${event.data.itemName || 'Unknown'} (${event.data.oldQty} → ${event.data.newQty})`,
      DISCOUNT_APPLIED: `Discount applied: ${event.data.discountCode || 'Custom'}`,
      DISCOUNT_REMOVED: 'Discount removed',
      PRICE_OVERRIDE: `Price override: ${event.data.itemName || 'Unknown'}`,
      SENT_TO_KITCHEN: 'Sent to kitchen',
      KITCHEN_ACCEPTED: 'Kitchen accepted',
      KITCHEN_STARTED: 'Kitchen started',
      KITCHEN_COMPLETED: 'Kitchen completed',
      SERVED: 'Order served',
      TABLE_CLEARED: 'Table cleared',
      PAYMENT_ADDED: `Payment added: ${event.data.method || 'Unknown'}`,
      PAYMENT_MODIFIED: 'Payment modified',
      PAYMENT_REFUNDED: 'Payment refunded',
      CUSTOMER_LINKED: `Customer linked: ${event.data.customerName || 'Unknown'}`,
      CUSTOMER_UNLINKED: 'Customer unlinked',
      CUSTOMER_MODIFIED: 'Customer modified',
      TABLE_ASSIGNED: `Table assigned: ${event.data.tableId || 'Unknown'}`,
      TABLE_CHANGED: `Table changed: ${event.data.oldTableId || 'Unknown'} → ${event.data.newTableId || 'Unknown'}`,
      TABLE_RELEASED: 'Table released',
      STAFF_ASSIGNED: `Staff assigned: ${event.data.staffName || 'Unknown'}`,
      STAFF_CHANGED: `Staff changed: ${event.data.oldStaffName || 'Unknown'} → ${event.data.newStaffName || 'Unknown'}`,
      NOTE_ADDED: 'Note added',
      NOTE_MODIFIED: 'Note modified',
      NOTE_REMOVED: 'Note removed'
    };

    return summaries[event.eventType] || event.eventType;
  }

  /**
   * Get order statistics from history
   * @param {string} orderId - Order ID
   * @returns {Object} Order statistics
   */
  getOrderStatistics(orderId) {
    const events = this.getOrderHistory(orderId);
    
    const stats = {
      totalEvents: events.length,
      eventsByType: {},
      eventsByStaff: {},
      firstEvent: null,
      lastEvent: null,
      duration: null
    };

    if (events.length === 0) return stats;

    // Count by type and staff
    events.forEach(event => {
      stats.eventsByType[event.eventType] = (stats.eventsByType[event.eventType] || 0) + 1;
      if (event.staffId) {
        stats.eventsByStaff[event.staffId] = (stats.eventsByStaff[event.staffId] || 0) + 1;
      }
    });

    // Time range
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    stats.firstEvent = sortedEvents[0];
    stats.lastEvent = sortedEvents[sortedEvents.length - 1];
    stats.duration = stats.lastEvent.timestamp - stats.firstEvent.timestamp;

    return stats;
  }

  /**
   * Compare two order versions
   * @param {string} orderId - Order ID
   * @param {number} fromTime - From timestamp
   * @param {number} toTime - To timestamp
   * @returns {Object} Comparison result
   */
  compareOrderVersions(orderId, fromTime, toTime) {
    const beforeEvents = this.getEventsByTimeRange(orderId, 0, fromTime);
    const afterEvents = this.getEventsByTimeRange(orderId, fromTime, toTime);

    return {
      before: {
        eventCount: beforeEvents.length,
        lastEvent: beforeEvents[beforeEvents.length - 1] || null
      },
      after: {
        eventCount: afterEvents.length,
        lastEvent: afterEvents[afterEvents.length - 1] || null
      },
      changes: afterEvents.map(event => ({
        eventType: event.eventType,
        timestamp: event.timestamp,
        summary: this.getEventSummary(event)
      }))
    };
  }

  /**
   * Delete order history
   * @param {string} orderId - Order ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteOrderHistory(orderId) {
    const deleted = this.history.delete(orderId);
    if (deleted) {
      this.saveHistory();
    }
    return deleted;
  }

  /**
   * Archive old history (older than specified days)
   * @param {number} days - Age in days
   * @returns {number} Number of orders archived
   */
  archiveOldHistory(days = 90) {
    const cutoff = now() - (days * 24 * 60 * 60 * 1000);
    let archived = 0;

    for (const [orderId, events] of this.history) {
      const lastEvent = events[events.length - 1];
      if (lastEvent && lastEvent.timestamp < cutoff) {
        // In a real system, this would move to a separate archive storage
        this.history.delete(orderId);
        archived++;
      }
    }

    if (archived > 0) {
      this.saveHistory();
    }

    return archived;
  }

  /**
   * Export order history
   * @param {string} orderId - Order ID
   * @returns {Object} Exported history
   */
  exportOrderHistory(orderId) {
    const events = this.getOrderHistory(orderId);
    
    return {
      orderId,
      exportedAt: now(),
      eventCount: events.length,
      timeline: this.getOrderTimeline(orderId),
      statistics: this.getOrderStatistics(orderId),
      events: events
    };
  }

  /**
   * Get all order IDs with history
   * @returns {Array} Array of order IDs
   */
  getOrderIdsWithHistory() {
    return Array.from(this.history.keys());
  }

  /**
   * Clear all history (use with caution)
   */
  clearAllHistory() {
    this.history.clear();
    this.saveHistory();
  }
}

// Singleton instance
let historyManagerInstance = null;

/**
 * Get the order history manager singleton
 * @returns {OrderHistoryManager} History manager instance
 */
export function getOrderHistoryManager() {
  if (!historyManagerInstance) {
    historyManagerInstance = new OrderHistoryManager();
  }
  return historyManagerInstance;
}

/**
 * Reset the history manager (useful for testing)
 */
export function resetOrderHistoryManager() {
  historyManagerInstance = null;
}

/**
 * Convenience function to add common order events
 * @param {string} orderId - Order ID
 * @param {string} eventType - Event type
 * @param {Object} data - Event data
 * @param {string} staffId - Staff ID
 */
export function logOrderEvent(orderId, eventType, data = {}, staffId = null) {
  const manager = getOrderHistoryManager();
  return manager.addEvent(orderId, eventType, data, staffId);
}
