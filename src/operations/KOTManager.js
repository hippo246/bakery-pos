// Kitchen Order Ticket (KOT) Manager
// Manages KOT creation, routing, status updates, and persistence

import {
  createKOT,
  updateKOTItemStatus,
  formatKOTForDisplay,
  filterKOTsByStatus,
  filterKOTsByStation,
  sortKOTs,
  KOTStatus,
  KOTPriority,
  KOTItemStatus,
  DEFAULT_KOT_CONFIG
} from '../domain/kotTypes.js';

export class KOTManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_KOT_CONFIG, ...config };
    this.kots = new Map();
    this.storageKey = 'cafeos_kot_manager';
    this.listeners = new Map();
    this.loadState();
  }

  /**
   * Initialize the KOT manager
   */
  async initialize() {
    this.loadState();
    return { success: true };
  }

  /**
   * Create a new KOT from order data
   * @param {object} orderData - Order data from POS
   * @returns {object} KOT creation result
   */
  createKOT(orderData) {
    try {
      console.log('KOTManager.createKOT called with:', orderData);
      const kot = createKOT(orderData, this.config);
      console.log('KOT created:', kot);
      
      this.kots.set(kot.kotId, kot);
      this.saveState();
      console.log('KOT saved to manager, total KOTs:', this.kots.size);
      
      this.emit('kotCreated', kot);
      console.log('kotCreated event emitted');
      
      return { success: true, kot };
    } catch (error) {
      console.error('Failed to create KOT:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get KOT by ID
   * @param {string} kotId - KOT ID
   * @returns {object|null} KOT object
   */
  getKOT(kotId) {
    return this.kots.get(kotId) || null;
  }

  /**
   * Get KOT by order ID
   * @param {string} orderId - Order ID
   * @returns {object|null} KOT object
   */
  getKOTByOrderId(orderId) {
    for (const kot of this.kots.values()) {
      if (kot.orderId === orderId) {
        return kot;
      }
    }
    return null;
  }

  /**
   * Get all KOTs
   * @param {object} filters - Optional filters
   * @returns {Array} Array of KOTs
   */
  getAllKOTs(filters = {}) {
    let kots = Array.from(this.kots.values());

    if (filters.status) {
      kots = filterKOTsByStatus(kots, filters.status);
    }

    if (filters.station) {
      kots = filterKOTsByStation(kots, filters.station);
    }

    if (filters.priority) {
      kots = kots.filter(kot => kot.priority === filters.priority);
    }

    if (filters.terminal) {
      kots = kots.filter(kot => kot.terminal === filters.terminal);
    }

    if (filters.date) {
      const targetDate = new Date(filters.date).toDateString();
      kots = kots.filter(kot => 
        new Date(kot.createdAt).toDateString() === targetDate
      );
    }

    if (filters.since) {
      kots = kots.filter(kot => 
        new Date(kot.createdAt) >= new Date(filters.since)
      );
    }

    // Sort by priority and time
    kots = sortKOTs(kots);

    return kots;
  }

  /**
   * Update KOT item status
   * @param {string} kotId - KOT ID
   * @param {string} kotItemId - KOT item ID
   * @param {string} status - New status
   * @returns {object} Update result
   */
  updateItemStatus(kotId, kotItemId, status) {
    const kot = this.kots.get(kotId);
    
    if (!kot) {
      console.error('KOT not found for updateItemStatus:', kotId);
      return { success: false, error: 'KOT not found' };
    }

    console.log('Updating item status in KOTManager:', kotId, kotItemId, status);
    const updatedKOT = updateKOTItemStatus(kot, kotItemId, status);
    this.kots.set(kotId, updatedKOT);
    this.saveState();
    console.log('Item status updated and saved');

    this.emit('kotItemUpdated', { kotId, kotItemId, status, kot: updatedKOT });
    console.log('kotItemUpdated event emitted');

    return { success: true, kot: updatedKOT };
  }

  /**
   * Update multiple KOT item statuses at once
   * @param {string} kotId - KOT ID
   * @param {Array} updates - Array of {kotItemId, status} objects
   * @returns {object} Update result
   */
  updateMultipleItemStatuses(kotId, updates) {
    const kot = this.kots.get(kotId);
    
    if (!kot) {
      return { success: false, error: 'KOT not found' };
    }

    updates.forEach(update => {
      updateKOTItemStatus(kot, update.kotItemId, update.status);
    });

    this.kots.set(kotId, kot);
    this.saveState();

    this.emit('kotItemsBulkUpdated', { kotId, updates, kot });

    return { success: true, kot };
  }

  /**
   * Update entire KOT status
   * @param {string} kotId - KOT ID
   * @param {string} status - New status
   * @returns {object} Update result
   */
  updateKOTStatus(kotId, status) {
    const kot = this.kots.get(kotId);
    
    if (!kot) {
      return { success: false, error: 'KOT not found' };
    }

    kot.status = status ? status.toLowerCase() : status;
    kot.updatedAt = new Date().toISOString();

    if (kot.items) {
      kot.items = kot.items.map(item => ({
        ...item,
        status: status ? status.toLowerCase() : status
      }));
    }

    if (status === KOTStatus.READY && !kot.actualReadyAt) {
      kot.actualReadyAt = new Date().toISOString();
    }

    this.kots.set(kotId, kot);
    this.saveState();

    this.emit('kotStatusUpdated', { kotId, status, kot });

    return { success: true, kot };
  }

  /**
   * Mark KOT as urgent
   * @param {string} kotId - KOT ID
   * @returns {object} Update result
   */
  markAsUrgent(kotId) {
    const kot = this.kots.get(kotId);
    
    if (!kot) {
      return { success: false, error: 'KOT not found' };
    }

    kot.priority = KOTPriority.URGENT;
    kot.updatedAt = new Date().toISOString();
    this.kots.set(kotId, kot);
    this.saveState();

    this.emit('kotPriorityUpdated', { kotId, priority: KOTPriority.URGENT, kot });

    return { success: true, kot };
  }

  /**
   * Cancel KOT
   * @param {string} kotId - KOT ID
   * @param {string} reason - Cancellation reason
   * @returns {object} Cancellation result
   */
  cancelKOT(kotId, reason = '') {
    const kot = this.kots.get(kotId);
    
    if (!kot) {
      return { success: false, error: 'KOT not found' };
    }

    kot.status = KOTStatus.CANCELLED;
    kot.cancelledAt = new Date().toISOString();
    kot.cancellationReason = reason;
    kot.updatedAt = new Date().toISOString();

    // Cancel all items
    kot.items.forEach(item => {
      item.status = KOTItemStatus.CANCELLED;
    });

    this.kots.set(kotId, kot);
    this.saveState();

    this.emit('kotCancelled', { kotId, reason, kot });

    return { success: true, kot };
  }

  /**
   * Get KOTs for a specific station
   * @param {string} station - Kitchen station
   * @param {object} filters - Additional filters
   * @returns {Array} KOTs for the station
   */
  getKOTsForStation(station, filters = {}) {
    let kots = filterKOTsByStation(this.getAllKOTs(), station);
    
    // Filter out items not belonging to this station
    kots = kots.map(kot => ({
      ...kot,
      items: kot.items.filter(item => item.station === station),
      totalItems: kot.items.filter(item => item.station === station).length
    }));

    // Filter out KOTs with no items for this station
    kots = kots.filter(kot => kot.items.length > 0);

    if (filters.status) {
      kots = kots.filter(kot => kot.status === filters.status);
    }

    return sortKOTs(kots);
  }

  /**
   * Get KOT statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const kots = Array.from(this.kots.values());
    const now = new Date();
    const today = now.toDateString();

    const todayKOTs = kots.filter(kot => 
      new Date(kot.createdAt).toDateString() === today
    );

    const byStatus = {
      pending: kots.filter(kot => kot.status === KOTStatus.PENDING).length,
      preparing: kots.filter(kot => kot.status === KOTStatus.PREPARING).length,
      ready: kots.filter(kot => kot.status === KOTStatus.READY).length,
      served: kots.filter(kot => kot.status === KOTStatus.SERVED).length,
      cancelled: kots.filter(kot => kot.status === KOTStatus.CANCELLED).length
    };

    const byPriority = {
      urgent: kots.filter(kot => kot.priority === KOTPriority.URGENT).length,
      high: kots.filter(kot => kot.priority === KOTPriority.HIGH).length,
      normal: kots.filter(kot => kot.priority === KOTPriority.NORMAL).length,
      low: kots.filter(kot => kot.priority === KOTPriority.LOW).length
    };

    const overdueKOTs = kots.filter(kot => 
      new Date() > new Date(kot.estimatedReadyAt) && 
      kot.status !== KOTStatus.SERVED &&
      kot.status !== KOTStatus.CANCELLED
    ).length;

    const avgPreparationTime = todayKOTs.length > 0
      ? todayKOTs
          .filter(kot => kot.actualReadyAt)
          .reduce((sum, kot) => {
            const actualTime = new Date(kot.actualReadyAt).getTime();
            const createdTime = new Date(kot.createdAt).getTime();
            return sum + (actualTime - createdTime) / 60000;
          }, 0) / todayKOTs.filter(kot => kot.actualReadyAt).length
      : 0;

    return {
      total: kots.length,
      today: todayKOTs.length,
      byStatus,
      byPriority,
      overdue: overdueKOTs,
      avgPreparationTime: Math.round(avgPreparationTime),
      active: byStatus.pending + byStatus.preparing + byStatus.ready
    };
  }

  /**
   * Get KOTs formatted for display
   * @param {object} filters - Optional filters
   * @returns {Array} Formatted KOTs
   */
  getFormattedKOTs(filters = {}) {
    const kots = this.getAllKOTs(filters);
    return kots.map(kot => formatKOTForDisplay(kot));
  }

  /**
   * Archive old KOTs
   * @param {number} daysToKeep - Days to keep KOTs
   * @returns {object} Archive结果
   */
  archiveOldKOTs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let archived = 0;
    for (const [kotId, kot] of this.kots) {
      if (new Date(kot.createdAt) < cutoffDate) {
        this.kots.delete(kotId);
        archived++;
      }
    }

    this.saveState();

    this.emit('kotsArchived', { count: archived, daysToKeep });

    return { success: true, archived };
  }

  /**
   * Clear all KOTs (for testing/reset)
   * @returns {object} Clear result
   */
  clearAllKOTs() {
    const count = this.kots.size;
    this.kots.clear();
    this.saveState();

    this.emit('kotsCleared', { count });

    return { success: true, cleared: count };
  }

  /**
   * Update configuration
   * @param {object} config - New configuration
   * @returns {object} Update result
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.saveState();
    return { success: true, config: this.config };
  }

  /**
   * Get configuration
   * @returns {object} Current configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Subscribe to KOT events
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from KOT events
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in KOT event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        kots: Array.from(this.kots.entries()),
        config: this.config
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      console.log('[KOTManager] State saved successfully. KOT count:', this.kots.size);
    } catch (error) {
      console.error('[KOTManager] Failed to save KOT manager state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      console.log('[KOTManager] Loading state from localStorage:', this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.kots = new Map(parsed.kots || []);
        this.config = { ...DEFAULT_KOT_CONFIG, ...parsed.config };
        console.log('[KOTManager] State loaded successfully. KOT count:', this.kots.size);
      } else {
        console.log('[KOTManager] No existing state found in localStorage');
      }
    } catch (error) {
      console.error('[KOTManager] Failed to load KOT manager state:', error);
      this.kots = new Map();
    }
  }

  /**
   * Destroy the KOT manager
   */
  destroy() {
    this.kots.clear();
    this.listeners.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[KOTManager] Destroyed');
  }
}

// Singleton instance
let kotManagerInstance = null;

/**
 * Get the singleton KOT manager instance
 * @param {object} config - Configuration
 * @returns {KOTManager} KOT manager instance
 */
export function getKOTManager(config = {}) {
  if (!kotManagerInstance) {
    kotManagerInstance = new KOTManager(config);
  }
  return kotManagerInstance;
}

export default KOTManager;
