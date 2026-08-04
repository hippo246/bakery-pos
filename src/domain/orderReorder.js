// Order Reorder Feature
// Reorders previous orders with validation for availability, pricing, and modifiers

import { normalizeOrder, createOrder, calculateSubtotal, calculateOrderTotals } from './orderModel.js';
import { now } from './dates.js';

/**
 * Validation Result Types
 */
export const VALIDATION_STATUS = {
  VALID: 'VALID',
  INVALID: 'INVALID',
  PARTIALLY_VALID: 'PARTIALLY_VALID'
};

/**
 * Order Reorder Manager class
 * Manages reorder operations with validation
 */
export class OrderReorderManager {
  constructor() {
    this.reorderHistory = new Map();
  }

  /**
   * Reorder a previous order
   * @param {Order} previousOrder - Previous order to reorder
   * @param {Object} options - Reorder options
   * @returns {Object} Reorder result
   */
  reorder(previousOrder, options = {}) {
    const normalizedOrder = normalizeOrder(previousOrder);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid previous order'
      };
    }

    // Validate items availability
    const validation = this.validateReorder(normalizedOrder, options);

    if (!validation.isValid) {
      return {
        success: false,
        validation,
        reason: 'Order validation failed'
      };
    }

    // Create new order from previous
    const items = validation.validItems.map(item => ({ ...item }));
    const subtotal = calculateSubtotal(items);
    const taxRate = options.taxRate || normalizedOrder.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    const newOrder = createOrder({
      ...options,
      items,
      subtotal,
      taxAmount,
      total,
      discountAmount,
      reorderedFrom: normalizedOrder.id,
      reorderedAt: now(),
      validation: validation.summary
    });

    // Record reorder history
    this.recordReorder(normalizedOrder.id, newOrder.id, validation, options);

    return {
      success: true,
      newOrder,
      validation,
      warnings: validation.warnings
    };
  }

  /**
   * Validate reorder for availability, pricing, and modifiers
   * @param {Order} order - Order to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateReorder(order, options = {}) {
    const checkAvailability = options.checkAvailability !== false; // Default true
    const checkPricing = options.checkPricing !== false; // Default true
    const checkModifiers = options.checkModifiers !== false; // Default true
    const inventory = options.inventory || {};
    const menu = options.menu || {};

    const validItems = [];
    const invalidItems = [];
    const warnings = [];
    const priceChanges = [];

    for (const item of order.items) {
      const itemValidation = this.validateItem(item, {
        checkAvailability,
        checkPricing,
        checkModifiers,
        inventory,
        menu
      });

      if (itemValidation.isValid) {
        validItems.push({
          ...item,
          price: itemValidation.currentPrice || item.price,
          modifiers: itemValidation.currentModifiers || item.modifiers
        });

        if (itemValidation.priceChanged) {
          priceChanges.push({
            menuItemId: item.menuItemId,
            menuItemName: item.name,
            oldPrice: item.price,
            newPrice: itemValidation.currentPrice
          });
        }

        if (itemValidation.warnings.length > 0) {
          warnings.push(...itemValidation.warnings);
        }
      } else {
        invalidItems.push({
          ...item,
          reason: itemValidation.reason,
          warnings: itemValidation.warnings
        });
      }
    }

    const isValid = invalidItems.length === 0;
    const isPartiallyValid = validItems.length > 0 && invalidItems.length > 0;

    return {
      isValid,
      isPartiallyValid,
      status: isValid ? VALIDATION_STATUS.VALID : 
              isPartiallyValid ? VALIDATION_STATUS.PARTIALLY_VALID : 
              VALIDATION_STATUS.INVALID,
      validItems,
      invalidItems,
      warnings,
      priceChanges,
      summary: {
        totalItems: order.items.length,
        validItems: validItems.length,
        invalidItems: invalidItems.length,
        priceChanges: priceChanges.length
      }
    };
  }

  /**
   * Validate a single item
   * @param {Object} item - Item to validate
   * @param {Object} options - Validation options
   * @returns {Object} Item validation result
   */
  validateItem(item, options = {}) {
    const { checkAvailability, checkPricing, checkModifiers, inventory, menu } = options;
    const warnings = [];

    // Check availability
    let isAvailable = true;
    if (checkAvailability && inventory[item.menuItemId] !== undefined) {
      const availableQty = inventory[item.menuItemId];
      if (availableQty < item.qty) {
        isAvailable = false;
        warnings.push(`Only ${availableQty} available, requested ${item.qty}`);
      }
    }

    // Check pricing
    let priceChanged = false;
    let currentPrice = item.price;
    if (checkPricing && menu[item.menuItemId]) {
      const menuItem = menu[item.menuItemId];
      if (menuItem.price !== item.price) {
        priceChanged = true;
        currentPrice = menuItem.price;
        warnings.push(`Price changed from $${item.price.toFixed(2)} to $${menuItem.price.toFixed(2)}`);
      }
    }

    // Check modifiers
    let modifiersValid = true;
    let currentModifiers = item.modifiers;
    if (checkModifiers && menu[item.menuItemId]) {
      const menuItem = menu[item.menuItemId];
      const availableModifiers = menuItem.modifiers || [];
      
      if (item.modifiers && item.modifiers.length > 0) {
        const invalidModifiers = item.modifiers.filter(mod => 
          !availableModifiers.includes(mod)
        );

        if (invalidModifiers.length > 0) {
          modifiersValid = false;
          currentModifiers = item.modifiers.filter(mod => 
            availableModifiers.includes(mod)
          );
          warnings.push(`Modifiers ${invalidModifiers.join(', ')} no longer available`);
        }
      }
    }

    const isValid = isAvailable && modifiersValid;

    return {
      isValid,
      isAvailable,
      priceChanged,
      currentPrice,
      modifiersValid,
      currentModifiers,
      warnings,
      reason: !isAvailable ? 'Item not available' : 
              !modifiersValid ? 'Invalid modifiers' : null
    };
  }

  /**
   * Reorder with partial validation (allow invalid items to be reordered anyway)
   * @param {Order} previousOrder - Previous order to reorder
   * @param {Object} options - Reorder options
   * @returns {Object} Reorder result
   */
  reorderPartial(previousOrder, options = {}) {
    const normalizedOrder = normalizeOrder(previousOrder);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid previous order'
      };
    }

    // Validate items
    const validation = this.validateReorder(normalizedOrder, options);

    // Include all items, even invalid ones
    const items = normalizedOrder.items.map(item => {
      const validItem = validation.validItems.find(v => v.menuItemId === item.menuItemId);
      if (validItem) {
        return validItem;
      }
      return { ...item };
    });

    const subtotal = calculateSubtotal(items);
    const taxRate = options.taxRate || normalizedOrder.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    const newOrder = createOrder({
      ...options,
      items,
      subtotal,
      taxAmount,
      total,
      discountAmount,
      reorderedFrom: normalizedOrder.id,
      reorderedAt: now(),
      validation: validation.summary,
      partialReorder: true
    });

    return {
      success: true,
      newOrder,
      validation,
      warnings: validation.warnings
    };
  }

  /**
   * Quick reorder (skip validation)
   * @param {Order} previousOrder - Previous order to reorder
   * @param {Object} options - Reorder options
   * @returns {Object} Reorder result
   */
  quickReorder(previousOrder, options = {}) {
    const normalizedOrder = normalizeOrder(previousOrder);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid previous order'
      };
    }

    const items = normalizedOrder.items.map(item => ({ ...item }));
    const subtotal = calculateSubtotal(items);
    const taxRate = options.taxRate || normalizedOrder.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    const newOrder = createOrder({
      ...options,
      items,
      subtotal,
      taxAmount,
      total,
      discountAmount,
      reorderedFrom: normalizedOrder.id,
      reorderedAt: now(),
      quickReorder: true,
      validationSkipped: true
    });

    return {
      success: true,
      newOrder
    };
  }

  /**
   * Reorder specific items from previous order
   * @param {Order} previousOrder - Previous order
   * @param {Array} itemIds - Item IDs to reorder
   * @param {Object} options - Reorder options
   * @returns {Object} Reorder result
   */
  reorderItems(previousOrder, itemIds, options = {}) {
    const normalizedOrder = normalizeOrder(previousOrder);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid previous order'
      };
    }

    const selectedItems = normalizedOrder.items.filter(item => itemIds.includes(item.id));

    if (selectedItems.length === 0) {
      return {
        success: false,
        reason: 'No matching items found'
      };
    }

    // Validate selected items
    const validation = this.validateReorder(
      { ...normalizedOrder, items: selectedItems },
      options
    );

    const items = validation.validItems;
    const subtotal = calculateSubtotal(items);
    const taxRate = options.taxRate || normalizedOrder.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    const newOrder = createOrder({
      ...options,
      items,
      subtotal,
      taxAmount,
      total,
      discountAmount,
      reorderedFrom: normalizedOrder.id,
      reorderedAt: now(),
      validation: validation.summary,
      partialReorder: true
    });

    return {
      success: true,
      newOrder,
      validation,
      warnings: validation.warnings
    };
  }

  /**
   * Get reorder suggestions based on previous orders
   * @param {Order[]} previousOrders - Array of previous orders
   * @param {Object} options - Suggestion options
   * @returns {Object} Suggestion result
   */
  getReorderSuggestions(previousOrders, options = {}) {
    const limit = options.limit || 5;
    const customerId = options.customerId || null;

    let orders = previousOrders;

    // Filter by customer if specified
    if (customerId) {
      orders = orders.filter(order => order.customerId === customerId);
    }

    // Sort by frequency and recency
    const itemFrequency = new Map();
    const itemRecency = new Map();

    orders.forEach(order => {
      order.items.forEach(item => {
        const menuItemId = item.menuItemId;
        itemFrequency.set(menuItemId, (itemFrequency.get(menuItemId) || 0) + item.qty);
        
        const lastOrdered = itemRecency.get(menuItemId) || 0;
        const orderTime = order.updatedAt || order.createdAt;
        if (orderTime > lastOrdered) {
          itemRecency.set(menuItemId, orderTime);
        }
      });
    });

    // Calculate score (frequency * recency factor)
    const suggestions = Array.from(itemFrequency.entries()).map(([menuItemId, frequency]) => {
      const lastOrdered = itemRecency.get(menuItemId) || 0;
      const daysSinceOrder = (Date.now() - lastOrdered) / (1000 * 60 * 60 * 24);
      const recencyFactor = Math.max(0.1, 1 - (daysSinceOrder / 30)); // Decay over 30 days
      const score = frequency * recencyFactor;

      return {
        menuItemId,
        frequency,
        lastOrdered,
        daysSinceOrder,
        score
      };
    });

    // Sort by score and limit
    suggestions.sort((a, b) => b.score - a.score);

    return {
      success: true,
      suggestions: suggestions.slice(0, limit),
      totalOrders: orders.length
    };
  }

  /**
   * Record reorder in history
   * @param {string} originalOrderId - Original order ID
   * @param {string} newOrderId - New order ID
   * @param {Object} validation - Validation result
   * @param {Object} options - Reorder options
   */
  recordReorder(originalOrderId, newOrderId, validation, options) {
    const reorderId = `reorder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.reorderHistory.set(reorderId, {
      id: reorderId,
      originalOrderId,
      newOrderId,
      validation,
      options,
      reorderedAt: now()
    });
  }

  /**
   * Get reorder history
   * @returns {Array} Array of reorder records
   */
  getReorderHistory() {
    return Array.from(this.reorderHistory.values());
  }

  /**
   * Get reorder history by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of reorder records
   */
  getReorderHistoryByOrder(orderId) {
    return this.getReorderHistory().filter(record => 
      record.originalOrderId === orderId || record.newOrderId === orderId
    );
  }

  /**
   * Get reorder statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const reorders = this.getReorderHistory();

    return {
      totalReorders: reorders.length,
      successfulReorders: reorders.filter(r => r.validation.isValid).length,
      partialReorders: reorders.filter(r => r.validation.isPartiallyValid).length,
      failedReorders: reorders.filter(r => !r.validation.isValid && !r.validation.isPartiallyValid).length,
      averageItemsPerReorder: reorders.length > 0
        ? reorders.reduce((sum, r) => sum + r.validation.summary.totalItems, 0) / reorders.length
        : 0
    };
  }
}

// Singleton instance
let reorderManagerInstance = null;

/**
 * Get the order reorder manager singleton
 * @returns {OrderReorderManager} Reorder manager instance
 */
export function getOrderReorderManager() {
  if (!reorderManagerInstance) {
    reorderManagerInstance = new OrderReorderManager();
  }
  return reorderManagerInstance;
}

/**
 * Reset the reorder manager (useful for testing)
 */
export function resetOrderReorderManager() {
  reorderManagerInstance = null;
}

/**
 * Convenience function to reorder an order
 * @param {Order} previousOrder - Previous order to reorder
 * @param {Object} options - Reorder options
 * @returns {Object} Reorder result
 */
export function reorder(previousOrder, options = {}) {
  const manager = getOrderReorderManager();
  return manager.reorder(previousOrder, options);
}
