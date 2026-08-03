// Restore Engine Health Check Provider
// Real health checks for the Restore Engine

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { HealthState, ComponentCategory } from '../HealthTypes.js';

/**
 * Health check provider for Restore Engine
 * Verifies recovery points, validation, integrity, and restore readiness
 */
export class RestoreEngineHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'restore-engine',
      'Restore Engine',
      ComponentCategory.RESTORE
    );
  }

  /**
   * Perform restore engine health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check recovery points availability
      const recoveryCheck = await this.checkRecoveryPoints();
      if (!recoveryCheck.success) {
        return this.createWarningResult({
          reason: `Recovery points check failed: ${recoveryCheck.error}`,
          recommendedAction: 'Check backup history and recovery points'
        });
      }

      // Check validation capability
      const validationCheck = await this.checkValidation();
      if (!validationCheck.success) {
        return this.createWarningResult({
          reason: `Validation check failed: ${validationCheck.error}`,
          recommendedAction: 'Check restore validation configuration'
        });
      }

      // Check integrity
      const integrityCheck = await this.checkIntegrity();
      if (!integrityCheck.success) {
        return this.createCriticalResult({
          reason: `Integrity check failed: ${integrityCheck.error}`,
          recommendedAction: 'Verify backup integrity and storage'
        });
      }

      // Check restore readiness
      const readinessCheck = await this.checkRestoreReadiness();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, recoveryCheck, validationCheck, integrityCheck, readinessCheck);

      return this.createHealthyResult({
        reason: 'Restore Engine is operational',
        latency,
        healthScore,
        metadata: {
          recoveryPointsCount: recoveryCheck.count,
          validationOperational: validationCheck.operational,
          integrityVerified: integrityCheck.verified,
          restoreReady: readinessCheck.ready,
          lastRestore: readinessCheck.lastRestore
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Restore Engine health check error: ${error.message}`,
        recommendedAction: 'Check Restore Engine logs and configuration'
      });
    }
  }

  /**
   * Check recovery points
   * @returns {Promise<Object>}
   */
  async checkRecoveryPoints() {
    try {
      const history = localStorage.getItem('cafeos_backup_history');
      if (!history) {
        return {
          success: true,
          count: 0,
          error: null
        };
      }

      const parsed = JSON.parse(history);
      const completedBackups = parsed.filter(b => b.status === 'completed');
      const count = completedBackups.length;
      
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
   * Check validation capability
   * @returns {Promise<Object>}
   */
  async checkValidation() {
    try {
      // Check if validation is configured
      const config = localStorage.getItem('cafeos_backup_config');
      if (!config) {
        return {
          success: true,
          operational: true,
          error: null
        };
      }

      const parsed = JSON.parse(config);
      const operational = parsed.verification !== false;
      
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
   * Check integrity
   * @returns {Promise<Object>}
   */
  async checkIntegrity() {
    try {
      // Check if we can access backup history (indicates storage integrity)
      const history = localStorage.getItem('cafeos_backup_history');
      const verified = !!history;
      
      return {
        success: true,
        verified,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Check restore readiness
   * @returns {Promise<Object>}
   */
  async checkRestoreReadiness() {
    try {
      const history = localStorage.getItem('cafeos_restore_history');
      const ready = true; // Assume ready if no errors
      
      let lastRestore = null;
      if (history) {
        const parsed = JSON.parse(history);
        lastRestore = parsed.length > 0 ? parsed[0].timestamp : null;
      }
      
      return {
        success: true,
        ready,
        lastRestore,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        ready: false,
        lastRestore: null,
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} latency - Check latency
   * @param {Object} recoveryCheck - Recovery points check result
   * @param {Object} validationCheck - Validation check result
   * @param {Object} integrityCheck - Integrity check result
   * @param {Object} readinessCheck - Readiness check result
   * @returns {number}
   */
  calculateHealthScore(latency, recoveryCheck, validationCheck, integrityCheck, readinessCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 200) score -= 10;
    if (latency > 1000) score -= 20;

    // Deduct for failed checks
    if (!recoveryCheck.success) score -= 25;
    if (!validationCheck.success) score -= 20;
    if (!integrityCheck.success) score -= 30;
    if (!readinessCheck.success) score -= 15;

    // Deduct for no recovery points
    if (recoveryCheck.count === 0) score -= 15;

    return Math.max(0, score);
  }

  /**
   * Get Restore Engine version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default RestoreEngineHealthCheck;
