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
    background: 'var(--classic-pos-summary-bg)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    border: '1px solid var(--classic-pos-summary-border)',
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
    color: 'var(--classic-pos-summary-label)',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
  };

  const valueStyle = {
    color: 'var(--classic-pos-summary-value)',
    fontSize: '13px',
    fontWeight: '700',
  };

  const netAmountBoxStyle = {
    background: 'var(--classic-pos-summary-net-bg)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 8px var(--classic-pos-summary-net-glow)',
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
      <div style={rowStyle}>
        <span style={labelStyle}>Total Items</span>
        <span style={valueStyle}>{totalItems}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Total Qty</span>
        <span style={valueStyle}>{totalQty}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Sub Total</span>
        <span style={valueStyle}>₹{Number(subTotal).toFixed(2)}</span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Bill Disc</span>
        <span style={{ ...valueStyle, color: billDiscount > 0 ? 'var(--classic-pos-delete-btn-bg)' : 'var(--classic-pos-summary-value)' }}>
          {billDiscount > 0 ? `-₹${Number(billDiscount).toFixed(2)}` : '₹0.00'}
        </span>
      </div>

      <div style={rowStyle}>
        <span style={labelStyle}>Total GST</span>
        <span style={valueStyle}>₹{Number(totalGST).toFixed(2)}</span>
      </div>

      <div style={netAmountBoxStyle}>
        <span style={netAmountLabelStyle}>Net Amount</span>
        <span style={netAmountValueStyle}>₹{Number(netAmount).toFixed(2)}</span>
      </div>
    </div>
  );
}
