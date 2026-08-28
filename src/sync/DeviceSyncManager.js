// Multi-Device Synchronization Manager
// Handles real-time sync across 20+ concurrent devices

export class DeviceSyncManager {
  constructor(storage, deviceId = null) {
    this.storage = storage;
    this.deviceId = deviceId || this.generateDeviceId();
    this.isConnected = false;
    this.syncInterval = 5000; // 5 seconds
    this.syncTimer = null;
    this.pendingChanges = new Map();
    this.conflictResolver = null;
    this.subscribers = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.syncQueue = [];
    this.isSyncing = false;
  }

  /**
   * Generate unique device ID
   */
  generateDeviceId() {
    const existing = localStorage.getItem('bakerypos_device_id');
    if (existing) return existing;
    
    const newId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bakerypos_device_id', newId);
    return newId;
  }

  /**
   * Initialize sync manager
   */
  async initialize() {
    await this.storage.initialize();
    await this.registerDevice();
    this.startSync();
  }

  /**
   * Register this device in the system
   */
  async registerDevice() {
    const deviceInfo = {
      deviceId: this.deviceId,
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      lastSeen: Date.now(),
      status: 'online',
      capabilities: {
        indexedDB: !!window.indexedDB,
        webSocket: !!window.WebSocket,
        serviceWorker: 'serviceWorker' in navigator
      }
    };

    await this.storage.queueWrite('devices', deviceInfo, 'high');
    this.notifySubscribers('deviceRegistered', deviceInfo);
  }

  /**
   * Start periodic sync
   */
  startSync() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    
    this.syncTimer = setInterval(() => {
      this.performSync();
    }, this.syncInterval);
    
    this.isConnected = true;
  }

  /**
   * Stop periodic sync
   */
  stopSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isConnected = false;
  }

  /**
   * Perform sync operation
   */
  async performSync() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      // 1. Push local changes
      await this.pushChanges();
      
      // 2. Pull remote changes
      await this.pullChanges();
      
      // 3. Update device heartbeat
      await this.updateHeartbeat();
      
      // 4. Clean up old sync records
      await this.cleanupOldSyncRecords();
      
      this.notifySubscribers('syncComplete', {
        timestamp: Date.now(),
        deviceId: this.deviceId
      });
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifySubscribers('syncError', { error: error.message });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push local changes to sync queue
   */
  async pushChanges() {
    const changes = Array.from(this.pendingChanges.values());
    
    if (changes.length === 0) return;
    
    for (const change of changes) {
      const syncRecord = {
        operation: change.operation,
        storeName: change.storeName,
        data: change.data,
        deviceId: this.deviceId,
        timestamp: Date.now(),
        processed: false
      };
      
      await this.storage.queueWrite('syncQueue', syncRecord, 'high');
      this.pendingChanges.delete(change.id);
    }
  }

  /**
   * Pull changes from other devices
   */
  async pullChanges() {
    // Get unprocessed sync records from other devices
    const allSyncRecords = await this.storage.queryByIndex('syncQueue', 'processed', false);
    
    // Filter out this device's own records
    const remoteChanges = allSyncRecords.filter(record => record.deviceId !== this.deviceId);
    
    // Process remote changes
    for (const record of remoteChanges) {
      try {
        await this.applyRemoteChange(record);
        
        // Mark as processed
        record.processed = true;
        record.processedBy = this.deviceId;
        record.processedAt = Date.now();
        
        await this.storage.queueWrite('syncQueue', record, 'high');
      } catch (error) {
        console.error('Failed to apply remote change:', error);
      }
    }
  }

  /**
   * Apply a remote change from another device
   */
  async applyRemoteChange(record) {
    const { operation, storeName, data, deviceId } = record;
    
    switch (operation) {
      case 'create':
      case 'update':
        await this.storage.queueWrite(storeName, data, 'high');
        break;
      case 'delete':
        await this.storage.delete(storeName, data.id);
        break;
      default:
        console.warn('Unknown sync operation:', operation);
    }
    
    this.notifySubscribers('remoteChange', {
      operation,
      storeName,
      data,
      deviceId
    });
  }

  /**
   * Update device heartbeat
   */
  async updateHeartbeat() {
    const deviceInfo = await this.storage.get('devices', this.deviceId);
    
    if (deviceInfo) {
      deviceInfo.lastSeen = Date.now();
      deviceInfo.status = 'online';
      await this.storage.queueWrite('devices', deviceInfo, 'high');
    }
  }

  /**
   * Clean up old sync records
   */
  async cleanupOldSyncRecords() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    const allRecords = await this.storage.queryByIndex('syncQueue', 'timestamp', IDBKeyRange.lowerBound(0));
    
    for (const record of allRecords) {
      if (record.processed && record.timestamp < cutoffTime) {
        await this.storage.delete('syncQueue', record.id);
      }
    }
  }

  /**
   * Track a local change for sync
   */
  trackChange(operation, storeName, data) {
    const changeId = `${this.deviceId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.pendingChanges.set(changeId, {
      id: changeId,
      operation,
      storeName,
      data,
      timestamp: Date.now()
    });
    
    // Trigger immediate sync for important changes
    if (operation === 'create' || operation === 'delete') {
      this.performSync();
    }
  }

  /**
   * Get connected devices
   */
  async getConnectedDevices() {
    const cutoffTime = Date.now() - (30 * 1000); // 30 seconds ago
    const allDevices = await this.storage.queryByIndex('devices', 'lastSeen', IDBKeyRange.lowerBound(cutoffTime));
    
    return allDevices.filter(device => device.status === 'online');
  }

  /**
   * Get device statistics
   */
  async getDeviceStats() {
    const allDevices = [];
    const cursor = await this.storage.queryRange('devices', 'lastSeen', 0, Date.now(), 1000);
    
    const onlineCount = allDevices.filter(d => d.status === 'online').length;
    const offlineCount = allDevices.length - onlineCount;
    
    const syncStats = await this.storage.getStats();
    
    return {
      totalDevices: allDevices.length,
      onlineDevices: onlineCount,
      offlineDevices: offlineCount,
      currentDevice: this.deviceId,
      syncQueueSize: syncStats.syncQueue || 0,
      pendingChanges: this.pendingChanges.size,
      isSyncing: this.isSyncing,
      isConnected: this.isConnected
    };
  }

  /**
   * Subscribe to sync events
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
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Force immediate sync
   */
  async forceSync() {
    return await this.performSync();
  }

  /**
   * Set conflict resolver
   */
  setConflictResolver(resolver) {
    this.conflictResolver = resolver;
  }

  /**
   * Resolve conflicts between local and remote data
   */
  async resolveConflict(localData, remoteData) {
    if (this.conflictResolver) {
      return await this.conflictResolver(localData, remoteData);
    }
    
    // Default: last write wins (based on timestamp)
    return localData.updatedAt > remoteData.updatedAt ? localData : remoteData;
  }

  /**
   * Disconnect device
   */
  async disconnect() {
    this.stopSync();
    
    const deviceInfo = await this.storage.get('devices', this.deviceId);
    if (deviceInfo) {
      deviceInfo.status = 'offline';
      deviceInfo.lastSeen = Date.now();
      await this.storage.queueWrite('devices', deviceInfo, 'high');
    }
  }

  /**
   * Reconnect device
   */
  async reconnect() {
    await this.registerDevice();
    this.startSync();
  }
}

// Singleton instance
let deviceSyncManagerInstance = null;

export function getDeviceSyncManager(storage) {
  if (!deviceSyncManagerInstance) {
    deviceSyncManagerInstance = new DeviceSyncManager(storage);
  }
  return deviceSyncManagerInstance;
}

export default DeviceSyncManager;
