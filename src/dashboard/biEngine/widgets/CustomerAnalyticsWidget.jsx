/**
 * Customer Analytics Widget
 * Displays customer insights and behavior analytics
 */

import React, { useState, useEffect, memo } from 'react';
import analyticsEngine from '../AnalyticsEngine.js';
import liveOperationsEngine from '../../liveEngine/LiveOperationsEngine.js';

function CustomerAnalyticsWidget({ instance, settings }) {
  const [customerData, setCustomerData] = useState({
    customersToday: 0,
    returningCustomers: 0,
    newCustomers: 0,
    averageSpend: 0,
    popularVisitTime: '',
    popularCategories: [],
    customerFrequency: 0
  });
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const fetchCustomerData = async () => {
      const liveData = liveOperationsEngine.getAllData();
      
      analyticsEngine.initialize();
      const analytics = analyticsEngine.calculateCustomerAnalytics(liveData);

      setCustomerData(analytics);
      setLastUpdate(Date.now());
    };

    fetchCustomerData();
    const interval = setInterval(fetchCustomerData, 60000);

    return () => clearInterval(interval);
  }, []);

  const returnRate = customerData.customersToday > 0 
    ? Math.round((customerData.returningCustomers / customerData.customersToday) * 100) 
    : 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
            Customer Analytics
          </div>
          <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Customer Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Total Today</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-info)', fontFamily: 'monospace' }}>
            {customerData.customersToday}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Returning</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {customerData.returningCustomers}
          </div>
        </div>
        <div style={{ 
          padding: 12, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 8
        }}>
          <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>New</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
            {customerData.newCustomers}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Avg Spend</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            ₹{customerData.averageSpend}
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Return Rate</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-success)', fontFamily: 'monospace' }}>
            {returnRate}%
          </div>
        </div>
        <div style={{ 
          padding: 10, 
          background: 'var(--cafe-bg-surface)', 
          border: '1px solid var(--cafe-border)',
          borderRadius: 6
        }}>
          <div style={{ fontSize: 9, color: 'var(--cafe-text-tertiary)' }}>Frequency</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cafe-text-primary)', fontFamily: 'monospace' }}>
            {customerData.customerFrequency}/wk
          </div>
        </div>
      </div>

      {/* Popular Visit Time */}
      <div style={{ 
        padding: 12, 
        background: 'var(--cafe-bg-surface)', 
        border: '1px solid var(--cafe-border)',
        borderRadius: 8
      }}>
        <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>Popular Visit Time</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
          {customerData.popularVisitTime}
        </div>
      </div>

      {/* Popular Categories */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginBottom: 8 }}>
          Popular Categories
        </div>
        {customerData.popularCategories.map((category, index) => (
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

export default memo(CustomerAnalyticsWidget);
