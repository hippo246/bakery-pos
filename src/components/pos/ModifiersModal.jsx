import React, { useState } from 'react';

export default function ModifiersModal({
  show,
  onClose,
  item,
  modifiers,
  selectedModifiers,
  onConfirm,
  screenSize = 'large',
  darkMode = true
}) {
  const [localSelected, setLocalSelected] = useState(selectedModifiers || []);

  if (!show || !item) return null;

  const toggleModifier = (modifier) => {
    setLocalSelected(prev => {
      const exists = prev.find(m => m.id === modifier.id);
      if (exists) {
        return prev.filter(m => m.id !== modifier.id);
      } else {
        return [...prev, modifier];
      }
    });
  };

  const handleConfirm = () => {
    onConfirm(localSelected);
    onClose();
  };

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
        background: darkMode ? '#0a0a0a' : '#ffffff',
        borderRadius: screenSize === 'small' ? '0' : '16px',
        padding: screenSize === 'small' ? '16px' : '24px',
        width: screenSize === 'small' ? '100vw' : '500px',
        maxWidth: screenSize === 'small' ? '100vw' : '90vw',
        maxHeight: screenSize === 'small' ? '100vh' : '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: screenSize === 'small' ? '18px' : '20px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', margin: 0 }}>
            Customize {item.name}
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: darkMode ? '#111111' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#0a0a0a',
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

        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: darkMode ? '#e0e0e0' : '#111111',
            marginBottom: '12px'
          }}>
            Select Modifiers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {modifiers.map(modifier => (
              <button
                key={modifier.id}
                onClick={() => toggleModifier(modifier)}
                style={{
                  padding: '12px 16px',
                  background: localSelected.find(m => m.id === modifier.id)
                    ? (darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                    : (darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
                  border: localSelected.find(m => m.id === modifier.id)
                    ? `1px solid ${darkMode ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`
                    : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: darkMode ? '#e0e0e0' : '#111111'
                }}>
                  {modifier.name}
                </span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: darkMode ? '#10b981' : '#059669'
                }}>
                  +₹{modifier.price.toFixed(2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          paddingTop: '16px',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#111111' : '#f3f4f6',
              color: darkMode ? '#ffffff' : '#0a0a0a',
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
            style={{
              flex: 1,
              padding: '12px',
              background: darkMode ? '#4f46e5' : '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
