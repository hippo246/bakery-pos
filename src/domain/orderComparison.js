// Order Comparison
// Compares order versions for revision tracking

import { normalizeOrder } from './orderModel.js';

/**
 * Change Types
 */
export const CHANGE_TYPES = {
  ADDED: 'ADDED',           // Item added
  REMOVED: 'REMOVED',       // Item removed
  MODIFIED: 'MODIFIED',     // Item modified
  QUANTITY_CHANGED: 'QUANTITY_CHANGED',
  PRICE_CHANGED: 'PRICE_CHANGED',
  MODIFIER_CHANGED: 'MODIFIER_CHANGED',
  METADATA_CHANGED: 'METADATA_CHANGED'
};

/**
 * Order Comparison Manager class
 * Compares order versions for revision tracking
 */
export class OrderComparisonManager {
  constructor() {
    this.comparisonHistory = new Map();
  }

  /**
   * Compare two order versions
   * @param {Order} orderA - First order (original)
   * @param {Order} orderB - Second order (modified)
   * @param {Object} options - Comparison options
   * @returns {Object} Comparison result
   */
  compareOrders(orderA, orderB, options = {}) {
    const normalizedA = normalizeOrder(orderA);
    const normalizedB = normalizeOrder(orderB);

    if (!normalizedA || !normalizedB) {
      return {
        success: false,
        reason: 'Invalid orders provided'
      };
    }

    const changes = [];

    // Compare items
    const itemChanges = this.compareItems(normalizedA, normalizedB, options);
    changes.push(...itemChanges);

    // Compare metadata
    const metadataChanges = this.compareMetadata(normalizedA, normalizedB);
    changes.push(...metadataChanges);

    // Compare totals
    const totalChanges = this.compareTotals(normalizedA, normalizedB);
    changes.push(...totalChanges);

    // Calculate summary
    const summary = this.calculateSummary(changes);

    const comparison = {
      id: `cmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderAId: normalizedA.id,
      orderBId: normalizedB.id,
      orderATimestamp: normalizedA.updatedAt || normalizedA.createdAt,
      orderBTimestamp: normalizedB.updatedAt || normalizedB.createdAt,
      changes,
      summary,
      comparedAt: Date.now()
    };

    // Record comparison
    this.comparisonHistory.set(comparison.id, comparison);

    return {
      success: true,
      comparison
    };
  }

  /**
   * Compare items between two orders
   * @param {Order} orderA - First order
   * @param {Order} orderB - Second order
   * @param {Object} options - Comparison options
   * @returns {Array} Array of item changes
   */
  compareItems(orderA, orderB, options = {}) {
    const changes = [];
    const itemsA = new Map(orderA.items.map(item => [item.id, item]));
    const itemsB = new Map(orderB.items.map(item => [item.id, item]));

    // Check for added items (in B but not in A)
    for (const [itemId, itemB] of itemsB) {
      if (!itemsA.has(itemId)) {
        changes.push({
          type: CHANGE_TYPES.ADDED,
          category: 'ITEM',
          itemId,
          menuItemId: itemB.menuItemId,
          menuItemName: itemB.name,
          quantity: itemB.qty,
          price: itemB.price,
          total: itemB.price * itemB.qty,
          modifiers: itemB.modifiers
        });
      }
    }

    // Check for removed items (in A but not in B)
    for (const [itemId, itemA] of itemsA) {
      if (!itemsB.has(itemId)) {
        changes.push({
          type: CHANGE_TYPES.REMOVED,
          category: 'ITEM',
          itemId,
          menuItemId: itemA.menuItemId,
          menuItemName: itemA.name,
          quantity: itemA.qty,
          price: itemA.price,
          total: itemA.price * itemA.qty,
          modifiers: itemA.modifiers
        });
      }
    }

    // Check for modified items (in both but different)
    for (const [itemId, itemA] of itemsA) {
      const itemB = itemsB.get(itemId);
      if (itemB) {
        const itemChanges = this.compareItemDetails(itemA, itemB);
        changes.push(...itemChanges);
      }
    }

    return changes;
  }

  /**
   * Compare item details
   * @param {Object} itemA - First item
   * @param {Object} itemB - Second item
   * @returns {Array} Array of item changes
   */
  compareItemDetails(itemA, itemB) {
    const changes = [];

    // Compare quantity
    if (itemA.qty !== itemB.qty) {
      changes.push({
        type: CHANGE_TYPES.QUANTITY_CHANGED,
        category: 'ITEM',
        itemId: itemA.id,
        menuItemId: itemA.menuItemId,
        menuItemName: itemA.name,
        oldQuantity: itemA.qty,
        newQuantity: itemB.qty,
        oldTotal: itemA.price * itemA.qty,
        newTotal: itemB.price * itemB.qty
      });
    }

    // Compare price
    if (itemA.price !== itemB.price) {
      changes.push({
        type: CHANGE_TYPES.PRICE_CHANGED,
        category: 'ITEM',
        itemId: itemA.id,
        menuItemId: itemA.menuItemId,
        menuItemName: itemA.name,
        oldPrice: itemA.price,
        newPrice: itemB.price,
        oldTotal: itemA.price * itemA.qty,
        newTotal: itemB.price * itemB.qty
      });
    }

    // Compare modifiers
    const modifiersA = itemA.modifiers || [];
    const modifiersB = itemB.modifiers || [];

    if (modifiersA.join(',') !== modifiersB.join(',')) {
      changes.push({
        type: CHANGE_TYPES.MODIFIER_CHANGED,
        category: 'ITEM',
        itemId: itemA.id,
        menuItemId: itemA.menuItemId,
        menuItemName: itemA.name,
        oldModifiers: modifiersA,
        newModifiers: modifiersB
      });
    }

    return changes;
  }

  /**
   * Compare metadata between two orders
   * @param {Order} orderA - First order
   * @param {Order} orderB - Second order
   * @returns {Array} Array of metadata changes
   */
  compareMetadata(orderA, orderB) {
    const changes = [];

    // Compare customer
    if (orderA.customerId !== orderB.customerId) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'CUSTOMER',
        field: 'customerId',
        oldValue: orderA.customerId,
        newValue: orderB.customerId
      });
    }

    if (orderA.customerName !== orderB.customerName) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'CUSTOMER',
        field: 'customerName',
        oldValue: orderA.customerName,
        newValue: orderB.customerName
      });
    }

    // Compare table
    if (orderA.tableId !== orderB.tableId) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'TABLE',
        field: 'tableId',
        oldValue: orderA.tableId,
        newValue: orderB.tableId
      });
    }

    // Compare notes
    if (orderA.notes !== orderB.notes) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'NOTES',
        field: 'notes',
        oldValue: orderA.notes,
        newValue: orderB.notes
      });
    }

    // Compare discount
    if (orderA.discountCode !== orderB.discountCode) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'DISCOUNT',
        field: 'discountCode',
        oldValue: orderA.discountCode,
        newValue: orderB.discountCode
      });
    }

    // Compare source
    if (orderA.source !== orderB.source) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'SOURCE',
        field: 'source',
        oldValue: orderA.source,
        newValue: orderB.source
      });
    }

    return changes;
  }

  /**
   * Compare totals between two orders
   * @param {Order} orderA - First order
   * @param {Order} orderB - Second order
   * @returns {Array} Array of total changes
   */
  compareTotals(orderA, orderB) {
    const changes = [];

    // Compare subtotal
    if (orderA.subtotal !== orderB.subtotal) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'TOTALS',
        field: 'subtotal',
        oldValue: orderA.subtotal,
        newValue: orderB.subtotal,
        difference: orderB.subtotal - orderA.subtotal
      });
    }

    // Compare tax
    if (orderA.taxAmount !== orderB.taxAmount) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'TOTALS',
        field: 'taxAmount',
        oldValue: orderA.taxAmount,
        newValue: orderB.taxAmount,
        difference: orderB.taxAmount - orderA.taxAmount
      });
    }

    // Compare discount
    if (orderA.discountAmount !== orderB.discountAmount) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'TOTALS',
        field: 'discountAmount',
        oldValue: orderA.discountAmount,
        newValue: orderB.discountAmount,
        difference: orderB.discountAmount - orderA.discountAmount
      });
    }

    // Compare total
    if (orderA.total !== orderB.total) {
      changes.push({
        type: CHANGE_TYPES.METADATA_CHANGED,
        category: 'TOTALS',
        field: 'total',
        oldValue: orderA.total,
        newValue: orderB.total,
        difference: orderB.total - orderA.total
      });
    }

    return changes;
  }

  /**
   * Calculate summary of changes
   * @param {Array} changes - Array of changes
   * @returns {Object} Summary object
   */
  calculateSummary(changes) {
    const summary = {
      totalChanges: changes.length,
      byType: {},
      byCategory: {},
      itemsAdded: 0,
      itemsRemoved: 0,
      itemsModified: 0,
      totalDifference: 0
    };

    changes.forEach(change => {
      // Count by type
      summary.byType[change.type] = (summary.byType[change.type] || 0) + 1;

      // Count by category
      summary.byCategory[change.category] = (summary.byCategory[change.category] || 0) + 1;

      // Count specific item changes
      if (change.category === 'ITEM') {
        if (change.type === CHANGE_TYPES.ADDED) summary.itemsAdded++;
        if (change.type === CHANGE_TYPES.REMOVED) summary.itemsRemoved++;
        if (change.type === CHANGE_TYPES.MODIFIED || 
            change.type === CHANGE_TYPES.QUANTITY_CHANGED ||
            change.type === CHANGE_TYPES.PRICE_CHANGED ||
            change.type === CHANGE_TYPES.MODIFIER_CHANGED) {
          summary.itemsModified++;
        }
      }

      // Calculate total difference
      if (change.difference !== undefined) {
        summary.totalDifference += change.difference;
      }
    });

    return summary;
  }

  /**
   * Get human-readable change description
   * @param {Object} change - Change object
   * @returns {string} Human-readable description
   */
  getChangeDescription(change) {
    switch (change.type) {
      case CHANGE_TYPES.ADDED:
        return `Added ${change.menuItemName} (x${change.quantity}) - $${change.total.toFixed(2)}`;
      
      case CHANGE_TYPES.REMOVED:
        return `Removed ${change.menuItemName} (x${change.quantity}) - $${change.total.toFixed(2)}`;
      
      case CHANGE_TYPES.QUANTITY_CHANGED:
        return `Changed quantity of ${change.menuItemName} from ${change.oldQuantity} to ${change.newQuantity}`;
      
      case CHANGE_TYPES.PRICE_CHANGED:
        return `Changed price of ${change.menuItemName} from $${change.oldPrice.toFixed(2)} to $${change.newPrice.toFixed(2)}`;
      
      case CHANGE_TYPES.MODIFIER_CHANGED:
        return `Changed modifiers for ${change.menuItemName}`;
      
      case CHANGE_TYPES.METADATA_CHANGED:
        switch (change.category) {
          case 'CUSTOMER':
            return `Changed customer from ${change.oldValue || 'none'} to ${change.newValue || 'none'}`;
          case 'TABLE':
            return `Changed table from ${change.oldValue || 'none'} to ${change.newValue || 'none'}`;
          case 'NOTES':
            return `Changed notes`;
          case 'DISCOUNT':
            return `Changed discount from ${change.oldValue || 'none'} to ${change.newValue || 'none'}`;
          case 'TOTALS':
            if (change.field === 'total') {
              const diff = change.difference;
              const sign = diff >= 0 ? '+' : '';
              return `Total changed by ${sign}$${diff.toFixed(2)}`;
            }
            return `Changed ${change.field} from ${change.oldValue} to ${change.newValue}`;
          default:
            return `Changed ${change.field}`;
        }
      
      default:
        return `Unknown change: ${change.type}`;
    }
  }

  /**
   * Get comparison history
   * @returns {Array} Array of comparisons
   */
  getComparisonHistory() {
    return Array.from(this.comparisonHistory.values());
  }

  /**
   * Get comparison by ID
   * @param {string} comparisonId - Comparison ID
   * @returns {Object|null} Comparison or null
   */
  getComparison(comparisonId) {
    return this.comparisonHistory.get(comparisonId) || null;
  }

  /**
   * Get comparisons by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of comparisons
   */
  getComparisonsByOrder(orderId) {
    return this.getComparisonHistory().filter(comp => 
      comp.orderAId === orderId || comp.orderBId === orderId
    );
  }

  /**
   * Export comparison as diff
   * @param {string} comparisonId - Comparison ID
   * @returns {Object} Diff object
   */
  exportComparisonAsDiff(comparisonId) {
    const comparison = this.getComparison(comparisonId);
    if (!comparison) {
      return null;
    }

    return {
      comparisonId: comparison.id,
      timestamp: comparison.comparedAt,
      orderA: comparison.orderAId,
      orderB: comparison.orderBId,
      diff: comparison.changes.map(change => ({
        type: change.type,
        category: change.category,
        description: this.getChangeDescription(change),
        ...change
      })),
      summary: comparison.summary
    };
  }

  /**
   * Get visual diff for UI
   * @param {string} comparisonId - Comparison ID
   * @returns {Object} Visual diff object
   */
  getVisualDiff(comparisonId) {
    const comparison = this.getComparison(comparisonId);
    if (!comparison) {
      return null;
    }

    const visualDiff = {
      added: [],
      removed: [],
      modified: [],
      metadata: []
    };

    comparison.changes.forEach(change => {
      if (change.category === 'ITEM') {
        if (change.type === CHANGE_TYPES.ADDED) {
          visualDiff.added.push(change);
        } else if (change.type === CHANGE_TYPES.REMOVED) {
          visualDiff.removed.push(change);
        } else {
          visualDiff.modified.push(change);
        }
      } else {
        visualDiff.metadata.push(change);
      }
    });

    return {
      comparisonId: comparison.id,
      visualDiff,
      summary: comparison.summary
    };
  }

  /**
   * Clear comparison history
   */
  clearHistory() {
    this.comparisonHistory.clear();
  }

  /**
   * Get comparison statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const comparisons = this.getComparisonHistory();
    
    return {
      totalComparisons: comparisons.length,
      uniqueOrdersCompared: new Set([
        ...comparations.map(c => c.orderAId),
        ...comparisons.map(c => c.orderBId)
      ]).size,
      averageChangesPerComparison: comparisons.length > 0
        ? comparisons.reduce((sum, c) => sum + c.summary.totalChanges, 0) / comparisons.length
        : 0,
      totalChangesDetected: comparisons.reduce((sum, c) => sum + c.summary.totalChanges, 0)
    };
  }
}

// Singleton instance
let comparisonManagerInstance = null;

/**
 * Get the order comparison manager singleton
 * @returns {OrderComparisonManager} Comparison manager instance
 */
export function getOrderComparisonManager() {
  if (!comparisonManagerInstance) {
    comparisonManagerInstance = new OrderComparisonManager();
  }
  return comparisonManagerInstance;
}

/**
 * Reset the comparison manager (useful for testing)
 */
export function resetOrderComparisonManager() {
  comparisonManagerInstance = null;
}

/**
 * Convenience function to compare two orders
 * @param {Order} orderA - First order
 * @param {Order} orderB - Second order
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison result
 */
export function compareOrders(orderA, orderB, options = {}) {
  const manager = getOrderComparisonManager();
  return manager.compareOrders(orderA, orderB, options);
}
