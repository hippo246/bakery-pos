// Export/Import Interface
// Base interface for all export and import operations

import { ExportFormat, ImportFormat, ExportStatus, ImportStatus } from './ExportTypes.js';

/**
 * Base Export Interface
 * All export implementations must extend this interface
 */
export class ExportInterface {
  constructor(config = {}) {
    this.format = config.format || ExportFormat.CSV;
    this.module = config.module || null;
    this.status = ExportStatus.PENDING;
    this.progress = 0;
    this.createdAt = config.createdAt || new Date().toISOString();
    this.metadata = config.metadata || {};
  }

  /**
   * Initialize the export
   * @returns {Promise<object>} Initialization result
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Prepare data for export
   * @param {object} data - Data to prepare
   * @returns {Promise<object>} Prepared data
   */
  async prepareData(data) {
    throw new Error('prepareData() must be implemented by subclass');
  }

  /**
   * Export data
   * @param {object} data - Data to export
   * @returns {Promise<object>} Export result
   */
  async export(data) {
    throw new Error('export() must be implemented by subclass');
  }

  /**
   * Get export status
   * @returns {ExportStatus} Export status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get export progress
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    return this.progress;
  }

  /**
   * Update progress
   * @param {number} progress - Progress percentage
   * @param {string} message - Progress message
   */
  updateProgress(progress, message = '') {
    this.progress = Math.min(100, Math.max(0, progress));
    if (message) {
      this.metadata.message = message;
    }
  }

  /**
   * Cancel export
   * @returns {Promise<object>} Cancellation result
   */
  async cancel() {
    this.status = ExportStatus.CANCELLED;
    return { success: true };
  }

  /**
   * Get metadata
   * @returns {object} Metadata
   */
  getMetadata() {
    return {
      format: this.format,
      module: this.module,
      status: this.status,
      progress: this.progress,
      createdAt: this.createdAt,
      ...this.metadata
    };
  }

  /**
   * Validate export configuration
   * @returns {object} Validation result
   */
  validate() {
    throw new Error('validate() must be implemented by subclass');
  }
}

/**
 * Base Import Interface
 * All import implementations must extend this interface
 */
export class ImportInterface {
  constructor(config = {}) {
    this.format = config.format || ImportFormat.CSV;
    this.module = config.module || null;
    this.status = ImportStatus.PENDING;
    this.progress = 0;
    this.createdAt = config.createdAt || new Date().toISOString();
    this.metadata = config.metadata || {};
  }

  /**
   * Initialize the import
   * @returns {Promise<object>} Initialization result
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Detect format from file
   * @param {File} file - File to detect
   * @returns {Promise<object>} Detection result
   */
  async detectFormat(file) {
    throw new Error('detectFormat() must be implemented by subclass');
  }

  /**
   * Parse file
   * @param {File} file - File to parse
   * @returns {Promise<object>} Parsed data
   */
  async parseFile(file) {
    throw new Error('parseFile() must be implemented by subclass');
  }

  /**
   * Validate data
   * @param {object} data - Data to validate
   * @returns {Promise<object>} Validation result
   */
  async validateData(data) {
    throw new Error('validateData() must be implemented by subclass');
  }

  /**
   * Map fields
   * @param {object} data - Data to map
   * @param {object} fieldMapping - Field mapping
   * @returns {object} Mapped data
   */
  mapFields(data, fieldMapping) {
    throw new Error('mapFields() must be implemented by subclass');
  }

  /**
   * Detect conflicts
   * @param {object} data - Data to check
   * @returns {Promise<object>} Conflict detection result
   */
  async detectConflicts(data) {
    throw new Error('detectConflicts() must be implemented by subclass');
  }

  /**
   * Import data
   * @param {object} data - Data to import
   * @param {object} options - Import options
   * @returns {Promise<object>} Import result
   */
  async import(data, options = {}) {
    throw new Error('import() must be implemented by subclass');
  }

  /**
   * Get import status
   * @returns {ImportStatus} Import status
   */
  getStatus() {
    return this.status;
  }

  /**
   * Get import progress
   * @returns {number} Progress percentage (0-100)
   */
  getProgress() {
    return this.progress;
  }

  /**
   * Update progress
   * @param {number} progress - Progress percentage
   * @param {string} message - Progress message
   */
  updateProgress(progress, message = '') {
    this.progress = Math.min(100, Math.max(0, progress));
    if (message) {
      this.metadata.message = message;
    }
  }

  /**
   * Cancel import
   * @returns {Promise<object>} Cancellation result
   */
  async cancel() {
    this.status = ImportStatus.CANCELLED;
    return { success: true };
  }

  /**
   * Get metadata
   * @returns {object} Metadata
   */
  getMetadata() {
    return {
      format: this.format,
      module: this.module,
      status: this.status,
      progress: this.progress,
      createdAt: this.createdAt,
      ...this.metadata
    };
  }

  /**
   * Validate import configuration
   * @returns {object} Validation result
   */
  validate() {
    throw new Error('validate() must be implemented by subclass');
  }
}
