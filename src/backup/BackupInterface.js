// Backup Interface
// Base interface for all backup operations

import { BackupType, BackupStatus, BackupHealth, BackupModule, EncryptionStatus, VerificationStatus, CompressionAlgorithm } from './BackupTypes.js';

/**
 * Base Backup Interface
 * All backup implementations must extend this interface
 */
export class BackupInterface {
  constructor(config = {}) {
    this.backupId = config.backupId || null;
    this.type = config.type || BackupType.FULL;
    this.modules = config.modules || [];
    this.status = BackupStatus.PENDING;
    this.health = BackupHealth.UNKNOWN;
    this.createdAt = config.createdAt || null;
    this.completedAt = config.completedAt || null;
    this.size = config.size || 0;
    this.compressedSize = config.compressedSize || 0;
    this.compressionRatio = config.compressionRatio || 0;
    this.encryptionStatus = config.encryptionStatus || EncryptionStatus.NOT_ENCRYPTED;
    this.verificationStatus = config.verificationStatus || VerificationStatus.NOT_VERIFIED;
    this.checksum = config.checksum || null;
    this.providerId = config.providerId || null;
    this.storageKey = config.storageKey || null;
    this.name = config.name || '';
    this.description = config.description || '';
    this.tags = config.tags || [];
    this.notes = config.notes || '';
    this.creator = config.creator || 'system';
    this.duration = config.duration || 0;
    this.manifest = config.manifest || null;
    this.error = config.error || null;
    this.retryCount = config.retryCount || 0;
    this.maxRetries = config.maxRetries || 3;
  }

  /**
   * Initialize the backup
   * @returns {Promise<object>} Initialization result
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Start the backup process
   * @returns {Promise<object>} Backup result
   */
  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  /**
   * Cancel the backup process
   * @returns {Promise<object>} Cancellation result
   */
  async cancel() {
    throw new Error('cancel() must be implemented by subclass');
  }

  /**
   * Get backup progress
   * @returns {object} Progress information
   */
  getProgress() {
    throw new Error('getProgress() must be implemented by subclass');
  }

  /**
   * Extract data from specified modules
   * @param {Array<BackupModule>} modules - Modules to extract
   * @returns {Promise<object>} Extracted data
   */
  async extractData(modules) {
    throw new Error('extractData() must be implemented by subclass');
  }

  /**
   * Compress the backup data
   * @param {object} data - Data to compress
   * @param {CompressionAlgorithm} algorithm - Compression algorithm
   * @returns {Promise<object>} Compressed data
   */
  async compress(data, algorithm = CompressionAlgorithm.GZIP) {
    throw new Error('compress() must be implemented by subclass');
  }

  /**
   * Encrypt the backup data
   * @param {object} data - Data to encrypt
   * @param {string} encryptionKey - Encryption key
   * @returns {Promise<object>} Encrypted data
   */
  async encrypt(data, encryptionKey) {
    throw new Error('encrypt() must be implemented by subclass');
  }

  /**
   * Verify backup integrity
   * @returns {Promise<object>} Verification result
   */
  async verify() {
    throw new Error('verify() must be implemented by subclass');
  }

  /**
   * Generate backup manifest
   * @returns {object} Backup manifest
   */
  generateManifest() {
    throw new Error('generateManifest() must be implemented by subclass');
  }

  /**
   * Calculate backup health score
   * @returns {BackupHealth} Health status
   */
  calculateHealth() {
    throw new Error('calculateHealth() must be implemented by subclass');
  }

  /**
   * Get backup metadata
   * @returns {object} Backup metadata
   */
  getMetadata() {
    return {
      backupId: this.backupId,
      type: this.type,
      modules: this.modules,
      status: this.status,
      health: this.health,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      size: this.size,
      compressedSize: this.compressedSize,
      compressionRatio: this.compressionRatio,
      encryptionStatus: this.encryptionStatus,
      verificationStatus: this.verificationStatus,
      checksum: this.checksum,
      providerId: this.providerId,
      storageKey: this.storageKey,
      name: this.name,
      description: this.description,
      tags: this.tags,
      notes: this.notes,
      creator: this.creator,
      duration: this.duration,
      error: this.error
    };
  }

  /**
   * Update backup status
   * @param {BackupStatus} status - New status
   */
  setStatus(status) {
    this.status = status;
  }

  /**
   * Update backup health
   * @param {BackupHealth} health - New health status
   */
  setHealth(health) {
    this.health = health;
  }

  /**
   * Set error information
   * @param {string} error - Error message
   */
  setError(error) {
    this.error = error;
  }

  /**
   * Increment retry count
   */
  incrementRetry() {
    this.retryCount++;
  }

  /**
   * Check if backup can be retried
   * @returns {boolean} Whether retry is possible
   */
  canRetry() {
    return this.retryCount < this.maxRetries;
  }
}
