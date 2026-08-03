// Local Storage Provider
// Implements BaseProvider interface for browser localStorage

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class LocalStorageProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'local';
    this.providerName = 'Local Storage';
    this.prefix = config.prefix || 'cafeos_storage';
    this.maxSize = config.maxSize || 50 * 1024 * 1024; // 50MB default
    this.storageType = StorageType.FILE;
    this.authMethod = AuthMethod.TOKEN;
    this.version = '1.0.0';
    
    // Set capabilities
    this.capabilities.add(ProviderCapabilities.METADATA);
    this.capabilities.add(ProviderCapabilities.FOLDER_SUPPORT);
    this.capabilities.add(ProviderCapabilities.QUOTA);
  }

  async initialize() {
    try {
      // Test localStorage availability
      const testKey = `${this.prefix}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      this.status = ProviderStatus.CONNECTED;
      return { success: true };
    } catch (error) {
      this.status = ProviderStatus.UNAVAILABLE;
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async connect() {
    return await this.initialize();
  }

  async disconnect() {
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }

  async authenticate() {
    // Local storage doesn't require authentication
    return { success: true };
  }

  async validateCredentials() {
    // Local storage doesn't require credentials
    return { valid: true };
  }

  async refreshAuth() {
    // Not applicable for local storage
    return { success: true };
  }

  async testConnection() {
    const diagnostics = {
      availability: false,
      write: false,
      read: false,
      delete: false,
      quota: false,
      latency: 0,
      bandwidth: null
    };

    const startTime = Date.now();

    try {
      // Test availability
      const testKey = `${this.prefix}_test`;
      localStorage.setItem(testKey, 'test');
      diagnostics.availability = true;

      // Test write
      const testData = JSON.stringify({ test: true, timestamp: Date.now() });
      localStorage.setItem(testKey, testData);
      diagnostics.write = true;

      // Test read
      const readData = localStorage.getItem(testKey);
      diagnostics.read = readData === testData;

      // Test delete
      localStorage.removeItem(testKey);
      diagnostics.delete = !localStorage.getItem(testKey);

      // Test quota
      const usage = await this.quota();
      diagnostics.quota = usage.success;

      diagnostics.latency = Date.now() - startTime;
      this.status = ProviderStatus.CONNECTED;
      this.lastHealthCheck = new Date().toISOString();
      
      return { success: true, diagnostics };
    } catch (error) {
      this.status = ProviderStatus.UNAVAILABLE;
      this.lastError = error.message;
      this.lastHealthCheck = new Date().toISOString();
      diagnostics.latency = Date.now() - startTime;
      
      return { success: false, diagnostics, error: error.message };
    }
  }

  async upload(key, data, options = {}) {
    try {
      const storageKey = `${this.prefix}_${key}`;
      
      // Handle file or blob data
      let base64;
      let size;
      let type;
      let name = options.name || key.split('/').pop();
      
      if (data instanceof File) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(data);
        });
        base64 = await base64Promise;
        size = data.size;
        type = data.type;
        name = data.name;
      } else if (data instanceof Blob) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(data);
        });
        base64 = await base64Promise;
        size = data.size;
        type = data.type;
      } else {
        // Assume string data
        base64 = `data:text/plain;base64,${btoa(data)}`;
        size = data.length;
        type = 'text/plain';
      }
      
      // Check size limits
      const estimatedSize = base64.length * 2; // Approximate bytes
      const quotaResult = await this.quota();
      if (quotaResult.success && quotaResult.quota.used + estimatedSize > this.maxSize) {
        return { success: false, error: 'Storage quota exceeded' };
      }
      
      const metadata = {
        name,
        size,
        type,
        uploadedAt: new Date().toISOString(),
        key,
        ...options.metadata
      };
      
      const storedData = {
        base64,
        metadata
      };
      
      localStorage.setItem(storageKey, JSON.stringify(storedData));
      
      return { success: true, url: `local://${key}` };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const storageKey = `${this.prefix}_${key}`;
      const dataStr = localStorage.getItem(storageKey);
      
      if (!dataStr) {
        return { success: false, error: 'File not found' };
      }
      
      const data = JSON.parse(dataStr);
      
      // Convert base64 back to Blob
      const fetchResponse = await fetch(data.base64);
      const blob = await fetchResponse.blob();
      
      return { success: true, data: blob, metadata: data.metadata };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const storageKey = `${this.prefix}_${key}`;
      localStorage.removeItem(storageKey);
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async rename(oldKey, newKey) {
    try {
      const oldStorageKey = `${this.prefix}_${oldKey}`;
      const newStorageKey = `${this.prefix}_${newKey}`;
      const dataStr = localStorage.getItem(oldStorageKey);
      
      if (!dataStr) {
        return { success: false, error: 'File not found' };
      }
      
      // Update metadata, then write once and remove the old key
      const data = JSON.parse(dataStr);
      data.metadata.key = newKey;
      localStorage.setItem(newStorageKey, JSON.stringify(data));
      localStorage.removeItem(oldStorageKey);
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async move(sourceKey, destKey) {
    return await this.rename(sourceKey, destKey);
  }

  async copy(sourceKey, destKey) {
    try {
      const sourceStorageKey = `${this.prefix}_${sourceKey}`;
      const destStorageKey = `${this.prefix}_${destKey}`;
      const dataStr = localStorage.getItem(sourceStorageKey);
      
      if (!dataStr) {
        return { success: false, error: 'File not found' };
      }
      
      localStorage.setItem(destStorageKey, dataStr);
      
      // Update metadata for copy
      const data = JSON.parse(dataStr);
      data.metadata.key = destKey;
      data.metadata.copiedAt = new Date().toISOString();
      localStorage.setItem(destStorageKey, JSON.stringify(data));
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const files = [];
      const searchPrefix = `${this.prefix}_${prefix}`;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(searchPrefix)) {
          try {
            const dataStr = localStorage.getItem(key);
            const data = JSON.parse(dataStr);
            files.push({
              key: key.replace(`${this.prefix}_`, ''),
              metadata: data.metadata,
              size: data.metadata?.size || 0
            });
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      
      return { success: true, files };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, files: [], error: error.message };
    }
  }

  async exists(key) {
    try {
      const storageKey = `${this.prefix}_${key}`;
      const exists = localStorage.getItem(storageKey) !== null;
      return { exists };
    } catch (error) {
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const storageKey = `${this.prefix}_${key}`;
      const dataStr = localStorage.getItem(storageKey);
      
      if (!dataStr) {
        return { success: false, error: 'File not found' };
      }
      
      const data = JSON.parse(dataStr);
      return { success: true, metadata: data.metadata };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async quota() {
    try {
      let used = 0;
      let count = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = localStorage.getItem(key);
          used += value.length * 2; // Approximate bytes
          count++;
        }
      }
      
      return {
        success: true,
        quota: {
          used,
          available: this.maxSize - used,
          total: this.maxSize,
          percentage: (used / this.maxSize) * 100,
          count
        }
      };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, quota: {}, error: error.message };
    }
  }

  async healthCheck() {
    const startTime = Date.now();
    
    try {
      const testKey = `${this.prefix}_health`;
      localStorage.setItem(testKey, Date.now().toString());
      localStorage.removeItem(testKey);
      
      const latency = Date.now() - startTime;
      this.status = ProviderStatus.CONNECTED;
      this.lastHealthCheck = new Date().toISOString();
      
      return { 
        status: this.status,
        diagnostics: { latency, healthy: true },
        lastChecked: this.lastHealthCheck
      };
    } catch (error) {
      this.status = ProviderStatus.UNAVAILABLE;
      this.lastError = error.message;
      this.lastHealthCheck = new Date().toISOString();
      
      return { 
        status: this.status,
        diagnostics: { latency: Date.now() - startTime, healthy: false, error: error.message },
        lastChecked: this.lastHealthCheck
      };
    }
  }

  getProviderInfo() {
    return {
      id: this.providerId,
      name: this.providerName,
      type: this.storageType,
      authMethod: this.authMethod,
      status: this.status,
      capabilities: Array.from(this.capabilities),
      version: this.version,
      lastHealthCheck: this.lastHealthCheck,
      lastError: this.lastError,
      maxSize: this.maxSize
    };
  }
}
