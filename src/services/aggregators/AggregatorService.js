/**
 * Aggregator Service
 * Unified service for managing Zomato and Swiggy integrations
 * Orchestrates API clients, webhook handling, polling, and order management
 */

import ZomatoClient from './ZomatoClient.js';
import SwiggyClient from './SwiggyClient.js';
import AggregatorWebhookHandler from './AggregatorWebhookHandler.js';
import AggregatorOrderManager from './AggregatorOrderManager.js';
import AggregatorPollingService from './AggregatorPollingService.js';

class AggregatorService {
  constructor() {
    this.orderManager = new AggregatorOrderManager();
    this.webhookHandler = new AggregatorWebhookHandler(this.orderManager);
    this.zomatoClient = null;
    this.swiggyClient = null;
    this.pollingService = null;
    this.config = {
      zomato: {
        enabled: false,
        apiKey: '',
        restaurantId: '',
        environment: 'production'
      },
      swiggy: {
        enabled: false,
        apiKey: '',
        restaurantId: '',
        environment: 'production'
      },
      polling: {
        enabled: true,
        interval: 30000 // 30 seconds
      }
    };
    this.initialized = false;
  }

  /**
   * Initialize the service with configuration
   */
  async initialize(config) {
    this.config = { ...this.config, ...config };

    // Initialize Zomato client if enabled
    if (this.config.zomato.enabled && this.config.zomato.apiKey) {
      this.zomatoClient = new ZomatoClient(
        this.config.zomato.apiKey,
        this.config.zomato.restaurantId,
        this.config.zomato.environment
      );
      
      // Validate credentials
      const validation = await this.zomatoClient.validateCredentials();
      if (!validation.valid) {
        console.error('Zomato credentials invalid:', validation.error);
        this.config.zomato.enabled = false;
      }
    }

    // Initialize Swiggy client if enabled
    if (this.config.swiggy.enabled && this.config.swiggy.apiKey) {
      this.swiggyClient = new SwiggyClient(
        this.config.swiggy.apiKey,
        this.config.swiggy.restaurantId,
        this.config.swiggy.environment
      );
      
      // Validate credentials
      const validation = await this.swiggyClient.validateCredentials();
      if (!validation.valid) {
        console.error('Swiggy credentials invalid:', validation.error);
        this.config.swiggy.enabled = false;
      }
    }

    // Initialize polling service
    this.pollingService = new AggregatorPollingService(
      this.zomatoClient,
      this.swiggyClient,
      this.orderManager,
      {
        enabled: this.config.polling.enabled,
        pollingInterval: this.config.polling.interval
      }
    );

    // Start polling
    this.pollingService.start();

    this.initialized = true;
    console.log('Aggregator service initialized');
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if needed
    if (newConfig.zomato?.apiKey || newConfig.swiggy?.apiKey) {
      await this.initialize(this.config);
    }
  }

  /**
   * Get all orders
   */
  getOrders() {
    return this.orderManager.getAllOrders();
  }

  /**
   * Get pending orders
   */
  getPendingOrders() {
    return this.orderManager.getPendingOrders();
  }

  /**
   * Get order by ID
   */
  getOrder(orderId) {
    return this.orderManager.getOrder(orderId);
  }

  /**
   * Accept an order
   */
  async acceptOrder(orderId, preparationTime = 30) {
    const order = this.orderManager.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Call platform-specific API
    if (order.platform === 'Zomato' && this.zomatoClient) {
      await this.zomatoClient.acceptOrder(order.orderId, preparationTime);
    } else if (order.platform === 'Swiggy' && this.swiggyClient) {
      await this.swiggyClient.acceptOrder(order.orderId, preparationTime);
    }

    // Update local status
    await this.orderManager.updateOrderStatus(orderId, 'preparing');
    return { success: true };
  }

  /**
   * Reject an order
   */
  async rejectOrder(orderId, reason = 'Restaurant closed') {
    const order = this.orderManager.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Call platform-specific API
    if (order.platform === 'Zomato' && this.zomatoClient) {
      await this.zomatoClient.rejectOrder(order.orderId, reason);
    } else if (order.platform === 'Swiggy' && this.swiggyClient) {
      await this.swiggyClient.rejectOrder(order.orderId, reason);
    }

    // Update local status
    await this.orderManager.updateOrderStatus(orderId, 'rejected');
    return { success: true };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status) {
    const order = this.orderManager.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Call platform-specific API
    if (order.platform === 'Zomato' && this.zomatoClient) {
      await this.zomatoClient.updateOrderStatus(order.orderId, status);
    } else if (order.platform === 'Swiggy' && this.swiggyClient) {
      await this.swiggyClient.updateOrderStatus(order.orderId, status);
    }

    // Update local status
    await this.orderManager.updateOrderStatus(orderId, status);
    return { success: true };
  }

  /**
   * Sync menu to platform
   */
  async syncMenu(platform, menuItems) {
    const client = platform === 'Zomato' ? this.zomatoClient : this.swiggyClient;
    if (!client) {
      throw new Error(`${platform} client not initialized`);
    }

    // Transform menu items to platform format
    const platformItems = menuItems.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      is_available: item.active && !item.eightySixed,
      image_url: item.imageUrl
    }));

    // Bulk update
    await client.bulkUpdateMenuItems(platformItems);
    return { success: true, synced: platformItems.length };
  }

  /**
   * Get platform statistics
   */
  getStatistics() {
    return this.orderManager.getStatistics();
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    return this.orderManager.addListener(listener);
  }

  /**
   * Handle webhook
   */
  async handleWebhook(platform, event, payload, signature) {
    return this.webhookHandler.handleWebhook(platform, event, payload, signature);
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Stop the service
   */
  stop() {
    if (this.pollingService) {
      this.pollingService.stop();
    }
    this.initialized = false;
  }
}

// Singleton instance
let aggregatorServiceInstance = null;

export function getAggregatorService() {
  if (!aggregatorServiceInstance) {
    aggregatorServiceInstance = new AggregatorService();
  }
  return aggregatorServiceInstance;
}

export default AggregatorService;
