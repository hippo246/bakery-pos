// Sync Interface
// Base interface for all synchronization operations

import { SyncDirection, SyncStatus, SyncPriority } from './SyncTypes.js';

/**
 * Base Sync Interface
 * All sync implementations must extend this interface
 */
export class SyncInterface {
  constructor(config = {}) {
    this.itemId = config.itemId || null;
    this.module = config.module || null;
    this.direction = config.direction || SyncDirection.UPLOAD;
    this.status = SyncStatus.PENDING;
    this.priority = config.priority || SyncPriority.NORMAL;
    this.data = config.data || null;
    this.metadata = config.metadata || {};
    this.createdAt = config.createdAt || new Date().toISOString();
    this.startedAt = config.startedAt || null;
    this.completedAt = config.completedAt || null;
    this.retryCount = config.retryCount || 0;
    this.error = config.error || null;
    this.checksum = config.checksum || null;
    this.size = config.size || 0;
    this.deviceId = config.deviceId || this.getDeviceId();
    this.operator = config.operator || 'system';
    this.progress = {
      currentStep: 'pending',
      percentage: 0,
      message: 'Pending synchronization',
      details: {}
    };
  }

  /**
   * Initialize the sync operation
   * @returns {Promise<object>} Initialization result
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Start the sync operation
   * @returns {Promise<object>} Sync result
   */
  async start() {
    throw new Error('start() must be implemented by subclass');
  }

  /**
   * Cancel the sync operation
   * @returns {Promise<object>} Cancellation result
   */
  async cancel() {
    throw new Error('cancel() must be implemented by subclass');
  }

  /**
   * Pause the sync operation
   * @returns {Promise<object>} Pause result
   */
  async pause() {
    throw new Error('pause() must be implemented by subclass');
  }

  /**
   * Resume the sync operation
   * @returns {Promise<object>} Resume result
   */
  async resume() {
    throw new Error('resume() must be implemented by subclass');
  }

  /**
   * Get sync progress
   * @returns {object} Progress information
   */
  getProgress() {
    return { ...this.progress };
  }

  /**
   * Prepare data for synchronization
   * @returns {Promise<object>} Prepared data
   */
  async prepareData() {
    throw new Error('prepareData() must be implemented by subclass');
  }

  /**
   * Upload data to cloud
   * @returns {Promise<object>} Upload result
   */
  async upload() {
    throw new Error('upload() must be implemented by subclass');
  }

  /**
   * Download data from cloud
   * @returns {Promise<object>} Download result
   */
  async download() {
    throw new Error('download() must be implemented by subclass');
  }

  /**
   * Verify transfer integrity
   * @returns {Promise<object>} Verification result
   */
  async verify() {
    throw new Error('verify() must be implemented by subclass');
  }

  /**
   * Calculate checksum
   * @returns {Promise<string>} Checksum
   */
  async calculateChecksum() {
    throw new Error('calculateChecksum() must be implemented by subclass');
  }

  /**
   * Get sync metadata
   * @returns {object} Sync metadata
   */
  getMetadata() {
    return {
      itemId: this.itemId,
      module: this.module,
      direction: this.direction,
      status: this.status,
      priority: this.priority,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      retryCount: this.retryCount,
      error: this.error,
      checksum: this.checksum,
      size: this.size,
      deviceId: this.deviceId,
      operator: this.operator
    };
  }

  /**
   * Update sync status
   * @param {SyncStatus} status - New status
   */
  setStatus(status) {
    this.status = status;
  }

  /**
   * Update progress
   * @param {string} step - Current step
   * @param {number} percentage - Progress percentage
   * @param {string} message - Progress message
   * @param {object} details - Additional details
   */
  updateProgress(step, percentage, message, details = {}) {
    this.progress = {
      currentStep: step,
      percentage,
      message,
      details
    };
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
   * Check if sync can be retried
   * @param {number} maxRetries - Maximum retry limit
   * @returns {boolean} Whether retry is possible
   */
  canRetry(maxRetries = 5) {
    return this.retryCount < maxRetries;
  }

  /**
   * Get device ID
   * @returns {string} Device ID
   */
  getDeviceId() {
    let deviceId = localStorage.getItem('cafeos_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('cafeos_device_id', deviceId);
    }
    return deviceId;
  }

  /**
   * Generate a unique item ID
   * @returns {string} Item ID
   */
  generateItemId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `sync_${timestamp}_${random}`;
  }
}
