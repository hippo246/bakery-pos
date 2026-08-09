/**
 * FastFoodTablesSimple.jsx
 * Fast Food Simple — bold queue/station view, no floor plan, just ticket-style slots
 * Fully theme-aware via CSS vars
 */

import React, { useState } from 'react';

const SLOTS = [
  { id: 1, label: 'DT1', type: 'DRIVE-THRU', status: 'occupied', order: '#2847', covers: 1, elapsed: '2:34', server: 'Dev' },
  { id: 2, label: 'DT2', type: 'DRIVE-THRU', status: 'occupied', order: '#2848', covers: 1, elapsed: '1:10', server: 'Dev' },
  { id: 3, label: 'DI 1', type: 'DINE-IN',   status: 'available', order: null,    covers: 0, elapsed: null,   server: null },
  { id: 4, label: 'DI 2', type: 'DINE-IN',   status: 'occupied', order: '#2849', covers: 3, elapsed: '5:20', server: 'Riya' },
  { id: 5, label: 'DI 3', type: 'DINE-IN',   status: 'available', order: null,   covers: 0, elapsed: null,   server: null },
  { id: 6, label: 'CO 1', type: 'CARRYOUT',  status: 'occupied', order: '#2850', covers: 1, elapsed: '0:55', server: 'Sam' },
  { id: 7, label: 'CO 2', type: 'CARRYOUT',  status: 'available',order: null,    covers: 0, elapsed: null,   server: null },
  { id: 8, label: 'DEL',  type: 'DELIVERY',  status: 'occupied', order: '#2851', covers: 1, elapsed: '8:12', server: 'Zara' },
];

const STATUS_CFG = {
  occupied:  { label: 'OCCUPIED',  bg: '#dc2626', light: '#fee2e2' },
  available: { label: 'OPEN',      bg: '#16a34a', light: '#dcfce7' },
  reserved:  { label: 'RESERVED',  bg: '#ca8a04', light: '#fef9c3' },
  cleaning:  { label: 'CLEANING',  bg: '#2563eb', light: '#dbeafe' },
};

const TYPE_ICON = { 'DRIVE-THRU':'🚗', 'DINE-IN':'🍽️', 'CARRYOUT':'📦', 'DELIVERY':'🛵' };

export default function FastFoodTablesSimple({ tables = [], setTables, orders = [], onNavigate }) {
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState(SLOTS);

  const clear = (id) => setSlots(s => s.map(x => x.id === id ? { ...x, status: 'available', order: null, elapsed: null } : x));
  const open  = (id) => setSlots(s => s.map(x => x.id === id && x.status === 'available' ? { ...x, status: 'occupied', order: `#${2900 + id}`, elapsed: '0:00' } : x));

  const bg     = 'var(--theme-background, #0a0a0a)';
  const surf   = 'var(--theme-background-elevated, #111)';
  const surf2  = 'var(--theme-background-surface, #1a1a1a)';
  const accent = 'var(--theme-primary, #E63946)';
  const text   = 'var(--theme-text-primary, #f0f0f0)';
  const text2  = 'var(--theme-text-secondary, #aaa)';
  const bdr    = 'var(--theme-border, rgba(255,255,255,0.08))';
  const font   = 'var(--theme-font-family, Inter, Arial, sans-serif)';

  const counts = {
    occupied: slots.filter(s=>s.status==='occupied').length,
    available: slots.filter(s=>s.status==='available').length,
  };

  return (
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 70%, black))`, padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>📍</span>
          <span style={{ fontWeight:900, fontSize:15, letterSpacing:1 }}>STATION MAP</span>
        </div>
        <div style={{ display:'flex', gap:20, fontSize:12, fontWeight:800 }}>
          <span>🔴 {counts.occupied} Occupied</span>
          <span>🟢 {counts.available} Open</span>
          <span>TOTAL: {slots.length}</span>
        </div>
        <div style={{ fontSize:12, fontWeight:700 }}>{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>

        {/* Station grid */}
        <div style={{ flex:1, padding:16, overflowY:'auto', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12, alignContent:'start' }}>
          {slots.map(slot => {
            const st = STATUS_CFG[slot.status] || STATUS_CFG.available;
            const isSel = selected?.id === slot.id;
            return (
              <div
                key={slot.id}
                onClick={() => setSelected(slot)}
                style={{
                  background: surf,
                  border: `2px solid ${isSel ? '#ffd700' : slot.status === 'occupied' ? accent : '#16a34a'}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: isSel ? `0 0 18px rgba(255,215,0,0.4)` : 'none',
                  display: 'flex', flexDirection:'column', gap:8,
                }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                {/* Slot header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:20 }}>{slot.label}</div>
                    <div style={{ fontSize:11, color:text2 }}>{TYPE_ICON[slot.type]} {slot.type}</div>
                  </div>
                  <div style={{ background:st.bg, color:'#fff', padding:'3px 10px', borderRadius:6, fontSize:10, fontWeight:900 }}>{st.label}</div>
                </div>
                {slot.status === 'occupied' && (
                  <div style={{ borderTop:`1px solid ${bdr}`, paddingTop:8, display:'flex', flexDirection:'column', gap:3 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{slot.order}</div>
                    <div style={{ fontSize:11, color:text2 }}>⏱ {slot.elapsed} · 👤 {slot.server}</div>
                  </div>
                )}
                {slot.status === 'available' && (
                  <div style={{ color:'#16a34a', fontSize:12, fontWeight:700 }}>✓ Ready to seat</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div style={{ width:260, background:surf, borderLeft:`1px solid ${bdr}`, display:'flex', flexDirection:'column', gap:12, padding:16, flexShrink:0 }}>
          <div style={{ fontWeight:900, fontSize:13, letterSpacing:1, color:text2, textTransform:'uppercase' }}>Station Actions</div>

          {selected ? (
            <div style={{ background:surf2, borderRadius:10, padding:14, border:`1px solid ${bdr}`, display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ fontWeight:800, fontSize:18 }}>{selected.label}</div>
              <div style={{ fontSize:12, color:text2 }}>{TYPE_ICON[selected.type]} {selected.type}</div>
              <div style={{ fontSize:12, color: STATUS_CFG[selected.status]?.bg, fontWeight:800 }}>{STATUS_CFG[selected.status]?.label}</div>
              {selected.order && <div style={{ fontSize:13, fontWeight:700 }}>Order: {selected.order}</div>}
              {selected.elapsed && <div style={{ fontSize:12, color:text2 }}>Time: {selected.elapsed}</div>}
            </div>
          ) : (
            <div style={{ background:surf2, borderRadius:10, padding:14, border:`1px solid ${bdr}`, color:text2, fontSize:13, textAlign:'center' }}>
              Select a station
            </div>
          )}

          {[
            { label:'🟢 OPEN STATION', action:() => selected && open(selected.id),   bg:'#16a34a' },
            { label:'✓ CLEAR STATION', action:() => selected && clear(selected.id),  bg:'#2563eb' },
            { label:'📋 VIEW ORDERS',  action:() => onNavigate?.('orders'),           bg:accent },
            { label:'🏠 DASHBOARD',    action:() => onNavigate?.('dashboard'),         bg:surf2 },
          ].map((btn,i) => (
            <button key={i} onClick={btn.action} style={{
              width:'100%', padding:'12px 0', borderRadius:8,
              background:btn.bg, color:'#fff', fontWeight:800, fontSize:13,
              border:`1px solid ${bdr}`, cursor:'pointer', letterSpacing:0.5,
            }}>{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
