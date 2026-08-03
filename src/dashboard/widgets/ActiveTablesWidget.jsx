// Active Tables Widget
// Displays table status overview

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function ActiveTablesWidget({ tablesData = {}, onClick = null }) {
  const [tables, setTables] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        available: tablesData.available || 0,
        occupied: tablesData.occupied || 0,
        reserved: tablesData.reserved || 0,
        cleaning: tablesData.cleaning || 0,
        billRequested: tablesData.billRequested || 0,
        averageTurnoverTime: tablesData.averageTurnoverTime || 0
      };
      setTables(mockData);
    } catch (err) {
      setError('Failed to load tables data');
      console.error('[ActiveTablesWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [tablesData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'occupied':
        return 'text-blue-600 bg-blue-50';
      case 'reserved':
        return 'text-purple-600 bg-purple-50';
      case 'cleaning':
        return 'text-amber-600 bg-amber-50';
      case 'billRequested':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!tables && !loading && !error) {
    return (
      <BaseWidget
        widgetType="active_tables"
        title="Active Tables"
        empty={true}
        emptyMessage="No tables configured"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="active_tables"
      title="Active Tables"
      loading={loading}
      error={error}
      onRefresh={fetchTables}
      size="medium"
      onClick={onClick}
    >
      {tables && (
        <div className="space-y-3">
          {/* Total Tables */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Tables</div>
            <div className="text-2xl font-bold text-gray-900">
              {tables.available + tables.occupied + tables.reserved + tables.cleaning}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('available')}`}>
              <span className="text-xs">Available</span>
              <span className="text-sm font-bold">{tables.available}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('occupied')}`}>
              <span className="text-xs">Occupied</span>
              <span className="text-sm font-bold">{tables.occupied}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('reserved')}`}>
              <span className="text-xs">Reserved</span>
              <span className="text-sm font-bold">{tables.reserved}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('cleaning')}`}>
              <span className="text-xs">Cleaning</span>
              <span className="text-sm font-bold">{tables.cleaning}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('billRequested')}`}>
              <span className="text-xs">Bill Req</span>
              <span className="text-sm font-bold">{tables.billRequested}</span>
            </div>
          </div>

          {/* Average Turnover Time */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Avg Turnover Time</div>
            <div className="text-sm font-medium text-gray-900">{tables.averageTurnoverTime} min</div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
