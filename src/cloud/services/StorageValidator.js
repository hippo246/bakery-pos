// Storage Validator Service
// Validates storage operations and configurations

import { STORAGE_TYPES, STORAGE_TYPE_METADATA } from '../StorageTypes.js';

/**
 * Storage Validator
 * Service for validating storage operations
 */
class StorageValidator {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize validator
   */
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
  }

  /**
   * Validate storage type
   * @param {string} storageType 
   * @returns {{valid: boolean, error?: string}}
   */
  validateStorageType(storageType) {
    if (!storageType) {
      return { valid: false, error: 'Storage type is required' };
    }

    if (!Object.values(STORAGE_TYPES).includes(storageType)) {
      return { valid: false, error: `Unknown storage type: ${storageType}` };
    }

    return { valid: true };
  }

  /**
   * Validate file size
   * @param {number} size 
   * @param {string} storageType 
   * @returns {{valid: boolean, error?: string}}
   */
  validateFileSize(size, storageType) {
    const metadata = STORAGE_TYPE_METADATA[storageType];
    if (!metadata) {
      return { valid: false, error: `Unknown storage type: ${storageType}` };
    }

    if (size > metadata.maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds maximum allowed size of ${this.formatSize(metadata.maxSize)}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validate file extension
   * @param {string} filename 
   * @param {string} storageType 
   * @returns {{valid: boolean, error?: string}}
   */
  validateFileExtension(filename, storageType) {
    const metadata = STORAGE_TYPE_METADATA[storageType];
    if (!metadata) {
      return { valid: false, error: `Unknown storage type: ${storageType}` };
    }

    const extension = filename.includes('.') ? 
      filename.substring(filename.lastIndexOf('.')).toLowerCase() : '';

    if (!extension) {
      return { valid: false, error: 'File has no extension' };
    }

    if (!metadata.extensions.includes(extension)) {
      return { 
        valid: false, 
        error: `File extension ${extension} not allowed for ${storageType}. Allowed: ${metadata.extensions.join(', ')}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validate storage key
   * @param {string} key 
   * @returns {{valid: boolean, error?: string}}
   */
  validateStorageKey(key) {
    if (!key) {
      return { valid: false, error: 'Storage key is required' };
    }

    if (key.length > 1024) {
      return { valid: false, error: 'Storage key exceeds maximum length of 1024 characters' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(key)) {
      return { valid: false, error: 'Storage key contains invalid characters' };
    }

    return { valid: true };
  }

  /**
   * Validate credentials
   * @param {object} credentials 
   * @param {string} providerId 
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateCredentials(credentials, providerId) {
    const errors = [];

    if (!credentials) {
      errors.push('Credentials are required');
      return { valid: false, errors };
    }

    // Provider-specific validation
    switch (providerId) {
      case 'aws-s3':
        if (!credentials.bucket) errors.push('Bucket name is required');
        if (!credentials.region) errors.push('Region is required');
        if (!credentials.accessKey) errors.push('Access key is required');
        if (!credentials.secretKey) errors.push('Secret key is required');
        break;
      case 'firebase':
        if (!credentials.apiKey) errors.push('API key is required');
        if (!credentials.projectId) errors.push('Project ID is required');
        if (!credentials.storageBucket) errors.push('Storage bucket is required');
        break;
      case 'gcs':
        if (!credentials.projectId) errors.push('Project ID is required');
        if (!credentials.keyFilename) errors.push('Key filename is required');
        break;
      case 'azure':
        if (!credentials.connectionString) errors.push('Connection string is required');
        if (!credentials.container) errors.push('Container name is required');
        break;
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate upload options
   * @param {object} options 
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateUploadOptions(options) {
    const errors = [];

    if (options.compression && typeof options.compression !== 'boolean') {
      errors.push('Compression must be a boolean');
    }

    if (options.encryption && typeof options.encryption !== 'boolean') {
      errors.push('Encryption must be a boolean');
    }

    if (options.metadata && typeof options.metadata !== 'object') {
      errors.push('Metadata must be an object');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Format size for display
   * @param {number} bytes 
   * @returns {string}
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// Singleton instance
const storageValidator = new StorageValidator();

export default storageValidator;
