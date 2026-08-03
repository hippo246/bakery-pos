// Provider Manager Service
// Manages provider lifecycle and configuration

import registry from '../ProviderRegistry.js';

/**
 * Provider Manager
 * Service for managing provider lifecycle
 */
class ProviderManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize provider manager
   */
  async initialize() {
    if (this.initialized) return;
    await registry.initialize();
    this.initialized = true;
  }

  /**
   * Register a provider
   * @param {string} providerId 
   * @param {object} providerInstance 
   * @returns {{success: boolean, error?: string}}
   */
  registerProvider(providerId, providerInstance) {
    try {
      registry.registerProvider(providerId, providerInstance);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Unregister a provider
   * @param {string} providerId 
   * @returns {{success: boolean, error?: string}}
   */
  unregisterProvider(providerId) {
    try {
      registry.unregisterProvider(providerId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get provider
   * @param {string} providerId 
   * @returns {object|null}
   */
  getProvider(providerId) {
    return registry.getProvider(providerId);
  }

  /**
   * Get all providers
   * @returns {Array}
   */
  getAllProviders() {
    return registry.getAllProviders();
  }

  /**
   * Get active provider
   * @returns {object|null}
   */
  getActiveProvider() {
    return registry.getActiveProvider();
  }

  /**
   * Set active provider
   * @param {string} providerId 
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async setActiveProvider(providerId, userId) {
    try {
      await this.initialize();
      const result = await registry.setActiveProvider(providerId, userId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear active provider
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async clearActiveProvider(userId) {
    try {
      await this.initialize();
      const result = await registry.clearActiveProvider(userId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get provider info
   * @param {string} providerId 
   * @returns {object|null}
   */
  getProviderInfo(providerId) {
    const provider = this.getProvider(providerId);
    if (!provider) return null;
    return provider.getProviderInfo();
  }

  /**
   * Get provider capabilities
   * @param {string} providerId 
   * @returns {object|null}
   */
  getProviderCapabilities(providerId) {
    const provider = this.getProvider(providerId);
    if (!provider) return null;
    return provider.capabilities;
  }

  /**
   * Get all providers info
   * @returns {Array}
   */
  getAllProvidersInfo() {
    return this.getAllProviders().map(({ id, info }) => ({
      id,
      ...info
    }));
  }
}

// Singleton instance
const providerManager = new ProviderManager();

export default providerManager;
