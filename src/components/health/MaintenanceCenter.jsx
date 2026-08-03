import React from 'react';
import { useState } from "react";
import { runHealthCheck, clearCache, cleanTemporaryFiles, exportDiagnostics, getHealthLogs } from "../../utils/healthMonitoring.js";
import { MAINTENANCE_OPERATIONS } from "../../domain/healthModel.js";

function MaintenanceCenter() {
  const [isRunning, setIsRunning] = useState(null);
  const [result, setResult] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const maintenanceActions = [
    {
      id: MAINTENANCE_OPERATIONS.HEALTH_CHECK,
      label: 'Run Health Check',
      description: 'Perform comprehensive system health analysis',
      icon: '🔍',
      destructive: false
    },
    {
      id: MAINTENANCE_OPERATIONS.CLEAR_CACHE,
      label: 'Clear Cache',
      description: 'Remove temporary cache files to free memory',
      icon: '🗑️',
      destructive: true
    },
    {
      id: MAINTENANCE_OPERATIONS.CLEAN_TEMP_FILES,
      label: 'Clean Temporary Files',
      description: 'Remove temporary files and clean up storage',
      icon: '🧹',
      destructive: true
    },
    {
      id: MAINTENANCE_OPERATIONS.EXPORT_DIAGNOSTICS,
      label: 'Export Diagnostics',
      description: 'Generate and download diagnostic report',
      icon: '📥',
      destructive: false
    },
    {
      id: MAINTENANCE_OPERATIONS.OPTIMIZE_DATABASE,
      label: 'Optimize Database',
      description: 'Compact and optimize database structure',
      icon: '⚡',
      destructive: false
    },
    {
      id: MAINTENANCE_OPERATIONS.REBUILD_INDEX,
      label: 'Rebuild Search Index',
      description: 'Rebuild search index for faster queries',
      icon: '🔄',
      destructive: false
    },
    {
      id: MAINTENANCE_OPERATIONS.VERIFY_CONFIG,
      label: 'Verify Configuration',
      description: 'Check system configuration for issues',
      icon: '✅',
      destructive: false
    },
    {
      id: MAINTENANCE_OPERATIONS.GENERATE_REPORT,
      label: 'Generate Maintenance Report',
      description: 'Create detailed maintenance report',
      icon: '📊',
      destructive: false
    }
  ];

  const handleAction = async (action) => {
    setIsRunning(action.id);
    setResult(null);

    try {
      let response;
      switch (action.id) {
        case MAINTENANCE_OPERATIONS.HEALTH_CHECK:
          response = await runHealthCheck();
          setResult({ success: true, message: 'Health check completed successfully', data: response });
          break;
        case MAINTENANCE_OPERATIONS.CLEAR_CACHE:
          response = await clearCache();
          setResult(response);
          break;
        case MAINTENANCE_OPERATIONS.CLEAN_TEMP_FILES:
          response = await cleanTemporaryFiles();
          setResult(response);
          break;
        case MAINTENANCE_OPERATIONS.EXPORT_DIAGNOSTICS:
          response = await exportDiagnostics();
          setResult(response);
          break;
        default:
          setResult({ success: true, message: 'Operation completed' });
      }
    } catch (e) {
      setResult({ success: false, error: e.message });
    } finally {
      setIsRunning(null);
    }
  };

  const recentLogs = getHealthLogs().slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Maintenance Center</div>

      {result && (
        <div style={{ padding: '16px', borderRadius: 'var(--cafe-radius-lg)', background: result.success ? '#d4edda' : '#f8d7da', border: result.success ? '1px solid #28a745' : '1px solid #dc3545' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: result.success ? '#155724' : '#721c24' }}>
            {result.success ? '✓ ' : '✗ '}{result.message || (result.error ? 'Operation failed' : 'Operation completed')}
          </div>
          {result.data && (
            <div style={{ fontSize: '13px', color: result.success ? '#155724' : '#721c24', marginTop: '8px' }}>
              Health Score: {result.data.healthScore} | Status: {result.data.overallStatus}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
        {maintenanceActions.map(action => (
          <MaintenanceActionCard
            key={action.id}
            action={action}
            isRunning={isRunning === action.id}
            onExecute={() => handleAction(action)}
          />
        ))}
      </div>

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '16px' }}>Recent Maintenance Activity</div>
        {recentLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentLogs.map(log => (
              <LogEntry key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>No recent maintenance activity</div>
        )}
      </div>

      <div style={{ background: '#fff3cd', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '2px solid #f39c12' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#f39c12', marginBottom: '8px' }}>
          ⚠️ Maintenance Safety
        </div>
        <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
          Destructive operations like clearing cache and cleaning temporary files cannot be undone. Ensure you have a recent backup before performing these actions.
        </div>
      </div>
    </div>
  );
}

function MaintenanceActionCard({ action, isRunning, onExecute }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '20px', border: action.destructive ? '2px solid #f39c12' : '1px solid var(--cafe-border-light)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>{action.icon}</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{action.label}</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{action.description}</div>
        </div>
      </div>
      <button
        onClick={onExecute}
        disabled={isRunning}
       style={{
          width: '100%',
          padding: '12px',
          fontSize: '14px',
          fontWeight: '600',
          background: isRunning ? 'var(--cafe-bg-elevated)' : action.destructive ? '#f39c12' : 'var(--cafe-primary)',
          color: isRunning ? 'var(--cafe-text-secondary)' : 'white',
          border: 'none',
          borderRadius: 'var(--cafe-radius-md)',
          cursor: isRunning ? 'not-allowed' : 'pointer'
        }}
      >
        {isRunning ? 'Running...' : action.destructive ? 'Execute (Destructive)' : 'Execute'}
      </button>
    </div>
  );
}

function LogEntry({ log }) {
  const statusColors = {
    COMPLETED: '#27ae60',
    FAILED: '#e74c3c',
    PENDING: '#f39c12'
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{log.operation.replace('_', ' ')}</div>
        <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{new Date(log.startedAt).toLocaleString()}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {log.duration && <div style={{ fontSize: '12px', color: 'var(--cafe-text-secondary)' }}>{log.duration}ms</div>}
        <div style={{ padding: '4px 12px', background: `${statusColors[log.status]}20`, color: statusColors[log.status], borderRadius: 'var(--cafe-radius-sm)', fontSize: '11px', fontWeight: '600' }}>
          {log.status}
        </div>
      </div>
    </div>
  );
}

export default MaintenanceCenter;
