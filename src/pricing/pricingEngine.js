// Pricing Engine
// Centralized pricing engine with multiple pricing strategies

import { now } from '../domain/dates.js';

const PRICING_RULES_KEY = 'cafeos_pricing_rules';

/**
 * Pricing Strategy Types
 */
export const PRICING_STRATEGIES = {
  BASE_PRICE: 'BASE_PRICE',
  BRANCH_PRICE: 'BRANCH_PRICE',
  TIME_BASED: 'TIME_BASED',
  DAY_BASED: 'DAY_BASED',
  HAPPY_HOUR: 'HAPPY_HOUR',
  WEEKEND: 'WEEKEND',
  HOLIDAY: 'HOLIDAY',
  CUSTOMER_GROUP: 'CUSTOMER_GROUP',
  VIP: 'VIP',
  CORPORATE: 'CORPORATE',
  MEMBERSHIP: 'MEMBERSHIP',
  BULK: 'BULK',
  MANUAL_OVERRIDE: 'MANUAL_OVERRIDE',
  EMERGENCY_OVERRIDE: 'EMERGENCY_OVERRIDE'
};

/**
 * Pricing Priority Order (lower number = higher priority)
 */
export const PRICING_PRIORITY = {
  EMERGENCY_OVERRIDE: 1,
  MANUAL_OVERRIDE: 2,
  VIP: 3,
  CORPORATE: 4,
  MEMBERSHIP: 5,
  HAPPY_HOUR: 6,
  HOLIDAY: 7,
  WEEKEND: 8,
  TIME_BASED: 9,
  DAY_BASED: 10,
  CUSTOMER_GROUP: 11,
  BULK: 12,
  BRANCH_PRICE: 13,
  BASE_PRICE: 14
};

/**
 * Days of the week
 */
export const DAYS_OF_WEEK = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6
};

/**
 * Customer Groups
 */
export const CUSTOMER_GROUPS = {
  REGULAR: 'REGULAR',
  VIP: 'VIP',
  CORPORATE: 'CORPORATE',
  STUDENT: 'STUDENT',
  SENIOR: 'SENIOR',
  STAFF: 'STAFF',
  MEMBER: 'MEMBER'
};

/**
 * Pricing Engine class
 * Centralized pricing engine with multiple pricing strategies
 */
export class PricingEngine {
  constructor() {
    this.pricingRules = new Map();
    this.pricingCache = new Map();
    this.loadPricingRules();
  }

  /**
   * Load pricing rules from localStorage
   */
  loadPricingRules() {
    try {
      const stored = localStorage.getItem(PRICING_RULES_KEY);
      if (stored) {
        const rules = JSON.parse(stored);
        rules.forEach(rule => {
          this.pricingRules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('[PricingEngine] Failed to load pricing rules:', error);
    }
  }

  /**
   * Save pricing rules to localStorage
   */
  savePricingRules() {
    try {
      const rules = Array.from(this.pricingRules.values());
      localStorage.setItem(PRICING_RULES_KEY, JSON.stringify(rules));
      // Clear cache on rule change
      this.pricingCache.clear();
    } catch (error) {
      console.error('[PricingEngine] Failed to save pricing rules:', error);
    }
  }

  /**
   * Add a pricing rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  addPricingRule(ruleData) {
    const rule = {
      id: `price_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategy: ruleData.strategy || PRICING_STRATEGIES.BASE_PRICE,
      priority: ruleData.priority || PRICING_PRIORITY[ruleData.strategy] || 100,
      menuItemId: ruleData.menuItemId || null,
      categoryId: ruleData.categoryId || null,
      branchId: ruleData.branchId || null,
      customerGroup: ruleData.customerGroup || null,
      price: ruleData.price || null,
      percentage: ruleData.percentage || null,
      adjustment: ruleData.adjustment || null,
      schedule: ruleData.schedule || null,
      conditions: ruleData.conditions || [],
      enabled: ruleData.enabled !== false,
      createdAt: now(),
      createdBy: ruleData.createdBy || null,
      metadata: ruleData.metadata || {}
    };

    this.pricingRules.set(rule.id, rule);
    this.savePricingRules();

    return rule;
  }

  /**
   * Get applicable pricing rules for an item
   * @param {Object} context - Pricing context
   * @returns {Array} Applicable rules sorted by priority
   */
  getApplicableRules(context) {
    const {
      menuItemId,
      categoryId,
      branchId,
      customerGroup,
      customerId,
      quantity,
      timestamp
    } = context;

    const currentTime = timestamp || now();
    const currentDay = new Date(currentTime).getDay();
    const currentHour = new Date(currentTime).getHours();

    const applicableRules = [];

    for (const rule of this.pricingRules.values()) {
      if (!rule.enabled) continue;

      // Check item/category match
      if (rule.menuItemId && rule.menuItemId !== menuItemId) continue;
      if (rule.categoryId && rule.categoryId !== categoryId) continue;

      // Check branch match
      if (rule.branchId && rule.branchId !== branchId) continue;

      // Check customer group match
      if (rule.customerGroup && rule.customerGroup !== customerGroup) continue;

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

      applicableRules.push(rule);
    }

    // Sort by priority (lower number = higher priority)
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
    // Check date range
    if (schedule.startDate && currentTime < schedule.startDate) return false;
    if (schedule.endDate && currentTime > schedule.endDate) return false;

    // Check days of week
    if (schedule.days && schedule.days.length > 0) {
      if (!schedule.days.includes(currentDay)) return false;
    }

    // Check time range
    if (schedule.startTime !== undefined && schedule.endTime !== undefined) {
      if (currentHour < schedule.startTime || currentHour >= schedule.endTime) return false;
    }

    return true;
  }

  /**
   * Evaluate rule conditions
   * @param {Array} conditions - Array of conditions
   * @param {Object} context - Pricing context
   * @returns {boolean} Whether conditions are met
   */
  evaluateConditions(conditions, context) {
    return conditions.every(condition => {
      switch (condition.field) {
        case 'quantity':
          return this.evaluateNumericCondition(condition, context.quantity);
        case 'total':
          return this.evaluateNumericCondition(condition, context.total);
        case 'customerId':
          return condition.value === context.customerId;
        case 'customerGroup':
          return condition.value === context.customerGroup;
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
   * Calculate price for an item
   * @param {number} basePrice - Base price
   * @param {Object} context - Pricing context
   * @returns {Object} Pricing result
   */
  calculatePrice(basePrice, context) {
    const cacheKey = this.getCacheKey(basePrice, context);
    const cached = this.pricingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rules = this.getApplicableRules(context);
    let finalPrice = basePrice;
    const appliedRules = [];

    for (const rule of rules) {
      const result = this.applyRule(rule, finalPrice, context);
      if (result.applied) {
        finalPrice = result.price;
        appliedRules.push({
          ruleId: rule.id,
          strategy: rule.strategy,
          previousPrice: result.previousPrice,
          newPrice: result.price,
          adjustment: result.adjustment
        });
      }
    }

    const pricingResult = {
      basePrice,
      finalPrice,
      appliedRules,
      totalDiscount: basePrice - finalPrice,
      discountPercentage: ((basePrice - finalPrice) / basePrice) * 100,
      calculatedAt: now()
    };

    this.pricingCache.set(cacheKey, pricingResult);
    return pricingResult;
  }

  /**
   * Apply a pricing rule
   * @param {Object} rule - Pricing rule
   * @param {number} currentPrice - Current price
   * @param {Object} context - Pricing context
   * @returns {Object} Application result
   */
  applyRule(rule, currentPrice, context) {
    let newPrice = currentPrice;
    let adjustment = 0;

    switch (rule.strategy) {
      case PRICING_STRATEGIES.BASE_PRICE:
        // Base price is the starting point, don't apply
        return { applied: false, price: currentPrice };

      case PRICING_STRATEGIES.BRANCH_PRICE:
        if (rule.price !== null) {
          newPrice = rule.price;
          adjustment = newPrice - currentPrice;
        }
        break;

      case PRICING_STRATEGIES.TIME_BASED:
      case PRICING_STRATEGIES.HAPPY_HOUR:
        if (rule.percentage !== null) {
          newPrice = currentPrice * (1 - rule.percentage / 100);
          adjustment = newPrice - currentPrice;
        } else if (rule.price !== null) {
          newPrice = rule.price;
          adjustment = newPrice - currentPrice;
        }
        break;

      case PRICING_STRATEGIES.DAY_BASED:
      case PRICING_STRATEGIES.WEEKEND:
      case PRICING_STRATEGIES.HOLIDAY:
        if (rule.percentage !== null) {
          newPrice = currentPrice * (1 - rule.percentage / 100);
          adjustment = newPrice - currentPrice;
        } else if (rule.price !== null) {
          newPrice = rule.price;
          adjustment = newPrice - currentPrice;
        }
        break;

      case PRICING_STRATEGIES.CUSTOMER_GROUP:
      case PRICING_STRATEGIES.VIP:
      case PRICING_STRATEGIES.CORPORATE:
      case PRICING_STRATEGIES.MEMBERSHIP:
        if (rule.percentage !== null) {
          newPrice = currentPrice * (1 - rule.percentage / 100);
          adjustment = newPrice - currentPrice;
        } else if (rule.price !== null) {
          newPrice = rule.price;
          adjustment = newPrice - currentPrice;
        }
        break;

      case PRICING_STRATEGIES.BULK:
        if (context.quantity >= (rule.conditions?.[0]?.value || 10)) {
          if (rule.percentage !== null) {
            newPrice = currentPrice * (1 - rule.percentage / 100);
            adjustment = newPrice - currentPrice;
          } else if (rule.price !== null) {
            newPrice = rule.price;
            adjustment = newPrice - currentPrice;
          }
        }
        break;

      case PRICING_STRATEGIES.MANUAL_OVERRIDE:
      case PRICING_STRATEGIES.EMERGENCY_OVERRIDE:
        if (rule.price !== null) {
          newPrice = rule.price;
          adjustment = newPrice - currentPrice;
        }
        break;

      default:
        return { applied: false, price: currentPrice };
    }

    // Ensure price doesn't go negative
    newPrice = Math.max(0, newPrice);

    return {
      applied: newPrice !== currentPrice,
      price: newPrice,
      previousPrice: currentPrice,
      adjustment
    };
  }

  /**
   * Get cache key for pricing calculation
   * @param {number} basePrice - Base price
   * @param {Object} context - Pricing context
   * @returns {string} Cache key
   */
  getCacheKey(basePrice, context) {
    const keyParts = [
      basePrice,
      context.menuItemId,
      context.categoryId,
      context.branchId,
      context.customerGroup,
      context.quantity,
      context.timestamp || now()
    ];
    return keyParts.join('|');
  }

  /**
   * Clear pricing cache
   */
  clearCache() {
    this.pricingCache.clear();
  }

  /**
   * Get all pricing rules
   * @returns {Array} Array of pricing rules
   */
  getAllRules() {
    return Array.from(this.pricingRules.values());
  }

  /**
   * Get rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule or null
   */
  getRule(ruleId) {
    return this.pricingRules.get(ruleId) || null;
  }

  /**
   * Update pricing rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated rule or null
   */
  updateRule(ruleId, updates) {
    const rule = this.pricingRules.get(ruleId);
    if (!rule) return null;

    const updated = {
      ...rule,
      ...updates,
      updatedAt: now()
    };

    this.pricingRules.set(ruleId, updated);
    this.savePricingRules();

    return updated;
  }

  /**
   * Delete pricing rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteRule(ruleId) {
    const deleted = this.pricingRules.delete(ruleId);
    if (deleted) {
      this.savePricingRules();
    }
    return deleted;
  }

  /**
   * Get rules by strategy
   * @param {string} strategy - Pricing strategy
   * @returns {Array} Array of rules
   */
  getRulesByStrategy(strategy) {
    return this.getAllRules().filter(rule => rule.strategy === strategy);
  }

  /**
   * Get rules by branch
   * @param {string} branchId - Branch ID
   * @returns {Array} Array of rules
   */
  getRulesByBranch(branchId) {
    return this.getAllRules().filter(rule => !rule.branchId || rule.branchId === branchId);
  }

  /**
   * Get rules by customer group
   * @param {string} customerGroup - Customer group
   * @returns {Array} Array of rules
   */
  getRulesByCustomerGroup(customerGroup) {
    return this.getAllRules().filter(rule => !rule.customerGroup || rule.customerGroup === customerGroup);
  }

  /**
   * Enable/disable rule
   * @param {string} ruleId - Rule ID
   * @param {boolean} enabled - Whether to enable
   * @returns {Object} Result
   */
  setRuleEnabled(ruleId, enabled) {
    return this.updateRule(ruleId, { enabled });
  }

  /**
   * Set rule priority
   * @param {string} ruleId - Rule ID
   * @param {number} priority - Priority value
   * @returns {Object} Result
   */
  setRulePriority(ruleId, priority) {
    return this.updateRule(ruleId, { priority });
  }

  /**
   * Calculate prices for multiple items
   * @param {Array} items - Array of items with base prices
   * @param {Object} context - Shared pricing context
   * @returns {Array} Array of pricing results
   */
  calculateBatchPrices(items, context) {
    return items.map(item => ({
      ...item,
      pricing: this.calculatePrice(item.basePrice, {
        ...context,
        menuItemId: item.menuItemId,
        categoryId: item.categoryId
      })
    }));
  }

  /**
   * Get pricing statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const rules = this.getAllRules();

    return {
      totalRules: rules.length,
      byStrategy: rules.reduce((acc, rule) => {
        acc[rule.strategy] = (acc[rule.strategy] || 0) + 1;
        return acc;
      }, {}),
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => !r.enabled).length,
      cacheSize: this.pricingCache.size
    };
  }

  /**
   * Export pricing rules
   * @returns {Object} Exported rules
   */
  exportRules() {
    return {
      rules: Array.from(this.pricingRules.values()),
      exportedAt: now()
    };
  }

  /**
   * Import pricing rules
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
          this.pricingRules.set(rule.id, rule);
        });
      }

      this.savePricingRules();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let pricingEngineInstance = null;

/**
 * Get the pricing engine singleton
 * @returns {PricingEngine} Pricing engine instance
 */
export function getPricingEngine() {
  if (!pricingEngineInstance) {
    pricingEngineInstance = new PricingEngine();
  }
  return pricingEngineInstance;
}

/**
 * Reset the pricing engine (useful for testing)
 */
export function resetPricingEngine() {
  pricingEngineInstance = null;
}

/**
 * Convenience function to calculate price
 * @param {number} basePrice - Base price
 * @param {Object} context - Pricing context
 * @returns {Object} Pricing result
 */
export function calculatePrice(basePrice, context = {}) {
  const engine = getPricingEngine();
  return engine.calculatePrice(basePrice, context);
}
