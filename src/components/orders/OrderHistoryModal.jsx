import React, { useState, useEffect } from 'react';

export default function OrderHistoryModal({
  show,
  onClose,
  orders,
  orderCardColumns,
  setOrderCardColumns,
  onEditOrder,
  onViewOrder,
  onCancelOrder,
  onPrintOrder,
  darkMode
}) {
  const [showOrderCardSettings, setShowOrderCardSettings] = useState(false);
  const [orderHistorySearch, setOrderHistorySearch] = useState('');
  const [orderHistoryFilter, setOrderHistoryFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(orderHistorySearch.toLowerCase()) ||
                        order.customerName?.toLowerCase().includes(orderHistorySearch.toLowerCase());
    const matchesFilter = orderHistoryFilter === 'all' || 
                         (orderHistoryFilter === 'completed' && order.status === 'completed') ||
                         (orderHistoryFilter === 'pending' && order.status === 'pending') ||
                         (orderHistoryFilter === 'cancelled' && order.status === 'CANCELLED');
    return matchesSearch && matchesFilter;
  });

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5000
    }}>
      <div style={{
        background: darkMode ? '#0a0a0a' : '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: `1px solid ${darkMode ? '#111111' : '#e5e7eb'}`
      }}>
        {/* Header */}
        <div style={{
          background: darkMode ? '#0a0a0a' : '#f9fafb',
          padding: '20px 24px',
          borderBottom: `1px solid ${darkMode ? '#111111' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#f3f4f6' : '#0a0a0a', marginBottom: '4px' }}>
              📋 Order History
            </div>
            <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              {orders.length} orders total
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowOrderCardSettings(!showOrderCardSettings)}
              style={{
                background: showOrderCardSettings ? '#3b82f6' : (darkMode ? '#111111' : '#f3f4f6'),
                border: 'none',
                color: showOrderCardSettings ? '#ffffff' : (darkMode ? '#f3f4f6' : '#6b7280'),
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = showOrderCardSettings ? '#2563eb' : (darkMode ? '#222222' : '#e5e7eb')}
              onMouseLeave={(e) => e.target.style.background = showOrderCardSettings ? '#3b82f6' : (darkMode ? '#111111' : '#f3f4f6')}
            >
              🔧 Columns
            </button>
            <button
              onClick={onClose}
              style={{
                background: darkMode ? '#111111' : '#f3f4f6',
                border: 'none',
                color: darkMode ? '#f3f4f6' : '#6b7280',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = darkMode ? '#222222' : '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.background = darkMode ? '#111111' : '#f3f4f6'}
            >
              ×
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${darkMode ? '#111111' : '#e5e7eb'}`,
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <input
            type="text"
            placeholder="Search orders..."
            value={orderHistorySearch}
            onChange={(e) => setOrderHistorySearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px 14px',
              background: darkMode ? '#111111' : '#f9fafb',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '8px',
              color: darkMode ? '#f3f4f6' : '#0a0a0a',
              fontSize: '14px'
            }}
          />
          <select
            value={orderHistoryFilter}
            onChange={(e) => setOrderHistoryFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              background: darkMode ? '#111111' : '#f9fafb',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '8px',
              color: darkMode ? '#f3f4f6' : '#0a0a0a',
              fontSize: '14px'
            }}
          >
            <option value="all">All Orders</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Column Settings Panel */}
        {showOrderCardSettings && (
          <div style={{
            padding: '16px 24px',
            background: darkMode ? '#0a0a0a' : '#f0f9ff',
            borderBottom: `1px solid ${darkMode ? '#111111' : '#bae6fd'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: darkMode ? '#f3f4f6' : '#0c4a6e', marginBottom: '8px' }}>
              Configure Order Card Columns
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {orderCardColumns.map((column) => (
                <div key={column.id} style={{
                  padding: '12px',
                  background: darkMode ? '#111111' : '#ffffff',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#222222' : '#bae6fd'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <input
                    type="checkbox"
                    checked={column.enabled}
                    onChange={(e) => {
                      setOrderCardColumns(prev => 
                        prev.map(c => c.id === column.id ? { ...c, enabled: e.target.checked } : c)
                      );
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ flex: 1, fontSize: '13px', color: darkMode ? '#f3f4f6' : '#0c4a6e', fontWeight: '500' }}>
                    {column.label}
                  </span>
                  <button
                    onClick={() => {
                      const newPosition = column.position > 1 ? column.position - 1 : column.position;
                      setOrderCardColumns(prev => {
                        const updated = prev.map(c => 
                          c.position === newPosition ? { ...c, position: column.position }
                          : c.id === column.id ? { ...c, position: newPosition }
                          : c
                        );
                        return updated.sort((a, b) => a.position - b.position);
                      });
                    }}
                    disabled={column.position === 1}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid',
                      background: darkMode ? '#111111' : '#f0f9ff',
                      color: darkMode ? '#f3f4f6' : '#0c4a6e',
                      cursor: column.position === 1 ? 'not-allowed' : 'pointer',
                      opacity: column.position === 1 ? 0.5 : 1,
                      fontSize: '12px'
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => {
                      const newPosition = column.position < orderCardColumns.length ? column.position + 1 : column.position;
                      setOrderCardColumns(prev => {
                        const updated = prev.map(c => 
                          c.position === newPosition ? { ...c, position: column.position }
                          : c.id === column.id ? { ...c, position: newPosition }
                          : c
                        );
                        return updated.sort((a, b) => a.position - b.position);
                      });
                    }}
                    disabled={column.position === orderCardColumns.length}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid',
                      background: darkMode ? '#111111' : '#f0f9ff',
                      color: darkMode ? '#f3f4f6' : '#0c4a6e',
                      cursor: column.position === orderCardColumns.length ? 'not-allowed' : 'pointer',
                      opacity: column.position === orderCardColumns.length ? 0.5 : 1,
                      fontSize: '12px'
                    }}
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setOrderCardColumns([
                    { id: 'table', label: 'Table', enabled: true, position: 1 },
                    { id: 'time', label: 'Time', enabled: true, position: 2 },
                    { id: 'customer', label: 'Customer', enabled: true, position: 3 },
                    { id: 'categories', label: 'Categories', enabled: true, position: 4 },
                    { id: 'items', label: 'Items', enabled: true, position: 5 },
                    { id: 'total', label: 'Total', enabled: true, position: 6 },
                    { id: 'status', label: 'Status', enabled: true, position: 7 },
                  ]);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid',
                  background: darkMode ? '#111111' : '#ffffff',
                  color: darkMode ? '#f3f4f6' : '#0c4a6e',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                Reset to Default
              </button>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div style={{ padding: '16px 24px', overflowY: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
          {filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>No orders found</div>
              <div style={{ fontSize: '13px' }}>Try adjusting your search or filters</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredOrders.map(order => {
                const orderAge = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                const ageText = orderAge < 1 ? 'Just now' : orderAge < 60 ? `${orderAge}m ago` : `${Math.floor(orderAge / 60)}h ago`;
                const customerInitials = order.customerName 
                  ? order.customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : 'W';
                
                // Calculate category breakdown
                const categoryBreakdown = order.items?.reduce((acc, item) => {
                  const cat = item.category || 'Other';
                  acc[cat] = (acc[cat] || 0) + (item.quantity || item.qty || 1);
                  return acc;
                }, {}) || {};
                
                const enabledColumns = orderCardColumns.filter(c => c.enabled).sort((a, b) => a.position - b.position);
                
                return (
                <div
                  key={order.id}
                  style={{
                    background: darkMode ? '#111111' : '#ffffff',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    borderRadius: '12px',
                    padding: '0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderLeft: order.isQROrder ? '4px solid #3b82f6' : '4px solid transparent',
                    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  {/* Configurable Column Layout */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: enabledColumns.map(() => '1fr').join(' '),
                    gap: '8px',
                    padding: '12px 16px',
                    background: darkMode ? '#1a1a1a' : '#f8fafc',
                    borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                  }}>
                    {enabledColumns.map(column => {
                      switch(column.id) {
                        case 'table':
                          return (
                            <div key={column.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {order.tableName ? (
                                <div style={{
                                  padding: '6px 14px',
                                  background: '#3b82f6',
                                  color: '#ffffff',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: '700',
                                  letterSpacing: '0.5px',
                                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                                }}>
                                  {order.tableName}
                                </div>
                              ) : (
                                <div style={{
                                  padding: '6px 14px',
                                  background: darkMode ? '#374151' : '#9ca3af',
                                  color: '#ffffff',
                                  borderRadius: '8px',
                                  fontSize: '13px',
                                  fontWeight: '600'
                                }}>
                                  Counter
                                </div>
                              )}
                              {order.isQROrder && (
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  background: '#3b82f6',
                                  color: '#ffffff',
                                  textTransform: 'uppercase'
                                }}>
                                  QR
                                </span>
                              )}
                            </div>
                          );
                        case 'time':
                          return (
                            <div key={column.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                fontSize: '12px',
                                color: darkMode ? '#9ca3af' : '#6b7280',
                                fontWeight: '500'
                              }}>
                                {new Date(order.createdAt).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11px',
                                fontWeight: '600',
                                background: orderAge < 5 ? '#10b981' : orderAge < 15 ? '#f59e0b' : '#ef4444',
                                color: '#ffffff'
                              }}>
                                {ageText}
                              </div>
                            </div>
                          );
                        case 'customer':
                          return (
                            <div key={column.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, #3b82f6, #8b5cf6)`,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: '700',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                              }}>
                                {customerInitials}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: darkMode ? '#f3f4f6' : '#0a0a0a',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {order.customerName || 'Walk-in Customer'}
                              </div>
                            </div>
                          );
                        case 'categories':
                          return (
                            <div key={column.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {Object.entries(categoryBreakdown).map(([cat, count]) => (
                                <span key={cat} style={{
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  background: darkMode ? '#222222' : '#e5e7eb',
                                  color: darkMode ? '#f3f4f6' : '#0a0a0a'
                                }}>
                                  {cat}: {count}
                                </span>
                              ))}
                            </div>
                          );
                        case 'items':
                          return (
                            <div key={column.id} style={{
                              fontSize: '13px',
                              color: darkMode ? '#9ca3af' : '#6b7280',
                              fontWeight: '500'
                            }}>
                              {order.items?.length || 0} items
                            </div>
                          );
                        case 'total':
                          return (
                            <div key={column.id} style={{
                              fontSize: '18px',
                              fontWeight: '800',
                              color: '#10b981',
                              fontFamily: 'monospace'
                            }}>
                              ₹{order.total?.toFixed(2) || '0.00'}
                            </div>
                          );
                        case 'status':
                          return (
                            <div key={column.id} style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              background: order.status === 'completed' ? '#10b981' : 
                                       order.status === 'CANCELLED' ? '#ef4444' :
                                       order.status === 'REFUNDED' ? '#f59e0b' :
                                       '#3b82f6',
                              color: '#ffffff',
                              textAlign: 'center'
                            }}>
                              {order.status || 'PENDING'}
                            </div>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div style={{
                    padding: '12px 16px',
                    background: darkMode ? '#1a1a1a' : '#f8fafc',
                    borderTop: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditOrder(order);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.target.style.background = '#3b82f6'}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewOrder(order);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: darkMode ? '#374151' : '#e5e7eb',
                        color: darkMode ? '#f3f4f6' : '#0a0a0a',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = darkMode ? '#4b5563' : '#d1d5db'}
                      onMouseLeave={(e) => e.target.style.background = darkMode ? '#374151' : '#e5e7eb'}
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintOrder(order);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: darkMode ? '#1f2937' : '#f3f4f6',
                        color: darkMode ? '#f3f4f6' : '#0a0a0a',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.target.style.background = darkMode ? '#374151' : '#e5e7eb'}
                      onMouseLeave={(e) => e.target.style.background = darkMode ? '#1f2937' : '#f3f4f6'}
                    >
                      🖨️ Print
                    </button>
                    {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelOrder(order);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                        onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                      >
                        ❌ Cancel
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: `1px solid ${darkMode ? '#111111' : '#e5e7eb'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: darkMode ? '#0a0a0a' : '#f9fafb'
        }}>
          <div style={{ fontSize: '13px', color: darkMode ? '#9ca3af' : '#6b7280' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
          <button
            onClick={() => {
              console.log('Export orders');
            }}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#059669'}
            onMouseLeave={(e) => e.target.style.background = '#10b981'}
          >
            📥 Export
          </button>
        </div>
      </div>
    </div>
  );
}