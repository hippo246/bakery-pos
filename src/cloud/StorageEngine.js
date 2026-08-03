// Universal Storage Engine
// Central engine for all cloud storage operations
// All CafeOS modules communicate ONLY with this engine
// Credentials are managed through CredentialManager (Secret Vault)

import registry from './ProviderRegistry.js';
import { LocalStorageProvider } from './providers/LocalStorageProvider.js';
import credentialManager from '../security/CredentialManager.js';
import { getCurrentUserId } from '../utils/authService.js';

/**
 * Storage Engine
 * Central orchestration layer for all storage operations
 * Modules must use this engine - never direct provider access
 * All credentials are stored encrypted in Secret Vault
 */
class StorageEngine {
  constructor() {
    this.initialized = false;
    this.uploadQueue = [];
    this.isProcessingQueue = false;
    this.cache = new Map();
    this.cacheEnabled = true;
    this.cacheMaxSize = 100;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    this.backgroundSyncEnabled = true;
    this.backgroundSyncInterval = 60 * 1000; // 1 minute
    this.backgroundSyncTimer = null;
    this.providers = new Map(); // Lazy-loaded providers
  }

  /**
   * Initialize the storage engine
   */
  async initialize() {
    if (this.initialized) return;

    // Initialize registry (includes credential manager)
    await registry.initialize();

    // Register built-in providers (local only initially)
    registry.registerProvider('local', new LocalStorageProvider());

    // Load saved configurations and connect providers (without credentials)
    await this.loadProviderConfigurations();

    // Start background sync
    if (this.backgroundSyncEnabled) {
      this.startBackgroundSync();
    }

    this.initialized = true;
  }

  /**
   * Lazy-load a cloud provider
   * @param {string} providerId - Provider identifier
   */
  async loadProvider(providerId) {
    if (this.providers.has(providerId)) {
      return this.providers.get(providerId);
    }

    let ProviderClass;
    switch (providerId) {
      case 'aws-s3': {
        const { AWSS3Provider } = await import('./providers/AWSS3Provider.js');
        ProviderClass = AWSS3Provider;
        break;
      }
      case 'azure-blob': {
        const { AzureBlobProvider } = await import('./providers/AzureBlobProvider.js');
        ProviderClass = AzureBlobProvider;
        break;
      }
      case 'firebase-storage': {
        const { FirebaseStorageProvider } = await import('./providers/FirebaseStorageProvider.js');
        ProviderClass = FirebaseStorageProvider;
        break;
      }
      case 'cloudflare-r2': {
        const { CloudflareR2Provider } = await import('./providers/CloudflareR2Provider.js');
        ProviderClass = CloudflareR2Provider;
        break;
      }
      case 'minio': {
        const { MinIOProvider } = await import('./providers/MinIOProvider.js');
        ProviderClass = MinIOProvider;
        break;
      }
      case 'supabase-storage': {
        const { SupabaseStorageProvider } = await import('./providers/SupabaseStorageProvider.js');
        ProviderClass = SupabaseStorageProvider;
        break;
      }
      case 'gcs': {
        const { GCSProvider } = await import('./providers/GCSProvider.js');
        ProviderClass = GCSProvider;
        break;
      }
      case 'backblaze-b2': {
        const { BackblazeB2Provider } = await import('./providers/BackblazeB2Provider.js');
        ProviderClass = BackblazeB2Provider;
        break;
      }
      case 'smb-nas': {
        const { SMBProvider } = await import('./providers/SMBProvider.js');
        ProviderClass = SMBProvider;
        break;
      }
      case 'webdav': {
        const { WebDAVProvider } = await import('./providers/WebDAVProvider.js');
        ProviderClass = WebDAVProvider;
        break;
      }
      default:
        throw new Error(`Unknown provider: ${providerId}`);
    }

    const provider = new ProviderClass();
    this.providers.set(providerId, provider);
    registry.registerProvider(providerId, provider);
    return provider;
  }

  /**
   * Start background sync
   */
  startBackgroundSync() {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
    }

    this.backgroundSyncTimer = setInterval(() => {
      this.processUploadQueue();
      this.healthCheckAllProviders();
    }, this.backgroundSyncInterval);
  }

  /**
   * Stop background sync
   */
  stopBackgroundSync() {
    if (this.backgroundSyncTimer) {
      clearInterval(this.backgroundSyncTimer);
      this.backgroundSyncTimer = null;
    }
  }

  /**
   * Health check all providers
   */
  async healthCheckAllProviders() {
    const providers = registry.getAllProviders();
    
    for (const [providerId, provider] of Object.entries(providers)) {
      if (provider.connected) {
        try {
          await provider.healthCheck();
        } catch (error) {
          console.error(`[StorageEngine] Health check failed for ${providerId}:`, error);
        }
      }
    }
  }

  /**
   * Get from cache
   * @param {string} key 
   * @returns {any|null}
   */
  getFromCache(key) {
    if (!this.cacheEnabled) return null;
    
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Check TTL
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  /**
   * Set in cache
   * @param {string} key 
   * @param {any} data 
   */
  setInCache(key, data) {
    if (!this.cacheEnabled) return;
    
    // Evict oldest if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Enable/disable cache
   * @param {boolean} enabled 
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.clearCache();
    }
  }

  /**
   * Load saved provider configurations from localStorage
   * NOTE: No longer loads credentials from localStorage
   * Credentials are now managed through CredentialManager (Secret Vault)
   */
  async loadProviderConfigurations() {
    try {
      const savedConfig = localStorage.getItem('cafeos_cloud_providers');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        
        // Reconnect configured providers (without credentials from localStorage)
        // Credentials must be loaded through CredentialManager
        for (const [providerId, providerConfig] of Object.entries(config)) {
          if (providerId === 'activeProviderId') continue;
          
          const provider = registry.getProvider(providerId);
          if (provider && providerConfig.connected) {
            // Check if credentials exist in Secret Vault
            if (credentialManager.hasCredentials(providerId)) {
              // Load credentials from Secret Vault and connect
              const userId = getCurrentUserId() || 'system';
              const loadedCredentials = await credentialManager.retrieveCredentials(providerId, true, userId);
              if (loadedCredentials.success) {
                await provider.saveCredentials(loadedCredentials.credentials);
                await provider.connect();
              }
            }
          }
        }

        // Set active provider
        if (config.activeProviderId) {
          await registry.setActiveProvider(config.activeProviderId, 'system');
        }
      }
    } catch (error) {
      console.error('[StorageEngine] Failed to load provider configurations:', error);
    }
  }

  /**
   * Save provider configurations to localStorage
   * NOTE: No longer saves credentials to localStorage
   * Only saves connection status and active provider
   * Credentials are managed through CredentialManager (Secret Vault)
   */
  async saveProviderConfigurations() {
    try {
      const providers = registry.getAllProviders();
      const config = {
        activeProviderId: registry.activeProviderId
      };

      // Save only connection status, NOT credentials
      for (const provider of providers) {
        config[provider.id] = {
          connected: provider.instance.connected
          // credentials removed - stored in Secret Vault
        };
      }

      localStorage.setItem('cafeos_cloud_providers', JSON.stringify(config));
    } catch (error) {
      console.error('[StorageEngine] Failed to save provider configurations:', error);
    }
  }

  /**
   * Upload a file using the active provider
   * @param {File|Blob} file 
   * @param {string} key 
   * @param {object} options 
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async upload(file, key, options = {}) {
    const provider = registry.getActiveProvider();
    
    if (!provider) {
      return { success: false, error: 'No active provider configured' };
    }

    if (!provider.connected) {
      // Try to reconnect
      const reconnectResult = await provider.reconnect();
      if (!reconnectResult.success) {
        return { success: false, error: 'Provider not connected' };
      }
    }

    try {
      // Fix: arguments should be key, data
      const result = await provider.upload(key, file, options);
      
      if (result.success) {
        // Log the upload
        await this.logOperation('upload', { key, size: file.size, provider: provider.providerId });
      }
      
      return result;
    } catch (error) {
      // If upload fails, queue for retry
      this.uploadQueue.push({ file, key, options, timestamp: Date.now() });
      return { success: false, error: error.message };
    }
  }

  /**
   * Download a file using the active provider
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async download(key) {
    const provider = registry.getActiveProvider();
    
    if (!provider) {
      return { success: false, error: 'No active provider configured' };
    }

    if (!provider.connected) {
      const reconnectResult = await provider.reconnect();
      if (!reconnectResult.success) {
        return { success: false, error: 'Provider not connected' };
      }
    }

    try {
      const result = await provider.download(key);
      
      if (result.success) {
        await this.logOperation('download', { key, provider: provider.providerId });
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a file using the active provider
   * @param {string} key 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(key) {
    const provider = registry.getActiveProvider();
    
    if (!provider) {
      return { success: false, error: 'No active provider configured' };
    }

    if (!provider.connected) {
      const reconnectResult = await provider.reconnect();
      if (!reconnectResult.success) {
        return { success: false, error: 'Provider not connected' };
      }
    }

    try {
      const result = await provider.delete(key);
      
      if (result.success) {
        await this.logOperation('delete', { key, provider: provider.providerId });
      }
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * List files using the active provider
   * @param {string} prefix 
   * @param {object} options 
   * @returns {Promise<{success: boolean, files: object[], error?: string}>}
   */
  async list(prefix = '', options = {}) {
    const provider = registry.getActiveProvider();
    
    if (!provider) {
      return { success: false, files: [], error: 'No active provider configured' };
    }

    if (!provider.connected) {
      const reconnectResult = await provider.reconnect();
      if (!reconnectResult.success) {
        return { success: false, files: [], error: 'Provider not connected' };
      }
    }

    try {
      return await provider.list(prefix, options);
    } catch (error) {
      return { success: false, files: [], error: error.message };
    }
  }

  /**
   * Get file metadata using the active provider
   * @param {string} key 
   * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
   */
  async getMetadata(key) {
    const provider = registry.getActiveProvider();
    
    if (!provider) {
      return { success: false, error: 'No active provider configured' };
    }

    if (!provider.connected) {
      const reconnectResult = await provider.reconnect();
      if (!reconnectResult.success) {
        return { success: false, error: 'Provider not connected' };
      }
    }

    try {
      return await provider.getMetadata(key);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storage usage using the active provider
   * @returns {Promise<{success: boolean, usage: object, error?: string}>}
   */
  async getUsage() {
    const provider = registry.getActiveProvider();
    
    if (!provider) {
      return { success: false, usage: {}, error: 'No active provider configured' };
    }

    if (!provider.connected) {
      const reconnectResult = await provider.reconnect();
      if (!reconnectResult.success) {
        return { success: false, usage: {}, error: 'Provider not connected' };
      }
    }

    try {
      return await provider.getUsage();
    } catch (error) {
      return { success: false, usage: {}, error: error.message };
    }
  }

  /**
   * Configure a provider
   * @param {string} providerId 
   * @param {object} credentials 
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async configureProvider(providerId, credentials, userId) {
    const provider = registry.getProvider(providerId);
    
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    try {
      // Validate credentials
      const validation = await provider.validateCredentials(credentials);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Store credentials through CredentialManager (Secret Vault)
      const storeResult = await credentialManager.storeCredentials(providerId, credentials, userId);
      if (!storeResult.success) {
        return storeResult;
      }

      // Load credentials from Secret Vault and save to provider
      const loadedCredentials = await credentialManager.retrieveCredentials(providerId, true, userId);
      if (loadedCredentials.success) {
        const saveResult = await provider.saveCredentials(loadedCredentials.credentials);
        if (!saveResult.success) {
          return saveResult;
        }
      }

      // Test connection
      const testResult = await provider.testConnection();
      if (!testResult.success) {
        return { success: false, error: 'Connection test failed' };
      }

      // Save configuration (without credentials)
      await this.saveProviderConfigurations();
      
      await this.logOperation('provider_configured', { providerId, userId });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Set active provider
   * @param {string} providerId 
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setActiveProvider(providerId, userId) {
    const result = await registry.setActiveProvider(providerId, userId);
    
    if (result.success) {
      await this.saveProviderConfigurations();
      await this.logOperation('provider_activated', { providerId, userId });
    }
    
    return result;
  }

  /**
   * Clear active provider
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async clearActiveProvider(userId) {
    const result = await registry.clearActiveProvider(userId);
    
    if (result.success) {
      await this.saveProviderConfigurations();
      await this.logOperation('provider_deactivated', { userId });
    }
    
    return result;
  }

  /**
   * Test provider connection
   * @param {string} providerId 
   * @returns {Promise<{success: boolean, checks: object, error?: string}>}
   */
  async testProviderConnection(providerId) {
    const provider = registry.getProvider(providerId);
    
    if (!provider) {
      return { success: false, checks: {}, error: 'Provider not found' };
    }

    try {
      return await provider.testConnection();
    } catch (error) {
      return { success: false, checks: {}, error: error.message };
    }
  }

  /**
   * Get provider health status
   * @param {string} providerId 
   * @returns {Promise<{healthy: boolean, latency: number, error?: string}>}
   */
  async getProviderHealth(providerId) {
    const provider = registry.getProvider(providerId);
    
    if (!provider) {
      return { healthy: false, latency: 0, error: 'Provider not found' };
    }

    try {
      return await provider.healthCheck();
    } catch (error) {
      return { healthy: false, latency: 0, error: error.message };
    }
  }

  /**
   * Process upload queue (retry failed uploads)
   */
  async processUploadQueue() {
    if (this.isProcessingQueue || this.uploadQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    const currentQueue = [...this.uploadQueue];
    for (const item of currentQueue) {
      try {
        await this.upload(item.file, item.key, item.options);
        // Remove from queue on success
        this.uploadQueue = this.uploadQueue.filter(i => i !== item);
      } catch (error) {
        // Keep in queue for retry
        console.error('[StorageEngine] Queue upload failed:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Log storage operation
   * @param {string} operation 
   * @param {object} details 
   */
  async logOperation(operation, details) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_storage_logs') || '[]');
      logs.push({
        operation,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_storage_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[StorageEngine] Failed to log operation:', error);
    }
  }

  /**
   * Get storage logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_storage_logs') || '[]');
      
      let filtered = logs;
      
      if (options.operation) {
        filtered = filtered.filter(log => log.operation === options.operation);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch {
      return [];
    }
  }

  /**
   * Get all providers info
   * @returns {Array}
   */
  getProvidersInfo() {
    return registry.getAllProviders();
  }

  /**
   * Get active provider info
   * @returns {object|null}
   */
  getActiveProviderInfo() {
    const provider = registry.getActiveProvider();
    if (!provider) return null;
    return provider.getProviderInfo();
  }
}

// Singleton instance
const storageEngine = new StorageEngine();

export default storageEngine;
