// Tenant Types and Enums
// Defines all tenant types, statuses, and related constants

/**
 * Tenant Status Enum
 */
export const TenantStatus = {
  PROVISIONING: 'provisioning',
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  SUSPENDED: 'suspended',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

/**
 * Subscription Status Enum
 */
export const SubscriptionStatus = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

/**
 * Business Type Enum
 */
export const BusinessType = {
  CAFE: 'cafe',
  RESTAURANT: 'restaurant',
  BAKERY: 'bakery',
  CATERING: 'catering',
  FOOD_TRUCK: 'food_truck',
  COFFEE_SHOP: 'coffee_shop',
  BAR: 'bar',
  HOTEL: 'hotel',
  OTHER: 'other'
};

/**
 * Region Enum
 */
export const Region = {
  US_EAST: 'us_east',
  US_WEST: 'us_west',
  EU_WEST: 'eu_west',
  EU_CENTRAL: 'eu_central',
  ASIA_PACIFIC: 'asia_pacific',
  ASIA_SOUTH: 'asia_south',
  OTHER: 'other'
};

/**
 * Tenant Health Status Enum
 */
export const TenantHealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

/**
 * Tenant Event Type Enum
 */
export const TenantEventType = {
  TENANT_CREATED: 'tenant_created',
  TENANT_UPDATED: 'tenant_updated',
  TENANT_SUSPENDED: 'tenant_suspended',
  TENANT_REACTIVATED: 'tenant_reactivated',
  TENANT_ARCHIVED: 'tenant_archived',
  TENANT_DELETED: 'tenant_deleted',
  OWNERSHIP_CHANGED: 'ownership_changed',
  PROVISIONING_COMPLETED: 'provisioning_completed',
  WORKSPACE_CREATED: 'workspace_created',
  DATABASE_CONNECTED: 'database_connected',
  STORAGE_CONNECTED: 'storage_connected',
  CLONE_CREATED: 'clone_created',
  HEALTH_CHECK_FAILED: 'health_check_failed',
  CROSS_TENANT_ACCESS_BLOCKED: 'cross_tenant_access_blocked'
};

/**
 * Default tenant configuration
 */
export const DEFAULT_TENANT_CONFIG = {
  maxUsers: 10,
  maxStorageGB: 10,
  maxBackups: 30,
  retentionDays: 90,
  enableBackups: true,
  enableSync: true,
  enableEncryption: true
};

/**
 * Tenant isolation scope
 */
export const IsolationScope = {
  DATABASE: 'database',
  STORAGE: 'storage',
  MEDIA: 'media',
  BACKUPS: 'backups',
  AUDIT_LOGS: 'audit_logs',
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  ATTACHMENTS: 'attachments',
  API_RESPONSES: 'api_responses',
  SESSIONS: 'sessions',
  CACHE: 'cache',
  SEARCH_INDEX: 'search_index'
};
