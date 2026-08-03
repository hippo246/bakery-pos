// Restore Center Component
// Premium operational workspace for restore management

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getRestoreManager } from '../../restore/RestoreManager.js';
import { getBackupManager } from '../../backup/BackupManager.js';
import { RestoreType, RestoreStatus, RestoreHealth } from '../../restore/RestoreTypes.js';
import RestoreAuthorization from './RestoreAuthorization.jsx';

export default function RestoreCenter() {
  const restoreManager = getRestoreManager();
  const backupManager = getBackupManager();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState(null);
  const [healthMonitoring, setHealthMonitoring] = useState(null);
  const [restoreHistory, setRestoreHistory] = useState([]);
  const [activeRestore, setActiveRestore] = useState(null);
  const [restoreProgress, setRestoreProgress] = useState(null);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [showRestoreWizard, setShowRestoreWizard] = useState(false);
  const [showAuthorization, setShowAuthorization] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restoreConfig, setRestoreConfig] = useState({
    type: RestoreType.FULL,
    modules: null,
    createSafetyBackup: true,
    verifyAfterRestore: true,
    dryRun: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [actionError, setActionError] = useState(null);

  const TERMINAL_STATUSES = useMemo(() => ([
    RestoreStatus.COMPLETED,
    RestoreStatus.FAILED,
    RestoreStatus.CANCELLED,
    RestoreStatus.ROLLED_BACK
  ]), []);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Poll restore progress while a restore is active, and stop automatically
  // once it reaches a terminal state instead of polling indefinitely.
  useEffect(() => {
    if (!activeRestore) {
      setRestoreProgress(null);
      return undefined;
    }

    const interval = setInterval(() => {
      const progress = restoreManager.getRestoreProgress(activeRestore.restoreId);
      setRestoreProgress(progress);

      if (progress && TERMINAL_STATUSES.includes(progress.status)) {
        setActiveRestore(null);
        refreshData();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRestore, restoreManager, refreshData, TERMINAL_STATUSES]);

  const refreshData = useCallback(() => {
    setStatistics(restoreManager.getStatistics());
    setHealthMonitoring(restoreManager.getHealthMonitoring());
    setRestoreHistory(restoreManager.getRestoreHistory());
    setAvailableBackups(backupManager.getBackupHistory());
  }, [restoreManager, backupManager]);

  const handleStartRestore = useCallback(async (ownerAuthToken) => {
    setActionError(null);
    try {
      const result = await restoreManager.createRestore({
        ...restoreConfig,
        backupId: selectedBackup.backupId,
        operator: 'manual',
        ownerAuthToken
      });

      if (result.success) {
        setActiveRestore({ restoreId: result.restoreId });
        setShowRestoreWizard(false);
        setShowAuthorization(false);
        refreshData();
      } else if (result.requiresOwnerAuth) {
        setShowAuthorization(true);
      } else {
        setActionError(result.error || 'Failed to start restore.');
      }
    } catch (err) {
      setActionError(err.message || 'Failed to start restore.');
    }
  }, [restoreConfig, selectedBackup, restoreManager, refreshData]);

  const handleCancelRestore = useCallback(async () => {
    if (!activeRestore) return;
    setActionError(null);
    try {
      await restoreManager.cancelRestore(activeRestore.restoreId);
      setActiveRestore(null);
      setRestoreProgress(null);
      refreshData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel restore.');
    }
  }, [activeRestore, restoreManager, refreshData]);

  const handleRollback = useCallback(async (restoreId) => {
    if (!confirm('Are you sure you want to rollback this restore? This will restore the safety backup.')) {
      return;
    }
    setActionError(null);
    try {
      const result = await restoreManager.rollbackRestore(restoreId);
      if (result.success) {
        refreshData();
      } else {
        setActionError(result.error || 'Rollback failed.');
      }
    } catch (err) {
      setActionError(err.message || 'Rollback failed.');
    }
  }, [restoreManager, refreshData]);

  const handleDryRun = useCallback(async () => {
    setActionError(null);
    try {
      const result = await restoreManager.createRestore({
        ...restoreConfig,
        backupId: selectedBackup.backupId,
        operator: 'dry_run',
        dryRun: true
      });

      if (result.success) {
        setShowRestoreWizard(false);
        refreshData();
      } else {
        setActionError(result.error || 'Dry run failed.');
      }
    } catch (err) {
      setActionError(err.message || 'Dry run failed.');
    }
  }, [restoreConfig, selectedBackup, restoreManager, refreshData]);

  const filteredHistory = useMemo(() => {
    let filtered = [...restoreHistory];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.restoreId?.toLowerCase().includes(query) ||
        r.backupId?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType);
    }

    return filtered;
  }, [restoreHistory, searchQuery, filterStatus, filterType]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const getHealthColor = (health) => {
    switch (health) {
      case RestoreHealth.HEALTHY: return 'text-green-600';
      case RestoreHealth.WARNING: return 'text-amber-600';
      case RestoreHealth.CRITICAL: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case RestoreStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case RestoreStatus.FAILED: return 'bg-red-100 text-red-800';
      case RestoreStatus.RESTORING: return 'bg-blue-100 text-blue-800';
      case RestoreStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      case RestoreStatus.ROLLED_BACK: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getCompatibilityColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  // Close whichever modal is open when the user presses Escape
  useEffect(() => {
    if (!showRestoreWizard && !showAuthorization) return undefined;

    const handleKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (showAuthorization) {
        setShowAuthorization(false);
      } else if (showRestoreWizard) {
        setShowRestoreWizard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRestoreWizard, showAuthorization]);

  if (!statistics) {
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
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Restore Center</h1>
          <p className="text-gray-600 mt-1">Disaster recovery and restore management</p>
        </div>
        <div className="flex gap-2">
          {activeRestore ? (
            <button
              onClick={handleCancelRestore}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel Restore
            </button>
          ) : (
            <button
              onClick={() => setShowRestoreWizard(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Start Restore
            </button>
          )}
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between gap-4">
          <p className="text-sm text-red-700">{actionError}</p>
          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-600 text-sm font-medium"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Restore Progress */}
      {activeRestore && restoreProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-800">Restore in Progress</span>
            <span className="text-sm text-blue-600">{restoreProgress.percentage}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${restoreProgress.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-700">{restoreProgress.message}</p>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Restores</span>
            <span className="text-2xl">🔄</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.totalRestores}</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.successfulRestores} successful</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Success Rate</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.successRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.failedRestores} failed</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg Duration</span>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatDuration(statistics.averageDuration)}</div>
          <div className="text-xs text-gray-500 mt-1">Average time</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Rollback Available</span>
            <span className="text-2xl">↩️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.withRollback}</div>
          <div className="text-xs text-gray-500 mt-1">With safety backup</div>
        </div>
      </div>

      {/* Health Monitoring */}
      {healthMonitoring && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Recovery Health</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{healthMonitoring.successfulRestores}</div>
              <div className="text-sm text-gray-600">Successful (30d)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{healthMonitoring.failedRestores}</div>
              <div className="text-sm text-gray-600">Failed (30d)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{healthMonitoring.compatibilityWarnings}</div>
              <div className="text-sm text-gray-600">Compatibility Warnings</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getCompatibilityColor(healthMonitoring.recoveryReadinessScore)}`}>
                {healthMonitoring.recoveryReadinessScore}
              </div>
              <div className="text-sm text-gray-600">Readiness Score</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'history', label: 'Restore History' },
            { id: 'backups', label: 'Available Backups' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Recent Restores */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Restores</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {statistics.recentRestores.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No restores yet</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {statistics.recentRestores.map(restore => (
                    <div key={restore.restoreId} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{restore.restoreId}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(restore.startedAt).toLocaleString()} • {formatDuration(restore.duration)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getHealthColor(restore.health)}`}>
                          {restore.health}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(restore.status)}`}>
                          {restore.status}
                        </span>
                        {restore.rollbackAvailable && (
                          <button
                            onClick={() => handleRollback(restore.restoreId)}
                            className="text-sm text-purple-600 hover:text-purple-800"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search restores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="rolled_back">Rolled Back</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="full">Full</option>
              <option value="selective">Selective</option>
              <option value="dry_run">Dry Run</option>
              <option value="rollback">Rollback</option>
            </select>
          </div>

          {/* Restore List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No restores found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredHistory.map(restore => (
                  <div key={restore.restoreId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{restore.restoreId}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(restore.status)}`}>
                            {restore.status}
                          </span>
                          <span className={`text-sm ${getHealthColor(restore.health)}`}>
                            {restore.health}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(restore.startedAt).toLocaleString()} • {formatDuration(restore.duration)} • {restore.type}
                        </div>
                        {restore.compatibility && (
                          <div className="text-sm text-gray-600 mt-1">
                            Compatibility: <span className={getCompatibilityColor(restore.compatibility.score)}>
                              {restore.compatibility.score}%
                            </span>
                          </div>
                        )}
                        {restore.safetyBackupId && (
                          <div className="text-sm text-green-600 mt-1">Safety backup available</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {restore.rollbackAvailable && (
                          <button
                            onClick={() => handleRollback(restore.restoreId)}
                            className="px-3 py-1 text-sm border border-purple-300 text-purple-600 rounded hover:bg-purple-50"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {availableBackups.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No backups available</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {availableBackups.map(backup => (
                  <div key={backup.backupId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{backup.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(backup.createdAt).toLocaleString()} • {formatBytes(backup.compressedSize)}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{backup.type}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreWizard(true);
                        }}
                        className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                      >
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Restore Wizard Dialog */}
      {showRestoreWizard && selectedBackup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRestoreWizard(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-wizard-title"
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 id="restore-wizard-title" className="text-xl font-bold text-gray-900 mb-4">Restore from Backup</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-medium text-gray-900">{selectedBackup.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Created: {new Date(selectedBackup.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Size: {formatBytes(selectedBackup.compressedSize)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Restore Type</label>
                  <select
                    value={restoreConfig.type}
                    onChange={(e) => setRestoreConfig({...restoreConfig, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value={RestoreType.FULL}>Full Restore</option>
                    <option value={RestoreType.SELECTIVE}>Selective Restore</option>
                    <option value={RestoreType.DRY_RUN}>Dry Run (Test)</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={restoreConfig.createSafetyBackup}
                      onChange={(e) => setRestoreConfig({...restoreConfig, createSafetyBackup: e.target.checked})}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Create Safety Backup</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={restoreConfig.verifyAfterRestore}
                      onChange={(e) => setRestoreConfig({...restoreConfig, verifyAfterRestore: e.target.checked})}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Verify After Restore</span>
                  </label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> This will restore data from the selected backup. 
                    A safety backup will be created automatically if enabled.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRestoreWizard(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {restoreConfig.type === RestoreType.DRY_RUN ? (
                  <button
                    onClick={handleDryRun}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Run Dry Run
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthorization(true)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Start Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authorization Dialog */}
      {showAuthorization && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuthorization(false); }}
        >
          <div role="dialog" aria-modal="true" className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <RestoreAuthorization
                onAuthorized={(authToken) => {
                  setShowAuthorization(false);
                  handleStartRestore(authToken);
                }}
                onCancel={() => setShowAuthorization(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
