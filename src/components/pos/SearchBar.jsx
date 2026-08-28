import React from 'react';

export default function SearchBar({
  searchQuery,
  onSearchChange,
  onQuickCodeSubmit,
  screenSize = 'large',
  darkMode = true
}) {
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '16px'
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 44px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: '12px',
            fontSize: '14px',
            color: darkMode ? '#ffffff' : '#1f2937',
            outline: 'none'
          }}
        />
        <span style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '16px'
        }}>
          🔍
        </span>
      </div>
      <button
        onClick={onQuickCodeSubmit}
        style={{
          padding: '12px 16px',
          background: darkMode ? '#6366f1' : '#6366f1',
          color: '#ffffff',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Quick Code
      </button>
    </div>
  );
}
