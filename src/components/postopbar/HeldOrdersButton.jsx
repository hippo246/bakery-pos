import React from 'react';

export default function HeldOrdersButton({
  heldOrders,
  onClick,
  screenSize = 'large',
  darkMode = true
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: screenSize === 'small' ? '10px 14px' : '6px 12px',
        background: (heldOrders || []).length > 0 ? '#8b5cf6' : (darkMode ? '#333' : '#f3f4f6'),
        color: (heldOrders || []).length > 0 ? '#ffffff' : (darkMode ? '#9ca3af' : '#6b7280'),
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
      <span style={{ fontSize: screenSize === 'small' ? '16px' : '14px' }}>⏸️</span>
      {screenSize !== 'small' && <span>Held Orders</span>}
      {(heldOrders || []).length > 0 && (
        <span style={{
          background: '#ffffff',
          color: '#8b5cf6',
          padding: screenSize === 'small' ? '4px 8px' : '1px 6px',
          borderRadius: '10px',
          fontSize: screenSize === 'small' ? '12px' : '10px',
          fontWeight: '700'
        }}>
          {(heldOrders || []).length}
        </span>
      )}
    </button>
  );
}
