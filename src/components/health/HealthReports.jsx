import React from 'react';
import { useState } from "react";
import { getHealthData, getHealthLogs, estimateStorageUsage, getStorageBreakdown } from "../../utils/healthMonitoring.js";
import { createSystemHealthReport } from "../../domain/healthModel.js";

function HealthReports() {
  const [generating, setGenerating] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const reportTypes = [
    { id: 'SYSTEM_HEALTH', label: 'System Health Report', description: 'Complete system health analysis', icon: '🏥' },
    { id: 'MAINTENANCE', label: 'Maintenance Report', description: 'Maintenance operations history', icon: '🔧' },
    { id: 'DEVICE', label: 'Device Report', description: 'Device status and connectivity', icon: '🔌' },
    { id: 'DATABASE', label: 'Database Report', description: 'Database integrity and performance', icon: '🗄️' },
    { id: 'BACKUP', label: 'Backup Report', description: 'Backup status and history', icon: '💿' }
  ];

  const generateReport = async (type) => {
    setGenerating(type);
    try {
      const healthData = getHealthData();
      const logs = getHealthLogs();
      const storageUsage = estimateStorageUsage();
      const storageBreakdown = getStorageBreakdown();

      let reportData;
      switch (type) {
        case 'SYSTEM_HEALTH':
          reportData = {
            overallScore: healthData?.healthScore || 0,
            overallStatus: healthData?.overallStatus || 'UNKNOWN',
            metrics: healthData?.metrics || [],
            alerts: healthData?.alerts || [],
            devices: healthData?.devices || [],
            recommendations: generateRecommendations(healthData)
          };
          break;
        case 'MAINTENANCE':
          reportData = {
            operations: logs,
            totalOperations: logs.length,
            completedOperations: logs.filter(l => l.status === 'COMPLETED').length,
            failedOperations: logs.filter(l => l.status === 'FAILED').length
          };
          break;
        case 'DEVICE':
          reportData = {
            devices: healthData?.devices || [],
            totalDevices: healthData?.devices?.length || 0,
            connectedDevices: healthData?.devices?.filter(d => d.connected).length || 0
          };
          break;
        case 'DATABASE':
          reportData = {
            storageUsage,
            storageBreakdown,
            recordCounts: getRecordCounts()
          };
          break;
        case 'BACKUP':
          reportData = {
            lastBackup: healthData?.lastBackup,
            backupStatus: healthData?.lastBackup ? 'OK' : 'MISSING'
          };
          break;
        default:
          reportData = {};
      }

      const report = createSystemHealthReport({
        generatedBy: 'current-user',
        overallScore: reportData.overallScore || 0,
        overallStatus: reportData.overallStatus || 'UNKNOWN',
        metrics: reportData.metrics || [],
        alerts: reportData.alerts || [],
        devices: reportData.devices || [],
        recommendations: reportData.recommendations || [],
        metadata: { reportType: type, ...reportData }
      });

      setLastReport(report);
      downloadReport(report, type);
    } catch (e) {
      console.error('Report generation failed:', e);
    } finally {
      setGenerating(null);
    }
  };

  const generateRecommendations = (healthData) => {
    const recommendations = [];
    if (!healthData) return recommendations;

    if (healthData.healthScore < 80) {
      recommendations.push('System health score is below 80. Review critical alerts.');
    }
    if (healthData.alerts?.some(a => a.severity === 'CRITICAL' && !a.resolved)) {
      recommendations.push('Resolve critical alerts immediately.');
    }
    if (healthData.lastBackup) {
      const daysSinceBackup = (Date.now() - new Date(healthData.lastBackup).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceBackup > 7) {
        recommendations.push('Create a new backup. Last backup is over 7 days old.');
      }
    } else {
      recommendations.push('Create an initial backup to protect your data.');
    }

    return recommendations;
  };

  const getRecordCounts = () => {
    try {
      return {
        orders: JSON.parse(localStorage.getItem('cafeos_orders') || '[]').length,
        customers: JSON.parse(localStorage.getItem('cafeos_customers') || '[]').length,
        inventory: JSON.parse(localStorage.getItem('cafeos_inventory') || '[]').length,
        menu: JSON.parse(localStorage.getItem('cafeos_menu') || '[]').length
      };
    } catch (e) {
      return {};
    }
  };

  const downloadReport = (report, type) => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafeos-${type.toLowerCase()}-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Health Reports</div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
        {reportTypes.map(report => (
          <ReportCard
            key={report.id}
            report={report}
            isGenerating={generating === report.id}
            onGenerate={() => generateReport(report.id)}
          />
        ))}
      </div>

      {lastReport && (
        <div style={{ background: '#d4edda', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid #28a745' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#155724', marginBottom: '8px' }}>
            ✓ Report Generated Successfully
          </div>
          <div style={{ fontSize: '14px', color: '#155724' }}>
            Report ID: {lastReport.id} • Generated at {new Date(lastReport.generatedAt).toLocaleString()}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Report Information</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <InfoRow label="Format" value="JSON" />
          <InfoRow label="Includes" value="Metrics, alerts, recommendations, metadata" />
          <InfoRow label="Retention" value="Stored locally until downloaded" />
          <InfoRow label="Privacy" value="No external data transmission" />
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, isGenerating, onGenerate }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '32px' }}>{report.icon}</span>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{report.label}</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{report.description}</div>
        </div>
      </div>
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontWeight: '600',
          background: isGenerating ? 'var(--cafe-bg-elevated)' : 'var(--cafe-primary)',
          color: isGenerating ? 'var(--cafe-text-secondary)' : 'white',
          border: 'none',
          borderRadius: 'var(--cafe-radius-md)',
          cursor: isGenerating ? 'not-allowed' : 'pointer'
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
      <div style={{ fontSize: '14px', color: 'var(--cafe-text-primary)' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{value}</div>
    </div>
  );
}

export default HealthReports;
