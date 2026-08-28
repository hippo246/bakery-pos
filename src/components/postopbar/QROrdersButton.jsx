import React from 'react';

export default function QROrdersButton({
  qrOrders,
  onClick,
  screenSize = 'large',
  darkMode = true
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: screenSize === 'small' ? '10px 14px' : '6px 12px',
        background: (qrOrders || []).length > 0 ? '#10b981' : (darkMode ? '#333' : '#f3f4f6'),
        color: (qrOrders || []).length > 0 ? '#ffffff' : (darkMode ? '#9ca3af' : '#6b7280'),
        border: `1px solid ${darkMode ? '#444' : '#e5e7eb'}`,
        borderRadius: screenSize === 'small' ? '8px' : '4px',
        fontSize: screenSize === 'small' ? '13px' : '11px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '600',
        minHeight: screenSize === 'small' ? '44px' : 'auto'
      }}
    >
      <span style={{ fontSize: screenSize === 'small' ? '16px' : '14px' }}>📱</span>
      {screenSize !== 'small' && <span>QR Orders</span>}
      {(qrOrders || []).length > 0 && (
        <span style={{
          background: '#ffffff',
          color: '#10b981',
          padding: screenSize === 'small' ? '4px 8px' : '1px 6px',
          borderRadius: '10px',
          fontSize: screenSize === 'small' ? '12px' : '10px',
          fontWeight: '700'
        }}>
          {(qrOrders || []).length}
        </span>
      )}
    </button>
  );
}
