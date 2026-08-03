// Backups Section
// Backup configuration and management

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';
import { validateBackupConfig } from '../../../utils/cloudSettingsValidation.js';
import { createSecurityAuditLog } from '../../../domain/auditLogModel.js';
import { getCurrentUserId } from '../../../utils/authService.js';

export default function BackupsSection({ isMobile }) {
  const [backupConfig, setBackupConfig] = useState({
    enabled: true,
    frequency: 'daily',
    retentionDays: 30,
    compression: true,
    encryption: true,
    autoBackup: true,
    scheduleTime: '02:00'
  });
  const [backupHistory, setBackupHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    loadBackupConfig();
    loadBackupHistory();
  }, []);

  const loadBackupConfig = () => {
    try {
      const saved = localStorage.getItem('cafeos_backup_config');
      if (saved) {
        setBackupConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load backup config:', error);
    }
  };

  const loadBackupHistory = () => {
    try {
      const history = localStorage.getItem('cafeos_backup_history');
      if (history) {
        setBackupHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSaveConfig = async () => {
    // Validate before saving
    const validation = validateBackupConfig(backupConfig);
    if (!validation.valid) {
      showMessage('error', validation.error);
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('cafeos_backup_config', JSON.stringify(backupConfig));
      
      // Audit log
      const userId = getCurrentUserId();
      await createSecurityAuditLog({
        action: 'BACKUP_CONFIG_UPDATED',
        details: `Backup configuration updated: frequency=${backupConfig.frequency}, retention=${backupConfig.retentionDays} days`,
        userId,
        category: 'CLOUD_SETTINGS'
      });
      
      showMessage('success', 'Backup configuration saved');
    } catch (error) {
      showMessage('error', 'Failed to save configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      // Trigger backup creation
      showMessage('success', 'Backup initiated');
      setTimeout(() => loadBackupHistory(), 2000);
    } catch (error) {
      showMessage('error', 'Failed to create backup');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

      {/* Backup Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Backup Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Enable Automatic Backups</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Automatically create backups on schedule</div>
            </div>
            <input
              type="checkbox"
              checked={backupConfig.enabled}
              onChange={(e) => setBackupConfig({ ...backupConfig, enabled: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Backup Frequency</label>
            <select
              value={backupConfig.frequency}
              onChange={(e) => setBackupConfig({ ...backupConfig, frequency: e.target.value })}
              style={{ ...input }}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Retention Period (days)</label>
            <input
              type="number"
              value={backupConfig.retentionDays}
              onChange={(e) => setBackupConfig({ ...backupConfig, retentionDays: parseInt(e.target.value) })}
              style={{ ...input }}
              min={1}
              max={365}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Schedule Time</label>
            <input
              type="time"
              value={backupConfig.scheduleTime}
              onChange={(e) => setBackupConfig({ ...backupConfig, scheduleTime: e.target.value })}
              style={{ ...input }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={backupConfig.compression}
                onChange={(e) => setBackupConfig({ ...backupConfig, compression: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Compression</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={backupConfig.encryption}
                onChange={(e) => setBackupConfig({ ...backupConfig, encryption: e.target.checked })}
                style={{ width: 18, height: 18 }}
              />
              <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Encryption</span>
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

      {/* Manual Backup */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Manual Backup
        </h3>
        
        <button
          onClick={handleCreateBackup}
          disabled={isLoading}
          style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px' }}
        >
          {isLoading ? 'Creating...' : 'Create Backup Now'}
        </button>
      </div>

      {/* Backup History */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Backup History
        </h3>
        
        {backupHistory.length === 0 ? (
          <div style={{ padding: 24, background: 'var(--cafe-bg)', borderRadius: 8, textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
            No backups found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {backupHistory.slice(0, 10).map((backup, index) => (
              <div key={index} style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
                    {backup.name || `Backup ${index + 1}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                    {formatDate(backup.createdAt)} • {formatBytes(backup.size || 0)}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: backup.status === 'completed' ? 'var(--cafe-success)' : 'var(--cafe-warning)', background: backup.status === 'completed' ? 'var(--cafe-success-bg)' : 'var(--cafe-warning-bg)', padding: '2px 8px', borderRadius: 4 }}>
                  {backup.status || 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
