/* eslint-disable no-unused-vars */

export const ProviderStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  INACTIVE: 'inactive',
  AUTH_EXPIRED: 'auth_expired',
  WARNING: 'warning',
  QUOTA_NEAR_LIMIT: 'quota_near_limit',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown'
};

export const ProviderCapabilities = {
  VERSIONING: 'versioning',
  ENCRYPTION: 'encryption',
  LARGE_FILES: 'large_files',
  STREAMING: 'streaming',
  SIGNED_URLS: 'signed_urls',
  FOLDER_SUPPORT: 'folder_support',
  OBJECT_LOCKING: 'object_locking',
  LIFECYCLE_RULES: 'lifecycle_rules',
  MULTIPART_UPLOAD: 'multipart_upload',
  STORAGE_CLASSES: 'storage_classes',
  METADATA: 'metadata',
  QUOTA: 'quota',
  COPY: 'copy',
  MOVE: 'move',
  RENAME: 'rename'
};

export const StorageType = {
  OBJECT: 'object',
  BLOCK: 'block',
  FILE: 'file',
  HYBRID: 'hybrid'
};

export const AuthMethod = {
  ACCESS_KEY: 'access_key',
  OAUTH: 'oauth',
  SERVICE_ACCOUNT: 'service_account',
  API_KEY: 'api_key',
  BASIC: 'basic',
  TOKEN: 'token',
  CERTIFICATE: 'certificate'
};

export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.status = ProviderStatus.DISCONNECTED;
    this.capabilities = new Set();
    this.lastHealthCheck = null;
    this.lastError = null;
    this.version = '1.0.0';
  }

  get connected() {
    return this.status === ProviderStatus.CONNECTED;
  }

  async initialize() {
    throw new Error('initialize() must be implemented by provider');
  }

  async connect() {
    throw new Error('connect() must be implemented by provider');
  }

  async disconnect() {
    throw new Error('disconnect() must be implemented by provider');
  }

  async authenticate() {
    throw new Error('authenticate() must be implemented by provider');
  }

  async validateCredentials() {
    throw new Error('validateCredentials() must be implemented by provider');
  }

  async reconnect() {
    return this.connect();
  }

  async saveCredentials(credentials) {
    this.config = { ...this.config, ...credentials };
    return { success: true };
  }

  async refreshAuth() {
    throw new Error('refreshAuth() must be implemented by provider');
  }

  async testConnection() {
    throw new Error('testConnection() must be implemented by provider');
  }

  async upload(key, data, options = {}) {
    throw new Error('upload() must be implemented by provider');
  }

  async download(key) {
    throw new Error('download() must be implemented by provider');
  }

  async delete(key) {
    throw new Error('delete() must be implemented by provider');
  }

  async rename(oldKey, newKey) {
    throw new Error('rename() must be implemented by provider');
  }

  async move(sourceKey, destKey) {
    throw new Error('move() must be implemented by provider');
  }

  async copy(sourceKey, destKey) {
    throw new Error('copy() must be implemented by provider');
  }

  async list(prefix = '', options = {}) {
    throw new Error('list() must be implemented by provider');
  }

  async exists(key) {
    throw new Error('exists() must be implemented by provider');
  }

  async metadata(key) {
    throw new Error('metadata() must be implemented by provider');
  }

  async quota() {
    throw new Error('quota() must be implemented by provider');
  }

  async healthCheck() {
    throw new Error('healthCheck() must be implemented by provider');
  }

  getCapabilities() {
    return this.capabilities;
  }

  hasCapability(capability) {
    return this.capabilities.has(capability);
  }

  getStatus() {
    return this.status;
  }

  setStatus(status) {
    this.status = status;
  }

  getVersion() {
    return this.version;
  }

  getSanitizedConfig() {
    const sanitized = { ...this.config };
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'credential', 'certificate'];
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '***';
      }
    });
    return sanitized;
  }

  async shutdown() {
    this.status = ProviderStatus.DISCONNECTED;
    return { success: true };
  }
}

export default BaseProvider;
