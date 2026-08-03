// Restore Manager
// Orchestration layer that manages restore operations, history, and health monitoring

import { _RestoreEngine } from './RestoreEngine.js';
import { createRestore } from './RestoreTypesImplementations.js';
import { RestoreType, RestoreStatus, RestoreHealth } from './RestoreTypes.js';
import { _getBackupManager } from '../backup/BackupManager.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';
import { getProviderEventManager } from '../cloud/ProviderEventManager.js';
import { getBackupSecurityManager } from '../backup/BackupSecurityManager.js';

export class RestoreManager {
  constructor() {
    this.activeRestores = new Map();
    this.restoreHistory = [];
    this.storageKey = 'cafeos_restore_manager';
    this.auditLogger = getProviderAuditLogger();
    this.eventManager = getProviderEventManager();
    this.securityManager = getBackupSecurityManager();
    this.maxHistorySize = 200;
    this.loadState();
  }

  /**
   * Create a new restore operation
   * @param {object} config - Restore configuration
   * @returns {Promise<object>} Restore result
   */
  async createRestore(config = {}) {
    try {
      // Check permissions
      const permissionCheck = this.securityManager.checkPermission(
        'CREATE_BACKUP', // Using backup permission as proxy for restore
        config.userRole || 'owner'
      );

      if (!permissionCheck.allowed) {
        return {
          success: false,
          error: 'Permission denied',
          requiresOwnerAuth: true
        };
      }

      const restoreConfig = {
        backupId: config.backupId,
        type: config.type || RestoreType.FULL,
        modules: config.modules || null,
        operator: config.operator || 'manual',
        createSafetyBackup: config.createSafetyBackup !== false,
        verifyAfterRestore: config.verifyAfterRestore !== false,
        dryRun: config.dryRun || false
      };

      // Check if a restore is already in progress
      if (this.activeRestores.size > 0) {
        const activeRestore = Array.from(this.activeRestores.values())[0];
        if (activeRestore.status === RestoreStatus.RESTORING) {
          return {
            success: false,
            error: 'A restore is already in progress',
            activeRestoreId: activeRestore.restoreId
          };
        }
      }

      // Create restore engine instance
      const restoreEngine = createRestore(restoreConfig);
      await restoreEngine.initialize();

      // Store active restore
      this.activeRestores.set(restoreEngine.restoreId, restoreEngine);

      // Start restore in background
      this.runRestoreInBackground(restoreEngine);

      return {
        success: true,
        restoreId: restoreEngine.restoreId,
        status: 'started'
      };
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'restore_create',
        details: { error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Run restore in background
   * @param {RestoreEngine} restoreEngine - Restore engine instance
   */
  async runRestoreInBackground(restoreEngine) {
    try {
      const result = await restoreEngine.start();

      // Move from active to history
      this.activeRestores.delete(restoreEngine.restoreId);
      this.addToHistory(restoreEngine.getMetadata());

      this.saveState();

      // Emit completion event
      this.eventManager.emit('restore_job_completed', {
        restoreId: restoreEngine.restoreId,
        success: result.success
      });
    } catch (error) {
      console.error('Restore job failed:', error);
      restoreEngine.setError(error.message);
      this.activeRestores.delete(restoreEngine.restoreId);
      this.addToHistory(restoreEngine.getMetadata());
      this.saveState();
    }
  }

  /**
   * Cancel an active restore
   * @param {string} restoreId - Restore ID
   * @returns {Promise<object>} Cancellation result
   */
  async cancelRestore(restoreId) {
    const restoreEngine = this.activeRestores.get(restoreId);
    if (!restoreEngine) {
      return { success: false, error: 'Restore not found or not active' };
    }

    const result = await restoreEngine.cancel();
    this.activeRestores.delete(restoreId);
    this.addToHistory(restoreEngine.getMetadata());
    this.saveState();

    return result;
  }

  /**
   * Get restore progress
   * @param {string} restoreId - Restore ID
   * @returns {object} Progress information
   */
  getRestoreProgress(restoreId) {
    const restoreEngine = this.activeRestores.get(restoreId);
    if (!restoreEngine) {
      // Check history
      const historyEntry = this.restoreHistory.find(r => r.restoreId === restoreId);
      if (historyEntry) {
        return {
          status: historyEntry.status,
          percentage: 100,
          message: historyEntry.status === RestoreStatus.COMPLETED ? 'Completed' : 'Failed'
        };
      }
      return { error: 'Restore not found' };
    }

    return restoreEngine.getProgress();
  }

  /**
   * Get restore history
   * @param {object} filters - Optional filters
   * @returns {Array} Restore history
   */
  getRestoreHistory(filters = {}) {
    let history = [...this.restoreHistory];

    if (filters.type) {
      history = history.filter(r => r.type === filters.type);
    }

    if (filters.status) {
      history = history.filter(r => r.status === filters.status);
    }

    if (filters.backupId) {
      history = history.filter(r => r.backupId === filters.backupId);
    }

    if (filters.since) {
      history = history.filter(r => new Date(r.startedAt) >= new Date(filters.since));
    }

    if (filters.until) {
      history = history.filter(r => new Date(r.startedAt) <= new Date(filters.until));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by start date descending
    history.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

    return history;
  }

  /**
   * Get a specific restore
   * @param {string} restoreId - Restore ID
   * @returns {object|null} Restore metadata
   */
  getRestore(restoreId) {
    // Check active restores
    const activeRestore = this.activeRestores.get(restoreId);
    if (activeRestore) {
      return activeRestore.getMetadata();
    }

    // Check history
    return this.restoreHistory.find(r => r.restoreId === restoreId) || null;
  }

  /**
   * Rollback a restore
   * @param {string} restoreId - Restore ID
   * @returns {Promise<object>} Rollback result
   */
  async rollbackRestore(restoreId) {
    try {
      const restore = this.getRestore(restoreId);
      if (!restore) {
        return { success: false, error: 'Restore not found' };
      }

      if (!restore.rollbackAvailable) {
        return { success: false, error: 'Rollback not available for this restore' };
      }

      // Check permissions
      const permissionCheck = this.securityManager.checkPermission(
        'DELETE_BACKUP',
        'owner'
      );

      if (!permissionCheck.allowed) {
        return {
          success: false,
          error: 'Permission denied',
          requiresOwnerAuth: true
        };
      }

      // Create restore engine for rollback
      const restoreEngine = createRestore({
        backupId: restore.safetyBackupId,
        type: RestoreType.ROLLBACK,
        modules: restore.modules,
        operator: 'rollback',
        originalRestoreId: restoreId,
        createSafetyBackup: false,
        verifyAfterRestore: true
      });

      await restoreEngine.initialize();
      const result = await restoreEngine.start();

      if (result.success) {
        // Update original restore metadata
        const historyIndex = this.restoreHistory.findIndex(r => r.restoreId === restoreId);
        if (historyIndex !== -1) {
          this.restoreHistory[historyIndex].rollbackId = restoreEngine.restoreId;
          this.restoreHistory[historyIndex].status = RestoreStatus.ROLLED_BACK;
        }
        this.saveState();
      }

      return result;
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'restore_rollback',
        details: { restoreId, error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add restore to history
   * @param {object} metadata - Restore metadata
   */
  addToHistory(metadata) {
    this.restoreHistory.push(metadata);

    // Trim history if it exceeds max size
    if (this.restoreHistory.length > this.maxHistorySize) {
      this.restoreHistory = this.restoreHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get restore statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.restoreHistory;
    const activeCount = this.activeRestores.size;
    const totalRestores = history.length;
    const successfulRestores = history.filter(r => r.status === RestoreStatus.COMPLETED).length;
    const failedRestores = history.filter(r => r.status === RestoreStatus.FAILED).length;
    const rolledBackRestores = history.filter(r => r.status === RestoreStatus.ROLLED_BACK).length;
    const healthyRestores = history.filter(r => r.health === RestoreHealth.HEALTHY).length;
    const warningRestores = history.filter(r => r.health === RestoreHealth.WARNING).length;
    const criticalRestores = history.filter(r => r.health === RestoreHealth.CRITICAL).length;

    const averageDuration = totalRestores > 0
      ? history.reduce((sum, r) => sum + (r.duration || 0), 0) / totalRestores
      : 0;

    const withRollback = history.filter(r => r.rollbackAvailable).length;

    return {
      activeRestores: activeCount,
      totalRestores,
      successfulRestores,
      failedRestores,
      rolledBackRestores,
      successRate: totalRestores > 0 ? (successfulRestores / totalRestores) * 100 : 0,
      healthyRestores,
      warningRestores,
      criticalRestores,
      averageDuration,
      withRollback,
      recentRestores: history.slice(0, 5)
    };
  }

  /**
   * Get restore health monitoring
   * @returns {object} Health monitoring data
   */
  getHealthMonitoring() {
    const history = this.restoreHistory;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const recentRestores = history.filter(r => new Date(r.startedAt) >= thirtyDaysAgo);
    const recentSuccessful = recentRestores.filter(r => r.status === RestoreStatus.COMPLETED);
    const recentFailed = recentRestores.filter(r => r.status === RestoreStatus.FAILED);

    const lastTestRestore = history
      .filter(r => r.type === RestoreType.DRY_RUN)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];

    const compatibilityWarnings = history.filter(r => 
      r.compatibility && r.compatibility.status === 'compatible_with_warnings'
    ).length;

    const recoveryReadinessScore = this.calculateRecoveryReadiness();

    return {
      successfulRestores: recentSuccessful.length,
      failedRestores: recentFailed.length,
      averageDuration: recentRestores.length > 0
        ? recentRestores.reduce((sum, r) => sum + (r.duration || 0), 0) / recentRestores.length
        : 0,
      lastTestRestore: lastTestRestore ? lastTestRestore.startedAt : null,
      rollbackCount: history.filter(r => r.status === RestoreStatus.ROLLED_BACK).length,
      compatibilityWarnings,
      recoveryReadinessScore
    };
  }

  /**
   * Calculate recovery readiness score
   * @returns {number} Readiness score (0-100)
   */
  calculateRecoveryReadiness() {
    const history = this.restoreHistory;
    let score = 100;

    // Deduct for failed restores
    const failedCount = history.filter(r => r.status === RestoreStatus.FAILED).length;
    score -= failedCount * 10;

    // Deduct for missing safety backups
    const withoutSafety = history.filter(r => !r.safetyBackupId).length;
    score -= withoutSafety * 5;

    // Deduct for old last test
    const lastTest = history
      .filter(r => r.type === RestoreType.DRY_RUN)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0];

    if (lastTest) {
      const daysSinceTest = (Date.now() - new Date(lastTest.startedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceTest > 7) {
        score -= (daysSinceTest - 7) * 2;
      }
    } else {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        restoreHistory: this.restoreHistory
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save restore manager state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.restoreHistory = parsed.restoreHistory || [];
      }
    } catch (error) {
      console.error('Failed to load restore manager state:', error);
    }
  }

  /**
   * Clear all state
   */
  clearState() {
    this.activeRestores.clear();
    this.restoreHistory = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Destroy the restore manager
   */
  destroy() {
    this.clearState();
    console.log('[RestoreManager] Destroyed');
  }
}

// Singleton instance
let restoreManagerInstance = null;

/**
 * Get the singleton restore manager instance
 * @returns {RestoreManager} Restore manager instance
 */
export function getRestoreManager() {
  if (!restoreManagerInstance) {
    restoreManagerInstance = new RestoreManager();
  }
  return restoreManagerInstance;
}

export default RestoreManager;
