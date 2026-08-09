// Cashfree Payment Gateway Adapter
// Alternative payment gateway with lower fees and recurring payment support

import { PaymentGateway, PaymentStatus, PaymentMethod } from './PaymentGateway.js';

export class CashfreeAdapter extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.gatewayName = 'cashfree';
    this.sdkUrl = 'https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sdk.js';
  }

  /**
   * Initialize Cashfree
   * Load SDK and validate configuration
   */
  async initialize() {
    try {
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Load Cashfree SDK
      await this.loadSDK(this.sdkUrl);
      
      this.initialized = true;
      console.log('[CashfreeAdapter] Initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[CashfreeAdapter] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Cashfree payment session
   * In production, this would call your backend API which then calls Cashfree API
   */
  async createOrder(orderDetails) {
    const operation = async () => {
      const { amount, currency = 'INR', orderId, customerInfo } = orderDetails;
      
      // Convert amount to paise (Cashfree uses smallest currency unit)
      const amountInPaise = Math.round(amount * 100);
      
      // In production, this would be a backend API call
      // For test mode, we'll simulate the response
      if (this.config.testMode) {
        const sessionId = this.generateSessionId();
        
        return {
          success: true,
          orderId: orderId || `order_${Date.now()}`,
          sessionId,
          amount: amountInPaise,
          currency,
          merchantId: this.config.merchantId,
          customerInfo
        };
      }
      
      // Production implementation would call backend API
      // const response = await fetch('/api/payments/cashfree/create-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount: amountInPaise, currency, orderId, customerInfo })
      // });
      // const data = await response.json();
      // return data;
      
      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'cashfree_create_order');
  }

  /**
   * Process payment using Cashfree checkout
   */
  async processPayment(paymentDetails) {
    const operation = async () => {
      const {
        sessionId,
        amount,
        currency = 'INR',
        customerInfo,
        paymentMethod,
        returnUrl,
        callbackUrl
      } = paymentDetails;

      if (!window.Cashfree) {
        throw new Error('Cashfree SDK not loaded');
      }

      const amountInPaise = Math.round(amount * 100);

      const options = {
        sessionId: sessionId,
        mode: 'DROP',
        components: ['card', 'netbanking', 'upi', 'app', 'paylater'],
        style: {
          theme: '#E63946',
          color: '#FFFFFF',
          fontFamily: 'inherit',
          fontSize: '14px',
          errorColor: '#E63946',
          successColor: '#2ECC71'
        },
        redirectTarget: '_self',
        renderCallback: (data) => {
          console.log('[CashfreeAdapter] Render callback:', data);
        },
        customerDetails: {
          customerId: customerInfo?.phone || 'guest_user',
          customerName: customerInfo?.name || 'Guest',
          customerEmail: customerInfo?.email || '',
          customerPhone: customerInfo?.phone || ''
        }
      };

      return new Promise((resolve, reject) => {
        try {
          const cashfree = new window.Cashfree(options);
          
          cashfree.render();
          
          cashfree.on('payment.success', (response) => {
            this.handlePaymentSuccess(response, paymentDetails);
            resolve({
              success: true,
              status: PaymentStatus.COMPLETED,
              orderId: response.orderId,
              paymentId: response.paymentId,
              amount: response.amount / 100,
              currency: response.currency
            });
          });

          cashfree.on('payment.failure', (response) => {
            this.handlePaymentFailure(response, paymentDetails);
            reject({
              success: false,
              error: response.message || 'Payment failed',
              code: response.code,
              orderId: response.orderId
            });
          });

          cashfree.on('payment.cancel', (response) => {
            this.handlePaymentFailure(response, paymentDetails);
            reject({
              success: false,
              error: 'Payment cancelled by user',
              code: 'CANCELLED',
              orderId: response.orderId
            });
          });

          // Resolve with pending status (actual result comes via handler)
          resolve({
            success: true,
            status: PaymentStatus.PROCESSING,
            sessionId,
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

    return await this.executeWithRetry(operation, 'cashfree_process_payment');
  }

  /**
   * Handle payment success
   */
  handlePaymentSuccess(response, paymentDetails) {
    console.log('[CashfreeAdapter] Payment successful:', response);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentSuccess', {
      detail: {
        gateway: this.gatewayName,
        orderId: response.orderId,
        paymentId: response.paymentId,
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
    console.error('[CashfreeAdapter] Payment failed:', response);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentFailure', {
      detail: {
        gateway: this.gatewayName,
        error: response.message || 'Payment failed',
        code: response.code,
        orderId: response.orderId,
        paymentDetails
      }
    }));
  }

  /**
   * Verify Cashfree signature
   * Cashfree uses signature verification for webhooks
   */
  async verifyPayment(signature, data) {
    try {
      // In production, this should be done on the backend
      // Cashfree provides signature verification libraries
      
      const { orderId, paymentId, amount, currency } = data;
      
      if (!orderId) {
        return { valid: false, reason: 'Missing order ID' };
      }

      // In production, use backend to verify signature
      // const response = await fetch('/api/payments/cashfree/verify', {
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
      // Cashfree uses SHA256 with secret key
      const checksumString = this.generateChecksumString(data);
      const calculatedChecksum = await this.generateChecksum(checksumString, this.config.apiSecret);
      const isValid = calculatedChecksum === signature;
      
      return { valid: isValid };
    } catch (error) {
      console.error('[CashfreeAdapter] Verification failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Generate checksum string for Cashfree
   */
  generateChecksumString(data) {
    // Cashfree checksum string format
    const params = [
      data.orderId,
      data.paymentId || '',
      data.amount || '',
      data.currency || ''
    ];
    
    return params.join('|');
  }

  /**
   * Generate Cashfree checksum
   * Cashfree uses SHA256 with secret key
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
      // const response = await fetch('/api/payments/cashfree/refund', {
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

    return await this.executeWithRetry(operation, 'cashfree_refund');
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch(`/api/payments/cashfree/status/${paymentId}`);
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

    return await this.executeWithRetry(operation, 'cashfree_status');
  }

  /**
   * Create subscription for recurring payments
   * Cashfree has good support for recurring payments
   */
  async createSubscription(subscriptionDetails) {
    const operation = async () => {
      const { amount, currency = 'INR', frequency, customerInfo } = subscriptionDetails;
      
      // In production, this would call backend API
      if (this.config.testMode) {
        const subscriptionId = this.generateSubscriptionId();
        
        return {
          success: true,
          subscriptionId,
          amount,
          currency,
          frequency,
          customerInfo
        };
      }

      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'cashfree_subscription');
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      PaymentMethod.UPI,
      PaymentMethod.CARD,
      PaymentMethod.NET_BANKING,
      PaymentMethod.WALLET,
      PaymentMethod.EMI
    ];
  }

  /**
   * Validate Cashfree-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.merchantId) {
      errors.push('Cashfree Merchant ID is required');
    }
    
    if (!this.config.apiKey) {
      errors.push('Cashfree API key is required');
    }
    
    if (!this.config.apiSecret) {
      errors.push('Cashfree API secret is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate subscription ID
   */
  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get test card details for testing
   */
  getTestCards() {
    return [
      {
        network: 'Visa',
        card: '4111 1111 1111 1111',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User'
      },
      {
        network: 'Mastercard',
        card: '5555 5555 5555 4444',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User'
      }
    ];
  }

  /**
   * Get supported frequencies for recurring payments
   */
  getSupportedFrequencies() {
    return [
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' }
    ];
  }
}

export default CashfreeAdapter;
