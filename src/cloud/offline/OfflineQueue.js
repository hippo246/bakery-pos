// Offline Queue for Storage Operations
// Queues operations when offline and syncs when online

/**
 * Offline Queue
 * Manages queued storage operations for offline scenarios
 */
class OfflineQueue {
  constructor() {
    this.initialized = false;
    this.queue = [];
    this.maxQueueSize = 1000;
    this.isProcessing = false;
    this.isOnline = true;
  }

  /**
   * Initialize offline queue
   */
  async initialize() {
    if (this.initialized) return;
    this.loadQueue();
    this.setupOnlineStatusListener();
    this.initialized = true;
  }

  /**
   * Setup online status listener
   */
  setupOnlineStatusListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    this.isOnline = navigator.onLine;
  }

  /**
   * Add operation to queue
   * @param {string} operation 
   * @param {object} data 
   * @returns {string} - Operation ID
   */
  enqueue(operation, data) {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const queuedOperation = {
      operationId,
      operation,
      data,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retries: 0,
      maxRetries: 3
    };

    this.queue.push(queuedOperation);

    // Limit queue size
    if (this.queue.length > this.maxQueueSize) {
      this.queue.shift();
    }

    this.saveQueue();

    // Process immediately if online
    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }

    return operationId;
  }

  /**
   * Process queued operations
   */
  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingOperations = this.queue.filter(op => op.status === 'pending');

      for (const operation of pendingOperations) {
        try {
          const result = await this.executeOperation(operation);
          
          if (result.success) {
            operation.status = 'completed';
            operation.completedAt = new Date().toISOString();
          } else {
            operation.status = 'failed';
            operation.error = result.error;
            operation.retries++;

            if (operation.retries >= operation.maxRetries) {
              operation.status = 'failed_permanent';
            }
          }
        } catch (error) {
          operation.status = 'failed';
          operation.error = error.message;
          operation.retries++;

          if (operation.retries >= operation.maxRetries) {
            operation.status = 'failed_permanent';
          }
        }

        this.saveQueue();
      }

      // Remove completed operations
      this.cleanupCompleted();
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a queued operation
   * @param {object} operation 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async executeOperation(operation) {
    // This is a placeholder - actual execution would be handled by StorageService
    // For now, we just mark as completed
    return { success: true };
  }

  /**
   * Remove completed operations from queue
   */
  cleanupCompleted() {
    const before = this.queue.length;
    this.queue = this.queue.filter(op => op.status !== 'completed');
    const after = this.queue.length;

    if (before !== after) {
      this.saveQueue();
    }
  }

  /**
   * Get queue status
   * @returns {object}
   */
  getStatus() {
    const pending = this.queue.filter(op => op.status === 'pending').length;
    const completed = this.queue.filter(op => op.status === 'completed').length;
    const failed = this.queue.filter(op => op.status === 'failed').length;
    const failedPermanent = this.queue.filter(op => op.status === 'failed_permanent').length;

    return {
      total: this.queue.length,
      pending,
      completed,
      failed,
      failedPermanent,
      isOnline: this.isOnline,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Get operation by ID
   * @param {string} operationId 
   * @returns {object|null}
   */
  getOperation(operationId) {
    return this.queue.find(op => op.operationId === operationId) || null;
  }

  /**
   * Retry failed operations
   */
  retryFailed() {
    this.queue.forEach(op => {
      if (op.status === 'failed') {
        op.status = 'pending';
        op.retries = 0;
      }
    });

    this.saveQueue();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Clear queue
   * @param {string} status 
   */
  clearQueue(status) {
    if (status) {
      this.queue = this.queue.filter(op => op.status !== status);
    } else {
      this.queue = [];
    }

    this.saveQueue();
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem('cafeos_offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const data = localStorage.getItem('cafeos_offline_queue');
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
    }
  }

  /**
   * Get queue statistics
   * @returns {object}
   */
  getStatistics() {
    const operationsByType = {};
    const operationsByStatus = {};

    for (const operation of this.queue) {
      // Count by type
      if (!operationsByType[operation.operation]) {
        operationsByType[operation.operation] = 0;
      }
      operationsByType[operation.operation]++;

      // Count by status
      if (!operationsByStatus[operation.status]) {
        operationsByStatus[operation.status] = 0;
      }
      operationsByStatus[operation.status]++;
    }

    return {
      totalOperations: this.queue.length,
      operationsByType,
      operationsByStatus,
      oldestOperation: this.queue.length > 0 ? this.queue[0].timestamp : null,
      newestOperation: this.queue.length > 0 ? this.queue[this.queue.length - 1].timestamp : null
    };
  }
}

// Singleton instance
const offlineQueue = new OfflineQueue();

export default offlineQueue;
