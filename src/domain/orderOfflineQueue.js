// Order Offline Queue
// Manages offline operations and synchronization

import { now } from './dates.js';

const OFFLINE_QUEUE_KEY = 'cafeos_offline_queue';
const SYNC_CONFLICTS_KEY = 'cafeos_sync_conflicts';

/**
 * Operation Types for Offline Queue
 */
export const OPERATION_TYPES = {
  CREATE_ORDER: 'CREATE_ORDER',
  UPDATE_ORDER: 'UPDATE_ORDER',
  DELETE_ORDER: 'DELETE_ORDER',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  MODIFY_ITEM: 'MODIFY_ITEM',
  ADD_PAYMENT: 'ADD_PAYMENT',
  REFUND_PAYMENT: 'REFUND_PAYMENT',
  UPDATE_STATUS: 'UPDATE_STATUS',
  HOLD_ORDER: 'HOLD_ORDER',
  RESUME_ORDER: 'RESUME_ORDER',
  CANCEL_ORDER: 'CANCEL_ORDER',
  VOID_ORDER: 'VOID_ORDER'
};

/**
 * Sync Status
 */
export const SYNC_STATUS = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED',
  CONFLICT: 'CONFLICT'
};

/**
 * Order Offline Queue Manager class
 * Manages offline operations and synchronization
 */
export class OrderOfflineQueueManager {
  constructor() {
    this.queue = [];
    this.conflicts = new Map();
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.loadQueue();
    this.loadConflicts();
    this.setupOnlineListeners();
  }

  /**
   * Setup online/offline event listeners
   */
  setupOnlineListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[OfflineQueue] Back online, starting sync');
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[OfflineQueue] Gone offline');
    });
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Load conflicts from localStorage
   */
  loadConflicts() {
    try {
      const stored = localStorage.getItem(SYNC_CONFLICTS_KEY);
      if (stored) {
        const conflicts = JSON.parse(stored);
        conflicts.forEach(conflict => {
          this.conflicts.set(conflict.id, conflict);
        });
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load conflicts:', error);
    }
  }

  /**
   * Save conflicts to localStorage
   */
  saveConflicts() {
    try {
      const conflicts = Array.from(this.conflicts.values());
      localStorage.setItem(SYNC_CONFLICTS_KEY, JSON.stringify(conflicts));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save conflicts:', error);
    }
  }

  /**
   * Add operation to queue
   * @param {string} type - Operation type
   * @param {Object} data - Operation data
   * @param {string} orderId - Related order ID
   * @returns {Object} Queued operation
   */
  addOperation(type, data = {}, orderId = null) {
    const operation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      orderId,
      status: SYNC_STATUS.PENDING,
      createdAt: now(),
      retryCount: 0,
      lastAttempt: null,
      error: null
    };

    this.queue.push(operation);
    this.saveQueue();

    console.log('[OfflineQueue] Operation queued:', operation.type, operation.id);

    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.startSync();
    }

    return operation;
  }

  /**
   * Start synchronization process
   */
  async startSync() {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log('[OfflineQueue] Starting sync...');

    try {
      const pendingOps = this.queue.filter(op => op.status === SYNC_STATUS.PENDING);

      for (const operation of pendingOps) {
        await this.syncOperation(operation);
      }

      console.log('[OfflineQueue] Sync completed');
    } catch (error) {
      console.error('[OfflineQueue] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single operation
   * @param {Object} operation - Operation to sync
   */
  async syncOperation(operation) {
    operation.status = SYNC_STATUS.SYNCING;
    operation.lastAttempt = now();
    this.saveQueue();

    try {
      // Execute the operation (would call API in real system)
      const result = await this.executeOperation(operation);

      if (result.success) {
        operation.status = SYNC_STATUS.SYNCED;
        operation.syncedAt = now();
      } else {
        operation.status = SYNC_STATUS.FAILED;
        operation.error = result.error;
        operation.retryCount++;
      }

      this.saveQueue();
    } catch (error) {
      operation.status = SYNC_STATUS.FAILED;
      operation.error = error.message;
      operation.retryCount++;
      this.saveQueue();

      // Create conflict if this looks like a data conflict
      if (error.message.includes('conflict') || error.message.includes('version')) {
        this.createConflict(operation, error);
      }
    }
  }

  /**
   * Execute an operation (placeholder for API calls)
   * @param {Object} operation - Operation to execute
   * @returns {Object} Execution result
   */
  async executeOperation(operation) {
    // This would integrate with your backend API
    console.log('[OfflineQueue] Executing operation:', operation.type, operation.data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // In a real system, this would make actual API calls
    // For now, we'll assume success
    return { success: true };
  }

  /**
   * Create a sync conflict
   * @param {Object} operation - Failed operation
   * @param {Error} error - Error that caused the conflict
   */
  createConflict(operation, error) {
    const conflict = {
      id: `conf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operationId: operation.id,
      operationType: operation.type,
      operationData: operation.data,
      orderId: operation.orderId,
      error: error.message,
      createdAt: now(),
      status: 'OPEN',
      resolution: null,
      resolvedAt: null
    };

    this.conflicts.set(conflict.id, conflict);
    this.saveConflicts();

    console.log('[OfflineQueue] Conflict created:', conflict.id);

    // Notify UI of conflict
    window.dispatchEvent(new CustomEvent('syncConflict', {
      detail: { conflict }
    }));
  }

  /**
   * Resolve a conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} resolution - Resolution action ('retry', 'discard', 'manual')
   * @param {Object} resolutionData - Data for manual resolution
   * @returns {Object} Resolution result
   */
  resolveConflict(conflictId, resolution, resolutionData = {}) {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      return { success: false, reason: 'Conflict not found' };
    }

    const operation = this.queue.find(op => op.id === conflict.operationId);
    if (!operation) {
      return { success: false, reason: 'Operation not found' };
    }

    switch (resolution) {
      case 'retry':
        operation.status = SYNC_STATUS.PENDING;
        operation.retryCount = 0;
        operation.error = null;
        break;

      case 'discard':
        // Remove operation from queue
        this.queue = this.queue.filter(op => op.id !== operation.id);
        break;

      case 'manual':
        // Apply manual resolution data
        operation.data = resolutionData;
        operation.status = SYNC_STATUS.PENDING;
        operation.retryCount = 0;
        operation.error = null;
        break;

      default:
        return { success: false, reason: 'Invalid resolution' };
    }

    conflict.status = 'RESOLVED';
    conflict.resolution = resolution;
    conflict.resolvedAt = now();
    this.conflicts.delete(conflictId);

    this.saveQueue();
    this.saveConflicts();

    // Retry sync if we have pending operations
    if (resolution !== 'discard' && this.isOnline) {
      this.startSync();
    }

    return { success: true };
  }

  /**
   * Get queue status
   * @returns {Object} Queue status
   */
  getQueueStatus() {
    const pending = this.queue.filter(op => op.status === SYNC_STATUS.PENDING).length;
    const syncing = this.queue.filter(op => op.status === SYNC_STATUS.SYNCING).length;
    const synced = this.queue.filter(op => op.status === SYNC_STATUS.SYNCED).length;
    const failed = this.queue.filter(op => op.status === SYNC_STATUS.FAILED).length;

    return {
      total: this.queue.length,
      pending,
      syncing,
      synced,
      failed,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      conflicts: this.conflicts.size
    };
  }

  /**
   * Get operations by order ID
   * @param {string} orderId - Order ID
   * @returns {Array} Array of operations
   */
  getOperationsByOrder(orderId) {
    return this.queue.filter(op => op.orderId === orderId);
  }

  /**
   * Get operations by status
   * @param {string} status - Sync status
   * @returns {Array} Array of operations
   */
  getOperationsByStatus(status) {
    return this.queue.filter(op => op.status === status);
  }

  /**
   * Get failed operations
   * @returns {Array} Array of failed operations
   */
  getFailedOperations() {
    return this.getOperationsByStatus(SYNC_STATUS.FAILED);
  }

  /**
   * Retry failed operations
   */
  retryFailedOperations() {
    const failedOps = this.getFailedOperations();
    failedOps.forEach(op => {
      op.status = SYNC_STATUS.PENDING;
      op.retryCount = 0;
      op.error = null;
    });
    this.saveQueue();

    if (this.isOnline) {
      this.startSync();
    }
  }

  /**
   * Clear synced operations
   * @param {number} olderThan - Clear operations older than this many milliseconds
   */
  clearSyncedOperations(olderThan = 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    const beforeCount = this.queue.length;

    this.queue = this.queue.filter(op => {
      if (op.status === SYNC_STATUS.SYNCED) {
        return op.syncedAt > cutoff;
      }
      return true;
    });

    const cleared = beforeCount - this.queue.length;
    if (cleared > 0) {
      this.saveQueue();
      console.log(`[OfflineQueue] Cleared ${cleared} synced operations`);
    }
  }

  /**
   * Get all conflicts
   * @returns {Array} Array of conflicts
   */
  getConflicts() {
    return Array.from(this.conflicts.values());
  }

  /**
   * Get conflict by ID
   * @param {string} conflictId - Conflict ID
   * @returns {Object|null} Conflict or null
   */
  getConflict(conflictId) {
    return this.conflicts.get(conflictId) || null;
  }

  /**
   * Get conflicts by order ID
   * @param {string} orderId - Order ID
   * @returns {Array} Array of conflicts
   */
  getConflictsByOrder(orderId) {
    return Array.from(this.conflicts.values()).filter(conf => conf.orderId === orderId);
  }

  /**
   * Clear all queue data (use with caution)
   */
  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Clear all conflicts
   */
  clearConflicts() {
    this.conflicts.clear();
    this.saveConflicts();
  }

  /**
   * Export queue for backup
   * @returns {Object} Exported queue
   */
  exportQueue() {
    return {
      queue: this.queue,
      conflicts: Array.from(this.conflicts.values()),
      exportedAt: now()
    };
  }

  /**
   * Import queue from backup
   * @param {Object} data - Imported queue data
   * @returns {Object} Import result
   */
  importQueue(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.queue)) {
        this.queue = data.queue;
      }

      if (Array.isArray(data.conflicts)) {
        data.conflicts.forEach(conflict => {
          this.conflicts.set(conflict.id, conflict);
        });
      }

      this.saveQueue();
      this.saveConflicts();

      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let queueManagerInstance = null;

/**
 * Get the offline queue manager singleton
 * @returns {OrderOfflineQueueManager} Queue manager instance
 */
export function getOrderOfflineQueueManager() {
  if (!queueManagerInstance) {
    queueManagerInstance = new OrderOfflineQueueManager();
  }
  return queueManagerInstance;
}

/**
 * Reset the queue manager (useful for testing)
 */
export function resetOrderOfflineQueueManager() {
  queueManagerInstance = null;
}

/**
 * Convenience function to add operation to queue
 * @param {string} type - Operation type
 * @param {Object} data - Operation data
 * @param {string} orderId - Order ID
 * @returns {Object} Queued operation
 */
export function queueOfflineOperation(type, data = {}, orderId = null) {
  const manager = getOrderOfflineQueueManager();
  return manager.addOperation(type, data, orderId);
}
