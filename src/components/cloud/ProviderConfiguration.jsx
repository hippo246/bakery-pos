// Provider Configuration Component
// Handles configuration for all cloud storage providers with credential masking and validation

import React, { useState, useEffect, useCallback } from 'react';

// Configuration field definitions for each provider
const PROVIDER_CONFIG_FIELDS = {
  'local': [
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false },
    { name: 'maxSize', label: 'Max Size (MB)', type: 'number', placeholder: '50', required: false }
  ],
  'aws-s3': [
    { name: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket', required: true },
    { name: 'region', label: 'Region', type: 'text', placeholder: 'us-east-1', required: true },
    { name: 'accessKey', label: 'Access Key ID', type: 'password', placeholder: 'AKIA...', required: true, sensitive: true },
    { name: 'secretKey', label: 'Secret Access Key', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'gcs': [
    { name: 'projectId', label: 'Project ID', type: 'text', placeholder: 'my-project', required: true },
    { name: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket', required: true },
    { name: 'serviceAccountKey', label: 'Service Account Key (JSON)', type: 'textarea', placeholder: '{ "type": "service_account", ... }', required: true, sensitive: true },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'azure-blob': [
    { name: 'accountName', label: 'Account Name', type: 'text', placeholder: 'mystorageaccount', required: true },
    { name: 'accountKey', label: 'Account Key', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'container', label: 'Container Name', type: 'text', placeholder: 'my-container', required: true },
    { name: 'connectionString', label: 'Connection String (optional)', type: 'password', placeholder: 'DefaultEndpointsProtocol=...', required: false, sensitive: true },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'firebase-storage': [
    { name: 'projectId', label: 'Project ID', type: 'text', placeholder: 'my-project', required: true },
    { name: 'apiKey', label: 'API Key', type: 'password', placeholder: 'AIza...', required: true, sensitive: true },
    { name: 'authDomain', label: 'Auth Domain', type: 'text', placeholder: 'my-project.firebaseapp.com', required: true },
    { name: 'bucket', label: 'Storage Bucket', type: 'text', placeholder: 'my-project.appspot.com', required: false },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'cloudflare-r2': [
    { name: 'accountId', label: 'Account ID', type: 'text', placeholder: '1234567890abcdef', required: true },
    { name: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket', required: true },
    { name: 'accessKey', label: 'Access Key ID', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'secretKey', label: 'Secret Access Key', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'backblaze-b2': [
    { name: 'keyId', label: 'Key ID', type: 'text', placeholder: 'K001...', required: true },
    { name: 'applicationKey', label: 'Application Key', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'bucketId', label: 'Bucket ID', type: 'text', placeholder: 'a1b2c3d4...', required: true },
    { name: 'bucketName', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket', required: false },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'supabase-storage': [
    { name: 'projectUrl', label: 'Project URL', type: 'text', placeholder: 'https://my-project.supabase.co', required: true },
    { name: 'anonKey', label: 'Anon Key', type: 'password', placeholder: 'eyJh...', required: true, sensitive: true },
    { name: 'serviceRoleKey', label: 'Service Role Key (optional)', type: 'password', placeholder: 'eyJh...', required: false, sensitive: true },
    { name: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket', required: true },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'minio': [
    { name: 'endpoint', label: 'Endpoint', type: 'text', placeholder: 'localhost', required: true },
    { name: 'port', label: 'Port', type: 'number', placeholder: '9000', required: true },
    { name: 'accessKey', label: 'Access Key', type: 'text', placeholder: 'minioadmin', required: true },
    { name: 'secretKey', label: 'Secret Key', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'bucket', label: 'Bucket Name', type: 'text', placeholder: 'my-bucket', required: true },
    { name: 'useSSL', label: 'Use SSL', type: 'checkbox', required: false },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'smb-nas': [
    { name: 'server', label: 'Server Address', type: 'text', placeholder: '192.168.1.100', required: true },
    { name: 'share', label: 'Share Name', type: 'text', placeholder: 'my-share', required: true },
    { name: 'username', label: 'Username', type: 'text', placeholder: 'user', required: true },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'domain', label: 'Domain (optional)', type: 'text', placeholder: 'WORKGROUP', required: false },
    { name: 'port', label: 'Port', type: 'number', placeholder: '445', required: false },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ],
  'webdav': [
    { name: 'url', label: 'WebDAV URL', type: 'text', placeholder: 'https://example.com/webdav', required: true },
    { name: 'username', label: 'Username', type: 'text', placeholder: 'user', required: true },
    { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••••••••••', required: true, sensitive: true },
    { name: 'prefix', label: 'Storage Prefix', type: 'text', placeholder: 'cafeos', required: false }
  ]
};

export default function ProviderConfiguration({ providerId, providerName, onSave, onCancel, existingConfig = {} }) {
  const [config, setConfig] = useState({});
  const [errors, setErrors] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showSensitive, setShowSensitive] = useState({});
  const [saving, setSaving] = useState(false);

  const fields = PROVIDER_CONFIG_FIELDS[providerId] || [];

  // Initialize config with existing values
  useEffect(() => {
    const initialConfig = {};
    fields.forEach(field => {
      initialConfig[field.name] = existingConfig[field.name] || '';
    });
    setConfig(initialConfig);
  }, [fields, existingConfig]);

  const handleInputChange = useCallback((fieldName, value) => {
    setConfig(prev => ({ ...prev, [fieldName]: value }));
    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: null }));
    }
  }, [errors]);

  const toggleSensitiveVisibility = useCallback((fieldName) => {
    setShowSensitive(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  const validateConfig = useCallback(() => {
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !config[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      // Additional validation for specific fields
      if (field.name === 'accessKey' && config[field.name] && config[field.name].length < 16) {
        newErrors[field.name] = 'Access key must be at least 16 characters';
      }
      if (field.name === 'secretKey' && config[field.name] && config[field.name].length < 16) {
        newErrors[field.name] = 'Secret key must be at least 16 characters';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [config, fields]);

  const handleTestConnection = useCallback(async () => {
    if (!validateConfig()) {
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Import the provider class dynamically
      const providerModule = await import(`../../cloud/providers/${providerId.charAt(0).toUpperCase() + providerId.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}Provider.js`);
      const ProviderClass = Object.values(providerModule)[0];
      
      const provider = new ProviderClass(config);
      const result = await provider.testConnection();
      
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  }, [config, providerId, validateConfig]);

  const handleSave = useCallback(async () => {
    if (!validateConfig()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(config);
    } finally {
      setSaving(false);
    }
  }, [config, validateConfig, onSave]);

  const renderField = (field) => {
    const value = config[field.name] || '';
    const error = errors[field.name];
    const isSensitive = field.sensitive;
    const isVisible = showSensitive[field.name];

    const inputClassName = `
      w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent
      ${error ? 'border-red-500' : 'border-gray-300'}
      ${field.type === 'checkbox' ? 'w-auto' : ''}
    `;

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={inputClassName}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );
    }

    if (field.type === 'checkbox') {
      return (
        <div key={field.name} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleInputChange(field.name, e.target.checked)}
            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
          />
          <label className="text-sm font-medium text-gray-700">{field.label}</label>
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            type={isSensitive && !isVisible ? 'password' : field.type}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={inputClassName}
          />
          {isSensitive && (
            <button
              type="button"
              onClick={() => toggleSensitiveVisibility(field.name)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {isVisible ? '🙈' : '👁️'}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configure {providerName}</h3>
          <p className="text-sm text-gray-500 mt-1">Enter your storage provider credentials</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-2xl"
        >
          ×
        </button>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        {fields.map(renderField)}
      </div>

      {/* Test Connection Result */}
      {testResult && (
        <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{testResult.success ? '✅' : '❌'}</span>
            <div className="flex-1">
              <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.success ? 'Connection Successful' : 'Connection Failed'}
              </p>
              {testResult.error && (
                <p className="text-sm text-red-600 mt-1">{testResult.error}</p>
              )}
              {testResult.diagnostics && (
                <div className="mt-2 space-y-1">
                  {Object.entries(testResult.diagnostics).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className={value === true || value === false ? (value ? 'text-green-600' : 'text-red-600') : 'text-gray-600'}>
                        {value === true ? '✓' : value === false ? '✗' : '•'}
                      </span>
                      <span className="capitalize text-gray-600">{key}:</span>
                      <span className={typeof value === 'boolean' ? (value ? 'text-green-600' : 'text-red-600') : 'text-gray-800'}>
                        {typeof value === 'boolean' ? (value ? 'Passed' : 'Failed') : value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleTestConnection}
          disabled={testing}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔒</span>
          <div>
            <p className="font-medium text-amber-800">Security Notice</p>
            <p className="text-sm text-amber-700 mt-1">
              Your credentials are encrypted before storage. Never share your credentials with anyone.
              For production use, ensure your storage provider has proper security policies in place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
