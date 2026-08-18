// Encrypted Storage Wrapper
// localStorage encryption wrapper using EncryptionEngine

import { getEncryptionEngine } from './EncryptionEngine.js';

export class EncryptedStorage {
  constructor(config = {}) {
    this.encryptionEngine = getEncryptionEngine();
    this.prefix = config.prefix || 'enc_';
    this.enabled = config.enabled !== false;
    this.initialized = false;
  }

  /**
   * Initialize encrypted storage
   */
  async initialize() {
    try {
      await this.encryptionEngine.initialize();
      this.initialized = true;
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize encrypted storage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set item with encryption
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @returns {Promise<object>} Result
   */
  async setItem(key, value) {
    if (!this.enabled || !this.initialized) {
      // Fallback to regular localStorage if encryption not available
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
        return { success: true, encrypted: false };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    try {
      const jsonString = JSON.stringify(value);
      const encrypted = await this.encryptionEngine.encrypt(jsonString);
      
      if (!encrypted.success) {
        throw new Error(encrypted.error);
      }

      localStorage.setItem(this.prefix + key, encrypted.encryptedData);
      return { success: true, encrypted: true };
    } catch (error) {
      console.error('Failed to set encrypted item:', error);
      // Fallback to unencrypted storage
      try {
        localStorage.setItem(this.prefix + key, JSON.stringify(value));
        return { success: true, encrypted: false, fallback: true };
      } catch (fallbackError) {
        return { success: false, error: fallbackError.message };
      }
    }
  }

  /**
   * Get item with decryption
   * @param {string} key - Storage key
   * @returns {Promise<any>} Decrypted value
   */
  async getItem(key) {
    const encryptedData = localStorage.getItem(this.prefix + key);
    
    if (!encryptedData) {
      return null;
    }

    // Try to decrypt first
    if (this.enabled && this.initialized) {
      try {
        const decrypted = await this.encryptionEngine.decrypt(encryptedData);
        
        if (decrypted.success) {
          return JSON.parse(decrypted.decryptedData);
        }
      } catch (error) {
        console.log('Decryption failed, trying as plain JSON:', error.message);
      }
    }

    // Fallback to plain JSON
    try {
      return JSON.parse(encryptedData);
    } catch (error) {
      console.error('Failed to parse stored data:', error);
      return null;
    }
  }

  /**
   * Remove item
   * @param {string} key - Storage key
   */
  removeItem(key) {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all encrypted storage
   */
  clear() {
    const keys = this.getKeys();
    keys.forEach(key => this.removeItem(key));
  }

  /**
   * Get all keys
   * @returns {Array} Array of keys
   */
  getKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  }

  /**
   * Get storage size
   * @returns {object} Size information
   */
  getSize() {
    const keys = this.getKeys();
    let totalSize = 0;
    let encryptedCount = 0;

    keys.forEach(key => {
      const data = localStorage.getItem(this.prefix + key);
      if (data) {
        totalSize += data.length;
        // Simple heuristic to check if encrypted (base64 encoded)
        try {
          atob(data);
          encryptedCount++;
        } catch (e) {
          // Not base64, likely plain text
        }
      }
    });

    return {
      totalKeys: keys.length,
      totalSize: totalSize,
      encryptedCount: encryptedCount,
      plainCount: keys.length - encryptedCount
    };
  }

  /**
   * Migrate existing data to encrypted storage
   * @param {string} oldPrefix - Old prefix to migrate from
   * @returns {Promise<object>} Migration result
   */
  async migrateFrom(oldPrefix = '') {
    const results = {
      success: true,
      migrated: 0,
      failed: 0,
      errors: []
    };

    if (!this.enabled || !this.initialized) {
      results.success = false;
      results.errors.push('Encryption not available');
      return results;
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(oldPrefix) && !key.startsWith(this.prefix)) {
          const data = localStorage.getItem(key);
          const newKey = key.substring(oldPrefix.length);

          try {
            const value = JSON.parse(data);
            await this.setItem(newKey, value);
            localStorage.removeItem(key);
            results.migrated++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Failed to migrate ${key}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
    }

    return results;
  }

  /**
   * Enable encryption
   */
  async enable() {
    this.enabled = true;
    await this.initialize();
  }

  /**
   * Disable encryption
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Check if encryption is enabled
   * @returns {boolean} Enabled status
   */
  isEnabled() {
    return this.enabled;
  }
}

// Singleton instance
let encryptedStorageInstance = null;

/**
 * Get the singleton encrypted storage instance
 * @param {object} config - Configuration
 * @returns {EncryptedStorage} Encrypted storage instance
 */
export function getEncryptedStorage(config = {}) {
  if (!encryptedStorageInstance) {
    encryptedStorageInstance = new EncryptedStorage(config);
  }
  return encryptedStorageInstance;
}

export default EncryptedStorage;
