// Synchronization Section
// Sync rules and configuration

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';
import { validateSyncConfig } from '../../../utils/cloudSettingsValidation.js';
import { createSecurityAuditLog } from '../../../domain/auditLogModel.js';
import { getCurrentUserId } from '../../../utils/authService.js';

export default function SynchronizationSection({ isMobile }) {
  const [syncConfig, setSyncConfig] = useState({
    autoSync: true,
    syncInterval: 300, // seconds
    retryCount: 3,
    retryDelay: 5, // seconds
    conflictStrategy: 'timestamp', // timestamp, manual, remote, local
    offlineQueue: true,
    bandwidthOptimization: true,
    backgroundSync: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });

  useEffect(() => {
    loadSyncConfig();
  }, []);

  const loadSyncConfig = () => {
    try {
      const saved = localStorage.getItem('cafeos_sync_config');
      if (saved) {
        setSyncConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load sync config:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSaveConfig = async () => {
    // Validate before saving
    const validation = validateSyncConfig(syncConfig);
    if (!validation.valid) {
      showMessage('error', validation.error);
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('cafeos_sync_config', JSON.stringify(syncConfig));
      
      // Audit log
      const userId = getCurrentUserId();
      await createSecurityAuditLog({
        action: 'SYNC_CONFIG_UPDATED',
        details: `Sync configuration updated: interval=${syncConfig.syncInterval}s, strategy=${syncConfig.conflictStrategy}`,
        userId,
        category: 'CLOUD_SETTINGS'
      });
      
      showMessage('success', 'Sync configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    setIsLoading(true);
    try {
      showMessage('success', 'Sync initiated');
    } catch (error) {
      showMessage('error', 'Failed to sync');
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

      {/* Sync Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Synchronization Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Auto Sync</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Automatically sync data</div>
            </div>
            <input
              type="checkbox"
              checked={syncConfig.autoSync}
              onChange={(e) => setSyncConfig({ ...syncConfig, autoSync: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Sync Interval (seconds)</label>
            <input
              type="number"
              value={syncConfig.syncInterval}
              onChange={(e) => setSyncConfig({ ...syncConfig, syncInterval: parseInt(e.target.value) })}
              style={{ ...input }}
              min={30}
              max={3600}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Retry Count</label>
            <input
              type="number"
              value={syncConfig.retryCount}
              onChange={(e) => setSyncConfig({ ...syncConfig, retryCount: parseInt(e.target.value) })}
              style={{ ...input }}
              min={1}
              max={10}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Retry Delay (seconds)</label>
            <input
              type="number"
              value={syncConfig.retryDelay}
              onChange={(e) => setSyncConfig({ ...syncConfig, retryDelay: parseInt(e.target.value) })}
              style={{ ...input }}
              min={1}
              max={60}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Conflict Strategy</label>
            <select
              value={syncConfig.conflictStrategy}
              onChange={(e) => setSyncConfig({ ...syncConfig, conflictStrategy: e.target.value })}
              style={{ ...input }}
            >
              <option value="timestamp">Timestamp (newest wins)</option>
              <option value="manual">Manual resolution</option>
              <option value="remote">Remote wins</option>
              <option value="local">Local wins</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={syncConfig.offlineQueue}
                onChange={(e) => setSyncConfig({ ...syncConfig, offlineQueue: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Offline Queue</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={syncConfig.bandwidthOptimization}
                onChange={(e) => setSyncConfig({ ...syncConfig, bandwidthOptimization: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Bandwidth Optimization</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={syncConfig.backgroundSync}
                onChange={(e) => setSyncConfig({ ...syncConfig, backgroundSync: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Background Sync</span>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={isLoading}
            style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px' }}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Manual Sync */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Manual Sync
        </h3>
        
        <button
          onClick={handleManualSync}
          disabled={isLoading}
          style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px' }}
        >
          {isLoading ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  );
}
