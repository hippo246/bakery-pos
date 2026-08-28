// High-Capacity IndexedDB Storage for BakeryPOS
// Supports 100k+ entries with concurrent device access

export class IndexedDBStorage {
  constructor(dbName = 'BakeryPOS_DB', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this.writeQueue = [];
    this.isProcessingQueue = false;
    this.maxQueueSize = 1000;
    this.batchSize = 50;
    this.batchDelay = 100; // ms between batches
    this.subscribers = new Map();
  }

  /**
   * Initialize IndexedDB with optimized schema
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Orders store - optimized for high volume
        if (!db.objectStoreNames.contains('orders')) {
          const ordersStore = db.createObjectStore('orders', { keyPath: 'id' });
          ordersStore.createIndex('createdAt', 'createdAt', { unique: false });
          ordersStore.createIndex('status', 'status', { unique: false });
          ordersStore.createIndex('tableId', 'tableId', { unique: false });
          ordersStore.createIndex('deviceId', 'deviceId', { unique: false });
        }

        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          const customersStore = db.createObjectStore('customers', { keyPath: 'id' });
          customersStore.createIndex('name', 'name', { unique: false });
          customersStore.createIndex('phone', 'phone', { unique: false });
          customersStore.createIndex('email', 'email', { unique: false });
        }

        // Inventory store
        if (!db.objectStoreNames.contains('inventory')) {
          const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id' });
          inventoryStore.createIndex('category', 'category', { unique: false });
          inventoryStore.createIndex('name', 'name', { unique: false });
        }

        // Menu items store
        if (!db.objectStoreNames.contains('menuItems')) {
          const menuStore = db.createObjectStore('menuItems', { keyPath: 'id' });
          menuStore.createIndex('category', 'category', { unique: false });
          menuStore.createIndex('name', 'name', { unique: false });
        }

        // Tables store
        if (!db.objectStoreNames.contains('tables')) {
          const tablesStore = db.createObjectStore('tables', { keyPath: 'id' });
          tablesStore.createIndex('status', 'status', { unique: false });
        }

        // Sync queue for multi-device coordination
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('deviceId', 'deviceId', { unique: false });
          syncStore.createIndex('processed', 'processed', { unique: false });
        }

        // Device registry for tracking connected devices
        if (!db.objectStoreNames.contains('devices')) {
          const devicesStore = db.createObjectStore('devices', { keyPath: 'deviceId' });
          devicesStore.createIndex('lastSeen', 'lastSeen', { unique: false });
          devicesStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  /**
   * Batch write operation for high-volume data
   */
  async batchWrite(storeName, items) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const results = [];

      items.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => results.push({ success: true, id: item.id });
        request.onerror = () => results.push({ success: false, id: item.id, error: request.error });
      });

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(new Error(`Batch write failed for ${storeName}`));
    });
  }

  /**
   * Queue write operation for processing
   */
  async queueWrite(storeName, item, priority = 'normal') {
    const writeOp = { storeName, item, priority, timestamp: Date.now() };

    if (priority === 'high') {
      this.writeQueue.unshift(writeOp);
    } else {
      this.writeQueue.push(writeOp);
    }

    // Trim queue if too large
    if (this.writeQueue.length > this.maxQueueSize) {
      this.writeQueue = this.writeQueue.slice(0, this.maxQueueSize);
    }

    this.processQueue();
  }

  /**
   * Process write queue in batches
   */
  async processQueue() {
    if (this.isProcessingQueue || this.writeQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.writeQueue.length > 0) {
      const batch = this.writeQueue.splice(0, Math.min(this.batchSize, this.writeQueue.length));
      
      // Group by store name
      const grouped = batch.reduce((acc, op) => {
        if (!acc[op.storeName]) acc[op.storeName] = [];
        acc[op.storeName].push(op.item);
        return acc;
      }, {});

      // Process each store
      for (const [storeName, items] of Object.entries(grouped)) {
        try {
          await this.batchWrite(storeName, items);
          this.notifySubscribers(storeName, 'batchWrite', { count: items.length });
        } catch (error) {
          console.error(`Batch write failed for ${storeName}:`, error);
          // Re-queue failed items
          items.forEach(item => this.queueWrite(storeName, item, 'high'));
        }
      }

      // Small delay between batches to prevent blocking
      await new Promise(resolve => setTimeout(resolve, this.batchDelay));
    }

    this.isProcessingQueue = false;
  }

  /**
   * Read single item
   */
  async get(storeName, key) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Get failed for ${storeName}`));
    });
  }

  /**
   * Read multiple items by keys
   */
  async getAll(storeName, keys) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const results = [];

      keys.forEach(key => {
        const request = store.get(key);
        request.onsuccess = () => {
          if (request.result) results.push(request.result);
        };
      });

      transaction.oncomplete = () => resolve(results);
      transaction.onerror = () => reject(new Error(`GetAll failed for ${storeName}`));
    });
  }

  /**
   * Query with index
   */
  async queryByIndex(storeName, indexName, value) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Query failed for ${storeName}.${indexName}`));
    });
  }

  /**
   * Range query with pagination
   */
  async queryRange(storeName, indexName, lowerBound, upperBound, limit = 100, offset = 0) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const range = IDBKeyRange.lowerBound(lowerBound);
      const results = [];
      let count = 0;
      let skipped = 0;

      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor && count < limit) {
          if (skipped < offset) {
            skipped++;
            cursor.continue();
          } else {
            results.push(cursor.value);
            count++;
            cursor.continue();
          }
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(new Error(`Range query failed for ${storeName}`));
    });
  }

  /**
   * Get count of items in store
   */
  async count(storeName) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Count failed for ${storeName}`));
    });
  }

  /**
   * Delete item
   */
  async delete(storeName, key) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        this.notifySubscribers(storeName, 'delete', { key });
        resolve(true);
      };
      request.onerror = () => reject(new Error(`Delete failed for ${storeName}`));
    });
  }

  /**
   * Clear entire store
   */
  async clear(storeName) {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.notifySubscribers(storeName, 'clear', {});
        resolve(true);
      };
      request.onerror = () => reject(new Error(`Clear failed for ${storeName}`));
    });
  }

  /**
   * Get storage statistics
   */
  async getStats() {
    if (!this.db) await this.initialize();

    const stats = {};
    const storeNames = ['orders', 'customers', 'inventory', 'menuItems', 'tables', 'syncQueue', 'devices'];

    for (const storeName of storeNames) {
      try {
        stats[storeName] = await this.count(storeName);
      } catch (error) {
        stats[storeName] = 0;
      }
    }

    stats.queueSize = this.writeQueue.length;
    stats.isProcessing = this.isProcessingQueue;

    return stats;
  }

  /**
   * Subscribe to store changes
   */
  subscribe(storeName, callback) {
    if (!this.subscribers.has(storeName)) {
      this.subscribers.set(storeName, new Set());
    }
    this.subscribers.get(storeName).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(storeName);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(storeName);
        }
      }
    };
  }

  /**
   * Notify subscribers of changes
   */
  notifySubscribers(storeName, action, data) {
    const callbacks = this.subscribers.get(storeName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({ action, data, timestamp: Date.now() });
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Destroy database (for testing/reset)
   */
  async destroy() {
    await this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(new Error('Failed to delete database'));
    });
  }
}

// Singleton instance
let indexedDBStorageInstance = null;

export function getIndexedDBStorage() {
  if (!indexedDBStorageInstance) {
    indexedDBStorageInstance = new IndexedDBStorage();
  }
  return indexedDBStorageInstance;
}

export default IndexedDBStorage;
