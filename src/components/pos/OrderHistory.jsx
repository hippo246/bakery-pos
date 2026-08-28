import React, { useState } from 'react';

export default function OrderHistory({
  orders,
  onViewOrder,
  onClose,
  screenSize = 'large',
  darkMode = true
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-desc');

  const filteredOrders = orders
    .filter(order => {
      const matchesSearch = order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          order.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || 
                           (filter === 'completed' && order.status === 'completed') ||
                           (filter === 'pending' && order.status === 'pending');
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sort === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sort === 'amount-desc') return b.total - a.total;
      if (sort === 'amount-asc') return a.total - b.total;
      return 0;
    });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: screenSize === 'small' ? '0' : '16px'
    }}>
      <div style={{
        background: darkMode ? '#1f2937' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '16px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: screenSize === 'small' ? '100vw' : '700px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw',
        maxHeight: screenSize === 'small' ? '100vh' : '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937', margin: 0 }}>
            📋 Order History
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: darkMode ? '#374151' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#1f2937',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '700'
            }}
          >
            ×
          </button>
        </div>

        {/* Search and Filters */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#1f2937',
              fontSize: '14px'
            }}
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              background: darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#1f2937',
              fontSize: '14px'
            }}
          >
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '10px 14px',
              background: darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#1f2937',
              fontSize: '14px'
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

        {/* Orders List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxHeight: 'calc(90vh - 200px)',
          overflow: 'auto'
        }}>
          {filteredOrders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: darkMode ? '#6b7280' : '#9ca3af',
              fontSize: '14px'
            }}>
              No orders found
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                onClick={() => onViewOrder(order)}
                style={{
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#1f2937'
                  }}>
                    {order.invoiceNumber || order.id}
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: darkMode ? '#10b981' : '#059669'
                  }}>
                    ₹{order.total?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: darkMode ? '#8b8b9e' : '#6b7280',
                  marginBottom: '4px'
                }}>
                  {order.customerName || 'Walk-in'}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: darkMode ? '#6b7280' : '#9ca3af'
                }}>
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
