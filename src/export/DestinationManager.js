// Destination Manager
// Manages export and import destinations

import { DestinationType } from './ExportTypes.js';

export class DestinationManager {
  constructor() {
    this.destinations = new Map();
    this.storageKey = 'cafeos_destination_manager';
    this.loadState();
    this.initializeDefaultDestinations();
  }

  /**
   * Initialize default destinations
   */
  initializeDefaultDestinations() {
    // Download destination
    this.destinations.set('download', {
      id: 'download',
      type: DestinationType.DOWNLOAD,
      name: 'Download',
      description: 'Download file to local device',
      enabled: true,
      config: {}
    });

    // Local storage destination
    this.destinations.set('local_storage', {
      id: 'local_storage',
      type: DestinationType.LOCAL_STORAGE,
      name: 'Local Storage',
      description: 'Save to browser local storage',
      enabled: true,
      config: {
        maxSize: 10 * 1024 * 1024, // 10MB
        retentionDays: 30
      }
    });

    // Cloud provider destination
    this.destinations.set('cloud_provider', {
      id: 'cloud_provider',
      type: DestinationType.CLOUD_PROVIDER,
      name: 'Cloud Provider',
      description: 'Save to active cloud provider',
      enabled: false,
      config: {
        provider: null,
        path: '/exports'
      }
    });

    // Backup package destination
    this.destinations.set('backup_package', {
      id: 'backup_package',
      type: DestinationType.BACKUP_PACKAGE,
      name: 'Backup Package',
      description: 'Include in backup package',
      enabled: true,
      config: {
        autoInclude: false
      }
    });

    // Temporary export destination
    this.destinations.set('temporary', {
      id: 'temporary',
      type: DestinationType.TEMPORARY,
      name: 'Temporary Storage',
      description: 'Temporary storage for processing',
      enabled: true,
      config: {
        retentionHours: 24
      }
    });
  }

  /**
   * Get destination by ID
   * @param {string} destinationId - Destination ID
   * @returns {object|null} Destination
   */
  getDestination(destinationId) {
    return this.destinations.get(destinationId) || null;
  }

  /**
   * Get all destinations
   * @param {boolean} includeDisabled - Include disabled destinations
   * @returns {Array} Destinations
   */
  getDestinations(includeDisabled = false) {
    const destinations = Array.from(this.destinations.values());
    
    if (!includeDisabled) {
      return destinations.filter(d => d.enabled);
    }

    return destinations;
  }

  /**
   * Get destinations by type
   * @param {string} type - Destination type
   * @returns {Array} Destinations
   */
  getDestinationsByType(type) {
    return Array.from(this.destinations.values()).filter(d => d.type === type);
  }

  /**
   * Add destination
   * @param {object} destination - Destination configuration
   * @returns {object} Add result
   */
  addDestination(destination) {
    const destinationId = destination.id || this.generateId();
    
    const newDestination = {
      id: destinationId,
      type: destination.type,
      name: destination.name,
      description: destination.description || '',
      enabled: destination.enabled !== false,
      config: destination.config || {},
      createdAt: new Date().toISOString()
    };

    this.destinations.set(destinationId, newDestination);
    this.saveState();

    return { success: true, destinationId };
  }

  /**
   * Update destination
   * @param {string} destinationId - Destination ID
   * @param {object} updates - Updates to apply
   * @returns {object} Update result
   */
  updateDestination(destinationId, updates) {
    const destination = this.destinations.get(destinationId);
    
    if (!destination) {
      return { success: false, reason: 'Destination not found' };
    }

    Object.assign(destination, updates);
    destination.lastModified = new Date().toISOString();
    this.destinations.set(destinationId, destination);
    this.saveState();

    return { success: true, destinationId };
  }

  /**
   * Delete destination
   * @param {string} destinationId - Destination ID
   * @returns {object} Delete result
   */
  deleteDestination(destinationId) {
    const destination = this.destinations.get(destinationId);
    
    if (!destination) {
      return { success: false, reason: 'Destination not found' };
    }

    // Prevent deleting default destinations
    if (['download', 'local_storage', 'cloud_provider', 'backup_package', 'temporary'].includes(destinationId)) {
      return { success: false, reason: 'Cannot delete default destination' };
    }

    this.destinations.delete(destinationId);
    this.saveState();

    return { success: true, destinationId };
  }

  /**
   * Enable destination
   * @param {string} destinationId - Destination ID
   * @returns {object} Enable result
   */
  enableDestination(destinationId) {
    return this.updateDestination(destinationId, { enabled: true });
  }

  /**
   * Disable destination
   * @param {string} destinationId - Destination ID
   * @returns {object} Disable result
   */
  disableDestination(destinationId) {
    return this.updateDestination(destinationId, { enabled: false });
  }

  /**
   * Save to destination
   * @param {string} destinationId - Destination ID
   * @param {Blob} data - Data to save
   * @param {string} filename - Filename
   * @returns {Promise<object>} Save result
   */
  async saveToDestination(destinationId, data, filename) {
    const destination = this.destinations.get(destinationId);
    
    if (!destination) {
      return { success: false, error: 'Destination not found' };
    }

    if (!destination.enabled) {
      return { success: false, error: 'Destination is disabled' };
    }

    switch (destination.type) {
      case DestinationType.DOWNLOAD:
        return this.saveToDownload(data, filename);
      case DestinationType.LOCAL_STORAGE:
        return this.saveToLocalStorage(data, filename, destination.config);
      case DestinationType.CLOUD_PROVIDER:
        return this.saveToCloudProvider(data, filename, destination.config);
      case DestinationType.BACKUP_PACKAGE:
        return this.saveToBackupPackage(data, filename, destination.config);
      case DestinationType.TEMPORARY:
        return this.saveToTemporary(data, filename, destination.config);
      default:
        return { success: false, error: 'Unsupported destination type' };
    }
  }

  /**
   * Save to download
   * @param {Blob} data - Data to save
   * @param {string} filename - Filename
   * @returns {object} Save result
   */
  saveToDownload(data, filename) {
    try {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      return { success: true, destination: 'download' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save to local storage
   * @param {Blob} data - Data to save
   * @param {string} filename - Filename
   * @param {object} config - Destination config
   * @returns {Promise<object>} Save result
   */
  async saveToLocalStorage(data, filename, config = {}) {
    try {
      const maxSize = config.maxSize || 10 * 1024 * 1024; // 10MB default
      
      if (data.size > maxSize) {
        return { success: false, error: 'File size exceeds local storage limit' };
      }

      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(data);
      });

      const key = `export_${Date.now()}_${filename}`;
      const record = {
        filename,
        dataUrl,
        size: data.size,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (config.retentionDays || 30) * 24 * 60 * 60 * 1000).toISOString()
      };

      localStorage.setItem(key, JSON.stringify(record));
      
      return { success: true, destination: 'local_storage', key };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Save to cloud provider
   * @param {Blob} data - Data to save
   * @param {string} filename - Filename
   * @param {object} config - Destination config
   * @returns {Promise<object>} Save result
   */
  async saveToCloudProvider(data, filename, config = {}) {
    // Placeholder for cloud provider integration
    return { 
      success: true, 
      destination: 'cloud_provider', 
      note: 'Cloud provider integration pending',
      provider: config.provider
    };
  }

  /**
   * Save to backup package
   * @param {Blob} data - Data to save
   * @param {string} filename - Filename
   * @param {object} config - Destination config
   * @returns {Promise<object>} Save result
   */
  async saveToBackupPackage(data, filename, config = {}) {
    // Placeholder for backup package integration
    return { 
      success: true, 
      destination: 'backup_package', 
      note: 'Backup package integration pending'
    };
  }

  /**
   * Save to temporary storage
   * @param {Blob} data - Data to save
   * @param {string} filename - Filename
   * @param {object} config - Destination config
   * @returns {Promise<object>} Save result
   */
  async saveToTemporary(data, filename, config = {}) {
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(data);
      });

      const key = `temp_${Date.now()}_${filename}`;
      const record = {
        filename,
        dataUrl,
        size: data.size,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + (config.retentionHours || 24) * 60 * 60 * 1000).toISOString()
      };

      sessionStorage.setItem(key, JSON.stringify(record));
      
      return { success: true, destination: 'temporary', key };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load from destination
   * @param {string} destinationId - Destination ID
   * @param {string} key - Storage key
   * @returns {Promise<object>} Load result
   */
  async loadFromDestination(destinationId, key) {
    const destination = this.destinations.get(destinationId);
    
    if (!destination) {
      return { success: false, error: 'Destination not found' };
    }

    switch (destination.type) {
      case DestinationType.LOCAL_STORAGE:
        return this.loadFromLocalStorage(key);
      case DestinationType.TEMPORARY:
        return this.loadFromTemporary(key);
      default:
        return { success: false, error: 'Loading not supported for this destination type' };
    }
  }

  /**
   * Load from local storage
   * @param {string} key - Storage key
   * @returns {object} Load result
   */
  loadFromLocalStorage(key) {
    try {
      const record = JSON.parse(localStorage.getItem(key));
      
      if (!record) {
        return { success: false, error: 'File not found' };
      }

      // Check if expired
      if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        localStorage.removeItem(key);
        return { success: false, error: 'File has expired' };
      }

      return { success: true, record };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load from temporary storage
   * @param {string} key - Storage key
   * @returns {object} Load result
   */
  loadFromTemporary(key) {
    try {
      const record = JSON.parse(sessionStorage.getItem(key));
      
      if (!record) {
        return { success: false, error: 'File not found' };
      }

      // Check if expired
      if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
        sessionStorage.removeItem(key);
        return { success: false, error: 'File has expired' };
      }

      return { success: true, record };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean up expired files
   * @returns {object} Cleanup result
   */
  cleanupExpiredFiles() {
    let cleaned = 0;

    // Clean local storage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('export_') || key.startsWith('temp_')) {
        try {
          const record = JSON.parse(localStorage.getItem(key));
          if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
            localStorage.removeItem(key);
            cleaned++;
          }
        } catch {
          // Invalid record, remove it
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }

    // Clean session storage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key.startsWith('temp_')) {
        try {
          const record = JSON.parse(sessionStorage.getItem(key));
          if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
            sessionStorage.removeItem(key);
            cleaned++;
          }
        } catch {
          // Invalid record, remove it
            sessionStorage.removeItem(key);
            cleaned++;
          }
        }
      }
    }

    return { success: true, cleaned };
  }

  /**
   * Get destination statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const destinations = Array.from(this.destinations.values());
    const enabled = destinations.filter(d => d.enabled).length;
    const disabled = destinations.filter(d => !d.enabled).length;

    const byType = {};
    destinations.forEach(d => {
      byType[d.type] = (byType[d.type] || 0) + 1;
    });

    return {
      total: destinations.length,
      enabled,
      disabled,
      byType
    };
  }

  /**
   * Generate ID
   * @returns {string} Generated ID
   */
  generateId() {
    return `dest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        destinations: Array.from(this.destinations.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save destination manager state:', error);
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
        this.destinations = new Map(parsed.destinations || []);
      }
    } catch (error) {
      console.error('Failed to load destination manager state:', error);
      this.destinations = new Map();
    }
  }

  /**
   * Destroy the destination manager
   */
  destroy() {
    this.destinations.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[DestinationManager] Destroyed');
  }
}

// Singleton instance
let destinationManagerInstance = null;

/**
 * Get the singleton destination manager instance
 * @returns {DestinationManager} Destination manager instance
 */
export function getDestinationManager() {
  if (!destinationManagerInstance) {
    destinationManagerInstance = new DestinationManager();
  }
  return destinationManagerInstance;
}

export default DestinationManager;
