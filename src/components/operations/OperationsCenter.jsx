// Operations Center
// Premium Cloud Operations Command Center

import React, { useState, useEffect, useCallback } from 'react';
import { getSystemHealthMonitor } from '../../operations/SystemHealthMonitor.js';
import { getLiveMetricsCollector } from '../../operations/LiveMetricsCollector.js';
import { getServiceStatusTracker } from '../../operations/ServiceStatusTracker.js';
import { getErrorCenter } from '../../operations/ErrorCenter.js';
import { getAlertCenter } from '../../operations/AlertCenter.js';
import { getLogViewer } from '../../operations/LogViewer.js';
import { getPerformanceDashboard } from '../../operations/PerformanceDashboard.js';
import { getDiagnosticsGenerator } from '../../operations/DiagnosticsGenerator.js';
import { SystemHealthStatus, ServiceStatus, AlertSeverity, AlertStatus } from '../../operations/OperationsTypes.js';

export default function OperationsCenter() {
  const healthMonitor = getSystemHealthMonitor();
  const metricsCollector = getLiveMetricsCollector();
  const serviceTracker = getServiceStatusTracker();
  const errorCenter = getErrorCenter();
  const alertCenter = getAlertCenter();
  const logViewer = getLogViewer();
  const performanceDashboard = getPerformanceDashboard();
  const diagnosticsGenerator = getDiagnosticsGenerator();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthStats, setHealthStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [serviceStats, setServiceStats] = useState(null);
  const [errors, setErrors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [performanceSummary, setPerformanceSummary] = useState(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(() => {
    setSystemHealth(healthMonitor.checkAllSystems());
    setHealthStats(healthMonitor.getHealthStatistics());
    setMetrics(metricsCollector.getAllMetrics());
    setServiceStats(serviceTracker.getServiceStatistics());
    setErrors(errorCenter.getErrors({ limit: 20 }));
    setAlerts(alertCenter.getActiveAlerts());
    setLogs(logViewer.getLogs({ limit: 20 }));
    setPerformanceSummary(performanceDashboard.getPerformanceSummary());
  }, [healthMonitor, metricsCollector, serviceTracker, errorCenter, alertCenter, logViewer, performanceDashboard]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const handleAcknowledgeAlert = useCallback((alertId) => {
    alertCenter.acknowledgeAlert(alertId, 'current_user');
    refreshData();
  }, [alertCenter, refreshData]);

  const handleResolveAlert = useCallback((alertId) => {
    alertCenter.resolveAlert(alertId, 'current_user');
    refreshData();
  }, [alertCenter, refreshData]);

  const handleResolveError = useCallback((errorId) => {
    errorCenter.resolveError(errorId, 'current_user');
    refreshData();
  }, [errorCenter, refreshData]);

  const handleGenerateDiagnostics = useCallback(() => {
    const report = diagnosticsGenerator.generateDiagnosticsReport();
    console.log('Diagnostics Report:', report);
    alert('Diagnostics report generated. Check console for details.');
  }, [diagnosticsGenerator]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Center</h1>
          <p className="text-gray-600 mt-1">Cloud operations and monitoring platform</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
          />
          <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleGenerateDiagnostics} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Diagnostics
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-2 overflow-x-auto">
          {['dashboard', 'health', 'metrics', 'services', 'errors', 'alerts', 'logs', 'history', 'performance'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dashboard' && systemHealth && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${
              systemHealth.overallStatus === SystemHealthStatus.HEALTHY ? 'bg-green-50 border-green-200' :
              systemHealth.overallStatus === SystemHealthStatus.WARNING ? 'bg-amber-50 border-amber-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="text-sm text-gray-600">Overall Health</div>
              <div className="text-2xl font-bold mt-1 capitalize">{systemHealth.overallStatus}</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">Performance Score</div>
              <div className="text-2xl font-bold mt-1">{performanceSummary?.overallScore || 0}/100</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">Security Score</div>
              <div className="text-2xl font-bold mt-1">85/100</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-600">Active Alerts</div>
              <div className="text-2xl font-bold mt-1 text-red-600">{alerts.length}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
            <div className="space-y-2">
              {logs.slice(0, 5).map((log, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">{log.message}</div>
                    <div className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <span className="text-xs text-gray-400">{log.module}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'health' && healthStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Health Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-sm text-gray-500">Total</div><div className="text-xl font-bold">{healthStats.total}</div></div>
            <div><div className="text-sm text-gray-500">Healthy</div><div className="text-xl font-bold text-green-600">{healthStats.healthy}</div></div>
            <div><div className="text-sm text-gray-500">Warning</div><div className="text-xl font-bold text-amber-600">{healthStats.warning}</div></div>
            <div><div className="text-sm text-gray-500">Critical</div><div className="text-xl font-bold text-red-600">{healthStats.critical}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">CPU Usage</div>
            <div className="text-xl font-bold">{metrics.cpu_usage?.value || 0}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Memory Usage</div>
            <div className="text-xl font-bold">{metrics.memory_usage?.value || 0}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-500">Storage Usage</div>
            <div className="text-xl font-bold">{metrics.storage_usage?.value || 0}%</div>
          </div>
        </div>
      )}

      {activeTab === 'services' && serviceStats && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-sm text-gray-500">Total</div><div className="text-xl font-bold">{serviceStats.total}</div></div>
            <div><div className="text-sm text-gray-500">Running</div><div className="text-xl font-bold text-green-600">{serviceStats.running}</div></div>
            <div><div className="text-sm text-gray-500">Failed</div><div className="text-xl font-bold text-red-600">{serviceStats.failed}</div></div>
            <div><div className="text-sm text-gray-500">Restarts</div><div className="text-xl font-bold text-amber-600">{serviceStats.totalRestarts}</div></div>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Error Center</h3>
          {errors.length === 0 ? <div className="text-center text-gray-500 py-8">No errors</div> :
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="p-3 border border-red-100 bg-red-50 rounded-lg">
                  <div className="font-medium text-red-800">{error.category}</div>
                  <div className="text-sm text-red-600">{error.description}</div>
                  {!error.resolved && <button onClick={() => handleResolveError(error.errorId)} className="text-sm text-blue-600 mt-2">Resolve</button>}
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Alert Center</h3>
          {alerts.length === 0 ? <div className="text-center text-gray-500 py-8">No alerts</div> :
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {alerts.map((alert, index) => (
                <div key={index} className={`p-3 border rounded-lg ${alert.severity === AlertSeverity.CRITICAL ? 'bg-red-50' : 'bg-amber-50'}`}>
                  <div className="font-medium">{alert.title}</div>
                  <div className="text-sm">{alert.message}</div>
                  {alert.status === AlertStatus.ACTIVE && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => handleAcknowledgeAlert(alert.alertId)} className="text-sm text-blue-600">Acknowledge</button>
                      <button onClick={() => handleResolveAlert(alert.alertId)} className="text-sm text-green-600">Resolve</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Log Viewer</h3>
          {logs.length === 0 ? <div className="text-center text-gray-500 py-8">No logs</div> :
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="p-3 border border-gray-100 rounded-lg">
                  <div className="font-medium text-gray-900">{log.message}</div>
                  <div className="text-sm text-gray-500">{log.module} • {new Date(log.timestamp).toLocaleString()}</div>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Health History</h3>
          <div className="text-sm text-gray-600">
            <div>Overall Trend: Stable</div>
            <div>Availability: 99.9%</div>
            <div>Incidents: 0</div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && performanceSummary && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><div className="text-sm text-gray-500">Overall Score</div><div className="text-xl font-bold">{performanceSummary.overallScore}/100</div></div>
            <div><div className="text-sm text-gray-500">API Latency</div><div className="text-xl font-bold">{performanceSummary.api?.averageResponseTime?.currentValue || 0}ms</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
