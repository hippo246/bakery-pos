// Pricing Simulator
// Simulate discounts, promotions, taxes, bundles before publishing

import { now } from '../domain/dates.js';
import { getPricingEngine } from './pricingEngine.js';
import { getDiscountEngine } from './discountEngine.js';
import { getTaxEngine } from './taxEngine.js';
import { getPromotionEngine } from './promotionEngine.js';
import { getCouponEngine } from './couponEngine.js';
import { getComboEngine } from './comboEngine.js';
import { getConflictResolutionEngine } from './conflictResolution.js';

const SIMULATIONS_KEY = 'cafeos_pricing_simulations';

/**
 * Simulation Types
 */
export const SIMULATION_TYPES = {
  DISCOUNT: 'DISCOUNT',
  PROMOTION: 'PROMOTION',
  TAX: 'TAX',
  BUNDLE: 'BUNDLE',
  FULL_ORDER: 'FULL_ORDER'
};

/**
 * Pricing Simulator class
 * Simulate discounts, promotions, taxes, bundles before publishing
 */
export class PricingSimulator {
  constructor() {
    this.simulations = new Map();
    this.loadSimulations();
  }

  /**
   * Load simulations from localStorage
   */
  loadSimulations() {
    try {
      const stored = localStorage.getItem(SIMULATIONS_KEY);
      if (stored) {
        const simulations = JSON.parse(stored);
        simulations.forEach(simulation => {
          this.simulations.set(simulation.id, simulation);
        });
      }
    } catch (error) {
      console.error('[PricingSimulator] Failed to load simulations:', error);
    }
  }

  /**
   * Save simulations to localStorage
   */
  saveSimulations() {
    try {
      const simulations = Array.from(this.simulations.values());
      localStorage.setItem(SIMULATIONS_KEY, JSON.stringify(simulations));
    } catch (error) {
      console.error('[PricingSimulator] Failed to save simulations:', error);
    }
  }

  /**
   * Simulate discount
   * @param {Object} discountRule - Discount rule to simulate
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation result
   */
  simulateDiscount(discountRule, context) {
    const discountEngine = getDiscountEngine();

    // Calculate discount
    const discount = discountEngine.calculateDiscount(context.baseAmount, context);

    // Calculate profit impact
    const costAmount = context.costAmount || (context.baseAmount * 0.6);
    const originalProfit = context.baseAmount - costAmount;
    const discountedProfit = discount.finalAmount - costAmount;
    const profitImpact = discountedProfit - originalProfit;

    return {
      success: true,
      type: SIMULATION_TYPES.DISCOUNT,
      discountRule: discountRule,
      baseAmount: context.baseAmount,
      costAmount,
      discountAmount: discount.totalDiscount,
      finalAmount: discount.finalAmount,
      originalProfit,
      discountedProfit,
      profitImpact,
      profitMargin: (discountedProfit / discount.finalAmount) * 100,
      appliedRules: discount.appliedRules,
      simulatedAt: now()
    };
  }

  /**
   * Simulate promotion
   * @param {Object} promotion - Promotion to simulate
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation result
   */
  simulatePromotion(promotion, context) {
    const promotionEngine = getPromotionEngine();

    // Calculate promotion
    const result = promotionEngine.applyPromotion(promotion.id, context.baseAmount, context);

    if (!result.success) {
      return {
        success: false,
        reason: result.reason,
        type: SIMULATION_TYPES.PROMOTION
      };
    }

    // Calculate profit impact
    const costAmount = context.costAmount || (context.baseAmount * 0.6);
    const originalProfit = context.baseAmount - costAmount;
    const promotedProfit = result.finalAmount - costAmount;
    const profitImpact = promotedProfit - originalProfit;

    return {
      success: true,
      type: SIMULATION_TYPES.PROMOTION,
      promotion,
      baseAmount: context.baseAmount,
      costAmount,
      discountAmount: result.discountAmount,
      bonusPoints: result.bonusPoints,
      finalAmount: result.finalAmount,
      originalProfit,
      promotedProfit,
      profitImpact,
      profitMargin: (promotedProfit / result.finalAmount) * 100,
      simulatedAt: now()
    };
  }

  /**
   * Simulate tax
   * @param {Object} taxRule - Tax rule to simulate
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation result
   */
  simulateTax(taxRule, context) {
    const taxEngine = getTaxEngine();

    // Calculate tax
    const tax = taxEngine.calculateTax(context.baseAmount, context);

    return {
      success: true,
      type: SIMULATION_TYPES.TAX,
      taxRule,
      baseAmount: context.baseAmount,
      taxableAmount: tax.taxableAmount,
      totalTax: tax.totalTax,
      finalAmount: tax.finalAmount,
      effectiveTaxRate: tax.effectiveTaxRate,
      taxCalculations: tax.taxCalculations,
      simulatedAt: now()
    };
  }

  /**
   * Simulate combo/bundle
   * @param {Object} combo - Combo to simulate
   * @param {Array} selectedItems - Selected items
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation result
   */
  simulateBundle(combo, selectedItems, context) {
    const comboEngine = getComboEngine();

    // Calculate combo price
    const result = comboEngine.calculateComboPrice(combo.id, selectedItems, context);

    if (!result.success) {
      return {
        success: false,
        reason: result.reason,
        type: SIMULATION_TYPES.BUNDLE
      };
    }

    // Calculate profit impact
    const costAmount = selectedItems.reduce((sum, item) => sum + (item.cost || 0) * (item.quantity || 1), 0);
    const originalProfit = result.itemsBasePrice - costAmount;
    const comboProfit = result.comboPrice - costAmount;
    const profitImpact = comboProfit - originalProfit;

    return {
      success: true,
      type: SIMULATION_TYPES.BUNDLE,
      combo,
      selectedItems,
      itemsBasePrice: result.itemsBasePrice,
      costAmount,
      comboPrice: result.comboPrice,
      discountAmount: result.discountAmount,
      discountPercentage: result.discountPercentage,
      originalProfit,
      comboProfit,
      profitImpact,
      profitMargin: (comboProfit / result.comboPrice) * 100,
      simulatedAt: now()
    };
  }

  /**
   * Simulate full order pricing
   * @param {Object} order - Order to simulate
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation result
   */
  simulateFullOrder(order, context) {
    const pricingEngine = getPricingEngine();
    const discountEngine = getDiscountEngine();
    const taxEngine = getTaxEngine();
    const promotionEngine = getPromotionEngine();
    const conflictEngine = getConflictResolutionEngine();

    let subtotal = 0;
    let totalCost = 0;
    const itemResults = [];

    // Calculate item prices
    order.items.forEach(item => {
      const pricing = pricingEngine.calculatePrice(item.basePrice, {
        menuItemId: item.menuItemId,
        categoryId: item.categoryId,
        branchId: order.branchId,
        customerGroup: order.customerGroup,
        quantity: item.quantity
      });

      const itemCost = item.cost || (item.basePrice * 0.6);
      const itemTotal = pricing.finalPrice * item.quantity;
      const itemCostTotal = itemCost * item.quantity;

      subtotal += itemTotal;
      totalCost += itemCostTotal;

      itemResults.push({
        menuItemId: item.menuItemId,
        name: item.name,
        basePrice: item.basePrice,
        finalPrice: pricing.finalPrice,
        quantity: item.quantity,
        itemTotal,
        cost: itemCost,
        costTotal: itemCostTotal,
        profit: itemTotal - itemCostTotal,
        appliedRules: pricing.appliedRules
      });
    });

    // Get applicable promotions
    const promotions = promotionEngine.getApplicablePromotions({
      customerId: order.customerId,
      branchId: order.branchId,
      orderTotal: subtotal
    });

    // Resolve conflicts
    const conflictResult = conflictEngine.resolveConflicts(promotions, {
      baseAmount: subtotal,
      costAmount: totalCost
    });

    // Apply promotions
    let promotionDiscount = 0;
    conflictResult.appliedRules.forEach(promotion => {
      const result = promotionEngine.applyPromotion(promotion.id, subtotal, {
        customerId: order.customerId,
        branchId: order.branchId
      });
      if (result.success) {
        promotionDiscount += result.discountAmount || 0;
      }
    });

    // Apply discounts
    const discount = discountEngine.calculateDiscount(subtotal - promotionDiscount, {
      orderId: order.id,
      branchId: order.branchId,
      customerGroup: order.customerGroup,
      orderTotal: subtotal
    });

    const afterDiscount = discount.finalAmount;

    // Calculate tax
    const tax = taxEngine.calculateTax(afterDiscount, {
      branchId: order.branchId,
      categoryId: order.categoryId
    });

    const finalTotal = tax.finalAmount;
    const totalProfit = finalTotal - totalCost;
    const profitMargin = (totalProfit / finalTotal) * 100;

    return {
      success: true,
      type: SIMULATION_TYPES.FULL_ORDER,
      order,
      context,
      
      // Item breakdown
      items: itemResults,
      subtotal,
      totalCost,
      
      // Promotions
      applicablePromotions: promotions,
      appliedPromotions: conflictResult.appliedRules,
      rejectedPromotions: conflictResult.rejectedRules,
      promotionDiscount,
      conflictResolution: conflictResult.resolutionStrategy,
      
      // Discounts
      discountAmount: discount.totalDiscount,
      appliedDiscounts: discount.appliedRules,
      
      // Tax
      taxAmount: tax.totalTax,
      taxBreakdown: tax.taxCalculations,
      
      // Totals
      finalTotal,
      totalProfit,
      profitMargin,
      
      // Comparison
      originalTotal: subtotal,
      savings: subtotal - finalTotal,
      savingsPercentage: ((subtotal - finalTotal) / subtotal) * 100,
      
      simulatedAt: now()
    };
  }

  /**
   * Compare multiple scenarios
   * @param {Array} scenarios - Array of scenarios to compare
   * @returns {Object} Comparison result
   */
  compareScenarios(scenarios) {
    const results = scenarios.map(scenario => {
      switch (scenario.type) {
        case SIMULATION_TYPES.DISCOUNT:
          return this.simulateDiscount(scenario.rule, scenario.context);
        case SIMULATION_TYPES.PROMOTION:
          return this.simulatePromotion(scenario.rule, scenario.context);
        case SIMULATION_TYPES.TAX:
          return this.simulateTax(scenario.rule, scenario.context);
        case SIMULATION_TYPES.BUNDLE:
          return this.simulateBundle(scenario.rule, scenario.items, scenario.context);
        case SIMULATION_TYPES.FULL_ORDER:
          return this.simulateFullOrder(scenario.order, scenario.context);
        default:
          return { success: false, reason: 'Unknown scenario type' };
      }
    });

    // Find best scenario by profit
    const profitableScenarios = results.filter(r => r.success && r.profitImpact !== undefined);
    const bestProfit = profitableScenarios.length > 0 
      ? profitableScenarios.reduce((best, current) => current.profitImpact > best.profitImpact ? current : best)
      : null;

    // Find best scenario by customer value (lowest final amount)
    const valueScenarios = results.filter(r => r.success && r.finalAmount !== undefined);
    const bestValue = valueScenarios.length > 0
      ? valueScenarios.reduce((best, current) => current.finalAmount < best.finalAmount ? current : best)
      : null;

    return {
      scenarios: results,
      bestProfit,
      bestValue,
      comparedAt: now()
    };
  }

  /**
   * Save simulation
   * @param {Object} simulation - Simulation to save
   * @returns {Object} Saved simulation
   */
  saveSimulation(simulation) {
    const savedSimulation = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...simulation,
      savedAt: now()
    };

    this.simulations.set(savedSimulation.id, savedSimulation);
    this.saveSimulations();

    return savedSimulation;
  }

  /**
   * Get simulation by ID
   * @param {string} simulationId - Simulation ID
   * @returns {Object|null} Simulation or null
   */
  getSimulation(simulationId) {
    return this.simulations.get(simulationId) || null;
  }

  /**
   * Get all simulations
   * @returns {Array} Array of simulations
   */
  getAllSimulations() {
    return Array.from(this.simulations.values());
  }

  /**
   * Delete simulation
   * @param {string} simulationId - Simulation ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteSimulation(simulationId) {
    const deleted = this.simulations.delete(simulationId);
    if (deleted) {
      this.saveSimulations();
    }
    return deleted;
  }

  /**
   * Clear old simulations
   * @param {number} olderThan - Age in milliseconds
   * @returns {number} Number of simulations cleared
   */
  clearOldSimulations(olderThan = 7 * 24 * 60 * 60 * 1000) {
    const cutoff = now() - olderThan;
    let cleared = 0;

    for (const [id, simulation] of this.simulations) {
      if (simulation.savedAt < cutoff) {
        this.simulations.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      this.saveSimulations();
    }

    return cleared;
  }

  /**
   * Get simulation statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const simulations = this.getAllSimulations();

    return {
      totalSimulations: simulations.length,
      byType: simulations.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {}),
      successful: simulations.filter(s => s.success).length,
      failed: simulations.filter(s => !s.success).length
    };
  }

  /**
   * Export simulations
   * @returns {Object} Exported simulations
   */
  exportSimulations() {
    return {
      simulations: Array.from(this.simulations.values()),
      exportedAt: now()
    };
  }

  /**
   * Import simulations
   * @param {Object} data - Imported simulations data
   * @returns {Object} Import result
   */
  importSimulations(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.simulations)) {
        data.simulations.forEach(simulation => {
          this.simulations.set(simulation.id, simulation);
        });
      }

      this.saveSimulations();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let pricingSimulatorInstance = null;

/**
 * Get the pricing simulator singleton
 * @returns {PricingSimulator} Pricing simulator instance
 */
export function getPricingSimulator() {
  if (!pricingSimulatorInstance) {
    pricingSimulatorInstance = new PricingSimulator();
  }
  return pricingSimulatorInstance;
}

/**
 * Reset the pricing simulator (useful for testing)
 */
export function resetPricingSimulator() {
  pricingSimulatorInstance = null;
}

/**
 * Convenience function to simulate discount
 * @param {Object} discountRule - Discount rule to simulate
 * @param {Object} context - Simulation context
 * @returns {Object} Simulation result
 */
export function simulateDiscount(discountRule, context = {}) {
  const simulator = getPricingSimulator();
  return simulator.simulateDiscount(discountRule, context);
}

/**
 * Convenience function to simulate full order
 * @param {Object} order - Order to simulate
 * @param {Object} context - Simulation context
 * @returns {Object} Simulation result
 */
export function simulateFullOrder(order, context = {}) {
  const simulator = getPricingSimulator();
  return simulator.simulateFullOrder(order, context);
}
