// Health Registry
// Central registry for all health check providers and components

import { _ComponentCategory, HealthCheckConfig } from './HealthTypes.js';

/**
 * Health Registry - Manages registration of all health check providers
 */
class HealthRegistry {
  constructor() {
    this.providers = new Map(); // componentId -> HealthCheckProvider
    this.configs = new Map(); // componentId -> HealthCheckConfig
    this.categories = new Map(); // category -> Set of componentIds
  }

  /**
   * Register a health check provider
   * @param {string} componentId - Unique component identifier
   * @param {string} componentName - Human-readable component name
   * @param {string} category - Component category
   * @param {HealthCheckProvider} provider - Health check provider instance
   * @param {HealthCheckConfig} config - Health check configuration
   */
  register(componentId, componentName, category, provider, config = new HealthCheckConfig()) {
    if (this.providers.has(componentId)) {
      console.warn(`[HealthRegistry] Component ${componentId} already registered, overwriting`);
    }

    this.providers.set(componentId, {
      provider,
      componentName,
      category
    });

    this.configs.set(componentId, config);

    // Add to category
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category).add(componentId);

    console.log(`[HealthRegistry] Registered component: ${componentId} (${componentName})`);
  }

  /**
   * Unregister a health check provider
   * @param {string} componentId - Component identifier
   */
  unregister(componentId) {
    const component = this.providers.get(componentId);
    if (!component) {
      console.warn(`[HealthRegistry] Component ${componentId} not registered`);
      return;
    }

    // Remove from category
    this.categories.get(component.category)?.delete(componentId);

    this.providers.delete(componentId);
    this.configs.delete(componentId);

    console.log(`[HealthRegistry] Unregistered component: ${componentId}`);
  }

  /**
   * Get a health check provider
   * @param {string} componentId - Component identifier
   * @returns {HealthCheckProvider|null}
   */
  getProvider(componentId) {
    const component = this.providers.get(componentId);
    return component?.provider || null;
  }

  /**
   * Get component info
   * @param {string} componentId - Component identifier
   * @returns {Object|null}
   */
  getComponentInfo(componentId) {
    const component = this.providers.get(componentId);
    if (!component) return null;

    return {
      componentId,
      componentName: component.componentName,
      category: component.category,
      config: this.configs.get(componentId)
    };
  }

  /**
   * Get all registered component IDs
   * @returns {string[]}
   */
  getAllComponentIds() {
    return Array.from(this.providers.keys());
  }

  /**
   * Get components by category
   * @param {string} category - Component category
   * @returns {string[]}
   */
  getComponentsByCategory(category) {
    return Array.from(this.categories.get(category) || []);
  }

  /**
   * Get all categories
   * @returns {string[]}
   */
  getAllCategories() {
    return Array.from(this.categories.keys());
  }

  /**
   * Update health check configuration
   * @param {string} componentId - Component identifier
   * @param {HealthCheckConfig} config - New configuration
   */
  updateConfig(componentId, config) {
    if (!this.providers.has(componentId)) {
      console.warn(`[HealthRegistry] Component ${componentId} not registered`);
      return;
    }

    this.configs.set(componentId, config);
    console.log(`[HealthRegistry] Updated config for: ${componentId}`);
  }

  /**
   * Get health check configuration
   * @param {string} componentId - Component identifier
   * @returns {HealthCheckConfig|null}
   */
  getConfig(componentId) {
    return this.configs.get(componentId) || null;
  }

  /**
   * Check if a component is registered
   * @param {string} componentId - Component identifier
   * @returns {boolean}
   */
  isRegistered(componentId) {
    return this.providers.has(componentId);
  }

  /**
   * Get the total number of registered components
   * @returns {number}
   */
  getComponentCount() {
    return this.providers.size;
  }

  /**
   * Clear all registrations (useful for testing)
   */
  clear() {
    this.providers.clear();
    this.configs.clear();
    this.categories.clear();
    console.log('[HealthRegistry] Cleared all registrations');
  }
}

// Singleton instance
const healthRegistry = new HealthRegistry();

export default healthRegistry;
export { HealthRegistry };
