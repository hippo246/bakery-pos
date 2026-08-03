// Provider Event Manager
// Manages events for all cloud storage provider operations

class ProviderEventManager {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 500;
    this.eventQueue = [];
    this.isProcessing = false;
  }

  /**
   * Event types for provider operations
   */
  static EventTypes = {
    // Connection events
    PROVIDER_CONNECTED: 'provider.connected',
    PROVIDER_DISCONNECTED: 'provider.disconnected',
    PROVIDER_AUTHENTICATED: 'provider.authenticated',
    PROVIDER_AUTH_FAILED: 'provider.auth_failed',
    PROVIDER_CONNECTION_TEST: 'provider.connection_test',

    // File operation events
    FILE_UPLOAD_START: 'file.upload_start',
    FILE_UPLOAD_PROGRESS: 'file.upload_progress',
    FILE_UPLOAD_COMPLETE: 'file.upload_complete',
    FILE_UPLOAD_FAILED: 'file.upload_failed',

    FILE_DOWNLOAD_START: 'file.download_start',
    FILE_DOWNLOAD_PROGRESS: 'file.download_progress',
    FILE_DOWNLOAD_COMPLETE: 'file.download_complete',
    FILE_DOWNLOAD_FAILED: 'file.download_failed',

    FILE_DELETE_START: 'file.delete_start',
    FILE_DELETE_COMPLETE: 'file.delete_complete',
    FILE_DELETE_FAILED: 'file.delete_failed',

    FILE_RENAME_START: 'file.rename_start',
    FILE_RENAME_COMPLETE: 'file.rename_complete',
    FILE_RENAME_FAILED: 'file.rename_failed',

    FILE_MOVE_START: 'file.move_start',
    FILE_MOVE_COMPLETE: 'file.move_complete',
    FILE_MOVE_FAILED: 'file.move_failed',

    FILE_COPY_START: 'file.copy_start',
    FILE_COPY_COMPLETE: 'file.copy_complete',
    FILE_COPY_FAILED: 'file.copy_failed',

    FILE_LIST_START: 'file.list_start',
    FILE_LIST_COMPLETE: 'file.list_complete',
    FILE_LIST_FAILED: 'file.list_failed',

    FILE_METADATA_START: 'file.metadata_start',
    FILE_METADATA_COMPLETE: 'file.metadata_complete',
    FILE_METADATA_FAILED: 'file.metadata_failed',

    // Provider switch events
    PROVIDER_SWITCH_START: 'provider.switch_start',
    PROVIDER_SWITCH_PROGRESS: 'provider.switch_progress',
    PROVIDER_SWITCH_COMPLETE: 'provider.switch_complete',
    PROVIDER_SWITCH_FAILED: 'provider.switch_failed',

    // Health events
    PROVIDER_HEALTH_CHECK: 'provider.health_check',
    PROVIDER_HEALTH_ALERT: 'provider.health_alert',

    // Error events
    PROVIDER_ERROR: 'provider.error',
    PROVIDER_WARNING: 'provider.warning'
  };

  /**
   * Subscribe to an event type
   * @param {string} eventType - Event type to subscribe to
   * @param {function} listener - Event listener function
   * @returns {function} Unsubscribe function
   */
  on(eventType, listener) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(listener);

    return () => this.off(eventType, listener);
  }

  /**
   * Unsubscribe from an event type
   * @param {string} eventType - Event type to unsubscribe from
   * @param {function} listener - Event listener function
   */
  off(eventType, listener) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  /**
   * Subscribe to all events
   * @param {function} listener - Event listener function
   * @returns {function} Unsubscribe function
   */
  onAny(listener) {
    return this.on('*', listener);
  }

  /**
   * Emit an event
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  emit(eventType, data = {}) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    // Add to history
    this.addToHistory(event);

    // Notify specific listeners
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        this.safeExecute(listener, event);
      });
    }

    // Notify wildcard listeners
    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(listener => {
        this.safeExecute(listener, event);
      });
    }

    console.log(`[ProviderEventManager] ${eventType}:`, data);
  }

  /**
   * Safely execute a listener function
   * @param {function} listener - Listener function
   * @param {object} event - Event object
   */
  safeExecute(listener, event) {
    try {
      listener(event);
    } catch (error) {
      console.error('[ProviderEventManager] Error in event listener:', error);
    }
  }

  /**
   * Generate a unique event ID
   * @returns {string} Event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event to history
   * @param {object} event - Event object
   */
  addToHistory(event) {
    this.eventHistory.push(event);

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   * @param {object} filters - Filters to apply
   * @returns {array} Filtered event history
   */
  getHistory(filters = {}) {
    let history = [...this.eventHistory];

    if (filters.eventType) {
      history = history.filter(e => e.type === filters.eventType);
    }

    if (filters.providerId) {
      history = history.filter(e => e.data.providerId === filters.providerId);
    }

    if (filters.since) {
      history = history.filter(e => new Date(e.timestamp) >= new Date(filters.since));
    }

    if (filters.until) {
      history = history.filter(e => new Date(e.timestamp) <= new Date(filters.until));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Clear event history
   * @param {object} filters - Optional filters to clear specific events
   */
  clearHistory(filters = {}) {
    if (Object.keys(filters).length === 0) {
      this.eventHistory = [];
    } else {
      this.eventHistory = this.eventHistory.filter(event => {
        if (filters.eventType && event.type === filters.eventType) return false;
        if (filters.providerId && event.data.providerId === filters.providerId) return false;
        return true;
      });
    }
  }

  /**
   * Get event statistics
   * @returns {object} Event statistics
   */
  getStatistics() {
    const stats = {
      totalEvents: this.eventHistory.length,
      byType: {},
      byProvider: {},
      recent: this.eventHistory.slice(-10)
    };

    this.eventHistory.forEach(event => {
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;

      // Count by provider
      if (event.data.providerId) {
        stats.byProvider[event.data.providerId] = (stats.byProvider[event.data.providerId] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Queue an event for later processing
   * @param {string} eventType - Event type
   * @param {object} data - Event data
   */
  queue(eventType, data) {
    this.eventQueue.push({ eventType, data });
  }

  /**
   * Process queued events
   */
  processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    while (this.eventQueue.length > 0) {
      const { eventType, data } = this.eventQueue.shift();
      this.emit(eventType, data);
    }
    this.isProcessing = false;
  }

  /**
   * Clear the event queue
   */
  clearQueue() {
    this.eventQueue = [];
  }

  /**
   * Get all active listeners
   * @returns {object} Active listeners by event type
   */
  getListeners() {
    const result = {};
    for (const [eventType, listeners] of this.listeners.entries()) {
      result[eventType] = listeners.size;
    }
    return result;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.listeners.clear();
  }

  /**
   * Destroy the event manager
   */
  destroy() {
    this.removeAllListeners();
    this.clearHistory();
    this.clearQueue();
    console.log('[ProviderEventManager] Destroyed');
  }
}

// Singleton instance
let eventManagerInstance = null;

/**
 * Get the singleton event manager instance
 * @returns {ProviderEventManager} Event manager instance
 */
export function getProviderEventManager() {
  if (!eventManagerInstance) {
    eventManagerInstance = new ProviderEventManager();
  }
  return eventManagerInstance;
}

export default ProviderEventManager;
