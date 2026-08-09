// Payment Self-Healing
// Self-healing strategies specific to payment operations

import { getSelfHealingEngine } from '../operations/SelfHealingEngine.js';
import { getPaymentGatewayFactory } from './PaymentGatewayFactory.js';
import { getPaymentStorage, PaymentStatus } from './PaymentGateway.js';
import { getOfflinePaymentQueue } from './OfflinePaymentQueue.js';
import { getWebhookVerifier } from './WebhookVerifier.js';

export class PaymentSelfHealing {
  constructor() {
    this.selfHealingEngine = getSelfHealingEngine();
    this.gatewayFactory = getPaymentGatewayFactory();
    this.paymentStorage = getPaymentStorage();
    this.offlineQueue = getOfflinePaymentQueue();
    this.webhookVerifier = getWebhookVerifier();
    
    this.healingStrategies = {
      network_timeout: this.handleNetworkTimeout.bind(this),
      gateway_down: this.handleGatewayDown.bind(this),
      payment_failed: this.handlePaymentFailed.bind(this),
      webhook_missed: this.handleWebhookMissed.bind(this),
      signature_failed: this.handleSignatureFailed.bind(this),
      insufficient_funds: this.handleInsufficientFunds.bind(this),
      card_declined: this.handleCardDeclined.bind(this)
    };
    
    this.initialize();
  }

  /**
   * Initialize payment self-healing
   */
  initialize() {
    // Register payment-specific circuit breakers
    this.registerPaymentCircuitBreakers();
    
    // Start periodic health checks
    this.startHealthChecks();
    
    console.log('[PaymentSelfHealing] Initialized');
  }

  /**
   * Register payment-specific circuit breakers
   */
  registerPaymentCircuitBreakers() {
    const paymentOperations = [
      'razorpay_payment',
      'paytm_payment',
      'stripe_payment',
      'payment_verification',
      'webhook_processing'
    ];

    paymentOperations.forEach(op => {
      this.selfHealingEngine.circuitBreakers.set(op, {
        failures: 0,
        lastFailureTime: null,
        state: 'closed',
        cooldownUntil: null
      });
    });
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      this.checkPaymentHealth();
    }, 60000); // Every minute
  }

  /**
   * Check payment system health
   */
  async checkPaymentHealth() {
    const health = {
      gateways: {},
      queue: this.offlineQueue.getQueueStatus(),
      storage: this.paymentStorage.getStatistics(),
      timestamp: new Date().toISOString()
    };

    // Check each gateway
    const gateways = ['razorpay', 'paytm', 'stripe'];
    for (const gateway of gateways) {
      const stats = this.gatewayFactory.getGatewayStats();
      health.gateways[gateway] = stats[gateway] || null;
    }

    // Log health status
    console.log('[PaymentSelfHealing] Health check:', health);

    // Trigger recovery if needed
    if (health.queue.length > 0 && health.queue.isOnline) {
      console.log('[PaymentSelfHealing] Syncing offline queue');
      await this.offlineQueue.syncQueue();
    }

    return health;
  }

  /**
   * Execute payment with self-healing
   */
  async executeWithHealing(operation, operationType, options = {}) {
    const healingResult = await this.selfHealingEngine.executeWithHealing(
      operation,
      operationType,
      {
        maxRetries: options.maxRetries || 3,
        retryDelay: options.retryDelay || 1000
      }
    );

    if (!healingResult.success) {
      // Apply specific healing strategy
      const strategy = this.determineHealingStrategy(healingResult.error);
      if (strategy) {
        return await this.healingStrategies[strategy](healingResult, options);
      }
    }

    return healingResult;
  }

  /**
   * Determine healing strategy based on error
   */
  determineHealingStrategy(error) {
    const errorMessage = (error?.message || error || '').toString().toLowerCase();

    if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
      return 'network_timeout';
    }

    if (errorMessage.includes('gateway') || errorMessage.includes('unavailable')) {
      return 'gateway_down';
    }

    if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
      return 'insufficient_funds';
    }

    if (errorMessage.includes('declined') || errorMessage.includes('card')) {
      return 'card_declined';
    }

    if (errorMessage.includes('signature') || errorMessage.includes('verification')) {
      return 'signature_failed';
    }

    return 'payment_failed';
  }

  /**
   * Handle network timeout
   */
  async handleNetworkTimeout(error, options) {
    console.log('[PaymentSelfHealing] Handling network timeout');

    // Queue payment for offline processing
    if (options.paymentDetails) {
      this.offlineQueue.queuePayment(options.paymentDetails);
      return {
        success: true,
        action: 'queued',
        message: 'Payment queued due to network timeout'
      };
    }

    // Retry with exponential backoff
    return await this.selfHealingEngine.executeAutomaticRetry(
      () => options.retryOperation(),
      { maxRetries: 3, retryDelay: 2000 }
    );
  }

  /**
   * Handle gateway downtime
   */
  async handleGatewayDown(error, options) {
    console.log('[PaymentSelfHealing] Handling gateway downtime');

    // Check if failover is available
    const failureRate = this.gatewayFactory.getFailureRate(options.gateway);
    
    if (failureRate > 0.5) {
      // Try backup gateway
      if (this.gatewayFactory.backupGateway) {
        console.log('[PaymentSelfHealing] Failing over to backup gateway');
        
        try {
          const backupGateway = await this.gatewayFactory.getGateway(this.gatewayFactory.backupGateway);
          const result = await backupGateway.processPayment(options.paymentDetails);
          
          if (result.success) {
            this.gatewayFactory.recordSuccess(backupGateway.constructor.name);
            return {
              success: true,
              action: 'failover',
              message: 'Payment processed via backup gateway'
            };
          }
        } catch (backupError) {
          console.error('[PaymentSelfHealing] Backup gateway also failed:', backupError);
        }
      }
    }

    // Queue for offline processing
    if (options.paymentDetails) {
      this.offlineQueue.queuePayment(options.paymentDetails);
      return {
        success: true,
        action: 'queued',
        message: 'Payment queued - gateway unavailable'
      };
    }

    return {
      success: false,
      action: 'manual_intervention',
      message: 'All gateways unavailable - manual intervention required'
    };
  }

  /**
   * Handle payment failure
   */
  async handlePaymentFailed(error, options) {
    console.log('[PaymentSelfHealing] Handling payment failure');

    // Update payment record with failure
    if (options.paymentId) {
      const payment = this.paymentStorage.getById(options.paymentId);
      if (payment) {
        payment.updateStatus(PaymentStatus.FAILED, {
          error: error.message
        });
        this.paymentStorage.save(payment);
      }
    }

    // Suggest alternative payment method
    return {
      success: false,
      action: 'suggest_alternative',
      message: 'Payment failed - please try alternative payment method',
      error: error.message
    };
  }

  /**
   * Handle missed webhook
   */
  async handleWebhookMissed(error, options) {
    console.log('[PaymentSelfHealing] Handling missed webhook');

    // Poll payment status from gateway
    if (options.paymentId && options.gateway) {
      try {
        const gateway = await this.gatewayFactory.getGateway(options.gateway);
        const status = await gateway.getPaymentStatus(options.paymentId);

        if (status.success) {
          // Update payment record based on status
          const payment = this.paymentStorage.getById(options.paymentId);
          if (payment) {
            if (status.status === 'completed' || status.status === 'succeeded') {
              payment.updateStatus(PaymentStatus.COMPLETED, {
                gatewayResponse: status
              });
            } else if (status.status === 'failed') {
              payment.updateStatus(PaymentStatus.FAILED, {
                gatewayResponse: status
              });
            }
            this.paymentStorage.save(payment);
          }

          return {
            success: true,
            action: 'status_polled',
            message: 'Payment status updated via polling'
          };
        }
      } catch (pollError) {
        console.error('[PaymentSelfHealing] Polling failed:', pollError);
      }
    }

    return {
      success: false,
      action: 'manual_verification',
      message: 'Webhook missed and polling failed - manual verification required'
    };
  }

  /**
   * Handle signature verification failure
   */
  async handleSignatureFailed(error, options) {
    console.log('[PaymentSelfHealing] Handling signature verification failure');

    // Log security event
    this.webhookVerifier.logSecurityEvent('signature_verification_failed', {
      signature: options.signature,
      data: options.data,
      gateway: options.gateway
    });

    // Flag for manual review
    if (options.paymentId) {
      const payment = this.paymentStorage.getById(options.paymentId);
      if (payment) {
        payment.verified = false;
        payment.signature = options.signature;
        this.paymentStorage.save(payment);
      }
    }

    return {
      success: false,
      action: 'security_alert',
      message: 'Signature verification failed - flagged for manual review'
    };
  }

  /**
   * Handle insufficient funds
   */
  async handleInsufficientFunds(error, options) {
    console.log('[PaymentSelfHealing] Handling insufficient funds');

    return {
      success: false,
      action: 'insufficient_funds',
      message: 'Insufficient funds - please use alternative payment method'
    };
  }

  /**
   * Handle card declined
   */
  async handleCardDeclined(error, options) {
    console.log('[PaymentSelfHealing] Handling card declined');

    return {
      success: false,
      action: 'card_declined',
      message: 'Card declined - please use alternative card or payment method'
    };
  }

  /**
   * Recover stuck payments
   */
  async recoverStuckPayments() {
    console.log('[PaymentSelfHealing] Recovering stuck payments');

    const payments = this.paymentStorage.getAll();
    const stuckPayments = payments.filter(p => 
      p.status === PaymentStatus.PROCESSING || 
      p.status === PaymentStatus.PENDING
    );

    const results = {
      recovered: 0,
      failed: 0,
      total: stuckPayments.length
    };

    for (const payment of stuckPayments) {
      try {
        const gateway = await this.gatewayFactory.getGateway(payment.gateway);
        const status = await gateway.getPaymentStatus(payment.gatewayOrderId);

        if (status.success) {
          const paymentRecord = this.paymentStorage.getById(payment.id);
          if (paymentRecord) {
            if (status.status === 'completed' || status.status === 'succeeded') {
              paymentRecord.updateStatus(PaymentStatus.COMPLETED, {
                gatewayResponse: status
              });
              results.recovered++;
            } else if (status.status === 'failed') {
              paymentRecord.updateStatus(PaymentStatus.FAILED, {
                gatewayResponse: status
              });
              results.failed++;
            }
            this.paymentStorage.save(paymentRecord);
          }
        }
      } catch (error) {
        console.error(`[PaymentSelfHealing] Failed to recover payment ${payment.id}:`, error);
        results.failed++;
      }
    }

    console.log('[PaymentSelfHealing] Recovery complete:', results);
    return results;
  }

  /**
   * Get healing statistics
   */
  getHealingStatistics() {
    return {
      circuitBreakers: Object.fromEntries(this.selfHealingEngine.circuitBreakers),
      gatewayStats: this.gatewayFactory.getGatewayStats(),
      queueStatus: this.offlineQueue.getQueueStatus(),
      paymentStats: this.paymentStorage.getStatistics(),
      webhookStats: this.webhookVerifier.getStatistics()
    };
  }

  /**
   * Reset all healing state
   */
  resetHealingState() {
    this.selfHealingEngine.resetCircuitBreakers();
    this.gatewayFactory.resetFailureStats();
    console.log('[PaymentSelfHealing] Healing state reset');
  }

  /**
   * Destroy the payment self-healing
   */
  destroy() {
    console.log('[PaymentSelfHealing] Destroyed');
  }
}

// Singleton instance
let paymentSelfHealingInstance = null;

/**
 * Get the singleton payment self-healing instance
 */
export function getPaymentSelfHealing() {
  if (!paymentSelfHealingInstance) {
    paymentSelfHealingInstance = new PaymentSelfHealing();
  }
  return paymentSelfHealingInstance;
}

export default PaymentSelfHealing;
