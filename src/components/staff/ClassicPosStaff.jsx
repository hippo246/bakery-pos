/**
 * ClassicPosStaff.jsx
 * High-contrast Staff Management for Classic POS Theme
 */

import React, { useState, useMemo } from 'react';

export default function ClassicPosStaff({ staff = [], setStaff }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dummy Staff Data
  const dummyStaff = useMemo(() => [
    {
      id: 'STF-001',
      name: 'Rahul Sharma',
      role: 'WAITER',
      status: 'ACTIVE',
      phone: '9876543210',
      email: 'rahul@cafe.com',
      joinDate: '2023-01-15',
      totalOrders: 1245,
      totalRevenue: 285000,
      avgOrderValue: 229,
      rating: 4.8,
    },
    {
      id: 'STF-002',
      name: 'Priya Patel',
      role: 'WAITER',
      status: 'ACTIVE',
      phone: '9123456789',
      email: 'priya@cafe.com',
      joinDate: '2023-03-20',
      totalOrders: 987,
      totalRevenue: 198500,
      avgOrderValue: 201,
      rating: 4.6,
    },
    {
      id: 'STF-003',
      name: 'Ankit Singh',
      role: 'CHEF',
      status: 'ACTIVE',
      phone: '8899776655',
      email: 'ankit@cafe.com',
      joinDate: '2022-11-10',
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      rating: 4.9,
    },
    {
      id: 'STF-004',
      name: 'Suresh Kumar',
      role: 'BARTENDER',
      status: 'ACTIVE',
      phone: '7766554433',
      email: 'suresh@cafe.com',
      joinDate: '2023-05-01',
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      rating: 4.7,
    },
    {
      id: 'STF-005',
      name: 'Neha Gupta',
      role: 'MANAGER',
      status: 'ACTIVE',
      phone: '6655443322',
      email: 'neha@cafe.com',
      joinDate: '2022-08-15',
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      rating: 4.9,
    },
    {
      id: 'STF-006',
      name: 'Vikram Reddy',
      role: 'WAITER',
      status: 'ON_LEAVE',
      phone: '5544332211',
      email: 'vikram@cafe.com',
      joinDate: '2023-02-28',
      totalOrders: 756,
      totalRevenue: 156000,
      avgOrderValue: 206,
      rating: 4.5,
    },
    {
      id: 'STF-007',
      name: 'Deepa Nair',
      role: 'CASHIER',
      status: 'ACTIVE',
      phone: '4433221100',
      email: 'deepa@cafe.com',
      joinDate: '2023-04-10',
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      rating: 4.8,
    },
    {
      id: 'STF-008',
      name: 'Arun Verma',
      role: 'KITCHEN_HELPER',
      status: 'INACTIVE',
      phone: '3322110099',
      email: 'arun@cafe.com',
      joinDate: '2023-06-15',
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      rating: 4.3,
    },
  ], []);

  // Combine real staff with dummy data
  const allStaff = useMemo(() => {
    if (staff.length > 0) {
      return staff.map(s => ({
        id: s.id || 'STF-000',
        name: s.name || 'Unknown',
        role: s.role || 'WAITER',
        status: s.status || 'ACTIVE',
        phone: s.phone || '',
        email: s.email || '',
        joinDate: s.joinDate || new Date().toISOString().split('T')[0],
        totalOrders: s.totalOrders || 0,
        totalRevenue: s.totalRevenue || 0,
        avgOrderValue: s.avgOrderValue || 0,
        rating: s.rating || 4.5,
      }));
    }
    return dummyStaff;
  }, [staff, dummyStaff]);

  // Calculate KPI metrics
  const metrics = useMemo(() => {
    const activeStaff = allStaff.filter(s => s.status === 'ACTIVE').length;
    const onLeave = allStaff.filter(s => s.status === 'ON_LEAVE').length;
    const totalRevenue = allStaff.reduce((sum, s) => sum + s.totalRevenue, 0);
    const avgRating = allStaff.length > 0 
      ? (allStaff.reduce((sum, s) => sum + s.rating, 0) / allStaff.length).toFixed(1)
      : 0;

    return {
      activeStaff,
      onLeave,
      totalRevenue,
      avgRating,
    };
  }, [allStaff]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    let staffList = allStaff;

    // Role filter
    if (roleFilter !== 'ALL') {
      staffList = staffList.filter(s => s.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      staffList = staffList.filter(s => s.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      staffList = staffList.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query)
      );
    }

    return staffList;
  }, [allStaff, roleFilter, statusFilter, searchQuery]);

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { backgroundColor: '#22C55E', color: '#000000' };
      case 'ON_LEAVE':
        return { backgroundColor: '#F59E0B', color: '#000000' };
      case 'INACTIVE':
        return { backgroundColor: '#EF4444', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#6B7280', color: '#FFFFFF' };
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    const icons = {
      WAITER: '🍽️',
      CHEF: '👨‍🍳',
      BARTENDER: '🍸',
      MANAGER: '👔',
      CASHIER: '💰',
      KITCHEN_HELPER: '🧑‍🍳',
    };
    return icons[role] || '👤';
  };

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '20px',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  };

  const kpiSectionStyle = {
    padding: '16px 20px',
    backgroundColor: '#000000',
    borderBottom: '3px solid #FFFFFF',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
  };

  const kpiCardStyle = {
    backgroundColor: '#1A1A1A',
    border: '3px solid #FFFFFF',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const kpiLabelStyle = {
    fontSize: '12px',
    fontWeight: '800',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const kpiValueStyle = {
    fontSize: '28px',
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  };

  const toolbarStyle = {
    padding: '16px 20px',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const searchInputStyle = {
    padding: '12px 16px',
    backgroundColor: '#000000',
    border: '2px solid #FFFFFF',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '700',
    width: '320px',
  };

  const filterChipsStyle = {
    display: 'flex',
    gap: '8px',
  };

  const chipStyle = (isActive) => ({
    padding: '8px 16px',
    fontSize: '11px',
    fontWeight: '800',
    backgroundColor: isActive ? '#22C55E' : '#333333',
    color: isActive ? '#000000' : '#FFFFFF',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
  });

  const addButtonStyle = {
    padding: '12px 24px',
    fontSize: '13px',
    fontWeight: '900',
    backgroundColor: '#22C55E',
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
  };

  const tableContainerStyle = {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#000000',
    border: '3px solid #FFFFFF',
  };

  const headerCellStyle = {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    padding: '14px',
    fontWeight: '900',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid #FFFFFF',
    cursor: 'pointer',
  };

  const cellStyle = {
    padding: '12px',
    borderBottom: '2px solid #333333',
    fontSize: '13px',
    fontWeight: '700',
    color: '#FFFFFF',
  };

  const nameCellStyle = {
    ...cellStyle,
    fontWeight: '900',
    fontSize: '14px',
  };

  const roleCellStyle = {
    ...cellStyle,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const statusBadgeStyle = (status) => ({
    ...getStatusStyle(status),
    padding: '6px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '900',
    textTransform: 'uppercase',
  });

  const metricCellStyle = {
    ...cellStyle,
    fontFamily: 'monospace',
    color: '#22C55E',
    fontWeight: '900',
  };

  const ratingCellStyle = {
    ...cellStyle,
    color: '#F59E0B',
    fontWeight: '900',
  };

  const actionButtonStyle = {
    padding: '6px 10px',
    backgroundColor: '#333333',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '800',
    marginRight: '4px',
    textTransform: 'uppercase',
  };

  const deleteButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: '#EF4444',
  };

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div style={titleStyle}>STAFF MANAGEMENT</div>
        <button style={addButtonStyle}>+ ADD NEW STAFF</button>
      </div>

      {/* KPI DASHBOARD */}
      <div style={kpiSectionStyle}>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>ACTIVE STAFF</div>
          <div style={kpiValueStyle}>{metrics.activeStaff}</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>ON LEAVE</div>
          <div style={kpiValueStyle}>{metrics.onLeave}</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>TOTAL REVENUE (₹)</div>
          <div style={kpiValueStyle}>{metrics.totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div style={kpiCardStyle}>
          <div style={kpiLabelStyle}>AVG RATING</div>
          <div style={kpiValueStyle}>{metrics.avgRating} ⭐</div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={toolbarStyle}>
        <input
          type="text"
          placeholder="Search staff name, ID, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={searchInputStyle}
        />
        <div style={filterChipsStyle}>
          <button
            onClick={() => setRoleFilter('ALL')}
            style={chipStyle(roleFilter === 'ALL')}
          >
            ALL ROLES
          </button>
          <button
            onClick={() => setRoleFilter('WAITER')}
            style={chipStyle(roleFilter === 'WAITER')}
          >
            WAITERS
          </button>
          <button
            onClick={() => setRoleFilter('CHEF')}
            style={chipStyle(roleFilter === 'CHEF')}
          >
            CHEFS
          </button>
          <button
            onClick={() => setRoleFilter('MANAGER')}
            style={chipStyle(roleFilter === 'MANAGER')}
          >
            MANAGERS
          </button>
        </div>
        <div style={filterChipsStyle}>
          <button
            onClick={() => setStatusFilter('ALL')}
            style={chipStyle(statusFilter === 'ALL')}
          >
            ALL STATUS
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            style={chipStyle(statusFilter === 'ACTIVE')}
          >
            ACTIVE
          </button>
          <button
            onClick={() => setStatusFilter('ON_LEAVE')}
            style={chipStyle(statusFilter === 'ON_LEAVE')}
          >
            ON LEAVE
          </button>
        </div>
      </div>

      {/* STAFF TABLE */}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={headerCellStyle}>STAFF ID</th>
              <th style={headerCellStyle}>NAME</th>
              <th style={headerCellStyle}>ROLE</th>
              <th style={headerCellStyle}>STATUS</th>
              <th style={headerCellStyle}>PHONE</th>
              <th style={headerCellStyle}>EMAIL</th>
              <th style={headerCellStyle}>JOIN DATE</th>
              <th style={headerCellStyle}>TOTAL ORDERS</th>
              <th style={headerCellStyle}>TOTAL REVENUE (₹)</th>
              <th style={headerCellStyle}>AVG ORDER VALUE</th>
              <th style={headerCellStyle}>RATING</th>
              <th style={headerCellStyle}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map(staffMember => (
              <tr key={staffMember.id}>
                <td style={{...cellStyle, fontFamily: 'monospace'}}>{staffMember.id}</td>
                <td style={nameCellStyle}>{staffMember.name}</td>
                <td style={roleCellStyle}>
                  <span>{getRoleIcon(staffMember.role)}</span>
                  <span>{staffMember.role}</span>
                </td>
                <td style={cellStyle}>
                  <span style={statusBadgeStyle(staffMember.status)}>
                    {staffMember.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={cellStyle}>{staffMember.phone}</td>
                <td style={cellStyle}>{staffMember.email}</td>
                <td style={cellStyle}>{staffMember.joinDate}</td>
                <td style={metricCellStyle}>{staffMember.totalOrders}</td>
                <td style={metricCellStyle}>{staffMember.totalRevenue.toLocaleString('en-IN')}</td>
                <td style={metricCellStyle}>₹{staffMember.avgOrderValue}</td>
                <td style={ratingCellStyle}>{staffMember.rating} ⭐</td>
                <td style={cellStyle}>
                  <button style={actionButtonStyle}>EDIT</button>
                  <button style={deleteButtonStyle}>REMOVE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStaff.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#888888',
            fontSize: '16px',
            fontWeight: '700',
          }}>
            No staff members found
          </div>
        )}
      </div>
    </div>
  );
}
