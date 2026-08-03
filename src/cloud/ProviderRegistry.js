// Provider Registry for Cloud Storage Platform
// Manages all available storage providers and their lifecycle

import credentialManager from '../security/CredentialManager.js';
import { createAuditLogEntry } from '../domain/auditLogModel.js';
import { getCurrentUserId } from '../utils/authService.js';

/**
 * Provider Registry
 * Central registry for all storage providers
 * Handles provider registration, retrieval, and lifecycle management
 * All credentials are managed through CredentialManager (Secret Vault)
 */
class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.activeProviderId = null;
    this.initialized = false;
  }

  /**
   * Initialize registry with default providers
   */
  async initialize() {
    if (this.initialized) return;

    // Initialize credential manager
    await credentialManager.initialize();

    // Register built-in providers
    // These will be loaded dynamically to avoid unnecessary SDK loading
    this.initialized = true;
  }

  /**
   * Register a storage provider
   * @param {string} providerId 
   * @param {StorageProviderInterface} providerInstance 
   */
  registerProvider(providerId, providerInstance) {
    // Relaxed check to allow BaseProvider or StorageProviderInterface
    if (!providerInstance) {
      throw new Error('Provider instance is required');
    }
    this.providers.set(providerId, providerInstance);
  }

  /**
   * Unregister a storage provider
   * @param {string} providerId 
   */
  unregisterProvider(providerId) {
    this.providers.delete(providerId);
  }

  /**
   * Get a provider instance
   * @param {string} providerId 
   * @returns {StorageProviderInterface|null}
   */
  getProvider(providerId) {
    return this.providers.get(providerId) || null;
  }

  /**
   * Get all registered providers
   * @returns {Array<{id: string, instance: StorageProviderInterface}>}
   */
  getAllProviders() {
    return Array.from(this.providers.entries()).map(([id, instance]) => ({
      id,
      instance,
      info: instance.getProviderInfo()
    }));
  }

  /**
   * Get active provider
   * @returns {StorageProviderInterface|null}
   */
  getActiveProvider() {
    if (!this.activeProviderId) return null;
    return this.getProvider(this.activeProviderId);
  }

  /**
   * Set active provider
   * @param {string} providerId 
   * @param {string} userId - For verification
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setActiveProvider(providerId, userId) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    // Verify provider is connected
    if (!provider.connected) {
      return { success: false, error: 'Provider not connected' };
    }

    // Perform health check
    const health = await provider.healthCheck();
    if (health.healthy === false || health.diagnostics?.healthy === false) {
      return { success: false, error: 'Provider health check failed' };
    }

    this.activeProviderId = providerId;

    // Audit log
    await this.auditLog('provider_activated', { providerId, userId });

    return { success: true };
  }

  /**
   * Clear active provider
   * @param {string} userId - For verification
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async clearActiveProvider(userId) {
    const previousProviderId = this.activeProviderId;
    this.activeProviderId = null;

    // Audit log
    await this.auditLog('provider_deactivated', { previousProviderId, userId });

    return { success: true };
  }

  /**
   * Get provider metadata
   * @param {string} providerId 
   * @returns {object|null}
   */
  getProviderMetadata(providerId) {
    const provider = this.getProvider(providerId);
    if (!provider) return null;
    return provider.getProviderInfo();
  }

  /**
   * Check if provider is registered
   * @param {string} providerId 
   * @returns {boolean}
   */
  hasProvider(providerId) {
    return this.providers.has(providerId);
  }

  /**
   * Get provider count
   * @returns {number}
   */
  getProviderCount() {
    return this.providers.size;
  }

  /**
   * Configure a provider with credentials (through CredentialManager)
   * @param {string} providerId 
   * @param {object} credentials 
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async configureProvider(providerId, credentials, userId) {
    try {
      const provider = this.getProvider(providerId);
      if (!provider) {
        return { success: false, error: 'Provider not found' };
      }

      // Store credentials through CredentialManager
      const result = await credentialManager.storeCredentials(providerId, credentials, userId);
      if (!result.success) {
        return result;
      }

      // Load credentials and connect provider
      const loadedCredentials = await credentialManager.retrieveCredentials(providerId, true, userId);
      if (loadedCredentials.success) {
        await provider.saveCredentials(loadedCredentials.credentials);
        await provider.connect();
      }

      await this.auditLog('provider_configured', { providerId, userId });

      return { success: true };
    } catch (error) {
      console.error('[ProviderRegistry] Failed to configure provider:', error);
      await this.auditLog('provider_configure_failed', { providerId, userId, error: error.message });
      return { success: false, error: error.message };
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
        action: `provider_registry_${action}`,
        category: 'security',
        details,
        userId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[ProviderRegistry] Failed to create audit log:', error);
    }
  }
}

// Singleton instance
const registry = new ProviderRegistry();

export default registry;
