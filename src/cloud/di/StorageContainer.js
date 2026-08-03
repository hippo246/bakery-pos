// Dependency Injection Container for Storage
// Allows providers and services to be injected and swapped

/**
 * Storage Container
 * Dependency injection container for storage components
 */
class StorageContainer {
  constructor() {
    this.services = new Map();
    this.providers = new Map();
    this.factories = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service
   * @param {string} name 
   * @param {object|Function} implementation 
   * @param {boolean} singleton 
   */
  register(name, implementation, singleton = true) {
    if (singleton) {
      this.singletons.set(name, implementation);
    } else {
      this.services.set(name, implementation);
    }
  }

  /**
   * Register a factory function
   * @param {string} name 
   * @param {Function} factory 
   */
  registerFactory(name, factory) {
    this.factories.set(name, factory);
  }

  /**
   * Register a provider
   * @param {string} providerId 
   * @param {object} provider 
   */
  registerProvider(providerId, provider) {
    this.providers.set(providerId, provider);
  }

  /**
   * Get a service
   * @param {string} name 
   * @returns {object}
   */
  get(name) {
    // Check singletons first
    if (this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Check factories
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      const instance = factory(this);
      this.singletons.set(name, instance);
      return instance;
    }

    // Check services
    if (this.services.has(name)) {
      const service = this.services.get(name);
      if (typeof service === 'function') {
        return service(this);
      }
      return service;
    }

    throw new Error(`Service not found: ${name}`);
  }

  /**
   * Get a provider
   * @param {string} providerId 
   * @returns {object}
   */
  getProvider(providerId) {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider not found: ${providerId}`);
    }
    return this.providers.get(providerId);
  }

  /**
   * Check if service exists
   * @param {string} name 
   * @returns {boolean}
   */
  has(name) {
    return this.singletons.has(name) || 
           this.services.has(name) || 
           this.factories.has(name);
  }

  /**
   * Check if provider exists
   * @param {string} providerId 
   * @returns {boolean}
   */
  hasProvider(providerId) {
    return this.providers.has(providerId);
  }

  /**
   * Remove a service
   * @param {string} name 
   */
  remove(name) {
    this.singletons.delete(name);
    this.services.delete(name);
    this.factories.delete(name);
  }

  /**
   * Remove a provider
   * @param {string} providerId 
   */
  removeProvider(providerId) {
    this.providers.delete(providerId);
  }

  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
    this.providers.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service names
   * @returns {Array<string>}
   */
  getServiceNames() {
    return [
      ...Array.from(this.singletons.keys()),
      ...Array.from(this.services.keys()),
      ...Array.from(this.factories.keys())
    ];
  }

  /**
   * Get all registered provider IDs
   * @returns {Array<string>}
   */
  getProviderIds() {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
const storageContainer = new StorageContainer();

export default storageContainer;
