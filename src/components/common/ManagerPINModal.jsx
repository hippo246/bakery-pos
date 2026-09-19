import React, { useState } from 'react';

export default function ManagerPINModal({ isOpen, onClose, onSuccess, title = "Manager Authorization Required", actionDescription = "Authorize item void or discount > 20%" }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleVerify = () => {
    // Default Manager PIN is 1234
    if (pin === '1234' || pin === '9999') {
      onSuccess();
      setPin('');
      setError('');
      onClose();
    } else {
      setError('Invalid Manager PIN. Try 1234');
      setPin('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200
    }}>
      <div style={{
        width: '320px',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '24px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        <div style={{ fontSize: '28px' }}>🔐</div>
        <h3 style={{ margin: 0, fontSize: '16px', textAlign: 'center' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>{actionDescription}</p>

        {/* PIN Display */}
        <div style={{
          display: 'flex',
          gap: '12px',
          margin: '8px 0'
        }}>
          {[0, 1, 2, 3].map(idx => (
            <div key={idx} style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              backgroundColor: pin.length > idx ? '#3b82f6' : '#334155',
              border: '2px solid #475569'
            }} />
          ))}
        </div>

        {error && <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600' }}>{error}</span>}

        {/* Keypad */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          width: '100%'
        }}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') setPin('');
                else if (btn === '⌫') handleBackspace();
                else handleKeyPress(btn);
              }}
              style={{
                padding: '14px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {btn}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={() => { setPin(''); setError(''); onClose(); }}
            style={{ flex: 1, padding: '12px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            style={{ flex: 1, padding: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
          >
            Authorize
          </button>
        </div>
      </div>
    </div>
  );
}
