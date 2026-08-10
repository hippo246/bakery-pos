export default function ProductGrid({ items, onItemClick }) {
  const gridContainerStyle = {
    background: 'var(--classic-pos-grid-bg)',
    padding: '8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '6px',
    overflowY: 'auto',
  };

  const tileStyle = {
    background: 'var(--classic-pos-tile-bg)',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--classic-pos-tile-border)',
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
    color: 'var(--classic-pos-price-color)',
    marginBottom: '8px',
  };

  const codeStyle = {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--classic-pos-code-color)',
    marginBottom: '4px',
    textTransform: 'uppercase',
  };

  const nameStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--classic-pos-name-color)',
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
            e.currentTarget.style.background = 'var(--classic-pos-tile-bg-hover)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            e.currentTarget.style.borderColor = 'var(--classic-pos-tile-border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--classic-pos-tile-bg)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = 'var(--classic-pos-tile-border)';
          }}
        >
          <div style={priceStyle}>₹{Number(item.price || 0).toFixed(2)}</div>
          {item.code && <div style={codeStyle}>{item.code}</div>}
          <div style={nameStyle}>{item.name}</div>
        </div>
      ))}
    </div>
  );
}
