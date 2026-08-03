// Backblaze B2 Provider
// Implements BaseProvider interface for Backblaze B2

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class BackblazeB2Provider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'backblaze-b2';
    this.providerName = 'Backblaze B2';
    this.keyId = config.keyId || '';
    this.applicationKey = config.applicationKey || '';
    this.bucketId = config.bucketId || '';
    this.bucketName = config.bucketName || '';
    this.prefix = config.prefix || 'cafeos';
    this.sdk = null; // B2 SDK will be loaded dynamically
    this.b2Client = null;
    // B2's delete/copy/getFileInfo APIs require the actual fileId, not the
    // file name/key. Cache name->fileId as we learn it from uploads/listing.
    this.fileIdCache = new Map();
    this.storageType = StorageType.OBJECT;
    this.authMethod = AuthMethod.API_KEY;
    this.version = '1.0.0';
    
    // Set capabilities
    this.capabilities.add(ProviderCapabilities.VERSIONING);
    this.capabilities.add(ProviderCapabilities.ENCRYPTION);
    this.capabilities.add(ProviderCapabilities.LARGE_FILES);
    this.capabilities.add(ProviderCapabilities.STREAMING);
    this.capabilities.add(ProviderCapabilities.FOLDER_SUPPORT);
    this.capabilities.add(ProviderCapabilities.MULTIPART_UPLOAD);
    this.capabilities.add(ProviderCapabilities.METADATA);
  }

  async initialize() {
    try {
      // Dynamically load B2 SDK only when needed
      if (!this.sdk) {
        this.sdk = await this.loadB2SDK();
      }

      const b2 = new this.sdk.B2({
        keyId: this.keyId,
        applicationKey: this.applicationKey
      });

      this.b2Client = b2;
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
    this.b2Client = null;
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }

  async authenticate() {
    if (!this.b2Client) {
      await this.connect();
    }
    return { success: this.status === ProviderStatus.CONNECTED };
  }

  async validateCredentials() {
    const errors = [];

    if (!this.keyId) {
      errors.push('Key ID is required');
    }

    if (!this.applicationKey) {
      errors.push('Application key is required');
    }

    if (!this.bucketId && !this.bucketName) {
      errors.push('Bucket ID or bucket name is required');
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
      keyId: false,
      latency: 0,
      bandwidth: null
    };

    const startTime = Date.now();

    try {
      if (this.keyId) diagnostics.keyId = true;
      if (this.keyId && this.applicationKey) diagnostics.credentials = true;

      try {
        await this.b2Client.getBucket({ bucketId: this.bucketId });
        diagnostics.bucketAccess = true;
      } catch (error) {
        // Bucket might not exist yet
      }

      const testKey = `${this.prefix}_test_${Date.now()}`;
      try {
        await this.b2Client.uploadFile({
          bucketId: this.bucketId,
          fileName: testKey,
          data: 'test'
        });
        diagnostics.write = true;
      } catch (error) {
        // Write permission might be missing
      }

      if (diagnostics.write) {
        try {
          await this.b2Client.downloadFileByName({
            bucketName: this.bucketName,
            fileName: testKey
          });
          diagnostics.read = true;
        } catch (error) {
          // Read permission might be missing
        }
      }

      if (diagnostics.write) {
        try {
          await this.b2Client.deleteFileVersion({
            bucketId: this.bucketId,
            fileName: testKey,
            fileId: 'test'
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

  async loadB2SDK() {
    // Stub for B2 SDK loading
    return {
      B2: class {
        constructor(config) {
          this.keyId = config.keyId;
          this.applicationKey = config.applicationKey;
        }
        async getBucket(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
        async uploadFile(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
        async downloadFileByName(params) {
          return { data: new Blob() };
        }
        async deleteFileVersion(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
        async listFileNames(params) {
          return { files: [] };
        }
        async getFileInfo(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
        async copyFile(params) {
          return { $metadata: { httpStatusCode: 200 } };
        }
      }
    };
  }

  async upload(key, data, options = {}) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const params = {
        bucketId: this.bucketId,
        fileName: fullKey,
        data: data,
        contentType: options.contentType || 'application/octet-stream',
        fileInfo: {
          originalName: options.name || key.split('/').pop(),
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      const result = await this.b2Client.uploadFile(params);
      this.fileIdCache.set(fullKey, result.fileId);
      
      return { success: true, url: result.fileId };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const result = await this.b2Client.downloadFileByName({
        bucketName: this.bucketName,
        fileName: fullKey
      });
      
      return { success: true, data: result.data, metadata: result.fileInfo };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  /**
   * Resolve the B2 fileId for a given full key, using the cache first and
   * falling back to a name lookup. B2's delete/copy/getFileInfo APIs need
   * this actual fileId, not just the file name.
   */
  async resolveFileId(fullKey) {
    if (this.fileIdCache.has(fullKey)) {
      return this.fileIdCache.get(fullKey);
    }
    const result = await this.b2Client.listFileNames({
      bucketId: this.bucketId,
      prefix: fullKey,
      maxFileCount: 1
    });
    const match = result.files?.find(f => f.fileName === fullKey);
    if (match) {
      this.fileIdCache.set(fullKey, match.fileId);
      return match.fileId;
    }
    return null;
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const fileId = await this.resolveFileId(fullKey);
      if (!fileId) {
        return { success: false, error: 'File not found' };
      }
      
      await this.b2Client.deleteFileVersion({
        bucketId: this.bucketId,
        fileName: fullKey,
        fileId
      });
      this.fileIdCache.delete(fullKey);
      
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
      const sourceFileId = await this.resolveFileId(fullSourceKey);
      if (!sourceFileId) {
        return { success: false, error: 'Source file not found' };
      }
      
      const result = await this.b2Client.copyFile({
        sourceFileId,
        destinationBucketId: this.bucketId,
        destinationFileName: fullDestKey
      });
      if (result?.fileId) {
        this.fileIdCache.set(fullDestKey, result.fileId);
      }
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const fullPrefix = `${this.prefix}/${prefix}`;
      
      const result = await this.b2Client.listFileNames({
        bucketId: this.bucketId,
        prefix: fullPrefix,
        maxFileCount: options.limit || 1000
      });
      
      const files = result.files.map(file => {
        this.fileIdCache.set(file.fileName, file.fileId);
        return {
          key: file.fileName.replace(`${this.prefix}/`, ''),
          size: file.size,
          lastModified: file.uploadTimestamp,
          etag: file.fileId
        };
      });
      
      return { success: true, files };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, files: [], error: error.message };
    }
  }

  async exists(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const fileId = await this.resolveFileId(fullKey);
      
      if (!fileId) {
        return { exists: false };
      }
      
      await this.b2Client.getFileInfo({ fileId });
      
      return { exists: true };
    } catch (error) {
      if (error.code === 'not_found') {
        return { exists: false };
      }
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const fileId = await this.resolveFileId(fullKey);
      
      if (!fileId) {
        return { success: false, error: 'File not found' };
      }
      
      const result = await this.b2Client.getFileInfo({ fileId });
      
      return { 
        success: true, 
        metadata: {
          size: result.size,
          lastModified: result.uploadTimestamp,
          contentType: result.contentType,
          etag: result.fileId,
          customMetadata: result.fileInfo
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
      if (!this.b2Client) {
        await this.connect();
      }

      await this.b2Client.getBucket({ bucketId: this.bucketId });
      
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
      bucketId: this.bucketId,
      bucketName: this.bucketName,
      prefix: this.prefix
    };
  }
}
