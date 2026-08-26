// Offline Mode for Operations

export const SyncStatus = {
  SYNCED: 'synced',
  PENDING: 'pending',
  SYNCING: 'syncing',
  FAILED: 'failed'
};

export const NetworkStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
};

class OfflineModeManager {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.localData = {};
    this.lastSyncTime = null;
    this.loadFromStorage();
    this.initializeNetworkListeners();
  }

  // Load data from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const storedQueue = localStorage.getItem('offline_sync_queue');
        const storedData = localStorage.getItem('offline_local_data');
        const storedLastSync = localStorage.getItem('offline_last_sync');
        
        if (storedQueue) {
          this.syncQueue = JSON.parse(storedQueue);
        }
        if (storedData) {
          this.localData = JSON.parse(storedData);
        }
        if (storedLastSync) {
          this.lastSyncTime = storedLastSync;
        }
      }
    } catch (error) {
      console.error('Error loading offline mode data:', error);
    }
  }

  // Save data to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('offline_sync_queue', JSON.stringify(this.syncQueue));
        localStorage.setItem('offline_local_data', JSON.stringify(this.localData));
        if (this.lastSyncTime) {
          localStorage.setItem('offline_last_sync', this.lastSyncTime);
        }
      }
    } catch (error) {
      console.error('Error saving offline mode data:', error);
    }
  }

  // Initialize network status listeners
  initializeNetworkListeners() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.handleConnectionRestored();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.handleConnectionLost();
      });

      // Check initial status
      this.isOnline = navigator.onLine;
    }
  }

  // Handle connection restored
  handleConnectionRestored() {
    console.log('Connection restored. Starting sync...');
    this.syncPendingData();
  }

  // Handle connection lost
  handleConnectionLost() {
    console.log('Connection lost. Entering offline mode...');
    this.saveToStorage();
  }

  // Get current network status
  getNetworkStatus() {
    return this.isOnline ? NetworkStatus.ONLINE : NetworkStatus.OFFLINE;
  }

  // Add operation to sync queue
  addToSyncQueue(operation) {
    const syncItem = {
      id: this.generateId(),
      ...operation,
      status: SyncStatus.PENDING,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };

    this.syncQueue.push(syncItem);
    this.saveToStorage();

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOperation(syncItem);
    }

    return syncItem;
  }

  // Save data locally
  saveLocalData(key, data) {
    this.localData[key] = {
      data,
      timestamp: new Date().toISOString()
    };
    this.saveToStorage();
  }

  // Get local data
  getLocalData(key) {
    return this.localData[key]?.data;
  }

  // Sync pending data when connection restored
  async syncPendingData() {
    if (!this.isOnline) {
      console.log('Cannot sync: still offline');
      return;
    }

    const pendingItems = this.syncQueue.filter(item => item.status === SyncStatus.PENDING);
    
    if (pendingItems.length === 0) {
      console.log('No pending items to sync');
      return;
    }

    console.log(`Syncing ${pendingItems.length} pending items...`);

    for (const item of pendingItems) {
      await this.syncOperation(item);
    }
  }

  // Sync individual operation
  async syncOperation(syncItem) {
    const index = this.syncQueue.findIndex(item => item.id === syncItem.id);
    if (index === -1) {
      return;
    }

    this.syncQueue[index].status = SyncStatus.SYNCING;
    this.saveToStorage();

    try {
      let result;

      switch (syncItem.type) {
        case 'create_order':
          result = await this.syncCreateOrder(syncItem.data);
          break;
        case 'update_order':
          result = await this.syncUpdateOrder(syncItem.data);
          break;
        case 'create_customer':
          result = await this.syncCreateCustomer(syncItem.data);
          break;
        case 'update_inventory':
          result = await this.syncUpdateInventory(syncItem.data);
          break;
        default:
          throw new Error(`Unknown sync operation type: ${syncItem.type}`);
      }

      // Mark as synced
      this.syncQueue[index].status = SyncStatus.SYNCED;
      this.syncQueue[index].syncedAt = new Date().toISOString();
      this.syncQueue[index].result = result;

      // Remove from queue after successful sync
      this.syncQueue.splice(index, 1);
      this.lastSyncTime = new Date().toISOString();

    } catch (error) {
      console.error(`Sync failed for item ${syncItem.id}:`, error);
      
      this.syncQueue[index].status = SyncStatus.FAILED;
      this.syncQueue[index].error = error.message;
      this.syncQueue[index].retryCount++;

      // Retry logic
      if (this.syncQueue[index].retryCount < 3) {
        setTimeout(() => {
          this.syncQueue[index].status = SyncStatus.PENDING;
          this.syncOperation(this.syncQueue[index]);
        }, 5000 * this.syncQueue[index].retryCount); // Exponential backoff
      }
    }

    this.saveToStorage();
  }

  // Sync create order operation
  async syncCreateOrder(orderData) {
    // This would make an API call to sync the order
    // For now, simulate success
    console.log('Syncing create order:', orderData);
    return { success: true, orderId: orderData.id };
  }

  // Sync update order operation
  async syncUpdateOrder(orderData) {
    console.log('Syncing update order:', orderData);
    return { success: true, orderId: orderData.id };
  }

  // Sync create customer operation
  async syncCreateCustomer(customerData) {
    console.log('Syncing create customer:', customerData);
    return { success: true, customerId: customerData.id };
  }

  // Sync update inventory operation
  async syncUpdateInventory(inventoryData) {
    console.log('Syncing update inventory:', inventoryData);
    return { success: true, itemId: inventoryData.id };
  }

  // Get sync queue status
  getSyncQueueStatus() {
    const pending = this.syncQueue.filter(item => item.status === SyncStatus.PENDING).length;
    const syncing = this.syncQueue.filter(item => item.status === SyncStatus.SYNCING).length;
    const failed = this.syncQueue.filter(item => item.status === SyncStatus.FAILED).length;

    return {
      total: this.syncQueue.length,
      pending,
      syncing,
      failed,
      lastSyncTime: this.lastSyncTime
    };
  }

  // Clear synced items from queue
  clearSyncedItems() {
    this.syncQueue = this.syncQueue.filter(item => item.status !== SyncStatus.SYNCED);
    this.saveToStorage();
  }

  // Retry failed sync operations
  retryFailedOperations() {
    const failedItems = this.syncQueue.filter(item => item.status === SyncStatus.FAILED);
    
    failedItems.forEach(item => {
      item.status = SyncStatus.PENDING;
      item.retryCount = 0;
      item.error = null;
    });

    this.saveToStorage();
    this.syncPendingData();
  }

  // Force sync all data
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Cannot force sync: offline');
    }

    // Mark all pending items as pending for retry
    this.syncQueue.forEach(item => {
      if (item.status === SyncStatus.FAILED) {
        item.status = SyncStatus.PENDING;
      }
    });

    await this.syncPendingData();
  }

  // Get local storage usage
  getStorageUsage() {
    if (typeof window === 'undefined') return null;

    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length;
      }
    }

    const usedMB = (total / (1024 * 1024)).toFixed(2);
    const quota = 5; // Typical localStorage quota is 5MB
    const percentage = ((total / (quota * 1024 * 1024)) * 100).toFixed(2);

    return {
      usedBytes: total,
      usedMB,
      quotaMB: quota,
      percentage,
      isNearLimit: percentage > 80
    };
  }

  // Clear old local data to free space
  clearOldData(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let cleared = 0;

    Object.keys(this.localData).forEach(key => {
      const dataDate = new Date(this.localData[key].timestamp);
      if (dataDate < cutoffDate) {
        delete this.localData[key];
        cleared++;
      }
    });

    this.saveToStorage();
    return cleared;
  }

  // Generate unique ID
  generateId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Export sync queue for debugging
  exportSyncQueue() {
    return JSON.stringify(this.syncQueue, null, 2);
  }

  // Import sync queue (for recovery)
  importSyncQueue(queueData) {
    try {
      this.syncQueue = JSON.parse(queueData);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error importing sync queue:', error);
      return false;
    }
  }
}

// Singleton instance
let offlineModeManager = null;

export const getOfflineModeManager = () => {
  if (!offlineModeManager) {
    offlineModeManager = new OfflineModeManager();
  }
  return offlineModeManager;
};

// React hook for offline mode
export const useOfflineMode = () => {
  const manager = getOfflineModeManager();

  return {
    isOnline: manager.isOnline,
    networkStatus: manager.getNetworkStatus(),
    syncQueueStatus: manager.getSyncQueueStatus(),
    addToSyncQueue: (operation) => manager.addToSyncQueue(operation),
    saveLocalData: (key, data) => manager.saveLocalData(key, data),
    getLocalData: (key) => manager.getLocalData(key),
    forceSync: () => manager.forceSync(),
    retryFailed: () => manager.retryFailedOperations(),
    storageUsage: manager.getStorageUsage()
  };
};
