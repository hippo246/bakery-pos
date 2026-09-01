import React, { useMemo } from 'react';

export default function MenuGrid({ 
  menuItems = [], 
  selectedCategory, 
  onAddToCart,
  screenSize = 'large',
  darkMode = true,
  searchQuery = ''
}) {
  const filteredItems = useMemo(() => menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [menuItems, selectedCategory, searchQuery]);

  return (
    <>
      {filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 16px',
          color: darkMode ? '#6b7280' : '#9ca3af',
          fontSize: '14px'
        }}>
          {searchQuery
            ? `No items match "${searchQuery}"`
            : 'No items in this category'}
        </div>
      )}
      <div style={{
      display: 'grid',
      gridTemplateColumns: screenSize === 'small' 
        ? 'repeat(2, 1fr)' 
        : 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: screenSize === 'small' ? '12px' : '16px',
      overflow: 'auto',
      maxHeight: screenSize === 'small' ? 'calc(100vh - 180px)' : 'calc(100vh - 100px)'
    }}>
      {filteredItems.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => item.available !== false && onAddToCart(item)}
          disabled={item.available === false}
          aria-label={`${item.name}, ₹${item.price.toFixed(2)}${item.available === false ? ', sold out' : ''}`}
          style={{
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: screenSize === 'small' ? '12px' : '16px',
            cursor: item.available === false ? 'not-allowed' : 'pointer',
            opacity: item.available === false ? 0.5 : 1,
            transition: 'all 0.2s',
            textAlign: 'left',
            minHeight: screenSize === 'small' ? '120px' : '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            if (item.available === false) return;
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onFocus={(e) => {
            if (item.available === false) return;
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
          }}
          onTouchStart={(e) => {
            if (item.available === false) return;
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
          }}
        >
          {item.available === false && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: darkMode ? '#f87171' : '#ef4444',
              background: darkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
              padding: '3px 6px',
              borderRadius: '4px'
            }}>
              Sold Out
            </span>
          )}
          {item.available !== false && typeof item.stock === 'number' && item.stock > 0 && item.stock <= 5 && (
            <span style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: darkMode ? '#fbbf24' : '#f59e0b',
              background: darkMode ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
              padding: '3px 6px',
              borderRadius: '4px'
            }}>
              {item.stock} left
            </span>
          )}
          {typeof item.isVeg === 'boolean' && (
            <span
              aria-hidden="true"
              title={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '14px',
                height: '14px',
                border: `1.5px solid ${item.isVeg ? '#10b981' : '#ef4444'}`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: item.isVeg ? '#10b981' : '#ef4444'
              }} />
            </span>
          )}
          {item.image && (
            <img
              src={item.image}
              alt=""
              style={{
                width: '100%',
                height: screenSize === 'small' ? '56px' : '72px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '8px'
              }}
            />
          )}
          <div>
            <div style={{
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '600',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              marginBottom: '4px',
              lineHeight: '1.3'
            }}>
              {item.name}
            </div>
            {selectedCategory === 'All' && item.category && (
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                color: darkMode ? '#6b7280' : '#9ca3af',
                marginBottom: '4px'
              }}>
                {item.category}
              </div>
            )}
            {item.description && (
              <div style={{
                fontSize: '11px',
                color: darkMode ? '#6b7280' : '#9ca3af',
                marginTop: '4px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {item.description}
              </div>
            )}
          </div>
          <div style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '6px'
          }}>
            <span style={{
              fontSize: screenSize === 'small' ? '14px' : '15px',
              fontWeight: '700',
              color: darkMode ? '#10b981' : '#059669'
            }}>
              ₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {typeof item.originalPrice === 'number' && item.originalPrice > item.price && (
              <span style={{
                fontSize: '11px',
                color: darkMode ? '#6b7280' : '#9ca3af',
                textDecoration: 'line-through'
              }}>
                ₹{item.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </button>
      ))}
      </div>
    </>
  );
}
