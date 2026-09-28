/**
 * Centralized Order Event Manager
 * Handles real-time order synchronization across all tabs (Orders, Tables, Kitchen, Waiters, Tokens)
 */

class OrderEventManager {
  constructor() {
    this.listeners = new Map();
    this.orderHistory = new Map();
    this.initialize();
  }

  initialize() {
    // Listen for storage events (cross-tab sync)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageEvent.bind(this));
    }
  }

  handleStorageEvent(event) {
    if (event.key === 'order_event') {
      try {
        const eventData = JSON.parse(event.newValue);
        this.emit(eventData.type, eventData.payload);
      } catch (error) {
        console.error('[OrderEventManager] Failed to parse storage event:', error);
      }
    }
  }

  /**
   * Subscribe to order events
   * @param {string} eventType - Order event type
   * @param {Function} callback - Event handler
   * @returns {Function} Unsubscribe function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      this.off(eventType, callback);
    };
  }

  /**
   * Unsubscribe from order events
   * @param {string} eventType - Order event type
   * @param {Function} callback - Event handler
   */
  off(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback);
    }
  }

  /**
   * Emit an order event
   * @param {string} eventType - Order event type
   * @param {Object} payload - Event payload
   */
  emit(eventType, payload) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[OrderEventManager] Error in ${eventType} handler:`, error);
        }
      });
    }

    // Also emit to other tabs via localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('order_event', JSON.stringify({
          type: eventType,
          payload,
          timestamp: Date.now()
        }));
        // Clear immediately to allow new events
        localStorage.removeItem('order_event');
      } catch (error) {
        console.error('[OrderEventManager] Failed to emit cross-tab event:', error);
      }
    }
  }

  /**
   * Order Created Event
   * Fired when a new order is created
   */
  emitOrderCreated(order) {
    this.orderHistory.set(order.id, { ...order, lifecycle: 'created' });
    this.emit('order:created', order);
  }

  /**
   * Order Updated Event
   * Fired when an order is modified
   */
  emitOrderUpdated(order, changes) {
    const history = this.orderHistory.get(order.id) || {};
    this.orderHistory.set(order.id, { ...history, ...order, lifecycle: 'updated' });
    this.emit('order:updated', { order, changes });
  }

  /**
   * Order Fired Event (KOT sent to kitchen)
   * Fired when order is sent to kitchen
   */
  emitOrderFired(order, kotData) {
    const history = this.orderHistory.get(order.id) || {};
    this.orderHistory.set(order.id, { ...history, ...order, lifecycle: 'fired', firedAt: Date.now() });
    this.emit('order:fired', { order, kotData });
  }

  /**
   * Order Item Status Changed
   * Fired when individual order item status changes
   */
  emitOrderItemStatusChanged(order, itemId, newStatus) {
    this.emit('order:item:status', { order, itemId, newStatus });
  }

  /**
   * Order Completed Event
   * Fired when order is completed
   */
  emitOrderCompleted(order) {
    const history = this.orderHistory.get(order.id) || {};
    this.orderHistory.set(order.id, { ...history, ...order, lifecycle: 'completed', completedAt: Date.now() });
    this.emit('order:completed', order);
  }

  /**
   * Order Paid Event
   * Fired when order payment is processed
   */
  emitOrderPaid(order, paymentData) {
    const history = this.orderHistory.get(order.id) || {};
    this.orderHistory.set(order.id, { ...history, ...order, lifecycle: 'paid', paidAt: Date.now() });
    this.emit('order:paid', { order, paymentData });
  }

  /**
   * Order Cancelled Event
   * Fired when order is cancelled
   */
  emitOrderCancelled(order, reason) {
    const history = this.orderHistory.get(order.id) || {};
    this.orderHistory.set(order.id, { ...history, ...order, lifecycle: 'cancelled', cancelledAt: Date.now(), cancelReason: reason });
    this.emit('order:cancelled', { order, reason });
  }

  /**
   * Table Status Changed Event
   * Fired when table status changes (seated, available, cleaning, etc.)
   */
  emitTableStatusChanged(tableId, newStatus, tableData) {
    this.emit('table:status', { tableId, newStatus, tableData });
  }

  /**
   * Table Order Updated Event
   * Fired when table's order data is updated
   */
  emitTableOrderUpdated(tableId, orderData) {
    this.emit('table:order', { tableId, orderData });
  }

  /**
   * Kitchen KOT Received Event
   * Fired when kitchen receives a new KOT
   */
  emitKOTReceived(kotData) {
    this.emit('kitchen:kot:received', kotData);
  }

  /**
   * Kitchen Item Started Event
   * Fired when kitchen starts preparing an item
   */
  emitKitchenItemStarted(kotId, itemId) {
    this.emit('kitchen:item:started', { kotId, itemId });
  }

  /**
   * Kitchen Item Completed Event
   * Fired when kitchen completes an item
   */
  emitKitchenItemCompleted(kotId, itemId) {
    this.emit('kitchen:item:completed', { kotId, itemId });
  }

  /**
   * Waiter Assignment Event
   * Fired when waiter is assigned to order/table
   */
  emitWaiterAssigned(orderId, waiterId, tableId) {
    this.emit('waiter:assigned', { orderId, waiterId, tableId });
  }

  /**
   * Token Generated Event
   * Fired when token is generated for order
   */
  emitTokenGenerated(orderId, tokenNumber) {
    this.emit('token:generated', { orderId, tokenNumber });
  }

  /**
   * Token Status Changed Event
   * Fired when token status changes
   */
  emitTokenStatusChanged(tokenNumber, newStatus) {
    this.emit('token:status', { tokenNumber, newStatus });
  }

  /**
   * Get order lifecycle history
   */
  getOrderHistory(orderId) {
    return this.orderHistory.get(orderId);
  }

  /**
   * Clear order history (useful for cleanup)
   */
  clearOrderHistory(orderId) {
    this.orderHistory.delete(orderId);
  }
}

// Singleton instance
const orderEventManager = new OrderEventManager();

export default orderEventManager;