// Order Duplicate Functionality
// Duplicates entire or partial orders, previous customer orders, favorites, templates

import { normalizeOrder, createOrder, calculateSubtotal, calculateOrderTotals } from './orderModel.js';
import { now } from './dates.js';

/**
 * Duplicate Types
 */
export const DUPLICATE_TYPES = {
  FULL: 'FULL',                   // Duplicate entire order
  PARTIAL: 'PARTIAL',             // Duplicate selected items
  FROM_TEMPLATE: 'FROM_TEMPLATE', // Duplicate from template
  FROM_FAVORITE: 'FROM_FAVORITE', // Duplicate from favorite
  FROM_PREVIOUS: 'FROM_PREVIOUS'  // Duplicate from previous customer order
};

/**
 * Order Duplicate Manager class
 * Manages order duplication operations
 */
export class OrderDuplicateManager {
  constructor() {
    this.templates = new Map();
    this.favorites = new Map();
    this.duplicateHistory = new Map();
    this.loadTemplates();
    this.loadFavorites();
  }

  /**
   * Load templates from localStorage
   */
  loadTemplates() {
    try {
      const stored = localStorage.getItem('cafeos_order_templates');
      if (stored) {
        const templates = JSON.parse(stored);
        templates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }
    } catch (error) {
      console.error('[OrderDuplicateManager] Failed to load templates:', error);
    }
  }

  /**
   * Save templates to localStorage
   */
  saveTemplates() {
    try {
      const templates = Array.from(this.templates.values());
      localStorage.setItem('cafeos_order_templates', JSON.stringify(templates));
    } catch (error) {
      console.error('[OrderDuplicateManager] Failed to save templates:', error);
    }
  }

  /**
   * Load favorites from localStorage
   */
  loadFavorites() {
    try {
      const stored = localStorage.getItem('cafeos_order_favorites');
      if (stored) {
        const favorites = JSON.parse(stored);
        favorites.forEach(favorite => {
          this.favorites.set(favorite.id, favorite);
        });
      }
    } catch (error) {
      console.error('[OrderDuplicateManager] Failed to load favorites:', error);
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveFavorites() {
    try {
      const favorites = Array.from(this.favorites.values());
      localStorage.setItem('cafeos_order_favorites', JSON.stringify(favorites));
    } catch (error) {
      console.error('[OrderDuplicateManager] Failed to save favorites:', error);
    }
  }

  /**
   * Duplicate an order
   * @param {Order} sourceOrder - Source order to duplicate
   * @param {Object} options - Duplicate options
   * @returns {Object} Duplicate result
   */
  duplicateOrder(sourceOrder, options = {}) {
    const normalizedSource = normalizeOrder(sourceOrder);
    if (!normalizedSource) {
      return {
        success: false,
        reason: 'Invalid source order'
      };
    }

    const duplicateType = options.type || DUPLICATE_TYPES.FULL;
    const itemIds = options.itemIds || null;
    const preserveCustomer = options.preserveCustomer !== false; // Default true
    const preserveTable = options.preserveTable !== false; // Default true
    const preserveDiscounts = options.preserveDiscounts !== false; // Default true

    let items;

    if (duplicateType === DUPLICATE_TYPES.PARTIAL && itemIds) {
      // Duplicate only selected items
      items = normalizedSource.items.filter(item => itemIds.includes(item.id));
    } else {
      // Duplicate all items
      items = normalizedSource.items.map(item => ({ ...item }));
    }

    // Recalculate totals
    const subtotal = calculateSubtotal(items);
    const taxRate = normalizedSource.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(
      subtotal,
      preserveDiscounts ? (normalizedSource.discountAmount || 0) : 0,
      taxRate
    );

    // Create duplicated order
    const duplicatedOrder = createOrder({
      ...normalizedSource,
      id: undefined,
      items,
      customerId: preserveCustomer ? normalizedSource.customerId : null,
      customerName: preserveCustomer ? normalizedSource.customerName : null,
      tableId: preserveTable ? normalizedSource.tableId : null,
      discountCode: preserveDiscounts ? normalizedSource.discountCode : null,
      discountAmount: preserveDiscounts ? discountAmount : 0,
      subtotal,
      taxAmount,
      total,
      duplicatedFrom: normalizedSource.id,
      duplicateType,
      duplicatedAt: now()
    });

    // Record duplicate history
    this.recordDuplicate(normalizedSource.id, duplicatedOrder.id, duplicateType, options);

    return {
      success: true,
      duplicatedOrder,
      duplicateType
    };
  }

  /**
   * Duplicate from template
   * @param {string} templateId - Template ID
   * @param {Object} options - Duplicate options
   * @returns {Object} Duplicate result
   */
  duplicateFromTemplate(templateId, options = {}) {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        success: false,
        reason: 'Template not found'
      };
    }

    // Create order from template
    const items = template.items.map(item => ({ ...item }));
    const subtotal = calculateSubtotal(items);
    const taxRate = options.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    const order = createOrder({
      ...options,
      items,
      subtotal,
      taxAmount,
      total,
      discountAmount,
      duplicatedFrom: templateId,
      duplicateType: DUPLICATE_TYPES.FROM_TEMPLATE,
      duplicatedAt: now()
    });

    return {
      success: true,
      duplicatedOrder: order,
      template
    };
  }

  /**
   * Duplicate from favorite
   * @param {string} favoriteId - Favorite ID
   * @param {Object} options - Duplicate options
   * @returns {Object} Duplicate result
   */
  duplicateFromFavorite(favoriteId, options = {}) {
    const favorite = this.favorites.get(favoriteId);
    if (!favorite) {
      return {
        success: false,
        reason: 'Favorite not found'
      };
    }

    // Create order from favorite
    const items = favorite.items.map(item => ({ ...item }));
    const subtotal = calculateSubtotal(items);
    const taxRate = options.taxRate || 0.18;
    const { discountAmount, taxAmount, total } = calculateOrderTotals(subtotal, 0, taxRate);

    const order = createOrder({
      ...options,
      items,
      subtotal,
      taxAmount,
      total,
      discountAmount,
      duplicatedFrom: favoriteId,
      duplicateType: DUPLICATE_TYPES.FROM_FAVORITE,
      duplicatedAt: now()
    });

    return {
      success: true,
      duplicatedOrder: order,
      favorite
    };
  }

  /**
   * Duplicate from previous customer order
   * @param {string} customerId - Customer ID
   * @param {Order[]} previousOrders - Array of customer's previous orders
   * @param {string} orderId - Specific order ID to duplicate (optional)
   * @param {Object} options - Duplicate options
   * @returns {Object} Duplicate result
   */
  duplicateFromPrevious(customerId, previousOrders, orderId = null, options = {}) {
    const customerOrders = previousOrders.filter(order => order.customerId === customerId);

    if (customerOrders.length === 0) {
      return {
        success: false,
        reason: 'No previous orders found for customer'
      };
    }

    let sourceOrder;

    if (orderId) {
      sourceOrder = customerOrders.find(order => order.id === orderId);
      if (!sourceOrder) {
        return {
          success: false,
          reason: 'Specified order not found for customer'
        };
      }
    } else {
      // Use most recent order
      sourceOrder = customerOrders.sort((a, b) => 
        (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
      )[0];
    }

    // Duplicate the order
    const result = this.duplicateOrder(sourceOrder, {
      ...options,
      type: DUPLICATE_TYPES.FROM_PREVIOUS,
      preserveCustomer: true
    });

    if (result.success) {
      result.duplicatedOrder.duplicateType = DUPLICATE_TYPES.FROM_PREVIOUS;
      result.sourceOrder = sourceOrder;
    }

    return result;
  }

  /**
   * Create a template from an order
   * @param {Order} order - Order to create template from
   * @param {Object} templateData - Template metadata
   * @returns {Object} Template creation result
   */
  createTemplate(order, templateData = {}) {
    const normalizedOrder = normalizeOrder(order);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid order'
      };
    }

    const template = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateData.name || 'Untitled Template',
      description: templateData.description || '',
      items: normalizedOrder.items.map(item => ({ ...item })),
      category: templateData.category || 'GENERAL',
      createdBy: templateData.createdBy || null,
      createdAt: now(),
      sourceOrderId: normalizedOrder.id,
      isPublic: templateData.isPublic !== false // Default true
    };

    this.templates.set(template.id, template);
    this.saveTemplates();

    return {
      success: true,
      template
    };
  }

  /**
   * Create a favorite from an order
   * @param {Order} order - Order to create favorite from
   * @param {Object} favoriteData - Favorite metadata
   * @returns {Object} Favorite creation result
   */
  createFavorite(order, favoriteData = {}) {
    const normalizedOrder = normalizeOrder(order);
    if (!normalizedOrder) {
      return {
        success: false,
        reason: 'Invalid order'
      };
    }

    const favorite = {
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: favoriteData.name || 'Untitled Favorite',
      description: favoriteData.description || '',
      items: normalizedOrder.items.map(item => ({ ...item })),
      customerId: favoriteData.customerId || normalizedOrder.customerId || null,
      customerName: favoriteData.customerName || normalizedOrder.customerName || null,
      createdBy: favoriteData.createdBy || null,
      createdAt: now(),
      sourceOrderId: normalizedOrder.id
    };

    this.favorites.set(favorite.id, favorite);
    this.saveFavorites();

    return {
      success: true,
      favorite
    };
  }

  /**
   * Get all templates
   * @returns {Array} Array of templates
   */
  getTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} Template or null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Get templates by category
   * @param {string} category - Category
   * @returns {Array} Array of templates
   */
  getTemplatesByCategory(category) {
    return this.getTemplates().filter(template => template.category === category);
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteTemplate(templateId) {
    const deleted = this.templates.delete(templateId);
    if (deleted) {
      this.saveTemplates();
    }
    return deleted;
  }

  /**
   * Get all favorites
   * @returns {Array} Array of favorites
   */
  getFavorites() {
    return Array.from(this.favorites.values());
  }

  /**
   * Get favorite by ID
   * @param {string} favoriteId - Favorite ID
   * @returns {Object|null} Favorite or null
   */
  getFavorite(favoriteId) {
    return this.favorites.get(favoriteId) || null;
  }

  /**
   * Get favorites by customer
   * @param {string} customerId - Customer ID
   * @returns {Array} Array of favorites
   */
  getFavoritesByCustomer(customerId) {
    return this.getFavorites().filter(favorite => favorite.customerId === customerId);
  }

  /**
   * Delete favorite
   * @param {string} favoriteId - Favorite ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteFavorite(favoriteId) {
    const deleted = this.favorites.delete(favoriteId);
    if (deleted) {
      this.saveFavorites();
    }
    return deleted;
  }

  /**
   * Record duplicate in history
   * @param {string} sourceId - Source order ID
   * @param {string} duplicatedId - Duplicated order ID
   * @param {string} duplicateType - Type of duplicate
   * @param {Object} options - Duplicate options
   */
  recordDuplicate(sourceId, duplicatedId, duplicateType, options) {
    const duplicateId = `dup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.duplicateHistory.set(duplicateId, {
      id: duplicateId,
      sourceId,
      duplicatedId,
      duplicateType,
      options,
      duplicatedAt: now()
    });
  }

  /**
   * Get duplicate history
   * @returns {Array} Array of duplicate records
   */
  getDuplicateHistory() {
    return Array.from(this.duplicateHistory.values());
  }

  /**
   * Get duplicate history by order
   * @param {string} orderId - Order ID
   * @returns {Array} Array of duplicate records
   */
  getDuplicateHistoryByOrder(orderId) {
    return this.getDuplicateHistory().filter(record => 
      record.sourceId === orderId || record.duplicatedId === orderId
    );
  }

  /**
   * Get duplicate statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const duplicates = this.getDuplicateHistory();

    return {
      totalDuplicates: duplicates.length,
      byType: duplicates.reduce((acc, dup) => {
        acc[dup.duplicateType] = (acc[dup.duplicateType] || 0) + 1;
        return acc;
      }, {}),
      totalTemplates: this.templates.size,
      totalFavorites: this.favorites.size,
      templatesByCategory: this.getTemplates().reduce((acc, tpl) => {
        acc[tpl.category] = (acc[tpl.category] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Export templates
   * @returns {Object} Exported templates
   */
  exportTemplates() {
    return {
      templates: Array.from(this.templates.values()),
      exportedAt: now()
    };
  }

  /**
   * Import templates
   * @param {Object} data - Imported templates data
   * @returns {Object} Import result
   */
  importTemplates(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.templates)) {
        data.templates.forEach(template => {
          this.templates.set(template.id, template);
        });
      }

      this.saveTemplates();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Export favorites
   * @returns {Object} Exported favorites
   */
  exportFavorites() {
    return {
      favorites: Array.from(this.favorites.values()),
      exportedAt: now()
    };
  }

  /**
   * Import favorites
   * @param {Object} data - Imported favorites data
   * @returns {Object} Import result
   */
  importFavorites(data) {
    if (!data || typeof data !== 'object') {
      return { success: false, reason: 'Invalid data' };
    }

    try {
      if (Array.isArray(data.favorites)) {
        data.favorites.forEach(favorite => {
          this.favorites.set(favorite.id, favorite);
        });
      }

      this.saveFavorites();
      return { success: true };
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }
}

// Singleton instance
let duplicateManagerInstance = null;

/**
 * Get the order duplicate manager singleton
 * @returns {OrderDuplicateManager} Duplicate manager instance
 */
export function getOrderDuplicateManager() {
  if (!duplicateManagerInstance) {
    duplicateManagerInstance = new OrderDuplicateManager();
  }
  return duplicateManagerInstance;
}

/**
 * Reset the duplicate manager (useful for testing)
 */
export function resetOrderDuplicateManager() {
  duplicateManagerInstance = null;
}

/**
 * Convenience function to duplicate an order
 * @param {Order} sourceOrder - Source order to duplicate
 * @param {Object} options - Duplicate options
 * @returns {Object} Duplicate result
 */
export function duplicateOrder(sourceOrder, options = {}) {
  const manager = getOrderDuplicateManager();
  return manager.duplicateOrder(sourceOrder, options);
}
