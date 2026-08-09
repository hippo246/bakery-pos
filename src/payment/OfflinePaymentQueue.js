// Offline Payment Queue
// Manages payment attempts when offline and syncs when connection restored

import { getPaymentStorage, PaymentRecord, PaymentStatus } from './PaymentGateway.js';
import { getPaymentGatewayFactory } from './PaymentGatewayFactory.js';

export class OfflinePaymentQueue {
  constructor() {
    this.queue = [];
    this.syncInProgress = false;
    this.storageKey = 'cafeos_offline_payment_queue';
    this.loadQueue();
    this.setupNetworkListeners();
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[OfflinePaymentQueue] Loaded ${this.queue.length} queued payments`);
      }
    } catch (error) {
      console.error('[OfflinePaymentQueue] Failed to load queue:', error);
    }
  }

  /**
   * Save queue to localStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflinePaymentQueue] Failed to save queue:', error);
    }
  }

  /**
   * Setup network event listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('[OfflinePaymentQueue] Connection restored, starting sync');
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflinePaymentQueue] Connection lost, payments will be queued');
    });
  }

  /**
   * Check if online
   */
  isOnline() {
    return navigator.onLine;
  }

  /**
   * Queue payment for offline processing
   */
  queuePayment(paymentDetails) {
    const queuedPayment = {
      id: this.generateId(),
      paymentDetails,
      timestamp: Date.now(),
      attempts: 0,
      status: 'queued'
    };

    this.queue.push(queuedPayment);
    this.saveQueue();

    console.log(`[OfflinePaymentQueue] Payment queued: ${queuedPayment.id}`);

    return queuedPayment;
  }

  /**
   * Sync queued payments when online
   */
  async syncQueue() {
    if (!this.isOnline() || this.syncInProgress || this.queue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`[OfflinePaymentQueue] Starting sync for ${this.queue.length} payments`);

    const results = {
      success: 0,
      failed: 0,
      remaining: 0
    };

    const remaining = [];

    for (const queuedPayment of this.queue) {
      if (queuedPayment.attempts >= 3) {
        console.warn(`[OfflinePaymentQueue] Skipping payment ${queuedPayment.id} after 3 attempts`);
        remaining.push(queuedPayment);
        results.failed++;
        continue;
      }

      try {
        queuedPayment.attempts++;
        queuedPayment.status = 'processing';

        const result = await this.processQueuedPayment(queuedPayment);

        if (result.success) {
          console.log(`[OfflinePaymentQueue] Successfully synced payment ${queuedPayment.id}`);
          results.success++;
        } else {
          console.error(`[OfflinePaymentQueue] Failed to sync payment ${queuedPayment.id}:`, result.error);
          remaining.push(queuedPayment);
          results.failed++;
        }
      } catch (error) {
        console.error(`[OfflinePaymentQueue] Error processing payment ${queuedPayment.id}:`, error);
        remaining.push(queuedPayment);
        results.failed++;
      }
    }

    this.queue = remaining;
    this.saveQueue();
    this.syncInProgress = false;

    console.log(`[OfflinePaymentQueue] Sync complete: ${results.success} success, ${results.failed} failed, ${results.remaining} remaining`);

    return results;
  }

  /**
   * Process a queued payment
   */
  async processQueuedPayment(queuedPayment) {
    const factory = getPaymentGatewayFactory();
    const paymentStorage = getPaymentStorage();

    try {
      const gateway = await factory.getGateway();
      
      const result = await gateway.processPayment(queuedPayment.paymentDetails);

      if (result.success) {
        // Update payment record
        const paymentRecord = paymentStorage.getById(queuedPayment.paymentDetails.orderId);
        if (paymentRecord) {
          paymentRecord.updateStatus(PaymentStatus.COMPLETED, {
            gatewayResponse: result
          });
          paymentStorage.save(paymentRecord);
        }

        return { success: true, result };
      }

      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      length: this.queue.length,
      isOnline: this.isOnline(),
      syncInProgress: this.syncInProgress,
      items: this.queue.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        attempts: item.attempts,
        status: item.status,
        amount: item.paymentDetails.amount
      }))
    };
  }

  /**
   * Get queued payment by ID
   */
  getQueuedPayment(id) {
    return this.queue.find(item => item.id === id);
  }

  /**
   * Remove queued payment
   */
  removeQueuedPayment(id) {
    this.queue = this.queue.filter(item => item.id !== id);
    this.saveQueue();
  }

  /**
   * Clear all queued payments
   */
  clearQueue() {
    this.queue = [];
    this.saveQueue();
    console.log('[OfflinePaymentQueue] Queue cleared');
  }

  /**
   * Retry a specific queued payment
   */
  async retryQueuedPayment(id) {
    const queuedPayment = this.getQueuedPayment(id);
    
    if (!queuedPayment) {
      return { success: false, error: 'Payment not found in queue' };
    }

    if (!this.isOnline()) {
      return { success: false, error: 'Offline - cannot retry' };
    }

    try {
      queuedPayment.attempts++;
      queuedPayment.status = 'processing';

      const result = await this.processQueuedPayment(queuedPayment);

      if (result.success) {
        this.removeQueuedPayment(id);
      } else {
        queuedPayment.status = 'queued';
        this.saveQueue();
      }

      return result;
    } catch (error) {
      queuedPayment.status = 'queued';
      this.saveQueue();
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `offline_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStatistics() {
    const stats = {
      total: this.queue.length,
      byStatus: {},
      byAttempts: {},
      totalAmount: 0,
      oldestTimestamp: null,
      newestTimestamp: null
    };

    this.queue.forEach(item => {
      // By status
      stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;

      // By attempts
      stats.byAttempts[item.attempts] = (stats.byAttempts[item.attempts] || 0) + 1;

      // Total amount
      stats.totalAmount += item.paymentDetails.amount || 0;

      // Timestamps
      if (!stats.oldestTimestamp || item.timestamp < stats.oldestTimestamp) {
        stats.oldestTimestamp = item.timestamp;
      }
      if (!stats.newestTimestamp || item.timestamp > stats.newestTimestamp) {
        stats.newestTimestamp = item.timestamp;
      }
    });

    return stats;
  }

  /**
   * Destroy the queue
   */
  destroy() {
    window.removeEventListener('online', this.syncQueue);
    window.removeEventListener('offline', () => {});
    this.queue = [];
    this.syncInProgress = false;
    console.log('[OfflinePaymentQueue] Destroyed');
  }
}

// Singleton instance
let offlinePaymentQueueInstance = null;

/**
 * Get the singleton offline payment queue instance
 */
export function getOfflinePaymentQueue() {
  if (!offlinePaymentQueueInstance) {
    offlinePaymentQueueInstance = new OfflinePaymentQueue();
  }
  return offlinePaymentQueueInstance;
}

export default OfflinePaymentQueue;
