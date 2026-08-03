// Waiter Queue Widget
// Displays waiter service status

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function WaiterQueueWidget({ waiterData = {}, onClick = null }) {
  const [waiter, setWaiter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWaiter = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        awaitingPickup: waiterData.awaitingPickup || 0,
        beingServed: waiterData.beingServed || 0,
        billRequests: waiterData.billRequests || 0,
        assignedTables: waiterData.assignedTables || 0,
        averageServiceTime: waiterData.averageServiceTime || 0,
        waitersOnline: waiterData.waitersOnline || 0
      };
      setWaiter(mockData);
    } catch (err) {
      setError('Failed to load waiter data');
      console.error('[WaiterQueueWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaiter();
  }, [waiterData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'awaitingPickup':
        return 'text-amber-600 bg-amber-50';
      case 'beingServed':
        return 'text-blue-600 bg-blue-50';
      case 'billRequests':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!waiter && !loading && !error) {
    return (
      <BaseWidget
        widgetType="waiter_queue"
        title="Waiter Queue"
        empty={true}
        emptyMessage="No waiter activity"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="waiter_queue"
      title="Waiter Queue"
      loading={loading}
      error={error}
      onRefresh={fetchWaiter}
      size="medium"
      onClick={onClick}
    >
      {waiter && (
        <div className="space-y-3">
          {/* Total Active */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Active</div>
            <div className="text-2xl font-bold text-gray-900">
              {waiter.awaitingPickup + waiter.beingServed + waiter.billRequests}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('awaitingPickup')}`}>
              <span className="text-xs">Pickup</span>
              <span className="text-sm font-bold">{waiter.awaitingPickup}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('beingServed')}`}>
              <span className="text-xs">Serving</span>
              <span className="text-sm font-bold">{waiter.beingServed}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('billRequests')}`}>
              <span className="text-xs">Bills</span>
              <span className="text-sm font-bold">{waiter.billRequests}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Assigned Tables</div>
              <div className="text-sm font-medium text-gray-900">{waiter.assignedTables}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Waiters Online</div>
              <div className="text-sm font-medium text-gray-900">{waiter.waitersOnline}</div>
            </div>
          </div>

          {/* Average Service Time */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Avg Service Time</div>
            <div className={`text-sm font-medium ${waiter.averageServiceTime > 10 ? 'text-red-600' : 'text-gray-900'}`}>
              {waiter.averageServiceTime} min
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
