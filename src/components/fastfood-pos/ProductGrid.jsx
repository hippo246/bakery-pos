/**
 * Fast Food POS — Product Grid
 *
 * Dark tiles with emoji icon placeholder, item name, and price badge.
 * Animated add-to-cart ripple on click. Touch-friendly large tiles.
 */

import React, { useState } from 'react';

// Category-coded tile accent colors
const TILE_COLORS = [
  '#E63946', '#3b82f6', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
  '#14b8a6', '#a3e635', '#fb923c', '#e879f9',
];

const FOOD_EMOJIS = ['🍔', '🍕', '🌮', '🍜', '☕', '🥤', '🍰', '🍟', '🌯', '🥗', '🍱', '🥪'];

export default function ProductGrid({ items, onItemClick, selectedCategory }) {
  const [ripple, setRipple] = useState(null);

  const filteredItems = selectedCategory && selectedCategory !== 'All'
    ? items.filter(item => item.category === selectedCategory)
    : items;

  // Demo items if nothing passed
  const demoItems = Array.from({ length: 12 }, (_, i) => ({
    id: `demo-${i}`,
    name: ['Veg Burger', 'Masala Fries', 'Cold Coffee', 'Paneer Wrap', 'Chicken Nuggets', 'Mango Shake',
           'Cheese Pizza', 'Dal Makhani', 'Aloo Tikki', 'Sprite', 'Ice Cream', 'Garlic Bread'][i],
    price: [99, 79, 89, 129, 149, 99, 199, 159, 69, 45, 79, 59][i],
    category: ['Food', 'Food', 'Drinks', 'Food', 'Food', 'Drinks', 'Food', 'Food', 'Snacks', 'Drinks', 'Dessert', 'Snacks'][i],
  }));

  const displayItems = filteredItems.length > 0 ? filteredItems : demoItems;

  const handleClick = (item, idx) => {
    setRipple(idx);
    setTimeout(() => setRipple(null), 300);
    onItemClick?.(item);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
      gap: 10,
      padding: 10,
    }}>
      {displayItems.map((item, idx) => {
        const color = TILE_COLORS[idx % TILE_COLORS.length];
        const emoji = FOOD_EMOJIS[idx % FOOD_EMOJIS.length];
        const isRippling = ripple === idx;

        return (
          <div
            key={item.id || idx}
            onClick={() => handleClick(item, idx)}
            style={{
              height: 136,
              borderRadius: 14,
              border: `1px solid ${color}30`,
              background: `linear-gradient(145deg, ${color}18 0%, ${color}08 100%)`,
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.15s ease',
              transform: isRippling ? 'scale(0.95)' : 'scale(1)',
              boxShadow: isRippling
                ? `0 0 0 3px ${color}60, 0 4px 12px rgba(0,0,0,0.4)`
                : `0 2px 8px rgba(0,0,0,0.3)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `linear-gradient(145deg, ${color}30 0%, ${color}18 100%)`;
              e.currentTarget.style.borderColor = `${color}60`;
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)';
              e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.4), 0 0 0 1px ${color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = `linear-gradient(145deg, ${color}18 0%, ${color}08 100%)`;
              e.currentTarget.style.borderColor = `${color}30`;
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: color, borderRadius: '14px 14px 0 0',
            }} />

            {/* Emoji icon */}
            <div style={{ fontSize: 34, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
              {emoji}
            </div>

            {/* Name */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
              textAlign: 'center', lineHeight: 1.3,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              width: '100%',
            }}>
              {item.name}
            </div>

            {/* Price badge */}
            <div style={{
              background: color,
              color: '#fff', fontSize: 13, fontWeight: 900,
              padding: '3px 12px', borderRadius: 20,
              boxShadow: `0 2px 6px ${color}60`,
              letterSpacing: 0.3,
            }}>
              ₹{Number(item.price || 0).toFixed(0)}
            </div>

            {/* Add ripple overlay */}
            {isRippling && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `${color}40`,
                borderRadius: 14,
                animation: 'none',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
