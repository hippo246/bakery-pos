// Status Update Handler for Delivery Platforms
// Handles sending order status updates to Zomato and Swiggy

import { getDeliveryPlatformFactory, PlatformType } from './DeliveryPlatformFactory.js';
import { getDeliveryOrderStorage, DeliveryOrderStatus } from './DeliveryPlatformAdapter.js';

export class StatusUpdateHandler {
  constructor() {
    this.factory = getDeliveryPlatformFactory();
    this.storage = getDeliveryOrderStorage();
    this.updateHistory = [];
    this.loadUpdateHistory();
  }

  /**
   * Load update history from localStorage
   */
  loadUpdateHistory() {
    try {
      const stored = localStorage.getItem('cafeos_status_update_history');
      if (stored) {
        this.updateHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[StatusUpdateHandler] Failed to load update history:', error);
    }
  }

  /**
   * Save update history to localStorage
   */
  saveUpdateHistory() {
    try {
      // Keep only last 1000 updates
      if (this.updateHistory.length > 1000) {
        this.updateHistory.shift();
      }
      localStorage.setItem('cafeos_status_update_history', JSON.stringify(this.updateHistory));
    } catch (error) {
      console.error('[StatusUpdateHandler] Failed to save update history:', error);
    }
  }

  /**
   * Log status update
   */
  logStatusUpdate(platform, orderId, status, result, metadata = {}) {
    const logEntry = {
      platform,
      orderId,
      status,
      result,
      metadata,
      timestamp: new Date().toISOString()
    };
    
    this.updateHistory.push(logEntry);
    this.saveUpdateHistory();
  }

  /**
   * Accept order on platform
   */
  async acceptOrder(platformOrderId, platformType, estimatedTime = 30) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.acceptOrder(platformOrderId, estimatedTime);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.ACCEPTED, result, {
        estimatedTime
      });
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to accept order on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.ACCEPTED, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reject order on platform
   */
  async rejectOrder(platformOrderId, platformType, reason = 'Restaurant rejected') {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.rejectOrder(platformOrderId, reason);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.REJECTED, result, {
        reason
      });
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to reject order on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.REJECTED, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark order as preparing
   */
  async markPreparing(platformOrderId, platformType) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.updateOrderStatus(platformOrderId, DeliveryOrderStatus.PREPARING);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.PREPARING, result);
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to mark preparing on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.PREPARING, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark order as ready for pickup
   */
  async markReadyForPickup(platformOrderId, platformType) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.markReadyForPickup(platformOrderId);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.READY, result);
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to mark ready on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.READY, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark order as picked up
   */
  async markPickedUp(platformOrderId, platformType, deliveryPartner = null) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.updateOrderStatus(platformOrderId, DeliveryOrderStatus.PICKED_UP, {
        deliveryPartner
      });
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.PICKED_UP, result, {
        deliveryPartner
      });
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to mark picked up on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.PICKED_UP, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark order as delivered
   */
  async markDelivered(platformOrderId, platformType) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.updateOrderStatus(platformOrderId, DeliveryOrderStatus.DELIVERED);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.DELIVERED, result);
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to mark delivered on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.DELIVERED, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel order on platform
   */
  async cancelOrder(platformOrderId, platformType, reason = 'Cancelled by restaurant') {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.cancelOrder(platformOrderId, reason);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.CANCELLED, result, {
        reason
      });
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to cancel order on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, DeliveryOrderStatus.CANCELLED, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update delivery partner assignment
   */
  async updateDeliveryPartner(platformOrderId, platformType, deliveryPartner) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.updateOrderStatus(platformOrderId, DeliveryOrderStatus.PREPARING, {
        deliveryPartner
      });
      
      this.logStatusUpdate(platformType, platformOrderId, 'delivery_partner_update', result, {
        deliveryPartner
      });
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to update delivery partner on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, 'delivery_partner_update', {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Batch update status for multiple orders
   */
  async batchUpdateStatus(updates) {
    const results = [];
    
    for (const update of updates) {
      const result = await this.updateOrderStatus(
        update.platformOrderId,
        update.status,
        update.platformType,
        update.metadata
      );
      results.push({
        platformOrderId: update.platformOrderId,
        result
      });
    }
    
    return results;
  }

  /**
   * Generic order status update
   */
  async updateOrderStatus(platformOrderId, status, platformType, metadata = {}) {
    try {
      const platform = await this.factory.getPlatform(platformType);
      const result = await platform.updateOrderStatus(platformOrderId, status, metadata);
      
      this.logStatusUpdate(platformType, platformOrderId, status, result, metadata);
      
      return result;
    } catch (error) {
      console.error(`[StatusUpdateHandler] Failed to update status on ${platformType}:`, error);
      
      this.logStatusUpdate(platformType, platformOrderId, status, {
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get status update statistics
   */
  getUpdateStatistics() {
    const stats = {
      total: this.updateHistory.length,
      byPlatform: {},
      byStatus: {},
      byStatusResult: {},
      recentUpdates: []
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.updateHistory.forEach(log => {
      // By platform
      if (!stats.byPlatform[log.platform]) {
        stats.byPlatform[log.platform] = 0;
      }
      stats.byPlatform[log.platform]++;

      // By status
      if (!stats.byStatus[log.status]) {
        stats.byStatus[log.status] = 0;
      }
      stats.byStatus[log.status]++;

      // By status result
      const statusResult = log.result?.success ? 'success' : 'failure';
      if (!stats.byStatusResult[statusResult]) {
        stats.byStatusResult[statusResult] = 0;
      }
      stats.byStatusResult[statusResult]++;

      // Recent updates (last hour)
      if (new Date(log.timestamp) > oneHourAgo) {
        stats.recentUpdates.push(log);
      }
    });

    return stats;
  }

  /**
   * Get recent update history
   */
  getRecentUpdates(limit = 50) {
    return this.updateHistory.slice(-limit);
  }

  /**
   * Get failed updates
   */
  getFailedUpdates(limit = 50) {
    return this.updateHistory
      .filter(log => !log.result?.success)
      .slice(-limit);
  }

  /**
   * Retry failed updates
   */
  async retryFailedUpdates() {
    const failedUpdates = this.getFailedUpdates(100);
    const results = [];
    
    for (const update of failedUpdates) {
      const result = await this.updateOrderStatus(
        update.orderId,
        update.status,
        update.platform,
        update.metadata
      );
      results.push({
        orderId: update.orderId,
        result
      });
    }
    
    return results;
  }

  /**
   * Clear update history
   */
  clearUpdateHistory() {
    this.updateHistory = [];
    this.saveUpdateHistory();
  }

  /**
   * Get status update recommendations
   */
  getUpdateRecommendations() {
    const recommendations = [];
    
    // Check for failed updates
    const failedUpdates = this.getFailedUpdates(10);
    if (failedUpdates.length > 5) {
      recommendations.push({
        type: 'high_failure_rate',
        message: `${failedUpdates.length} failed status updates in recent history`,
        priority: 'high',
        action: 'retry_failed_updates'
      });
    }

    // Check for stuck orders
    const stuckOrders = this.storage.getByStatus(DeliveryOrderStatus.ACCEPTED);
    if (stuckOrders.length > 0) {
      recommendations.push({
        type: 'stuck_orders',
        message: `${stuckOrders.length} orders stuck in accepted status`,
        priority: 'medium',
        action: 'update_order_status'
      });
    }

    return recommendations;
  }

  /**
   * Destroy the status update handler
   */
  destroy() {
    console.log('[StatusUpdateHandler] Destroyed');
  }
}

// Singleton instance
let statusUpdateHandlerInstance = null;

/**
 * Get the singleton status update handler instance
 */
export function getStatusUpdateHandler() {
  if (!statusUpdateHandlerInstance) {
    statusUpdateHandlerInstance = new StatusUpdateHandler();
  }
  return statusUpdateHandlerInstance;
}

export default StatusUpdateHandler;
