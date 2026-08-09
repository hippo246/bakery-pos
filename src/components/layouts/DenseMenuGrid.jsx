/**
 * Dense Menu Grid
 * 
 * Classic POS component - compact, high-density product grid
 * Highly modular and customizable via props
 */

import React from 'react';
import { useTheme } from '../../theme/useTheme';

export default function DenseMenuGrid({
  items = [],
  onItemClick,
  selectedCategory,
  gridColumns = 'repeat(auto-fill, minmax(90px, 1fr))',
  gap = '2px',
  padding = '2px',
  itemSize = 'compact',
  showImages = false,
  itemBackground = '#ffffff',
  itemBorder = '2px outset #c0c0c0',
  textColor = '#000000',
  priceColor = '#666666',
  fontFamily = 'Tahoma, sans-serif',
  imageWidth = '32px',
  imageHeight = '32px',
  customItemStyle = null,
  filterByCategory = true,
}) {
  const { theme } = useTheme();
  const layout = theme.layout || {};
  const menuConfig = layout.panels?.menu || {};
  
  // Use props or fall back to theme config
  const finalGridColumns = gridColumns || menuConfig.gridColumns || 'repeat(auto-fill, minmax(90px, 1fr))';
  const finalItemSize = itemSize || menuConfig.itemSize || 'compact';
  const finalShowImages = showImages !== undefined ? showImages : menuConfig.showImages !== false;
  
  const getItemStyle = () => {
    switch (finalItemSize) {
      case 'compact':
        return {
          minHeight: '70px',
          padding: '6px',
          fontSize: '11px',
        };
      case 'normal':
        return {
          minHeight: '100px',
          padding: '10px',
          fontSize: '12px',
        };
      case 'large':
        return {
          minHeight: '140px',
          padding: '14px',
          fontSize: '14px',
        };
      default:
        return {
          minHeight: '70px',
          padding: '6px',
          fontSize: '11px',
        };
    }
  };
  
  const itemStyle = customItemStyle || getItemStyle();
  
  // Filter items by category if enabled
  const filteredItems = filterByCategory && selectedCategory
    ? items.filter(item => item.category === selectedCategory || selectedCategory === 'All')
    : items;
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: finalGridColumns,
      gap,
      padding,
    }}>
      {filteredItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick && onItemClick(item)}
          style={{
            ...itemStyle,
            background: itemBackground,
            border: itemBorder,
            color: textColor,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontFamily,
            fontWeight: '600',
          }}
          onMouseDown={(e) => e.target.style.borderStyle = 'inset'}
          onMouseUp={(e) => e.target.style.borderStyle = 'outset'}
          onMouseLeave={(e) => e.target.style.borderStyle = 'outset'}
        >
          {finalShowImages && item.image && (
            <div style={{
              width: imageWidth,
              height: imageHeight,
              marginBottom: '4px',
              fontSize: '24px',
            }}>
              {item.image}
            </div>
          )}
          <div style={{
            fontSize: itemStyle.fontSize,
            fontWeight: '700',
            lineHeight: '1.2',
            wordBreak: 'break-word',
          }}>
            {item.name}
          </div>
          <div style={{
            fontSize: '10px',
            color: priceColor,
            marginTop: '2px',
          }}>
            ₹{item.price}
          </div>
        </button>
      ))}
    </div>
  );
}
