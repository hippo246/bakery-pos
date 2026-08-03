// Credential Manager
// High-level credential management using Secret Vault

import secretVault from './SecretVault.js';
import { createAuditLogEntry } from '../domain/auditLogModel.js';
import { getCurrentUserId } from '../utils/authService.js';
import { verifyOwnerPassword } from '../utils/setupSecurity.js';

/**
 * Credential Manager
 * Manages credentials for cloud providers and services
 * All credentials are stored encrypted in Secret Vault
 */
class CredentialManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the credential manager
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await secretVault.initialize();
      this.initialized = true;
      console.log('[CredentialManager] Initialized');
    } catch (error) {
      console.error('[CredentialManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store provider credentials
   * @param {string} providerId - Provider identifier (e.g., 'aws-s3', 'firebase-storage')
   * @param {object} credentials - Credential object
   * @param {string} userId - User performing the action
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async storeCredentials(providerId, credentials, userId) {
    try {
      await this.initialize();

      // Validate credentials
      const validation = this.validateCredentials(providerId, credentials);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Store each credential field in secret vault
      const sensitiveFields = this.getSensitiveFields(providerId);
      
      for (const field of sensitiveFields) {
        if (credentials[field]) {
          const key = this.getSecretKey(providerId, field);
          const result = await secretVault.store(key, credentials[field], {
            providerId,
            field,
            userId,
            originalLength: credentials[field].length
          });

          if (!result.success) {
            return result;
          }
        }
      }

      // Store non-sensitive metadata separately
      const metadataKey = this.getMetadataKey(providerId);
      const metadata = this.extractMetadata(credentials);
      await this.storeMetadata(metadataKey, metadata);

      await this.auditLog('credentials_stored', { providerId, userId });

      return { success: true };
    } catch (error) {
      console.error('[CredentialManager] Failed to store credentials:', error);
      await this.auditLog('credentials_store_failed', { providerId, userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve provider credentials (masked by default)
   * @param {string} providerId - Provider identifier
   * @param {boolean} reveal - Whether to reveal actual values (requires owner verification)
   * @param {string} userId - User requesting credentials
   * @returns {Promise<{success: boolean, credentials?: object, masked?: object, error?: string}>}
   */
  async retrieveCredentials(providerId, reveal = false, userId, password = '') {
    try {
      await this.initialize();

      // If reveal requested, verify owner
      if (reveal) {
        const isOwner = await verifyOwnerPassword(password);
        if (!isOwner) {
          await this.auditLog('credentials_reveal_denied', { providerId, userId, reason: 'not_owner' });
          return { success: false, error: 'Owner verification required to reveal credentials' };
        }
      }

      const sensitiveFields = this.getSensitiveFields(providerId);
      const credentials = {};
      const masked = {};

      for (const field of sensitiveFields) {
        const key = this.getSecretKey(providerId, field);
        const result = await secretVault.retrieve(key, reveal);

        if (result.success) {
          if (reveal) {
            credentials[field] = result.value;
          } else {
            masked[field] = result.masked;
          }
        }
      }

      // Add metadata
      const metadataKey = this.getMetadataKey(providerId);
      const metadata = await this.retrieveMetadata(metadataKey);
      
      if (reveal) {
        Object.assign(credentials, metadata);
      } else {
        Object.assign(masked, metadata);
      }

      await this.auditLog('credentials_retrieved', { providerId, userId, revealed: reveal });

      return {
        success: true,
        [reveal ? 'credentials' : 'masked']: reveal ? credentials : masked
      };
    } catch (error) {
      console.error('[CredentialManager] Failed to retrieve credentials:', error);
      await this.auditLog('credentials_retrieve_failed', { providerId, userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Update provider credentials
   * @param {string} providerId - Provider identifier
   * @param {object} credentials - New credential object
   * @param {string} userId - User performing the action
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async updateCredentials(providerId, credentials, userId, password = '') {
    try {
      await this.initialize();

      // Verify owner for credential updates
      const isOwner = await verifyOwnerPassword(password);
      if (!isOwner) {
        await this.auditLog('credentials_update_denied', { providerId, userId, reason: 'not_owner' });
        return { success: false, error: 'Owner verification required to update credentials' };
      }

      // Validate credentials
      const validation = this.validateCredentials(providerId, credentials);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Update each credential field
      const sensitiveFields = this.getSensitiveFields(providerId);
      
      for (const field of sensitiveFields) {
        if (credentials[field]) {
          const key = this.getSecretKey(providerId, field);
          const result = await secretVault.update(key, credentials[field], {
            providerId,
            field,
            userId,
            originalLength: credentials[field].length
          });

          if (!result.success) {
            return result;
          }
        }
      }

      // Update metadata
      const metadataKey = this.getMetadataKey(providerId);
      const metadata = this.extractMetadata(credentials);
      await this.storeMetadata(metadataKey, metadata);

      await this.auditLog('credentials_updated', { providerId, userId });

      return { success: true };
    } catch (error) {
      console.error('[CredentialManager] Failed to update credentials:', error);
      await this.auditLog('credentials_update_failed', { providerId, userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete provider credentials
   * @param {string} providerId - Provider identifier
   * @param {string} userId - User performing the action
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteCredentials(providerId, userId, password = '') {
    try {
      await this.initialize();

      // Verify owner for credential deletion
      const isOwner = await verifyOwnerPassword(password);
      if (!isOwner) {
        await this.auditLog('credentials_delete_denied', { providerId, userId, reason: 'not_owner' });
        return { success: false, error: 'Owner verification required to delete credentials' };
      }

      // Delete all credential fields
      const sensitiveFields = this.getSensitiveFields(providerId);
      
      for (const field of sensitiveFields) {
        const key = this.getSecretKey(providerId, field);
        await secretVault.delete(key);
      }

      // Delete metadata
      const metadataKey = this.getMetadataKey(providerId);
      await this.deleteMetadata(metadataKey);

      await this.auditLog('credentials_deleted', { providerId, userId });

      return { success: true };
    } catch (error) {
      console.error('[CredentialManager] Failed to delete credentials:', error);
      await this.auditLog('credentials_delete_failed', { providerId, userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Rotate credentials (invalidate old, store new)
   * @param {string} providerId - Provider identifier
   * @param {object} newCredentials - New credential object
   * @param {string} userId - User performing the action
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rotateCredentials(providerId, newCredentials, userId, password = '') {
    try {
      await this.initialize();

      // Verify owner for credential rotation
      const isOwner = await verifyOwnerPassword(password);
      if (!isOwner) {
        await this.auditLog('credentials_rotate_denied', { providerId, userId, reason: 'not_owner' });
        return { success: false, error: 'Owner verification required to rotate credentials' };
      }

      // Validate new credentials
      const validation = this.validateCredentials(providerId, newCredentials);
      if (!validation.valid) {
        return { success: false, error: validation.errors.join(', ') };
      }

      // Invalidate old credentials
      const sensitiveFields = this.getSensitiveFields(providerId);
      
      for (const field of sensitiveFields) {
        const key = this.getSecretKey(providerId, field);
        await secretVault.invalidate(key);
      }

      // Store new credentials
      const result = await this.storeCredentials(providerId, newCredentials, userId);
      
      if (result.success) {
        await this.auditLog('credentials_rotated', { providerId, userId });
      }

      return result;
    } catch (error) {
      console.error('[CredentialManager] Failed to rotate credentials:', error);
      await this.auditLog('credentials_rotate_failed', { providerId, userId, error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if credentials exist for a provider
   * @param {string} providerId - Provider identifier
   * @returns {boolean}
   */
  hasCredentials(providerId) {
    const key = this.getSecretKey(providerId, this.getSensitiveFields(providerId)[0]);
    return secretVault.exists(key);
  }

  /**
   * Get credential metadata
   * @param {string} providerId - Provider identifier
   * @returns {object|null}
   */
  getCredentialMetadata(providerId) {
    const key = this.getSecretKey(providerId, this.getSensitiveFields(providerId)[0]);
    return secretVault.getMetadata(key);
  }

  /**
   * List all providers with stored credentials
   * @returns {string[]}
   */
  listProvidersWithCredentials() {
    const allKeys = secretVault.listKeys();
    const providers = new Set();

    for (const key of allKeys) {
      const match = key.match(/^credential_([^_]+)_/);
      if (match) {
        providers.add(match[1]);
      }
    }

    return Array.from(providers);
  }

  /**
   * Get secret key for a provider field
   * @param {string} providerId 
   * @param {string} field 
   * @returns {string}
   */
  getSecretKey(providerId, field) {
    return `credential_${providerId}_${field}`;
  }

  /**
   * Get metadata key for a provider
   * @param {string} providerId 
   * @returns {string}
   */
  getMetadataKey(providerId) {
    return `credential_metadata_${providerId}`;
  }

  /**
   * Get sensitive fields for a provider
   * @param {string} providerId 
   * @returns {string[]}
   */
  getSensitiveFields(providerId) {
    const fieldMap = {
      'aws-s3': ['accessKey', 'secretKey'],
      'cloudflare-r2': ['accessKey', 'secretKey'],
      'minio': ['accessKey', 'secretKey'],
      'digitalocean-spaces': ['accessKey', 'secretKey'],
      'backblaze-b2': ['accessKey', 'secretKey'],
      'firebase-storage': ['apiKey'],
      'google-cloud-storage': ['apiKey', 'serviceAccountKey'],
      'azure-blob': ['accountName', 'accountKey']
    };

    return fieldMap[providerId] || [];
  }

  /**
   * Validate credentials for a provider
   * @param {string} providerId 
   * @param {object} credentials 
   * @returns {object}
   */
  validateCredentials(providerId, credentials) {
    const errors = [];
    const sensitiveFields = this.getSensitiveFields(providerId);

    for (const field of sensitiveFields) {
      if (!credentials[field]) {
        errors.push(`${field} is required`);
      } else if (field.includes('Key') && credentials[field].length < 16) {
        errors.push(`${field} must be at least 16 characters`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract non-sensitive metadata from credentials
   * @param {object} credentials 
   * @returns {object}
   */
  extractMetadata(credentials) {
    const sensitiveFields = ['accessKey', 'secretKey', 'apiKey', 'serviceAccountKey', 'accountKey'];
    const metadata = {};

    for (const [key, value] of Object.entries(credentials)) {
      if (!sensitiveFields.includes(key)) {
        metadata[key] = value;
      }
    }

    return metadata;
  }

  /**
   * Store metadata
   * @param {string} key 
   * @param {object} metadata 
   */
  async storeMetadata(key, metadata) {
    try {
      const metadataStr = JSON.stringify(metadata);
      await secretVault.store(key, metadataStr, { isMetadata: true });
    } catch (error) {
      console.error('[CredentialManager] Failed to store metadata:', error);
    }
  }

  /**
   * Retrieve metadata
   * @param {string} key 
   * @returns {object}
   */
  async retrieveMetadata(key) {
    try {
      const result = await secretVault.retrieve(key, true);
      if (result.success && result.value) {
        return JSON.parse(result.value);
      }
    } catch (error) {
      console.error('[CredentialManager] Failed to retrieve metadata:', error);
    }
    return {};
  }

  /**
   * Delete metadata
   * @param {string} key 
   */
  async deleteMetadata(key) {
    try {
      await secretVault.delete(key);
    } catch (error) {
      console.error('[CredentialManager] Failed to delete metadata:', error);
    }
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
        action: `credential_${action}`,
        category: 'security',
        details,
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[CredentialManager] Failed to create audit log:', error);
    }
  }

  /**
   * Destroy the credential manager (for testing/reset)
   */
  destroy() {
    secretVault.destroy();
    this.initialized = false;
    console.log('[CredentialManager] Destroyed');
  }
}

// Singleton instance
const credentialManager = new CredentialManager();

export default credentialManager;
