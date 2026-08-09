/**
 * Numeric Keypad
 * 
 * Classic POS component - numeric keypad for entering quantities, prices
 * Highly modular and customizable via props
 */

import React, { useState } from 'react';
import { useTheme } from '../../theme/useTheme';

export default function NumericKeypad({
  onValueChange,
  onEnter,
  onClear,
  initialValue = '',
  buttons = null,
  columns = 4,
  gap = '2px',
  padding = '4px',
  background = '#c0c0c0',
  border = '2px inset #808080',
  buttonBackground = '#ece9d8',
  buttonBorder = '2px outset #ffffff',
  textColor = '#000000',
  fontSize = '16px',
  fontWeight = '700',
  minHeight = '48px',
  fontFamily = 'Tahoma, sans-serif',
  displayBackground = '#ffffff',
  displayBorder = '2px inset #c0c0c0',
  displayPadding = '8px',
  displayFontSize = '18px',
  displayFontFamily = 'Courier New, monospace',
  displayMinHeight = '32px',
  showDisplay = true,
  customButtons = null,
}) {
  const { theme } = useTheme();
  const [value, setValue] = useState(initialValue);
  
  const handleDigit = (digit) => {
    const newValue = value + digit;
    setValue(newValue);
    if (onValueChange) onValueChange(newValue);
  };
  
  const handleClear = () => {
    setValue('');
    if (onValueChange) onValueChange('');
    if (onClear) onClear();
  };
  
  const handleBackspace = () => {
    const newValue = value.slice(0, -1);
    setValue(newValue);
    if (onValueChange) onValueChange(newValue);
  };
  
  const handleEnter = () => {
    if (onEnter) onEnter(value);
  };
  
  // Default button configuration
  const defaultButtons = [
    { label: '7', value: '7', action: () => handleDigit('7') },
    { label: '8', value: '8', action: () => handleDigit('8') },
    { label: '9', value: '9', action: () => handleDigit('9') },
    { label: '×', value: '*', action: () => handleDigit('*') },
    { label: '4', value: '4', action: () => handleDigit('4') },
    { label: '5', value: '5', action: () => handleDigit('5') },
    { label: '6', value: '6', action: () => handleDigit('6') },
    { label: '-', value: '-', action: () => handleDigit('-') },
    { label: '1', value: '1', action: () => handleDigit('1') },
    { label: '2', value: '2', action: () => handleDigit('2') },
    { label: '3', value: '3', action: () => handleDigit('3') },
    { label: '+', value: '+', action: () => handleDigit('+') },
    { label: 'C', value: 'C', action: handleClear, style: { background: '#ffcccc', color: '#cc0000' } },
    { label: '0', value: '0', action: () => handleDigit('0') },
    { label: '00', value: '00', action: () => handleDigit('00') },
    { label: '⌫', value: 'BS', action: handleBackspace },
    { label: 'Enter', value: 'Enter', action: handleEnter, style: { background: '#ccffcc', color: '#008000', fontWeight: '800' }, colSpan: 2 },
  ];
  
  // Use custom buttons if provided, otherwise use defaults
  const buttonArray = customButtons || buttons || defaultButtons;
  
  const buttonStyle = {
    minHeight,
    padding: '8px',
    background: buttonBackground,
    border: buttonBorder,
    color: textColor,
    fontSize,
    fontWeight,
    cursor: 'pointer',
    fontFamily,
  };
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
      padding,
      background,
      border,
    }}>
      {/* Display */}
      {showDisplay && (
        <div style={{
          gridColumn: '1 / -1',
          background: displayBackground,
          border: displayBorder,
          padding: displayPadding,
          marginBottom: gap,
          fontSize: displayFontSize,
          fontWeight: '700',
          textAlign: 'right',
          fontFamily: displayFontFamily,
          minHeight: displayMinHeight,
        }}>
          {value || '0.00'}
        </div>
      )}
      
      {/* Keypad buttons */}
      {buttonArray.map((btn, index) => (
        <button
          key={index}
          onClick={btn.action}
          style={{
            gridColumn: btn.colSpan || 'auto',
            ...buttonStyle,
            ...btn.style,
          }}
          onMouseDown={(e) => e.target.style.borderStyle = 'inset'}
          onMouseUp={(e) => e.target.style.borderStyle = 'outset'}
          onMouseLeave={(e) => e.target.style.borderStyle = 'outset'}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
