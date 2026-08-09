// Payment Gateway Factory
// Factory pattern for creating and managing payment gateway instances

import { RazorpayAdapter } from './RazorpayAdapter.js';
import { PaytmAdapter } from './PaytmAdapter.js';
import { StripeAdapter } from './StripeAdapter.js';
import { PhonePeAdapter } from './PhonePeAdapter.js';
import { CashfreeAdapter } from './CashfreeAdapter.js';
import { PaymentMethod } from './PaymentGateway.js';

/**
 * Supported gateway types
 */
export const GatewayType = {
  RAZORPAY: 'razorpay',
  PAYTM: 'paytm',
  STRIPE: 'stripe',
  PHONEPE: 'phonepe',
  CASHFREE: 'cashfree',
  CASH: 'cash'
};

/**
 * Gateway configuration
 */
class GatewayConfig {
  constructor() {
    this.configs = new Map();
    this.loadFromStorage();
  }

  /**
   * Load configurations from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cafeos_gateway_configs');
      if (stored) {
        const configs = JSON.parse(stored);
        Object.entries(configs).forEach(([type, config]) => {
          this.configs.set(type, config);
        });
      }
    } catch (error) {
      console.error('[GatewayConfig] Failed to load configs:', error);
    }
  }

  /**
   * Save configurations to localStorage
   */
  saveToStorage() {
    try {
      const configs = Object.fromEntries(this.configs);
      localStorage.setItem('cafeos_gateway_configs', JSON.stringify(configs));
    } catch (error) {
      console.error('[GatewayConfig] Failed to save configs:', error);
    }
  }

  /**
   * Set gateway configuration
   */
  setConfig(gatewayType, config) {
    this.configs.set(gatewayType, config);
    this.saveToStorage();
  }

  /**
   * Get gateway configuration
   */
  getConfig(gatewayType) {
    return this.configs.get(gatewayType);
  }

  /**
   * Get all configurations
   */
  getAllConfigs() {
    return Object.fromEntries(this.configs);
  }

  /**
   * Remove gateway configuration
   */
  removeConfig(gatewayType) {
    this.configs.delete(gatewayType);
    this.saveToStorage();
  }

  /**
   * Check if gateway is configured
   */
  isConfigured(gatewayType) {
    const config = this.configs.get(gatewayType);
    return config && config.enabled;
  }
}

/**
 * Payment Gateway Factory
 */
export class PaymentGatewayFactory {
  constructor() {
    this.gatewayConfig = new GatewayConfig();
    this.instances = new Map();
    this.primaryGateway = null;
    this.backupGateway = null;
    this.failureRates = new Map();
    this.loadSettings();
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const settings = localStorage.getItem('cafeos_payment_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.primaryGateway = parsed.primaryGateway;
        this.backupGateway = parsed.backupGateway;
        this.failureRates = new Map(parsed.failureRates || []);
      }
    } catch (error) {
      console.error('[PaymentGatewayFactory] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      const settings = {
        primaryGateway: this.primaryGateway,
        backupGateway: this.backupGateway,
        failureRates: Array.from(this.failureRates.entries())
      };
      localStorage.setItem('cafeos_payment_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('[PaymentGatewayFactory] Failed to save settings:', error);
    }
  }

  /**
   * Create gateway instance
   */
  createGateway(gatewayType, config = {}) {
    console.log('[PaymentGatewayFactory] Creating gateway for type:', gatewayType);
    const gatewayConfig = this.gatewayConfig.getConfig(gatewayType) || {};
    const mergedConfig = { ...gatewayConfig, ...config };

    switch (gatewayType) {
      case GatewayType.RAZORPAY:
        console.log('[PaymentGatewayFactory] Creating RazorpayAdapter');
        return new RazorpayAdapter(mergedConfig);
      case GatewayType.PAYTM:
        console.log('[PaymentGatewayFactory] Creating PaytmAdapter');
        return new PaytmAdapter(mergedConfig);
      case GatewayType.STRIPE:
        console.log('[PaymentGatewayFactory] Creating StripeAdapter');
        return new StripeAdapter(mergedConfig);
      case GatewayType.PHONEPE:
        console.log('[PaymentGatewayFactory] Creating PhonePeAdapter');
        return new PhonePeAdapter(mergedConfig);
      case GatewayType.CASHFREE:
        console.log('[PaymentGatewayFactory] Creating CashfreeAdapter');
        return new CashfreeAdapter(mergedConfig);
      default:
        console.error('[PaymentGatewayFactory] Unknown gateway type:', gatewayType);
        throw new Error(`Unknown gateway type: ${gatewayType}`);
    }
  }

  /**
   * Get or create gateway instance (singleton per type)
   */
  async getGateway(gatewayType = null) {
    // Use primary gateway if not specified
    const type = gatewayType || this.primaryGateway;

    console.log('[PaymentGatewayFactory] Getting gateway for type:', type, 'Primary:', this.primaryGateway);

    if (!type) {
      // Default to Razorpay if no primary gateway set
      console.log('[PaymentGatewayFactory] No gateway specified, defaulting to Razorpay');
      const razorpayConfig = this.gatewayConfig.getConfig(GatewayType.RAZORPAY);
      if (razorpayConfig && razorpayConfig.enabled) {
        this.primaryGateway = GatewayType.RAZORPAY;
        this.saveSettings();
      } else {
        // Check if there's any configured gateway
        const allConfigs = this.gatewayConfig.getAllConfigs();
        const configuredGateways = Object.keys(allConfigs).filter(key => allConfigs[key].enabled);
        
        if (configuredGateways.length > 0) {
          console.log('[PaymentGatewayFactory] Found configured gateway:', configuredGateways[0]);
          this.primaryGateway = configuredGateways[0];
          this.saveSettings();
        } else {
          throw new Error('No payment gateway configured. Please configure Razorpay first using the "Razorpay Config" button in the POS top bar.');
        }
      }
    }

    // Check if gateway is configured
    const config = this.gatewayConfig.getConfig(type);
    console.log('[PaymentGatewayFactory] Gateway config:', config);
    
    if (!config || !config.enabled) {
      throw new Error(`Gateway ${type} is not configured or not enabled. Please configure it first.`);
    }

    // Validate required config fields
    if (!config.apiKey) {
      throw new Error(`Gateway ${type} is missing API key. Please configure it first.`);
    }

    // Return existing instance if available
    if (this.instances.has(type)) {
      console.log('[PaymentGatewayFactory] Returning existing instance for:', type);
      return this.instances.get(type);
    }

    // Create new instance
    console.log('[PaymentGatewayFactory] Creating new instance for:', type);
    const gateway = this.createGateway(type);
    await gateway.initialize();
    this.instances.set(type, gateway);

    return gateway;
  }

  /**
   * Get gateway based on payment method
   */
  async getGatewayForPaymentMethod(paymentMethod) {
    // Map payment methods to preferred gateways
    // PhonePe is preferred for UPI (highest UPI success rate)
    const methodGatewayMap = {
      [PaymentMethod.UPI]: this.primaryGateway || GatewayType.PHONEPE,
      [PaymentMethod.CARD]: this.primaryGateway || GatewayType.RAZORPAY,
      [PaymentMethod.WALLET]: this.primaryGateway || GatewayType.PAYTM,
      [PaymentMethod.NET_BANKING]: this.primaryGateway || GatewayType.CASHFREE,
      [PaymentMethod.EMI]: GatewayType.CASHFREE
    };

    const gatewayType = methodGatewayMap[paymentMethod] || this.primaryGateway;
    return await this.getGateway(gatewayType);
  }

  /**
   * Process payment with automatic failover
   */
  async processPaymentWithFailover(paymentDetails) {
    const primaryGateway = await this.getGateway();
    
    try {
      const result = await primaryGateway.processPayment(paymentDetails);
      this.recordSuccess(primaryGateway.constructor.name);
      return result;
    } catch (error) {
      console.error('[PaymentGatewayFactory] Primary gateway failed:', error);
      this.recordFailure(primaryGateway.constructor.name);

      // Check if failover is needed
      if (this.shouldFailover(primaryGateway.constructor.name)) {
        if (this.backupGateway && this.backupGateway !== this.primaryGateway) {
          console.log('[PaymentGatewayFactory] Failing over to backup gateway');
          const backupGatewayInstance = await this.getGateway(this.backupGateway);
          
          try {
            const result = await backupGatewayInstance.processPayment(paymentDetails);
            this.recordSuccess(backupGatewayInstance.constructor.name);
            return result;
          } catch (backupError) {
            console.error('[PaymentGatewayFactory] Backup gateway also failed:', backupError);
            this.recordFailure(backupGatewayInstance.constructor.name);
            throw new Error('All payment gateways failed');
          }
        }
      }

      throw error;
    }
  }

  /**
   * Record successful payment
   */
  recordSuccess(gatewayName) {
    const stats = this.failureRates.get(gatewayName) || { success: 0, failure: 0 };
    stats.success++;
    this.failureRates.set(gatewayName, stats);
    this.saveSettings();
  }

  /**
   * Record failed payment
   */
  recordFailure(gatewayName) {
    const stats = this.failureRates.get(gatewayName) || { success: 0, failure: 0 };
    stats.failure++;
    this.failureRates.set(gatewayName, stats);
    this.saveSettings();
  }

  /**
   * Calculate failure rate
   */
  getFailureRate(gatewayName) {
    const stats = this.failureRates.get(gatewayName);
    if (!stats || stats.success + stats.failure === 0) {
      return 0;
    }
    return stats.failure / (stats.success + stats.failure);
  }

  /**
   * Check if failover should occur
   */
  shouldFailover(gatewayName) {
    const failureRate = this.getFailureRate(gatewayName);
    return failureRate > 0.5; // Failover if >50% failure rate
  }

  /**
   * Set primary gateway
   */
  setPrimaryGateway(gatewayType) {
    this.primaryGateway = gatewayType;
    this.saveSettings();
  }

  /**
   * Set backup gateway
   */
  setBackupGateway(gatewayType) {
    this.backupGateway = gatewayType;
    this.saveSettings();
  }

  /**
   * Configure gateway
   */
  configureGateway(gatewayType, config) {
    this.gatewayConfig.setConfig(gatewayType, config);
    
    // If this is the first configured gateway, set as primary
    if (!this.primaryGateway) {
      this.setPrimaryGateway(gatewayType);
    }
  }

  /**
   * Get gateway statistics
   */
  getGatewayStats() {
    const stats = {};
    
    this.failureRates.forEach((value, key) => {
      stats[key] = {
        success: value.success,
        failure: value.failure,
        total: value.success + value.failure,
        failureRate: this.getFailureRate(key)
      };
    });
    
    return stats;
  }

  /**
   * Get available gateways
   */
  getAvailableGateways() {
    const available = [];
    
    console.log('[PaymentGatewayFactory] Checking available gateways...');
    console.log('[PaymentGatewayFactory] All configs:', this.gatewayConfig.getAllConfigs());
    
    [GatewayType.RAZORPAY, GatewayType.PAYTM, GatewayType.STRIPE, GatewayType.PHONEPE, GatewayType.CASHFREE].forEach(type => {
      const config = this.gatewayConfig.getConfig(type);
      console.log(`[PaymentGatewayFactory] Checking ${type}:`, config);
      if (config && config.enabled) {
        available.push(type);
        console.log(`[PaymentGatewayFactory] ${type} is available`);
      }
    });
    
    console.log('[PaymentGatewayFactory] Available gateways:', available);
    return available;
  }

  /**
   * Get supported payment methods for gateway
   */
  getSupportedPaymentMethods(gatewayType) {
    const gateway = this.createGateway(gatewayType);
    return gateway.getSupportedPaymentMethods();
  }

  /**
   * Reset failure statistics
   */
  resetFailureStats() {
    this.failureRates.clear();
    this.saveSettings();
  }

  /**
   * Destroy all gateway instances
   */
  destroy() {
    this.instances.forEach((gateway) => {
      gateway.destroy();
    });
    this.instances.clear();
    console.log('[PaymentGatewayFactory] Destroyed');
  }
}

// Singleton instance
let paymentGatewayFactoryInstance = null;

/**
 * Get the singleton payment gateway factory instance
 */
export function getPaymentGatewayFactory() {
  if (!paymentGatewayFactoryInstance) {
    paymentGatewayFactoryInstance = new PaymentGatewayFactory();
  }
  return paymentGatewayFactoryInstance;
}

export default PaymentGatewayFactory;
