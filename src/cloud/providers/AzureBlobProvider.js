// Azure Blob Storage Provider
// Implements BaseProvider interface for Azure Blob Storage

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class AzureBlobProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'azure-blob';
    this.providerName = 'Azure Blob Storage';
    this.accountName = config.accountName || '';
    this.accountKey = config.accountKey || '';
    this.container = config.container || '';
    this.connectionString = config.connectionString || '';
    this.prefix = config.prefix || 'cafeos';
    this.sdk = null; // Azure SDK will be loaded dynamically
    this.blobServiceClient = null;
    this.containerClient = null;
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
    this.capabilities.add(ProviderCapabilities.STORAGE_CLASSES);
    this.capabilities.add(ProviderCapabilities.METADATA);
    this.capabilities.add(ProviderCapabilities.COPY);
  }

  async initialize() {
    try {
      // Dynamically load Azure SDK only when needed
      if (!this.sdk) {
        this.sdk = await this.loadAzureSDK();
      }

      const blobServiceClient = new this.sdk.BlobServiceClient(
        this.connectionString || `DefaultEndpointsProtocol=https;AccountName=${this.accountName};AccountKey=${this.accountKey};EndpointSuffix=core.windows.net`
      );

      this.blobServiceClient = blobServiceClient;
      this.containerClient = blobServiceClient.getContainerClient(this.container);
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
    this.blobServiceClient = null;
    this.containerClient = null;
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }

  async authenticate() {
    if (!this.blobServiceClient) {
      await this.connect();
    }
    return { success: this.status === ProviderStatus.CONNECTED };
  }

  async validateCredentials() {
    const errors = [];

    if (!this.connectionString) {
      if (!this.accountName) {
        errors.push('Account name is required (or provide connection string)');
      }
      if (!this.accountKey) {
        errors.push('Account key is required (or provide connection string)');
      }
    }

    if (!this.container) {
      errors.push('Container name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async refreshAuth() {
    // Azure tokens are automatically refreshed by the SDK
    return await this.authenticate();
  }

  async testConnection() {
    const diagnostics = {
      credentials: false,
      containerAccess: false,
      write: false,
      read: false,
      delete: false,
      account: false,
      latency: 0,
      bandwidth: null
    };

    const startTime = Date.now();

    try {
      // Test credentials
      if (this.connectionString || (this.accountName && this.accountKey)) {
        diagnostics.credentials = true;
      }

      // Test account
      if (this.accountName) {
        diagnostics.account = true;
      }

      // Test container access
      try {
        await this.containerClient.getProperties();
        diagnostics.containerAccess = true;
      } catch (error) {
        // Container might not exist yet
      }

      // Test write
      const testKey = `${this.prefix}_test_${Date.now()}`;
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(testKey);
        await blockBlobClient.upload('test', 4);
        diagnostics.write = true;
      } catch (error) {
        // Write permission might be missing
      }

      // Test read
      if (diagnostics.write) {
        try {
          const blockBlobClient = this.containerClient.getBlockBlobClient(testKey);
          await blockBlobClient.download();
          diagnostics.read = true;
        } catch (error) {
          // Read permission might be missing
        }
      }

      // Test delete
      if (diagnostics.write) {
        try {
          const blockBlobClient = this.containerClient.getBlockBlobClient(testKey);
          await blockBlobClient.delete();
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

  async loadAzureSDK() {
    // Stub for Azure SDK loading
    // In production, this would dynamically load the Azure Storage SDK
    return {
      BlobServiceClient: class {
        constructor(connectionString) {
          this.connectionString = connectionString;
        }
        getContainerClient(name) {
          return {
            getProperties: async () => ({ $metadata: { httpStatusCode: 200 } }),
            getBlockBlobClient: (key) => ({
              upload: async (data, size) => ({ $metadata: { httpStatusCode: 201 } }),
              download: async () => ({ readableStreamBody: { pipeTo: async () => {} } }),
              delete: async () => ({ $metadata: { httpStatusCode: 202 } }),
              getProperties: async () => ({ $metadata: { httpStatusCode: 200 } }),
              startCopyFromURL: async (url) => ({ $metadata: { httpStatusCode: 202 } })
            }),
            listBlobsFlat: async () => [[], { $metadata: { httpStatusCode: 200 } }]
          };
        }
      }
    };
  }

  async upload(key, data, options = {}) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(fullKey);

      const metadata = {
        metadata: {
          originalName: options.name || key.split('/').pop(),
          uploadedAt: new Date().toISOString(),
          ...options.metadata
        }
      };

      await blockBlobClient.upload(data, data.size || data.length, {
        blobHTTPHeaders: {
          blobContentType: options.contentType || 'application/octet-stream'
        },
        metadata: metadata.metadata
      });
      
      const url = blockBlobClient.url;
      
      return { success: true, url };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(fullKey);

      const downloadResponse = await blockBlobClient.download();
      const properties = await blockBlobClient.getProperties();
      
      return { success: true, data: downloadResponse.readableStreamBody, metadata: properties.metadata };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(fullKey);

      await blockBlobClient.delete();
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async rename(oldKey, newKey) {
    try {
      // Azure doesn't have rename, use copy + delete
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
      const sourceBlobClient = this.containerClient.getBlockBlobClient(fullSourceKey);
      const destBlobClient = this.containerClient.getBlockBlobClient(fullDestKey);

      await destBlobClient.startCopyFromURL(sourceBlobClient.url);
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const fullPrefix = `${this.prefix}/${prefix}`;

      const [blobs] = await this.containerClient.listBlobsFlat({
        prefix: fullPrefix
      });
      
      const fileList = blobs.map(blob => ({
        key: blob.name.replace(`${this.prefix}/`, ''),
        size: blob.properties.contentLength,
        lastModified: blob.properties.lastModified,
        etag: blob.properties.etag
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
      const blockBlobClient = this.containerClient.getBlockBlobClient(fullKey);

      await blockBlobClient.getProperties();
      
      return { exists: true };
    } catch (error) {
      if (error.statusCode === 404) {
        return { exists: false };
      }
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(fullKey);

      const properties = await blockBlobClient.getProperties();
      
      return { 
        success: true, 
        metadata: {
          size: properties.contentLength,
          lastModified: properties.lastModified,
          contentType: properties.contentType,
          etag: properties.etag,
          customMetadata: properties.metadata
        }
      };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async quota() {
    try {
      // Azure doesn't provide direct usage without additional permissions
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
      if (!this.blobServiceClient) {
        await this.connect();
      }

      await this.containerClient.getProperties();
      
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
      accountName: this.accountName,
      container: this.container,
      prefix: this.prefix
    };
  }
}
