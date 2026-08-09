/**
 * AccessibilityKitchen.jsx
 * Accessibility-first KDS — very high contrast, large text, clear layout
 * WCAG 2.1 AA+, keyboard-navigable, screen-reader friendly
 * Fully theme-aware via CSS vars
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';

const DEMO = [
  { id: '1001', table:'TABLE 3', server:'Alex',  status:'urgent',  elapsed:90,  items:[{ n:'Grilled Salmon', mods:'No sauce, Allergy: nuts' }, { n:'Caesar Salad', mods:'Dressing on side' }] },
  { id: '1002', table:'TABLE 7', server:'Jamie', status:'normal',  elapsed:240, items:[{ n:'Pasta Primavera', mods:'Gluten-free pasta' }, { n:'Garlic Bread', mods:'' }] },
  { id: '1003', table:'TAKEOUT', server:'Sam',   status:'relaxed', elapsed:55,  items:[{ n:'Burger Combo', mods:'Large fries, No pickles' }] },
];

const STATUS_CFG = {
  urgent:  { label:'URGENT — MAKE NOW', border:'#cc0000', bg:'#cc0000', fg:'#ffffff', btnBg:'#cc0000' },
  normal:  { label:'IN PROGRESS',       border:'#a06000', bg:'#a06000', fg:'#ffffff', btnBg:'#a06000' },
  relaxed: { label:'RELAXED — OK',      border:'#006400', bg:'#006400', fg:'#ffffff', btnBg:'#006400' },
};

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m} min ${String(s).padStart(2,'0')} sec`;
}

export default function AccessibilityKitchen({ kdsCards = [], setKdsCards }) {
  const [orders, setOrders] = useState(DEMO);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);
  const mainRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter]);
  const complete = (id) => setOrders(o => o.filter(x => x.id !== id));

  const bg     = 'var(--theme-background, #ffffff)';
  const surf   = 'var(--theme-background-elevated, #f0f0f0)';
  const surf2  = 'var(--theme-background-surface, #e8e8e8)';
  const text   = 'var(--theme-text-primary, #000000)';
  const text2  = 'var(--theme-text-secondary, #222222)';
  const text3  = 'var(--theme-text-muted, #444444)';
  const bdr    = 'var(--theme-border, #000000)';
  const font   = 'var(--theme-font-family, "Atkinson Hyperlegible", Arial, sans-serif)';
  const accent = 'var(--theme-primary, #0058cc)';

  return (
    <div
      role="main"
      aria-label="Kitchen Display System"
      style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden', fontSize:18 }}
    >

      {/* Header */}
      <header role="banner" style={{
        background: accent,
        color:'#fff', padding:'14px 24px',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
        borderBottom:'3px solid #003a8c',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span role="img" aria-label="Chef hat" style={{ fontSize:28 }}>👨‍🍳</span>
          <div>
            <div style={{ fontWeight:900, fontSize:20, letterSpacing:0.3 }}>KITCHEN ORDERS</div>
            <div style={{ fontSize:13, opacity:0.9 }}>Accessibility Display — Large Text Mode</div>
          </div>
        </div>
        <div role="status" aria-live="polite" style={{ display:'flex', gap:24, fontSize:15, fontWeight:800 }}>
          <span>🔴 {orders.filter(o=>o.status==='urgent').length} URGENT</span>
          <span>🟡 {orders.filter(o=>o.status==='normal').length} IN PROGRESS</span>
          <span>🟢 {orders.filter(o=>o.status==='relaxed').length} RELAXED</span>
        </div>
        <div role="timer" aria-label="Current time" style={{ fontSize:16, fontWeight:800, fontVariantNumeric:'tabular-nums' }}>
          {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        </div>
      </header>

      {/* Filter nav */}
      <nav role="navigation" aria-label="Filter orders" style={{ display:'flex', gap:8, padding:'10px 20px', background:surf, borderBottom:`2px solid ${bdr}`, flexShrink:0 }}>
        <span style={{ fontWeight:700, fontSize:14, alignSelf:'center', marginRight:8, color:text3 }}>FILTER:</span>
        {[['all','All Orders'],['urgent','Urgent Only'],['normal','In Progress'],['relaxed','Relaxed']].map(([val,lbl]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            aria-pressed={filter === val}
            style={{
              padding:'8px 22px', borderRadius:6, fontSize:14, fontWeight:800, cursor:'pointer',
              border:`3px solid ${filter===val ? bdr : '#888'}`,
              background: filter===val ? bdr : 'transparent',
              color: filter===val ? bg : text,
              outline: filter===val ? `3px solid ${accent}` : 'none',
              outlineOffset:2,
            }}
          >{lbl}</button>
        ))}
      </nav>

      {/* Cards */}
      <div
        ref={mainRef}
        role="list"
        aria-label="Kitchen order tickets"
        style={{ flex:1, overflowY:'auto', padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:18, alignContent:'start' }}
      >
        {visible.map(order => {
          const st = STATUS_CFG[order.status];
          const elapsed = order.elapsed + tick;
          return (
            <article
              key={order.id}
              role="listitem"
              aria-label={`Order ${order.id}, ${order.table}, status: ${st.label}, elapsed: ${fmtTime(elapsed)}`}
              style={{
                background: surf,
                border:`3px solid ${st.border}`,
                borderRadius:10,
                padding:18,
                display:'flex', flexDirection:'column', gap:12,
              }}
            >
              {/* Status banner */}
              <div style={{ background:st.bg, color:st.fg, textAlign:'center', padding:'8px 0', borderRadius:6, fontWeight:900, fontSize:16, letterSpacing:0.5 }}>
                {st.label}
              </div>

              {/* Order info */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:900, fontSize:22, lineHeight:1 }}>ORDER #{order.id}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:text2, marginTop:4 }}>{order.table}</div>
                  <div style={{ fontSize:14, color:text3, marginTop:2 }}>Server: {order.server}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:14, color:text3, fontWeight:600 }}>Time:</div>
                  <div role="timer" style={{ fontSize:20, fontWeight:900, color: elapsed>300 ? '#cc0000' : text, fontVariantNumeric:'tabular-nums', lineHeight:1.2 }}>
                    {fmtTime(elapsed)}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop:`2px solid ${bdr}` }} />

              {/* Items */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <div style={{ fontWeight:900, fontSize:15, color:text3, letterSpacing:0.5 }}>ITEMS:</div>
                {order.items.map((item, i) => (
                  <div key={i} style={{ background:surf2, border:`2px solid ${bdr}55`, borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontWeight:800, fontSize:16 }}>{item.n}</div>
                    {item.mods && <div style={{ fontSize:13, color:text3, marginTop:4, fontWeight:600 }}>{item.mods}</div>}
                  </div>
                ))}
              </div>

              {/* Complete button */}
              <button
                onClick={() => complete(order.id)}
                aria-label={`Mark order ${order.id} as complete`}
                style={{
                  width:'100%', padding:'14px 0', borderRadius:8,
                  background: accent,
                  color:'#fff', fontWeight:900, fontSize:16,
                  border:`3px solid #003a8c`, cursor:'pointer',
                  letterSpacing:0.5,
                  outline:'none',
                }}
                onFocus={(e) => e.target.style.outline=`4px solid ${accent}`}
                onBlur={(e) => e.target.style.outline='none'}
              >
                ✅ MARK COMPLETE — ORDER #{order.id}
              </button>
            </article>
          );
        })}
        {visible.length === 0 && (
          <div role="status" style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:text3 }}>
            <div style={{ fontSize:50, marginBottom:16 }}>✅</div>
            <div style={{ fontSize:22, fontWeight:900 }}>ALL ORDERS COMPLETE</div>
            <div style={{ fontSize:15, marginTop:6 }}>No pending kitchen orders</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ background:surf, borderTop:`2px solid ${bdr}`, padding:'10px 24px', display:'flex', justifyContent:'space-between', fontSize:14, fontWeight:700, color:text3, flexShrink:0 }}>
        <span>Active Orders: {orders.length}</span>
        <span>WCAG 2.1 AA+ Mode</span>
        <span>Completed Today: 52</span>
      </footer>
    </div>
  );
}
