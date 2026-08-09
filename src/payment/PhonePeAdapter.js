// PhonePe Payment Gateway Adapter
// UPI-focused payment gateway with highest UPI success rate in India

import { PaymentGateway, PaymentStatus, PaymentMethod } from './PaymentGateway.js';

export class PhonePeAdapter extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.gatewayName = 'phonepe';
    this.sdkUrl = 'https://mercury-uat.phonepe.com/static/pg/checkout/js/phonepe-sdk.js';
  }

  /**
   * Initialize PhonePe
   * Load SDK and validate configuration
   */
  async initialize() {
    try {
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Load PhonePe SDK
      await this.loadSDK(this.sdkUrl);
      
      this.initialized = true;
      console.log('[PhonePeAdapter] Initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[PhonePeAdapter] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create PhonePe payment request
   * In production, this would call your backend API which then calls PhonePe API
   */
  async createOrder(orderDetails) {
    const operation = async () => {
      const { amount, currency = 'INR', orderId, customerInfo } = orderDetails;
      
      // Convert amount to paise (PhonePe uses smallest currency unit)
      const amountInPaise = Math.round(amount * 100);
      
      // In production, this would be a backend API call
      // For test mode, we'll simulate the response
      if (this.config.testMode) {
        const merchantTransactionId = this.generateMerchantTransactionId();
        
        return {
          success: true,
          orderId: orderId || `order_${Date.now()}`,
          merchantTransactionId,
          amount: amountInPaise,
          currency,
          merchantId: this.config.merchantId,
          customerInfo
        };
      }
      
      // Production implementation would call backend API
      // const response = await fetch('/api/payments/phonepe/create-order', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount: amountInPaise, currency, orderId, customerInfo })
      // });
      // const data = await response.json();
      // return data;
      
      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'phonepe_create_order');
  }

  /**
   * Process payment using PhonePe checkout
   */
  async processPayment(paymentDetails) {
    const operation = async () => {
      const {
        merchantTransactionId,
        amount,
        currency = 'INR',
        customerInfo,
        paymentMethod,
        returnUrl,
        callbackUrl
      } = paymentDetails;

      if (!window.PhonePe) {
        throw new Error('PhonePe SDK not loaded');
      }

      const amountInPaise = Math.round(amount * 100);

      const options = {
        merchantId: this.config.merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: customerInfo?.phone || 'guest_user',
        amount: amountInPaise,
        mobileNumber: customerInfo?.phone || '',
        callbackUrl: callbackUrl || window.location.href,
        callbackMode: 'POST',
        paymentInstrument: {
          type: 'UPI',
          targetApp: paymentMethod === PaymentMethod.UPI ? 'PHONEPE' : 'DEFAULT'
        },
        deviceContext: {
          deviceOS: 'WEB'
        }
      };

      return new Promise((resolve, reject) => {
        try {
          const phonepe = new window.PhonePe(options);
          
          phonepe.open();
          
          // Listen for payment events
          phonepe.on('payment_success', (response) => {
            this.handlePaymentSuccess(response, paymentDetails);
            resolve({
              success: true,
              status: PaymentStatus.COMPLETED,
              merchantTransactionId: response.merchantTransactionId,
              transactionId: response.transactionId,
              amount: response.amount / 100,
              currency: response.currency
            });
          });

          phonepe.on('payment_failure', (response) => {
            this.handlePaymentFailure(response, paymentDetails);
            reject({
              success: false,
              error: response.message || 'Payment failed',
              code: response.code,
              merchantTransactionId: response.merchantTransactionId
            });
          });

          phonepe.on('payment_cancelled', (response) => {
            this.handlePaymentFailure(response, paymentDetails);
            reject({
              success: false,
              error: 'Payment cancelled by user',
              code: 'CANCELLED',
              merchantTransactionId: response.merchantTransactionId
            });
          });

          // Resolve with pending status (actual result comes via handler)
          resolve({
            success: true,
            status: PaymentStatus.PROCESSING,
            merchantTransactionId,
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

    return await this.executeWithRetry(operation, 'phonepe_process_payment');
  }

  /**
   * Handle payment success
   */
  handlePaymentSuccess(response, paymentDetails) {
    console.log('[PhonePeAdapter] Payment successful:', response);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentSuccess', {
      detail: {
        gateway: this.gatewayName,
        merchantTransactionId: response.merchantTransactionId,
        transactionId: response.transactionId,
        amount: response.amount / 100,
        currency: response.currency,
        paymentDetails
      }
    }));
  }

  /**
   * Handle payment failure
   */
  handlePaymentFailure(response, paymentDetails) {
    console.error('[PhonePeAdapter] Payment failed:', response);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentFailure', {
      detail: {
        gateway: this.gatewayName,
        error: response.message || 'Payment failed',
        code: response.code,
        merchantTransactionId: response.merchantTransactionId,
        paymentDetails
      }
    }));
  }

  /**
   * Verify PhonePe signature
   * PhonePe uses X-VERIFY header for signature verification
   */
  async verifyPayment(signature, data) {
    try {
      // In production, this should be done on the backend
      // PhonePe provides signature verification libraries
      
      const { merchantTransactionId, transactionId, amount, currency } = data;
      
      if (!merchantTransactionId) {
        return { valid: false, reason: 'Missing merchant transaction ID' };
      }

      // In production, use backend to verify signature
      // const response = await fetch('/api/payments/phonepe/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ signature, data })
      // });
      // const result = await response.json();
      // return result;

      // For test mode, accept all signatures
      if (this.config.testMode) {
        return { valid: true, testMode: true };
      }

      // Client-side signature verification (not recommended for production)
      // PhonePe uses SHA256 with salt index
      const checksumString = this.generateChecksumString(data);
      const calculatedChecksum = await this.generateChecksum(checksumString, this.config.apiSecret);
      const isValid = calculatedChecksum === signature;
      
      return { valid: isValid };
    } catch (error) {
      console.error('[PhonePeAdapter] Verification failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Generate checksum string for PhonePe
   */
  generateChecksumString(data) {
    // PhonePe checksum string format
    const params = [
      data.merchantTransactionId,
      data.amount,
      data.currency,
      data.transactionId || ''
    ];
    
    return params.join('|');
  }

  /**
   * Generate PhonePe checksum
   * PhonePe uses SHA256 with salt index
   */
  async generateChecksum(string, secret) {
    const encoder = new TextEncoder();
    const data = encoder.encode(string + secret);
    
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
      // const response = await fetch('/api/payments/phonepe/refund', {
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
          status: 'SUCCESS'
        };
      }

      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'phonepe_refund');
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch(`/api/payments/phonepe/status/${paymentId}`);
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

    return await this.executeWithRetry(operation, 'phonepe_status');
  }

  /**
   * Get supported payment methods
   * PhonePe is UPI-focused
   */
  getSupportedPaymentMethods() {
    return [
      PaymentMethod.UPI
    ];
  }

  /**
   * Validate PhonePe-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.merchantId) {
      errors.push('PhonePe Merchant ID is required');
    }
    
    if (!this.config.apiKey) {
      errors.push('PhonePe API key is required');
    }
    
    if (!this.config.apiSecret) {
      errors.push('PhonePe API secret is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate merchant transaction ID
   */
  generateMerchantTransactionId() {
    return `MT${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get test UPI handles for testing
   */
  getTestUPIHandles() {
    return [
      'success@phonepe',
      'failure@phonepe',
      'pending@phonepe',
      'customer@upi'
    ];
  }

  /**
   * Get supported UPI apps
   */
  getSupportedUPIApps() {
    return [
      { name: 'PhonePe', package: 'com.phonepe.app' },
      { name: 'Google Pay', package: 'com.google.android.apps.nbu.paisa.user' },
      { name: 'Paytm', package: 'net.one97.paytm' },
      { name: 'BHIM', package: 'in.org.npci.upiapp' },
      { name: 'Amazon Pay', package: 'in.amazon.mShop.android.shopping' }
    ];
  }
}

export default PhonePeAdapter;
