// Operational Warnings with Configurable Thresholds
// Provides configurable warnings for operational issues

import { now } from './dates.js';

const WARNINGS_CONFIG_KEY = 'cafeos_warnings_config';

/**
 * Warning Types
 */
export const WARNING_TYPES = {
  HIGH_VALUE_ORDER: 'HIGH_VALUE_ORDER',
  LARGE_ORDER: 'LARGE_ORDER',
  LONG_PREPARATION_TIME: 'LONG_PREPARATION_TIME',
  DELAYED_ORDER: 'DELAYED_ORDER',
  TABLE_CAPACITY: 'TABLE_CAPACITY',
  INVENTORY_LOW: 'INVENTORY_LOW',
  DISCOUNT_HIGH: 'DISCOUNT_HIGH',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  CUSTOMER_HIGH_SPENDING: 'CUSTOMER_HIGH_SPENDING',
  STAFF_OVERLOAD: 'STAFF_OVERLOAD',
  KITCHEN_BACKLOG: 'KITCHEN_BACKLOG',
  ORDER_MODIFICATION: 'ORDER_MODIFICATION',
  PRICE_OVERRIDE: 'PRICE_OVERRIDE'
};

/**
 * Warning Severity Levels
 */
export const WARNING_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL'
};

/**
 * Operational Warnings Manager class
 * Manages operational warnings with configurable thresholds
 */
export class OrderWarningsManager {
  constructor() {
    this.thresholds = new Map();
    this.activeWarnings = new Map();
    this.warningHistory = new Map();
    this.loadThresholds();
  }

  /**
   * Load thresholds from localStorage
   */
  loadThresholds() {
    try {
      const stored = localStorage.getItem(WARNINGS_CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        Object.entries(config).forEach(([key, value]) => {
          this.thresholds.set(key, value);
        });
      } else {
        // Set default thresholds
        this.setDefaultThresholds();
      }
    } catch (error) {
      console.error('[OrderWarningsManager] Failed to load thresholds:', error);
      this.setDefaultThresholds();
    }
  }

  /**
   * Save thresholds to localStorage
   */
  saveThresholds() {
    try {
      const config = Object.fromEntries(this.thresholds);
      localStorage.setItem(WARNINGS_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('[OrderWarningsManager] Failed to save thresholds:', error);
    }
  }

  /**
   * Set default thresholds
   */
  setDefaultThresholds() {
    this.thresholds.set(WARNING_TYPES.HIGH_VALUE_ORDER, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 500, // Amount in currency
      description: 'Order total exceeds threshold'
    });

    this.thresholds.set(WARNING_TYPES.LARGE_ORDER, {
      enabled: true,
      severity: WARNING_SEVERITY.INFO,
      threshold: 20, // Number of items
      description: 'Order has many items'
    });

    this.thresholds.set(WARNING_TYPES.LONG_PREPARATION_TIME, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 30, // Minutes
      description: 'Order preparation time exceeds threshold'
    });

    this.thresholds.set(WARNING_TYPES.DELAYED_ORDER, {
      enabled: true,
      severity: WARNING_SEVERITY.CRITICAL,
      threshold: 15, // Minutes beyond expected time
      description: 'Order is delayed beyond expected time'
    });

    this.thresholds.set(WARNING_TYPES.TABLE_CAPACITY, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 0.9, // 90% capacity
      description: 'Table capacity nearly full'
    });

    this.thresholds.set(WARNING_TYPES.INVENTORY_LOW, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 5, // Minimum quantity
      description: 'Inventory running low'
    });

    this.thresholds.set(WARNING_TYPES.DISCOUNT_HIGH, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 0.2, // 20% discount
      description: 'Discount percentage exceeds threshold'
    });

    this.thresholds.set(WARNING_TYPES.PAYMENT_FAILED, {
      enabled: true,
      severity: WARNING_SEVERITY.CRITICAL,
      threshold: 1, // Any failure
      description: 'Payment processing failed'
    });

    this.thresholds.set(WARNING_TYPES.CUSTOMER_HIGH_SPENDING, {
      enabled: true,
      severity: WARNING_SEVERITY.INFO,
      threshold: 1000, // Daily spending limit
      description: 'Customer spending exceeds daily limit'
    });

    this.thresholds.set(WARNING_TYPES.STAFF_OVERLOAD, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 10, // Active orders per staff
      description: 'Staff has too many active orders'
    });

    this.thresholds.set(WARNING_TYPES.KITCHEN_BACKLOG, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 20, // Pending kitchen orders
      description: 'Kitchen has backlog of orders'
    });

    this.thresholds.set(WARNING_TYPES.ORDER_MODIFICATION, {
      enabled: true,
      severity: WARNING_SEVERITY.INFO,
      threshold: 3, // Number of modifications
      description: 'Order modified multiple times'
    });

    this.thresholds.set(WARNING_TYPES.PRICE_OVERRIDE, {
      enabled: true,
      severity: WARNING_SEVERITY.WARNING,
      threshold: 0.1, // 10% deviation
      description: 'Price override exceeds threshold'
    });

    this.saveThresholds();
  }

  /**
   * Set threshold for warning type
   * @param {string} warningType - Warning type
   * @param {Object} config - Threshold configuration
   * @returns {Object} Set result
   */
  setThreshold(warningType, config) {
    const existing = this.thresholds.get(warningType) || {};
    this.thresholds.set(warningType, { ...existing, ...config });
    this.saveThresholds();

    return {
      success: true,
      warningType,
      config: this.thresholds.get(warningType)
    };
  }

  /**
   * Get threshold for warning type
   * @param {string} warningType - Warning type
   * @returns {Object|null} Threshold config or null
   */
  getThreshold(warningType) {
    return this.thresholds.get(warningType) || null;
  }

  /**
   * Get all thresholds
   * @returns {Object} All thresholds
   */
  getAllThresholds() {
    return Object.fromEntries(this.thresholds);
  }

  /**
   * Check order for warnings
   * @param {Order} order - Order to check
   * @param {Object} context - Additional context (inventory, staff load, etc.)
   * @returns {Array} Array of warnings
   */
  checkOrderWarnings(order, context = {}) {
    const warnings = [];

    // Check high value order
    const highValueThreshold = this.thresholds.get(WARNING_TYPES.HIGH_VALUE_ORDER);
    if (highValueThreshold?.enabled && order.total >= highValueThreshold.threshold) {
      warnings.push(this.createWarning(WARNING_TYPES.HIGH_VALUE_ORDER, {
        orderTotal: order.total,
        threshold: highValueThreshold.threshold,
        severity: highValueThreshold.severity
      }));
    }

    // Check large order
    const largeOrderThreshold = this.thresholds.get(WARNING_TYPES.LARGE_ORDER);
    if (largeOrderThreshold?.enabled && order.items.length >= largeOrderThreshold.threshold) {
      warnings.push(this.createWarning(WARNING_TYPES.LARGE_ORDER, {
        itemCount: order.items.length,
        threshold: largeOrderThreshold.threshold,
        severity: largeOrderThreshold.severity
      }));
    }

    // Check discount
    const discountThreshold = this.thresholds.get(WARNING_TYPES.DISCOUNT_HIGH);
    if (discountThreshold?.enabled && order.discountAmount > 0) {
      const discountPercent = order.discountAmount / order.subtotal;
      if (discountPercent >= discountThreshold.threshold) {
        warnings.push(this.createWarning(WARNING_TYPES.DISCOUNT_HIGH, {
          discountPercent,
          threshold: discountThreshold.threshold,
          severity: discountThreshold.severity
        }));
      }
    }

    // Check order modifications
    const modThreshold = this.thresholds.get(WARNING_TYPES.ORDER_MODIFICATION);
    if (modThreshold?.enabled) {
      const modCount = context.modificationCount || 0;
      if (modCount >= modThreshold.threshold) {
        warnings.push(this.createWarning(WARNING_TYPES.ORDER_MODIFICATION, {
          modificationCount: modCount,
          threshold: modThreshold.threshold,
          severity: modThreshold.severity
        }));
      }
    }

    // Check inventory
    const inventoryThreshold = this.thresholds.get(WARNING_TYPES.INVENTORY_LOW);
    if (inventoryThreshold?.enabled && context.inventory) {
      order.items.forEach(item => {
        const available = context.inventory[item.menuItemId];
        if (available !== undefined && available < inventoryThreshold.threshold) {
          warnings.push(this.createWarning(WARNING_TYPES.INVENTORY_LOW, {
            menuItemId: item.menuItemId,
            menuItemName: item.name,
            available,
            threshold: inventoryThreshold.threshold,
            severity: inventoryThreshold.severity
          }));
        }
      });
    }

    // Check customer spending
    const spendingThreshold = this.thresholds.get(WARNING_TYPES.CUSTOMER_HIGH_SPENDING);
    if (spendingThreshold?.enabled && context.customerDailyTotal) {
      if (context.customerDailyTotal >= spendingThreshold.threshold) {
        warnings.push(this.createWarning(WARNING_TYPES.CUSTOMER_HIGH_SPENDING, {
          customerId: order.customerId,
          dailyTotal: context.customerDailyTotal,
          threshold: spendingThreshold.threshold,
          severity: spendingThreshold.severity
        }));
      }
    }

    // Store warnings
    warnings.forEach(warning => {
      this.activeWarnings.set(warning.id, warning);
    });

    return warnings;
  }

  /**
   * Check operational warnings (not order-specific)
   * @param {Object} context - Operational context
   * @returns {Array} Array of warnings
   */
  checkOperationalWarnings(context = {}) {
    const warnings = [];

    // Check staff overload
    const staffThreshold = this.thresholds.get(WARNING_TYPES.STAFF_OVERLOAD);
    if (staffThreshold?.enabled && context.staffLoad) {
      Object.entries(context.staffLoad).forEach(([staffId, load]) => {
        if (load.activeOrders >= staffThreshold.threshold) {
          warnings.push(this.createWarning(WARNING_TYPES.STAFF_OVERLOAD, {
            staffId,
            activeOrders: load.activeOrders,
            threshold: staffThreshold.threshold,
            severity: staffThreshold.severity
          }));
        }
      });
    }

    // Check kitchen backlog
    const kitchenThreshold = this.thresholds.get(WARNING_TYPES.KITCHEN_BACKLOG);
    if (kitchenThreshold?.enabled && context.kitchenBacklog !== undefined) {
      if (context.kitchenBacklog >= kitchenThreshold.threshold) {
        warnings.push(this.createWarning(WARNING_TYPES.KITCHEN_BACKLOG, {
          backlog: context.kitchenBacklog,
          threshold: kitchenThreshold.threshold,
          severity: kitchenThreshold.severity
        }));
      }
    }

    // Check table capacity
    const tableThreshold = this.thresholds.get(WARNING_TYPES.TABLE_CAPACITY);
    if (tableThreshold?.enabled && context.tableCapacity) {
      Object.entries(context.tableCapacity).forEach(([tableId, capacity]) => {
        const utilization = capacity.occupied / capacity.total;
        if (utilization >= tableThreshold.threshold) {
          warnings.push(this.createWarning(WARNING_TYPES.TABLE_CAPACITY, {
            tableId,
            utilization,
            threshold: tableThreshold.threshold,
            severity: tableThreshold.severity
          }));
        }
      });
    }

    // Store warnings
    warnings.forEach(warning => {
      this.activeWarnings.set(warning.id, warning);
    });

    return warnings;
  }

  /**
   * Check delayed orders
   * @param {Order[]} orders - Array of orders
   * @param {Object} context - Context with expected times
   * @returns {Array} Array of warnings
   */
  checkDelayedOrders(orders, context = {}) {
    const warnings = [];
    const delayThreshold = this.thresholds.get(WARNING_TYPES.DELAYED_ORDER);

    if (!delayThreshold?.enabled) {
      return warnings;
    }

    const currentTime = now();

    orders.forEach(order => {
      const expectedTime = context.expectedTimes?.[order.id];
      if (expectedTime && currentTime > expectedTime) {
        const delayMinutes = (currentTime - expectedTime) / (1000 * 60);
        if (delayMinutes >= delayThreshold.threshold) {
          warnings.push(this.createWarning(WARNING_TYPES.DELAYED_ORDER, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            delayMinutes,
            threshold: delayThreshold.threshold,
            severity: delayThreshold.severity
          }));
        }
      }
    });

    return warnings;
  }

  /**
   * Create a warning object
   * @param {string} type - Warning type
   * @param {Object} data - Warning data
   * @returns {Object} Warning object
   */
  createWarning(type, data = {}) {
    const threshold = this.thresholds.get(type) || {};
    
    return {
      id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity: data.severity || threshold.severity || WARNING_SEVERITY.WARNING,
      description: threshold.description || '',
      data,
      createdAt: now(),
      acknowledged: false
    };
  }

  /**
   * Acknowledge a warning
   * @param {string} warningId - Warning ID
   * @param {string} acknowledgedBy - Staff ID
   * @returns {Object} Acknowledge result
   */
  acknowledgeWarning(warningId, acknowledgedBy = null) {
    const warning = this.activeWarnings.get(warningId);
    if (!warning) {
      return {
        success: false,
        reason: 'Warning not found'
      };
    }

    warning.acknowledged = true;
    warning.acknowledgedAt = now();
    warning.acknowledgedBy = acknowledgedBy;

    // Record in history
    this.recordWarningAcknowledgment(warning, acknowledgedBy);

    return {
      success: true,
      warning
    };
  }

  /**
   * Dismiss a warning
   * @param {string} warningId - Warning ID
   * @param {string} dismissedBy - Staff ID
   * @returns {Object} Dismiss result
   */
  dismissWarning(warningId, dismissedBy = null) {
    const dismissed = this.activeWarnings.delete(warningId);
    
    if (dismissed) {
      // Record in history
      this.recordWarningDismissal(warningId, dismissedBy);
    }

    return {
      success: dismissed,
      reason: dismissed ? null : 'Warning not found'
    };
  }

  /**
   * Get active warnings
   * @param {Object} filters - Filter options
   * @returns {Array} Array of active warnings
   */
  getActiveWarnings(filters = {}) {
    let warnings = Array.from(this.activeWarnings.values());

    if (filters.type) {
      warnings = warnings.filter(w => w.type === filters.type);
    }

    if (filters.severity) {
      warnings = warnings.filter(w => w.severity === filters.severity);
    }

    if (filters.acknowledged !== undefined) {
      warnings = warnings.filter(w => w.acknowledged === filters.acknowledged);
    }

    return warnings.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get warning by ID
   * @param {string} warningId - Warning ID
   * @returns {Object|null} Warning or null
   */
  getWarning(warningId) {
    return this.activeWarnings.get(warningId) || null;
  }

  /**
   * Clear acknowledged warnings older than specified time
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of warnings cleared
   */
  clearAcknowledgedWarnings(olderThan = 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleared = 0;

    for (const [warningId, warning] of this.activeWarnings) {
      if (warning.acknowledged && warning.acknowledgedAt < cutoff) {
        this.activeWarnings.delete(warningId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Record warning acknowledgment in history
   * @param {Object} warning - Warning object
   * @param {string} acknowledgedBy - Staff ID
   */
  recordWarningAcknowledgment(warning, acknowledgedBy) {
    const historyId = `warn_ack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.warningHistory.set(historyId, {
      id: historyId,
      action: 'ACKNOWLEDGED',
      warningId: warning.id,
      warningType: warning.type,
      acknowledgedBy,
      acknowledgedAt: now()
    });
  }

  /**
   * Record warning dismissal in history
   * @param {string} warningId - Warning ID
   * @param {string} dismissedBy - Staff ID
   */
  recordWarningDismissal(warningId, dismissedBy) {
    const historyId = `warn_dis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.warningHistory.set(historyId, {
      id: historyId,
      action: 'DISMISSED',
      warningId,
      dismissedBy,
      dismissedAt: now()
    });
  }

  /**
   * Get warning history
   * @returns {Array} Array of history records
   */
  getWarningHistory() {
    return Array.from(this.warningHistory.values());
  }

  /**
   * Get warning statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const activeWarnings = this.getActiveWarnings();
    const history = this.getWarningHistory();

    return {
      activeWarnings: activeWarnings.length,
      byType: activeWarnings.reduce((acc, w) => {
        acc[w.type] = (acc[w.type] || 0) + 1;
        return acc;
      }, {}),
      bySeverity: activeWarnings.reduce((acc, w) => {
        acc[w.severity] = (acc[w.severity] || 0) + 1;
        return acc;
      }, {}),
      acknowledged: activeWarnings.filter(w => w.acknowledged).length,
      unacknowledged: activeWarnings.filter(w => !w.acknowledged).length,
      totalAcknowledgments: history.filter(h => h.action === 'ACKNOWLEDGED').length,
      totalDismissals: history.filter(h => h.action === 'DISMISSED').length
    };
  }

  /**
   * Reset all thresholds to defaults
   */
  resetThresholds() {
    this.thresholds.clear();
    this.setDefaultThresholds();
  }

  /**
   * Enable/disable warning type
   * @param {string} warningType - Warning type
   * @param {boolean} enabled - Whether to enable
   * @returns {Object} Result
   */
  setWarningEnabled(warningType, enabled) {
    const threshold = this.thresholds.get(warningType);
    if (!threshold) {
      return {
        success: false,
        reason: 'Warning type not found'
      };
    }

    threshold.enabled = enabled;
    this.saveThresholds();

    return {
      success: true,
      warningType,
      enabled
    };
  }

  /**
   * Export thresholds configuration
   * @returns {Object} Exported configuration
   */
  exportConfiguration() {
    return {
      thresholds: Object.fromEntries(this.thresholds),
      exportedAt: now()
    };
  }

  /**
   * Import thresholds configuration
   * @param {Object} data - Imported configuration
   * @returns {Object} Import result
   */
  importConfiguration(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (data.thresholds && typeof data.thresholds === 'object') {
        Object.entries(data.thresholds).forEach(([key, value]) => {
          this.thresholds.set(key, value);
        });
      }

      this.saveThresholds();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let warningsManagerInstance = null;

/**
 * Get the order warnings manager singleton
 * @returns {OrderWarningsManager} Warnings manager instance
 */
export function getOrderWarningsManager() {
  if (!warningsManagerInstance) {
    warningsManagerInstance = new OrderWarningsManager();
  }
  return warningsManagerInstance;
}

/**
 * Reset the warnings manager (useful for testing)
 */
export function resetOrderWarningsManager() {
  warningsManagerInstance = null;
}

/**
 * Convenience function to check order warnings
 * @param {Order} order - Order to check
 * @param {Object} context - Additional context
 * @returns {Array} Array of warnings
 */
export function checkOrderWarnings(order, context = {}) {
  const manager = getOrderWarningsManager();
  return manager.checkOrderWarnings(order, context);
}
