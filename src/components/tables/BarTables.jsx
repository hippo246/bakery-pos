/**
 * BarTables.jsx
 * Bar Tables layout — dark purple, neon highlights, round bar stools & VIP booth zones
 * Fully theme-aware via CSS vars
 */

import React, { useState, useMemo } from 'react';

const DEMO_TABLES = [
  { id: 1, label: 'BOOTH 1', seats: 6, status: 'occupied',  server: 'Dev',   type: 'VIP',   order: 'B-071', elapsed: '45m' },
  { id: 2, label: 'BOOTH 2', seats: 6, status: 'available', server: null,    type: 'VIP',   order: null,     elapsed: null },
  { id: 3, label: 'TABLE 1', seats: 4, status: 'occupied',  server: 'Riya',  type: 'TABLE', order: 'B-072', elapsed: '20m' },
  { id: 4, label: 'TABLE 2', seats: 4, status: 'available', server: null,    type: 'TABLE', order: null,     elapsed: null },
  { id: 5, label: 'STOOL 1', seats: 1, status: 'occupied',  server: 'Dev',   type: 'BAR',   order: 'B-073', elapsed: '10m' },
  { id: 6, label: 'STOOL 2', seats: 1, status: 'occupied',  server: 'Dev',   type: 'BAR',   order: 'B-074', elapsed: '15m' },
  { id: 7, label: 'STOOL 3', seats: 1, status: 'available', server: null,    type: 'BAR',   order: null,     elapsed: null },
  { id: 8, label: 'STOOL 4', seats: 1, status: 'available', server: null,    type: 'BAR',   order: null,     elapsed: null },
];

const STATUS_CFG = {
  occupied:  { border: '#f43f5e', bg: 'rgba(244,63,94,0.1)',  label: 'ACTIVE', color: '#f43f5e', glow: 'rgba(244,63,94,0.4)' },
  available: { border: '#22d3ee', bg: 'rgba(34,211,238,0.05)', label: 'OPEN',   color: '#22d3ee', glow: 'rgba(34,211,238,0.2)' },
  reserved:  { border: '#a855f7', bg: 'rgba(168,85,247,0.05)', label: 'VIP RES',color: '#a855f7', glow: 'rgba(168,85,247,0.3)' },
};

export default function BarTables({ tables = [], setTables, orders = [], onNavigate }) {
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
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'occupied', server: 'Dev', order: `B-${200+selected.id}`, elapsed: '0m' } : t));
    setSelected(s => s ? { ...s, status: 'occupied' } : s);
  };

  const clearTable = () => {
    if (!selected) return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'available', server: null, order: null, elapsed: null } : t));
    setSelected(s => s ? { ...s, status: 'available' } : s);
  };

  const bg     = 'var(--theme-background, #06040f)';
  const surf   = 'var(--theme-background-elevated, #0e0a1e)';
  const surf2  = 'var(--theme-background-surface, #160f2e)';
  const accent = 'var(--theme-primary, #a855f7)';
  const text   = 'var(--theme-text-primary, #f0e8ff)';
  const text2  = 'var(--theme-text-secondary, #c084fc)';
  const text3  = 'var(--theme-text-muted, #6b4fa0)';
  const bdr    = 'var(--theme-border, rgba(168,85,247,0.2))';
  const font   = 'var(--theme-font-family, Inter, system-ui, sans-serif)';

  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: text, fontFamily: font, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{
        background: `linear-gradient(90deg, #160f2e, #0e0a1e)`,
        borderBottom: `1px solid ${bdr}`,
        padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        boxShadow: `0 4px 20px rgba(168,85,247,0.2)`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.8))' }}>🍻</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: 1, color: accent }}>BAR FLOOR PLAN</div>
            <div style={{ fontSize: 10, color: text3, letterSpacing: 2, textTransform: 'uppercase' }}>Booths & Bar Stools</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12, fontWeight: 700 }}>
          <span style={{ color: '#f43f5e' }}>🔴 {data.filter(t => t.status === 'occupied').length} ACTIVE</span>
          <span style={{ color: '#22d3ee' }}>🔵 {data.filter(t => t.status === 'available').length} OPEN</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 16px', background: surf, borderBottom: `1px solid ${bdr}`, flexShrink: 0 }}>
        {[['all', 'All Seats'], ['occupied', 'Active'], ['available', 'Open']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '5px 18px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${filter === val ? accent : bdr}`,
            background: filter === val ? `${accent}33` : 'transparent',
            color: filter === val ? accent : text3,
            transition: 'all 0.2s'
          }}>{lbl}</button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Floor grid */}
        <div style={{ flex: 1, padding: 14, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, alignContent: 'start' }}>
          {visible.map(table => {
            const st = STATUS_CFG[table.status] || STATUS_CFG.available;
            const isSel = selected?.id === table.id;
            const isStool = table.type === 'BAR';
            return (
              <div
                key={table.id}
                onClick={() => setSelected(table)}
                style={{
                  background: surf,
                  border: `1px solid ${st.border}44`,
                  borderTop: `2px solid ${st.border}`,
                  borderRadius: isStool ? '50%' : '10px',
                  aspectRatio: isStool ? '1' : 'auto',
                  padding: 14,
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                  boxShadow: isSel ? `0 4px 24px ${st.glow}` : 'none',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontWeight: 800, fontSize: 14, color: text }}>{table.label}</div>
                <div style={{ fontSize: 10, color: text3 }}>{table.type} · {table.seats} Pax</div>
                {table.status === 'occupied' && (
                  <div style={{ fontSize: 11, color: accent, fontWeight: 700 }}>⏱ {table.elapsed}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel */}
        <div style={{ width: 260, background: surf, borderLeft: `1px solid ${bdr}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: text3, letterSpacing: 1, textTransform: 'uppercase' }}>Section Controls</div>

          {selected ? (
            <div style={{ background: surf2, borderRadius: 10, padding: 14, border: `1px solid ${bdr}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{selected.label}</div>
              <div style={{ fontSize: 12, color: text2 }}>{selected.type} · {selected.seats} seats</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: STATUS_CFG[selected.status]?.color }}>{STATUS_CFG[selected.status]?.label}</div>
              {selected.server && <div style={{ fontSize: 12, color: text2 }}>Bartender: {selected.server}</div>}
              {selected.order && <div style={{ fontSize: 12, color: text2 }}>Tab: {selected.order}</div>}
            </div>
          ) : (
            <div style={{ background: surf2, borderRadius: 10, padding: 14, border: `1px solid ${bdr}`, color: text3, fontSize: 12, textAlign: 'center' }}>
              🍹 Select a stool/booth
            </div>
          )}

          {[
            { label: '🍹 Open Tab', action: openTable, bg: accent },
            { label: '✓ Clear Round', action: clearTable, bg: '#f43f5e' },
            { label: '📋 View Orders', action: () => onNavigate?.('orders'), bg: surf2 },
            { label: '🏠 Dashboard', action: () => onNavigate?.('dashboard'), bg: surf2 },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              width: '100%', padding: '12px 0', borderRadius: 8,
              background: btn.bg, color: '#fff', fontWeight: 800, fontSize: 12,
              border: btn.bg === 'transparent' ? `1px solid ${bdr}` : 'none',
              cursor: 'pointer', letterSpacing: 0.5, textTransform: 'uppercase'
            }}>{btn.label}</button>
          ))}
        </div>

      </div>
    </div>
  );
}
