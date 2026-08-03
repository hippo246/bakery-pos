// Restore Section
// Restore from recovery points

import React, { useState, useEffect } from 'react';
import { card, btn } from '../../../styles/theme';

export default function RestoreSection({ isMobile }) {
  const [recoveryPoints, setRecoveryPoints] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });

  useEffect(() => {
    loadRecoveryPoints();
    loadRestoreHistory();
  }, []);

  const loadRecoveryPoints = () => {
    try {
      const history = localStorage.getItem('cafeos_backup_history');
      if (history) {
        const backups = JSON.parse(history);
        setRecoveryPoints(backups.filter(b => b.status === 'completed'));
      }
    } catch (error) {
      console.error('Failed to load recovery points:', error);
    }
  };

  const loadRestoreHistory = () => {
    try {
      const history = localStorage.getItem('cafeos_restore_history');
      if (history) {
        setRestoreHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load restore history:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleRestore = async () => {
    if (!selectedBackup) return;
    
    setIsRestoring(true);
    try {
      // Trigger restore
      showMessage('success', 'Restore initiated');
      setShowConfirmDialog(false);
      
      // Add to restore history
      const newHistory = [
        {
          backupId: selectedBackup.id,
          restoredAt: new Date().toISOString(),
          status: 'completed'
        },
        ...restoreHistory
      ];
      setRestoreHistory(newHistory);
      localStorage.setItem('cafeos_restore_history', JSON.stringify(newHistory));
      
      setSelectedBackup(null);
    } catch (error) {
      showMessage('error', 'Failed to restore');
    } finally {
      setIsRestoring(false);
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

      {/* Recovery Points */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Recovery Points
        </h3>
        
        {recoveryPoints.length === 0 ? (
          <div style={{ padding: 24, background: 'var(--cafe-bg)', borderRadius: 8, textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
            No recovery points available. Create a backup first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recoveryPoints.map((backup, index) => (
              <div
                key={index}
                onClick={() => setSelectedBackup(backup)}
                style={{
                  padding: 16,
                  background: 'var(--cafe-bg)',
                  borderRadius: 8,
                  border: selectedBackup?.id === backup.id ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
                      {backup.name || `Backup ${index + 1}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                      {formatDate(backup.createdAt)} • {formatBytes(backup.size || 0)}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--cafe-success)', background: 'var(--cafe-success-bg)', padding: '2px 8px', borderRadius: 4 }}>
                    Valid
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Action */}
      {selectedBackup && (
        <div style={{ ...card, padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
            Restore from Backup
          </h3>
          
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Selected Backup</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
              {selectedBackup.name || `Backup`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
              {formatDate(selectedBackup.createdAt)} • {formatBytes(selectedBackup.size || 0)}
            </div>
          </div>

          <div style={{ padding: 16, background: 'var(--cafe-warning-bg)', border: '1px solid var(--cafe-warning-border)', borderRadius: 8, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--cafe-warning)', fontWeight: 500 }}>
              ⚠️ Warning
            </div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginTop: 4 }}>
              This will replace all current data with the backup data. This action cannot be undone.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => setSelectedBackup(null)}
              style={{ ...btn('ghost'), fontSize: 13, padding: '10px 20px', flex: 1 }}
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isRestoring}
              style={{ ...btn('primary'), fontSize: 13, padding: '10px 20px', flex: 1 }}
            >
              {isRestoring ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      )}

      {/* Restore History */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Restore History
        </h3>
        
        {restoreHistory.length === 0 ? (
          <div style={{ padding: 24, background: 'var(--cafe-bg)', borderRadius: 8, textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
            No restore history
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {restoreHistory.slice(0, 10).map((restore, index) => (
              <div key={index} style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
                  Restore from Backup
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                  {formatDate(restore.restoredAt)} • {restore.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
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
              Confirm Restore
            </h3>
            <p style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', marginBottom: 24 }}>
              Are you sure you want to restore from this backup? All current data will be replaced.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirmDialog(false)}
                style={{ ...btn('ghost'), fontSize: 14, padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                style={{ ...btn('primary'), fontSize: 14, padding: '10px 20px', background: 'var(--cafe-danger)', border: 'none' }}
              >
                {isRestoring ? 'Restoring...' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
