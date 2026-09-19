import React, { useEffect, useRef, useState } from 'react';

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  screenSize = 'large',
  darkMode = true
}) {
  const allCategories = ['All', ...categories];
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => updateFades();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  return (
    <div style={{ position: 'relative' }}>
      {showLeftFade && (
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: '4px',
          width: '24px',
          background: darkMode
            ? 'linear-gradient(to right, rgba(0,0,0,0.6), transparent)'
            : 'linear-gradient(to right, rgba(255,255,255,0.9), transparent)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      )}
      {showRightFade && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: '4px',
          width: '24px',
          background: darkMode
            ? 'linear-gradient(to left, rgba(0,0,0,0.6), transparent)'
            : 'linear-gradient(to left, rgba(255,255,255,0.9), transparent)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      )}
      <div
        ref={scrollRef}
        onScroll={updateFades}
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {allCategories.map(category => {
          const isSelected = selectedCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              aria-pressed={isSelected}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: isSelected
                  ? '#6366f1'
                  : (darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6'),
                color: isSelected
                  ? '#ffffff'
                  : (darkMode ? '#888888' : '#6b7280'),
                border: isSelected
                  ? 'none'
                  : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                borderRadius: '20px',
                fontSize: screenSize === 'small' ? '13px' : '14px',
                fontWeight: isSelected ? '600' : '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                flexShrink: 0,
                boxShadow: isSelected ? '0 3px 10px rgba(99,102,241,0.35)' : 'none',
                transform: isSelected ? 'translateY(-1px)' : 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6';
                }
              }}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
