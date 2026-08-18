// Data Validator
// Validates and auto-repairs critical data structures

import { getEncryptionEngine } from '../security/EncryptionEngine.js';
import { getBackupEngine } from '../backup/BackupEngine.js';

export class DataValidator {
  constructor(config = {}) {
    this.config = {
      autoRepair: config.autoRepair !== false,
      createBackupBeforeRepair: config.createBackupBeforeRepair !== false,
      validationRules: config.validationRules || {},
      ...config
    };
    
    this.encryptionEngine = getEncryptionEngine();
    this.backupEngine = getBackupEngine();
    this.validationHistory = [];
    this.checksums = new Map();
  }

  /**
   * Validate data structure
   */
  async validate(dataType, data) {
    const validationStart = Date.now();
    
    try {
      const result = {
        valid: true,
        errors: [],
        warnings: [],
        repaired: false,
        repairLog: []
      };

      // Get validation rules for data type
      const rules = this.getValidationRules(dataType);
      
      // Apply validation rules
      for (const rule of rules) {
        const ruleResult = await this.applyRule(data, rule);
        
        if (!ruleResult.valid) {
          result.valid = false;
          result.errors.push(...ruleResult.errors);
          
          // Attempt auto-repair if enabled
          if (this.config.autoRepair && rule.autoRepair) {
            const repairResult = await this.repairData(data, rule, ruleResult);
            if (repairResult.repaired) {
              result.repaired = true;
              result.repairLog.push(repairResult);
              data = repairResult.data;
            }
          }
        }
        
        if (ruleResult.warnings) {
          result.warnings.push(...ruleResult.warnings);
        }
      }

      // Calculate and store checksum
      const checksum = await this.calculateChecksum(data);
      this.checksums.set(dataType, checksum);

      // Record validation
      this.recordValidation({
        dataType,
        valid: result.valid,
        repaired: result.repaired,
        duration: Date.now() - validationStart,
        timestamp: new Date().toISOString()
      });

      return {
        ...result,
        data,
        checksum
      };
    } catch (error) {
      console.error(`[DataValidator] Validation failed for ${dataType}:`, error);
      return {
        valid: false,
        errors: [`Validation error: ${error.message}`],
        repaired: false
      };
    }
  }

  /**
   * Get validation rules for data type
   */
  getValidationRules(dataType) {
    const defaultRules = {
      orders: [
        {
          name: 'required_fields',
          check: (data) => this.checkRequiredFields(data, ['id', 'items', 'total', 'status']),
          autoRepair: false,
          errorMessage: 'Missing required fields'
        },
        {
          name: 'item_structure',
          check: (data) => this.checkItemStructure(data),
          autoRepair: true,
          errorMessage: 'Invalid item structure'
        },
        {
          name: 'total_calculation',
          check: (data) => this.checkTotalCalculation(data),
          autoRepair: true,
          errorMessage: 'Total calculation mismatch'
        },
        {
          name: 'status_validity',
          check: (data) => this.checkStatusValidity(data),
          autoRepair: false,
          errorMessage: 'Invalid order status'
        }
      ],
      inventory: [
        {
          name: 'required_fields',
          check: (data) => this.checkRequiredFields(data, ['id', 'name', 'quantity', 'price']),
          autoRepair: false,
          errorMessage: 'Missing required fields'
        },
        {
          name: 'quantity_non_negative',
          check: (data) => this.checkQuantityNonNegative(data),
          autoRepair: true,
          errorMessage: 'Negative quantity detected'
        },
        {
          name: 'price_positive',
          check: (data) => this.checkPricePositive(data),
          autoRepair: true,
          errorMessage: 'Invalid price detected'
        }
      ],
      customers: [
        {
          name: 'required_fields',
          check: (data) => this.checkRequiredFields(data, ['id', 'name', 'phone']),
          autoRepair: false,
          errorMessage: 'Missing required fields'
        },
        {
          name: 'phone_format',
          check: (data) => this.checkPhoneFormat(data),
          autoRepair: false,
          errorMessage: 'Invalid phone format'
        }
      ]
    };

    return this.config.validationRules[dataType] || defaultRules[dataType] || [];
  }

  /**
   * Apply validation rule
   */
  async applyRule(data, rule) {
    try {
      const result = await rule.check(data);
      
      if (result.valid === false) {
        return {
          valid: false,
          errors: [rule.errorMessage],
          warnings: result.warnings || []
        };
      }
      
      return { valid: true, warnings: result.warnings };
    } catch (error) {
      return {
        valid: false,
        errors: [`Rule check failed: ${error.message}`]
      };
    }
  }

  /**
   * Check required fields
   */
  checkRequiredFields(data, requiredFields) {
    if (!data || typeof data !== 'object') {
      return { valid: false };
    }

    const missingFields = requiredFields.filter(field => !(field in data) || data[field] === null || data[field] === undefined);
    
    if (missingFields.length > 0) {
      return { valid: false, warnings: [`Missing fields: ${missingFields.join(', ')}`] };
    }
    
    return { valid: true };
  }

  /**
   * Check item structure for orders
   */
  checkItemStructure(data) {
    if (!data.items || !Array.isArray(data.items)) {
      return { valid: false };
    }

    for (const item of data.items) {
      if (!item.id || !item.name || !item.price || !item.quantity) {
        return { valid: false, warnings: [`Invalid item: ${JSON.stringify(item)}`] };
      }
    }

    return { valid: true };
  }

  /**
   * Check total calculation
   */
  checkTotalCalculation(data) {
    if (!data.items || !Array.isArray(data.items)) {
      return { valid: false };
    }

    const calculatedTotal = data.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const tolerance = 0.01;
    const diff = Math.abs(calculatedTotal - (data.total || 0));

    if (diff > tolerance) {
      return { 
        valid: false, 
        warnings: [`Total mismatch: calculated ${calculatedTotal}, stored ${data.total}`] 
      };
    }

    return { valid: true };
  }

  /**
   * Check status validity
   */
  checkStatusValidity(data) {
    const validStatuses = ['NEW', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
    
    if (!data.status || !validStatuses.includes(data.status)) {
      return { valid: false, warnings: [`Invalid status: ${data.status}`] };
    }

    return { valid: true };
  }

  /**
   * Check quantity is non-negative
   */
  checkQuantityNonNegative(data) {
    if (data.quantity < 0) {
      return { valid: false, warnings: [`Negative quantity: ${data.quantity}`] };
    }
    return { valid: true };
  }

  /**
   * Check price is positive
   */
  checkPricePositive(data) {
    if (data.price <= 0) {
      return { valid: false, warnings: [`Invalid price: ${data.price}`] };
    }
    return { valid: true };
  }

  /**
   * Check phone format
   */
  checkPhoneFormat(data) {
    const phoneRegex = /^[0-9]{10}$/;
    
    if (!phoneRegex.test(data.phone)) {
      return { valid: false, warnings: [`Invalid phone format: ${data.phone}`] };
    }

    return { valid: true };
  }

  /**
   * Repair data based on rule
   */
  async repairData(data, rule, validationResult) {
    try {
      let repairedData = { ...data };
      const repairLog = [];

      // Create backup before repair if enabled
      if (this.config.createBackupBeforeRepair) {
        await this.createBackup(data, rule.name);
      }

      switch (rule.name) {
        case 'item_structure':
          repairedData = await this.repairItemStructure(data);
          repairLog.push('Repaired item structure');
          break;
          
        case 'total_calculation':
          repairedData = await this.repairTotalCalculation(data);
          repairLog.push('Recalculated total');
          break;
          
        case 'quantity_non_negative':
          repairedData = await this.repairQuantity(data);
          repairLog.push('Set negative quantity to 0');
          break;
          
        case 'price_positive':
          repairedData = await this.repairPrice(data);
          repairLog.push('Set invalid price to default');
          break;
          
        default:
          return { repaired: false, data };
      }

      return {
        repaired: true,
        data: repairedData,
        repairLog
      };
    } catch (error) {
      console.error(`[DataValidator] Repair failed for ${rule.name}:`, error);
      return { repaired: false, data };
    }
  }

  /**
   * Repair item structure
   */
  async repairItemStructure(data) {
    const repairedItems = (data.items || []).map(item => ({
      id: item.id || `item_${Date.now()}`,
      name: item.name || 'Unknown Item',
      price: item.price || 0,
      quantity: item.quantity || 1
    }));

    return { ...data, items: repairedItems };
  }

  /**
   * Repair total calculation
   */
  async repairTotalCalculation(data) {
    const calculatedTotal = (data.items || []).reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    return { ...data, total: calculatedTotal };
  }

  /**
   * Repair quantity
   */
  async repairQuantity(data) {
    return { ...data, quantity: Math.max(0, data.quantity) };
  }

  /**
   * Repair price
   */
  async repairPrice(data) {
    return { ...data, price: Math.max(0, data.price) || 0 };
  }

  /**
   * Create backup before repair
   */
  async createBackup(data, reason) {
    try {
      const backupKey = `repair_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        data,
        reason,
        timestamp: new Date().toISOString()
      }));
      
      // Keep only last 10 repair backups
      this.cleanupOldBackups('repair_backup_');
      
      console.log(`[DataValidator] Created backup: ${backupKey}`);
    } catch (error) {
      console.error('[DataValidator] Failed to create backup:', error);
    }
  }

  /**
   * Cleanup old backups
   */
  cleanupOldBackups(prefix, keepCount = 10) {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }
    
    // Sort by timestamp (embedded in key)
    keys.sort().reverse();
    
    // Remove old backups
    keys.slice(keepCount).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Calculate checksum
   */
  async calculateChecksum(data) {
    try {
      const dataString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('[DataValidator] Checksum calculation failed:', error);
      return null;
    }
  }

  /**
   * Verify data integrity using checksum
   */
  async verifyIntegrity(dataType, data) {
    const storedChecksum = this.checksums.get(dataType);
    
    if (!storedChecksum) {
      return { valid: true, message: 'No stored checksum to compare' };
    }

    const currentChecksum = await this.calculateChecksum(data);
    
    if (currentChecksum === storedChecksum) {
      return { valid: true, message: 'Checksum matches' };
    }

    return { 
      valid: false, 
      message: 'Checksum mismatch - data may be corrupted',
      stored: storedChecksum,
      current: currentChecksum
    };
  }

  /**
   * Validate all critical data
   */
  async validateAllData() {
    const results = {};
    
    const dataTypes = ['orders', 'inventory', 'customers'];
    
    for (const dataType of dataTypes) {
      try {
        const storageKey = `cafeos_${dataType}`;
        const data = localStorage.getItem(storageKey);
        
        if (data) {
          const parsedData = JSON.parse(data);
          results[dataType] = await this.validate(dataType, parsedData);
        } else {
          results[dataType] = { valid: true, message: 'No data to validate' };
        }
      } catch (error) {
        results[dataType] = { valid: false, error: error.message };
      }
    }

    return results;
  }

  /**
   * Record validation
   */
  recordValidation(record) {
    this.validationHistory.push(record);
    
    // Keep only last 100 validations
    if (this.validationHistory.length > 100) {
      this.validationHistory.shift();
    }
  }

  /**
   * Get validation history
   */
  getValidationHistory(filters = {}) {
    let history = [...this.validationHistory];

    if (filters.dataType) {
      history = history.filter(h => h.dataType === filters.dataType);
    }

    if (filters.since) {
      history = history.filter(h => new Date(h.timestamp) >= new Date(filters.since));
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Get checksums
   */
  getChecksums() {
    return Object.fromEntries(this.checksums);
  }

  /**
   * Clear checksums
   */
  clearChecksums() {
    this.checksums.clear();
  }

  /**
   * Destroy the data validator
   */
  destroy() {
    this.validationHistory = [];
    this.checksums.clear();
    console.log('[DataValidator] Destroyed');
  }
}

// Singleton instance
let dataValidatorInstance = null;

/**
 * Get the singleton data validator instance
 */
export function getDataValidator() {
  if (!dataValidatorInstance) {
    dataValidatorInstance = new DataValidator();
  }
  return dataValidatorInstance;
}

export default DataValidator;
