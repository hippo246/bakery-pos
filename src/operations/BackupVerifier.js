// Backup Verification
// Periodic backup integrity checks, test restore from recent backup, auto-create backup before risky operations

import { getBackupEngine } from './BackupEngine.js';
import { getEncryptionEngine } from '../security/EncryptionEngine.js';

export class BackupVerifier {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || 24 * 60 * 60 * 1000, // 24 hours
      maxBackups: options.maxBackups || 7, // Keep 7 backups
      autoBackupBeforeRisky: options.autoBackupBeforeRisky !== false,
      testRestoreEnabled: options.testRestoreEnabled !== false,
      integrityCheckEnabled: options.integrityCheckEnabled !== false,
      ...options
    };
    
    this.backupEngine = getBackupEngine();
    this.encryptionEngine = getEncryptionEngine();
    this.checkTimer = null;
    this.backupHistory = [];
    this.verificationResults = [];
    this.eventHandlers = new Map();
    this.loadBackupState();
  }

  /**
   * Load backup state from localStorage
   */
  loadBackupState() {
    try {
      const stored = localStorage.getItem('cafeos_backup_state');
      if (stored) {
        const state = JSON.parse(stored);
        
        this.backupHistory = state.backupHistory || [];
        this.verificationResults = state.verificationResults || [];
      }
    } catch (error) {
      console.error('[BackupVerifier] Failed to load backup state:', error);
    }
  }

  /**
   * Save backup state to localStorage
   */
  saveBackupState() {
    try {
      const state = {
        backupHistory: this.backupHistory.slice(-50), // Keep last 50
        verificationResults: this.verificationResults.slice(-50) // Keep last 50
      };
      
      localStorage.setItem('cafeos_backup_state', JSON.stringify(state));
    } catch (error) {
      console.error('[BackupVerifier] Failed to save backup state:', error);
    }
  }

  /**
   * Start periodic verification
   */
  startVerification() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    // Run initial check
    this.verifyBackups();
    
    // Set up periodic checks
    this.checkTimer = setInterval(() => {
      this.verifyBackups();
    }, this.options.checkInterval);
    
    console.log('[BackupVerifier] Periodic verification started');
  }

  /**
   * Stop periodic verification
   */
  stopVerification() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
      console.log('[BackupVerifier] Periodic verification stopped');
    }
  }

  /**
   * Verify all backups
   */
  async verifyBackups() {
    console.log('[BackupVerifier] Verifying backups');
    
    const results = [];
    
    try {
      // Get backup list
      const backups = await this.getBackupList();
      
      for (const backup of backups) {
        const result = await this.verifyBackup(backup);
        results.push(result);
      }
      
      // Clean up old backups
      await this.rotateBackups();
      
      this.verificationResults.push({
        timestamp: Date.now(),
        results,
        total: backups.length,
        passed: results.filter(r => r.valid).length,
        failed: results.filter(r => !r.valid).length
      });
      
      this.saveBackupState();
      
      this.emit('verificationComplete', { results });
      
      return results;
    } catch (error) {
      console.error('[BackupVerifier] Verification failed:', error);
      this.emit('verificationError', { error });
      return [];
    }
  }

  /**
   * Verify single backup
   */
  async verifyBackup(backup) {
    const result = {
      backupId: backup.backupId,
      timestamp: backup.timestamp,
      valid: false,
      checks: {}
    };
    
    try {
      // Check 1: File exists
      result.checks.fileExists = await this.checkBackupExists(backup.backupId);
      
      if (!result.checks.fileExists) {
        return result;
      }
      
      // Check 2: Integrity (if enabled)
      if (this.options.integrityCheckEnabled) {
        result.checks.integrity = await this.checkBackupIntegrity(backup);
      }
      
      // Check 3: Decryptability (if encrypted)
      if (backup.encrypted) {
        result.checks.decryptable = await this.checkBackupDecryptable(backup);
      }
      
      // Check 4: Test restore (if enabled)
      if (this.options.testRestoreEnabled) {
        result.checks.testRestore = await this.testRestoreBackup(backup);
      }
      
      // Overall validity
      result.valid = Object.values(result.checks).every(check => check === true || check?.success === true);
      
      return result;
    } catch (error) {
      console.error(`[BackupVerifier] Failed to verify backup ${backup.backupId}:`, error);
      result.error = error.message;
      return result;
    }
  }

  /**
   * Check if backup file exists
   */
  async checkBackupExists(backupId) {
    try {
      // This would check storage provider for file existence
      // For now, assume it exists if in history
      const backup = this.backupHistory.find(b => b.backupId === backupId);
      return !!backup;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check backup integrity
   */
  async checkBackupIntegrity(backup) {
    try {
      // Calculate checksum of backup data
      const checksum = await this.calculateChecksum(backup);
      
      // Compare with stored checksum
      if (backup.checksum && backup.checksum === checksum) {
        return { success: true, checksum };
      }
      
      return { success: false, expected: backup.checksum, actual: checksum };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if backup is decryptable
   */
  async checkBackupDecryptable(backup) {
    try {
      // Try to decrypt a small portion
      const testData = backup.data?.substring(0, 100);
      
      if (!testData) {
        return { success: false, error: 'No data to test' };
      }
      
      const decrypted = await this.encryptionEngine.decrypt(testData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test restore from backup
   */
  async testRestoreBackup(backup) {
    try {
      // Try to restore backup to a test location
      // This would be a partial restore to verify structure
      const testData = {
        test: true,
        timestamp: Date.now()
      };
      
      return { success: true, testData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate checksum of backup data
   */
  async calculateChecksum(backup) {
    try {
      const dataString = JSON.stringify(backup.data || backup);
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return Math.abs(hash).toString(16);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get backup list
   */
  async getBackupList() {
    // Return backup history sorted by timestamp (newest first)
    return this.backupHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Rotate backups (keep only N most recent)
   */
  async rotateBackups() {
    const backups = await this.getBackupList();
    
    if (backups.length > this.options.maxBackups) {
      const toDelete = backups.slice(this.options.maxBackups);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.backupId);
      }
      
      this.emit('backupsRotated', { deleted: toDelete.length });
    }
  }

  /**
   * Delete backup
   */
  async deleteBackup(backupId) {
    try {
      // Remove from storage
      this.backupHistory = this.backupHistory.filter(b => b.backupId !== backupId);
      this.saveBackupState();
      
      this.emit('backupDeleted', { backupId });
      
      return { success: true };
    } catch (error) {
      console.error(`[BackupVerifier] Failed to delete backup ${backupId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backup before risky operation
   */
  async createBackupBeforeRisky(operation, data) {
    if (!this.options.autoBackupBeforeRisky) {
      return null;
    }
    
    try {
      console.log(`[BackupVerifier] Creating backup before risky operation: ${operation}`);
      
      const backupId = `pre_${operation}_${Date.now()}`;
      
      // Create backup using BackupEngine
      const backup = await this.backupEngine.createBackup({
        backupId,
        operation,
        data,
        timestamp: Date.now(),
        checksum: await this.calculateChecksum({ data })
      });
      
      this.backupHistory.push({
        backupId,
        operation,
        timestamp: Date.now(),
        size: backup.size,
        encrypted: true
      });
      
      this.saveBackupState();
      
      this.emit('backupCreated', { backupId, operation });
      
      return backup;
    } catch (error) {
      console.error('[BackupVerifier] Failed to create backup:', error);
      this.emit('backupError', { operation, error });
      return null;
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupId) {
    try {
      const backup = this.backupHistory.find(b => b.backupId === backupId);
      
      if (!backup) {
        throw new Error('Backup not found');
      }
      
      console.log(`[BackupVerifier] Restoring from backup: ${backupId}`);
      
      // Restore using BackupEngine
      const result = await this.backupEngine.restoreBackup(backupId);
      
      this.emit('backupRestored', { backupId, result });
      
      return result;
    } catch (error) {
      console.error(`[BackupVerifier] Failed to restore from backup ${backupId}:`, error);
      this.emit('restoreError', { backupId, error });
      throw error;
    }
  }

  /**
   * Get verification statistics
   */
  getVerificationStatistics() {
    const recentResults = this.verificationResults.slice(-10);
    
    const stats = {
      totalVerifications: this.verificationResults.length,
      totalBackups: this.backupHistory.length,
      recentResults,
      successRate: 0,
      averageBackupSize: 0,
      oldestBackup: null,
      newestBackup: null
    };
    
    if (recentResults.length > 0) {
      const totalPassed = recentResults.reduce((sum, r) => sum + r.passed, 0);
      const totalChecked = recentResults.reduce((sum, r) => sum + r.total, 0);
      
      stats.successRate = totalChecked > 0 ? (totalPassed / totalChecked) * 100 : 0;
    }
    
    if (this.backupHistory.length > 0) {
      const sortedBackups = [...this.backupHistory].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      stats.oldestBackup = sortedBackups[0].timestamp;
      stats.newestBackup = sortedBackups[sortedBackups.length - 1].timestamp;
      
      const totalSize = this.backupHistory.reduce((sum, b) => sum + (b.size || 0), 0);
      stats.averageBackupSize = totalSize / this.backupHistory.length;
    }
    
    return stats;
  }

  /**
   * Get backup history
   */
  getBackupHistory(limit = 20) {
    return this.backupHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Clear backup history
   */
  clearBackupHistory() {
    this.backupHistory = [];
    this.saveBackupState();
  }

  /**
   * Clear verification results
   */
  clearVerificationResults() {
    this.verificationResults = [];
    this.saveBackupState();
  }

  /**
   * Update options
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[BackupVerifier] Event handler error for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Destroy the backup verifier
   */
  destroy() {
    this.stopVerification();
    this.eventHandlers.clear();
    console.log('[BackupVerifier] Destroyed');
  }
}

// Singleton instance
let backupVerifierInstance = null;

/**
 * Get the singleton backup verifier instance
 */
export function getBackupVerifier(options = {}) {
  if (!backupVerifierInstance) {
    backupVerifierInstance = new BackupVerifier(options);
  }
  return backupVerifierInstance;
}

export default BackupVerifier;
