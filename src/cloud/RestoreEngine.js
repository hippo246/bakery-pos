// Restore Engine
// Central engine for all restore operations
// Supports preview, verification, and safe restoration

import backupEngine from './BackupEngine.js';
import importEngine from './ImportEngine.js';

/**
 * Restore Engine
 * Handles restore operations with preview and verification
 * Ensures safe restoration with rollback capability
 */
class RestoreEngine {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the restore engine
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize backup engine
    await backupEngine.initialize();
    
    // Initialize import engine
    await importEngine.initialize();
    
    this.initialized = true;
  }

  /**
   * Preview a restore before applying
   * @param {string} backupId 
   * @param {object} options 
   * @returns {Promise<{success: boolean, preview?: object, error?: string}>}
   */
  async previewRestore(backupId, options = {}) {
    try {
      // Get backup metadata
      const metadata = await backupEngine.getBackupMetadata(backupId);
      
      if (!metadata) {
        return { success: false, error: 'Backup not found' };
      }

      // Download backup data
      const key = `backups/${backupId}.json`;
      const downloadResult = await backupEngine.downloadBackup ? 
        await backupEngine.download(key) : 
        await importEngine.loadData(key, 'cloud');
      
      if (!downloadResult.success) {
        return { success: false, error: 'Failed to download backup' };
      }

      let data = downloadResult.data;
      
      // Decrypt if encrypted
      if (metadata.encrypted && options.encryptionKey) {
        const decryptResult = await backupEngine.decryptData(data, options.encryptionKey);
        if (decryptResult.success) {
          data = decryptResult.data;
        }
      }
      
      // Decompress if compressed
      if (metadata.compressed) {
        const decompressResult = await backupEngine.decompressData(data);
        if (decompressResult.success) {
          data = decompressResult.data;
        }
      }

      // Parse backup data
      const backupData = JSON.parse(data);

      // Build preview
      const preview = {
        backupId,
        metadata,
        settingsCount: Object.keys(backupData.settings || {}).length,
        collectionsCount: Object.keys(backupData.collections || {}).length,
        settings: backupData.settings || {},
        collections: backupData.collections || {},
        timestamp: backupData.timestamp,
        version: backupData.version,
        conflicts: [],
        warnings: []
      };

      // Check for conflicts with current data
      if (options.checkConflicts) {
        preview.conflicts = await this.detectConflicts(backupData);
      }

      // Check for warnings
      if (options.checkWarnings) {
        preview.warnings = await this.detectWarnings(backupData, metadata);
      }

      return { success: true, preview };
    } catch (error) {
      console.error('[RestoreEngine] Preview failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect conflicts between backup and current data
   * @param {object} backupData 
   * @returns {Array}
   */
  async detectConflicts(backupData) {
    const conflicts = [];

    if (!backupData.settings) {
      return conflicts;
    }

    for (const key of Object.keys(backupData.settings)) {
      const currentValue = localStorage.getItem(key);
      const backupValue = JSON.stringify(backupData.settings[key]);
      
      if (currentValue && currentValue !== backupValue) {
        conflicts.push({
          key,
          type: 'modified',
          hasCurrent: true,
          currentValue: currentValue.substring(0, 100) + '...',
          backupValue: backupValue.substring(0, 100) + '...'
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect warnings in backup data
   * @param {object} backupData 
   * @param {object} metadata 
   * @returns {Array}
   */
  async detectWarnings(backupData, metadata) {
    const warnings = [];

    // Check version compatibility
    if (metadata.version) {
      const currentVersion = '1.0'; // Should be fetched from app config
      if (metadata.version !== currentVersion) {
        warnings.push({
          type: 'version_mismatch',
          message: `Backup version ${metadata.version} differs from current version ${currentVersion}`
        });
      }
    }

    // Check backup age
    const backupAge = Date.now() - new Date(metadata.timestamp).getTime();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (backupAge > maxAge) {
      warnings.push({
        type: 'old_backup',
        message: `Backup is ${Math.floor(backupAge / (24 * 60 * 60 * 1000))} days old`
      });
    }

    // Check for missing keys
    if (backupData.settings) {
      const currentKeys = Object.keys(localStorage);
      const backupKeys = Object.keys(backupData.settings);
      
      const missingKeys = currentKeys.filter(key => !backupKeys.includes(key));
      if (missingKeys.length > 0) {
        warnings.push({
          type: 'missing_keys',
          message: `${missingKeys.length} current keys not in backup`,
          keys: missingKeys.slice(0, 10)
        });
      }
    }

    return warnings;
  }

  /**
   * Perform restore
   * @param {string} backupId 
   * @param {object} options 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async restore(backupId, options = {}) {
    try {
      // Create pre-restore backup
      const preRestoreBackup = await backupEngine.createBackup({
        description: 'Pre-restore backup',
        createdBy: 'restore_engine'
      });

      if (!preRestoreBackup.success) {
        console.warn('[RestoreEngine] Failed to create pre-restore backup');
      }

      // Verify backup integrity
      const verifyResult = await backupEngine.verifyBackup(backupId);
      
      if (!verifyResult.success) {
        return { success: false, error: 'Backup verification failed - backup may be corrupted' };
      }

      // Perform restore using backup engine
      const restoreResult = await backupEngine.restoreBackup(backupId, options);
      
      if (!restoreResult.success) {
        // Rollback on failure
        if (preRestoreBackup.success) {
          await backupEngine.restoreBackup(preRestoreBackup.backupId);
        }
        return restoreResult;
      }

      // Log restore
      await this.logRestore(backupId, preRestoreBackup.backupId);

      return { success: true };
    } catch (error) {
      console.error('[RestoreEngine] Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Selective restore - restore only specific keys
   * @param {string} backupId 
   * @param {string[]} keys 
   * @param {object} options 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async selectiveRestore(backupId, keys, options = {}) {
    try {
      // Preview backup to get data
      const previewResult = await this.previewRestore(backupId, options);
      
      if (!previewResult.success) {
        return { success: false, error: previewResult.error };
      }

      const backupData = previewResult.preview.settings;
      
      // Create pre-restore backup
      const preRestoreBackup = await backupEngine.createBackup({
        description: 'Pre-selective-restore backup',
        createdBy: 'restore_engine'
      });

      if (!preRestoreBackup.success) {
        console.warn('[RestoreEngine] Failed to create pre-restore backup');
      }

      // Restore only selected keys
      for (const key of keys) {
        if (backupData[key] !== undefined) {
          try {
            localStorage.setItem(key, JSON.stringify(backupData[key]));
          } catch (error) {
            console.warn(`[RestoreEngine] Failed to restore key ${key}:`, error);
          }
        }
      }

      // Log restore
      await this.logRestore(backupId, preRestoreBackup.backupId, keys);

      return { success: true };
    } catch (error) {
      console.error('[RestoreEngine] Selective restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback to a previous backup
   * @param {string} backupId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rollback(backupId) {
    try {
      const restoreResult = await backupEngine.restoreBackup(backupId);
      
      if (restoreResult.success) {
        await this.logRestore(backupId, null, null, 'rollback');
      }
      
      return restoreResult;
    } catch (error) {
      console.error('[RestoreEngine] Rollback failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Compare two backups
   * @param {string} backupId1 
   * @param {string} backupId2 
   * @returns {Promise<{success: boolean, comparison?: object, error?: string}>}
   */
  async compareBackups(backupId1, backupId2) {
    try {
      const preview1 = await this.previewRestore(backupId1);
      const preview2 = await this.previewRestore(backupId2);
      
      if (!preview1.success || !preview2.success) {
        return { success: false, error: 'Failed to load backups for comparison' };
      }

      const comparison = {
        backup1: {
          id: backupId1,
          timestamp: preview1.preview.metadata.timestamp,
          settingsCount: preview1.preview.settingsCount
        },
        backup2: {
          id: backupId2,
          timestamp: preview2.preview.metadata.timestamp,
          settingsCount: preview2.preview.settingsCount
        },
        differences: [],
        addedKeys: [],
        removedKeys: [],
        modifiedKeys: []
      };

      const settings1 = preview1.preview.settings;
      const settings2 = preview2.preview.settings;
      const allKeys = new Set([...Object.keys(settings1), ...Object.keys(settings2)]);

      for (const key of allKeys) {
        const value1 = JSON.stringify(settings1[key]);
        const value2 = JSON.stringify(settings2[key]);

        if (!(key in settings1)) {
          comparison.addedKeys.push(key);
        } else if (!(key in settings2)) {
          comparison.removedKeys.push(key);
        } else if (value1 !== value2) {
          comparison.modifiedKeys.push(key);
          comparison.differences.push({
            key,
            value1: value1.substring(0, 100) + '...',
            value2: value2.substring(0, 100) + '...'
          });
        }
      }

      return { success: true, comparison };
    } catch (error) {
      console.error('[RestoreEngine] Comparison failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get restore history
   * @param {object} options 
   * @returns {Array}
   */
  getRestoreHistory(options = {}) {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_restore_history') || '[]');
      
      let filtered = history;
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      if (options.backupId) {
        filtered = filtered.filter(entry => entry.backupId === options.backupId);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Log restore operation
   * @param {string} backupId 
   * @param {string} preRestoreBackupId 
   * @param {string[]} keys 
   * @param {string} operation 
   */
  async logRestore(backupId, preRestoreBackupId, keys = null, operation = 'restore') {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_restore_history') || '[]');
      history.push({
        operation,
        backupId,
        preRestoreBackupId,
        keys,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 entries
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      localStorage.setItem('cafeos_restore_history', JSON.stringify(history));
    } catch (error) {
      console.error('[RestoreEngine] Failed to log restore:', error);
    }
  }

  /**
   * Get restore statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_restore_history') || '[]');
      
      const stats = {
        totalRestores: history.length,
        byOperation: {},
        recent: history.slice(-10),
        lastRestore: history.length > 0 ? history[history.length - 1] : null
      };
      
      for (const entry of history) {
        stats.byOperation[entry.operation] = (stats.byOperation[entry.operation] || 0) + 1;
      }
      
      return stats;
    } catch (error) {
      return {
        totalRestores: 0,
        byOperation: {},
        recent: [],
        lastRestore: null
      };
    }
  }
}

// Singleton instance
const restoreEngine = new RestoreEngine();

export default restoreEngine;
