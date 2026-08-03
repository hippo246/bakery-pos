// Active Orders Widget
// Displays active order status with breakdown

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function ActiveOrdersWidget({ activeOrdersData = {}, onClick = null }) {
  const [activeOrders, setActiveOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        waiting: activeOrdersData.waiting || 0,
        preparing: activeOrdersData.preparing || 0,
        ready: activeOrdersData.ready || 0,
        delayed: activeOrdersData.delayed || 0,
        cancelled: activeOrdersData.cancelled || 0,
        averagePrepTime: activeOrdersData.averagePrepTime || 0
      };
      setActiveOrders(mockData);
    } catch (err) {
      setError('Failed to load active orders');
      console.error('[ActiveOrdersWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, [activeOrdersData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'text-amber-600 bg-amber-50';
      case 'preparing':
        return 'text-blue-600 bg-blue-50';
      case 'ready':
        return 'text-green-600 bg-green-50';
      case 'delayed':
        return 'text-red-600 bg-red-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!activeOrders && !loading && !error) {
    return (
      <BaseWidget
        widgetType="active_orders"
        title="Active Orders"
        empty={true}
        emptyMessage="No active orders"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="active_orders"
      title="Active Orders"
      loading={loading}
      error={error}
      onRefresh={fetchActiveOrders}
      size="medium"
      onClick={onClick}
    >
      {activeOrders && (
        <div className="space-y-3">
          {/* Total Active */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Active</div>
            <div className="text-2xl font-bold text-gray-900">
              {activeOrders.waiting + activeOrders.preparing + activeOrders.ready}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('waiting')}`}>
              <span className="text-xs">Waiting</span>
              <span className="text-sm font-bold">{activeOrders.waiting}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('preparing')}`}>
              <span className="text-xs">Preparing</span>
              <span className="text-sm font-bold">{activeOrders.preparing}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('ready')}`}>
              <span className="text-xs">Ready</span>
              <span className="text-sm font-bold">{activeOrders.ready}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('delayed')}`}>
              <span className="text-xs">Delayed</span>
              <span className="text-sm font-bold">{activeOrders.delayed}</span>
            </div>
          </div>

          {/* Average Prep Time */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Average Prep Time</div>
            <div className="text-sm font-medium text-gray-900">{activeOrders.averagePrepTime} min</div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
