/**
 * Order Workflow Service
 * Advanced workflow management for orders with lifecycle states
 */

import orderEventManager from './OrderEventManager.js';

class OrderWorkflowService {
  constructor() {
    this.orderStates = new Map();
    this.kotQueue = [];
    this.activeKOTs = new Map();
    this.STORAGE_KEY = 'order_workflow_service_state';
    this.loadState();
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.orderStates = new Map(data.orderStates || []);
        this.kotQueue = data.kotQueue || [];
        this.activeKOTs = new Map(data.activeKOTs || []);
        console.log('[OrderWorkflowService] State loaded from localStorage');
      }
    } catch (error) {
      console.error('[OrderWorkflowService] Failed to load state:', error);
    }
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const data = {
        orderStates: Array.from(this.orderStates.entries()),
        kotQueue: this.kotQueue,
        activeKOTs: Array.from(this.activeKOTs.entries())
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[OrderWorkflowService] Failed to save state:', error);
    }
  }

  /**
   * Create a new order with workflow state
   */
  createOrder(orderData) {
    const order = {
      id: orderData.id || this.generateOrderId(),
      ...orderData,
      workflow: {
        state: 'created',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        firedAt: null,
        completedAt: null,
        paidAt: null,
        kotIds: [],
        statusHistory: []
      }
    };

    this.orderStates.set(order.id, order);
    this.saveState();
    orderEventManager.emitOrderCreated(order);
    return order;
  }

  /**
   * Update order with workflow tracking
   */
  updateOrder(orderId, updates) {
    const order = this.orderStates.get(orderId);
    if (!order) {
      console.error('[OrderWorkflowService] Order not found:', orderId);
      return null;
    }

    const previousState = order.workflow.state;
    const updatedOrder = {
      ...order,
      ...updates,
      workflow: {
        ...order.workflow,
        ...updates.workflow,
        updatedAt: Date.now(),
        statusHistory: [
          ...order.workflow.statusHistory,
          {
            from: previousState,
            to: updates.workflow?.state || previousState,
            at: Date.now(),
            changes: Object.keys(updates)
          }
        ]
      }
    };

    this.orderStates.set(orderId, updatedOrder);
    this.saveState();
    orderEventManager.emitOrderUpdated(updatedOrder, updates);
    return updatedOrder;
  }

  /**
   * Fire order to kitchen (create KOT)
   */
  fireOrderToKitchen(order, items, tableId, waiterId) {
    const kot = this.createKOT(order, items, tableId, waiterId);
    
    // Update order workflow
    this.updateOrder(order.id, {
      workflow: {
        state: 'fired',
        firedAt: Date.now(),
        kotIds: [...order.workflow.kotIds, kot.id]
      }
    });

    // Add to KOT queue
    this.kotQueue.push(kot);
    this.activeKOTs.set(kot.id, kot);
    this.saveState();

    // Emit events
    orderEventManager.emitOrderFired(order, kot);
    orderEventManager.emitKOTReceived(kot);

    return kot;
  }

  /**
   * Create Kitchen Order Ticket (KOT)
   */
  createKOT(order, items, tableId, waiterId) {
    return {
      id: this.generateKOTId(),
      orderId: order.id,
      tableId: tableId || order.tableId,
      waiterId: waiterId || order.waiterId,
      items: items.map(item => ({
        ...item,
        status: 'pending',
        startedAt: null,
        completedAt: null
      })),
      priority: this.calculatePriority(order),
      createdAt: Date.now(),
      estimatedTime: this.calculateEstimatedTime(items),
      notes: order.specialRequest || ''
    };
  }

  /**
   * Update KOT item status
   */
  updateKOTItemStatus(kotId, itemId, newStatus) {
    const kot = this.activeKOTs.get(kotId);
    if (!kot) return null;

    const itemIndex = kot.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return null;

    const previousStatus = kot.items[itemIndex].status;
    kot.items[itemIndex].status = newStatus;

    if (newStatus === 'started') {
      kot.items[itemIndex].startedAt = Date.now();
      orderEventManager.emitKitchenItemStarted(kotId, itemId);
    } else if (newStatus === 'completed') {
      kot.items[itemIndex].completedAt = Date.now();
      orderEventManager.emitKitchenItemCompleted(kotId, itemId);
    }

    // Check if all items are completed
    const allCompleted = kot.items.every(item => item.status === 'completed');
    if (allCompleted && kot.status !== 'completed') {
      kot.status = 'completed';
      kot.completedAt = Date.now();
      this.markOrderAsCompleted(kot.orderId);
    }

    this.activeKOTs.set(kotId, kot);
    this.saveState();
    orderEventManager.emitOrderItemStatusChanged(
      this.orderStates.get(kot.orderId),
      itemId,
      newStatus
    );

    return kot;
  }

  /**
   * Mark order as completed
   */
  markOrderAsCompleted(orderId) {
    const order = this.orderStates.get(orderId);
    if (!order) return null;

    this.updateOrder(orderId, {
      workflow: {
        state: 'completed',
        completedAt: Date.now()
      }
    });

    orderEventManager.emitOrderCompleted(order);
    return order;
  }

  /**
   * Process order payment
   */
  processPayment(orderId, paymentData) {
    const order = this.orderStates.get(orderId);
    if (!order) return null;

    this.updateOrder(orderId, {
      workflow: {
        state: 'paid',
        paidAt: Date.now()
      },
      payment: paymentData
    });

    orderEventManager.emitOrderPaid(order, paymentData);
    return order;
  }

  /**
   * Assign waiter to order
   */
  assignWaiter(orderId, waiterId, tableId) {
    const order = this.orderStates.get(orderId);
    if (!order) return null;

    this.updateOrder(orderId, {
      waiterId,
      tableId
    });

    orderEventManager.emitWaiterAssigned(orderId, waiterId, tableId);
    return order;
  }

  /**
   * Generate token for order
   */
  generateToken(orderId) {
    const order = this.orderStates.get(orderId);
    if (!order) return null;

    const tokenNumber = this.generateTokenNumber();
    
    this.updateOrder(orderId, {
      tokenNumber,
      workflow: {
        ...order.workflow,
        tokenGeneratedAt: Date.now()
      }
    });

    orderEventManager.emitTokenGenerated(orderId, tokenNumber);
    return tokenNumber;
  }

  /**
   * Update table status based on order
   */
  updateTableStatus(tableId, status, tableData) {
    orderEventManager.emitTableStatusChanged(tableId, status, tableData);
  }

  /**
   * Update table order data
   */
  updateTableOrder(tableId, orderData) {
    orderEventManager.emitTableOrderUpdated(tableId, orderData);
  }

  /**
   * Get order by ID
   */
  getOrder(orderId) {
    return this.orderStates.get(orderId);
  }

  /**
   * Get KOT by ID
   */
  getKOT(kotId) {
    return this.activeKOTs.get(kotId);
  }

  /**
   * Get all active KOTs
   */
  getActiveKOTs() {
    return Array.from(this.activeKOTs.values());
  }

  /**
   * Get KOTs by table
   */
  getKOTsByTable(tableId) {
    return this.getActiveKOTs().filter(kot => kot.tableId === tableId);
  }

  /**
   * Get KOTs by waiter
   */
  getKOTsByWaiter(waiterId) {
    return this.getActiveKOTs().filter(kot => kot.waiterId === waiterId);
  }

  /**
   * Calculate order priority
   */
  calculatePriority(order) {
    // VIP orders get highest priority
    if (order.isVIP) return 'high';
    
    // Orders with wait time > 30 minutes get high priority
    if (order.waitTime && order.waitTime > 30) return 'high';
    
    // Orders with wait time > 15 minutes get medium priority
    if (order.waitTime && order.waitTime > 15) return 'medium';
    
    return 'normal';
  }

  /**
   * Calculate estimated preparation time
   */
  calculateEstimatedTime(items) {
    // Base time per item (in minutes)
    const baseTimePerItem = 5;
    
    // Sum of item times
    const totalTime = items.reduce((sum, item) => {
      const itemTime = item.preparationTime || baseTimePerItem;
      return sum + itemTime;
    }, 0);

    // Add 20% buffer for complexity
    return Math.ceil(totalTime * 1.2);
  }

  /**
   * Generate unique order ID
   */
  generateOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique KOT ID
   */
  generateKOTId() {
    return `KOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate token number
   */
  generateTokenNumber() {
    // Simple incrementing token (in production, use database sequence)
    const lastToken = parseInt(localStorage.getItem('last_token_number') || '0');
    const newToken = lastToken + 1;
    localStorage.setItem('last_token_number', newToken.toString());
    return newToken;
  }

  /**
   * Clear completed KOTs (cleanup)
   */
  clearCompletedKOTs() {
    const now = Date.now();
    const completionThreshold = 24 * 60 * 60 * 1000; // 24 hours

    for (const [kotId, kot] of this.activeKOTs.entries()) {
      if (kot.status === 'completed' && kot.completedAt && (now - kot.completedAt) > completionThreshold) {
        this.activeKOTs.delete(kotId);
      }
    }
  }
}

// Singleton instance
const orderWorkflowService = new OrderWorkflowService();

export default orderWorkflowService;