/**
 * Fast Food POS — Numeric Keypad
 *
 * Dark 3×5 numeric grid. Numbers = slate-blue, Clear = red, Enter = green.
 * Large touch targets with press animation.
 */

import React, { useState } from 'react';

const KEYS = [
  { v: '7', l: '7' }, { v: '8', l: '8' }, { v: '9', l: '9' },
  { v: '4', l: '4' }, { v: '5', l: '5' }, { v: '6', l: '6' },
  { v: '1', l: '1' }, { v: '2', l: '2' }, { v: '3', l: '3' },
  { v: '.', l: '.' }, { v: '0', l: '0' }, { v: 'C', l: 'CLR', action: 'clear' },
  { v: '*', l: '×' }, { v: '%', l: '%' }, { v: 'Enter', l: 'ENT', action: 'enter' },
];

export default function NumericKeypad({ onValueChange, onEnter, onClear }) {
  const [pressed, setPressed] = useState(null);

  const handlePress = (key) => {
    setPressed(key.v);
    setTimeout(() => setPressed(null), 120);
    if (key.action === 'clear')      onClear?.();
    else if (key.action === 'enter') onEnter?.(key.v);
    else                             onValueChange?.(key.v);
  };

  const getStyle = (key) => {
    const isPressed = pressed === key.v;
    let bg, border, shadow, color;

    if (key.action === 'clear') {
      bg     = isPressed ? '#7f1d1d' : 'linear-gradient(145deg, #ef444420, #ef444408)';
      border = '#ef444440';
      shadow = isPressed ? 'none' : '0 2px 8px rgba(239,68,68,0.2)';
      color  = '#ef4444';
    } else if (key.action === 'enter') {
      bg     = isPressed ? '#064e3b' : 'linear-gradient(145deg, #10b98120, #10b98108)';
      border = '#10b98140';
      shadow = isPressed ? 'none' : '0 2px 8px rgba(16,185,129,0.2)';
      color  = '#10b981';
    } else {
      bg     = isPressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
      border = 'rgba(255,255,255,0.08)';
      shadow = isPressed ? 'none' : '0 2px 6px rgba(0,0,0,0.3)';
      color  = '#fff';
    }

    return {
      height: 64,
      borderRadius: 10, border: `1px solid ${border}`,
      background: bg, color,
      fontSize: key.action ? 13 : 20,
      fontWeight: 800, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: shadow,
      transition: 'all 0.1s ease',
      transform: isPressed ? 'scale(0.92)' : 'scale(1)',
      letterSpacing: 0.5,
      fontFamily: 'inherit',
    };
  };

  return (
    <div style={{
      background: '#111116',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      padding: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 7,
      }}>
        {KEYS.map((key, i) => (
          <button
            key={i}
            style={getStyle(key)}
            onClick={() => handlePress(key)}
            onMouseEnter={(e) => {
              if (pressed !== key.v) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.background = key.action === 'clear'
                  ? 'rgba(239,68,68,0.18)'
                  : key.action === 'enter'
                    ? 'rgba(16,185,129,0.18)'
                    : 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (pressed !== key.v) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = getStyle(key).background;
              }
            }}
          >
            {key.l}
          </button>
        ))}
      </div>
    </div>
  );
}
