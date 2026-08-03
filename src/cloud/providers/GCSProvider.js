// Google Cloud Storage Provider
// Implements BaseProvider interface for Google Cloud Storage

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class GCSProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'gcs';
    this.providerName = 'Google Cloud Storage';
    this.projectId = config.projectId || '';
    this.bucket = config.bucket || '';
    this.serviceAccountKey = config.serviceAccountKey || '';
    this.prefix = config.prefix || 'cafeos';
    this.sdk = null; // GCS SDK will be loaded dynamically
    this.storageClient = null;
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
    this.capabilities.add(ProviderCapabilities.MULTIPART_UPLOAD);
    this.capabilities.add(ProviderCapabilities.STORAGE_CLASSES);
    this.capabilities.add(ProviderCapabilities.METADATA);
    this.capabilities.add(ProviderCapabilities.COPY);
  }

  async initialize() {
    try {
      // Dynamically load GCS SDK only when needed
      if (!this.sdk) {
        this.sdk = await this.loadGCSSDK();
      }

      const storage = new this.sdk.Storage({
        projectId: this.projectId,
        credentials: this.serviceAccountKey
      });

      this.storageClient = storage;
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
    this.storageClient = null;
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }

  async authenticate() {
    if (!this.storageClient) {
      await this.connect();
    }
    return { success: this.status === ProviderStatus.CONNECTED };
  }

  async validateCredentials() {
    const errors = [];

    if (!this.projectId) {
      errors.push('Project ID is required');
    }

    if (!this.bucket) {
      errors.push('Bucket name is required');
    }

    if (!this.serviceAccountKey) {
      errors.push('Service account key is required');
    }

    try {
      // Try to parse the service account key as JSON
      if (this.serviceAccountKey) {
        JSON.parse(this.serviceAccountKey);
      }
    } catch (e) {
      errors.push('Service account key must be valid JSON');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async refreshAuth() {
    // GCS tokens are automatically refreshed by the SDK
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
      if (this.projectId && this.serviceAccountKey) {
        diagnostics.credentials = true;
      }

      // Test project ID
      if (this.projectId) {
        diagnostics.projectId = true;
      }

      // Test bucket access
      try {
        const bucket = this.storageClient.bucket(this.bucket);
        await bucket.getMetadata();
        diagnostics.bucketAccess = true;
      } catch (error) {
        // Bucket might not exist yet
      }

      // Test write
      const testKey = `${this.prefix}_test_${Date.now()}`;
      try {
        const bucket = this.storageClient.bucket(this.bucket);
        const file = bucket.file(testKey);
        await file.save('test');
        diagnostics.write = true;
      } catch (error) {
        // Write permission might be missing
      }

      // Test read
      if (diagnostics.write) {
        try {
          const bucket = this.storageClient.bucket(this.bucket);
          const file = bucket.file(testKey);
          await file.download();
          diagnostics.read = true;
        } catch (error) {
          // Read permission might be missing
        }
      }

      // Test delete
      if (diagnostics.write) {
        try {
          const bucket = this.storageClient.bucket(this.bucket);
          const file = bucket.file(testKey);
          await file.delete();
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

  async loadGCSSDK() {
    // Stub for GCS SDK loading
    // In production, this would dynamically load the Google Cloud Storage SDK
    return {
      Storage: class {
        constructor(config) {
          this.projectId = config.projectId;
          this.credentials = config.credentials;
        }
        bucket(name) {
          return {
            file: (key) => ({
              save: async (data) => ({ $metadata: { httpStatusCode: 200 } }),
              download: async () => [Buffer.from('')],
              delete: async () => ({ $metadata: { httpStatusCode: 204 } }),
              getMetadata: async () => [{ $metadata: { httpStatusCode: 200 } }],
              copy: async (dest) => ({ $metadata: { httpStatusCode: 200 } }),
              move: async (dest) => ({ $metadata: { httpStatusCode: 200 } })
            }),
            getMetadata: async () => [{ $metadata: { httpStatusCode: 200 } }],
            getFiles: async () => [[], { $metadata: { httpStatusCode: 200 } }]
          };
        }
      }
    };
  }

  async upload(key, data, options = {}) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullKey);

      const metadata = {
        contentType: options.contentType || 'application/octet-stream',
        metadata: {
          originalName: options.name || key.split('/').pop(),
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      await file.save(data, metadata);
      
      const url = `https://storage.googleapis.com/${this.bucket}/${fullKey}`;
      
      return { success: true, url };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullKey);

      const [data] = await file.download();
      const [metadata] = await file.getMetadata();
      
      return { success: true, data: Buffer.from(data), metadata };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullKey);

      await file.delete();
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async rename(oldKey, newKey) {
    try {
      const fullOldKey = `${this.prefix}/${oldKey}`;
      const fullNewKey = `${this.prefix}/${newKey}`;
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullOldKey);

      await file.move(fullNewKey);
      
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
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullSourceKey);

      await file.copy(fullDestKey);
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const fullPrefix = `${this.prefix}/${prefix}`;
      const bucket = this.storageClient.bucket(this.bucket);

      const [files] = await bucket.getFiles({
        prefix: fullPrefix,
        maxResults: options.limit || 1000
      });
      
      const fileList = files.map(file => ({
        key: file.name.replace(`${this.prefix}/`, ''),
        size: file.metadata.size,
        lastModified: file.metadata.timeCreated,
        etag: file.metadata.etag
      }));
      
      return { success: true, files: fileList };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, files: [], error: error.message };
    }
  }

  async exists(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullKey);

      await file.getMetadata();
      
      return { exists: true };
    } catch (error) {
      if (error.code === 404) {
        return { exists: false };
      }
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const bucket = this.storageClient.bucket(this.bucket);
      const file = bucket.file(fullKey);

      const [metadata] = await file.getMetadata();
      
      return { 
        success: true, 
        metadata: {
          size: metadata.size,
          lastModified: metadata.timeCreated,
          contentType: metadata.contentType,
          etag: metadata.etag,
          customMetadata: metadata.metadata
        }
      };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async quota() {
    try {
      // GCS doesn't provide direct usage without additional permissions
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
      if (!this.storageClient) {
        await this.connect();
      }

      const bucket = this.storageClient.bucket(this.bucket);
      await bucket.getMetadata();
      
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
