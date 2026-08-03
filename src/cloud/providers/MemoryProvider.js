// Memory Storage Provider for Testing
// In-memory provider similar to MockProvider but with different characteristics

import { StorageProviderInterface } from './StorageProviderInterface.js';

/**
 * Memory Provider
 * In-memory provider for testing with persistence simulation
 */
export class MemoryProvider extends StorageProviderInterface {
  constructor(config = {}) {
    super(config);
    this.providerId = 'memory';
    this.providerName = 'Memory Provider';
    this.info = {
      icon: '💾',
      name: 'Memory Provider',
      type: 'memory',
      description: 'In-memory provider with persistence simulation'
    };
    this.storage = new Map();
    this.persistKey = config.persistKey || 'cafeos_memory_storage';
    this.autoPersist = config.autoPersist !== false;
    this.capabilities = {
      versioning: false,
      encryption: false,
      multipartUpload: false,
      largeFiles: false,
      streaming: false,
      signedUrls: false,
      folderHierarchy: true,
      fileLocks: false,
      quotas: false,
      maxFileSize: 104857600, // 100MB
      maxFilesPerFolder: 1000
    };
  }

  /**
   * Initialize provider
   */
  async initialize() {
    if (this.autoPersist) {
      this.loadFromStorage();
    }
    this.connected = true;
    return { success: true };
  }

  /**
   * Authenticate
   */
  async authenticate() {
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
    if (this.autoPersist) {
      this.loadFromStorage();
    }
    this.connected = true;
    return { success: true };
  }

  /**
   * Disconnect
   */
  async disconnect() {
    if (this.autoPersist) {
      this.saveToStorage();
    }
    this.connected = false;
    return { success: true };
  }

  /**
   * Test connection
   */
  async testConnection() {
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
    if (this.autoPersist) {
      this.loadFromStorage();
    }
    this.connected = true;
    return { success: true };
  }

  /**
   * Rotate credentials
   */
  async rotateCredentials(newCredentials) {
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
    return { healthy: true, latency: 0 };
  }

  /**
   * Upload
   */
  async upload(key, data, options = {}) {
    if (!this.connected) {
      return { success: false, error: 'Provider not connected' };
    }

    let buffer;
    if (Buffer.isBuffer(data)) {
      buffer = data;
    } else if (typeof data === 'string') {
      buffer = Buffer.from(data);
    } else {
      buffer = await data.arrayBuffer();
    }
    
    // Check size limit
    if (buffer.byteLength > this.capabilities.maxFileSize) {
      return { success: false, error: 'File size exceeds limit' };
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

    if (this.autoPersist) {
      this.saveToStorage();
    }

    return { success: true, url: `memory://storage/${key}` };
  }

  /**
   * Download
   */
  async download(key) {
    if (!this.connected) {
      return { success: false, error: 'Provider not connected' };
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
    if (!this.connected) {
      return { success: false, error: 'Provider not connected' };
    }

    this.storage.delete(key);

    if (this.autoPersist) {
      this.saveToStorage();
    }

    return { success: true };
  }

  /**
   * Move
   */
  async move(sourceKey, destinationKey) {
    if (!this.connected) {
      return { success: false, error: 'Provider not connected' };
    }

    const item = this.storage.get(sourceKey);
    if (!item) {
      return { success: false, error: 'Source file not found' };
    }

    this.storage.set(destinationKey, item);
    this.storage.delete(sourceKey);

    if (this.autoPersist) {
      this.saveToStorage();
    }

    return { success: true };
  }

  /**
   * Copy
   */
  async copy(sourceKey, destinationKey) {
    if (!this.connected) {
      return { success: false, error: 'Provider not connected' };
    }

    const item = this.storage.get(sourceKey);
    if (!item) {
      return { success: false, error: 'Source file not found' };
    }

    this.storage.set(destinationKey, { ...item });

    if (this.autoPersist) {
      this.saveToStorage();
    }

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
    return { exists: this.storage.has(key) };
  }

  /**
   * List
   */
  async list(prefix, options = {}) {
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
    return { 
      success: true, 
      quota: { 
        used: this.getTotalSize(), 
        total: this.capabilities.maxFileSize * this.capabilities.maxFilesPerFolder,
        available: (this.capabilities.maxFileSize * this.capabilities.maxFilesPerFolder) - this.getTotalSize() 
      } 
    };
  }

  /**
   * Get usage
   */
  async getUsage() {
    return { 
      success: true, 
      usage: { 
        totalBytes: this.getTotalSize(), 
        fileCount: this.storage.size 
      } 
    };
  }

  /**
   * Shutdown
   */
  async shutdown() {
    if (this.autoPersist) {
      this.saveToStorage();
    }
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
   * Save to localStorage
   */
  saveToStorage() {
    try {
      const data = Array.from(this.storage.entries()).map(([key, value]) => ({
        key,
        data: Array.from(value.data),
        metadata: value.metadata
      }));
      localStorage.setItem(this.persistKey, JSON.stringify(data));
    } catch (error) {
      console.error('[MemoryProvider] Failed to save to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  loadFromStorage() {
    try {
      const data = localStorage.getItem(this.persistKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.storage.clear();
        for (const item of parsed) {
          this.storage.set(item.key, {
            data: new Uint8Array(item.data),
            metadata: item.metadata
          });
        }
      }
    } catch (error) {
      console.error('[MemoryProvider] Failed to load from storage:', error);
    }
  }

  /**
   * Get total size
   */
  getTotalSize() {
    let total = 0;
    for (const item of this.storage.values()) {
      total += item.metadata.size;
    }
    return total;
  }

  /**
   * Clear all data
   */
  clear() {
    this.storage.clear();
    if (this.autoPersist) {
      localStorage.removeItem(this.persistKey);
    }
  }
}
