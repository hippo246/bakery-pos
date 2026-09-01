import React from 'react';

export default function ShortcutsButton({
  onClick,
  darkMode = true
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 10px',
        background: darkMode ? '#222222' : '#f3f4f6',
        color: darkMode ? '#d1d5db' : '#111111',
        border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}
      title="Press F1 for shortcuts"
    >
      ⌨️ Shortcuts
    </button>
  );
}
