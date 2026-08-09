/**
 * Function Key Panel (F1-F12)
 * 
 * Classic POS component - displays function keys at the top
 * Highly modular and customizable via props
 */

import React from 'react';
import { useTheme } from '../../theme/useTheme';

export default function FunctionKeyPanel({
  onKeyPress,
  keys = null,
  columns = 12,
  minHeight = '32px',
  fontSize = '10px',
  labelFontSize = '9px',
  gap = '2px',
  background = '#c0c0c0',
  buttonBackground = '#c0c0c0',
  textColor = '#000000',
  borderColor = '#ffffff',
  fontFamily = 'Tahoma, sans-serif',
  showKeyNames = true,
  customLabels = null,
}) {
  const { theme } = useTheme();
  const keyboard = theme.keyboard || {};
  const functionKeys = keyboard.functionKeys || {};
  
  // Default key labels
  const defaultKeyLabels = {
    F1: 'HELP',
    F2: 'HOLD',
    F3: 'CLEAR',
    F4: 'CHECKOUT',
    F5: 'DISC',
    F6: 'CUST',
    F7: 'RPT',
    F8: 'PRINT',
    F9: 'SETTLE',
    F10: 'DAY END',
    F11: 'SETUP',
    F12: 'EXIT',
  };
  
  // Use custom labels如果 provided, otherwise use defaults
  const keyLabels = customLabels || defaultKeyLabels;
  
  // Use custom keys array if provided, otherwise use default F1-F12
  const keyArray = keys || Object.keys(keyLabels);
  
  const handleKeyPress = (key) => {
    if (onKeyPress) {
      onKeyPress(key, functionKeys[key]);
    }
  };
  
  const buttonStyle = {
    flex: 1,
    minHeight,
    padding: '4px 8px',
    background: buttonBackground,
    border: `2px outset ${borderColor}`,
    color: textColor,
    fontSize,
    fontWeight: '700',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };
  
  return (
    <div style={{
      display: 'flex',
      gap,
      width: '100%',
      background,
    }}>
      {keyArray.map(key => (
        <button
          key={key}
          onClick={() => handleKeyPress(key)}
          style={buttonStyle}
          onMouseDown={(e) => e.target.style.borderStyle = 'inset'}
          onMouseUp={(e) => e.target.style.borderStyle = 'outset'}
          onMouseLeave={(e) => e.target.style.borderStyle = 'outset'}
        >
          {showKeyNames && (
            <div style={{ fontSize: labelFontSize, marginBottom: '2px' }}>{key}</div>
          )}
          <div>{keyLabels[key] || key}</div>
        </button>
      ))}
    </div>
  );
}
