// Payment Gateway Interface and Base Class
// Abstract base class for all payment gateway implementations

import { getEncryptionEngine } from '../security/EncryptionEngine.js';
import { getSelfHealingEngine } from '../operations/SelfHealingEngine.js';

/**
 * Payment Status Enum
 */
export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
  TIMEOUT: 'timeout'
};

/**
 * Payment Method Enum
 */
export const PaymentMethod = {
  UPI: 'upi',
  CARD: 'card',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
  EMI: 'emi',
  CASH: 'cash'
};

/**
 * Payment Gateway Base Class
 * All gateway adapters must extend this class
 */
export class PaymentGateway {
  constructor(config = {}) {
    this.config = {
      testMode: config.testMode !== false,
      apiKey: config.apiKey || null,
      apiSecret: config.apiSecret || null,
      merchantId: config.merchantId || null,
      webhookSecret: config.webhookSecret || null,
      ...config
    };
    
    this.encryptionEngine = getEncryptionEngine();
    this.selfHealingEngine = getSelfHealingEngine();
    this.sdkLoaded = false;
    this.initialized = false;
  }

  /**
   * Initialize the gateway
   * Load SDK scripts and validate configuration
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Create a payment order
   * @param {object} orderDetails - Order details
   * @returns {Promise<object>} Payment order response
   */
  async createOrder(orderDetails) {
    throw new Error('createOrder() must be implemented by subclass');
  }

  /**
   * Process payment
   * @param {object} paymentDetails - Payment details
   * @returns {Promise<object>} Payment response
   */
  async processPayment(paymentDetails) {
    throw new Error('processPayment() must be implemented by subclass');
  }

  /**
   * Verify payment signature
   * @param {string} signature - Payment signature
   * @param {object} data - Payment data
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPayment(signature, data) {
    throw new Error('verifyPayment() must be implemented by subclass');
  }

  /**
   * Refund payment
   * @param {string} paymentId - Payment ID
   * @param {number} amount - Amount to refund
   * @param {string} reason - Refund reason
   * @returns {Promise<object>} Refund response
   */
  async refund(paymentId, amount, reason) {
    throw new Error('refund() must be implemented by subclass');
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<object>} Payment status
   */
  async getPaymentStatus(paymentId) {
    throw new Error('getPaymentStatus() must be implemented by subclass');
  }

  /**
   * Load SDK script dynamically
   * @param {string} scriptUrl - SDK script URL
   * @returns {Promise<boolean>} Load result
   */
  async loadSDK(scriptUrl) {
    return new Promise((resolve, reject) => {
      if (this.sdkLoaded) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      
      script.onload = () => {
        this.sdkLoaded = true;
        resolve(true);
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load SDK from ${scriptUrl}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Encrypt sensitive data
   * @param {object} data - Data to encrypt
   * @returns {Promise<string>} Encrypted data
   */
  async encryptData(data) {
    const dataString = JSON.stringify(data);
    const encrypted = await this.encryptionEngine.encrypt(dataString);
    
    if (encrypted.success) {
      return encrypted.encryptedData;
    }
    
    throw new Error('Encryption failed');
  }

  /**
   * Decrypt sensitive数据
   * @param {string} encryptedData - Encrypted data
   * @returns {Promise<object>} Decrypted data
   */
  async decryptData(encryptedData) {
    const decrypted = await this.encryptionEngine.decrypt(encryptedData);
    
    if (decrypted.success) {
      return JSON.parse(decrypted.decryptedData);
    }
    
    throw new Error('Decryption failed');
  }

  /**
   * Execute with retry logic using self-healing
   * @param {function} operation - Operation to execute
   * @param {string} operationType - Operation type for circuit breaker
   * @returns {Promise<object>} Operation result
   */
  async executeWithRetry(operation, operationType = 'payment_gateway') {
    return await this.selfHealingEngine.executeWithHealing(
      operation,
      operationType,
      {
        maxRetries: 3,
        retryDelay: 1000
      }
    );
  }

  /**
   * Validate configuration
   * @returns {object} Validation result
   */
  validateConfig() {
    const errors = [];
    
    if (!this.config.apiKey) {
      errors.push('API key is required');
    }
    
    if (!this.config.apiSecret) {
      errors.push('API secret is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get gateway info
   * @returns {object} Gateway information
   */
  getGatewayInfo() {
    return {
      name: this.constructor.name,
      testMode: this.config.testMode,
      initialized: this.initialized,
      sdkLoaded: this.sdkLoaded
    };
  }

  /**
   * Destroy the gateway instance
   */
  destroy() {
    this.sdkLoaded = false;
    this.initialized = false;
    console.log(`[${this.constructor.name}] Destroyed`);
  }
}

/**
 * Payment Record Model
 */
export class PaymentRecord {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.orderId = data.orderId || null;
    this.gateway = data.gateway || null;
    this.gatewayOrderId = data.gatewayOrderId || null;
    this.amount = data.amount || 0;
    this.currency = data.currency || 'INR';
    this.status = data.status || PaymentStatus.PENDING;
    this.paymentMethod = data.paymentMethod || null;
    this.customerInfo = data.customerInfo || {};
    this.gatewayResponse = data.gatewayResponse || null;
    this.webhookData = data.webhookData || null;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.completedAt = data.completedAt || null;
    this.refundedAt = data.refundedAt || null;
    this.refundAmount = data.refundAmount || 0;
    this.refundReason = data.refundReason || null;
    this.signature = data.signature || null;
    this.verified = data.verified || false;
  }

  /**
   * Generate unique payment ID
   */
  generateId() {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update payment status
   */
  updateStatus(status, additionalData = {}) {
    this.status = status;
    
    if (status === PaymentStatus.COMPLETED) {
      this.completedAt = new Date().toISOString();
    }
    
    if (status === PaymentStatus.REFUNDED) {
      this.refundedAt = new Date().toISOString();
    }
    
    Object.assign(this, additionalData);
  }

  /**
   * Mark as verified
   */
  markVerified() {
    this.verified = true;
  }

  /**
   * To JSON
   */
  toJSON() {
    return {
      id: this.id,
      orderId: this.orderId,
      gateway: this.gateway,
      gatewayOrderId: this.gatewayOrderId,
      amount: this.amount,
      currency: this.currency,
      status: this.status,
      paymentMethod: this.paymentMethod,
      customerInfo: this.customerInfo,
      gatewayResponse: this.gatewayResponse,
      webhookData: this.webhookData,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      refundedAt: this.refundedAt,
      refundAmount: this.refundAmount,
      refundReason: this.refundReason,
      signature: this.signature,
      verified: this.verified
    };
  }

  /**
   * From JSON
   */
  static fromJSON(json) {
    return new PaymentRecord(json);
  }
}

/**
 * Payment Storage
 * Manages payment records in localStorage
 */
export class PaymentStorage {
  constructor() {
    this.storageKey = 'cafeos_payments';
  }

  /**
   * Save payment record
   */
  save(payment) {
    const payments = this.getAll();
    const index = payments.findIndex(p => p.id === payment.id);
    
    if (index >= 0) {
      payments[index] = payment.toJSON();
    } else {
      payments.push(payment.toJSON());
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(payments));
  }

  /**
   * Get payment by ID
   */
  getById(id) {
    const payments = this.getAll();
    const payment = payments.find(p => p.id === id);
    return payment ? PaymentRecord.fromJSON(payment) : null;
  }

  /**
   * Get payments by order ID
   */
  getByOrderId(orderId) {
    const payments = this.getAll();
    return payments
      .filter(p => p.orderId === orderId)
      .map(p => PaymentRecord.fromJSON(p));
  }

  /**
   * Get all payments
   */
  getAll() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[PaymentStorage] Failed to load payments:', error);
      return [];
    }
  }

  /**
   * Delete payment
   */
  delete(id) {
    const payments = this.getAll();
    const filtered = payments.filter(p => p.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Get payment statistics
   */
  getStatistics() {
    const payments = this.getAll();
    
    return {
      total: payments.length,
      byStatus: payments.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {}),
      byGateway: payments.reduce((acc, p) => {
        acc[p.gateway] = (acc[p.gateway] || 0) + 1;
        return acc;
      }, {}),
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      completedAmount: payments
        .filter(p => p.status === PaymentStatus.COMPLETED)
        .reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  }
}

// Singleton instance
let paymentStorageInstance = null;

/**
 * Get the singleton payment storage instance
 */
export function getPaymentStorage() {
  if (!paymentStorageInstance) {
    paymentStorageInstance = new PaymentStorage();
  }
  return paymentStorageInstance;
}

export default PaymentGateway;
