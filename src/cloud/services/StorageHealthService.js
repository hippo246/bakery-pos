// Storage Health Service
// Monitors and reports on storage provider health

import registry from '../ProviderRegistry.js';

/**
 * Storage Health Service
 * Service for monitoring provider health and status
 */
class StorageHealthService {
  constructor() {
    this.initialized = false;
    this.healthHistory = new Map();
    this.maxHistorySize = 100;
  }

  /**
   * Initialize health service
   */
  async initialize() {
    if (this.initialized) return;
    await registry.initialize();
    this.initialized = true;
  }

  /**
   * Perform health check on provider
   * @param {string} providerId 
   * @returns {Promise<{healthy: boolean, latency: number, error?: string}>}
   */
  async checkProviderHealth(providerId) {
    try {
      await this.initialize();

      const provider = registry.getProvider(providerId);
      if (!provider) {
        return { healthy: false, latency: 0, error: 'Provider not found' };
      }

      const startTime = Date.now();
      const result = await provider.healthCheck();
      const latency = Date.now() - startTime;

      // Record health history
      this.recordHealthHistory(providerId, {
        healthy: result.healthy,
        latency,
        timestamp: new Date().toISOString(),
        error: result.error
      });

      return result;
    } catch (error) {
      return { healthy: false, latency: 0, error: error.message };
    }
  }

  /**
   * Perform health check on active provider
   * @returns {Promise<{healthy: boolean, latency: number, error?: string}>}
   */
  async checkActiveProviderHealth() {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { healthy: false, latency: 0, error: 'No active provider' };
      }

      return await this.checkProviderHealth(provider.providerId || 'unknown');
    } catch (error) {
      return { healthy: false, latency: 0, error: error.message };
    }
  }

  /**
   * Perform health check on all providers
   * @returns {Promise<object>}
   */
  async checkAllProvidersHealth() {
    try {
      await this.initialize();

      const providers = registry.getAllProviders();
      const results = {};

      for (const { id } of providers) {
        results[id] = await this.checkProviderHealth(id);
      }

      return results;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Record health history
   * @param {string} providerId 
   * @param {object} healthData 
   */
  recordHealthHistory(providerId, healthData) {
    if (!this.healthHistory.has(providerId)) {
      this.healthHistory.set(providerId, []);
    }

    const history = this.healthHistory.get(providerId);
    history.push(healthData);

    // Limit history size
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Get health history for provider
   * @param {string} providerId 
   * @returns {Array}
   */
  getHealthHistory(providerId) {
    return this.healthHistory.get(providerId) || [];
  }

  /**
   * Get health score for provider
   * @param {string} providerId 
   * @returns {number}
   */
  getHealthScore(providerId) {
    const history = this.getHealthHistory(providerId);
    if (history.length === 0) return 0;

    const recentHistory = history.slice(-10); // Last 10 checks
    const healthyCount = recentHistory.filter(h => h.healthy).length;

    return (healthyCount / recentHistory.length) * 100;
  }

  /**
   * Get average latency for provider
   * @param {string} providerId 
   * @returns {number}
   */
  getAverageLatency(providerId) {
    const history = this.getHealthHistory(providerId);
    if (history.length === 0) return 0;

    const recentHistory = history.slice(-10);
    const totalLatency = recentHistory.reduce((sum, h) => sum + h.latency, 0);

    return totalLatency / recentHistory.length;
  }

  /**
   * Get overall health status
   * @returns {object}
   */
  async getOverallHealthStatus() {
    try {
      await this.initialize();

      const providers = registry.getAllProviders();
      const activeProvider = registry.getActiveProvider();

      const results = {
        providers: {},
        activeProvider: activeProvider ? activeProvider.providerId : null,
        overallHealthy: true,
        timestamp: new Date().toISOString()
      };

      for (const { id } of providers) {
        const health = await this.checkProviderHealth(id);
        const score = this.getHealthScore(id);
        const avgLatency = this.getAverageLatency(id);

        results.providers[id] = {
          healthy: health.healthy,
          score,
          averageLatency: avgLatency,
          lastCheck: health.timestamp
        };

        if (!health.healthy) {
          results.overallHealthy = false;
        }
      }

      return results;
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Clear health history
   * @param {string} providerId 
   */
  clearHealthHistory(providerId) {
    if (providerId) {
      this.healthHistory.delete(providerId);
    } else {
      this.healthHistory.clear();
    }
  }
}

// Singleton instance
const storageHealthService = new StorageHealthService();

export default storageHealthService;
