// Monitoring Section
// Health monitoring and alerts configuration

import React, { useState, useEffect } from 'react';
import { card, btn, input, label } from '../../../styles/theme';
import { validateMonitoringConfig } from '../../../utils/cloudSettingsValidation.js';
import { createSecurityAuditLog } from '../../../domain/auditLogModel.js';
import { getCurrentUserId } from '../../../utils/authService.js';
import healthEngine from '../../../health/HealthEngine.js';
import { initializeHealthChecks } from '../../../health/initializeHealthChecks.js';
import { HealthState } from '../../../health/HealthTypes.js';

export default function MonitoringSection({ isMobile }) {
  const [monitoringConfig, setMonitoringConfig] = useState({
    healthCheckInterval: 60, // seconds
    storageMonitoring: true,
    backupMonitoring: true,
    syncMonitoring: true,
    performanceMonitoring: true,
    errorMonitoring: true,
    alertThreshold: 80, // percentage
    notificationRules: {
      email: false,
      inApp: true,
      webhook: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [systemSummary, setSystemSummary] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);

  useEffect(() => {
    loadMonitoringConfig();
    initializeHealthChecks();
    healthEngine.initialize();
    loadHealthData();
    const interval = setInterval(loadHealthData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringConfig = () => {
    try {
      const saved = localStorage.getItem('cafeos_monitoring_config');
      if (saved) {
        setMonitoringConfig(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load monitoring config:', error);
    }
  };

  const loadHealthData = async () => {
    try {
      const summary = await healthEngine.getSystemSummary();
      setSystemSummary(summary);
      setActiveAlerts(healthEngine.getAllAlerts());
    } catch (error) {
      console.error('Failed to load health data:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleSaveConfig = async () => {
    // Validate before saving
    const validation = validateMonitoringConfig(monitoringConfig);
    if (!validation.valid) {
      showMessage('error', validation.error);
      return;
    }

    setIsLoading(true);
    try {
      localStorage.setItem('cafeos_monitoring_config', JSON.stringify(monitoringConfig));
      
      // Audit log
      const userId = getCurrentUserId();
      await createSecurityAuditLog({
        action: 'MONITORING_CONFIG_UPDATED',
        details: `Monitoring configuration updated: interval=${monitoringConfig.healthCheckInterval}s, threshold=${monitoringConfig.alertThreshold}%`,
        userId,
        category: 'CLOUD_SETTINGS'
      });
      
      showMessage('success', 'Monitoring configuration saved');
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

      {/* Real-time Health Status */}
      {systemSummary && (
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              System Health Status
            </h3>
            <div style={{ 
              padding: '4px 12px', 
              borderRadius: 12, 
              background: systemSummary.overallStatus === HealthState.HEALTHY ? 'var(--cafe-success-bg)' : 
                           systemSummary.overallStatus === HealthState.WARNING ? 'var(--cafe-warning-bg)' :
                           systemSummary.overallStatus === HealthState.CRITICAL ? 'var(--cafe-danger-bg)' : 'var(--cafe-bg)',
              color: systemSummary.overallStatus === HealthState.HEALTHY ? 'var(--cafe-success)' : 
                     systemSummary.overallStatus === HealthState.WARNING ? 'var(--cafe-warning)' :
                     systemSummary.overallStatus === HealthState.CRITICAL ? 'var(--cafe-danger)' : 'var(--cafe-text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {systemSummary.overallStatus}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
            <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Total Components</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>{systemSummary.totalComponents}</div>
            </div>
            <div style={{ padding: 16, background: 'var(--cafe-success-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--cafe-success)', marginBottom: 4 }}>Healthy</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-success)' }}>{systemSummary.healthyComponents}</div>
            </div>
            <div style={{ padding: 16, background: 'var(--cafe-warning-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--cafe-warning)', marginBottom: 4 }}>Warning</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-warning)' }}>{systemSummary.warningComponents}</div>
            </div>
            <div style={{ padding: 16, background: 'var(--cafe-danger-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--cafe-danger)', marginBottom: 4 }}>Critical</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--cafe-danger)' }}>{systemSummary.criticalComponents}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>
            Health Score: {systemSummary.averageHealthScore}/100 · Last updated: {new Date(systemSummary.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div style={{ ...card, padding: 24, border: '1px solid var(--cafe-danger-border)', background: 'var(--cafe-danger-bg)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-danger)', marginBottom: 16 }}>
            Active Alerts ({activeAlerts.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeAlerts.slice(0, 5).map((alert, index) => (
              <div key={index} style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--cafe-danger-border)' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>
                  {alert.componentId}
                </div>
                <div style={{ fontSize: 13, color: 'var(--cafe-text-secondary)' }}>
                  {alert.message}
                </div>
                <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            {activeAlerts.length > 5 && (
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', textAlign: 'center' }}>
                +{activeAlerts.length - 5} more alerts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Check Configuration */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Health Check Configuration
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, marginBottom: 8 }}>Health Check Interval (seconds)</label>
            <input
              type="number"
              value={monitoringConfig.healthCheckInterval}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, healthCheckInterval: parseInt(e.target.value) })}
              style={{ ...input }}
              min={30}
              max={3600}
            />
          </div>

          <div>
            <label style={{ ...label, marginBottom: 8 }}>Alert Threshold (%)</label>
            <input
              type="number"
              value={monitoringConfig.alertThreshold}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, alertThreshold: parseInt(e.target.value) })}
              style={{ ...input }}
              min={50}
              max={100}
            />
          </div>
        </div>
      </div>

      {/* Monitoring Modules */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Monitoring Modules
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Storage Monitoring</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Monitor storage health and usage</div>
            </div>
            <input
              type="checkbox"
              checked={monitoringConfig.storageMonitoring}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, storageMonitoring: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Backup Monitoring</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Monitor backup status and failures</div>
            </div>
            <input
              type="checkbox"
              checked={monitoringConfig.backupMonitoring}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, backupMonitoring: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Sync Monitoring</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Monitor synchronization status</div>
            </div>
            <input
              type="checkbox"
              checked={monitoringConfig.syncMonitoring}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, syncMonitoring: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Performance Monitoring</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Monitor system performance metrics</div>
            </div>
            <input
              type="checkbox"
              checked={monitoringConfig.performanceMonitoring}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, performanceMonitoring: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>Error Monitoring</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Monitor errors and exceptions</div>
            </div>
            <input
              type="checkbox"
              checked={monitoringConfig.errorMonitoring}
              onChange={(e) => setMonitoringConfig({ ...monitoringConfig, errorMonitoring: e.target.checked })}
              style={{ width: 20, height: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Notification Rules */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Notification Rules
        </h3>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={monitoringConfig.notificationRules.email}
              onChange={(e) => setMonitoringConfig({ 
                ...monitoringConfig, 
                notificationRules: { ...monitoringConfig.notificationRules, email: e.target.checked }
              })}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Email Notifications</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={monitoringConfig.notificationRules.inApp}
              onChange={(e) => setMonitoringConfig({ 
                ...monitoringConfig, 
                notificationRules: { ...monitoringConfig.notificationRules, inApp: e.target.checked }
              })}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>In-App Notifications</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={monitoringConfig.notificationRules.webhook}
              onChange={(e) => setMonitoringConfig({ 
                ...monitoringConfig, 
                notificationRules: { ...monitoringConfig.notificationRules, webhook: e.target.checked }
              })}
              style={{ width: 18, height: 18 }}
            />
            <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>Webhook Notifications</span>
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
