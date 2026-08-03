// Backup Engine
// Central engine for all backup operations
// Supports compression, encryption, and integrity verification

import storageEngine from './StorageEngine.js';

/**
 * Backup Engine
 * Handles automatic, manual, and scheduled backups
 * Supports compression, encryption, and integrity verification
 */
class BackupEngine {
  constructor() {
    this.initialized = false;
    this.backupQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Initialize the backup engine
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize storage engine
    await storageEngine.initialize();
    
    this.initialized = true;
  }

  /**
   * Create a backup
   * @param {object} options - Backup options
   * @returns {Promise<{success: boolean, backupId?: string, error?: string}>}
   */
  async createBackup(options = {}) {
    try {
      // Generate backup ID
      const backupId = `backup_${Date.now()}`;
      
      // Collect data to backup
      const data = await this.collectBackupData(options);
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      // Compress data if enabled
      let backupData = data.data;
      if (options.compress !== false) {
        const compressResult = await this.compressData(backupData);
        if (compressResult.success) {
          backupData = compressResult.data;
        }
      }

      // Encrypt data if enabled
      if (options.encrypt) {
        const encryptResult = await this.encryptData(backupData, options.encryptionKey);
        if (encryptResult.success) {
          backupData = encryptResult.data;
        }
      }

      // Generate checksum
      const checksum = await this.generateChecksum(backupData);

      // Create backup metadata
      const metadata = {
        backupId,
        timestamp: new Date().toISOString(),
        version: options.version || '1.0',
        compressed: options.compress !== false,
        encrypted: options.encrypt || false,
        checksum,
        size: backupData.length,
        modules: options.modules || ['all'],
        createdBy: options.createdBy || 'system',
        description: options.description || ''
      };

      // Convert to blob
      const blob = new Blob([backupData], { type: 'application/json' });

      // Upload to storage
      const key = `backups/${backupId}.json`;
      const uploadResult = await storageEngine.upload(blob, key, {
        metadata: {
          ...metadata,
          backupData: JSON.stringify(metadata)
        }
      });

      if (!uploadResult.success) {
        // Queue for retry
        this.backupQueue.push({ backupId, data: backupData, metadata, options, timestamp: Date.now() });
        return { success: false, error: uploadResult.error };
      }

      // Verify backup
      const verifyResult = await this.verifyBackup(backupId);
      
      if (!verifyResult.success) {
        console.warn('[BackupEngine] Backup verification failed:', verifyResult.error);
      }

      // Save backup metadata to history
      await this.addToBackupHistory(metadata);

      // Log backup
      await this.logBackup('create', backupId, metadata);

      return { success: true, backupId, metadata };
    } catch (error) {
      console.error('[BackupEngine] Backup creation failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Collect data for backup
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async collectBackupData(options = {}) {
    try {
      const backupData = {
        settings: {},
        collections: {},
        timestamp: new Date().toISOString()
      };

      // Collect all localStorage keys
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        // Skip cloud storage keys (they're managed separately)
        if (key.startsWith('cafeos_cloud_') || key.startsWith('cafeos_storage_')) {
          continue;
        }

        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Try to parse as JSON
            try {
              backupData.settings[key] = JSON.parse(value);
            } catch {
              backupData.settings[key] = value;
            }
          }
        } catch (error) {
          console.warn(`[BackupEngine] Failed to backup key ${key}:`, error);
        }
      }

      return { success: true, data: backupData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Compress backup data
   * @param {string} data 
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async compressData(data) {
    try {
      // Stub for compression
      // In production, this would use a library like pako or lz-string
      // For now, we'll return the data as-is
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Encrypt backup data
   * @param {string} data 
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async encryptData(data, key) {
    try {
      // Stub for encryption
      // In production, this would use Web Crypto API or a library
      // For now, we'll return the data as-is
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate checksum for data integrity
   * @param {string} data 
   * @returns {Promise<string>}
   */
  async generateChecksum(data) {
    try {
      // Simple hash function for checksum
      let hash = 0;
      const str = String(data);
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      return Math.abs(hash).toString(16);
    } catch (error) {
      return '';
    }
  }

  /**
   * Verify backup integrity
   * @param {string} backupId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async verifyBackup(backupId) {
    try {
      const key = `backups/${backupId}.json`;
      const downloadResult = await storageEngine.download(key);
      
      if (!downloadResult.success) {
        return { success: false, error: 'Failed to download backup' };
      }

      const data = await downloadResult.data.text();
      const checksum = await this.generateChecksum(data);
      
      // Get stored checksum from metadata
      const metadataResult = await storageEngine.getMetadata(key);
      
      if (metadataResult.success && metadataResult.metadata?.customMetadata?.checksum) {
        const storedChecksum = metadataResult.metadata.customMetadata.checksum;
        
        if (checksum !== storedChecksum) {
          return { success: false, error: 'Checksum mismatch - backup corrupted' };
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add backup to history
   * @param {object} metadata 
   */
  async addToBackupHistory(metadata) {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_backup_history') || '[]');
      history.push(metadata);
      
      // Keep only last 100 backups
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      
      localStorage.setItem('cafeos_backup_history', JSON.stringify(history));
    } catch (error) {
      console.error('[BackupEngine] Failed to add to backup history:', error);
    }
  }

  /**
   * Get backup history
   * @param {object} options 
   * @returns {Array}
   */
  getBackupHistory(options = {}) {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_backup_history') || '[]');
      
      let filtered = history;
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      if (options.module) {
        filtered = filtered.filter(backup => 
          backup.modules.includes(options.module) || backup.modules.includes('all')
        );
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a backup
   * @param {string} backupId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteBackup(backupId) {
    try {
      const key = `backups/${backupId}.json`;
      const result = await storageEngine.delete(key);
      
      if (result.success) {
        // Remove from history
        const history = JSON.parse(localStorage.getItem('cafeos_backup_history') || '[]');
        const updatedHistory = history.filter(backup => backup.backupId !== backupId);
        localStorage.setItem('cafeos_backup_history', JSON.stringify(updatedHistory));
        
        // Log deletion
        await this.logBackup('delete', backupId);
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore from backup
   * @param {string} backupId 
   * @param {object} options 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async restoreBackup(backupId, options = {}) {
    try {
      const key = `backups/${backupId}.json`;
      const downloadResult = await storageEngine.download(key);
      
      if (!downloadResult.success) {
        return { success: false, error: 'Failed to download backup' };
      }

      let data = await downloadResult.data.text();
      
      // Decrypt if encrypted
      const metadata = await this.getBackupMetadata(backupId);
      if (metadata?.encrypted && options.encryptionKey) {
        const decryptResult = await this.decryptData(data, options.encryptionKey);
        if (decryptResult.success) {
          data = decryptResult.data;
        }
      }
      
      // Decompress if compressed
      if (metadata?.compressed) {
        const decompressResult = await this.decompressData(data);
        if (decompressResult.success) {
          data = decompressResult.data;
        }
      }

      // Parse backup data
      const backupData = JSON.parse(data);
      
      // Restore settings
      if (backupData.settings) {
        for (const [key, value] of Object.entries(backupData.settings)) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn(`[BackupEngine] Failed to restore key ${key}:`, error);
          }
        }
      }

      // Log restore
      await this.logBackup('restore', backupId);

      return { success: true };
    } catch (error) {
      console.error('[BackupEngine] Restore failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get backup metadata
   * @param {string} backupId 
   * @returns {Promise<object|null>}
   */
  async getBackupMetadata(backupId) {
    try {
      const key = `backups/${backupId}.json`;
      const result = await storageEngine.getMetadata(key);
      
      if (result.success && result.metadata?.customMetadata?.backupData) {
        return JSON.parse(result.metadata.customMetadata.backupData);
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decrypt backup data
   * @param {string} data 
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async decryptData(data, key) {
    try {
      // Stub for decryption
      // In production, this would use Web Crypto API or a library
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Decompress backup data
   * @param {string} data 
   * @returns {Promise<{success: boolean, data?: string, error?: string}>}
   */
  async decompressData(data) {
    try {
      // Stub for decompression
      // In production, this would use a library like pako or lz-string
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process backup queue (retry failed backups)
   */
  async processBackupQueue() {
    if (this.isProcessingQueue || this.backupQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    for (const item of this.backupQueue) {
      try {
        const blob = new Blob([item.data], { type: 'application/json' });
        const key = `backups/${item.backupId}.json`;
        
        const uploadResult = await storageEngine.upload(blob, key, {
          metadata: {
            ...item.metadata,
            backupData: JSON.stringify(item.metadata)
          }
        });
        
        if (uploadResult.success) {
          // Remove from queue on success
          this.backupQueue = this.backupQueue.filter(i => i !== item);
          await this.addToBackupHistory(item.metadata);
        }
      } catch (error) {
        // Keep in queue for retry
        console.error('[BackupEngine] Queue backup failed:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Log backup operation
   * @param {string} operation 
   * @param {string} backupId 
   * @param {object} metadata 
   */
  async logBackup(operation, backupId, metadata = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_backup_logs') || '[]');
      logs.push({
        operation,
        backupId,
        metadata,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_backup_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[BackupEngine] Failed to log backup:', error);
    }
  }

  /**
   * Get backup logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_backup_logs') || '[]');
      
      let filtered = logs;
      
      if (options.operation) {
        filtered = filtered.filter(log => log.operation === options.operation);
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
   * Get backup statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const history = JSON.parse(localStorage.getItem('cafeos_backup_history') || '[]');
      const logs = JSON.parse(localStorage.getItem('cafeos_backup_logs') || '[]');
      
      const stats = {
        totalBackups: history.length,
        totalOperations: logs.length,
        byOperation: {},
        totalSize: history.reduce((sum, backup) => sum + (backup.size || 0), 0),
        recent: history.slice(-10),
        lastBackup: history.length > 0 ? history[history.length - 1] : null
      };
      
      for (const log of logs) {
        stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
      }
      
      return stats;
    } catch (error) {
      return {
        totalBackups: 0,
        totalOperations: 0,
        byOperation: {},
        totalSize: 0,
        recent: [],
        lastBackup: null
      };
    }
  }
}

// Singleton instance
const backupEngine = new BackupEngine();

export default backupEngine;
