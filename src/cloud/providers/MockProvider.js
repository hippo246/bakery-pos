// Mock Storage Provider for Testing
// Implements StorageProviderInterface for testing purposes

import { StorageProviderInterface } from './StorageProviderInterface.js';

/**
 * Mock Provider
 * In-memory provider for testing without actual cloud operations
 */
export class MockProvider extends StorageProviderInterface {
  constructor(config = {}) {
    super(config);
    this.providerId = 'mock';
    this.providerName = 'Mock Provider';
    this.info = {
      icon: '🧪',
      name: 'Mock Provider',
      type: 'mock',
      description: 'In-memory mock provider for testing'
    };
    this.storage = new Map();
    this.latency = config.latency || 0;
    this.failureRate = config.failureRate || 0;
    this.capabilities = {
      versioning: true,
      encryption: true,
      multipartUpload: true,
      largeFiles: true,
      streaming: true,
      signedUrls: true,
      folderHierarchy: true,
      fileLocks: true,
      quotas: true,
      maxFileSize: null,
      maxFilesPerFolder: null
    };
  }

  /**
   * Initialize provider
   */
  async initialize() {
    this.connected = true;
    return { success: true };
  }

  /**
   * Authenticate
   */
  async authenticate() {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { success: false, error: 'Authentication failed' };
    }
    return { success: true };
  }

  /**
   * Validate credentials
   */
  async validateCredentials(credentials) {
    return { valid: true, errors: [] };
  }

  /**
   * Connect
   */
  async connect() {
    await this.simulateLatency();
    this.connected = true;
    return { success: true };
  }

  /**
   * Disconnect
   */
  async disconnect() {
    this.connected = false;
    return { success: true };
  }

  /**
   * Test connection
   */
  async testConnection() {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { 
        success: false, 
        checks: { 
          credentials: false, 
          permissions: false, 
          write: false, 
          read: false 
        },
        error: 'Connection test failed' 
      };
    }
    return { 
      success: true, 
      checks: { 
        credentials: true, 
        permissions: true, 
        write: true, 
        read: true 
      }
    };
  }

  /**
   * Save credentials
   */
  async saveCredentials(credentials) {
    await this.simulateLatency();
    return { success: true };
  }

  /**
   * Disable
   */
  async disable() {
    this.connected = false;
    return { success: true };
  }

  /**
   * Reconnect
   */
  async reconnect() {
    await this.simulateLatency();
    this.connected = true;
    return { success: true };
  }

  /**
   * Rotate credentials
   */
  async rotateCredentials(newCredentials) {
    await this.simulateLatency();
    return { success: true };
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    return { synced: true, lastSync: new Date().toISOString(), pending: 0 };
  }

  /**
   * Health check
   */
  async healthCheck() {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { healthy: false, latency: this.latency, error: 'Health check failed' };
    }
    return { healthy: true, latency: this.latency };
  }

  /**
   * Upload
   */
  async upload(key, data, options = {}) {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { success: false, error: 'Upload failed' };
    }

    let buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data);
    } else {
      buffer = await data.arrayBuffer();
    }
    this.storage.set(key, {
      data: buffer,
      metadata: {
        size: buffer.byteLength,
        contentType: data.type,
        uploadedAt: new Date().toISOString(),
        ...options.metadata
      }
    });

    return { success: true, url: `mock://storage/${key}` };
  }

  /**
   * Download
   */
  async download(key) {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { success: false, error: 'Download failed' };
    }

    const item = this.storage.get(key);
    if (!item) {
      return { success: false, error: 'File not found' };
    }

    return { success: true, data: new Blob([item.data]) };
  }

  /**
   * Delete
   */
  async delete(key) {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { success: false, error: 'Delete failed' };
    }

    this.storage.delete(key);
    return { success: true };
  }

  /**
   * Move
   */
  async move(sourceKey, destinationKey) {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { success: false, error: 'Move failed' };
    }

    const item = this.storage.get(sourceKey);
    if (!item) {
      return { success: false, error: 'Source file not found' };
    }

    this.storage.set(destinationKey, item);
    this.storage.delete(sourceKey);
    return { success: true };
  }

  /**
   * Copy
   */
  async copy(sourceKey, destinationKey) {
    await this.simulateLatency();
    if (this.shouldFail()) {
      return { success: false, error: 'Copy failed' };
    }

    const item = this.storage.get(sourceKey);
    if (!item) {
      return { success: false, error: 'Source file not found' };
    }

    this.storage.set(destinationKey, { ...item });
    return { success: true };
  }

  /**
   * Rename
   */
  async rename(oldKey, newKey) {
    return this.move(oldKey, newKey);
  }

  /**
   * Exists
   */
  async exists(key) {
    await this.simulateLatency();
    return { exists: this.storage.has(key) };
  }

  /**
   * List
   */
  async list(prefix, options = {}) {
    await this.simulateLatency();
    const files = [];

    for (const [key, value] of this.storage.entries()) {
      if (key.startsWith(prefix)) {
        files.push({
          key,
          size: value.metadata.size,
          lastModified: value.metadata.uploadedAt
        });
      }
    }

    return { success: true, files };
  }

  /**
   * List folders
   */
  async listFolders(prefix, options = {}) {
    await this.simulateLatency();
    const folders = new Set();

    for (const key of this.storage.keys()) {
      if (key.startsWith(prefix)) {
        const parts = key.substring(prefix.length).split('/');
        if (parts.length > 1) {
          folders.add(parts[0]);
        }
      }
    }

    return { success: true, folders: Array.from(folders).map(f => ({ name: f })) };
  }

  /**
   * Get metadata (alias matching BaseProvider's naming convention)
   */
  async metadata(key) {
    return this.getMetadata(key);
  }

  /**
   * Get quota (alias matching BaseProvider's naming convention)
   */
  async quota() {
    return this.getQuota();
  }

  /**
   * Get metadata
   */
  async getMetadata(key) {
    await this.simulateLatency();
    const item = this.storage.get(key);
    if (!item) {
      return { success: false, error: 'File not found' };
    }

    return { success: true, metadata: item.metadata };
  }

  /**
   * Get quota
   */
  async getQuota() {
    await this.simulateLatency();
    return { 
      success: true, 
      quota: { 
        used: this.storage.size, 
        total: 10737418240, // 10GB
        available: 10737418240 - this.storage.size 
      } 
    };
  }

  /**
   * Get usage
   */
  async getUsage() {
    await this.simulateLatency();
    let totalBytes = 0;
    for (const item of this.storage.values()) {
      totalBytes += item.metadata.size;
    }

    return { 
      success: true, 
      usage: { 
        totalBytes, 
        fileCount: this.storage.size 
      } 
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    this.storage.clear();
    this.connected = false;
    return { success: true };
  }

  /**
   * Get provider info
   */
  getProviderInfo() {
    return this.info;
  }

  /**
   * Simulate latency
   */
  async simulateLatency() {
    if (this.latency > 0) {
      await new Promise(resolve => setTimeout(resolve, this.latency));
    }
  }

  /**
   * Determine if operation should fail
   */
  shouldFail() {
    return Math.random() < this.failureRate;
  }

  /**
   * Clear all data
   */
  clear() {
    this.storage.clear();
  }

  /**
   * Get storage size
   */
  get size() {
    return this.storage.size;
  }
}
