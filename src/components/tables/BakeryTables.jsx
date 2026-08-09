/**
 * BakeryTables.jsx
 * Bakery Tables/Counters plan — pastel pinks & cream, display case counters & window bar seats
 * Fully theme-aware via CSS vars
 */

import React, { useState, useMemo } from 'react';

const DEMO_TABLES = [
  { id: 1, label: 'Table A', seats: 2, status: 'occupied',  server: 'Sneha', batch: 'Batch #4', order: 'BK-031' },
  { id: 2, label: 'Table B', seats: 4, status: 'available', server: null,    batch: null,       order: null },
  { id: 3, label: 'Table C', seats: 2, status: 'reserved',  server: null,    batch: null,       order: null },
  { id: 4, label: 'Counter 1', seats: 1, status: 'occupied', server: 'Arjun', batch: 'Batch #5', order: 'BK-032' },
  { id: 5, label: 'Counter 2', seats: 1, status: 'occupied', server: 'Nisha', batch: 'Custom',   order: 'BK-034' },
  { id: 6, label: 'Counter 3', seats: 1, status: 'available', server: null,   batch: null,       order: null },
];

const STATUS_CFG = {
  occupied:  { border: '#ec4899', bg: 'rgba(236,72,153,0.05)',  label: 'SEATED', color: '#ec4899' },
  available: { border: '#fb923c', bg: 'rgba(251,146,60,0.03)',  label: 'OPEN',   color: '#fb923c' },
  reserved:  { border: '#86efac', bg: 'rgba(134,239,172,0.05)', label: 'HOLD',   color: '#86efac' },
};

export default function BakeryTables({ tables = [], setTables, orders = [], onNavigate }) {
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
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'occupied', server: 'Sneha', batch: 'Batch #6', order: `BK-${300+selected.id}` } : t));
    setSelected(s => s ? { ...s, status: 'occupied' } : s);
  };

  const clearTable = () => {
    if (!selected) return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'available', server: null, batch: null, order: null } : t));
    setSelected(s => s ? { ...s, status: 'available' } : s);
  };

  const bg     = 'var(--theme-background, #fff8f5)';
  const surf   = 'var(--theme-background-elevated, #ffffff)';
  const surf2  = 'var(--theme-background-surface, #fef3ee)';
  const accent = 'var(--theme-primary, #ec4899)';
  const text   = 'var(--theme-text-primary, #4a2040)';
  const text2  = 'var(--theme-text-secondary, #7d3c68)';
  const text3  = 'var(--theme-text-muted, #b8849e)';
  const bdr    = 'var(--theme-border, #f3d5e8)';
  const font   = 'var(--theme-font-family, "Nunito", Inter, system-ui, sans-serif)';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: text, fontFamily: font, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #f97316 40%))`,
        color: '#fff', padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        boxShadow: '0 4px 20px rgba(236,72,153,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🥐</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.3 }}>BAKERY CAFE FLOOR</div>
            <div style={{ fontSize: 10, opacity: 0.85 }}>Tea Tables & Display Counters</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, fontWeight: 700 }}>
          <span>🌸 {data.filter(t => t.status === 'occupied').length} SEATED</span>
          <span>🥧 {data.filter(t => t.status === 'available').length} OPEN</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', background: surf, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        {[['all', 'All Seats'], ['occupied', 'Seated'], ['available', 'Open']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '5px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${filter === val ? accent : bdr}`,
            background: filter === val ? `${accent}1a` : 'transparent',
            color: filter === val ? accent : text3,
            transition: 'all 0.2s'
          }}>{lbl}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Floor Map */}
        <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, alignContent: 'start' }}>
          {visible.map(table => {
            const st = STATUS_CFG[table.status] || STATUS_CFG.available;
            const isSel = selected?.id === table.id;
            return (
              <div
                key={table.id}
                onClick={() => setSelected(table)}
                style={{
                  background: surf,
                  border: `1px solid ${bdr}`,
                  borderTop: `3px solid ${st.border}`,
                  borderRadius: 14,
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  boxShadow: isSel ? `0 4px 18px rgba(236,72,153,0.15)` : '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{table.label}</div>
                  <span style={{ color: st.color, fontSize: 10, fontWeight: 800 }}>{st.label}</span>
                </div>
                <div style={{ fontSize: 11, color: text3 }}>{table.seats} seats</div>
                {table.status === 'occupied' && (
                  <div style={{ borderTop: `1px dashed ${bdr}`, paddingTop: 6, fontSize: 11, color: text2 }}>
                    <div>Order: {table.order}</div>
                    <div style={{ marginTop: 2 }}>{table.batch}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel */}
        <div style={{ width: 260, background: surf, borderLeft: `1px solid ${bdr}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: text3, letterSpacing: 1, textTransform: 'uppercase' }}>Counter Controls</div>

          {selected ? (
            <div style={{ background: surf2, borderRadius: 10, padding: 14, border: `1px solid ${bdr}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.label}</div>
              <div style={{ fontSize: 12, color: text2 }}>{selected.seats} seats</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: STATUS_CFG[selected.status]?.color }}>{STATUS_CFG[selected.status]?.label}</div>
              {selected.server && <div style={{ fontSize: 12, color: text2 }}>Baker: {selected.server}</div>}
              {selected.order && <div style={{ fontSize: 12, color: text2 }}>Ticket: {selected.order}</div>}
            </div>
          ) : (
            <div style={{ background: surf2, borderRadius: 10, padding: 14, border: `1px solid ${bdr}`, color: text3, fontSize: 12, textAlign: 'center' }}>
              🧁 Select a seat
            </div>
          )}

          {[
            { label: '🥧 Seat Table', action: openTable, bg: accent },
            { label: '✓ Clear Ticket', action: clearTable, bg: '#fb923c' },
            { label: '📋 View Orders', action: () => onNavigate?.('orders'), bg: surf2 },
            { label: '🏠 Dashboard', action: () => onNavigate?.('dashboard'), bg: surf2 },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              width: '100%', padding: '12px 0', borderRadius: 12,
              background: btn.bg, color: btn.bg === surf2 ? text2 : '#fff', fontWeight: 800, fontSize: 12,
              border: btn.bg === surf2 ? `1px solid ${bdr}` : 'none',
              cursor: 'pointer', letterSpacing: 0.5
            }}>{btn.label}</button>
          ))}
        </div>

      </div>
    </div>
  );
}
