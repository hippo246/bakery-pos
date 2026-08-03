// Storage Types and Naming Strategy
// Centralized storage type definitions and file naming conventions

/**
 * Storage Types
 * Defines all document types that can be stored
 */
export const STORAGE_TYPES = {
  BACKUP: 'backup',
  EXPORT: 'export',
  REPORT: 'report',
  MEDIA: 'media',
  RECEIPT: 'receipt',
  INVOICE: 'invoice',
  PURCHASE_ORDER: 'purchase_order',
  PRODUCTION_SHEET: 'production_sheet',
  MENU_IMAGE: 'menu_image',
  STAFF_PHOTO: 'staff_photo',
  BUSINESS_LOGO: 'business_logo',
  ATTACHMENT: 'attachment',
  LOG: 'log',
  TEMPORARY: 'temporary'
};

/**
 * Storage Type Metadata
 * Additional information about each storage type
 */
export const STORAGE_TYPE_METADATA = {
  [STORAGE_TYPES.BACKUP]: {
    directory: 'backups',
    extensions: ['.json', '.zip', '.enc'],
    maxSize: 1073741824, // 1GB
    retention: '90d',
    compression: true,
    encryption: true
  },
  [STORAGE_TYPES.EXPORT]: {
    directory: 'exports',
    extensions: ['.csv', '.json', '.pdf', '.zip'],
    maxSize: 52428800, // 50MB
    retention: '30d',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.REPORT]: {
    directory: 'reports',
    extensions: ['.pdf', '.csv', '.json'],
    maxSize: 10485760, // 10MB
    retention: '90d',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.MEDIA]: {
    directory: 'media',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    maxSize: 10485760, // 10MB
    retention: 'permanent',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.RECEIPT]: {
    directory: 'receipts',
    extensions: ['.pdf', '.png', '.jpg'],
    maxSize: 2097152, // 2MB
    retention: '365d',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.INVOICE]: {
    directory: 'invoices',
    extensions: ['.pdf', '.json'],
    maxSize: 5242880, // 5MB
    retention: '7y',
    compression: false,
    encryption: true
  },
  [STORAGE_TYPES.PURCHASE_ORDER]: {
    directory: 'purchase_orders',
    extensions: ['.pdf', '.json'],
    maxSize: 5242880, // 5MB
    retention: '5y',
    compression: false,
    encryption: true
  },
  [STORAGE_TYPES.PRODUCTION_SHEET]: {
    directory: 'production',
    extensions: ['.pdf', '.json'],
    maxSize: 1048576, // 1MB
    retention: '1y',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.MENU_IMAGE]: {
    directory: 'media/menu',
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5242880, // 5MB
    retention: 'permanent',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.STAFF_PHOTO]: {
    directory: 'media/staff',
    extensions: ['.jpg', '.jpeg', '.png'],
    maxSize: 2097152, // 2MB
    retention: 'permanent',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.BUSINESS_LOGO]: {
    directory: 'media/business',
    extensions: ['.png', '.svg', '.jpg'],
    maxSize: 2097152, // 2MB
    retention: 'permanent',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.ATTACHMENT]: {
    directory: 'attachments',
    extensions: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'],
    maxSize: 10485760, // 10MB
    retention: '1y',
    compression: false,
    encryption: false
  },
  [STORAGE_TYPES.LOG]: {
    directory: 'logs',
    extensions: ['.json', '.log', '.txt'],
    maxSize: 1048576, // 1MB
    retention: '30d',
    compression: true,
    encryption: false
  },
  [STORAGE_TYPES.TEMPORARY]: {
    directory: 'temp',
    extensions: ['.tmp', '.part'],
    maxSize: 104857600, // 100MB
    retention: '1h',
    compression: false,
    encryption: false
  }
};

/**
 * Naming Strategy
 * Centralized file naming conventions
 */
class NamingStrategy {
  /**
   * Generate a unique filename
   * @param {string} storageType 
   * @param {object} options 
   * @returns {string}
   */
  static generateFilename(storageType, options = {}) {
    const metadata = STORAGE_TYPE_METADATA[storageType];
    if (!metadata) {
      throw new Error(`Unknown storage type: ${storageType}`);
    }

    const parts = [];

    // Add timestamp
    if (options.timestamp !== false) {
      parts.push(this.getTimestamp(options.timestampFormat));
    }

    // Add business ID if provided
    if (options.businessId) {
      parts.push(`biz_${options.businessId}`);
    }

    // Add entity ID if provided
    if (options.entityId) {
      parts.push(`id_${options.entityId}`);
    }

    // Add category if provided
    if (options.category) {
      parts.push(options.category);
    }

    // Add custom suffix if provided
    if (options.suffix) {
      parts.push(options.suffix);
    }

    // Add random string for uniqueness
    if (options.unique !== false) {
      parts.push(this.getRandomString(options.randomLength || 8));
    }

    const filename = parts.join('_');
    const extension = options.extension || metadata.extensions[0];

    return `${filename}${extension}`;
  }

  /**
   * Get timestamp string
   * @param {string} format 
   * @returns {string}
   */
  static getTimestamp(format = 'iso') {
    const now = new Date();

    switch (format) {
      case 'iso':
        return now.toISOString().replace(/[:.]/g, '-');
      case 'date':
        return now.toISOString().split('T')[0];
      case 'time':
        return now.toISOString().split('T')[1].replace(/[:.]/g, '-');
      case 'unix':
        return String(Math.floor(now.getTime() / 1000));
      case 'compact':
        return now.toISOString().replace(/[-:.]/g, '').replace('T', '');
      default:
        return now.toISOString().replace(/[:.]/g, '-');
    }
  }

  /**
   * Get random string
   * @param {number} length 
   * @returns {string}
   */
  static getRandomString(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a storage key
   * @param {string} storageType 
   * @param {string} filename 
   * @param {object} options 
   * @returns {string}
   */
  static generateKey(storageType, filename, options = {}) {
    const metadata = STORAGE_TYPE_METADATA[storageType];
    if (!metadata) {
      throw new Error(`Unknown storage type: ${storageType}`);
    }

    const parts = [metadata.directory];

    // Add subdirectory if provided
    if (options.subdirectory) {
      parts.push(options.subdirectory);
    }

    // Add date-based subdirectory if enabled
    if (options.dateSubdirectory) {
      parts.push(this.getTimestamp('date'));
    }

    parts.push(filename);

    return parts.join('/');
  }

  /**
   * Parse a storage key
   * @param {string} key 
   * @returns {object}
   */
  static parseKey(key) {
    const parts = key.split('/');
    const filename = parts[parts.length - 1];
    const directory = parts.slice(0, -1).join('/');

    return {
      directory,
      filename,
      extension: filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '',
      nameWithoutExtension: filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename
    };
  }

  /**
   * Validate filename
   * @param {string} filename 
   * @returns {boolean}
   */
  static validateFilename(filename) {
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/;
    if (invalidChars.test(filename)) {
      return false;
    }

    const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
    if (reservedNames.test(filename.split('.')[0])) {
      return false;
    }

    if (filename.length > 255) {
      return false;
    }

    return true;
  }

  /**
   * Sanitize filename
   * @param {string} filename 
   * @returns {string}
   */
  static sanitizeFilename(filename) {
    return filename
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  }
}

export default NamingStrategy;
