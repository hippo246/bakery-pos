// Storage Health Monitor Component
// Displays storage system health, failover status, and controls

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';

export default function StorageHealthMonitor({ darkMode = false }) {
  const { getStorageStats, getCurrentStorage, forceStorageSwitch, setAutoSwitch } = useAppContext();
  const [stats, setStats] = useState(null);
  const [currentStorage, setCurrentStorage] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [autoSwitch, setAutoSwitchState] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const refreshStats = useCallback(async () => {
    setLoading(true);
    try {
      const [newStats, newCurrentStorage] = await Promise.all([
        getStorageStats(),
        Promise.resolve(getCurrentStorage())
      ]);
      setStats(newStats);
      setCurrentStorage(newCurrentStorage);
    } catch (error) {
      console.error('Failed to get storage stats:', error);
    } finally {
      setLoading(false);
    }
  }, [getStorageStats, getCurrentStorage]);

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 60000); // Increased from 10s to 60s to reduce CPU usage
    return () => clearInterval(interval);
  }, [refreshStats]);

  const handleForceSwitch = async (targetStorage) => {
    if (confirm(`Switch to ${targetStorage} storage? This may affect performance.`)) {
      setLoading(true);
      try {
        const result = await forceStorageSwitch(targetStorage);
        if (result.success) {
          refreshStats();
        } else {
          alert(`Failed to switch: ${result.error}`);
        }
      } catch (error) {
        alert(`Error switching storage: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAutoSwitchToggle = (enabled) => {
    setAutoSwitchState(enabled);
    setAutoSwitch(enabled);
  };

  const getHealthColor = (healthy) => {
    return healthy ? '#10b981' : '#ef4444';
  };

  const getStorageColor = (storage) => {
    return storage === 'primary' ? '#6366f1' : '#f59e0b';
  };

  if (!stats) {
    return (
      <div style={{
        padding: '12px 16px',
        background: darkMode ? '#1e1e2e' : '#f3f4f6',
        borderRadius: '8px',
        border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`,
        fontSize: '13px',
        color: darkMode ? '#e0e0e0' : '#374151'
      }}>
        Loading storage status...
      </div>
    );
  }

  return (
    <div style={{
      padding: '16px',
      background: darkMode ? '#1e1e2e' : '#ffffff',
      borderRadius: '12px',
      border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`,
      boxShadow: darkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '20px' }}>💾</span>
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: darkMode ? '#e0e0e0' : '#111827'
          }}>
            Storage Health
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '6px 12px',
            background: darkMode ? '#2d2d44' : '#f3f4f6',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`,
            borderRadius: '6px',
            color: darkMode ? '#e0e0e0' : '#374151',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? '#3d3d5c' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f3f4f6';
          }}
        >
          {showDetails ? '▼' : '▶'} Details
        </button>
      </div>

      {/* Status Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Current Storage */}
        <div style={{
          padding: '12px',
          background: darkMode ? '#2d2d44' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
        }}>
          <div style={{
            fontSize: '11px',
            color: darkMode ? '#8b8b9e' : '#6b7280',
            marginBottom: '4px'
          }}>
            Current Storage
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: getStorageColor(currentStorage)
          }}>
            {currentStorage.charAt(0).toUpperCase() + currentStorage.slice(1)}
          </div>
        </div>

        {/* Health Status */}
        <div style={{
          padding: '12px',
          background: darkMode ? '#2d2d44' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
        }}>
          <div style={{
            fontSize: '11px',
            color: darkMode ? '#8b8b9e' : '#6b7280',
            marginBottom: '4px'
          }}>
            Health Status
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: stats.failover?.healthHistory?.[0]?.healthy 
              ? getHealthColor(true) 
              : getHealthColor(false)
          }}>
            {stats.failover?.healthHistory?.[0]?.healthy ? '✓ Healthy' : '⚠ Issues'}
          </div>
        </div>

        {/* Failure Count */}
        <div style={{
          padding: '12px',
          background: darkMode ? '#2d2d44' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
        }}>
          <div style={{
            fontSize: '11px',
            color: darkMode ? '#8b8b9e' : '#6b7280',
            marginBottom: '4px'
          }}>
            Failures
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: stats.failover?.failureCount > 0 ? '#ef4444' : '#10b981'
          }}>
            {stats.failover?.failureCount || 0}
          </div>
        </div>

        {/* Mode */}
        <div style={{
          padding: '12px',
          background: darkMode ? '#2d2d44' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
        }}>
          <div style={{
            fontSize: '11px',
            color: darkMode ? '#8b8b9e' : '#6b7280',
            marginBottom: '4px'
          }}>
            Mode
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            color: darkMode ? '#e0e0e0' : '#111827'
          }}>
            {stats.mode}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => handleForceSwitch(currentStorage === 'primary' ? 'backup' : 'primary')}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#6366f1' : '#6366f1',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = '#4f46e5';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = '#6366f1';
          }}
        >
          Force Switch
        </button>

        <button
          onClick={refreshStats}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: darkMode ? '#2d2d44' : '#f3f4f6',
            border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`,
            borderRadius: '6px',
            color: darkMode ? '#e0e0e0' : '#374151',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = darkMode ? '#3d3d5c' : '#e5e7eb';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = darkMode ? '#2d2d44' : '#f3f4f6';
          }}
        >
          🔄 Refresh
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: darkMode ? '#2d2d44' : '#f3f4f6',
          borderRadius: '6px',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
        }}>
          <label style={{
            fontSize: '13px',
            color: darkMode ? '#e0e0e0' : '#374151',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={(e) => handleAutoSwitchToggle(e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            Auto-Switch
          </label>
        </div>
      </div>

      {/* Details Panel */}
      {showDetails && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: darkMode ? '#2d2d44' : '#f9fafb',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: darkMode ? '#e0e0e0' : '#111827'
          }}>
            Storage Details
          </h4>

          {/* IndexedDB Stats */}
          {stats.indexedDB && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: darkMode ? '#e0e0e0' : '#111827',
                marginBottom: '8px'
              }}>
                IndexedDB
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px',
                fontSize: '11px',
                color: darkMode ? '#8b8b9e' : '#6b7280'
              }}>
                {Object.entries(stats.indexedDB).map(([key, value]) => (
                  <div key={key}>
                    <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                      {key}:
                    </span>{' '}
                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LocalStorage Stats */}
          {stats.localStorage && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: darkMode ? '#e0e0e0' : '#111827',
                marginBottom: '8px'
              }}>
                LocalStorage
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#8b8b9e' : '#6b7280'
              }}>
                <div>
                  <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                    Used:
                  </span>{' '}
                  {Math.round(stats.localStorage.usage?.used / 1024)} KB
                </div>
                <div>
                  <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                    Limit:
                  </span>{' '}
                  {Math.round(stats.localStorage.usage?.limit / 1024)} KB
                </div>
                <div>
                  <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                    Usage:
                  </span>{' '}
                  {stats.localStorage.usage?.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Sync Stats */}
          {stats.sync && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: darkMode ? '#e0e0e0' : '#111827',
                marginBottom: '8px'
              }}>
                Device Sync
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#8b8b9e' : '#6b7280'
              }}>
                <div>
                  <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                    Online Devices:
                  </span>{' '}
                  {stats.sync.onlineDevices || 0}
                </div>
                <div>
                  <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                    Sync Queue:
                  </span>{' '}
                  {stats.sync.syncQueueSize || 0}
                </div>
                <div>
                  <span style={{ color: darkMode ? '#6366f1' : '#6366f1' }}>
                    Status:
                  </span>{' '}
                  {stats.sync.isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
            </div>
          )}

          {/* Health History */}
          {stats.failover?.healthHistory && stats.failover.healthHistory.length > 0 && (
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: darkMode ? '#e0e0e0' : '#111827',
                marginBottom: '8px'
              }}>
                Recent Health Checks
              </div>
              <div style={{
                maxHeight: '120px',
                overflowY: 'auto',
                fontSize: '11px',
                color: darkMode ? '#8b8b9e' : '#6b7280'
              }}>
                {stats.failover.healthHistory.slice().reverse().map((health, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '6px',
                      marginBottom: '4px',
                      background: darkMode ? '#1e1e2e' : '#ffffff',
                      borderRadius: '4px',
                      border: `1px solid ${darkMode ? '#3d3d5c' : '#e5e7eb'}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}>
                      <span style={{ color: health.healthy ? '#10b981' : '#ef4444' }}>
                        {health.healthy ? '✓' : '✗'}
                      </span>
                      <span>
                        {new Date(health.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {health.error && (
                      <div style={{ color: '#ef4444', marginTop: '2px' }}>
                        {health.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Updated */}
      <div style={{
        marginTop: '12px',
        fontSize: '11px',
        color: darkMode ? '#8b8b9e' : '#6b7280',
        textAlign: 'center'
      }}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
