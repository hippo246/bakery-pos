/**
 * Classic POS Order History Modal
 * 
 * Popup to display and search completed orders
 * Search by receipt number or order number
 */

import { useState, useEffect } from 'react';

export default function OrderHistoryModal({ orders = [], onRecallOrder, onPrintOrder, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [realOrders, setRealOrders] = useState([]);

  // Load real orders from localStorage if not provided via props
  useEffect(() => {
    if (orders.length === 0) {
      try {
        const storedOrders = localStorage.getItem('cafeos_orders');
        if (storedOrders) {
          const parsedOrders = JSON.parse(storedOrders);
          setRealOrders(parsedOrders);
        }
      } catch (error) {
        console.error('[OrderHistoryModal] Failed to load orders:', error);
      }
    }
  }, [orders]);

  // Use provided orders or loaded orders
  const displayOrders = orders.length > 0 ? orders : realOrders;

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    background: '#1E1E1E',
    border: '2px solid #333333',
    borderRadius: '8px',
    width: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  const headerStyle = {
    background: '#252525',
    padding: '16px 20px',
    borderBottom: '2px solid #333333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  };

  const closeButtonStyle = {
    background: '#DC2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const contentStyle = {
    padding: '16px 20px',
    overflowY: 'auto',
    flex: 1,
  };

  const searchContainerStyle = {
    marginBottom: '16px',
    display: 'flex',
    gap: '8px',
  };

  const searchInputStyle = {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #444444',
    background: '#252525',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  };

  const orderCardStyle = {
    background: '#2A2A2A',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#3A3A3A',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '12px',
    transition: 'all 0.15s ease',
  };

  const orderHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const orderTitleStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
  };

  const orderTimestampStyle = {
    fontSize: '12px',
    color: '#888888',
  };

  const orderDetailsStyle = {
    fontSize: '12px',
    color: '#cccccc',
    marginBottom: '8px',
  };

  const orderSummaryStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: '#38EF7D',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  };

  const printButtonStyle = {
    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const recallButtonStyle = {
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#888888',
    fontSize: '14px',
  };

  // Filter orders based on search query (receipt number or order number)
  const filteredOrders = displayOrders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.receiptNumber?.toLowerCase().includes(query) ||
      order.orderNumber?.toLowerCase().includes(query) ||
      order.id?.toLowerCase().includes(query) ||
      order.billNo?.toLowerCase().includes(query)
    );
  });

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Order History ({filteredOrders.length})</span>
          <button style={closeButtonStyle} onClick={onClose}>Close</button>
        </div>
        <div style={contentStyle}>
          <div style={searchContainerStyle}>
            <input
              type="text"
              placeholder="Search by receipt number or order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          
          {filteredOrders.length === 0 ? (
            <div style={emptyStateStyle}>
              {searchQuery ? 'No orders found matching your search' : 'No order history available'}
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                style={orderCardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3A3A3A';
                  e.currentTarget.style.borderColor = '#4A4A4A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2A2A2A';
                  e.currentTarget.style.borderColor = '#3A3A3A';
                }}
              >
                <div style={orderHeaderStyle}>
                  <span style={orderTitleStyle}>
                    Receipt: {order.receiptNumber || `#${order.id?.slice(0, 8)}`}
                  </span>
                  <span style={orderTimestampStyle}>{order.timestamp}</span>
                </div>
                <div style={orderDetailsStyle}>
                  Order #: {order.orderNumber || 'N/A'} | 
                  Items: {order.items?.length || 0} | 
                  Customer: {order.customer || 'Walk-in'} | 
                  Table: {order.table || 'N/A'}
                </div>
                <div style={orderDetailsStyle}>
                  Payment: {order.paymentMethod || 'N/A'} | 
                  Status: <span style={{ color: order.status === 'completed' ? '#38EF7D' : '#F59E0B' }}>
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div style={orderSummaryStyle}>
                  Total: ₹{order.total?.toFixed(2) || order.netAmount?.toFixed(2) || '0.00'}
                </div>
                <div style={buttonContainerStyle}>
                  <button
                    style={printButtonStyle}
                    onClick={() => onPrintOrder?.(order)}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)';
                    }}
                  >
                    Print
                  </button>
                  <button
                    style={recallButtonStyle}
                    onClick={() => onRecallOrder?.(order)}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';
                    }}
                  >
                    Recall
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
