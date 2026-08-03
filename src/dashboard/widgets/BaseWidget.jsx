// Base Widget Component
// Provides common functionality for all dashboard widgets

import React, { useState, useEffect, useCallback } from 'react';
import { WIDGET_REFRESH_INTERVALS, WIDGET_REFRESH_CONFIG } from '../DashboardTypes.js';

export default function BaseWidget({
  widgetType,
  title,
  children,
  onRefresh,
  refreshInterval = null,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'No data available',
  emptyAction = null,
  className = '',
  size = 'medium',
  onClick = null
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const effectiveRefreshInterval = refreshInterval || WIDGET_REFRESH_CONFIG[widgetType];

  useEffect(() => {
    if (effectiveRefreshInterval && onRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, effectiveRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [effectiveRefreshInterval, onRefresh]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error(`[BaseWidget] Refresh failed for ${widgetType}:`, error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh, widgetType]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      case 'wide':
        return 'col-span-3 row-span-1';
      case 'tall':
        return 'col-span-1 row-span-2';
      default:
        return 'col-span-2 row-span-1';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${getSizeClasses()} ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-4 ${getSizeClasses()} ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${getSizeClasses()} ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-center py-6">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
          {emptyAction && (
            <button
              onClick={emptyAction.onClick}
              className="mt-2 text-sm text-amber-600 hover:text-amber-700"
            >
              {emptyAction.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-4 ${getSizeClasses()} ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        {onRefresh && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            disabled={isRefreshing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      {lastRefresh && (
        <div className="text-xs text-gray-400 mb-2">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      )}
      {children}
    </div>
  );
}
