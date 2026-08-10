export default function NumericKeypad({ onValueChange, onEnter, onClear }) {
  const keys = [
    { value: '7', label: '7' },
    { value: '8', label: '8' },
    { value: '9', label: '9' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
    { value: '6', label: '6' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '.', label: '.' },
    { value: '0', label: '0' },
    { value: 'C', label: 'Clear', action: 'clear', style: 'danger' },
    { value: '*', label: '*' },
    { value: '%', label: '%' },
    { value: 'Enter', label: 'Enter', action: 'enter', style: 'success' },
  ];

  const handleKeyPress = (key) => {
    if (key.action === 'clear') {
      if (onClear) onClear();
    } else if (key.action === 'enter') {
      if (onEnter) onEnter(key.value);
    } else {
      if (onValueChange) onValueChange(key.value);
    }
  };

  const getKeyStyle = (key) => {
    const baseStyle = {
      width: '100%',
      height: '60px',
      borderRadius: '8px',
      border: 'none',
      color: 'var(--classic-pos-keypad-text)',
      fontSize: key.action ? '14px' : '24px',
      fontWeight: '800',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
      transition: 'all 0.1s ease',
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
    };

    if (key.style === 'danger') {
      baseStyle.background = 'var(--classic-pos-keypad-danger-bg)';
    } else if (key.style === 'success') {
      baseStyle.background = 'var(--classic-pos-keypad-success-bg)';
    } else if (key.action) {
      baseStyle.background = 'var(--classic-pos-keypad-action-bg)';
    } else {
      baseStyle.background = 'var(--classic-pos-keypad-num-bg)';
    }

    return baseStyle;
  };

  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gridTemplateRows: 'repeat(5, 60px)',
    gap: '6px',
    padding: '8px',
    background: 'var(--classic-pos-keypad-bg)',
    borderRadius: '8px',
  };

  return (
    <div style={containerStyle}>
      {keys.map((key, index) => (
        <button
          key={index}
          style={getKeyStyle(key)}
          onClick={() => handleKeyPress(key)}
          onMouseDown={(e) => {
            e.target.style.transform = 'scale(0.95)';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)';
          }}
        >
          {key.label}
        </button>
      ))}
    </div>
  );
}
