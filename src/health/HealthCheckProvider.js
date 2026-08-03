// Health Check Provider Base Class
// Abstract base class for all health check providers

import { HealthCheckResult, _HealthCheckConfig, HealthState } from './HealthTypes.js';

/**
 * Base class for all health check providers
 * All component health checks must extend this class
 */
export class HealthCheckProvider {
  constructor(componentId, componentName, category) {
    this.componentId = componentId;
    this.componentName = componentName;
    this.category = category;
  }

  /**
   * Perform the health check
   * Must be implemented by subclasses
   * @abstract
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    throw new Error('HealthCheckProvider.check() must be implemented by subclass');
  }

  /**
   * Perform a quick health check (lighter version for frequent checks)
   * Default implementation calls the full check
   * @returns {Promise<HealthCheckResult>}
   */
  async quickCheck() {
    return this.check();
  }

  /**
   * Get component version
   * @returns {string|null}
   */
  getVersion() {
    return null;
  }

  /**
   * Check if the provider is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return true;
  }

  /**
   * Create a healthy result
   * @param {Object} options - Result options
   * @returns {HealthCheckResult}
   */
  createHealthyResult(options = {}) {
    return new HealthCheckResult({
      status: HealthState.HEALTHY,
      reason: options.reason || 'Component is operating normally',
      healthScore: 100,
      ...options
    });
  }

  /**
   * Create a warning result
   * @param {Object} options - Result options
   * @returns {HealthCheckResult}
   */
  createWarningResult(options = {}) {
    return new HealthCheckResult({
      status: HealthState.WARNING,
      reason: options.reason || 'Component has warnings',
      healthScore: 70,
      recommendedAction: options.recommendedAction || 'Monitor the component',
      ...options
    });
  }

  /**
   * Create a critical result
   * @param {Object} options - Result options
   * @returns {HealthCheckResult}
   */
  createCriticalResult(options = {}) {
    return new HealthCheckResult({
      status: HealthState.CRITICAL,
      reason: options.reason || 'Component is in critical state',
      healthScore: 20,
      recommendedAction: options.recommendedAction || 'Immediate attention required',
      ...options
    });
  }

  /**
   * Create an offline result
   * @param {Object} options - Result options
   * @returns {HealthCheckResult}
   */
  createOfflineResult(options = {}) {
    return new HealthCheckResult({
      status: HealthState.OFFLINE,
      reason: options.reason || 'Component is offline',
      healthScore: 0,
      recommendedAction: options.recommendedAction || 'Check component availability',
      ...options
    });
  }

  /**
   * Create a maintenance result
   * @param {Object} options - Result options
   * @returns {HealthCheckResult}
   */
  createMaintenanceResult(options = {}) {
    return new HealthCheckResult({
      status: HealthState.MAINTENANCE,
      reason: options.reason || 'Component is under maintenance',
      healthScore: 50,
      recommendedAction: options.recommendedAction || 'Wait for maintenance to complete',
      ...options
    });
  }

  /**
   * Create an unknown result
   * @param {Object} options - Result options
   * @returns {HealthCheckResult}
   */
  createUnknownResult(options = {}) {
    return new HealthCheckResult({
      status: HealthState.UNKNOWN,
      reason: options.reason || 'Component status unknown',
      healthScore: 0,
      recommendedAction: options.recommendedAction || 'Check component manually',
      ...options
    });
  }

  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @returns {Promise<{result: any, duration: number}>}
   */
  async measureExecution(fn) {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      throw { error, duration };
    }
  }

  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Initial delay in milliseconds
   * @returns {Promise<any>}
   */
  async retryWithBackoff(fn, maxRetries = 3, delay = 1000) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
}

export default HealthCheckProvider;
