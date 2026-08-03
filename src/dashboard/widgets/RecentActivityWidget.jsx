// Recent Activity Widget
// Displays professional timeline of recent activities

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';
import { ActivityType } from '../DashboardTypes.js';

export default function RecentActivityWidget({ activityData = [], onClick = null }) {
  const [activities, setActivities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      // Placeholder - would fetch from actual data source
      const mockData = activityData.length > 0 ? activityData : [];
      setActivities(mockData);
    } catch (err) {
      setError('Failed to load recent activity');
      console.error('[RecentActivityWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activityData]);

  const getActivityIcon = (type) => {
    switch (type) {
      case ActivityType.ORDER_CREATED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case ActivityType.ORDER_COMPLETED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case ActivityType.RESERVATION_CHECKED_IN:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case ActivityType.INVENTORY_UPDATED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case ActivityType.PAYMENT_COMPLETED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case ActivityType.CUSTOMER_ADDED:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
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

  if (!activities && !loading && !error) {
    return (
      <BaseWidget
        widgetType="recent_activity"
        title="Recent Activity"
        empty={true}
        emptyMessage="No recent activity"
        size="tall"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="recent_activity"
      title="Recent Activity"
      loading={loading}
      error={error}
      onRefresh={fetchActivities}
      size="tall"
      onClick={onClick}
    >
      {activities && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-900 truncate">{activity.description}</div>
                    <div className="text-xs text-gray-500">{formatTime(activity.timestamp)}</div>
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
