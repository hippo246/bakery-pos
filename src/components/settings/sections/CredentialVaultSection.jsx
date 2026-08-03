// Credential Vault Section
// Secure credential management with Secret Vault integration

import React, { useState, useEffect } from 'react';
import { card, btn } from '../../../styles/theme';
import credentialManager from '../../../security/CredentialManager.js';
import { getCurrentUserId } from '../../../utils/authService.js';
import CredentialInput from '../../security/CredentialInput.jsx';

const PROVIDER_FIELDS = {
  'aws-s3': [
    { name: 'accessKey', label: 'Access Key ID', required: true, sensitive: true },
    { name: 'secretKey', label: 'Secret Access Key', required: true, sensitive: true },
    { name: 'region', label: 'Region', required: false, sensitive: false },
    { name: 'bucket', label: 'Bucket Name', required: true, sensitive: false }
  ],
  'cloudflare-r2': [
    { name: 'accountId', label: 'Account ID', required: true, sensitive: false },
    { name: 'accessKey', label: 'Access Key ID', required: true, sensitive: true },
    { name: 'secretKey', label: 'Secret Access Key', required: true, sensitive: true },
    { name: 'bucket', label: 'Bucket Name', required: true, sensitive: false }
  ],
  'minio': [
    { name: 'endpoint', label: 'Endpoint', required: true, sensitive: false },
    { name: 'port', label: 'Port', required: false, sensitive: false },
    { name: 'accessKey', label: 'Access Key', required: true, sensitive: true },
    { name: 'secretKey', label: 'Secret Key', required: true, sensitive: true },
    { name: 'bucket', label: 'Bucket Name', required: true, sensitive: false }
  ],
  'firebase-storage': [
    { name: 'apiKey', label: 'API Key', required: true, sensitive: true },
    { name: 'projectId', label: 'Project ID', required: true, sensitive: false },
    { name: 'authDomain', label: 'Auth Domain', required: false, sensitive: false },
    { name: 'storageBucket', label: 'Storage Bucket', required: true, sensitive: false }
  ]
};

export default function CredentialVaultSection({ isMobile }) {
  const [providersWithCredentials, setProvidersWithCredentials] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [credentialMetadata, setCredentialMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRotateDialog, setShowRotateDialog] = useState(false);

  useEffect(() => {
    loadProvidersWithCredentials();
  }, []);

  const loadProvidersWithCredentials = async () => {
    try {
      await credentialManager.initialize();
      const providers = credentialManager.listProvidersWithCredentials();
      setProvidersWithCredentials(providers);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSelectProvider = async (providerId) => {
    setSelectedProvider(providerId);
    
    const userId = getCurrentUserId();
    const loadedCredentials = await credentialManager.retrieveCredentials(providerId, false, userId);
    
    if (loadedCredentials.success) {
      setCredentials(loadedCredentials.masked);
      const metadata = credentialManager.getCredentialMetadata(providerId);
      setCredentialMetadata(metadata || {});
    } else {
      setCredentials({});
      setCredentialMetadata({});
    }
  };

  const handleSaveCredentials = async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    try {
      const result = await credentialManager.updateCredentials(selectedProvider, credentials, userId);
      
      if (result.success) {
        showMessage('success', 'Credentials updated successfully');
        await loadProvidersWithCredentials();
        await handleSelectProvider(selectedProvider);
      } else {
        showMessage('error', result.error || 'Failed to update credentials');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    try {
      const result = await credentialManager.deleteCredentials(selectedProvider, userId);
      
      if (result.success) {
        showMessage('success', 'Credentials deleted successfully');
        setShowDeleteConfirm(false);
        setSelectedProvider(null);
        setCredentials({});
        await loadProvidersWithCredentials();
      } else {
        showMessage('error', result.error || 'Failed to delete credentials');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRotateCredentials = async () => {
    if (!selectedProvider) return;
    
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    try {
      const result = await credentialManager.rotateCredentials(selectedProvider, credentials, userId);
      
      if (result.success) {
        showMessage('success', 'Credentials rotated successfully');
        setShowRotateDialog(false);
        await loadProvidersWithCredentials();
        await handleSelectProvider(selectedProvider);
      } else {
        showMessage('error', result.error || 'Failed to rotate credentials');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const getFields = (providerId) => {
    return PROVIDER_FIELDS[providerId] || [];
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: message.type === 'error' ? 'var(--cafe-danger-bg)' : 'var(--cafe-success-bg)',
          border: `1px solid ${message.type === 'error' ? 'var(--cafe-danger-border)' : 'var(--cafe-success-border)'}`,
          color: message.type === 'error' ? 'var(--cafe-danger)' : 'var(--cafe-success)',
          fontSize: 13,
          fontWeight: 500
        }}>
          {message.text}
        </div>
      )}

      {/* Vault Status */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Credential Vault Status
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Providers with Credentials</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {providersWithCredentials.length}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Encryption Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-success)' }}>
              AES-GCM 256-bit
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Vault Status</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-success)' }}>
              Secure
            </div>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Stored Credentials
        </h3>
        
        {providersWithCredentials.length === 0 ? (
          <div style={{
            padding: 24,
            background: 'var(--cafe-bg)',
            borderRadius: 8,
            textAlign: 'center',
            color: 'var(--cafe-text-secondary)'
          }}>
            No credentials stored in vault. Configure a storage provider to add credentials.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {providersWithCredentials.map((providerId) => (
              <div
                key={providerId}
                onClick={() => handleSelectProvider(providerId)}
                style={{
                  padding: 16,
                  background: 'var(--cafe-bg)',
                  borderRadius: 8,
                  border: selectedProvider === providerId ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                    {providerId.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--cafe-success)', background: 'var(--cafe-success-bg)', padding: '2px 8px', borderRadius: 4 }}>
                    Encrypted
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Credential Details */}
      {selectedProvider && (
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {selectedProvider.toUpperCase()} Credentials
            </h3>
            <button
              onClick={() => setSelectedProvider(null)}
              style={{ ...btn('ghost'), fontSize: 12 }}
            >
              Close
            </button>
          </div>

          {/* Metadata */}
          {credentialMetadata && (
            <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 8 }}>Credential Metadata</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Created: </span>
                  <span style={{ fontSize: 12, color: 'var(--cafe-text-primary)' }}>{formatTimestamp(credentialMetadata.createdAt)}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Last Updated: </span>
                  <span style={{ fontSize: 12, color: 'var(--cafe-text-primary)' }}>{formatTimestamp(credentialMetadata.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Credential Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            {getFields(selectedProvider).map((field) => (
              <CredentialInput
                key={field.name}
                label={field.label}
                value={credentials[field.name] || ''}
                onChange={(value) => handleCredentialChange(field.name, value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                required={field.required}
                sensitive={field.sensitive}
                providerId={selectedProvider}
                fieldName={field.name}
              />
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSaveCredentials}
              disabled={isLoading}
              style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px', flex: 1 }}
            >
              {isLoading ? 'Saving...' : 'Update Credentials'}
            </button>
            <button
              onClick={() => setShowRotateDialog(true)}
              disabled={isLoading}
              style={{ ...btn('ghost'), fontSize: 13, padding: '10px 20px', flex: 1 }}
            >
              Rotate
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
              style={{ ...btn('ghost'), fontSize: 13, padding: '10px 20px', background: 'var(--cafe-danger-bg)', border: '1px solid var(--cafe-danger-border)', color: 'var(--cafe-danger)', flex: 1 }}
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border)', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 8 }}>
              Delete Credentials
            </h3>
            <p style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginBottom: 24 }}>
              Are you sure you want to delete these credentials? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ ...btn('ghost'), fontSize: 14, padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCredentials}
                disabled={isLoading}
                style={{ ...btn('primary'), fontSize: 14, padding: '10px 20px', background: 'var(--cafe-danger)', border: 'none' }}
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotate Confirmation Dialog */}
      {showRotateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border)', borderRadius: 16, padding: 32, maxWidth: 400, width: '90%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 8 }}>
              Rotate Credentials
            </h3>
            <p style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginBottom: 24 }}>
              This will invalidate the current credentials and store the new ones. Make sure you have the new credentials ready.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRotateDialog(false)}
                style={{ ...btn('ghost'), fontSize: 14, padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRotateCredentials}
                disabled={isLoading}
                style={{ ...btn('primary'), fontSize: 14, padding: '10px 20px' }}
              >
                {isLoading ? 'Rotating...' : 'Rotate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
