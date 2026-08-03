// Conflict Detector
// Detects conflicts during import operations

import { ConflictType, ConflictResolutionAction } from './ExportTypes.js';

export class ConflictDetector {
  constructor() {
    this.existingData = new Map();
    this.conflicts = new Map();
    this.storageKey = 'cafeos_conflict_detector';
    this.loadState();
  }

  /**
   * Detect conflicts in import data
   * @param {Array} importData - Data to import
   * @param {string} module - Module name
   * @param {object} existingData - Existing data in the system
   * @returns {object} Conflict detection result
   */
  detectConflicts(importData, module, existingData) {
    this.existingData.set(module, existingData);
    const conflicts = [];
    const idField = this.getIdField(module);

    importData.forEach((record, index) => {
      const recordConflicts = this.checkRecordConflicts(record, module, existingData, idField, index + 1);
      conflicts.push(...recordConflicts);
    });

    this.conflicts.set(module, conflicts);
    this.saveState();

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      conflictCount: conflicts.length,
      byType: this.groupConflictsByType(conflicts)
    };
  }

  /**
   * Check conflicts for a single record
   * @param {object} record - Record to check
   * @param {string} module - Module name
   * @param {Array} existingData - Existing data
   * @param {string} idField - ID field name
   * @param {number} row - Row number
   * @returns {Array} Conflicts
   */
  checkRecordConflicts(record, module, existingData, idField, row) {
    const conflicts = [];

    // Check for duplicate ID
    if (record[idField]) {
      const existing = existingData.find(item => item[idField] === record[idField]);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_ID,
          row,
          field: idField,
          value: record[idField],
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.REPLACE
        });
      }
    }

    // Module-specific conflict checks
    switch (module) {
      case 'orders':
        conflicts.push(...this.checkOrderConflicts(record, existingData, row));
        break;
      case 'customers':
        conflicts.push(...this.checkCustomerConflicts(record, existingData, row));
        break;
      case 'staff':
        conflicts.push(...this.checkStaffConflicts(record, existingData, row));
        break;
      case 'products':
      case 'inventory':
        conflicts.push(...this.checkProductConflicts(record, existingData, row));
        break;
      case 'tables':
        conflicts.push(...this.checkTableConflicts(record, existingData, row));
        break;
      case 'suppliers':
        conflicts.push(...this.checkSupplierConflicts(record, existingData, row));
        break;
      case 'settings':
        conflicts.push(...this.checkSettingConflicts(record, existingData, row));
        break;
    }

    return conflicts;
  }

  /**
   * Check order conflicts
   */
  checkOrderConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate order number
    if (record.orderNumber) {
      const existing = existingData.find(item => item.orderNumber === record.orderNumber);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_ORDER,
          row,
          field: 'orderNumber',
          value: record.orderNumber,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.MERGE
        });
      }
    }

    return conflicts;
  }

  /**
   * Check customer conflicts
   */
  checkCustomerConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate customer by phone
    if (record.phone) {
      const existing = existingData.find(item => item.phone === record.phone);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_CUSTOMER,
          row,
          field: 'phone',
          value: record.phone,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.MERGE
        });
      }
    }

    // Check for duplicate customer by email
    if (record.email) {
      const existing = existingData.find(item => item.email === record.email);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_CUSTOMER,
          row,
          field: 'email',
          value: record.email,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.MERGE
        });
      }
    }

    return conflicts;
  }

  /**
   * Check staff conflicts
   */
  checkStaffConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate staff by phone
    if (record.phone) {
      const existing = existingData.find(item => item.phone === record.phone);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_STAFF,
          row,
          field: 'phone',
          value: record.phone,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.REPLACE
        });
      }
    }

    return conflicts;
  }

  /**
   * Check product conflicts
   */
  checkProductConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate product by code/SKU
    if (record.code || record.sku) {
      const code = record.code || record.sku;
      const existing = existingData.find(item => (item.code === code || item.sku === code));
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_PRODUCT,
          row,
          field: 'code',
          value: code,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.REPLACE
        });
      }
    }

    // Check for duplicate product by barcode
    if (record.barcode || record.upc) {
      const barcode = record.barcode || record.upc;
      const existing = existingData.find(item => (item.barcode === barcode || item.upc === barcode));
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_PRODUCT,
          row,
          field: 'barcode',
          value: barcode,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.REPLACE
        });
      }
    }

    return conflicts;
  }

  /**
   * Check table conflicts
   */
  checkTableConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate table number
    if (record.number) {
      const existing = existingData.find(item => item.number === record.number);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_TABLE,
          row,
          field: 'number',
          value: record.number,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.REPLACE
        });
      }
    }

    return conflicts;
  }

  /**
   * Check supplier conflicts
   */
  checkSupplierConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate supplier by name
    if (record.name) {
      const existing = existingData.find(item => item.name === record.name);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_SUPPLIER,
          row,
          field: 'name',
          value: record.name,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.MERGE
        });
      }
    }

    return conflicts;
  }

  /**
   * Check setting conflicts
   */
  checkSettingConflicts(record, existingData, row) {
    const conflicts = [];

    // Check for duplicate setting key
    if (record.key) {
      const existing = existingData.find(item => item.key === record.key);
      if (existing) {
        conflicts.push({
          type: ConflictType.DUPLICATE_SETTING,
          row,
          field: 'key',
          value: record.key,
          existing,
          incoming: record,
          suggestedAction: ConflictResolutionAction.REPLACE
        });
      }
    }

    return conflicts;
  }

  /**
   * Get ID field for module
   * @param {string} module - Module name
   * @returns {string} ID field name
   */
  getIdField(module) {
    const idFields = {
      orders: 'id',
      customers: 'id',
      staff: 'id',
      products: 'id',
      inventory: 'id',
      tables: 'id',
      suppliers: 'id',
      settings: 'key'
    };

    return idFields[module] || 'id';
  }

  /**
   * Group conflicts by type
   * @param {Array} conflicts - Conflicts
   * @returns {object} Grouped conflicts
   */
  groupConflictsByType(conflicts) {
    const grouped = {};

    conflicts.forEach(conflict => {
      grouped[conflict.type] = (grouped[conflict.type] || 0) + 1;
    });

    return grouped;
  }

  /**
   * Resolve conflict
   * @param {string} conflictId - Conflict ID
   * @param {string} action - Resolution action
   * @returns {object} Resolution result
   */
  resolveConflict(conflictId, action) {
    // This would be implemented to actually resolve the conflict
    // For now, just return success
    return { success: true, conflictId, action };
  }

  /**
   * Get conflicts for module
   * @param {string} module - Module name
   * @returns {Array} Conflicts
   */
  getConflicts(module) {
    return this.conflicts.get(module) || [];
  }

  /**
   * Clear conflicts for module
   * @param {string} module - Module name
   */
  clearConflicts(module) {
    this.conflicts.delete(module);
    this.saveState();
  }

  /**
   * Get conflict statistics
   * @returns {object} Statistics
   */
  getStatistics() {
    const allConflicts = Array.from(this.conflicts.values()).flat();
    const total = allConflicts.length;

    const byType = {};
    allConflicts.forEach(conflict => {
      byType[conflict.type] = (byType[conflict.type] || 0) + 1;
    });

    const byModule = {};
    this.conflicts.forEach((conflicts, module) => {
      byModule[module] = conflicts.length;
    });

    return {
      total,
      byType,
      byModule
    };
  }

  /**
   * Save state to localStorage
   */
  saveState() {
    try {
      const state = {
        conflicts: Array.from(this.conflicts.entries())
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save conflict detector state:', error);
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
        this.conflicts = new Map(parsed.conflicts || []);
      }
    } catch (error) {
      console.error('Failed to load conflict detector state:', error);
      this.conflicts = new Map();
    }
  }

  /**
   * Destroy the conflict detector
   */
  destroy() {
    this.existingData.clear();
    this.conflicts.clear();
    localStorage.removeItem(this.storageKey);
    console.log('[ConflictDetector] Destroyed');
  }
}

// Singleton instance
let conflictDetectorInstance = null;

/**
 * Get the singleton conflict detector instance
 * @returns {ConflictDetector} Conflict detector instance
 */
export function getConflictDetector() {
  if (!conflictDetectorInstance) {
    conflictDetectorInstance = new ConflictDetector();
  }
  return conflictDetectorInstance;
}

export default ConflictDetector;
