// Combo Engine
// Build meal combos, drink combos, family packs, and custom combos

import { now } from '../domain/dates.js';

const COMBOS_KEY = 'cafeos_combos';

/**
 * Combo Types
 */
export const COMBO_TYPES = {
  MEAL_COMBO: 'MEAL_COMBO',
  DRINK_COMBO: 'DRINK_COMBO',
  FAMILY_PACK: 'FAMILY_PACK',
  CUSTOM_COMBO: 'CUSTOM_COMBO',
  BREAKFAST_COMBO: 'BREAKFAST_COMBO',
  LUNCH_COMBO: 'LUNCH_COMBO',
  DINNER_COMBO: 'DINNER_COMBO',
  HAPPY_HOUR_COMBO: 'HAPPY_HOUR_COMBO',
  KIDS_COMBO: 'KIDS_COMBO',
  DESSERT_COMBO: 'DESSERT_COMBO'
};

/**
 * Combo Engine class
 * Build meal combos, drink combos, family packs, and custom combos
 */
export class ComboEngine {
  constructor() {
    this.combos = new Map();
    this.comboUsage = new Map();
    this.loadCombos();
  }

  /**
   * Load combos from localStorage
   */
  loadCombos() {
    try {
      const stored = localStorage.getItem(COMBOS_KEY);
      if (stored) {
        const combos = JSON.parse(stored);
        combos.forEach(combo => {
          this.combos.set(combo.id, combo);
        });
      }
    } catch (error) {
      console.error('[ComboEngine] Failed to load combos:', error);
    }
  }

  /**
   * Save combos to localStorage
   */
  saveCombos() {
    try {
      const combos = Array.from(this.combos.values());
      localStorage.setItem(COMBOS_KEY, JSON.stringify(combos));
    } catch (error) {
      console.error('[ComboEngine] Failed to save combos:', error);
    }
  }

  /**
   * Create a combo
   * @param {Object} comboData - Combo data
   * @returns {Object} Created combo
   */
  createCombo(comboData) {
    const combo = {
      id: `combo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: comboData.type || COMBO_TYPES.MEAL_COMBO,
      name: comboData.name || 'Untitled Combo',
      description: comboData.description || '',
      imageUrl: comboData.imageUrl || null,
      
      // Pricing
      basePrice: comboData.basePrice || 0,
      discountPrice: comboData.discountPrice || null,
      discountPercentage: comboData.discountPercentage || null,
      
      // Items
      requiredItems: comboData.requiredItems || [],
      optionalItems: comboData.optionalItems || [],
      substitutionItems: comboData.substitutionItems || [],
      
      // Constraints
      minOptionalItems: comboData.minOptionalItems || 0,
      maxOptionalItems: comboData.maxOptionalItems || null,
      maxSubstitutions: comboData.maxSubstitutions || 0,
      
      // Targeting
      branches: comboData.branches || [],
      customerGroups: comboData.customerGroups || [],
      
      // Schedule
      schedule: comboData.schedule || null,
      
      // Limits
      maxUsage: comboData.maxUsage || null,
      maxUsagePerCustomer: comboData.maxUsagePerCustomer || null,
      
      // Status
      enabled: comboData.enabled !== false,
      
      // Metadata
      metadata: comboData.metadata || {},
      createdAt: now(),
      createdBy: comboData.createdBy || null
    };

    this.combos.set(combo.id, combo);
    this.saveCombos();

    return combo;
  }

  /**
   * Get applicable combos
   * @param {Object} context - Combo context
   * @returns {Array} Applicable combos
   */
  getApplicableCombos(context) {
    const {
      branchId,
      customerGroup,
      menuItemIds,
      timestamp
    } = context;

    const currentTime = timestamp || now();
    const currentDay = new Date(currentTime).getDay();
    const currentHour = new Date(currentTime).getHours();

    const applicableCombos = [];

    for (const combo of this.combos.values()) {
      if (!combo.enabled) continue;

      // Check branch targeting
      if (combo.branches.length > 0 && !combo.branches.includes(branchId)) continue;

      // Check customer group targeting
      if (combo.customerGroups.length > 0 && !combo.customerGroups.includes(customerGroup)) continue;

      // Check schedule
      if (combo.schedule) {
        if (!this.isScheduleActive(combo.schedule, currentTime, currentDay, currentHour)) {
          continue;
        }
      }

      // Check if order contains required items
      if (menuItemIds && combo.requiredItems.length > 0) {
        const hasRequiredItems = combo.requiredItems.every(item => 
          menuItemIds.includes(item.menuItemId)
        );
        if (!hasRequiredItems) continue;
      }

      applicableCombos.push(combo);
    }

    return applicableCombos;
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
   * Calculate combo price
   * @param {string} comboId - Combo ID
   * @param {Array} selectedItems - Selected items
   * @param {Object} context - Pricing context
   * @returns {Object} Price calculation result
   */
  calculateComboPrice(comboId, selectedItems, context) {
    const combo = this.combos.get(comboId);

    if (!combo) {
      return {
        success: false,
        reason: 'Combo not found'
      };
    }

    // Validate selected items
    const validation = this.validateComboSelection(combo, selectedItems);
    if (!validation.valid) {
      return {
        success: false,
        reason: validation.reason
      };
    }

    // Calculate base price from items
    let itemsBasePrice = 0;
    selectedItems.forEach(item => {
      itemsBasePrice += (item.price || 0) * (item.quantity || 1);
    });

    // Calculate combo price
    let comboPrice = combo.basePrice || itemsBasePrice;
    let discountAmount = 0;

    if (combo.discountPrice !== null) {
      comboPrice = combo.discountPrice;
      discountAmount = itemsBasePrice - comboPrice;
    } else if (combo.discountPercentage !== null) {
      discountAmount = itemsBasePrice * (combo.discountPercentage / 100);
      comboPrice = itemsBasePrice - discountAmount;
    }

    return {
      success: true,
      comboId: combo.id,
      comboName: combo.name,
      itemsBasePrice,
      comboPrice,
      discountAmount,
      discountPercentage: combo.discountPercentage || ((discountAmount / itemsBasePrice) * 100),
      selectedItems
    };
  }

  /**
   * Validate combo selection
   * @param {Object} combo - Combo
   * @param {Array} selectedItems - Selected items
   * @returns {Object} Validation result
   */
  validateComboSelection(combo, selectedItems) {
    const selectedItemIds = new Set(selectedItems.map(item => item.menuItemId));

    // Check required items
    for (const requiredItem of combo.requiredItems) {
      if (!selectedItemIds.has(requiredItem.menuItemId)) {
        return {
          valid: false,
          reason: `Missing required item: ${requiredItem.name || requiredItem.menuItemId}`
        };
      }
    }

    // Check optional items count
    const optionalCount = selectedItems.filter(item => 
      combo.optionalItems.some(opt => opt.menuItemId === item.menuItemId)
    ).length;

    if (optionalCount < combo.minOptionalItems) {
      return {
        valid: false,
        reason: `Minimum ${combo.minOptionalItems} optional items required`
      };
    }

    if (combo.maxOptionalItems !== null && optionalCount > combo.maxOptionalItems) {
      return {
        valid: false,
        reason: `Maximum ${combo.maxOptionalItems} optional items allowed`
      };
    }

    // Check substitutions
    const substitutionCount = selectedItems.filter(item =>
      combo.substitutionItems.some(sub => sub.menuItemId === item.menuItemId)
    ).length;

    if (substitutionCount > combo.maxSubstitutions) {
      return {
        valid: false,
        reason: `Maximum ${combo.maxSubstitutions} substitutions allowed`
      };
    }

    return { valid: true };
  }

  /**
   * Apply combo to order
   * @param {string} comboId - Combo ID
   * @param {Array} selectedItems - Selected items
   * @param {Object} context - Order context
   * @returns {Object} Application result
   */
  applyCombo(comboId, selectedItems, context) {
    const calculation = this.calculateComboPrice(comboId, selectedItems, context);

    if (!calculation.success) {
      return calculation;
    }

    // Track usage
    this.trackUsage(comboId, context.customerId);

    return {
      ...calculation,
      appliedAt: now()
    };
  }

  /**
   * Track combo usage
   * @param {string} comboId - Combo ID
   * @param {string} customerId - Customer ID
   */
  trackUsage(comboId, customerId) {
    const usageKey = `${comboId}_${customerId || 'global'}`;
    const usage = this.comboUsage.get(usageKey) || { count: 0 };
    usage.count++;
    usage.lastUsed = now();
    this.comboUsage.set(usageKey, usage);
  }

  /**
   * Get combo by ID
   * @param {string} comboId - Combo ID
   * @returns {Object|null} Combo or null
   */
  getCombo(comboId) {
    return this.combos.get(comboId) || null;
  }

  /**
   * Get all combos
   * @returns {Array} Array of combos
   */
  getAllCombos() {
    return Array.from(this.combos.values());
  }

  /**
   * Get combos by type
   * @param {string} type - Combo type
   * @returns {Array} Array of combos
   */
  getCombosByType(type) {
    return this.getAllCombos().filter(c => c.type === type);
  }

  /**
   * Get enabled combos
   * @returns {Array} Array of enabled combos
   */
  getEnabledCombos() {
    return this.getAllCombos().filter(c => c.enabled);
  }

  /**
   * Update combo
   * @param {string} comboId - Combo ID
   * @param {Object} updates - Updates to apply
   * @returns {Object|null} Updated combo or null
   */
  updateCombo(comboId, updates) {
    const combo = this.combos.get(comboId);
    if (!combo) return null;

    const updated = {
      ...combo,
      ...updates,
      updatedAt: now()
    };

    this.combos.set(comboId, updated);
    this.saveCombos();

    return updated;
  }

  /**
   * Delete combo
   * @param {string} comboId - Combo ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteCombo(comboId) {
    const deleted = this.combos.delete(comboId);
    if (deleted) {
      this.saveCombos();
    }
    return deleted;
  }

  /**
   * Enable/disable combo
   * @param {string} comboId - Combo ID
   * @param {boolean} enabled - Whether to enable
   * @returns {Object} Result
   */
  setComboEnabled(comboId, enabled) {
    return this.updateCombo(comboId, { enabled });
  }

  /**
   * Add required item to combo
   * @param {string} comboId - Combo ID
   * @param {Object} item - Item to add
   * @returns {Object} Result
   */
  addRequiredItem(comboId, item) {
    const combo = this.combos.get(comboId);
    if (!combo) return null;

    combo.requiredItems.push(item);
    this.saveCombos();

    return combo;
  }

  /**
   * Add optional item to combo
   * @param {string} comboId - Combo ID
   * @param {Object} item - Item to add
   * @returns {Object} Result
   */
  addOptionalItem(comboId, item) {
    const combo = this.combos.get(comboId);
    if (!combo) return null;

    combo.optionalItems.push(item);
    this.saveCombos();

    return combo;
  }

  /**
   * Add substitution item to combo
   * @param {string} comboId - Combo ID
   * @param {Object} item - Item to add
   * @returns {Object} Result
   */
  addSubstitutionItem(comboId, item) {
    const combo = this.combos.get(comboId);
    if (!combo) return null;

    combo.substitutionItems.push(item);
    this.saveCombos();

    return combo;
  }

  /**
   * Get combo usage statistics
   * @returns {Object} Usage statistics
   */
  getUsageStatistics() {
    const stats = {};

    for (const [key, usage] of this.comboUsage) {
      const [comboId, customerId] = key.split('_');
      if (!stats[comboId]) {
        stats[comboId] = { total: 0, byCustomer: {} };
      }
      stats[comboId].total += usage.count;
      if (customerId !== 'global') {
        stats[comboId].byCustomer[customerId] = usage.count;
      }
    }

    return stats;
  }

  /**
   * Get combo statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const combos = this.getAllCombos();

    return {
      totalCombos: combos.length,
      byType: combos.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {}),
      enabled: combos.filter(c => c.enabled).length,
      disabled: combos.filter(c => !c.enabled).length,
      withDiscount: combos.filter(c => c.discountPrice !== null || c.discountPercentage !== null).length
    };
  }

  /**
   * Export combos
   * @returns {Object} Exported combos
   */
  exportCombos() {
    return {
      combos: Array.from(this.combos.values()),
      usageTracking: Object.fromEntries(this.comboUsage),
      exportedAt: now()
    };
  }

  /**
   * Import combos
   * @param {Object} data - Imported combos data
   * @returns {Object} Import result
   */
  importCombos(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.combos)) {
        data.combos.forEach(combo => {
          this.combos.set(combo.id, combo);
        });
      }

      if (data.usageTracking && typeof data.usageTracking === 'object') {
        Object.entries(data.usageTracking).forEach(([key, value]) => {
          this.comboUsage.set(key, value);
        });
      }

      this.saveCombos();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let comboEngineInstance = null;

/**
 * Get the combo engine singleton
 * @returns {ComboEngine} Combo engine instance
 */
export function getComboEngine() {
  if (!comboEngineInstance) {
    comboEngineInstance = new ComboEngine();
  }
  return comboEngineInstance;
}

/**
 * Reset the combo engine (useful for testing)
 */
export function resetComboEngine() {
  comboEngineInstance = null;
}

/**
 * Convenience function to create a combo
 * @param {Object} comboData - Combo data
 * @returns {Object} Created combo
 */
export function createCombo(comboData = {}) {
  const engine = getComboEngine();
  return engine.createCombo(comboData);
}

/**
 * Convenience function to calculate combo price
 * @param {string} comboId - Combo ID
 * @param {Array} selectedItems - Selected items
 * @param {Object} context - Pricing context
 * @returns {Object} Price calculation result
 */
export function calculateComboPrice(comboId, selectedItems, context = {}) {
  const engine = getComboEngine();
  return engine.calculateComboPrice(comboId, selectedItems, context);
}
