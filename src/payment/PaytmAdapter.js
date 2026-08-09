// Paytm Payment Gateway Adapter
// India-focused payment gateway with wallet and UPI support

import { PaymentGateway, PaymentStatus, PaymentMethod } from './PaymentGateway.js';

export class PaytmAdapter extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.gatewayName = 'paytm';
    this.sdkUrl = 'https://securegw.paytm.in/merchantpgpui/checkoutjs/checkouts.js';
  }

  /**
   * Initialize Paytm
   * Load SDK and validate configuration
   */
  async initialize() {
    try {
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Load Paytm SDK
      await this.loadSDK(this.sdkUrl);
      
      this.initialized = true;
      console.log('[PaytmAdapter] Initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[PaytmAdapter] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Paytm order
   * In production, this would call your backend API which then calls Paytm API
   */
  async createOrder(orderDetails) {
    const operation = async () => {
      const { amount, currency = 'INR', orderId, customerInfo } = orderDetails;
      
      // In production, this would be a backend API call
      // For test mode, we'll simulate the response
      if (this.config.testMode) {
        const txnToken = this.generateTestTxnToken();
        
        return {
          success: true,
          orderId: orderId || `order_${Date.now()}`,
          txnToken,
          amount,
          currency,
          mid: this.config.merchantId,
          customerInfo
        };
      }
      
      // Production implementation would call backend API
      // const response = await fetch('/api/payments/paytm/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, currency, orderId, customerInfo })
      // });
      // const data = await response.json();
      // return data;
      
      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'paytm_create_order');
  }

  /**
   * Process payment using Paytm checkout
   */
  async processPayment(paymentDetails) {
    const operation = async () => {
      const {
        orderId,
        txnToken,
        amount,
        currency = 'INR',
        customerInfo,
        paymentMethod,
        theme
      } = paymentDetails;

      if (!window.Paytm) {
        throw new Error('Paytm SDK not loaded');
      }

      const config = {
        root: '',
        flowData: {
          merchant: {
            name: customerInfo?.businessName || 'Cafe OS',
            mid: this.config.merchantId,
            order: orderId,
            amount: amount.toString(),
            txnToken: txnToken,
            paymentMode: paymentMethod || 'UPI'
          },
          user: {
            name: customerInfo?.name || '',
            email: customerInfo?.email || '',
            phone: customerInfo?.phone || ''
          }
        },
        integration: {
          platform: 'WEB',
          type: 'CUSTOM'
        },
        theme: {
          color: theme?.color || '#E63946',
          backGroundColor: '#FFFFFF'
        },
        handler: {
          notifyMerchant: (eventName, data) => {
            this.handlePaymentEvent(eventName, data, paymentDetails);
          }
        }
      };

      return new Promise((resolve, reject) => {
        try {
          const paytm = new window.Paytm(config);
          
          paytm.showPaytmPopup(config.root);
          
          // Resolve with pending status (actual result comes via handler)
          resolve({
            success: true,
            status: PaymentStatus.PROCESSING,
            orderId,
            message: 'Payment modal opened'
          });
        } catch (error) {
          reject({
            success: false,
            error: error.message
          });
        }
      });
    };

    return await this.executeWithRetry(operation, 'paytm_process_payment');
  }

  /**
   * Handle payment events
   */
  handlePaymentEvent(eventName, data, paymentDetails) {
    console.log('[PaytmAdapter] Payment event:', eventName, data);
    
    if (eventName === 'APP_CLOSED') {
      // User closed the payment modal
      window.dispatchEvent(new CustomEvent('paymentFailure', {
        detail: {
          gateway: this.gatewayName,
          error: 'Payment cancelled by user',
          paymentDetails
        }
      }));
    } else if (eventName === 'TRANSACTION_SUCCESS') {
      // Payment successful
      window.dispatchEvent(new CustomEvent('paymentSuccess', {
        detail: {
          gateway: this.gatewayName,
          transactionId: data.TXNID,
          orderId: data.ORDERID,
          amount: data.TXNAMOUNT,
          paymentDetails
        }
      }));
    } else if (eventName === 'TRANSACTION_FAILURE') {
      // Payment failed
      window.dispatchEvent(new CustomEvent('paymentFailure', {
        detail: {
          gateway: this.gatewayName,
          error: data.RESPMSG,
          code: data.RESPCODE,
          paymentDetails
        }
      }));
    }
  }

  /**
   * Verify Paytm checksum
   * Paytm uses a specific checksum algorithm for verification
   */
  async verifyPayment(signature, data) {
    try {
      // In production, this should be done on the backend
      // Paytm provides a checksum verification library
      
      const { ORDERID, TXNID, BANKTXNID, TXNAMOUNT, CURRENCY, STATUS, RESPCODE, TXNDATE, GATEWAYNAME, BANKNAME, PAYMENTMODE } = data;
      
      if (!ORDERID || !TXNID || !TXNAMOUNT) {
        return { valid: false, reason: 'Missing required fields' };
      }

      // In production, use backend to verify checksum
      // const response = await fetch('/api/payments/paytm/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      // const result = await response.json();
      // return result;

      // For test mode, accept all signatures
      if (this.config.testMode) {
        return { valid: true, testMode: true };
      }

      // Client-side checksum verification (not recommended for production)
      const checksumString = this.generateChecksumString(data);
      const calculatedChecksum = await this.generateChecksum(checksumString, this.config.apiSecret);
      const isValid = calculatedChecksum === signature;
      
      return { valid: isValid };
    } catch (error) {
      console.error('[PaytmAdapter] Verification failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Generate checksum string for Paytm
   */
  generateChecksumString(data) {
    // Paytm checksum string format
    const params = [
      data.ORDERID,
      data.TXNID,
      data.TXNAMOUNT,
      data.CURRENCY,
      data.STATUS,
      data.RESPCODE,
      data.TXNDATE,
      data.GATEWAYNAME,
      data.BANKNAME,
      data.PAYMENTMODE
    ];
    
    return params.join('|');
  }

  /**
   * Generate Paytm checksum
   * Paytm uses a specific checksum algorithm
   */
  async generateChecksum(string, key) {
    // Paytm checksum is SHA256 hash of (string + key)
    const encoder = new TextEncoder();
    const data = encoder.encode(string + key);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Refund payment
   */
  async refund(paymentId, amount, reason) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch('/api/payments/paytm/refund', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paymentId, amount, reason })
      // });
      // const data = await response.json();
      // return data;

      if (this.config.testMode) {
        return {
          success: true,
          refundId: `refund_${Date.now()}`,
          paymentId,
          amount,
          reason,
          status: 'processed'
        };
      }

      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'paytm_refund');
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch(`/api/payments/paytm/status/${paymentId}`);
      // const data = await response.json();
      // return data;

      if (this.config.testMode) {
        return {
          success: true,
          paymentId,
          status: PaymentStatus.COMPLETED,
          amount: 0,
          currency: 'INR'
        };
      }

      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'paytm_status');
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      PaymentMethod.UPI,
      PaymentMethod.WALLET,
      PaymentMethod.NET_BANKING,
      PaymentMethod.CARD
    ];
  }

  /**
   * Validate Paytm-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.merchantId) {
      errors.push('Paytm Merchant ID is required');
    }
    
    if (!this.config.apiKey) {
      errors.push('Paytm API key is required');
    }
    
    if (!this.config.apiSecret) {
      errors.push('Paytm API secret is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate test transaction token
   */
  generateTestTxnToken() {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get test wallet details for testing
   */
  getTestWallets() {
    return [
      {
        name: 'Paytm Wallet',
        phone: '7777777777',
        balance: 10000
      },
      {
        name: 'Test Wallet',
        phone: '8888888888',
        balance: 5000
      }
    ];
  }

  /**
   * Get test UPI handles for testing
   */
  getTestUPIHandles() {
    return [
      'test@paytm',
      'customer@upi',
      'success@paytm'
    ];
  }
}

export default PaytmAdapter;
