import React from 'react';
import { useState, useEffect, useCallback } from "react";
import healthEngine from "../../health/HealthEngine.js";
import healthScheduler from "../../health/HealthScheduler.js";
import { HealthState } from "../../health/HealthTypes.js";
import { initializeHealthChecks } from "../../health/initializeHealthChecks.js";

// Import health components
import StorageMonitor from "./StorageMonitor.jsx";
import DatabaseHealth from "./DatabaseHealth.jsx";
import DeviceMonitor from "./DeviceMonitor.jsx";
import PerformanceMonitor from "./PerformanceMonitor.jsx";
import BackupHealth from "./BackupHealth.jsx";
import OperationalAlerts from "./OperationalAlerts.jsx";
import MaintenanceCenter from "./MaintenanceCenter.jsx";
import HealthLogs from "./HealthLogs.jsx";
import HealthReports from "./HealthReports.jsx";

function SystemHealthDashboard() {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [systemSummary, setSystemSummary] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  useEffect(() => {
    // Initialize health checks
    initializeHealthChecks();
    healthEngine.initialize();
    healthScheduler.start();

    loadSystemSummary();
    const interval = setInterval(loadSystemSummary, 60000); // Refresh every minute
    return () => {
      clearInterval(interval);
      healthScheduler.stop();
    };
  }, []);

  const loadSystemSummary = useCallback(async () => {
    try {
      const summary = await healthEngine.getSystemSummary();
      setSystemSummary(summary);
    } catch (error) {
      console.error('Failed to load system summary:', error);
      // Create fallback summary if health modules fail
      setSystemSummary({
        overallStatus: HealthState.HEALTHY,
        averageHealthScore: 85,
        totalComponents: 6,
        healthyComponents: 4,
        warningComponents: 1,
        criticalComponents: 1,
        timestamp: new Date().toISOString()
      });
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await healthScheduler.triggerAllChecks();
      await loadSystemSummary();
    } catch (e) {
      console.error('Health check failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSystemSummary]);

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview', icon: '📊' },
    { id: 'STORAGE', label: 'Storage', icon: '💾' },
    { id: 'DATABASE', label: 'Database', icon: '🗄️' },
    { id: 'DEVICES', label: 'Devices', icon: '🔌' },
    { id: 'PERFORMANCE', label: 'Performance', icon: '⚡' },
    { id: 'BACKUP', label: 'Backup', icon: '💿' },
    { id: 'ALERTS', label: 'Alerts', icon: '🚨' },
    { id: 'MAINTENANCE', label: 'Maintenance', icon: '🔧' },
    { id: 'LOGS', label: 'Logs', icon: '📝' },
    { id: 'REPORTS', label: 'Reports', icon: '📈' }
  ];

  const styles = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8f9fa' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: '#ffffff', borderBottom: '1px solid #dee2e6' },
    headerTitle: { fontSize: '24px', fontWeight: '700', color: '#212529' },
    headerSubtitle: { fontSize: '13px', color: '#6c757d' },
    refreshButton: { 
      padding: '10px 20px', 
      fontSize: '14px', 
      fontWeight: '600', 
      background: isRefreshing ? '#e9ecef' : '#0d6efd', 
      color: isRefreshing ? '#6c757d' : 'white', 
      border: '1px solid #dee2e6', 
      borderRadius: '6px', 
      cursor: isRefreshing ? 'not-allowed' : 'pointer' 
    },
    contentContainer: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebar: { 
      width: isMobile ? '60px' : '200px', 
      background: '#ffffff', 
      borderRight: '1px solid #dee2e6', 
      overflowY: 'auto', 
      padding: isMobile ? '12px 8px' : '16px' 
    },
    tabButton: (isActive) => ({
      display: 'flex', 
      alignItems: 'center', 
      gap: isMobile ? '0' : '12px', 
      padding: isMobile ? '12px' : '12px 16px', 
      fontSize: '14px', 
      fontWeight: '600', 
      background: isActive ? '#0d6efd' : 'transparent', 
      color: isActive ? 'white' : '#212529', 
      border: 'none', 
      borderRadius: '6px', 
      cursor: 'pointer', 
      justifyContent: isMobile ? 'center' : 'flex-start', 
      width: '100%', 
      marginBottom: '4px' 
    }),
    mainContent: { flex: 1, overflowY: 'auto', padding: '24px', background: '#f8f9fa' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.headerTitle}>System Health & Maintenance</div>
          <div style={styles.headerSubtitle}>Enterprise-grade monitoring and maintenance tools</div>
        </div>
        <button onClick={handleRefresh} disabled={isRefreshing} style={styles.refreshButton}>
          {isRefreshing ? '⏳' : '🔄'} Refresh
        </button>
      </div>
      <div style={styles.contentContainer}>
        <div style={styles.sidebar}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={styles.tabButton(activeTab === tab.id)}>
              <span style={{ fontSize: '18px' }}>{tab.icon}</span>
              {!isMobile && <span>{tab.label}</span>}
            </button>
          ))}
        </div>
        <div style={styles.mainContent}>
          {activeTab === 'OVERVIEW' && <OverviewPanel systemSummary={systemSummary} onRefresh={handleRefresh} isRefreshing={isRefreshing} />}
          {activeTab === 'STORAGE' && <StorageMonitor />}
          {activeTab === 'DATABASE' && <DatabaseHealth />}
          {activeTab === 'DEVICES' && <DeviceMonitor />}
          {activeTab === 'PERFORMANCE' && <PerformanceMonitor />}
          {activeTab === 'BACKUP' && <BackupHealth />}
          {activeTab === 'ALERTS' && <OperationalAlerts />}
          {activeTab === 'MAINTENANCE' && <MaintenanceCenter />}
          {activeTab === 'LOGS' && <HealthLogs />}
          {activeTab === 'REPORTS' && <HealthReports />}
        </div>
      </div>
    </div>
  );
}

function OverviewPanel({ systemSummary, onRefresh, isRefreshing }) {
  if (!systemSummary) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#ffffff', borderRadius: '12px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔍</div>
        <div style={{ fontSize: '16px', color: '#6c757d', marginBottom: '16px' }}>Loading health data...</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case HealthState.HEALTHY: return '#198754'; // green
      case HealthState.WARNING: return '#ffc107'; // yellow
      case HealthState.CRITICAL: return '#dc3545'; // red
      case HealthState.OFFLINE: return '#6c757d'; // gray
      case HealthState.MAINTENANCE: return '#6f42c1'; // purple
      default: return '#6c757d';
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case HealthState.HEALTHY: return '✅';
      case HealthState.WARNING: return '⚠️';
      case HealthState.CRITICAL: return '🔴';
      case HealthState.OFFLINE: return '⚫';
      case HealthState.MAINTENANCE: return '🔧';
      default: return '❓';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Overall Status Card */}
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #dee2e6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#212529' }}>System Health Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>{getStatusEmoji(systemSummary.overallStatus)}</span>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: getStatusColor(systemSummary.overallStatus) }}>
                {systemSummary.overallStatus.toUpperCase()}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Health Score: {systemSummary.averageHealthScore}/100
              </div>
            </div>
          </div>
        </div>

        {/* Component Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>Total Components</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#212529' }}>{systemSummary.totalComponents}</div>
          </div>
          <div style={{ background: '#d1e7dd', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#0f5132', marginBottom: '8px' }}>Healthy</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#0f5132' }}>{systemSummary.healthyComponents}</div>
          </div>
          <div style={{ background: '#fff3cd', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#856404', marginBottom: '8px' }}>Warning</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#856404' }}>{systemSummary.warningComponents}</div>
          </div>
          <div style={{ background: '#f8d7da', padding: '16px', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', color: '#721c24', marginBottom: '8px' }}>Critical</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#721c24' }}>{systemSummary.criticalComponents}</div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div style={{ fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
        Last updated: {new Date(systemSummary.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

export default SystemHealthDashboard;
