/**
 * Zomato API Client
 * Handles all interactions with Zomato Partner API
 */

class ZomatoClient {
  constructor(apiKey, restaurantId, environment = 'production') {
    this.apiKey = apiKey;
    this.restaurantId = restaurantId;
    this.environment = environment;
    this.baseUrl = environment === 'production' 
      ? 'https://api.zomato.com/partner/v1' 
      : 'https://api.zomato.com/partner/v1/sandbox';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Generic API request handler with retry logic
   */
  async request(endpoint, options = {}, retries = 3) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(`Zomato API Error: ${error.message || response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) throw error;
        console.log(`Retry ${i + 1}/${retries} for ${endpoint}`);
        await this.delay(1000 * (i + 1)); // Exponential backoff
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get restaurant profile
   */
  async getRestaurantProfile() {
    return this.request(`/restaurants/${this.restaurantId}`);
  }

  /**
   * Get active orders
   */
  async getActiveOrders() {
    return this.request(`/restaurants/${this.restaurantId}/orders?status=active`);
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId) {
    return this.request(`/restaurants/${this.restaurantId}/orders/${orderId}`);
  }

  /**
   * Accept an order
   */
  async acceptOrder(orderId, preparationTime = 30) {
    return this.request(`/restaurants/${this.restaurantId}/orders/${orderId}/accept`, {
      method: 'POST',
      body: JSON.stringify({
        estimated_preparation_time: preparationTime
      })
    });
  }

  /**
   * Reject an order
   */
  async rejectOrder(orderId, reason = 'Restaurant closed') {
    return this.request(`/restaurants/${this.restaurantId}/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    const statusMap = {
      'preparing': 'preparing',
      'ready': 'ready_for_pickup',
      'picked_up': 'picked_up',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };

    return this.request(`/restaurants/${this.restaurantId}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: statusMap[status] || status })
    });
  }

  /**
   * Get menu items
   */
  async getMenuItems() {
    return this.request(`/restaurants/${this.restaurantId}/menu`);
  }

  /**
   * Update menu item (price, availability, etc.)
   */
  async updateMenuItem(itemId, updates) {
    return this.request(`/restaurants/${this.restaurantId}/menu/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  /**
   * Bulk update menu items
   */
  async bulkUpdateMenuItems(items) {
    return this.request(`/restaurants/${this.restaurantId}/menu/bulk`, {
      method: 'POST',
      body: JSON.stringify({ items })
    });
  }

  /**
   * Get daily sales report
   */
  async getDailySalesReport(date) {
    return this.request(`/restaurants/${this.restaurantId}/reports/sales?date=${date}`);
  }

  /**
   * Get commission details
   */
  async getCommissionDetails(orderId) {
    return this.request(`/restaurants/${this.restaurantId}/orders/${orderId}/commission`);
  }

  /**
   * Validate API credentials
   */
  async validateCredentials() {
    try {
      await this.getRestaurantProfile();
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

export default ZomatoClient;
