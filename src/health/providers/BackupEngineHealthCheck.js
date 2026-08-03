// Backup Engine Health Check Provider
// Real health checks for the Backup Engine

import { HealthCheckProvider } from '../HealthCheckProvider.js';
import { _HealthState, ComponentCategory } from '../HealthTypes.js';

/**
 * Health check provider for Backup Engine
 * Verifies scheduler, destination, encryption, and recovery points
 */
export class BackupEngineHealthCheck extends HealthCheckProvider {
  constructor() {
    super(
      'backup-engine',
      'Backup Engine',
      ComponentCategory.BACKUP
    );
  }

  /**
   * Perform backup engine health check
   * @returns {Promise<HealthCheckResult>}
   */
  async check() {
    const startTime = performance.now();

    try {
      // Check backup configuration
      const configCheck = await this.checkBackupConfig();
      if (!configCheck.success) {
        return this.createWarningResult({
          reason: `Backup configuration check failed: ${configCheck.error}`,
          recommendedAction: 'Configure backup settings'
        });
      }

      // Check scheduler
      const schedulerCheck = await this.checkScheduler();
      if (!schedulerCheck.success) {
        return this.createWarningResult({
          reason: `Scheduler check failed: ${schedulerCheck.error}`,
          recommendedAction: 'Check backup scheduler configuration'
        });
      }

      // Check destination availability
      const destinationCheck = await this.checkDestination();
      if (!destinationCheck.success) {
        return this.createCriticalResult({
          reason: `Destination check failed: ${destinationCheck.error}`,
          recommendedAction: 'Check cloud provider and storage destination'
        });
      }

      // Check encryption
      const encryptionCheck = await this.checkEncryption();
      if (!encryptionCheck.success) {
        return this.createWarningResult({
          reason: `Encryption check failed: ${encryptionCheck.error}`,
          recommendedAction: 'Check encryption configuration'
        });
      }

      // Check recovery points
      const recoveryCheck = await this.checkRecoveryPoints();
      
      // Calculate health score
      const latency = performance.now() - startTime;
      const healthScore = this.calculateHealthScore(latency, configCheck, schedulerCheck, destinationCheck, encryptionCheck, recoveryCheck);

      return this.createHealthyResult({
        reason: 'Backup Engine is operational',
        latency,
        healthScore,
        metadata: {
          configValid: configCheck.valid,
          schedulerEnabled: schedulerCheck.enabled,
          destinationAvailable: destinationCheck.available,
          encryptionEnabled: encryptionCheck.enabled,
          recoveryPointsCount: recoveryCheck.count,
          lastBackup: recoveryCheck.lastBackup
        }
      });

    } catch (error) {
      return this.createCriticalResult({
        reason: `Backup Engine health check error: ${error.message}`,
        recommendedAction: 'Check Backup Engine logs and configuration'
      });
    }
  }

  /**
   * Check backup configuration
   * @returns {Promise<Object>}
   */
  async checkBackupConfig() {
    try {
      const config = localStorage.getItem('cafeos_backup_config');
      const valid = !!config;
      
      return {
        success: valid,
        valid,
        error: valid ? null : 'Backup configuration not found'
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
   * Check scheduler
   * @returns {Promise<Object>}
   */
  async checkScheduler() {
    try {
      const config = localStorage.getItem('cafeos_backup_config');
      if (!config) {
        return {
          success: false,
          enabled: false,
          error: 'Backup configuration not found'
        };
      }

      const parsed = JSON.parse(config);
      const enabled = parsed.enabled !== false;
      
      return {
        success: true,
        enabled,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        enabled: false,
        error: error.message
      };
    }
  }

  /**
   * Check destination availability
   * @returns {Promise<Object>}
   */
  async checkDestination() {
    try {
      // Check if cloud provider is configured and available
      const activeProvider = localStorage.getItem('cafeos_active_provider');
      const available = !!activeProvider;
      
      return {
        success: available,
        available,
        error: available ? null : 'No cloud provider configured'
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
   * Check encryption
   * @returns {Promise<Object>}
   */
  async checkEncryption() {
    try {
      const config = localStorage.getItem('cafeos_backup_config');
      if (!config) {
        return {
          success: false,
          enabled: false,
          error: 'Backup configuration not found'
        };
      }

      const parsed = JSON.parse(config);
      const enabled = parsed.encryption !== false;
      
      return {
        success: true,
        enabled,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        enabled: false,
        error: error.message
      };
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
          lastBackup: null,
          error: null
        };
      }

      const parsed = JSON.parse(history);
      const count = parsed.length || 0;
      const lastBackup = count > 0 ? parsed[0].createdAt : null;
      
      return {
        success: true,
        count,
        lastBackup,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        count: 0,
        lastBackup: null,
        error: error.message
      };
    }
  }

  /**
   * Calculate health score
   * @param {number} latency - Check latency
   * @param {Object} configCheck - Config check result
   * @param {Object} schedulerCheck - Scheduler check result
   * @param {Object} destinationCheck - Destination check result
   * @param {Object} encryptionCheck - Encryption check result
   * @param {Object} recoveryCheck - Recovery points check result
   * @returns {number}
   */
  calculateHealthScore(latency, configCheck, schedulerCheck, destinationCheck, encryptionCheck, recoveryCheck) {
    let score = 100;

    // Deduct for high latency
    if (latency > 200) score -= 10;
    if (latency > 1000) score -= 20;

    // Deduct for failed checks
    if (!configCheck.success) score -= 20;
    if (!schedulerCheck.success) score -= 15;
    if (!destinationCheck.success) score -= 30;
    if (!encryptionCheck.success) score -= 15;

    // Deduct for no recovery points
    if (recoveryCheck.count === 0) score -= 10;

    return Math.max(0, score);
  }

  /**
   * Get Backup Engine version
   * @returns {string}
   */
  getVersion() {
    return '1.0.0';
  }
}

export default BackupEngineHealthCheck;
