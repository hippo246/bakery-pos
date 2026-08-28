import React, { useRef, useEffect } from 'react';

export default function AggregatorDropdown({
  show,
  onClose,
  aggregatorOrders,
  onViewAll,
  onAcceptOrder,
  onRejectOrder,
  screenSize = 'large',
  darkMode = true
}) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!show) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [show, onClose]);

  if (!show) return null;

  const pendingOrders = (aggregatorOrders || []).filter(o => o && o.status === 'pending');

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        background: darkMode ? '#2a2a2a' : '#ffffff',
        border: `1px solid ${darkMode ? '#444' : '#e5e7eb'}`,
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        zIndex: 4000,
        minWidth: screenSize === 'small' ? '280px' : '400px',
        maxWidth: screenSize === 'small' ? '90vw' : '500px',
        maxHeight: screenSize === 'small' ? '400px' : '500px',
        overflow: 'auto'
      }}
    >
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${darkMode ? '#444' : '#e5e7eb'}`,
        background: darkMode ? '#333' : '#f9fafb',
        fontSize: '13px',
        fontWeight: '700',
        color: darkMode ? '#fff' : '#1e293b',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>📦 Aggregator Orders</span>
        <button
          onClick={onViewAll}
          style={{
            padding: '4px 8px',
            background: '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          View All
        </button>
      </div>

      {pendingOrders.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#999' : '#9ca3af' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '13px' }}>No pending orders</div>
        </div>
      ) : (
        pendingOrders.map(order => (
          <div
            key={order.id}
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${darkMode ? '#444' : '#e5e7eb'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: darkMode ? '#fff' : '#1e293b',
                marginBottom: '4px'
              }}>
                {order.platform} - {order.orderId}
              </div>
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#999' : '#6b7280'
              }}>
                {order.customer} • ₹{order.total}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => onAcceptOrder(order.id)}
                style={{
                  padding: '6px 10px',
                  background: '#10b981',
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
                  padding: '6px 10px',
                  background: '#ef4444',
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
          </div>
        ))
      )}
    </div>
  );
}
