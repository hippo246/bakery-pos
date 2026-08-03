/**
 * Order Intelligence Widget
 * Displays order analytics and performance metrics
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function OrderIntelligenceWidget({ instance, settings }) {
  const [orderData, setOrderData] = useState({
    totalToday: 0,
    ordersPerHour: 0,
    completionRate: 0,
    cancellationRate: 0,
    averagePrepTime: 0,
    averageServiceTime: 0,
    rushPeriods: [],
    delayedOrders: 0,
    averageWaitTime: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchOrderData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateOrderAnalytics(liveData);

      setOrderData(analytics);
      setLastUpdate(Date.now());
    };

    fetchOrderData();
    const interval = setInterval(fetchOrderData, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Order Intelligence
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
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
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Total Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {orderData.totalToday}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Per Hour</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {orderData.ordersPerHour}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Completion</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {orderData.completionRate}%
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Avg Prep</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {orderData.averagePrepTime}m
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Avg Service</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {orderData.averageServiceTime}m
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Cancelled</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: orderData.cancellationRate > 5 ? 'var(--cafe-danger)' : 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {orderData.cancellationRate}%
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Delayed</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: orderData.delayedOrders > 0 ? 'var(--cafe-warning)' : 'var(--cafe-text-secondary)', fontFamily: 'monospace' }}>
            {orderData.delayedOrders}
          </div>
        </div>
      </div>

      {/* Rush Periods */}
      {orderData.rushPeriods.length > 0 && (
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
            Rush Periods
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {orderData.rushPeriods.map((period, index) => (
              <div key={index} style={{ 
                padding: '6px 12px', 
                background: 'var(--cafe-warning-bg)', 
                border: '1px solid var(--cafe-warning-border)',
                borderRadius: 4,
                fontSize: 12,
                color: 'var(--cafe-warning)',
                fontWeight: 500
              }}>
                {period}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(OrderIntelligenceWidget);
