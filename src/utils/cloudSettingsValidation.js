// Cloud Settings Validation System
// Validates all cloud platform settings before saving

/**
 * Validation result structure
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the value is valid
 * @property {string} error - Error message if invalid
 */

/**
 * Validate AWS S3 credentials
 * @param {Object} credentials - AWS credentials object
 * @returns {ValidationResult}
 */
export function validateAWSCredentials(credentials) {
  if (!credentials.accessKey || credentials.accessKey.trim().length < 16) {
    return { valid: false, error: 'Access Key ID must be at least 16 characters' };
  }
  
  if (!credentials.secretKey || credentials.secretKey.trim().length < 16) {
    return { valid: false, error: 'Secret Access Key must be at least 16 characters' };
  }
  
  if (credentials.bucket && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(credentials.bucket)) {
    return { valid: false, error: 'Bucket name must follow S3 naming conventions' };
  }
  
  if (credentials.region && !/^[a-z]{2}-[a-z]+-\d{1}$/.test(credentials.region)) {
    return { valid: false, error: 'Invalid AWS region format (e.g., us-east-1)' };
  }
  
  return { valid: true };
}

/**
 * Validate Google Cloud Storage credentials
 * @param {Object} credentials - GCS credentials object
 * @returns {ValidationResult}
 */
export function validateGCSCredentials(credentials) {
  if (!credentials.projectId || credentials.projectId.trim().length < 6) {
    return { valid: false, error: 'Project ID must be at least 6 characters' };
  }
  
  if (credentials.bucket && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(credentials.bucket)) {
    return { valid: false, error: 'Bucket name must follow GCS naming conventions' };
  }
  
  return { valid: true };
}

/**
 * Validate Azure Blob credentials
 * @param {Object} credentials - Azure credentials object
 * @returns {ValidationResult}
 */
export function validateAzureCredentials(credentials) {
  if (!credentials.accountName || credentials.accountName.trim().length < 3) {
    return { valid: false, error: 'Storage account name must be at least 3 characters' };
  }
  
  if (!credentials.accountKey || credentials.accountKey.trim().length < 64) {
    return { valid: false, error: 'Account key must be at least 64 characters' };
  }
  
  if (credentials.container && !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(credentials.container)) {
    return { valid: false, error: 'Container name must follow Azure naming conventions' };
  }
  
  return { valid: true };
}

/**
 * Validate Cloudflare R2 credentials
 * @param {Object} credentials - R2 credentials object
 * @returns {ValidationResult}
 */
export function validateR2Credentials(credentials) {
  if (!credentials.accountId || credentials.accountId.trim().length < 32) {
    return { valid: false, error: 'Account ID must be at least 32 characters' };
  }
  
  if (!credentials.accessKey || credentials.accessKey.trim().length < 16) {
    return { valid: false, error: 'Access Key ID must be at least 16 characters' };
  }
  
  if (!credentials.secretKey || credentials.secretKey.trim().length < 16) {
    return { valid: false, error: 'Secret Access Key must be at least 16 characters' };
  }
  
  if (credentials.bucket && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(credentials.bucket)) {
    return { valid: false, error: 'Bucket name must follow R2 naming conventions' };
  }
  
  return { valid: true };
}

/**
 * Validate Firebase Storage credentials
 * @param {Object} credentials - Firebase credentials object
 * @returns {ValidationResult}
 */
export function validateFirebaseCredentials(credentials) {
  if (!credentials.apiKey || credentials.apiKey.trim().length < 16) {
    return { valid: false, error: 'API Key must be at least 16 characters' };
  }
  
  if (!credentials.projectId || credentials.projectId.trim().length < 6) {
    return { valid: false, error: 'Project ID must be at least 6 characters' };
  }
  
  if (credentials.storageBucket && !/^[a-z0-9-]+\.appspot\.com$/.test(credentials.storageBucket)) {
    return { valid: false, error: 'Storage bucket must follow Firebase format (project-id.appspot.com)' };
  }
  
  return { valid: true };
}

/**
 * Validate MinIO credentials
 * @param {Object} credentials - MinIO credentials object
 * @returns {ValidationResult}
 */
export function validateMinIOCredentials(credentials) {
  if (!credentials.endpoint) {
    return { valid: false, error: 'Endpoint is required' };
  }
  
  try {
    new URL(credentials.endpoint);
  } catch {
    return { valid: false, error: 'Invalid endpoint URL' };
  }
  
  if (!credentials.accessKey || credentials.accessKey.trim().length < 3) {
    return { valid: false, error: 'Access Key must be at least 3 characters' };
  }
  
  if (!credentials.secretKey || credentials.secretKey.trim().length < 8) {
    return { valid: false, error: 'Secret Key must be at least 8 characters' };
  }
  
  if (credentials.bucket && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(credentials.bucket)) {
    return { valid: false, error: 'Bucket name must follow MinIO naming conventions' };
  }
  
  return { valid: true };
}

/**
 * Validate backup configuration
 * @param {Object} config - Backup configuration object
 * @returns {ValidationResult}
 */
export function validateBackupConfig(config) {
  if (config.enabled && !config.frequency) {
    return { valid: false, error: 'Backup frequency is required when backups are enabled' };
  }
  
  if (config.retentionDays && (config.retentionDays < 1 || config.retentionDays > 365)) {
    return { valid: false, error: 'Retention days must be between 1 and 365' };
  }
  
  if (config.scheduleTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(config.scheduleTime)) {
    return { valid: false, error: 'Invalid schedule time format (use HH:MM)' };
  }
  
  return { valid: true };
}

/**
 * Validate sync configuration
 * @param {Object} config - Sync configuration object
 * @returns {ValidationResult}
 */
export function validateSyncConfig(config) {
  if (config.syncInterval && (config.syncInterval < 30 || config.syncInterval > 3600)) {
    return { valid: false, error: 'Sync interval must be between 30 and 3600 seconds' };
  }
  
  if (config.retryCount && (config.retryCount < 1 || config.retryCount > 10)) {
    return { valid: false, error: 'Retry count must be between 1 and 10' };
  }
  
  if (config.retryDelay && (config.retryDelay < 1 || config.retryDelay > 60)) {
    return { valid: false, error: 'Retry delay must be between 1 and 60 seconds' };
  }
  
  return { valid: true };
}

/**
 * Validate monitoring configuration
 * @param {Object} config - Monitoring configuration object
 * @returns {ValidationResult}
 */
export function validateMonitoringConfig(config) {
  if (config.healthCheckInterval && (config.healthCheckInterval < 30 || config.healthCheckInterval > 3600)) {
    return { valid: false, error: 'Health check interval must be between 30 and 3600 seconds' };
  }
  
  if (config.alertThreshold && (config.alertThreshold < 50 || config.alertThreshold > 100)) {
    return { valid: false, error: 'Alert threshold must be between 50 and 100' };
  }
  
  return { valid: true };
}

/**
 * Validate advanced configuration
 * @param {Object} config - Advanced configuration object
 * @returns {ValidationResult}
 */
export function validateAdvancedConfig(config) {
  if (config.cache?.maxSize && (config.cache.maxSize < 10 || config.cache.maxSize > 1000)) {
    return { valid: false, error: 'Cache size must be between 10 and 1000 MB' };
  }
  
  if (config.cache?.ttl && (config.cache.ttl < 60 || config.cache.ttl > 3600)) {
    return { valid: false, error: 'Cache TTL must be between 60 and 3600 seconds' };
  }
  
  if (config.timeouts?.connection && (config.timeouts.connection < 10 || config.timeouts.connection > 120)) {
    return { valid: false, error: 'Connection timeout must be between 10 and 120 seconds' };
  }
  
  if (config.limits?.maxConnections && (config.limits.maxConnections < 1 || config.limits.maxConnections > 50)) {
    return { valid: false, error: 'Max connections must be between 1 and 50' };
  }
  
  return { valid: true };
}

/**
 * Validate credentials based on provider type
 * @param {string} providerId - Provider ID
 * @param {Object} credentials - Credentials object
 * @returns {ValidationResult}
 */
export function validateCredentials(providerId, credentials) {
  const validators = {
    'aws-s3': validateAWSCredentials,
    'gcs': validateGCSCredentials,
    'azure-blob': validateAzureCredentials,
    'cloudflare-r2': validateR2Credentials,
    'firebase-storage': validateFirebaseCredentials,
    'minio': validateMinIOCredentials
  };
  
  const validator = validators[providerId];
  if (!validator) {
    return { valid: true }; // No validation for unknown providers
  }
  
  return validator(credentials);
}

/**
 * Validate all settings for a section
 * @param {string} sectionId - Section ID
 * @param {Object} settings - Settings object
 * @returns {Object} - Object with field-level validation results
 */
export function validateSectionSettings(sectionId, settings) {
  const validators = {
    'backups': () => validateBackupConfig(settings),
    'sync': () => validateSyncConfig(settings),
    'monitoring': () => validateMonitoringConfig(settings),
    'advanced': () => validateAdvancedConfig(settings)
  };
  
  const validator = validators[sectionId];
  if (!validator) {
    return { valid: true };
  }
  
  return validator();
}
