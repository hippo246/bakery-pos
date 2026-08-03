// Sync Types and Enums
// Defines all sync types, statuses, and related constants

/**
 * Sync Direction Enum
 * Defines the direction of synchronization
 */
export const SyncDirection = {
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  BIDIRECTIONAL: 'bidirectional'
};

/**
 * Sync Status Enum
 * Defines the possible states of a sync operation
 */
export const SyncStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  RETRYING: 'retrying',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  CONFLICT: 'conflict'
};

/**
 * Network Status Enum
 */
export const NetworkStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  SLOW: 'slow',
  LIMITED: 'limited',
  CAPTIVE_PORTAL: 'captive_portal',
  HIGH_LATENCY: 'high_latency',
  UNKNOWN: 'unknown'
};

/**
 * Sync Module Enum
 * Defines all modules that can be synchronized
 */
export const SyncModule = {
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
  AUDIT_LOGS: 'audit_logs',
  CLOUD_BACKUPS: 'cloud_backups'
};

/**
 * Conflict Type Enum
 */
export const ConflictType = {
  VERSION_MISMATCH: 'version_mismatch',
  SIMULTANEOUS_EDIT: 'simultaneous_edit',
  DATA_INTEGRITY: 'data_integrity',
  SCHEMA_MISMATCH: 'schema_mismatch',
  DELETED_CONFLICT: 'deleted_conflict',
  DUPLICATE_KEY: 'duplicate_key'
};

/**
 * Conflict Severity Enum
 */
export const ConflictSeverity = {
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Conflict Resolution Action Enum
 */
export const ConflictResolutionAction = {
  USE_LOCAL: 'use_local',
  USE_CLOUD: 'use_cloud',
  MERGE_AUTO: 'merge_auto',
  MANUAL_REVIEW: 'manual_review',
  RESTORE_PREVIOUS: 'restore_previous'
};

/**
 * Sync Priority Enum
 */
export const SyncPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

/**
 * Sync Filter Enum
 */
export const SyncFilter = {
  SYNC_IMMEDIATELY: 'sync_immediately',
  WIFI_ONLY: 'wifi_only',
  METERED_NETWORKS: 'metered_networks',
  MANUAL_SYNC: 'manual_sync',
  BACKGROUND_ONLY: 'background_only',
  SCHEDULED: 'scheduled'
};

/**
 * Default sync configuration
 */
export const DEFAULT_SYNC_CONFIG = {
  direction: SyncDirection.BIDIRECTIONAL,
  priority: SyncPriority.NORMAL,
  retryOnFailure: true,
  maxRetries: 5,
  compressionEnabled: true,
  chunkSize: 1024 * 1024, // 1MB chunks
  verifyAfterTransfer: true
};

/**
 * Sync item structure
 */
export const SyncItem = {
  itemId: null,
  module: null,
  direction: SyncDirection.UPLOAD,
  status: SyncStatus.PENDING,
  priority: SyncPriority.NORMAL,
  data: null,
  metadata: null,
  createdAt: null,
  startedAt: null,
  completedAt: null,
  retryCount: 0,
  error: null,
  checksum: null,
  size: 0,
  deviceId: null,
  operator: null
};

/**
 * Version tracking structure
 */
export const VersionInfo = {
  version: 1,
  createdAt: null,
  modifiedAt: null,
  deviceId: null,
  operator: null,
  revision: 1,
  checksum: null,
  previousVersion: null
};
