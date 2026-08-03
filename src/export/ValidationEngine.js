// Validation Engine
// Data validation for imports

import { ValidationErrorType } from './ExportTypes.js';

export class ValidationEngine {
  constructor() {
    this.schemas = new Map();
    this.initializeDefaultSchemas();
  }

  /**
   * Initialize default validation schemas
   */
  initializeDefaultSchemas() {
    // Customer schema
    this.schemas.set('customer', {
      requiredFields: ['name', 'phone'],
      optionalFields: ['email', 'address', 'city', 'region', 'postalCode', 'taxId'],
      fieldTypes: {
        name: 'string',
        phone: 'string',
        email: 'email',
        taxId: 'string'
      },
      fieldFormats: {
        phone: /^[0-9+\-\s()]{10,20}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    });

    // Product schema
    this.schemas.set('product', {
      requiredFields: ['name', 'code'],
      optionalFields: ['price', 'cost', 'quantity', 'category', 'taxRate'],
      fieldTypes: {
        name: 'string',
        code: 'string',
        price: 'number',
        cost: 'number',
        quantity: 'number',
        taxRate: 'number'
      },
      fieldRanges: {
        price: { min: 0 },
        cost: { min: 0 },
        quantity: { min: 0 },
        taxRate: { min: 0, max: 100 }
      }
    });

    // Order schema
    this.schemas.set('order', {
      requiredFields: ['id', 'customerId', 'totalAmount'],
      optionalFields: ['tableId', 'createdAt', 'taxAmount', 'discountAmount'],
      fieldTypes: {
        id: 'string',
        customerId: 'string',
        tableId: 'string',
        totalAmount: 'number',
        taxAmount: 'number',
        discountAmount: 'number'
      },
      fieldRanges: {
        totalAmount: { min: 0 },
        taxAmount: { min: 0 },
        discountAmount: { min: 0 }
      }
    });

    // Staff schema
    this.schemas.set('staff', {
      requiredFields: ['name', 'position'],
      optionalFields: ['email', 'phone', 'section'],
      fieldTypes: {
        name: 'string',
        position: 'string',
        email: 'email',
        phone: 'string'
      }
    });

    // Table schema
    this.schemas.set('table', {
      requiredFields: ['number', 'seats'],
      optionalFields: ['area', 'section'],
      fieldTypes: {
        number: 'string',
        seats: 'number',
        area: 'string'
      },
      fieldRanges: {
        seats: { min: 1 }
      }
    });
  }

  /**
   * Validate data against schema
   * @param {Array} data - Data to validate
   * @param {string} schemaName - Schema name
   * @param {object} customSchema - Custom schema (optional)
   * @returns {object} Validation result
   */
  validate(data, schemaName, customSchema = null) {
    const schema = customSchema || this.schemas.get(schemaName);
    const errors = [];
    const warnings = [];

    if (!schema) {
      return {
        valid: false,
        errors: [{ type: ValidationErrorType.UNSUPPORTED_VERSION, message: `Schema not found: ${schemaName}` }],
        warnings
      };
    }

    if (!Array.isArray(data)) {
      return {
        valid: false,
        errors: [{ type: ValidationErrorType.INCORRECT_FORMAT, message: 'Data must be an array' }],
        warnings
      };
    }

    data.forEach((record, index) => {
      const rowErrors = this.validateRecord(record, schema, index + 1);
      errors.push(...rowErrors);
    });

    // Check for duplicate IDs
    const duplicateErrors = this.checkDuplicateIds(data, schema);
    errors.push(...duplicateErrors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      recordCount: data.length,
      errorCount: errors.length,
      warningCount: warnings.length
    };
  }

  /**
   * Validate a single record
   * @param {object} record - Record to validate
   * @param {object} schema - Validation schema
   * @param {number} row - Row number
   * @returns {Array} Validation errors
   */
  validateRecord(record, schema, row) {
    const errors = [];

    // Check required fields
    schema.requiredFields?.forEach(field => {
      if (!record[field] || record[field] === '') {
        errors.push({
          type: ValidationErrorType.MISSING_REQUIRED_FIELD,
          row,
          field,
          message: `Missing required field: ${field}`
        });
      }
    });

    // Check field types
    Object.keys(schema.fieldTypes || {}).forEach(field => {
      const expectedType = schema.fieldTypes[field];
      const value = record[field];

      if (value !== null && value !== undefined && value !== '') {
        if (!this.checkFieldType(value, expectedType)) {
          errors.push({
            type: ValidationErrorType.INCORRECT_FORMAT,
            row,
            field,
            message: `Invalid type for ${field}: expected ${expectedType}`
          });
        }
      }
    });

    // Check field formats
    Object.keys(schema.fieldFormats || {}).forEach(field => {
      const format = schema.fieldFormats[field];
      const value = record[field];

      if (value && !format.test(String(value))) {
        errors.push({
          type: ValidationErrorType.INCORRECT_FORMAT,
          row,
          field,
          message: `Invalid format for ${field}`
        });
      }
    });

    // Check field ranges
    Object.keys(schema.fieldRanges || {}).forEach(field => {
      const range = schema.fieldRanges[field];
      const value = record[field];

      if (value !== null && value !== undefined && value !== '') {
        const numValue = Number(value);

        if (isNaN(numValue)) {
          errors.push({
            type: ValidationErrorType.INVALID_NUMBER,
            row,
            field,
            message: `Invalid number for ${field}`
          });
        } else {
          if (range.min !== undefined && numValue < range.min) {
            errors.push({
              type: ValidationErrorType.INVALID_NUMBER,
              row,
              field,
              message: `${field} must be at least ${range.min}`
            });
          }
          if (range.max !== undefined && numValue > range.max) {
            errors.push({
              type: ValidationErrorType.INVALID_NUMBER,
              row,
              field,
              message: `${field} must be at most ${range.max}`
            });
          }
        }
      }
    });

    // Check for invalid dates
    Object.keys(record).forEach(field => {
      if (field.toLowerCase().includes('date') || field.toLowerCase().includes('time') || field.toLowerCase().includes('at')) {
        const value = record[field];
        if (value && !this.isValidDate(value)) {
          errors.push({
            type: ValidationErrorType.INVALID_DATE,
            row,
            field,
            message: `Invalid date format for ${field}`
          });
        }
      }
    });

    return errors;
  }

  /**
   * Check field type
   * @param {any} value - Value to check
   * @param {string} expectedType - Expected type
   * @returns {boolean} Type match
   */
  checkFieldType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return !isNaN(Number(value));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      default:
        return true;
    }
  }

  /**
   * Check if value is a valid date
   * @param {any} value - Value to check
   * @returns {boolean} Date validity
   */
  isValidDate(value) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * Check for duplicate IDs
   * @param {Array} data - Data to check
   * @param {object} schema - Schema
   * @returns {Array} Duplicate errors
   */
  checkDuplicateIds(data, schema) {
    const errors = [];
    const idField = schema.idField || 'id';
    const seenIds = new Set();

    data.forEach((record, index) => {
      const id = record[idField];
      
      if (id) {
        if (seenIds.has(id)) {
          errors.push({
            type: ValidationErrorType.DUPLICATE_ID,
            row: index + 1,
            field: idField,
            message: `Duplicate ID: ${id}`
          });
        }
        seenIds.add(id);
      }
    });

    return errors;
  }

  /**
   * Add custom schema
   * @param {string} name - Schema name
   * @param {object} schema - Schema definition
   */
  addSchema(name, schema) {
    this.schemas.set(name, schema);
  }

  /**
   * Get schema
   * @param {string} name - Schema name
   * @returns {object|null} Schema
   */
  getSchema(name) {
    return this.schemas.get(name) || null;
  }

  /**
   * Get all schemas
   * @returns {object} All schemas
   */
  getAllSchemas() {
    return Object.fromEntries(this.schemas);
  }

  /**
   * Validate columns
   * @param {Array} headers - Column headers
   * @param {string} schemaName - Schema name
   * @returns {object} Validation result
   */
  validateColumns(headers, schemaName) {
    const schema = this.schemas.get(schemaName);
    const errors = [];
    const warnings = [];

    if (!schema) {
      return {
        valid: false,
        errors: [{ type: ValidationErrorType.UNSUPPORTED_VERSION, message: `Schema not found: ${schemaName}` }],
        warnings
      };
    }

    // Check for missing required columns
    schema.requiredFields?.forEach(field => {
      if (!headers.includes(field)) {
        errors.push({
          type: ValidationErrorType.MISSING_COLUMN,
          field,
          message: `Missing required column: ${field}`
        });
      }
    });

    // Check for unknown columns
    const knownFields = [...(schema.requiredFields || []), ...(schema.optionalFields || [])];
    headers.forEach(header => {
      if (!knownFields.includes(header)) {
        warnings.push({
          type: 'unknown_column',
          field: header,
          message: `Unknown column: ${header}`
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingColumns: errors.length,
      unknownColumns: warnings.length
    };
  }

  /**
   * Destroy the validation engine
   */
  destroy() {
    this.schemas.clear();
    console.log('[ValidationEngine] Destroyed');
  }
}

// Singleton instance
let validationEngineInstance = null;

/**
 * Get the singleton validation engine instance
 * @returns {ValidationEngine} Validation engine instance
 */
export function getValidationEngine() {
  if (!validationEngineInstance) {
    validationEngineInstance = new ValidationEngine();
  }
  return validationEngineInstance;
}

export default ValidationEngine;
