import React from 'react';

export default function AggregatorPanel({
  aggregatorOrders,
  onAcceptOrder,
  onRejectOrder,
  onStatusChange,
  onClose,
  screenSize = 'large',
  darkMode = true
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: screenSize === 'small' ? '0' : '16px'
    }}>
      <div style={{
        background: darkMode ? '#0a0a0a' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '12px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: '800px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw',
        maxHeight: screenSize === 'small' ? '100vh' : '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', margin: 0 }}>
            📦 All Aggregator Orders
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: screenSize === 'small' ? '12px 16px' : '8px 12px',
              background: darkMode ? '#111111' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#111111',
              border: 'none',
              borderRadius: screenSize === 'small' ? '8px' : '6px',
              cursor: 'pointer',
              fontSize: screenSize === 'small' ? '24px' : '14px',
              fontWeight: '700',
              minWidth: screenSize === 'small' ? '48px' : 'auto',
              minHeight: screenSize === 'small' ? '48px' : 'auto'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderBottom: `2px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Platform</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Customer</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Items</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Total</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Commission</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: darkMode ? '#888888' : '#64748b', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {aggregatorOrders.map((order, index) => (
                <tr key={order.id} style={{ borderBottom: index < aggregatorOrders.length - 1 ? `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}` : 'none' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: order.platform === 'Zomato' ? '#ef4444' : '#f97316',
                      color: '#ffffff'
                    }}>
                      {order.platform}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#e0e0e0' : '#0a0a0a', fontWeight: '600' }}>{order.orderId}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#888888' : '#64748b' }}>{order.customer}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#888888' : '#64748b', maxWidth: '200px' }}>{order.items}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#e0e0e0' : '#0a0a0a', fontWeight: '600' }}>₹{order.total}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: darkMode ? '#dc2626' : '#ef4444', fontWeight: '600' }}>-₹{order.commission}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      value={order.status}
                      onChange={(e) => onStatusChange(order.id, e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                        background: darkMode ? '#0a0a0a' : '#ffffff',
                        color: darkMode ? '#ffffff' : '#0a0a0a',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="picked_up">Picked Up</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => onAcceptOrder(order.id)}
                        style={{
                          padding: '6px 12px',
                          background: darkMode ? '#059669' : '#10b981',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRejectOrder(order.id)}
                        style={{
                          padding: '6px 12px',
                          background: darkMode ? '#dc2626' : '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
