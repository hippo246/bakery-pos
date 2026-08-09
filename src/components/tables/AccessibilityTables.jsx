/**
 * AccessibilityTables.jsx
 * Accessibility-focused Floor Plan — WCAG 2.1 AA compliant, large buttons, high-contrast, keyboard navigable
 * Fully theme-aware via CSS vars
 */

import React, { useState, useMemo } from 'react';

const DEMO_TABLES = [
  { id: 1, label: 'TABLE 1', seats: 2, status: 'occupied',  server: 'Alex',  order: '1001', duration: '15m' },
  { id: 2, label: 'TABLE 2', seats: 4, status: 'available', server: null,    order: null,   duration: null },
  { id: 3, label: 'TABLE 3', seats: 2, status: 'reserved',  server: null,    order: null,   duration: null },
  { id: 4, label: 'TABLE 4', seats: 6, status: 'available', server: null,    order: null,   duration: null },
  { id: 5, label: 'TABLE 5', seats: 2, status: 'occupied',  server: 'Jamie', order: '1002', duration: '30m' },
  { id: 6, label: 'TABLE 6', seats: 4, status: 'available', server: null,    order: null,   duration: null },
];

const STATUS_CFG = {
  occupied:  { border: '#cc0000', bg: '#cc0000', fg: '#ffffff', label: 'SEATED / BUSY' },
  available: { border: '#006400', bg: '#006400', fg: '#ffffff', label: 'AVAILABLE' },
  reserved:  { border: '#a06000', bg: '#a06000', fg: '#ffffff', label: 'RESERVED' },
};

export default function AccessibilityTables({ tables = [], setTables, orders = [], onNavigate }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [localTables, setLocal] = useState(DEMO_TABLES);

  const data = tables.length > 0 ? tables : localTables;
  const setData = tables.length > 0 ? setTables : setLocal;

  const visible = useMemo(() =>
    filter === 'all' ? data : data.filter(t => t.status === filter)
  , [data, filter]);

  const openTable = () => {
    if (!selected || selected.status !== 'available') return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'occupied', server: 'Alex', order: `100${selected.id}`, duration: '0m' } : t));
    setSelected(s => s ? { ...s, status: 'occupied' } : s);
  };

  const clearTable = () => {
    if (!selected) return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'available', server: null, order: null, duration: null } : t));
    setSelected(s => s ? { ...s, status: 'available' } : s);
  };

  const bg     = 'var(--theme-background, #ffffff)';
  const surf   = 'var(--theme-background-elevated, #f0f0f0)';
  const surf2  = 'var(--theme-background-surface, #e8e8e8)';
  const text   = 'var(--theme-text-primary, #000000)';
  const text2  = 'var(--theme-text-secondary, #222222)';
  const text3  = 'var(--theme-text-muted, #444444)';
  const bdr    = 'var(--theme-border, #000000)';
  const accent = 'var(--theme-primary, #0058cc)';
  const font   = 'var(--theme-font-family, "Atkinson Hyperlegible", Arial, sans-serif)';

  return (
    <div
      role="main"
      aria-label="Table management system"
      style={{ width: '100%', height: '100%', background: bg, color: text, fontFamily: font, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontSize: 18 }}
    >
      
      {/* Header */}
      <header role="banner" style={{
        background: accent,
        color: '#fff', padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        borderBottom: '3px solid #003a8c'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span role="img" aria-label="Table Layout Icon" style={{ fontSize: 28 }}>📍</span>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.3 }}>TABLE MANAGEMENT</div>
            <div style={{ fontSize: 13, opacity: 0.9 }}>High Contrast / Keyboard Friendly Layout</div>
          </div>
        </div>
        <div role="status" aria-live="polite" style={{ display: 'flex', gap: 24, fontSize: 15, fontWeight: 800 }}>
          <span>🔴 {data.filter(t => t.status === 'occupied').length} OCCUPIED</span>
          <span>🟢 {data.filter(t => t.status === 'available').length} FREE</span>
        </div>
      </header>

      {/* Navigation Filter */}
      <nav role="navigation" aria-label="Filter tables" style={{ display: 'flex', gap: 8, padding: '10px 20px', background: surf, borderBottom: `2px solid ${bdr}`, flexShrink: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 14, alignSelf: 'center', marginRight: 8, color: text3 }}>FILTER VIEW:</span>
        {[['all', 'All Tables'], ['occupied', 'Seated Only'], ['available', 'Available Only']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            aria-pressed={filter === val}
            style={{
              padding: '8px 22px', borderRadius: 6, fontSize: 14, fontWeight: 800, cursor: 'pointer',
              border: `3px solid ${filter === val ? bdr : '#888'}`,
              background: filter === val ? bdr : 'transparent',
              color: filter === val ? bg : text,
              outlineOffset: 2
            }}
          >{lbl}</button>
        ))}
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Table List */}
        <div
          role="list"
          aria-label="Dining room tables"
          style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, alignContent: 'start' }}
        >
          {visible.map(table => {
            const st = STATUS_CFG[table.status] || STATUS_CFG.available;
            const isSel = selected?.id === table.id;
            return (
              <button
                key={table.id}
                role="listitem"
                aria-pressed={isSel}
                aria-label={`${table.label}, ${table.seats} seats, Status: ${st.label}`}
                onClick={() => setSelected(table)}
                style={{
                  background: surf,
                  border: `3px solid ${isSel ? bdr : st.border}`,
                  borderRadius: 10,
                  padding: 18,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  outline: isSel ? `4px solid ${accent}` : 'none',
                  outlineOffset: 2,
                  textAlign: 'left'
                }}
              >
                <div style={{ background: st.bg, color: st.fg, textAlign: 'center', padding: '4px 0', borderRadius: 6, fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>
                  {st.label}
                </div>
                <div style={{ fontWeight: 950, fontSize: 20, color: text }}>{table.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: text2 }}>{table.seats} SEATS</div>
                {table.status === 'occupied' && (
                  <div style={{ fontSize: 14, color: text3, fontWeight: 700 }}>
                    Time: {table.duration} | Server: {table.server}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action panel */}
        <div style={{ width: 280, background: surf, borderLeft: `3px solid ${bdr}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, flexShrink: 0 }}>
          <h2 style={{ fontWeight: 900, fontSize: 16, color: text3, textTransform: 'uppercase', margin: 0 }}>Table Controls</h2>

          {selected ? (
            <div style={{ background: surf2, borderRadius: 10, padding: 16, border: `2px solid ${bdr}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontWeight: 950, fontSize: 22 }}>{selected.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: text2 }}>{selected.seats} seats total</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: STATUS_CFG[selected.status]?.border }}>{STATUS_CFG[selected.status]?.label}</div>
              {selected.server && <div style={{ fontSize: 14, fontWeight: 700 }}>Server: {selected.server}</div>}
              {selected.order && <div style={{ fontSize: 14, fontWeight: 700 }}>Order ID: {selected.order}</div>}
            </div>
          ) : (
            <div style={{ background: surf2, borderRadius: 10, padding: 16, border: `2px solid ${bdr}`, color: text3, fontSize: 15, textAlign: 'center', fontWeight: 700 }}>
              Select a table above
            </div>
          )}

          {[
            { label: '🟢 OPEN TABLE', action: openTable, bg: accent, fg: '#fff' },
            { label: '✓ CLEAR TABLE', action: clearTable, bg: '#006400', fg: '#fff' },
            { label: '📋 VIEW ORDERS', action: () => onNavigate?.('orders'), bg: surf2, fg: text },
            { label: '🏠 DASHBOARD', action: () => onNavigate?.('dashboard'), bg: surf2, fg: text },
          ].map((btn, i) => (
            <button
              key={i}
              onClick={btn.action}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 8,
                background: btn.bg, color: btn.fg, fontWeight: 900, fontSize: 14,
                border: `3px solid ${bdr}`, cursor: 'pointer',
              }}
            >{btn.label}</button>
          ))}
        </div>

      </div>
    </div>
  );
}
