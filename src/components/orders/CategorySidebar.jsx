// eslint-disable-next-line no-unused-vars
import React from 'react';
import { C } from '../../styles/theme';
import { useThemeColors, useThemeSpacing, useThemeTypography, useThemeBorderRadius } from '../../theme';
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
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const borderRadius = useThemeBorderRadius();

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
      background: colors.backgroundHover,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: borderRadius.lg,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`, borderBottom: `1px solid ${colors.borderLight}` }}>
        <div style={{ fontSize: typography.sizes.xs, fontWeight: typography.weights.extrabold, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Menu
        </div>
      </div>

      {/* Category buttons */}
      <div style={{ padding: `${spacing.md} ${spacing.md} 0`, display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
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
                gap: 10,
                padding: `${spacing.md} ${spacing.md}`,
                borderRadius: borderRadius.md,
                border: `1px solid ${active ? colors.primary : 'transparent'}`,
                background: active ? colors.primaryBg : 'transparent',
                color: active ? colors.primary : colors.textSecondary,
                fontSize: typography.sizes.sm,
                fontWeight: active ? typography.weights.extrabold : typography.weights.semibold,
                cursor: 'pointer',
                transition: 'background .15s, border-color .15s, box-shadow .15s, transform .1s',
                boxShadow: active ? `0 2px 10px ${colors.primary}33` : 'none',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = colors.backgroundSurface; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; } }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cat === 'ALL' ? 'All' : cat}
              </span>
              {count !== null && count > 0 && (
                <span style={{
                  fontSize: typography.sizes.xs, fontFamily: typography.fontFamilyMono, fontWeight: typography.weights.extrabold,
                  background: active ? colors.primary : colors.backgroundCard,
                  color: active ? '#1A1208' : colors.textTertiary,
                  padding: '3px 8px', borderRadius: '12px', flexShrink: 0,
                  minWidth: 24, textAlign: 'center',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* In-stock toggle */}
      <div style={{ padding: `${spacing.md} ${spacing.lg} ${spacing.lg}`, borderTop: `1px solid ${colors.borderLight}`, marginTop: 10 }}>
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', fontSize: typography.sizes.sm, color: colors.textSecondary, fontWeight: typography.weights.semibold,
            padding: '6px 8px', margin: '-6px -8px', borderRadius: borderRadius.sm,
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = colors.backgroundSurface; e.currentTarget.style.color = colors.textPrimary; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = colors.textSecondary; }}
        >
          <input
            type="checkbox"
            checked={showAvailableOnly}
            onChange={e => onToggleAvailable(e.target.checked)}
            style={{ accentColor: colors.primary, cursor: 'pointer', width: 16, height: 16 }}
          />
          In stock only
        </label>
      </div>
    </div>
  );
};

export default CategorySidebar;
