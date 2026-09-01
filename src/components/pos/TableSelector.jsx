import React from 'react';

export default function TableSelector({
  tables,
  selectedTable,
  onSelectTable,
  screenSize = 'large',
  darkMode = true
}) {
  return (
    <div style={{
      background: darkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
    }}>
      <div style={{
        fontSize: '14px',
        fontWeight: '600',
        color: darkMode ? '#e0e0e0' : '#111111',
        marginBottom: '12px'
      }}>
        🪑 Table
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: '8px'
      }}>
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => onSelectTable(table.id === selectedTable?.id ? null : table)}
            style={{
              padding: '12px',
              background: selectedTable?.id === table.id
                ? (darkMode ? '#6366f1' : '#6366f1')
                : (darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb'),
              color: selectedTable?.id === table.id
                ? '#ffffff'
                : (darkMode ? '#888888' : '#6b7280'),
              border: selectedTable?.id === table.id
                ? 'none'
                : `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (selectedTable?.id !== table.id) {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (selectedTable?.id !== table.id) {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb';
              }
            }}
          >
            {table.name}
          </button>
        ))}
      </div>
    </div>
  );
}
