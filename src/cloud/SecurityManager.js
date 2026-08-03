// Security Manager for Cloud Storage Platform
// Handles encryption, credential rotation, and permissions

/**
 * Security Manager
 * Central security module for cloud storage operations
 * Handles credential encryption, rotation, and permission checks
 */
class SecurityManager {
  constructor() {
    this.initialized = false;
    this.encryptionKey = null;
  }

  /**
   * Initialize the security manager
   */
  async initialize() {
    if (this.initialized) return;
    
    // Load or generate encryption key
    await this.loadOrGenerateKey();
    
    this.initialized = true;
  }

  /**
   * Load or generate encryption key
   */
  async loadOrGenerateKey() {
    try {
      const storedKey = localStorage.getItem('cafeos_encryption_key');
      
      if (storedKey) {
        this.encryptionKey = storedKey;
      } else {
        // Generate a simple key (in production, use proper key derivation)
        this.encryptionKey = this.generateKey();
        localStorage.setItem('cafeos_encryption_key', this.encryptionKey);
      }
    } catch (error) {
      console.error('[SecurityManager] Failed to load/generate key:', error);
    }
  }

  /**
   * Generate a simple encryption key
   * @returns {string}
   */
  generateKey() {
    // Simple key generation (in production, use Web Crypto API)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let key = '';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Encrypt credentials
   * @param {object} credentials 
   * @returns {Promise<{success: boolean, encrypted?: string, error?: string}>}
   */
  async encryptCredentials(credentials) {
    try {
      if (!this.encryptionKey) {
        await this.initialize();
      }

      const jsonString = JSON.stringify(credentials);
      const encrypted = this.simpleEncrypt(jsonString, this.encryptionKey);
      
      return { success: true, encrypted };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Decrypt credentials
   * @param {string} encrypted 
   * @returns {Promise<{success: boolean, credentials?: object, error?: string}>}
   */
  async decryptCredentials(encrypted) {
    try {
      if (!this.encryptionKey) {
        await this.initialize();
      }

      const decrypted = this.simpleDecrypt(encrypted, this.encryptionKey);
      const credentials = JSON.parse(decrypted);
      
      return { success: true, credentials };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Simple encryption (XOR-based - for production use Web Crypto API)
   * @param {string} text 
   * @param {string} key 
   * @returns {string}
   */
  simpleEncrypt(text, key) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(result); // Base64 encode
  }

  /**
   * Simple decryption (XOR-based - for production use Web Crypto API)
   * @param {string} encrypted 
   * @param {string} key 
   * @returns {string}
   */
  simpleDecrypt(encrypted, key) {
    const text = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  }

  /**
   * Rotate credentials
   * @param {string} providerId 
   * @param {object} newCredentials 
   * @param {string} userId 
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async rotateCredentials(providerId, newCredentials, userId) {
    try {
      // Encrypt new credentials
      const encryptResult = await this.encryptCredentials(newCredentials);
      
      if (!encryptResult.success) {
        return { success: false, error: 'Failed to encrypt new credentials' };
      }

      // Store encrypted credentials
      const encryptedCredentials = localStorage.getItem('cafeos_encrypted_credentials') || '{}';
      const credentialsObj = JSON.parse(encryptedCredentials);
      
      credentialsObj[providerId] = {
        encrypted: encryptResult.encrypted,
        rotatedAt: new Date().toISOString(),
        rotatedBy: userId
      };
      
      localStorage.setItem('cafeos_encrypted_credentials', JSON.stringify(credentialsObj));
      
      // Log rotation
      await this.logSecurityEvent('credential_rotation', providerId, userId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get encrypted credentials
   * @param {string} providerId 
   * @returns {Promise<{success: boolean, credentials?: object, error?: string}>}
   */
  async getEncryptedCredentials(providerId) {
    try {
      const encryptedCredentials = localStorage.getItem('cafeos_encrypted_credentials');
      
      if (!encryptedCredentials) {
        return { success: false, error: 'No encrypted credentials found' };
      }

      const credentialsObj = JSON.parse(encryptedCredentials);
      const providerCredentials = credentialsObj[providerId];
      
      if (!providerCredentials) {
        return { success: false, error: 'Provider credentials not found' };
      }

      // Decrypt credentials
      const decryptResult = await this.decryptCredentials(providerCredentials.encrypted);
      
      if (!decryptResult.success) {
        return decryptResult;
      }

      return { success: true, credentials: decryptResult.credentials };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check permission for cloud operation
   * @param {string} operation 
   * @param {string} userId 
   * @returns {Promise<{success: boolean, allowed: boolean, error?: string}>}
   */
  async checkPermission(operation, userId) {
    try {
      // Get user permissions
      const userPermissions = this.getUserPermissions(userId);
      
      // Check if operation is allowed
      const allowed = this.isOperationAllowed(operation, userPermissions);
      
      return { success: true, allowed };
    } catch (error) {
      return { success: false, allowed: false, error: error.message };
    }
  }

  /**
   * Get user permissions
   * @param {string} userId 
   * @returns {Array}
   */
  getUserPermissions(userId) {
    try {
      const permissions = localStorage.getItem(`cafeos_permissions_${userId}`);
      if (permissions) {
        return JSON.parse(permissions);
      }
      
      // Default permissions for owner
      return [
        'cloud:configure',
        'cloud:upload',
        'cloud:download',
        'cloud:delete',
        'cloud:backup',
        'cloud:restore',
        'cloud:export',
        'cloud:import',
        'cloud:manage_providers',
        'cloud:rotate_credentials',
        'cloud:migrate',
        'cloud:manage_attachments',
        'cloud:view_logs',
        'cloud:manage_notifications'
      ];
    } catch (error) {
      return [];
    }
  }

  /**
   * Set user permissions
   * @param {string} userId 
   * @param {Array} permissions 
   */
  setUserPermissions(userId, permissions) {
    try {
      localStorage.setItem(`cafeos_permissions_${userId}`, JSON.stringify(permissions));
      this.logSecurityEvent('permissions_updated', null, userId, { permissions });
    } catch (error) {
      console.error('[SecurityManager] Failed to set permissions:', error);
    }
  }

  /**
   * Get available permissions
   * @returns {Array}
   */
  getAvailablePermissions() {
    return [
      { id: 'cloud:configure', name: 'Configure Cloud Storage', description: 'Configure cloud storage providers and settings' },
      { id: 'cloud:upload', name: 'Upload Files', description: 'Upload files to cloud storage' },
      { id: 'cloud:download', name: 'Download Files', description: 'Download files from cloud storage' },
      { id: 'cloud:delete', name: 'Delete Files', description: 'Delete files from cloud storage' },
      { id: 'cloud:backup', name: 'Create Backups', description: 'Create cloud backups' },
      { id: 'cloud:restore', name: 'Restore Backups', description: 'Restore from cloud backups' },
      { id: 'cloud:export', name: 'Export Data', description: 'Export data to cloud storage' },
      { id: 'cloud:import', name: 'Import Data', description: 'Import data from cloud storage' },
      { id: 'cloud:manage_providers', name: 'Manage Providers', description: 'Add, remove, and switch cloud providers' },
      { id: 'cloud:rotate_credentials', name: 'Rotate Credentials', description: 'Rotate cloud provider credentials' },
      { id: 'cloud:migrate', name: 'Migrate Data', description: 'Migrate data between providers' },
      { id: 'cloud:manage_attachments', name: 'Manage Attachments', description: 'Upload and manage file attachments' },
      { id: 'cloud:view_logs', name: 'View Logs', description: 'View cloud storage and security logs' },
      { id: 'cloud:manage_notifications', name: 'Manage Notifications', description: 'Configure cloud event notifications' }
    ];
  }

  /**
   * Get permission groups
   * @returns {object}
   */
  getPermissionGroups() {
    return {
      admin: [
        'cloud:configure',
        'cloud:upload',
        'cloud:download',
        'cloud:delete',
        'cloud:backup',
        'cloud:restore',
        'cloud:export',
        'cloud:import',
        'cloud:manage_providers',
        'cloud:rotate_credentials',
        'cloud:migrate',
        'cloud:manage_attachments',
        'cloud:view_logs',
        'cloud:manage_notifications'
      ],
      manager: [
        'cloud:upload',
        'cloud:download',
        'cloud:backup',
        'cloud:restore',
        'cloud:export',
        'cloud:import',
        'cloud:manage_attachments',
        'cloud:view_logs'
      ],
      user: [
        'cloud:upload',
        'cloud:download',
        'cloud:manage_attachments'
      ],
      viewer: [
        'cloud:download',
        'cloud:view_logs'
      ]
    };
  }

  /**
   * Assign permission group to user
   * @param {string} userId 
   * @param {string} group 
   */
  assignPermissionGroup(userId, group) {
    const groups = this.getPermissionGroups();
    const permissions = groups[group] || groups.user;
    this.setUserPermissions(userId, permissions);
  }

  /**
   * Check if operation is allowed
   * @param {string} operation 
   * @param {Array} permissions 
   * @returns {boolean}
   */
  isOperationAllowed(operation, permissions) {
    const permissionMap = {
      'configure': 'cloud:configure',
      'upload': 'cloud:upload',
      'download': 'cloud:download',
      'delete': 'cloud:delete',
      'backup': 'cloud:backup',
      'restore': 'cloud:restore',
      'export': 'cloud:export',
      'import': 'cloud:import',
      'set_active_provider': 'cloud:manage_providers',
      'clear_active_provider': 'cloud:manage_providers',
      'rotate_credentials': 'cloud:rotate_credentials',
      'migrate': 'cloud:migrate',
      'upload_attachment': 'cloud:manage_attachments',
      'download_attachment': 'cloud:manage_attachments',
      'delete_attachment': 'cloud:manage_attachments',
      'view_logs': 'cloud:view_logs',
      'manage_notifications': 'cloud:manage_notifications'
    };

    const requiredPermission = permissionMap[operation];
    
    if (!requiredPermission) {
      return false;
    }

    return permissions.includes(requiredPermission);
  }

  /**
   * Mask sensitive credential fields
   * @param {object} credentials 
   * @returns {object}
   */
  maskCredentials(credentials) {
    const masked = { ...credentials };
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'accessKey', 'secretKey'];
    
    for (const field of Object.keys(masked)) {
      const lowerField = field.toLowerCase();
      if (sensitiveFields.some(sf => lowerField.includes(sf))) {
        masked[field] = this.maskValue(masked[field]);
      }
    }
    
    return masked;
  }

  /**
   * Mask a value
   * @param {string} value 
   * @returns {string}
   */
  maskValue(value) {
    if (!value || typeof value !== 'string') {
      return '***';
    }
    
    if (value.length <= 4) {
      return '***';
    }
    
    return value.substring(0, 2) + '***' + value.substring(value.length - 2);
  }

  /**
   * Validate credential strength
   * @param {string} type 
   * @param {string} value 
   * @returns {{valid: boolean, errors: string[]}}
   */
  validateCredentialStrength(type, value) {
    const errors = [];
    
    if (!value) {
      errors.push('Value is required');
      return { valid: false, errors };
    }

    if (type === 'password' || type === 'secret' || type.includes('key')) {
      if (value.length < 16) {
        errors.push('Must be at least 16 characters');
      }
      
      if (!/[A-Z]/.test(value)) {
        errors.push('Must contain at least one uppercase letter');
      }
      
      if (!/[a-z]/.test(value)) {
        errors.push('Must contain at least one lowercase letter');
      }
      
      if (!/[0-9]/.test(value)) {
        errors.push('Must contain at least one number');
      }
      
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        errors.push('Must contain at least one special character');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Log security event
   * @param {string} eventType 
   * @param {string} providerId 
   * @param {string} userId 
   * @param {object} details 
   */
  async logSecurityEvent(eventType, providerId, userId, details = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_security_logs') || '[]');
      logs.push({
        eventType,
        providerId,
        userId,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }
      
      localStorage.setItem('cafeos_security_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('[SecurityManager] Failed to log security event:', error);
    }
  }

  /**
   * Get security logs
   * @param {object} options 
   * @returns {Array}
   */
  getSecurityLogs(options = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_security_logs') || '[]');
      
      let filtered = logs;
      
      if (options.eventType) {
        filtered = filtered.filter(log => log.eventType === options.eventType);
      }
      
      if (options.providerId) {
        filtered = filtered.filter(log => log.providerId === options.providerId);
      }
      
      if (options.userId) {
        filtered = filtered.filter(log => log.userId === options.userId);
      }
      
      if (options.limit) {
        filtered = filtered.slice(-options.limit);
      }
      
      return filtered;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get security statistics
   * @returns {object}
   */
  getSecurityStatistics() {
    try {
      const logs = JSON.parse(localStorage.getItem('cafeos_security_logs') || '[]');
      const encryptedCredentials = JSON.parse(localStorage.getItem('cafeos_encrypted_credentials') || '{}');
      
      const stats = {
        totalEvents: logs.length,
        byEventType: {},
        encryptedProviders: Object.keys(encryptedCredentials).length,
        recentEvents: logs.slice(-10),
        lastRotation: null
      };
      
      for (const log of logs) {
        stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
        
        if (log.eventType === 'credential_rotation') {
          stats.lastRotation = log.timestamp;
        }
      }
      
      return stats;
    } catch (error) {
      return {
        totalEvents: 0,
        byEventType: {},
        encryptedProviders: 0,
        recentEvents: [],
        lastRotation: null
      };
    }
  }
}

// Singleton instance
const securityManager = new SecurityManager();

export default securityManager;
