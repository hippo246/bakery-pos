/**
 * FineDiningTables.jsx
 * Fine Dining Tables — premium dark and gold look, table course & reservation status
 * Fully theme-aware via CSS vars
 */

import React, { useState, useMemo } from 'react';

const DEMO_TABLES = [
  { id: 1, label: 'Table 1',  seats: 2, status: 'occupied',  server: 'Arnav', course: 'Entrée',   covers: 2, order: 'FD-019', duration: '25m' },
  { id: 2, label: 'Table 2',  seats: 4, status: 'occupied',  server: 'Meera', course: 'Main',     covers: 3, order: 'FD-020', duration: '45m' },
  { id: 3, label: 'Table 3',  seats: 2, status: 'reserved',  server: null,    course: null,       covers: 0, order: null,     duration: null },
  { id: 4, label: 'Table 4',  seats: 6, status: 'available', server: null,    course: null,       covers: 0, order: null,     duration: null },
  { id: 5, label: 'Table 5',  seats: 2, status: 'occupied',  server: 'Kai',   course: 'Dessert',  covers: 2, order: 'FD-021', duration: '60m' },
  { id: 6, label: 'Table 6',  seats: 4, status: 'available', server: null,    course: null,       covers: 0, order: null,     duration: null },
  { id: 7, label: 'Cabinet 1',seats: 8, status: 'occupied',  server: 'Meera', course: 'Main',     covers: 6, order: 'FD-022', duration: '35m' },
  { id: 8, label: 'Cabinet 2',seats: 4, status: 'reserved',  server: null,    course: null,       covers: 0, order: null,     duration: null },
];

const STATUS_CFG = {
  occupied:  { border: '#c9a962', bg: 'rgba(201,169,98,0.1)',  label: 'SERVICE', color: '#c9a962' },
  available: { border: '#7fb069', bg: 'rgba(127,176,105,0.05)', label: 'AVAILABLE',color: '#7fb069' },
  reserved:  { border: '#d4a044', bg: 'rgba(212,160,68,0.05)',  label: 'RESERVED', color: '#d4a044' },
  cleaning:  { border: '#4a90d9', bg: 'rgba(74,144,217,0.05)',  label: 'RESETTING',color: '#4a90d9' },
};

export default function FineDiningTables({ tables = [], setTables, orders = [], onNavigate }) {
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
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'occupied', server: 'Arnav', course: 'Amuse', covers: 2, order: `FD-${100+selected.id}`, duration: '0m' } : t));
    setSelected(s => s ? { ...s, status: 'occupied' } : s);
  };

  const clearTable = () => {
    if (!selected) return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'available', server: null, course: null, order: null, duration: null } : t));
    setSelected(s => s ? { ...s, status: 'available' } : s);
  };

  const bg     = 'var(--theme-background, #0a0a0a)';
  const surf   = 'var(--theme-background-elevated, #141414)';
  const surf2  = 'var(--theme-background-surface, #1a1a1a)';
  const accent = 'var(--theme-primary, #c9a962)';
  const text   = 'var(--theme-text-primary, #f5f5f5)';
  const text2  = 'var(--theme-text-secondary, #b8b8b8)';
  const text3  = 'var(--theme-text-muted, #666)';
  const bdr    = 'var(--theme-border, #2a2a2a)';
  const font   = 'var(--theme-font-family, "Playfair Display", Georgia, serif)';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: text, fontFamily: font, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{
        background: 'linear-gradient(90deg, #111, #1a1a1a, #111)',
        borderBottom: `1px solid ${accent}44`,
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, color: accent }}>✦</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: 1, color: accent }}>SALON MAP</div>
            <div style={{ fontSize: 10, color: text3, letterSpacing: 2, textTransform: 'uppercase' }}>Fine Dining Service Layout</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
          <span>⚜️ {data.filter(t => t.status === 'occupied').length} OCCUPIED</span>
          <span>🗝️ {data.filter(t => t.status === 'available').length} FREE</span>
        </div>
        <div style={{ fontSize: 12, color: text3, letterSpacing: 1 }}>
          {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 0, padding: '0 24px', background: surf, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        {[['all', 'All Tables'], ['occupied', 'Service'], ['available', 'Available'], ['reserved', 'Reserved']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '10px 20px', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            background: 'transparent', border: 'none',
            borderBottom: filter === val ? `2px solid ${accent}` : '2px solid transparent',
            color: filter === val ? accent : text3,
            letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.2s'
          }}>{lbl}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Table Map */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, alignContent: 'start' }}>
          {visible.map(table => {
            const st = STATUS_CFG[table.status] || STATUS_CFG.available;
            const isSel = selected?.id === table.id;
            return (
              <div
                key={table.id}
                onClick={() => setSelected(table)}
                style={{
                  background: surf,
                  border: `1px solid ${isSel ? accent : bdr}`,
                  borderTop: `3px solid ${st.color}`,
                  borderRadius: 6,
                  padding: 16,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 10,
                  boxShadow: isSel ? `0 4px 20px rgba(201,169,98,0.25)` : 'none',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: text }}>{table.label}</div>
                    <div style={{ fontSize: 11, color: text3 }}>{table.seats} covers</div>
                  </div>
                  <span style={{ color: st.color, fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>{st.label}</span>
                </div>
                {table.status === 'occupied' && (
                  <div style={{ borderTop: `1px solid ${bdr}`, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 12, color: accent, fontWeight: 500 }}>{table.course}</div>
                    <div style={{ fontSize: 11, color: text2 }}>Server: {table.server}</div>
                    <div style={{ fontSize: 11, color: text3 }}>Time: {table.duration}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel */}
        <div style={{ width: 260, background: surf, borderLeft: `1px solid ${bdr}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 11, color: text3, letterSpacing: 1, textTransform: 'uppercase' }}>Table Service Details</div>

          {selected ? (
            <div style={{ background: surf2, borderRadius: 6, padding: 14, border: `1px solid ${bdr}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 18 }}>{selected.label}</div>
              <div style={{ fontSize: 12, color: text2 }}>{selected.seats} seats</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: STATUS_CFG[selected.status]?.color }}>{STATUS_CFG[selected.status]?.label}</div>
              {selected.server && <div style={{ fontSize: 12, color: text2 }}>Server: {selected.server}</div>}
              {selected.course && <div style={{ fontSize: 12, color: accent }}>Course: {selected.course}</div>}
            </div>
          ) : (
            <div style={{ background: surf2, borderRadius: 6, padding: 14, border: `1px solid ${bdr}`, color: text3, fontSize: 12, textAlign: 'center' }}>
              ✦ Select a table
            </div>
          )}

          {[
            { label: '⚜️ Open Table', action: openTable, bg: accent, fg: '#0a0a0a' },
            { label: '✓ Clear Table', action: clearTable, bg: 'transparent', fg: text },
            { label: '📋 View Orders', action: () => onNavigate?.('orders'), bg: 'transparent', fg: text },
            { label: '🏠 Dashboard', action: () => onNavigate?.('dashboard'), bg: surf2, fg: text },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              width: '100%', padding: '12px 0', borderRadius: 4,
              background: btn.bg, color: btn.fg, fontWeight: 700, fontSize: 12,
              border: btn.bg === 'transparent' ? `1px solid ${bdr}` : 'none',
              cursor: 'pointer', letterSpacing: 1, textTransform: 'uppercase'
            }}>{btn.label}</button>
          ))}
        </div>

      </div>
    </div>
  );
}
