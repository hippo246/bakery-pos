// Backup Manager
// Orchestration layer that manages backup operations, scheduling, and retention

import { BackupEngine } from './BackupEngine.js';
import { BackupType, BackupStatus, BackupHealth, BackupModule, ScheduleFrequency, RetentionPolicyType } from './BackupTypes.js';
import storageEngine from '../cloud/StorageEngine.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';
import { getProviderEventManager } from '../cloud/ProviderEventManager.js';

export class BackupManager {
  constructor() {
    this.activeBackups = new Map();
    this.backupHistory = [];
    this.schedules = new Map();
    this.retentionPolicies = new Map();
    this.storageKey = 'cafeos_backup_manager';
    this.auditLogger = getProviderAuditLogger();
    this.eventManager = getProviderEventManager();
    this.maxHistorySize = 500;
    this.loadState();
  }

  /**
   * Create a new backup
   * @param {object} config - Backup configuration
   * @returns {Promise<object>} Backup result
   */
  async createBackup(config = {}) {
    try {
      const backupConfig = {
        type: config.type || BackupType.MANUAL,
        modules: config.modules || Object.values(BackupModule),
        name: config.name || `Backup ${new Date().toLocaleString()}`,
        description: config.description || '',
        tags: config.tags || [],
        notes: config.notes || '',
        creator: config.creator || 'manual',
        compressionAlgorithm: config.compressionAlgorithm,
        encryptionEnabled: config.encryptionEnabled,
        verificationEnabled: config.verificationEnabled !== false,
        encryptionKey: config.encryptionKey,
        priority: config.priority || 'normal'
      };

      // Check if a backup is already in progress
      if (this.activeBackups.size > 0) {
        const activeBackup = Array.from(this.activeBackups.values())[0];
        if (activeBackup.status === BackupStatus.IN_PROGRESS) {
          return {
            success: false,
            error: 'A backup is already in progress',
            activeBackupId: activeBackup.backupId
          };
        }
      }

      // Create backup engine instance
      const backupEngine = new BackupEngine(backupConfig);
      await backupEngine.initialize();

      // Store active backup
      this.activeBackups.set(backupEngine.backupId, backupEngine);

      // Start backup in background
      this.runBackupInBackground(backupEngine);

      return {
        success: true,
        backupId: backupEngine.backupId,
        status: 'started'
      };
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'backup_create',
        details: { error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Run backup in background
   * @param {BackupEngine} backupEngine - Backup engine instance
   */
  async runBackupInBackground(backupEngine) {
    try {
      const result = await backupEngine.start();

      // Move from active to history
      this.activeBackups.delete(backupEngine.backupId);
      this.addToHistory(backupEngine.getMetadata());

      this.saveState();

      // Emit completion event
      this.eventManager.emit('backup_job_completed', {
        backupId: backupEngine.backupId,
        success: result.success
      });

      // Handle failure with retry
      if (!result.success && backupEngine.canRetry()) {
        await this.retryBackup(backupEngine);
      }
    } catch (error) {
      console.error('Backup job failed:', error);
      backupEngine.setError(error.message);
      this.activeBackups.delete(backupEngine.backupId);
      this.addToHistory(backupEngine.getMetadata());
      this.saveState();
    }
  }

  /**
   * Retry a failed backup
   * @param {BackupEngine} backupEngine - Backup engine instance
   */
  async retryBackup(backupEngine) {
    backupEngine.incrementRetry();
    backupEngine.setStatus(BackupStatus.PENDING);
    backupEngine.setError(null);

    this.auditLogger.log({
      level: 'warning',
      operation: 'backup_retry',
      details: {
        backupId: backupEngine.backupId,
        retryCount: backupEngine.retryCount
      },
      success: true
    });

    // Queue retry with delay
    setTimeout(() => {
      this.runBackupInBackground(backupEngine);
    }, 5000 * backupEngine.retryCount); // Exponential backoff
  }

  /**
   * Cancel an active backup
   * @param {string} backupId - Backup ID
   * @returns {Promise<object>} Cancellation result
   */
  async cancelBackup(backupId) {
    const backupEngine = this.activeBackups.get(backupId);
    if (!backupEngine) {
      return { success: false, error: 'Backup not found or not active' };
    }

    const result = await backupEngine.cancel();
    this.activeBackups.delete(backupId);
    this.addToHistory(backupEngine.getMetadata());
    this.saveState();

    return result;
  }

  /**
   * Get backup progress
   * @param {string} backupId - Backup ID
   * @returns {object} Progress information
   */
  getBackupProgress(backupId) {
    const backupEngine = this.activeBackups.get(backupId);
    if (!backupEngine) {
      // Check history
      const historyEntry = this.backupHistory.find(b => b.backupId === backupId);
      if (historyEntry) {
        return {
          status: historyEntry.status,
          percentage: 100,
          message: historyEntry.status === BackupStatus.COMPLETED ? 'Completed' : 'Failed'
        };
      }
      return { error: 'Backup not found' };
    }

    return backupEngine.getProgress();
  }

  /**
   * Get backup history
   * @param {object} filters - Optional filters
   * @returns {Array} Backup history
   */
  getBackupHistory(filters = {}) {
    let history = [...this.backupHistory];

    if (filters.type) {
      history = history.filter(b => b.type === filters.type);
    }

    if (filters.status) {
      history = history.filter(b => b.status === filters.status);
    }

    if (filters.providerId) {
      history = history.filter(b => b.providerId === filters.providerId);
    }

    if (filters.since) {
      history = history.filter(b => new Date(b.createdAt) >= new Date(filters.since));
    }

    if (filters.until) {
      history = history.filter(b => new Date(b.createdAt) <= new Date(filters.until));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by creation date descending
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return history;
  }

  /**
   * Get a specific backup
   * @param {string} backupId - Backup ID
   * @returns {object|null} Backup metadata
   */
  getBackup(backupId) {
    // Check active backups
    const activeBackup = this.activeBackups.get(backupId);
    if (activeBackup) {
      return activeBackup.getMetadata();
    }

    // Check history
    return this.backupHistory.find(b => b.backupId === backupId) || null;
  }

  /**
   * Delete a backup
   * @param {string} backupId - Backup ID
   * @returns {Promise<object>} Deletion result
   */
  async deleteBackup(backupId) {
    try {
      const backup = this.getBackup(backupId);
      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      // Delete from storage
      if (backup.storageKey) {
        const deleteResult = await storageEngine.delete(backup.storageKey);
        if (!deleteResult.success) {
          console.warn('Failed to delete backup from storage:', deleteResult.error);
        }
      }

      // Remove from history
      this.backupHistory = this.backupHistory.filter(b => b.backupId !== backupId);
      this.saveState();

      this.auditLogger.log({
        level: 'info',
        operation: 'backup_delete',
        providerId: backup.providerId,
        details: { backupId },
        success: true
      });

      this.eventManager.emit('backup.deleted', { backupId });

      return { success: true };
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'backup_delete',
        details: { backupId, error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Add backup to history
   * @param {object} metadata - Backup metadata
   */
  addToHistory(metadata) {
    this.backupHistory.push(metadata);

    // Trim history if it exceeds max size
    if (this.backupHistory.length > this.maxHistorySize) {
      this.backupHistory = this.backupHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Create a backup schedule
   * @param {object} scheduleConfig - Schedule configuration
   * @returns {object} Schedule result
   */
  createSchedule(scheduleConfig) {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const schedule = {
      scheduleId,
      name: scheduleConfig.name || 'Scheduled Backup',
      frequency: scheduleConfig.frequency || ScheduleFrequency.DAILY,
      time: scheduleConfig.time || '00:00',
      enabled: scheduleConfig.enabled !== false,
      modules: scheduleConfig.modules || Object.values(BackupModule),
      type: scheduleConfig.type || BackupType.SCHEDULED,
      compressionEnabled: scheduleConfig.compressionEnabled !== false,
      encryptionEnabled: scheduleConfig.encryptionEnabled !== false,
      verificationEnabled: scheduleConfig.verificationEnabled !== false,
      retryOnFailure: scheduleConfig.retryOnFailure !== false,
      maxRetries: scheduleConfig.maxRetries || 3,
      lastRun: null,
      nextRun: this.calculateNextRun(scheduleConfig.frequency, scheduleConfig.time),
      createdAt: new Date().toISOString()
    };

    this.schedules.set(scheduleId, schedule);
    this.saveState();

    this.auditLogger.log({
      level: 'info',
      operation: 'schedule_create',
      details: { scheduleId, ...schedule },
      success: true
    });

    return { success: true, scheduleId, schedule };
  }

  /**
   * Calculate next run time based on frequency
   * @param {string} frequency - Schedule frequency
   * @param {string} time - Time in HH:MM format
   * @returns {string} ISO timestamp of next run
   */
  calculateNextRun(frequency, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun.toISOString();
  }

  /**
   * Update a schedule
   * @param {string} scheduleId - Schedule ID
   * @param {object} updates - Schedule updates
   * @returns {object} Update result
   */
  updateSchedule(scheduleId, updates) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return { success: false, error: 'Schedule not found' };
    }

    Object.assign(schedule, updates);
    if (updates.frequency || updates.time) {
      schedule.nextRun = this.calculateNextRun(
        updates.frequency || schedule.frequency,
        updates.time || schedule.time
      );
    }

    this.schedules.set(scheduleId, schedule);
    this.saveState();

    this.auditLogger.log({
      level: 'info',
      operation: 'schedule_update',
      details: { scheduleId, updates },
      success: true
    });

    return { success: true, schedule };
  }

  /**
   * Delete a schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {object} Deletion result
   */
  deleteSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return { success: false, error: 'Schedule not found' };
    }

    this.schedules.delete(scheduleId);
    this.saveState();

    this.auditLogger.log({
      level: 'info',
      operation: 'schedule_delete',
      details: { scheduleId },
      success: true
    });

    return { success: true };
  }

  /**
   * Get all schedules
   * @returns {Array} All schedules
   */
  getSchedules() {
    return Array.from(this.schedules.values());
  }

  /**
   * Get a specific schedule
   * @param {string} scheduleId - Schedule ID
   * @returns {object|null} Schedule
   */
  getSchedule(scheduleId) {
    return this.schedules.get(scheduleId) || null;
  }

  /**
   * Enable/disable a schedule
   * @param {string} scheduleId - Schedule ID
   * @param {boolean} enabled - Whether to enable
   * @returns {object} Result
   */
  setScheduleEnabled(scheduleId, enabled) {
    return this.updateSchedule(scheduleId, { enabled });
  }

  /**
   * Run a scheduled backup
   * @param {string} scheduleId - Schedule ID
   * @returns {Promise<object>} Result
   */
  async runScheduledBackup(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      return { success: false, error: 'Schedule not found' };
    }

    if (!schedule.enabled) {
      return { success: false, error: 'Schedule is disabled' };
    }

    // Update last run time
    schedule.lastRun = new Date().toISOString();
    schedule.nextRun = this.calculateNextRun(schedule.frequency, schedule.time);
    this.schedules.set(scheduleId, schedule);
    this.saveState();

    // Create backup
    return await this.createBackup({
      type: BackupType.SCHEDULED,
      modules: schedule.modules,
      name: `Scheduled: ${schedule.name}`,
      description: `Automated backup from schedule ${scheduleId}`,
      tags: ['scheduled'],
      compressionEnabled: schedule.compressionEnabled,
      encryptionEnabled: schedule.encryptionEnabled,
      verificationEnabled: schedule.verificationEnabled
    });
  }

  /**
   * Check and run due scheduled backups
   * @returns {Promise<Array>} Results of run backups
   */
  async checkAndRunSchedules() {
    const now = new Date();
    const results = [];

    for (const [scheduleId, schedule] of this.schedules.entries()) {
      if (!schedule.enabled) continue;

      const nextRun = new Date(schedule.nextRun);
      if (nextRun <= now) {
        const result = await this.runScheduledBackup(scheduleId);
        results.push({ scheduleId, result });
      }
    }

    return results;
  }

  /**
   * Create a retention policy
   * @param {object} policyConfig - Policy configuration
   * @returns {object} Policy result
   */
  createRetentionPolicy(policyConfig) {
    const policyId = `retention_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const policy = {
      policyId,
      name: policyConfig.name || 'Retention Policy',
      type: policyConfig.type || RetentionPolicyType.KEEP_LAST_X,
      value: policyConfig.value || 10,
      neverDeleteManual: policyConfig.neverDeleteManual !== false,
      keepMonthly: policyConfig.keepMonthly || false,
      keepYearly: policyConfig.keepYearly || false,
      enabled: policyConfig.enabled !== false,
      createdAt: new Date().toISOString()
    };

    this.retentionPolicies.set(policyId, policy);
    this.saveState();

    this.auditLogger.log({
      level: 'info',
      operation: 'retention_create',
      details: { policyId, ...policy },
      success: true
    });

    return { success: true, policyId, policy };
  }

  /**
   * Apply retention policies
   * @returns {Promise<object>} Result
   */
  async applyRetentionPolicies() {
    let deletedCount = 0;

    for (const [policyId, policy] of this.retentionPolicies.entries()) {
      if (!policy.enabled) continue;

      const result = await this.applyRetentionPolicy(policy);
      deletedCount += result.deletedCount;
    }

    this.auditLogger.log({
      level: 'info',
      operation: 'retention_cleanup',
      details: { deletedCount },
      success: true
    });

    return { success: true, deletedCount };
  }

  /**
   * Apply a single retention policy
   * @param {object} policy - Retention policy
   * @returns {Promise<object>} Result
   */
  async applyRetentionPolicy(policy) {
    let deletedCount = 0;

    switch (policy.type) {
      case RetentionPolicyType.KEEP_LAST_X:
        const backups = this.getBackupHistory();
        const toDelete = backups.slice(policy.value);
        for (const backup of toDelete) {
          if (policy.neverDeleteManual && backup.type === BackupType.MANUAL) continue;
          await this.deleteBackup(backup.backupId);
          deletedCount++;
        }
        break;

      case RetentionPolicyType.DELETE_AFTER_X_DAYS:
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.value);
        const oldBackups = this.getBackupHistory();
        for (const backup of oldBackups) {
          if (new Date(backup.createdAt) < cutoffDate) {
            if (policy.neverDeleteManual && backup.type === BackupType.MANUAL) continue;
            await this.deleteBackup(backup.backupId);
            deletedCount++;
          }
        }
        break;
    }

    return { success: true, deletedCount };
  }

  /**
   * Get backup statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const history = this.backupHistory;
    const activeCount = this.activeBackups.size;
    const totalBackups = history.length;
    const successfulBackups = history.filter(b => b.status === BackupStatus.COMPLETED).length;
    const failedBackups = history.filter(b => b.status === BackupStatus.FAILED).length;
    const healthyBackups = history.filter(b => b.health === BackupHealth.HEALTHY).length;
    const warningBackups = history.filter(b => b.health === BackupHealth.WARNING).length;
    const criticalBackups = history.filter(b => b.health === BackupHealth.CRITICAL).length;

    const totalSize = history.reduce((sum, b) => sum + (b.compressedSize || 0), 0);

    const schedules = this.getSchedules();
    const enabledSchedules = schedules.filter(s => s.enabled).length;

    return {
      activeBackups: activeCount,
      totalBackups,
      successfulBackups,
      failedBackups,
      successRate: totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0,
      healthyBackups,
      warningBackups,
      criticalBackups,
      totalSize,
      totalSchedules: schedules.length,
      enabledSchedules,
      recentBackups: history.slice(0, 5)
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        backupHistory: this.backupHistory,
        schedules: Array.from(this.schedules.entries()),
        retentionPolicies: Array.from(this.retentionPolicies.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save backup manager state:', error);
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
        this.backupHistory = parsed.backupHistory || [];
        this.schedules = new Map(parsed.schedules || []);
        this.retentionPolicies = new Map(parsed.retentionPolicies || []);
      }
    } catch (error) {
      console.error('Failed to load backup manager state:', error);
    }
  }

  /**
   * Clear all state
   */
  clearState() {
    this.activeBackups.clear();
    this.backupHistory = [];
    this.schedules.clear();
    this.retentionPolicies.clear();
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Destroy the backup manager
   */
  destroy() {
    this.clearState();
    console.log('[BackupManager] Destroyed');
  }
}

// Singleton instance
let backupManagerInstance = null;

/**
 * Get the singleton backup manager instance
 * @returns {BackupManager} Backup manager instance
 */
export function getBackupManager() {
  if (!backupManagerInstance) {
    backupManagerInstance = new BackupManager();
  }
  return backupManagerInstance;
}

export default BackupManager;
