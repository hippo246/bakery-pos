// Audit Center Component
// Dedicated audit log viewer with filtering and export

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSecurityEventManager } from '../../security/SecurityEventManager.js';
import { getPermissionEngine } from '../../security/PermissionEngine.js';
import { RiskLevel } from '../../security/SecurityTypes.js';

export default function AuditCenter() {
  const securityEventManager = getSecurityEventManager();
  const permissionEngine = getPermissionEngine();

  const PAGE_SIZE = 50;

  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    riskLevel: '',
    since: '',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [filters]);

  const loadEvents = useCallback(() => {
    const allEvents = securityEventManager.getEventHistory({ limit: 500 });
    setEvents(allEvents);
  }, [securityEventManager]);

  // Derive filtered events synchronously via useMemo — no parallel state needed
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filters.type) {
      filtered = filtered.filter(e => e.type === filters.type);
    }
    if (filters.riskLevel) {
      filtered = filtered.filter(e => e.riskLevel === filters.riskLevel);
    }
    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filtered = filtered.filter(e => new Date(e.timestamp) >= sinceDate);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(e =>
        e.type.toLowerCase().includes(searchLower) ||
        JSON.stringify(e.details ?? '').toLowerCase().includes(searchLower)
      );
    }
    return filtered;
  }, [events, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pagedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = filteredEvents.map(event => ({
        eventId: event.eventId,
        type: event.type,
        timestamp: event.timestamp,
        riskLevel: event.riskLevel,
        acknowledged: event.acknowledged,
        details: event.details
      }));
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [filteredEvents]);

  const handleAcknowledge = useCallback((eventId) => {
    securityEventManager.acknowledgeEvent(eventId);
    loadEvents();
    // Also update selectedEvent in-place so the detail dialog reflects the change immediately
    setSelectedEvent(prev => prev?.eventId === eventId ? { ...prev, acknowledged: true } : prev);
  }, [securityEventManager, loadEvents]);

  const getRiskLevelColor = (level) => {
    switch (level) {
      case RiskLevel.CRITICAL: return 'text-red-600 bg-red-100';
      case RiskLevel.HIGH: return 'text-orange-600 bg-orange-100';
      case RiskLevel.MEDIUM: return 'text-amber-600 bg-amber-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const eventTypes = useMemo(() => [...new Set(events.map(e => e.type))], [events]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Center</h1>
          <p className="text-gray-600 mt-1">Security audit log with filtering and export</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting || filteredEvents.length === 0}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
        >
          {isExporting ? 'Exporting…' : `Export (${filteredEvents.length})`}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Levels</option>
              <option value={RiskLevel.CRITICAL}>Critical</option>
              <option value={RiskLevel.HIGH}>High</option>
              <option value={RiskLevel.MEDIUM}>Medium</option>
              <option value={RiskLevel.LOW}>Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Since</label>
            <input
              type="date"
              value={filters.since}
              onChange={(e) => setFilters({ ...filters, since: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', riskLevel: '', since: '', search: '' })}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Events</div>
          <div className="text-2xl font-bold text-gray-900">{filteredEvents.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Critical Events</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredEvents.filter(e => e.riskLevel === RiskLevel.CRITICAL).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Acknowledged</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredEvents.filter(e => e.acknowledged).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Unacknowledged</div>
          <div className="text-2xl font-bold text-amber-600">
            {filteredEvents.filter(e => !e.acknowledged).length}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedEvents.map(event => (
                  <tr key={event.eventId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded ${getRiskLevelColor(event.riskLevel)}`}>
                        {event.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {event.acknowledged ? (
                        <span className="text-green-600">Acknowledged</span>
                      ) : (
                        <span className="text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowDetails(true);
                          }}
                          className="text-amber-600 hover:text-amber-700"
                        >
                          Details
                        </button>
                        {!event.acknowledged && (
                          <button
                            onClick={() => handleAcknowledge(event.eventId)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Acknowledge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {filteredEvents.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages} ({filteredEvents.length} events)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      {showDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Event ID</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedEvent.eventId}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Event Type</label>
                  <div className="mt-1 text-sm text-gray-900">{selectedEvent.type}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Risk Level</label>
                  <div className="mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${getRiskLevelColor(selectedEvent.riskLevel)}`}>
                      {selectedEvent.riskLevel}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {selectedEvent.acknowledged ? 'Acknowledged' : 'Pending'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Details</label>
                  <div className="mt-1 bg-gray-50 rounded-lg p-3">
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {!selectedEvent.acknowledged && (
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => {
                      handleAcknowledge(selectedEvent.eventId);
                      setShowDetails(false);
                      setSelectedEvent(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Acknowledge Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
