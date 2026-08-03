// eslint-disable-next-line no-unused-vars
import React from 'react';
import { C } from '../../styles/theme';
import { MENU_CATS } from '../../data/constants.js';

// Icons per category — extend as menu grows
const CAT_ICONS = {
  ALL:      '🍽',
  Coffee:   '☕',
  Special:  '✨',
  Food:     '🥗',
  Drinks:   '🧋',
  Desserts: '🍰',
  Snacks:   '🍟',
  Popular:  '⭐',
};

const CategorySidebar = ({
  categoryFilter,
  onCategorySelect,
  showAvailableOnly,
  onToggleAvailable,
  menuItems = [],   // passed so we can show live counts per category
}) => {
  // Count items per category (respecting availability filter)
  const countFor = (cat) => {
    if (!menuItems.length) return null;
    return menuItems.filter(item => {
      if (showAvailableOnly && (!item.active || item.eightySixed)) return false;
      if (cat === 'ALL') return true;
      if (cat === 'Popular') return item.popular;
      if (cat === 'Available only') return item.active && !item.eightySixed;
      return item.cat === cat;
    }).length;
  };

  const allCats = MENU_CATS;

  return (
    <div style={{
      background: 'var(--cafe-bg-elevated)',
      border: `1px solid var(--cafe-border)`,
      borderRadius: 'var(--cafe-radius-lg)',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid var(--cafe-border-light)` }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Menu
        </div>
      </div>

      {/* Category buttons */}
      <div style={{ padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {allCats.map(cat => {
          const active = categoryFilter === cat;
          const count = countFor(cat);
          const icon = CAT_ICONS[cat] || '📋';
          return (
            <button
              key={cat}
              onClick={() => onCategorySelect(cat)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 10px',
                borderRadius: 9,
                border: `1px solid ${active ? C.amber3 : 'transparent'}`,
                background: active ? C.amberDim : 'transparent',
                color: active ? C.amber2 : C.text2,
                fontSize: 12,
                fontWeight: active ? 800 : 500,
                cursor: 'pointer',
                transition: 'all .12s',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = C.bg3; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; } }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cat === 'ALL' ? 'All' : cat}
              </span>
              {count !== null && count > 0 && (
                <span style={{
                  fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                  background: active ? C.amber3 : C.bg4,
                  color: active ? '#1a0e00' : C.text3,
                  padding: '1px 6px', borderRadius: 10, flexShrink: 0,
                  minWidth: 20, textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* In-stock toggle */}
      <div style={{ padding: '12px 14px 14px', borderTop: `1px solid var(--cafe-border-light)`, marginTop: 8 }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', fontSize: 12, color: C.text2, fontWeight: 500,
        }}>
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={e => onToggleAvailable(e.target.checked)}
            style={{ accentColor: C.amber, cursor: 'pointer', width: 14, height: 14 }}
          />
          In stock only
        </label>
      </div>
    </div>
  );
};

export default CategorySidebar;
