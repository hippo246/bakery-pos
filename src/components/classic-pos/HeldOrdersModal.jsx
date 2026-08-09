/**
 * Classic POS Held Orders Modal
 * 
 * Popup to display and manage held orders
 * Shows order details with ability to recall or delete
 */

export default function HeldOrdersModal({ heldOrders, onRecallOrder, onDeleteOrder, onClose }) {
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
    width: '600px',
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

  const recallButtonStyle = {
    flex: 1,
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const deleteButtonStyle = {
    background: '#DC2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '12px',
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

  if (heldOrders.length === 0) {
    return (
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            <span style={titleStyle}>Held Orders</span>
            <button style={closeButtonStyle} onClick={onClose}>Close</button>
          </div>
          <div style={contentStyle}>
            <div style={emptyStateStyle}>No held orders</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Held Orders ({heldOrders.length})</span>
          <button style={closeButtonStyle} onClick={onClose}>Close</button>
        </div>
        <div style={contentStyle}>
          {heldOrders.map((order, index) => (
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
                <span style={orderTitleStyle}>Order #{heldOrders.length - index}</span>
                <span style={orderTimestampStyle}>{order.timestamp}</span>
              </div>
              <div style={orderDetailsStyle}>
                Items: {order.items.length} | 
                Customer: {order.customer || 'Walk-in'} | 
                Table: {order.table || 'N/A'}
              </div>
              <div style={orderSummaryStyle}>
                Total: ₹{order.summary.netAmount.toFixed(2)}
              </div>
              <div style={buttonContainerStyle}>
                <button
                  style={recallButtonStyle}
                  onClick={() => onRecallOrder(order)}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';
                  }}
                >
                  Recall
                </button>
                <button
                  style={deleteButtonStyle}
                  onClick={() => onDeleteOrder(order.id)}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#DC2626';
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
