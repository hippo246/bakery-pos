// Order Recovery System
// Handles crash recovery and offline order restoration

import { normalizeOrder, createOrder } from './orderModel.js';
import { now } from './dates.js';

const RECOVERY_KEY = 'cafeos_order_recovery';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

/**
 * Order Recovery Manager class
 * Manages order recovery for crash and offline scenarios
 */
export class OrderRecoveryManager {
  constructor() {
    this.currentOrder = null;
    this.autoSaveTimer = null;
    this.isOnline = navigator.onLine;
    this.pendingOperations = [];
    this.setupOnlineListeners();
    this.loadRecoveryData();
  }

  /**
   * Setup online/offline event listeners
   */
  setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleReconnect();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleDisconnect();
    });

    window.addEventListener('beforeunload', () => {
      this.saveRecoveryData();
    });
  }

  /**
   * Handle reconnection to network
   */
  async handleReconnect() {
    console.log('[OrderRecovery] Back online, processing pending operations');
    await this.processPendingOperations();
  }

  /**
   * Handle disconnection from network
   */
  handleDisconnect() {
    console.log('[OrderRecovery] Gone offline, enabling offline mode');
  }

  /**
   * Load recovery data from localStorage
   */
  loadRecoveryData() {
    try {
      const stored = localStorage.getItem(RECOVERY_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.order) {
          this.currentOrder = normalizeOrder(data.order);
          console.log('[OrderRecovery] Loaded recovery data for order:', this.currentOrder?.id);
        }
        if (data.pendingOperations) {
          this.pendingOperations = data.pendingOperations;
        }
      }
    } catch (error) {
      console.error('[OrderRecovery] Failed to load recovery data:', error);
    }
  }

  /**
   * Save recovery data to localStorage
   */
  saveRecoveryData() {
    try {
      const data = {
        order: this.currentOrder,
        pendingOperations: this.pendingOperations,
        savedAt: now()
      };
      localStorage.setItem(RECOVERY_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[OrderRecovery] Failed to save recovery data:', error);
    }
  }

  /**
   * Clear recovery data
   */
  clearRecoveryData() {
    try {
      localStorage.removeItem(RECOVERY_KEY);
      this.currentOrder = null;
      this.pendingOperations = [];
      this.stopAutoSave();
    } catch (error) {
      console.error('[OrderRecovery] Failed to clear recovery data:', error);
    }
  }

  /**
   * Set current order for recovery
   * @param {Order} order - Current order being worked on
   */
  setCurrentOrder(order) {
    this.currentOrder = normalizeOrder(order);
    this.saveRecoveryData();
    this.startAutoSave();
  }

  /**
   * Get current order from recovery
   * @returns {Order|null} Recovered order or null
   */
  getCurrentOrder() {
    return this.currentOrder;
  }

  /**
   * Check if there's recoverable order data
   * @returns {boolean} Whether recovery data exists
   */
  hasRecoveryData() {
    return this.currentOrder !== null;
  }

  /**
   * Start auto-save timer
   */
  startAutoSave() {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.saveRecoveryData();
    }, AUTO_SAVE_INTERVAL);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Add pending operation for offline queue
   * @param {Object} operation - Operation to queue
   */
  addPendingOperation(operation) {
    this.pendingOperations.push({
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now(),
      synced: false
    });
    this.saveRecoveryData();
  }

  /**
   * Process pending operations when back online
   */
  async processPendingOperations() {
    if (this.pendingOperations.length === 0) return;

    console.log(`[OrderRecovery] Processing ${this.pendingOperations.length} pending operations`);

    for (const operation of this.pendingOperations) {
      try {
        await this.executeOperation(operation);
        operation.synced = true;
        operation.syncedAt = now();
      } catch (error) {
        console.error('[OrderRecovery] Failed to execute operation:', operation, error);
        operation.error = error.message;
      }
    }

    // Remove successfully synced operations
    this.pendingOperations = this.pendingOperations.filter(op => !op.synced);
    this.saveRecoveryData();
  }

  /**
   * Execute a pending operation
   * @param {Object} operation - Operation to execute
   */
  async executeOperation(operation) {
    // This would integrate with your sync/cloud system
    // For now, it's a placeholder that would call the appropriate API
    console.log('[OrderRecovery] Executing operation:', operation.type, operation);
    
    switch (operation.type) {
      case 'CREATE_ORDER':
        // Call API to create order
        break;
      case 'UPDATE_ORDER':
        // Call API to update order
        break;
      case 'DELETE_ORDER':
        // Call API to delete order
        break;
      case 'ADD_PAYMENT':
        // Call API to add payment
        break;
      default:
        console.warn('[OrderRecovery] Unknown operation type:', operation.type);
    }
  }

  /**
   * Recover order after crash
   * @returns {Object} Recovery result
   */
  recoverOrder() {
    if (!this.hasRecoveryData()) {
      return {
        success: false,
        reason: 'No recovery data found'
      };
    }

    const order = this.currentOrder;
    const timeSinceSave = now() - (order.updatedAt || order.createdAt);
    const hoursSinceSave = timeSinceSave / (1000 * 60 * 60);

    // Don't recover if data is too old (older than 24 hours)
    if (hoursSinceSave > 24) {
      this.clearRecoveryData();
      return {
        success: false,
        reason: 'Recovery data too old (> 24 hours)'
      };
    }

    return {
      success: true,
      order,
      recoveredAt: now(),
      timeSinceSave,
      pendingOperations: this.pendingOperations.length
    };
  }

  /**
   * Discard recovery data (user chooses not to recover)
   */
  discardRecovery() {
    this.clearRecoveryData();
    return {
      success: true,
      message: 'Recovery data discarded'
    };
  }

  /**
   * Get recovery status
   * @returns {Object} Recovery status information
   */
  getRecoveryStatus() {
    return {
      hasData: this.hasRecoveryData(),
      isOnline: this.isOnline,
      pendingOperations: this.pendingOperations.length,
      currentOrderId: this.currentOrder?.id,
      lastSavedAt: this.currentOrder?.updatedAt,
      autoSaveEnabled: this.autoSaveTimer !== null
    };
  }

  /**
   * Force immediate save
   */
  forceSave() {
    this.saveRecoveryData();
  }

  /**
   * Cleanup old recovery data (call periodically)
   */
  cleanup() {
    const timeSinceSave = this.currentOrder?.updatedAt 
      ? now() - this.currentOrder.updatedAt 
      : Infinity;

    // Clear if older than 48 hours
    if (timeSinceSave > 48 * 60 * 60 * 1000) {
      this.clearRecoveryData();
    }
  }
}

// Singleton instance
let recoveryManagerInstance = null;

/**
 * Get the order recovery manager singleton
 * @returns {OrderRecoveryManager} Recovery manager instance
 */
export function getOrderRecoveryManager() {
  if (!recoveryManagerInstance) {
    recoveryManagerInstance = new OrderRecoveryManager();
  }
  return recoveryManagerInstance;
}

/**
 * Reset the recovery manager (useful for testing)
 */
export function resetOrderRecoveryManager() {
  if (recoveryManagerInstance) {
    recoveryManagerInstance.stopAutoSave();
  }
  recoveryManagerInstance = null;
}

/**
 * Initialize order recovery on app startup
 * @returns {Object} Recovery status
 */
export function initializeOrderRecovery() {
  const manager = getOrderRecoveryManager();
  const status = manager.getRecoveryStatus();

  if (status.hasData) {
    console.log('[OrderRecovery] Recovery data available on startup');
  }

  return status;
}
