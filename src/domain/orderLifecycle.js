// Order Lifecycle Management
// Handles hold, resume, search, and filter operations for orders

import { normalizeOrder, holdOrder, resumeOrder, ORDER_LIFECYCLE_STATES } from './orderModel.js';
import { now } from './dates.js';

const HELD_ORDERS_KEY = 'cafeos_held_orders';
const DRAFT_ORDERS_KEY = 'cafeos_draft_orders';

/**
 * Order Lifecycle Manager class
 * Manages held orders, draft orders, and order lifecycle operations
 */
export class OrderLifecycleManager {
  constructor() {
    this.heldOrders = new Map();
    this.draftOrders = new Map();
    this.loadHeldOrders();
    this.loadDraftOrders();
  }

  /**
   * Load held orders from localStorage
   */
  loadHeldOrders() {
    try {
      const stored = localStorage.getItem(HELD_ORDERS_KEY);
      if (stored) {
        const orders = JSON.parse(stored);
        orders.forEach(order => {
          const normalized = normalizeOrder(order);
          if (normalized && normalized.lifecycleState === 'HELD') {
            this.heldOrders.set(normalized.id, normalized);
          }
        });
      }
    } catch (error) {
      console.error('[OrderLifecycleManager] Failed to load held orders:', error);
    }
  }

  /**
   * Load draft orders from localStorage
   */
  loadDraftOrders() {
    try {
      const stored = localStorage.getItem(DRAFT_ORDERS_KEY);
      if (stored) {
        const orders = JSON.parse(stored);
        orders.forEach(order => {
          const normalized = normalizeOrder(order);
          if (normalized && normalized.lifecycleState === 'DRAFT') {
            this.draftOrders.set(normalized.id, normalized);
          }
        });
      }
    } catch (error) {
      console.error('[OrderLifecycleManager] Failed to load draft orders:', error);
    }
  }

  /**
   * Save held orders to localStorage
   */
  saveHeldOrders() {
    try {
      const orders = Array.from(this.heldOrders.values());
      localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('[OrderLifecycleManager] Failed to save held orders:', error);
    }
  }

  /**
   * Save draft orders to localStorage
   */
  saveDraftOrders() {
    try {
      const orders = Array.from(this.draftOrders.values());
      localStorage.setItem(DRAFT_ORDERS_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('[OrderLifecycleManager] Failed to save draft orders:', error);
    }
  }

  /**
   * Hold an order
   * @param {Order} order - Order to hold
   * @param {string} reason - Reason for holding
   * @returns {Order} Held order
   */
  holdOrder(order, reason = null) {
    const heldOrder = holdOrder(order, reason);
    this.heldOrders.set(heldOrder.id, heldOrder);
    this.saveHeldOrders();
    return heldOrder;
  }

  /**
   * Resume a held order
   * @param {string} orderId - Order ID to resume
   * @returns {Order|null} Resumed order or null if not found
   */
  resumeOrder(orderId) {
    const heldOrder = this.heldOrders.get(orderId);
    if (!heldOrder) return null;

    const resumedOrder = resumeOrder(heldOrder);
    this.heldOrders.delete(orderId);
    this.saveHeldOrders();
    return resumedOrder;
  }

  /**
   * Save a draft order
   * @param {Order} order - Order to save as draft
   * @returns {Order} Draft order
   */
  saveDraft(order) {
    const draftOrder = {
      ...order,
      lifecycleState: 'DRAFT',
      updatedAt: now()
    };
    this.draftOrders.set(draftOrder.id, draftOrder);
    this.saveDraftOrders();
    return draftOrder;
  }

  /**
   * Load a draft order
   * @param {string} orderId - Draft order ID
   * @returns {Order|null} Draft order or null if not found
   */
  loadDraft(orderId) {
    return this.draftOrders.get(orderId) || null;
  }

  /**
   * Delete a draft order
   * @param {string} orderId - Draft order ID
   * @returns {boolean} Whether deletion was successful
   */
  deleteDraft(orderId) {
    const deleted = this.draftOrders.delete(orderId);
    if (deleted) {
      this.saveDraftOrders();
    }
    return deleted;
  }

  /**
   * Get all held orders
   * @returns {Order[]} Array of held orders
   */
  getHeldOrders() {
    return Array.from(this.heldOrders.values());
  }

  /**
   * Get all draft orders
   * @returns {Order[]} Array of draft orders
   */
  getDraftOrders() {
    return Array.from(this.draftOrders.values());
  }

  /**
   * Search held orders
   * @param {Object} filters - Search filters
   * @param {string} filters.query - Search query (searches customer name, phone, notes)
   * @param {string} filters.tableId - Filter by table ID
   * @param {string} filters.customerId - Filter by customer ID
   * @param {string} filters.staffId - Filter by staff ID
   * @param {number} filters.minAmount - Minimum order amount
   * @param {number} filters.maxAmount - Maximum order amount
   * @param {number} filters.fromDate - From date (timestamp)
   * @param {number} filters.toDate - To date (timestamp)
   * @returns {Order[]} Filtered held orders
   */
  searchHeldOrders(filters = {}) {
    let orders = this.getHeldOrders();

    if (filters.query) {
      const query = filters.query.toLowerCase();
      orders = orders.filter(order => {
        const customerName = (order.customerName || '').toLowerCase();
        const customerPhone = (order.customerPhone || '').toLowerCase();
        const notes = (order.notes || '').toLowerCase();
        const reference = (order.reference || '').toLowerCase();
        return (
          customerName.includes(query) ||
          customerPhone.includes(query) ||
          notes.includes(query) ||
          reference.includes(query)
        );
      });
    }

    if (filters.tableId) {
      orders = orders.filter(order => order.tableId === filters.tableId);
    }

    if (filters.customerId) {
      orders = orders.filter(order => order.customerId === filters.customerId);
    }

    if (filters.staffId) {
      orders = orders.filter(order => order.staffId === filters.staffId);
    }

    if (filters.minAmount !== undefined) {
      orders = orders.filter(order => order.total >= filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      orders = orders.filter(order => order.total <= filters.maxAmount);
    }

    if (filters.fromDate !== undefined) {
      orders = orders.filter(order => order.createdAt >= filters.fromDate);
    }

    if (filters.toDate !== undefined) {
      orders = orders.filter(order => order.createdAt <= filters.toDate);
    }

    return orders;
  }

  /**
   * Search draft orders
   * @param {Object} filters - Search filters (same as searchHeldOrders)
   * @returns {Order[]} Filtered draft orders
   */
  searchDraftOrders(filters = {}) {
    let orders = this.getDraftOrders();

    if (filters.query) {
      const query = filters.query.toLowerCase();
      orders = orders.filter(order => {
        const customerName = (order.customerName || '').toLowerCase();
        const customerPhone = (order.customerPhone || '').toLowerCase();
        const notes = (order.notes || '').toLowerCase();
        return (
          customerName.includes(query) ||
          customerPhone.includes(query) ||
          notes.includes(query)
        );
      });
    }

    if (filters.tableId) {
      orders = orders.filter(order => order.tableId === filters.tableId);
    }

    if (filters.customerId) {
      orders = orders.filter(order => order.customerId === filters.customerId);
    }

    if (filters.staffId) {
      orders = orders.filter(order => order.staffId === filters.staffId);
    }

    if (filters.minAmount !== undefined) {
      orders = orders.filter(order => order.total >= filters.minAmount);
    }

    if (filters.maxAmount !== undefined) {
      orders = orders.filter(order => order.total <= filters.maxAmount);
    }

    if (filters.fromDate !== undefined) {
      orders = orders.filter(order => order.createdAt >= filters.fromDate);
    }

    if (filters.toDate !== undefined) {
      orders = orders.filter(order => order.createdAt <= filters.toDate);
    }

    return orders;
  }

  /**
   * Preview a held order before restoring
   * @param {string} orderId - Order ID to preview
   * @returns {Object|null} Order preview or null if not found
   */
  previewHeldOrder(orderId) {
    const order = this.heldOrders.get(orderId);
    if (!order) return null;

    return {
      id: order.id,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      tableId: order.tableId,
      itemCount: order.items?.length || 0,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      taxAmount: order.taxAmount,
      total: order.total,
      notes: order.notes,
      heldAt: order.updatedAt,
      heldBy: order.staffId,
      items: order.items?.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        modifiers: item.modifiers
      })) || []
    };
  }

  /**
   * Get held order count
   * @returns {number} Number of held orders
   */
  getHeldOrderCount() {
    return this.heldOrders.size;
  }

  /**
   * Get draft order count
   * @returns {number} Number of draft orders
   */
  getDraftOrderCount() {
    return this.draftOrders.size;
  }

  /**
   * Clear all held orders
   */
  clearHeldOrders() {
    this.heldOrders.clear();
    this.saveHeldOrders();
  }

  /**
   * Clear all draft orders
   */
  clearDraftOrders() {
    this.draftOrders.clear();
    this.saveDraftOrders();
  }

  /**
   * Remove old held orders (older than specified hours)
   * @param {number} hours - Age in hours
   */
  removeOldHeldOrders(hours = 24) {
    const cutoff = now() - (hours * 60 * 60 * 1000);
    let removed = 0;

    for (const [id, order] of this.heldOrders) {
      if (order.updatedAt < cutoff) {
        this.heldOrders.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveHeldOrders();
    }

    return removed;
  }

  /**
   * Remove old draft orders (older than specified hours)
   * @param {number} hours - Age in hours
   */
  removeOldDraftOrders(hours = 48) {
    const cutoff = now() - (hours * 60 * 60 * 1000);
    let removed = 0;

    for (const [id, order] of this.draftOrders) {
      if (order.updatedAt < cutoff) {
        this.draftOrders.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.saveDraftOrders();
    }

    return removed;
  }
}

// Singleton instance
let lifecycleManagerInstance = null;

/**
 * Get the order lifecycle manager singleton
 * @returns {OrderLifecycleManager} Lifecycle manager instance
 */
export function getOrderLifecycleManager() {
  if (!lifecycleManagerInstance) {
    lifecycleManagerInstance = new OrderLifecycleManager();
  }
  return lifecycleManagerInstance;
}

/**
 * Reset the lifecycle manager (useful for testing)
 */
export function resetOrderLifecycleManager() {
  lifecycleManagerInstance = null;
}
