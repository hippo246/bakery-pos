/**
 * BakeryKitchen.jsx
 * Bakery KDS — soft pastels, pink/cream palette, oven-batch focused
 * Fully theme-aware via CSS vars
 */

import React, { useState, useEffect, useMemo } from 'react';

const DEMO = [
  { id: 'BK-031', oven:'OVEN 1', baker:'Sneha',  status:'urgent',  elapsed:50,  batch:'Batch #4', items:[{ n:'Sourdough Loaf ×3', notes:'Score diagonal' }, { n:'Cinnamon Rolls ×6', notes:'Extra icing' }] },
  { id: 'BK-032', oven:'STAND',  baker:'Arjun',  status:'normal',  elapsed:180, batch:'Batch #5', items:[{ n:'Croissants ×12', notes:'Egg wash done' }, { n:'Pain au chocolat ×6', notes:'' }] },
  { id: 'BK-033', oven:'OVEN 2', baker:'Sneha',  status:'relaxed', elapsed:30,  batch:'Batch #6', items:[{ n:'Blueberry Muffins ×8', notes:'Crumble top' }, { n:'Banana Bread ×2', notes:'Half walnuts' }] },
  { id: 'BK-034', oven:'DECO',   baker:'Nisha',  status:'normal',  elapsed:120, batch:'Custom',   items:[{ n:'Custom Cake — Birthday', notes:'Strawberry cream, blue piping' }, { n:'Fondant Roses', notes:'6 pcs' }] },
];

const STATUS_CFG = {
  urgent:  { label:'⚡ URGENT', bg:'rgba(236,72,153,0.12)',  border:'#ec4899', text:'#ec4899' },
  normal:  { label:'🕐 BAKING', bg:'rgba(251,146,60,0.10)',  border:'#fb923c', text:'#fb923c' },
  relaxed: { label:'✓ RELAXED', bg:'rgba(134,239,172,0.10)', border:'#86efac', text:'#86efac' },
};

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}

export default function BakeryKitchen({ kdsCards = [], setKdsCards }) {
  const [orders, setOrders] = useState(DEMO);
  const [filter, setFilter] = useState('all');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const visible = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter]);
  const done = (id) => setOrders(o => o.filter(x => x.id !== id));

  const bg     = 'var(--theme-background, #fff8f5)';
  const surf   = 'var(--theme-background-elevated, #ffffff)';
  const surf2  = 'var(--theme-background-surface, #fef3ee)';
  const accent = 'var(--theme-primary, #ec4899)';
  const text   = 'var(--theme-text-primary, #4a2040)';
  const text2  = 'var(--theme-text-secondary, #7d3c68)';
  const text3  = 'var(--theme-text-muted, #b8849e)';
  const bdr    = 'var(--theme-border, #f3d5e8)';
  const font   = 'var(--theme-font-family, "Nunito", Inter, system-ui, sans-serif)';
  const success= 'var(--theme-success, #4caf78)';

  return (
    <div style={{ width:'100%', height:'100%', background:bg, color:text, fontFamily:font, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Header */}
      <div style={{
        background:`linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 60%, #f97316 40%))`,
        color:'#fff', padding:'12px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0,
        boxShadow:'0 4px 20px rgba(236,72,153,0.3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, filter:'drop-shadow(0 0 8px rgba(255,255,255,0.5))' }}>🥐</span>
          <div>
            <div style={{ fontWeight:800, fontSize:15, letterSpacing:0.3 }}>Bakery Production Board</div>
            <div style={{ fontSize:10, opacity:0.85 }}>Live oven & decoration queue</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:20, fontSize:12, fontWeight:700 }}>
          <span>🔴 {orders.filter(o=>o.status==='urgent').length} Urgent</span>
          <span>🟡 {orders.filter(o=>o.status==='normal').length} Baking</span>
          <span>🟢 {orders.filter(o=>o.status==='relaxed').length} Relaxed</span>
        </div>
        <div style={{ fontSize:12, fontWeight:600, opacity:0.9 }}>
          {new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, padding:'8px 16px', background:surf, borderBottom:`1px solid ${bdr}`, flexShrink:0 }}>
        {[['all','All Batches'],['urgent','Urgent'],['normal','Baking'],['relaxed','Relaxed']].map(([val,lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding:'5px 18px', borderRadius:20, fontSize:12, fontWeight:700, cursor:'pointer',
            border:`1px solid ${filter===val ? accent : bdr}`,
            background: filter===val ? `${accent}1a` : 'transparent',
            color: filter===val ? accent : text3,
            transition:'all 0.2s',
          }}>{lbl}</button>
        ))}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:text3, alignSelf:'center' }}>🕐 Avg bake: 22 min</span>
      </div>

      {/* Cards */}
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14, alignContent:'start' }}>
        {visible.map(order => {
          const st = STATUS_CFG[order.status];
          const elapsed = order.elapsed + tick;
          return (
            <div key={order.id} style={{
              background: surf,
              border:`1px solid ${bdr}`,
              borderTop:`3px solid ${st.border}`,
              borderRadius:14,
              padding:16,
              boxShadow:`0 4px 18px rgba(236,72,153,0.07)`,
              display:'flex', flexDirection:'column', gap:10,
            }}>
              {/* Card header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ background:`${st.border}22`, color:st.text, borderRadius:6, padding:'2px 10px', fontSize:10, fontWeight:800 }}>
                      {order.oven}
                    </div>
                  </div>
                  <div style={{ fontWeight:700, fontSize:14, marginTop:4 }}>{order.batch}</div>
                  <div style={{ fontSize:11, color:text3 }}>Baker: {order.baker}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:st.text, fontSize:10, fontWeight:800, marginBottom:4 }}>{st.label}</div>
                  <div style={{ fontSize:16, fontWeight:800, fontVariantNumeric:'tabular-nums', color: elapsed>360 ? '#ec4899' : text2 }}>
                    {fmtTime(elapsed)}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop:`1px dashed ${bdr}` }} />

              {/* Items */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ background:surf2, borderRadius:10, padding:'8px 12px' }}>
                    <div style={{ fontWeight:700, fontSize:12.5, color:text }}>{item.n}</div>
                    {item.notes && <div style={{ fontSize:11, color:text3, marginTop:2, fontStyle:'italic' }}>{item.notes}</div>}
                  </div>
                ))}
              </div>

              {/* Done button */}
              <button onClick={() => done(order.id)} style={{
                width:'100%', padding:'10px 0', borderRadius:12,
                background:`linear-gradient(135deg, ${accent}, color-mix(in srgb, ${accent} 70%, #f97316 30%))`,
                color:'#fff', fontWeight:800, fontSize:13,
                border:'none', cursor:'pointer',
                boxShadow:`0 4px 14px rgba(236,72,153,0.4)`,
              }}>🥐 OUT OF OVEN — DONE</button>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:text3 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🧁</div>
            <div style={{ fontSize:15 }}>All batches complete — ovens cooling!</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background:surf, borderTop:`1px solid ${bdr}`, padding:'8px 20px', display:'flex', justifyContent:'space-between', fontSize:11, color:text3, fontWeight:600, flexShrink:0 }}>
        <span>Active batches: {orders.length}</span>
        <span style={{ color:accent }}>🥐 Bakery Production Board</span>
        <span>Baked today: 126 items</span>
      </div>
    </div>
  );
}
