import React from 'react';

export default function Cart({ 
  cart = [], 
  screenSize = 'large', 
  darkMode = true,
  onRemoveItem,
  onUpdateQuantity,
  onEditItem,
  selectedItems = [],
  onSelectItem,
  isEditing = false
}) {
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div style={{
      background: darkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
      borderRadius: '16px',
      padding: screenSize === 'small' ? '16px' : '20px',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxHeight: screenSize === 'small' ? 'calc(100vh - 200px)' : 'calc(100vh - 100px)',
      overflow: 'auto'
    }}>
      {/* Cart Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
      }}>
        <div style={{
          fontSize: screenSize === 'small' ? '16px' : '18px',
          fontWeight: '700',
          color: darkMode ? '#ffffff' : '#0a0a0a'
        }}>
          🛒 Cart ({cart.length})
        </div>
        <div style={{
          fontSize: screenSize === 'small' ? '14px' : '16px',
          fontWeight: '600',
          color: darkMode ? '#10b981' : '#059669'
        }}>
          ₹{cartSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: darkMode ? '#6b7280' : '#9ca3af'
        }}>
          <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.6 }}>🛒</div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>Cart is empty</div>
          <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.8 }}>
            Tap an item from the menu to add it
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => isEditing && onSelectItem(index)}
              role={isEditing ? 'checkbox' : undefined}
              aria-checked={isEditing ? selectedItems.includes(index) : undefined}
              tabIndex={isEditing ? 0 : undefined}
              onKeyDown={(e) => {
                if (isEditing && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectItem(index);
                }
              }}
              style={{
                background: selectedItems.includes(index) 
                  ? 'rgba(99,102,241,0.1)' 
                  : darkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                border: selectedItems.includes(index)
                  ? '1px solid rgba(99,102,241,0.3)'
                  : `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                cursor: isEditing ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (isEditing && !selectedItems.includes(index)) {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (isEditing && !selectedItems.includes(index)) {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb';
                }
              }}
            >
              {isEditing && (
                <div
                  aria-hidden="true"
                  style={{
                    width: '18px',
                    height: '18px',
                    flexShrink: 0,
                    borderRadius: '5px',
                    border: `1.5px solid ${selectedItems.includes(index) ? '#6366f1' : (darkMode ? 'rgba(255,255,255,0.2)' : '#d1d5db')}`,
                    background: selectedItems.includes(index) ? '#6366f1' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  {selectedItems.includes(index) && '✓'}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: screenSize === 'small' ? '14px' : '15px',
                  fontWeight: '600',
                  color: darkMode ? '#ffffff' : '#0a0a0a',
                  marginBottom: '4px'
                }}>
                  {item.name}
                </div>
                {item.variant && (
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#888888' : '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {item.variant}
                  </div>
                )}
                {item.modifiers && item.modifiers.length > 0 && (
                  <div style={{
                    fontSize: '11px',
                    color: darkMode ? '#6b7280' : '#9ca3af',
                    marginTop: '2px'
                  }}>
                    {item.modifiers.map(m => m.name).join(', ')}
                  </div>
                )}
              </div>
              <div style={{
                textAlign: 'right',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px'
              }}>
                <div style={{
                  fontSize: screenSize === 'small' ? '14px' : '15px',
                  fontWeight: '700',
                  color: darkMode ? '#ffffff' : '#0a0a0a'
                }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(index, -1);
                    }}
                    disabled={item.quantity <= 1}
                    aria-label={`Decrease quantity of ${item.name}`}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                      border: 'none',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: item.quantity <= 1 ? 0.4 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    -
                  </button>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateQuantity(index, 1);
                    }}
                    aria-label={`Increase quantity of ${item.name}`}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                      border: 'none',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    +
                  </button>
                  {onEditItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItem(index);
                      }}
                      aria-label={`Edit ${item.name}`}
                      title="Edit item"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                        border: 'none',
                        color: darkMode ? '#ffffff' : '#0a0a0a',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✏️
                    </button>
                  )}
                  {onRemoveItem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(index);
                      }}
                      aria-label={`Remove ${item.name} from cart`}
                      title="Remove item"
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: darkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)',
                        border: 'none',
                        color: darkMode ? '#f87171' : '#ef4444',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
