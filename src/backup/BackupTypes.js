// Backup Types and Enums
// Defines all backup types, statuses, and related constants

/**
 * Backup Type Enum
 * Defines the different types of backups supported
 */
export const BackupType = {
  FULL: 'full',
  INCREMENTAL: 'incremental',
  DIFFERENTIAL: 'differential',
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  EMERGENCY: 'emergency',
  PRE_UPDATE: 'pre_update',
  PRE_RESTORE: 'pre_restore',
  SNAPSHOT: 'snapshot'
};

/**
 * Backup Status Enum
 * Defines the possible states of a backup
 */
export const BackupStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  VERIFYING: 'verifying',
  UPLOADED: 'uploaded',
  CORRUPTED: 'corrupted',
  ARCHIVED: 'archived'
};

/**
 * Backup Health Enum
 * Defines the health status of a backup
 */
export const BackupHealth = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

/**
 * Module Enum
 * Defines all CafeOS modules that can be backed up
 */
export const BackupModule = {
  ORDERS: 'orders',
  KITCHEN: 'kitchen',
  INVENTORY: 'inventory',
  RESERVATIONS: 'reservations',
  CRM: 'crm',
  CUSTOMERS: 'customers',
  STAFF: 'staff',
  PRODUCTION: 'production',
  PURCHASING: 'purchasing',
  MENU: 'menu',
  RECIPES: 'recipes',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  PERMISSIONS: 'permissions',
  USERS: 'users',
  ACTIVITY_FEED: 'activity_feed',
  NOTIFICATIONS: 'notifications',
  RECEIPTS: 'receipts',
  ATTACHMENTS: 'attachments',
  MEDIA: 'media',
  BRANDING: 'branding',
  PRINTERS: 'printers',
  CLOUD_CONFIG: 'cloud_config',
  AUDIT_LOGS: 'audit_logs'
};

/**
 * Schedule Frequency Enum
 * Defines the frequency options for scheduled backups
 */
export const ScheduleFrequency = {
  HOURLY: 'hourly',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
  EVERY_X_HOURS: 'every_x_hours',
  EVERY_X_DAYS: 'every_x_days'
};

/**
 * Retention Policy Type Enum
 * Defines the types of retention policies
 */
export const RetentionPolicyType = {
  KEEP_LAST_X: 'keep_last_x',
  DELETE_AFTER_X_DAYS: 'delete_after_x_days',
  ARCHIVE_OLDER: 'archive_older',
  NEVER_DELETE_MANUAL: 'never_delete_manual',
  KEEP_MONTHLY: 'keep_monthly',
  KEEP_YEARLY: 'keep_yearly',
  CUSTOM: 'custom'
};

/**
 * Encryption Status Enum
 */
export const EncryptionStatus = {
  ENCRYPTED: 'encrypted',
  NOT_ENCRYPTED: 'not_encrypted',
  ENCRYPTION_FAILED: 'encryption_failed'
};

/**
 * Verification Status Enum
 */
export const VerificationStatus = {
  VERIFIED: 'verified',
  NOT_VERIFIED: 'not_verified',
  VERIFICATION_FAILED: 'verification_failed',
  VERIFICATION_PENDING: 'verification_pending'
};

/**
 * Compression Algorithm Enum
 */
export const CompressionAlgorithm = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BROTLI: 'brotli'
};

/**
 * Export Format Enum
 */
export const ExportFormat = {
  ENCRYPTED_PACKAGE: 'encrypted_package',
  ZIP: 'zip',
  JSON: 'json'
};

/**
 * Backup Priority Enum
 */
export const BackupPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Module metadata for display and selection
 */
export const MODULE_METADATA = {
  [BackupModule.ORDERS]: { name: 'Orders', icon: '📋', description: 'All order data and history' },
  [BackupModule.KITCHEN]: { name: 'Kitchen', icon: '👨‍🍳', description: 'Kitchen orders and preparation' },
  [BackupModule.INVENTORY]: { name: 'Inventory', icon: '📦', description: 'Stock levels and movements' },
  [BackupModule.RESERVATIONS]: { name: 'Reservations', icon: '📅', description: 'Table reservations' },
  [BackupModule.CRM]: { name: 'CRM', icon: '👥', description: 'Customer relationships' },
  [BackupModule.CUSTOMERS]: { name: 'Customers', icon: '👤', description: 'Customer profiles' },
  [BackupModule.STAFF]: { name: 'Staff', icon: '👨‍💼', description: 'Staff information' },
  [BackupModule.PRODUCTION]: { name: 'Production', icon: '🏭', description: 'Production schedules' },
  [BackupModule.PURCHASING]: { name: 'Purchasing', icon: '🛒', description: 'Purchase orders' },
  [BackupModule.MENU]: { name: 'Menu', icon: '🍽️', description: 'Menu items and categories' },
  [BackupModule.RECIPES]: { name: 'Recipes', icon: '📖', description: 'Recipe definitions' },
  [BackupModule.REPORTS]: { name: 'Reports', icon: '📊', description: 'Report configurations' },
  [BackupModule.ANALYTICS]: { name: 'Analytics', icon: '📈', description: 'Analytics data' },
  [BackupModule.SETTINGS]: { name: 'Settings', icon: '⚙️', description: 'System settings' },
  [BackupModule.PERMISSIONS]: { name: 'Permissions', icon: '🔐', description: 'Access permissions' },
  [BackupModule.USERS]: { name: 'Users', icon: '👥', description: 'User accounts' },
  [BackupModule.ACTIVITY_FEED]: { name: 'Activity Feed', icon: '📰', description: 'Activity logs' },
  [BackupModule.NOTIFICATIONS]: { name: 'Notifications', icon: '🔔', description: 'Notification settings' },
  [BackupModule.RECEIPTS]: { name: 'Receipts', icon: '🧾', description: 'Receipt templates' },
  [BackupModule.ATTACHMENTS]: { name: 'Attachments', icon: '📎', description: 'File attachments' },
  [BackupModule.MEDIA]: { name: 'Media', icon: '🖼️', description: 'Media files' },
  [BackupModule.BRANDING]: { name: 'Branding', icon: '🎨', description: 'Business branding' },
  [BackupModule.PRINTERS]: { name: 'Printers', icon: '🖨️', description: 'Printer configurations' },
  [BackupModule.CLOUD_CONFIG]: { name: 'Cloud Config', icon: '☁️', description: 'Cloud provider settings' },
  [BackupModule.AUDIT_LOGS]: { name: 'Audit Logs', icon: '📝', description: 'Security audit logs' }
};

/**
 * Default backup configuration
 */
export const DEFAULT_BACKUP_CONFIG = {
  type: BackupType.FULL,
  modules: Object.values(BackupModule),
  compression: CompressionAlgorithm.GZIP,
  encryption: true,
  verification: true,
  priority: BackupPriority.NORMAL
};

/**
 * Default retention policy
 */
export const DEFAULT_RETENTION_POLICY = {
  type: RetentionPolicyType.KEEP_LAST_X,
  value: 10,
  neverDeleteManual: true,
  keepMonthly: true,
  keepYearly: true
};

/**
 * Default schedule configuration
 */
export const DEFAULT_SCHEDULE_CONFIG = {
  frequency: ScheduleFrequency.DAILY,
  time: '00:00',
  enabled: true,
  retryOnFailure: true,
  maxRetries: 3
};
