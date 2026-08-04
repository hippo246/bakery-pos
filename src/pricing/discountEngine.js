// Discount Engine
// Centralized discount engine with various discount types

import { now } from '../domain/dates.js';

const DISCOUNT_RULES_KEY = 'cafeos_discount_rules';

/**
 * Discount Types
 */
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  BUY_X_GET_Y: 'BUY_X_GET_Y',
  FREE_ITEM: 'FREE_ITEM',
  COMBO_DISCOUNT: 'COMBO_DISCOUNT',
  BUNDLE_DISCOUNT: 'BUNDLE_DISCOUNT',
  CATEGORY_DISCOUNT: 'CATEGORY_DISCOUNT',
  ITEM_DISCOUNT: 'ITEM_DISCOUNT',
  TABLE_DISCOUNT: 'TABLE_DISCOUNT',
  CUSTOMER_DISCOUNT: 'CUSTOMER_DISCOUNT',
  STAFF_DISCOUNT: 'STAFF_DISCOUNT',
  MANUAL_DISCOUNT: 'MANUAL_DISCOUNT',
  AUTOMATIC_DISCOUNT: 'AUTOMATIC_DISCOUNT'
};

/**
 * Discount Priority Order (lower number = higher priority)
 */
export const DISCOUNT_PRIORITY = {
  MANUAL_DISCOUNT: 1,
  STAFF_DISCOUNT: 2,
  CUSTOMER_DISCOUNT: 3,
  BUY_X_GET_Y: 4,
  FREE_ITEM: 5,
  COMBO_DISCOUNT: 6,
  BUNDLE_DISCOUNT: 7,
  CATEGORY_DISCOUNT: 8,
  ITEM_DISCOUNT: 9,
  TABLE_DISCOUNT: 10,
  AUTOMATIC_DISCOUNT: 11,
  PERCENTAGE: 12,
  FIXED_AMOUNT: 13
};

/**
 * Discount Engine class
 * Centralized discount engine with various discount types
 */
export class DiscountEngine {
  constructor() {
    this.discountRules = new Map();
    this.discountCache = new Map();
    this.usageTracking = new Map();
    this.loadDiscountRules();
  }

  /**
   * Load discount rules from localStorage
   */
  loadDiscountRules() {
    try {
      const stored = localStorage.getItem(DISCOUNT_RULES_KEY);
      if (stored) {
        const rules = JSON.parse(stored);
        rules.forEach(rule => {
          this.discountRules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('[DiscountEngine] Failed to load discount rules:', error);
    }
  }

  /**
   * Save discount rules to localStorage
   */
  saveDiscountRules() {
    try {
      const rules = Array.from(this.discountRules.values());
      localStorage.setItem(DISCOUNT_RULES_KEY, JSON.stringify(rules));
      this.discountCache.clear();
    } catch (error) {
      console.error('[DiscountEngine] Failed to save discount rules:', error);
    }
  }

  /**
   * Add a discount rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  addDiscountRule(ruleData) {
    const rule = {
      id: `discount_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ruleData.type || DISCOUNT_TYPES.PERCENTAGE,
      priority: ruleData.priority || DISCOUNT_PRIORITY[ruleData.type] || 100,
      name: ruleData.name || 'Untitled Discount',
      description: ruleData.description || '',
      menuItemId: ruleData.menuItemId || null,
      categoryId: ruleData.categoryId || null,
      tableId: ruleData.tableId || null,
      customerId: ruleData.customerId || null,
      customerGroup: ruleData.customerGroup || null,
      branchId: ruleData.branchId || null,
      percentage: ruleData.percentage || null,
      fixedAmount: ruleData.fixedAmount || null,
      maxDiscountAmount: ruleData.maxDiscountAmount || null,
      minOrderAmount: ruleData.minOrderAmount || 0,
      maxOrderAmount: ruleData.maxOrderAmount || null,
      buyQuantity: ruleData.buyQuantity || null,
      getQuantity: ruleData.getQuantity || null,
      getMenuItemId: ruleData.getMenuItemId || null,
      freeMenuItemId: ruleData.freeMenuItemId || null,
      comboItems: ruleData.comboItems || [],
      bundleItems: ruleData.bundleItems || [],
      requiresApproval: ruleData.requiresApproval || false,
      approvalThreshold: ruleData.approvalThreshold || null,
      maxUsage: ruleData.maxUsage || null,
      maxUsagePerCustomer: ruleData.maxUsagePerCustomer || null,
      schedule: ruleData.schedule || null,
      conditions: ruleData.conditions || [],
      enabled: ruleData.enabled !== false,
      createdAt: now(),
      createdBy: ruleData.createdBy || null,
      metadata: ruleData.metadata || {}
    };

    this.discountRules.set(rule.id, rule);
    this.saveDiscountRules();

    return rule;
  }

  /**
   * Get applicable discount rules
   * @param {Object} context - Discount context
   * @returns {Array} Applicable rules sorted by priority
   */
  getApplicableRules(context) {
    const {
      menuItemId,
      categoryId,
      tableId,
      customerId,
      customerGroup,
      branchId,
      orderTotal,
      items,
      timestamp
    } = context;

    const currentTime = timestamp || now();
    const currentDay = new Date(currentTime).getDay();
    const currentHour = new Date(currentTime).getHours();

    const applicableRules = [];

    for (const rule of this.discountRules.values()) {
      if (!rule.enabled) continue;

      // Check item/category match
      if (rule.menuItemId && rule.menuItemId !== menuItemId) continue;
      if (rule.categoryId && rule.categoryId !== categoryId) continue;

      // Check table match
      if (rule.tableId && rule.tableId !== tableId) continue;

      // Check customer match
      if (rule.customerId && rule.customerId !== customerId) continue;
      if (rule.customerGroup && rule.customerGroup !== customerGroup) continue;

      // Check branch match
      if (rule.branchId && rule.branchId !== branchId) continue;

      // Check order amount limits
      if (rule.minOrderAmount && orderTotal < rule.minOrderAmount) continue;
      if (rule.maxOrderAmount && orderTotal > rule.maxOrderAmount) continue;

      // Check schedule
      if (rule.schedule) {
        if (!this.isScheduleActive(rule.schedule, currentTime, currentDay, currentHour)) {
          continue;
        }
      }

      // Check conditions
      if (rule.conditions && rule.conditions.length > 0) {
        if (!this.evaluateConditions(rule.conditions, context)) {
          continue;
        }
      }

      // Check usage limits
      if (!this.checkUsageLimit(rule, customerId)) {
        continue;
      }

      applicableRules.push(rule);
    }

    return applicableRules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if schedule is active
   * @param {Object} schedule - Schedule configuration
   * @param {number} currentTime - Current timestamp
   * @param {number} currentDay - Current day of week
   * @param {number} currentHour - Current hour
   * @returns {boolean} Whether schedule is active
   */
  isScheduleActive(schedule, currentTime, currentDay, currentHour) {
    if (schedule.startDate && currentTime < schedule.startDate) return false;
    if (schedule.endDate && currentTime > schedule.endDate) return false;
    if (schedule.days && schedule.days.length > 0) {
      if (!schedule.days.includes(currentDay)) return false;
    }
    if (schedule.startTime !== undefined && schedule.endTime !== undefined) {
      if (currentHour < schedule.startTime || currentHour >= schedule.endTime) return false;
    }
    return true;
  }

  /**
   * Evaluate rule conditions
   * @param {Array} conditions - Array of conditions
   * @param {Object} context - Discount context
   * @returns {boolean} Whether conditions are met
   */
  evaluateConditions(conditions, context) {
    return conditions.every(condition => {
      switch (condition.field) {
        case 'quantity':
          return this.evaluateNumericCondition(condition, context.quantity);
        case 'total':
          return this.evaluateNumericCondition(condition, context.orderTotal);
        case 'customerId':
          return condition.value === context.customerId;
        case 'customerGroup':
          return condition.value === context.customerGroup;
        case 'firstOrder':
          return context.isFirstOrder === condition.value;
        default:
          return true;
      }
    });
  }

  /**
   * Evaluate numeric condition
   * @param {Object} condition - Condition object
   * @param {number} value - Value to check
   * @returns {boolean} Whether condition is met
   */
  evaluateNumericCondition(condition, value) {
    switch (condition.operator) {
      case 'gt':
        return value > condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lt':
        return value < condition.value;
      case 'lte':
        return value <= condition.value;
      case 'eq':
        return value === condition.value;
      case 'ne':
        return value !== condition.value;
      default:
        return true;
    }
  }

  /**
   * Check usage limit
   * @param {Object} rule - Discount rule
   * @param {string} customerId - Customer ID
   * @returns {boolean} Whether usage limit is not exceeded
   */
  checkUsageLimit(rule, customerId) {
    const usageKey = `${rule.id}_${customerId || 'global'}`;
    const usage = this.usageTracking.get(usageKey) || { count: 0 };

    if (rule.maxUsage && usage.count >= rule.maxUsage) {
      return false;
    }

    if (customerId && rule.maxUsagePerCustomer && usage.count >= rule.maxUsagePerCustomer) {
      return false;
    }

    return true;
  }

  /**
   * Calculate discount for an item or order
   * @param {number} baseAmount - Base amount
   * @param {Object} context - Discount context
   * @returns {Object} Discount result
   */
  calculateDiscount(baseAmount, context) {
    const cacheKey = this.getCacheKey(baseAmount, context);
    const cached = this.discountCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rules = this.getApplicableRules(context);
    let totalDiscount = 0;
    const appliedRules = [];
    let requiresApproval = false;

    for (const rule of rules) {
      const result = this.applyRule(rule, baseAmount, context);
      if (result.applied) {
        totalDiscount += result.discountAmount;
        appliedRules.push({
          ruleId: rule.id,
          type: rule.type,
          name: rule.name,
          discountAmount: result.discountAmount,
          requiresApproval: rule.requiresApproval
        });

        if (rule.requiresApproval) {
          requiresApproval = true;
        }

        // Track usage
        this.trackUsage(rule.id, context.customerId);
      }
    }

    // Apply max discount limit if specified
    const maxLimit = this.getMaxDiscountLimit(rules);
    if (maxLimit && totalDiscount > maxLimit) {
      totalDiscount = maxLimit;
    }

    const discountResult = {
      baseAmount,
      totalDiscount,
      finalAmount: Math.max(0, baseAmount - totalDiscount),
      discountPercentage: (totalDiscount / baseAmount) * 100,
      appliedRules,
      requiresApproval,
      calculatedAt: now()
    };

    this.discountCache.set(cacheKey, discountResult);
    return discountResult;
  }

  /**
   * Apply a discount rule
   * @param {Object} rule - Discount rule
   * @param {number} baseAmount - Base amount
   * @param {Object} context - Discount context
   * @returns {Object} Application result
   */
  applyRule(rule, baseAmount, context) {
    let discountAmount = 0;

    switch (rule.type) {
      case DISCOUNT_TYPES.PERCENTAGE:
        if (rule.percentage !== null) {
          discountAmount = baseAmount * (rule.percentage / 100);
        }
        break;

      case DISCOUNT_TYPES.FIXED_AMOUNT:
        if (rule.fixedAmount !== null) {
          discountAmount = rule.fixedAmount;
        }
        break;

      case DISCOUNT_TYPES.BUY_X_GET_Y:
        if (rule.buyQuantity && rule.getQuantity && context.quantity >= rule.buyQuantity) {
          const multiplier = Math.floor(context.quantity / rule.buyQuantity);
          discountAmount = multiplier * rule.getQuantity * (context.unitPrice || 0);
        }
        break;

      case DISCOUNT_TYPES.FREE_ITEM:
        if (rule.freeMenuItemId && context.quantity >= (rule.buyQuantity || 1)) {
          discountAmount = context.unitPrice || 0;
        }
        break;

      case DISCOUNT_TYPES.COMBO_DISCOUNT:
        if (rule.comboItems && rule.comboItems.length > 0) {
          const comboMatch = this.checkComboMatch(rule.comboItems, context.items);
          if (comboMatch) {
            discountAmount = baseAmount * (rule.percentage || 0) / 100;
          }
        }
        break;

      case DISCOUNT_TYPES.BUNDLE_DISCOUNT:
        if (rule.bundleItems && rule.bundleItems.length > 0) {
          const bundleMatch = this.checkBundleMatch(rule.bundleItems, context.items);
          if (bundleMatch) {
            discountAmount = rule.fixedAmount || baseAmount * (rule.percentage || 0) / 100;
          }
        }
        break;

      case DISCOUNT_TYPES.CATEGORY_DISCOUNT:
      case DISCOUNT_TYPES.ITEM_DISCOUNT:
        if (rule.percentage !== null) {
          discountAmount = baseAmount * (rule.percentage / 100);
        } else if (rule.fixedAmount !== null) {
          discountAmount = rule.fixedAmount;
        }
        break;

      case DISCOUNT_TYPES.TABLE_DISCOUNT:
      case DISCOUNT_TYPES.CUSTOMER_DISCOUNT:
      case DISCOUNT_TYPES.STAFF_DISCOUNT:
        if (rule.percentage !== null) {
          discountAmount = baseAmount * (rule.percentage / 100);
        } else if (rule.fixedAmount !== null) {
          discountAmount = rule.fixedAmount;
        }
        break;

      case DISCOUNT_TYPES.MANUAL_DISCOUNT:
        if (rule.percentage !== null) {
          discountAmount = baseAmount * (rule.percentage / 100);
        } else if (rule.fixedAmount !== null) {
          discountAmount = rule.fixedAmount;
        }
        break;

      case DISCOUNT_TYPES.AUTOMATIC_DISCOUNT:
        if (rule.percentage !== null) {
          discountAmount = baseAmount * (rule.percentage / 100);
        } else if (rule.fixedAmount !== null) {
          discountAmount = rule.fixedAmount;
        }
        break;

      default:
        return { applied: false, discountAmount: 0 };
    }

    // Apply max discount limit per rule
    if (rule.maxDiscountAmount && discountAmount > rule.maxDiscountAmount) {
      discountAmount = rule.maxDiscountAmount;
    }

    // Ensure discount doesn't exceed base amount
    discountAmount = Math.min(discountAmount, baseAmount);

    return {
      applied: discountAmount > 0,
      discountAmount
    };
  }

  /**
   * Check combo match
   * @param {Array} comboItems - Required combo items
   * @param {Array} orderItems - Order items
   * @returns {boolean} Whether combo matches
   */
  checkComboMatch(comboItems, orderItems) {
    const orderItemIds = new Set(orderItems.map(item => item.menuItemId));
    return comboItems.every(item => orderItemIds.has(item.menuItemId));
  }

  /**
   * Check bundle match
   * @param {Array} bundleItems - Required bundle items
   * @param {Array} orderItems - Order items
   * @returns {boolean} Whether bundle matches
   */
  checkBundleMatch(bundleItems, orderItems) {
    const orderItemMap = new Map(orderItems.map(item => [item.menuItemId, item]));
    return bundleItems.every(item => {
      const orderItem = orderItemMap.get(item.menuItemId);
      return orderItem && orderItem.qty >= (item.quantity || 1);
    });
  }

  /**
   * Get max discount limit from rules
   * @param {Array} rules - Array of rules
   * @returns {number|null} Max discount limit
   */
  getMaxDiscountLimit(rules) {
    const limits = rules
      .map(r => r.maxDiscountAmount)
      .filter(limit => limit !== null);
    
    if (limits.length === 0) return null;
    return Math.min(...limits);
  }

  /**
   * Track discount usage
   * @param {string} ruleId - Rule ID
   * @param {string} customerId - Customer ID
   */
  trackUsage(ruleId, customerId) {
    const usageKey = `${ruleId}_${customerId || 'global'}`;
    const usage = this.usageTracking.get(usageKey) || { count: 0 };
    usage.count++;
    usage.lastUsed = now();
    this.usageTracking.set(usageKey, usage);
  }

  /**
   * Get cache key for discount calculation
   * @param {number} baseAmount - Base amount
   * @param {Object} context - Discount context
   * @returns {string} Cache key
   */
  getCacheKey(baseAmount, context) {
    const keyParts = [
      baseAmount,
      context.menuItemId,
      context.categoryId,
      context.tableId,
      context.customerId,
      context.customerGroup,
      context.branchId,
      context.orderTotal,
      context.timestamp || now()
    ];
    return keyParts.join('|');
  }

  /**
   * Clear discount cache
   */
  clearCache() {
    this.discountCache.clear();
  }

  /**
   * Get all discount rules
   * @returns {Array} Array of discount rules
   */
  getAllRules() {
    return Array.from(this.discountRules.values());
  }

  /**
   * Get rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule or null
   */
  getRule(ruleId) {
    return this.discountRules.get(ruleId) || null;
  }

  /**
   * Update discount rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated rule or null
   */
  updateRule(ruleId, updates) {
    const rule = this.discountRules.get(ruleId);
    if (!rule) return null;

    const updated = {
      ...rule,
      ...updates,
      updatedAt: now()
    };

    this.discountRules.set(ruleId, updated);
    this.saveDiscountRules();

    return updated;
  }

  /**
   * Delete discount rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteRule(ruleId) {
    const deleted = this.discountRules.delete(ruleId);
    if (deleted) {
      this.saveDiscountRules();
    }
    return deleted;
  }

  /**
   * Get rules by type
   * @param {string} type - Discount type
   * @returns {Array} Array of rules
   */
  getRulesByType(type) {
    return this.getAllRules().filter(rule => rule.type === type);
  }

  /**
   * Get usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStatistics() {
    const stats = {};

    for (const [key, usage] of this.usageTracking) {
      const [ruleId, customerId] = key.split('_');
      if (!stats[ruleId]) {
        stats[ruleId] = { total: 0, byCustomer: {} };
      }
      stats[ruleId].total += usage.count;
      if (customerId !== 'global') {
        stats[ruleId].byCustomer[customerId] = usage.count;
      }
    }

    return stats;
  }

  /**
   * Get discount statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const rules = this.getAllRules();

    return {
      totalRules: rules.length,
      byType: rules.reduce((acc, rule) => {
        acc[rule.type] = (acc[rule.type] || 0) + 1;
        return acc;
      }, {}),
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => !r.enabled).length,
      requiresApproval: rules.filter(r => r.requiresApproval).length,
      cacheSize: this.discountCache.size
    };
  }

  /**
   * Export discount rules
   * @returns {Object} Exported rules
   */
  exportRules() {
    return {
      rules: Array.from(this.discountRules.values()),
      usageTracking: Object.fromEntries(this.usageTracking),
      exportedAt: now()
    };
  }

  /**
   * Import discount rules
   * @param {Object} data - Imported rules data
   * @returns {Object} Import result
   */
  importRules(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.rules)) {
        data.rules.forEach(rule => {
          this.discountRules.set(rule.id, rule);
        });
      }

      if (data.usageTracking && typeof data.usageTracking === 'object') {
        Object.entries(data.usageTracking).forEach(([key, value]) => {
          this.usageTracking.set(key, value);
        });
      }

      this.saveDiscountRules();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let discountEngineInstance = null;

/**
 * Get the discount engine singleton
 * @returns {DiscountEngine} Discount engine instance
 */
export function getDiscountEngine() {
  if (!discountEngineInstance) {
    discountEngineInstance = new DiscountEngine();
  }
  return discountEngineInstance;
}

/**
 * Reset the discount engine (useful for testing)
 */
export function resetDiscountEngine() {
  discountEngineInstance = null;
}

/**
 * Convenience function to calculate discount
 * @param {number} baseAmount - Base amount
 * @param {Object} context - Discount context
 * @returns {Object} Discount result
 */
export function calculateDiscount(baseAmount, context = {}) {
  const engine = getDiscountEngine();
  return engine.calculateDiscount(baseAmount, context);
}
