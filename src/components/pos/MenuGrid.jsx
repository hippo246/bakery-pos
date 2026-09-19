import React, { useMemo, useState } from 'react';

const GridIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
    <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" />
  </svg>
);

const ListIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="1" y="2" width="14" height="3" rx="1" fill="currentColor" />
    <rect x="1" y="6.5" width="14" height="3" rx="1" fill="currentColor" />
    <rect x="1" y="11" width="14" height="3" rx="1" fill="currentColor" />
  </svg>
);

export default function MenuGrid({
  menuItems = [],
  selectedCategory,
  onAddToCart,
  screenSize = 'large',
  darkMode = true,
  searchQuery = ''
}) {
  // Layout is self-contained: view mode (grid/list) and column count for grid mode.
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [columns, setColumns] = useState(screenSize === 'small' ? 2 : 4); // 2-6, grid mode only

  const filteredItems = useMemo(() => menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }), [menuItems, selectedCategory, searchQuery]);

  const canPickColumns = viewMode === 'grid' && screenSize !== 'small';
  const minColumns = 2;
  const maxColumns = 6;

  const toolbarBtnStyle = (active) => ({
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: `1px solid ${active ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb')}`,
    background: active ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff'),
    color: active ? '#ffffff' : (darkMode ? '#9ca3af' : '#6b7280'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s'
  });

  return (
    <>
      {/* Layout toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        marginBottom: screenSize === 'small' ? '10px' : '12px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: darkMode ? '#6b7280' : '#9ca3af'
        }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {canPickColumns && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
              border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
              borderRadius: '8px',
              padding: '3px'
            }}>
              <button
                type="button"
                onClick={() => setColumns(c => Math.max(minColumns, c - 1))}
                disabled={columns <= minColumns}
                aria-label="Fewer columns"
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'transparent',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  cursor: columns <= minColumns ? 'not-allowed' : 'pointer',
                  opacity: columns <= minColumns ? 0.35 : 1,
                  fontSize: '14px',
                  fontWeight: '700'
                }}
              >
                −
              </button>
              <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: darkMode ? '#ffffff' : '#0a0a0a',
                minWidth: '38px',
                textAlign: 'center'
              }}>
                {columns} cols
              </span>
              <button
                type="button"
                onClick={() => setColumns(c => Math.min(maxColumns, c + 1))}
                disabled={columns >= maxColumns}
                aria-label="More columns"
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'transparent',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  cursor: columns >= maxColumns ? 'not-allowed' : 'pointer',
                  opacity: columns >= maxColumns ? 0.35 : 1,
                  fontSize: '14px',
                  fontWeight: '700'
                }}
              >
                +
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              style={toolbarBtnStyle(viewMode === 'grid')}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              style={toolbarBtnStyle(viewMode === 'list')}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

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

      {filteredItems.length > 0 && viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small'
            ? 'repeat(2, 1fr)'
            : `repeat(${columns}, 1fr)`,
          gap: screenSize === 'small' ? '12px' : '16px',
          overflow: 'auto',
          maxHeight: screenSize === 'small' ? 'calc(100vh - 220px)' : 'calc(100vh - 140px)'
        }}>
          {filteredItems.map(item => (
            <GridCard
              key={item.id}
              item={item}
              screenSize={screenSize}
              darkMode={darkMode}
              selectedCategory={selectedCategory}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {filteredItems.length > 0 && viewMode === 'list' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflow: 'auto',
          maxHeight: screenSize === 'small' ? 'calc(100vh - 220px)' : 'calc(100vh - 140px)'
        }}>
          {filteredItems.map(item => (
            <ListRow
              key={item.id}
              item={item}
              screenSize={screenSize}
              darkMode={darkMode}
              selectedCategory={selectedCategory}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </>
  );
}

function formatPrice(value) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function GridCard({ item, screenSize, darkMode, selectedCategory, onAddToCart }) {
  const isAvailable = item.available !== false;
  return (
    <button
      type="button"
      onClick={() => isAvailable && onAddToCart(item)}
      disabled={!isAvailable}
      aria-label={`${item.name}, ₹${item.price.toFixed(2)}${!isAvailable ? ', sold out' : ''}`}
      style={{
        background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: screenSize === 'small' ? '12px' : '16px',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        opacity: isAvailable ? 1 : 0.5,
        transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
        textAlign: 'left',
        minHeight: screenSize === 'small' ? '120px' : '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: 'none'
      }}
      onMouseEnter={(e) => {
        if (!isAvailable) return;
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = darkMode
          ? '0 8px 20px rgba(0,0,0,0.35)'
          : '0 8px 20px rgba(15,23,42,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
      onFocus={(e) => {
        if (!isAvailable) return;
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
      }}
      onBlur={(e) => {
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
      }}
      onTouchStart={(e) => {
        if (!isAvailable) return;
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
      }}
      onTouchEnd={(e) => {
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
      }}
    >
      {!isAvailable && (
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
      {isAvailable && typeof item.stock === 'number' && item.stock > 0 && item.stock <= 5 && (
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
          ₹{formatPrice(item.price)}
        </span>
        {typeof item.originalPrice === 'number' && item.originalPrice > item.price && (
          <span style={{
            fontSize: '11px',
            color: darkMode ? '#6b7280' : '#9ca3af',
            textDecoration: 'line-through'
          }}>
            ₹{formatPrice(item.originalPrice)}
          </span>
        )}
      </div>
    </button>
  );
}

function ListRow({ item, screenSize, darkMode, selectedCategory, onAddToCart }) {
  const isAvailable = item.available !== false;
  return (
    <button
      type="button"
      onClick={() => isAvailable && onAddToCart(item)}
      disabled={!isAvailable}
      aria-label={`${item.name}, ₹${item.price.toFixed(2)}${!isAvailable ? ', sold out' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        textAlign: 'left',
        background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
        border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
        borderRadius: '10px',
        padding: screenSize === 'small' ? '8px' : '10px 12px',
        cursor: isAvailable ? 'pointer' : 'not-allowed',
        opacity: isAvailable ? 1 : 0.5,
        transition: 'background 0.15s'
      }}
      onMouseEnter={(e) => {
        if (!isAvailable) return;
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
      }}
    >
      {typeof item.isVeg === 'boolean' && (
        <span
          aria-hidden="true"
          title={item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}
          style={{
            flexShrink: 0,
            width: '13px',
            height: '13px',
            border: `1.5px solid ${item.isVeg ? '#10b981' : '#ef4444'}`,
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: item.isVeg ? '#10b981' : '#ef4444'
          }} />
        </span>
      )}

      {item.image ? (
        <img
          src={item.image}
          alt=""
          style={{
            width: '44px',
            height: '44px',
            objectFit: 'cover',
            borderRadius: '8px',
            flexShrink: 0
          }}
        />
      ) : (
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '8px',
          flexShrink: 0,
          background: darkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6'
        }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: darkMode ? '#ffffff' : '#0a0a0a',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.name}
          {!isAvailable && (
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: darkMode ? '#f87171' : '#ef4444',
              background: darkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
              padding: '2px 5px',
              borderRadius: '4px',
              flexShrink: 0
            }}>
              Sold Out
            </span>
          )}
          {isAvailable && typeof item.stock === 'number' && item.stock > 0 && item.stock <= 5 && (
            <span style={{
              fontSize: '9px',
              fontWeight: '700',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: darkMode ? '#fbbf24' : '#f59e0b',
              background: darkMode ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
              padding: '2px 5px',
              borderRadius: '4px',
              flexShrink: 0
            }}>
              {item.stock} left
            </span>
          )}
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '11px',
          color: darkMode ? '#6b7280' : '#9ca3af',
          marginTop: '2px'
        }}>
          {selectedCategory === 'All' && item.category && (
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.3px', fontWeight: '600' }}>
              {item.category}
            </span>
          )}
          {item.description && (
            <span style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {selectedCategory === 'All' && item.category ? '· ' : ''}{item.description}
            </span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        <span style={{
          fontSize: '14px',
          fontWeight: '700',
          color: darkMode ? '#10b981' : '#059669'
        }}>
          ₹{formatPrice(item.price)}
        </span>
        {typeof item.originalPrice === 'number' && item.originalPrice > item.price && (
          <span style={{
            fontSize: '10px',
            color: darkMode ? '#6b7280' : '#9ca3af',
            textDecoration: 'line-through'
          }}>
            ₹{formatPrice(item.originalPrice)}
          </span>
        )}
      </div>
    </button>
  );
}
