// Sync Center Component
// Premium operational workspace for synchronization management

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSyncManager } from '../../sync/SyncManager.js';
import { getNetworkMonitor } from '../../sync/NetworkMonitor.js';
import { getConflictDetector } from '../../sync/ConflictDetector.js';
import { getConflictResolver } from '../../sync/ConflictResolver.js';
import { getVersionTracker } from '../../sync/VersionTracker.js';
import { SyncStatus, SyncPriority, NetworkStatus, ConflictSeverity } from '../../sync/SyncTypes.js';

export default function SyncCenter() {
  const syncManager = getSyncManager();
  const networkMonitor = getNetworkMonitor();
  const conflictDetector = getConflictDetector();
  const conflictResolver = getConflictResolver();
  const versionTracker = getVersionTracker();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [statistics, setStatistics] = useState(null);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [syncQueue, setSyncQueue] = useState([]);
  const [syncHistory, setSyncHistory] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [syncFilters, setSyncFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    refreshData();

    // Subscribe to network events
    const unsubscribeNetwork = networkMonitor.subscribe((event, data) => {
      setNetworkStatus(networkMonitor.getConnectionInfo());
    });

    // Set up interval for refreshing data
    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    return () => {
      unsubscribeNetwork();
      clearInterval(interval);
    };
  }, []);

  const refreshData = useCallback(() => {
    setStatistics(syncManager.getStatistics());
    setNetworkStatus(networkMonitor.getConnectionInfo());
    setSyncQueue(syncManager.getQueue());
    setSyncHistory(syncManager.getHistory());
    setConflicts(conflictDetector.getUnresolvedConflicts());
    setSyncFilters(syncManager.getSyncFilters());
  }, [syncManager, networkMonitor, conflictDetector]);

  const handleSyncNow = useCallback(async () => {
    setIsProcessing(true);
    try {
      await syncManager.processQueue();
      refreshData();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [syncManager, refreshData]);

  const handleCancelSync = useCallback(async (itemId) => {
    await syncManager.cancelSync(itemId);
    refreshData();
  }, [syncManager, refreshData]);

  const handlePauseSync = useCallback(async (itemId) => {
    await syncManager.pauseSync(itemId);
    refreshData();
  }, [syncManager, refreshData]);

  const handleResumeSync = useCallback(async (itemId) => {
    await syncManager.resumeSync(itemId);
    refreshData();
  }, [syncManager, refreshData]);

  const handleResolveConflict = useCallback(async (conflict, action) => {
    const result = await conflictResolver.resolveConflict(conflict, action, conflict.localData, conflict.cloudData);
    if (result.success) {
      conflictDetector.resolveConflict(conflict.conflictId, action);
      refreshData();
      setShowConflictDialog(false);
    }
  }, [conflictConflictResolver, conflictDetector, refreshData]);

  const handleSyncFilterChange = useCallback((filter, value) => {
    syncManager.setSyncFilter(filter, value);
    refreshData();
  }, [syncManager, refreshData]);

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

  const getNetworkStatusColor = (status) => {
    switch (status) {
      case NetworkStatus.ONLINE: return 'text-green-600';
      case NetworkStatus.OFFLINE: return 'text-red-600';
      case NetworkStatus.SLOW: return 'text-amber-600';
      case NetworkStatus.LIMITED: return 'text-orange-600';
      case NetworkStatus.HIGH_LATENCY: return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getSyncStatusColor = (status) => {
    switch (status) {
      case SyncStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case SyncStatus.FAILED: return 'bg-red-100 text-red-800';
      case SyncStatus.UPLOADING:
      case SyncStatus.DOWNLOADING: return 'bg-blue-100 text-blue-800';
      case SyncStatus.PAUSED: return 'bg-gray-100 text-gray-800';
      case SyncStatus.RETRYING: return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getConflictSeverityColor = (severity) => {
    switch (severity) {
      case ConflictSeverity.CRITICAL: return 'text-red-600';
      case ConflictSeverity.ERROR: return 'text-orange-600';
      case ConflictSeverity.WARNING: return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  const filteredQueue = useMemo(() => {
    let filtered = [...syncQueue];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.itemId?.toLowerCase().includes(query) ||
        item.module?.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    if (filterModule !== 'all') {
      filtered = filtered.filter(item => item.module === filterModule);
    }

    return filtered;
  }, [syncQueue, searchQuery, filterStatus, filterModule]);

  if (!statistics || !networkStatus) {
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
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Sync Center</h1>
          <p className="text-gray-600 mt-1">Offline-first synchronization management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            networkStatus.isOnline ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              networkStatus.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <span className={`text-sm font-medium ${getNetworkStatusColor(networkStatus.status)}`}>
              {networkStatus.status}
            </span>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={isProcessing || !networkStatus.isOnline}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Queue Size</span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.queueSize}</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.pendingCount} pending</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Success Rate</span>
            <span className="text-2xl">✅</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{statistics.successRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500 mt-1">{statistics.totalCompleted} completed</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Avg Sync Time</span>
            <span className="text-2xl">⏱️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{formatDuration(statistics.averageSyncTime)}</div>
          <div className="text-xs text-gray-500 mt-1">Average time</div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Conflicts</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{conflicts.length}</div>
          <div className="text-xs text-gray-500 mt-1">Unresolved</div>
        </div>
      </div>

      {/* Network Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Network Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getNetworkStatusColor(networkStatus.status)}`}>
              {networkStatus.connectionType}
            </div>
            <div className="text-sm text-gray-600">Connection Type</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {networkStatus.downlink} Mbps
            </div>
            <div className="text-sm text-gray-600">Downlink</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {networkStatus.rtt} ms
            </div>
            <div className="text-sm text-gray-600">Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {networkMonitor.getQualityScore()}%
            </div>
            <div className="text-sm text-gray-600">Quality Score</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'queue', label: 'Sync Queue' },
            { id: 'history', label: 'Sync History' },
            { id: 'conflicts', label: 'Conflicts' },
            { id: 'settings', label: 'Settings' }
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
          {/* Recent Syncs */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Syncs</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {syncHistory.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No sync history yet</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {syncHistory.slice(0, 5).map(item => (
                    <div key={item.itemId} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{item.itemId}</div>
                        <div className="text-sm text-gray-500">
                          {item.module} • {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getSyncStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Conflicts */}
          {conflicts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Conflicts</h3>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="divide-y divide-gray-200">
                  {conflicts.slice(0, 3).map(conflict => (
                    <div key={conflict.conflictId} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{conflict.itemId}</div>
                        <div className="text-sm text-gray-500">
                          {conflict.conflicts.length} conflict(s) • {new Date(conflict.detectedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setShowConflictDialog(true);
                        }}
                        className="px-3 py-1 text-sm border border-amber-300 text-amber-600 rounded hover:bg-amber-50"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search queue..."
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
              <option value="pending">Pending</option>
              <option value="retrying">Retrying</option>
              <option value="paused">Paused</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Queue List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No items in queue</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredQueue.map(item => (
                  <div key={item.itemId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.itemId}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getSyncStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className="text-xs text-gray-500">{item.priority}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.module} • {new Date(item.createdAt).toLocaleString()}
                        </div>
                        {item.retryCount > 0 && (
                          <div className="text-sm text-amber-600 mt-1">
                            Retry {item.retryCount}/5
                          </div>
                        )}
                        {item.error && (
                          <div className="text-sm text-red-600 mt-1">{item.error}</div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {item.status === SyncStatus.PENDING && (
                          <button
                            onClick={() => handlePauseSync(item.itemId)}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
                          >
                            Pause
                          </button>
                        )}
                        {item.status === SyncStatus.PAUSED && (
                          <button
                            onClick={() => handleResumeSync(item.itemId)}
                            className="px-3 py-1 text-sm border border-green-300 text-green-600 rounded hover:bg-green-50"
                          >
                            Resume
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelSync(item.itemId)}
                          className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                        >
                          Cancel
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

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {syncHistory.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No sync history yet</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {syncHistory.map(item => (
                  <div key={item.itemId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.itemId}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getSyncStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {item.module} • {new Date(item.createdAt).toLocaleString()}
                        </div>
                        {item.completedAt && (
                          <div className="text-sm text-gray-600 mt-1">
                            Duration: {formatDuration(new Date(item.completedAt) - new Date(item.startedAt))}
                          </div>
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

      {/* Conflicts Tab */}
      {activeTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {conflicts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No conflicts detected</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conflicts.map(conflict => (
                  <div key={conflict.conflictId} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{conflict.itemId}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {new Date(conflict.detectedAt).toLocaleString()}
                        </div>
                        <div className="mt-2 space-y-1">
                          {conflict.conflicts.map((c, idx) => (
                            <div key={idx} className={`text-sm ${getConflictSeverityColor(c.severity)}`}>
                              • {c.message}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setShowConflictDialog(true);
                        }}
                        className="px-3 py-1 text-sm border border-amber-300 text-amber-600 rounded hover:bg-amber-50"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sync Filters</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={syncFilters.wifiOnly}
                  onChange={(e) => handleSyncFilterChange('wifiOnly', e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">WiFi Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={syncFilters.meteredNetworks}
                  onChange={(e) => handleSyncFilterChange('meteredNetworks', e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Allow Metered Networks</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={syncFilters.manualSync}
                  onChange={(e) => handleSyncFilterChange('manualSync', e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Manual Sync Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={syncFilters.backgroundOnly}
                  onChange={(e) => handleSyncFilterChange('backgroundOnly', e.target.checked)}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">Background Sync Only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Resolution Dialog */}
      {showConflictDialog && selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resolve Conflict</h2>
              
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Conflicts Detected</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {selectedConflict.conflicts.map((c, idx) => (
                      <li key={idx}>• {c.message}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Action</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Select resolution action</option>
                    <option value="use_local">Use Local Version</option>
                    <option value="use_cloud">Use Cloud Version</option>
                    <option value="merge_auto">Merge Automatically</option>
                    <option value="manual_review">Manual Review</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowConflictDialog(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleResolveConflict(selectedConflict, 'use_local')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    Apply Resolution
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
