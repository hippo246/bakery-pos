// Backup Engine
// Core backup logic that handles data extraction, compression, encryption, and verification

import { BackupInterface } from './BackupInterface.js';
import { BackupType, BackupStatus, BackupHealth, BackupModule, EncryptionStatus, VerificationStatus, CompressionAlgorithm } from './BackupTypes.js';
import storageEngine from '../cloud/StorageEngine.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';
import { getProviderEventManager } from '../cloud/ProviderEventManager.js';

export class BackupEngine extends BackupInterface {
  constructor(config = {}) {
    super(config);
    this.progress = {
      currentStep: 'initializing',
      percentage: 0,
      message: 'Initializing backup...',
      details: {}
    };
    this.storageProvider = null;
    this.auditLogger = getProviderAuditLogger();
    this.eventManager = getProviderEventManager();
    this.compressionAlgorithm = config.compressionAlgorithm || CompressionAlgorithm.GZIP;
    this.encryptionEnabled = config.encryptionEnabled !== false;
    this.encryptionKey = config.encryptionKey || null;
    this.verificationEnabled = config.verificationEnabled !== false;
  }

  /**
   * Initialize the backup
   */
  async initialize() {
    try {
      this.backupId = this.generateBackupId();
      this.createdAt = new Date().toISOString();
      this.progress.currentStep = 'initializing';
      this.progress.percentage = 5;
      this.progress.message = 'Initializing backup...';

      // Get storage provider
      const providerInfo = storageEngine.getActiveProviderInfo();
      if (!providerInfo) {
        throw new Error('No storage provider available');
      }
      this.storageProvider = storageEngine;
      this.providerId = providerInfo.providerId;

      // Log initialization
      this.auditLogger.log({
        level: 'info',
        operation: 'backup_init',
        providerId: this.providerId,
        details: {
          backupId: this.backupId,
          type: this.type,
          modules: this.modules
        },
        success: true
      });

      this.eventManager.emit('backup.started', {
        backupId: this.backupId,
        type: this.type,
        modules: this.modules
      });

      this.setStatus(BackupStatus.PENDING);
      return { success: true, backupId: this.backupId };
    } catch (error) {
      this.setError(error.message);
      this.setStatus(BackupStatus.FAILED);
      this.auditLogger.log({
        level: 'error',
        operation: 'backup_init',
        providerId: this.providerId,
        details: { error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the backup process
   */
  async start() {
    try {
      this.setStatus(BackupStatus.IN_PROGRESS);
      const startTime = Date.now();

      // Step 1: Extract data
      this.progress.currentStep = 'extracting';
      this.progress.percentage = 10;
      this.progress.message = 'Extracting data from modules...';
      const extractedData = await this.extractData(this.modules);

      // Step 2: Compress data
      this.progress.currentStep = 'compressing';
      this.progress.percentage = 40;
      this.progress.message = 'Compressing backup data...';
      const compressedData = await this.compress(extractedData, this.compressionAlgorithm);
      this.size = extractedData.size || 0;
      this.compressedSize = compressedData.size || 0;
      this.compressionRatio = this.size > 0 ? (this.compressedSize / this.size) : 0;

      // Step 3: Encrypt data
      let finalData = compressedData;
      if (this.encryptionEnabled) {
        this.progress.currentStep = 'encrypting';
        this.progress.percentage = 60;
        this.progress.message = 'Encrypting backup data...';
        finalData = await this.encrypt(compressedData, this.encryptionKey);
        this.encryptionStatus = EncryptionStatus.ENCRYPTED;
      } else {
        this.encryptionStatus = EncryptionStatus.NOT_ENCRYPTED;
      }

      // Step 4: Generate manifest
      this.progress.currentStep = 'generating_manifest';
      this.progress.percentage = 70;
      this.progress.message = 'Generating backup manifest...';
      this.manifest = this.generateManifest();

      // Step 5: Calculate checksum
      this.progress.currentStep = 'calculating_checksum';
      this.progress.percentage = 80;
      this.progress.message = 'Calculating checksum...';
      this.checksum = await this.calculateChecksum(finalData);

      // Step 6: Upload to storage
      this.progress.currentStep = 'uploading';
      this.progress.percentage = 90;
      this.progress.message = 'Uploading backup to storage...';
      const storageKey = `backups/${this.backupId}.backup`;
      const uploadResult = await this.storageProvider.upload(storageKey, finalData, {
        contentType: 'application/octet-stream',
        metadata: {
          backupId: this.backupId,
          type: this.type,
          checksum: this.checksum,
          manifest: JSON.stringify(this.manifest)
        }
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      this.storageKey = storageKey;

      // Step 7: Verify backup
      if (this.verificationEnabled) {
        this.progress.currentStep = 'verifying';
        this.progress.percentage = 95;
        this.progress.message = 'Verifying backup integrity...';
        const verificationResult = await this.verify();
        this.verificationStatus = verificationResult.verified ? VerificationStatus.VERIFIED : VerificationStatus.VERIFICATION_FAILED;
      }

      // Complete
      this.completedAt = new Date().toISOString();
      this.duration = Date.now() - startTime;
      this.setStatus(BackupStatus.COMPLETED);
      this.setHealth(this.calculateHealth());

      this.progress.currentStep = 'completed';
      this.progress.percentage = 100;
      this.progress.message = 'Backup completed successfully';

      this.auditLogger.log({
        level: 'info',
        operation: 'backup_complete',
        providerId: this.providerId,
        details: {
          backupId: this.backupId,
          duration: this.duration,
          size: this.size,
          compressedSize: this.compressedSize,
          verificationStatus: this.verificationStatus
        },
        success: true
      });

      this.eventManager.emit('backup.completed', {
        backupId: this.backupId,
        duration: this.duration,
        size: this.compressedSize
      });

      return { success: true, backupId: this.backupId, metadata: this.getMetadata() };
    } catch (error) {
      this.setError(error.message);
      this.setStatus(BackupStatus.FAILED);
      this.setHealth(BackupHealth.CRITICAL);
      this.progress.message = `Backup failed: ${error.message}`;

      this.auditLogger.log({
        level: 'error',
        operation: 'backup_failed',
        providerId: this.providerId,
        details: {
          backupId: this.backupId,
          error: error.message,
          step: this.progress.currentStep
        },
        success: false
      });

      this.eventManager.emit('backup.failed', {
        backupId: this.backupId,
        error: error.message,
        step: this.progress.currentStep
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel the backup process
   */
  async cancel() {
    this.setStatus(BackupStatus.CANCELLED);
    this.progress.message = 'Backup cancelled';

    this.auditLogger.log({
      level: 'warning',
      operation: 'backup_cancelled',
      providerId: this.providerId,
      details: { backupId: this.backupId },
      success: true
    });

    this.eventManager.emit('backup.cancelled', { backupId: this.backupId });

    return { success: true };
  }

  /**
   * Get backup progress
   */
  getProgress() {
    return { ...this.progress };
  }

  /**
   * Extract data from specified modules
   */
  async extractData(modules) {
    const data = {
      modules: {},
      metadata: {
        extractedAt: new Date().toISOString(),
        modules: modules
      },
      size: 0
    };

    const totalModules = modules.length;
    let completedModules = 0;

    for (const module of modules) {
      this.progress.details.currentModule = module;
      this.progress.details.moduleProgress = `${completedModules}/${totalModules}`;

      try {
        const moduleData = await this.extractModuleData(module);
        data.modules[module] = moduleData;
        data.size += this.estimateSize(moduleData);
      } catch (error) {
        console.error(`Failed to extract module ${module}:`, error);
        data.modules[module] = { error: error.message };
      }

      completedModules++;
      this.progress.percentage = 10 + (completedModules / totalModules) * 30;
    }

    return data;
  }

  /**
   * Extract data from a single module
   */
  async extractModuleData(module) {
    // Get module data from localStorage
    const storageKey = `cafeos_${module}`;
    const data = localStorage.getItem(storageKey);

    if (!data) {
      return { data: null, exists: false };
    }

    try {
      return {
        data: JSON.parse(data),
        exists: true
      };
    } catch (error) {
      return {
        data: data,
        exists: true,
        isRaw: true
      };
    }
  }

  /**
   * Estimate size of data in bytes
   */
  estimateSize(data) {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Compress the backup data
   */
  async compress(data, algorithm = CompressionAlgorithm.GZIP) {
    try {
      const dataString = JSON.stringify(data);
      const blob = new Blob([dataString]);

      if (algorithm === CompressionAlgorithm.NONE) {
        return {
          data: blob,
          size: blob.size,
          algorithm: CompressionAlgorithm.NONE
        };
      }

      // Use CompressionStream API if available
      if (window.CompressionStream) {
        const stream = blob.stream();
        const compressedStream = stream.pipeThrough(new CompressionStream(algorithm));
        const compressedBlob = await new Response(compressedStream).blob();

        return {
          data: compressedBlob,
          size: compressedBlob.size,
          algorithm: algorithm
        };
      }

      // Fallback: return uncompressed
      console.warn('CompressionStream not available, returning uncompressed data');
      return {
        data: blob,
        size: blob.size,
        algorithm: CompressionAlgorithm.NONE
      };
    } catch (error) {
      console.error('Compression failed:', error);
      // Return uncompressed on error
      const dataString = JSON.stringify(data);
      const blob = new Blob([dataString]);
      return {
        data: blob,
        size: blob.size,
        algorithm: CompressionAlgorithm.NONE
      };
    }
  }

  /**
   * Encrypt the backup data
   */
  async encrypt(data, encryptionKey) {
    if (!encryptionKey) {
      throw new Error('Encryption key is required for encryption');
    }

    try {
      const { encryptData } = await import('../utils/setupSecurity.js');
      const dataString = await data.text();
      const encrypted = await encryptData(dataString, encryptionKey);

      const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });

      return {
        data: encryptedBlob,
        size: encryptedBlob.size,
        encrypted: true
      };
    } catch (error) {
      this.encryptionStatus = EncryptionStatus.ENCRYPTION_FAILED;
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Verify backup integrity
   */
  async verify() {
    try {
      // Download backup
      const downloadResult = await this.storageProvider.download(this.storageKey);
      if (!downloadResult.success) {
        throw new Error('Failed to download backup for verification');
      }

      // Verify checksum
      const data = await downloadResult.data.text();
      const calculatedChecksum = await this.calculateChecksum({ data });
      const checksumMatch = calculatedChecksum === this.checksum;

      // Verify manifest
      if (this.manifest) {
        const manifestValid = this.verifyManifest(this.manifest);
        if (!manifestValid) {
          return { verified: false, reason: 'Manifest verification failed' };
        }
      }

      return {
        verified: checksumMatch,
        checksumMatch,
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      return { verified: false, reason: error.message };
    }
  }

  /**
   * Calculate checksum of data
   */
  async calculateChecksum(data) {
    try {
      const dataString = typeof data === 'string' ? data : await data.text();
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Checksum calculation failed:', error);
      return null;
    }
  }

  /**
   * Generate backup manifest
   */
  generateManifest() {
    return {
      version: '1.0.0',
      cafeosVersion: this.getCafeOSVersion(),
      backupId: this.backupId,
      type: this.type,
      createdAt: this.createdAt,
      modules: this.modules,
      size: this.size,
      compressedSize: this.compressedSize,
      compressionRatio: this.compressionRatio,
      compressionAlgorithm: this.compressionAlgorithm,
      encryptionStatus: this.encryptionStatus,
      checksum: this.checksum,
      providerId: this.providerId,
      storageKey: this.storageKey,
      name: this.name,
      description: this.description,
      tags: this.tags,
      creator: this.creator,
      restoreCompatibility: this.getRestoreCompatibility()
    };
  }

  /**
   * Verify manifest integrity
   */
  verifyManifest(manifest) {
    const requiredFields = [
      'version',
      'backupId',
      'type',
      'createdAt',
      'modules',
      'checksum'
    ];

    for (const field of requiredFields) {
      if (!(field in manifest)) {
        console.error(`Manifest missing required field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate backup health score
   */
  calculateHealth() {
    const issues = [];

    // Check verification status
    if (this.verificationStatus !== VerificationStatus.VERIFIED) {
      issues.push('Backup not verified');
    }

    // Check encryption status
    if (this.encryptionStatus === EncryptionStatus.ENCRYPTION_FAILED) {
      issues.push('Encryption failed');
    }

    // Check if backup is old (older than 30 days)
    if (this.completedAt) {
      const age = Date.now() - new Date(this.completedAt).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (age > thirtyDays) {
        issues.push('Backup is older than 30 days');
      }
    }

    // Check status
    if (this.status === BackupStatus.FAILED) {
      return BackupHealth.CRITICAL;
    }

    if (this.status === BackupStatus.CORRUPTED) {
      return BackupHealth.CRITICAL;
    }

    // Determine health based on issues
    if (issues.length === 0) {
      return BackupHealth.HEALTHY;
    } else if (issues.length <= 2) {
      return BackupHealth.WARNING;
    } else {
      return BackupHealth.CRITICAL;
    }
  }

  /**
   * Get CafeOS version
   */
  getCafeOSVersion() {
    // This should be retrieved from a version constant or package.json
    return '1.0.0';
  }

  /**
   * Get restore compatibility
   */
  getRestoreCompatibility() {
    // This would check if the backup is compatible with current version
    return {
      compatible: true,
      minVersion: '1.0.0',
      maxVersion: '1.0.0'
    };
  }

  /**
   * Generate a unique backup ID
   */
  generateBackupId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `backup_${timestamp}_${random}`;
  }
}
