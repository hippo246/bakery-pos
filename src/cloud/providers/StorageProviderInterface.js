// Universal Storage Provider Interface
// All cloud storage providers must implement this interface

/**
 * Base interface for all storage providers
 * Every provider must implement these methods to be compatible with the Storage Engine
 */
export class StorageProviderInterface {
  constructor(config) {
    this.config = config;
    this.connected = false;
    this.lastHealthCheck = null;
    this.healthStatus = 'unknown';
    this.capabilities = this.getCapabilities();
  }

  /**
   * Get provider capabilities
   * @returns {object}
   */
  getCapabilities() {
    return {
      versioning: false,
      encryption: false,
      multipartUpload: false,
      largeFiles: false,
      streaming: false,
      signedUrls: false,
      folderHierarchy: false,
      fileLocks: false,
      quotas: false,
      maxFileSize: null,
      maxFilesPerFolder: null
    };
  }

  /**
   * Initialize the provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by provider');
  }

  /**
   * Authenticate with the provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by provider');
  }

  /**
   * Validate credentials
   * @param {object} credentials 
   * @returns {{valid: boolean, errors: string[]}}
   */
  async validateCredentials(credentials) {
    throw new Error('validateCredentials() must be implemented by provider');
  }

  /**
   * Connect to the storage provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async connect() {
    throw new Error('connect() must be implemented by provider');
  }

  /**
   * Disconnect from provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async disconnect() {
    throw new Error('disconnect() must be implemented by provider');
  }

  /**
   * Test connection with comprehensive verification
   * @returns {Promise<{success: boolean, checks: object, error?: string}>}
   */
  async testConnection() {
    throw new Error('testConnection() must be implemented by provider');
  }

  /**
   * Save credentials securely
   * @param {object} credentials 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async saveCredentials(credentials) {
    throw new Error('saveCredentials() must be implemented by provider');
  }

  /**
   * Disable provider (keep credentials but mark inactive)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async disable() {
    throw new Error('disable() must be implemented by provider');
  }

  /**
   * Reconnect to provider
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async reconnect() {
    throw new Error('reconnect() must be implemented by provider');
  }

  /**
   * Rotate credentials
   * @param {object} newCredentials 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rotateCredentials(newCredentials) {
    throw new Error('rotateCredentials() must be implemented by provider');
  }

  /**
   * Get sync status
   * @returns {Promise<{synced: boolean, lastSync: string, pending: number}>}
   */
  async getSyncStatus() {
    throw new Error('getSyncStatus() must be implemented by provider');
  }

  /**
   * Perform health check
   * @returns {Promise<{healthy: boolean, latency: number, error?: string}>}
   */
  async healthCheck() {
    throw new Error('healthCheck() must be implemented by provider');
  }

  /**
   * Upload file to storage
   * @param {File|Blob} file 
   * @param {string} key 
   * @param {object} options 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async upload(file, key, options = {}) {
    throw new Error('upload() must be implemented by provider');
  }

  /**
   * Download file from storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async download(key) {
    throw new Error('download() must be implemented by provider');
  }

  /**
   * Delete file from storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(key) {
    throw new Error('delete() must be implemented by provider');
  }

  /**
   * Move file to new location
   * @param {string} sourceKey 
   * @param {string} destinationKey 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async move(sourceKey, destinationKey) {
    throw new Error('move() must be implemented by provider');
  }

  /**
   * Copy file to new location
   * @param {string} sourceKey 
   * @param {string} destinationKey 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async copy(sourceKey, destinationKey) {
    throw new Error('copy() must be implemented by provider');
  }

  /**
   * Rename file
   * @param {string} oldKey 
   * @param {string} newKey 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rename(oldKey, newKey) {
    throw new Error('rename() must be implemented by provider');
  }

  /**
   * Check if file exists
   * @param {string} key 
   * @returns {Promise<{exists: boolean, error?: string}>}
   */
  async exists(key) {
    throw new Error('exists() must be implemented by provider');
  }

  /**
   * List files in storage
   * @param {string} prefix 
   * @param {object} options 
   * @returns {Promise<{success: boolean, files: object[], error?: string}>}
   */
  async list(prefix, options = {}) {
    throw new Error('list() must be implemented by provider');
  }

  /**
   * List folders in storage
   * @param {string} prefix 
   * @param {object} options 
   * @returns {Promise<{success: boolean, folders: object[], error?: string}>}
   */
  async listFolders(prefix, options = {}) {
    throw new Error('listFolders() must be implemented by provider');
  }

  /**
   * Get file metadata
   * @param {string} key 
   * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
   */
  async getMetadata(key) {
    throw new Error('getMetadata() must be implemented by provider');
  }

  /**
   * Get storage quota information
   * @returns {Promise<{success: boolean, quota?: object, error?: string}>}
   */
  async getQuota() {
    throw new Error('getQuota() must be implemented by provider');
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<{success: boolean, usage: object, error?: string}>}
   */
  async getUsage() {
    throw new Error('getUsage() must be implemented by provider');
  }

  /**
   * Shutdown provider and cleanup resources
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async shutdown() {
    throw new Error('shutdown() must be implemented by provider');
  }

  /**
   * Get provider information
   * @returns {object}
   */
  getProviderInfo() {
    throw new Error('getProviderInfo() must be implemented by provider');
  }
}
