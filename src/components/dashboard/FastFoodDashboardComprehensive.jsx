/**
 * FastFoodDashboardComprehensive.jsx
 * Comprehensive Dashboard with drive-thru stats and order queues
 */

import { useState, useMemo } from 'react';
import {
  AccessibleDashboard,
  AccessibleMetricCard,
  AccessibleOrderCard,
  AccessibleDashboardTabs,
  AccessibleDashboardPanel,
  AccessibleStaffCard,
  AccessibleStatCard,
} from '../accessibility';

export default function FastFoodDashboardComprehensive() {
  const [selectedView, setSelectedView] = useState('QUEUE');

  // Dashboard metrics
  const metrics = useMemo(() => ({
    todaySales: 45678,
    avgDriveThruTime: '3:45',
    activeStaff: 6,
    peakHour: '1-3 PM',
    totalOrders: 28,
    driveThruOrders: 12,
    dineInOrders: 8,
    takeoutOrders: 5,
    deliveryOrders: 3,
  }), []);

  // Active orders queue
  const activeOrders = useMemo(() => [
    { id: '2847', type: 'DT1', time: '2:30', status: 'URGENT', total: 547 },
    { id: '2848', type: 'DINE', time: '4:15', status: 'NORMAL', total: 299 },
    { id: '2849', type: 'TAKE', time: '5:00', status: 'RELAXED', total: 199 },
    { id: '2850', type: 'DT2', time: '1:45', status: 'URGENT', total: 899 },
    { id: '2851', type: 'DELIVERY', time: '3:30', status: 'NORMAL', total: 447 },
  ], []);

  // Order type stats
  const orderTypeStats = useMemo(() => [
    { type: 'DRIVE-THRU', icon: '🚗', count: 12, status: 'urgent' },
    { type: 'DINE-IN', icon: '🍽️', count: 8, status: 'normal' },
    { type: 'TAKEOUT', icon: '🥡', count: 5, status: 'normal' },
    { type: 'DELIVERY', icon: '🛵', count: 3, status: 'normal' },
  ], []);

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'urgent':
        return { backgroundColor: '#E63946', color: '#FFFFFF' };
      case 'normal':
        return { backgroundColor: '#FFD166', color: '#1A1A1A' };
      case 'relaxed':
        return { backgroundColor: '#2ECC71', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontWeight: '900',
    fontSize: '12px',
  };

  const metricsBarStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const metricCardStyle = {
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '8px',
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
    fontSize: '18px',
    fontWeight: '900',
    color: '#E63946',
  };

  const orderTypeBarStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#FFD166',
    borderBottom: '2px solid #E63946',
  };

  const orderTypeCardStyle = (status) => ({
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center',
  });

  const orderTypeLabelStyle = {
    fontSize: '11px',
    fontWeight: '800',
    marginBottom: '4px',
  };

  const orderTypeCountStyle = {
    fontSize: '24px',
    fontWeight: '900',
    color: '#E63946',
  };

  const mainContentStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
  };

  const queueSectionStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '900',
    marginBottom: '12px',
    color: '#E63946',
  };

  const orderQueueStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '8px',
  };

  const orderCardStyle = (status) => ({
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '8px',
  });

  const orderHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const orderNumberStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#1A1A1A',
  };

  const orderTypeIconStyle = {
    fontSize: '16px',
  };

  const timeStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#666666',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '3px 6px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const totalStyle = {
    fontSize: '16px',
    fontWeight: '900',
    color: '#E63946',
    marginTop: '6px',
  };

  const viewToggleStyle = {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  };

  const viewButtonStyle = (isActive) => ({
    padding: '6px 12px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  return (
    <AccessibleDashboard title="Fast Food Dashboard">
      {/* Header */}
      <header style={headerStyle} role="banner">
        <h1 style={{ margin: 0, fontSize: '12px' }}>🍔 FAST FOOD DASHBOARD</h1>
        <span aria-live="polite" aria-label="Live status">🟢 LIVE │ ⏱️ 12:34 PM</span>
      </header>

      {/* Metrics Bar */}
      <section style={metricsBarStyle} aria-label="Dashboard metrics">
        <AccessibleMetricCard
          label="TODAY'S SALES"
          value={`₹${metrics.todaySales.toLocaleString('en-IN')}`}
        />
        <AccessibleMetricCard
          label="AVG DRIVE-THRU TIME"
          value={metrics.avgDriveThruTime}
        />
        <AccessibleMetricCard
          label="ACTIVE STAFF"
          value={metrics.activeStaff}
        />
        <AccessibleMetricCard
          label="PEAK HOUR"
          value={metrics.peakHour}
        />
      </section>

      {/* Order Type Bar */}
      <section style={orderTypeBarStyle} aria-label="Order type statistics">
        {orderTypeStats.map(stat => (
          <AccessibleMetricCard
            key={stat.type}
            label={`${stat.icon} ${stat.type}`}
            value={stat.count}
            icon={stat.icon}
          />
        ))}
        <AccessibleMetricCard
          label="TOTAL ORDERS"
          value={metrics.totalOrders}
        />
      </section>

      {/* Main Content */}
      <main style={mainContentStyle}>
        <AccessibleDashboardTabs
          tabs={[
            { id: 'QUEUE', label: 'ACTIVE ORDERS', icon: '🔥' },
            { id: 'STATS', label: 'STATISTICS', icon: '📊' },
            { id: 'STAFF', label: 'STAFF PERFORMANCE', icon: '👨‍🍳' },
          ]}
          activeTab={selectedView}
          onTabChange={setSelectedView}
          ariaLabel="Dashboard views"
        />

        {selectedView === 'QUEUE' && (
          <AccessibleDashboardPanel
            tabId="QUEUE"
            isActive={selectedView === 'QUEUE'}
            ariaLabel="Active orders queue"
          >
            <div style={queueSectionStyle}>
              <h2 style={sectionTitleStyle}>🔥 ACTIVE ORDERS QUEUE</h2>
              <div style={orderQueueStyle} role="list" aria-label="Active orders">
                {activeOrders.map(order => (
                  <AccessibleOrderCard
                    key={order.id}
                    order={order}
                    onClick={() => console.log('Order clicked:', order.id)}
                  />
                ))}
              </div>
            </div>
          </AccessibleDashboardPanel>
        )}

        {selectedView === 'STATS' && (
          <AccessibleDashboardPanel
            tabId="STATS"
            isActive={selectedView === 'STATS'}
            ariaLabel="Statistics"
          >
            <div style={queueSectionStyle}>
              <h2 style={sectionTitleStyle}>📊 TODAY'S STATISTICS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <AccessibleStatCard
                  label="TOTAL REVENUE"
                  value="₹45,678"
                  icon="💰"
                />
                <AccessibleStatCard
                  label="TOTAL ORDERS"
                  value="28"
                  icon="📋"
                />
                <AccessibleStatCard
                  label="AVG ORDER VALUE"
                  value="₹1,631"
                  icon="📊"
                />
                <AccessibleStatCard
                  label="AVG PREP TIME"
                  value="4:30"
                  icon="⏱️"
                />
              </div>
            </div>
          </AccessibleDashboardPanel>
        )}

        {selectedView === 'STAFF' && (
          <AccessibleDashboardPanel
            tabId="STAFF"
            isActive={selectedView === 'STAFF'}
            ariaLabel="Staff performance"
          >
            <div style={queueSectionStyle}>
              <h2 style={sectionTitleStyle}>👨‍🍳 STAFF PERFORMANCE</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <AccessibleStaffCard
                  staff={{
                    name: 'AMIT KUMAR',
                    orders: 45,
                    revenue: 8950,
                    speed: 4.8,
                  }}
                  onClick={() => console.log('Staff clicked: Amit Kumar')}
                />
                <AccessibleStaffCard
                  staff={{
                    name: 'NEHA GUPTA',
                    orders: 67,
                    revenue: 12450,
                    speed: 4.9,
                  }}
                  onClick={() => console.log('Staff clicked: Neha Gupta')}
                />
                <AccessibleStaffCard
                  staff={{
                    name: 'RAHUL S.',
                    orders: 38,
                    revenue: 7230,
                    speed: 4.7,
                  }}
                  onClick={() => console.log('Staff clicked: Rahul S.')}
                />
              </div>
            </div>
          </AccessibleDashboardPanel>
        )}
      </main>
    </AccessibleDashboard>
  );
}
