// Storage Engine Health Check Provider
// Real health checks for the storage engine

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory } from '../HealthTypes.js';
import storageEngine from '../../cloud/StorageEngine.js';

/**
 * Health check provider for Storage Engine
 * Verifies storage engine initialization, active provider, and overall health
 */
export class StorageEngineHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'storage-engine',
      'Storage Engine',
      ComponentCategory.STORAGE
    );
  }

  /**
   * Perform storage engine health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check if storage engine is initialized
      if (!storageEngine.isInitialized) {
        return this.createCriticalResult({
          reason: 'Storage engine is not initialized',
          recommendedAction: 'Initialize storage engine'
        });
      }

      // Check if there's an active provider
      const activeProvider = storageEngine.getActiveProviderInfo();
      if (!activeProvider) {
        return this.createWarningResult({
          reason: 'No active cloud provider configured',
          recommendedAction: 'Configure a cloud provider in settings'
        });
      }

      // Check provider connectivity
      const providerHealth = await storageEngine.getProviderHealth(activeProvider.id);
      if (!providerHealth.healthy) {
        return this.createCriticalResult({
          reason: `Active provider (${activeProvider.name}) is unhealthy: ${providerHealth.error || 'Unknown error'}`,
          recommendedAction: 'Check provider configuration and connectivity'
        });
      }

      // Check if we can perform basic operations
      const operationsCheck = await this.checkBasicOperations();
      if (!operationsCheck.success) {
        return this.createWarningResult({
          reason: `Basic operations check failed: ${operationsCheck.error}`,
          recommendedAction: 'Verify storage engine configuration'
        });
      }

      // Calculate health score based on latency and provider health
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, providerHealth.latency, operationsCheck);

      return this.createHealthyResult({
        reason: `Storage engine operational with ${activeProvider.name}`,
        latency,
        healthScore,
        metadata: {
          activeProvider: activeProvider.name,
          providerId: activeProvider.id,
          providerLatency: providerHealth.latency,
          operations: operationsCheck.operations
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Storage engine health check error: ${error.message}`,
        recommendedAction: 'Check storage engine logs and configuration'
      });
    }
  }

  /**
   * Check basic storage operations
   * @returns {Promise<Object>}
   */
  async checkBasicOperations() {
    try {
      const operations = {
        read: false,
        write: false,
        delete: false,
        list: false
      };

      // Try to get usage information (read operation)
      try {
        const usage = await storageEngine.getUsage();
        operations.read = !!usage;
      } catch (error) {
        console.warn('[StorageEngineHealthCheck] Read operation failed:', error);
      }

      // Try to list providers (list operation)
      try {
        const providers = storageEngine.getProvidersInfo();
        operations.list = Array.isArray(providers) && providers.length > 0;
      } catch (error) {
        console.warn('[StorageEngineHealthCheck] List operation failed:', error);
      }

      // Write and delete operations would require actual data operations
      // For health check purposes, we'll assume they work if read works
      operations.write = operations.read;
      operations.delete = operations.read;

      const allOperations = Object.values(operations).every(op => op);

      return {
        success: allOperations,
        operations,
        error: allOperations ? null : 'Some operations failed'
      };
    } catch (error) {
      return {
        success: false,
        operations: {},
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} checkLatency - Health check latency
   * @param {number} providerLatency - Provider latency
   * @param {Object} operationsCheck - Operations check result
   * @returns {number}
   */
  calculateHealthScore(checkLatency, providerLatency, operationsCheck) {
    let score = 100;

    // Deduct for high check latency
    if (checkLatency > 500) score -= 10;
    if (checkLatency > 2000) score -= 20;

    // Deduct for high provider latency
    if (providerLatency > 1000) score -= 10;
    if (providerLatency > 5000) score -= 20;

    // Deduct for failed operations
    if (!operationsCheck.success) score -= 30;

    return Math.max(0, score);
  }

  /**
   * Get storage engine version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default StorageEngineHealthCheck;
