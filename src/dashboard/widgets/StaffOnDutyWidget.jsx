// Staff On Duty Widget
// Displays staff currently on duty

import React, { useState, useEffect } from 'react';
import BaseWidget from './BaseWidget.jsx';

export default function StaffOnDutyWidget({ staffData = {}, onClick = null }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const mockData = {
        total: staffData.total || 0,
        online: staffData.online || [],
        onBreak: staffData.onBreak || [],
        offline: staffData.offline || []
      };
      setStaff(mockData);
    } catch (err) {
      setError('Failed to load staff data');
      console.error('[StaffOnDutyWidget] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [staffData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-50';
      case 'onBreak':
        return 'text-amber-600 bg-amber-50';
      case 'offline':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!staff && !loading && !error) {
    return (
      <BaseWidget
        widgetType="staff_on_duty"
        title="Staff On Duty"
        empty={true}
        emptyMessage="No staff on duty"
        size="medium"
      />
    );
  }

  return (
    <BaseWidget
      widgetType="staff_on_duty"
      title="Staff On Duty"
      loading={loading}
      error={error}
      onRefresh={fetchStaff}
      size="medium"
      onClick={onClick}
    >
      {staff && (
        <div className="space-y-3">
          {/* Total Staff */}
          <div>
            <div className="text-sm text-gray-500 mb-1">Total On Duty</div>
            <div className="text-2xl font-bold text-gray-900">{staff.total}</div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('online')}`}>
              <span className="text-xs">Online</span>
              <span className="text-sm font-bold">{staff.online.length}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('onBreak')}`}>
              <span className="text-xs">On Break</span>
              <span className="text-sm font-bold">{staff.onBreak.length}</span>
            </div>
            <div className={`flex flex-col items-center p-2 rounded ${getStatusColor('offline')}`}>
              <span className="text-xs">Offline</span>
              <span className="text-sm font-bold">{staff.offline.length}</span>
            </div>
          </div>

          {/* Online Staff List */}
          {staff.online.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Online Staff</div>
              <div className="space-y-1">
                {staff.online.slice(0, 3).map((person, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-700">{person.name}</span>
                  </div>
                ))}
                {staff.online.length > 3 && (
                  <div className="text-xs text-gray-400">+{staff.online.length - 3} more</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}
