// Export/Import Types and Enums
// Defines all export/import types, statuses, and related constants

/**
 * Export Format Enum
 */
export const ExportFormat = {
  CSV: 'csv',
  JSON: 'json',
  PDF: 'pdf',
  EXCEL: 'xlsx',
  ZIP: 'zip',
  ENCRYPTED: 'encrypted'
};

/**
 * Import Format Enum
 */
export const ImportFormat = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'xlsx',
  ZIP: 'zip',
  CAFEOS: 'cafeos'
};

/**
 * Export Status Enum
 */
export const ExportStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Import Status Enum
 */
export const ImportStatus = {
  PENDING: 'pending',
  VALIDATING: 'validating',
  DETECTING: 'detecting',
  MAPPING: 'mapping',
  PREVIEWING: 'previewing',
  IMPORTING: 'importing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Destination Type Enum
 */
export const DestinationType = {
  DOWNLOAD: 'download',
  LOCAL_STORAGE: 'local_storage',
  CLOUD_PROVIDER: 'cloud_provider',
  BACKUP_PACKAGE: 'backup_package',
  TEMPORARY: 'temporary'
};

/**
 * Module Enum
 */
export const Module = {
  ORDERS: 'orders',
  KITCHEN: 'kitchen',
  WAITERS: 'waiters',
  TABLES: 'tables',
  RESERVATIONS: 'reservations',
  INVENTORY: 'inventory',
  PURCHASING: 'purchasing',
  PRODUCTION: 'production',
  CRM: 'crm',
  CUSTOMERS: 'customers',
  STAFF: 'staff',
  ANALYTICS: 'analytics',
  PERFORMANCE_DESK: 'performance_desk',
  REPORTS: 'reports',
  RECEIPTS: 'receipts',
  ACTIVITY_FEED: 'activity_feed',
  AUDIT_LOGS: 'audit_logs',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  ATTACHMENTS: 'attachments',
  BUSINESS_PROFILE: 'business_profile'
};

/**
 * Conflict Resolution Action Enum
 */
export const ConflictResolutionAction = {
  SKIP: 'skip',
  REPLACE: 'replace',
  MERGE: 'merge',
  RENAME: 'rename',
  MANUAL_REVIEW: 'manual_review'
};

/**
 * Conflict Type Enum
 */
export const ConflictType = {
  DUPLICATE_ID: 'duplicate_id',
  DUPLICATE_NAME: 'duplicate_name',
  DUPLICATE_ORDER: 'duplicate_order',
  DUPLICATE_CUSTOMER: 'duplicate_customer',
  DUPLICATE_STAFF: 'duplicate_staff',
  DUPLICATE_PRODUCT: 'duplicate_product',
  DUPLICATE_TABLE: 'duplicate_table',
  DUPLICATE_SUPPLIER: 'duplicate_supplier',
  DUPLICATE_SETTING: 'duplicate_setting'
};

/**
 * Validation Error Type Enum
 */
export const ValidationErrorType = {
  MISSING_COLUMN: 'missing_column',
  DUPLICATE_ID: 'duplicate_id',
  INVALID_DATE: 'invalid_date',
  BROKEN_REFERENCE: 'broken_reference',
  INVALID_NUMBER: 'invalid_number',
  MISSING_REQUIRED_FIELD: 'missing_required_field',
  INCORRECT_FORMAT: 'incorrect_format',
  UNSUPPORTED_VERSION: 'unsupported_version'
};

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG = {
  format: ExportFormat.CSV,
  destination: DestinationType.DOWNLOAD,
  compression: false,
  encryption: false,
  includeHeaders: true,
  dateFormat: 'ISO',
  numberFormat: 'decimal'
};

/**
 * Default import configuration
 */
export const DEFAULT_IMPORT_CONFIG = {
  autoDetectFormat: true,
  skipDuplicates: false,
  updateExisting: false,
  validateBeforeImport: true,
  chunkSize: 1000
};
