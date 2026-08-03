import React from 'react';
// Storage Selection Step
// Allows users to choose their backend storage provider during setup

import { useState, useCallback } from "react";
import storageEngine from "../../../cloud/StorageEngine.js";
import { getCurrentUserId } from "../../../utils/authService.js";

const STORAGE_PROVIDERS = [
  {
    id: 'local',
    name: 'Local Storage',
    description: 'Store data in browser localStorage. Best for single-device use and testing.',
    icon: '💾',
    features: ['No setup required', 'Works offline', 'Single device', 'No cloud costs'],
    limitations: ['Data limited to browser', 'No device sync', 'Browser clear deletes data'],
    recommended: true,
    free: true
  },
  {
    id: 'aws-s3',
    name: 'Amazon S3',
    description: 'Cloud storage with unlimited scalability. Best for multi-location businesses.',
    icon: '☁️',
    features: ['Unlimited storage', 'Multi-device sync', 'Automatic backups', 'High availability'],
    limitations: ['Requires AWS account', 'Cloud costs apply', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'azure-blob',
    name: 'Azure Blob Storage',
    description: 'Microsoft cloud storage with strong enterprise integration.',
    icon: '🔷',
    features: ['Unlimited storage', 'Multi-device sync', 'Automatic backups', 'Enterprise-ready'],
    limitations: ['Requires Azure account', 'Cloud costs apply', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'gcs',
    name: 'Google Cloud Storage',
    description: 'Google\u2019s object storage, good if you\u2019re already on GCP.',
    icon: '🟡',
    features: ['Unlimited storage', 'Multi-device sync', 'Automatic backups', 'High availability'],
    limitations: ['Requires GCP account', 'Cloud costs apply', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'cloudflare-r2',
    name: 'Cloudflare R2',
    description: 'S3-compatible storage with no egress fees.',
    icon: '🧡',
    features: ['No egress fees', 'S3-compatible', 'Multi-device sync', 'Fast global reads'],
    limitations: ['Requires Cloudflare account', 'Cloud costs apply', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'backblaze-b2',
    name: 'Backblaze B2',
    description: 'Low-cost cloud object storage, S3-compatible API available.',
    icon: '🔥',
    features: ['Low cost per GB', 'Multi-device sync', 'Automatic backups'],
    limitations: ['Requires Backblaze account', 'Cloud costs apply', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'minio',
    name: 'MinIO',
    description: 'Self-hosted, S3-compatible object storage you run yourself.',
    icon: '🖥️',
    features: ['Full data control', 'S3-compatible', 'No vendor lock-in', 'Runs on your hardware'],
    limitations: ['Requires self-hosted server', 'You manage uptime/backups'],
    recommended: false,
    free: true
  },
  {
    id: 'firebase-storage',
    name: 'Firebase Storage',
    description: 'Google\u2019s app-focused storage, simple to set up for small teams.',
    icon: '🔥',
    features: ['Quick setup', 'Multi-device sync', 'Good free tier'],
    limitations: ['Requires Firebase project', 'Cloud costs apply at scale', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'supabase-storage',
    name: 'Supabase Storage',
    description: 'Open-source backend storage, easy to pair with a Supabase project.',
    icon: '⚡',
    features: ['Quick setup', 'Multi-device sync', 'Open source', 'Good free tier'],
    limitations: ['Requires Supabase project', 'Cloud costs apply at scale', 'Internet required'],
    recommended: false,
    free: false
  },
  {
    id: 'webdav',
    name: 'WebDAV',
    description: 'Connect to any WebDAV-compatible server (Nextcloud, ownCloud, etc).',
    icon: '🌐',
    features: ['Works with many self-hosted tools', 'Multi-device sync'],
    limitations: ['Requires a WebDAV server', 'You manage uptime/backups'],
    recommended: false,
    free: true
  },
  {
    id: 'smb-nas',
    name: 'SMB / NAS',
    description: 'Connect to a network file share or NAS device on your local network.',
    icon: '🗄️',
    features: ['Keep data on-site', 'No cloud costs', 'Works with existing NAS hardware'],
    limitations: ['Requires backend server support', 'Local network only by default'],
    recommended: false,
    free: true
  },
  {
    id: 'mock',
    name: 'Mock/Demo Storage',
    description: 'In-memory storage for testing and demo purposes only.',
    icon: '🧪',
    features: ['Instant setup', 'No persistence', 'Testing only', 'Reset on refresh'],
    limitations: ['Data not saved', 'Not for production', 'Lost on refresh'],
    recommended: false,
    free: true
  }
];

// Config field schema per provider, used to render a generic config form
// instead of hand-coding one block per provider. Types: 'text' | 'password' | 'select'.
const PROVIDER_CONFIG_FIELDS = {
  'aws-s3': [
    { key: 'accessKey', label: 'Access Key ID', type: 'text', required: true, placeholder: 'AKIAIOSFODNN7EXAMPLE' },
    { key: 'secretKey', label: 'Secret Access Key', type: 'password', required: true, placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' },
    { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'my-cafe-bucket' },
    { key: 'region', label: 'Region', type: 'select', required: true, options: [
      { value: 'us-east-1', label: 'US East (N. Virginia)' },
      { value: 'us-west-2', label: 'US West (Oregon)' },
      { value: 'eu-west-1', label: 'Europe (Ireland)' },
      { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
      { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' }
    ]}
  ],
  'azure-blob': [
    { key: 'accountName', label: 'Account Name', type: 'text', required: true, placeholder: 'mystorageaccount' },
    { key: 'accountKey', label: 'Account Key', type: 'password', required: true, placeholder: 'Base64-encoded account key' },
    { key: 'container', label: 'Container Name', type: 'text', required: true, placeholder: 'cafe-container' }
  ],
  'gcs': [
    { key: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'my-gcp-project' },
    { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'my-cafe-bucket' },
    { key: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'password', required: true, placeholder: '{"type": "service_account", ...}' }
  ],
  'cloudflare-r2': [
    { key: 'accountId', label: 'Account ID', type: 'text', required: true, placeholder: 'Cloudflare account ID' },
    { key: 'accessKey', label: 'Access Key ID', type: 'text', required: true, placeholder: 'R2 access key' },
    { key: 'secretKey', label: 'Secret Access Key', type: 'password', required: true, placeholder: 'R2 secret key' },
    { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'my-cafe-bucket' }
  ],
  'backblaze-b2': [
    { key: 'keyId', label: 'Key ID', type: 'text', required: true, placeholder: 'B2 application key ID' },
    { key: 'applicationKey', label: 'Application Key', type: 'password', required: true, placeholder: 'B2 application key' },
    { key: 'bucketName', label: 'Bucket Name', type: 'text', required: true, placeholder: 'my-cafe-bucket' }
  ],
  'minio': [
    { key: 'endpoint', label: 'Endpoint', type: 'text', required: true, placeholder: 'minio.example.com' },
    { key: 'accessKey', label: 'Access Key', type: 'text', required: true, placeholder: 'MinIO access key' },
    { key: 'secretKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'MinIO secret key' },
    { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'my-cafe-bucket' }
  ],
  'firebase-storage': [
    { key: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'my-firebase-project' },
    { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Firebase API key' },
    { key: 'authDomain', label: 'Auth Domain', type: 'text', required: true, placeholder: 'my-project.firebaseapp.com' }
  ],
  'supabase-storage': [
    { key: 'projectUrl', label: 'Project URL', type: 'text', required: true, placeholder: 'https://xyzcompany.supabase.co' },
    { key: 'serviceRoleKey', label: 'Service Role Key', type: 'password', required: true, placeholder: 'Supabase service role key' },
    { key: 'bucket', label: 'Bucket Name', type: 'text', required: true, placeholder: 'my-cafe-bucket' }
  ],
  'webdav': [
    { key: 'url', label: 'WebDAV URL', type: 'text', required: true, placeholder: 'https://cloud.example.com/remote.php/dav' },
    { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'username' },
    { key: 'password', label: 'Password', type: 'password', required: true, placeholder: 'password' }
  ],
  'smb-nas': [
    { key: 'server', label: 'Server Address', type: 'text', required: true, placeholder: '192.168.1.10' },
    { key: 'share', label: 'Share Name', type: 'text', required: true, placeholder: 'cafe-share' },
    { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'username' },
    { key: 'password', label: 'Password', type: 'password', required: true, placeholder: 'password' }
  ]
};

export default function StorageSelectionStep({ settings, onNext, onBack, isMobile, isLoading, error, setError }) {
  const initialProvider = settings?.storageProvider || 'local';
  const [selectedProvider, setSelectedProvider] = useState(initialProvider);
  // Initialize from the starting provider so returning to this step with a
  // provider that needs config already selected shows the form immediately,
  // not just after the user re-clicks the card.
  const [showConfig, setShowConfig] = useState(!!PROVIDER_CONFIG_FIELDS[initialProvider]);
  const [config, setConfig] = useState(settings?.storageConfig || {});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleProviderSelect = useCallback((providerId) => {
    setSelectedProvider(providerId);
    setShowConfig(!!PROVIDER_CONFIG_FIELDS[providerId]);
    setError(null);
    setTestResult(null);
  }, [setError]);

  const handleConfigChange = useCallback((field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  }, []);

  const handleNext = useCallback(() => {
    const updatedSettings = {
      ...settings,
      storageProvider: selectedProvider,
      storageConfig: config
    };

    // localStorage is plaintext and readable by any script/extension on the
    // page, so secret credentials must never be written there. The full
    // config (including real secrets) still goes to onNext for the caller
    // to hand off to a secure store (e.g. a backend/keychain); only the
    // persisted local copy has secret fields stripped out.
    try {
      const fields = PROVIDER_CONFIG_FIELDS[selectedProvider] || [];
      const secretKeys = new Set(
        fields.filter(f => f.type === 'password').map(f => f.key)
      );
      const safeConfig = Object.fromEntries(
        Object.entries(config).filter(([k]) => !secretKeys.has(k))
      );
      localStorage.setItem('brewcrm_settings', JSON.stringify({
        ...updatedSettings,
        storageConfig: safeConfig
      }));
    } catch (e) {
      console.warn('Could not persist settings to localStorage:', e);
    }

    onNext(updatedSettings);
  }, [selectedProvider, config, settings, onNext]);

  const validateConfig = () => {
    const fields = PROVIDER_CONFIG_FIELDS[selectedProvider];
    if (fields) {
      const missing = fields.filter(f => f.required && !config[f.key]).map(f => f.label);
      if (missing.length > 0) {
        setError(`Please fill in required fields: ${missing.join(', ')}`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNextWithValidation = useCallback(async () => {
    if (validateConfig()) {
      if (selectedProvider !== 'local' && selectedProvider !== 'mock') {
        // Configure provider securely before continuing
        setIsLoading(true);
        try {
          const userId = getCurrentUserId() || 'system';
          // This saves credentials in the Secret Vault and configures the provider
          await storageEngine.configureProvider(selectedProvider, config, userId);
          // Set as active provider
          await storageEngine.setActiveProvider(selectedProvider, userId);
        } catch (e) {
          console.warn('[StorageSelection] Failed to configure provider securely:', e);
          setError("Failed to configure cloud storage securely. Please check your credentials.");
          setIsLoading(false);
          return; // Stop if we can't secure it
        }
      }
      handleNext();
    }
  }, [validateConfig, handleNext, selectedProvider, config, setIsLoading, setError]);

  const handleTestConnection = useCallback(async () => {
    if (!validateConfig()) return;
    setIsTesting(true);
    setTestResult(null);

    try {
      if (selectedProvider === 'local' || selectedProvider === 'mock') {
        setTestResult({ success: true, message: "Successfully connected to " + STORAGE_PROVIDERS.find(p => p.id === selectedProvider)?.name });
      } else {
        // Load the provider dynamically if not loaded
        await storageEngine.loadProvider(selectedProvider);
        const provider = storageEngine.providers.get(selectedProvider);
        
        // Temporarily set config for testing
        // This is safe because we're just testing the object instance in memory
        Object.assign(provider, config);
        
        const result = await provider.testConnection();
        
        if (result.success) {
          setTestResult({ success: true, message: "Successfully connected to " + STORAGE_PROVIDERS.find(p => p.id === selectedProvider)?.name });
        } else {
          setTestResult({ success: false, message: result.error || "Connection failed. Please check your credentials." });
        }
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message || "Connection test failed." });
    } finally {
      setIsTesting(false);
    }
  }, [validateConfig, selectedProvider, config]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
          Storage Backend Selection
        </h3>
        <p style={{ fontSize: 14, color: "var(--cafe-text-secondary)" }}>
          Choose where your cafe data will be stored. You can change this later in settings.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 24, marginBottom: 32 }}>
        {STORAGE_PROVIDERS.map(provider => (
          <div
            key={provider.id}
            role="button"
            tabIndex={0}
            aria-pressed={selectedProvider === provider.id}
            aria-label={`${provider.name}${provider.recommended ? ' (recommended)' : ''}`}
            onClick={() => handleProviderSelect(provider.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleProviderSelect(provider.id);
              }
            }}
            style={{
              padding: 24,
              border: selectedProvider === provider.id 
                ? "2px solid var(--cafe-accent)" 
                : "1px solid var(--cafe-border)",
              borderRadius: 16,
              background: selectedProvider === provider.id 
                ? "var(--cafe-accent-bg)" 
                : "var(--cafe-bg-card)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative"
            }}
          >
            {provider.recommended && (
              <span style={{
                position: "absolute",
                top: 12,
                right: 12,
                padding: "4px 10px",
                background: "var(--cafe-accent)",
                color: "#fff",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase"
              }}>
                Recommended
              </span>
            )}
            <div style={{ fontSize: 32, marginBottom: 12 }}>{provider.icon}</div>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 8 }}>
              {provider.name}
            </h4>
            <p style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
              {provider.description}
            </p>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--cafe-text-tertiary)", marginBottom: 6, textTransform: "uppercase" }}>
                Features
              </div>
              {provider.features.map((feature, idx) => (
                <div key={idx} style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
                  ✓ {feature}
                </div>
              ))}
            </div>
            {provider.free && (
              <span style={{
                display: "inline-block",
                padding: "4px 10px",
                background: "#10b98120",
                color: "#10b981",
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 600
              }}>
                Free
              </span>
            )}
          </div>
        ))}
      </div>

      {showConfig && PROVIDER_CONFIG_FIELDS[selectedProvider] && (
        <div style={{
          padding: 24,
          background: "var(--cafe-bg-card)",
          border: "1px solid var(--cafe-border)",
          borderRadius: 16,
          marginBottom: 24
        }}>
          <h4 style={{ fontSize: 16, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 16 }}>
            {STORAGE_PROVIDERS.find(p => p.id === selectedProvider)?.name} Configuration
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {PROVIDER_CONFIG_FIELDS[selectedProvider].map(field => {
              const inputId = `${selectedProvider}-${field.key}`;
              const commonStyle = {
                width: "100%",
                padding: "14px 16px",
                fontSize: 14,
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                background: "var(--cafe-bg-surface)",
                color: "var(--cafe-text-primary)",
                outline: "none"
              };
              return (
                <div key={field.key}>
                  <label htmlFor={inputId} style={{ fontSize: 13, fontWeight: 500, color: "var(--cafe-text-secondary)", marginBottom: 8, display: "block" }}>
                    {field.label} {field.required && <span style={{ color: "var(--cafe-danger)" }}>*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      id={inputId}
                      value={config[field.key] || ''}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      style={commonStyle}
                    >
                      <option value="">Select {field.label.toLowerCase()}</option>
                      {field.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={inputId}
                      type={field.type}
                      autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                      value={config[field.key] || ''}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      style={commonStyle}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              style={{
                padding: "10px 20px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-accent)",
                color: "var(--cafe-accent)",
                borderRadius: 8,
                fontWeight: 600,
                cursor: isTesting ? "not-allowed" : "pointer"
              }}
            >
              {isTesting ? "Testing..." : "Test Connection"}
            </button>
            {testResult && (
              <span style={{ fontSize: 13, color: testResult.success ? "var(--cafe-success)" : "var(--cafe-danger)", fontWeight: 500 }}>
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" style={{
          padding: 16,
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 12,
          marginBottom: 24,
          color: "#ef4444",
          fontSize: 14
        }}>
          {error}
        </div>
      )}

      <div style={{
        padding: 20,
        background: "var(--cafe-info-bg)",
        border: "1px solid var(--cafe-info-border)",
        borderRadius: 12,
        fontSize: 14,
        color: "var(--cafe-info)"
      }}>
        <strong>💡 Tip:</strong> You can change your storage provider later in Settings &gt; Cloud Storage. Data migration tools are available to help you switch providers.
      </div>

      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 32
      }}>
        {onBack && (
          <button
            onClick={onBack}
            disabled={isLoading}
            style={{
              padding: "14px 28px",
              background: "var(--cafe-bg-surface)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: "var(--cafe-text-secondary)",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNextWithValidation}
          disabled={isLoading}
          style={{
            padding: "14px 32px",
            background: "var(--cafe-accent)",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
