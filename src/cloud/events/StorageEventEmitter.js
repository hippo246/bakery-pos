// Storage Event Emitter
// Central event system for storage operations

/**
 * Storage Event Types
 */
export const STORAGE_EVENTS = {
  UPLOAD_STARTED: 'upload_started',
  UPLOAD_FINISHED: 'upload_finished',
  UPLOAD_FAILED: 'upload_failed',
  UPLOAD_PROGRESS: 'upload_progress',
  DOWNLOAD_STARTED: 'download_started',
  DOWNLOAD_FINISHED: 'download_finished',
  DOWNLOAD_FAILED: 'download_failed',
  DOWNLOAD_PROGRESS: 'download_progress',
  DELETE_STARTED: 'delete_started',
  DELETE_FINISHED: 'delete_finished',
  DELETE_FAILED: 'delete_failed',
  PROVIDER_CHANGED: 'provider_changed',
  PROVIDER_CONNECTED: 'provider_connected',
  PROVIDER_DISCONNECTED: 'provider_disconnected',
  CONNECTION_LOST: 'connection_lost',
  CONNECTION_RESTORED: 'connection_restored',
  QUOTA_WARNING: 'quota_warning',
  STORAGE_FULL: 'storage_full',
  HEALTH_CHANGED: 'health_changed',
  AUTHENTICATION_EXPIRED: 'authentication_expired',
  CREDENTIALS_UPDATED: 'credentials_updated',
  SYNC_STARTED: 'sync_started',
  SYNC_FINISHED: 'sync_finished',
  SYNC_FAILED: 'sync_failed'
};

/**
 * Storage Event Emitter
 * Central event emitter for storage operations
 */
class StorageEventEmitter {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Subscribe to event
   * @param {string} eventType 
   * @param {Function} callback 
   * @returns {Function} - Unsubscribe function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => this.off(eventType, callback);
  }

  /**
   * Subscribe to event once
   * @param {string} eventType 
   * @param {Function} callback 
   */
  once(eventType, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(eventType, onceCallback);
    };

    this.on(eventType, onceCallback);
  }

  /**
   * Unsubscribe from event
   * @param {string} eventType 
   * @param {Function} callback 
   */
  off(eventType, callback) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Emit event
   * @param {string} eventType 
   * @param {object} data 
   */
  emit(eventType, data = {}) {
    const callbacks = this.listeners.get(eventType);
    
    if (callbacks) {
      const event = {
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      };

      // Record event history
      this.recordEvent(event);

      // Notify all listeners
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[StorageEventEmitter] Error in callback for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Record event to history
   * @param {object} event 
   */
  recordEvent(event) {
    this.eventHistory.push(event);

    // Limit history size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   * @param {object} options 
   * @returns {Array}
   */
  getHistory(options = {}) {
    let events = this.eventHistory;

    if (options.eventType) {
      events = events.filter(e => e.type === options.eventType);
    }

    if (options.since) {
      const since = new Date(options.since);
      events = events.filter(e => new Date(e.timestamp) >= since);
    }

    if (options.until) {
      const until = new Date(options.until);
      events = events.filter(e => new Date(e.timestamp) <= until);
    }

    if (options.limit) {
      events = events.slice(-options.limit);
    }

    return events;
  }

  /**
   * Clear event history
   * @param {string} eventType 
   */
  clearHistory(eventType) {
    if (eventType) {
      this.eventHistory = this.eventHistory.filter(e => e.type !== eventType);
    } else {
      this.eventHistory = [];
    }
  }

  /**
   * Get listener count for event type
   * @param {string} eventType 
   * @returns {number}
   */
  listenerCount(eventType) {
    const callbacks = this.listeners.get(eventType);
    return callbacks ? callbacks.size : 0;
  }

  /**
   * Get all event types with listeners
   * @returns {Array<string>}
   */
  getEventTypes() {
    return Array.from(this.listeners.keys());
  }

  /**
   * Remove all listeners
   * @param {string} eventType 
   */
  removeAllListeners(eventType) {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }
}

// Singleton instance
const storageEventEmitter = new StorageEventEmitter();

export default storageEventEmitter;
