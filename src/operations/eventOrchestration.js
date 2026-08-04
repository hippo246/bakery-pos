// Event Orchestration
// Cross-module event system allowing any module to trigger another

import { now } from '../domain/dates.js';

const EVENTS_KEY = 'cafeos_events';
const EVENT_SUBSCRIPTIONS_KEY = 'cafeos_event_subscriptions';

/**
 * Event Source Modules
 */
export const EVENT_SOURCES = {
  ORDERS: 'ORDERS',
  KITCHEN: 'KITCHEN',
  TABLES: 'TABLES',
  RESERVATIONS: 'RESERVATIONS',
  CRM: 'CRM',
  INVENTORY: 'INVENTORY',
  DASHBOARD: 'DASHBOARD',
  PAYMENTS: 'PAYMENTS',
  WORKFLOW: 'WORKFLOW',
  STAFF: 'STAFF',
  DOCUMENTS: 'DOCUMENTS',
  REPORTS: 'REPORTS',
  HEALTH: 'HEALTH',
  CLOUD: 'CLOUD',
  SUPPORT: 'SUPPORT',
  PLUGINS: 'PLUGINS',
  OPERATIONS: 'OPERATIONS',
  SYSTEM: 'SYSTEM'
};

/**
 * Event Orchestration class
 * Central event bus for cross-module communication
 */
export class EventOrchestration {
  constructor() {
    this.events = new Map();
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
    this.loadEvents();
    this.loadSubscriptions();
  }

  /**
   * Load events from localStorage
   */
  loadEvents() {
    try {
      const stored = localStorage.getItem(EVENTS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.events) {
          data.events.forEach(event => {
            this.events.set(event.id, event);
          });
        }
      }
    } catch (error) {
      console.error('[EventOrchestration] Failed to load events:', error);
    }
  }

  /**
   * Save events to localStorage
   */
  saveEvents() {
    try {
      const events = Array.from(this.events.values());
      localStorage.setItem(EVENTS_KEY, JSON.stringify({ events }));
    } catch (error) {
      console.error('[EventOrchestration] Failed to save events:', error);
    }
  }

  /**
   * Load subscriptions from localStorage
   */
  loadSubscriptions() {
    try {
      const stored = localStorage.getItem(EVENT_SUBSCRIPTIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.subscriptions) {
          data.subscriptions.forEach(sub => {
            this.subscriptions.set(sub.id, sub);
          });
        }
      }
    } catch (error) {
      console.error('[EventOrchestration] Failed to load subscriptions:', error);
    }
  }

  /**
   * Save subscriptions to localStorage
   */
  saveSubscriptions() {
    try {
      const subscriptions = Array.from(this.subscriptions.values());
      localStorage.setItem(EVENT_SUBSCRIPTIONS_KEY, JSON.stringify({ subscriptions }));
    } catch (error) {
      console.error('[EventOrchestration] Failed to save subscriptions:', error);
    }
  }

  /**
   * Emit an event
   * @param {Object} eventData - Event data
   * @returns {Object} Emitted event
   */
  emit(eventData) {
    const event = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Source
      source: eventData.source || EVENT_SOURCES.SYSTEM,
      sourceModule: eventData.sourceModule || null,
      
      // Event type
      type: eventData.type || 'GENERIC',
      subtype: eventData.subtype || null,
      
      // Data
      payload: eventData.payload || {},
      metadata: eventData.metadata || {},
      
      // References
      orderId: eventData.orderId || null,
      paymentId: eventData.paymentId || null,
      kitchenOrderId: eventData.kitchenOrderId || null,
      reservationId: eventData.reservationId || null,
      customerId: eventData.customerId || null,
      staffId: eventData.staffId || null,
      tableId: eventData.tableId || null,
      branchId: eventData.branchId || null,
      workflowId: eventData.workflowId || null,
      
      // Execution
      correlationId: eventData.correlationId || null,
      causationId: eventData.causationId || null,
      
      // Timestamps
      emittedAt: now(),
      processedAt: null,
      completedAt: null
    };

    this.events.set(event.id, event);
    this.saveEvents();

    // Process event
    this.processEvent(event);

    return event;
  }

  /**
   * Process an event
   * @param {Object} event - Event to process
   */
  processEvent(event) {
    event.processedAt = now();
    this.events.set(event.id, event);
    this.saveEvents();

    // Find matching subscriptions
    const matchingSubscriptions = this.findMatchingSubscriptions(event);

    // Execute handlers
    matchingSubscriptions.forEach(subscription => {
      this.executeSubscription(subscription, event);
    });
  }

  /**
   * Find matching subscriptions for an event
   * @param {Object} event - Event
   * @returns {Array} Matching subscriptions
   */
  findMatchingSubscriptions(event) {
    return Array.from(this.subscriptions.values()).filter(sub => {
      // Check source
      if (sub.source && sub.source !== event.source) return false;
      
      // Check type
      if (sub.eventType && sub.eventType !== event.type) return false;
      
      // Check subtype
      if (sub.eventSubtype && sub.eventSubtype !== event.subtype) return false;
      
      // Check if subscription is active
      if (!sub.active) return false;
      
      // Check branch filter
      if (sub.branchId && sub.branchId !== event.branchId) return false;
      
      return true;
    });
  }

  /**
   * Execute a subscription handler
   * @param {Object} subscription - Subscription
   * @param {Object} event - Event
   */
  executeSubscription(subscription, event) {
    const handler = this.eventHandlers.get(subscription.handlerId);
    
    if (handler && typeof handler === 'function') {
      try {
        handler(event, subscription);
      } catch (error) {
        console.error('[EventOrchestration] Handler execution error:', error);
      }
    }
  }

  /**
   * Subscribe to events
   * @param {Object} subscriptionData - Subscription data
   * @param {Function} handler - Handler function
   * @returns {string} Subscription ID
   */
  subscribe(subscriptionData, handler) {
    const subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Filter
      source: subscriptionData.source || null,
      eventType: subscriptionData.eventType || null,
      eventSubtype: subscriptionData.eventSubtype || null,
      branchId: subscriptionData.branchId || null,
      
      // Handler
      handlerId: `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      
      // Metadata
      metadata: subscriptionData.metadata || {},
      
      // Status
      active: subscriptionData.active !== false,
      createdAt: now(),
      createdBy: subscriptionData.createdBy || null
    };

    this.subscriptions.set(subscription.id, subscription);
    this.eventHandlers.set(subscription.handlerId, handler);
    this.saveSubscriptions();

    return subscription.id;
  }

  /**
   * Unsubscribe from events
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Whether unsubscription was successful
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    this.subscriptions.delete(subscriptionId);
    this.eventHandlers.delete(subscription.handlerId);
    this.saveSubscriptions();

    return true;
  }

  /**
   * Activate subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Whether activation was successful
   */
  activateSubscription(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.active = true;
    this.subscriptions.set(subscriptionId, subscription);
    this.saveSubscriptions();

    return true;
  }

  /**
   * Deactivate subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {boolean} Whether deactivation was successful
   */
  deactivateSubscription(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    subscription.active = false;
    this.subscriptions.set(subscriptionId, subscription);
    this.saveSubscriptions();

    return true;
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
   * Get events by source
   * @param {string} source - Event source
   * @returns {Array} Array of events
   */
  getEventsBySource(source) {
    return this.getAllEvents().filter(e => e.source === source);
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
   * Get events by correlation ID
   * @param {string} correlationId - Correlation ID
   * @returns {Array} Array of events
   */
  getEventsByCorrelationId(correlationId) {
    return this.getAllEvents().filter(e => e.correlationId === correlationId);
  }

  /**
   * Get recent events
   * @param {number} limit - Number of events to return
   * @returns {Array} Array of events
   */
  getRecentEvents(limit = 100) {
    return this.getAllEvents()
      .sort((a, b) => b.emittedAt - a.emittedAt)
      .slice(0, limit);
  }

  /**
   * Get all subscriptions
   * @returns {Array} Array of subscriptions
   */
  getAllSubscriptions() {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get active subscriptions
   * @returns {Array} Array of active subscriptions
   */
  getActiveSubscriptions() {
    return this.getAllSubscriptions().filter(s => s.active);
  }

  /**
   * Get subscriptions by source
   * @param {string} source - Event source
   * @returns {Array} Array of subscriptions
   */
  getSubscriptionsBySource(source) {
    return this.getAllSubscriptions().filter(s => s.source === source);
  }

  /**
   * Get event statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const events = this.getAllEvents();
    const subscriptions = this.getAllSubscriptions();

    return {
      totalEvents: events.length,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: subscriptions.filter(s => s.active).length,
      eventsBySource: events.reduce((acc, e) => {
        acc[e.source] = (acc[e.source] || 0) + 1;
        return acc;
      }, {}),
      eventsByType: events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      subscriptionsBySource: subscriptions.reduce((acc, s) => {
        if (s.source) {
          acc[s.source] = (acc[s.source] || 0) + 1;
        }
        return acc;
      }, {})
    };
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
      if (event.emittedAt && event.emittedAt < cutoff) {
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
    const { source, type, startTime, endTime, limit } = options;
    
    let events = this.getAllEvents();
    
    if (source) {
      events = events.filter(e => e.source === source);
    }
    if (type) {
      events = events.filter(e => e.type === type);
    }
    if (startTime) {
      events = events.filter(e => e.emittedAt >= startTime);
    }
    if (endTime) {
      events = events.filter(e => e.emittedAt <= endTime);
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
let eventOrchestrationInstance = null;

/**
 * Get the event orchestration singleton
 * @returns {EventOrchestration} Event orchestration instance
 */
export function getEventOrchestration() {
  if (!eventOrchestrationInstance) {
    eventOrchestrationInstance = new EventOrchestration();
  }
  return eventOrchestrationInstance;
}

/**
 * Reset the event orchestration (useful for testing)
 */
export function resetEventOrchestration() {
  eventOrchestrationInstance = null;
}

/**
 * Convenience function to emit an event
 * @param {Object} eventData - Event data
 * @returns {Object} Emitted event
 */
export function emitEvent(eventData = {}) {
  const orchestration = getEventOrchestration();
  return orchestration.emit(eventData);
}

/**
 * Convenience function to subscribe to events
 * @param {Object} subscriptionData - Subscription data
 * @param {Function} handler - Handler function
 * @returns {string} Subscription ID
 */
export function subscribeToEvents(subscriptionData, handler) {
  const orchestration = getEventOrchestration();
  return orchestration.subscribe(subscriptionData, handler);
}
