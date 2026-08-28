import React from 'react';

export default function QuickActions({
  onHoldOrder,
  onVoidItem,
  onDiscount,
  onTip,
  onNotes,
  onSplitBill,
  onShortcuts,
  screenSize = 'large',
  darkMode = true
}) {
  const actions = [
    { id: 'hold', label: 'Hold Order', icon: '⏸️', color: '#f59e0b', action: onHoldOrder },
    { id: 'void', label: 'Void Item', icon: '❌', color: '#ef4444', action: onVoidItem },
    { id: 'discount', label: 'Discount', icon: '🏷️', color: '#8b5cf6', action: onDiscount },
    { id: 'tip', label: 'Add Tip', icon: '💖', color: '#ec4899', action: onTip },
    { id: 'notes', label: 'Notes', icon: '📝', color: '#3b82f6', action: onNotes },
    { id: 'split', label: 'Split Bill', icon: '✂️', color: '#10b981', action: onSplitBill },
    { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️', color: '#6b7280', action: onShortcuts }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: screenSize === 'small' ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
      gap: '8px'
    }}>
      {actions.map(action => (
        <button
          key={action.id}
          onClick={action.action}
          style={{
            padding: screenSize === 'small' ? '12px' : '14px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '20px' }}>{action.icon}</span>
          <span style={{
            fontSize: screenSize === 'small' ? '11px' : '12px',
            fontWeight: '500',
            color: darkMode ? '#e0e0e0' : '#374151'
          }}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
