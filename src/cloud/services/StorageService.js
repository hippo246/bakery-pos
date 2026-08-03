// Storage Service
// High-level service layer for storage operations
// UI components should use this service, never providers directly

import registry from '../ProviderRegistry.js';
import directoryStructure from '../DirectoryStructure.js';
import NamingStrategy, { STORAGE_TYPES } from '../StorageTypes.js';

/**
 * Storage Service
 * Central service for all storage operations
 * Provides high-level API for modules to interact with storage
 */
class StorageService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize storage service
   */
  async initialize() {
    if (this.initialized) return;
    await registry.initialize();
    this.initialized = true;
  }

  /**
   * Upload file to storage
   * @param {File|Blob} file 
   * @param {string} storageType 
   * @param {object} options 
   * @returns {Promise<{success: boolean, key?: string, url?: string, error?: string}>}
   */
  async upload(file, storageType, options = {}) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      // Generate filename
      const filename = NamingStrategy.generateFilename(storageType, options);

      // Generate storage key
      const key = NamingStrategy.generateKey(storageType, filename, options);

      // Upload to provider
      const result = await provider.upload(file, key, options);

      if (result.success) {
        return { success: true, key, url: result.url };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Download file from storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: Blob, error?: string}>}
   */
  async download(key) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.download(key);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete file from storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(key) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.delete(key);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Move file to new location
   * @param {string} sourceKey 
   * @param {string} destinationKey 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async move(sourceKey, destinationKey) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.move(sourceKey, destinationKey);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Copy file to new location
   * @param {string} sourceKey 
   * @param {string} destinationKey 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async copy(sourceKey, destinationKey) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.copy(sourceKey, destinationKey);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if file exists
   * @param {string} key 
   * @returns {Promise<{exists: boolean, error?: string}>}
   */
  async exists(key) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { exists: false, error: 'No active provider' };
      }

      const result = await provider.exists(key);

      return result;
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  /**
   * List files in storage
   * @param {string} storageType 
   * @param {object} options 
   * @returns {Promise<{success: boolean, files: Array, error?: string}>}
   */
  async list(storageType, options = {}) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, files: [], error: 'No active provider' };
      }

      const directory = directoryStructure.getDirectoryForType(storageType);
      const prefix = directoryStructure.getPathForType(storageType, options);

      const result = await provider.list(prefix, options);

      if (result.success) {
        return { success: true, files: result.files };
      } else {
        return { success: false, files: [], error: result.error };
      }
    } catch (error) {
      return { success: false, files: [], error: error.message };
    }
  }

  /**
   * Get file metadata
   * @param {string} key 
   * @returns {Promise<{success: boolean, metadata?: object, error?: string}>}
   */
  async getMetadata(key) {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.getMetadata(key);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storage usage
   * @returns {Promise<{success: boolean, usage?: object, error?: string}>}
   */
  async getUsage() {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.getUsage();

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get storage quota
   * @returns {Promise<{success: boolean, quota?: object, error?: string}>}
   */
  async getQuota() {
    try {
      await this.initialize();

      const provider = registry.getActiveProvider();
      if (!provider) {
        return { success: false, error: 'No active provider' };
      }

      const result = await provider.getQuota();

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
const storageService = new StorageService();

export default storageService;
