// Swiggy API Integration

export const SwiggyOrderStatus = {
  RECEIVED: 'received',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready_for_pickup',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

class SwiggyIntegration {
  constructor(apiKey, restaurantId) {
    this.apiKey = apiKey;
    this.restaurantId = restaurantId;
    this.baseUrl = 'https://api.swiggy.com/v1';
    this.orders = [];
    this.loadFromStorage();
  }

  // Load orders from localStorage
  loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('swiggy_orders');
        if (stored) {
          this.orders = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Error loading Swiggy orders:', error);
    }
  }

  // Save orders to localStorage
  saveToStorage() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('swiggy_orders', JSON.stringify(this.orders));
      }
    } catch (error) {
      console.error('Error saving Swiggy orders:', error);
    }
  }

  // Fetch orders from Swiggy
  async fetchOrders() {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Process and store orders
      const processedOrders = data.orders.map(order => this.processOrder(order));
      
      // Update local orders
      processedOrders.forEach(order => {
        const existingIndex = this.orders.findIndex(o => o.swiggyOrderId === order.swiggyOrderId);
        if (existingIndex >= 0) {
          this.orders[existingIndex] = order;
        } else {
          this.orders.push(order);
        }
      });

      this.saveToStorage();
      return processedOrders;
    } catch (error) {
      console.error('Error fetching Swiggy orders:', error);
      throw error;
    }
  }

  // Process order from Swiggy format
  processOrder(swiggyOrder) {
    return {
      id: this.generateId(),
      swiggyOrderId: swiggyOrder.id,
      platform: 'swiggy',
      status: this.mapSwiggyStatus(swiggyOrder.status),
      customer: {
        name: swiggyOrder.customer_name,
        phone: swiggyOrder.customer_phone,
        address: swiggyOrder.delivery_address
      },
      items: swiggyOrder.items.map(item => ({
        id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        modifiers: item.modifiers || []
      })),
      totalAmount: swiggyOrder.total_amount,
      deliveryFee: swiggyOrder.delivery_fee || 0,
      taxAmount: swiggyOrder.tax_amount || 0,
      discountAmount: swiggyOrder.discount_amount || 0,
      packagingFee: swiggyOrder.packaging_fee || 0,
      finalAmount: swiggyOrder.final_amount,
      orderTime: swiggyOrder.order_time,
      estimatedDeliveryTime: swiggyOrder.estimated_delivery_time,
      specialInstructions: swiggyOrder.special_instructions || '',
      paymentMethod: swiggyOrder.payment_method,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Map Swiggy status to internal status
  mapSwiggyStatus(swiggyStatus) {
    const statusMap = {
      'received': SwiggyOrderStatus.RECEIVED,
      'confirmed': SwiggyOrderStatus.CONFIRMED,
      'preparing': SwiggyOrderStatus.PREPARING,
      'ready_for_pickup': SwiggyOrderStatus.READY_FOR_PICKUP,
      'picked_up': SwiggyOrderStatus.PICKED_UP,
      'delivered': SwiggyOrderStatus.DELIVERED,
      'cancelled': SwiggyOrderStatus.CANCELLED,
      'rejected': SwiggyOrderStatus.REJECTED
    };
    return statusMap[swiggyStatus] || SwiggyOrderStatus.RECEIVED;
  }

  // Accept order
  async acceptOrder(orderId, prepTime = 30) {
    try {
      const order = this.orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const response = await fetch(`${this.baseUrl}/orders/${order.swiggyOrderId}/accept`, {
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
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      // Update local order status
      this.updateOrderStatus(orderId, SwiggyOrderStatus.CONFIRMED);
      
      return await response.json();
    } catch (error) {
      console.error('Error accepting Swiggy order:', error);
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

      const response = await fetch(`${this.baseUrl}/orders/${order.swiggyOrderId}/reject`, {
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
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      // Update local order status
      this.updateOrderStatus(orderId, SwiggyOrderStatus.REJECTED);
      
      return await response.json();
    } catch (error) {
      console.error('Error rejecting Swiggy order:', error);
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

      const response = await fetch(`${this.baseUrl}/orders/${order.swiggyOrderId}/status`, {
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
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      // Update local order
      const index = this.orders.findIndex(o => o.id === orderId);
      this.orders[index].status = status;
      this.orders[index].updatedAt = new Date().toISOString();
      this.saveToStorage();
      
      return await response.json();
    } catch (error) {
      console.error('Error updating Swiggy order status:', error);
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
      o.status === SwiggyOrderStatus.RECEIVED || 
      o.status === SwiggyOrderStatus.CONFIRMED
    );
  }

  // Get orders requiring attention
  getOrdersRequiringAttention() {
    const now = new Date();
    return this.orders.filter(o => {
      const orderTime = new Date(o.orderTime);
      const timeSinceOrder = (now - orderTime) / (1000 * 60); // minutes
      
      return (o.status === SwiggyOrderStatus.RECEIVED && timeSinceOrder > 5) ||
             (o.status === SwiggyOrderStatus.CONFIRMED && timeSinceOrder > 30);
    });
  }

  // Sync menu with Swiggy
  async syncMenu(menuItems) {
    try {
      const swiggyMenuItems = menuItems.map(item => ({
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
          items: swiggyMenuItems
        })
      });

      if (!response.ok) {
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing menu with Swiggy:', error);
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
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating item availability on Swiggy:', error);
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
        throw new Error(`Swiggy API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching restaurant details from Swiggy:', error);
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
    return `swiggy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      console.error('Swiggy API connection test failed:', error);
      return false;
    }
  }
}

// Singleton instance
let swiggyIntegration = null;

export const getSwiggyIntegration = (apiKey, restaurantId) => {
  if (!swiggyIntegration) {
    swiggyIntegration = new SwiggyIntegration(apiKey, restaurantId);
  }
  return swiggyIntegration;
};
