// Stripe Payment Gateway Adapter
// International payment gateway with support for cards, wallets, and more

import { PaymentGateway, PaymentStatus, PaymentMethod } from './PaymentGateway.js';

export class StripeAdapter extends PaymentGateway {
  constructor(config = {}) {
    super(config);
    this.gatewayName = 'stripe';
    this.sdkUrl = 'https://js.stripe.com/v3/';
    this.stripe = null;
  }

  /**
   * Initialize Stripe
   * Load SDK and validate configuration
   */
  async initialize() {
    try {
      const validation = this.validateConfig();
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Load Stripe SDK
      await this.loadSDK(this.sdkUrl);
      
      // Initialize Stripe instance
      if (window.Stripe) {
        this.stripe = window.Stripe(this.config.apiKey);
        this.initialized = true;
        console.log('[StripeAdapter] Initialized successfully');
      } else {
        throw new Error('Stripe SDK failed to load');
      }
      
      return { success: true };
    } catch (error) {
      console.error('[StripeAdapter] Initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create Stripe payment intent
   * In production, this would call your backend API which then calls Stripe API
   */
  async createOrder(orderDetails) {
    const operation = async () => {
      const { amount, currency = 'USD', orderId, customerInfo } = orderDetails;
      
      // Convert amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(amount * 100);
      
      // In production, this would be a backend API call
      // For test mode, we'll simulate the response
      if (this.config.testMode) {
        const clientSecret = this.generateTestClientSecret();
        
        return {
          success: true,
          orderId: orderId || `order_${Date.now()}`,
          clientSecret,
          amount: amountInCents,
          currency,
          customerInfo
        };
      }
      
      // Production implementation would call backend API
      // const response = await fetch('/api/payments/stripe/create-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount: amountInCents, currency, orderId, customerInfo })
      // });
      // const data = await response.json();
      // return data;
      
      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'stripe_create_order');
  }

  /**
   * Process payment using Stripe Elements
   */
  async processPayment(paymentDetails) {
    const operation = async () => {
      const {
        clientSecret,
        cardElement,
        paymentMethodId,
        amount,
        currency = 'USD',
        customerInfo,
        paymentMethod,
        returnUrl
      } = paymentDetails;

      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      let result;

      // Handle different payment methods
      if (paymentMethod === PaymentMethod.CARD && cardElement) {
        // Card payment using Elements
        result = await this.stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerInfo?.name || '',
              email: customerInfo?.email || '',
              phone: customerInfo?.phone || ''
            }
          }
        });
      } else if (paymentMethodId) {
        // Payment method already created
        result = await this.stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethodId
        });
      } else {
        // Redirect-based payment (for wallets, etc.)
        result = await this.stripe.confirmCardPayment(clientSecret, {
          return_url: returnUrl || window.location.href
        });
      }

      if (result.error) {
        this.handlePaymentFailure(result.error, paymentDetails);
        return {
          success: false,
          error: result.error.message,
          code: result.error.code
        };
      }

      this.handlePaymentSuccess(result.paymentIntent, paymentDetails);
      
      return {
        success: true,
        status: PaymentStatus.COMPLETED,
        paymentIntentId: result.paymentIntent.id,
        amount: result.paymentIntent.amount / 100,
        currency: result.paymentIntent.currency
      };
    };

    return await this.executeWithRetry(operation, 'stripe_process_payment');
  }

  /**
   * Handle payment success
   */
  handlePaymentSuccess(paymentIntent, paymentDetails) {
    console.log('[StripeAdapter] Payment successful:', paymentIntent);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentSuccess', {
      detail: {
        gateway: this.gatewayName,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        paymentDetails
      }
    }));
  }

  /**
   * Handle payment failure
   */
  handlePaymentFailure(error, paymentDetails) {
    console.error('[StripeAdapter] Payment failed:', error);
    
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('paymentFailure', {
      detail: {
        gateway: this.gatewayName,
        error: error.message,
        code: error.code,
        type: error.type,
        paymentDetails
      }
    }));
  }

  /**
   * Verify Stripe webhook signature
   * Uses Stripe's signature verification
   */
  async verifyPayment(signature, data) {
    try {
      // In production, this should be done on the backend
      // Stripe provides signature verification libraries
      
      const { paymentIntentId, paymentIntent } = data;
      
      if (!paymentIntentId) {
        return { valid: false, reason: 'Missing payment intent ID' };
      }

      // In production, use backend to verify signature
      // const response = await fetch('/api/payments/stripe/verify', {
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
      // Stripe signatures are complex and should be verified server-side
      return { valid: false, reason: 'Server-side verification required' };
    } catch (error) {
      console.error('[StripeAdapter] Verification failed:', error);
      return { valid: false, reason: error.message };
    }
  }

  /**
   * Refund payment
   */
  async refund(paymentId, amount, reason) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch('/api/payments/stripe/refund', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ paymentId, amount, reason })
      // });
      // const data = await response.json();
      // return data;

      if (this.config.testMode) {
        return {
          success: true,
          refundId: `re_${Date.now()}`,
          paymentId,
          amount,
          reason,
          status: 'succeeded'
        };
      }

      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'stripe_refund');
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    const operation = async () => {
      // In production, this would call backend API
      // const response = await fetch(`/api/payments/stripe/status/${paymentId}`);
      // const data = await response.json();
      // return data;

      if (this.config.testMode) {
        return {
          success: true,
          paymentId,
          status: PaymentStatus.COMPLETED,
          amount: 0,
          currency: 'USD'
        };
      }

      throw new Error('Production mode requires backend implementation');
    };

    return await this.executeWithRetry(operation, 'stripe_status');
  }

  /**
   * Create payment method
   * For saving card details for future use
   */
  async createPaymentMethod(cardElement, customerInfo) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    const result = await this.stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: customerInfo?.name || '',
        email: customerInfo?.email || '',
        phone: customerInfo?.phone || ''
      }
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      success: true,
      paymentMethodId: result.paymentMethod.id
    };
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      PaymentMethod.CARD,
      PaymentMethod.WALLET,
      PaymentMethod.NET_BANKING
    ];
  }

  /**
   * Validate Stripe-specific configuration
   */
  validateConfig() {
    const errors = super.validateConfig();
    
    if (!this.config.apiKey) {
      errors.push('Stripe API key (publishable key) is required');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate test client secret
   */
  generateTestClientSecret() {
    return `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`;
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
        description: 'Succeeds for all payment methods'
      },
      {
        network: 'Visa',
        card: '4000 0025 0000 3155',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        description: 'Requires authentication'
      },
      {
        network: 'Visa',
        card: '4000 0000 0000 9995',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        description: 'Always declines'
      },
      {
        network: 'Mastercard',
        card: '5555 5555 5555 4444',
        expiry: '12/25',
        cvv: '123',
        name: 'Test User',
        description: 'Succeeds for all payment methods'
      }
    ];
  }

  /**
   * Create Stripe Elements instance
   * For building custom payment forms
   */
  createElements(options = {}) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    return this.stripe.elements({
      fonts: [
        {
          cssSrc: 'https://fonts.googleapis.com/css?family=Roboto'
        }
      ],
      ...options
    });
  }

  /**
   * Get Stripe instance
   */
  getStripe() {
    return this.stripe;
  }
}

export default StripeAdapter;
