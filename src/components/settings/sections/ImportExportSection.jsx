// Import/Export Section
// Data import/export settings

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';

export default function ImportExportSection({ isMobile }) {
  const [exportConfig, setExportConfig] = useState({
    defaultFormat: 'json',
    compression: true,
    encryption: true,
    destination: 'local', // local, cloud, download
    validation: true,
    conflictHandling: 'skip' // skip, overwrite, rename, merge
  });
  const [importConfig, setImportConfig] = useState({
    validation: true,
    conflictHandling: 'skip',
    autoMapFields: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const savedExport = localStorage.getItem('cafeos_export_config');
      const savedImport = localStorage.getItem('cafeos_import_config');
      
      if (savedExport) setExportConfig(JSON.parse(savedExport));
      if (savedImport) setImportConfig(JSON.parse(savedImport));
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('cafeos_export_config', JSON.stringify(exportConfig));
      localStorage.setItem('cafeos_import_config', JSON.stringify(importConfig));
      showMessage('success', 'Configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
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

      {/* Export Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Export Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Default Export Format</label>
            <select
              value={exportConfig.defaultFormat}
              onChange={(e) => setExportConfig({ ...exportConfig, defaultFormat: e.target.value })}
              style={{ ...input }}
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Storage Destination</label>
            <select
              value={exportConfig.destination}
              onChange={(e) => setExportConfig({ ...exportConfig, destination: e.target.value })}
              style={{ ...input }}
            >
              <option value="local">Local Storage</option>
              <option value="cloud">Cloud Storage</option>
              <option value="download">Download</option>
            </select>
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Conflict Handling</label>
            <select
              value={exportConfig.conflictHandling}
              onChange={(e) => setExportConfig({ ...exportConfig, conflictHandling: e.target.value })}
              style={{ ...input }}
            >
              <option value="skip">Skip existing</option>
              <option value="overwrite">Overwrite existing</option>
              <option value="rename">Rename conflicts</option>
              <option value="merge">Merge data</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={exportConfig.compression}
                onChange={(e) => setExportConfig({ ...exportConfig, compression: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Compression</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={exportConfig.encryption}
                onChange={(e) => setExportConfig({ ...exportConfig, encryption: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Encryption</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={exportConfig.validation}
                onChange={(e) => setExportConfig({ ...exportConfig, validation: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Validation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Import Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Import Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Conflict Handling</label>
            <select
              value={importConfig.conflictHandling}
              onChange={(e) => setImportConfig({ ...importConfig, conflictHandling: e.target.value })}
              style={{ ...input }}
            >
              <option value="skip">Skip existing</option>
              <option value="overwrite">Overwrite existing</option>
              <option value="rename">Rename conflicts</option>
              <option value="merge">Merge data</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={importConfig.validation}
                onChange={(e) => setImportConfig({ ...importConfig, validation: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Validation</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={importConfig.autoMapFields}
                onChange={(e) => setImportConfig({ ...importConfig, autoMapFields: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Auto Map Fields</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <button
          onClick={handleSaveConfig}
          disabled={isLoading}
          style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px' }}
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
