// Today's Revenue Widget
// Displays today's revenue with breakdown

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function TodayRevenueWidget({ revenueData = {}, onClick = null }) {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      // Placeholder - would fetch from actual data source
      const mockData = {
        total: revenueData.total || 0,
        cash: revenueData.cash || 0,
        card: revenueData.card || 0,
        upi: revenueData.upi || 0,
        target: revenueData.target || 5000,
        comparison: revenueData.comparison || 0
      };
      setRevenue(mockData);
    } catch (err) {
      setError('Failed to load revenue data');
      console.error('[TodayRevenueWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, [revenueData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProgressColor = () => {
    if (!revenue) return 'bg-gray-200';
    const percentage = (revenue.total / revenue.target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getProgressPercentage = () => {
    if (!revenue || revenue.target === 0) return 0;
    return Math.min((revenue.total / revenue.target) * 100, 100);
  };

  if (!revenue && !loading && !error) {
    return (
      <BaseWidget
        widgetType="today_revenue"
        title="Today's Revenue"
        empty={true}
        emptyMessage="No revenue data available"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="today_revenue"
      title="Today's Revenue"
      loading={loading}
      error={error}
      onRefresh={fetchRevenue}
      size="medium"
      onClick={onClick}
    >
      {revenue && (
        <div className="space-y-4">
          {/* Total Revenue */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(revenue.total)}</div>
            {revenue.comparison !== 0 && (
              <div className={`text-xs mt-1 ${revenue.comparison > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenue.comparison > 0 ? '↑' : '↓'} {Math.abs(revenue.comparison)}% vs yesterday
              </div>
            )}
          </div>

          {/* Progress to Target */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Target: {formatCurrency(revenue.target)}</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${getProgressColor()} h-2 rounded-full transition-all`}
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500">Cash</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(revenue.cash)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Card</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(revenue.card)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">UPI</div>
              <div className="text-sm font-medium text-gray-900">{formatCurrency(revenue.upi)}</div>
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
