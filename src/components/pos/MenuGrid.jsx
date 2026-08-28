import React from 'react';

export default function MenuGrid({ 
  menuItems, 
  selectedCategory, 
  onAddToCart,
  screenSize = 'large',
  darkMode = true,
  searchQuery = ''
}) {
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
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
          onClick={() => onAddToCart(item)}
          style={{
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: '12px',
            padding: screenSize === 'small' ? '12px' : '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'left',
            minHeight: screenSize === 'small' ? '120px' : '140px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div>
            <div style={{
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '600',
              color: darkMode ? '#ffffff' : '#1f2937',
              marginBottom: '4px',
              lineHeight: '1.3'
            }}>
              {item.name}
            </div>
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
            fontSize: screenSize === 'small' ? '14px' : '15px',
            fontWeight: '700',
            color: darkMode ? '#10b981' : '#059669'
          }}>
            ₹{item.price.toFixed(2)}
          </div>
        </button>
      ))}
    </div>
  );
}
