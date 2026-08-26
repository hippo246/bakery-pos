// Zomato API Integration

export const ZomatoOrderStatus = {
  RECEIVED: 'received',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

class ZomatoIntegration {
  constructor(apiKey, restaurantId) {
    this.apiKey = apiKey;
    this.restaurantId = restaurantId;
    this.baseUrl = 'https://api.zomato.com/v2.1';
    this.orders = [];
    this.loadFromStorage();
  }

  // Load orders from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('zomato_orders');
        if (stored) {
          this.orders = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading Zomato orders:', error);
    }
  }

  // Save orders to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('zomato_orders', JSON.stringify(this.orders));
      }
    } catch (error) {
      console.error('Error saving Zomato orders:', error);
    }
  }

  // Fetch orders from Zomato
  async fetchOrders() {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Process and store orders
      const processedOrders = data.orders.map(order => this.processOrder(order));
      
      // Update local orders
      processedOrders.forEach(order => {
        const existingIndex = this.orders.findIndex(o => o.zomatoOrderId === order.zomatoOrderId);
        if (existingIndex >= 0) {
          this.orders[existingIndex] = order;
        } else {
          this.orders.push(order);
        }
      });

      this.saveToStorage();
      return processedOrders;
    } catch (error) {
      console.error('Error fetching Zomato orders:', error);
      throw error;
    }
  }

  // Process order from Zomato format
  processOrder(zomatoOrder) {
    return {
      id: this.generateId(),
      zomatoOrderId: zomatoOrder.id,
      platform: 'zomato',
      status: this.mapZomatoStatus(zomatoOrder.status),
      customer: {
        name: zomatoOrder.customer_name,
        phone: zomatoOrder.customer_phone,
        address: zomatoOrder.delivery_address
      },
      items: zomatoOrder.items.map(item => ({
        id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        modifiers: item.modifiers || []
      })),
      totalAmount: zomatoOrder.total_amount,
      deliveryFee: zomatoOrder.delivery_fee || 0,
      taxAmount: zomatoOrder.tax_amount || 0,
      discountAmount: zomatoOrder.discount_amount || 0,
      finalAmount: zomatoOrder.final_amount,
      orderTime: zomatoOrder.order_time,
      estimatedDeliveryTime: zomatoOrder.estimated_delivery_time,
      specialInstructions: zomatoOrder.special_instructions || '',
      paymentMethod: zomatoOrder.payment_method,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Map Zomato status to internal status
  mapZomatoStatus(zomatoStatus) {
    const statusMap = {
      'received': ZomatoOrderStatus.RECEIVED,
      'confirmed': ZomatoOrderStatus.CONFIRMED,
      'preparing': ZomatoOrderStatus.PREPARING,
      'ready_for_pickup': ZomatoOrderStatus.READY_FOR_PICKUP,
      'out_for_delivery': ZomatoOrderStatus.OUT_FOR_DELIVERY,
      'delivered': ZomatoOrderStatus.DELIVERED,
      'cancelled': ZomatoOrderStatus.CANCELLED,
      'rejected': ZomatoOrderStatus.REJECTED
    };
    return statusMap[zomatoStatus] || ZomatoOrderStatus.RECEIVED;
  }

  // Accept order
  async acceptOrder(orderId, prepTime = 30) {
    try {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const response = await fetch(`${this.baseUrl}/orders/${order.zomatoOrderId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preparation_time: prepTime
        })
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      // Update local order status
      this.updateOrderStatus(orderId, ZomatoOrderStatus.CONFIRMED);
      
      return await response.json();
    } catch (error) {
      console.error('Error accepting Zomato order:', error);
      throw error;
    }
  }

  // Reject order
  async rejectOrder(orderId, reason = '') {
    try {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const response = await fetch(`${this.baseUrl}/orders/${order.zomatoOrderId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: reason
        })
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      // Update local order status
      this.updateOrderStatus(orderId, ZomatoOrderStatus.REJECTED);
      
      return await response.json();
    } catch (error) {
      console.error('Error rejecting Zomato order:', error);
      throw error;
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const response = await fetch(`${this.baseUrl}/orders/${order.zomatoOrderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      // Update local order
      const index = this.orders.findIndex(o => o.id === orderId);
      this.orders[index].status = status;
      this.orders[index].updatedAt = new Date().toISOString();
      this.saveToStorage();
      
      return await response.json();
    } catch (error) {
      console.error('Error updating Zomato order status:', error);
      throw error;
    }
  }

  // Get order by ID
  getOrder(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  // Get all orders
  getAllOrders(filters = {}) {
    let filtered = [...this.orders];

    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    if (filters.startDate && filters.endDate) {
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.orderTime);
        return orderDate >= new Date(filters.startDate) && orderDate <= new Date(filters.endDate);
      });
    }

    return filtered.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
  }

  // Get pending orders
  getPendingOrders() {
    return this.orders.filter(o => 
      o.status === ZomatoOrderStatus.RECEIVED || 
      o.status === ZomatoOrderStatus.CONFIRMED
    );
  }

  // Get orders requiring attention
  getOrdersRequiringAttention() {
    const now = new Date();
    return this.orders.filter(o => {
      const orderTime = new Date(o.orderTime);
      const timeSinceOrder = (now - orderTime) / (1000 * 60); // minutes
      
      return (o.status === ZomatoOrderStatus.RECEIVED && timeSinceOrder > 5) ||
             (o.status === ZomatoOrderStatus.CONFIRMED && timeSinceOrder > 30);
    });
  }

  // Sync menu with Zomato
  async syncMenu(menuItems) {
    try {
      const zomatoMenuItems = menuItems.map(item => ({
        item_id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        is_available: item.active,
        category_id: item.categoryId,
        modifiers: item.modifiers || []
      }));

      const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/menu`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: zomatoMenuItems
        })
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing menu with Zomato:', error);
      throw error;
    }
  }

  // Update item availability
  async updateItemAvailability(itemId, isAvailable) {
    try {
      const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}/menu/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_available: isAvailable
        })
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item availability on Zomato:', error);
      throw error;
    }
  }

  // Get restaurant details
  async getRestaurantDetails() {
    try {
      const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Zomato API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching restaurant details from Zomato:', error);
      throw error;
    }
  }

  // Get order statistics
  getStatistics(startDate, endDate) {
    const orders = this.getAllOrders({ startDate, endDate });
    
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.finalAmount, 0);
    const byStatus = {};
    
    orders.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      byStatus
    };
  }

  // Generate unique ID
  generateId() {
    return `zomato_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Test API connection
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/restaurants/${this.restaurantId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Zomato API connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let zomatoIntegration = null;

export const getZomatoIntegration = (apiKey, restaurantId) => {
  if (!zomatoIntegration) {
    zomatoIntegration = new ZomatoIntegration(apiKey, restaurantId);
  }
  return zomatoIntegration;
};
