// Today's Orders Widget
// Displays today's order statistics

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function TodayOrdersWidget({ ordersData = {}, onClick = null }) {
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        total: ordersData.total || 0,
        completed: ordersData.completed || 0,
        inProgress: ordersData.inProgress || 0,
        cancelled: ordersData.cancelled || 0,
        averageOrderValue: ordersData.averageOrderValue || 0
      };
      setOrders(mockData);
    } catch (err) {
      setError('Failed to load orders data');
      console.error('[TodayOrdersWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [ordersData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (!orders && !loading && !error) {
    return (
      <BaseWidget
        widgetType="today_orders"
        title="Today's Orders"
        empty={true}
        emptyMessage="No orders today"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="today_orders"
      title="Today's Orders"
      loading={loading}
      error={error}
      onRefresh={fetchOrders}
      size="medium"
      onClick={onClick}
    >
      {orders && (
        <div className="space-y-3">
          {/* Total Orders */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{orders.total}</div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Completed</div>
              <div className="text-sm font-medium text-green-600">{orders.completed}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">In Progress</div>
              <div className="text-sm font-medium text-amber-600">{orders.inProgress}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Cancelled</div>
              <div className="text-sm font-medium text-red-600">{orders.cancelled}</div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Average Order Value</div>
            <div className="text-sm font-medium text-gray-900">{formatCurrency(orders.averageOrderValue)}</div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
