// Credential Vault
// Secure credential storage and management

import { SecurityInterface } from './SecurityInterface.js';
import { CredentialType, SecurityStatus, SecurityLevel } from './SecurityTypes.js';

export class CredentialVault extends SecurityInterface {
  constructor(config = {}) {
    super(config);
    this.credentials = new Map();
    this.storageKey = 'cafeos_credential_vault';
    this.encryptionKey = null;
    this.loadState();
  }

  /**
   * Initialize the credential vault
   */
  async initialize() {
    try {
      // Generate or load encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey();
      this.status = SecurityStatus.SECURE;
      return { success: true };
    } catch (error) {
      this.status = SecurityStatus.RISK;
      return { success: false, error: error.message };
    }
  }

  /**
   * Store a credential
   * @param {string} id - Credential ID
   * @param {string} type - Credential type
   * @param {string} value - Credential value
   * @param {object} metadata - Additional metadata
   * @returns {Promise<object>} Storage result
   */
  async storeCredential(id, type, value, metadata = {}) {
    try {
      if (!this.encryptionKey) {
        throw new Error('Encryption key not available');
      }

      const encryptedValue = await this.encrypt(value);
      
      const credential = {
        id,
        type,
        encryptedValue,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          lastRotated: new Date().toISOString()
        }
      };

      this.credentials.set(id, credential);
      this.saveState();
      
      return { success: true, credentialId: id };
    } catch (error) {
      console.error('Failed to store credential:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve a credential
   * @param {string} id - Credential ID
   * @returns {Promise<object|null>} Credential value
   */
  async retrieveCredential(id) {
    try {
      const credential = this.credentials.get(id);
      
      if (!credential) {
        return null;
      }

      const decryptedValue = await this.decrypt(credential.encryptedValue);
      
      return {
        id: credential.id,
        type: credential.type,
        value: decryptedValue,
        metadata: credential.metadata
      };
    } catch (error) {
      console.error('Failed to retrieve credential:', error);
      return null;
    }
  }

  /**
   * Get credential metadata (without value)
   * @param {string} id - Credential ID
   * @returns {object|null} Credential metadata
   */
  getCredentialMetadata(id) {
    const credential = this.credentials.get(id);
    
    if (!credential) {
      return null;
    }

    return {
      id: credential.id,
      type: credential.type,
      metadata: credential.metadata,
      maskedValue: this.maskCredential(credential.type, credential.encryptedValue)
    };
  }

  /**
   * Rotate a credential
   * @param {string} id - Credential ID
   * @param {string} newValue - New credential value
   * @returns {Promise<object>} Rotation result
   */
  async rotateCredential(id, newValue) {
    try {
      const credential = this.credentials.get(id);
      
      if (!credential) {
        return { success: false, error: 'Credential not found' };
      }

      const encryptedNewValue = await this.encrypt(newValue);
      
      credential.encryptedValue = encryptedNewValue;
      credential.metadata.lastRotated = new Date().toISOString();
      credential.metadata.rotationCount = (credential.metadata.rotationCount || 0) + 1;
      
      this.credentials.set(id, credential);
      this.saveState();
      
      return { success: true, credentialId: id };
    } catch (error) {
      console.error('Failed to rotate credential:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a credential
   * @param {string} id - Credential ID
   * @returns {object} Deletion result
   */
  deleteCredential(id) {
    const deleted = this.credentials.delete(id);
    this.saveState();
    
    return { success: deleted, credentialId: id };
  }

  /**
   * Get all credential IDs
   * @returns {Array} Credential IDs
   */
  getCredentialIds() {
    return Array.from(this.credentials.keys());
  }

  /**
   * Get credentials by type
   * @param {string} type - Credential type
   * @returns {Array} Credential IDs
   */
  getCredentialIdsByType(type) {
    const ids = [];
    for (const [id, credential] of this.credentials) {
      if (credential.type === type) {
        ids.push(id);
      }
    }
    return ids;
  }

  /**
   * Check if credential exists
   * @param {string} id - Credential ID
   * @returns {boolean} Existence status
   */
  hasCredential(id) {
    return this.credentials.has(id);
  }

  /**
   * Get credential health
   * @returns {object} Health information
   */
  getHealth() {
    const credentials = Array.from(this.credentials.values());
    const total = credentials.length;
    
    const expired = credentials.filter(c => {
      if (!c.metadata.expiresAt) return false;
      return new Date(c.metadata.expiresAt) < new Date();
    }).length;

    const expiringSoon = credentials.filter(c => {
      if (!c.metadata.expiresAt) return false;
      const expiresAt = new Date(c.metadata.expiresAt);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiresAt < thirtyDaysFromNow;
    }).length;

    const byType = {};
    credentials.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
    });

    return {
      total,
      healthy: total - expired - expiringSoon,
      expired,
      expiringSoon,
      byType
    };
  }

  /**
   * Encrypt data
   * @param {string} data - Data to encrypt
   * @returns {Promise<string>} Encrypted data
   */
  async encrypt(data) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      
      const key = await this.importKey(this.encryptionKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data
   * @returns {Promise<string>} Decrypted data
   */
  async decrypt(encryptedData) {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      const iv = combined.slice(0, 12);
      const encryptedBuffer = combined.slice(12);
      
      const key = await this.importKey(this.encryptionKey);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedBuffer
      );
      
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
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
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Get or create encryption key
   * @returns {Promise<string>} Encryption key
   */
  async getOrCreateEncryptionKey() {
    // Demo mode: use session-only in-memory key (never persisted)
    if (isDemoMode()) {
      if (!this.encryptionKey) {
        const keyData = crypto.getRandomValues(new Uint8Array(32));
        this.encryptionKey = btoa(String.fromCharCode(...keyData));
      }
      return this.encryptionKey;
    }

    // Production mode: use user password-derived key or stored key
    const keyStorageKey = 'cafeos_vault_key_production';
    
    if (this.userPassword) {
      // Derive key from user password using PBKDF2
      return await this.deriveKeyFromPassword(this.userPassword);
    }
    
    // Fallback to stored key (less secure, but maintains compatibility)
    let key = localStorage.getItem(keyStorageKey);
    
    if (!key) {
      const keyData = crypto.getRandomValues(new Uint8Array(32));
      key = btoa(String.fromCharCode(...keyData));
      localStorage.setItem(keyStorageKey, key);
    }
    
    return key;
  }

  /**
   * Derive encryption key from user password using PBKDF2
   * @param {string} password - User password
   * @returns {Promise<string>} Derived encryption key
   */
  async deriveKeyFromPassword(password) {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key using PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export the derived key
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    const keyArray = new Uint8Array(exportedKey);
    
    // Store salt with key for later derivation
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const keyBase64 = btoa(String.fromCharCode(...keyArray));
    const combined = `${saltBase64}:${keyBase64}`;
    
    return combined;
  }

  /**
   * Clear all demo credentials (called when switching to production)
   */
  clearDemoCredentials() {
    try {
      localStorage.removeItem('cafeos_credential_vault_demo');
      localStorage.removeItem('cafeos_vault_key_demo');
      this.credentials.clear();
      console.log('[CredentialVault] Demo credentials cleared');
    } catch (error) {
      console.error('[CredentialVault] Failed to clear demo credentials:', error);
    }
  }

  /**
   * Mask credential for display
   * @param {string} type - Credential type
   * @param {string} value - Credential value
   * @returns {string} Masked value
   */
  maskCredential(type, value) {
    if (!value) return '••••••••••••••••';
    
    const length = Math.min(value.length, 20);
    return '•'.repeat(length);
  }

  /**
   * Validate security configuration
   * @returns {object} Validation result
   */
  validate() {
    if (!this.encryptionKey) {
      return { valid: false, reason: 'Encryption key not available' };
    }

    if (this.credentials.size === 0) {
      return { valid: true, warnings: ['No credentials stored'] };
    }

    return { valid: true };
  }

  /**
   * Get security score
   * @returns {number} Security score (0-100)
   */
  getSecurityScore() {
    const health = this.getHealth();
    let score = 100;

    // Deduct for expired credentials
    score -= (health.expired * 20);
    
    // Deduct for expiring soon
    score -= (health.expiringSoon * 10);
    
    // Deduct if no encryption key
    if (!this.encryptionKey) {
      score -= 50;
    }

    return Math.max(0, score);
  }

  /**
   * Get security recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const health = this.getHealth();

    if (health.expired > 0) {
      recommendations.push({
        level: 'critical',
        message: `${health.expired} credential(s) have expired`,
        action: 'Rotate expired credentials immediately'
      });
    }

    if (health.expiringSoon > 0) {
      recommendations.push({
        level: 'warning',
        message: `${health.expiringSoon} credential(s) expire soon`,
        action: 'Schedule credential rotation'
      });
    }

    if (!this.encryptionKey) {
      recommendations.push({
        level: 'critical',
        message: 'Encryption key not available',
        action: 'Initialize encryption key'
      });
    }

    if (health.total === 0) {
      recommendations.push({
        level: 'info',
        message: 'No credentials stored',
        action: 'Add credentials for cloud providers'
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
        credentials: Array.from(this.credentials.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save credential vault state:', error);
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
        this.credentials = new Map(parsed.credentials || []);
      }
    } catch (error) {
      console.error('Failed to load credential vault state:', error);
      this.credentials = new Map();
    }
  }

  /**
   * Reset to defaults
   */
  async reset() {
    this.credentials.clear();
    this.encryptionKey = null;
    localStorage.removeItem('cafeos_vault_key');
    localStorage.removeItem(this.storageKey);
    this.status = SecurityStatus.UNKNOWN;
    return { success: true };
  }

  /**
   * Destroy the credential vault
   */
  async destroy() {
    await this.reset();
    console.log('[CredentialVault] Destroyed');
  }
}

// Singleton instance
let credentialVaultInstance = null;

/**
 * Get the singleton credential vault instance
 * @returns {CredentialVault} Credential vault instance
 */
export function getCredentialVault() {
  if (!credentialVaultInstance) {
    credentialVaultInstance = new CredentialVault();
  }
  return credentialVaultInstance;
}

export default CredentialVault;
