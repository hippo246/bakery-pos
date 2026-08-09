/**
 * Classic POS Order Summary Panel
 * 
 * Light grey/blue panel background with crisp blue values.
 * Displays: Total Items, Total Qty, Sub Total, Bill Disc, Total GST
 * Large emerald green "Net Amount" box at bottom.
 */

export default function OrderSummaryPanel({ summary }) {
  const {
    totalItems = 0,
    totalQty = 0,
    subTotal = 0,
    billDiscount = 0,
    totalGST = 0,
    netAmount = 0,
  } = summary;

  const containerStyle = {
    background: '#EBF8FF',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid #BEE3F8',
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 8px',
    fontSize: '12px',
    fontWeight: '600',
  };

  const labelStyle = {
    color: '#4A5568',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  };

  const valueStyle = {
    color: '#2B6CB0',
    fontSize: '13px',
    fontWeight: '700',
  };

  const netAmountBoxStyle = {
    background: '#22C55E',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px rgba(34, 197, 94, 0.3)',
  };

  const netAmountLabelStyle = {
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: '4px',
  };

  const netAmountValueStyle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '800',
  };

  return (
    <div style={containerStyle}>
      {/* Total Items */}
      <div style={rowStyle}>
        <span style={labelStyle}>Total Items</span>
        <span style={valueStyle}>{totalItems}</span>
      </div>

      {/* Total Qty */}
      <div style={rowStyle}>
        <span style={labelStyle}>Total Qty</span>
        <span style={valueStyle}>{totalQty}</span>
      </div>

      {/* Sub Total */}
      <div style={rowStyle}>
        <span style={labelStyle}>Sub Total</span>
        <span style={valueStyle}>₹{Number(subTotal).toFixed(2)}</span>
      </div>

      {/* Bill Discount */}
      <div style={rowStyle}>
        <span style={labelStyle}>Bill Disc</span>
        <span style={{ ...valueStyle, color: billDiscount > 0 ? '#DC2626' : '#2B6CB0' }}>
          {billDiscount > 0 ? `-₹${Number(billDiscount).toFixed(2)}` : '₹0.00'}
        </span>
      </div>

      {/* Total GST */}
      <div style={rowStyle}>
        <span style={labelStyle}>Total GST</span>
        <span style={valueStyle}>₹{Number(totalGST).toFixed(2)}</span>
      </div>

      {/* Net Amount Box */}
      <div style={netAmountBoxStyle}>
        <span style={netAmountLabelStyle}>Net Amount</span>
        <span style={netAmountValueStyle}>₹{Number(netAmount).toFixed(2)}</span>
      </div>
    </div>
  );
}
