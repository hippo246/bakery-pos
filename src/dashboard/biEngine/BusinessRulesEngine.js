/**
 * Business Rules Engine
 * Defines and executes business rules for generating recommendations and warnings
 * All rules are deterministic and based on real operational data
 */

class BusinessRulesEngine {
  constructor() {
    this.rules = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the business rules engine
   */
  initialize() {
    if (this.initialized) return;
    
    this.registerDefaultRules();
    this.initialized = true;
  }

  /**
   * Register a business rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} rule - Rule definition
   */
  registerRule(ruleId, rule) {
    this.rules.set(ruleId, rule);
  }

  /**
   * Get a rule by ID
   * @param {string} ruleId - Rule identifier
   * @returns {Object|null}
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get all rules
   * @returns {Array<Object>}
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by category
   * @param {string} category - Rule category
   * @returns {Array<Object>}
   */
  getRulesByCategory(category) {
    return this.getAllRules().filter(rule => rule.category === category);
  }

  /**
   * Execute a rule
   * @param {string} ruleId - Rule identifier
   * @param {Object} data - Operational data
   * @returns {Object|null} Rule result or null if rule doesn't trigger
   */
  executeRule(ruleId, data) {
    const rule = this.getRule(ruleId);
    if (!rule) return null;

    try {
      const triggered = rule.condition(data);
      if (triggered) {
        return {
          ruleId,
          category: rule.category,
          priority: rule.priority,
          title: rule.title,
          message: rule.message(data),
          reason: rule.reason(data),
          affectedArea: rule.affectedArea,
          businessImpact: rule.businessImpact,
          suggestedAction: rule.suggestedAction,
          data: rule.data ? rule.data(data) : null,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error(`Error executing rule ${ruleId}:`, error);
    }

    return null;
  }

  /**
   * Execute all rules
   * @param {Object} data - Operational data
   * @returns {Array<Object>} Triggered rules
   */
  executeAllRules(data) {
    const results = [];
    
    this.rules.forEach((rule, ruleId) => {
      const result = this.executeRule(ruleId, data);
      if (result) {
        results.push(result);
      }
    });

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    results.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return results;
  }

  /**
   * Register default business rules
   */
  registerDefaultRules() {
    // Kitchen rules
    this.registerRule('kitchen-overloaded', {
      category: 'kitchen',
      priority: 'high',
      title: 'Kitchen Overloaded',
      condition: (data) => {
        return data.kitchen?.kitchenLoad > 80;
      },
      message: (data) => `Kitchen load is at ${data.kitchen.kitchenLoad}%`,
      reason: (data) => `Kitchen load exceeds 80% threshold`,
      affectedArea: 'Kitchen Operations',
      businessImpact: 'Orders may be delayed',
      suggestedAction: 'Consider opening an additional station or assigning more staff',
      data: (data) => ({ load: data.kitchen.kitchenLoad, queueSize: data.kitchen.waiting })
    });

    this.registerRule('kitchen-delayed-orders', {
      category: 'kitchen',
      priority: 'high',
      title: 'Order Delays Detected',
      condition: (data) => {
        return data.kitchen?.delayed > 5;
      },
      message: (data) => `${data.kitchen.delayed} orders are delayed`,
      reason: (data) => `Delayed orders exceed threshold of 5`,
      affectedArea: 'Kitchen Operations',
      businessImpact: 'Customer satisfaction may be affected',
      suggestedAction: 'Review kitchen queue and prioritize delayed orders',
      data: (data) => ({ delayed: data.kitchen.delayed, critical: data.kitchen.criticalDelays })
    });

    this.registerRule('kitchen-station-overload', {
      category: 'kitchen',
      priority: 'medium',
      title: 'Station Overload',
      condition: (data) => {
        const stations = data.kitchen?.stationUtilization || {};
        return Object.values(stations).some(util => util > 85);
      },
      message: (data) => 'One or more kitchen stations are overloaded',
      reason: (data) => 'Station utilization exceeds 85%',
      affectedArea: 'Kitchen Operations',
      businessImpact: 'Preparation bottlenecks may occur',
      suggestedAction: 'Redistribute orders or add station capacity',
      data: (data) => ({ stations: data.kitchen.stationUtilization })
    });

    // Inventory rules
    this.registerRule('inventory-critical', {
      category: 'inventory',
      priority: 'critical',
      title: 'Critical Stock Level',
      condition: (data) => {
        return data.inventory?.critical?.length > 0;
      },
      message: (data) => `${data.inventory.critical.length} items at critical stock`,
      reason: (data) => 'Stock levels are critically low',
      affectedArea: 'Inventory',
      businessImpact: 'Unable to fulfill orders for these items',
      suggestedAction: 'Restock immediately or remove from menu',
      data: (data) => ({ items: data.inventory.critical })
    });

    this.registerRule('inventory-out-of-stock', {
      category: 'inventory',
      priority: 'critical',
      title: 'Out of Stock Items',
      condition: (data) => {
        return data.inventory?.out?.length > 0;
      },
      message: (data) => `${data.inventory.out.length} items are out of stock`,
      reason: (data) => 'Items have zero stock available',
      affectedArea: 'Inventory',
      businessImpact: 'Orders for these items cannot be fulfilled',
      suggestedAction: 'Restock immediately or disable items',
      data: (data) => ({ items: data.inventory.out })
    });

    this.registerRule('inventory-expiring', {
      category: 'inventory',
      priority: 'medium',
      title: 'Items Expiring Soon',
      condition: (data) => {
        return data.inventory?.expiring?.length > 0;
      },
      message: (data) => `${data.inventory.expiring.length} items expiring soon`,
      reason: (data) => 'Perishable items approaching expiration,
      affectedArea: 'Inventory',
      businessImpact: 'Potential waste and loss',
      suggestedAction: 'Use in promotions or discount before expiration',
      data: (data) => ({ items: data.inventory.expiring })
    });

    // Table rules
    this.registerRule('table-overstay', {
      category: 'tables',
      priority: 'medium',
      title: 'Tables Overstayed',
      condition: (data) => {
        return data.tables?.overstayed > 0;
      },
      message: (data) => `${data.tables.overstayed} tables have overstayed`,
      reason: (data) => 'Tables occupied longer than average',
      affectedArea: 'Table Management',
      businessImpact: 'Reduced table turnover',
      suggestedAction: 'Gentle reminder or check if assistance needed',
      data: (data) => ({ overstayed: data.tables.overstayed })
    });

    this.registerRule('table-high-occupancy', {
      category: 'tables',
      priority: 'low',
      title: 'High Occupancy Rate',
      condition: (data) => {
        return data.tables?.occupancyRate > 85;
      },
      message: (data) => `Occupancy at ${data.tables.occupancyRate}%`,
      reason: (data) => 'Occupancy rate is high',
      affectedArea: 'Table Management',
      businessImpact: 'May need to manage wait times',
      suggestedAction: 'Monitor wait times and consider reservation policy',
      data: (data) => ({ occupancyRate: data.tables.occupancyRate })
    });

    // Payment rules
    this.registerRule('payment-failures', {
      category: 'payments',
      priority: 'high',
      title: 'Payment Failures Detected',
      condition: (data) => {
        if (!data.payments || data.payments.total === 0) return false;
        const failureRate = (data.payments.failed / data.payments.total) * 100;
        return failureRate > 5;
      },
      message: (data) => `Payment failure rate elevated`,
      reason: (data) => 'Payment failure rate exceeds 5%',
      affectedArea: 'Payments',
      businessImpact: 'Revenue loss and customer frustration',
      suggestedAction: 'Check payment gateway and retry failed transactions',
      data: (data) => ({ 
        failed: data.payments.failed, 
        total: data.payments.total,
        failureRate: ((data.payments.failed / data.payments.total) * 100).toFixed(1)
      })
    });

    // Order rules
    this.registerRule('order-cancellation-high', {
      category: 'orders',
      priority: 'medium',
      title: 'High Cancellation Rate',
      condition: (data) => {
        if (!data.orders || data.orders.total === 0) return false;
        const cancelRate = (data.orders.cancelled / data.orders.total) * 100;
        return cancelRate > 5;
      },
      message: (data) => `Cancellation rate elevated`,
      reason: (data) => 'Cancellation rate exceeds 5%',
      affectedArea: 'Orders',
      businessImpact: 'Revenue loss and operational inefficiency',
      suggestedAction: 'Review cancelled orders for patterns',
      data: (data) => ({
        cancelled: data.orders.cancelled,
        total: data.orders.total,
        cancelRate: ((data.orders.cancelled / data.orders.total) * 100).toFixed(1)
      })
    });

    // Staff rules
    this.registerRule('staff-shortage', {
      category: 'staff',
      priority: 'medium',
      title: 'Staff Shortage',
      condition: (data) => {
        return data.staff?.active < 3;
      },
      message: (data) => `Only ${data.staff.active} staff members active`,
      reason: (data) => 'Active staff count is low',
      affectedArea: 'Staff',
      businessImpact: 'Service quality may be affected',
      suggestedAction: 'Consider calling in additional staff',
      data: (data) => ({ active: data.staff.active, total: data.staff.clockedIn })
    });
  }
}

// Singleton instance
const businessRulesEngine = new BusinessRulesEngine();

export default businessRulesEngine;
