// Diagnostics Section
// System diagnostics and reports

import React, { useState, useEffect } from 'react';
import { card, btn } from '../../../styles/theme';
import healthEngine from '../../../health/HealthEngine.js';
import { initializeHealthChecks } from '../../../health/initializeHealthChecks.js';
import { HealthState } from '../../../health/HealthTypes.js';

export default function DiagnosticsSection({ isMobile }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState({ type: null, text: '' });
  const [healthReports, setHealthReports] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

  useEffect(() => {
    initializeHealthChecks();
    healthEngine.initialize();
    loadHealthReports();
  }, []);

  const loadHealthReports = async () => {
    setIsLoadingHealth(true);
    try {
      const reports = await healthEngine.getAllReports();
      setHealthReports(reports);
    } catch (error) {
      console.error('Failed to load health reports:', error);
    } finally {
      setIsLoadingHealth(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: null, text: '' }), 5000);
  };

  const handleGenerateReport = async (reportType) => {
    setIsGenerating(true);
    try {
      // Use real health data from Health Engine
      const reports = await healthEngine.getAllReports();
      const systemSummary = await healthEngine.getSystemSummary();
      
      // Generate report based on type
      let reportData = {};
      switch (reportType) {
        case 'cloud':
          reportData = {
            type: 'cloud',
            timestamp: new Date().toISOString(),
            summary: systemSummary,
            components: reports.filter(r => r.category === 'cloud')
          };
          break;
        case 'storage':
          reportData = {
            type: 'storage',
            timestamp: new Date().toISOString(),
            components: reports.filter(r => r.category === 'storage')
          };
          break;
        default:
          reportData = {
            type: reportType,
            timestamp: new Date().toISOString(),
            summary: systemSummary,
            components: reports
          };
      }
      
      // Download report
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showMessage('success', `${reportType} report generated successfully`);
    } catch (error) {
      showMessage('error', `Failed to generate ${reportType} report`);
    } finally {
      setIsGenerating(false);
    }
  };

  const REPORTS = [
    { id: 'cloud', name: 'Cloud Report', icon: '☁️', description: 'Cloud platform status and connectivity' },
    { id: 'storage', name: 'Storage Report', icon: '💾', description: 'Storage usage and performance metrics' },
    { id: 'provider', name: 'Provider Report', icon: '🔌', description: 'Provider health and configuration' },
    { id: 'performance', name: 'Performance Report', icon: '📊', description: 'System performance analysis' },
    { id: 'security', name: 'Security Report', icon: '🛡️', description: 'Security status and audit logs' },
    { id: 'connectivity', name: 'Connectivity Report', icon: '🔗', description: 'Network and connection diagnostics' },
    { id: 'support', name: 'Support Package', icon: '📦', description: 'Complete package for support team' }
  ];

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

      {/* Real-time Component Health */}
      {healthReports && (
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
              Component Health Status
            </h3>
            <button
              onClick={loadHealthReports}
              disabled={isLoadingHealth}
              style={{ ...btn('ghost'), fontSize: 12, padding: '6px 12px' }}
            >
              {isLoadingHealth ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
            {healthReports.map((report) => (
              <div
                key={report.componentId}
                style={{
                  padding: 16,
                  background: 'var(--cafe-bg)',
                  borderRadius: 8,
                  border: `1px solid ${
                    report.result.status === HealthState.HEALTHY ? 'var(--cafe-success-border)' :
                    report.result.status === HealthState.WARNING ? 'var(--cafe-warning-border)' :
                    report.result.status === HealthState.CRITICAL ? 'var(--cafe-danger-border)' : 'var(--cafe-border)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                    {report.componentName}
                  </div>
                  <div style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: report.result.status === HealthState.HEALTHY ? 'var(--cafe-success-bg)' :
                               report.result.status === HealthState.WARNING ? 'var(--cafe-warning-bg)' :
                               report.result.status === HealthState.CRITICAL ? 'var(--cafe-danger-bg)' : 'var(--cafe-bg)',
                    color: report.result.status === HealthState.HEALTHY ? 'var(--cafe-success)' :
                           report.result.status === HealthState.WARNING ? 'var(--cafe-warning)' :
                           report.result.status === HealthState.CRITICAL ? 'var(--cafe-danger)' : 'var(--cafe-text-secondary)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {report.result.status}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>
                  {report.result.reason}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                  <span>Score: {report.result.healthScore}/100</span>
                  <span>Latency: {Math.round(report.result.latency)}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagnostics Reports */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          Diagnostic Reports
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
          {REPORTS.map((report) => (
            <div
              key={report.id}
              style={{
                padding: 16,
                background: 'var(--cafe-bg)',
                borderRadius: 8,
                border: '1px solid var(--cafe-border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{report.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                    {report.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>
                    {report.description}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleGenerateReport(report.name)}
                disabled={isGenerating}
                style={{ ...btn('ghost'), fontSize: 12, padding: '8px 16px', width: '100%' }}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div style={{ ...card, padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>
          System Information
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Platform Version</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
              1.0.0
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Build Date</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Environment</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
              Production
            </div>
          </div>
          <div style={{ padding: 16, background: 'var(--cafe-bg)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', marginBottom: 4 }}>Browser</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cafe-text-primary)' }}>
              {navigator.userAgent.split(' ')[0]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
