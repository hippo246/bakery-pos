// Operational Alerts Widget
// Displays actionable operational alerts only

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';
import { AlertSeverity, AlertCategory } from '../DashboardTypes.js';

export default function OperationalAlertsWidget({ alertsData = [], onClick = null }) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = alertsData.length > 0 ? alertsData : [];
      setAlerts(mockData);
    } catch (err) {
      setError('Failed to load operational alerts');
      console.error('[OperationalAlertsWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [alertsData]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'text-red-600 bg-red-50 border-red-200';
      case AlertSeverity.WARNING:
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case AlertSeverity.INFO:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case AlertCategory.KITCHEN:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7.343 6.343 12 6.343s8 1 8 1-1.657 17.657z" />
          </svg>
        );
      case AlertCategory.PRINTER:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        );
      case AlertCategory.INVENTORY:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case AlertCategory.QUEUE:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case AlertCategory.CLOUD:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      case AlertCategory.SYNC:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case AlertCategory.PAYMENT:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (!alerts && !loading && !error) {
    return (
      <BaseWidget
        widgetType="operational_alerts"
        title="Operational Alerts"
        empty={true}
        emptyMessage="No operational alerts"
        size="tall"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="operational_alerts"
      title="Operational Alerts"
      loading={loading}
      error={error}
      onRefresh={fetchAlerts}
      size="tall"
      onClick={onClick}
    >
      {alerts && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-8 h-8 mx-auto text-green-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500">All systems operational</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 6).map((alert, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-2 rounded border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    {getCategoryIcon(alert.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{alert.title}</div>
                    <div className="text-xs text-gray-600 truncate">{alert.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatTime(alert.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
