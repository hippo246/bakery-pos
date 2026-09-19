import React from 'react';

export default function QROrdersPanel({
  qrOrders,
  onProcessPayment,
  onDismiss,
  screenSize = 'large',
  darkMode = true
}) {
  if (qrOrders.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: darkMode ? '#6b7280' : '#9ca3af',
        fontSize: '14px'
      }}>
        No QR orders pending
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
      {qrOrders.map(order => (
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
                color: darkMode ? '#ffffff' : '#0a0a0a',
                marginBottom: '4px'
              }}>
                {order.customerName || 'Walk-in'}
              </div>
              <div style={{
                fontSize: '12px',
                color: darkMode ? '#888888' : '#6b7280'
              }}>
                Table: {order.tableName || 'Counter'}
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
            {order.items.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '4px' }}>
                {item.name} x{item.quantity}
              </div>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={() => onProcessPayment(order)}
              style={{
                flex: 1,
                padding: '10px',
                background: darkMode ? '#059669' : '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Accept Payment
            </button>
            <button
              onClick={() => onDismiss(order.id)}
              style={{
                padding: '10px 16px',
                background: darkMode ? '#111111' : '#f3f4f6',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
