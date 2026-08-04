// Tax Engine
// Centralized tax engine with multiple tax types

import { now } from '../domain/dates.js';

const TAX_RULES_KEY = 'cafeos_tax_rules';

/**
 * Tax Types
 */
export const TAX_TYPES = {
  GST: 'GST',
  VAT: 'VAT',
  SERVICE_CHARGE: 'SERVICE_CHARGE',
  SALES_TAX: 'SALES_TAX',
  EXCISE_TAX: 'EXCISE_TAX',
  LUXURY_TAX: 'LUXURY_TAX',
  TOURISM_TAX: 'TOURISM_TAX',
  CUSTOM_TAX: 'CUSTOM_TAX'
};

/**
 * Tax Calculation Methods
 */
export const TAX_CALCULATION_METHODS = {
  INCLUSIVE: 'INCLUSIVE',    // Tax included in price
  EXCLUSIVE: 'EXCLUSIVE',    // Tax added to price
  COMPOUND: 'COMPOUND'       // Tax calculated on tax
};

/**
 * Tax Rounding Modes
 */
export const TAX_ROUNDING_MODES = {
  NORMAL: 'NORMAL',           // Round to nearest
  UP: 'UP',                   // Always round up
  DOWN: 'DOWN',               // Always round down
  NEAREST_EVEN: 'NEAREST_EVEN' // Banker's rounding
};

/**
 * Tax Engine class
 * Centralized tax engine with multiple tax types
 */
export class TaxEngine {
  constructor() {
    this.taxRules = new Map();
    this.taxCache = new Map();
    this.loadTaxRules();
  }

  /**
   * Load tax rules from localStorage
   */
  loadTaxRules() {
    try {
      const stored = localStorage.getItem(TAX_RULES_KEY);
      if (stored) {
        const rules = JSON.parse(stored);
        rules.forEach(rule => {
          this.taxRules.set(rule.id, rule);
        });
      }
    } catch (error) {
      console.error('[TaxEngine] Failed to load tax rules:', error);
    }
  }

  /**
   * Save tax rules to localStorage
   */
  saveTaxRules() {
    try {
      const rules = Array.from(this.taxRules.values());
      localStorage.setItem(TAX_RULES_KEY, JSON.stringify(rules));
      this.taxCache.clear();
    } catch (error) {
      console.error('[TaxEngine] Failed to save tax rules:', error);
    }
  }

  /**
   * Add a tax rule
   * @param {Object} ruleData - Rule data
   * @returns {Object} Created rule
   */
  addTaxRule(ruleData) {
    const rule = {
      id: `tax_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: ruleData.type || TAX_TYPES.GST,
      name: ruleData.name || 'Untitled Tax Rule',
      description: ruleData.description || '',
      
      // Rate
      rate: ruleData.rate || 0, // Percentage
      
      // Calculation method
      calculationMethod: ruleData.calculationMethod || TAX_CALCULATION_METHODS.EXCLUSIVE,
      
      // Rounding
      roundingMode: ruleData.roundingMode || TAX_ROUNDING_MODES.NORMAL,
      roundingPrecision: ruleData.roundingPrecision || 2,
      
      // Targeting
      branchId: ruleData.branchId || null,
      categoryId: ruleData.categoryId || null,
      menuItemId: ruleData.menuItemId || null,
      customerGroup: ruleData.customerGroup || null,
      
      // Conditions
      minAmount: ruleData.minAmount || null,
      maxAmount: ruleData.maxAmount || null,
      exemptCategories: ruleData.exemptCategories || [],
      exemptItems: ruleData.exemptItems || [],
      
      // Compound tax
      compoundOn: ruleData.compoundOn || [], // List of tax IDs to compound on
      
      // Status
      enabled: ruleData.enabled !== false,
      
      // Audit
      createdAt: now(),
      createdBy: ruleData.createdBy || null,
      metadata: ruleData.metadata || {}
    };

    this.taxRules.set(rule.id, rule);
    this.saveTaxRules();

    return rule;
  }

  /**
   * Get applicable tax rules
   * @param {Object} context - Tax context
   * @returns {Array} Applicable rules
   */
  getApplicableRules(context) {
    const {
      menuItemId,
      categoryId,
      branchId,
      customerGroup,
      amount,
      timestamp
    } = context;

    const applicableRules = [];

    for (const rule of this.taxRules.values()) {
      if (!rule.enabled) continue;

      // Check branch match
      if (rule.branchId && rule.branchId !== branchId) continue;

      // Check item/category match
      if (rule.menuItemId && rule.menuItemId !== menuItemId) continue;
      if (rule.categoryId && rule.categoryId !== categoryId) continue;

      // Check customer group match
      if (rule.customerGroup && rule.customerGroup !== customerGroup) continue;

      // Check amount conditions
      if (rule.minAmount && amount < rule.minAmount) continue;
      if (rule.maxAmount && amount > rule.maxAmount) continue;

      // Check exemptions
      if (rule.exemptCategories && rule.exemptCategories.includes(categoryId)) continue;
      if (rule.exemptItems && rule.exemptItems.includes(menuItemId)) continue;

      applicableRules.push(rule);
    }

    return applicableRules;
  }

  /**
   * Calculate tax for an amount
   * @param {number} amount - Base amount
   * @param {Object} context - Tax context
   * @returns {Object} Tax calculation result
   */
  calculateTax(amount, context) {
    const cacheKey = this.getCacheKey(amount, context);
    const cached = this.taxCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const rules = this.getApplicableRules(context);
    const taxCalculations = [];
    let totalTax = 0;
    let taxableAmount = amount;

    // Sort rules by type (service charges first, then compound taxes)
    const sortedRules = this.sortRulesForCalculation(rules);

    for (const rule of sortedRules) {
      const calculation = this.calculateTaxForRule(rule, taxableAmount, context);
      taxCalculations.push(calculation);
      
      if (rule.calculationMethod === TAX_CALCULATION_METHODS.EXCLUSIVE) {
        totalTax += calculation.taxAmount;
      } else if (rule.calculationMethod === TAX_CALCULATION_METHODS.INCLUSIVE) {
        // Tax is already included, don't add to total
        taxableAmount -= calculation.taxAmount;
      } else if (rule.calculationMethod === TAX_CALCULATION_METHODS.COMPOUND) {
        totalTax += calculation.taxAmount;
        taxableAmount += calculation.taxAmount; // Tax compounds on tax
      }
    }

    const taxResult = {
      baseAmount: amount,
      taxableAmount,
      totalTax: this.round(totalTax, 2),
      finalAmount: amount + this.round(totalTax, 2),
      taxCalculations,
      effectiveTaxRate: (totalTax / amount) * 100,
      calculatedAt: now()
    };

    this.taxCache.set(cacheKey, taxResult);
    return taxResult;
  }

  /**
   * Sort rules for calculation order
   * @param {Array} rules - Array of tax rules
   * @returns {Array} Sorted rules
   */
  sortRulesForCalculation(rules) {
    // Service charges first, then compound taxes, then others
    const priority = {
      [TAX_TYPES.SERVICE_CHARGE]: 1,
      [TAX_TYPES.EXCISE_TAX]: 2,
      [TAX_TYPES.LUXURY_TAX]: 3,
      [TAX_TYPES.TOURISM_TAX]: 4,
      [TAX_TYPES.GST]: 5,
      [TAX_TYPES.VAT]: 6,
      [TAX_TYPES.SALES_TAX]: 7,
      [TAX_TYPES.CUSTOM_TAX]: 8
    };

    return rules.sort((a, b) => {
      const priorityA = priority[a.type] || 99;
      const priorityB = priority[b.type] || 99;
      return priorityA - priorityB;
    });
  }

  /**
   * Calculate tax for a specific rule
   * @param {Object} rule - Tax rule
   * @param {number} amount - Amount to calculate tax on
   * @param {Object} context - Tax context
   * @returns {Object} Tax calculation
   */
  calculateTaxForRule(rule, amount, context) {
    let taxAmount = 0;
    let baseAmount = amount;

    switch (rule.calculationMethod) {
      case TAX_CALCULATION_METHODS.INCLUSIVE:
        // Tax is included in amount
        taxAmount = (amount * rule.rate) / (100 + rule.rate);
        baseAmount = amount - taxAmount;
        break;

      case TAX_CALCULATION_METHODS.EXCLUSIVE:
        // Tax is added to amount
        taxAmount = (amount * rule.rate) / 100;
        break;

      case TAX_CALCULATION_METHODS.COMPOUND:
        // Tax calculated on amount (including previous taxes)
        taxAmount = (amount * rule.rate) / 100;
        break;

      default:
        taxAmount = (amount * rule.rate) / 100;
    }

    // Apply rounding
    taxAmount = this.round(taxAmount, rule.roundingPrecision, rule.roundingMode);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      taxType: rule.type,
      rate: rule.rate,
      calculationMethod: rule.calculationMethod,
      baseAmount,
      taxAmount,
      roundedTaxAmount: taxAmount
    };
  }

  /**
   * Round a number according to rounding mode
   * @param {number} value - Value to round
   * @param {number} precision - Decimal precision
   * @param {string} mode - Rounding mode
   * @returns {number} Rounded value
   */
  round(value, precision = 2, mode = TAX_ROUNDING_MODES.NORMAL) {
    const factor = Math.pow(10, precision);
    const scaled = value * factor;

    switch (mode) {
      case TAX_ROUNDING_MODES.UP:
        return Math.ceil(scaled) / factor;

      case TAX_ROUNDING_MODES.DOWN:
        return Math.floor(scaled) / factor;

      case TAX_ROUNDING_MODES.NEAREST_EVEN:
        // Banker's rounding
        const rounded = Math.round(scaled);
        if (Math.abs(scaled - rounded) === 0.5) {
          return (rounded % 2 === 0 ? rounded : rounded - 1) / factor;
        }
        return rounded / factor;

      case TAX_ROUNDING_MODES.NORMAL:
      default:
        return Math.round(scaled) / factor;
    }
  }

  /**
   * Calculate tax for multiple items
   * @param {Array} items - Array of items with amounts
   * @param {Object} context - Shared tax context
   * @returns {Array} Array of tax calculations
   */
  calculateBatchTax(items, context) {
    return items.map(item => ({
      ...item,
      tax: this.calculateTax(item.amount, {
        ...context,
        menuItemId: item.menuItemId,
        categoryId: item.categoryId
      })
    }));
  }

  /**
   * Get cache key for tax calculation
   * @param {number} amount - Amount
   * @param {Object} context - Tax context
   * @returns {string} Cache key
   */
  getCacheKey(amount, context) {
    const keyParts = [
      amount,
      context.menuItemId,
      context.categoryId,
      context.branchId,
      context.customerGroup,
      context.timestamp || now()
    ];
    return keyParts.join('|');
  }

  /**
   * Clear tax cache
   */
  clearCache() {
    this.taxCache.clear();
  }

  /**
   * Get all tax rules
   * @returns {Array} Array of tax rules
   */
  getAllRules() {
    return Array.from(this.taxRules.values());
  }

  /**
   * Get rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule or null
   */
  getRule(ruleId) {
    return this.taxRules.get(ruleId) || null;
  }

  /**
   * Update tax rule
   * @param {string} ruleId - Rule ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated rule or null
   */
  updateRule(ruleId, updates) {
    const rule = this.taxRules.get(ruleId);
    if (!rule) return null;

    const updated = {
      ...rule,
      ...updates,
      updatedAt: now()
    };

    this.taxRules.set(ruleId, updated);
    this.saveTaxRules();

    return updated;
  }

  /**
   * Delete tax rule
   * @param {string} ruleId - Rule ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteRule(ruleId) {
    const deleted = this.taxRules.delete(ruleId);
    if (deleted) {
      this.saveTaxRules();
    }
    return deleted;
  }

  /**
   * Get rules by type
   * @param {string} type - Tax type
   * @returns {Array} Array of rules
   */
  getRulesByType(type) {
    return this.getAllRules().filter(rule => rule.type === type);
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
   * Enable/disable rule
   * @param {string} ruleId - Rule ID
   * @param {boolean} enabled - Whether to enable
   * @returns {Object} Result
   */
  setRuleEnabled(ruleId, enabled) {
    return this.updateRule(ruleId, { enabled });
  }

  /**
   * Get tax summary for an order
   * @param {number} subtotal - Order subtotal
   * @param {Object} context - Tax context
   * @returns {Object} Tax summary
   */
  getTaxSummary(subtotal, context) {
    const calculation = this.calculateTax(subtotal, context);

    return {
      subtotal,
      totalTax: calculation.totalTax,
      finalAmount: calculation.finalAmount,
      effectiveTaxRate: calculation.effectiveTaxRate,
      taxBreakdown: calculation.taxCalculations.map(tc => ({
        name: tc.ruleName,
        type: tc.taxType,
        rate: tc.rate,
        amount: tc.taxAmount
      }))
    };
  }

  /**
   * Reverse calculate base amount from inclusive tax
   * @param {number} inclusiveAmount - Amount including tax
   * @param {number} taxRate - Tax rate percentage
   * @returns {Object} Reverse calculation result
   */
  reverseCalculateTax(inclusiveAmount, taxRate) {
    const baseAmount = (inclusiveAmount * 100) / (100 + taxRate);
    const taxAmount = inclusiveAmount - baseAmount;

    return {
      inclusiveAmount,
      baseAmount,
      taxAmount,
      taxRate
    };
  }

  /**
   * Get tax statistics
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
      byCalculationMethod: rules.reduce((acc, rule) => {
        acc[rule.calculationMethod] = (acc[rule.calculationMethod] || 0) + 1;
        return acc;
      }, {}),
      enabled: rules.filter(r => r.enabled).length,
      disabled: rules.filter(r => !r.enabled).length,
      cacheSize: this.taxCache.size
    };
  }

  /**
   * Export tax rules
   * @returns {Object} Exported rules
   */
  exportRules() {
    return {
      rules: Array.from(this.taxRules.values()),
      exportedAt: now()
    };
  }

  /**
   * Import tax rules
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
          this.taxRules.set(rule.id, rule);
        });
      }

      this.saveTaxRules();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let taxEngineInstance = null;

/**
 * Get the tax engine singleton
 * @returns {TaxEngine} Tax engine instance
 */
export function getTaxEngine() {
  if (!taxEngineInstance) {
    taxEngineInstance = new TaxEngine();
  }
  return taxEngineInstance;
}

/**
 * Reset the tax engine (useful for testing)
 */
export function resetTaxEngine() {
  taxEngineInstance = null;
}

/**
 * Convenience function to calculate tax
 * @param {number} amount - Amount to calculate tax on
 * @param {Object} context - Tax context
 * @returns {Object} Tax calculation result
 */
export function calculateTax(amount, context = {}) {
  const engine = getTaxEngine();
  return engine.calculateTax(amount, context);
}
