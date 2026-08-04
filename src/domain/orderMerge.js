// Order Smart Merge
// Merges held orders, table orders, and customer orders intelligently

import { normalizeOrder, createOrder, calculateSubtotal, calculateOrderTotals } from './orderModel.js';
import { now } from './dates.js';

/**
 * Merge Strategy Types
 */
export const MERGE_STRATEGIES = {
  COMBINE: 'COMBINE',           // Combine all items
  REPLACE: 'REPLACE',           // Replace target with source
  APPEND: 'APPEND',             // Append source items to target
  INTERSECT: 'INTERSECT',       // Keep only common items
  UNION: 'UNION'                // Union of both (deduplicate)
};

/**
 * Conflict Resolution Types
 */
export const CONFLICT_RESOLUTION = {
  KEEP_SOURCE: 'KEEP_SOURCE',   // Use source value
  KEEP_TARGET: 'KEEP_TARGET',   // Use target value
  USE_LATEST: 'USE_LATEST',     // Use most recently modified
  USE_HIGHER_QTY: 'USE_HIGHER_QTY', // Use higher quantity
  USE_LOWER_PRICE: 'USE_LOWER_PRICE', // Use lower price
  MANUAL: 'MANUAL'              // Require manual resolution
};

/**
 * Order Merge Manager class
 * Manages intelligent order merging
 */
export class OrderMergeManager {
  constructor() {
    this.mergeHistory = new Map();
  }

  /**
   * Merge two orders
   * @param {Order} targetOrder - Target order (base)
   * @param {Order} sourceOrder - Source order (to merge in)
   * @param {Object} options - Merge options
   * @returns {Object} Merge result
   */
  mergeOrders(targetOrder, sourceOrder, options = {}) {
    const strategy = options.strategy || MERGE_STRATEGIES.COMBINE;
    const conflictResolution = options.conflictResolution || CONFLICT_RESOLUTION.USE_LATEST;
    const mergeMetadata = options.metadata || {};

    // Validate orders
    const target = normalizeOrder(targetOrder);
    const source = normalizeOrder(sourceOrder);

    if (!target || !source) {
      return {
        success: false,
        reason: 'Invalid orders provided'
      };
    }

    // Detect conflicts
    const conflicts = this.detectConflicts(target, source);

    // Apply merge strategy
    let mergedOrder;
    switch (strategy) {
      case MERGE_STRATEGIES.COMBINE:
        mergedOrder = this.combineOrders(target, source, conflictResolution);
        break;
      case MERGE_STRATEGIES.REPLACE:
        mergedOrder = { ...source, id: target.id };
        break;
      case MERGE_STRATEGIES.APPEND:
        mergedOrder = this.appendOrders(target, source, conflictResolution);
        break;
      case MERGE_STRATEGIES.INTERSECT:
        mergedOrder = this.intersectOrders(target, source, conflictResolution);
        break;
      case MERGE_STRATEGIES.UNION:
        mergedOrder = this.unionOrders(target, source, conflictResolution);
        break;
      default:
        return {
          success: false,
          reason: `Unknown merge strategy: ${strategy}`
        };
    }

    // Update metadata
    mergedOrder.mergeMetadata = {
      mergedAt: now(),
      mergedFrom: [target.id, source.id],
      strategy,
      conflictResolution,
      conflicts: conflicts.length,
      ...mergeMetadata
    };

    // Recalculate totals
    const subtotal = calculateSubtotal(mergedOrder.items);
    const taxRate = target.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);
    
    mergedOrder.subtotal = subtotal;
    mergedOrder.discountAmount = discountAmount;
    mergedOrder.taxAmount = taxAmount;
    mergedOrder.total = total;
    mergedOrder.updatedAt = now();

    // Record merge history
    this.recordMerge(target.id, source.id, mergedOrder, strategy, conflicts);

    return {
      success: true,
      mergedOrder,
      conflicts,
      strategy,
      conflictResolution
    };
  }

  /**
   * Detect conflicts between two orders
   * @param {Order} target - Target order
   * @param {Order} source - Source order
   * @returns {Array} Array of conflicts
   */
  detectConflicts(target, source) {
    const conflicts = [];

    // Item conflicts (same menuItemId but different attributes)
    const targetItems = new Map(target.items.map(item => [item.menuItemId, item]));
    const sourceItems = new Map(source.items.map(item => [item.menuItemId, item]));

    for (const [menuItemId, sourceItem] of sourceItems) {
      const targetItem = targetItems.get(menuItemId);
      
      if (targetItem) {
        // Same item exists in both - check for conflicts
        if (targetItem.price !== sourceItem.price) {
          conflicts.push({
            type: 'PRICE_CONFLICT',
            menuItemId,
            menuItemName: sourceItem.name,
            targetPrice: targetItem.price,
            sourcePrice: sourceItem.price
          });
        }

        if (targetItem.modifiers?.join(',') !== sourceItem.modifiers?.join(',')) {
          conflicts.push({
            type: 'MODIFIER_CONFLICT',
            menuItemId,
            menuItemName: sourceItem.name,
            targetModifiers: targetItem.modifiers,
            sourceModifiers: sourceItem.modifiers
          });
        }
      }
    }

    // Customer conflicts
    if (target.customerId && source.customerId && target.customerId !== source.customerId) {
      conflicts.push({
        type: 'CUSTOMER_CONFLICT',
        targetCustomerId: target.customerId,
        sourceCustomerId: source.customerId
      });
    }

    // Table conflicts
    if (target.tableId && source.tableId && target.tableId !== source.tableId) {
      conflicts.push({
        type: 'TABLE_CONFLICT',
        targetTableId: target.tableId,
        sourceTableId: source.tableId
      });
    }

    // Discount conflicts
    if (target.discountCode && source.discountCode && target.discountCode !== source.discountCode) {
      conflicts.push({
        type: 'DISCOUNT_CONFLICT',
        targetDiscount: target.discountCode,
        sourceDiscount: source.discountCode
      });
    }

    return conflicts;
  }

  /**
   * Combine orders (merge all items, resolve conflicts)
   * @param {Order} target - Target order
   * @param {Order} source - Source order
   * @param {string} conflictResolution - Conflict resolution strategy
   * @returns {Order} Merged order
   */
  combineOrders(target, source, conflictResolution) {
    const mergedItems = [...target.items];
    const targetItemsMap = new Map(target.items.map(item => [item.menuItemId, item]));

    for (const sourceItem of source.items) {
      const existingItem = targetItemsMap.get(sourceItem.menuItemId);

      if (existingItem) {
        // Resolve conflict based on strategy
        const resolvedItem = this.resolveItemConflict(existingItem, sourceItem, conflictResolution);
        const index = mergedItems.findIndex(item => item.menuItemId === sourceItem.menuItemId);
        if (index !== -1) {
          mergedItems[index] = resolvedItem;
        }
      } else {
        mergedItems.push({ ...sourceItem });
      }
    }

    return {
      ...target,
      items: mergedItems,
      customerName: this.resolveStringConflict(target.customerName, source.customerName, conflictResolution),
      customerId: this.resolveStringConflict(target.customerId, source.customerId, conflictResolution),
      tableId: this.resolveStringConflict(target.tableId, source.tableId, conflictResolution),
      notes: this.resolveNotesConflict(target.notes, source.notes, conflictResolution)
    };
  }

  /**
   * Append source items to target
   * @param {Order} target - Target order
   * @param {Order} source - Source order
   * @param {string} conflictResolution - Conflict resolution strategy
   * @returns {Order} Merged order
   */
  appendOrders(target, source, conflictResolution) {
    const targetItemsMap = new Map(target.items.map(item => [item.menuItemId, item]));
    const newItems = [];

    for (const sourceItem of source.items) {
      const existingItem = targetItemsMap.get(sourceItem.menuItemId);

      if (existingItem) {
        // Add quantity instead of duplicating
        const resolvedItem = this.resolveItemConflict(existingItem, sourceItem, CONFLICT_RESOLUTION.USE_HIGHER_QTY);
        const index = target.items.findIndex(item => item.menuItemId === sourceItem.menuItemId);
        if (index !== -1) {
          target.items[index] = resolvedItem;
        }
      } else {
        newItems.push({ ...sourceItem });
      }
    }

    return {
      ...target,
      items: [...target.items, ...newItems]
    };
  }

  /**
   * Intersect orders (keep only common items)
   * @param {Order} target - Target order
   * @param {Order} source - Source order
   * @param {string} conflictResolution - Conflict resolution strategy
   * @returns {Order} Merged order
   */
  intersectOrders(target, source, conflictResolution) {
    const targetItemsMap = new Map(target.items.map(item => [item.menuItemId, item]));
    const commonItems = [];

    for (const sourceItem of source.items) {
      const existingItem = targetItemsMap.get(sourceItem.menuItemId);

      if (existingItem) {
        const resolvedItem = this.resolveItemConflict(existingItem, sourceItem, conflictResolution);
        commonItems.push(resolvedItem);
      }
    }

    return {
      ...target,
      items: commonItems
    };
  }

  /**
   * Union orders (deduplicate items)
   * @param {Order} target - Target order
   * @param {Order} source - Source order
   * @param {string} conflictResolution - Conflict resolution strategy
   * @returns {Order} Merged order
   */
  unionOrders(target, source, conflictResolution) {
    const itemMap = new Map();

    // Add target items
    for (const item of target.items) {
      itemMap.set(item.menuItemId, item);
    }

    // Add or update with source items
    for (const sourceItem of source.items) {
      const existing = itemMap.get(sourceItem.menuItemId);
      if (existing) {
        const resolved = this.resolveItemConflict(existing, sourceItem, conflictResolution);
        itemMap.set(sourceItem.menuItemId, resolved);
      } else {
        itemMap.set(sourceItem.menuItemId, sourceItem);
      }
    }

    return {
      ...target,
      items: Array.from(itemMap.values())
    };
  }

  /**
   * Resolve item conflict based on strategy
   * @param {Object} targetItem - Target item
   * @param {Object} sourceItem - Source item
   * @param {string} resolution - Resolution strategy
   * @returns {Object} Resolved item
   */
  resolveItemConflict(targetItem, sourceItem, resolution) {
    switch (resolution) {
      case CONFLICT_RESOLUTION.KEEP_SOURCE:
        return { ...sourceItem, qty: targetItem.qty + sourceItem.qty };
      
      case CONFLICT_RESOLUTION.KEEP_TARGET:
        return { ...targetItem };
      
      case CONFLICT_RESOLUTION.USE_LATEST:
        const latest = targetItem.updatedAt > sourceItem.updatedAt ? targetItem : sourceItem;
        return { ...latest, qty: targetItem.qty + sourceItem.qty };
      
      case CONFLICT_RESOLUTION.USE_HIGHER_QTY:
        return {
          ...targetItem,
          qty: Math.max(targetItem.qty, sourceItem.qty)
        };
      
      case CONFLICT_RESOLUTION.USE_LOWER_PRICE:
        return {
          ...targetItem,
          price: Math.min(targetItem.price, sourceItem.price),
          qty: targetItem.qty + sourceItem.qty
        };
      
      default:
        return { ...targetItem, qty: targetItem.qty + sourceItem.qty };
    }
  }

  /**
   * Resolve string conflict
   * @param {string} targetValue - Target value
   * @param {string} sourceValue - Source value
   * @param {string} resolution - Resolution strategy
   * @returns {string} Resolved value
   */
  resolveStringConflict(targetValue, sourceValue, resolution) {
    if (!targetValue) return sourceValue;
    if (!sourceValue) return targetValue;
    if (targetValue === sourceValue) return targetValue;

    switch (resolution) {
      case CONFLICT_RESOLUTION.KEEP_SOURCE:
        return sourceValue;
      case CONFLICT_RESOLUTION.KEEP_TARGET:
        return targetValue;
      default:
        return targetValue; // Default to target
    }
  }

  /**
   * Resolve notes conflict
   * @param {string} targetNotes - Target notes
   * @param {string} sourceNotes - Source notes
   * @param {string} resolution - Resolution strategy
   * @returns {string} Resolved notes
   */
  resolveNotesConflict(targetNotes, sourceNotes, resolution) {
    if (!targetNotes) return sourceNotes;
    if (!sourceNotes) return targetNotes;
    if (targetNotes === sourceNotes) return targetNotes;

    // Combine notes with separator
    return `${targetNotes}\n\n[Merged]: ${sourceNotes}`;
  }

  /**
   * Merge multiple orders
   * @param {Order[]} orders - Array of orders to merge
   * @param {Object} options - Merge options
   * @returns {Object} Merge result
   */
  mergeMultipleOrders(orders, options = {}) {
    if (orders.length < 2) {
      return {
        success: false,
        reason: 'At least 2 orders required for merge'
      };
    }

    let merged = orders[0];
    const allConflicts = [];

    for (let i = 1; i < orders.length; i++) {
      const result = this.mergeOrders(merged, orders[i], options);
      
      if (!result.success) {
        return result;
      }

      merged = result.mergedOrder;
      allConflicts.push(...result.conflicts);
    }

    return {
      success: true,
      mergedOrder: merged,
      conflicts: allConflicts,
      ordersMerged: orders.length
    };
  }

  /**
   * Merge orders by table
   * @param {string} tableId - Table ID
   * @param {Order[]} orders - All orders for the table
   * @param {Object} options - Merge options
   * @returns {Object} Merge result
   */
  mergeOrdersByTable(tableId, orders, options = {}) {
    const tableOrders = orders.filter(order => order.tableId === tableId);

    if (tableOrders.length < 2) {
      return {
        success: false,
        reason: 'Need at least 2 orders for the table to merge'
      };
    }

    return this.mergeMultipleOrders(tableOrders, {
      ...options,
      metadata: {
        ...options.metadata,
        mergeType: 'TABLE_MERGE',
        tableId
      }
    });
  }

  /**
   * Merge orders by customer
   * @param {string} customerId - Customer ID
   * @param {Order[]} orders - All orders for the customer
   * @param {Object} options - Merge options
   * @returns {Object} Merge result
   */
  mergeOrdersByCustomer(customerId, orders, options = {}) {
    const customerOrders = orders.filter(order => order.customerId === customerId);

    if (customerOrders.length < 2) {
      return {
        success: false,
        reason: 'Need at least 2 orders for the customer to merge'
      };
    }

    return this.mergeMultipleOrders(customerOrders, {
      ...options,
      metadata: {
        ...options.metadata,
        mergeType: 'CUSTOMER_MERGE',
        customerId
      }
    });
  }

  /**
   * Preview merge without executing
   * @param {Order} targetOrder - Target order
   * @param {Order} sourceOrder - Source order
   * @param {Object} options - Merge options
   * @returns {Object} Preview result
   */
  previewMerge(targetOrder, sourceOrder, options = {}) {
    const conflicts = this.detectConflicts(targetOrder, sourceOrder);
    const strategy = options.strategy || MERGE_STRATEGIES.COMBINE;

    // Calculate preview totals
    const previewItems = this.combineOrders(targetOrder, sourceOrder, options.conflictResolution).items;
    const subtotal = calculateSubtotal(previewItems);
    const taxRate = targetOrder.taxRate || 0.18;
    const { total } = calculateOrderTotals(subtotal, 0, taxRate);

    return {
      success: true,
      preview: {
        itemCount: previewItems.length,
        subtotal,
        total,
        conflicts: conflicts.length,
        conflictTypes: conflicts.map(c => c.type)
      },
      conflicts,
      strategy
    };
  }

  /**
   * Record merge in history
   * @param {string} targetId - Target order ID
   * @param {string} sourceId - Source order ID
   * @param {Order} mergedOrder - Merged order
   * @param {string} strategy - Merge strategy used
   * @param {Array} conflicts - Conflicts detected
   */
  recordMerge(targetId, sourceId, mergedOrder, strategy, conflicts) {
    const mergeId = `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.mergeHistory.set(mergeId, {
      id: mergeId,
      targetId,
      sourceId,
      mergedOrderId: mergedOrder.id,
      strategy,
      conflictCount: conflicts.length,
      conflicts,
      mergedAt: now()
    });
  }

  /**
   * Get merge history
   * @returns {Array} Array of merge records
   */
  getMergeHistory() {
    return Array.from(this.mergeHistory.values());
  }

  /**
   * Get merge history by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of merge records
   */
  getMergeHistoryByOrder(orderId) {
    return this.getMergeHistory().filter(record => 
      record.targetId === orderId || 
      record.sourceId === orderId || 
      record.mergedOrderId === orderId
    );
  }

  /**
   * Undo merge (create separate orders from merged order)
   * @param {Order} mergedOrder - Merged order
   * @param {string} originalTargetId - Original target order ID
   * @param {string} originalSourceId - Original source order ID
   * @returns {Object} Undo result
   */
  undoMerge(mergedOrder, originalTargetId, originalSourceId) {
    // This would require storing the original orders before merge
    // For now, return a placeholder
    return {
      success: false,
      reason: 'Undo merge requires storing original orders before merge'
    };
  }
}

// Singleton instance
let mergeManagerInstance = null;

/**
 * Get the order merge manager singleton
 * @returns {OrderMergeManager} Merge manager instance
 */
export function getOrderMergeManager() {
  if (!mergeManagerInstance) {
    mergeManagerInstance = new OrderMergeManager();
  }
  return mergeManagerInstance;
}

/**
 * Reset the merge manager (useful for testing)
 */
export function resetOrderMergeManager() {
  mergeManagerInstance = null;
}

/**
 * Convenience function to merge two orders
 * @param {Order} targetOrder - Target order
 * @param {Order} sourceOrder - Source order
 * @param {Object} options - Merge options
 * @returns {Object} Merge result
 */
export function mergeOrders(targetOrder, sourceOrder, options = {}) {
  const manager = getOrderMergeManager();
  return manager.mergeOrders(targetOrder, sourceOrder, options);
}
