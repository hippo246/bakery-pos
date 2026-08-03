// Security Center Component
// Premium operational workspace for security management

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getCredentialVault } from '../../security/CredentialVault.js';
import { getPermissionEngine } from '../../security/PermissionEngine.js';
import { getSessionManager } from '../../security/SessionManager.js';
import { getOwnerVerification } from '../../security/OwnerVerification.js';
import { getEncryptionEngine } from '../../security/EncryptionEngine.js';
import { getIntegrityVerifier } from '../../security/IntegrityVerifier.js';
import { getSecurityMonitor } from '../../security/SecurityMonitor.js';
import { getSecurityEventManager } from '../../security/SecurityEventManager.js';
import { SecurityStatus, SecurityLevel, RiskLevel } from '../../security/SecurityTypes.js';

export default function SecurityCenter() {
  // Memoize singletons — getter functions must not be called on every render
  const credentialVault = useMemo(() => getCredentialVault(), []);
  const permissionEngine = useMemo(() => getPermissionEngine(), []);
  const sessionManager = useMemo(() => getSessionManager(), []);
  const ownerVerification = useMemo(() => getOwnerVerification(), []);
  const encryptionEngine = useMemo(() => getEncryptionEngine(), []);
  const integrityVerifier = useMemo(() => getIntegrityVerifier(), []);
  const securityMonitor = useMemo(() => getSecurityMonitor(), []);
  const securityEventManager = useMemo(() => getSecurityEventManager(), []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [overallScore, setOverallScore] = useState(null);
  const [credentialHealth, setCredentialHealth] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [encryptionStatus, setEncryptionStatus] = useState(null);
  const [integrityStats, setIntegrityStats] = useState(null);
  const [monitorStats, setMonitorStats] = useState(null);
  const [eventStats, setEventStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [showOwnerAuthDialog, setShowOwnerAuthDialog] = useState(false);
  const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerError, setOwnerError] = useState('');
  const [encryptionVerifyResult, setEncryptionVerifyResult] = useState(null); // {success, message}
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshData();

    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    try {
      setOverallScore(calculateOverallScore());
      setCredentialHealth(credentialVault.getHealth());
      setSessionStats(sessionManager.getStatistics());
      setEncryptionStatus(encryptionEngine.getStatusInfo());
      setIntegrityStats(integrityVerifier.getStatistics());
      setMonitorStats(securityMonitor.getStatistics());
      setEventStats(securityEventManager.getStatistics());
      setAlerts(securityMonitor.getAlerts({ resolved: false }));
      setEvents(securityEventManager.getEventHistory({ limit: 10 }));
    } finally {
      setIsRefreshing(false);
    }
  }, [credentialVault, sessionManager, encryptionEngine, integrityVerifier, securityMonitor, securityEventManager]);

  const calculateOverallScore = () => {
    const scores = [
      credentialVault.getSecurityScore(),
      permissionEngine.getSecurityScore(),
      sessionManager.getSecurityScore(),
      ownerVerification.getSecurityScore(),
      encryptionEngine.getSecurityScore(),
      integrityVerifier.getSecurityScore(),
      securityMonitor.getSecurityScore()
    ];
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  };

  const handleOwnerAuth = useCallback(async (password) => {
    const result = await ownerVerification.verifyOwner(password);
    if (result.success) {
      setShowOwnerAuthDialog(false);
      setOwnerPassword('');
      setOwnerError('');
      refreshData();
    } else {
      setOwnerError('Invalid password. Please try again.');
    }
    return result;
  }, [ownerVerification, refreshData]);

  const handleToggleEncryption = useCallback(async () => {
    if (encryptionStatus.enabled) {
      await encryptionEngine.disable();
    } else {
      await encryptionEngine.enable();
    }
    refreshData();
    setShowEncryptionDialog(false);
  }, [encryptionStatus, encryptionEngine, refreshData]);

  const handleAcknowledgeAlert = useCallback((alertId) => {
    securityMonitor.acknowledgeAlert(alertId);
    refreshData();
  }, [securityMonitor, refreshData]);

  const handleResolveAlert = useCallback((alertId) => {
    securityMonitor.resolveAlert(alertId);
    refreshData();
  }, [securityMonitor, refreshData]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case RiskLevel.CRITICAL: return 'text-red-600';
      case RiskLevel.HIGH: return 'text-orange-600';
      case RiskLevel.MEDIUM: return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  if (overallScore === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Security Center</h1>
          <p className="text-gray-600 mt-1">Security management and monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg ${getScoreBackground(overallScore)}`}>
            <span className={`text-lg font-bold ${getScoreColor(overallScore)}`}>
              Security Score: {overallScore}%
            </span>
          </div>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
            title="Refresh data"
          >
            {isRefreshing ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setShowOwnerAuthDialog(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Owner Actions
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Credential Health</span>
            <span className="text-2xl">🔐</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{credentialHealth?.total || 0}</div>
          <div className="text-xs text-gray-500 mt-1">{credentialHealth?.expired || 0} expired</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active Sessions</span>
            <span className="text-2xl">👤</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{sessionStats?.active || 0}</div>
          <div className="text-xs text-gray-500 mt-1">{sessionStats?.locked ? 'Locked' : 'Active'}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Encryption Status</span>
            <span className="text-2xl">🔒</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {encryptionStatus?.enabled ? 'Enabled' : 'Disabled'}
          </div>
          <div className="text-xs text-gray-500 mt-1">{encryptionStatus?.algorithm}</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active Alerts</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{monitorStats?.critical || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Critical alerts</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'credentials', label: 'Credentials' },
            { id: 'sessions', label: 'Sessions' },
            { id: 'encryption', label: 'Encryption' },
            { id: 'integrity', label: 'Integrity' },
            { id: 'alerts', label: 'Alerts', badge: alerts.filter(a => !a.acknowledged).length || null },
            { id: 'events', label: 'Events', badge: events.filter(e => !e.acknowledged).length || null },
            { id: 'audit', label: 'Audit' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 font-medium text-sm flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Security Score Breakdown */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Score Breakdown</h3>
            <div className="space-y-3">
              {[
                { name: 'Credential Vault', score: credentialVault.getSecurityScore() },
                { name: 'Permission Engine', score: permissionEngine.getSecurityScore() },
                { name: 'Session Manager', score: sessionManager.getSecurityScore() },
                { name: 'Owner Verification', score: ownerVerification.getSecurityScore() },
                { name: 'Encryption Engine', score: encryptionEngine.getSecurityScore() },
                { name: 'Integrity Verifier', score: integrityVerifier.getSecurityScore() },
                { name: 'Security Monitor', score: securityMonitor.getSecurityScore() }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(item.score)}`}>
                      {item.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Alerts</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="divide-y divide-gray-200">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.alertId} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{alert.message}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.alertId)}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveAlert(alert.alertId)}
                          className="px-3 py-1 text-sm border border-green-300 text-green-600 rounded hover:bg-green-50"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Security Events */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Security Events</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {events.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No security events yet</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {events.map(event => (
                    <div key={event.eventId} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{event.type}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${getRiskLevelColor(event.riskLevel)}`}>
                        {event.riskLevel}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Credential Health</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{credentialHealth?.total || 0}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{credentialHealth?.healthy || 0}</div>
                <div className="text-sm text-gray-500">Healthy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{credentialHealth?.expired || 0}</div>
                <div className="text-sm text-gray-500">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{credentialHealth?.expiringSoon || 0}</div>
                <div className="text-sm text-gray-500">Expiring Soon</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stored Credentials</h3>
            <div className="text-sm text-gray-500">
              Credential vault is active. All credentials are encrypted and masked from display.
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sessionStats?.total || 0}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sessionStats?.active || 0}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{sessionStats?.expired || 0}</div>
                <div className="text-sm text-gray-500">Expired</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{sessionStats?.terminated || 0}</div>
                <div className="text-sm text-gray-500">Terminated</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Session Timeout:</span>
                <span className="text-gray-900">30 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Idle Timeout:</span>
                <span className="text-gray-900">15 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Status:</span>
                <span className={sessionStats?.locked ? 'text-red-600' : 'text-green-600'}>
                  {sessionStats?.locked ? 'Locked' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Tab */}
      {activeTab === 'encryption' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Encryption Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${encryptionStatus?.enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {encryptionStatus?.enabled ? 'Enabled' : 'Disabled'}
                </div>
                <div className="text-sm text-gray-500">Status</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{encryptionStatus?.algorithm}</div>
                <div className="text-sm text-gray-500">Algorithm</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{encryptionStatus?.keySize}</div>
                <div className="text-sm text-gray-500">Key Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{encryptionStatus?.lastModified ? new Date(encryptionStatus.lastModified).toLocaleDateString() : 'N/A'}</div>
                <div className="text-sm text-gray-500">Last Modified</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Encryption Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowEncryptionDialog(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
              >
                {encryptionStatus?.enabled ? 'Disable Encryption' : 'Enable Encryption'}
              </button>
              <button
                onClick={async () => {
                  await encryptionEngine.rotateKey();
                  refreshData();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Rotate Key
              </button>
              <button
                onClick={async () => {
                  setEncryptionVerifyResult(null);
                  const result = await encryptionEngine.verify();
                  setEncryptionVerifyResult({ success: result.success, message: result.success ? 'Encryption verified successfully.' : (result.error || 'Verification failed.') });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Verify Encryption
              </button>
            </div>
            {encryptionVerifyResult && (
              <div className={`mt-3 px-4 py-2 rounded-lg text-sm font-medium ${encryptionVerifyResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {encryptionVerifyResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Integrity Tab */}
      {activeTab === 'integrity' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Integrity Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{integrityStats?.total || 0}</div>
                <div className="text-sm text-gray-500">Total Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{integrityStats?.recentlyVerified || 0}</div>
                <div className="text-sm text-gray-500">Recently Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{integrityStats?.totalSize ? (integrityStats.totalSize / 1024 / 1024).toFixed(2) : 0}</div>
                <div className="text-sm text-gray-500">Total Size (MB)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{integrityStats?.verificationRate?.toFixed(0) || 0}%</div>
                <div className="text-sm text-gray-500">Verification Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Integrity Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Hash Algorithm:</span>
                <span className="text-gray-900">SHA-256</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Auto-verification:</span>
                <span className="text-gray-900">Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No active alerts</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {alerts.map(alert => (
                  <div key={alert.alertId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="font-medium text-gray-900">{alert.message}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(alert.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!alert.acknowledged && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.alertId)}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => handleResolveAlert(alert.alertId)}
                          className="px-3 py-1 text-sm border border-green-300 text-green-600 rounded hover:bg-green-50"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No security events yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {events.map(event => (
                  <div key={event.eventId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{event.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getRiskLevelColor(event.riskLevel)}`}>
                            {event.riskLevel}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Security Events</h3>
              <span className="text-sm text-gray-500">{eventStats?.total || 0} total</span>
            </div>
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No security events recorded yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Timestamp', 'Event Type', 'Risk Level', 'Acknowledged'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map(event => (
                      <tr key={event.eventId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{new Date(event.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.type}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            event.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            event.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            event.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {event.riskLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {event.acknowledged
                            ? <span className="text-green-600 font-medium">Yes</span>
                            : <span className="text-amber-600 font-medium">Pending</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Owner Authentication Dialog */}
      {showOwnerAuthDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Owner Authentication</h2>
              <p className="text-gray-600 mb-4">Enter your owner password to perform critical operations.</p>
              <input
                type="password"
                placeholder="Owner password"
                value={ownerPassword}
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 mb-2"
                onChange={(e) => { setOwnerPassword(e.target.value); setOwnerError(''); }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') await handleOwnerAuth(ownerPassword);
                }}
              />
              {ownerError && (
                <p className="text-sm text-red-600 mb-3">{ownerError}</p>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setShowOwnerAuthDialog(false); setOwnerPassword(''); setOwnerError(''); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleOwnerAuth(ownerPassword)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Authenticate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Encryption Toggle Dialog */}
      {showEncryptionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {encryptionStatus?.enabled ? 'Disable Encryption' : 'Enable Encryption'}
              </h2>
              <p className="text-gray-600 mb-4">
                {encryptionStatus?.enabled 
                  ? 'Disabling encryption will expose sensitive data. This is not recommended.' 
                  : 'Enabling encryption will protect sensitive data with AES-256 encryption.'}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEncryptionDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleEncryption}
                  className={`px-4 py-2 rounded-lg ${encryptionStatus?.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  {encryptionStatus?.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
