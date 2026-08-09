/**
 * Classic POS Cart Table
 * 
 * Table displaying cart items with columns: Code | Description | Qty | Price | Disc | Amount | Action (Delete)
 * Supports row highlighting for selected items with teal selection banner.
 */

export default function CartTable({ cartItems, selectedItemId, onSelectItem, onDeleteItem, onQuantityChange }) {
  const containerStyle = {
    background: '#1E1E1E',
    border: '1px solid #333333',
    borderRadius: '6px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 60px 80px 60px 90px 60px',
    gap: '8px',
    padding: '10px 12px',
    background: '#2A2A2A',
    borderBottom: '2px solid #444444',
    fontSize: '11px',
    fontWeight: '700',
    color: '#ffffff',
    textTransform: 'uppercase',
  };

  const rowStyle = (isSelected) => ({
    display: 'grid',
    gridTemplateColumns: '80px 1fr 60px 80px 60px 90px 60px',
    gap: '8px',
    padding: '8px 12px',
    background: isSelected ? '#0D9488' : '#252525',
    borderBottom: '1px solid #333333',
    fontSize: '12px',
    color: '#ffffff',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const cellStyle = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const priceStyle = {
    color: '#38EF7D',
    fontWeight: '600',
  };

  const deleteButtonStyle = {
    background: '#DC2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const qtyInputStyle = {
    width: '50px',
    padding: '4px 6px',
    borderRadius: '4px',
    border: '1px solid #444444',
    background: '#1E1E1E',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
  };

  const handleRowClick = (item) => {
    if (onSelectItem) {
      onSelectItem(item.id);
    }
  };

  const handleDeleteClick = (e, itemId) => {
    e.stopPropagation();
    if (onDeleteItem) {
      onDeleteItem(itemId);
    }
  };

  const handleQtyChange = (e, itemId) => {
    e.stopPropagation();
    const newQty = parseInt(e.target.value) || 0;
    if (onQuantityChange && newQty > 0) {
      onQuantityChange(itemId, newQty);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={cellStyle}>Code</div>
        <div style={cellStyle}>Description</div>
        <div style={cellStyle}>Qty</div>
        <div style={cellStyle}>Price</div>
        <div style={cellStyle}>Disc</div>
        <div style={cellStyle}>Amount</div>
        <div style={cellStyle}>Action</div>
      </div>

      {/* Rows */}
      <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
        {cartItems.length === 0 ? (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#666666', 
            fontSize: '13px',
            fontWeight: '600' 
          }}>
            Cart is empty
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.id}
              style={rowStyle(selectedItemId === item.id)}
              onClick={() => handleRowClick(item)}
              onMouseEnter={(e) => {
                if (selectedItemId !== item.id) {
                  e.currentTarget.style.background = '#2A2A2A';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedItemId !== item.id) {
                  e.currentTarget.style.background = '#252525';
                }
              }}
            >
              <div style={cellStyle}>{item.code}</div>
              <div style={cellStyle}>{item.name}</div>
              <div>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => handleQtyChange(e, item.id)}
                  style={qtyInputStyle}
                  min="1"
                />
              </div>
              <div style={{ ...cellStyle, ...priceStyle }}>₹{Number(item.price).toFixed(2)}</div>
              <div style={cellStyle}>{item.discount > 0 ? `₹${item.discount.toFixed(2)}` : '-'}</div>
              <div style={{ ...cellStyle, ...priceStyle, fontWeight: '700' }}>₹{Number(item.amount).toFixed(2)}</div>
              <div>
                <button
                  style={deleteButtonStyle}
                  onClick={(e) => handleDeleteClick(e, item.id)}
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
          ))
        )}
      </div>
    </div>
  );
}
