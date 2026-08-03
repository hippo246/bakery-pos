// Firebase Storage Provider
// Implements BaseProvider interface for Firebase Storage

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class FirebaseStorageProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'firebase-storage';
    this.providerName = 'Firebase Storage';
    this.projectId = config.projectId || '';
    this.bucket = config.bucket || '';
    this.apiKey = config.apiKey || '';
    this.authDomain = config.authDomain || '';
    this.serviceAccount = config.serviceAccount || '';
    this.prefix = config.prefix || 'cafeos';
    this.sdk = null; // Firebase SDK will be loaded dynamically
    this.storage = null;
    this.storageType = StorageType.OBJECT;
    this.authMethod = AuthMethod.SERVICE_ACCOUNT;
    this.version = '1.0.0';
    
    // Set capabilities
    this.capabilities.add(ProviderCapabilities.VERSIONING);
    this.capabilities.add(ProviderCapabilities.ENCRYPTION);
    this.capabilities.add(ProviderCapabilities.LARGE_FILES);
    this.capabilities.add(ProviderCapabilities.STREAMING);
    this.capabilities.add(ProviderCapabilities.SIGNED_URLS);
    this.capabilities.add(ProviderCapabilities.FOLDER_SUPPORT);
    this.capabilities.add(ProviderCapabilities.METADATA);
  }

  async initialize() {
    try {
      // Dynamically load Firebase SDK only when needed
      if (!this.sdk) {
        this.sdk = await this.loadFirebaseSDK();
      }

      const app = this.sdk.initializeApp({
        projectId: this.projectId,
        apiKey: this.apiKey,
        authDomain: this.authDomain,
        storageBucket: this.bucket || `${this.projectId}.appspot.com`
      });

      this.storage = this.sdk.getStorage(app);
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
    this.storage = null;
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }

  async authenticate() {
    if (!this.storage) {
      await this.connect();
    }
    return { success: this.status === ProviderStatus.CONNECTED };
  }

  async validateCredentials() {
    const errors = [];

    if (!this.projectId) {
      errors.push('Project ID is required');
    }

    if (!this.apiKey) {
      errors.push('API key is required');
    }

    if (!this.authDomain) {
      errors.push('Auth domain is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async refreshAuth() {
    // Firebase tokens are automatically refreshed by the SDK
    return await this.authenticate();
  }

  async testConnection() {
    const diagnostics = {
      credentials: false,
      bucketAccess: false,
      write: false,
      read: false,
      delete: false,
      projectId: false,
      latency: 0,
      bandwidth: null
    };

    const startTime = Date.now();

    try {
      // Test credentials
      if (this.projectId && this.apiKey && this.authDomain) {
        diagnostics.credentials = true;
      }

      // Test project ID
      if (this.projectId) {
        diagnostics.projectId = true;
      }

      // Test bucket access
      try {
        const storageRef = this.sdk.ref(this.storage);
        await this.sdk.list(storageRef, { maxResults: 1 });
        diagnostics.bucketAccess = true;
      } catch (error) {
        // Bucket might not exist yet
      }

      // Test write
      const testKey = `${this.prefix}_test_${Date.now()}`;
      try {
        const storageRef = this.sdk.ref(this.storage, testKey);
        await this.sdk.uploadString(storageRef, 'test');
        diagnostics.write = true;
      } catch (error) {
        // Write permission might be missing
      }

      // Test read
      if (diagnostics.write) {
        try {
          const storageRef = this.sdk.ref(this.storage, testKey);
          await this.sdk.getDownloadURL(storageRef);
          diagnostics.read = true;
        } catch (error) {
          // Read permission might be missing
        }
      }

      // Test delete
      if (diagnostics.write) {
        try {
          const storageRef = this.sdk.ref(this.storage, testKey);
          await this.sdk.deleteObject(storageRef);
          diagnostics.delete = true;
        } catch (error) {
          // Delete permission might be missing
        }
      }

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

  async loadFirebaseSDK() {
    // Stub for Firebase SDK loading
    // In production, this would dynamically load the Firebase SDK
    return {
      initializeApp: (config) => ({ config }),
      getStorage: (app) => ({ app }),
      ref: (storage, path) => ({ path, storage }),
      uploadString: (ref, data) => Promise.resolve(),
      uploadBytes: (ref, data, metadata) => Promise.resolve(),
      getDownloadURL: (ref) => Promise.resolve('https://example.com/file'),
      deleteObject: (ref) => Promise.resolve(),
      getMetadata: (ref) => Promise.resolve({ size: 100, updated: new Date() }),
      list: (ref, options) => Promise.resolve({ items: [] }),
      copyBytes: (source, dest) => Promise.resolve()
    };
  }

  async upload(key, data, options = {}) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const storageRef = this.sdk.ref(this.storage, fullKey);

      const metadata = {
        contentType: options.contentType || 'application/octet-stream',
        customMetadata: {
          originalName: options.name || key.split('/').pop(),
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      if (data instanceof Blob || data instanceof File) {
        await this.sdk.uploadBytes(storageRef, data, metadata);
      } else {
        await this.sdk.uploadString(storageRef, data, 'raw', metadata);
      }
      
      const url = await this.sdk.getDownloadURL(storageRef);
      
      return { success: true, url };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const storageRef = this.sdk.ref(this.storage, fullKey);

      const url = await this.sdk.getDownloadURL(storageRef);
      const metadata = await this.sdk.getMetadata(storageRef);
      
      const response = await fetch(url);
      const data = await response.blob();
      
      return { success: true, data, metadata };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const storageRef = this.sdk.ref(this.storage, fullKey);

      await this.sdk.deleteObject(storageRef);
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async rename(oldKey, newKey) {
    try {
      // Firebase doesn't have rename, use copy + delete
      await this.copy(oldKey, newKey);
      await this.delete(oldKey);
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
      const fullSourceKey = `${this.prefix}/${sourceKey}`;
      const fullDestKey = `${this.prefix}/${destKey}`;
      const sourceRef = this.sdk.ref(this.storage, fullSourceKey);
      const destRef = this.sdk.ref(this.storage, fullDestKey);

      await this.sdk.copyBytes(sourceRef, destRef);
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const fullPrefix = `${this.prefix}/${prefix}`;
      const storageRef = this.sdk.ref(this.storage, fullPrefix);

      const result = await this.sdk.list(storageRef, { maxResults: options.limit || 1000 });
      
      const files = result.items.map(item => ({
        key: item.fullPath.replace(`${this.prefix}/`, ''),
        size: item.size,
        lastModified: item.timeCreated,
        etag: item.md5Hash
      }));
      
      return { success: true, files };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, files: [], error: error.message };
    }
  }

  async exists(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const storageRef = this.sdk.ref(this.storage, fullKey);

      await this.sdk.getMetadata(storageRef);
      
      return { exists: true };
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        return { exists: false };
      }
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const storageRef = this.sdk.ref(this.storage, fullKey);

      const metadata = await this.sdk.getMetadata(storageRef);
      
      return { 
        success: true, 
        metadata: {
          size: metadata.size,
          lastModified: metadata.updated,
          contentType: metadata.contentType,
          etag: metadata.md5Hash,
          customMetadata: metadata.customMetadata
        }
      };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async quota() {
    try {
      // Firebase doesn't provide direct usage without additional permissions
      const result = await this.list('', { limit: 1 });
      
      return {
        success: true,
        quota: {
          used: null,
          available: null,
          total: null,
          percentage: null,
          count: result.files.length
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
      if (!this.storage) {
        await this.connect();
      }

      const storageRef = this.sdk.ref(this.storage);
      await this.sdk.list(storageRef, { maxResults: 1 });
      
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
      projectId: this.projectId,
      bucket: this.bucket,
      prefix: this.prefix
    };
  }
}
