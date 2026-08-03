// Cloud Overview Section
// Displays comprehensive cloud platform status and health metrics

import React, { useState, useEffect } from 'react';
import { card } from '../../../styles/theme';
import storageEngine from '../../../cloud/StorageEngine.js';
import healthEngine from '../../../health/HealthEngine.js';
import { initializeHealthChecks } from '../../../health/initializeHealthChecks.js';
import { HealthState } from '../../../health/HealthTypes.js';

export default function CloudOverviewSection({ isMobile }) {
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize health checks
    initializeHealthChecks();
    healthEngine.initialize();
    
    loadHealthData();
    const interval = setInterval(loadHealthData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      setIsLoading(true);
      await storageEngine.initialize();
      
      // Get real health data from Health Engine
      const systemSummary = await healthEngine.getSystemSummary();
      const storageHealth = await healthEngine.checkComponent('storage-engine');
      const backupHealth = await healthEngine.checkComponent('backup-engine');
      const syncHealth = await healthEngine.checkComponent('sync-engine');
      
      const activeProvider = storageEngine.getActiveProviderInfo();
      const providers = storageEngine.getProvidersInfo();
      
      setHealthData({
        activeProvider: activeProvider?.name || 'None',
        providerId: activeProvider?.id || null,
        connectionStatus: activeProvider ? 'connected' : 'disconnected',
        databaseStatus: 'operational',
        cloudRegion: activeProvider?.config?.region || 'N/A',
        storageUsage: { used: 0, total: 0 },
        backupStatus: backupHealth?.status || 'unknown',
        lastBackup: backupHealth?.lastSuccessfulCheck || null,
        syncStatus: syncHealth?.status || 'unknown',
        securityScore: storageHealth?.healthScore || 85,
        platformVersion: '1.0.0',
        overallHealth: systemSummary?.overallStatus || 'unknown',
        providerCount: providers.length,
        connectedProviders: providers.filter(p => p.instance?.connected).length,
        systemSummary
      });
    } catch (error) {
      console.error('Failed to load health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case HealthState.HEALTHY:
        return 'var(--cafe-success)';
      case HealthState.WARNING:
        return 'var(--cafe-warning)';
      case HealthState.CRITICAL:
        return 'var(--cafe-danger)';
      case HealthState.OFFLINE:
        return 'var(--cafe-text-tertiary)';
      default:
        return 'var(--cafe-text-tertiary)';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getHealthColor = (health) => {
    return getHealthStatusColor(health);
  };

  const getHealthBg = (health) => {
    switch (health) {
      case HealthState.HEALTHY: return 'var(--cafe-success-bg)';
      case HealthState.WARNING: return 'var(--cafe-warning-bg)';
      case HealthState.CRITICAL: return 'var(--cafe-danger-bg)';
      default: return 'var(--cafe-bg)';
    }
  };

  if (isLoading) {
    return (
      <div style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)' }}>
            Loading platform status...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Overall Health Card */}
      <div style={{ 
        ...card, 
        padding: 24, 
        border: `2px solid ${getHealthColor(healthData?.overallHealth)}`,
        background: getHealthBg(healthData?.overallHealth)
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Platform Health
          </h3>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: getHealthColor(healthData?.overallHealth),
            textTransform: 'capitalize'
          }}>
            {healthData?.overallHealth || 'Unknown'}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--cafe-text-secondary)' }}>
          {healthData?.overallHealth === HealthState.HEALTHY && 'All systems operational'}
          {healthData?.overallHealth === HealthState.WARNING && 'Some systems require attention'}
          {healthData?.overallHealth === HealthState.CRITICAL && 'Critical issues detected'}
        </div>
      </div>

      {/* Primary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
        <MetricCard
          title="Active Provider"
          value={healthData?.activeProvider || 'None'}
          icon="☁️"
          status={healthData?.connectionStatus}
        />
        <MetricCard
          title="Connection Status"
          value={healthData?.connectionStatus || 'Unknown'}
          icon="🔗"
          status={healthData?.connectionStatus}
        />
        <MetricCard
          title="Database Status"
          value={healthData?.databaseStatus || 'Unknown'}
          icon="🗄️"
          status="operational"
        />
      </div>

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 16 }}>
        <MetricCard
          title="Cloud Region"
          value={healthData?.cloudRegion || 'N/A'}
          icon="🌍"
          status="info"
        />
        <MetricCard
          title="Storage Used"
          value={formatBytes(healthData?.storageUsage?.used || 0)}
          icon="💾"
          status="info"
        />
        <MetricCard
          title="Backup Status"
          value={healthData?.backupStatus || 'Unknown'}
          icon="📦"
          status={healthData?.backupStatus}
        />
        <MetricCard
          title="Sync Status"
          value={healthData?.syncStatus || 'Unknown'}
          icon="🔄"
          status={healthData?.syncStatus}
        />
      </div>

      {/* Timeline Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        <TimelineCard
          title="Last Backup"
          timestamp={healthData?.lastBackup}
          icon="📦"
        />
        <TimelineCard
          title="Last Restore"
          timestamp={null}
          icon="🔄"
        />
      </div>

      {/* Security & Version */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
        <MetricCard
          title="Security Score"
          value={`${healthData?.securityScore || 0}/100`}
          icon="🛡️"
          status={healthData?.securityScore >= 80 ? 'healthy' : 'warning'}
        />
        <MetricCard
          title="Platform Version"
          value={healthData?.platformVersion || 'Unknown'}
          icon="📋"
          status="info"
        />
      </div>

      {/* Provider Summary */}
      <div style={{ ...card, padding: 20 }}>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 12 }}>
          Provider Summary
        </h4>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Total Providers</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              {healthData?.providerCount || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Connected</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-success)' }}>
              {healthData?.connectedProviders || 0}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>Inactive</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-secondary)' }}>
              {(healthData?.providerCount || 0) - (healthData?.connectedProviders || 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'operational':
      case 'healthy':
      case 'synced':
        return 'var(--cafe-success)';
      case 'disconnected':
      case 'failed':
      case 'critical':
        return 'var(--cafe-danger)';
      case 'warning':
        return 'var(--cafe-warning)';
      default:
        return 'var(--cafe-text-secondary)';
    }
  };

  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>{title}</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            {value}
          </div>
        </div>
      </div>
      <div style={{ 
        fontSize: 11, 
        color: getStatusColor(status),
        textTransform: 'capitalize'
      }}>
        {status}
      </div>
    </div>
  );
}

function TimelineCard({ title, timestamp, icon }) {
  return (
    <div style={{ ...card, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>{title}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
        {timestamp ? new Date(timestamp).toLocaleString() : 'Never'}
      </div>
    </div>
  );
}
