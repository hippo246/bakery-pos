// Restore Types and Enums
// Defines all restore types, statuses, and related constants

/**
 * Restore Type Enum
 * Defines the different types of restores supported
 */
export const RestoreType = {
  FULL: 'full',
  MODULE: 'module',
  SELECTIVE: 'selective',
  EMERGENCY: 'emergency',
  DISASTER_RECOVERY: 'disaster_recovery',
  FACTORY: 'factory',
  ROLLBACK: 'rollback',
  DRY_RUN: 'dry_run'
};

/**
 * Restore Status Enum
 * Defines the possible states of a restore
 */
export const RestoreStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  VERIFYING: 'verifying',
  EXTRACTING: 'extracting',
  RESTORING: 'restoring',
  VALIDATING: 'validating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  ROLLING_BACK: 'rolling_back',
  ROLLED_BACK: 'rolled_back'
};

/**
 * Restore Health Enum
 * Defines the health status of a restore operation
 */
export const RestoreHealth = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  UNKNOWN: 'unknown'
};

/**
 * Compatibility Status Enum
 */
export const CompatibilityStatus = {
  COMPATIBLE: 'compatible',
  COMPATIBLE_WITH_WARNINGS: 'compatible_with_warnings',
  INCOMPATIBLE: 'incompatible',
  UNKNOWN: 'unknown'
};

/**
 * Verification Status Enum
 */
export const VerificationStatus = {
  PASSED: 'passed',
  FAILED: 'failed',
  WARNING: 'warning',
  SKIPPED: 'skipped'
};

/**
 * Conflict Severity Enum
 */
export const ConflictSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Conflict Type Enum
 */
export const ConflictType = {
  VERSION_MISMATCH: 'version_mismatch',
  SCHEMA_MISMATCH: 'schema_mismatch',
  MISSING_MODULE: 'missing_module',
  CORRUPTED_FILE: 'corrupted_file',
  DUPLICATE_ID: 'duplicate_id',
  PERMISSION_CONFLICT: 'permission_conflict',
  CONFIGURATION_CONFLICT: 'configuration_conflict',
  DATA_INTEGRITY: 'data_integrity'
};

/**
 * Default restore configuration
 */
export const DEFAULT_RESTORE_CONFIG = {
  type: RestoreType.FULL,
  createSafetyBackup: true,
  verifyAfterRestore: true,
  dryRun: false,
  modules: null // null = all modules
};

/**
 * Restore metadata structure
 */
export const RestoreMetadata = {
  restoreId: null,
  backupId: null,
  type: RestoreType.FULL,
  status: RestoreStatus.PENDING,
  health: RestoreHealth.UNKNOWN,
  startedAt: null,
  completedAt: null,
  duration: 0,
  modules: [],
  operator: null,
  safetyBackupId: null,
  rollbackAvailable: false,
  rollbackId: null,
  compatibility: null,
  verification: null,
  conflicts: [],
  error: null
};
