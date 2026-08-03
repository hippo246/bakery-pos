// Storage Provider Factory
// Central registry mapping a providerId string (e.g. what StorageSelectionStep
// collects) to its implementation class, so callers don't need to know which
// file/class backs a given provider.
//
// Two provider families exist today with slightly different capability sets:
//  - BaseProvider-based (AWS S3, Azure, Backblaze B2, Cloudflare R2, Firebase,
//    GCS, Local, MinIO, SMB, Supabase, WebDAV): async validateCredentials(),
//    metadata()/quota() naming.
//  - StorageProviderInterface-based (Mock, Memory): now also expose
//    metadata()/quota() aliases and an async validateCredentials() for
//    compatibility, but retain some extra methods (listFolders, getUsage,
//    saveCredentials, disable, reconnect, rotateCredentials, getSyncStatus)
//    that BaseProvider providers don't implement. Don't rely on those extras
//    when treating providers polymorphically.

import { AWSS3Provider } from './AWSS3Provider.js';
import { AzureBlobProvider } from './AzureBlobProvider.js';
import { BackblazeB2Provider } from './BackblazeB2Provider.js';
import { CloudflareR2Provider } from './CloudflareR2Provider.js';
import { FirebaseStorageProvider } from './FirebaseStorageProvider.js';
import { GCSProvider } from './GCSProvider.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import { MemoryProvider } from './MemoryProvider.js';
import { MinIOProvider } from './MinIOProvider.js';
import { MockProvider } from './MockProvider.js';
import { SMBProvider } from './SMBProvider.js';
import { SupabaseStorageProvider } from './SupabaseStorageProvider.js';
import { WebDAVProvider } from './WebDAVProvider.js';

export const PROVIDER_REGISTRY = {
  'local': LocalStorageProvider,
  'aws-s3': AWSS3Provider,
  'azure-blob': AzureBlobProvider,
  'backblaze-b2': BackblazeB2Provider,
  'cloudflare-r2': CloudflareR2Provider,
  'firebase-storage': FirebaseStorageProvider,
  'gcs': GCSProvider,
  'minio': MinIOProvider,
  'smb-nas': SMBProvider,
  'supabase-storage': SupabaseStorageProvider,
  'webdav': WebDAVProvider,
  'mock': MockProvider,
  'memory': MemoryProvider
};

/**
 * Create a provider instance by id.
 * @param {string} providerId - One of the keys in PROVIDER_REGISTRY
 * @param {object} config - Provider-specific config (bucket, keys, etc.)
 * @returns {Promise<BaseProvider|StorageProviderInterface>}
 */
export async function createProvider(providerId, config = {}) {
  const ProviderClass = PROVIDER_REGISTRY[providerId];
  if (!ProviderClass) {
    throw new Error(`Unknown storage provider: "${providerId}". Available: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`);
  }
  const provider = new ProviderClass(config);
  await provider.initialize();
  return provider;
}

/**
 * List available provider ids.
 * @returns {string[]}
 */
export function listProviderIds() {
  return Object.keys(PROVIDER_REGISTRY);
}
