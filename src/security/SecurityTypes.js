// Security Types and Enums
// Defines all security types, statuses, and related constants

/**
 * Security Level Enum
 */
export const SecurityLevel = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Security Status Enum
 */
export const SecurityStatus = {
  SECURE: 'secure',
  WARNING: 'warning',
  RISK: 'risk',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

/**
 * Credential Type Enum
 */
export const CredentialType = {
  API_KEY: 'api_key',
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CLOUD_CREDENTIAL: 'cloud_credential',
  STORAGE_CREDENTIAL: 'storage_credential',
  ENCRYPTION_KEY: 'encryption_key',
  SIGNING_KEY: 'signing_key',
  SECRET: 'secret'
};

/**
 * Permission Enum
 */
export const Permission = {
  VIEW_CLOUD_SETTINGS: 'view_cloud_settings',
  MANAGE_PROVIDERS: 'manage_providers',
  RUN_BACKUPS: 'run_backups',
  DELETE_BACKUPS: 'delete_backups',
  RESTORE_DATA: 'restore_data',
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  ROTATE_CREDENTIALS: 'rotate_credentials',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_ENCRYPTION: 'manage_encryption',
  CONFIGURE_SYNC: 'configure_sync',
  SWITCH_PROVIDERS: 'switch_providers',
  MANAGE_RETENTION: 'manage_retention',
  VIEW_SECURITY_CENTER: 'view_security_center',
  MANAGE_SECURITY: 'manage_security'
};

/**
 * Security Event Type Enum
 */
export const SecurityEventType = {
  CREDENTIAL_UPDATED: 'credential_updated',
  CREDENTIAL_ROTATED: 'credential_rotated',
  CREDENTIAL_EXPIRED: 'credential_expired',
  PROVIDER_ADDED: 'provider_added',
  PROVIDER_REMOVED: 'provider_removed',
  PROVIDER_SWITCHED: 'provider_switched',
  OWNER_VERIFICATION: 'owner_verification',
  FAILED_AUTHENTICATION: 'failed_authentication',
  SESSION_EXPIRED: 'session_expired',
  SESSION_LOCKED: 'session_locked',
  RESTORE_APPROVED: 'restore_approved',
  BACKUP_DELETED: 'backup_deleted',
  PERMISSION_DENIED: 'permission_denied',
  EXPORT_COMPLETED: 'export_completed',
  IMPORT_COMPLETED: 'import_completed',
  ENCRYPTION_ENABLED: 'encryption_enabled',
  ENCRYPTION_DISABLED: 'encryption_disabled',
  ENCRYPTION_ROTATED: 'encryption_rotated',
  INTEGRITY_FAILED: 'integrity_failed',
  SECURITY_ALERT: 'security_alert',
  DATA_LOSS_PREVENTED: 'data_loss_prevented'
};

/**
 * Risk Level Enum
 */
export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Session Status Enum
 */
export const SessionStatus = {
  ACTIVE: 'active',
  IDLE: 'idle',
  EXPIRED: 'expired',
  LOCKED: 'locked',
  TERMINATED: 'terminated'
};

/**
 * Encryption Status Enum
 */
export const EncryptionStatus = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
  ROTATING: 'rotating',
  FAILED: 'failed',
  UNKNOWN: 'unknown'
};

/**
 * Integrity Status Enum
 */
export const IntegrityStatus = {
  VERIFIED: 'verified',
  FAILED: 'failed',
  PENDING: 'pending',
  UNKNOWN: 'unknown'
};

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG = {
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  idleTimeout: 15 * 60 * 1000, // 15 minutes
  maxFailedAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  requireOwnerAuth: true,
  encryptionEnabled: true,
  integrityVerificationEnabled: true,
  auditRetentionDays: 90
};
