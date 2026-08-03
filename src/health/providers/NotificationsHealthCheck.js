// Notifications Health Check Provider
// Real health checks for Notifications

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory } from '../HealthTypes.js';

/**
 * Health check provider for Notifications
 * Verifies queue, delivery, failures, and retry queue
 */
export class NotificationsHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'notifications',
      'Notifications',
      ComponentCategory.NOTIFICATIONS
    );
  }

  /**
   * Perform notifications health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check queue status
      const queueCheck = await this.checkQueueStatus();
      
      // Check delivery status
      const deliveryCheck = await this.checkDeliveryStatus();
      
      // Check failures
      const failuresCheck = await this.checkFailures();
      
      // Check retry queue
      const retryCheck = await this.checkRetryQueue();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, queueCheck, deliveryCheck, failuresCheck, retryCheck);

      // Determine overall status based on queue states
      let status = HealthState.HEALTHY;
      let reason = 'Notifications system is operational';
      
      if (failuresCheck.count > 20) {
        status = HealthState.CRITICAL;
        reason = `Too many failed notifications: ${failuresCheck.count}`;
      } else if (failuresCheck.count > 5) {
        status = HealthState.WARNING;
        reason = `${failuresCheck.count} failed notifications`;
      } else if (retryCheck.count > 30) {
        status = HealthState.WARNING;
        reason = `High retry queue count: ${retryCheck.count}`;
      }

      return new HealthCheckResult({
        status,
        reason,
        latency,
        healthScore,
        metadata: {
          queueSize: queueCheck.size,
          deliveryRate: deliveryCheck.rate,
          failedCount: failuresCheck.count,
          retryQueue: retryCheck.count,
          averageLatency: deliveryCheck.latency
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Notifications health check error: ${error.message}`,
        recommendedAction: 'Check Notifications logs and configuration'
      });
    }
  }

  /**
   * Check queue status
   * @returns {Promise<Object>}
   */
  async checkQueueStatus() {
    try {
      // Check notification queue from localStorage
      const queue = localStorage.getItem('cafeos_notification_queue');
      const size = queue ? JSON.parse(queue).length : 0;
      
      return {
        success: true,
        size,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        error: error.message
      };
    }
  }

  /**
   * Check delivery status
   * @returns {Promise<Object>}
   */
  async checkDeliveryStatus() {
    try {
      // Check delivery statistics
      const stats = localStorage.getItem('cafeos_notification_stats');
      if (!stats) {
        return {
          success: true,
          rate: 100, // Assume 100% if no stats
          latency: 0,
          error: null
        };
      }

      const parsed = JSON.parse(stats);
      const rate = parsed.deliveryRate || 100;
      const latency = parsed.averageLatency || 0;
      
      return {
        success: true,
        rate,
        latency,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        rate: 0,
        latency: 0,
        error: error.message
      };
    }
  }

  /**
   * Check failures
   * @returns {Promise<Object>}
   */
  async checkFailures() {
    try {
      const queue = localStorage.getItem('cafeos_notification_queue');
      const count = queue ? JSON.parse(queue).filter(n => n.status === 'failed').length : 0;
      
      return {
        success: true,
        count,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Check retry queue
   * @returns {Promise<Object>}
   */
  async checkRetryQueue() {
    try {
      const queue = localStorage.getItem('cafeos_notification_queue');
      const count = queue ? JSON.parse(queue).filter(n => n.status === 'retry').length : 0;
      
      return {
        success: true,
        count,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} latency - Check latency
   * @param {Object} queueCheck - Queue check result
   * @param {Object} deliveryCheck - Delivery check result
   * @param {Object} failuresCheck - Failures check result
   * @param {Object} retryCheck - Retry check result
   * @returns {number}
   */
  calculateHealthScore(latency, queueCheck, deliveryCheck, failuresCheck, retryCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 200) score -= 10;
    if (latency > 1000) score -= 20;

    // Deduct for queue issues
    if (queueCheck.size > 100) score -= 10;
    if (deliveryCheck.rate < 90) score -= 15;
    if (deliveryCheck.rate < 70) score -= 25;

    // Deduct for failures
    if (failuresCheck.count > 0) score -= 15;
    if (failuresCheck.count > 10) score -= 30;

    // Deduct for retry queue
    if (retryCheck.count > 20) score -= 10;
    if (retryCheck.count > 50) score -= 20;

    return Math.max(0, score);
  }

  /**
   * Get Notifications version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default NotificationsHealthCheck;
