/**
 * Classic POS Product Grid
 * 
 * Dark background with item cards using dark charcoal fill and green accent price text.
 * Price at top left, item title in all caps white bold font in center.
 * Responsive multi-column grid (4 to 6 columns).
 */

export default function ProductGrid({ items, onItemClick }) {
  const gridContainerStyle = {
    background: '#121212',
    padding: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '6px',
    overflowY: 'auto',
  };

  const tileStyle = {
    background: '#2A2A2A',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#3A3A3A',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minHeight: '120px',
    position: 'relative',
  };

  const priceStyle = {
    fontSize: '16px',
    fontWeight: '700',
    color: '#38EF7D',
    marginBottom: '8px',
  };

  const nameStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'left',
    textTransform: 'uppercase',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    flex: 1,
  };

  return (
    <div style={gridContainerStyle}>
      {items.map((item, index) => (
        <div
          key={item.id || index}
          style={tileStyle}
          onClick={() => onItemClick?.(item)}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#3A3A3A';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
            e.currentTarget.style.borderColor = '#4A4A4A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#2A2A2A';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#3A3A3A';
          }}
        >
          <div style={priceStyle}>₹{Number(item.price || 0).toFixed(2)}</div>
          <div style={nameStyle}>{item.name}</div>
        </div>
      ))}
    </div>
  );
}
