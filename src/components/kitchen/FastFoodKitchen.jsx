/**
 * FastFoodKitchen.jsx
 * Standard Fast-Food KDS — bold, high-contrast, speed-focused
 * Uses theme CSS vars so it adapts to light/dark themes
 */

import React, { useState, useEffect, useMemo } from 'react';

const DEMO = [
  { id: '2847', type: 'DRIVE-THRU', status: 'urgent',  elapsed: 82,  items: [{ n:'Big Mac Meal', mods:['Large','No Pickles'] }, { n:'McFlurry', mods:['Oreo'] }] },
  { id: '2848', type: 'DINE-IN',    status: 'normal',  elapsed: 210, items: [{ n:'Zinger Burger', mods:['Extra Spicy'] }, { n:'Fries', mods:[] }, { n:'Coke', mods:['No Ice'] }] },
  { id: '2849', type: 'CARRYOUT',   status: 'relaxed', elapsed: 45,  items: [{ n:'Pan Pizza', mods:['Mushrooms'] }, { n:'Pepsi', mods:[] }] },
  { id: '2850', type: 'DRIVE-THRU', status: 'urgent',  elapsed: 105, items: [{ n:'Quarter Pounder', mods:['Extra Cheese'] }, { n:'Hot Wings 6pc', mods:['Ranch'] }] },
  { id: '2851', type: 'ONLINE',     status: 'normal',  elapsed: 130, items: [{ n:'Family Bucket', mods:[] }, { n:'2x Fries', mods:['Salt-Free'] }] },
];

const STATUS = {
  urgent:  { label:'URGENT',  bg:'#dc2626', text:'#fff', border:'#dc2626' },
  normal:  { label:'ON TIME', bg:'#ca8a04', text:'#fff', border:'#ca8a04' },
  relaxed: { label:'RELAXED', bg:'#16a34a', text:'#fff', border:'#16a34a' },
};

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function FastFoodKitchen({ kdsCards = [], setKdsCards }) {
  const [orders, setOrders] = useState(DEMO);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status === filter);
  }, [orders, filter]);

  const bump = (id) => setOrders(o => o.filter(x => x.id !== id));

  const stats = useMemo(() => ({
    urgent: orders.filter(o => o.status === 'urgent').length,
    normal: orders.filter(o => o.status === 'normal').length,
    relaxed: orders.filter(o => o.status === 'relaxed').length,
  }), [orders]);

  const bg     = 'var(--theme-background, #0a0a0a)';
  const surf   = 'var(--theme-background-elevated, #111)';
  const surf2  = 'var(--theme-background-surface, #1a1a1a)';
  const bdr    = 'var(--theme-border, rgba(255,255,255,0.08))';
  const accent = 'var(--theme-primary, #E63946)';
  const text   = 'var(--theme-text-primary, #f0f0f0)';
  const text2  = 'var(--theme-text-secondary, #aaa)';
  const font   = 'var(--theme-font-family, Inter, Arial, sans-serif)';

  return (
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(90deg, ${accent}, color-mix(in srgb, ${accent} 70%, black))`, padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:20 }}>🍔</span>
          <span style={{ fontWeight:900, fontSize:15, letterSpacing:1 }}>FAST FOOD KDS</span>
        </div>
        <div style={{ display:'flex', gap:16, fontSize:12, fontWeight:800 }}>
          <span>🔴 {stats.urgent} URGENT</span>
          <span>🟡 {stats.normal} NORMAL</span>
          <span>🟢 {stats.relaxed} RELAXED</span>
        </div>
        <div style={{ fontWeight:700, fontSize:12 }}>
          {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:6, padding:'8px 12px', background:surf, borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
        {[['all','All Orders'],['urgent','Urgent'],['normal','On Time'],['relaxed','Relaxed']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'5px 14px', borderRadius:6, fontSize:11, fontWeight:800, cursor:'pointer', border:'none',
            background: filter === val ? accent : surf2,
            color: filter === val ? '#fff' : text2,
            letterSpacing:0.5,
          }}>{lbl}</button>
        ))}
      </div>

      {/* Ticket grid */}
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:12, alignContent:'start' }}>
        {visible.map(order => {
          const st = STATUS[order.status];
          const elapsed = order.elapsed + tick;
          const overdue = elapsed > 300;
          return (
            <div key={order.id} style={{
              background: surf,
              border: `2px solid ${overdue ? '#dc2626' : st.border}`,
              borderRadius: 10,
              padding: 12,
              display:'flex', flexDirection:'column', gap:8,
              boxShadow: overdue ? `0 0 16px rgba(220,38,38,0.4)` : 'none',
              animation: overdue ? 'pulse-red 1.5s infinite' : 'none',
            }}>
              {/* Card header */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:16 }}>#{order.id}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:text2, letterSpacing:0.5 }}>{order.type}</div>
                </div>
                <div style={{ textAlign:'right', display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
                  <span style={{ background:st.bg, color:st.text, padding:'3px 8px', borderRadius:4, fontSize:10, fontWeight:900 }}>{st.label}</span>
                  <span style={{ fontWeight:900, fontSize:14, color: elapsed > 300 ? '#dc2626' : text, fontVariantNumeric:'tabular-nums' }}>
                    ⏱ {fmtTime(elapsed)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{ borderTop:`1px solid ${bdr}`, paddingTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ background:surf2, borderRadius:6, padding:'6px 10px' }}>
                    <div style={{ fontWeight:700, fontSize:12 }}>{item.n}</div>
                    {item.mods.length > 0 && (
                      <div style={{ fontSize:10, color:text2, marginTop:2 }}>{item.mods.join(' · ')}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <button onClick={() => bump(order.id)} style={{
                width:'100%', padding:'10px 0', borderRadius:8,
                background:`linear-gradient(135deg, #16a34a, #15803d)`,
                color:'#fff', fontWeight:900, fontSize:13,
                border:'none', cursor:'pointer', letterSpacing:0.5,
                boxShadow:'0 3px 10px rgba(22,163,74,0.35)',
              }}>⚡ BUMP COMPLETE</button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:48, color:text2, fontSize:16 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            All clear — no pending orders
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div style={{ background:surf, borderTop:`1px solid ${bdr}`, padding:'6px 16px', display:'flex', gap:24, fontSize:11, fontWeight:700, color:text2, flexShrink:0 }}>
        <span>TOTAL: {orders.length}</span>
        <span>AVG TIME: 4:30</span>
        <span>COMPLETED TODAY: 87</span>
        <div style={{ flex:1 }}/>
        <span style={{ color: accent }}>■ LIVE</span>
      </div>

      <style>{`
        @keyframes pulse-red {
          0%,100% { box-shadow: 0 0 16px rgba(220,38,38,0.4); }
          50% { box-shadow: 0 0 28px rgba(220,38,38,0.7); }
        }
      `}</style>
    </div>
  );
}
