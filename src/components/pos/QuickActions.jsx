import React from 'react';

const ACTION_DEFS = [
  { id: 'hold', label: 'Hold Order', icon: '⏸️', color: '#f59e0b', handlerProp: 'onHoldOrder' },
  { id: 'void', label: 'Void Item', icon: '❌', color: '#ef4444', handlerProp: 'onVoidItem' },
  { id: 'discount', label: 'Discount', icon: '🏷️', color: '#8b5cf6', handlerProp: 'onDiscount' },
  { id: 'tip', label: 'Add Tip', icon: '💖', color: '#ec4899', handlerProp: 'onTip' },
  { id: 'notes', label: 'Notes', icon: '📝', color: '#3b82f6', handlerProp: 'onNotes' },
  { id: 'split', label: 'Split Bill', icon: '✂️', color: '#10b981', handlerProp: 'onSplitBill' },
  { id: 'shortcuts', label: 'Shortcuts', icon: '⌨️', color: '#6b7280', handlerProp: 'onShortcuts' }
];

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
  const handlers = { onHoldOrder, onVoidItem, onDiscount, onTip, onNotes, onSplitBill, onShortcuts };
  const actions = ACTION_DEFS.map(def => ({ ...def, action: handlers[def.handlerProp] }));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: screenSize === 'small' ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
      gap: '8px'
    }}>
      {actions.map(action => (
        <button
          key={action.id}
          type="button"
          onClick={action.action}
          disabled={!action.action}
          aria-label={action.label}
          title={action.label}
          style={{
            padding: screenSize === 'small' ? '12px' : '14px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
            border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
            borderLeft: `3px solid ${action.color}`,
            borderRadius: '10px',
            cursor: action.action ? 'pointer' : 'not-allowed',
            opacity: action.action ? 1 : 0.5,
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            outlineColor: action.color
          }}
          onMouseEnter={(e) => {
            if (!action.action) return;
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          onMouseDown={(e) => {
            if (!action.action) return;
            e.currentTarget.style.transform = 'translateY(0) scale(0.97)';
          }}
          onMouseUp={(e) => {
            if (!action.action) return;
            e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
          }}
          onFocus={(e) => {
            if (!action.action) return;
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.08)' : '#f9fafb';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff';
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: screenSize === 'small' ? '32px' : '36px',
              height: screenSize === 'small' ? '32px' : '36px',
              borderRadius: '50%',
              background: `${action.color}22`,
              fontSize: '18px'
            }}
          >
            {action.icon}
          </span>
          <span style={{
            fontSize: screenSize === 'small' ? '11px' : '12px',
            fontWeight: '500',
            color: darkMode ? '#e0e0e0' : '#111111'
          }}>
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}
