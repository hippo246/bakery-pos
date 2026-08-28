// Storage Failover and Health Monitoring System
// Automatic detection of storage issues and seamless switching to backup

export class StorageFailover {
  constructor(primaryStorage, backupStorage) {
    this.primaryStorage = primaryStorage;
    this.backupStorage = backupStorage;
    this.currentStorage = 'primary';
    this.healthCheckInterval = 30000; // 30 seconds
    this.healthCheckTimer = null;
    this.failureCount = 0;
    this.maxFailures = 3;
    this.autoSwitchEnabled = true;
    this.healthHistory = [];
    this.subscribers = new Map();
  }

  /**
   * Initialize failover system
   */
  async initialize() {
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Perform initial health check
    const health = await this.checkHealth();
    this.recordHealth(health);
    
    console.log('[StorageFailover] Initialized with', this.currentStorage, 'storage');
    return health;
  }

  /**
   * Start periodic health monitoring
   */
  startHealthMonitoring() {
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    
    this.healthCheckTimer = setInterval(async () => {
      const health = await this.checkHealth();
      this.recordHealth(health);
      
      if (!health.healthy && this.autoSwitchEnabled) {
        await this.handleFailure(health.error);
      }
    }, this.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }

  /**
   * Check health of current storage
   */
  async checkHealth() {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      // Test write operation
      const testKey = `health_check_${Date.now()}`;
      const testData = { test: true, timestamp: Date.now() };
      
      await storage.setItem(testKey, testData);
      const retrieved = await storage.getItem(testKey);
      await storage.removeItem(testKey);
      
      if (!retrieved || retrieved.test !== true) {
        throw new Error('Storage read/write test failed');
      }
      
      // Reset failure count on success
      this.failureCount = 0;
      
      return {
        healthy: true,
        storage: this.currentStorage,
        timestamp: Date.now(),
        latency: Date.now() - testData.timestamp
      };
    } catch (error) {
      this.failureCount++;
      
      return {
        healthy: false,
        storage: this.currentStorage,
        error: error.message,
        failureCount: this.failureCount,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Record health check result
   */
  recordHealth(health) {
    this.healthHistory.push(health);
    
    // Keep only last 100 health checks
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }
    
    this.notifySubscribers('healthCheck', health);
  }

  /**
   * Handle storage failure
   */
  async handleFailure(error) {
    console.error('[StorageFailover] Storage failure detected:', error);
    
    if (this.failureCount >= this.maxFailures) {
      console.warn('[StorageFailover] Max failures reached, switching storage');
      await this.switchStorage();
    }
  }

  /**
   * Switch to backup storage
   */
  async switchStorage() {
    const oldStorage = this.currentStorage;
    const newStorage = oldStorage === 'primary' ? 'backup' : 'primary';
    
    console.log(`[StorageFailover] Switching from ${oldStorage} to ${newStorage}`);
    
    try {
      // Test new storage before switching
      const testKey = `switch_test_${Date.now()}`;
      const newStorageInstance = newStorage === 'primary' ? this.primaryStorage : this.backupStorage;
      
      await newStorageInstance.setItem(testKey, { test: true });
      await newStorageInstance.removeItem(testKey);
      
      // Switch successful
      this.currentStorage = newStorage;
      this.failureCount = 0;
      
      this.notifySubscribers('storageSwitched', {
        from: oldStorage,
        to: newStorage,
        timestamp: Date.now()
      });
      
      console.log(`[StorageFailover] Successfully switched to ${newStorage}`);
      
      // Attempt to sync data from old storage
      await this.syncData(oldStorage, newStorage);
      
      return { success: true, newStorage };
    } catch (error) {
      console.error('[StorageFailover] Failed to switch storage:', error);
      
      this.notifySubscribers('switchFailed', {
        from: oldStorage,
        to: newStorage,
        error: error.message,
        timestamp: Date.now()
      });
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync data between storages
   */
  async syncData(fromStorage, toStorage) {
    console.log(`[StorageFailover] Syncing data from ${fromStorage} to ${toStorage}`);
    
    try {
      const fromInstance = fromStorage === 'primary' ? this.primaryStorage : this.backupStorage;
      const toInstance = toStorage === 'primary' ? this.primaryStorage : this.backupStorage;
      
      // Get stats from source
      const stats = await fromInstance.getStats();
      
      // Sync critical data
      const criticalStores = ['orders', 'customers', 'tables', 'inventory', 'menuItems'];
      
      for (const storeName of criticalStores) {
        try {
          const data = await fromInstance.getAllItems(storeName);
          if (data && data.length > 0) {
            await toInstance.setItems(data);
            console.log(`[StorageFailover] Synced ${data.length} items from ${storeName}`);
          }
        } catch (error) {
          console.error(`[StorageFailover] Failed to sync ${storeName}:`, error);
        }
      }
      
      this.notifySubscribers('dataSynced', {
        from: fromStorage,
        to: toStorage,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('[StorageFailover] Data sync failed:', error);
    }
  }

  /**
   * Get item with automatic retry on failure
   */
  async getItem(key) {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      return await storage.getItem(key);
    } catch (error) {
      console.error('[StorageFailover] Get item failed, retrying with backup:', error);
      
      // Try backup storage
      const backup = this.currentStorage === 'primary' ? this.backupStorage : this.primaryStorage;
      try {
        const result = await backup.getItem(key);
        
        // If backup works, switch to it
        if (result !== null) {
          await this.switchStorage();
        }
        
        return result;
      } catch (backupError) {
        console.error('[StorageFailover] Backup also failed:', backupError);
        throw error;
      }
    }
  }

  /**
   * Set item with automatic retry on failure
   */
  async setItem(key, value) {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      return await storage.setItem(key, value);
    } catch (error) {
      console.error('[StorageFailover] Set item failed, retrying with backup:', error);
      
      // Try backup storage
      const backup = this.currentStorage === 'primary' ? this.backupStorage : this.primaryStorage;
      try {
        const result = await backup.setItem(key, value);
        
        // If backup works, switch to it
        await this.switchStorage();
        
        return result;
      } catch (backupError) {
        console.error('[StorageFailover] Backup also failed:', backupError);
        throw error;
      }
    }
  }

  /**
   * Remove item with automatic retry on failure
   */
  async removeItem(key) {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      return await storage.removeItem(key);
    } catch (error) {
      console.error('[StorageFailover] Remove item failed, retrying with backup:', error);
      
      // Try backup storage
      const backup = this.currentStorage === 'primary' ? this.backupStorage : this.primaryStorage;
      try {
        const result = await backup.removeItem(key);
        
        // If backup works, switch to it
        await this.switchStorage();
        
        return result;
      } catch (backupError) {
        console.error('[StorageFailover] Backup also failed:', backupError);
        throw error;
      }
    }
  }

  /**
   * Get all items with automatic retry on failure
   */
  async getAllItems(storeName) {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      return await storage.getAllItems(storeName);
    } catch (error) {
      console.error('[StorageFailover] Get all items failed, retrying with backup:', error);
      
      // Try backup storage
      const backup = this.currentStorage === 'primary' ? this.backupStorage : this.primaryStorage;
      try {
        const result = await backup.getAllItems(storeName);
        
        // If backup works, switch to it
        if (result && result.length > 0) {
          await this.switchStorage();
        }
        
        return result;
      } catch (backupError) {
        console.error('[StorageFailover] Backup also failed:', backupError);
        throw error;
      }
    }
  }

  /**
   * Set items with automatic retry on failure
   */
  async setItems(items) {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      return await storage.setItems(items);
    } catch (error) {
      console.error('[StorageFailover] Set items failed, retrying with backup:', error);
      
      // Try backup storage
      const backup = this.currentStorage === 'primary' ? this.backupStorage : this.primaryStorage;
      try {
        const result = await backup.setItems(items);
        
        // If backup works, switch to it
        await this.switchStorage();
        
        return result;
      } catch (backupError) {
        console.error('[StorageFailover] Backup also failed:', backupError);
        throw error;
      }
    }
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    const storage = this.currentStorage === 'primary' ? this.primaryStorage : this.backupStorage;
    
    try {
      const stats = await storage.getStats();
      return {
        ...stats,
        currentStorage: this.currentStorage,
        failureCount: this.failureCount,
        healthHistory: this.healthHistory.slice(-10)
      };
    } catch (error) {
      console.error('[StorageFailover] Get stats failed:', error);
      return {
        currentStorage: this.currentStorage,
        failureCount: this.failureCount,
        error: error.message
      };
    }
  }

  /**
   * Force switch to specific storage
   */
  async forceSwitch(storage) {
    if (storage !== 'primary' && storage !== 'backup') {
      throw new Error('Invalid storage type. Must be "primary" or "backup"');
    }
    
    if (this.currentStorage === storage) {
      return { success: true, currentStorage: storage };
    }
    
    return await this.switchStorage();
  }

  /**
   * Subscribe to failover events
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  /**
   * Notify subscribers
   */
  notifySubscribers(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[StorageFailover] Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Get health history
   */
  getHealthHistory() {
    return this.healthHistory;
  }

  /**
   * Get current storage
   */
  getCurrentStorage() {
    return this.currentStorage;
  }

  /**
   * Enable/disable auto-switch
   */
  setAutoSwitch(enabled) {
    this.autoSwitchEnabled = enabled;
    console.log(`[StorageFailover] Auto-switch ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Destroy failover system
   */
  destroy() {
    this.stopHealthMonitoring();
    this.subscribers.clear();
    this.healthHistory = [];
    console.log('[StorageFailover] Destroyed');
  }
}

export default StorageFailover;
