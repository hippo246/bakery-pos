// Order Split Functionality
// Splits orders by guest, seat, item, or custom criteria

import { normalizeOrder, createOrder, calculateSubtotal, calculateOrderTotals } from './orderModel.js';
import { now } from './dates.js';

/**
 * Split Types
 */
export const SPLIT_TYPES = {
  BY_GUEST: 'BY_GUEST',           // Split by guest count
  BY_SEAT: 'BY_SEAT',             // Split by seat
  BY_ITEM: 'BY_ITEM',             // Split by item (each item to separate order)
  BY_PERCENTAGE: 'BY_PERCENTAGE', // Split by percentage
  BY_AMOUNT: 'BY_AMOUNT',         // Split by specific amounts
  CUSTOM: 'CUSTOM'                // Custom split with item selection
};

/**
 * Order Split Manager class
 * Manages order splitting operations
 */
export class OrderSplitManager {
  constructor() {
    this.splitHistory = new Map();
  }

  /**
   * Split an order
   * @param {Order} order - Order to split
   * @param {string} splitType - Type of split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitOrder(order, splitType, options = {}) {
    const normalizedOrder = normalizeOrder(order);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid order provided'
      };
    }

    let result;

    switch (splitType) {
      case SPLIT_TYPES.BY_GUEST:
        result = this.splitByGuest(normalizedOrder, options);
        break;
      case SPLIT_TYPES.BY_SEAT:
        result = this.splitBySeat(normalizedOrder, options);
        break;
      case SPLIT_TYPES.BY_ITEM:
        result = this.splitByItem(normalizedOrder, options);
        break;
      case SPLIT_TYPES.BY_PERCENTAGE:
        result = this.splitByPercentage(normalizedOrder, options);
        break;
      case SPLIT_TYPES.BY_AMOUNT:
        result = this.splitByAmount(normalizedOrder, options);
        break;
      case SPLIT_TYPES.CUSTOM:
        result = this.splitCustom(normalizedOrder, options);
        break;
      default:
        return {
          success: false,
          reason: `Unknown split type: ${splitType}`
        };
    }

    if (result.success) {
      // Record split history
      this.recordSplit(normalizedOrder.id, result.splitOrders, splitType, options);
    }

    return result;
  }

  /**
   * Split order by guest count
   * @param {Order} order - Order to split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitByGuest(order, options = {}) {
    const guestCount = options.guestCount || 2;
    
    if (guestCount < 2) {
      return {
        success: false,
        reason: 'Guest count must be at least 2'
      };
    }

    // Calculate total
    const subtotal = calculateSubtotal(order.items);
    const taxRate = order.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    // Calculate per-guest amount
    const perGuestTotal = total / guestCount;

    // Create split orders
    const splitOrders = [];
    for (let i = 0; i < guestCount; i++) {
      const splitOrder = createOrder({
        ...order,
        id: undefined,
        items: [], // Items will be assigned manually
        splitFrom: order.id,
        splitType: SPLIT_TYPES.BY_GUEST,
        splitIndex: i,
        splitTotal: perGuestTotal,
        guestNumber: i + 1
      });

      splitOrders.push(splitOrder);
    }

    return {
      success: true,
      splitOrders,
      splitType: SPLIT_TYPES.BY_GUEST,
      originalTotal: total,
      perGuestTotal
    };
  }

  /**
   * Split order by seat
   * @param {Order} order - Order to split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitBySeat(order, options = {}) {
    const seatAssignments = options.seatAssignments || {};
    
    if (Object.keys(seatAssignments).length === 0) {
      return {
        success: false,
        reason: 'No seat assignments provided'
      };
    }

    // Group items by seat
    const itemsBySeat = new Map();
    const unassignedItems = [];

    order.items.forEach(item => {
      const seatId = item.seatId || item.seat;
      if (seatId && seatAssignments[seatId]) {
        if (!itemsBySeat.has(seatId)) {
          itemsBySeat.set(seatId, []);
        }
        itemsBySeat.get(seatId).push(item);
      } else {
        unassignedItems.push(item);
      }
    });

    // Create split orders for each seat
    const splitOrders = [];
    let seatIndex = 0;

    for (const [seatId, items] of itemsBySeat) {
      const subtotal = calculateSubtotal(items);
      const taxRate = order.taxRate || 0.18;
      const { total } = calculateOrderTotals(subtotal, 0, taxRate);

      const splitOrder = createOrder({
        ...order,
        id: undefined,
        items,
        splitFrom: order.id,
        splitType: SPLIT_TYPES.BY_SEAT,
        splitIndex: seatIndex++,
        seatId,
        seatNumber: seatAssignments[seatId].seatNumber || seatId,
        splitTotal: total
      });

      splitOrders.push(splitOrder);
    }

    // Add unassigned items to first split order
    if (unassignedItems.length > 0 && splitOrders.length > 0) {
      splitOrders[0].items.push(...unassignedItems);
      // Recalculate total
      const newSubtotal = calculateSubtotal(splitOrders[0].items);
      const { total } = calculateOrderTotals(newSubtotal, 0, order.taxRate || 0.18);
      splitOrders[0].splitTotal = total;
    }

    return {
      success: true,
      splitOrders,
      splitType: SPLIT_TYPES.BY_SEAT,
      seatCount: itemsBySeat.size
    };
  }

  /**
   * Split order by item (each item to separate order)
   * @param {Order} order - Order to split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitByItem(order, options = {}) {
    const groupSimilarItems = options.groupSimilarItems !== false; // Default true

    if (order.items.length === 0) {
      return {
        success: false,
        reason: 'No items to split'
      };
    }

    let itemGroups;
    if (groupSimilarItems) {
      // Group by menuItemId
      const groups = new Map();
      order.items.forEach(item => {
        const key = item.menuItemId;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(item);
      });
      itemGroups = Array.from(groups.values());
    } else {
      // Each item separate
      itemGroups = order.items.map(item => [item]);
    }

    // Create split orders
    const splitOrders = [];
    itemGroups.forEach((items, index) => {
      const subtotal = calculateSubtotal(items);
      const taxRate = order.taxRate || 0.18;
      const { total } = calculateOrderTotals(subtotal, 0, taxRate);

      const splitOrder = createOrder({
        ...order,
        id: undefined,
        items,
        splitFrom: order.id,
        splitType: SPLIT_TYPES.BY_ITEM,
        splitIndex: index,
        splitTotal: total
      });

      splitOrders.push(splitOrder);
    });

    return {
      success: true,
      splitOrders,
      splitType: SPLIT_TYPES.BY_ITEM,
      groupSimilarItems
    };
  }

  /**
   * Split order by percentage
   * @param {Order} order - Order to split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitByPercentage(order, options = {}) {
    const percentages = options.percentages || [50, 50];
    
    if (percentages.length < 2) {
      return {
        success: false,
        reason: 'At least 2 percentages required'
      };
    }

    // Validate percentages sum to 100
    const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return {
        success: false,
        reason: 'Percentages must sum to 100'
      };
    }

    // Calculate total
    const subtotal = calculateSubtotal(order.items);
    const taxRate = order.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    // Create split orders with percentage-based totals
    const splitOrders = [];
    percentages.forEach((percentage, index) => {
      const splitTotal = (total * percentage) / 100;

      const splitOrder = createOrder({
        ...order,
        id: undefined,
        items: [], // Items will be assigned manually
        splitFrom: order.id,
        splitType: SPLIT_TYPES.BY_PERCENTAGE,
        splitIndex: index,
        splitPercentage: percentage,
        splitTotal
      });

      splitOrders.push(splitOrder);
    });

    return {
      success: true,
      splitOrders,
      splitType: SPLIT_TYPES.BY_PERCENTAGE,
      percentages,
      originalTotal: total
    };
  }

  /**
   * Split order by specific amounts
   * @param {Order} order - Order to split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitByAmount(order, options = {}) {
    const amounts = options.amounts || [];
    
    if (amounts.length < 2) {
      return {
        success: false,
        reason: 'At least 2 amounts required'
      };
    }

    // Calculate total
    const subtotal = calculateSubtotal(order.items);
    const taxRate = order.taxRate || 0.18;
    const { total } = calculateOrderTotals(subtotal, 0, taxRate);

    // Validate amounts sum to total
    const totalAmount = amounts.reduce((sum, a) => sum + a, 0);
    if (Math.abs(totalAmount - total) > 0.01) {
      return {
        success: false,
        reason: 'Amounts must sum to order total'
      };
    }

    // Create split orders with specific amounts
    const splitOrders = [];
    amounts.forEach((amount, index) => {
      const splitOrder = createOrder({
        ...order,
        id: undefined,
        items: [], // Items will be assigned manually
        splitFrom: order.id,
        splitType: SPLIT_TYPES.BY_AMOUNT,
        splitIndex: index,
        splitAmount: amount,
        splitTotal: amount
      });

      splitOrders.push(splitOrder);
    });

    return {
      success: true,
      splitOrders,
      splitType: SPLIT_TYPES.BY_AMOUNT,
      amounts,
      originalTotal: total
    };
  }

  /**
   * Custom split with item selection
   * @param {Order} order - Order to split
   * @param {Object} options - Split options
   * @returns {Object} Split result
   */
  splitCustom(order, options = {}) {
    const itemAssignments = options.itemAssignments || [];
    
    if (itemAssignments.length < 2) {
      return {
        success: false,
        reason: 'At least 2 groups required for custom split'
      };
    }

    // Validate all items are assigned
    const assignedItemIds = new Set();
    itemAssignments.forEach(group => {
      group.itemIds.forEach(id => assignedItemIds.add(id));
    });

    const allItemIds = new Set(order.items.map(item => item.id));
    const unassigned = Array.from(allItemIds).filter(id => !assignedItemIds.has(id));

    if (unassigned.length > 0) {
      return {
        success: false,
        reason: `${unassigned.length} items not assigned to any group`
      };
    }

    // Create split orders for each group
    const splitOrders = [];
    itemAssignments.forEach((assignment, index) => {
      const items = order.items.filter(item => assignment.itemIds.includes(item.id));
      const subtotal = calculateSubtotal(items);
      const taxRate = order.taxRate || 0.18;
      const { total } = calculateOrderTotals(subtotal, 0, taxRate);

      const splitOrder = createOrder({
        ...order,
        id: undefined,
        items,
        splitFrom: order.id,
        splitType: SPLIT_TYPES.CUSTOM,
        splitIndex: index,
        splitGroupName: assignment.name || `Split ${index + 1}`,
        splitTotal: total
      });

      splitOrders.push(splitOrder);
    });

    return {
      success: true,
      splitOrders,
      splitType: SPLIT_TYPES.CUSTOM,
      groupCount: itemAssignments.length
    };
  }

  /**
   * Recombine split orders
   * @param {Order[]} splitOrders - Array of split orders
   * @param {Object} options - Recombine options
   * @returns {Object} Recombine result
   */
  recombineOrders(splitOrders, options = {}) {
    if (splitOrders.length < 2) {
      return {
        success: false,
        reason: 'At least 2 orders required to recombine'
      };
    }

    // Verify all orders are from same split
    const splitFromIds = new Set(splitOrders.map(order => order.splitFrom));
    if (splitFromIds.size > 1) {
      return {
        success: false,
        reason: 'Orders are not from the same split'
      };
    }

    // Combine all items
    const allItems = [];
    splitOrders.forEach(order => {
      allItems.push(...order.items);
    });

    // Calculate totals
    const subtotal = calculateSubtotal(allItems);
    const taxRate = splitOrders[0].taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    // Create recombined order
    const recombinedOrder = createOrder({
      ...splitOrders[0],
      id: undefined,
      items: allItems,
      splitFrom: null,
      splitType: null,
      splitIndex: null,
      recombinedFrom: splitOrders.map(o => o.id),
      recombinedAt: now(),
      subtotal,
      discountAmount,
      taxAmount,
      total
    });

    return {
      success: true,
      recombinedOrder,
      ordersRecombined: splitOrders.length
    };
  }

  /**
   * Preview split without executing
   * @param {Order} order - Order to split
   * @param {string} splitType - Type of split
   * @param {Object} options - Split options
   * @returns {Object} Preview result
   */
  previewSplit(order, splitType, options = {}) {
    const normalizedOrder = normalizeOrder(order);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid order provided'
      };
    }

    let preview;

    switch (splitType) {
      case SPLIT_TYPES.BY_GUEST:
        preview = this.previewByGuest(normalizedOrder, options);
        break;
      case SPLIT_TYPES.BY_ITEM:
        preview = this.previewByItem(normalizedOrder, options);
        break;
      case SPLIT_TYPES.BY_PERCENTAGE:
        preview = this.previewByPercentage(normalizedOrder, options);
        break;
      default:
        preview = {
          success: true,
          splitType,
          message: 'Preview not available for this split type'
        };
    }

    return preview;
  }

  /**
   * Preview guest split
   * @param {Order} order - Order to preview
   * @param {Object} options - Split options
   * @returns {Object} Preview result
   */
  previewByGuest(order, options = {}) {
    const guestCount = options.guestCount || 2;
    const subtotal = calculateSubtotal(order.items);
    const taxRate = order.taxRate || 0.18;
    const { total } = calculateOrderTotals(subtotal, 0, taxRate);
    const perGuest = total / guestCount;

    return {
      success: true,
      splitType: SPLIT_TYPES.BY_GUEST,
      guestCount,
      originalTotal: total,
      perGuestTotal: perGuest,
      preview: Array.from({ length: guestCount }, (_, i) => ({
        guestNumber: i + 1,
        total: perGuest
      }))
    };
  }

  /**
   * Preview item split
   * @param {Order} order - Order to preview
   * @param {Object} options - Split options
   * @returns {Object} Preview result
   */
  previewByItem(order, options = {}) {
    const groupSimilarItems = options.groupSimilarItems !== false;

    if (groupSimilarItems) {
      const groups = new Map();
      order.items.forEach(item => {
        const key = item.menuItemId;
        if (!groups.has(key)) {
          groups.set(key, { name: item.name, count: 0, total: 0 });
        }
        groups.get(key).count += item.qty;
        groups.get(key).total += item.price * item.qty;
      });

      return {
        success: true,
        splitType: SPLIT_TYPES.BY_ITEM,
        groupSimilarItems: true,
        groupCount: groups.size,
        preview: Array.from(groups.values())
      };
    } else {
      return {
        success: true,
        splitType: SPLIT_TYPES.BY_ITEM,
        groupSimilarItems: false,
        groupCount: order.items.length,
        preview: order.items.map(item => ({
          name: item.name,
          qty: item.qty,
          total: item.price * item.qty
        }))
      };
    }
  }

  /**
   * Preview percentage split
   * @param {Order} order - Order to preview
   * @param {Object} options - Split options
   * @returns {Object} Preview result
   */
  previewByPercentage(order, options = {}) {
    const percentages = options.percentages || [50, 50];
    const subtotal = calculateSubtotal(order.items);
    const taxRate = order.taxRate || 0.18;
    const { total } = calculateOrderTotals(subtotal, 0, taxRate);

    return {
      success: true,
      splitType: SPLIT_TYPES.BY_PERCENTAGE,
      percentages,
      originalTotal: total,
      preview: percentages.map((percentage, index) => ({
        splitNumber: index + 1,
        percentage,
        total: (total * percentage) / 100
      }))
    };
  }

  /**
   * Record split in history
   * @param {string} originalOrderId - Original order ID
   * @param {Order[]} splitOrders - Resulting split orders
   * @param {string} splitType - Type of split
   * @param {Object} options - Split options
   */
  recordSplit(originalOrderId, splitOrders, splitType, options) {
    const splitId = `split_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.splitHistory.set(splitId, {
      id: splitId,
      originalOrderId,
      splitOrderIds: splitOrders.map(o => o.id),
      splitType,
      options,
      splitAt: now()
    });
  }

  /**
   * Get split history
   * @returns {Array} Array of split records
   */
  getSplitHistory() {
    return Array.from(this.splitHistory.values());
  }

  /**
   * Get split history by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of split records
   */
  getSplitHistoryByOrder(orderId) {
    return this.getSplitHistory().filter(record => 
      record.originalOrderId === orderId || 
      record.splitOrderIds.includes(orderId)
    );
  }
}

// Singleton instance
let splitManagerInstance = null;

/**
 * Get the order split manager singleton
 * @returns {OrderSplitManager} Split manager instance
 */
export function getOrderSplitManager() {
  if (!splitManagerInstance) {
    splitManagerInstance = new OrderSplitManager();
  }
  return splitManagerInstance;
}

/**
 * Reset the split manager (useful for testing)
 */
export function resetOrderSplitManager() {
  splitManagerInstance = null;
}

/**
 * Convenience function to split an order
 * @param {Order} order - Order to split
 * @param {string} splitType - Type of split
 * @param {Object} options - Split options
 * @returns {Object} Split result
 */
export function splitOrder(order, splitType, options = {}) {
  const manager = getOrderSplitManager();
  return manager.splitOrder(order, splitType, options);
}
