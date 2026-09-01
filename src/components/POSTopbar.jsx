import React, { useRef, useEffect } from 'react';

export default function POSTopbar({
  darkMode,
  screenSize,
  qrOrders,
  setShowQrOrdersPanel,
  showAggregatorDropdown,
  setShowAggregatorDropdown,
  aggregatorOrders,
  setShowAggregatorPanel,
  pendingAggregatorOrders,
  handleAcceptAggregatorOrder,
  handleRejectAggregatorOrder,
  heldOrders,
  setShowHeldOrders,
  settings,
  posMode,
  setShowShortcuts,
  searchQuery,
  setSearchQuery,
  setShowSearchResults,
  kdsSyncStatus = 'connected',
  printerStatus = 'online',
  orderHandoffStatus = 'idle'
}) {
  const aggregatorDropdownRef = useRef(null);

  useEffect(() => {
    if (!showAggregatorDropdown) return;
    const handleClickOutside = (e) => {
      if (aggregatorDropdownRef.current && !aggregatorDropdownRef.current.contains(e.target)) {
        setShowAggregatorDropdown(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowAggregatorDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAggregatorDropdown, setShowAggregatorDropdown]);

  return (
    <div style={{
      background: darkMode ? '#0a0a0a' : '#ffffff',
      padding: screenSize === 'small' ? '12px 16px' : '8px 16px',
      borderBottom: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      minHeight: screenSize === 'small' ? '60px' : 'auto',
      position: 'relative',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: screenSize === 'small' ? 'wrap' : 'nowrap', gap: screenSize === 'small' ? '12px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: screenSize === 'small' ? '8px' : '12px' }}>
          <div style={{ 
            fontSize: screenSize === 'small' ? '18px' : '16px', 
            fontWeight: '700', 
            color: '#2563eb',
            letterSpacing: '-0.5px'
          }}>
            POS
          </div>
          {screenSize !== 'small' && (
            <div style={{ 
              fontSize: '10px', 
              color: darkMode ? '#9ca3af' : '#6b7280',
              background: darkMode ? '#222222' : '#f3f4f6',
              padding: '3px 8px',
              borderRadius: '8px'
            }}>
              Advanced Mode
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: screenSize === 'small' ? '6px' : '8px', alignItems: 'center', flexWrap: screenSize === 'small' ? 'wrap' : 'nowrap' }}>
          {/* QR Orders Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('QR Orders button clicked, qrOrders count:', (qrOrders || []).length);
              setShowQrOrdersPanel(true);
            }}
            style={{
              padding: screenSize === 'small' ? '10px 14px' : '6px 12px',
              background: (qrOrders || []).length > 0 ? '#10b981' : (darkMode ? '#222222' : '#f3f4f6'),
              color: (qrOrders || []).length > 0 ? '#ffffff' : (darkMode ? '#9ca3af' : '#6b7280'),
              border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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

          {/* Aggregator Orders Dropdown */}
          <div style={{ position: 'relative' }} ref={aggregatorDropdownRef}>
            <button
              onClick={() => setShowAggregatorDropdown(!showAggregatorDropdown)}
              style={{
                padding: screenSize === 'small' ? '10px 14px' : '6px 12px',
                background: pendingAggregatorOrders > 0 ? '#ef4444' : (darkMode ? '#222222' : '#f3f4f6'),
                color: pendingAggregatorOrders > 0 ? '#ffffff' : (darkMode ? '#9ca3af' : '#6b7280'),
                border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
              <span style={{ fontSize: screenSize === 'small' ? '16px' : '14px' }}>🍔</span>
              {screenSize !== 'small' && <span>Aggregators</span>}
              {pendingAggregatorOrders > 0 && (
                <span style={{
                  background: '#ffffff',
                  color: '#ef4444',
                  padding: screenSize === 'small' ? '4px 8px' : '1px 6px',
                  borderRadius: '10px',
                  fontSize: screenSize === 'small' ? '12px' : '10px',
                  fontWeight: '700'
                }}>
                  {pendingAggregatorOrders}
                </span>
              )}
            </button>

            {/* Aggregator Dropdown */}
            {showAggregatorDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                background: darkMode ? '#0a0a0a' : '#ffffff',
                border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                zIndex: 5000,
                minWidth: screenSize === 'small' ? '280px' : '400px',
                maxWidth: screenSize === 'small' ? '90vw' : '500px',
                maxHeight: screenSize === 'small' ? '400px' : '500px',
                overflow: 'auto'
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                  background: darkMode ? '#222222' : '#f9fafb',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: darkMode ? '#fff' : '#0a0a0a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>📦 Aggregator Orders</span>
                  <button
                    onClick={() => { setShowAggregatorPanel(true); setShowAggregatorDropdown(false); }}
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

                {(aggregatorOrders || []).filter(o => o && o.status === 'pending').length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: darkMode ? '#666666' : '#9ca3af' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                    <div style={{ fontSize: '13px' }}>No pending orders</div>
                  </div>
                ) : (
                  (aggregatorOrders || []).filter(o => o && o.status === 'pending').map(order => (
                    <div key={order.id} style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${darkMode ? '#222222' : '#f3f4f6'}`,
                      background: darkMode ? '#0a0a0a' : '#ffffff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: '600',
                            background: order.platform === 'Zomato' ? '#ef4444' : '#f97316',
                            color: '#ffffff'
                          }}>
                            {order.platform}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: darkMode ? '#fff' : '#0a0a0a' }}>
                            {order.orderId}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: darkMode ? '#666666' : '#6b7280' }}>{order.time}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginBottom: '4px' }}>
                        {order.customer}
                      </div>
                      <div style={{ fontSize: '11px', color: darkMode ? '#666666' : '#9ca3af', marginBottom: '8px' }}>
                        {order.items}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: darkMode ? '#fff' : '#0a0a0a' }}>
                          ₹{order.total}
                        </span>
                        <span style={{ fontSize: '11px', color: '#ef4444' }}>
                          Commission: ₹{order.commission}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleAcceptAggregatorOrder(order.id)}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ✅ Accept
                        </button>
                        <button
                          onClick={() => handleRejectAggregatorOrder(order.id)}
                          style={{
                            flex: 1,
                            padding: '6px 12px',
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Held Orders Button */}
          {settings.enableHoldOrders && (
            <button
              onClick={() => setShowHeldOrders(true)}
              style={{
                padding: screenSize === 'small' ? '10px 14px' : '6px 12px',
                background: (heldOrders || []).length > 0 ? '#8b5cf6' : (darkMode ? '#222222' : '#f3f4f6'),
                color: (heldOrders || []).length > 0 ? '#ffffff' : (darkMode ? '#9ca3af' : '#6b7280'),
                border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
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
              ⏸️ Held Orders
              {(heldOrders || []).length > 0 && (
                <span style={{
                  background: '#ffffff',
                  color: '#8b5cf6',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  {(heldOrders || []).length}
                </span>
              )}
            </button>
          )}

          {/* Operational Status Indicators */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: screenSize === 'small' ? '0' : '12px' }}>
            {/* KDS Sync Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: kdsSyncStatus === 'connected' ? '#10b981' : (kdsSyncStatus === 'syncing' ? '#f59e0b' : '#ef4444'),
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#ffffff'
            }} title="Kitchen Display System Status">
              <span>{kdsSyncStatus === 'connected' ? '📺' : (kdsSyncStatus === 'syncing' ? '🔄' : '❌')}</span>
              {screenSize !== 'small' && <span>KDS</span>}
            </div>
            
            {/* Printer Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: printerStatus === 'online' ? '#10b981' : (printerStatus === 'error' ? '#f59e0b' : '#ef4444'),
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#ffffff'
            }} title="Kitchen Printer Status">
              <span>{printerStatus === 'online' ? '🖨️' : (printerStatus === 'error' ? '⚠️' : '❌')}</span>
              {screenSize !== 'small' && <span>Printer</span>}
            </div>
            
            {/* Order Handoff Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: orderHandoffStatus === 'idle' ? '#6b7280' : (orderHandoffStatus === 'kitchen' ? '#f59e0b' : (orderHandoffStatus === 'ready' ? '#10b981' : '#8b5cf6')),
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
              color: '#ffffff'
            }} title="Order Handoff Status">
              <span>{orderHandoffStatus === 'idle' ? '🔄' : (orderHandoffStatus === 'kitchen' ? '👨‍🍳' : (orderHandoffStatus === 'ready' ? '✅' : '🧾'))}</span>
              {screenSize !== 'small' && <span>{orderHandoffStatus === 'idle' ? 'Idle' : (orderHandoffStatus === 'kitchen' ? 'Kitchen' : (orderHandoffStatus === 'ready' ? 'Ready' : 'Served'))}</span>}
            </div>
          </div>

          {posMode === 'advanced' && (
            <>
              <button
                onClick={() => setShowShortcuts(true)}
                style={{
                  padding: '6px 10px',
                  background: darkMode ? '#222222' : '#f3f4f6',
                  color: darkMode ? '#d1d5db' : '#111111',
                  border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Press F1 for shortcuts"
              >
                ⌨️ Shortcuts
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(e.target.value.length > 0);
                }}
                placeholder="Search..."
                style={{
                  padding: '6px 8px',
                  background: darkMode ? '#0a0a0a' : '#f9fafb',
                  color: darkMode ? '#f3f4f6' : '#0a0a0a',
                  border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                  borderRadius: '4px',
                  fontSize: '11px',
                  width: '150px'
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
