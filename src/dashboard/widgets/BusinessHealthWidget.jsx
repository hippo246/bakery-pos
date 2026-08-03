// Business Health Widget
// Displays overall business health with component breakdown

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';
import { getBusinessHealthCalculator } from '../BusinessHealthCalculator.js';
import { BusinessHealthStatus } from '../DashboardTypes.js';

export default function BusinessHealthWidget({ metrics = {}, onClick = null }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const businessHealthCalculator = getBusinessHealthCalculator();

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const healthResult = businessHealthCalculator.calculateHealth(metrics);
      setHealth(healthResult);
    } catch (err) {
      setError('Failed to calculate business health');
      console.error('[BusinessHealthWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [metrics]);

  const getStatusColor = (status) => {
    switch (status) {
      case BusinessHealthStatus.HEALTHY:
        return 'bg-green-500';
      case BusinessHealthStatus.WARNING:
        return 'bg-amber-500';
      case BusinessHealthStatus.CRITICAL:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case BusinessHealthStatus.HEALTHY:
        return 'text-green-600';
      case BusinessHealthStatus.WARNING:
        return 'text-amber-600';
      case BusinessHealthStatus.CRITICAL:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case BusinessHealthStatus.HEALTHY:
        return 'bg-green-50';
      case BusinessHealthStatus.WARNING:
        return 'bg-amber-50';
      case BusinessHealthStatus.CRITICAL:
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
    }
  };

  if (!health && !loading && !error) {
    return (
      <BaseWidget
        widgetType="business_health"
        title="Business Health"
        empty={true}
        emptyMessage="No health data available"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="business_health"
      title="Business Health"
      loading={loading}
      error={error}
      onRefresh={fetchHealth}
      size="large"
      onClick={onClick}
    >
      {health && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg ${getStatusBgColor(health.status)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 mb-1">Overall Health</div>
                <div className={`text-2xl font-bold capitalize ${getStatusTextColor(health.status)}`}>
                  {health.status}
                </div>
              </div>
              <div className={`w-12 h-12 rounded-full ${getStatusColor(health.status)} flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">
                  {Math.round(health.score * 100)}
                </span>
              </div>
            </div>
          </div>

          {/* Component Scores */}
          <div className="space-y-2">
            {Object.entries(health.components).map(([component, data]) => (
              <div key={component} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(data.status)}`}></div>
                  <span className="text-sm text-gray-700 capitalize">{component.replace(/_/g, ' ')}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {Math.round(data.score * 100)}%
                </div>
              </div>
            ))}
          </div>

          {/* Issues */}
          {health.issues.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">Issues requiring attention:</div>
              <div className="space-y-1">
                {health.issues.slice(0, 3).map((issue, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                      issue.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                    }`}></div>
                    <span className="text-xs text-gray-600">
                      <span className="capitalize">{issue.component}</span>: {issue.reason}
                    </span>
                  </div>
                ))}
                {health.issues.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{health.issues.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
