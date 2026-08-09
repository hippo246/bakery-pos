/**
 * BarKitchen.jsx
 * Bar/Pub KDS — dark neon-purple/cyan aesthetic, fast round-based workflow
 * Fully theme-aware via CSS vars
 */

import React, { useState, useEffect, useMemo } from 'react';

const DEMO = [
  { id: 'B-071', section:'BAR',     bartender:'Dev',    status:'urgent',  elapsed:55,  type:'DRINKS', items:[{ n:'Mojito ×2', notes:'Extra mint, light sugar' }, { n:'Aperol Spritz', notes:'' }] },
  { id: 'B-072', section:'TABLE 4', bartender:'Riya',   status:'normal',  elapsed:190, type:'FOOD',   items:[{ n:'Nachos', notes:'Jalapeños on side' }, { n:'Wings 12pc', notes:'Honey-sriracha' }, { n:'Cheese Fries', notes:'' }] },
  { id: 'B-073', section:'BAR',     bartender:'Dev',    status:'relaxed', elapsed:35,  type:'DRINKS', items:[{ n:'Old Fashioned', notes:'Rye whiskey' }, { n:'Virgin Mojito', notes:'' }] },
  { id: 'B-074', section:'TABLE 8', bartender:'Sam',    status:'urgent',  elapsed:78,  type:'MIXED',  items:[{ n:'Tequila Shots ×4', notes:'' }, { n:'Sliders ×2', notes:'Medium' }] },
];

const STATUS_CFG = {
  urgent:  { label:'RUSH', border:'#f43f5e', glow:'rgba(244,63,94,0.5)' },
  normal:  { label:'ACTIVE', border:'#a855f7', glow:'rgba(168,85,247,0.3)' },
  relaxed: { label:'CHILL', border:'#22d3ee', glow:'rgba(34,211,238,0.25)' },
};

const TYPE_ICON = { DRINKS:'🍹', FOOD:'🍔', MIXED:'🍻' };

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function BarKitchen({ kdsCards = [], setKdsCards }) {
  const [orders, setOrders] = useState(DEMO);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter]);
  const serve = (id) => setOrders(o => o.filter(x => x.id !== id));

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
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{
        background:`linear-gradient(90deg, #160f2e, #0e0a1e)`,
        borderBottom:`1px solid ${bdr}`,
        padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
        boxShadow:`0 4px 20px rgba(168,85,247,0.2)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, filter:'drop-shadow(0 0 10px rgba(168,85,247,0.8))' }}>🍻</span>
          <div>
            <div style={{ fontWeight:800, fontSize:15, letterSpacing:1, color:accent, textShadow:'0 0 20px rgba(168,85,247,0.6)' }}>BAR KDS</div>
            <div style={{ fontSize:10, color:text3, letterSpacing:2, textTransform:'uppercase' }}>Drinks &amp; Kitchen Display</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:20, fontSize:12, fontWeight:700 }}>
          <span style={{ color:'#f43f5e' }}>🔴 {orders.filter(o=>o.status==='urgent').length} Rush</span>
          <span style={{ color:'#a855f7' }}>🟣 {orders.filter(o=>o.status==='normal').length} Active</span>
          <span style={{ color:'#22d3ee' }}>🔵 {orders.filter(o=>o.status==='relaxed').length} Chill</span>
        </div>
        <div style={{ fontSize:12, color:text2, fontWeight:700, fontVariantNumeric:'tabular-nums' }}>
          {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:6, padding:'8px 16px', background:surf, borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
        {[['all','All'],['urgent','Rush'],['normal','Active'],['relaxed','Chill']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'5px 18px', borderRadius:20, fontSize:11, fontWeight:700, cursor:'pointer',
            border:`1px solid ${filter===val ? accent : bdr}`,
            background: filter===val ? `${accent}33` : 'transparent',
            color: filter===val ? accent : text3,
            transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
        <div style={{ flex:1 }} />
        <button style={{ padding:'5px 14px', borderRadius:20, fontSize:11, background:'transparent', border:`1px solid ${bdr}`, color:text3, cursor:'pointer' }}>
          🍹 DRINKS
        </button>
        <button style={{ padding:'5px 14px', borderRadius:20, fontSize:11, background:'transparent', border:`1px solid ${bdr}`, color:text3, cursor:'pointer' }}>
          🍔 FOOD
        </button>
      </div>

      {/* Cards */}
      <div style={{ flex:1, overflowY:'auto', padding:14, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12, alignContent:'start' }}>
        {visible.map(order => {
          const st = STATUS_CFG[order.status];
          const elapsed = order.elapsed + tick;
          return (
            <div key={order.id} style={{
              background: surf,
              border:`1px solid ${st.border}44`,
              borderTop:`2px solid ${st.border}`,
              borderRadius:10,
              padding:14,
              boxShadow:`0 4px 24px ${st.glow}`,
              display:'flex', flexDirection:'column', gap:10,
            }}>
              {/* Card header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:18 }}>{TYPE_ICON[order.type] || '🍹'}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:14, color:text }}>{order.section}</div>
                      <div style={{ fontSize:10, color:text3, letterSpacing:0.5 }}>{order.bartender}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:text3, marginTop:4 }}>#{order.id} · {order.type}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:st.border, fontSize:10, fontWeight:800, letterSpacing:1, marginBottom:4 }}>{st.label}</div>
                  <div style={{ fontSize:16, fontWeight:800, color: elapsed>180 ? '#f43f5e' : text2, fontVariantNumeric:'tabular-nums', textShadow: elapsed>180 ? '0 0 10px rgba(244,63,94,0.5)' : 'none' }}>
                    {fmtTime(elapsed)}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ background:surf2, borderRadius:7, padding:'7px 10px', borderLeft:`2px solid ${accent}55` }}>
                    <div style={{ fontWeight:700, fontSize:12, color:text }}>{item.n}</div>
                    {item.notes && <div style={{ fontSize:10, color:text3, marginTop:2 }}>{item.notes}</div>}
                  </div>
                ))}
              </div>

              {/* Serve button */}
              <button onClick={() => serve(order.id)} style={{
                width:'100%', padding:'10px 0', borderRadius:8,
                background:`linear-gradient(135deg, ${accent}, #7c3aed)`,
                color:'#fff', fontWeight:800, fontSize:12,
                border:'none', cursor:'pointer', letterSpacing:0.5,
                boxShadow:`0 3px 12px ${accent}55`,
              }}>🍹 SERVED — CLEAR</button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:text3 }}>
            <div style={{ fontSize:40, marginBottom:12, filter:'drop-shadow(0 0 10px rgba(168,85,247,0.4))' }}>🍻</div>
            <div style={{ fontSize:14, letterSpacing:1 }}>Bar's all clear — time to party!</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:surf, borderTop:`1px solid ${bdr}`, padding:'7px 20px', display:'flex', justifyContent:'space-between', fontSize:11, color:text3, fontWeight:700, flexShrink:0 }}>
        <span>Active: {orders.length} rounds</span>
        <span style={{ color:accent }}>■ LIVE BAR FEED</span>
        <span>Served tonight: 128</span>
      </div>
    </div>
  );
}
