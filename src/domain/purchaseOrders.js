// Purchase Order Management System

export const PurchaseOrderStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  ORDERED: 'ordered',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled'
};

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

class PurchaseOrderManager {
  constructor() {
    this.purchaseOrders = [];
    this.loadFromStorage();
  }

  // Load purchase orders from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('purchase_orders');
        if (stored) {
          this.purchaseOrders = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
    }
  }

  // Save purchase orders to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('purchase_orders', JSON.stringify(this.purchaseOrders));
      }
    } catch (error) {
      console.error('Error saving purchase orders:', error);
    }
  }

  // Create new purchase order
  createPurchaseOrder(orderData) {
    const order = {
      id: this.generateId(),
      orderNumber: this.generateOrderNumber(),
      ...orderData,
      status: orderData.status || PurchaseOrderStatus.DRAFT,
      priority: orderData.priority || Priority.MEDIUM,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: orderData.items || [],
      totalAmount: this.calculateTotal(orderData.items || []),
      receivedItems: [],
      receivedAmount: 0
    };

    this.purchaseOrders.push(order);
    this.saveToStorage();
    
    return order;
  }

  // Update purchase order
  updatePurchaseOrder(orderId, updates) {
    const index = this.purchaseOrders.findIndex(o => o.id === orderId);
    if (index === -1) {
      throw new Error('Purchase order not found');
    }

    this.purchaseOrders[index] = {
      ...this.purchaseOrders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      totalAmount: updates.items ? this.calculateTotal(updates.items) : this.purchaseOrders[index].totalAmount
    };

    this.saveToStorage();
    return this.purchaseOrders[index];
  }

  // Delete purchase order
  deletePurchaseOrder(orderId) {
    const index = this.purchaseOrders.findIndex(o => o.id === orderId);
    if (index === -1) {
      throw new Error('Purchase order not found');
    }

    this.purchaseOrders.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // Get purchase order by ID
  getPurchaseOrder(orderId) {
    return this.purchaseOrders.find(o => o.id === orderId);
  }

  // Get all purchase orders
  getAllPurchaseOrders(filters = {}) {
    let filtered = [...this.purchaseOrders];

    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    if (filters.supplierId) {
      filtered = filtered.filter(o => o.supplierId === filters.supplierId);
    }

    if (filters.priority) {
      filtered = filtered.filter(o => o.priority === filters.priority);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= new Date(filters.startDate) && orderDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Get pending purchase orders
  getPendingOrders() {
    return this.purchaseOrders.filter(o => 
      o.status === PurchaseOrderStatus.PENDING || 
      o.status === PurchaseOrderStatus.APPROVED ||
      o.status === PurchaseOrderStatus.ORDERED
    );
  }

  // Get orders requiring attention (overdue, urgent priority)
  getOrdersRequiringAttention() {
    const now = new Date();
    return this.purchaseOrders.filter(o => {
      const isUrgent = o.priority === Priority.URGENT;
      const isPending = o.status === PurchaseOrderStatus.PENDING || o.status === PurchaseOrderStatus.APPROVED;
      const isOverdue = o.expectedDeliveryDate && new Date(o.expectedDeliveryDate) < now;
      
      return isPending && (isUrgent || isOverdue);
    });
  }

  // Approve purchase order
  approveOrder(orderId, approvedBy, notes = '') {
    return this.updatePurchaseOrder(orderId, {
      status: PurchaseOrderStatus.APPROVED,
      approvedBy,
      approvedAt: new Date().toISOString(),
      approvalNotes: notes
    });
  }

  // Send order to supplier
  sendToSupplier(orderId, sentBy) {
    return this.updatePurchaseOrder(orderId, {
      status: PurchaseOrderStatus.ORDERED,
      sentBy,
      sentAt: new Date().toISOString()
    });
  }

  // Record received items
  recordReceivedItems(orderId, receivedItems, receivedBy) {
    const order = this.getPurchaseOrder(orderId);
    if (!order) {
      throw new Error('Purchase order not found');
    }

    const newReceivedItems = [...order.receivedItems, ...receivedItems];
    const receivedAmount = this.calculateTotal(receivedItems);
    const newTotalReceived = order.receivedAmount + receivedAmount;

    // Check if all items received
    const allReceived = newReceivedItems.length >= order.items.length;
    const status = allReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED;

    return this.updatePurchaseOrder(orderId, {
      receivedItems: newReceivedItems,
      receivedAmount: newTotalReceived,
      status,
      receivedBy,
      receivedAt: new Date().toISOString()
    });
  }

  // Cancel purchase order
  cancelOrder(orderId, cancelledBy, reason = '') {
    return this.updatePurchaseOrder(orderId, {
      status: PurchaseOrderStatus.CANCELLED,
      cancelledBy,
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    });
  }

  // Calculate total amount for items
  calculateTotal(items) {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  }

  // Generate order number
  generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = this.purchaseOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getFullYear() === year && orderDate.getMonth() === date.getMonth();
    }).length + 1;
    
    return `PO-${year}${month}-${String(count).padStart(4, '0')}`;
  }

  // Generate unique ID
  generateId() {
    return `po_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get purchaseorder statistics
  getStatistics() {
    const now = new Date();
    const thisMonth = this.purchaseOrders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    });

    return {
      total: this.purchaseOrders.length,
      byStatus: this.groupByStatus(),
      byPriority: this.groupByPriority(),
      thisMonth: {
        count: thisMonth.length,
        totalValue: thisMonth.reduce((sum, o) => sum + o.totalAmount, 0)
      },
      totalValue: this.purchaseOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      pendingValue: this.getPendingOrders().reduce((sum, o) => sum + o.totalAmount, 0),
      overdueOrders: this.getOrdersRequiringAttention().length
    };
  }

  // Group orders by status
  groupByStatus() {
    const grouped = {};
    this.purchaseOrders.forEach(o => {
      grouped[o.status] = (grouped[o.status] || 0) + 1;
    });
    return grouped;
  }

  // Group orders by priority
  groupByPriority() {
    const grouped = {};
    this.purchaseOrders.forEach(o => {
      grouped[o.priority] = (grouped[o.priority] || 0) + 1;
    });
    return grouped;
  }

  // Get supplier purchase history
  getSupplierHistory(supplierId) {
    return this.purchaseOrders.filter(o => o.supplierId === supplierId);
  }

  // Export purchase orders as CSV
  exportToCSV(startDate, endDate) {
    const orders = this.getAllPurchaseOrders({ startDate, endDate });
    const headers = ['Order Number', 'Supplier ID', 'Status', 'Priority', 'Total Amount', 'Created At', 'Expected Delivery'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.supplierId,
      o.status,
      o.priority,
      o.totalAmount,
      o.createdAt,
      o.expectedDeliveryDate || 'N/A'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Singleton instance
let purchaseOrderManager = null;

export const getPurchaseOrderManager = () => {
  if (!purchaseOrderManager) {
    purchaseOrderManager = new PurchaseOrderManager();
  }
  return purchaseOrderManager;
};
