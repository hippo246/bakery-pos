/**
 * FastFoodDashboardSimple.jsx
 * Simplified Dashboard with essential metrics
 */

import React, { useMemo } from 'react';

export default function FastFoodDashboardSimple({ orders = [], setOrders }) {
  // Simplified metrics
  const metrics = useMemo(() => ({
    todaySales: 45678,
    totalOrders: 28,
    avgOrderValue: 1631,
    activeStaff: 6,
  }), []);

  // Simplified active orders
  const activeOrders = useMemo(() => [
    { id: '2847', type: 'Drive-Thru', time: '2:30', total: 547 },
    { id: '2848', type: 'Dine-In', time: '4:15', total: 299 },
    { id: '2849', type: 'Takeout', time: '5:00', total: 199 },
  ], []);

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
    fontFamily: 'Inter, Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    padding: '8px 12px',
    fontWeight: '900',
    fontSize: '12px',
  };

  const metricsBarStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#FFFFFF',
  };

  const metricCardStyle = {
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '10px',
    textAlign: 'center',
  };

  const metricLabelStyle = {
    fontSize: '10px',
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  const metricValueStyle = {
    fontSize: '20px',
    fontWeight: '900',
    color: '#E63946',
  };

  const mainContentStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '900',
    marginBottom: '12px',
    color: '#E63946',
  };

  const ordersContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '12px',
  };

  const orderCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
  };

  const orderHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const orderNumberStyle = {
    fontSize: '16px',
    fontWeight: '900',
    color: '#1A1A1A',
  };

  const orderTypeStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#666666',
  };

  const timeStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#666666',
    marginBottom: '8px',
  };

  const totalStyle = {
    fontSize: '20px',
    fontWeight: '900',
    color: '#E63946',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        🍔 FAST FOOD DASHBOARD
      </div>

      {/* Metrics Bar */}
      <div style={metricsBarStyle}>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>TODAY'S SALES</div>
          <div style={metricValueStyle}>₹{metrics.todaySales.toLocaleString('en-IN')}</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>TOTAL ORDERS</div>
          <div style={metricValueStyle}>{metrics.totalOrders}</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>AVG ORDER VALUE</div>
          <div style={metricValueStyle}>₹{metrics.avgOrderValue}</div>
        </div>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>ACTIVE STAFF</div>
          <div style={metricValueStyle}>{metrics.activeStaff}</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        <div style={sectionTitleStyle}>🔥 ACTIVE ORDERS</div>
        <div style={ordersContainerStyle}>
          {activeOrders.map(order => (
            <div key={order.id} style={orderCardStyle}>
              <div style={orderHeaderStyle}>
                <div style={orderNumberStyle}>#{order.id}</div>
                <div style={orderTypeStyle}>{order.type}</div>
              </div>
              <div style={timeStyle}>⏱️ {order.time}</div>
              <div style={totalStyle}>₹{order.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
