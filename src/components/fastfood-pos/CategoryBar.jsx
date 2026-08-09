/**
 * Fast Food POS — Category Bar
 *
 * Horizontal scrolling pill buttons. Active = accent gradient.
 * Inactive = dark ghost with subtle border.
 */

import React from 'react';

const CATEGORY_ICONS = {
  All:     '🍽',
  Coffee:  '☕',
  Food:    '🍔',
  Special: '⭐',
  Popular: '🔥',
  Drinks:  '🥤',
  Snacks:  '🍟',
  Dessert: '🍰',
  Combos:  '📦',
};

export default function CategoryBar({ categories, selectedCategory, onSelectCategory, currentPage, totalPages, onPageChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      padding: '8px 12px',
      overflowX: 'auto',
      background: '#111116',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      scrollbarWidth: 'none',
      flexShrink: 0,
    }}>
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >← Prev</button>
      )}

      {categories.map((cat) => {
        const active = selectedCategory === cat;
        const icon = CATEGORY_ICONS[cat] || '🏷';
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 20, flexShrink: 0,
              border: active ? '1px solid #E63946' : '1px solid rgba(255,255,255,0.08)',
              background: active
                ? 'linear-gradient(135deg, #E63946 0%, #C1121F 100%)'
                : 'rgba(255,255,255,0.04)',
              color: active ? '#fff' : 'rgba(255,255,255,0.5)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              letterSpacing: 0.5, whiteSpace: 'nowrap',
              boxShadow: active ? '0 3px 12px rgba(230,57,70,0.35)' : 'none',
              transition: 'all 0.15s ease',
              transform: active ? 'translateY(-1px)' : 'translateY(0)',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(230,57,70,0.1)';
                e.currentTarget.style.borderColor = 'rgba(230,57,70,0.3)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }
            }}
          >
            <span>{icon}</span>
            <span>{cat}</span>
          </button>
        );
      })}

      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
          }}
        >Next →</button>
      )}
    </div>
  );
}
