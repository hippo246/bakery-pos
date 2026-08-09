/**
 * Fast Food POS — Function Key Panel
 *
 * Dark panel with MENU / MORE tabs and a 3×3 grid of action keys.
 * Keys use category-coded accent colors, show keyboard shortcut hints.
 */

import React, { useState } from 'react';

const MENU_BUTTONS = [
  { key: 'F1', label: 'SEARCH',     action: 'search',     icon: '🔍', color: '#3b82f6' },
  { key: 'F2', label: 'HOLD',       action: 'hold',       icon: '⏸',  color: '#f59e0b' },
  { key: 'F3', label: 'CLEAR',      action: 'clear',      icon: '🗑',  color: '#ef4444' },
  { key: 'F4', label: 'CHECKOUT',   action: 'checkout',   icon: '✅',  color: '#10b981' },
  { key: 'F5', label: 'DISCOUNT',   action: 'discount',   icon: '%',   color: '#8b5cf6' },
  { key: 'F6', label: 'CUSTOMER',   action: 'customer',   icon: '👤',  color: '#06b6d4' },
  { key: 'F7', label: 'TABLE',      action: 'table',      icon: '🪑',  color: '#f97316' },
  { key: 'F8', label: 'PRINT',      action: 'print',      icon: '🖨',  color: '#64748b' },
  { key: 'F9', label: 'SETTLEMENT', action: 'settlement', icon: '💰',  color: '#E63946' },
];

const MORE_BUTTONS = [
  { key: '',    label: 'REPORTS',      action: 'reports',      icon: '📊', color: '#3b82f6' },
  { key: 'F3',  label: 'BILL CANCEL',  action: 'bill_cancel',  icon: '❌', color: '#ef4444' },
  { key: 'F10', label: 'EXCHANGE',     action: 'exchange',     icon: '🔄', color: '#f59e0b' },
  { key: 'F11', label: 'CUSTOMER',     action: 'customer',     icon: '👤', color: '#06b6d4' },
  { key: '',    label: 'END REFUND',   action: 'end_refund',   icon: '↩',  color: '#8b5cf6' },
  { key: 'F12', label: 'EXIT',         action: 'exit',         icon: '🚪', color: '#64748b' },
  { key: '',    label: 'PRICE UPDATE', action: 'price_update', icon: '✏️', color: '#10b981' },
  { key: '',    label: 'PAY MODE',     action: 'pay_mode',     icon: '💳', color: '#f97316' },
  { key: 'F9',  label: 'DAY END',      action: 'day_end',      icon: '🌙', color: '#E63946' },
];

export default function FunctionKeyPanel({ onKeyPress }) {
  const [activeTab, setActiveTab] = useState('MENU');
  const [pressedKey, setPressedKey] = useState(null);
  const buttons = activeTab === 'MENU' ? MENU_BUTTONS : MORE_BUTTONS;

  const handleClick = (btn) => {
    setPressedKey(btn.action);
    setTimeout(() => setPressedKey(null), 150);
    onKeyPress?.(btn.key, btn.action);
  };

  return (
    <div style={{
      background: '#111116',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['MENU', 'MORE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: activeTab === tab
                ? 'linear-gradient(135deg, #E63946, #C1121F)'
                : 'rgba(255,255,255,0.05)',
              color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 11, fontWeight: 800, cursor: 'pointer',
              letterSpacing: 1.5, transition: 'all 0.18s ease',
              boxShadow: activeTab === tab ? '0 2px 10px rgba(230,57,70,0.35)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3×3 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7 }}>
        {buttons.map((btn, i) => {
          const pressed = pressedKey === btn.action;
          return (
            <button
              key={i}
              onClick={() => handleClick(btn)}
              style={{
                height: 86,
                borderRadius: 12,
                border: `1px solid ${btn.color}30`,
                background: pressed
                  ? `${btn.color}40`
                  : `linear-gradient(145deg, ${btn.color}22 0%, ${btn.color}0a 100%)`,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                transition: 'all 0.12s ease',
                transform: pressed ? 'scale(0.94)' : 'scale(1)',
                boxShadow: pressed ? 'none' : `0 2px 8px rgba(0,0,0,0.3)`,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(145deg, ${btn.color}40 0%, ${btn.color}20 100%)`;
                e.currentTarget.style.borderColor = `${btn.color}80`;
                e.currentTarget.style.transform = 'scale(1.04) translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(145deg, ${btn.color}22 0%, ${btn.color}0a 100%)`;
                e.currentTarget.style.borderColor = `${btn.color}30`;
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Color accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: btn.color, borderRadius: '12px 12px 0 0',
              }} />
              <span style={{ fontSize: 20, lineHeight: 1 }}>{btn.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', letterSpacing: 0.8, textAlign: 'center', lineHeight: 1.2 }}>
                {btn.label}
              </span>
              {btn.key && (
                <span style={{
                  fontSize: 8, color: `${btn.color}cc`, fontWeight: 700,
                  background: `${btn.color}18`, padding: '1px 5px', borderRadius: 3,
                }}>
                  {btn.key}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
