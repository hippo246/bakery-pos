// Universal Import Engine
// Central engine for all data import operations
// All CafeOS modules use this engine for imports

import storageEngine from './StorageEngine.js';

/**
 * Import Engine
 * Universal orchestration layer for all import operations
 * Supports validation, dry-run, conflict preview, and rollback
 */
class ImportEngine {
  constructor() {
    this.initialized = false;
    this.importQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Initialize the import engine
   */
  async initialize() {
    if (this.initialized) return;
    
    // Initialize storage engine
    await storageEngine.initialize();
    
    this.initialized = true;
  }

  /**
   * Import data from specified source
   * @param {string|File} source - Source: file path, file object, or cloud key
   * @param {string} sourceType - Source type: file, cloud, local
   * @param {object} options - Import options
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async import(source, sourceType, options = {}) {
    try {
      // Validate inputs
      if (!source) {
        return { success: false, error: 'No source provided for import' };
      }

      if (!['file', 'cloud', 'local'].includes(sourceType)) {
        return { success: false, error: 'Unsupported source type' };
      }

      // Load data from source
      const loadDataResult = await this.loadData(source, sourceType);
      
      if (!loadDataResult.success) {
        return loadDataResult;
      }

      const data = loadDataResult.data;

      // Validate data
      const validationResult = await this.validateData(data, options);
      
      if (!validationResult.valid) {
        return { 
          success: false, 
          error: 'Validation failed', 
          validationErrors: validationResult.errors 
        };
      }

      // Dry-run mode
      if (options.dryRun) {
        return await this.previewImport(data, options);
      }

      // Create backup before import
      const backupResult = await this.createBackup(options);
      
      if (!backupResult.success) {
        console.warn('[ImportEngine] Failed to create backup, proceeding anyway');
      }

      // Perform import
      const importResult = await this.performImport(data, options);
      
      if (!importResult.success) {
        // Rollback on failure
        if (backupResult.success) {
          await this.rollbackBackup(backupResult.backupId);
        }
        return importResult;
      }

      // Log import
      await this.logImport(sourceType, options.module || 'unknown', data.length);

      return { success: true, data: importResult.data };
    } catch (error) {
      console.error('[ImportEngine] Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load data from source
   * @param {string|File} source 
   * @param {string} sourceType 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async loadData(source, sourceType) {
    try {
      switch (sourceType) {
        case 'file':
          return await this.loadFromFile(source);
        case 'cloud':
          return await this.loadFromCloud(source);
        case 'local':
          return await this.loadFromLocalStorage(source);
        default:
          return { success: false, error: 'Invalid source type' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load data from file
   * @param {File} file 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async loadFromFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to parse file' };
    }
  }

  /**
   * Load data from cloud storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async loadFromCloud(key) {
    try {
      const result = await storageEngine.download(key);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const text = await result.data.text();
      const data = JSON.parse(text);
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Load data from local storage
   * @param {string} key 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async loadFromLocalStorage(key) {
    try {
      const result = await storageEngine.download(key);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      const text = await result.data.text();
      const data = JSON.parse(text);
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate data before import
   * @param {any} data 
   * @param {object} options 
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validateData(data, options = {}) {
    const errors = [];

    // Check if data is valid
    if (!data) {
      errors.push('No data provided');
      return { valid: false, errors };
    }

    // Check if data is an array (for list imports)
    if (options.expectArray && !Array.isArray(data)) {
      errors.push('Expected array of data');
    }

    // Check if data is an object (for single imports)
    if (options.expectObject && typeof data !== 'object') {
      errors.push('Expected object data');
    }

    // Validate required fields
    if (options.requiredFields) {
      if (Array.isArray(data)) {
        for (const item of data) {
          for (const field of options.requiredFields) {
            if (!(field in item)) {
              errors.push(`Missing required field: ${field}`);
            }
          }
        }
      } else {
        for (const field of options.requiredFields) {
          if (!(field in data)) {
            errors.push(`Missing required field: ${field}`);
          }
        }
      }
    }

    // Custom validation function
    if (options.validateFunction) {
      const customErrors = await options.validateFunction(data);
      errors.push(...customErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Preview import without applying changes
   * @param {any} data 
   * @param {object} options 
   * @returns {Promise<{success: boolean, preview?: object, error?: string}>}
   */
  async previewImport(data, options = {}) {
    try {
      const preview = {
        recordCount: Array.isArray(data) ? data.length : 1,
        fields: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : Object.keys(data),
        sampleData: Array.isArray(data) ? data.slice(0, 5) : [data],
        conflicts: [],
        warnings: []
      };

      // Check for conflicts
      if (options.checkConflicts && options.existingData) {
        preview.conflicts = await this.detectConflicts(data, options.existingData, options.conflictFields);
      }

      // Check for warnings
      if (options.checkWarnings) {
        preview.warnings = await this.detectWarnings(data, options);
      }

      return { success: true, preview };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Detect conflicts between import data and existing data
   * @param {any} importData 
   * @param {any} existingData 
   * @param {string[]} conflictFields 
   * @returns {Array}
   */
  async detectConflicts(importData, existingData, conflictFields = []) {
    const conflicts = [];

    if (!Array.isArray(importData) || !Array.isArray(existingData)) {
      return conflicts;
    }

    const existingKeys = new Set();
    for (const item of existingData) {
      const key = conflictFields.map(field => item[field]).join('|');
      existingKeys.add(key);
    }

    for (const item of importData) {
      const key = conflictFields.map(field => item[field]).join('|');
      if (existingKeys.has(key)) {
        conflicts.push({
          item,
          key,
          fields: conflictFields
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect warnings in import data
   * @param {any} data 
   * @param {object} options 
   * @returns {Array}
   */
  async detectWarnings(data, options = {}) {
    const warnings = [];

    if (!Array.isArray(data)) {
      return warnings;
    }

    // Check for empty fields
    if (options.warnOnEmptyFields) {
      for (const item of data) {
        for (const field of options.warnOnEmptyFields) {
          if (!item[field]) {
            warnings.push({
              type: 'empty_field',
              field,
              item
            });
          }
        }
      }
    }

    // Check for duplicates
    if (options.warnOnDuplicates && options.duplicateFields) {
      const seen = new Set();
      for (const item of data) {
        const key = options.duplicateFields.map(field => item[field]).join('|');
        if (seen.has(key)) {
          warnings.push({
            type: 'duplicate',
            key,
            item
          });
        }
        seen.add(key);
      }
    }

    return warnings;
  }

  /**
   * Perform the actual import
   * @param {any} data 
   * @param {object} options 
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async performImport(data, options = {}) {
    try {
      // Use custom import function if provided
      if (options.importFunction) {
        const result = await options.importFunction(data, options);
        return result;
      }

      // Default import: save to localStorage
      if (options.localStorageKey) {
        const existing = JSON.parse(localStorage.getItem(options.localStorageKey) || '[]');
        const merged = Array.isArray(data) ? [...existing, ...data] : { ...existing, ...data };
        localStorage.setItem(options.localStorageKey, JSON.stringify(merged));
        return { success: true, data: merged };
      }

      // No import function or key provided
      return { success: false, error: 'No import method specified' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create backup before import
   * @param {object} options 
   * @returns {Promise<{success: boolean, backupId?: string, error?: string}>}
   */
  async createBackup(options = {}) {
    try {
      const backupId = `backup_${Date.now()}`;
      const backupData = {};

      // Backup specified keys
      if (options.backupKeys) {
        for (const key of options.backupKeys) {
          const value = localStorage.getItem(key);
          if (value) {
            backupData[key] = value;
          }
        }
      }

      // Save backup
      localStorage.setItem(backupId, JSON.stringify(backupData));
      
      return { success: true, backupId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Rollback from backup
   * @param {string} backupId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rollbackBackup(backupId) {
    try {
      const backupDataStr = localStorage.getItem(backupId);
      
      if (!backupDataStr) {
        return { success: false, error: 'Backup not found' };
      }

      const backupData = JSON.parse(backupDataStr);

      // Restore backup
      for (const [key, value] of Object.entries(backupData)) {
        localStorage.setItem(key, value);
      }

      // Remove backup
      localStorage.removeItem(backupId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process import queue (retry failed imports)
   */
  async processImportQueue() {
    if (this.isProcessingQueue || this.importQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    for (const item of this.importQueue) {
      try {
        await this.import(item.source, item.sourceType, item.options);
        // Remove from queue on success
        this.importQueue = this.importQueue.filter(i => i !== item);
      } catch (error) {
        // Keep in queue for retry
        console.error('[ImportEngine] Queue import failed:', error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Log import operation
   * @param {string} sourceType 
   * @param {string} module 
   * @param {number} recordCount 
   */
  async logImport(sourceType, module, recordCount) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_import_logs') || '[]');
      logs.push({
        sourceType,
        module,
        recordCount,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_import_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[ImportEngine] Failed to log import:', error);
    }
  }

  /**
   * Get import logs
   * @param {object} options 
   * @returns {Array}
   */
  getLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_import_logs') || '[]');
      
      let filtered = logs;
      
      if (options.sourceType) {
        filtered = filtered.filter(log => log.sourceType === options.sourceType);
      }
      
      if (options.module) {
        filtered = filtered.filter(log => log.module === options.module);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get import statistics
   * @returns {object}
   */
  getStatistics() {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_import_logs') || '[]');
      
      const stats = {
        total: logs.length,
        bySourceType: {},
        byModule: {},
        totalRecords: 0,
        recent: logs.slice(-10)
      };
      
      for (const log of logs) {
        stats.bySourceType[log.sourceType] = (stats.bySourceType[log.sourceType] || 0) + 1;
        stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
        stats.totalRecords += log.recordCount || 0;
      }
      
      return stats;
    } catch (error) {
      return {
        total: 0,
        bySourceType: {},
        byModule: {},
        totalRecords: 0,
        recent: []
      };
    }
  }
}

// Singleton instance
const importEngine = new ImportEngine();

export default importEngine;
