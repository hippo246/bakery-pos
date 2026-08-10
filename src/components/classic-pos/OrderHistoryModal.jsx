import { useState, useEffect } from 'react';

export default function OrderHistoryModal({ orders = [], onRecallOrder, onPrintOrder, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [realOrders, setRealOrders] = useState([]);

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
    background: 'var(--classic-pos-modal-bg)',
    border: '2px solid var(--classic-pos-modal-border)',
    borderRadius: '8px',
    width: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  const headerStyle = {
    background: 'var(--classic-pos-modal-header-bg)',
    padding: '16px 20px',
    borderBottom: '2px solid var(--classic-pos-modal-header-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--classic-pos-name-color)',
  };

  const closeButtonStyle = {
    background: 'var(--classic-pos-close-btn-bg)',
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
    border: '1px solid var(--classic-pos-input-border)',
    background: 'var(--classic-pos-input-bg)',
    color: 'var(--classic-pos-name-color)',
    fontSize: '14px',
    outline: 'none',
  };

  const orderCardStyle = {
    background: 'var(--classic-pos-card-bg)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--classic-pos-card-border)',
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
    color: 'var(--classic-pos-name-color)',
  };

  const orderTimestampStyle = {
    fontSize: '12px',
    color: 'var(--classic-pos-code-color)',
  };

  const orderDetailsStyle = {
    fontSize: '12px',
    color: 'var(--classic-pos-detail-text)',
    marginBottom: '8px',
  };

  const orderSummaryStyle = {
    fontSize: '13px',
    fontWeight: '700',
    color: 'var(--classic-pos-price-color)',
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  };

  const printButtonStyle = {
    background: 'var(--classic-pos-print-btn-bg)',
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
    background: 'var(--classic-pos-recall-btn-bg)',
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
    color: 'var(--classic-pos-code-color)',
    fontSize: '14px',
  };

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
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-close-btn-hover)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-close-btn-bg)'; }}
          >
            Close
          </button>
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
                  e.currentTarget.style.background = 'var(--classic-pos-card-bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--classic-pos-card-border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--classic-pos-card-bg)';
                  e.currentTarget.style.borderColor = 'var(--classic-pos-card-border)';
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
                  Status: <span style={{ color: order.status === 'completed' ? 'var(--classic-pos-price-color)' : 'var(--classic-pos-status-pending)' }}>
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
                    onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-print-btn-hover)'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-print-btn-bg)'; }}
                  >
                    Print
                  </button>
                  <button
                    style={recallButtonStyle}
                    onClick={() => onRecallOrder?.(order)}
                    onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-recall-btn-hover)'; }}
                    onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-recall-btn-bg)'; }}
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
