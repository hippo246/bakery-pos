// Operations Types and Enums
// Defines all operations types, statuses, and related constants

/**
 * System Health Status Enum
 */
export const SystemHealthStatus = {
  HEALTHY: 'healthy',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OFFLINE: 'offline',
  MAINTENANCE: 'maintenance',
  UNKNOWN: 'unknown'
};

/**
 * Service Status Enum
 */
export const ServiceStatus = {
  RUNNING: 'running',
  STARTING: 'starting',
  PAUSED: 'paused',
  STOPPED: 'stopped',
  RECOVERING: 'recovering',
  RESTARTING: 'restarting',
  FAILED: 'failed'
};

/**
 * Error Severity Enum
 */
export const ErrorSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  FATAL: 'fatal'
};

/**
 * Alert Severity Enum
 */
export const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
};

/**
 * Alert Status Enum
 */
export const AlertStatus = {
  ACTIVE: 'active',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
  IGNORED: 'ignored'
};

/**
 * Monitored System Enum
 */
export const MonitoredSystem = {
  APPLICATION: 'application',
  DATABASE: 'database',
  STORAGE_ENGINE: 'storage_engine',
  CLOUD_PROVIDER: 'cloud_provider',
  AUTHENTICATION: 'authentication',
  PERMISSIONS: 'permissions',
  BACKUP_ENGINE: 'backup_engine',
  RESTORE_ENGINE: 'restore_engine',
  SYNCHRONIZATION_ENGINE: 'synchronization_engine',
  IMPORT_ENGINE: 'import_engine',
  EXPORT_ENGINE: 'export_engine',
  NOTIFICATION_SYSTEM: 'notification_system',
  KITCHEN: 'kitchen',
  ORDERS: 'orders',
  WAITERS: 'waiters',
  INVENTORY: 'inventory',
  RESERVATIONS: 'reservations',
  CRM: 'crm',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  PAYMENTS: 'payments',
  ACTIVITY_FEED: 'activity_feed',
  AUDIT_LOGS: 'audit_logs',
  PRINTING: 'printing',
  HARDWARE: 'hardware'
};

/**
 * Error Category Enum
 */
export const ErrorCategory = {
  APPLICATION: 'application',
  CLOUD: 'cloud',
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  SYNCHRONIZATION: 'synchronization',
  BACKUP: 'backup',
  RESTORE: 'restore',
  IMPORT: 'import',
  EXPORT: 'export',
  PAYMENT: 'payment',
  PRINTING: 'printing'
};

/**
 * Alert Type Enum
 */
export const AlertType = {
  DATABASE_SLOW: 'database_slow',
  CLOUD_OFFLINE: 'cloud_offline',
  STORAGE_FULL: 'storage_full',
  BACKUP_FAILED: 'backup_failed',
  RESTORE_FAILED: 'restore_failed',
  SYNC_QUEUE_GROWING: 'sync_queue_growing',
  HIGH_ERROR_RATE: 'high_error_rate',
  PRINTER_OFFLINE: 'printer_offline',
  KITCHEN_DELAYS: 'kitchen_delays',
  INVENTORY_CRITICAL: 'inventory_critical',
  AUTHENTICATION_ISSUES: 'authentication_issues',
  API_PROBLEMS: 'api_problems',
  SYSTEM_FAILURE: 'system_failure',
  PERFORMANCE_DEGRADATION: 'performance_degradation',
  STORAGE_LOW: 'storage_low',
  SECURITY_WARNING: 'security_warning'
};

/**
 * Metric Type Enum
 */
export const MetricType = {
  CPU_USAGE: 'cpu_usage',
  MEMORY_USAGE: 'memory_usage',
  STORAGE_USAGE: 'storage_usage',
  DATABASE_RESPONSE_TIME: 'database_response_time',
  API_LATENCY: 'api_latency',
  AVERAGE_REQUEST_TIME: 'average_request_time',
  FAILED_REQUESTS: 'failed_requests',
  SUCCESSFUL_REQUESTS: 'successful_requests',
  QUEUE_SIZE: 'queue_size',
  SYNC_QUEUE_SIZE: 'sync_queue_size',
  BACKUP_QUEUE_SIZE: 'backup_queue_size',
  NOTIFICATION_QUEUE_SIZE: 'notification_queue_size',
  IMPORT_QUEUE_SIZE: 'import_queue_size',
  EXPORT_QUEUE_SIZE: 'export_queue_size'
};

/**
 * Performance Metric Enum
 */
export const PerformanceMetric = {
  AVERAGE_RESPONSE_TIME: 'average_response_time',
  P95_RESPONSE_TIME: 'p95_response_time',
  P99_RESPONSE_TIME: 'p99_response_time',
  DATABASE_QUERY_TIME: 'database_query_time',
  STORAGE_LATENCY: 'storage_latency',
  UPLOAD_SPEED: 'upload_speed',
  DOWNLOAD_SPEED: 'download_speed',
  ORDER_PROCESSING_TIME: 'order_processing_time',
  KITCHEN_TICKET_TIME: 'kitchen_ticket_time',
  RESERVATION_PROCESSING_TIME: 'reservation_processing_time',
  NOTIFICATION_DELIVERY_TIME: 'notification_delivery_time'
};

/**
 * Default monitoring configuration
 */
export const DEFAULT_MONITORING_CONFIG = {
  pollingInterval: 30000, // 30 seconds
  healthCheckInterval: 60000, // 1 minute
  metricsRetentionDays: 30,
  alertRetentionDays: 90,
  logRetentionDays: 7,
  enableAutoHealing: false,
  enableNotifications: true
};

/**
 * Self-healing action types
 */
export const SelfHealingAction = {
  AUTOMATIC_RETRY: 'automatic_retry',
  AUTOMATIC_RECONNECT: 'automatic_reconnect',
  AUTOMATIC_SERVICE_RESTART: 'automatic_service_restart',
  AUTOMATIC_QUEUE_RECOVERY: 'automatic_queue_recovery',
  AUTOMATIC_CACHE_REBUILD: 'automatic_cache_rebuild'
};
