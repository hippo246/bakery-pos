/**
 * Event Bus
 * Central pub/sub system for live operations events
 */

import { LiveEvent } from './EventTypes.js';

class EventBus {
  constructor() {
    this.subscribers = new Map(); // eventType -> Set of callbacks
    this.categorySubscribers = new Map(); // category -> Set of callbacks
    this.eventHistory = [];
    this.maxHistorySize = 1000;
    this.initialized = false;
    
    // Performance optimization: throttling
    this.throttleMap = new Map(); // eventType -> last publish time
    this.throttleIntervals = {
      high_frequency: 100, // ms for high-frequency events
      medium_frequency: 50, // ms for medium-frequency events
      low_frequency: 0 // no throttling for low-frequency events
    };
    this.highFrequencyEvents = new Set([
      'kitchen.started',
      'kitchen.ready',
      'order.updated',
      'table.occupied'
    ]);
  }

  /**
   * Initialize the event bus
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Subscribe to a specific event type
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    
    this.subscribers.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to an event category
   * @param {string} category - Event category to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToCategory(category, callback) {
    if (!this.categorySubscribers.has(category)) {
      this.categorySubscribers.set(category, new Set());
    }
    
    this.categorySubscribers.get(category).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.categorySubscribers.get(category);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.categorySubscribers.delete(category);
        }
      }
    };
  }

  /**
   * Subscribe to all events
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribeToAll(callback) {
    return this.subscribeToCategory('*', callback);
  }

  /**
   * Check if event should be throttled
   * @param {string} eventType - Event type to check
   * @returns {boolean}
   */
  shouldThrottle(eventType) {
    const now = Date.now();
    const lastPublish = this.throttleMap.get(eventType);
    
    if (!lastPublish) {
      this.throttleMap.set(eventType, now);
      return false;
    }

    const throttleInterval = this.highFrequencyEvents.has(eventType)
      ? this.throttleIntervals.high_frequency
      : this.throttleIntervals.medium_frequency;

    if (now - lastPublish < throttleInterval) {
      return true;
    }

    this.throttleMap.set(eventType, now);
    return false;
  }

  /**
   * Publish an event
   * @param {LiveEvent|string} event - Event object or event type
   * @param {Object} data - Event data (if event is string)
   * @param {Object} metadata - Event metadata
   */
  publish(event, data = null, metadata = {}) {
    let liveEvent;

    if (typeof event === 'string') {
      liveEvent = new LiveEvent(event, data, metadata);
    } else if (event instanceof LiveEvent) {
      liveEvent = event;
    } else {
      console.error('Invalid event type:', event);
      return;
    }

    // Check throttling for high-frequency events
    if (this.shouldThrottle(liveEvent.type)) {
      return; // Skip this event due to throttling
    }

    // Add to history
    this.addToHistory(liveEvent);

    // Notify type-specific subscribers
    const typeCallbacks = this.subscribers.get(liveEvent.type);
    if (typeCallbacks) {
      typeCallbacks.forEach(callback => {
        try {
          callback(liveEvent);
        } catch (error) {
          console.error(`Error in event callback for ${liveEvent.type}:`, error);
        }
      });
    }

    // Notify category subscribers
    const categoryCallbacks = this.categorySubscribers.get(liveEvent.category);
    if (categoryCallbacks) {
      categoryCallbacks.forEach(callback => {
        try {
          callback(liveEvent);
        } catch (error) {
          console.error(`Error in category callback for ${liveEvent.category}:`, error);
        }
      });
    }

    // Notify all-event subscribers
    const allCallbacks = this.categorySubscribers.get('*');
    if (allCallbacks) {
      allCallbacks.forEach(callback => {
        try {
          callback(liveEvent);
        } catch (error) {
          console.error('Error in all-events callback:', error);
        }
      });
    }
  }

  /**
   * Add event to history
   * @param {LiveEvent} event - Event to add
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    
    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   * @param {Object} options - Filter options
   * @returns {Array<LiveEvent>}
   */
  getHistory(options = {}) {
    let events = [...this.eventHistory];

    if (options.category) {
      events = events.filter(e => e.category === options.category);
    }

    if (options.type) {
      events = events.filter(e => e.type === options.type);
    }

    if (options.since) {
      events = events.filter(e => e.timestamp >= options.since);
    }

    if (options.until) {
      events = events.filter(e => e.timestamp <= options.until);
    }

    if (options.limit) {
      events = events.slice(-options.limit);
    }

    return events;
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory = [];
  }

  /**
   * Get subscriber count
   * @returns {Object} Subscriber statistics
   */
  getStats() {
    const typeStats = {};
    this.subscribers.forEach((callbacks, type) => {
      typeStats[type] = callbacks.size;
    });

    const categoryStats = {};
    this.categorySubscribers.forEach((callbacks, category) => {
      categoryStats[category] = callbacks.size;
    });

    return {
      totalTypeSubscribers: Array.from(this.subscribers.values()).reduce((sum, set) => sum + set.size, 0),
      totalCategorySubscribers: Array.from(this.categorySubscribers.values()).reduce((sum, set) => sum + set.size, 0),
      typeSubscribers: typeStats,
      categorySubscribers: categoryStats,
      historySize: this.eventHistory.length
    };
  }

  /**
   * Clear all subscribers
   */
  clearAll() {
    this.subscribers.clear();
    this.categorySubscribers.clear();
    this.eventHistory = [];
    this.throttleMap.clear();
  }
}

// Singleton instance
const eventBus = new EventBus();

export default eventBus;
