// Queue Manager
// Monitor and manage waiting orders, kitchen queue, pickup queue, delivery queue, payment queue

import { now } from '../domain/dates.js';

const QUEUES_KEY = 'cafeos_queues';

/**
 * Queue Types
 */
export const QUEUE_TYPES = {
  WAITING: 'WAITING',
  KITCHEN: 'KITCHEN',
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
  PAYMENT: 'PAYMENT'
};

/**
 * Queue Item Status
 */
export const QUEUE_ITEM_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

/**
 * Queue Priority
 */
export const QUEUE_PRIORITY = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

/**
 * Queue Manager class
 * Monitor and manage waiting orders, kitchen queue, pickup queue, delivery queue, payment queue
 */
export class QueueManager {
  constructor() {
    this.queues = new Map();
    this.loadQueues();
  }

  /**
   * Load queues from localStorage
   */
  loadQueues() {
    try {
      const stored = localStorage.getItem(QUEUES_KEY);
      if (stored) {
        const queues = JSON.parse(stored);
        queues.forEach(queue => {
          this.queues.set(queue.id, queue);
        });
      }
    } catch (error) {
      console.error('[QueueManager] Failed to load queues:', error);
    }
  }

  /**
   * Save queues to localStorage
   */
  saveQueues() {
    try {
      const queues = Array.from(this.queues.values());
      localStorage.setItem(QUEUES_KEY, JSON.stringify(queues));
    } catch (error) {
      console.error('[QueueManager] Failed to save queues:', error);
    }
  }

  /**
   * Get or create queue
   * @param {string} queueType - Queue type
   * @param {string} branchId - Branch ID
   * @returns {Object} Queue
   */
  getOrCreateQueue(queueType, branchId = null) {
    const queueId = `${queueType}_${branchId || 'default'}`;
    let queue = this.queues.get(queueId);

    if (!queue) {
      queue = {
        id: queueId,
        type: queueType,
        branchId,
        items: [],
        createdAt: now(),
        updatedAt: now()
      };
      this.queues.set(queueId, queue);
      this.saveQueues();
    }

    return queue;
  }

  /**
   * Add item to queue
   * @param {string} queueType - Queue type
   * @param {Object} itemData - Item data
   * @returns {Object} Queue item
   */
  addToQueue(queueType, itemData) {
    const queue = this.getOrCreateQueue(queueType, itemData.branchId);

    const item = {
      id: `queue_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      queueId: queue.id,
      
      // Reference
      orderId: itemData.orderId || null,
      tableId: itemData.tableId || null,
      customerId: itemData.customerId || null,
      
      // Item details
      name: itemData.name || '',
      description: itemData.description || '',
      items: itemData.items || [],
      quantity: itemData.quantity || 1,
      
      // Status & Priority
      status: QUEUE_ITEM_STATUS.PENDING,
      priority: itemData.priority || QUEUE_PRIORITY.NORMAL,
      
      // Timing
      addedAt: now(),
      startedAt: null,
      readyAt: null,
      completedAt: null,
      estimatedDuration: itemData.estimatedDuration || null,
      actualDuration: null,
      
      // Assignment
      assignedTo: itemData.assignedTo || null,
      assignedAt: null,
      
      // Metadata
      metadata: itemData.metadata || {}
    };

    // Insert based on priority
    this.insertByPriority(queue, item);

    queue.updatedAt = now();
    this.queues.set(queue.id, queue);
    this.saveQueues();

    return item;
  }

  /**
   * Insert item by priority
   * @param {Object} queue - Queue object
   * @param {Object} item - Item to insert
   */
  insertByPriority(queue, item) {
    const priorityOrder = {
      [QUEUE_PRIORITY.URGENT]: 0,
      [QUEUE_PRIORITY.HIGH]: 1,
      [QUEUE_PRIORITY.NORMAL]: 2,
      [QUEUE_PRIORITY.LOW]: 3
    };

    const itemPriority = priorityOrder[item.priority] || 2;

    // Find insertion point
    let insertIndex = queue.items.length;
    for (let i = 0; i < queue.items.length; i++) {
      const existingPriority = priorityOrder[queue.items[i].priority] || 2;
      if (itemPriority < existingPriority) {
        insertIndex = i;
        break;
      }
    }

    queue.items.splice(insertIndex, 0, item);
  }

  /**
   * Get queue by type
   * @param {string} queueType - Queue type
   * @param {string} branchId - Branch ID
   * @returns {Object|null} Queue or null
   */
  getQueue(queueType, branchId = null) {
    const queueId = `${queueType}_${branchId || 'default'}`;
    return this.queues.get(queueId) || null;
  }

  /**
   * Get all queues
   * @returns {Array} Array of queues
   */
  getAllQueues() {
    return Array.from(this.queues.values());
  }

  /**
   * Get queues by type
   * @param {string} queueType - Queue type
   * @returns {Array} Array of queues
   */
  getQueuesByType(queueType) {
    return this.getAllQueues().filter(q => q.type === queueType);
  }

  /**
   * Get queues by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of queues
   */
  getQueuesByBranch(branchId) {
    return this.getAllQueues().filter(q => q.branchId === branchId);
  }

  /**
   * Get queue item by ID
   * @param {string} itemId - Item ID
   * @returns {Object|null} Item or null
   */
  getQueueItem(itemId) {
    for (const queue of this.queues.values()) {
      const item = queue.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }

  /**
   * Update queue item status
   * @param {string} itemId - Item ID
   * @param {string} status - New status
   * @returns {Object} Result
   */
  updateItemStatus(itemId, status) {
    for (const [queueId, queue] of this.queues) {
      const item = queue.items.find(i => i.id === itemId);
      if (item) {
        item.status = status;

        // Update timestamps based on status
        switch (status) {
          case QUEUE_ITEM_STATUS.IN_PROGRESS:
            item.startedAt = now();
            break;
          case QUEUE_ITEM_STATUS.READY:
            item.readyAt = now();
            break;
          case QUEUE_ITEM_STATUS.COMPLETED:
            item.completedAt = now();
            if (item.startedAt) {
              item.actualDuration = item.completedAt - item.startedAt;
            }
            break;
        }

        queue.updatedAt = now();
        this.queues.set(queueId, queue);
        this.saveQueues();

        return { success: true, item };
      }
    }

    return { success: false, reason: 'Item not found' };
  }

  /**
   * Assign item
   * @param {string} itemId - Item ID
   * @param {string} assigneeId - Assignee ID
   * @returns {Object} Result
   */
  assignItem(itemId, assigneeId) {
    for (const [queueId, queue] of this.queues) {
      const item = queue.items.find(i => i.id === itemId);
      if (item) {
        item.assignedTo = assigneeId;
        item.assignedAt = now();
        item.status = QUEUE_ITEM_STATUS.IN_PROGRESS;

        queue.updatedAt = now();
        this.queues.set(queueId, queue);
        this.saveQueues();

        return { success: true, item };
      }
    }

    return { success: false, reason: 'Item not found' };
  }

  /**
   * Update item priority
   * @param {string} itemId - Item ID
   * @param {string} priority - New priority
   * @returns {Object} Result
   */
  updateItemPriority(itemId, priority) {
    for (const [queueId, queue] of this.queues) {
      const itemIndex = queue.items.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        const item = queue.items[itemIndex];
        item.priority = priority;

        // Remove and re-insert by priority
        queue.items.splice(itemIndex, 1);
        this.insertByPriority(queue, item);

        queue.updatedAt = now();
        this.queues.set(queueId, queue);
        this.saveQueues();

        return { success: true, item };
      }
    }

    return { success: false, reason: 'Item not found' };
  }

  /**
   * Reorder items in queue
   * @param {string} queueType - Queue type
   * @param {string} branchId - Branch ID
   * @param {Array} itemIds - New order of item IDs
   * @returns {Object} Result
   */
  reorderQueue(queueType, branchId, itemIds) {
    const queue = this.getQueue(queueType, branchId);
    if (!queue) {
      return { success: false, reason: 'Queue not found' };
    }

    // Create item map
    const itemMap = new Map(queue.items.map(item => [item.id, item]));

    // Rebuild items array in new order
    const reorderedItems = [];
    for (const itemId of itemIds) {
      if (itemMap.has(itemId)) {
        reorderedItems.push(itemMap.get(itemId));
        itemMap.delete(itemId);
      }
    }

    // Add any remaining items that weren't in the reorder list
    for (const item of itemMap.values()) {
      reorderedItems.push(item);
    }

    queue.items = reorderedItems;
    queue.updatedAt = now();
    this.queues.set(queue.id, queue);
    this.saveQueues();

    return { success: true, queue };
  }

  /**
   * Remove item from queue
   * @param {string} itemId - Item ID
   * @returns {Object} Result
   */
  removeFromQueue(itemId) {
    for (const [queueId, queue] of this.queues) {
      const itemIndex = queue.items.findIndex(i => i.id === itemId);
      if (itemIndex !== -1) {
        const item = queue.items[itemIndex];
        queue.items.splice(itemIndex, 1);
        queue.updatedAt = now();
        this.queues.set(queueId, queue);
        this.saveQueues();

        return { success: true, item };
      }
    }

    return { success: false, reason: 'Item not found' };
  }

  /**
   * Cancel item in queue
   * @param {string} itemId - Item ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Result
   */
  cancelItem(itemId, reason = '') {
    for (const [queueId, queue] of this.queues) {
      const item = queue.items.find(i => i.id === itemId);
      if (item) {
        item.status = QUEUE_ITEM_STATUS.CANCELLED;
        item.cancellationReason = reason;
        item.cancelledAt = now();

        queue.updatedAt = now();
        this.queues.set(queueId, queue);
        this.saveQueues();

        return { success: true, item };
      }
    }

    return { success: false, reason: 'Item not found' };
  }

  /**
   * Get queue statistics
   * @param {string} queueType - Queue type
   * @param {string} branchId - Branch ID
   * @returns {Object} Statistics
   */
  getQueueStatistics(queueType, branchId = null) {
    const queue = this.getQueue(queueType, branchId);
    if (!queue) {
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        averageWaitTime: 0
      };
    }

    const pendingItems = queue.items.filter(i => i.status === QUEUE_ITEM_STATUS.PENDING);
    const inProgressItems = queue.items.filter(i => i.status === QUEUE_ITEM_STATUS.IN_PROGRESS);
    const readyItems = queue.items.filter(i => i.status === QUEUE_ITEM_STATUS.READY);

    const byStatus = queue.items.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});

    const byPriority = queue.items.reduce((acc, i) => {
      acc[i.priority] = (acc[i.priority] || 0) + 1;
      return acc;
    }, {});

    // Calculate average wait time for completed items
    const completedItems = queue.items.filter(i => i.status === QUEUE_ITEM_STATUS.COMPLETED && i.startedAt && i.completedAt);
    const averageWaitTime = completedItems.length > 0
      ? completedItems.reduce((sum, i) => sum + (i.completedAt - i.startedAt), 0) / completedItems.length
      : 0;

    return {
      total: queue.items.length,
      pending: pendingItems.length,
      inProgress: inProgressItems.length,
      ready: readyItems.length,
      byStatus,
      byPriority,
      averageWaitTime,
      queueId: queue.id,
      updatedAt: queue.updatedAt
    };
  }

  /**
   * Get all queue statistics
   * @param {string} branchId - Branch ID
   * @returns {Object} All queue statistics
   */
  getAllQueueStatistics(branchId = null) {
    const queues = branchId ? this.getQueuesByBranch(branchId) : this.getAllQueues();

    return {
      byType: queues.reduce((acc, queue) => {
        acc[queue.type] = this.getQueueStatistics(queue.type, queue.branchId);
        return acc;
      }, {}),
      totalItems: queues.reduce((sum, queue) => sum + queue.items.length, 0),
      totalQueues: queues.length
    };
  }

  /**
   * Clear completed items from queue
   * @param {string} queueType - Queue type
   * @param {string} branchId - Branch ID
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of items cleared
   */
  clearCompletedItems(queueType, branchId, olderThan = 24 * 60 * 60 * 1000) {
    const queue = this.getQueue(queueType, branchId);
    if (!queue) return 0;

    const cutoff = now() - olderThan;
    const initialLength = queue.items.length;

    queue.items = queue.items.filter(item => {
      return !(item.status === QUEUE_ITEM_STATUS.COMPLETED && item.completedAt && item.completedAt < cutoff);
    });

    const cleared = initialLength - queue.items.length;

    if (cleared > 0) {
      queue.updatedAt = now();
      this.queues.set(queue.id, queue);
      this.saveQueues();
    }

    return cleared;
  }

  /**
   * Export queues
   * @param {Object} options - Export options
   * @returns {Object} Exported queues
   */
  exportQueues(options = {}) {
    const { branchId, queueType } = options;
    
    let queues = this.getAllQueues();
    
    if (branchId) {
      queues = queues.filter(q => q.branchId === branchId);
    }
    if (queueType) {
      queues = queues.filter(q => q.type === queueType);
    }

    return {
      queues,
      exportedAt: now(),
      totalQueues: queues.length
    };
  }

  /**
   * Import queues
   * @param {Object} data - Imported queues data
   * @returns {Object} Import result
   */
  importQueues(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.queues)) {
        data.queues.forEach(queue => {
          this.queues.set(queue.id, queue);
        });
      }

      this.saveQueues();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let queueManagerInstance = null;

/**
 * Get the queue manager singleton
 * @returns {QueueManager} Queue manager instance
 */
export function getQueueManager() {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManager();
  }
  return queueManagerInstance;
}

/**
 * Reset the queue manager (useful for testing)
 */
export function resetQueueManager() {
  queueManagerInstance = null;
}

/**
 * Convenience function to add item to queue
 * @param {string} queueType - Queue type
 * @param {Object} itemData - Item data
 * @returns {Object} Queue item
 */
export function addToQueue(queueType, itemData = {}) {
  const manager = getQueueManager();
  return manager.addToQueue(queueType, itemData);
}

/**
 * Convenience function to update item status
 * @param {string} itemId - Item ID
 * @param {string} status - New status
 * @returns {Object} Result
 */
export function updateQueueItemStatus(itemId, status) {
  const manager = getQueueManager();
  return manager.updateItemStatus(itemId, status);
}
