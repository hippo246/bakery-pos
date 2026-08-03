/**
 * Executive Summary Widget
 * Displays comprehensive business overview with key metrics
 */

import React, { useState, useEffect, memo } from 'react';
import businessIntelligenceEngine from '../BusinessIntelligenceEngine.js';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function ExecutiveSummaryWidget({ instance, settings }) {
  const [summary, setSummary] = useState({
    revenue: 0,
    orders: 0,
    avgOrderValue: 0,
    customers: 0,
    peakHour: '',
    occupancy: 0,
    kitchenPerformance: 0,
    businessHealth: 0,
    paymentBreakdown: { cash: 0, upi: 0, card: 0 },
    operationalStatus: 'normal',
    businessDayProgress: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchSummary = async () => {
      // Get live data
      const liveData = liveOperationsEngine.getAllData();
      
      // Initialize BI engine
      businessIntelligenceEngine.initialize();
      analyticsEngine.initialize();

      // Calculate analytics
      const revenueAnalytics = analyticsEngine.calculateRevenueAnalytics(liveData);
      const orderAnalytics = analyticsEngine.calculateOrderAnalytics(liveData);
      const tableAnalytics = analyticsEngine.calculateTableAnalytics(liveData);
      const kitchenAnalytics = analyticsEngine.calculateKitchenAnalytics(liveData);
      const paymentAnalytics = analyticsEngine.calculatePaymentAnalytics(liveData);
      const healthScore = businessIntelligenceEngine.calculateBusinessHealth(liveData);

      // Determine operational status
      const operationalStatus = determineOperationalStatus(liveData, healthScore);

      // Calculate business day progress
      const now = new Date();
      const openHour = 9;
      const closeHour = 22;
      const totalHours = closeHour - openHour;
      const currentHour = now.getHours();
      const progress = Math.min(100, Math.max(0, ((currentHour - openHour) / totalHours) * 100));

      setSummary({
        revenue: revenueAnalytics.totalToday,
        orders: orderAnalytics.totalToday,
        avgOrderValue: revenueAnalytics.averageTicketSize,
        customers: orderAnalytics.totalToday,
        peakHour: revenueAnalytics.peakHour,
        occupancy: tableAnalytics.occupancyRate,
        kitchenPerformance: kitchenAnalytics.averageCookTime,
        businessHealth: healthScore.overall,
        paymentBreakdown: revenueAnalytics.paymentBreakdown,
        operationalStatus,
        businessDayProgress: Math.round(progress)
      });
      setLastUpdate(Date.now());
    };

    fetchSummary();
    const interval = setInterval(fetchSummary, 30000);

    return () => clearInterval(interval);
  }, []);

  function determineOperationalStatus(data, health) {
    if (health.overall < 60) return 'critical';
    if (data.kitchen?.delayed > 5) return 'warning';
    if (data.inventory?.critical?.length > 0) return 'warning';
    return 'normal';
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'var(--cafe-danger)';
      case 'warning': return 'var(--cafe-warning)';
      default: return 'var(--cafe-success)';
    }
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'var(--cafe-success)';
    if (score >= 75) return 'var(--cafe-info)';
    if (score >= 60) return 'var(--cafe-warning)';
    return 'var(--cafe-danger)';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Executive Summary
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
        <div style={{ 
          padding: '4px 12px', 
          background: operationalStatus === 'normal' ? 'var(--cafe-success-bg)' : 'var(--cafe-warning-bg)',
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          color: getStatusColor(operationalStatus)
        }}>
          {operationalStatus.toUpperCase()}
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Today's Revenue</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            ₹{summary.revenue.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Orders Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {summary.orders}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Avg Order Value</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            ₹{summary.avgOrderValue}
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Customers</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {summary.customers}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Peak Hour</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {summary.peakHour}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: healthScore => 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Occupancy</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {summary.occupancy}%
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Kitchen</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {summary.kitchenPerformance}m
          </div>
        </div>
      </div>

      {/* Business Health & Day Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', marginBottom: 4 }}>
            Business Health
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: getHealthColor(summary.businessHealth), fontFamily: 'monospace' }}>
            {summary.businessHealth}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', marginBottom: 4 }}>
            Business Day Progress
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {summary.businessDayProgress}%
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
        <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', marginBottom: 8 }}>
          Payment Breakdown
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginBottom: 2 }}>Cash</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
              {summary.paymentBreakdown.cash}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginBottom: 2 }}>UPI</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
              {summary.paymentBreakdown.upi}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', marginBottom: 2 }}>Card</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
              {summary.paymentBreakdown.card}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ExecutiveSummaryWidget);
