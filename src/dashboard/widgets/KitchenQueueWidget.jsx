// Kitchen Queue Widget
// Displays kitchen ticket status

import React, { useState, useEffect, useMemo, useRef } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function KitchenQueueWidget({ kitchenData = {}, onClick = null }) {
  const [kitchen, setKitchen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasLoadedOnce = useRef(false);

  const fetchKitchen = async () => {
    try {
      // Only show the spinner for the very first load — kitchenData updates
      // are already-available props, so re-flashing loading on every tick
      // just makes the widget feel jumpy.
      if (!hasLoadedOnce.current) setLoading(true);
      setError(null);
      const nextData = {
        waiting: kitchenData.waiting || 0,
        cooking: kitchenData.cooking || 0,
        ready: kitchenData.ready || 0,
        delayed: kitchenData.delayed || 0,
        capacity: kitchenData.capacity || 10,
        longestWaiting: kitchenData.longestWaiting || 0
      };
      setKitchen(nextData);
    } catch (err) {
      setError('Failed to load kitchen data');
      console.error('[KitchenQueueWidget] Error:', err);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    fetchKitchen();
  }, [kitchenData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting':
        return 'text-amber-600 bg-amber-50';
      case 'cooking':
        return 'text-blue-600 bg-blue-50';
      case 'ready':
        return 'text-green-600 bg-green-50';
      case 'delayed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Single source of truth for total/percentage/color so the bar's width and
  // fill color can never drift relative to each other, and capacity === 0
  // (which used to produce a NaN percentage that silently rendered green)
  // is handled explicitly.
  const capacityInfo = useMemo(() => {
    if (!kitchen) {
      return { total: 0, rawPercentage: 0, displayPercentage: 0, color: 'bg-gray-200' };
    }
    const total = kitchen.waiting + kitchen.cooking + kitchen.ready;
    const rawPercentage = kitchen.capacity > 0 ? (total / kitchen.capacity) * 100 : total > 0 ? 100 : 0;
    const displayPercentage = Math.min(rawPercentage, 100);
    const color = rawPercentage >= 90 ? 'bg-red-500' : rawPercentage >= 75 ? 'bg-amber-500' : 'bg-green-500';
    return { total, rawPercentage, displayPercentage, color };
  }, [kitchen]);

  if (!kitchen && !loading && !error) {
    return (
      <BaseWidget
        widgetType="kitchen_queue"
        title="Kitchen Queue"
        empty={true}
        emptyMessage="No kitchen activity"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="kitchen_queue"
      title="Kitchen Queue"
      loading={loading}
      error={error}
      onRefresh={fetchKitchen}
      size="medium"
      onClick={onClick}
    >
      {kitchen && (
        <div className="space-y-3">
          {/* Total Tickets */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total Tickets</div>
            <div className="text-2xl font-bold text-gray-900">
              {capacityInfo.total}
            </div>
          </div>

          {/* Capacity */}
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Capacity</span>
              <span>{capacityInfo.total}/{kitchen.capacity}</span>
            </div>
            <div
              className="w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-label="Kitchen capacity"
              aria-valuenow={Math.round(capacityInfo.displayPercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`${capacityInfo.color} h-2 rounded-full transition-all`}
                style={{ width: `${capacityInfo.displayPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('waiting')}`} aria-label={`${kitchen.waiting} tickets waiting`}>
              <span className="text-xs">Waiting</span>
              <span className="text-sm font-bold">{kitchen.waiting}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('cooking')}`} aria-label={`${kitchen.cooking} tickets cooking`}>
              <span className="text-xs">Cooking</span>
              <span className="text-sm font-bold">{kitchen.cooking}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('ready')}`} aria-label={`${kitchen.ready} tickets ready`}>
              <span className="text-xs">Ready</span>
              <span className="text-sm font-bold">{kitchen.ready}</span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${getStatusColor('delayed')}`} aria-label={`${kitchen.delayed} tickets delayed`}>
              <span className="text-xs">Delayed</span>
              <span className="text-sm font-bold">{kitchen.delayed}</span>
            </div>
          </div>

          {/* Longest Waiting */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500">Longest Waiting</div>
            <div className={`text-sm font-medium ${kitchen.longestWaiting > 15 ? 'text-red-600' : 'text-gray-900'}`}>
              {Number.isFinite(kitchen.longestWaiting) ? kitchen.longestWaiting : 0} min
            </div>
          </div>
        </div>
      )}
    </BaseWidget>
  );
}
