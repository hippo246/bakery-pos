// Directory Structure Abstraction
// Centralized directory management for storage operations

import { STORAGE_TYPE_METADATA } from './StorageTypes.js';

/**
 * Directory Structure Manager
 * Provides logical directory abstraction independent of provider
 */
class DirectoryStructure {
  constructor() {
    this.basePath = '';
    this.directories = this.initializeDirectories();
  }

  /**
   * Initialize directory structure
   * @returns {object}
   */
  initializeDirectories() {
    return {
      backups: 'backups',
      exports: 'exports',
      reports: 'reports',
      receipts: 'receipts',
      media: 'media',
      attachments: 'attachments',
      imports: 'imports',
      logs: 'logs',
      business: 'business',
      staff: 'staff',
      inventory: 'inventory',
      temp: 'temp',
      // Subdirectories
      'media/menu': 'media/menu',
      'media/staff': 'media/staff',
      'media/business': 'media/business',
      'invoices': 'invoices',
      'purchase_orders': 'purchase_orders',
      'production': 'production'
    };
  }

  /**
   * Get directory for storage type
   * @param {string} storageType 
   * @returns {string}
   */
  getDirectoryForType(storageType) {
    const metadata = STORAGE_TYPE_METADATA[storageType];
    if (!metadata) {
      throw new Error(`Unknown storage type: ${storageType}`);
    }
    return metadata.directory;
  }

  /**
   * Get full path for storage type
   * @param {string} storageType 
   * @param {object} options 
   * @returns {string}
   */
  getPathForType(storageType, options = {}) {
    const directory = this.getDirectoryForType(storageType);
    const parts = [this.basePath, directory];

    // Add subdirectory if provided
    if (options.subdirectory) {
      parts.push(options.subdirectory);
    }

    // Add date-based subdirectory if enabled
    if (options.dateSubdirectory) {
      parts.push(this.getDatePath());
    }

    // Add business ID if provided
    if (options.businessId) {
      parts.push(`biz_${options.businessId}`);
    }

    // Add entity ID if provided
    if (options.entityId) {
      parts.push(`id_${options.entityId}`);
    }

    return parts.filter(Boolean).join('/');
  }

  /**
   * Get date-based path
   * @param {Date} date 
   * @returns {string}
   */
  getDatePath(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * Get month-based path
   * @param {Date} date 
   * @returns {string}
   */
  getMonthPath(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}/${month}`;
  }

  /**
   * Get year-based path
   * @param {Date} date 
   * @returns {string}
   */
  getYearPath(date = new Date()) {
    return String(date.getFullYear());
  }

  /**
   * Join path parts
   * @param {Array<string>} parts 
   * @returns {string}
   */
  join(...parts) {
    return parts.filter(Boolean).join('/');
  }

  /**
   * Normalize path
   * @param {string} path 
   * @returns {string}
   */
  normalize(path) {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  /**
   * Get parent directory
   * @param {string} path 
   * @returns {string}
   */
  getParent(path) {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }

  /**
   * Get basename from path
   * @param {string} path 
   * @returns {string}
   */
  getBasename(path) {
    const parts = path.split('/');
    return parts[parts.length - 1];
  }

  /**
   * Get dirname from path
   * @param {string} path 
   * @returns {string}
   */
  getDirname(path) {
    const parts = path.split('/');
    parts.pop();
    return parts.join('/');
  }

  /**
   * Check if path is a directory
   * @param {string} path 
   * @returns {boolean}
   */
  isDirectory(path) {
    return !path.includes('.') || path.endsWith('/');
  }

  /**
   * Check if path is a file
   * @param {string} path 
   * @returns {boolean}
   */
  isFile(path) {
    return path.includes('.') && !path.endsWith('/');
  }

  /**
   * Get relative path
   * @param {string} from 
   * @param {string} to 
   * @returns {string}
   */
  getRelativePath(from, to) {
    const fromParts = from.split('/').filter(Boolean);
    const toParts = to.split('/').filter(Boolean);

    // Find common prefix
    let commonLength = 0;
    for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
      if (fromParts[i] === toParts[i]) {
        commonLength++;
      } else {
        break;
      }
    }

    // Build relative path
    const upCount = fromParts.length - commonLength;
    const relativeParts = [];

    for (let i = 0; i < upCount; i++) {
      relativeParts.push('..');
    }

    for (let i = commonLength; i < toParts.length; i++) {
      relativeParts.push(toParts[i]);
    }

    return relativeParts.join('/') || '.';
  }

  /**
   * Validate path
   * @param {string} path 
   * @returns {boolean}
   */
  validatePath(path) {
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"|?*\x00-\x1F]/;
    if (invalidChars.test(path)) {
      return false;
    }

    if (path.startsWith('/') || /^[A-Za-z]:/.test(path)) {
      return false;
    }

    if (path.includes('..')) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize path
   * @param {string} path 
   * @returns {string}
   */
  sanitizePath(path) {
    return path
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"|?*\x00-\x1F]/g, '_')
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/\.\./g, '_');
  }

  /**
   * Set base path
   * @param {string} path 
   */
  setBasePath(path) {
    this.basePath = path;
  }

  /**
   * Get base path
   * @returns {string}
   */
  getBasePath() {
    return this.basePath;
  }

  /**
   * Get all directories
   * @returns {Array<string>}
   */
  getAllDirectories() {
    return Object.values(this.directories);
  }

  /**
   * Create directory structure for provider
   * @param {object} provider 
   * @returns {Promise<Array<{path: string, success: boolean, error?: string}>>}
   */
  async ensureDirectoryStructure() {
    const results = [];
    
    for (const directory of this.getAllDirectories()) {
      try {
        // Most cloud providers don't require explicit directory creation
        // This is a placeholder for providers that do
        results.push({
          path: directory,
          success: true
        });
      } catch (error) {
        results.push({
          path: directory,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

// Singleton instance
const directoryStructure = new DirectoryStructure();

export default directoryStructure;
