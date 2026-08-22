/**
 * Aggregator Polling Service
 * Periodically fetches orders from Zomato and Swiggy APIs
 * Ensures real-time order updates even without webhooks
 */

class AggregatorPollingService {
  constructor(zomatoClient, swiggyClient, orderManager, options = {}) {
    this.zomatoClient = zomatoClient;
    this.swiggyClient = swiggyClient;
    this.orderManager = orderManager;
    this.pollingInterval = options.pollingInterval || 30000; // 30 seconds default
    this.enabled = options.enabled !== false;
    this.intervals = {
      zomato: null,
      swiggy: null
    };
    this.lastSync = {
      zomato: null,
      swiggy: null
    };
  }

  /**
   * Start polling for both platforms
   */
  start() {
    if (!this.enabled) return;

    console.log('Starting aggregator polling service...');
    
    // Poll Zomato
    if (this.zomatoClient) {
      this.intervals.zomato = setInterval(() => {
        this.pollZomato();
      }, this.pollingInterval);
      this.pollZomato(); // Initial poll
    }

    // Poll Swiggy
    if (this.swiggyClient) {
      this.intervals.swiggy = setInterval(() => {
        this.pollSwiggy();
      }, this.pollingInterval);
      this.pollSwiggy(); // Initial poll
    }
  }

  /**
   * Stop polling
   */
  stop() {
    console.log('Stopping aggregator polling service...');
    
    if (this.intervals.zomato) {
      clearInterval(this.intervals.zomato);
      this.intervals.zomato = null;
    }
    
    if (this.intervals.swiggy) {
      clearInterval(this.intervals.swiggy);
      this.intervals.swiggy = null;
    }
  }

  /**
   * Poll Zomato for new orders
   */
  async pollZomato() {
    try {
      const response = await this.zomatoClient.getActiveOrders();
      this.lastSync.zomato = new Date();
      
      if (response && response.orders) {
        await this.processOrders(response.orders, 'Zomato');
      }
    } catch (error) {
      console.error('Error polling Zomato:', error);
    }
  }

  /**
   * Poll Swiggy for new orders
   */
  async pollSwiggy() {
    try {
      const response = await this.swiggyClient.getActiveOrders();
      this.lastSync.swiggy = new Date();
      
      if (response && response.orders) {
        await this.processOrders(response.orders, 'Swiggy');
      }
    } catch (error) {
      console.error('Error polling Swiggy:', error);
    }
  }

  /**
   * Process orders from API response
   */
  async processOrders(apiOrders, platform) {
    for (const apiOrder of apiOrders) {
      const existingOrder = this.orderManager.getOrder(
        `${platform === 'Zomato' ? 'ZOM' : 'SWG'}-${apiOrder.order_id}`
      );

      if (!existingOrder) {
        // New order - add to manager
        const order = this.transformApiOrder(apiOrder, platform);
        await this.orderManager.addOrder(order);
        console.log(`New ${platform} order: ${order.orderId}`);
      } else {
        // Existing order - check for status updates
        if (existingOrder.status !== apiOrder.status) {
          await this.orderManager.updateOrderStatus(
            existingOrder.id,
            this.mapApiStatus(apiOrder.status)
          );
          console.log(`Updated ${platform} order ${existingOrder.orderId} status to ${apiOrder.status}`);
        }
      }
    }
  }

  /**
   * Transform API order to internal format
   */
  transformApiOrder(apiOrder, platform) {
    return {
      id: `${platform === 'Zomato' ? 'ZOM' : 'SWG'}-${apiOrder.order_id}`,
      platform: platform,
      orderId: apiOrder.order_id,
      customer: {
        name: apiOrder.customer_name || 'Guest',
        phone: apiOrder.customer_phone,
        address: apiOrder.delivery_address
      },
      items: apiOrder.items?.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })) || [],
      total: apiOrder.total_amount || 0,
      commission: apiOrder.commission_amount || 0,
      status: this.mapApiStatus(apiOrder.status),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: apiOrder.estimated_delivery_time
    };
  }

  /**
   * Map API status to internal status
   */
  mapApiStatus(apiStatus) {
    const statusMap = {
      'pending': 'pending',
      'confirmed': 'preparing',
      'preparing': 'preparing',
      'ready_for_pickup': 'ready',
      'picked_up': 'picked_up',
      'delivered': 'delivered',
      'cancelled': 'cancelled',
      'rejected': 'rejected'
    };
    return statusMap[apiStatus] || 'pending';
  }

  /**
   * Get last sync timestamps
   */
  getLastSync() {
    return { ...this.lastSync };
  }

  /**
   * Update polling interval
   */
  setPollingInterval(interval) {
    this.pollingInterval = interval;
    this.stop();
    this.start();
  }

  /**
   * Enable/disable polling
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }
}

export default AggregatorPollingService;
