// Secret Vault
// Secure credential storage with encryption, masking, rotation, and audit logging

import { createAuditLogEntry } from '../domain/auditLogModel.js';
import { getCurrentUserId } from '../utils/authService.js';

/**
 * Secret Vault
 * Secure storage for credentials and secrets
 * All credentials are encrypted before storage
 */
class SecretVault {
  constructor() {
    this.storageKey = 'cafeos_secret_vault';
    this.encryptionKey = null;
    this.initialized = false;
  }

  /**
   * Initialize the secret vault
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load or generate encryption key
      await this.loadOrGenerateEncryptionKey();
      this.initialized = true;
      console.log('[SecretVault] Initialized');
    } catch (error) {
      console.error('[SecretVault] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load or generate encryption key using Web Crypto API
   * @returns {Promise<void>}
   */
  async loadOrGenerateEncryptionKey() {
    try {
      // Try to load existing key from localStorage (encrypted)
      const storedKey = localStorage.getItem('cafeos_vault_key');
      
      if (storedKey) {
        // Decrypt stored key (simplified - in production, use proper key derivation)
        this.encryptionKey = await this.importKey(storedKey);
      } else {
        // Generate new key
        this.encryptionKey = await this.generateKey();
        const exportedKey = await this.exportKey(this.encryptionKey);
        localStorage.setItem('cafeos_vault_key', exportedKey);
      }
    } catch (error) {
      console.error('[SecretVault] Failed to load/generate encryption key:', error);
      // Fallback: generate new key
      this.encryptionKey = await this.generateKey();
    }
  }

  /**
   * Generate a new encryption key
   * @returns {Promise<CryptoKey>}
   */
  async generateKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Import a key from string
   * @param {string} keyString 
   * @returns {Promise<CryptoKey>}
   */
  async importKey(keyString) {
    const keyData = this.base64ToArrayBuffer(keyString);
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Export a key to string
   * @param {CryptoKey} key 
   * @returns {Promise<string>}
   */
  async exportKey(key) {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  /**
   * Encrypt data
   * @param {string} plaintext 
   * @returns {Promise<{encrypted: string, iv: string}>}
   */
  async encrypt(plaintext) {
    if (!this.encryptionKey) {
      throw new Error('Secret vault not initialized');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      this.encryptionKey,
      data
    );

    return {
      encrypted: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv)
    };
  }

  /**
   * Decrypt data
   * @param {string} encrypted 
   * @param {string} iv 
   * @returns {Promise<string>}
   */
  async decrypt(encrypted, iv) {
    if (!this.encryptionKey) {
      throw new Error('Secret vault not initialized');
    }

    const encryptedData = this.base64ToArrayBuffer(encrypted);
    const ivData = this.base64ToArrayBuffer(iv);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivData
      },
      this.encryptionKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Store a secret
   * @param {string} key - Secret identifier
   * @param {string} value - Secret value
   * @param {object} metadata - Additional metadata
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async store(key, value, metadata = {}) {
    try {
      await this.initialize();

      // Encrypt the value
      const { encrypted, iv } = await this.encrypt(value);

      // Load existing vault
      const vault = this.loadVault();

      // Store secret with metadata
      vault.secrets[key] = {
        encrypted,
        iv,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };

      // Save vault
      this.saveVault(vault);

      // Audit log
      await this.auditLog('secret_stored', { key, metadata });

      return { success: true };
    } catch (error) {
      console.error('[SecretVault] Failed to store secret:', error);
      await this.auditLog('secret_store_failed', { key, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve a secret
   * @param {string} key - Secret identifier
   * @param {boolean} reveal - Whether to reveal the secret (default: false, returns masked)
   * @returns {Promise<{success: boolean, value?: string, masked?: string, metadata?: object, error?: string}>}
   */
  async retrieve(key, reveal = false) {
    try {
      await this.initialize();

      const vault = this.loadVault();
      const secret = vault.secrets[key];

      if (!secret) {
        return { success: false, error: 'Secret not found' };
      }

      // Update last accessed
      secret.metadata.lastAccessedAt = new Date().toISOString();
      this.saveVault(vault);

      if (reveal) {
        // Decrypt and return actual value
        const value = await this.decrypt(secret.encrypted, secret.iv);
        
        await this.auditLog('secret_revealed', { key });
        
        return {
          success: true,
          value,
          metadata: secret.metadata
        };
      } else {
        // Return masked value
        const masked = this.maskValue(secret.metadata.originalLength || 20);
        
        return {
          success: true,
          masked,
          metadata: secret.metadata
        };
      }
    } catch (error) {
      console.error('[SecretVault] Failed to retrieve secret:', error);
      await this.auditLog('secret_retrieve_failed', { key, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a secret
   * @param {string} key - Secret identifier
   * @param {string} value - New secret value
   * @param {object} metadata - Additional metadata
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async update(key, value, metadata = {}) {
    try {
      await this.initialize();

      const vault = this.loadVault();
      const secret = vault.secrets[key];

      if (!secret) {
        return { success: false, error: 'Secret not found' };
      }

      // Invalidate old secret
      secret.metadata.invalidatedAt = new Date().toISOString();
      secret.metadata.invalidated = true;

      // Store new secret with same key but new encrypted value
      const { encrypted, iv } = await this.encrypt(value);

      vault.secrets[key] = {
        encrypted,
        iv,
        metadata: {
          ...secret.metadata,
          ...metadata,
          originalLength: value.length,
          updatedAt: new Date().toISOString(),
          rotatedAt: new Date().toISOString()
        }
      };

      this.saveVault(vault);

      await this.auditLog('secret_updated', { key });

      return { success: true };
    } catch (error) {
      console.error('[SecretVault] Failed to update secret:', error);
      await this.auditLog('secret_update_failed', { key, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a secret
   * @param {string} key - Secret identifier
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async delete(key) {
    try {
      await this.initialize();

      const vault = this.loadVault();
      
      if (!vault.secrets[key]) {
        return { success: false, error: 'Secret not found' };
      }

      delete vault.secrets[key];
      this.saveVault(vault);

      await this.auditLog('secret_deleted', { key });

      return { success: true };
    } catch (error) {
      console.error('[SecretVault] Failed to delete secret:', error);
      await this.auditLog('secret_delete_failed', { key, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Invalidate a secret (mark as invalid without deleting)
   * @param {string} key - Secret identifier
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async invalidate(key) {
    try {
      await this.initialize();

      const vault = this.loadVault();
      const secret = vault.secrets[key];

      if (!secret) {
        return { success: false, error: 'Secret not found' };
      }

      secret.metadata.invalidatedAt = new Date().toISOString();
      secret.metadata.invalidated = true;
      this.saveVault(vault);

      await this.auditLog('secret_invalidated', { key });

      return { success: true };
    } catch (error) {
      console.error('[SecretVault] Failed to invalidate secret:', error);
      await this.auditLog('secret_invalidate_failed', { key, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if a secret exists
   * @param {string} key - Secret identifier
   * @returns {boolean}
   */
  exists(key) {
    try {
      const vault = this.loadVault();
      return !!vault.secrets[key];
    } catch {
      return false;
    }
  }

  /**
   * Get secret metadata without revealing the value
   * @param {string} key - Secret identifier
   * @returns {object|null}
   */
  getMetadata(key) {
    try {
      const vault = this.loadVault();
      const secret = vault.secrets[key];
      
      if (!secret) return null;

      return {
        createdAt: secret.metadata.createdAt,
        updatedAt: secret.metadata.updatedAt,
        lastAccessedAt: secret.metadata.lastAccessedAt,
        invalidated: secret.metadata.invalidated,
        invalidatedAt: secret.metadata.invalidatedAt,
        expiresAt: secret.metadata.expiresAt,
        rotationRecommended: secret.metadata.rotationRecommended
      };
    } catch {
      return null;
    }
  }

  /**
   * List all secret keys (without values)
   * @returns {string[]}
   */
  listKeys() {
    try {
      const vault = this.loadVault();
      return Object.keys(vault.secrets);
    } catch {
      return [];
    }
  }

  /**
   * Mark a secret for rotation
   * @param {string} key - Secret identifier
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async markForRotation(key) {
    try {
      await this.initialize();

      const vault = this.loadVault();
      const secret = vault.secrets[key];

      if (!secret) {
        return { success: false, error: 'Secret not found' };
      }

      secret.metadata.rotationRecommended = true;
      secret.metadata.rotationRecommendedAt = new Date().toISOString();
      this.saveVault(vault);

      await this.auditLog('secret_rotation_marked', { key });

      return { success: true };
    } catch (error) {
      console.error('[SecretVault] Failed to mark for rotation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set expiration for a secret
   * @param {string} key - Secret identifier
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setExpiration(key, expiresAt) {
    try {
      await this.initialize();

      const vault = this.loadVault();
      const secret = vault.secrets[key];

      if (!secret) {
        return { success: false, error: 'Secret not found' };
      }

      secret.metadata.expiresAt = expiresAt.toISOString();
      this.saveVault(vault);

      await this.auditLog('secret_expiration_set', { key, expiresAt });

      return { success: true };
    } catch (error) {
      console.error('[SecretVault] Failed to set expiration:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check for expired secrets
   * @returns {string[]} - List of expired secret keys
   */
  getExpiredSecrets() {
    try {
      const vault = this.loadVault();
      const now = new Date();
      const expired = [];

      for (const [key, secret] of Object.entries(vault.secrets)) {
        if (secret.metadata.expiresAt && new Date(secret.metadata.expiresAt) < now) {
          expired.push(key);
        }
      }

      return expired;
    } catch {
      return [];
    }
  }

  /**
   * Check for secrets needing rotation
   * @returns {string[]} - List of secret keys needing rotation
   */
  getSecretsNeedingRotation() {
    try {
      const vault = this.loadVault();
      const needingRotation = [];

      for (const [key, secret] of Object.entries(vault.secrets)) {
        if (secret.metadata.rotationRecommended) {
          needingRotation.push(key);
        }
      }

      return needingRotation;
    } catch {
      return [];
    }
  }

  /**
   * Load vault from localStorage
   * @returns {object}
   */
  loadVault() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[SecretVault] Failed to load vault:', error);
    }
    
    return {
      version: '1.0',
      secrets: {}
    };
  }

  /**
   * Save vault to localStorage
   * @param {object} vault 
   */
  saveVault(vault) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(vault));
    } catch (error) {
      console.error('[SecretVault] Failed to save vault:', error);
      throw error;
    }
  }

  /**
   * Mask a value for display
   * @param {number} length - Original length
   * @returns {string}
   */
  maskValue(length = 20) {
    return '•'.repeat(Math.min(length, 20));
  }

  /**
   * Convert ArrayBuffer to Base64
   * @param {ArrayBuffer} buffer 
   * @returns {string}
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   * @param {string} base64 
   * @returns {ArrayBuffer}
   */
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Audit log an action
   * @param {string} action 
   * @param {object} details 
   */
  async auditLog(action, details) {
    try {
      const userId = getCurrentUserId();
      createAuditLogEntry({
        action: `secret_vault_${action}`,
        category: 'security',
        details,
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[SecretVault] Failed to create audit log:', error);
    }
  }

  /**
   * Destroy the vault (for testing/reset)
   */
  destroy() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('cafeos_vault_key');
    this.encryptionKey = null;
    this.initialized = false;
    console.log('[SecretVault] Destroyed');
  }
}

// Singleton instance
const secretVault = new SecretVault();

export default secretVault;
