// Migration Engine for Cloud Storage Platform
// Handles provider switching with data copy and verification

import storageEngine from './StorageEngine.js';
import backupEngine from './BackupEngine.js';

/**
 * Migration Engine
 * Handles migration of data between cloud storage providers
 * Supports data copy, verification, and fail-safe deactivation
 */
class MigrationEngine {
  constructor() {
    this.initialized = false;
    this.migrationQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Initialize the migration engine
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize storage engine
    await storageEngine.initialize();
    
    // Initialize backup engine
    await backupEngine.initialize();
    
    this.initialized = true;
  }

  /**
   * Migrate data from one provider to another
   * @param {string} fromProviderId 
   * @param {string} toProviderId 
   * @param {object} options 
   * @returns {Promise<{success: boolean, migrationId?: string, error?: string}>}
   */
  async migrate(fromProviderId, toProviderId, options = {}) {
    try {
      const migrationId = `migration_${Date.now()}`;
      
      // Validate providers
      const fromProvider = storageEngine.getProvider(fromProviderId);
      const toProvider = storageEngine.getProvider(toProviderId);
      
      if (!fromProvider) {
        return { success: false, error: 'Source provider not found' };
      }
      
      if (!toProvider) {
        return { success: false, error: 'Destination provider not found' };
      }

      // Create pre-migration backup
      const backupResult = await backupEngine.createBackup({
        description: `Pre-migration backup: ${fromProviderId} to ${toProviderId}`,
        createdBy: 'migration_engine'
      });

      if (!backupResult.success) {
        console.warn('[MigrationEngine] Failed to create pre-migration backup');
      }

      // List all files from source provider
      const listResult = await fromProvider.list('', { limit: 10000 });
      
      if (!listResult.success) {
        return { success: false, error: 'Failed to list files from source provider' };
      }

      const files = listResult.files;
      const migrationStats = {
        totalFiles: files.length,
        copiedFiles: 0,
        failedFiles: 0,
        skippedFiles: 0,
        totalSize: 0,
        copiedSize: 0
      };

      // Copy files to destination provider
      for (const file of files) {
        try {
          // Download from source
          const downloadResult = await fromProvider.download(file.key);
          
          if (!downloadResult.success) {
            migrationStats.failedFiles++;
            continue;
          }

          // Upload to destination
          const uploadResult = await toProvider.upload(downloadResult.data, file.key, {
            metadata: file.metadata
          });

          if (uploadResult.success) {
            migrationStats.copiedFiles++;
            migrationStats.copiedSize += file.size || 0;
          } else {
            migrationStats.failedFiles++;
          }

          migrationStats.totalSize += file.size || 0;
        } catch (error) {
          console.error(`[MigrationEngine] Failed to migrate file ${file.key}:`, error);
          migrationStats.failedFiles++;
        }
      }

      // Verify migration
      const verifyResult = await this.verifyMigration(fromProviderId, toProviderId, files);
      
      if (!verifyResult.success) {
        // Rollback on verification failure
        if (backupResult.success) {
          await this.rollbackMigration(backupResult.backupId);
        }
        return { success: false, error: 'Migration verification failed' };
      }

      // Switch active provider if requested
      if (options.switchActive) {
        const currentActive = storageEngine.getActiveProvider();
        
        if (currentActive && currentActive.providerId === fromProviderId) {
          const switchResult = await storageEngine.setActiveProvider(toProviderId, options.userId);
          
          if (!switchResult.success) {
            return { success: false, error: 'Failed to switch active provider' };
          }
        }
      }

      // Deactivate old provider if requested
      if (options.deactivateOld) {
        await fromProvider.disable();
      }

      // Log migration
      await this.logMigration(migrationId, fromProviderId, toProviderId, migrationStats);

      return { 
        success: true, 
        migrationId, 
        stats: migrationStats,
        backupId: backupResult.backupId
      };
    } catch (error) {
      console.error('[MigrationEngine] Migration failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify migration between providers
   * @param {string} fromProviderId 
   * @param {string} toProviderId 
   * @param {Array} files 
   * @returns {Promise<{success: boolean, verified: number, failed: number}>}
   */
  async verifyMigration(fromProviderId, toProviderId, files) {
    try {
      const fromProvider = storageEngine.getProvider(fromProviderId);
      const toProvider = storageEngine.getProvider(toProviderId);
      
      let verified = 0;
      let failed = 0;

      for (const file of files) {
        try {
          // Get metadata from both providers
          const fromMeta = await fromProvider.getMetadata(file.key);
          const toMeta = await toProvider.getMetadata(file.key);
          
          if (fromMeta.success && toMeta.success) {
            // Compare sizes
            const fromSize = fromMeta.metadata?.size || 0;
            const toSize = toMeta.metadata?.size || 0;
            
            if (fromSize === toSize) {
              verified++;
            } else {
              failed++;
            }
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }
      }

      // Consider migration successful if at least 95% of files verified
      const successRate = verified / files.length;
      
      return { 
        success: successRate >= 0.95, 
        verified, 
        failed,
        successRate
      };
    } catch (error) {
      return { success: false, verified: 0, failed: files.length };
    }
  }

  /**
   * Rollback migration
   * @param {string} backupId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rollbackMigration(backupId) {
    try {
      const restoreResult = await backupEngine.restoreBackup(backupId);
      
      if (restoreResult.success) {
        await this.logMigrationEvent('rollback', backupId);
      }
      
      return restoreResult;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Preview migration without executing
   * @param {string} fromProviderId 
   * @param {string} toProviderId 
   * @returns {Promise<{success: boolean, preview?: object, error?: string}>}
   */
  async previewMigration(fromProviderId, toProviderId) {
    try {
      const fromProvider = storageEngine.getProvider(fromProviderId);
      const toProvider = storageEngine.getProvider(toProviderId);
      
      if (!fromProvider) {
        return { success: false, error: 'Source provider not found' };
      }
      
      if (!toProvider) {
        return { success: false, error: 'Destination provider not found' };
      }

      // List files from source
      const listResult = await fromProvider.list('', { limit: 10000 });
      
      if (!listResult.success) {
        return { success: false, error: 'Failed to list files from source provider' };
      }

      const files = listResult.files;
      
      // Calculate total size
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
      
      // Check destination health
      const toHealth = await toProvider.healthCheck();
      
      const preview = {
        fromProvider: fromProviderId,
        toProvider: toProviderId,
        fileCount: files.length,
        totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        destinationHealthy: toHealth.healthy,
        destinationLatency: toHealth.latency,
        estimatedTime: this.estimateMigrationTime(totalSize),
        warnings: []
      };

      // Add warnings
      if (!toHealth.healthy) {
        preview.warnings.push('Destination provider health check failed');
      }
      
      if (totalSize > 1024 * 1024 * 1024) { // 1GB
        preview.warnings.push('Large migration size - may take significant time');
      }

      return { success: true, preview };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Estimate migration time
   * @param {number} sizeInBytes 
   * @returns {string}
   */
  estimateMigrationTime(sizeInBytes) {
    // Assume 10MB/s transfer rate
    const bytesPerSecond = 10 * 1024 * 1024;
    const seconds = sizeInBytes / bytesPerSecond;
    
    if (seconds < 60) {
      return `${Math.round(seconds)} seconds`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)} minutes`;
    } else {
      return `${Math.round(seconds / 3600)} hours`;
    }
  }

  /**
   * Format bytes to human readable format
   * @param {number} bytes 
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get migration history
   * @param {object} options 
   * @returns {Array}
   */
  getMigrationHistory(options = {}) {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_migration_history') || '[]');
      
      let filtered = history;
      
      if (options.fromProvider) {
        filtered = filtered.filter(m => m.fromProvider === options.fromProvider);
      }
      
      if (options.toProvider) {
        filtered = filtered.filter(m => m.toProvider === options.toProvider);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Log migration
   * @param {string} migrationId 
   * @param {string} fromProvider 
   * @param {string} toProvider 
   * @param {object} stats 
   */
  async logMigration(migrationId, fromProvider, toProvider, stats) {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_migration_history') || '[]');
      history.push({
        migrationId,
        fromProvider,
        toProvider,
        stats,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 migrations
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      localStorage.setItem('cafeos_migration_history', JSON.stringify(history));
    } catch (error) {
      console.error('[MigrationEngine] Failed to log migration:', error);
    }
  }

  /**
   * Log migration event
   * @param {string} eventType 
   * @param {string} migrationId 
   * @param {object} details 
   */
  async logMigrationEvent(eventType, migrationId, details = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_migration_logs') || '[]');
      logs.push({
        eventType,
        migrationId,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_migration_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[MigrationEngine] Failed to log migration event:', error);
    }
  }

  /**
   * Get migration logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_migration_logs') || '[]');
      
      let filtered = logs;
      
      if (options.eventType) {
        filtered = filtered.filter(log => log.eventType === options.eventType);
      }
      
      if (options.migrationId) {
        filtered = filtered.filter(log => log.migrationId === options.migrationId);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get migration statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_migration_history') || '[]');
      const logs = JSON.parse(localStorage.getItem('cafeos_migration_logs') || '[]');
      
      const stats = {
        totalMigrations: history.length,
        successfulMigrations: history.filter(m => m.stats.failedFiles === 0).length,
        totalFilesMigrated: history.reduce((sum, m) => sum + (m.stats.copiedFiles || 0), 0),
        totalDataMigrated: history.reduce((sum, m) => sum + (m.stats.copiedSize || 0), 0),
        byProviderPair: {},
        recent: history.slice(-10),
        lastMigration: history.length > 0 ? history[history.length - 1] : null
      };
      
      for (const migration of history) {
        const pair = `${migration.fromProvider} -> ${migration.toProvider}`;
        stats.byProviderPair[pair] = (stats.byProviderPair[pair] || 0) + 1;
      }
      
      return stats;
    } catch (error) {
      return {
        totalMigrations: 0,
        successfulMigrations: 0,
        totalFilesMigrated: 0,
        totalDataMigrated: 0,
        byProviderPair: {},
        recent: [],
        lastMigration: null
      };
    }
  }
}

// Singleton instance
const migrationEngine = new MigrationEngine();

export default migrationEngine;
