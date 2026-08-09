/**
 * CafeKitchen.jsx
 * Cafe KDS — warm earth tones, cozy, handwritten-style feel
 * Fully theme-aware via CSS vars
 */

import React, { useState, useEffect, useMemo } from 'react';

const DEMO = [
  { id: 'C-041', table:'Table 3', barista:'Priya', status:'urgent',  elapsed:95,  items:[{ n:'Flat White', mods:['Oat Milk','Extra Shot'] }, { n:'Avocado Toast', mods:['No butter','Chilli flakes'] }] },
  { id: 'C-042', table:'Table 7', barista:'Raj',   status:'normal',  elapsed:210, items:[{ n:'Latte', mods:['Soy Milk'] }, { n:'Blueberry Muffin', mods:[] }] },
  { id: 'C-043', table:'Takeaway',barista:'Ananya',status:'relaxed', elapsed:40,  items:[{ n:'Cappuccino', mods:[] }, { n:'Croissant', mods:['Warm'] }] },
  { id: 'C-044', table:'Table 1', barista:'Priya', status:'normal',  elapsed:180, items:[{ n:'Cold Brew', mods:['No sugar'] }, { n:'Caesar Salad', mods:['Dressing aside'] }, { n:'Club Sandwich', mods:['Gluten-free'] }] },
];

const STATUS_COLORS = {
  urgent:  { bg:'rgba(201,76,76,0.15)',  border:'#c94c4c', badge:'#c94c4c', label:'RUSH' },
  normal:  { bg:'rgba(212,160,68,0.12)', border:'#d4a044', badge:'#d4a044', label:'IN PROGRESS' },
  relaxed: { bg:'rgba(92,138,76,0.12)',  border:'#5c8a4c', badge:'#5c8a4c', label:'RELAXED' },
};

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function CafeKitchen({ kdsCards = [], setKdsCards }) {
  const [orders, setOrders] = useState(DEMO);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter]);
  const bump = (id) => setOrders(o => o.filter(x => x.id !== id));

  // Theme-aware tokens using CSS vars with warm cafe fallbacks
  const bg      = 'var(--theme-background, #faf5f0)';
  const surf    = 'var(--theme-background-elevated, #ffffff)';
  const surf2   = 'var(--theme-background-surface, #f5ebe0)';
  const accent  = 'var(--theme-primary, #8b5a2b)';
  const text    = 'var(--theme-text-primary, #3d2914)';
  const text2   = 'var(--theme-text-secondary, #5c4033)';
  const text3   = 'var(--theme-text-muted, #a89070)';
  const bdr     = 'var(--theme-border, #d4c4b0)';
  const font    = 'var(--theme-font-family, Georgia, serif)';
  const success = 'var(--theme-success, #5c8a4c)';
  const danger  = 'var(--theme-danger, #c94c4c)';

  return (
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{
        background:`linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 75%, black 25%))`,
        color:'#faf5f0', padding:'12px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:24 }}>☕</span>
          <div>
            <div style={{ fontWeight:700, fontSize:16, letterSpacing:0.3 }}>Café Kitchen Display</div>
            <div style={{ fontSize:11, opacity:0.8 }}>Orders in progress</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:20, fontSize:12, fontWeight:600 }}>
          <span>🔴 {orders.filter(o=>o.status==='urgent').length} Rush</span>
          <span>🟡 {orders.filter(o=>o.status==='normal').length} Active</span>
          <span>🟢 {orders.filter(o=>o.status==='relaxed').length} Relaxed</span>
        </div>
        <div style={{ fontSize:13, fontWeight:600, opacity:0.9 }}>
          {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, padding:'8px 16px', background:surf, borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
        {[['all','All'],['urgent','Rush'],['normal','Active'],['relaxed','Relaxed']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'5px 16px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer',
            border:`1px solid ${filter===val ? accent : bdr}`,
            background: filter===val ? accent : 'transparent',
            color: filter===val ? '#fff' : text2,
            transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14, alignContent:'start' }}>
        {visible.map(order => {
          const st = STATUS_COLORS[order.status];
          const elapsed = order.elapsed + tick;
          return (
            <div key={order.id} style={{
              background: surf,
              border:`1px solid ${st.border}`,
              borderRadius:14,
              padding:16,
              boxShadow:`0 3px 14px rgba(61,41,20,0.1)`,
              display:'flex', flexDirection:'column', gap:10,
              borderTopWidth:3,
            }}>
              {/* Header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15 }}>{order.table}</div>
                  <div style={{ fontSize:11, color:text3 }}>Order {order.id}</div>
                  <div style={{ fontSize:11, color:text2, marginTop:2 }}>👤 {order.barista}</div>
                </div>
                <div style={{ textAlign:'right', display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
                  <span style={{ background:st.badge, color:'#fff', padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700 }}>{st.label}</span>
                  <span style={{ fontWeight:700, fontSize:13, color: elapsed>300 ? danger : text2, fontVariantNumeric:'tabular-nums' }}>
                    ⏱ {fmtTime(elapsed)}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{ borderTop:`1px dashed ${bdr}`, paddingTop:8, display:'flex', flexDirection:'column', gap:5 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', padding:'6px 10px', background:surf2, borderRadius:8 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{item.n}</span>
                    {item.mods.length > 0 && (
                      <span style={{ fontSize:11, color:text3, marginTop:2 }}>{item.mods.join(' · ')}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action */}
              <button onClick={() => bump(order.id)} style={{
                width:'100%', padding:'10px 0', borderRadius:10,
                background:`linear-gradient(135deg, ${success}, color-mix(in srgb, ${success} 75%, black 25%))`,
                color:'#fff', fontWeight:700, fontSize:13,
                border:'none', cursor:'pointer',
                boxShadow:'0 2px 8px rgba(92,138,76,0.3)',
              }}>✓ Mark Ready</button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:text3, fontSize:15 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>☕</div>
            All drinks served — kitchen is clear
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:surf, borderTop:`1px solid ${bdr}`, padding:'8px 20px', display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, color:text3, flexShrink:0 }}>
        <span>Active Orders: {orders.length}</span>
        <span>Avg time: 5:20</span>
        <span>Completed today: 43</span>
      </div>
    </div>
  );
}
