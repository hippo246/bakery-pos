/**
 * Aggregator Webhook Handler
 * Handles incoming webhooks from Zomato and Swiggy
 * Processes order events and updates local state
 */

class AggregatorWebhookHandler {
  constructor(orderManager) {
    this.orderManager = orderManager;
    this.eventHandlers = {
      zomato: {
        'order_created': this.handleZomatoOrderCreated.bind(this),
        'order_accepted': this.handleZomatoOrderAccepted.bind(this),
        'order_rejected': this.handleZomatoOrderRejected.bind(this),
        'order_cancelled': this.handleZomatoOrderCancelled.bind(this),
        'order_status_updated': this.handleZomatoStatusUpdated.bind(this)
      },
      swiggy: {
        'order_placed': this.handleSwiggyOrderPlaced.bind(this),
        'order_accepted': this.handleSwiggyOrderAccepted.bind(this),
        'order_rejected': this.handleSwiggyOrderRejected.bind(this),
        'order_cancelled': this.handleSwiggyOrderCancelled.bind(this),
        'order_status_updated': this.handleSwiggyStatusUpdated.bind(this)
      }
    };
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    // In production, verify HMAC signature
    // For now, return true for development
    return true;
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(platform, event, payload, signature) {
    try {
      // Verify signature
      if (!this.verifySignature(payload, signature, platform)) {
        throw new Error('Invalid webhook signature');
      }

      // Route to appropriate handler
      const handler = this.eventHandlers[platform]?.[event];
      if (!handler) {
        console.warn(`No handler for ${platform} event: ${event}`);
        return { success: false, message: 'Unknown event type' };
      }

      const result = await handler(payload);
      return { success: true, data: result };
    } catch (error) {
      console.error(`Webhook handling error:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Zomato event handlers
   */
  async handleZomatoOrderCreated(payload) {
    const order = this.transformZomatoOrder(payload);
    await this.orderManager.addOrder(order);
    return { orderId: order.id, status: 'pending' };
  }

  async handleZomatoOrderAccepted(payload) {
    await this.orderManager.updateOrderStatus(payload.order_id, 'preparing');
    return { orderId: payload.order_id, status: 'preparing' };
  }

  async handleZomatoOrderRejected(payload) {
    await this.orderManager.updateOrderStatus(payload.order_id, 'rejected');
    return { orderId: payload.order_id, status: 'rejected' };
  }

  async handleZomatoOrderCancelled(payload) {
    await this.orderManager.updateOrderStatus(payload.order_id, 'cancelled');
    return { orderId: payload.order_id, status: 'cancelled' };
  }

  async handleZomatoStatusUpdated(payload) {
    const statusMap = {
      'confirmed': 'preparing',
      'preparing': 'preparing',
      'ready': 'ready',
      'picked_up': 'picked_up',
      'delivered': 'delivered'
    };
    const newStatus = statusMap[payload.status] || payload.status;
    await this.orderManager.updateOrderStatus(payload.order_id, newStatus);
    return { orderId: payload.order_id, status: newStatus };
  }

  /**
   * Swiggy event handlers
   */
  async handleSwiggyOrderPlaced(payload) {
    const order = this.transformSwiggyOrder(payload);
    await this.orderManager.addOrder(order);
    return { orderId: order.id, status: 'pending' };
  }

  async handleSwiggyOrderAccepted(payload) {
    await this.orderManager.updateOrderStatus(payload.order_id, 'preparing');
    return { orderId: payload.order_id, status: 'preparing' };
  }

  async handleSwiggyOrderRejected(payload) {
    await this.orderManager.updateOrderStatus(payload.order_id, 'rejected');
    return { orderId: payload.order_id, status: 'rejected' };
  }

  async handleSwiggyOrderCancelled(payload) {
    await this.orderManager.updateOrderStatus(payload.order_id, 'cancelled');
    return { orderId: payload.order_id, status: 'cancelled' };
  }

  async handleSwiggyStatusUpdated(payload) {
    const statusMap = {
      'confirmed': 'preparing',
      'preparing': 'preparing',
      'ready': 'ready',
      'picked_up': 'picked_up',
      'delivered': 'delivered'
    };
    const newStatus = statusMap[payload.status] || payload.status;
    await this.orderManager.updateOrderStatus(payload.order_id, newStatus);
    return { orderId: payload.order_id, status: newStatus };
  }

  /**
   * Transform Zomato order to internal format
   */
  transformZomatoOrder(payload) {
    return {
      id: `ZOM-${payload.order_id}`,
      platform: 'Zomato',
      orderId: payload.order_id,
      customer: {
        name: payload.customer_name,
        phone: payload.customer_phone,
        address: payload.delivery_address
      },
      items: payload.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      total: payload.total_amount,
      commission: payload.commission_amount,
      status: 'pending',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: payload.estimated_delivery_time
    };
  }

  /**
   * Transform Swiggy order to internal format
   */
  transformSwiggyOrder(payload) {
    return {
      id: `SWG-${payload.order_id}`,
      platform: 'Swiggy',
      orderId: payload.order_id,
      customer: {
        name: payload.customer_name,
        phone: payload.customer_phone,
        address: payload.delivery_address
      },
      items: payload.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      total: payload.total_amount,
      commission: payload.commission_amount,
      status: 'pending',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: payload.estimated_delivery_time
    };
  }
}

export default AggregatorWebhookHandler;
