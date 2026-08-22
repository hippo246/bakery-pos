/**
 * Aggregator Order Manager
 * Central manager for all aggregator orders (Zomato, Swiggy)
 * Handles order lifecycle, status updates, and persistence
 */

class AggregatorOrderManager {
  constructor() {
    this.orders = new Map(); // orderId -> order object
    this.listeners = new Set(); // Event listeners
    this.storageKey = 'aggregator_orders';
    this.loadOrders();
  }

  /**
   * Load orders from localStorage
   */
  loadOrders() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const orders = JSON.parse(stored);
        orders.forEach(order => this.orders.set(order.id, order));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  /**
   * Save orders to localStorage
   */
  saveOrders() {
    try {
      const orders = Array.from(this.orders.values());
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  }

  /**
   * Add new order
   */
  async addOrder(order) {
    const orderWithTimestamp = {
      ...order,
      id: order.id || `${order.platform}-${Date.now()}`,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.orders.set(orderWithTimestamp.id, orderWithTimestamp);
    this.saveOrders();
    this.emit('order_added', orderWithTimestamp);
    
    return orderWithTimestamp;
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const updatedOrder = {
      ...order,
      status,
      updatedAt: new Date().toISOString()
    };

    this.orders.set(orderId, updatedOrder);
    this.saveOrders();
    this.emit('order_updated', updatedOrder);
    
    return updatedOrder;
  }

  /**
   * Get order by ID
   */
  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  /**
   * Get all orders
   */
  getAllOrders() {
    return Array.from(this.orders.values());
  }

  /**
   * Get orders by platform
   */
  getOrdersByPlatform(platform) {
    return this.getAllOrders().filter(order => order.platform === platform);
  }

  /**
   * Get orders by status
   */
  getOrdersByStatus(status) {
    return this.getAllOrders().filter(order => order.status === status);
  }

  /**
   * Get pending orders
   */
  getPendingOrders() {
    return this.getOrdersByStatus('pending');
  }

  /**
   * Get active orders (not completed/cancelled/rejected)
   */
  getActiveOrders() {
    return this.getAllOrders().filter(order => 
      !['completed', 'cancelled', 'rejected'].includes(order.status)
    );
  }

  /**
   * Delete order
   */
  async deleteOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    this.orders.delete(orderId);
    this.saveOrders();
    this.emit('order_deleted', { orderId });
    
    return { success: true };
  }

  /**
   * Clear old orders (older than specified days)
   */
  clearOldOrders(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let deletedCount = 0;
    for (const [orderId, order] of this.orders) {
      const orderDate = new Date(order.createdAt);
      if (orderDate < cutoffDate && 
          ['completed', 'cancelled', 'rejected'].includes(order.status)) {
        this.orders.delete(orderId);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.saveOrders();
    }

    return deletedCount;
  }

  /**
   * Get order statistics
   */
  getStatistics() {
    const orders = this.getAllOrders();
    const today = new Date().toDateString();

    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      rejected: orders.filter(o => o.status === 'rejected').length,
      zomato: orders.filter(o => o.platform === 'Zomato').length,
      swiggy: orders.filter(o => o.platform === 'Swiggy').length,
      today: orders.filter(o => new Date(o.createdAt).toDateString() === today).length,
      totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
      totalCommission: orders.reduce((sum, o) => sum + (o.commission || 0), 0)
    };
  }

  /**
   * Event listener management
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }
}

export default AggregatorOrderManager;
