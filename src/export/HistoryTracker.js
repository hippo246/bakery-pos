// History Tracker
// Tracks export and import history

import { ExportStatus, ImportStatus } from './ExportTypes.js';

export class HistoryTracker {
  constructor() {
    this.exportHistory = new Map();
    this.importHistory = new Map();
    this.maxHistorySize = 500;
    this.storageKey = 'cafeos_history_tracker';
    this.loadState();
  }

  /**
   * Record export
   * @param {object} exportData - Export data
   * @returns {object} Record result
   */
  recordExport(exportData) {
    const exportId = this.generateId('export');
    
    const record = {
      exportId,
      type: 'export',
      module: exportData.module,
      format: exportData.format,
      destination: exportData.destination,
      status: exportData.status || ExportStatus.COMPLETED,
      recordCount: exportData.recordCount,
      size: exportData.size,
      duration: exportData.duration,
      operator: exportData.operator,
      filename: exportData.filename,
      tags: exportData.tags || [],
      notes: exportData.notes || '',
      compression: exportData.compression || false,
      encryption: exportData.encryption || false,
      createdAt: new Date().toISOString(),
      completedAt: exportData.completedAt || new Date().toISOString()
    };

    this.exportHistory.set(exportId, record);
    this.trimHistory();
    this.saveState();

    return { success: true, exportId, record };
  }

  /**
   * Record import
   * @param {object} importData - Import data
   * @returns {object} Record result
   */
  recordImport(importData) {
    const importId = this.generateId('import');
    
    const record = {
      importId,
      type: 'import',
      module: importData.module,
      format: importData.format,
      source: importData.source,
      status: importData.status || ImportStatus.COMPLETED,
      recordsImported: importData.recordsImported,
      recordsSkipped: importData.recordsSkipped || 0,
      recordsFailed: importData.recordsFailed || 0,
      warnings: importData.warnings || [],
      errors: importData.errors || [],
      duration: importData.duration,
      operator: importData.operator,
      filename: importData.filename,
      rollbackAvailable: importData.rollbackAvailable || false,
      rollbackId: importData.rollbackId || null,
      createdAt: new Date().toISOString(),
      completedAt: importData.completedAt || new Date().toISOString()
    };

    this.importHistory.set(importId, record);
    this.trimHistory();
    this.saveState();

    return { success: true, importId, record };
  }

  /**
   * Update export status
   * @param {string} exportId - Export ID
   * @param {string} status - New status
   * @param {object} updates - Additional updates
   * @returns {object} Update result
   */
  updateExportStatus(exportId, status, updates = {}) {
    const record = this.exportHistory.get(exportId);
    
    if (!record) {
      return { success: false, reason: 'Export not found' };
    }

    record.status = status;
    Object.assign(record, updates);
    
    if (status === ExportStatus.COMPLETED || status === ExportStatus.FAILED) {
      record.completedAt = new Date().toISOString();
    }

    this.exportHistory.set(exportId, record);
    this.saveState();

    return { success: true, exportId };
  }

  /**
   * Update import status
   * @param {string} importId - Import ID
   * @param {string} status - New status
   * @param {object} updates - Additional updates
   * @returns {object} Update result
   */
  updateImportStatus(importId, status, updates = {}) {
    const record = this.importHistory.get(importId);
    
    if (!record) {
      return { success: false, reason: 'Import not found' };
    }

    record.status = status;
    Object.assign(record, updates);
    
    if (status === ImportStatus.COMPLETED || status === ImportStatus.FAILED) {
      record.completedAt = new Date().toISOString();
    }

    this.importHistory.set(importId, record);
    this.saveState();

    return { success: true, importId };
  }

  /**
   * Get export history
   * @param {object} filters - Optional filters
   * @returns {Array} Export history
   */
  getExportHistory(filters = {}) {
    let history = Array.from(this.exportHistory.values());

    if (filters.module) {
      history = history.filter(r => r.module === filters.module);
    }

    if (filters.format) {
      history = history.filter(r => r.format === filters.format);
    }

    if (filters.status) {
      history = history.filter(r => r.status === filters.status);
    }

    if (filters.operator) {
      history = history.filter(r => r.operator === filters.operator);
    }

    if (filters.since) {
      history = history.filter(r => new Date(r.createdAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by creation date descending
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return history;
  }

  /**
   * Get import history
   * @param {object} filters - Optional filters
   * @returns {Array} Import history
   */
  getImportHistory(filters = {}) {
    let history = Array.from(this.importHistory.values());

    if (filters.module) {
      history = history.filter(r => r.module === filters.module);
    }

    if (filters.format) {
      history = history.filter(r => r.format === filters.format);
    }

    if (filters.status) {
      history = history.filter(r => r.status === filters.status);
    }

    if (filters.operator) {
      history = history.filter(r => r.operator === filters.operator);
    }

    if (filters.since) {
      history = history.filter(r => new Date(r.createdAt) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    // Sort by creation date descending
    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return history;
  }

  /**
   * Get combined history
   * @param {object} filters - Optional filters
   * @returns {Array} Combined history
   */
  getCombinedHistory(filters = {}) {
    const exports = this.getExportHistory(filters).map(r => ({ ...r, type: 'export' }));
    const imports = this.getImportHistory(filters).map(r => ({ ...r, type: 'import' }));
    
    const combined = [...exports, ...imports];
    
    // Sort by creation date descending
    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return combined;
  }

  /**
   * Get export by ID
   * @param {string} exportId - Export ID
   * @returns {object|null} Export record
   */
  getExport(exportId) {
    return this.exportHistory.get(exportId) || null;
  }

  /**
   * Get import by ID
   * @param {string} importId - Import ID
   * @returns {object|null} Import record
   */
  getImport(importId) {
    return this.importHistory.get(importId) || null;
  }

  /**
   * Delete export record
   * @param {string} exportId - Export ID
   * @returns {object} Delete result
   */
  deleteExport(exportId) {
    const deleted = this.exportHistory.delete(exportId);
    this.saveState();
    return { success: deleted, exportId };
  }

  /**
   * Delete import record
   * @param {string} importId - Import ID
   * @returns {object} Delete result
   */
  deleteImport(importId) {
    const deleted = this.importHistory.delete(importId);
    this.saveState();
    return { success: deleted, importId };
  }

  /**
   * Get export statistics
   * @returns {object} Statistics
   */
  getExportStatistics() {
    const history = Array.from(this.exportHistory.values());
    const total = history.length;
    const completed = history.filter(r => r.status === ExportStatus.COMPLETED).length;
    const failed = history.filter(r => r.status === ExportStatus.FAILED).length;
    const pending = history.filter(r => r.status === ExportStatus.PENDING).length;

    const byModule = {};
    history.forEach(r => {
      byModule[r.module] = (byModule[r.module] || 0) + 1;
    });

    const byFormat = {};
    history.forEach(r => {
      byFormat[r.format] = (byFormat[r.format] || 0) + 1;
    });

    const totalSize = history.reduce((sum, r) => sum + (r.size || 0), 0);

    return {
      total,
      completed,
      failed,
      pending,
      byModule,
      byFormat,
      totalSize
    };
  }

  /**
   * Get import statistics
   * @returns {object} Statistics
   */
  getImportStatistics() {
    const history = Array.from(this.importHistory.values());
    const total = history.length;
    const completed = history.filter(r => r.status === ImportStatus.COMPLETED).length;
    const failed = history.filter(r => r.status === ImportStatus.FAILED).length;
    const pending = history.filter(r => r.status === ImportStatus.PENDING).length;

    const byModule = {};
    history.forEach(r => {
      byModule[r.module] = (byModule[r.module] || 0) + 1;
    });

    const byFormat = {};
    history.forEach(r => {
      byFormat[r.format] = (byFormat[r.format] || 0) + 1;
    });

    const totalImported = history.reduce((sum, r) => sum + (r.recordsImported || 0), 0);
    const totalSkipped = history.reduce((sum, r) => sum + (r.recordsSkipped || 0), 0);
    const totalFailed = history.reduce((sum, r) => sum + (r.recordsFailed || 0), 0);

    return {
      total,
      completed,
      failed,
      pending,
      byModule,
      byFormat,
      totalImported,
      totalSkipped,
      totalFailed
    };
  }

  /**
   * Trim history to max size
   */
  trimHistory() {
    while (this.exportHistory.size > this.maxHistorySize) {
      const firstKey = this.exportHistory.keys().next().value;
      this.exportHistory.delete(firstKey);
    }

    while (this.importHistory.size > this.maxHistorySize) {
      const firstKey = this.importHistory.keys().next().value;
      this.importHistory.delete(firstKey);
    }
  }

  /**
   * Generate ID
   * @param {string} type - Type prefix
   * @returns {string} Generated ID
   */
  generateId(type) {
    return `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        exportHistory: Array.from(this.exportHistory.entries()),
        importHistory: Array.from(this.importHistory.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save history tracker state:', error);
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
        this.exportHistory = new Map(parsed.exportHistory || []);
        this.importHistory = new Map(parsed.importHistory || []);
      }
    } catch (error) {
      console.error('Failed to load history tracker state:', error);
      this.exportHistory = new Map();
      this.importHistory = new Map();
    }
  }

  /**
   * Clear all history
   */
  clearAllHistory() {
    this.exportHistory.clear();
    this.importHistory.clear();
    this.saveState();
  }

  /**
   * Destroy the history tracker
   */
  destroy() {
    this.clearAllHistory();
    localStorage.removeItem(this.storageKey);
    console.log('[HistoryTracker] Destroyed');
  }
}

// Singleton instance
let historyTrackerInstance = null;

/**
 * Get the singleton history tracker instance
 * @returns {HistoryTracker} History tracker instance
 */
export function getHistoryTracker() {
  if (!historyTrackerInstance) {
    historyTrackerInstance = new HistoryTracker();
  }
  return historyTrackerInstance;
}

export default HistoryTracker;
