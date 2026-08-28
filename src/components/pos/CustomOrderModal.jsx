import React, { useState } from 'react';

export default function CustomOrderModal({
  show,
  onClose,
  onConfirm,
  screenSize = 'large',
  darkMode = true
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');

  const handleConfirm = () => {
    if (name && price) {
      onConfirm({
        name,
        price: parseFloat(price),
        quantity: parseInt(quantity) || 1,
        notes,
        category
      });
      setName('');
      setPrice('');
      setQuantity('1');
      setNotes('');
      setCategory('');
      onClose();
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: screenSize === 'small' ? '0' : '16px'
    }}>
      <div style={{
        background: darkMode ? '#1f2937' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '16px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: screenSize === 'small' ? '100vw' : '450px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937', margin: 0 }}>
            ➕ Custom Order
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: darkMode ? '#374151' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#1f2937',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '700'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#374151',
              marginBottom: '8px'
            }}>
              Item_NAME *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#1f2937',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#374151',
                marginBottom: '8px'
              }}>
                Price *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                  borderRadius: '8px',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: darkMode ? '#e0e0e0' : '#374151',
                marginBottom: '8px'
              }}>
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: darkMode ? '#1f2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                  borderRadius: '8px',
                  color: darkMode ? '#ffffff' : '#1f2937',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#374151',
              marginBottom: '8px'
            }}>
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Optional category"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#1f2937',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: darkMode ? '#e0e0e0' : '#374151',
              marginBottom: '8px'
            }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions"
              rows={3}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkMode ? '#1f2937' : '#ffffff',
                border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
                borderRadius: '8px',
                color: darkMode ? '#ffffff' : '#1f2937',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: darkMode ? '#374151' : '#f3f4f6',
                color: darkMode ? '#ffffff' : '#1f2937',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!name || !price}
              style={{
                flex: 1,
                padding: '12px',
                background: (!name || !price) ? '#9ca3af' : '#6366f1',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (!name || !price) ? 'not-allowed' : 'pointer'
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
