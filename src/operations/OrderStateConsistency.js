// Order State Consistency Checks
// Detect stuck orders, auto-alert on abnormal durations, auto-cancel abandoned orders

export class OrderStateConsistency {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || 60000, // 1 minute
      stuckThreshold: options.stuckThreshold || 30 * 60 * 1000, // 30 minutes
      abandonedThreshold: options.abandonedThreshold || 60 * 60 * 1000, // 1 hour
      abnormalThreshold: options.abnormalThreshold || 45 * 60 * 1000, // 45 minutes
      autoCancelEnabled: options.autoCancelEnabled !== false,
      autoAlertEnabled: options.autoAlertEnabled !== false,
      ...options
    };
    
    this.checkTimer = null;
    this.eventHandlers = new Map();
    this.isMonitoring = false;
    this.orderStates = new Map();
  }

  /**
   * Start monitoring
   */
  startMonitoring(orders) {
    if (this.isMonitoring) {
      return;
    }
    
    console.log('[OrderStateConsistency] Starting monitoring');
    this.isMonitoring = true;
    
    // Initial check
    this.checkOrders(orders);
    
    // Set up periodic checks
    this.checkTimer = setInterval(() => {
      this.checkOrders(orders);
    }, this.options.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    console.log('[OrderStateConsistency] Stopping monitoring');
    this.isMonitoring = false;
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Check orders for consistency issues
   */
  checkOrders(orders) {
    if (!orders || !Array.isArray(orders)) {
      return;
    }
    
    const issues = [];
    const now = Date.now();
    
    orders.forEach(order => {
      const orderAge = now - new Date(order.createdAt).getTime();
      const status = order.status;
      
      // Check for stuck orders
      if (this.isStuckOrder(order, orderAge)) {
        issues.push({
          type: 'stuck',
          order,
          orderAge,
          reason: `Order stuck in ${status} for ${this.formatDuration(orderAge)}`
        });
      }
      
      // Check for abnormal durations
      if (this.isAbnormalDuration(order, orderAge)) {
        issues.push({
          type: 'abnormal',
          order,
          orderAge,
          reason: `Order in ${status} for ${this.formatDuration(orderAge)} (abnormal)`
        });
      }
      
      // Check for abandoned orders
      if (this.isAbandonedOrder(order, orderAge)) {
        issues.push({
          type: 'abandoned',
          order,
          orderAge,
          reason: `Order abandoned in ${status} for ${this.formatDuration(orderAge)}`
        });
      }
      
      // Check for partial states
      if (this.isPartialState(order)) {
        issues.push({
          type: 'partial',
          order,
          reason: 'Order in partial state (missing required fields)'
        });
      }
    });
    
    // Handle issues
    issues.forEach(issue => {
      this.handleIssue(issue);
    });
    
    return issues;
  }

  /**
   * Check if order is stuck
   */
  isStuckOrder(order, orderAge) {
    const stuckStatuses = ['PREPARING', 'ACCEPTED'];
    const isStuckStatus = stuckStatuses.includes(order.status);
    const isOverThreshold = orderAge > this.options.stuckThreshold;
    
    return isStuckStatus && isOverThreshold;
  }

  /**
   * Check if order has abnormal duration
   */
  isAbnormalDuration(order, orderAge) {
    const abnormalStatuses = ['NEW', 'ACCEPTED'];
    const isAbnormalStatus = abnormalStatuses.includes(order.status);
    const isOverThreshold = orderAge > this.options.abnormalThreshold;
    
    return isAbnormalStatus && isOverThreshold;
  }

  /**
   * Check if order is abandoned
   */
  isAbandonedOrder(order, orderAge) {
    const abandonedStatuses = ['NEW', 'ACCEPTED', 'PREPARING'];
    const isAbandonedStatus = abandonedStatuses.includes(order.status);
    const isOverThreshold = orderAge > this.options.abandonedThreshold;
    
    return isAbandonedStatus && isOverThreshold;
  }

  /**
   * Check if order is in partial state
   */
  isPartialState(order) {
    // Check for missing required fields
    if (!order.id || !order.items || !Array.isArray(order.items)) {
      return true;
    }
    
    // Check for empty items
    if (order.items.length === 0) {
      return true;
    }
    
    // Check for invalid total amount
    if (typeof order.totalAmount !== 'number' || order.totalAmount <= 0) {
      return true;
    }
    
    // Check for missing customer info for delivery orders
    if (order.orderType === 'DELIVERY' || order.orderType === 'DIRECT_DELIVERY') {
      if (!order.customerPhone || !order.customerAddress) {
        return true;
      }
    }
    
    // Check for missing table for dine-in
    if (order.orderType === 'DINE_IN' && !order.tableId) {
      return true;
    }
    
    return false;
  }

  /**
   * Handle consistency issue
   */
  handleIssue(issue) {
    const { type, order, reason } = issue;
    
    switch (type) {
      case 'stuck':
        this.handleStuckOrder(order, reason);
        break;
      case 'abnormal':
        this.handleAbnormalOrder(order, reason);
        break;
      case 'abandoned':
        this.handleAbandonedOrder(order, reason);
        break;
      case 'partial':
        this.handlePartialState(order, reason);
        break;
    }
  }

  /**
   * Handle stuck order
   */
  handleStuckOrder(order, reason) {
    console.warn(`[OrderStateConsistency] Stuck order detected: ${order.id} - ${reason}`);
    
    this.emit('stuckOrder', { order, reason });
    
    if (this.options.autoAlertEnabled) {
      this.emit('alert', {
        type: 'stuck_order',
        message: `Order ${order.orderId || order.id} is stuck in ${order.status}`,
        order,
        severity: 'warning'
      });
    }
  }

  /**
   * Handle abnormal order duration
   */
  handleAbnormalOrder(order, reason) {
    console.warn(`[OrderStateConsistency] Abnormal order duration: ${order.id} - ${reason}`);
    
    this.emit('abnormalOrder', { order, reason });
    
    if (this.options.autoAlertEnabled) {
      this.emit('alert', {
        type: 'abnormal_duration',
        message: `Order ${order.orderId || order.id} taking unusually long`,
        order,
        severity: 'info'
      });
    }
  }

  /**
   * Handle abandoned order
   */
  handleAbandonedOrder(order, reason) {
    console.warn(`[OrderStateConsistency] Abandoned order detected: ${order.id} - ${reason}`);
    
    this.emit('abandonedOrder', { order, reason });
    
    if (this.options.autoCancelEnabled) {
      this.emit('autoCancel', {
        order,
        reason: 'Auto-cancelled due to abandonment'
      });
    }
    
    if (this.options.autoAlertEnabled) {
      this.emit('alert', {
        type: 'abandoned_order',
        message: `Order ${order.orderId || order.id} was auto-cancelled`,
        order,
        severity: 'warning'
      });
    }
  }

  /**
   * Handle partial state
   */
  handlePartialState(order, reason) {
    console.error(`[OrderStateConsistency] Partial state detected: ${order.id} - ${reason}`);
    
    this.emit('partialState', { order, reason });
    
    if (this.options.autoAlertEnabled) {
      this.emit('alert', {
        type: 'partial_state',
        message: `Order ${order.orderId || order.id} has incomplete data`,
        order,
        severity: 'error'
      });
    }
  }

  /**
   * Recover from partial state
   */
  recoverPartialState(order) {
    console.log(`[OrderStateConsistency] Attempting to recover partial state: ${order.id}`);
    
    const recoveryActions = [];
    
    // Recover missing items
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      recoveryActions.push('items_cleared');
    }
    
    // Recover missing total amount
    if (typeof order.totalAmount !== 'number' || order.totalAmount <= 0) {
      if (order.items && Array.isArray(order.items)) {
        const calculatedTotal = order.items.reduce((sum, item) => {
          return sum + (item.price * item.quantity || 0);
        }, 0);
        recoveryActions.push('total_recalculated');
      }
    }
    
    // Recover missing customer info for delivery
    if ((order.orderType === 'DELIVERY' || order.orderType === 'DIRECT_DELIVERY') && 
        (!order.customerPhone || !order.customerAddress)) {
      recoveryActions.push('customer_info_missing');
    }
    
    // Recover missing table for dine-in
    if (order.orderType === 'DINE_IN' && !order.tableId) {
      recoveryActions.push('table_missing');
    }
    
    this.emit('recoveryAttempt', {
      order,
      actions: recoveryActions
    });
    
    return recoveryActions;
  }

  /**
   * Get order state statistics
   */
  getStatistics(orders) {
    if (!orders || !Array.isArray(orders)) {
      return null;
    }
    
    const now = Date.now();
    const stats = {
      total: orders.length,
      byStatus: {},
      byAge: {
        recent: 0, // < 15 minutes
        normal: 0, // 15-30 minutes
        long: 0, // 30-60 minutes
        veryLong: 0 // > 60 minutes
      },
      stuckOrders: [],
      abnormalOrders: [],
      abandonedOrders: [],
      partialOrders: []
    };
    
    orders.forEach(order => {
      // By status
      const status = order.status || 'UNKNOWN';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      
      // By age
      const orderAge = now - new Date(order.createdAt).getTime();
      const ageMinutes = orderAge / (60 * 1000);
      
      if (ageMinutes < 15) {
        stats.byAge.recent++;
      } else if (ageMinutes < 30) {
        stats.byAge.normal++;
      } else if (ageMinutes < 60) {
        stats.byAge.long++;
      } else {
        stats.byAge.veryLong++;
      }
      
      // Check for issues
      if (this.isStuckOrder(order, orderAge)) {
        stats.stuckOrders.push(order.id);
      }
      
      if (this.isAbnormalDuration(order, orderAge)) {
        stats.abnormalOrders.push(order.id);
      }
      
      if (this.isAbandonedOrder(order, orderAge)) {
        stats.abandonedOrders.push(order.id);
      }
      
      if (this.isPartialState(order)) {
        stats.partialOrders.push(order.id);
      }
    });
    
    return stats;
  }

  /**
   * Format duration for display
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Update thresholds
   */
  updateThresholds(thresholds) {
    if (thresholds.stuckThreshold !== undefined) {
      this.options.stuckThreshold = thresholds.stuckThreshold;
    }
    if (thresholds.abandonedThreshold !== undefined) {
      this.options.abandonedThreshold = thresholds.abandonedThreshold;
    }
    if (thresholds.abnormalThreshold !== undefined) {
      this.options.abnormalThreshold = thresholds.abnormalThreshold;
    }
  }

  /**
   * Enable/disable auto-cancel
   */
  setAutoCancelEnabled(enabled) {
    this.options.autoCancelEnabled = enabled;
  }

  /**
   * Enable/disable auto-alert
   */
  setAutoAlertEnabled(enabled) {
    this.options.autoAlertEnabled = enabled;
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[OrderStateConsistency] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the consistency checker
   */
  destroy() {
    this.stopMonitoring();
    this.eventHandlers.clear();
    this.orderStates.clear();
    console.log('[OrderStateConsistency] Destroyed');
  }
}

// Singleton instance
let orderStateConsistencyInstance = null;

/**
 * Get the singleton order state consistency instance
 */
export function getOrderStateConsistency(options = {}) {
  if (!orderStateConsistencyInstance) {
    orderStateConsistencyInstance = new OrderStateConsistency(options);
  }
  return orderStateConsistencyInstance;
}

export default OrderStateConsistency;
