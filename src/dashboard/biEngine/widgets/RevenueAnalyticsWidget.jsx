/**
 * Revenue Analytics Widget
 * Displays revenue trends, breakdown, and comparisons
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function RevenueAnalyticsWidget({ instance, settings }) {
  const [revenueData, setRevenueData] = useState({
    totalToday: 0,
    hourlyBreakdown: {},
    averageTicketSize: 0,
    peakHour: '',
    paymentBreakdown: { cash: 0, upi: 0, card: 0 },
    growthRate: 0,
    topCategories: []
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchRevenue = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateRevenueAnalytics(liveData);

      setRevenueData(analytics);
      setLastUpdate(Date.now());
    };

    fetchRevenue();
    const interval = setInterval(fetchRevenue, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Revenue Analytics
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: revenueData.growthRate > 0 ? 'var(--cafe-success-bg)' : 'var(--cafe-danger-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: revenueData.growthRate > 0 ? 'var(--cafe-success)' : 'var(--cafe-danger)'
        }}>
          {revenueData.growthRate > 0 ? '+' : ''}{revenueData.growthRate}%
        </div>
      </div>

      {/* Total Revenue */}
      <div style={{ 
        padding: 16, 
        background: 'var(--cafe-success-bg)', 
        border: '1px solid var(--cafe-success-border)',
        borderRadius: 8,
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Today's Revenue</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
          ₹{revenueData.totalToday.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Ticket</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            ₹{revenueData.averageTicketSize}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Peak Hour</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {revenueData.peakHour}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Growth</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: revenueData.growthRate > 0 ? 'var(--cafe-success)' : 'var(--cafe-danger)', fontFamily: 'monospace' }}>
            {revenueData.growthRate}%
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Payment Breakdown
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
              {revenueData.paymentBreakdown.cash}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Cash</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
              {revenueData.paymentBreakdown.upi}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>UPI</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
              {revenueData.paymentBreakdown.card}%
            </div>
            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Card</div>
          </div>
        </div>
      </div>

      {/* Top Categories */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Top Categories
        </div>
        {revenueData.topCategories.map((category, index) => (
          <div key={index} style={{ 
            padding: 8, 
            background: 'var(--cafe-bg-surface)', 
            border: '1px solid var(--cafe-border)',
            borderRadius: 6,
            marginBottom: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: 13, color: 'var(--cafe-text-primary)' }}>
              {category.category}
            </div>
            <div style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              color: 'var(--cafe-accent)',
              fontFamily: 'monospace'
            }}>
              {category.percentage}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(RevenueAnalyticsWidget);
