// Dashboard Header
// Premium operational header with business info, time, user, and quick actions

import React, { useState, useEffect } from 'react';

export default function DashboardHeader({
  businessName = 'CafeOS',
  branchName = 'Main Branch',
  currentShift = 'Morning',
  currentUser = null,
  userRole = 'Owner',
  cloudStatus = 'connected',
  notificationCount = 0,
  onQuickSearch = null,
  onProfileClick = null,
  onNotificationClick = null
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onQuickSearch) {
      onQuickSearch(query);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getCloudStatusColor = () => {
    switch (cloudStatus) {
      case 'connected':
        return 'text-green-600';
      case 'warning':
        return 'text-amber-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  const getCloudStatusIcon = () => {
    switch (cloudStatus) {
      case 'connected':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 0A9 9 0 015.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section - Business Info */}
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
            <p className="text-sm text-gray-500">{branchName}</p>
          </div>
          <div className="hidden md:block h-8 w-px bg-gray-200"></div>
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-gray-500">Shift:</span>
            <span className="font-medium text-gray-900">{currentShift}</span>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search orders, customers, reservations..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Section - User Info & Actions */}
        <div className="flex items-center gap-4">
          {/* Time */}
          <div className="hidden md:flex flex-col items-end">
            <div className="text-lg font-semibold text-gray-900">{formatTime(currentTime)}</div>
            <div className="text-xs text-gray-500">{formatDate(currentTime)}</div>
          </div>

          {/* Cloud Status */}
          <div className={`flex items-center gap-1 text-sm ${getCloudStatusColor()}`}>
            {getCloudStatusIcon()}
            <span className="hidden sm:inline capitalize">{cloudStatus}</span>
          </div>

          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-amber-700 font-medium text-sm">
                  {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900">{currentUser?.name || 'User'}</div>
                <div className="text-xs text-gray-500 capitalize">{userRole}</div>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onProfileClick) onProfileClick('profile');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onProfileClick) onProfileClick('settings');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Settings
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onProfileClick) onProfileClick('logout');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
