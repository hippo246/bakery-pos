// Sync Engine
// Core synchronization logic that handles data transfer, verification, and conflict detection

import { SyncInterface } from './SyncInterface.js';
import { SyncDirection, SyncStatus, _SyncPriority } from './SyncTypes.js';
import storageEngine from '../cloud/StorageEngine.js';
import { getProviderAuditLogger } from '../cloud/ProviderAuditLogger.js';
import { getProviderEventManager } from '../cloud/ProviderEventManager.js';

export class SyncEngine extends SyncInterface {
  constructor(config = {}) {
    super(config);
    this.storageProvider = null;
    this.auditLogger = getProviderAuditLogger();
    this.eventManager = getProviderEventManager();
    this.compressionEnabled = config.compressionEnabled !== false;
    this.chunkSize = config.chunkSize || 1024 * 1024;
    this.verifyAfterTransfer = config.verifyAfterTransfer !== false;
  }

  /**
   * Initialize the sync operation
   */
  async initialize() {
    try {
      this.itemId = this.itemId || this.generateItemId();
      this.startedAt = new Date().toISOString();
      this.updateProgress('initializing', 5, 'Initializing synchronization...');

      // Get storage provider
      const providerInfo = storageEngine.getActiveProviderInfo();
      if (!providerInfo) {
        throw new Error('No storage provider available');
      }
      this.storageProvider = storageEngine;

      // Calculate size
      this.size = this.estimateSize(this.data);

      // Log initialization
      this.auditLogger.log({
        level: 'info',
        operation: 'sync_init',
        providerId: this.storageProvider.providerId,
        details: {
          itemId: this.itemId,
          module: this.module,
          direction: this.direction,
          size: this.size
        },
        success: true
      });

      this.eventManager.emit('sync.started', {
        itemId: this.itemId,
        module: this.module,
        direction: this.direction
      });

      this.setStatus(SyncStatus.PREPARING);
      return { success: true, itemId: this.itemId };
    } catch (error) {
      this.setError(error.message);
      this.setStatus(SyncStatus.FAILED);
      this.auditLogger.log({
        level: 'error',
        operation: 'sync_init',
        details: { error: error.message },
        success: false
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Start the sync operation
   */
  async start() {
    try {
      this.setStatus(SyncStatus.PREPARING);
      const startTime = Date.now();

      // Step 1: Prepare data
      this.updateProgress('preparing', 10, 'Preparing data...');
      const preparedData = await this.prepareData();

      // Step 2: Calculate checksum
      this.updateProgress('calculating_checksum', 20, 'Calculating checksum...');
      this.checksum = await this.calculateChecksum();

      // Step 3: Transfer based on direction
      if (this.direction === SyncDirection.UPLOAD) {
        this.updateProgress('uploading', 30, 'Uploading to cloud...');
        const uploadResult = await this.upload(preparedData);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } else if (this.direction === SyncDirection.DOWNLOAD) {
        this.updateProgress('downloading', 30, 'Downloading from cloud...');
        const downloadResult = await this.download();
        if (!downloadResult.success) {
          throw new Error(downloadResult.error || 'Download failed');
        }
      } else {
        // Bidirectional
        this.updateProgress('uploading', 30, 'Uploading to cloud...');
        const uploadResult = await this.upload(preparedData);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }

        this.updateProgress('downloading', 60, 'Downloading from cloud...');
        const downloadResult = await this.download();
        if (!downloadResult.success) {
          throw new Error(downloadResult.error || 'Download failed');
        }
      }

      // Step 4: Verify if enabled
      if (this.verifyAfterTransfer) {
        this.updateProgress('verifying', 90, 'Verifying transfer...');
        const verificationResult = await this.verify();
        if (!verificationResult.verified) {
          throw new Error('Verification failed');
        }
      }

      // Complete
      this.completedAt = new Date().toISOString();
      this.setStatus(SyncStatus.COMPLETED);
      this.updateProgress('completed', 100, 'Synchronization completed');

      this.auditLogger.log({
        level: 'info',
        operation: 'sync_complete',
        providerId: this.storageProvider.providerId,
        details: {
          itemId: this.itemId,
          duration: Date.now() - startTime,
          size: this.size,
          checksum: this.checksum
        },
        success: true
      });

      this.eventManager.emit('sync.completed', {
        itemId: this.itemId,
        duration: Date.now() - startTime
      });

      return { success: true, itemId: this.itemId, metadata: this.getMetadata() };
    } catch (error) {
      this.setError(error.message);
      this.setStatus(SyncStatus.FAILED);
      this.updateProgress('failed', 0, `Synchronization failed: ${error.message}`);

      this.auditLogger.log({
        level: 'error',
        operation: 'sync_failed',
        providerId: this.storageProvider.providerId,
        details: {
          itemId: this.itemId,
          error: error.message,
          step: this.progress.currentStep
        },
        success: false
      });

      this.eventManager.emit('sync.failed', {
        itemId: this.itemId,
        error: error.message,
        step: this.progress.currentStep
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Cancel the sync operation
   */
  async cancel() {
    this.setStatus(SyncStatus.CANCELLED);
    this.updateProgress('cancelled', 0, 'Synchronization cancelled');

    this.auditLogger.log({
      level: 'warning',
      operation: 'sync_cancelled',
      providerId: this.storageProvider.providerId,
      details: { itemId: this.itemId },
      success: true
    });

    this.eventManager.emit('sync.cancelled', { itemId: this.itemId });

    return { success: true };
  }

  /**
   * Pause the sync operation
   */
  async pause() {
    this.setStatus(SyncStatus.PAUSED);
    this.updateProgress('paused', this.progress.percentage, 'Synchronization paused');

    this.auditLogger.log({
      level: 'info',
      operation: 'sync_paused',
      providerId: this.storageProvider.providerId,
      details: { itemId: this.itemId },
      success: true
    });

    return { success: true };
  }

  /**
   * Resume the sync operation
   */
  async resume() {
    this.setStatus(SyncStatus.RETRYING);
    this.updateProgress('resuming', this.progress.percentage, 'Resuming synchronization...');

    this.auditLogger.log({
      level: 'info',
      operation: 'sync_resumed',
      providerId: this.storageProvider.providerId,
      details: { itemId: this.itemId },
      success: true
    });

    return await this.start();
  }

  /**
   * Prepare data for synchronization
   */
  async prepareData() {
    try {
      if (this.direction === SyncDirection.DOWNLOAD) {
        return null; // No data to prepare for download
      }

      // Serialize data
      const dataString = JSON.stringify(this.data);
      const blob = new Blob([dataString], { type: 'application/json' });

      // Compress if enabled
      if (this.compressionEnabled && window.CompressionStream) {
        const stream = blob.stream();
        const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
        const compressedBlob = await new Response(compressedStream).blob();
        return {
          data: compressedBlob,
          compressed: true,
          originalSize: blob.size,
          compressedSize: compressedBlob.size
        };
      }

      return {
        data: blob,
        compressed: false,
        originalSize: blob.size,
        compressedSize: blob.size
      };
    } catch (error) {
      console.error('Data preparation failed:', error);
      throw new Error(`Data preparation failed: ${error.message}`, { cause: error });
    }
  }

  /**
   * Upload data to cloud
   */
  async upload(preparedData) {
    try {
      const storageKey = this.getStorageKey();
      const uploadResult = await this.storageProvider.upload(storageKey, preparedData.data, {
        contentType: 'application/json',
        metadata: {
          itemId: this.itemId,
          module: this.module,
          direction: this.direction,
          checksum: this.checksum,
          deviceId: this.deviceId,
          operator: this.operator,
          compressed: preparedData.compressed
        }
      });

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      return { success: true, storageKey };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Download data from cloud
   */
  async download() {
    try {
      const storageKey = this.getStorageKey();
      const downloadResult = await this.storageProvider.download(storageKey);

      if (!downloadResult.success) {
        throw new Error(downloadResult.error || 'Download failed');
      }

      // Decompress if needed
      let data = downloadResult.data;
      const metadata = downloadResult.metadata || {};

      if (metadata.compressed && window.DecompressionStream) {
        const stream = data.stream();
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        const decompressedBlob = await new Response(decompressedStream).blob();
        data = decompressedBlob;
      }

      // Parse data
      const dataString = await data.text();
      this.data = JSON.parse(dataString);

      return { success: true, data: this.data };
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  /**
   * Verify transfer integrity
   */
  async verify() {
    try {
      if (!this.checksum) {
        return { verified: true, reason: 'No checksum to verify' };
      }

      const currentChecksum = await this.calculateChecksum();
      const verified = currentChecksum === this.checksum;

      return {
        verified,
        checksumMatch: verified,
        expected: this.checksum,
        actual: currentChecksum
      };
    } catch (error) {
      console.error('Verification failed:', error);
      return { verified: false, reason: error.message };
    }
  }

  /**
   * Calculate checksum
   */
  async calculateChecksum() {
    try {
      const dataString = typeof this.data === 'string' ? this.data : JSON.stringify(this.data);
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
   * Estimate size of data
   */
  estimateSize(data) {
    if (!data) return 0;
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return new Blob([dataString]).size;
  }

  /**
   * Get storage key for the sync item
   */
  getStorageKey() {
    return `sync/${this.module}/${this.itemId}.json`;
  }
}
