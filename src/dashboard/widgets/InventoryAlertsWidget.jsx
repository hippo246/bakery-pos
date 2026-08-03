// Inventory Alerts Widget
// Displays actionable inventory alerts only

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function InventoryAlertsWidget({ inventoryData = {}, onClick = null }) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        lowStock: inventoryData.lowStock || [],
        outOfStock: inventoryData.outOfStock || [],
        expiringToday: inventoryData.expiringToday || [],
        supplierDelays: inventoryData.supplierDelays || []
      };
      setAlerts(mockData);
    } catch (err) {
      setError('Failed to load inventory alerts');
      console.error('[InventoryAlertsWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [inventoryData]);

  const getAlertColor = (type) => {
    switch (type) {
      case 'outOfStock':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'expiringToday':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'lowStock':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'supplierDelays':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const totalAlerts = alerts ? 
    alerts.lowStock.length + alerts.outOfStock.length + alerts.expiringToday.length + alerts.supplierDelays.length : 0;

  if (!alerts && !loading && !error) {
    return (
      <BaseWidget
        widgetType="inventory_alerts"
        title="Inventory Alerts"
        empty={true}
        emptyMessage="No inventory alerts"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="inventory_alerts"
      title="Inventory Alerts"
      loading={loading}
      error={error}
      onRefresh={fetchAlerts}
      size="medium"
      onClick={onClick}
    >
      {alerts && (
        <div className="space-y-3">
          {/* Total Alerts */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Alerts</div>
            <div className="text-2xl font-bold text-gray-900">{totalAlerts}</div>
          </div>

          {/* Alert Breakdown */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {alerts.outOfStock.length > 0 && (
              <div className={`flex items-center justify-between p-2 rounded border ${getAlertColor('outOfStock')}`}>
                <span className="text-xs font-medium">Out of Stock</span>
                <span className="text-sm font-bold">{alerts.outOfStock.length}</span>
              </div>
            )}
            {alerts.expiringToday.length > 0 && (
              <div className={`flex items-center justify-between p-2 rounded border ${getAlertColor('expiringToday')}`}>
                <span className="text-xs font-medium">Expiring Today</span>
                <span className="text-sm font-bold">{alerts.expiringToday.length}</span>
              </div>
            )}
            {alerts.lowStock.length > 0 && (
              <div className={`flex items-center justify-between p-2 rounded border ${getAlertColor('lowStock')}`}>
                <span className="text-xs font-medium">Low Stock</span>
                <span className="text-sm font-bold">{alerts.lowStock.length}</span>
              </div>
            )}
            {alerts.supplierDelays.length > 0 && (
              <div className={`flex items-center justify-between p-2 rounded border ${getAlertColor('supplierDelays')}`}>
                <span className="text-xs font-medium">Supplier Delays</span>
                <span className="text-sm font-bold">{alerts.supplierDelays.length}</span>
              </div>
            )}
          </div>

          {/* Top Alert */}
          {totalAlerts > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Most Critical</div>
              {alerts.outOfStock.length > 0 && (
                <div className="text-sm font-medium text-red-600">
                  {alerts.outOfStock[0].name} - Out of stock
                </div>
              )}
              {alerts.outOfStock.length === 0 && alerts.expiringToday.length > 0 && (
                <div className="text-sm font-medium text-amber-600">
                  {alerts.expiringToday[0].name} - Expires today
                </div>
              )}
              {alerts.outOfStock.length === 0 && alerts.expiringToday.length === 0 && alerts.lowStock.length > 0 && (
                <div className="text-sm font-medium text-amber-600">
                  {alerts.lowStock[0].name} - Low stock
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
