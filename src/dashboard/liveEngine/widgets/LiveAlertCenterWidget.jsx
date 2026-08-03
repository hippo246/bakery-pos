/**
 * Live Alert Center Widget
 * Displays actionable operational alerts from Notification Center
 * Dashboard is read-only consumer of platform notifications
 */

import React, { useState, useEffect, memo } from 'react';
import liveOperationsEngine from '../LiveOperationsEngine.js';

function LiveAlertCenterWidget({ instance, settings, notifications }) {
  const [alerts, setAlerts] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = liveOperationsEngine.subscribe('alerts', (data) => {
      setAlerts(data);
      setLastUpdate(Date.now());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Process notifications reactively when they change
  useEffect(() => {
    const formatTimeAgo = (timestamp) => {
      const now = Date.now();
      const diff = Math.floor((now - timestamp) / 1000);
      if (diff < 60) return `${diff}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      return `${Math.floor(diff / 3600)}h ago`;
    };

    const realAlerts = (notifications || [])
      .filter(n => n.type === 'alert' || n.severity === 'critical' || n.severity === 'warning')
      .map(n => ({
        id: n.id,
        type: n.category || 'system',
        severity: n.severity || 'info',
        message: n.message,
        time: formatTimeAgo(n.createdAt),
        acknowledged: n.acknowledged || false
      }));
    
    liveOperationsEngine.updateData('alerts', realAlerts);
  }, [notifications]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'var(--cafe-danger)';
      case 'warning': return 'var(--cafe-warning)';
      case 'info': return 'var(--cafe-info)';
      default: return 'var(--cafe-text-secondary)';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'critical': return 'var(--cafe-danger-bg)';
      case 'warning': return 'var(--cafe-warning-bg)';
      case 'info': return 'var(--cafe-info-bg)';
      default: return 'var(--cafe-bg-surface)';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'kitchen': return '👨‍🍳';
      case 'inventory': return '📦';
      case 'orders': return '📋';
      case 'payments': return '💳';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const unacknowledgedCount = alerts.filter(a => !a.acknowledged).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const acknowledgeAlert = (id) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Alert Center
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        {criticalCount > 0 && (
          <div style={{ 
            padding: '4px 12px', 
            background: 'var(--cafe-danger-bg)',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cafe-danger)'
          }}>
            {criticalCount} Critical
          </div>
        )}
      </div>

      {/* Summary */}
      {unacknowledgedCount > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-warning-bg)', 
          border: '1px solid var(--cafe-warning-border)',
          borderRadius: 8,
          fontSize: 13,
          color: 'var(--cafe-warning)',
          textAlign: 'center'
        }}>
          {unacknowledgedCount} unacknowledged alert{unacknowledgedCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Alerts List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {alerts.length === 0 ? (
          <div style={{ 
            padding: 20, 
            textAlign: 'center', 
            color: 'var(--cafe-success)',
            fontSize: 14
          }}>
            ✓ No active alerts
          </div>
        ) : (
          alerts.map(alert => (
            <div 
              key={alert.id}
              style={{ 
                padding: 12, 
                background: alert.acknowledged ? 'var(--cafe-bg-surface)' : getSeverityBg(alert.severity),
                border: alert.acknowledged ? '1px solid var(--cafe-border)' : `1px solid ${getSeverityColor(alert.severity)}`,
                borderRadius: 8,
                marginBottom: 8,
                opacity: alert.acknowledged ? 0.6 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{getTypeIcon(alert.type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: 13, 
                    fontWeight: 500, 
                    color: alert.acknowledged ? 'var(--cafe-text-secondary)' : getSeverityColor(alert.severity) 
                  }}>
                    {alert.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                    {alert.time}
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--cafe-bg-card)',
                      border: '1px solid var(--cafe-border)',
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: 'pointer',
                      color: 'var(--cafe-text-secondary)'
                    }}
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(LiveAlertCenterWidget);
