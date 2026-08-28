import React from 'react';

export default function HeldOrdersPanel({
  heldOrders,
  onResumeOrder,
  onDeleteOrder,
  onClose,
  screenSize = 'large',
  darkMode = true
}) {
  if (heldOrders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: darkMode ? '#6b7280' : '#9ca3af',
        fontSize: '14px'
      }}>
        No held orders
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      {heldOrders.map(order => (
        <div
          key={order.id}
          style={{
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: '16px'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#ffffff' : '#1f2937',
                marginBottom: '4px'
              }}>
                {order.name || 'Unnamed Order'}
              </div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#8b8b9e' : '#6b7280'
              }}>
                {new Date(order.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: darkMode ? '#10b981' : '#059669'
            }}>
              ₹{order.total.toFixed(2)}
            </div>
          </div>

          <div style={{
            marginBottom: '12px',
            fontSize: '12px',
            color: darkMode ? '#9ca3af' : '#6b7280'
          }}>
            {order.cart.length} items
          </div>

          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => onResumeOrder(order)}
              style={{
                flex: 1,
                padding: '10px',
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Resume
            </button>
            <button
              onClick={() => onDeleteOrder(order.id)}
              style={{
                padding: '10px 16px',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
