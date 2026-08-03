// Enterprise Backup Center Component
// Premium operational workspace for backup management

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getBackupManager } from '../../backup/BackupManager.js';
import { BackupType, BackupStatus, BackupHealth, BackupModule, MODULE_METADATA } from '../../backup/BackupTypes.js';

export default function EnterpriseBackupCenter() {
  const backupManager = getBackupManager();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeBackup, setActiveBackup] = useState(null);
  const [backupProgress, setBackupProgress] = useState(null);
  const [showCreateBackup, setShowCreateBackup] = useState(false);
  const [selectedModules, setSelectedModules] = useState(Object.values(BackupModule));
  const [backupConfig, setBackupConfig] = useState({
    name: '',
    description: '',
    tags: [],
    notes: '',
    type: BackupType.FULL,
    compressionEnabled: true,
    encryptionEnabled: true,
    verificationEnabled: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Load data on mount
  useEffect(() => {
    refreshData();
    
    // Set up interval for checking backup progress
    const interval = setInterval(() => {
      if (activeBackup) {
        const progress = backupManager.getBackupProgress(activeBackup.backupId);
        setBackupProgress(progress);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBackup]);

  const refreshData = useCallback(() => {
    setStatistics(backupManager.getStatistics());
    setBackupHistory(backupManager.getBackupHistory());
    setSchedules(backupManager.getSchedules());
  }, [backupManager]);

  const handleCreateBackup = useCallback(async () => {
    const result = await backupManager.createBackup({
      ...backupConfig,
      modules: selectedModules,
      name: backupConfig.name || `Backup ${new Date().toLocaleString()}`,
      creator: 'manual'
    });

    if (result.success) {
      setActiveBackup({ backupId: result.backupId });
      setShowCreateBackup(false);
      refreshData();
    }
  }, [backupConfig, selectedModules, backupManager, refreshData]);

  const handleCancelBackup = useCallback(async () => {
    if (activeBackup) {
      await backupManager.cancelBackup(activeBackup.backupId);
      setActiveBackup(null);
      setBackupProgress(null);
      refreshData();
    }
  }, [activeBackup, backupManager, refreshData]);

  const handleDeleteBackup = useCallback(async (backupId) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      await backupManager.deleteBackup(backupId);
      refreshData();
    }
  }, [backupManager, refreshData]);

  const filteredHistory = useMemo(() => {
    let filtered = [...backupHistory];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query) ||
        b.tags?.some(t => t.toLowerCase().includes(query))
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(b => b.type === filterType);
    }

    return filtered;
  }, [backupHistory, searchQuery, filterStatus, filterType]);

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
      case BackupHealth.HEALTHY: return 'text-green-600';
      case BackupHealth.WARNING: return 'text-amber-600';
      case BackupHealth.CRITICAL: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case BackupStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case BackupStatus.FAILED: return 'bg-red-100 text-red-800';
      case BackupStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case BackupStatus.CANCELLED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Backup Center</h1>
          <p className="text-gray-600 mt-1">Commercial-grade backup management for your business</p>
        </div>
        <div className="flex gap-2">
          {activeBackup ? (
            <button
              onClick={handleCancelBackup}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Cancel Backup
            </button>
          ) : (
            <button
              onClick={() => setShowCreateBackup(true)}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              Create Backup
            </button>
          )}
        </div>
      </div>

      {/* Active Backup Progress */}
      {activeBackup && backupProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-blue-800">Backup in Progress</span>
            <span className="text-sm text-blue-600">{backupProgress.percentage}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${backupProgress.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-700">{backupProgress.message}</p>
        </div>
      )}

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total Backups</span>
            <span className="text-2xl">💾</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.totalBackups}</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.successfulBackups} successful</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Success Rate</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.successRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.failedBackups} failed</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Storage Used</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatBytes(statistics.totalSize)}</div>
          <div className="text-xs text-gray-500 mt-1">Compressed size</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Active Schedules</span>
            <span className="text-2xl">📅</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.enabledSchedules}</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.totalSchedules} total</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'history', label: 'Backup History' },
            { id: 'schedules', label: 'Schedules' },
            { id: 'retention', label: 'Retention Policies' }
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
          {/* Recent Backups */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Backups</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {statistics.recentBackups.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No backups yet</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {statistics.recentBackups.map(backup => (
                    <div key={backup.backupId} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{backup.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(backup.createdAt).toLocaleString()} • {formatBytes(backup.compressedSize)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getHealthColor(backup.health)}`}>
                          {backup.health}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(backup.status)}`}>
                          {backup.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Health Overview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Backup Health</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{statistics.healthyBackups}</div>
                <div className="text-sm text-green-700">Healthy</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{statistics.warningBackups}</div>
                <div className="text-sm text-amber-700">Warnings</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{statistics.criticalBackups}</div>
                <div className="text-sm text-red-700">Critical</div>
              </div>
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
              placeholder="Search backups..."
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
              <option value="in_progress">In Progress</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="full">Full</option>
              <option value="incremental">Incremental</option>
              <option value="manual">Manual</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Backup List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No backups found</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredHistory.map(backup => (
                  <div key={backup.backupId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{backup.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(backup.status)}`}>
                            {backup.status}
                          </span>
                          <span className={`text-sm ${getHealthColor(backup.health)}`}>
                            {backup.health}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(backup.createdAt).toLocaleString()} • {formatBytes(backup.compressedSize)} • {formatDuration(backup.duration)}
                        </div>
                        {backup.description && (
                          <div className="text-sm text-gray-600 mt-1">{backup.description}</div>
                        )}
                        {backup.tags && backup.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {backup.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBackup(backup.backupId)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No scheduled backups configured
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <div key={schedule.scheduleId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{schedule.name}</div>
                      <div className="text-sm text-gray-500">
                        {schedule.frequency} at {schedule.time} • {schedule.enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => backupManager.setScheduleEnabled(schedule.scheduleId, !schedule.enabled)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {schedule.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Retention Tab */}
      {activeTab === 'retention' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          Retention policies can be configured here
        </div>
      )}

      {/* Create Backup Dialog */}
      {showCreateBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Backup</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Name</label>
                  <input
                    type="text"
                    value={backupConfig.name}
                    onChange={(e) => setBackupConfig({...backupConfig, name: e.target.value})}
                    placeholder="Backup name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={backupConfig.description}
                    onChange={(e) => setBackupConfig({...backupConfig, description: e.target.value})}
                    placeholder="Optional description"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Backup Type</label>
                  <select
                    value={backupConfig.type}
                    onChange={(e) => setBackupConfig({...backupConfig, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value={BackupType.FULL}>Full Backup</option>
                    <option value={BackupType.MANUAL}>Manual Backup</option>
                    <option value={BackupType.SNAPSHOT}>Snapshot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Include Modules</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {Object.entries(MODULE_METADATA).map(([key, meta]) => (
                      <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={selectedModules.includes(key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModules([...selectedModules, key]);
                            } else {
                              setSelectedModules(selectedModules.filter(m => m !== key));
                            }
                          }}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm">{meta.icon} {meta.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={backupConfig.compressionEnabled}
                      onChange={(e) => setBackupConfig({...backupConfig, compressionEnabled: e.target.checked})}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Enable Compression</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={backupConfig.encryptionEnabled}
                      onChange={(e) => setBackupConfig({...backupConfig, encryptionEnabled: e.target.checked})}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Enable Encryption</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={backupConfig.verificationEnabled}
                      onChange={(e) => setBackupConfig({...backupConfig, verificationEnabled: e.target.checked})}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm text-gray-700">Verify After Upload</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreateBackup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBackup}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Create Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
