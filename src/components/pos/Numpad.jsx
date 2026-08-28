import React from 'react';

export default function Numpad({ 
  onKeyPress, 
  mode = 'quantity', 
  screenSize = 'large',
  darkMode = true 
}) {
  const getModeLabel = () => {
    if (mode === 'quantity') return 'Quantity';
    if (mode === 'discount') return 'Discount %';
    if (mode === 'amount') return 'Amount';
    if (mode === 'tip') return 'Tip Amount';
    if (mode === 'gst') return 'GST Rate %';
    return '';
  };

  const getModeColor = () => {
    if (mode === 'quantity') return '#10b981';
    if (mode === 'discount') return '#f59e0b';
    if (mode === 'amount') return '#3b82f6';
    if (mode === 'tip') return '#ec4899';
    if (mode === 'gst') return '#6366f1';
    return '#8b8b9e';
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      background: darkMode ? 'rgba(0,0,0,0.25)' : '#f3f4f6',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
      borderRadius: '16px',
      padding: screenSize === 'small' ? '12px' : '16px',
      overflow: 'hidden'
    }}>
      {/* Mode Label */}
      <div style={{ 
        fontSize: '11px', 
        color: darkMode ? '#8b8b9e' : '#6b7280', 
        fontWeight: '600', 
        marginBottom: '4px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase'
      }}>
        {getModeLabel()}
      </div>

      {/* Numpad Keys */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: screenSize === 'small' ? '6px' : '8px' 
      }}>
        {[
          '7', '8', '9',
          '4', '5', '6',
          '1', '2', '3',
          '.', '0', '⌫'
        ].map((key) => {
          const isBackspace = key === '⌫';
          const isDot = key === '.';
          return (
            <button
              key={key}
              type="button"
              onClick={() => onKeyPress(key)}
              style={{
                minHeight: screenSize === 'small' ? '56px' : '48px',
                background: isBackspace
                  ? 'rgba(239,68,68,0.1)'
                  : isDot
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.05)',
                border: isBackspace
                  ? '1px solid rgba(239,68,68,0.2)'
                  : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '10px',
                color: isBackspace ? '#ef4444' : (darkMode ? '#ffffff' : '#1f2937'),
                fontSize: isBackspace ? '16px' : screenSize === 'small' ? '22px' : '18px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.1s',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                WebkitTapHighlightColor: 'transparent',
                userSelect: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isBackspace 
                  ? 'rgba(239,68,68,0.2)' 
                  : 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isBackspace 
                  ? 'rgba(239,68,68,0.1)' 
                  : (isDot ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)');
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {key}
            </button>
          );
        })}
        {/* Full-width Clear button */}
        <button
          type="button"
          onClick={() => onKeyPress('C')}
          style={{
            gridColumn: '1 / -1',
            padding: screenSize === 'small' ? '16px' : '12px',
            background: `rgba(${parseInt(getModeColor().slice(1,3),16)}, ${parseInt(getModeColor().slice(3,5),16)}, ${parseInt(getModeColor().slice(5,7),16)}, 0.08)`,
            border: `1px solid rgba(${parseInt(getModeColor().slice(1,3),16)}, ${parseInt(getModeColor().slice(3,5),16)}, ${parseInt(getModeColor().slice(5,7),16)}, 0.15)`,
            borderRadius: '10px',
            color: getModeColor(),
            fontSize: screenSize === 'small' ? '15px' : '13px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'background 0.15s',
            WebkitTapHighlightColor: 'transparent',
            minHeight: screenSize === 'small' ? '48px' : 'auto'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `rgba(${parseInt(getModeColor().slice(1,3),16)}, ${parseInt(getModeColor().slice(3,5),16)}, ${parseInt(getModeColor().slice(5,7),16)}, 0.15)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `rgba(${parseInt(getModeColor().slice(1,3),16)}, ${parseInt(getModeColor().slice(3,5),16)}, ${parseInt(getModeColor().slice(5,7),16)}, 0.08)`;
          }}
        >
          CLEAR
        </button>
      </div>
    </div>
  );
}
