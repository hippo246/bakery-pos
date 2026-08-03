import React from 'react';
// Status Bar
// Persistent operational status display

import { SystemStatus } from '../DashboardTypes.js';

export default function StatusBar({
  cloudConnected = true,
  databaseHealthy = true,
  backupStatus = 'healthy',
  syncStatus = 'healthy',
  printerStatus = 'online',
  kitchenStatus = 'online',
  waiterStatus = 'online',
  paymentStatus = 'online',
  staffOnline = 0,
  overallHealth = 'healthy'
}) {
  const getStatusColor = (status) => {
    switch (status) {
      case SystemStatus.ONLINE:
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-50';
      case SystemStatus.WARNING:
      case 'warning':
        return 'text-amber-600 bg-amber-50';
      case SystemStatus.OFFLINE:
      case 'error':
      case 'offline':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case SystemStatus.ONLINE:
      case 'healthy':
      case 'online':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="10" />
          </svg>
        );
      case SystemStatus.WARNING:
      case 'warning':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 2.093c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case SystemStatus.OFFLINE:
      case 'error':
      case 'offline':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="10" />
          </svg>
        );
    }
  };

  const getOverallHealthColor = () => {
    switch (overallHealth) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between gap-4 overflow-x-auto">
        {/* Overall Health */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${getOverallHealthColor()}`}></div>
          <span className="text-xs font-medium text-gray-700 capitalize">{overallHealth}</span>
        </div>

        <div className="hidden md:block h-4 w-px bg-gray-300 flex-shrink-0"></div>

        {/* System Statuses */}
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cloudConnected ? 'online' : 'offline')}`}>
            {getStatusIcon(cloudConnected ? 'online' : 'offline')}
            <span className="hidden sm:inline">Cloud</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(databaseHealthy ? 'online' : 'offline')}`}>
            {getStatusIcon(databaseHealthy ? 'online' : 'offline')}
            <span className="hidden sm:inline">Database</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backupStatus)}`}>
            {getStatusIcon(backupStatus)}
            <span className="hidden sm:inline">Backup</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(syncStatus)}`}>
            {getStatusIcon(syncStatus)}
            <span className="hidden sm:inline">Sync</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(printerStatus)}`}>
            {getStatusIcon(printerStatus)}
            <span className="hidden sm:inline">Printer</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kitchenStatus)}`}>
            {getStatusIcon(kitchenStatus)}
            <span className="hidden sm:inline">Kitchen</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(waiterStatus)}`}>
            {getStatusIcon(waiterStatus)}
            <span className="hidden sm:inline">Waiter</span>
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paymentStatus)}`}>
            {getStatusIcon(paymentStatus)}
            <span className="hidden sm:inline">Payment</span>
          </div>
        </div>

        <div className="hidden md:block h-4 w-px bg-gray-300 flex-shrink-0"></div>

        {/* Staff Online */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium text-gray-700">{staffOnline} Online</span>
        </div>
      </div>
    </div>
  );
}
