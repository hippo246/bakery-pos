// Supabase Storage Provider
// Implements BaseProvider interface for Supabase Storage

import { BaseProvider, ProviderStatus, ProviderCapabilities, StorageType, AuthMethod } from './BaseProvider.js';

export class SupabaseStorageProvider extends BaseProvider {
  constructor(config = {}) {
    super(config);
    this.providerId = 'supabase-storage';
    this.providerName = 'Supabase Storage';
    this.projectUrl = config.projectUrl || '';
    this.anonKey = config.anonKey || '';
    this.serviceRoleKey = config.serviceRoleKey || '';
    this.bucket = config.bucket || '';
    this.prefix = config.prefix || 'cafeos';
    this.sdk = null; // Supabase SDK will be loaded dynamically
    this.storageClient = null;
    this.storageType = StorageType.OBJECT;
    this.authMethod = AuthMethod.API_KEY;
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
      // Dynamically load Supabase SDK only when needed
      if (!this.sdk) {
        this.sdk = await this.loadSupabaseSDK();
      }

      const supabase = this.sdk.createClient(
        this.projectUrl,
        this.serviceRoleKey || this.anonKey
      );

      this.storageClient = supabase.storage;
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

    if (!this.projectUrl) {
      errors.push('Project URL is required');
    }

    if (!this.anonKey && !this.serviceRoleKey) {
      errors.push('Anon key or service role key is required');
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
    // Supabase tokens are automatically refreshed by the SDK
    return await this.authenticate();
  }

  async testConnection() {
    const diagnostics = {
      credentials: false,
      bucketAccess: false,
      write: false,
      read: false,
      delete: false,
      projectUrl: false,
      latency: 0,
      bandwidth: null
    };

    const startTime = Date.now();

    try {
      if (this.projectUrl) diagnostics.projectUrl = true;
      if (this.projectUrl && (this.anonKey || this.serviceRoleKey)) diagnostics.credentials = true;

      try {
        await this.storageClient.from(this.bucket).list(this.prefix, { limit: 1 });
        diagnostics.bucketAccess = true;
      } catch (error) {
        // Bucket might not exist yet
      }

      const testKey = `${this.prefix}_test_${Date.now()}`;
      try {
        const { error } = await this.storageClient.from(this.bucket).upload(testKey, new Blob(['test']));
        if (!error) diagnostics.write = true;
      } catch (error) {
        // Write permission might be missing
      }

      if (diagnostics.write) {
        try {
          const { data, error } = await this.storageClient.from(this.bucket).download(testKey);
          if (!error) diagnostics.read = true;
        } catch (error) {
          // Read permission might be missing
        }
      }

      if (diagnostics.write) {
        try {
          const { error } = await this.storageClient.from(this.bucket).remove([testKey]);
          if (!error) diagnostics.delete = true;
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

  async loadSupabaseSDK() {
    // Stub for Supabase SDK loading
    return {
      createClient: (url, key) => ({
        storage: {
          from: (bucket) => ({
            upload: (path, file) => Promise.resolve({ data: { path }, error: null }),
            download: (path) => Promise.resolve({ data: new Blob(), error: null }),
            remove: (paths) => Promise.resolve({ data: {}, error: null }),
            list: (prefix, options) => Promise.resolve({ data: [], error: null }),
            getPublicUrl: (path) => ({ data: { publicUrl: 'https://example.com/file' } }),
            createSignedUrl: (path, expiresIn) => Promise.resolve({ data: { signedUrl: 'https://example.com/file' } }),
            copy: (source, dest) => Promise.resolve({ data: {}, error: null }),
            move: (source, dest) => Promise.resolve({ data: {}, error: null })
          })
        }
      })
    };
  }

  async upload(key, data, options = {}) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const { data: uploadData, error } = await this.storageClient.from(this.bucket).upload(
        fullKey,
        data,
        {
          contentType: options.contentType || 'application/octet-stream',
          metadata: {
            originalName: options.name || key.split('/').pop(),
            uploadedAt: new Date().toISOString(),
            ...options.metadata
          }
        }
      );

      if (error) throw error;
      
      const { data: urlData } = this.storageClient.from(this.bucket).getPublicUrl(fullKey);
      
      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async download(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const { data, error } = await this.storageClient.from(this.bucket).download(fullKey);
      
      if (error) throw error;
      
      return { success: true, data, metadata: {} };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async delete(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const { error } = await this.storageClient.from(this.bucket).remove([fullKey]);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async rename(oldKey, newKey) {
    try {
      await this.move(oldKey, newKey);
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async move(sourceKey, destKey) {
    try {
      const fullSourceKey = `${this.prefix}/${sourceKey}`;
      const fullDestKey = `${this.prefix}/${destKey}`;
      
      const { error } = await this.storageClient.from(this.bucket).move(fullSourceKey, fullDestKey);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async copy(sourceKey, destKey) {
    try {
      const fullSourceKey = `${this.prefix}/${sourceKey}`;
      const fullDestKey = `${this.prefix}/${destKey}`;
      
      const { error } = await this.storageClient.from(this.bucket).copy(fullSourceKey, fullDestKey);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      this.lastError = error.message;
      return { success: false, error: error.message };
    }
  }

  async list(prefix = '', options = {}) {
    try {
      const fullPrefix = `${this.prefix}/${prefix}`;
      
      const { data, error } = await this.storageClient.from(this.bucket).list(fullPrefix, {
        limit: options.limit || 1000
      });
      
      if (error) throw error;
      
      const files = data.map(file => ({
        key: file.name.replace(`${this.prefix}/`, ''),
        size: file.metadata?.size || 0,
        lastModified: file.created_at,
        etag: file.id
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
      
      const { data, error } = await this.storageClient.from(this.bucket).list('', {
        search: fullKey,
        limit: 1
      });
      
      if (error) throw error;
      
      return { exists: data.length > 0 };
    } catch (error) {
      this.lastError = error.message;
      return { exists: false, error: error.message };
    }
  }

  async metadata(key) {
    try {
      const fullKey = `${this.prefix}/${key}`;
      
      const { data, error } = await this.storageClient.from(this.bucket).list('', {
        search: fullKey,
        limit: 1
      });
      
      if (error) throw error;
      
      if (data.length === 0) {
        return { success: false, error: 'File not found' };
      }
      
      return { 
        success: true, 
        metadata: {
          size: data[0].metadata?.size || 0,
          lastModified: data[0].created_at,
          contentType: data[0].metadata?.mimetype,
          etag: data[0].id,
          customMetadata: data[0].metadata
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
      if (!this.storageClient) {
        await this.connect();
      }

      await this.storageClient.from(this.bucket).list(this.prefix, { limit: 1 });
      
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
      projectUrl: this.projectUrl,
      bucket: this.bucket,
      prefix: this.prefix
    };
  }
}
