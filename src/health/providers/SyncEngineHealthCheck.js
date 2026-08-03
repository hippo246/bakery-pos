// Sync Engine Health Check Provider
// Real health checks for the Sync Engine

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory, HealthCheckResult } from '../HealthTypes.js';

/**
 * Health check provider for Sync Engine
 * Verifies queue, pending jobs, retry queue, and sync performance
 */
export class SyncEngineHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'sync-engine',
      'Sync Engine',
      ComponentCategory.SYNC
    );
  }

  /**
   * Perform sync engine health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check sync configuration
      const configCheck = await this.checkSyncConfig();
      if (!configCheck.success) {
        return this.createWarningResult({
          reason: `Sync configuration check failed: ${configCheck.error}`,
          recommendedAction: 'Configure sync settings'
        });
      }

      // Check queue status
      const queueCheck = await this.checkQueueStatus();
      
      // Check pending jobs
      const pendingCheck = await this.checkPendingJobs();
      
      // Check retry queue
      const retryCheck = await this.checkRetryQueue();
      
      // Check failed jobs
      const failedCheck = await this.checkFailedJobs();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, configCheck, queueCheck, pendingCheck, retryCheck, failedCheck);

      // Determine overall status based on queue states
      let status = HealthState.HEALTHY;
      let reason = 'Sync Engine is operational';
      
      if (failedCheck.count > 10) {
        status = HealthState.CRITICAL;
        reason = `Too many failed sync jobs: ${failedCheck.count}`;
      } else if (failedCheck.count > 0) {
        status = HealthState.WARNING;
        reason = `${failedCheck.count} failed sync jobs`;
      } else if (retryCheck.count > 20) {
        status = HealthState.WARNING;
        reason = `High retry queue count: ${retryCheck.count}`;
      }

      return new HealthCheckResult({
        status,
        reason,
        latency,
        healthScore,
        metadata: {
          configValid: configCheck.valid,
          queueSize: queueCheck.size,
          pendingJobs: pendingCheck.count,
          retryQueue: retryCheck.count,
          failedJobs: failedCheck.count,
          averageSyncTime: queueCheck.averageTime
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Sync Engine health check error: ${error.message}`,
        recommendedAction: 'Check Sync Engine logs and configuration'
      });
    }
  }

  /**
   * Check sync configuration
   * @returns {Promise<Object>}
   */
  async checkSyncConfig() {
    try {
      const config = localStorage.getItem('cafeos_sync_config');
      const valid = !!config;
      
      return {
        success: valid,
        valid,
        error: valid ? null : 'Sync configuration not found'
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Check queue status
   * @returns {Promise<Object>}
   */
  async checkQueueStatus() {
    try {
      // Check sync queue from localStorage
      const queue = localStorage.getItem('cafeos_sync_queue');
      const size = queue ? JSON.parse(queue).length : 0;
      
      return {
        success: true,
        size,
        averageTime: 0, // Would be calculated from actual sync history
        error: null
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        averageTime: 0,
        error: error.message
      };
    }
  }

  /**
   * Check pending jobs
   * @returns {Promise<Object>}
   */
  async checkPendingJobs() {
    try {
      const queue = localStorage.getItem('cafeos_sync_queue');
      const count = queue ? JSON.parse(queue).filter(j => j.status === 'pending').length : 0;
      
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
      const queue = localStorage.getItem('cafeos_sync_queue');
      const count = queue ? JSON.parse(queue).filter(j => j.status === 'retry').length : 0;
      
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
   * Check failed jobs
   * @returns {Promise<Object>}
   */
  async checkFailedJobs() {
    try {
      const queue = localStorage.getItem('cafeos_sync_queue');
      const count = queue ? JSON.parse(queue).filter(j => j.status === 'failed').length : 0;
      
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
   * @param {Object} configCheck - Config check result
   * @param {Object} queueCheck - Queue check result
   * @param {Object} pendingCheck - Pending check result
   * @param {Object} retryCheck - Retry check result
   * @param {Object} failedCheck - Failed check result
   * @returns {number}
   */
  calculateHealthScore(latency, configCheck, queueCheck, pendingCheck, retryCheck, failedCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 200) score -= 10;
    if (latency > 1000) score -= 20;

    // Deduct for failed config
    if (!configCheck.success) score -= 30;

    // Deduct for queue issues
    if (pendingCheck.count > 50) score -= 10;
    if (retryCheck.count > 20) score -= 15;
    if (failedCheck.count > 0) score -= 20;
    if (failedCheck.count > 10) score -= 30;

    return Math.max(0, score);
  }

  /**
   * Get Sync Engine version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default SyncEngineHealthCheck;
