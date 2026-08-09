// Delivery Platform Factory
// Factory pattern for creating and managing delivery platform instances

import { ZomatoAdapter } from './ZomatoAdapter.js';
import { SwiggyAdapter } from './SwiggyAdapter.js';
import { PlatformType } from './DeliveryPlatformAdapter.js';
import { getEncryptionEngine } from '../security/EncryptionEngine.js';

/**
 * Platform configuration
 */
class PlatformConfig {
  constructor() {
    this.configs = new Map();
    this.loadFromStorage();
  }

  /**
   * Load configurations from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cafeos_delivery_platform_configs');
      if (stored) {
        const configs = JSON.parse(stored);
        Object.entries(configs).forEach(([type, config]) => {
          this.configs.set(type, config);
        });
      }
    } catch (error) {
      console.error('[PlatformConfig] Failed to load configs:', error);
    }
  }

  /**
   * Save configurations to localStorage
   */
  saveToStorage() {
    try {
      const configs = Object.fromEntries(this.configs);
      localStorage.setItem('cafeos_delivery_platform_configs', JSON.stringify(configs));
    } catch (error) {
      console.error('[PlatformConfig] Failed to save configs:', error);
    }
  }

  /**
   * Set platform configuration
   */
  setConfig(platformType, config) {
    this.configs.set(platformType, config);
    this.saveToStorage();
  }

  /**
   * Get platform configuration
   */
  getConfig(platformType) {
    return this.configs.get(platformType);
  }

  /**
   * Get all configurations
   */
  getAllConfigs() {
    return Object.fromEntries(this.configs);
  }

  /**
   * Remove platform configuration
   */
  removeConfig(platformType) {
    this.configs.delete(platformType);
    this.saveToStorage();
  }

  /**
   * Check if platform is configured
   */
  isConfigured(platformType) {
    const config = this.configs.get(platformType);
    return config && config.enabled;
  }
}

/**
 * Delivery Platform Factory
 */
export class DeliveryPlatformFactory {
  constructor() {
    this.platformConfig = new PlatformConfig();
    this.instances = new Map();
    this.encryptionEngine = getEncryptionEngine();
    this.activePlatforms = [];
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_delivery_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.activePlatforms = parsed.activePlatforms || [];
      }
    } catch (error) {
      console.error('[DeliveryPlatformFactory] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        activePlatforms: this.activePlatforms
      };
      localStorage.setItem('cafeos_delivery_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('[DeliveryPlatformFactory] Failed to save settings:', error);
    }
  }

  /**
   * Create platform instance
   */
  createPlatform(platformType, config = {}) {
    const platformConfig = this.platformConfig.getConfig(platformType) || {};
    const mergedConfig = { ...platformConfig, ...config };

    switch (platformType) {
      case PlatformType.ZOMATO:
        return new ZomatoAdapter(mergedConfig);
      case PlatformType.SWIGGY:
        return new SwiggyAdapter(mergedConfig);
      default:
        throw new Error(`Unsupported platform type: ${platformType}`);
    }
  }

  /**
   * Get or create platform instance (singleton per type)
   */
  async getPlatform(platformType = null) {
    // Use first active platform if not specified
    const type = platformType || this.activePlatforms[0];

    if (!type) {
      throw new Error('No platform specified and no active platforms configured');
    }

    // Check if platform is configured
    if (!this.platformConfig.isConfigured(type)) {
      throw new Error(`Platform ${type} is not configured`);
    }

    // Return existing instance if available
    if (this.instances.has(type)) {
      return this.instances.get(type);
    }

    // Create new instance
    const platform = this.createPlatform(type);
    await platform.initialize();
    this.instances.set(type, platform);

    return platform;
  }

  /**
   * Configure platform
   */
  async configurePlatform(platformType, config) {
    // Encrypt sensitive credentials
    if (config.apiKey) {
      config.apiKeyEncrypted = await this.encryptionEngine.encrypt(config.apiKey);
      config.apiKey = config.apiKeyEncrypted.encryptedData;
    }
    
    if (config.apiSecret) {
      config.apiSecretEncrypted = await this.encryptionEngine.encrypt(config.apiSecret);
      config.apiSecret = config.apiSecretEncrypted.encryptedData;
    }

    if (config.webhookSecret) {
      config.webhookSecretEncrypted = await this.encryptionEngine.encrypt(config.webhookSecret);
      config.webhookSecret = config.webhookSecretEncrypted.encryptedData;
    }

    this.platformConfig.setConfig(platformType, config);
    
    // Add to active platforms if not already active
    if (!this.activePlatforms.includes(platformType)) {
      this.activePlatforms.push(platformType);
      this.saveSettings();
    }

    // Re-initialize platform if instance exists
    if (this.instances.has(platformType)) {
      const existingInstance = this.instances.get(platformType);
      existingInstance.destroy();
      this.instances.delete(platformType);
    }
  }

  /**
   * Enable platform
   */
  enablePlatform(platformType) {
    const config = this.platformConfig.getConfig(platformType);
    if (config) {
      config.enabled = true;
      this.platformConfig.setConfig(platformType, config);
      
      if (!this.activePlatforms.includes(platformType)) {
        this.activePlatforms.push(platformType);
        this.saveSettings();
      }
    }
  }

  /**
   * Disable platform
   */
  disablePlatform(platformType) {
    const config = this.platformConfig.getConfig(platformType);
    if (config) {
      config.enabled = false;
      this.platformConfig.setConfig(platformType, config);
      
      this.activePlatforms = this.activePlatforms.filter(p => p !== platformType);
      this.saveSettings();
    }

    // Destroy instance if exists
    if (this.instances.has(platformType)) {
      const instance = this.instances.get(platformType);
      instance.destroy();
      this.instances.delete(platformType);
    }
  }

  /**
   * Get active platforms
   */
  getActivePlatforms() {
    return this.activePlatforms;
  }

  /**
   * Get available platforms
   */
  getAvailablePlatforms() {
    const available = [];
    
    [PlatformType.ZOMATO, PlatformType.SWIGGY].forEach(type => {
      if (this.platformConfig.isConfigured(type)) {
        available.push(type);
      }
    });
    
    return available;
  }

  /**
   * Get platform statistics
   */
  getPlatformStatistics() {
    const storage = this.platformConfig;
    const stats = {};

    [PlatformType.ZOMATO, PlatformType.SWIGGY].forEach(type => {
      const config = storage.getConfig(type);
      if (config) {
        stats[type] = {
          enabled: config.enabled,
          configured: true,
          testMode: config.testMode || false
        };
      } else {
        stats[type] = {
          enabled: false,
          configured: false,
          testMode: false
        };
      }
    });

    return stats;
  }

  /**
   * Process order with platform routing
   */
  async processOrder(orderData, platformType = null) {
    const platform = await this.getPlatform(platformType);
    return await platform.receiveOrder(orderData);
  }

  /**
   * Update order status on platform
   */
  async updateOrderStatus(platformOrderId, status, platformType = null, metadata = {}) {
    const platform = await this.getPlatform(platformType);
    return await platform.updateOrderStatus(platformOrderId, status, metadata);
  }

  /**
   * Sync menu to platform
   */
  async syncMenu(menuData, platformType = null) {
    const platform = await this.getPlatform(platformType);
    return await platform.syncMenu(menuData);
  }

  /**
   * Get order status from platform
   */
  async getOrderStatus(platformOrderId, platformType = null) {
    const platform = await this.getPlatform(platformType);
    return await platform.getOrderStatus(platformOrderId);
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhook(signature, payload, platformType) {
    const platform = await this.getPlatform(platformType);
    return await platform.verifyWebhook(signature, payload);
  }

  /**
   * Handle webhook from platform
   */
  async handleWebhook(platformType, signature, payload) {
    try {
      // Verify webhook signature
      const verification = await this.verifyWebhook(signature, payload, platformType);
      
      if (!verification.valid) {
        throw new Error('Webhook signature verification failed');
      }

      // Process the webhook
      const platform = await this.getPlatform(platformType);
      
      // Determine webhook type (order, status, etc.)
      const webhookType = payload.type || 'order';
      
      switch (webhookType) {
        case 'order':
          return await platform.receiveOrder(payload);
        case 'status_update':
          return await platform.updateOrderStatus(
            payload.order_id,
            payload.status,
            payload.metadata
          );
        default:
          throw new Error(`Unknown webhook type: ${webhookType}`);
      }
    } catch (error) {
      console.error('[DeliveryPlatformFactory] Webhook handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get platform info
   */
  getPlatformInfo(platformType) {
    const platform = this.createPlatform(platformType);
    return platform.getPlatformInfo();
  }

  /**
   * Get all platform info
   */
  getAllPlatformInfo() {
    const info = {};
    
    [PlatformType.ZOMATO, PlatformType.SWIGGY].forEach(type => {
      try {
        info[type] = this.getPlatformInfo(type);
      } catch (error) {
        info[type] = { error: error.message };
      }
    });
    
    return info;
  }

  /**
   * Destroy all platform instances
   */
  destroy() {
    this.instances.forEach((platform) => {
      platform.destroy();
    });
    this.instances.clear();
    console.log('[DeliveryPlatformFactory] Destroyed');
  }
}

// Singleton instance
let deliveryPlatformFactoryInstance = null;

/**
 * Get the singleton delivery platform factory instance
 */
export function getDeliveryPlatformFactory() {
  if (!deliveryPlatformFactoryInstance) {
    deliveryPlatformFactoryInstance = new DeliveryPlatformFactory();
  }
  return deliveryPlatformFactoryInstance;
}

export default DeliveryPlatformFactory;
