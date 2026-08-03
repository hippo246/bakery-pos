// Cloud Storage Provider Abstraction Layer
// Supports AWS S3, Google Cloud Storage, Azure Blob Storage, Firebase Storage

export const CLOUD_PROVIDERS = {
  AWS_S3: {
    id: 'aws_s3',
    name: 'AWS S3',
    icon: '☁️',
    description: 'Amazon Simple Storage Service',
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket', 'region']
  },
  GCS: {
    id: 'gcs',
    name: 'Google Cloud Storage',
    icon: '🔷',
    description: 'Google Cloud Platform Storage',
    requiredFields: ['projectId', 'bucket', 'keyFilePath']
  },
  AZURE_BLOB: {
    id: 'azure_blob',
    name: 'Azure Blob Storage',
    icon: '🔵',
    description: 'Microsoft Azure Blob Storage',
    requiredFields: ['accountName', 'accountKey', 'container']
  },
  FIREBASE_STORAGE: {
    id: 'firebase_storage',
    name: 'Firebase Storage',
    icon: '🔥',
    description: 'Firebase Cloud Storage',
    requiredFields: ['apiKey', 'authDomain', 'projectId', 'storageBucket']
  },
  MINIO: {
    id: 'minio',
    name: 'MinIO',
    icon: '🗄️',
    description: 'Self-hosted S3-compatible storage',
    requiredFields: ['endpoint', 'accessKey', 'secretKey', 'bucket']
  },
  DIGITAL_OCEAN_SPACES: {
    id: 'do_spaces',
    name: 'DigitalOcean Spaces',
    icon: '🌊',
    description: 'DigitalOcean Object Storage',
    requiredFields: ['accessKeyId', 'secretAccessKey', 'bucket', 'region']
  },
  BACKBLAZE_B2: {
    id: 'backblaze_b2',
    name: 'Backblaze B2',
    icon: '💾',
    description: 'Backblaze B2 Cloud Storage',
    requiredFields: ['applicationKeyId', 'applicationKey', 'bucket']
  }
};

const CLOUD_STORAGE_KEY = 'cafeos_cloud_storage_config';
const ACTIVE_PROVIDER_KEY = 'cafeos_active_cloud_provider';

/**
 * Get cloud storage configuration
 */
export function getCloudStorageConfig() {
  try {
    const stored = localStorage.getItem(CLOUD_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load cloud storage config:', e);
  }
  
  return {};
}

/**
 * Save cloud storage configuration
 */
export function saveCloudStorageConfig(config) {
  try {
    localStorage.setItem(CLOUD_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch (e) {
    console.error('Failed to save cloud storage config:', e);
    return false;
  }
}

/**
 * Get active cloud provider
 */
export function getActiveCloudProvider() {
  try {
    const stored = localStorage.getItem(ACTIVE_PROVIDER_KEY);
    if (stored) {
      return stored;
    }
  } catch (e) {
    console.warn('Failed to load active cloud provider:', e);
  }
  
  return null;
}

/**
 * Set active cloud provider (disables all others)
 */
export function setActiveCloudProvider(providerId) {
  try {
    localStorage.setItem(ACTIVE_PROVIDER_KEY, providerId);
    
    // Disable all other providers' credentials for security
    const config = getCloudStorageConfig();
    Object.keys(config).forEach(key => {
      if (key !== providerId && config[key]) {
        // Clear credentials for inactive providers
        config[key] = {
          ...config[key],
          credentials: null,
          enabled: false
        };
      }
    });
    
    saveCloudStorageConfig(config);
    return true;
  } catch (e) {
    console.error('Failed to set active cloud provider:', e);
    return false;
  }
}

/**
 * Clear active cloud provider
 */
export function clearActiveCloudProvider() {
  try {
    localStorage.removeItem(ACTIVE_PROVIDER_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear active cloud provider:', e);
    return false;
  }
}

/**
 * Upload file to cloud storage
 */
export async function uploadToCloudStorage(file, key, providerId = null) {
  const activeProvider = providerId || getActiveCloudProvider();
  
  if (!activeProvider) {
    throw new Error('No active cloud provider configured');
  }

  const config = getCloudStorageConfig();
  const providerConfig = config[activeProvider];

  if (!providerConfig || !providerConfig.credentials) {
    throw new Error(`No credentials configured for ${activeProvider}`);
  }

  try {
    switch (activeProvider) {
      case 'aws_s3':
        return await uploadToS3(file, key, providerConfig.credentials);
      case 'gcs':
        return await uploadToGCS(file, key, providerConfig.credentials);
      case 'azure_blob':
        return await uploadToAzure(file, key, providerConfig.credentials);
      case 'firebase_storage':
        return await uploadToFirebase(file, key, providerConfig.credentials);
      case 'minio':
        return await uploadToMinIO(file, key, providerConfig.credentials);
      case 'do_spaces':
        return await uploadToSpaces(file, key, providerConfig.credentials);
      case 'backblaze_b2':
        return await uploadToB2(file, key, providerConfig.credentials);
      default:
        throw new Error(`Unsupported provider: ${activeProvider}`);
    }
  } catch (error) {
    console.error(`Cloud storage upload failed for ${activeProvider}:`, error);
    throw error;
  }
}

/**
 * Download file from cloud storage
 */
export async function downloadFromCloudStorage(key, providerId = null) {
  const activeProvider = providerId || getActiveCloudProvider();
  
  if (!activeProvider) {
    throw new Error('No active cloud provider configured');
  }

  const config = getCloudStorageConfig();
  const providerConfig = config[activeProvider];

  if (!providerConfig || !providerConfig.credentials) {
    throw new Error(`No credentials configured for ${activeProvider}`);
  }

  try {
    switch (activeProvider) {
      case 'aws_s3':
        return await downloadFromS3(key, providerConfig.credentials);
      case 'gcs':
        return await downloadFromGCS(key, providerConfig.credentials);
      case 'azure_blob':
        return await downloadFromAzure(key, providerConfig.credentials);
      case 'firebase_storage':
        return await downloadFromFirebase(key, providerConfig.credentials);
      case 'minio':
        return await downloadFromMinIO(key, providerConfig.credentials);
      case 'do_spaces':
        return await downloadFromSpaces(key, providerConfig.credentials);
      case 'backblaze_b2':
        return await downloadFromB2(key, providerConfig.credentials);
      default:
        throw new Error(`Unsupported provider: ${activeProvider}`);
    }
  } catch (error) {
    console.error(`Cloud storage download failed for ${activeProvider}:`, error);
    throw error;
  }
}

/**
 * Delete file from cloud storage
 */
export async function deleteFromCloudStorage(key, providerId = null) {
  const activeProvider = providerId || getActiveCloudProvider();
  
  if (!activeProvider) {
    throw new Error('No active cloud provider configured');
  }

  const config = getCloudStorageConfig();
  const providerConfig = config[activeProvider];

  if (!providerConfig || !providerConfig.credentials) {
    throw new Error(`No credentials configured for ${activeProvider}`);
  }

  try {
    switch (activeProvider) {
      case 'aws_s3':
        return await deleteFromS3(key, providerConfig.credentials);
      case 'gcs':
        return await deleteFromGCS(key, providerConfig.credentials);
      case 'azure_blob':
        return await deleteFromAzure(key, providerConfig.credentials);
      case 'firebase_storage':
        return await deleteFromFirebase(key, providerConfig.credentials);
      case 'minio':
        return await deleteFromMinIO(key, providerConfig.credentials);
      case 'do_spaces':
        return await deleteFromSpaces(key, providerConfig.credentials);
      case 'backblaze_b2':
        return await deleteFromB2(key, providerConfig.credentials);
      default:
        throw new Error(`Unsupported provider: ${activeProvider}`);
    }
  } catch (error) {
    console.error(`Cloud storage delete failed for ${activeProvider}:`, error);
    throw error;
  }
}

/**
 * List files in cloud storage
 */
export async function listCloudStorageFiles(prefix = '', providerId = null) {
  const activeProvider = providerId || getActiveCloudProvider();
  
  if (!activeProvider) {
    throw new Error('No active cloud provider configured');
  }

  const config = getCloudStorageConfig();
  const providerConfig = config[activeProvider];

  if (!providerConfig || !providerConfig.credentials) {
    throw new Error(`No credentials configured for ${activeProvider}`);
  }

  try {
    switch (activeProvider) {
      case 'aws_s3':
        return await listS3Files(prefix, providerConfig.credentials);
      case 'gcs':
        return await listGCSFiles(prefix, providerConfig.credentials);
      case 'azure_blob':
        return await listAzureFiles(prefix, providerConfig.credentials);
      case 'firebase_storage':
        return await listFirebaseFiles(prefix, providerConfig.credentials);
      case 'minio':
        return await listMinIOFiles(prefix, providerConfig.credentials);
      case 'do_spaces':
        return await listSpacesFiles(prefix, providerConfig.credentials);
      case 'backblaze_b2':
        return await listB2Files(prefix, providerConfig.credentials);
      default:
        throw new Error(`Unsupported provider: ${activeProvider}`);
    }
  } catch (error) {
    console.error(`Cloud storage list failed for ${activeProvider}:`, error);
    throw error;
  }
}

// Provider-specific implementations (stubs - would need actual SDK integration)

async function uploadToS3(file, key, credentials) {
  // AWS SDK v3 implementation would go here
  // For now, return mock success
  console.log('[CloudStorage] Upload to S3:', key, credentials.bucket);
  return { success: true, url: `s3://${credentials.bucket}/${key}` };
}

async function downloadFromS3(key, _credentials) {
  console.log('[CloudStorage] Download from S3:', key);
  return { success: true, data: null };
}

async function deleteFromS3(key, _credentials) {
  console.log('[CloudStorage] Delete from S3:', key);
  return { success: true };
}

async function listS3Files(prefix, _credentials) {
  console.log('[CloudStorage] List S3 files:', prefix);
  return { success: true, files: [] };
}

async function uploadToGCS(file, key, credentials) {
  console.log('[CloudStorage] Upload to GCS:', key, credentials.bucket);
  return { success: true, url: `gs://${credentials.bucket}/${key}` };
}

async function downloadFromGCS(key, _credentials) {
  console.log('[CloudStorage] Download from GCS:', key);
  return { success: true, data: null };
}

async function deleteFromGCS(key, _credentials) {
  console.log('[CloudStorage] Delete from GCS:', key);
  return { success: true };
}

async function listGCSFiles(prefix, _credentials) {
  console.log('[CloudStorage] List GCS files:', prefix);
  return { success: true, files: [] };
}

async function uploadToAzure(file, key, credentials) {
  console.log('[CloudStorage] Upload to Azure:', key, credentials.container);
  return { success: true, url: `https://${credentials.accountName}.blob.core.windows.net/${credentials.container}/${key}` };
}

async function downloadFromAzure(key, _credentials) {
  console.log('[CloudStorage] Download from Azure:', key);
  return { success: true, data: null };
}

async function deleteFromAzure(key, _credentials) {
  console.log('[CloudStorage] Delete from Azure:', key);
  return { success: true };
}

async function listAzureFiles(prefix, _credentials) {
  console.log('[CloudStorage] List Azure files:', prefix);
  return { success: true, files: [] };
}

async function uploadToFirebase(file, key, credentials) {
  console.log('[CloudStorage] Upload to Firebase:', key, credentials.storageBucket);
  return { success: true, url: `gs://${credentials.storageBucket}/${key}` };
}

async function downloadFromFirebase(key, _credentials) {
  console.log('[CloudStorage] Download from Firebase:', key);
  return { success: true, data: null };
}

async function deleteFromFirebase(key, _credentials) {
  console.log('[CloudStorage] Delete from Firebase:', key);
  return { success: true };
}

async function listFirebaseFiles(prefix, _credentials) {
  console.log('[CloudStorage] List Firebase files:', prefix);
  return { success: true, files: [] };
}

async function uploadToMinIO(file, key, credentials) {
  console.log('[CloudStorage] Upload to MinIO:', key, credentials.bucket);
  return { success: true, url: `${credentials.endpoint}/${credentials.bucket}/${key}` };
}

async function downloadFromMinIO(key, _credentials) {
  console.log('[CloudStorage] Download from MinIO:', key);
  return { success: true, data: null };
}

async function deleteFromMinIO(key, _credentials) {
  console.log('[CloudStorage] Delete from MinIO:', key);
  return { success: true };
}

async function listMinIOFiles(prefix, _credentials) {
  console.log('[CloudStorage] List MinIO files:', prefix);
  return { success: true, files: [] };
}

async function uploadToSpaces(file, key, credentials) {
  console.log('[CloudStorage] Upload to Spaces:', key, credentials.bucket);
  return { success: true, url: `https://${credentials.bucket}.${credentials.region}.digitaloceanspaces.com/${key}` };
}

async function downloadFromSpaces(key, _credentials) {
  console.log('[CloudStorage] Download from Spaces:', key);
  return { success: true, data: null };
}

async function deleteFromSpaces(key, _credentials) {
  console.log('[CloudStorage] Delete from Spaces:', key);
  return { success: true };
}

async function listSpacesFiles(prefix, _credentials) {
  console.log('[CloudStorage] List Spaces files:', prefix);
  return { success: true, files: [] };
}

async function uploadToB2(file, key, credentials) {
  console.log('[CloudStorage] Upload to B2:', key, credentials.bucket);
  return { success: true, url: `b2://${credentials.bucket}/${key}` };
}

async function downloadFromB2(key, _credentials) {
  console.log('[CloudStorage] Download from B2:', key);
  return { success: true, data: null };
}

async function deleteFromB2(key, _credentials) {
  console.log('[CloudStorage] Delete from B2:', key);
  return { success: true };
}

async function listB2Files(prefix, _credentials) {
  console.log('[CloudStorage] List B2 files:', prefix);
  return { success: true, files: [] };
}

/**
 * Validate cloud storage credentials
 */
export function validateCloudCredentials(providerId, credentials) {
  const provider = CLOUD_PROVIDERS[providerId];
  
  if (!provider) {
    return { valid: false, errors: ['Unknown provider'] };
  }

  const errors = [];
  
  provider.requiredFields.forEach(field => {
    if (!credentials[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Clear all cloud storage credentials (security measure)
 */
export function clearAllCloudCredentials() {
  try {
    localStorage.removeItem(CLOUD_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_PROVIDER_KEY);
    return true;
  } catch (e) {
    console.error('Failed to clear cloud credentials:', e);
    return false;
  }
}
