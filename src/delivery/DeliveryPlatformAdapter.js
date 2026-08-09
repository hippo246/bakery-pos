// Delivery Platform Adapter Base Class
// Abstract interface for Zomato, Swiggy, and other delivery platforms

import { getEncryptionEngine } from '../security/EncryptionEngine.js';
import { getSelfHealingEngine } from '../operations/SelfHealingEngine.js';

/**
 * Order Status Enum
 */
export const DeliveryOrderStatus = {
  RECEIVED: 'received',
  ACCEPTED: 'accepted',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

/**
 * Platform Type Enum
 */
export const PlatformType = {
  ZOMATO: 'zomato',
  SWIGGY: 'swiggy',
  DIRECT_DELIVERY: 'direct_delivery'
};

/**
 * Delivery Order Record
 */
export class DeliveryOrderRecord {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.platformOrderId = data.platformOrderId;
    this.platform = data.platform;
    this.status = data.status || DeliveryOrderStatus.RECEIVED;
    this.customerInfo = data.customerInfo || {};
    this.items = data.items || [];
    this.totalAmount = data.totalAmount || 0;
    this.commission = data.commission || 0;
    this.netAmount = data.netAmount || 0;
    this.deliveryAddress = data.deliveryAddress || {};
    this.specialInstructions = data.specialInstructions || '';
    this.orderType = data.orderType || 'DELIVERY';
    this.estimatedDeliveryTime = data.estimatedDeliveryTime;
    this.deliveryPartner = data.deliveryPartner;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.metadata = data.metadata || {};
  }

  generateId() {
    return `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateStatus(status, metadata = {}) {
    this.status = status;
    this.updatedAt = new Date().toISOString();
    this.metadata = { ...this.metadata, ...metadata };
  }

  toJSON() {
    return {
      id: this.id,
      platformOrderId: this.platformOrderId,
      platform: this.platform,
      status: this.status,
      customerInfo: this.customerInfo,
      items: this.items,
      totalAmount: this.totalAmount,
      commission: this.commission,
      netAmount: this.netAmount,
      deliveryAddress: this.deliveryAddress,
      specialInstructions: this.specialInstructions,
      orderType: this.orderType,
      estimatedDeliveryTime: this.estimatedDeliveryTime,
      deliveryPartner: this.deliveryPartner,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  static fromJSON(json) {
    return new DeliveryOrderRecord(json);
  }
}

/**
 * Delivery Platform Storage
 */
class DeliveryOrderStorage {
  constructor() {
    this.storageKey = 'cafeos_delivery_orders';
  }

  save(order) {
    try {
      const orders = this.getAll();
      const existingIndex = orders.findIndex(o => o.id === order.id);
      
      if (existingIndex >= 0) {
        orders[existingIndex] = order.toJSON();
      } else {
        orders.push(order.toJSON());
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(orders));
    } catch (error) {
      console.error('[DeliveryOrderStorage] Failed to save order:', error);
    }
  }

  getById(id) {
    const orders = this.getAll();
    const orderData = orders.find(o => o.id === id);
    return orderData ? DeliveryOrderRecord.fromJSON(orderData) : null;
  }

  getByPlatformOrderId(platformOrderId, platform) {
    const orders = this.getAll();
    const orderData = orders.find(o => 
      o.platformOrderId === platformOrderId && o.platform === platform
    );
    return orderData ? DeliveryOrderRecord.fromJSON(orderData) : null;
  }

  getAll() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('[DeliveryOrderStorage] Failed to load orders:', error);
      return [];
    }
  }

  getByPlatform(platform) {
    const orders = this.getAll();
    return orders
      .filter(o => o.platform === platform)
      .map(o => DeliveryOrderRecord.fromJSON(o));
  }

  getByStatus(status) {
    const orders = this.getAll();
    return orders
      .filter(o => o.status === status)
      .map(o => DeliveryOrderRecord.fromJSON(o));
  }

  delete(id) {
    try {
      const orders = this.getAll();
      const filtered = orders.filter(o => o.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('[DeliveryOrderStorage] Failed to delete order:', error);
    }
  }

  getStatistics() {
    const orders = this.getAll();
    
    return {
      total: orders.length,
      byPlatform: orders.reduce((acc, o) => {
        acc[o.platform] = (acc[o.platform] || 0) + 1;
        return acc;
      }, {}),
      byStatus: orders.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
      }, {}),
      totalRevenue: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      totalCommission: orders.reduce((sum, o) => sum + (o.commission || 0), 0),
      netRevenue: orders.reduce((sum, o) => sum + (o.netAmount || 0), 0)
    };
  }
}

/**
 * Delivery Platform Adapter Base Class
 */
export class DeliveryPlatformAdapter {
  constructor(config = {}) {
    this.config = config;
    this.platformName = '';
    this.encryptionEngine = getEncryptionEngine();
    this.selfHealingEngine = getSelfHealingEngine();
    this.initialized = false;
    this.storage = new DeliveryOrderStorage();
  }

  /**
   * Initialize the platform adapter
   */
  async initialize() {
    try {
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Decrypt API credentials
      if (this.config.apiKey && this.config.apiKeyEncrypted) {
        this.config.apiKey = await this.decryptCredential(this.config.apiKey);
      }

      this.initialized = true;
      console.log(`[${this.platformName}Adapter] Initialized successfully`);
      
      return { success: true };
    } catch (error) {
      console.error(`[${this.platformName}Adapter] Initialization failed:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate platform-specific configuration
   */
  validateConfig() {
    const errors = [];
    
    if (!this.config.apiKey) {
      errors.push('API key is required');
    }
    
    if (!this.config.apiSecret) {
      errors.push('API secret is required');
    }
    
    if (!this.config.restaurantId) {
      errors.push('Restaurant ID is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Encrypt credential
   */
  async encryptCredential(credential) {
    const result = await this.encryptionEngine.encrypt(credential);
    if (result.success) {
      return result.encryptedData;
    }
    throw new Error('Encryption failed');
  }

  /**
   * Decrypt credential
   */
  async decryptCredential(encryptedCredential) {
    const result = await this.encryptionEngine.decrypt(encryptedCredential);
    if (result.success) {
      return result.decryptedData;
    }
    throw new Error('Decryption failed');
  }

  /**
   * Execute operation with self-healing retry
   */
  async executeWithRetry(operation, operationType, options = {}) {
    return await this.selfHealingEngine.executeWithHealing(
      operation,
      operationType,
      {
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 1000
      }
    );
  }

  /**
   * Receive order from platform (via webhook)
   */
  async receiveOrder(orderData) {
    const operation = async () => {
      // Parse platform-specific order format
      const parsedOrder = this.parseOrder(orderData);
      
      // Calculate commission
      const commission = this.calculateCommission(parsedOrder.totalAmount);
      parsedOrder.commission = commission;
      parsedOrder.netAmount = parsedOrder.totalAmount - commission;
      
      // Create delivery order record
      const deliveryOrder = new DeliveryOrderRecord({
        ...parsedOrder,
        platform: this.platformName
      });
      
      // Save to storage
      this.storage.save(deliveryOrder);
      
      // Dispatch event for POS to handle
      window.dispatchEvent(new CustomEvent('deliveryOrderReceived', {
        detail: deliveryOrder.toJSON()
      }));
      
      return {
        success: true,
        order: deliveryOrder.toJSON()
      };
    };

    return await this.executeWithRetry(operation, 'receive_order');
  }

  /**
   * Parse platform-specific order format
   * To be implemented by each adapter
   */
  parseOrder(orderData) {
    throw new Error('parseOrder must be implemented by subclass');
  }

  /**
   * Calculate platform commission
   */
  calculateCommission(totalAmount) {
    const commissionRate = this.config.commissionRate || 0.20; // Default 20%
    return totalAmount * commissionRate;
  }

  /**
   * Update order status on platform
   */
  async updateOrderStatus(platformOrderId, status, metadata = {}) {
    const operation = async () => {
      // Update local record
      const order = this.storage.getByPlatformOrderId(platformOrderId, this.platformName);
      if (order) {
        order.updateStatus(status, metadata);
        this.storage.save(order);
      }
      
      // Send status to platform (to be implemented by each adapter)
      const result = await this.sendStatusToPlatform(platformOrderId, status, metadata);
      
      return result;
    };

    return await this.executeWithRetry(operation, 'update_order_status');
  }

  /**
   * Send status to platform
   * To be implemented by each adapter
   */
  async sendStatusToPlatform(platformOrderId, status, metadata) {
    throw new Error('sendStatusToPlatform must be implemented by subclass');
  }

  /**
   * Sync menu to platform
   */
  async syncMenu(menuData) {
    const operation = async () => {
      // Transform menu to platform format
      const platformMenu = this.transformMenu(menuData);
      
      // Send to platform (to be implemented by each adapter)
      const result = await this.sendMenuToPlatform(platformMenu);
      
      return result;
    };

    return await this.executeWithRetry(operation, 'sync_menu');
  }

  /**
   * Transform menu to platform format
   * To be implemented by each adapter
   */
  transformMenu(menuData) {
    throw new Error('transformMenu must be implemented by subclass');
  }

  /**
   * Send menu to platform
   * To be implemented by each adapter
   */
  async sendMenuToPlatform(platformMenu) {
    throw new Error('sendMenuToPlatform must be implemented by subclass');
  }

  /**
   * Get order status from platform
   */
  async getOrderStatus(platformOrderId) {
    const operation = async () => {
      // Fetch from platform (to be implemented by each adapter)
      const result = await this.fetchOrderStatusFromPlatform(platformOrderId);
      
      return result;
    };

    return await this.executeWithRetry(operation, 'get_order_status');
  }

  /**
   * Fetch order status from platform
   * To be implemented by each adapter
   */
  async fetchOrderStatusFromPlatform(platformOrderId) {
    throw new Error('fetchOrderStatusFromPlatform must be implemented by subclass');
  }

  /**
   * Handle webhook signature verification
   */
  async verifyWebhook(signature, payload) {
    // To be implemented by each adapter
    return { valid: true };
  }

  /**
   * Get supported order types
   */
  getSupportedOrderTypes() {
    return ['DELIVERY', 'TAKEAWAY'];
  }

  /**
   * Get platform-specific order requirements
   */
  getOrderRequirements() {
    return {
      requiresPackaging: true,
      requiresDeliveryPartner: true,
      supportsSpecialInstructions: true,
      supportsContactlessDelivery: true
    };
  }

  /**
   * Destroy the adapter
   */
  destroy() {
    this.initialized = false;
    console.log(`[${this.platformName}Adapter] Destroyed`);
  }
}

// Singleton storage instance
let deliveryOrderStorageInstance = null;

/**
 * Get the singleton delivery order storage instance
 */
export function getDeliveryOrderStorage() {
  if (!deliveryOrderStorageInstance) {
    deliveryOrderStorageInstance = new DeliveryOrderStorage();
  }
  return deliveryOrderStorageInstance;
}

export default DeliveryPlatformAdapter;
