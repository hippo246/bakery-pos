import React from 'react';

export default function Cart({ 
  cart, 
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
          color: darkMode ? '#ffffff' : '#1f2937'
        }}>
          🛒 Cart ({cart.length})
        </div>
        <div style={{
          fontSize: screenSize === 'small' ? '14px' : '16px',
          fontWeight: '600',
          color: darkMode ? '#10b981' : '#059669'
        }}>
          ₹{cartSubtotal.toFixed(2)}
        </div>
      </div>

      {/* Cart Items */}
      {cart.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: darkMode ? '#6b7280' : '#9ca3af',
          fontSize: '14px'
        }}>
          Cart is empty
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {cart.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              onClick={() => isEditing && onSelectItem(index)}
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
                cursor: isEditing ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: screenSize === 'small' ? '14px' : '15px',
                  fontWeight: '600',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  marginBottom: '4px'
                }}>
                  {item.name}
                </div>
                {item.variant && (
                  <div style={{
                    fontSize: '12px',
                    color: darkMode ? '#8b8b9e' : '#6b7280',
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
                  color: darkMode ? '#ffffff' : '#1f2937'
                }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
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
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                      border: 'none',
                      color: darkMode ? '#ffffff' : '#1f2937',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
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
                    color: darkMode ? '#ffffff' : '#1f2937',
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
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
                      border: 'none',
                      color: darkMode ? '#ffffff' : '#1f2937',
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
