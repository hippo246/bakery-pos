/**
 * FastFoodStaffComprehensive.jsx
 * Comprehensive Staff Management with performance metrics
 */

import React, { useState, useMemo } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';

export default function FastFoodStaffComprehensive({ staff = [], setStaff }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [selectedMetric, setSelectedMetric] = useState('SPEED');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Staff data with performance metrics
  const staffData = useMemo(() => [
    {
      id: 'S001',
      name: 'AMIT KUMAR',
      role: 'KITCHEN STAFF',
      status: 'ON_SHIFT',
      shift: '8:00 AM - 4:00 PM',
      speed: 4.8,
      orders: 45,
      revenue: 8950,
      rating: 4.7,
      efficiency: 92,
    },
    {
      id: 'S002',
      name: 'NEHA GUPTA',
      role: 'CASHIER',
      status: 'ON_SHIFT',
      shift: '9:00 AM - 5:00 PM',
      speed: 4.9,
      orders: 67,
      revenue: 12450,
      rating: 4.8,
      efficiency: 95,
    },
    {
      id: 'S003',
      name: 'RAHUL SHARMA',
      role: 'CASHIER',
      status: 'ON_SHIFT',
      shift: '10:00 AM - 6:00 PM',
      speed: 4.7,
      orders: 38,
      revenue: 7230,
      rating: 4.6,
      efficiency: 88,
    },
    {
      id: 'S004',
      name: 'PRIYA PATEL',
      role: 'KITCHEN STAFF',
      status: 'ON_BREAK',
      shift: '8:00 AM - 4:00 PM',
      speed: 4.6,
      orders: 42,
      revenue: 8100,
      rating: 4.5,
      efficiency: 85,
    },
    {
      id: 'S005',
      name: 'VIKRAM REDDY',
      role: 'MANAGER',
      status: 'ON_SHIFT',
      shift: '9:00 AM - 6:00 PM',
      speed: 4.5,
      orders: 25,
      revenue: 5600,
      rating: 4.9,
      efficiency: 90,
    },
    {
      id: 'S006',
      name: 'DEEPA NAIR',
      role: 'CLEANER',
      status: 'OFF_SHIFT',
      shift: '6:00 PM - 2:00 AM',
      speed: 4.4,
      orders: 0,
      revenue: 0,
      rating: 4.3,
      efficiency: 80,
    },
  ], []);

  // Filter staff
  const filteredStaff = useMemo(() => {
    if (selectedFilter === 'ALL') return staffData;
    return staffData.filter(s => s.role === selectedFilter);
  }, [staffData, selectedFilter]);

  // Calculate stats
  const stats = useMemo(() => ({
    active: staffData.filter(s => s.status === 'ON_SHIFT').length,
    onBreak: staffData.filter(s => s.status === 'ON_BREAK').length,
    offShift: staffData.filter(s => s.status === 'OFF_SHIFT').length,
    totalOrders: staffData.reduce((sum, s) => sum + s.orders, 0),
    totalRevenue: staffData.reduce((sum, s) => sum + s.revenue, 0),
    avgSpeed: (staffData.reduce((sum, s) => sum + s.speed, 0) / staffData.length).toFixed(1),
    avgRating: (staffData.reduce((sum, s) => sum + s.rating, 0) / staffData.length).toFixed(1),
  }), [staffData]);

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'ON_SHIFT':
        return { backgroundColor: '#2ECC71', color: '#FFFFFF' };
      case 'ON_BREAK':
        return { backgroundColor: '#FFD166', color: '#1A1A1A' };
      case 'OFF_SHIFT':
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#FFFFFF', color: '#1A1A1A' };
    }
  };

  // Get metric bar color
  const getMetricColor = (value) => {
    if (value >= 4.5) return '#2ECC71';
    if (value >= 4.0) return '#FFD166';
    return '#E63946';
  };

  // Handler functions
  const handleViewPerformance = (staffId) => {
    setAlertDialog({ isOpen: true, title: 'Staff Performance', message: `Viewing performance for staff ${staffId}`, type: 'info' });
  };

  const handleEditStaff = (staffId) => {
    setAlertDialog({ isOpen: true, title: 'Edit Staff', message: `Editing staff ${staffId}`, type: 'info' });
  };

  const handleBreak = (staffId) => {
    setAlertDialog({ isOpen: true, title: 'Staff Break', message: `Sending staff ${staffId} on break`, type: 'info' });
  };

  const handleAddStaff = () => {
    setAlertDialog({ isOpen: true, title: 'Add Staff', message: 'Opening add staff form...', type: 'info' });
  };

  const handlePerformanceReport = () => {
    setAlertDialog({ isOpen: true, title: 'Performance Report', message: 'Generating performance report...', type: 'info' });
  };

  const handleShiftSchedule = () => {
    setAlertDialog({ isOpen: true, title: 'Shift Schedule', message: 'Opening shift schedule...', type: 'info' });
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

  const statsBarStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const statCardStyle = {
    backgroundColor: '#F8F9FA',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '8px',
    textAlign: 'center',
  };

  const statLabelStyle = {
    fontSize: '10px',
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  const statValueStyle = {
    fontSize: '18px',
    fontWeight: '900',
    color: '#E63946',
  };

  const filterBarStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#FFD166',
    borderBottom: '2px solid #E63946',
  };

  const filterButtonStyle = (isActive) => ({
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#FFFFFF',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const metricBarStyle = {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#FFFFFF',
    borderBottom: '2px solid #E63946',
  };

  const metricButtonStyle = (isActive) => ({
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: isActive ? '#E63946' : '#F8F9FA',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const mainContentStyle = {
    flex: 1,
    padding: '12px',
    overflow: 'auto',
  };

  const staffGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
  };

  const staffCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '12px',
  };

  const staffHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  };

  const staffNameStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#1A1A1A',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '9px',
    fontWeight: '800',
    textTransform: 'uppercase',
  });

  const roleStyle = {
    fontSize: '11px',
    color: '#666666',
    marginBottom: '6px',
    fontWeight: '700',
  };

  const shiftStyle = {
    fontSize: '10px',
    color: '#666666',
    marginBottom: '8px',
  };

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  };

  const statItemStyle = {
    backgroundColor: '#F8F9FA',
    padding: '8px',
    borderRadius: '4px',
    textAlign: 'center',
  };

  const statLabelStyleSmall = {
    fontSize: '9px',
    fontWeight: '800',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: '3px',
  };

  const statValueStyleSmall = {
    fontSize: '12px',
    fontWeight: '900',
    color: '#E63946',
  };

  const metricBarContainerStyle = {
    backgroundColor: '#F8F9FA',
    borderRadius: '4px',
    height: '8px',
    marginBottom: '12px',
    overflow: 'hidden',
  };

  const metricBarFillStyle = (color, value) => ({
    backgroundColor: color,
    width: `${(value / 5) * 100}%`,
    height: '100%',
    borderRadius: '4px',
  });

  const metricLabelStyle = {
    fontSize: '10px',
    fontWeight: '700',
    color: '#666666',
    marginBottom: '3px',
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const actionButtonStyle = {
    flex: 1,
    padding: '6px 4px',
    fontSize: '9px',
    fontWeight: '800',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const secondaryButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: '#FFD166',
    color: '#1A1A1A',
  };

  const footerStyle = {
    display: 'flex',
    gap: '4px',
    padding: '8px 12px',
    backgroundColor: '#FFFFFF',
    borderTop: '2px solid #E63946',
  };

  const footerButtonStyle = {
    padding: '8px 16px',
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span>👨‍🍳 STAFF MANAGEMENT</span>
        <span>ACTIVE: {stats.active} │ 12:34 PM</span>
      </div>

      {/* Stats Bar */}
      <div style={statsBarStyle}>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>ACTIVE STAFF</div>
          <div style={statValueStyle}>{stats.active}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>TOTAL ORDERS</div>
          <div style={statValueStyle}>{stats.totalOrders}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>TOTAL REVENUE</div>
          <div style={statValueStyle}>₹{stats.totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div style={statCardStyle}>
          <div style={statLabelStyle}>AVG SPEED</div>
          <div style={statValueStyle}>{stats.avgSpeed}/5</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={filterBarStyle}>
        <button onClick={() => setSelectedFilter('ALL')} style={filterButtonStyle(selectedFilter === 'ALL')}>
          👨‍🍳 KITCHEN
        </button>
        <button onClick={() => setSelectedFilter('CASHIER')} style={filterButtonStyle(selectedFilter === 'CASHIER')}>
          👩‍💼 CASHIERS
        </button>
        <button onClick={() => setSelectedFilter('CLEANER')} style={filterButtonStyle(selectedFilter === 'CLEANER')}>
          🧹 CLEANERS
        </button>
        <button onClick={() => setSelectedFilter('MANAGER')} style={filterButtonStyle(selectedFilter === 'MANAGER')}>
          👨‍💼 MANAGERS
        </button>
      </div>

      {/* Metric Bar */}
      <div style={metricBarStyle}>
        <button onClick={() => setSelectedMetric('SPEED')} style={metricButtonStyle(selectedMetric === 'SPEED')}>
          ⚡ SPEED
        </button>
        <button onClick={() => setSelectedMetric('ORDERS')} style={metricButtonStyle(selectedMetric === 'ORDERS')}>
          📊 ORDERS
        </button>
        <button onClick={() => setSelectedMetric('REVENUE')} style={metricButtonStyle(selectedMetric === 'REVENUE')}>
          💰 REVENUE
        </button>
        <button onClick={() => setSelectedMetric('RATING')} style={metricButtonStyle(selectedMetric === 'RATING')}>
          ⭐ RATING
        </button>
      </div>

      {/* Main Content */}
      <div style={mainContentStyle}>
        <div style={staffGridStyle}>
          {filteredStaff.map(staffMember => (
            <div key={staffMember.id} style={staffCardStyle}>
              <div style={staffHeaderStyle}>
                <div style={staffNameStyle}>👨‍🍳 {staffMember.name}</div>
                <div style={statusBadgeStyle(staffMember.status)}>{staffMember.status.replace(/_/g, ' ')}</div>
              </div>

              <div style={roleStyle}>🎂 {staffMember.role}</div>
              <div style={shiftStyle}>⏰ {staffMember.shift}</div>

              <div style={statsStyle}>
                <div style={statItemStyle}>
                  <div style={statLabelStyleSmall}>ORDERS</div>
                  <div style={statValueStyleSmall}>{staffMember.orders}</div>
                </div>
                <div style={statItemStyle}>
                  <div style={statLabelStyleSmall}>REVENUE</div>
                  <div style={statValueStyleSmall}>₹{staffMember.revenue.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={metricLabelStyle}>⚡ SPEED: {staffMember.speed}/5</div>
              <div style={metricBarContainerStyle}>
                <div style={metricBarFillStyle(getMetricColor(staffMember.speed), staffMember.speed)} />
              </div>

              <div style={metricLabelStyle}>⭐ RATING: {staffMember.rating}/5</div>
              <div style={metricBarContainerStyle}>
                <div style={metricBarFillStyle(getMetricColor(staffMember.rating), staffMember.rating)} />
              </div>

              <div style={metricLabelStyle}>📊 EFFICIENCY: {staffMember.efficiency}%</div>
              <div style={metricBarContainerStyle}>
                <div style={metricBarFillStyle(getMetricColor(staffMember.efficiency / 5), staffMember.efficiency / 5)} />
              </div>

              <div style={actionButtonsStyle}>
                <button onClick={() => handleViewPerformance(staffMember.id)} style={actionButtonStyle}>📋 VIEW PERFORMANCE</button>
                <button onClick={() => handleEditStaff(staffMember.id)} style={secondaryButtonStyle}>✏️ EDIT</button>
                <button onClick={() => handleBreak(staffMember.id)} style={secondaryButtonStyle}>⏸️ BREAK</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <button onClick={handleAddStaff} style={footerButtonStyle}>➕ ADD STAFF</button>
        <button onClick={handlePerformanceReport} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>📊 PERFORMANCE REPORT</button>
        <button onClick={handleShiftSchedule} style={{...footerButtonStyle, backgroundColor: '#FFD166', color: '#1A1A1A'}}>⏰ SHIFT SCHEDULE</button>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
