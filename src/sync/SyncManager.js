// Sync Manager
// Orchestration layer that manages sync queue, operations, and policies

import { SyncEngine } from './SyncEngine.js';
import { SyncDirection, SyncStatus, SyncPriority, _SyncModule, _SyncFilter } from './SyncTypes.js';
import _storageEngine from '../cloud/StorageEngine.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';
import { getProviderEventManager } from '../cloud/ProviderEventManager.js';

export class SyncManager {
  constructor() {
    this.syncQueue = [];
    this.activeSyncs = new Map();
    this.syncHistory = [];
    this.syncPolicies = new Map();
    this.storageKey = 'cafeos_sync_manager';
    this.auditLogger = getProviderAuditLogger();
    this.eventManager = getProviderEventManager();
    this.maxQueueSize = 1000;
    this.maxHistorySize = 500;
    this.isProcessing = false;
    this.syncFilters = {
      wifiOnly: false,
      meteredNetworks: false,
      manualSync: false,
      backgroundOnly: false
    };
    this.loadState();
  }

  /**
   * Queue a sync operation
   * @param {object} config - Sync configuration
   * @returns {object} Queue result
   */
  async queueSync(config = {}) {
    try {
      const syncConfig = {
        module: config.module,
        direction: config.direction || SyncDirection.UPLOAD,
        data: config.data,
        priority: config.priority || SyncPriority.NORMAL,
        operator: config.operator || 'system',
        compressionEnabled: config.compressionEnabled !== false,
        verifyAfterTransfer: config.verifyAfterTransfer !== false
      };

      // Check if similar item already exists in queue
      const existingItem = this.syncQueue.find(item =>
        item.module === syncConfig.module &&
        item.status === SyncStatus.PENDING &&
        this.isDuplicateData(item.data, syncConfig.data)
      );

      if (existingItem) {
        return { success: false, error: 'Duplicate sync item already queued' };
      }

      // Create sync engine instance
      const syncEngine = new SyncEngine(syncConfig);
      await syncEngine.initialize();

      const syncItem = {
        itemId: syncEngine.itemId,
        module: syncConfig.module,
        direction: syncConfig.direction,
        status: SyncStatus.PENDING,
        priority: syncConfig.priority,
        data: syncConfig.data,
        metadata: syncEngine.getMetadata(),
        createdAt: new Date().toISOString(),
        retryCount: 0,
        error: null
      };

      // Add to queue based on priority
      this.addToQueue(syncItem);
      this.saveState();

      this.auditLogger.log({
        level: 'info',
        operation: 'sync_queued',
        details: {
          itemId: syncItem.itemId,
          module: syncConfig.module,
          direction: syncConfig.direction
        },
        success: true
      });

      // Start processing if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      return { success: true, itemId: syncItem.itemId };
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'sync_queue_failed',
        details: { error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add item to queue based on priority
   * @param {object} syncItem - Sync item
   */
  addToQueue(syncItem) {
    const priorityOrder = { [SyncPriority.URGENT]: 0, [SyncPriority.HIGH]: 1, [SyncPriority.NORMAL]: 2, [SyncPriority.LOW]: 3 };
    const itemPriority = priorityOrder[syncItem.priority] || 2;

    // Find insertion point
    let insertIndex = this.syncQueue.length;
    for (let i = 0; i < this.syncQueue.length; i++) {
      const queuePriority = priorityOrder[this.syncQueue[i].priority] || 2;
      if (itemPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.syncQueue.splice(insertIndex, 0, syncItem);

    // Trim queue if it exceeds max size
    if (this.syncQueue.length > this.maxQueueSize) {
      this.syncQueue = this.syncQueue.slice(0, this.maxQueueSize);
    }
  }

  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    // Check network status
    const networkStatus = await this.getNetworkStatus();
    if (networkStatus === 'offline') {
      console.log('[SyncManager] Offline, pausing queue processing');
      return;
    }

    // Check sync filters
    if (this.syncFilters.wifiOnly && !await this.isOnWifi()) {
      console.log('[SyncManager] WiFi only mode, not on WiFi');
      return;
    }

    if (this.syncFilters.manualSync) {
      console.log('[SyncManager] Manual sync mode, pausing automatic sync');
      return;
    }

    this.isProcessing = true;

    while (this.syncQueue.length > 0) {
      const syncItem = this.syncQueue[0];

      // Check if item should be processed
      if (syncItem.status === SyncStatus.PAUSED) {
        this.syncQueue.shift();
        continue;
      }

      // Create sync engine and process
      try {
        const syncEngine = new SyncEngine({
          ...syncItem.metadata,
          data: syncItem.data
        });

        this.activeSyncs.set(syncItem.itemId, syncEngine);

        const result = await syncEngine.start();

        // Update item status
        syncItem.status = result.success ? SyncStatus.COMPLETED : SyncStatus.FAILED;
        syncItem.error = result.error || null;
        syncItem.completedAt = new Date().toISOString();

        // Move from queue to history
        this.syncQueue.shift();
        this.addToHistory(syncItem);
        this.activeSyncs.delete(syncItem.itemId);

        // Handle failure with retry
        if (!result.success && syncItem.retryCount < 5) {
          syncItem.retryCount++;
          syncItem.status = SyncStatus.RETRYING;
          this.addToQueue(syncItem);
        }

        this.saveState();
      } catch (error) {
        console.error('[SyncManager] Sync processing failed:', error);
        syncItem.status = SyncStatus.FAILED;
        syncItem.error = error.message;
        this.syncQueue.shift();
        this.addToHistory(syncItem);
        this.activeSyncs.delete(syncItem.itemId);
        this.saveState();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Get network status
   * @returns {Promise<string>} Network status
   */
  async getNetworkStatus() {
    if (!navigator.onLine) {
      return 'offline';
    }

    // Try to fetch a small resource to verify connectivity
    try {
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return 'online';
    } catch (_error) {
      return 'offline';
    }
  }

  /**
   * Check if on WiFi
   * @returns {Promise<boolean>} WiFi status
   */
  async isOnWifi() {
    // This is a simplified check - in production would use Network Information API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return connection.type === 'wifi';
    }
    return true; // Assume WiFi if we can't detect
  }

  /**
   * Cancel a sync operation
   * @param {string} itemId - Item ID
   * @returns {object} Cancellation result
   */
  async cancelSync(itemId) {
    // Check active syncs
    const activeSync = this.activeSyncs.get(itemId);
    if (activeSync) {
      const result = await activeSync.cancel();
      this.activeSyncs.delete(itemId);
      this.addToHistory(activeSync.getMetadata());
      this.saveState();
      return result;
    }

    // Check queue
    const queueIndex = this.syncQueue.findIndex(item => item.itemId === itemId);
    if (queueIndex !== -1) {
      const item = this.syncQueue[queueIndex];
      item.status = SyncStatus.CANCELLED;
      this.syncQueue.splice(queueIndex, 1);
      this.addToHistory(item);
      this.saveState();
      return { success: true };
    }

    return { success: false, error: 'Sync item not found' };
  }

  /**
   * Pause a sync operation
   * @param {string} itemId - Item ID
   * @returns {object} Pause result
   */
  async pauseSync(itemId) {
    const activeSync = this.activeSyncs.get(itemId);
    if (activeSync) {
      const result = await activeSync.pause();
      return result;
    }

    const queueItem = this.syncQueue.find(item => item.itemId === itemId);
    if (queueItem) {
      queueItem.status = SyncStatus.PAUSED;
      this.saveState();
      return { success: true };
    }

    return { success: false, error: 'Sync item not found' };
  }

  /**
   * Resume a sync operation
   * @param {string} itemId - Item ID
   * @returns {object} Resume result
   */
  async resumeSync(itemId) {
    const queueItem = this.syncQueue.find(item => item.itemId === itemId);
    if (queueItem && queueItem.status === SyncStatus.PAUSED) {
      queueItem.status = SyncStatus.PENDING;
      this.saveState();
      
      if (!this.isProcessing) {
        this.processQueue();
      }
      
      return { success: true };
    }

    return { success: false, error: 'Sync item not found or not paused' };
  }

  /**
   * Get sync queue
   * @param {object} filters - Optional filters
   * @returns {Array} Filtered queue
   */
  getQueue(filters = {}) {
    let queue = [...this.syncQueue];

    if (filters.module) {
      queue = queue.filter(item => item.module === filters.module);
    }

    if (filters.status) {
      queue = queue.filter(item => item.status === filters.status);
    }

    if (filters.priority) {
      queue = queue.filter(item => item.priority === filters.priority);
    }

    return queue;
  }

  /**
   * Get sync history
   * @param {object} filters - Optional filters
   * @returns {Array} Filtered history
   */
  getHistory(filters = {}) {
    let history = [...this.syncHistory];

    if (filters.module) {
      history = history.filter(item => item.module === filters.module);
    }

    if (filters.status) {
      history = history.filter(item => item.status === filters.status);
    }

    if (filters.since) {
      history = history.filter(item => new Date(item.createdAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by creation date descending
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return history;
  }

  /**
   * Get sync statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const queue = this.syncQueue;
    const history = this.syncHistory;
    const activeCount = this.activeSyncs.size;

    const pendingCount = queue.filter(item => item.status === SyncStatus.PENDING).length;
    const failedCount = queue.filter(item => item.status === SyncStatus.FAILED).length;
    const pausedCount = queue.filter(item => item.status === SyncStatus.PAUSED).length;

    const totalCompleted = history.filter(item => item.status === SyncStatus.COMPLETED).length;
    const totalFailed = history.filter(item => item.status === SyncStatus.FAILED).length;

    const today = new Date().toDateString();
    const completedToday = history.filter(item => 
      item.status === SyncStatus.COMPLETED && new Date(item.completedAt).toDateString() === today
    ).length;

    const averageSyncTime = totalCompleted > 0
      ? history
          .filter(item => item.status === SyncStatus.COMPLETED && item.completedAt && item.startedAt)
          .reduce((sum, item) => sum + (new Date(item.completedAt) - new Date(item.startedAt)), 0) / totalCompleted
      : 0;

    const totalSize = history.reduce((sum, item) => sum + (item.size || 0), 0);

    return {
      queueSize: queue.length,
      activeSyncs: activeCount,
      pendingCount,
      failedCount,
      pausedCount,
      completedToday,
      totalCompleted,
      totalFailed,
      successRate: (totalCompleted + totalFailed) > 0 ? (totalCompleted / (totalCompleted + totalFailed)) * 100 : 0,
      averageSyncTime,
      totalSize
    };
  }

  /**
   * Add to history
   * @param {object} item - Sync item
   */
  addToHistory(item) {
    this.syncHistory.push(item);

    // Trim history if it exceeds max size
    if (this.syncHistory.length > this.maxHistorySize) {
      this.syncHistory = this.syncHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Set sync filter
   * @param {string} filter - Filter name
   * @param {boolean} value - Filter value
   */
  setSyncFilter(filter, value) {
    if (filter in this.syncFilters) {
      this.syncFilters[filter] = value;
      this.saveState();
    }
  }

  /**
   * Get sync filters
   * @returns {object} Current filters
   */
  getSyncFilters() {
    return { ...this.syncFilters };
  }

  /**
   * Check if data is duplicate
   * @param {object} data1 - First data
   * @param {object} data2 - Second data
   * @returns {boolean} Whether data is duplicate
   */
  isDuplicateData(data1, data2) {
    if (!data1 || !data2) return false;
    return JSON.stringify(data1) === JSON.stringify(data2);
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        syncQueue: this.syncQueue,
        syncHistory: this.syncHistory,
        syncFilters: this.syncFilters
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save sync manager state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.syncQueue = parsed.syncQueue || [];
        this.syncHistory = parsed.syncHistory || [];
        this.syncFilters = parsed.syncFilters || this.syncFilters;
      }
    } catch (error) {
      console.error('Failed to load sync manager state:', error);
    }
  }

  /**
   * Clear all state
   */
  clearState() {
    this.syncQueue = [];
    this.activeSyncs.clear();
    this.syncHistory = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Destroy the sync manager
   */
  destroy() {
    this.clearState();
    console.log('[SyncManager] Destroyed');
  }
}

// Singleton instance
let syncManagerInstance = null;

/**
 * Get the singleton sync manager instance
 * @returns {SyncManager} Sync manager instance
 */
export function getSyncManager() {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
}

export default SyncManager;
