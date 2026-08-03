// Health Monitor System
// Monitors the health of all cloud storage providers and provides alerts

class HealthMonitor {
  constructor() {
    this.providers = new Map();
    this.healthHistory = new Map();
    this.checkInterval = 60000; // 1 minute default
    this.intervalId = null;
    this.listeners = new Set();
    this.maxHistorySize = 100;
  }

  /**
   * Register a provider for health monitoring
   * @param {string} providerId - Unique provider identifier
   * @param {object} provider - Provider instance with healthCheck method
   * @param {object} options - Monitoring options
   */
  registerProvider(providerId, provider, options = {}) {
    const providerConfig = {
      provider,
      enabled: options.enabled !== false,
      checkInterval: options.checkInterval || this.checkInterval,
      alertThreshold: options.alertThreshold || 3, // Number of consecutive failures before alert
      consecutiveFailures: 0,
      lastCheck: null,
      lastStatus: 'unknown'
    };

    this.providers.set(providerId, providerConfig);
    this.healthHistory.set(providerId, []);

    console.log(`[HealthMonitor] Registered provider: ${providerId}`);
  }

  /**
   * Unregister a provider from health monitoring
   * @param {string} providerId - Provider identifier
   */
  unregisterProvider(providerId) {
    this.providers.delete(providerId);
    this.healthHistory.delete(providerId);
    console.log(`[HealthMonitor] Unregistered provider: ${providerId}`);
  }

  /**
   * Start health monitoring for all registered providers
   */
  start() {
    if (this.intervalId) {
      console.warn('[HealthMonitor] Health monitoring already started');
      return;
    }

    console.log('[HealthMonitor] Starting health monitoring');
    this.performHealthChecks();
    this.intervalId = setInterval(() => {
      this.performHealthChecks();
    }, this.checkInterval);
  }

  /**
   * Stop health monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[HealthMonitor] Stopped health monitoring');
    }
  }

  /**
   * Perform health checks on all enabled providers
   */
  async performHealthChecks() {
    const checks = [];

    for (const [providerId, config] of this.providers.entries()) {
      if (!config.enabled) continue;

      checks.push(this.checkProviderHealth(providerId));
    }

    await Promise.allSettled(checks);
  }

  /**
   * Check health of a specific provider
   * @param {string} providerId - Provider identifier
   */
  async checkProviderHealth(providerId) {
    const config = this.providers.get(providerId);
    if (!config) return;

    try {
      const result = await config.provider.healthCheck();
      const timestamp = new Date().toISOString();
      const isHealthy = result.diagnostics?.healthy || result.status === 'connected';

      // Update provider config
      config.lastCheck = timestamp;
      config.lastStatus = isHealthy ? 'healthy' : 'unhealthy';

      if (isHealthy) {
        config.consecutiveFailures = 0;
      } else {
        config.consecutiveFailures++;
      }

      // Add to history
      this.addToHistory(providerId, {
        timestamp,
        status: config.lastStatus,
        diagnostics: result.diagnostics,
        latency: result.diagnostics?.latency,
        error: result.diagnostics?.error
      });

      // Emit event
      this.emit('healthCheck', {
        providerId,
        status: config.lastStatus,
        result,
        timestamp
      });

      // Check if we need to alert
      if (!isHealthy && config.consecutiveFailures >= config.alertThreshold) {
        this.emit('healthAlert', {
          providerId,
          message: `Provider ${providerId} has failed ${config.consecutiveFailures} consecutive health checks`,
          severity: 'warning',
          timestamp
        });
      }

      console.log(`[HealthMonitor] ${providerId}: ${config.lastStatus} (${result.diagnostics?.latency || 0}ms)`);
    } catch (error) {
      console.error(`[HealthMonitor] Health check failed for ${providerId}:`, error);
      config.consecutiveFailures++;
      config.lastStatus = 'error';
      config.lastCheck = new Date().toISOString();

      this.addToHistory(providerId, {
        timestamp: config.lastCheck,
        status: 'error',
        error: error.message
      });

      this.emit('healthCheck', {
        providerId,
        status: 'error',
        error: error.message,
        timestamp: config.lastCheck
      });
    }
  }

  /**
   * Add health check result to history
   * @param {string} providerId - Provider identifier
   * @param {object} result - Health check result
   */
  addToHistory(providerId, result) {
    const history = this.healthHistory.get(providerId) || [];
    history.push(result);

    // Trim history if it exceeds max size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.healthHistory.set(providerId, history);
  }

  /**
   * Get health history for a provider
   * @param {string} providerId - Provider identifier
   * @param {number} limit - Maximum number of history entries to return
   * @returns {array} Health history
   */
  getHealthHistory(providerId, limit = 50) {
    const history = this.healthHistory.get(providerId) || [];
    return history.slice(-limit);
  }

  /**
   * Get current health status of all providers
   * @returns {object} Health status summary
   */
  getHealthStatus() {
    const status = {};

    for (const [providerId, config] of this.providers.entries()) {
      status[providerId] = {
        status: config.lastStatus,
        lastCheck: config.lastCheck,
        consecutiveFailures: config.consecutiveFailures,
        enabled: config.enabled
      };
    }

    return status;
  }

  /**
   * Get health status of a specific provider
   * @param {string} providerId - Provider identifier
   * @returns {object} Provider health status
   */
  getProviderHealthStatus(providerId) {
    const config = this.providers.get(providerId);
    if (!config) return null;

    return {
      status: config.lastStatus,
      lastCheck: config.lastCheck,
      consecutiveFailures: config.consecutiveFailures,
      enabled: config.enabled,
      history: this.getHealthHistory(providerId)
    };
  }

  /**
   * Subscribe to health monitoring events
   * @param {function} listener - Event listener function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  /**
   * Unsubscribe from health monitoring events
   * @param {function} listener - Event listener function
   */
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Emit an event to all listeners
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  emit(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('[HealthMonitor] Error in event listener:', error);
      }
    });
  }

  /**
   * Manually trigger a health check for a specific provider
   * @param {string} providerId - Provider identifier
   */
  async triggerHealthCheck(providerId) {
    return await this.checkProviderHealth(providerId);
  }

  /**
   * Enable or disable health monitoring for a provider
   * @param {string} providerId - Provider identifier
   * @param {boolean} enabled - Whether to enable monitoring
   */
  setProviderEnabled(providerId, enabled) {
    const config = this.providers.get(providerId);
    if (config) {
      config.enabled = enabled;
      console.log(`[HealthMonitor] ${enabled ? 'Enabled' : 'Disabled'} monitoring for ${providerId}`);
    }
  }

  /**
   * Get health statistics
   * @returns {object} Health statistics
   */
  getStatistics() {
    let total = 0;
    let healthy = 0;
    let unhealthy = 0;
    let error = 0;
    let unknown = 0;

    for (const config of this.providers.values()) {
      total++;
      switch (config.lastStatus) {
        case 'healthy':
          healthy++;
          break;
        case 'unhealthy':
          unhealthy++;
          break;
        case 'error':
          error++;
          break;
        default:
          unknown++;
      }
    }

    return {
      total,
      healthy,
      unhealthy,
      error,
      unknown,
      healthPercentage: total > 0 ? (healthy / total) * 100 : 0
    };
  }

  /**
   * Clear health history for a provider
   * @param {string} providerId - Provider identifier
   */
  clearHistory(providerId) {
    this.healthHistory.set(providerId, []);
  }

  /**
   * Clear all health history
   */
  clearAllHistory() {
    for (const providerId of this.providers.keys()) {
      this.healthHistory.set(providerId, []);
    }
  }

  /**
   * Destroy the health monitor
   */
  destroy() {
    this.stop();
    this.providers.clear();
    this.healthHistory.clear();
    this.listeners.clear();
    console.log('[HealthMonitor] Destroyed');
  }
}

// Singleton instance
let healthMonitorInstance = null;

/**
 * Get the singleton health monitor instance
 * @returns {HealthMonitor} Health monitor instance
 */
export function getHealthMonitor() {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new HealthMonitor();
  }
  return healthMonitorInstance;
}

export default HealthMonitor;
