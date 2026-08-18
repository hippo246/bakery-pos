import React, { useState, useEffect } from 'react';

export default function TokenManagement({ orders, onNavigate }) {
  const [displayMode, setDisplayMode] = useState('display'); // 'display' or 'history'

  // Filter orders that have tokens
  const tokens = orders.filter(order => order.token).sort((a, b) => {
    // Sort by token number (extract numeric part)
    const aNum = parseInt(a.token.replace('T-', ''));
    const bNum = parseInt(b.token.replace('T-', ''));
    return aNum - bNum;
  });

  // Statistics
  const pendingTokens = tokens.filter(t => t.status === 'PENDING').length;
  const preparingTokens = tokens.filter(t => t.status === 'PREPARING').length;
  const readyTokens = tokens.filter(t => t.status === 'READY').length;
  const completedToday = tokens.filter(t => t.status === 'COMPLETED' && new Date(t.createdAt).toDateString() === new Date().toDateString()).length;

  const updateOrderStatus = (orderId, newStatus) => {
    // This would need to be passed in as a prop or handled through a state management system
    console.log('Update order status:', orderId, newStatus);
  };

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
              Token Display
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
              Active order tokens
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('orders')}
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
      <div style={{ flex: 1, padding: '24px', overflow: 'auto', background: '#f9fafb' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: 1,
            minWidth: '200px',
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Pending
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#f59e0b' }}>
              {pendingTokens}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: '200px',
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Preparing
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6' }}>
              {preparingTokens}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: '200px',
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Ready
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>
              {readyTokens}
            </div>
          </div>
          <div style={{
            flex: 1,
            minWidth: '200px',
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
              Completed Today
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#6b7280' }}>
              {completedToday}
            </div>
          </div>
        </div>

        {/* Token List */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
              Active Tokens
            </div>
          </div>
          {tokens.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No active tokens
            </div>
          ) : (
            <div>
              {tokens.map(token => (
                <div
                  key={token.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: token.status === 'PENDING' ? '#fef3c7' : token.status === 'PREPARING' ? '#dbeafe' : token.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: '700',
                      color: token.status === 'PENDING' ? '#92400e' : token.status === 'PREPARING' ? '#1e40af' : token.status === 'READY' ? '#065f46' : '#374151'
                    }}>
                      {token.token}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                        {token.customerName || 'Walk-in'}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        {token.items?.length || 0} items • ₹{token.total?.toFixed(2) || '0.00'}
                      </div>
                      {token.tableNumber && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          Table: {token.tableNumber}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: token.status === 'PENDING' ? '#fef3c7' : token.status === 'PREPARING' ? '#dbeafe' : token.status === 'READY' ? '#d1fae5' : '#f3f4f6',
                      color: token.status === 'PENDING' ? '#92400e' : token.status === 'PREPARING' ? '#1e40af' : token.status === 'READY' ? '#065f46' : '#374151'
                    }}>
                      {token.status}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                      {new Date(token.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
