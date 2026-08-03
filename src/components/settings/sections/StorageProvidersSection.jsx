// Storage Providers Section
// Comprehensive cloud storage provider management

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';
import storageEngine from '../../../cloud/StorageEngine.js';
import credentialManager from '../../../security/CredentialManager.js';
import { getCurrentUserId } from '../../../utils/authService.js';
import { validateCredentials } from '../../../utils/cloudSettingsValidation.js';

const PROVIDERS = [
  { id: 'local', name: 'Local Storage', icon: '💻', description: 'Browser localStorage', builtin: true },
  { id: 'aws-s3', name: 'AWS S3', icon: '☁️', description: 'Amazon Simple Storage Service', builtin: true },
  { id: 'gcs', name: 'Google Cloud Storage', icon: '🔷', description: 'Google Cloud Platform Storage', builtin: true },
  { id: 'azure-blob', name: 'Azure Blob', icon: '🔵', description: 'Microsoft Azure Blob Storage', builtin: true },
  { id: 'cloudflare-r2', name: 'Cloudflare R2', icon: '🌐', description: 'Cloudflare R2 Storage', builtin: true },
  { id: 'firebase-storage', name: 'Firebase Storage', icon: '🔥', description: 'Firebase Cloud Storage', builtin: true },
  { id: 'minio', name: 'MinIO', icon: '🗄️', description: 'Self-hosted S3-compatible storage', builtin: true },
  { id: 'supabase-storage', name: 'Supabase Storage', icon: '⚡', description: 'Supabase Cloud Storage', builtin: false },
  { id: 'backblaze-b2', name: 'Backblaze B2', icon: '💾', description: 'Backblaze B2 Cloud Storage', builtin: false }
];

export default function StorageProvidersSection({ isMobile }) {
  const [providers, setProviders] = useState([]);
  const [activeProviderId, setActiveProviderId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [credentials, setCredentials] = useState({});
  const [healthStatus, setHealthStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadProviders();
    loadHealthStatus();
  }, []);

  const loadProviders = async () => {
    try {
      await storageEngine.initialize();
      const providersInfo = storageEngine.getProvidersInfo();
      const activeInfo = storageEngine.getActiveProviderInfo();
      
      setProviders(providersInfo);
      setActiveProviderId(activeInfo?.id || null);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadHealthStatus = async () => {
    const status = {};
    for (const provider of providers) {
      try {
        const health = await storageEngine.getProviderHealth(provider.id);
        status[provider.id] = health;
      } catch (error) {
        status[provider.id] = { healthy: false, error: error.message };
      }
    }
    setHealthStatus(status);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSelectProvider = async (providerId) => {
    setSelectedProvider(providerId);
    
    // Load credentials from CredentialManager (masked)
    const userId = getCurrentUserId();
    const loadedCredentials = await credentialManager.retrieveCredentials(providerId, false, userId);
    
    if (loadedCredentials.success) {
      setCredentials(loadedCredentials.masked);
    } else {
      setCredentials({});
    }
  };

  const handleSetActiveProvider = async (providerId) => {
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    try {
      const result = await storageEngine.setActiveProvider(providerId, userId);
      
      if (result.success) {
        setActiveProviderId(providerId);
        showMessage('success', 'Provider activated successfully');
        await loadProviders();
      } else {
        showMessage('error', result.error || 'Failed to activate provider');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateProvider = async () => {
    setIsLoading(true);
    const userId = getCurrentUserId();
    
    try {
      const result = await storageEngine.clearActiveProvider(userId);
      
      if (result.success) {
        setActiveProviderId(null);
        showMessage('success', 'Provider deactivated successfully');
        await loadProviders();
      } else {
        showMessage('error', result.error || 'Failed to deactivate provider');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (providerId) => {
    setIsLoading(true);
    
    try {
      const result = await storageEngine.testProviderConnection(providerId);
      
      if (result.success) {
        showMessage('success', 'Connection test passed');
        await loadHealthStatus();
      } else {
        showMessage('error', result.error || 'Connection test failed');
      }
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setIsLoading(false);
    }
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

      {/* Active Provider Status */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Active Provider
        </h3>
        
        {activeProviderId ? (
          <div style={{
            padding: 16,
            background: 'var(--cafe-success-bg)',
            border: '1px solid var(--cafe-success-border)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>
                {providers.find(p => p.id === activeProviderId)?.info?.icon || '☁️'}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-success)' }}>
                  {providers.find(p => p.id === activeProviderId)?.info?.name || 'Unknown Provider'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
                  Active and configured
                </div>
              </div>
            </div>
            <button
              onClick={handleDeactivateProvider}
              disabled={isLoading}
              style={{ ...btn('ghost'), fontSize: 12, padding: '8px 12px', background: 'var(--cafe-danger-bg)', border: '1px solid var(--cafe-danger-border)', color: 'var(--cafe-danger)' }}
            >
              Deactivate
            </button>
          </div>
        ) : (
          <div style={{
            padding: 16,
            background: 'var(--cafe-warning-bg)',
            border: '1px solid var(--cafe-warning-border)',
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--cafe-warning)'
          }}>
            No cloud provider is currently active. Configure a provider below to enable cloud storage.
          </div>
        )}
      </div>

      {/* Available Providers */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Available Providers
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          {PROVIDERS.map((provider) => {
            const providerInfo = providers.find(p => p.id === provider.id);
            const isConnected = providerInfo?.instance?.connected || false;
            const isActive = activeProviderId === provider.id;
            const health = healthStatus[provider.id];
            
            return (
              <div
                key={provider.id}
                style={{
                  ...card,
                  padding: 16,
                  border: isActive ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                  background: isActive ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                  cursor: 'pointer',
                  opacity: !provider.builtin ? 0.5 : 1
                }}
                onClick={() => provider.builtin && handleSelectProvider(provider.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 24 }}>{provider.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                        {provider.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                        {provider.description}
                      </div>
                    </div>
                  </div>
                  {!provider.builtin && (
                    <span style={{ fontSize: 11, color: 'var(--cafe-warning)', background: 'var(--cafe-warning-bg)', padding: '2px 6px', borderRadius: 4 }}>
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isConnected ? (
                      <span style={{ fontSize: 11, color: 'var(--cafe-success)', background: 'var(--cafe-success-bg)', padding: '2px 8px', borderRadius: 4 }}>
                        Connected
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', background: 'var(--cafe-bg)', padding: '2px 8px', borderRadius: 4 }}>
                        Not Configured
                      </span>
                    )}
                    
                    {health && (
                      <span style={{ fontSize: 11, color: health.healthy ? 'var(--cafe-success)' : 'var(--cafe-danger)', background: health.healthy ? 'var(--cafe-success-bg)' : 'var(--cafe-danger-bg)', padding: '2px 8px', borderRadius: 4 }}>
                        {health.healthy ? `Healthy (${health.latency}ms)` : 'Unhealthy'}
                      </span>
                    )}
                  </div>
                  
                  {provider.builtin && isConnected && !isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetActiveProvider(provider.id); }}
                      disabled={isLoading}
                      style={{ ...btn('ghost'), fontSize: 11, padding: '6px 12px' }}
                    >
                      Activate
                    </button>
                  )}
                  
                  {provider.builtin && isConnected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleTestConnection(provider.id); }}
                      disabled={isLoading}
                      style={{ ...btn('ghost'), fontSize: 11, padding: '6px 12px' }}
                    >
                      Test
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Panel */}
      {selectedProvider && (
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              Configure {PROVIDERS.find(p => p.id === selectedProvider)?.name}
            </h3>
            <button
              onClick={() => setSelectedProvider(null)}
              style={{ ...btn('ghost'), fontSize: 12 }}
            >
              Close
            </button>
          </div>
          
          <p style={{ fontSize: 13, color: 'var(--cafe-text-secondary)', marginBottom: 16 }}>
            Configure your cloud storage provider credentials. All credentials are encrypted and stored securely.
          </p>
          
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 8 }}>
              Current Status
            </div>
            <div style={{ fontSize: 14, color: 'var(--cafe-text-primary)' }}>
              {providers.find(p => p.id === selectedProvider)?.instance?.connected ? 'Configured and Connected' : 'Not Configured'}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setShowConfigDialog(true)}
              disabled={isLoading}
              style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px', flex: 1 }}
            >
              {isLoading ? 'Loading...' : 'Configure Credentials'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
