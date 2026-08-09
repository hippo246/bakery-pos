/**
 * CafeTables.jsx
 * Cafe floor-plan view — warm tones, rounded sofas/chairs, indoor zones
 * Fully theme-aware via CSS vars
 */

import React, { useState, useMemo } from 'react';

const DEMO_TABLES = [
  { id:1, label:'T1',  zone:'Indoor',  seats:2,  shape:'round',  status:'occupied', server:'Priya',  order:'C-041', duration:'12 min', x:60,  y:60  },
  { id:2, label:'T2',  zone:'Indoor',  seats:4,  shape:'square', status:'available',server:null,    order:null,    duration:null,     x:200, y:60  },
  { id:3, label:'T3',  zone:'Indoor',  seats:2,  shape:'round',  status:'reserved', server:'Raj',   order:null,    duration:null,     x:340, y:60  },
  { id:4, label:'T4',  zone:'Window',  seats:2,  shape:'round',  status:'available',server:null,    order:null,    duration:null,     x:60,  y:200 },
  { id:5, label:'T5',  zone:'Window',  seats:4,  shape:'square', status:'occupied', server:'Ananya',order:'C-042', duration:'7 min',  x:200, y:200 },
  { id:6, label:'T6',  zone:'Outdoor', seats:4,  shape:'round',  status:'available',server:null,    order:null,    duration:null,     x:340, y:200 },
  { id:7, label:'T7',  zone:'Outdoor', seats:6,  shape:'square', status:'occupied', server:'Priya', order:'C-043', duration:'3 min',  x:60,  y:340 },
  { id:8, label:'BAR', zone:'Bar',     seats:8,  shape:'bar',    status:'occupied', server:'Raj',   order:'C-044', duration:'20 min', x:200, y:340 },
  { id:9, label:'S1',  zone:'Sofa',    seats:3,  shape:'sofa',   status:'available',server:null,    order:null,    duration:null,     x:340, y:340 },
];

const STATUS_CFG = {
  occupied:  { border:'#b87333', bg:'#c8a882', label:'Occupied',  icon:'☕' },
  available: { border:'#5c8a4c', bg:'#a8c99a', label:'Available', icon:'○' },
  reserved:  { border:'#d4a044', bg:'#e8c878', label:'Reserved',  icon:'🔖' },
  cleaning:  { border:'#4a90d9', bg:'#9abde0', label:'Cleaning',  icon:'🧹' },
};

const ZONE_COLORS = {
  Indoor:  '#f0e8dc',
  Window:  '#e8f4f0',
  Outdoor: '#edf4e0',
  Bar:     '#f4e8e8',
  Sofa:    '#f0eaf8',
};

export default function CafeTables({ tables = [], setTables, orders = [], onNavigate }) {
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [localTables, setLocal] = useState(DEMO_TABLES);

  const data = tables.length > 0 ? tables : localTables;
  const setData = tables.length > 0 ? setTables : setLocal;

  const visible = useMemo(() =>
    filter === 'all' ? data : data.filter(t => t.status === filter)
  , [data, filter]);

  const openTable = () => {
    if (!selected || selected.status !== 'available') return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'occupied', server: 'New Server', order: `C-${100+selected.id}`, duration: '0 min' } : t));
    setSelected(s => s ? { ...s, status: 'occupied' } : s);
  };

  const clearTable = () => {
    if (!selected) return;
    setData(d => d.map(t => t.id === selected.id ? { ...t, status: 'available', server: null, order: null, duration: null } : t));
    setSelected(s => s ? { ...s, status: 'available' } : s);
  };

  // Theme tokens
  const bg     = 'var(--theme-background, #faf5f0)';
  const surf   = 'var(--theme-background-elevated, #ffffff)';
  const surf2  = 'var(--theme-background-surface, #f5ebe0)';
  const accent = 'var(--theme-primary, #8b5a2b)';
  const text   = 'var(--theme-text-primary, #3d2914)';
  const text2  = 'var(--theme-text-secondary, #6b4a2b)';
  const text3  = 'var(--theme-text-muted, #b8a090)';
  const bdr    = 'var(--theme-border, #d4c4b0)';
  const font   = 'var(--theme-font-family, Georgia, serif)';

  const zones = [...new Set(data.map(t => t.zone))];

  return (
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, black 30%))`, color:'#faf5f0', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>☕</span>
          <div>
            <div style={{ fontWeight:700, fontSize:16 }}>Café Floor Plan</div>
            <div style={{ fontSize:11, opacity:0.85 }}>{data.filter(t=>t.status==='occupied').length}/{data.length} tables occupied</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:18, fontSize:12, fontWeight:600 }}>
          <span>🟤 {data.filter(t=>t.status==='occupied').length} Occupied</span>
          <span>🟢 {data.filter(t=>t.status==='available').length} Free</span>
          <span>🟡 {data.filter(t=>t.status==='reserved').length} Reserved</span>
        </div>
        <div style={{ fontSize:13, fontWeight:600, opacity:0.9 }}>{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, padding:'8px 16px', background:surf, borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
        {[['all','All Tables'],['occupied','Occupied'],['available','Available'],['reserved','Reserved']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'5px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
            border:`1px solid ${filter===val ? accent : bdr}`,
            background: filter===val ? accent : 'transparent',
            color: filter===val ? '#fff' : text2,
            transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Floor plan — zone-grouped cards */}
        <div style={{ flex:1, padding:16, overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>
          {zones.map(zone => (
            <div key={zone}>
              <div style={{ fontSize:11, fontWeight:700, color:text3, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>{zone} Area</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10 }}>
                {visible.filter(t=>t.zone===zone).map(table => {
                  const st = STATUS_CFG[table.status] || STATUS_CFG.available;
                  const isSel = selected?.id === table.id;
                  return (
                    <div
                      key={table.id}
                      onClick={() => setSelected(table)}
                      style={{
                        background: surf,
                        border: `2px solid ${isSel ? '#d4a044' : st.border}`,
                        borderRadius: table.shape === 'round' ? 50 : table.shape === 'sofa' ? 16 : 10,
                        padding: '14px 10px',
                        cursor: 'pointer',
                        textAlign:'center',
                        transition:'transform 0.15s, box-shadow 0.15s',
                        boxShadow: isSel ? `0 0 16px rgba(212,160,68,0.5)` : `0 2px 8px rgba(61,41,20,0.1)`,
                        display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
                    >
                      <div style={{ fontSize:24 }}>{st.icon}</div>
                      <div style={{ fontWeight:800, fontSize:15 }}>{table.label}</div>
                      <div style={{ fontSize:10, color:text3 }}>{table.seats} seats</div>
                      {table.server && <div style={{ fontSize:10, color:text2, fontWeight:600 }}>{table.server}</div>}
                      {table.duration && <div style={{ fontSize:10, color:accent }}>{table.duration}</div>}
                      <div style={{ fontSize:9, fontWeight:700, color:st.border, textTransform:'uppercase', letterSpacing:0.5 }}>{st.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div style={{ width:260, background:surf, borderLeft:`1px solid ${bdr}`, padding:16, display:'flex', flexDirection:'column', gap:12, flexShrink:0 }}>
          <div style={{ fontWeight:700, fontSize:13, color:text3, textTransform:'uppercase', letterSpacing:1 }}>Table Details</div>

          {selected ? (
            <div style={{ background:surf2, borderRadius:12, padding:14, border:`1px solid ${bdr}`, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontWeight:800, fontSize:20 }}>{selected.label}</div>
              <div style={{ fontSize:12, color:text2 }}>{selected.zone} · {selected.seats} seats</div>
              <div style={{ fontSize:12, fontWeight:700, color: STATUS_CFG[selected.status]?.border, textTransform:'uppercase' }}>{STATUS_CFG[selected.status]?.label}</div>
              {selected.server && <div style={{ fontSize:12, color:text2 }}>Server: {selected.server}</div>}
              {selected.order  && <div style={{ fontSize:12, color:text2 }}>Order: {selected.order}</div>}
              {selected.duration && <div style={{ fontSize:12, color:accent, fontWeight:600 }}>Time: {selected.duration}</div>}
            </div>
          ) : (
            <div style={{ background:surf2, borderRadius:12, padding:14, border:`1px solid ${bdr}`, color:text3, fontSize:13, textAlign:'center' }}>
              ☕ Select a table
            </div>
          )}

          {[
            { label:'☕ Open Table',   action: openTable,                         bg: accent },
            { label:'✓ Clear Table',   action: clearTable,                        bg: '#5c8a4c' },
            { label:'📋 View Orders',  action: () => onNavigate?.('orders'),      bg: '#4a7ab5' },
            { label:'🏠 Dashboard',    action: () => onNavigate?.('dashboard'),   bg: surf2 },
          ].map((btn,i) => (
            <button key={i} onClick={btn.action} style={{
              width:'100%', padding:'11px 0', borderRadius:10,
              background: btn.bg, color:'#fff', fontWeight:700, fontSize:13,
              border:`1px solid ${bdr}`, cursor:'pointer',
            }}>{btn.label}</button>
          ))}

          {/* Legend */}
          <div style={{ marginTop:'auto', borderTop:`1px dashed ${bdr}`, paddingTop:10, display:'flex', flexDirection:'column', gap:5 }}>
            {Object.entries(STATUS_CFG).map(([k,v]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:8, fontSize:11 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:v.border }} />
                <span style={{ color:text3 }}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
