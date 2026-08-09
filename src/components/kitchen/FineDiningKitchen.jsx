/**
 * FineDiningKitchen.jsx
 * Fine Dining KDS — dark, elegant, gold accents, serif typography
 * Fully theme-aware via CSS vars
 */

import React, { useState, useEffect, useMemo } from 'react';

const DEMO = [
  { id: 'FD-019', table:'Table 12', covers:2, server:'Arnav', course:'Entrée',   status:'urgent',  elapsed:380, items:[{ n:'Beef Carpaccio', notes:'Rare, truffle oil aside' }, { n:'Burrata', notes:'Heirloom tomatoes' }] },
  { id: 'FD-020', table:'Private',  covers:6, server:'Meera', course:'Main',     status:'normal',  elapsed:210, items:[{ n:'Duck Confit', notes:'Medium, sauce on side' }, { n:'Sea Bass', notes:'No capers' }, { n:'Wagyu Tenderloin', notes:'Medium-rare' }] },
  { id: 'FD-021', table:'Table 5',  covers:2, server:'Kai',   course:'Dessert',  status:'relaxed', elapsed:60,  items:[{ n:'Soufflé au Chocolat', notes:'18 min notice given' }, { n:'Crème Brûlée', notes:'' }] },
  { id: 'FD-022', table:'Bar',      covers:1, server:'Arnav', course:'Amuse-bouche', status:'normal', elapsed:90, items:[{ n:'Oyster Mignonette', notes:'' }] },
];

const STATUS_CFG = {
  urgent:  { label:'URGENT',  color:'#b84747', glow:'rgba(184,71,71,0.3)' },
  normal:  { label:'SERVICE', color:'#c9a962', glow:'rgba(201,169,98,0.25)' },
  relaxed: { label:'TIMING',  color:'#7fb069', glow:'rgba(127,176,105,0.2)' },
};

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function FineDiningKitchen({ kdsCards = [], setKdsCards }) {
  const [orders, setOrders] = useState(DEMO);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter]);
  const fire = (id) => setOrders(o => o.filter(x => x.id !== id));

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
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{
        background:`linear-gradient(90deg, #111, #1a1a1a, #111)`,
        borderBottom:`1px solid ${accent}44`,
        padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:22, filter:'drop-shadow(0 0 8px rgba(201,169,98,0.6))' }}>✦</span>
          <div>
            <div style={{ fontWeight:600, fontSize:16, letterSpacing:1, color:accent }}>KITCHEN BRIGADE</div>
            <div style={{ fontSize:10, color:text3, letterSpacing:2, textTransform:'uppercase' }}>Fine Dining Display System</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:24, fontSize:11, letterSpacing:1, textTransform:'uppercase' }}>
          {['urgent','normal','relaxed'].map(s => (
            <span key={s} style={{ color: STATUS_CFG[s].color }}>
              {orders.filter(o=>o.status===s).length} {STATUS_CFG[s].label}
            </span>
          ))}
        </div>
        <div style={{ fontSize:12, color:text3, letterSpacing:1 }}>
          {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display:'flex', gap:0, padding:'0 24px', background:surf, borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
        {[['all','All Courses'],['urgent','Urgent'],['normal','Service'],['relaxed','Timing']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'10px 20px', fontSize:11, fontWeight:500, cursor:'pointer',
            background:'transparent', border:'none',
            borderBottom: filter===val ? `2px solid ${accent}` : '2px solid transparent',
            color: filter===val ? accent : text3,
            letterSpacing:1, textTransform:'uppercase', transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* Cards grid */}
      <div style={{ flex:1, overflowY:'auto', padding:20, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16, alignContent:'start' }}>
        {visible.map(order => {
          const st = STATUS_CFG[order.status];
          const elapsed = order.elapsed + tick;
          return (
            <div key={order.id} style={{
              background: surf,
              border:`1px solid ${bdr}`,
              borderTop:`2px solid ${st.color}`,
              borderRadius:8,
              padding:20,
              boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${bdr}`,
              display:'flex', flexDirection:'column', gap:12,
            }}>
              {/* Header row */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:15, color:text }}>{order.table}</div>
                  <div style={{ fontSize:11, color:text3, letterSpacing:0.5, marginTop:2 }}>{order.course} · {order.covers} covers</div>
                  <div style={{ fontSize:11, color:text2, marginTop:2 }}>Service: {order.server}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:st.color, fontSize:10, fontWeight:600, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize:16, fontWeight:700, color: elapsed>480 ? '#b84747' : text, fontVariantNumeric:'tabular-nums' }}>
                    {fmtTime(elapsed)}
                  </div>
                </div>
              </div>

              {/* Gold divider */}
              <div style={{ height:1, background:`linear-gradient(90deg, transparent, ${accent}44, transparent)` }} />

              {/* Items */}
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ padding:'8px 12px', background:surf2, borderRadius:5, borderLeft:`2px solid ${accent}44` }}>
                    <div style={{ fontWeight:500, fontSize:13, color:text }}>{item.n}</div>
                    {item.notes && <div style={{ fontSize:11, color:text3, marginTop:3, fontStyle:'italic' }}>{item.notes}</div>}
                  </div>
                ))}
              </div>

              {/* Fire button */}
              <button onClick={() => fire(order.id)} style={{
                width:'100%', padding:'10px 0', borderRadius:5,
                background:`linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, black 30%))`,
                color:'#0a0a0a', fontWeight:700, fontSize:12,
                border:'none', cursor:'pointer', letterSpacing:1, textTransform:'uppercase',
              }}>FIRE · COURSE READY</button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:text3 }}>
            <div style={{ fontSize:40, marginBottom:12, color:accent }}>✦</div>
            <div style={{ letterSpacing:2, textTransform:'uppercase', fontSize:13 }}>Kitchen Awaiting Orders</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:surf, borderTop:`1px solid ${bdr}`, padding:'8px 24px', display:'flex', justifyContent:'space-between', fontSize:11, letterSpacing:1, color:text3, flexShrink:0, textTransform:'uppercase' }}>
        <span>Active: {orders.length}</span>
        <span style={{ color:accent }}>Avg Course Time: 18 min</span>
        <span>Tonight: 34 covers</span>
      </div>
    </div>
  );
}
