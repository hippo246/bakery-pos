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
    background: 'var(--classic-pos-modal-bg)',
    border: '2px solid var(--classic-pos-modal-border)',
    borderRadius: '8px',
    width: '600px',
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

  const recallButtonStyle = {
    flex: 1,
    background: 'var(--classic-pos-recall-btn-bg)',
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
    background: 'var(--classic-pos-delete-btn-bg)',
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
    color: 'var(--classic-pos-code-color)',
    fontSize: '14px',
  };

  if (heldOrders.length === 0) {
    return (
      <div style={modalOverlayStyle} onClick={onClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={headerStyle}>
            <span style={titleStyle}>Held Orders</span>
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
          {heldOrders.map((order, index) => (
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
                  onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-recall-btn-hover)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-recall-btn-bg)'; }}
                >
                  Recall
                </button>
                <button
                  style={deleteButtonStyle}
                  onClick={() => onDeleteOrder(order.id)}
                  onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-delete-btn-hover)'; }}
                  onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-delete-btn-bg)'; }}
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
