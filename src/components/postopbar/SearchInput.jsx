import React from 'react';

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  darkMode = true
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        padding: '6px 8px',
        background: darkMode ? '#1f1f1f' : '#f9fafb',
        color: darkMode ? '#f3f4f6' : '#1f2937',
        border: `1px solid ${darkMode ? '#444' : '#e5e7eb'}`,
        borderRadius: '4px',
        fontSize: '11px',
        width: '150px'
      }}
    />
  );
}
