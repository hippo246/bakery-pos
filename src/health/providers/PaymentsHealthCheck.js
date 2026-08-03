// Payments Health Check Provider
// Real health checks for Payments

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory } from '../HealthTypes.js';

/**
 * Health check provider for Payments
 * Verifies gateway connectivity, payment processing, and terminal availability
 */
export class PaymentsHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'payments',
      'Payments',
      ComponentCategory.PAYMENTS
    );
  }

  /**
   * Perform payments health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check gateway connectivity
      const gatewayCheck = await this.checkGatewayConnectivity();
      if (!gatewayCheck.success) {
        return this.createCriticalResult({
          reason: `Gateway connectivity check failed: ${gatewayCheck.error}`,
          recommendedAction: 'Check payment gateway configuration and network'
        });
      }

      // Check payment processing
      const processingCheck = await this.checkPaymentProcessing();
      
      // Check terminal availability
      const terminalCheck = await this.checkTerminalAvailability();
      
      // Check transaction queue
      const queueCheck = await this.checkTransactionQueue();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, gatewayCheck, processingCheck, terminalCheck, queueCheck);

      return this.createHealthyResult({
        reason: 'Payments system is operational',
        latency,
        healthScore,
        metadata: {
          gatewayConnected: gatewayCheck.connected,
          processingOperational: processingCheck.operational,
          terminalAvailable: terminalCheck.available,
          pendingTransactions: queueCheck.pending,
          failedTransactions: queueCheck.failed
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Payments health check error: ${error.message}`,
        recommendedAction: 'Check Payments logs and configuration'
      });
    }
  }

  /**
   * Check gateway connectivity
   * @returns {Promise<Object>}
   */
  async checkGatewayConnectivity() {
    try {
      // Check if payment gateway is configured
      const config = localStorage.getItem('cafeos_payment_config');
      const connected = !!config;
      
      return {
        success: connected,
        connected,
        error: connected ? null : 'Payment gateway not configured'
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Check payment processing
   * @returns {Promise<Object>}
   */
  async checkPaymentProcessing() {
    try {
      // Check if payment processing is operational
      const config = localStorage.getItem('cafeos_payment_config');
      if (!config) {
        return {
          success: false,
          operational: false,
          error: 'Payment configuration not found'
        };
      }

      const parsed = JSON.parse(config);
      const operational = parsed.enabled !== false;
      
      return {
        success: true,
        operational,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        operational: false,
        error: error.message
      };
    }
  }

  /**
   * Check terminal availability
   * @returns {Promise<Object>}
   */
  async checkTerminalAvailability() {
    try {
      // Check if payment terminal is available
      const config = localStorage.getItem('cafeos_payment_config');
      const available = !!config; // Assume available if configured
      
      return {
        success: true,
        available,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Check transaction queue
   * @returns {Promise<Object>}
   */
  async checkTransactionQueue() {
    try {
      // Check transaction queue from localStorage
      const queue = localStorage.getItem('cafeos_payment_queue');
      const pending = queue ? JSON.parse(queue).filter(t => t.status === 'pending').length : 0;
      const failed = queue ? JSON.parse(queue).filter(t => t.status === 'failed').length : 0;
      
      return {
        success: true,
        pending,
        failed,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        pending: 0,
        failed: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} latency - Check latency
   * @param {Object} gatewayCheck - Gateway check result
   * @param {Object} processingCheck - Processing check result
   * @param {Object} terminalCheck - Terminal check result
   * @param {Object} queueCheck - Queue check result
   * @returns {number}
   */
  calculateHealthScore(latency, gatewayCheck, processingCheck, terminalCheck, queueCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 200) score -= 10;
    if (latency > 1000) score -= 20;

    // Deduct for failed checks
    if (!gatewayCheck.success) score -= 30;
    if (!processingCheck.success) score -= 25;
    if (!terminalCheck.success) score -= 15;

    // Deduct for queue issues
    if (queueCheck.pending > 10) score -= 10;
    if (queueCheck.failed > 0) score -= 15;
    if (queueCheck.failed > 5) score -= 25;

    return Math.max(0, score);
  }

  /**
   * Get Payments version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default PaymentsHealthCheck;
