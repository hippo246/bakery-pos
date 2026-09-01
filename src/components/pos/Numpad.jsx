import React from 'react';

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
    return '#888888';
  };

  const modeColor = getModeColor();

  const handleContainerKeyDown = (e) => {
    if (/^[0-9]$/.test(e.key)) {
      onKeyPress(e.key);
    } else if (e.key === '.') {
      onKeyPress('.');
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      onKeyPress('⌫');
    } else if (e.key === 'Escape') {
      onKeyPress('C');
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleContainerKeyDown}
      style={{
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
        color: darkMode ? '#888888' : '#6b7280', 
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
              aria-label={isBackspace ? 'Backspace' : isDot ? 'Decimal point' : `Digit ${key}`}
              style={{
                minHeight: screenSize === 'small' ? '56px' : '48px',
                background: isBackspace
                  ? 'rgba(239,68,68,0.1)'
                  : isDot
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.05)',
                border: isBackspace
                  ? '1px solid rgba(239,68,68,0.8)'
                  : `1px solid ${darkMode ? '#444444' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '10px',
                color: isBackspace ? '#ef4444' : (darkMode ? '#ffffff' : '#0a0a0a'),
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
              onTouchStart={(e) => {
                e.currentTarget.style.background = isBackspace 
                  ? 'rgba(239,68,68,0.2)' 
                  : 'rgba(255,255,255,0.1)';
                e.currentTarget.style.transform = 'scale(0.97)';
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.background = isBackspace 
                  ? 'rgba(239,68,68,0.1)' 
                  : (isDot ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)');
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = isBackspace 
                  ? 'rgba(239,68,68,0.2)' 
                  : 'rgba(255,255,255,0.1)';
                e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(modeColor, 0.5)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = isBackspace 
                  ? 'rgba(239,68,68,0.1)' 
                  : (isDot ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)');
                e.currentTarget.style.boxShadow = 'none';
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
          aria-label={`Clear ${getModeLabel()}`}
          style={{
            gridColumn: '1 / -1',
            padding: screenSize === 'small' ? '16px' : '12px',
            background: hexToRgba(modeColor, 0.08),
            border: `1px solid ${hexToRgba(modeColor, 0.15)}`,
            borderRadius: '10px',
            color: modeColor,
            fontSize: screenSize === 'small' ? '15px' : '13px',
            fontWeight: '700',
            cursor: 'pointer',
            letterSpacing: '0.05em',
            transition: 'background 0.15s',
            WebkitTapHighlightColor: 'transparent',
            minHeight: screenSize === 'small' ? '48px' : 'auto',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = hexToRgba(modeColor, 0.15);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = hexToRgba(modeColor, 0.08);
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.background = hexToRgba(modeColor, 0.15);
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.background = hexToRgba(modeColor, 0.08);
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = hexToRgba(modeColor, 0.15);
            e.currentTarget.style.boxShadow = `0 0 0 2px ${hexToRgba(modeColor, 0.4)}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = hexToRgba(modeColor, 0.08);
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          CLEAR
        </button>
      </div>
    </div>
  );
}
