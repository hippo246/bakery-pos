// Data Encryption for sensitive data at rest

class EncryptionManager {
  constructor() {
    this.algorithm = 'AES-GCM';
    this.keyLength = 256;
    this.ivLength = 12;
    this.encryptionKey = null;
    this.loadKey();
  }

  // Generate a random encryption key
  async generateKey() {
    const key = await crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export and store the key
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    this.saveKey(exportedKey);
    
    return key;
  }

  // Load encryption key from localStorage
  async loadKey() {
    try {
      if (typeof window !== 'undefined') {
        const storedKey = localStorage.getItem('encryption_key');
        if (storedKey) {
          const keyData = JSON.parse(storedKey);
          this.encryptionKey = await crypto.subtle.importKey(
            'jwk',
            keyData,
            { name: this.algorithm },
            true,
            ['encrypt', 'decrypt']
          );
        }
      }
    } catch (error) {
      console.error('Error loading encryption key:', error);
    }
  }

  // Save encryption key to localStorage
  saveKey(keyData) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('encryption_key', JSON.stringify(keyData));
      }
    } catch (error) {
      console.error('Error saving encryption key:', error);
    }
  }

  // Ensure encryption key exists
  async ensureKey() {
    if (!this.encryptionKey) {
      this.encryptionKey = await this.generateKey();
    }
    return this.encryptionKey;
  }

  // Encrypt data
  async encrypt(data) {
    try {
      await this.ensureKey();
      
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
      const encodedData = new TextEncoder().encode(JSON.stringify(data));
      
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        this.encryptionKey,
        encodedData
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);
      
      // Convert to base64 for storage
      const base64 = btoa(String.fromCharCode(...combined));
      
      return {
        encrypted: base64,
        algorithm: this.algorithm,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  async decrypt(encryptedData) {
    try {
      await this.ensureKey();
      
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = combined.slice(0, this.ivLength);
      const data = combined.slice(this.ivLength);
      
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: iv
        },
        this.encryptionKey,
        data
      );
      
      const decodedData = new TextDecoder().decode(decryptedData);
      return JSON.parse(decodedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt specific fields in an object
  async encryptFields(obj, fieldsToEncrypt) {
    const encryptedObj = { ...obj };
    
    for (const field of fieldsToEncrypt) {
      if (encryptedObj[field]) {
        encryptedObj[field] = await this.encrypt(encryptedObj[field]);
      }
    }
    
    return encryptedObj;
  }

  // Decrypt specific fields in an object
  async decryptFields(obj, fieldsToDecrypt) {
    const decryptedObj = { ...obj };
    
    for (const field of fieldsToDecrypt) {
      if (decryptedObj[field] && typeof decryptedObj[field] === 'object') {
        try {
          decryptedObj[field] = await this.decrypt(decryptedObj[field].encrypted);
        } catch (error) {
          // If decryption fails, keep original value
          console.warn(`Failed to decrypt field ${field}:`, error);
        }
      }
    }
    
    return decryptedObj;
  }

  // Hash sensitive data (for passwords, etc.)
  async hash(data) {
    const encodedData = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verify hash
  async verifyHash(data, hash) {
    const computedHash = await this.hash(data);
    return computedHash === hash;
  }

  // Generate random token
  generateToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Securely wipe data from memory
  secureWipe(data) {
    if (typeof data === 'string') {
      // Overwrite string with random data
      const array = new Uint8Array(data.length);
      crypto.getRandomValues(array);
      return String.fromCharCode(...array);
    }
    return null;
  }
}

// Singleton instance
let encryptionManager = null;

export const getEncryptionManager = () => {
  if (!encryptionManager) {
    encryptionManager = new EncryptionManager();
  }
  return encryptionManager;
};

// Fields that should be encrypted by default
export const SensitiveFields = {
  CUSTOMER: ['phone', 'email', 'address'],
  STAFF: ['phone', 'email', 'address', 'bankAccount', 'panNumber'],
  SUPPLIER: ['phone', 'email', 'bankAccount', 'gstNumber'],
  PAYMENT: ['cardNumber', 'cvv', 'expiryDate'],
  SETTINGS: ['razorpayKeySecret', 'brevoApiKey']
};

// Utility to encrypt sensitive data before storage
export const encryptSensitiveData = async (data, entityType) => {
  const manager = getEncryptionManager();
  const fields = SensitiveFields[entityType] || [];
  return await manager.encryptFields(data, fields);
};

// Utility to decrypt sensitive data after retrieval
export const decryptSensitiveData = async (data, entityType) => {
  const manager = getEncryptionManager();
  const fields = SensitiveFields[entityType] || [];
  return await manager.decryptFields(data, fields);
};
