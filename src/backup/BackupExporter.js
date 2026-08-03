// Backup Exporter
// Handles exporting backups in various formats

import { ExportFormat, EncryptionStatus } from './BackupTypes.js';
import storageEngine from '../cloud/StorageEngine.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';

export class BackupExporter {
  constructor() {
    this.auditLogger = getProviderAuditLogger();
  }

  /**
   * Export a backup to a downloadable file
   * @param {string} backupId - Backup ID
   * @param {object} options - Export options
   * @returns {Promise<object>} Export result
   */
  async exportBackup(backupId, options = {}) {
    try {
      const format = options.format || ExportFormat.ENCRYPTED_PACKAGE;
      const includeManifest = options.includeManifest !== false;
      const decrypt = options.decrypt || false;

      // Get backup metadata from backup manager
      const { getBackupManager } = await import('./BackupManager.js');
      const backupManager = getBackupManager();
      const backup = backupManager.getBackup(backupId);

      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      // Download backup from storage
      const downloadResult = await storageEngine.download(backup.storageKey);

      if (!downloadResult.success) {
        return { success: false, error: downloadResult.error };
      }

      let exportData = downloadResult.data;

      // Decrypt if requested and backup is encrypted
      if (decrypt && backup.encryptionStatus === EncryptionStatus.ENCRYPTED) {
        const { decryptData } = await import('../utils/setupSecurity.js');
        const encryptionKey = options.encryptionKey;
        if (!encryptionKey) {
          return { success: false, error: 'Encryption key required for decryption' };
        }
        
        const encryptedText = await exportData.text();
        const decryptedText = await decryptData(encryptedText, encryptionKey);
        exportData = new Blob([decryptedText], { type: 'application/json' });
      }

      // Prepare export package
      let exportBlob;
      let filename;

      switch (format) {
        case ExportFormat.ENCRYPTED_PACKAGE:
          exportBlob = exportData;
          filename = `${backup.name || backup.backupId}.backup`;
          break;

        case ExportFormat.ZIP:
          // For ZIP, we would need a ZIP library
          // For now, return as-is with .zip extension
          exportBlob = exportData;
          filename = `${backup.name || backup.backupId}.zip`;
          break;

        case ExportFormat.JSON:
          // Convert to JSON format
          const jsonPackage = {
            backup: backup,
            data: await exportData.text(),
            exportedAt: new Date().toISOString(),
            exporter: 'CafeOS Backup Engine'
          };
          exportBlob = new Blob([JSON.stringify(jsonPackage, null, 2)], { type: 'application/json' });
          filename = `${backup.name || backup.backupId}.json`;
          break;

        default:
          exportBlob = exportData;
          filename = `${backup.name || backup.backupId}.backup`;
      }

      // Create download link
      const url = URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log export
      this.auditLogger.log({
        level: 'info',
        operation: 'backup_export',
        providerId: backup.providerId,
        details: {
          backupId,
          format,
          filename,
          size: exportBlob.size
        },
        success: true
      });

      return {
        success: true,
        filename,
        size: exportBlob.size,
        format
      };
    } catch (error) {
      this.auditLogger.log({
        level: 'error',
        operation: 'backup_export',
        details: { backupId, error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Export multiple backups
   * @param {Array<string>} backupIds - Array of backup IDs
   * @param {object} options - Export options
   * @returns {Promise<object>} Export result
   */
  async exportMultipleBackups(backupIds, options = {}) {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const backupId of backupIds) {
      const result = await this.exportBackup(backupId, options);
      results.push({ backupId, result });

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      success: true,
      total: backupIds.length,
      successCount,
      failureCount,
      results
    };
  }

  /**
   * Get export information for a backup
   * @param {string} backupId - Backup ID
   * @returns {object} Export information
   */
  getExportInfo(backupId) {
    const { getBackupManager } = require('./BackupManager.js');
    const backupManager = getBackupManager();
    const backup = backupManager.getBackup(backupId);

    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    return {
      success: true,
      backupId,
      name: backup.name,
      size: backup.compressedSize,
      encryptionStatus: backup.encryptionStatus,
      verificationStatus: backup.verificationStatus,
      createdAt: backup.createdAt,
      supportedFormats: [
        ExportFormat.ENCRYPTED_PACKAGE,
        ExportFormat.JSON
      ],
      requiresDecryption: backup.encryptionStatus === EncryptionStatus.ENCRYPTED
    };
  }

  /**
   * Validate export options
   * @param {object} options - Export options
   * @returns {object} Validation result
   */
  validateExportOptions(options) {
    const errors = [];

    if (options.format && !Object.values(ExportFormat).includes(options.format)) {
      errors.push('Invalid export format');
    }

    if (options.decrypt && !options.encryptionKey) {
      errors.push('Encryption key required when decrypting');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Singleton instance
let backupExporterInstance = null;

/**
 * Get the singleton backup exporter instance
 * @returns {BackupExporter} Backup exporter instance
 */
export function getBackupExporter() {
  if (!backupExporterInstance) {
    backupExporterInstance = new BackupExporter();
  }
  return backupExporterInstance;
}

export default BackupExporter;
