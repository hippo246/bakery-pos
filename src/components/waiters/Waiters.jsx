import React, { useState, useMemo } from 'react';

export default function Waiters({ onNavigate, orders = [], staff = [] }) {
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get waiter orders
  const waiterOrders = useMemo(() => {
    if (!selectedStaff) {
      // Show all orders when "All Waiters" is selected
      return orders.filter(order => order.status !== 'CANCELLED');
    }
    return orders.filter(order => 
      (order.employeeId === selectedStaff.id || 
       (order.isQROrder && selectedStaff.id === 'qr') ||
       (!order.employeeId && selectedStaff.id === 'unassigned')) && 
      order.status !== 'CANCELLED'
    );
  }, [orders, selectedStaff]);

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return waiterOrders;
    return waiterOrders.filter(order => order.status === filterStatus);
  }, [waiterOrders, filterStatus]);

  // Get waiters (staff with waiter role)
  const waiters = useMemo(() => {
    const regularWaiters = staff.filter(s => 
      s.role?.toLowerCase().includes('waiter') || 
      s.role?.toLowerCase().includes('server') ||
      s.role?.toLowerCase().includes('staff')
    );
    // Add QR and Unassigned as special "waiter" options
    return [
      ...regularWaiters,
      { id: 'qr', name: 'QR Self-Orders', role: 'QR System' },
      { id: 'unassigned', name: 'Unassigned Orders', role: 'System' }
    ];
  }, [staff]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!selectedStaff) return { total: 0, completed: 0, pending: 0, revenue: 0 };
    const staffOrders = waiterOrders;
    return {
      total: staffOrders.length,
      completed: staffOrders.filter(o => o.status === 'COMPLETED').length,
      pending: staffOrders.filter(o => o.status === 'PENDING' || o.status === 'IN_PROGRESS').length,
      revenue: staffOrders.filter(o => o.status === 'COMPLETED').reduce((sum, o) => sum + (o.total || 0), 0)
    };
  }, [waiterOrders, selectedStaff]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: '20px 24px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              color: '#111827',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              Waiters / Servers
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Manage waiter orders and performance
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', overflow: 'auto', flex: 1 }}>
        {/* Waiter Selection */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
            Select Waiter
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedStaff(null)}
              style={{
                padding: '10px 20px',
                background: !selectedStaff ? '#111827' : '#ffffff',
                border: !selectedStaff ? 'none' : '1px solid #d1d5db',
                color: !selectedStaff ? '#ffffff' : '#111827',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                borderRadius: '6px'
              }}
            >
              All Waiters
            </button>
            {waiters.map(waiter => (
              <button
                key={waiter.id}
                onClick={() => setSelectedStaff(waiter)}
                style={{
                  padding: '10px 20px',
                  background: selectedStaff?.id === waiter.id ? '#111827' : '#ffffff',
                  border: selectedStaff?.id === waiter.id ? 'none' : '1px solid #d1d5db',
                  color: selectedStaff?.id === waiter.id ? '#ffffff' : '#111827',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                {waiter.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {selectedStaff && (
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Total Orders</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{stats.total}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Completed</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{stats.completed}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Pending</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{stats.pending}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>Revenue</div>
              <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>₹{stats.revenue.toLocaleString()}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {selectedStaff && (
          <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
              Filter by Status
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    padding: '10px 20px',
                    background: filterStatus === status ? '#111827' : '#ffffff',
                    border: filterStatus === status ? 'none' : '1px solid #d1d5db',
                    color: filterStatus === status ? '#ffffff' : '#111827',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    borderRadius: '6px'
                  }}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Orders List */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
            {selectedStaff ? `Orders for ${selectedStaff.name}` : 'Select a waiter to view orders'}
          </div>
          
          {!selectedStaff ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              Please select a waiter to view their orders
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
              No orders found
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    Order #{order.id.split('-')[1]} {order.token && <span style={{ color: '#2563eb' }}>({order.token})</span>}
                  </span>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Status: <span style={{ fontWeight: '500', color: order.status === 'COMPLETED' ? '#059669' : order.status === 'PENDING' ? '#d97706' : '#f97316' }}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Table: <span style={{ fontWeight: '500', color: '#111827' }}>
                    {order.tableName || 'N/A'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Customer: <span style={{ fontWeight: '500', color: '#111827' }}>
                    {order.customerName || 'Walk-in'}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  Total: <span style={{ fontWeight: '600', color: '#111827' }}>
                    ₹{order.total?.toLocaleString() || 0}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Items:
                </div>
                {order.items && order.items.slice(0, 3).map((item, itemIndex) => (
                  <div key={itemIndex} style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    padding: '4px 0',
                    borderBottom: itemIndex < Math.min(order.items.length - 1, 2) ? '1px solid #e5e7eb' : 'none'
                  }}>
                    {item.name} x {item.qty}
                  </div>
                ))}
                {order.items && order.items.length > 3 && (
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
