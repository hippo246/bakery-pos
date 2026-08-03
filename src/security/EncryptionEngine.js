// Encryption Engine
// Data protection with configurable encryption

import { SecurityInterface } from './SecurityInterface.js';
import { EncryptionStatus, SecurityStatus, SecurityLevel } from './SecurityTypes.js';

export class EncryptionEngine extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.encryptionKey = null;
    this.encryptionAlgorithm = 'AES-GCM';
    this.keySize = 256;
    this.storageKey = 'cafeos_encryption_engine';
    this.loadState();
  }

  /**
   * Initialize the encryption engine
   */
  async initialize() {
    try {
      this.encryptionKey = await this.getOrCreateKey();
      this.status = EncryptionStatus.ENABLED;
      return { success: true };
    } catch (error) {
      this.status = EncryptionStatus.FAILED;
      return { success: false, error: error.message };
    }
  }

  /**
   * Encrypt data
   * @param {string} data - Data to encrypt
   * @returns {Promise<object>} Encryption result
   */
  async encrypt(data) {
    if (!this.enabled || !this.encryptionKey) {
      return { success: false, error: 'Encryption not enabled' };
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const key = await this.importKey(this.encryptionKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.encryptionAlgorithm, iv },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64
      const encryptedData = btoa(String.fromCharCode(...combined));
      
      return { 
        success: true, 
        encryptedData,
        algorithm: this.encryptionAlgorithm,
        keySize: this.keySize
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data
   * @returns {Promise<object>} Decryption result
   */
  async decrypt(encryptedData) {
    if (!this.enabled || !this.encryptionKey) {
      return { success: false, error: 'Encryption not enabled' };
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);
      
      const key = await this.importKey(this.encryptionKey);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.encryptionAlgorithm, iv },
        key,
        encryptedBuffer
      );
      
      const decoder = new TextDecoder();
      const decryptedData = decoder.decode(decryptedBuffer);
      
      return { success: true, decryptedData };
    } catch (error) {
      console.error('Decryption failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Encrypt a file/blob
   * @param {Blob} data - Data to encrypt
   * @returns {Promise<object>} Encryption result
   */
  async encryptBlob(data) {
    if (!this.enabled || !this.encryptionKey) {
      return { success: false, error: 'Encryption not enabled' };
    }

    try {
      const dataBuffer = await data.arrayBuffer();
      
      const key = await this.importKey(this.encryptionKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.encryptionAlgorithm, iv },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      const encryptedBlob = new Blob([combined], { type: 'application/octet-stream' });
      
      return { 
        success: true, 
        encryptedData: encryptedBlob,
        algorithm: this.encryptionAlgorithm,
        keySize: this.keySize
      };
    } catch (error) {
      console.error('Blob encryption failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt a file/blob
   * @param {Blob} encryptedData - Encrypted data
   * @returns {Promise<object>} Decryption result
   */
  async decryptBlob(encryptedData) {
    if (!this.enabled || !this.encryptionKey) {
      return { success: false, error: 'Encryption not enabled' };
    }

    try {
      const combined = await encryptedData.arrayBuffer();
      const combinedArray = new Uint8Array(combined);
      
      const iv = combinedArray.slice(0, 12);
      const encryptedBuffer = combinedArray.slice(12);
      
      const key = await this.importKey(this.encryptionKey);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.encryptionAlgorithm, iv },
        key,
        encryptedBuffer
      );
      
      const decryptedBlob = new Blob([decryptedBuffer], { type: 'application/octet-stream' });
      
      return { success: true, decryptedData: decryptedBlob };
    } catch (error) {
      console.error('Blob decryption failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Rotate encryption key
   * @returns {Promise<object>} Rotation result
   */
  async rotateKey() {
    try {
      this.status = EncryptionStatus.ROTATING;
      
      // Generate new key
      const newKey = await this.generateKey();
      
      // Store old key for migration (in production would re-encrypt all data)
      const _oldKey = this.encryptionKey;
      
      this.encryptionKey = newKey;
      this.lastModified = new Date().toISOString();
      this.status = EncryptionStatus.ENABLED;
      
      this.saveState();
      
      return { 
        success: true, 
        message: 'Key rotated successfully',
        note: 'Data re-encryption required in production'
      };
    } catch (error) {
      this.status = EncryptionStatus.FAILED;
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify encryption is working
   * @returns {Promise<object>} Verification result
   */
  async verify() {
    if (!this.enabled || !this.encryptionKey) {
      return { success: false, error: 'Encryption not enabled' };
    }

    try {
      const testData = 'test-verification-string';
      const encrypted = await this.encrypt(testData);
      
      if (!encrypted.success) {
        return { success: false, error: 'Encryption failed' };
      }

      const decrypted = await this.decrypt(encrypted.encryptedData);
      
      if (!decrypted.success) {
        return { success: false, error: 'Decryption failed' };
      }

      if (decrypted.decryptedData !== testData) {
        return { success: false, error: 'Data mismatch' };
      }

      return { success: true, message: 'Encryption verified' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get encryption status
   * @returns {object} Status information
   */
  getStatusInfo() {
    return {
      status: this.status,
      enabled: this.enabled,
      algorithm: this.encryptionAlgorithm,
      keySize: this.keySize,
      lastModified: this.lastModified
    };
  }

  /**
   * Import encryption key
   * @param {string} keyString - Key string
   * @returns {Promise<CryptoKey>} Crypto key
   */
  async importKey(keyString) {
    const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.encryptionAlgorithm },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate new encryption key
   * @returns {Promise<string>} Key string
   */
  async generateKey() {
    const keyData = crypto.getRandomValues(new Uint8Array(this.keySize / 8));
    return btoa(String.fromCharCode(...keyData));
  }

  /**
   * Get or create encryption key
   * @returns {Promise<string>} Encryption key
   */
  async getOrCreateKey() {
    let key = localStorage.getItem('cafeos_encryption_key');
    
    if (!key) {
      key = await this.generateKey();
      localStorage.setItem('cafeos_encryption_key', key);
    }
    
    return key;
  }

  /**
   * Enable encryption
   * @returns {Promise<object>} Enable result
   */
  async enable() {
    try {
      this.encryptionKey = await this.getOrCreateKey();
      this.enabled = true;
      this.status = EncryptionStatus.ENABLED;
      this.lastModified = new Date().toISOString();
      this.saveState();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Disable encryption
   * @returns {Promise<object>} Disable result
   */
  async disable() {
    this.enabled = false;
    this.status = EncryptionStatus.DISABLED;
    this.lastModified = new Date().toISOString();
    this.saveState();
    return { success: true };
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (!this.encryptionKey) {
      return { valid: false, reason: 'Encryption key not available' };
    }

    if (this.keySize < 128) {
      return { valid: false, reason: 'Key size too small (minimum 128 bits)' };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    let score = 100;

    if (!this.enabled) {
      score -= 50;
    }

    if (!this.encryptionKey) {
      score -= 30;
    }

    if (this.keySize < 256) {
      score -= 10;
    }

    if (this.status !== EncryptionStatus.ENABLED) {
      score -= 20;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    if (!this.enabled) {
      recommendations.push({
        level: 'critical',
        message: 'Encryption is disabled',
        action: 'Enable encryption to protect sensitive data'
      });
    }

    if (!this.encryptionKey) {
      recommendations.push({
        level: 'critical',
        message: 'Encryption key not available',
        action: 'Generate encryption key'
      });
    }

    if (this.keySize < 256) {
      recommendations.push({
        level: 'warning',
        message: 'Using smaller key size',
        action: 'Consider upgrading to 256-bit key for better security'
      });
    }

    if (this.status !== EncryptionStatus.ENABLED) {
      recommendations.push({
        level: 'warning',
        message: 'Encryption status is not enabled',
        action: 'Check encryption status and resolve issues'
      });
    }

    return recommendations;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        enabled: this.enabled,
        status: this.status,
        algorithm: this.encryptionAlgorithm,
        keySize: this.keySize,
        lastModified: this.lastModified
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save encryption engine state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem(this.storageKey);
      if (state) {
        const parsed = JSON.parse(state);
        this.enabled = parsed.enabled !== false;
        this.status = parsed.status || EncryptionStatus.UNKNOWN;
        this.encryptionAlgorithm = parsed.algorithm || 'AES-GCM';
        this.keySize = parsed.keySize || 256;
        this.lastModified = parsed.lastModified || new Date().toISOString();
      }
    } catch (error) {
      console.error('Failed to load encryption engine state:', error);
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.enabled = true;
    this.status = EncryptionStatus.UNKNOWN;
    this.encryptionKey = null;
    localStorage.removeItem('cafeos_encryption_key');
    localStorage.removeItem(this.storageKey);
    this.lastModified = new Date().toISOString();
    return { success: true };
  }

  /**
   * Destroy the encryption engine
   */
  async destroy() {
    await this.reset();
    console.log('[EncryptionEngine] Destroyed');
  }
}

// Singleton instance
let encryptionEngineInstance = null;

/**
 * Get the singleton encryption engine instance
 * @returns {EncryptionEngine} Encryption engine instance
 */
export function getEncryptionEngine() {
  if (!encryptionEngineInstance) {
    encryptionEngineInstance = new EncryptionEngine();
  }
  return encryptionEngineInstance;
}

export default EncryptionEngine;
