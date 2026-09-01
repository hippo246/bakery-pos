import React from 'react';

export default function CategoryFilter({ 
  categories, 
  selectedCategory, 
  onSelectCategory,
  screenSize = 'large',
  darkMode = true 
}) {
  const allCategories = ['All', ...categories];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '4px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      {allCategories.map(category => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          style={{
            padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
            background: selectedCategory === category 
              ? (darkMode ? '#6366f1' : '#6366f1')
              : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
            color: selectedCategory === category 
              ? '#ffffff' 
              : (darkMode ? '#888888' : '#6b7280'),
            border: selectedCategory === category 
              ? 'none' 
              : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: '20px',
            fontSize: screenSize === 'small' ? '13px' : '14px',
            fontWeight: selectedCategory === category ? '600' : '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            if (selectedCategory !== category) {
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategory !== category) {
              e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6';
            }
          }}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
