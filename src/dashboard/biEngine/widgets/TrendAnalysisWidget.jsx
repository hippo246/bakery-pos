/**
 * Trend Analysis Widget
 * Displays comparative trends and performance analysis
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function TrendAnalysisWidget({ instance, settings }) {
  const [trendData, setTrendData] = useState({
    todayVsYesterday: { revenue: 0, orders: 0, customers: 0 },
    weekVsLastWeek: { revenue: 0, orders: 0, customers: 0 },
    monthVsLastMonth: { revenue: 0, orders: 0, customers: 0 },
    peakHours: [],
    slowHours: [],
    revenueTrend: 'stable',
    customerTrend: 'stable',
    orderTrend: 'stable'
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchTrendData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateTrendAnalysis(liveData);

      setTrendData(analytics);
      setLastUpdate(Date.now());
    };

    fetchTrendData();
    const interval = setInterval(fetchTrendData, 120000);

    return () => clearInterval(interval);
  }, []);

  const getTrendColor = (value) => {
    if (value > 0) return 'var(--cafe-success)';
    if (value < 0) return 'var(--cafe-danger)';
    return 'var(--cafe-text-secondary)';
  };

  const getTrendIcon = (value) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  const getTrendDirection = (trend) => {
    switch (trend) {
      case 'increasing': return { color: 'var(--cafe-success)', icon: '↑' };
      case 'decreasing': return { color: 'var(--cafe-danger)', icon: '↓' };
      default: return { color: 'var(--cafe-text-secondary)', icon: '→' };
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Trend Analysis
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Today vs Yesterday */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Today vs Yesterday
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Revenue</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendColor(trendData.todayVsYesterday.revenue), fontFamily: 'monospace' }}>
              {getTrendIcon(trendData.todayVsYesterday.revenue)} {Math.abs(trendData.todayVsYesterday.revenue)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Orders</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendColor(trendData.todayVsYesterday.orders), fontFamily: 'monospace' }}>
              {getTrendIcon(trendData.todayVsYesterday.orders)} {Math.abs(trendData.todayVsYesterday.orders)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Customers</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendColor(trendData.todayVsYesterday.customers), fontFamily: 'monospace' }}>
              {getTrendIcon(trendData.todayVsYesterday.customers)} {Math.abs(trendData.todayVsYesterday.customers)}%
            </div>
          </div>
        </div>
      </div>

      {/* Week vs Last Week */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Week vs Last Week
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Revenue</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendColor(trendData.weekVsLastWeek.revenue), fontFamily: 'monospace' }}>
              {getTrendIcon(trendData.weekVsLastWeek.revenue)} {Math.abs(trendData.weekVsLastWeek.revenue)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Orders</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendColor(trendData.weekVsLastWeek.orders), fontFamily: 'monospace' }}>
              {getTrendIcon(trendData.weekVsLastWeek.orders)} {Math.abs(trendData.weekVsLastWeek.orders)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Customers</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendColor(trendData.weekVsLastWeek.customers), fontFamily: 'monospace' }}>
              {getTrendIcon(trendData.weekVsLastWeek.customers)} {Math.abs(trendData.weekVsLastWeek.customers)}%
            </div>
          </div>
        </div>
      </div>

      {/* Peak & Slow Hours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-success-bg)', 
          border: '1px solid var(--cafe-success-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-success)', fontWeight: 600, marginBottom: 8 }}>
            Peak Hours
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {trendData.peakHours.map((hour, index) => (
              <span key={index} style={{ 
                padding: '4px 8px', 
                background: 'var(--cafe-bg-card)', 
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--cafe-success)',
                fontWeight: 500
              }}>
                {hour}
              </span>
            ))}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-warning-bg)', 
          border: '1px solid var(--cafe-warning-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-warning)', fontWeight: 600, marginBottom: 8 }}>
            Slow Hours
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {trendData.slowHours.map((hour, index) => (
              <span key={index} style={{ 
                padding: '4px 8px', 
                background: 'var(--cafe-bg-card)', 
                borderRadius: 4,
                fontSize: 11,
                color: 'var(--cafe-warning)',
                fontWeight: 500
              }}>
                {hour}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Trends */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Overall Trends
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Revenue</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendDirection(trendData.revenueTrend).color, fontFamily: 'monospace' }}>
              {getTrendDirection(trendData.revenueTrend).icon} {trendData.revenueTrend}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Customers</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendDirection(trendData.customerTrend).color, fontFamily: 'monospace' }}>
              {getTrendDirection(trendData.customerTrend).icon} {trendData.customerTrend}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Orders</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: getTrendDirection(trendData.orderTrend).color, fontFamily: 'monospace' }}>
              {getTrendDirection(trendData.orderTrend).icon} {trendData.orderTrend}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TrendAnalysisWidget);
