// MinIO Provider
// Implements BaseProvider interface for MinIO (S3-compatible)

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class MinIOProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'minio';
    this.providerName = 'MinIO';
    this.endpoint = config.endpoint || '';
    this.port = config.port || 9000;
    this.accessKey = config.accessKey || '';
    this.secretKey = config.secretKey || '';
    this.bucket = config.bucket || '';
    this.useSSL = config.useSSL || false;
    this.prefix = config.prefix || 'cafeos';
    this.sdk = null; // MinIO SDK (S3-compatible) will be loaded dynamically
    this.s3Client = null;
    this.storageType = StorageType.OBJECT;
    this.authMethod = AuthMethod.ACCESS_KEY;
    this.version = '1.0.0';
    
    // Set capabilities
    this.capabilities.add(ProviderCapabilities.VERSIONING);
    this.capabilities.add(ProviderCapabilities.ENCRYPTION);
    this.capabilities.add(ProviderCapabilities.LARGE_FILES);
    this.capabilities.add(ProviderCapabilities.STREAMING);
    this.capabilities.add(ProviderCapabilities.SIGNED_URLS);
    this.capabilities.add(ProviderCapabilities.FOLDER_SUPPORT);
    this.capabilities.add(ProviderCapabilities.MULTIPART_UPLOAD);
    this.capabilities.add(ProviderCapabilities.METADATA);
    this.capabilities.add(ProviderCapabilities.COPY);
  }

  async initialize() {
    try {
      // Dynamically load MinIO SDK (S3-compatible)
      if (!this.sdk) {
        this.sdk = await this.loadMinIOSDK();
      }

      const protocol = this.useSSL ? 'https' : 'http';
      const endpoint = `${protocol}://${this.endpoint}:${this.port}`;

      const s3 = new this.sdk.S3({
        endpoint,
        forcePathStyle: true,
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey
      });

      this.s3Client = s3;
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
    this.s3Client = null;
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }

  async authenticate() {
    if (!this.s3Client) {
      await this.connect();
    }
    return { success: this.status === ProviderStatus.CONNECTED };
  }

  async validateCredentials() {
    const errors = [];

    if (!this.endpoint) {
      errors.push('Endpoint is required');
    }

    if (!this.accessKey) {
      errors.push('Access key is required');
    }

    if (!this.secretKey) {
      errors.push('Secret key is required');
    }

    if (!this.bucket) {
      errors.push('Bucket name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async refreshAuth() {
    return await this.authenticate();
  }

  async testConnection() {
    const diagnostics = {
      credentials: false,
      bucketAccess: false,
      write: false,
      read: false,
      delete: false,
      endpoint: false,
      latency: 0,
      bandwidth: null
    };

    const startTime = Date.now();

    try {
      if (this.endpoint) diagnostics.endpoint = true;
      if (this.accessKey && this.secretKey) diagnostics.credentials = true;

      try {
        await this.s3Client.headBucket({ Bucket: this.bucket });
        diagnostics.bucketAccess = true;
      } catch (error) {
        // Bucket might not exist yet
      }

      const testKey = `${this.prefix}_test_${Date.now()}`;
      try {
        await this.s3Client.putObject({
          Bucket: this.bucket,
          Key: testKey,
          Body: 'test'
        });
        diagnostics.write = true;
      } catch (error) {
        // Write permission might be missing
      }

      if (diagnostics.write) {
        try {
          await this.s3Client.getObject({
            Bucket: this.bucket,
            Key: testKey
          });
          diagnostics.read = true;
        } catch (error) {
          // Read permission might be missing
        }
      }

      if (diagnostics.write) {
        try {
          await this.s3Client.deleteObject({
            Bucket: this.bucket,
            Key: testKey
          });
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

  async loadMinIOSDK() {
    // Stub for MinIO SDK loading (S3-compatible)
    return {
      S3: class {
        constructor(config) {
          this.config = config;
        }
        async headBucket(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
        async putObject(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
        async getObject(params) {
          return { Body: new Blob() };
        }
        async deleteObject(params) {
          return { $metadata: { httpStatusCode: 204 } };
        }
        async listObjectsV2(params) {
          return { Contents: [] };
        }
        async headObject(params) {
          return { Metadata: {} };
        }
        async copyObject(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
      }
    };
  }

  async upload(key, data, options = {}) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const params = {
        Bucket: this.bucket,
        Key: fullKey,
        Body: data,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: {
          originalName: options.name || key.split('/').pop(),
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      await this.s3Client.putObject(params);
      
      const protocol = this.useSSL ? 'https' : 'http';
      const url = `${protocol}://${this.endpoint}:${this.port}/${this.bucket}/${fullKey}`;
      
      return { success: true, url };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const result = await this.s3Client.getObject({
        Bucket: this.bucket,
        Key: fullKey
      });
      
      return { success: true, data: result.Body, metadata: result.Metadata || {} };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      await this.s3Client.deleteObject({
        Bucket: this.bucket,
        Key: fullKey
      });
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async rename(oldKey, newKey) {
    try {
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
      
      await this.s3Client.copyObject({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${fullSourceKey}`,
        Key: fullDestKey
      });
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const fullPrefix = `${this.prefix}/${prefix}`;
      
      const result = await this.s3Client.listObjectsV2({
        Bucket: this.bucket,
        Prefix: fullPrefix,
        MaxKeys: options.limit || 1000
      });
      
      const files = result.Contents.map(obj => ({
        key: obj.Key.replace(`${this.prefix}/`, ''),
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag
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
      
      await this.s3Client.headObject({
        Bucket: this.bucket,
        Key: fullKey
      });
      
      return { exists: true };
    } catch (error) {
      if (error.name === 'NotFound') {
        return { exists: false };
      }
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const result = await this.s3Client.headObject({
        Bucket: this.bucket,
        Key: fullKey
      });
      
      return { 
        success: true, 
        metadata: {
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType,
          etag: result.ETag,
          customMetadata: result.Metadata
        }
      };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async quota() {
    try {
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
      if (!this.s3Client) {
        await this.connect();
      }

      await this.s3Client.headBucket({ Bucket: this.bucket });
      
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
      endpoint: this.endpoint,
      port: this.port,
      bucket: this.bucket,
      useSSL: this.useSSL,
      prefix: this.prefix
    };
  }
}
