/**
 * Live Business Health Widget
 * Displays real-time health status of all business components
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveBusinessHealthWidget({ instance, settings }) {
  const [healthData, setHealthData] = useState({
    overall: 'healthy',
    components: {
      cloud: { status: 'healthy', message: 'All systems operational' },
      database: { status: 'healthy', message: 'Connected' },
      payments: { status: 'healthy', message: 'Gateway active' },
      kitchen: { status: 'warning', message: 'High load' },
      orders: { status: 'healthy', message: 'Processing normally' },
      inventory: { status: 'healthy', message: 'Synced' },
      waiters: { status: 'healthy', message: 'All active' },
      printing: { status: 'healthy', message: 'Ready' },
      backups: { status: 'healthy', message: 'Last backup: 2h ago' },
      sync: { status: 'healthy', message: 'Up to date' }
    }
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('health', (data) => {
      setHealthData(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'var(--cafe-success)';
      case 'warning': return 'var(--cafe-warning)';
      case 'critical': return 'var(--cafe-danger)';
      case 'offline': return 'var(--cafe-text-tertiary)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '✕';
      case 'offline': return '○';
      default: return '?';
    }
  };

  const getOverallColor = (status) => {
    switch (status) {
      case 'healthy': return 'var(--cafe-success)';
      case 'warning': return 'var(--cafe-warning)';
      case 'critical': return 'var(--cafe-danger)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const criticalCount = Object.values(healthData.components).filter(c => c.status === 'critical').length;
  const warningCount = Object.values(healthData.components).filter(c => c.status === 'warning').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Business Health
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: healthData.overall === 'healthy' ? 'var(--cafe-success-bg)' : 'var(--cafe-warning-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: getOverallColor(healthData.overall)
        }}>
          {healthData.overall.toUpperCase()}
        </div>
      </div>

      {/* Overall Status */}
      <div style={{ 
        padding: 16, 
        background: healthData.overall === 'healthy' ? 'var(--cafe-success-bg)' : 'var(--cafe-warning-bg)',
        border: healthData.overall === 'healthy' ? '1px solid var(--cafe-success-border)' : '1px solid var(--cafe-warning-border)',
        borderRadius: 8,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 32, marginBottom: 4 }}>
          {getStatusIcon(healthData.overall)}
        </div>
        <div style={{ 
          fontSize: 16, 
          fontWeight: 700, 
          color: getOverallColor(healthData.overall),
          textTransform: 'capitalize'
        }}>
          {healthData.overall}
        </div>
      </div>

      {/* Issues Summary */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {criticalCount > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-danger-bg)', 
              border: '1px solid var(--cafe-danger-border)',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-danger)', fontFamily: 'monospace' }}>
                {criticalCount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cafe-danger)' }}>Critical</div>
            </div>
          )}
          {warningCount > 0 && (
            <div style={{ 
              padding: 12, 
              background: 'var(--cafe-warning-bg)', 
              border: '1px solid var(--cafe-warning-border)',
              borderRadius: 8,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-warning)', fontFamily: 'monospace' }}>
                {warningCount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--cafe-warning)' }}>Warnings</div>
            </div>
          )}
        </div>
      )}

      {/* Component Status */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Component Status
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {Object.entries(healthData.components).map(([name, component]) => (
            <div key={name} style={{ 
              padding: 10, 
              background: 'var(--cafe-bg-surface)', 
              border: `1px solid ${getStatusColor(component.status)}`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{ fontSize: 16 }}>{getStatusIcon(component.status)}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cafe-text-primary)', textTransform: 'capitalize' }}>
                  {name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>
                  {component.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(LiveBusinessHealthWidget);
