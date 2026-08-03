// Sync Policy Manager
// Manages sync filters and policies

import { SyncFilter, SyncPriority, SyncModule } from './SyncTypes.js';

export class SyncPolicyManager {
  constructor() {
    this.policies = new Map();
    this.modulePolicies = new Map();
    this.storageKey = 'cafeos_sync_policies';
    this.loadState();
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default policies
   */
  initializeDefaultPolicies() {
    // Default global policy
    if (!this.policies.has('default')) {
      this.setPolicy('default', {
        filter: SyncFilter.SYNC_IMMEDIATELY,
        priority: SyncPriority.NORMAL,
        compressionEnabled: true,
        verifyAfterTransfer: true,
        maxRetries: 5,
        backgroundSync: true
      });
    }

    // Default module policies
    const criticalModules = [SyncModule.ORDERS, SyncModule.PAYMENTS, SyncModule.INVENTORY];
    criticalModules.forEach(module => {
      if (!this.modulePolicies.has(module)) {
        this.setModulePolicy(module, {
          filter: SyncFilter.SYNC_IMMEDIATELY,
          priority: SyncPriority.HIGH,
          compressionEnabled: true,
          verifyAfterTransfer: true,
          maxRetries: 5,
          backgroundSync: true
        });
      }
    });
  }

  /**
   * Set a global policy
   * @param {string} policyId - Policy ID
   * @param {object} policy - Policy configuration
   */
  setPolicy(policyId, policy) {
    this.policies.set(policyId, {
      ...policy,
      updatedAt: new Date().toISOString()
    });
    this.saveState();
  }

  /**
   * Get a global policy
   * @param {string} policyId - Policy ID
   * @returns {object|null} Policy configuration
   */
  getPolicy(policyId) {
    return this.policies.get(policyId) || null;
  }

  /**
   * Set a module-specific policy
   * @param {string} module - Module name
   * @param {object} policy - Policy configuration
   */
  setModulePolicy(module, policy) {
    this.modulePolicies.set(module, {
      ...policy,
      updatedAt: new Date().toISOString()
    });
    this.saveState();
  }

  /**
   * Get a module-specific policy
   * @param {string} module - Module name
   * @returns {object|null} Policy configuration
   */
  getModulePolicy(module) {
    return this.modulePolicies.get(module) || null;
  }

  /**
   * Get effective policy for a module
   * @param {string} module - Module name
   * @returns {object} Effective policy
   */
  getEffectivePolicy(module) {
    // Check for module-specific policy first
    const modulePolicy = this.modulePolicies.get(module);
    if (modulePolicy) {
      return modulePolicy;
    }

    // Fall back to default policy
    const defaultPolicy = this.policies.get('default');
    return defaultPolicy || {};
  }

  /**
   * Check if sync is allowed for a module
   * @param {string} module - Module name
   * @param {object} networkInfo - Network information
   * @returns {object} Allow result
   */
  isSyncAllowed(module, networkInfo = {}) {
    const policy = this.getEffectivePolicy(module);

    // Check filter
    switch (policy.filter) {
      case SyncFilter.WIFI_ONLY:
        if (!this.isOnWifi(networkInfo)) {
          return { allowed: false, reason: 'WiFi only mode' };
        }
        break;

      case SyncFilter.METERED_NETWORKS:
        if (networkInfo.saveData) {
          return { allowed: false, reason: 'Metered network' };
        }
        break;

      case SyncFilter.MANUAL_SYNC:
        return { allowed: false, reason: 'Manual sync only' };

      case SyncFilter.BACKGROUND_ONLY:
        // This is handled by the sync manager
        break;
    }

    // Check network quality
    const qualityScore = networkInfo.qualityScore || 100;
    if (qualityScore < 30 && policy.priority !== SyncPriority.URGENT) {
      return { allowed: false, reason: 'Poor network quality' };
    }

    return { allowed: true, policy };
  }

  /**
   * Check if on WiFi
   * @param {object} networkInfo - Network information
   * @returns {boolean} WiFi status
   */
  isOnWifi(networkInfo) {
    return networkInfo.connectionType === 'wifi';
  }

  /**
   * Get sync priority for a module
   * @param {string} module - Module name
   * @returns {string} Priority
   */
  getPriority(module) {
    const policy = this.getEffectivePolicy(module);
    return policy.priority || SyncPriority.NORMAL;
  }

  /**
   * Get all policies
   * @returns {object} All policies
   */
  getAllPolicies() {
    return {
      global: Object.fromEntries(this.policies),
      modules: Object.fromEntries(this.modulePolicies)
    };
  }

  /**
   * Delete a policy
   * @param {string} policyId - Policy ID
   */
  deletePolicy(policyId) {
    this.policies.delete(policyId);
    this.saveState();
  }

  /**
   * Delete a module policy
   * @param {string} module - Module name
   */
  deleteModulePolicy(module) {
    this.modulePolicies.delete(module);
    this.saveState();
  }

  /**
   * Reset to default policies
   */
  resetToDefaults() {
    this.policies.clear();
    this.modulePolicies.clear();
    this.initializeDefaultPolicies();
    this.saveState();
  }

  /**
   * Get policy statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const globalPolicies = Array.from(this.policies.values());
    const modulePolicies = Array.from(this.modulePolicies.values());

    const byFilter = {};
    globalPolicies.forEach(p => {
      byFilter[p.filter] = (byFilter[p.filter] || 0) + 1;
    });

    const byPriority = {};
    globalPolicies.forEach(p => {
      byPriority[p.priority] = (byPriority[p.priority] || 0) + 1;
    });

    return {
      globalPolicyCount: globalPolicies.length,
      modulePolicyCount: modulePolicies.length,
      byFilter,
      byPriority
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        policies: Array.from(this.policies.entries()),
        modulePolicies: Array.from(this.modulePolicies.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save sync policy state:', error);
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
        this.policies = new Map(parsed.policies || []);
        this.modulePolicies = new Map(parsed.modulePolicies || []);
      }
    } catch (error) {
      console.error('Failed to load sync policy state:', error);
    }
  }

  /**
   * Destroy the policy manager
   */
  destroy() {
    this.policies.clear();
    this.modulePolicies.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[SyncPolicyManager] Destroyed');
  }
}

// Singleton instance
let syncPolicyManagerInstance = null;

/**
 * Get the singleton sync policy manager instance
 * @returns {SyncPolicyManager} Sync policy manager instance
 */
export function getSyncPolicyManager() {
  if (!syncPolicyManagerInstance) {
    syncPolicyManagerInstance = new SyncPolicyManager();
  }
  return syncPolicyManagerInstance;
}

export default SyncPolicyManager;
