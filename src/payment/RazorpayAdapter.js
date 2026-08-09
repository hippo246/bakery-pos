// Razorpay Payment Gateway Adapter
// India-focused payment gateway with UPI, cards, wallets, EMI support

import { PaymentGateway, PaymentStatus, PaymentMethod } from './PaymentGateway.js';

export class RazorpayAdapter extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.gatewayName = 'razorpay';
    this.sdkUrl = 'https://checkout.razorpay.com/v1/checkout.js';
  }

  /**
   * Initialize Razorpay
   * Load SDK and validate configuration
   */
  async initialize() {
    try {
      console.log('[RazorpayAdapter] Initializing...');
      
      const validation = this.validateConfig();
      if (!validation.valid) {
        const errorMessage = Array.isArray(validation.errors) 
          ? validation.errors.join(', ') 
          : validation.errors || 'Invalid configuration';
        console.error('[RazorpayAdapter] Validation failed:', errorMessage);
        throw new Error(`Invalid configuration: ${errorMessage}`);
      }

      console.log('[RazorpayAdapter] Configuration valid, loading SDK...');
      
      // Load Razorpay SDK
      if (!window.Razorpay) {
        console.log('[RazorpayAdapter] SDK not found, loading from:', this.sdkUrl);
        await this.loadSDK(this.sdkUrl);
        console.log('[RazorpayAdapter] SDK loaded successfully');
      } else {
        console.log('[RazorpayAdapter] SDK already loaded');
      }
      
      this.initialized = true;
      console.log('[RazorpayAdapter] Initialized successfully');
      
      return { success: true };
    } catch (error) {
      console.error('[RazorpayAdapter] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Razorpay order
   * In production, this would call your backend API which then calls Razorpay API
   * For now, we'll simulate the order creation
   */
  async createOrder(orderDetails) {
    console.log('[RazorpayAdapter] Creating order with details:', orderDetails);
    
    // Validate order details
    if (!orderDetails) {
      throw new Error('Order details are required');
    }
    
    const { amount, currency = 'INR', receipt, notes } = orderDetails;
    
    // Validate amount
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a positive number.`);
    }
    
    // Validate currency
    if (!currency || typeof currency !== 'string') {
      throw new Error(`Invalid currency: ${currency}`);
    }
    
    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(amount * 100);
    
    if (amountInPaise <= 0) {
      throw new Error(`Amount in paise must be positive: ${amountInPaise}`);
    }
    
    console.log('[RazorpayAdapter] Order validation passed, creating order...');
    
    // In production, this would be a backend API call
    // For test mode, we'll simulate the response
    if (this.config.testMode) {
      const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('[RazorpayAdapter] Mock order created:', mockOrderId);
      
      return {
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency,
        receipt,
        notes,
        createdAt: new Date().toISOString()
      };
    }
    
    // Production implementation would call backend API
    // const response = await fetch('/api/payments/razorpay/create-order', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ amount: amountInPaise, currency, receipt, notes })
    // });
    // const data = await response.json();
    // return data;
    
    throw new Error('Production mode requires backend implementation');
  }

  /**
   * Process payment using Razorpay checkout
   */
  async processPayment(paymentDetails) {
    console.log('[RazorpayAdapter] === PROCESSING PAYMENT ===');
    const {
      orderId,
      amount,
      currency = 'INR',
      customerInfo,
      paymentMethod,
      description,
      theme
    } = paymentDetails;

    console.log('[RazorpayAdapter] Payment details:', { orderId, amount, currency, paymentMethod, description });
    console.log('[RazorpayAdapter] Config testMode:', this.config.testMode);
    console.log('[RazorpayAdapter] API Key:', this.config.apiKey);

    if (!window.Razorpay) {
      console.error('[RazorpayAdapter] SDK not loaded, attempting to load...');
      try {
        await this.loadSDK(this.sdkUrl);
        if (!window.Razorpay) {
          throw new Error('Razorpay SDK failed to load');
        }
        console.log('[RazorpayAdapter] SDK loaded successfully');
      } catch (loadError) {
        console.error('[RazorpayAdapter] Failed to load SDK:', loadError);
        throw new Error(`Failed to load Razorpay SDK: ${loadError.message}`);
      }
    }

    const amountInPaise = Math.round(amount * 100);
    console.log('[RazorpayAdapter] Amount in paise:', amountInPaise);

    return new Promise((resolve, reject) => {
      let resolved = false;
      let modalOpened = false;
      
      try {
        const options = {
          key: this.config.apiKey,
          amount: amountInPaise,
          currency,
          name: customerInfo?.businessName || 'Cafe OS',
          description: description || 'Order Payment',
          image: 'https://cdn.razorpay.com/logo.svg',
          handler: (response) => {
            console.log('[RazorpayAdapter] Payment successful callback received:', response);
            if (!resolved) {
              resolved = true;
              this.handlePaymentSuccess(response, paymentDetails);
              resolve({
                success: true,
                status: PaymentStatus.COMPLETED,
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                message: 'Payment completed successfully'
              });
            }
          },
          prefill: {
            name: customerInfo?.name || '',
            email: customerInfo?.email || '',
            contact: customerInfo?.phone || ''
          },
          notes: {
            orderId: orderId
          },
          theme: {
            color: theme?.color || '#E63946'
          },
          modal: {
            ondismiss: () => {
              console.log('[RazorpayAdapter] Payment modal dismissed');
              if (!resolved) {
                resolved = true;
                reject({
                  success: false,
                  error: 'Payment modal was dismissed without completing payment'
                });
              }
            }
          }
        };

        console.log('[RazorpayAdapter] Razorpay checkout options:', JSON.stringify(options, null, 2));

        const rzp = new window.Razorpay(options);
        
        rzp.on('payment.failed', (response) => {
          console.error('[RazorpayAdapter] Payment failed event:', response);
          if (!resolved) {
            resolved = true;
            this.handlePaymentFailure(response, paymentDetails);
            reject({
              success: false,
              error: response.error.description,
              code: response.error.code,
              paymentId: response.error.metadata?.payment_id
            });
          }
        });

        rzp.on('payment.modal.closed', () => {
          console.log('[RazorpayAdapter] Payment modal closed without payment');
          if (!resolved) {
            resolved = true;
            reject({
              success: false,
              error: 'Payment modal was closed without completing payment'
            });
          }
        });

        console.log('[RazorpayAdapter] Opening Razorpay checkout...');
        console.log('[RazorpayAdapter] API Key:', this.config.apiKey ? 'Present' : 'Missing');
        console.log('[RazorpayAdapter] Amount:', amountInPaise);
        console.log('[RazorpayAdapter] Order ID:', orderId);
        
        try {
          rzp.open();
          modalOpened = true;
          console.log('[RazorpayAdapter] Checkout opened successfully, waiting for user action...');
        } catch (openError) {
          console.error('[RazorpayAdapter] Failed to open Razorpay modal:', openError);
          if (!resolved) {
            resolved = true;
            reject({
              success: false,
              error: `Failed to open Razorpay checkout: ${openError.message}. Please check your API key.`
            });
          }
        }
        
        // Check if modal actually opened - if not, reject immediately
        setTimeout(() => {
          if (!modalOpened && !resolved) {
            console.error('[RazorpayAdapter] Razorpay modal failed to open within 2 seconds');
            resolved = true;
            reject({
              success: false,
              error: 'Razorpay checkout failed to open. Please check your API key and try again.'
            });
          }
        }, 2000); // Check after 2 seconds
        
      } catch (error) {
        console.error('[RazorpayAdapter] Failed to open checkout:', error);
        if (!resolved) {
          resolved = true;
          reject({
            success: false,
            error: error.message
          });
        }
      }
    });
  }

  /**
   * Handle payment success
   */
  handlePaymentSuccess(response, paymentDetails) {
    console.log('[RazorpayAdapter] Payment successful:', response);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentSuccess', {
      detail: {
        gateway: this.gatewayName,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
        paymentDetails
      }
    }));
  }

  /**
   * Handle payment failure
   */
  handlePaymentFailure(response, paymentDetails) {
    console.error('[RazorpayAdapter] Payment failed:', response);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentFailure', {
      detail: {
        gateway: this.gatewayName,
        error: response.error,
        paymentDetails
      }
    }));
  }

  /**
   * Verify Razorpay signature
   * Uses HMAC SHA256 to verify webhook signature
   */
  async verifyPayment(signature, data) {
    try {
      // In production, this should be done on the backend
      // For now, we'll implement client-side verification (not secure for production)
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return { valid: false, reason: 'Missing required fields' };
      }

      // In production, use backend to verify signature
      // const response = await fetch('/api/payments/razorpay/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
      // });
      // const result = await response.json();
      // return result;

      // For test mode, accept all signatures
      if (this.config.testMode) {
        return { valid: true, testMode: true };
      }

      // Client-side verification (not recommended for production)
      const secret = this.config.apiSecret;
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      
      const expectedSignature = await this.generateHMACSHA256(body, secret);
      const isValid = expectedSignature === razorpay_signature;
      
      return { valid: isValid };
    } catch (error) {
      console.error('[RazorpayAdapter] Verification failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Generate HMAC SHA256 signature
   */
  async generateHMACSHA256(message, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      messageData
    );
    
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Refund payment
   */
  async refund(paymentId, amount, reason) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch('/api/payments/razorpay/refund', {
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

    return await this.executeWithRetry(operation, 'razorpay_refund');
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch(`/api/payments/razorpay/status/${paymentId}`);
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

    return await this.executeWithRetry(operation, 'razorpay_status');
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
   * Validate Razorpay-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.apiKey) {
      errors.push('Razorpay API key is required');
    }
    
    // API secret is only required for server-side operations
    // For client-side payments, only API key is needed
    if (!this.config.apiSecret && !this.config.testMode) {
      errors.push('Razorpay API secret is required for production mode');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get test card details for testing
   */
  getTestCards() {
    return [
      {
        network: 'Visa',
        card: '4242 4242 4242 4242',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        description: 'Domestic test card'
      },
      {
        network: 'Mastercard',
        card: '5123 4567 8912 3456',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        description: 'Domestic test card'
      },
      {
        network: 'Rupay',
        card: '6521 1111 1111 1111',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        description: 'Indian Rupay card'
      }
    ];
  }

  /**
   * Get test UPI handles
   */
  getTestUPIHandles() {
    return [
      'success@razorpay',
      'failure@razorpay',
      'customer@vpa'
    ];
  }
}

export default RazorpayAdapter;
