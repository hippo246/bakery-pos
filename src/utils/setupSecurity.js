// Setup Security Utilities
// Secure storage, credential hashing, and input sanitization

const STORAGE_KEYS = {
  SETUP_PROGRESS: 'brewcrm_setup_progress',
  SETTINGS: 'brewcrm_settings',
  ONBOARDING_COMPLETED: 'brewcrm_onboarding_completed',
  OWNER_CREDENTIALS: 'brewcrm_owner_credentials'
};

// Simple hash function for demo purposes (use bcrypt in production)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password  }cafeos_salt_v1`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitize input to prevent XSS
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone format
export function isValidPhone(phone) {
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

// Sanitize object for storage to remove circular references
function sanitizeForStorage(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (seen.has(obj)) {
    return '[Circular Reference]';
  }

  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForStorage(item, seen));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Skip browser/window objects
      if (key === 'window' || key === 'document' || key === 'navigator') {
        continue;
      }
      sanitized[key] = sanitizeForStorage(obj[key], seen);
    }
  }

  return sanitized;
}

// Secure storage wrapper
export const secureStorage = {
  setItem: (key, value) => {
    try {
      // Sanitize value to remove circular references
     const sanitized = sanitizeForStorage(value);
      const data = JSON.stringify(sanitized);
      // In production, encrypt the data before storing
      localStorage.setItem(key, data);
      return true;
    } catch (error) {
      console.error('[secureStorage] Failed to set item:', error);
      return false;
    }
  },
  
  getItem: (key) => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      // In production, decrypt the data after retrieving
      return JSON.parse(data);
    } catch (error) {
      console.error('[secureStorage] Failed to get item:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[secureStorage] Failed to remove item:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('[secureStorage] Failed to clear:', error);
      return false;
    }
  }
};

// Check for duplicate owner accounts
export function checkDuplicateOwner(email) {
  const existingCredentials = secureStorage.getItem(STORAGE_KEYS.OWNER_CREDENTIALS);
  if (!existingCredentials) return false;
  return existingCredentials.some(cred => cred.email === email);
}

// Store owner credentials securely
export function storeOwnerCredentials(email, hashedPassword) {
  try {
    const existingCredentials = secureStorage.getItem(STORAGE_KEYS.OWNER_CREDENTIALS) || [];
    
    // Check for duplicates
    if (checkDuplicateOwner(email)) {
      throw new Error('Owner with this email already exists');
    }
    
    existingCredentials.push({
      email,
      hashedPassword,
      createdAt: new Date().toISOString()
    });
    
    secureStorage.setItem(STORAGE_KEYS.OWNER_CREDENTIALS, existingCredentials);
    return true;
  } catch (error) {
    console.error('[setupSecurity] Failed to store credentials:', error);
    return false;
  }
}

// Mark onboarding as completed
export function markOnboardingCompleted() {
  return secureStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, {
    completed: true,
    completedAt: new Date().toISOString()
  });
}

// Check if onboarding is completed
export function isOnboardingCompleted() {
  const status = secureStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return status && status.completed;
}

// Save setup progress
export function saveSetupProgress(currentStep, settings) {
  return secureStorage.setItem(STORAGE_KEYS.SETUP_PROGRESS, {
    currentStep,
    settings,
    lastSaved: new Date().toISOString()
  });
}

// Load setup progress
export function loadSetupProgress() {
  return secureStorage.getItem(STORAGE_KEYS.SETUP_PROGRESS);
}

// Clear setup progress
export function clearSetupProgress() {
  return secureStorage.removeItem(STORAGE_KEYS.SETUP_PROGRESS);
}

// Validate all settings before persistence
export function validateBeforePersistence(settings) {
  const errors = [];
  
  // Check for sensitive data exposure
  if (settings.password && settings.password.length > 0) {
    // Password should never be stored in plain text
    errors.push({
      field: 'password',
      message: 'Password must be hashed before storage'
    });
  }
  
  // Validate email format
  if (settings.email && !isValidEmail(settings.email)) {
    errors.push({
      field: 'email',
      message: 'Invalid email format'
    });
  }
  
  // Validate phone format
  if (settings.phone && !isValidPhone(settings.phone)) {
    errors.push({
      field: 'phone',
      message: 'Invalid phone format'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Verify owner password
export async function verifyOwnerPassword(password) {
  try {
    const credentials = secureStorage.getItem(STORAGE_KEYS.OWNER_CREDENTIALS);
    if (!credentials || credentials.length === 0) {
      return false;
    }

    const hashedPassword = await hashPassword(password);
    return credentials.some(cred => cred.hashedPassword === hashedPassword);
  } catch (error) {
    console.error('[setupSecurity] Failed to verify password:', error);
    return false;
  }
}

// Mask sensitive credential data for display
export function maskCredential(value, type = 'default') {
  if (!value || typeof value !== 'string') return '';

  switch (type) {
    case 'api_key':
    case 'secret_key':
    case 'application_key':
    case 'service_role_key':
      // Show first 4 and last 4 characters
      if (value.length <= 8) return '••••••••';
      return `${value.substring(0, 4)}${'•'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
    
    case 'password':
    case 'account_key':
      // Show only dots
      return '•'.repeat(Math.min(value.length, 20));
    
    case 'email': {
      // Show first character and domain
      const [local, domain] = value.split('@');
      if (!domain) return '••••••••';
      return `${local.charAt(0)}•••@${domain}`;
    }
    
    case 'connection_string':
      // Show first 20 characters
      if (value.length <= 20) return '••••••••••••••••••••';
      return `${value.substring(0, 20)}${'•'.repeat(10)}...`;
    
    case 'service_account':
      // For JSON keys, show first 50 characters
      if (value.length <= 50) return '••••••••••••••••••••••••••••••••••••••••••••';
      return `${value.substring(0, 50)}${'•'.repeat(20)}...`;
    
    default:
      // Default masking
      if (value.length <= 8) return '••••••••';
      return `${value.substring(0, 4)}${'•'.repeat(value.length - 8)}${value.substring(value.length - 4)}`;
  }
}

// Encrypt sensitive data using Web Crypto API
export async function encryptData(data, password) {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const passwordBuffer = encoder.encode(password);

    // Derive a key from the password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      dataBuffer
    );

    // Combine salt, iv, and encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...combined));
    return base64;
  } catch (error) {
    console.error('[setupSecurity] Failed to encrypt data:', error);
    throw error;
  }
}

// Decrypt sensitive data using Web Crypto API
export async function decryptData(encryptedBase64, password) {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Convert base64 to Uint8Array
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    // Derive the key from the password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('[setupSecurity] Failed to decrypt data:', error);
    throw error;
  }
}

// Store provider configuration securely
export async function storeProviderConfig(providerId, config, ownerPassword) {
  try {
    const storageKey = `cafeos_provider_config_${providerId}`;
    const encryptedConfig = await encryptData(JSON.stringify(config), ownerPassword);
    localStorage.setItem(storageKey, encryptedConfig);
    return true;
  } catch (error) {
    console.error('[setupSecurity] Failed to store provider config:', error);
    return false;
  }
}

// Retrieve provider configuration securely
export async function retrieveProviderConfig(providerId, ownerPassword) {
  try {
    const storageKey = `cafeos_provider_config_${providerId}`;
    const encryptedConfig = localStorage.getItem(storageKey);
    if (!encryptedConfig) return null;

    const decryptedConfig = await decryptData(encryptedConfig, ownerPassword);
    return JSON.parse(decryptedConfig);
  } catch (error) {
    console.error('[setupSecurity] Failed to retrieve provider config:', error);
    return null;
  }
}

// Validate provider credentials before storage
export function validateProviderCredentials(providerId, credentials) {
  const errors = [];

  // Common validations
  if (credentials.password && credentials.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (credentials.apiKey && credentials.apiKey.length < 16) {
    errors.push('API key must be at least 16 characters');
  }

  if (credentials.secretKey && credentials.secretKey.length < 16) {
    errors.push('Secret key must be at least 16 characters');
  }

  // Provider-specific validations
  switch (providerId) {
    case 'aws-s3':
      if (!credentials.bucket) errors.push('Bucket name is required');
      if (!credentials.region) errors.push('Region is required');
      break;
    case 'gcs':
      if (!credentials.projectId) errors.push('Project ID is required');
      break;
    case 'azure-blob':
      if (!credentials.accountName) errors.push('Account name is required');
      break;
    case 'firebase-storage':
      if (!credentials.projectId) errors.push('Project ID is required');
      break;
    case 'cloudflare-r2':
      if (!credentials.accountId) errors.push('Account ID is required');
      break;
    case 'backblaze-b2':
      if (!credentials.keyId) errors.push('Key ID is required');
      break;
    case 'supabase-storage':
      if (!credentials.projectUrl) errors.push('Project URL is required');
      break;
    case 'minio':
      if (!credentials.endpoint) errors.push('Endpoint is required');
      break;
    case 'smb-nas':
      if (!credentials.server) errors.push('Server address is required');
      break;
    case 'webdav':
      if (!credentials.url) errors.push('WebDAV URL is required');
      break;
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Check if user is authenticated as owner
export function isOwnerAuthenticated() {
  try {
    const authStatus = sessionStorage.getItem('cafeos_owner_auth');
    return authStatus === 'authenticated';
  } catch (_error) {
    return false;
  }
}

// Set owner authentication status
export function setOwnerAuthenticated(authenticated) {
  try {
    if (authenticated) {
      sessionStorage.setItem('cafeos_owner_auth', 'authenticated');
    } else {
      sessionStorage.removeItem('cafeos_owner_auth');
    }
    return true;
  } catch (error) {
    console.error('[setupSecurity] Failed to set auth status:', error);
    return false;
  }
}

// Clear all provider configurations
export function clearAllProviderConfigs() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cafeos_provider_config_')) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('[setupSecurity] Failed to clear provider configs:', error);
    return false;
  }
}

export { STORAGE_KEYS };
