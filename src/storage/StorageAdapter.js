// Unified Storage Adapter with Failover
// Provides seamless interface between LocalStorage and IndexedDB
// Enables gradual migration and high-capacity storage with automatic failover

import { getLocalStorageManager } from '../operations/LocalStorageManager.js';
import { getIndexedDBStorage } from './IndexedDBStorage.js';
import { getDeviceSyncManager } from '../sync/DeviceSyncManager.js';
import { StorageFailover } from './StorageFailover.js';

export class StorageAdapter {
  constructor(config = {}) {
    this.useIndexedDB = config.useIndexedDB !== false; // Default to IndexedDB
    this.enableSync = config.enableSync !== false; // Default to sync enabled
    this.enableFailover = config.enableFailover !== false; // Default to failover enabled
    this.localStorageManager = getLocalStorageManager();
    this.indexedDBStorage = null;
    this.syncManager = null;
    this.failoverSystem = null;
    this.deviceId = null;
    this.initialized = false;
    this.fallbackToLocalStorage = false;
  }

  /**
   * Initialize storage adapter with failover
   */
  async initialize(deviceId = null) {
    this.deviceId = deviceId || this.generateDeviceId();

    try {
      if (this.useIndexedDB) {
        this.indexedDBStorage = getIndexedDBStorage();
        await this.indexedDBStorage.initialize();

        if (this.enableSync) {
          this.syncManager = getDeviceSyncManager(this.indexedDBStorage);
          await this.syncManager.initialize();
        }

        // Initialize failover system with IndexedDB as primary, LocalStorage as backup
        if (this.enableFailover) {
          this.failoverSystem = new StorageFailover(
            this.indexedDBStorage,
            this.localStorageManager
          );
          await this.failoverSystem.initialize();
          
          // Subscribe to failover events
          this.failoverSystem.subscribe('storageSwitched', (data) => {
            console.log('[StorageAdapter] Storage switched:', data);
            this.fallbackToLocalStorage = data.to === 'backup';
          });
          
          this.failoverSystem.subscribe('healthCheck', (health) => {
            if (!health.healthy) {
              console.warn('[StorageAdapter] Health check failed:', health.error);
            }
          });
        }

        this.initialized = true;
        console.log('[StorageAdapter] Initialized with IndexedDB and failover');
      } else {
        this.initialized = true;
        console.log('[StorageAdapter] Initialized with LocalStorage only');
      }
    } catch (error) {
      console.error('[StorageAdapter] IndexedDB initialization failed, falling back to LocalStorage:', error);
      this.fallbackToLocalStorage = true;
      this.initialized = true;
    }
  }

  /**
   * Generate device ID
   */
  generateDeviceId() {
    const existing = localStorage.getItem('bakerypos_device_id');
    if (existing) return existing;
    
    const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bakerypos_device_id', newId);
    return newId;
  }

  /**
   * Get item - uses failover system if enabled
   */
  async getItem(key) {
    if (!this.initialized) await this.initialize();

    if (this.enableFailover && this.failoverSystem) {
      return await this.failoverSystem.getItem(key);
    }

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      try {
        const storeName = this.getStoreNameForKey(key);
        if (storeName) {
          const result = await this.indexedDBStorage.get(storeName, key);
          if (result !== null) return result;
        }
      } catch (error) {
        console.warn('[StorageAdapter] IndexedDB get failed, trying LocalStorage:', error);
      }
    }

    return await this.localStorageManager.load(key);
  }

  /**
   * Set item - uses failover system if enabled
   */
  async setItem(key, value) {
    if (!this.initialized) await this.initialize();

    if (this.enableFailover && this.failoverSystem) {
      return await this.failoverSystem.setItem(key, value);
    }

    let indexedDBResult = null;
    let localStorageResult = null;

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      try {
        const storeName = this.getStoreNameForKey(key);
        if (storeName) {
          const item = { id: key, ...value, updatedAt: Date.now() };
          indexedDBResult = await this.indexedDBStorage.queueWrite(storeName, item, 'normal');
          
          if (this.syncManager) {
            this.syncManager.trackChange('update', storeName, item);
          }
        }
      } catch (error) {
        console.warn('[StorageAdapter] IndexedDB set failed:', error);
      }
    }

    try {
      localStorageResult = await this.localStorageManager.save(key, value);
    } catch (error) {
      console.warn('[StorageAdapter] LocalStorage set failed:', error);
    }

    return {
      indexedDB: indexedDBResult,
      localStorage: localStorageResult
    };
  }

  /**
   * Remove item - uses failover system if enabled
   */
  async removeItem(key) {
    if (!this.initialized) await this.initialize();

    if (this.enableFailover && this.failoverSystem) {
      return await this.failoverSystem.removeItem(key);
    }

    let indexedDBResult = null;
    let localStorageResult = null;

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      try {
        const storeName = this.getStoreNameForKey(key);
        if (storeName) {
          indexedDBResult = await this.indexedDBStorage.delete(storeName, key);
          
          if (this.syncManager) {
            this.syncManager.trackChange('delete', storeName, { id: key });
          }
        }
      } catch (error) {
        console.warn('[StorageAdapter] IndexedDB remove failed:', error);
      }
    }

    try {
      localStorage.removeItem(key);
      localStorageResult = { success: true };
    } catch (error) {
      console.warn('[StorageAdapter] LocalStorage remove failed:', error);
    }

    return {
      indexedDB: indexedDBResult,
      localStorage: localStorageResult
    };
  }

  /**
   * Get all items - uses failover system if enabled
   */
  async getAllItems(storeName) {
    if (!this.initialized) await this.initialize();

    if (this.enableFailover && this.failoverSystem) {
      return await this.failoverSystem.getAllItems(storeName);
    }

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      try {
        const stats = await this.indexedDBStorage.getStats();
        const count = stats[storeName] || 0;
        
        if (count > 0) {
          console.warn('[StorageAdapter] getAllItems not fully implemented for IndexedDB');
          return [];
        }
      } catch (error) {
        console.warn('[StorageAdapter] IndexedDB getAll failed:', error);
      }
    }

    const keyPattern = this.getKeyPatternForStore(storeName);
    if (keyPattern) {
      const items = [];
      for (const key in localStorage) {
        if (key.startsWith(keyPattern)) {
          try {
            const value = await this.localStorageManager.load(key);
            items.push({ id: key, ...value });
          } catch (error) {
            console.warn(`[StorageAdapter] Failed to load ${key}:`, error);
          }
        }
      }
      return items;
    }

    return [];
  }

  /**
   * Batch set items - uses failover system if enabled
   */
  async setItems(items) {
    if (!this.initialized) await this.initialize();

    if (this.enableFailover && this.failoverSystem) {
      return await this.failoverSystem.setItems(items);
    }

    const results = {
      indexedDB: [],
      localStorage: []
    };

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      const grouped = {};
      items.forEach(item => {
        const storeName = this.getStoreNameForKey(item.id);
        if (storeName) {
          if (!grouped[storeName]) grouped[storeName] = [];
          grouped[storeName].push({ id: item.id, ...item, updatedAt: Date.now() });
        }
      });

      for (const [storeName, storeItems] of Object.entries(grouped)) {
        try {
          const result = await this.indexedDBStorage.batchWrite(storeName, storeItems);
          results.indexedDB.push({ storeName, result });
          
          if (this.syncManager) {
            storeItems.forEach(item => {
              this.syncManager.trackChange('update', storeName, item);
            });
          }
        } catch (error) {
          console.warn(`[StorageAdapter] Batch write failed for ${storeName}:`, error);
        }
      }
    }

    for (const item of items) {
      try {
        const result = await this.localStorageManager.save(item.id, item);
        results.localStorage.push(result);
      } catch (error) {
        console.warn(`[StorageAdapter] LocalStorage set failed for ${item.id}:`, error);
      }
    }

    return results;
  }

  /**
   * Get storage statistics with failover info
   */
  async getStats() {
    if (!this.initialized) await this.initialize();

    const stats = {
      mode: this.fallbackToLocalStorage ? 'localStorage' : 'indexedDB',
      localStorage: this.localStorageManager.getUsageStatistics(),
      indexedDB: null,
      sync: null,
      failover: null
    };

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      stats.indexedDB = await this.indexedDBStorage.getStats();
    }

    if (this.syncManager) {
      stats.sync = await this.syncManager.getDeviceStats();
    }

    if (this.failoverSystem) {
      stats.failover = {
        currentStorage: this.failoverSystem.getCurrentStorage(),
        failureCount: this.failoverSystem.failureCount,
        healthHistory: this.failoverSystem.getHealthHistory().slice(-5),
        autoSwitchEnabled: this.failoverSystem.autoSwitchEnabled
      };
    }

    return stats;
  }

  /**
   * Force storage switch
   */
  async forceSwitch(storage) {
    if (this.failoverSystem) {
      return await this.failoverSystem.forceSwitch(storage);
    }
    return { success: false, error: 'Failover not enabled' };
  }

  /**
   * Get current storage
   */
  getCurrentStorage() {
    if (this.failoverSystem) {
      return this.failoverSystem.getCurrentStorage();
    }
    return this.fallbackToLocalStorage ? 'backup' : 'primary';
  }

  /**
   * Subscribe to failover events
   */
  subscribe(event, callback) {
    if (this.failoverSystem) {
      return this.failoverSystem.subscribe(event, callback);
    }
    return () => {};
  }

  /**
   * Enable/disable auto-switch
   */
  setAutoSwitch(enabled) {
    if (this.failoverSystem) {
      this.failoverSystem.setAutoSwitch(enabled);
    }
  }

  /**
   * Clear all data
   */
  async clear() {
    if (!this.initialized) await this.initialize();

    const results = {
      indexedDB: null,
      localStorage: null
    };

    if (this.useIndexedDB && !this.fallbackToLocalStorage && this.indexedDBStorage) {
      try {
        const stores = ['orders', 'customers', 'inventory', 'menuItems', 'tables', 'syncQueue', 'devices'];
        for (const store of stores) {
          await this.indexedDBStorage.clear(store);
        }
        results.indexedDB = { success: true };
      } catch (error) {
        console.error('[StorageAdapter] IndexedDB clear failed:', error);
        results.indexedDB = { success: false, error: error.message };
      }
    }

    try {
      localStorage.clear();
      results.localStorage = { success: true };
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage clear failed:', error);
      results.localStorage = { success: false, error: error.message };
    }

    return results;
  }

  /**
   * Map key to IndexedDB store name
   */
  getStoreNameForKey(key) {
    if (key.startsWith('cafeos_order') || key.startsWith('bakerypos_order')) return 'orders';
    if (key.startsWith('cafeos_customer') || key.startsWith('bakerypos_customer')) return 'customers';
    if (key.startsWith('cafeos_inventory') || key.startsWith('bakerypos_inventory')) return 'inventory';
    if (key.startsWith('cafeos_menu') || key.startsWith('bakerypos_menu')) return 'menuItems';
    if (key.startsWith('cafeos_table') || key.startsWith('bakerypos_table')) return 'tables';
    return null;
  }

  /**
   * Map store to LocalStorage key pattern
   */
  getKeyPatternForStore(storeName) {
    const patterns = {
      orders: 'cafeos_order',
      customers: 'cafeos_customer',
      inventory: 'cafeos_inventory',
      menuItems: 'cafeos_menu',
      tables: 'cafeos_table'
    };
    return patterns[storeName] || null;
  }

  /**
   * Force sync
   */
  async forceSync() {
    if (this.syncManager) {
      return await this.syncManager.forceSync();
    }
    return { success: false, error: 'Sync not enabled' };
  }

  /**
   * Get connected devices
   */
  async getConnectedDevices() {
    if (this.syncManager) {
      return await this.syncManager.getConnectedDevices();
    }
    return [];
  }

  /**
   * Subscribe to storage events
   */
  subscribe(event, callback) {
    if (this.syncManager) {
      return this.syncManager.subscribe(event, callback);
    }
    return () => {}; // No-op unsubscribe
  }

  /**
   * Disconnect sync
   */
  async disconnect() {
    if (this.syncManager) {
      await this.syncManager.disconnect();
    }
  }

  /**
   * Reconnect sync
   */
  async reconnect() {
    if (this.syncManager) {
      await this.syncManager.reconnect();
    }
  }
}

// Singleton instance
let storageAdapterInstance = null;

export function getStorageAdapter(config = {}) {
  if (!storageAdapterInstance) {
    storageAdapterInstance = new StorageAdapter(config);
  }
  return storageAdapterInstance;
}

export default StorageAdapter;
