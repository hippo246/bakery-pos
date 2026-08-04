// Conflict Resolution
// Resolves conflicts when multiple promotions/discounts apply

import { now } from '../domain/dates.js';

const CONFLICT_RESOLUTION_KEY = 'cafeos_conflict_resolution';

/**
 * Conflict Resolution Strategies
 */
export const CONFLICT_STRATEGIES = {
  HIGHEST_PRIORITY: 'HIGHEST_PRIORITY',       // Apply highest priority rule
  BEST_CUSTOMER_VALUE: 'BEST_CUSTOMER_VALUE', // Best discount for customer
  HIGHEST_PROFIT: 'HIGHEST_PROFIT',           // Best for business profit
  MANUAL_PRIORITY: 'MANUAL_PRIORITY',         // Manually set priority
  STACKABLE: 'STACKABLE',                     // Apply all compatible
  FIRST_APPLICABLE: 'FIRST_APPLICABLE',       // Apply first matching
  LAST_APPLICABLE: 'LAST_APPLICABLE'          // Apply last matching
};

/**
 * Conflict Resolution Engine class
 * Resolves conflicts when multiple promotions/discounts apply
 */
export class ConflictResolutionEngine {
  constructor() {
    this.resolutionRules = new Map();
    this.resolutionCache = new Map();
    this.loadResolutionRules();
  }

  /**
   * Load resolution rules from localStorage
   */
  loadResolutionRules() {
    try {
      const stored = localStorage.getItem(CONFLICT_RESOLUTION_KEY);
      if (stored) {
        const rules = JSON.parse(stored);
        rules.forEach(rule => {
          this.resolutionRules.set(rule.id, rule);
        });
      } else {
        this.setDefaultResolutionRules();
      }
    } catch (error) {
      console.error('[ConflictResolutionEngine] Failed to load resolution rules:', error);
      this.setDefaultResolutionRules();
    }
  }

  /**
   * Save resolution rules to localStorage
   */
  saveResolutionRules() {
    try {
      const rules = Array.from(this.resolutionRules.values());
      localStorage.setItem(CONFLICT_RESOLUTION_KEY, JSON.stringify(rules));
      this.resolutionCache.clear();
    } catch (error) {
      console.error('[ConflictResolutionEngine] Failed to save resolution rules:', error);
    }
  }

  /**
   * Set default resolution rules
   */
  setDefaultResolutionRules() {
    // Default strategy: highest priority
    this.resolutionRules.set('default', {
      id: 'default',
      strategy: CONFLICT_STRATEGIES.HIGHEST_PRIORITY,
      enabled: true,
      description: 'Apply highest priority promotion/discount'
    });

    // Combo discounts are stackable
    this.resolutionRules.set('combo', {
      id: 'combo',
      strategy: CONFLICT_STRATEGIES.STACKABLE,
      enabled: true,
      description: 'Combo discounts can stack with other discounts',
      appliesTo: ['COMBO_DISCOUNT', 'BUNDLE_DISCOUNT']
    });

    // Manual discounts have highest priority
    this.resolutionRules.set('manual', {
      id: 'manual',
      strategy: CONFLICT_STRATEGIES.HIGHEST_PRIORITY,
      enabled: true,
      description: 'Manual discounts override automatic discounts',
      appliesTo: ['MANUAL_DISCOUNT'],
      priority: 1
    });

    this.saveResolutionRules();
  }

  /**
   * Add a resolution rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  addResolutionRule(ruleData) {
    const rule = {
      id: `conflict_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      strategy: ruleData.strategy || CONFLICT_STRATEGIES.HIGHEST_PRIORITY,
      enabled: ruleData.enabled !== false,
      description: ruleData.description || '',
      appliesTo: ruleData.appliesTo || [],
      priority: ruleData.priority || 100,
      conditions: ruleData.conditions || [],
      metadata: ruleData.metadata || {},
      createdAt: now(),
      createdBy: ruleData.createdBy || null
    };

    this.resolutionRules.set(rule.id, rule);
    this.saveResolutionRules();

    return rule;
  }

  /**
   * Resolve conflicts among applicable rules
   * @param {Array} applicableRules - Array of applicable rules
   * @param {Object} context - Resolution context
   * @returns {Object} Resolution result
   */
  resolveConflicts(applicableRules, context = {}) {
    if (applicableRules.length === 0) {
      return {
        success: true,
        appliedRules: [],
        rejectedRules: [],
        resolutionStrategy: 'NONE'
      };
    }

    if (applicableRules.length === 1) {
      return {
        success: true,
        appliedRules: applicableRules,
        rejectedRules: [],
        resolutionStrategy: 'SINGLE'
      };
    }

    const cacheKey = this.getCacheKey(applicableRules, context);
    const cached = this.resolutionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get resolution strategy
    const strategy = this.getResolutionStrategy(applicableRules, context);

    let result;

    switch (strategy) {
      case CONFLICT_STRATEGIES.HIGHEST_PRIORITY:
        result = this.resolveByPriority(applicableRules);
        break;

      case CONFLICT_STRATEGIES.BEST_CUSTOMER_VALUE:
        result = this.resolveByCustomerValue(applicableRules, context);
        break;

      case CONFLICT_STRATEGIES.HIGHEST_PROFIT:
        result = this.resolveByProfit(applicableRules, context);
        break;

      case CONFLICT_STRATEGIES.MANUAL_PRIORITY:
        result = this.resolveByManualPriority(applicableRules);
        break;

      case CONFLICT_STRATEGIES.STACKABLE:
        result = this.resolveStackable(applicableRules);
        break;

      case CONFLICT_STRATEGIES.FIRST_APPLICABLE:
        result = this.resolveFirst(applicableRules);
        break;

      case CONFLICT_STRATEGIES.LAST_APPLICABLE:
        result = this.resolveLast(applicableRules);
        break;

      default:
        result = this.resolveByPriority(applicableRules);
    }

    result.resolutionStrategy = strategy;
    result.resolvedAt = now();

    this.resolutionCache.set(cacheKey, result);
    return result;
  }

  /**
   * Get resolution strategy for rules
   * @param {Array} rules - Array of rules
   * @param {Object} context - Resolution context
   * @returns {string} Resolution strategy
   */
  getResolutionStrategy(rules, context) {
    // Check if any rule has a specific resolution strategy
    for (const rule of rules) {
      const resolutionRule = this.getResolutionRuleForType(rule.type);
      if (resolutionRule && resolutionRule.enabled) {
        return resolutionRule.strategy;
      }
    }

    // Use default strategy
    const defaultRule = this.resolutionRules.get('default');
    return defaultRule ? defaultRule.strategy : CONFLICT_STRATEGIES.HIGHEST_PRIORITY;
  }

  /**
   * Get resolution rule for a type
   * @param {string} type - Rule type
   * @returns {Object|null} Resolution rule or null
   */
  getResolutionRuleForType(type) {
    for (const rule of this.resolutionRules.values()) {
      if (rule.appliesTo.includes(type)) {
        return rule;
      }
    }
    return null;
  }

  /**
   * Resolve by highest priority
   * @param {Array} rules - Array of rules
   * @returns {Object} Resolution result
   */
  resolveByPriority(rules) {
    // Sort by priority (lower number = higher priority)
    const sorted = [...rules].sort((a, b) => {
      const priorityA = a.priority || 100;
      const priorityB = b.priority || 100;
      return priorityA - priorityB;
    });

    const appliedRules = [sorted[0]];
    const rejectedRules = sorted.slice(1);

    return {
      success: true,
      appliedRules,
      rejectedRules,
      reason: `Applied highest priority rule: ${sorted[0].name || sorted[0].type}`
    };
  }

  /**
   * Resolve by best customer value
   * @param {Array} rules - Array of rules
   * @param {Object} context - Resolution context
   * @returns {Object} Resolution result
   */
  resolveByCustomerValue(rules, context) {
    const baseAmount = context.baseAmount || 0;

    // Calculate discount for each rule
    const withDiscounts = rules.map(rule => {
      let discountAmount = 0;

      if (rule.discountValue) {
        discountAmount = baseAmount * (rule.discountValue / 100);
      } else if (rule.fixedAmount) {
        discountAmount = rule.fixedAmount;
      }

      return {
        rule,
        discountAmount,
        finalAmount: baseAmount - discountAmount
      };
    });

    // Sort by final amount (lowest = best for customer)
    withDiscounts.sort((a, b) => a.finalAmount - b.finalAmount);

    const appliedRules = [withDiscounts[0].rule];
    const rejectedRules = withDiscounts.slice(1).map(w => w.rule);

    return {
      success: true,
      appliedRules,
      rejectedRules,
      reason: `Applied rule with best customer value: ${withDiscounts[0].rule.name || withDiscounts[0].rule.type}`
    };
  }

  /**
   * Resolve by highest profit
   * @param {Array} rules - Array of rules
   * @param {Object} context - Resolution context
   * @returns {Object} Resolution result
   */
  resolveByProfit(rules, context) {
    const baseAmount = context.baseAmount || 0;
    const costAmount = context.costAmount || (baseAmount * 0.6); // Default 60% cost

    // Calculate profit for each rule
    const withProfits = rules.map(rule => {
      let discountAmount = 0;

      if (rule.discountValue) {
        discountAmount = baseAmount * (rule.discountValue / 100);
      } else if (rule.fixedAmount) {
        discountAmount = rule.fixedAmount;
      }

      const finalAmount = baseAmount - discountAmount;
      const profit = finalAmount - costAmount;

      return {
        rule,
        discountAmount,
        finalAmount,
        profit
      };
    });

    // Sort by profit (highest = best for business)
    withProfits.sort((a, b) => b.profit - a.profit);

    const appliedRules = [withProfits[0].rule];
    const rejectedRules = withProfits.slice(1).map(w => w.rule);

    return {
      success: true,
      appliedRules,
      rejectedRules,
      reason: `Applied rule with highest profit: ${withProfits[0].rule.name || withProfits[0].rule.type}`
    };
  }

  /**
   * Resolve by manual priority
   * @param {Array} rules - Array of rules
   * @returns {Object} Resolution result
   */
  resolveByManualPriority(rules) {
    // Check for manual discounts first
    const manualRules = rules.filter(r => 
      r.type === 'MANUAL_DISCOUNT' || r.type === 'EMERGENCY_OVERRIDE'
    );

    if (manualRules.length > 0) {
      const appliedRules = [manualRules[0]];
      const rejectedRules = rules.filter(r => r !== manualRules[0]);

      return {
        success: true,
        appliedRules,
        rejectedRules,
        reason: `Applied manual discount: ${manualRules[0].name || manualRules[0].type}`
      };
    }

    // Fall back to priority
    return this.resolveByPriority(rules);
  }

  /**
   * Resolve stackable rules
   * @param {Array} rules - Array of rules
   * @returns {Object} Resolution result
   */
  resolveStackable(rules) {
    const stackableTypes = ['COMBO_DISCOUNT', 'BUNDLE_DISCOUNT'];
    const nonStackable = rules.filter(r => !stackableTypes.includes(r.type));
    const stackable = rules.filter(r => stackableTypes.includes(r.type));

    // Apply all stackable rules
    const appliedRules = [...stackable];

    // Apply highest priority non-stackable rule
    if (nonStackable.length > 0) {
      const sorted = [...nonStackable].sort((a, b) => {
        const priorityA = a.priority || 100;
        const priorityB = b.priority || 100;
        return priorityA - priorityB;
      });
      appliedRules.push(sorted[0]);
    }

    const rejectedRules = nonStackable.slice(1);

    return {
      success: true,
      appliedRules,
      rejectedRules,
      reason: 'Applied stackable rules and highest priority non-stackable rule'
    };
  }

  /**
   * Resolve by first applicable
   * @param {Array} rules - Array of rules
   * @returns {Object} Resolution result
   */
  resolveFirst(rules) {
    const appliedRules = [rules[0]];
    const rejectedRules = rules.slice(1);

    return {
      success: true,
      appliedRules,
      rejectedRules,
      reason: `Applied first applicable rule: ${rules[0].name || rules[0].type}`
    };
  }

  /**
   * Resolve by last applicable
   * @param {Array} rules - Array of rules
   * @returns {Object} Resolution result
   */
  resolveLast(rules) {
    const appliedRules = [rules[rules.length - 1]];
    const rejectedRules = rules.slice(0, -1);

    return {
      success: true,
      appliedRules,
      rejectedRules,
      reason: `Applied last applicable rule: ${rules[rules.length - 1].name || rules[rules.length - 1].type}`
    };
  }

  /**
   * Get cache key for resolution
   * @param {Array} rules - Array of rules
   * @param {Object} context - Resolution context
   * @returns {string} Cache key
   */
  getCacheKey(rules, context) {
    const ruleIds = rules.map(r => r.id).sort().join(',');
    const contextParts = [
      context.baseAmount,
      context.costAmount,
      context.timestamp || now()
    ];
    return `${ruleIds}|${contextParts.join('|')}`;
  }

  /**
   * Clear resolution cache
   */
  clearCache() {
    this.resolutionCache.clear();
  }

  /**
   * Get all resolution rules
   * @returns {Array} Array of resolution rules
   */
  getAllRules() {
    return Array.from(this.resolutionRules.values());
  }

  /**
   * Get rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule or null
   */
  getRule(ruleId) {
    return this.resolutionRules.get(ruleId) || null;
  }

  /**
   * Update resolution rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated rule or null
   */
  updateRule(ruleId, updates) {
    const rule = this.resolutionRules.get(ruleId);
    if (!rule) return null;

    const updated = {
      ...rule,
      ...updates,
      updatedAt: now()
    };

    this.resolutionRules.set(ruleId, updated);
    this.saveResolutionRules();

    return updated;
  }

  /**
   * Delete resolution rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteRule(ruleId) {
    const deleted = this.resolutionRules.delete(ruleId);
    if (deleted) {
      this.saveResolutionRules();
    }
    return deleted;
  }

  /**
   * Set default resolution strategy
   * @param {string} strategy - Resolution strategy
   * @returns {Object} Result
   */
  setDefaultStrategy(strategy) {
    return this.updateRule('default', { strategy });
  }

  /**
   * Get resolution statistics
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
      cacheSize: this.resolutionCache.size
    };
  }

  /**
   * Export resolution rules
   * @returns {Object} Exported rules
   */
  exportRules() {
    return {
      rules: Array.from(this.resolutionRules.values()),
      exportedAt: now()
    };
  }

  /**
   * Import resolution rules
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
          this.resolutionRules.set(rule.id, rule);
        });
      }

      this.saveResolutionRules();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let conflictResolutionInstance = null;

/**
 * Get the conflict resolution engine singleton
 * @returns {ConflictResolutionEngine} Conflict resolution engine instance
 */
export function getConflictResolutionEngine() {
  if (!conflictResolutionInstance) {
    conflictResolutionInstance = new ConflictResolutionEngine();
  }
  return conflictResolutionInstance;
}

/**
 * Reset the conflict resolution engine (useful for testing)
 */
export function resetConflictResolutionEngine() {
  conflictResolutionInstance = null;
}

/**
 * Convenience function to resolve conflicts
 * @param {Array} applicableRules - Array of applicable rules
 * @param {Object} context - Resolution context
 * @returns {Object} Resolution result
 */
export function resolveConflicts(applicableRules, context = {}) {
  const engine = getConflictResolutionEngine();
  return engine.resolveConflicts(applicableRules, context);
}
