import React from 'react';
import { useState, useMemo, useEffect, memo, startTransition } from "react";
import { getOrderAmount, getOrderDisplayItems, getOrderCustomerName } from "../../domain/orderModel.js";
import floorEngine from "../../tables/FloorEngine.js";
import { useSecurity } from "../../hooks/useSecurity.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeNumber = (val) => Number.isFinite(Number(val)) ? Number(val) : 0;
const safeArray  = (arr) => Array.isArray(arr) ? arr : [];
const formatMoney = (n) => {
  const num = safeNumber(n);
  return (num < 0 ? "-₹" : "₹") + Math.abs(num).toLocaleString("en-IN");
};
const timeSince = (iso) => {
  if (!iso) return "-";
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
};

// ── Animated Number ───────────────────────────────────────────────────────────
const AnimatedNumber = ({ value, format = (v) => v, duration = 900 }) => {
  const [disp, setDisp] = useState(value);
  useEffect(() => {
    let start = null, raf, from = disp;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(2, -10 * p);
      setDisp(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick); else setDisp(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span>{format(disp)}</span>;
};

// ── STATUS COLORS (TableEngine-compatible) ────────────────────────────────────
const TABLE_STATUS_COLOR = {
  available:         { bg: '#22c55e', text: '#fff' },
  reserved:          { bg: '#f59e0b', text: '#fff' },
  occupied:          { bg: '#ef4444', text: '#fff' },
  ordering:          { bg: '#8b5cf6', text: '#fff' },
  order_confirmed:   { bg: '#3b82f6', text: '#fff' },
  kitchen:           { bg: '#f97316', text: '#fff' },
  ready_for_pickup:  { bg: '#06b6d4', text: '#fff' },
  serving:           { bg: '#78716c', text: '#fff' },
  dining:            { bg: '#64748b', text: '#fff' },
  bill_requested:    { bg: '#ec4899', text: '#fff' },
  payment_processing:{ bg: '#eab308', text: '#fff' },
  cleaning:          { bg: '#6366f1', text: '#fff' },
  maintenance:       { bg: '#9ca3af', text: '#fff' },
  disabled:          { bg: '#1f2937', text: '#fff' },
};
const getTableColor = (status = '') => {
  const s = status.toLowerCase().replace(/ /g, '_');
  return TABLE_STATUS_COLOR[s] || { bg: '#94a3b8', text: '#fff' };
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 1 — KPI Cards
// ══════════════════════════════════════════════════════════════════════════════
const WidgetKPIs = ({ metrics, onNavigate }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: 20, height: '100%', boxSizing: 'border-box' }}>
    {[
      { label: "Today's Revenue", value: metrics.totalRevenue, isCurrency: true, icon: "💰", color: "#22c55e", nav: "analytics" },
      { label: "Active Orders",   value: metrics.activeOrders,    isCurrency: false, icon: "🔥", color: "#f59e0b", nav: "orders" },
      { label: "Completed",       value: metrics.completedOrders,  isCurrency: false, icon: "✅", color: "#3b82f6", nav: "orders" },
      { label: "Avg Order Value", value: metrics.avgOrder,          isCurrency: true,  icon: "📈", color: "#8b5cf6", nav: "analytics" }
    ].map((kpi, idx) => (
      <div key={idx} onClick={() => onNavigate?.(kpi.nav)}
        style={{ padding: 20, background: 'var(--cafe-bg-surface)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--cafe-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{kpi.label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--cafe-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedNumber value={kpi.value} format={v => kpi.isCurrency ? formatMoney(v) : Math.round(v)} />
          </div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${kpi.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{kpi.icon}</div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: '100%', background: `linear-gradient(to right, ${kpi.color}, ${kpi.color}44)` }} />
      </div>
    ))}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 2 — Revenue Chart (pure SVG)
// ══════════════════════════════════════════════════════════════════════════════
const WidgetRevenueChart = ({ orders }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const labels = ['8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p'];
  const data = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const hourly = Array(15).fill(0);
    safeArray(orders).forEach(o => {
      if (o.status === 'COMPLETED' || o.status === 'READY') {
        const d = o.createdAt ? new Date(o.createdAt) : null;
        if (d && d >= today) {
          const h = d.getHours();
          if (h >= 8 && h <= 22) hourly[h - 8] += getOrderAmount(o);
        }
      }
    });
    if (hourly.every(v => v === 0)) return [100,250,400,350,600,800,750,900,1200,1500,1400,1800,2000,1600,900];
    return hourly;
  }, [orders]);

  const W = 760, H = 180;
  const maxV = Math.max(...data, 500);
  const pts = data.map((v, i) => [i / (data.length - 1) * W, H - (v / maxV) * H * 0.82]);
  const linePath = 'M' + pts.map(p => p.join(',')).join(' L');
  const areaPath = `M0,${H} L` + pts.map(p => p.join(',')).join(' L') + ` L${W},${H} Z`;
  const totalRev = data.reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '20px 20px 0', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>Sales Trend</div>
          <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>Hourly (8 AM – 10 PM)</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--cafe-text-primary)' }}>{formatMoney(totalRev)}</div>
          <div style={{ fontSize: 11, color: 'var(--cafe-success)', fontWeight: 600 }}>Today's total</div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 160 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cafe-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--cafe-accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(p => <line key={p} x1="0" y1={H*p} x2={W} y2={H*p} stroke="var(--cafe-border-light)" strokeWidth="1" strokeDasharray="4 4" />)}
          <path d={areaPath} fill="url(#rg)" />
          <path d={linePath} fill="none" stroke="var(--cafe-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {pts.map(([x, y], i) => (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} style={{ cursor: 'pointer' }}>
              <circle cx={x} cy={y} r="12" fill="transparent" />
              <circle cx={x} cy={y} r={hoverIdx === i ? 5 : 3} fill={hoverIdx === i ? 'var(--cafe-accent)' : 'white'} stroke="var(--cafe-accent)" strokeWidth="2" />
              {hoverIdx === i && (
                <g>
                  <rect x={x - 40} y={y - 38} width="80" height="26" rx="6" fill="var(--cafe-accent)" />
                  <text x={x} y={y - 21} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{formatMoney(data[i])}</text>
                </g>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 12px', overflow: 'hidden' }}>
        {labels.map((l, i) => (
          <div key={i} style={{ fontSize: 9, color: hoverIdx === i ? 'var(--cafe-accent)' : 'var(--cafe-text-tertiary)', fontWeight: hoverIdx === i ? 800 : 500, minWidth: 0, textAlign: 'center', flex: 1 }}>{l}</div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 3 — Live Floor Map (uses tables PROP directly, no tableEngine)
// ══════════════════════════════════════════════════════════════════════════════
const WidgetMiniFloor = ({ tables, onNavigate }) => {
  const [hoveredTable, setHoveredTable] = useState(null);
  const [sections, setSections] = useState([]);
  const [floor, setFloor] = useState(null);

  // Load floor layout from FloorEngine (sections / dimensions only — no tables from there)
  useEffect(() => {
    floorEngine.initialize();
    const floors = floorEngine.getAllFloors();
    if (floors.length > 0) {
      startTransition(() => {
        setFloor(floors[0]);
        setSections(floorEngine.getFloorSections(floors[0].id));
      });
    }
  }, []);

  const safeTables = safeArray(tables).filter(t => t.position && t.dimensions);

  // Figure out canvas bounds from actual table positions OR floor dimensions
  const bounds = useMemo(() => {
    if (floor) return floor.dimensions;
    if (safeTables.length === 0) return { width: 800, height: 600 };
    const maxX = Math.max(...safeTables.map(t => (t.position?.x || 0) + (t.dimensions?.width || 80)));
    const maxY = Math.max(...safeTables.map(t => (t.position?.y || 0) + (t.dimensions?.height || 60)));
    return { width: Math.max(maxX + 40, 400), height: Math.max(maxY + 40, 300) };
  }, [safeTables, floor]);

  // Summary counts
  const counts = useMemo(() => {
    const total = safeTables.length;
    const available = safeTables.filter(t => (t.status||'').toLowerCase() === 'available').length;
    const occupied  = safeTables.filter(t => ['occupied','dining','ordering','kitchen','serving','bill_requested','payment_processing'].includes((t.status||'').toLowerCase())).length;
    const attention = safeTables.filter(t => ['bill_requested','ready_for_pickup','cleaning'].includes((t.status||'').toLowerCase())).length;
    return { total, available, occupied, attention };
  }, [safeTables]);

  // Scale to fit widget nicely
  const CANVAS_W = 380, CANVAS_H = 200;
  const scale = Math.min(CANVAS_W / (bounds.width || 1), CANVAS_H / (bounds.height || 1)) * 0.92;

  return (
    <div style={{ padding: '20px 20px 16px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>Live Floor Map</div>
        <button onClick={() => onNavigate?.('tables')} style={{ fontSize: 11, color: 'var(--cafe-accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Open Floor →
        </button>
      </div>

      {safeTables.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--cafe-text-tertiary)' }}>
          <div style={{ fontSize: 32 }}>🗺️</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>No tables configured</div>
          <button onClick={() => onNavigate?.('tables')} style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--cafe-accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Go to Floor Plan</button>
        </div>
      ) : (
        <>
          {/* Canvas */}
          <div style={{ flex: 1, position: 'relative', background: 'var(--cafe-bg-surface)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--cafe-border-light)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: bounds.width * scale, height: bounds.height * scale, flexShrink: 0 }}>
                {/* Sections */}
                {sections.map(sec => (
                  <div key={sec.id} style={{
                    position: 'absolute',
                    left: sec.position.x * scale, top: sec.position.y * scale,
                    width: sec.dimensions.width * scale, height: sec.dimensions.height * scale,
                    background: (sec.color || '#e8f5e9') + '33',
                    border: `1px solid ${sec.color || '#e8f5e9'}`,
                    borderRadius: 8 * scale,
                    boxSizing: 'border-box'
                  }} />
                ))}
                {/* Tables */}
                {safeTables.map(table => {
                  const { bg, text } = getTableColor(table.status);
                  const isHovered = hoveredTable?.id === table.id;
                  const isCircle = (table.shape || '').includes('circle') || (table.shape || '').includes('oval');
                  return (
                    <div
                      key={table.id}
                      onMouseEnter={() => setHoveredTable(table)}
                      onMouseLeave={() => setHoveredTable(null)}
                      onClick={() => onNavigate?.('tables')}
                      style={{
                        position: 'absolute',
                        left: (table.position?.x || 0) * scale,
                        top: (table.position?.y || 0) * scale,
                        width: (table.dimensions?.width || 80) * scale,
                        height: (table.dimensions?.height || 60) * scale,
                        background: bg,
                        borderRadius: isCircle ? '50%' : 6 * scale,
                        transform: `rotate(${table.rotation || 0}deg)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: text,
                        fontWeight: 800, fontSize: Math.max(8, 13 * scale),
                        boxShadow: isHovered ? `0 0 0 3px ${bg}66, 0 6px 20px ${bg}55` : '0 2px 6px rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease',
                        zIndex: isHovered ? 10 : 1,
                        userSelect: 'none'
                      }}
                    >
                      {table.number}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Hover tooltip */}
            {hoveredTable && (
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border)', borderRadius: 8, padding: '8px 12px', fontSize: 11, zIndex: 20, pointerEvents: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Table {hoveredTable.number}</div>
                <div style={{ color: 'var(--cafe-text-secondary)' }}>{hoveredTable.capacity} seats · {hoveredTable.status || 'available'}</div>
                {hoveredTable.assignedWaiter && <div style={{ color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>Waiter: {hoveredTable.assignedWaiter}</div>}
              </div>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: `${counts.available} Free`, color: '#22c55e' },
              { label: `${counts.occupied} Occupied`, color: '#ef4444' },
              { label: `${counts.attention} Needs Attn`, color: '#ec4899' },
            ].map(({ label, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 4 — Kitchen KDS Live Tickets
// ══════════════════════════════════════════════════════════════════════════════
const KDS_STATUS_META = {
  NEW:        { label: 'New',        color: '#3b82f6', bg: '#eff6ff', icon: '🆕' },
  ACCEPTED:   { label: 'Accepted',   color: '#8b5cf6', bg: '#f5f3ff', icon: '👀' },
  PREPARING:  { label: 'Preparing',  color: '#f59e0b', bg: '#fffbeb', icon: '👨‍🍳' },
  READY:      { label: 'Ready',      color: '#22c55e', bg: '#f0fdf4', icon: '🔔' },
  SERVED:     { label: 'Served',     color: '#64748b', bg: '#f8fafc', icon: '✅' },
  CANCELLED:  { label: 'Cancelled',  color: '#ef4444', bg: '#fef2f2', icon: '❌' },
};

const WidgetKitchen = ({ kdsCards, onNavigate }) => {
  const [filter, setFilter] = useState('active');

  const cards = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const all = safeArray(kdsCards).map(c => ({
      ...c,
      _waitMins: c.createdAt ? Math.floor((now - new Date(c.createdAt)) / 60000) : 0,
    }));
    if (filter === 'active') return all.filter(c => ['NEW','ACCEPTED','PREPARING'].includes(c.status));
    if (filter === 'ready')  return all.filter(c => c.status === 'READY');
    return all;
  }, [kdsCards, filter]);

  const counts = useMemo(() => ({
    active: safeArray(kdsCards).filter(c => ['NEW','ACCEPTED','PREPARING'].includes(c.status)).length,
    ready:  safeArray(kdsCards).filter(c => c.status === 'READY').length,
    all:    safeArray(kdsCards).length,
  }), [kdsCards]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>Kitchen KDS</div>
        <button onClick={() => onNavigate?.('kitchen')} style={{ fontSize: 11, color: 'var(--cafe-accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Open Kitchen →</button>
      </div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--cafe-border-light)' }}>
        {[
          { id: 'active', label: `Active (${counts.active})`, color: '#f59e0b' },
          { id: 'ready',  label: `Ready (${counts.ready})`, color: '#22c55e' },
          { id: 'all',    label: `All (${counts.all})`, color: '#94a3b8' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
            background: filter === tab.id ? tab.color : 'var(--cafe-bg-surface)',
            color: filter === tab.id ? 'white' : 'var(--cafe-text-secondary)',
            transition: 'all 0.15s'
          }}>
            {tab.label}
          </button>
        ))}
      </div>
      {/* Ticket list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cards.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--cafe-text-tertiary)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
            <div>No tickets in this view.</div>
          </div>
        ) : cards.slice(0, 8).map((card, i) => {
          const meta = KDS_STATUS_META[card.status] || KDS_STATUS_META.NEW;
          const waitMins = card._waitMins ?? 0;
          const isUrgent = waitMins > 20 && card.status !== 'READY';
          return (
            <div key={card.id || i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--cafe-border-light)', display: 'flex', alignItems: 'center', gap: 12, background: isUrgent ? '#fef2f2' : 'transparent', transition: 'background 0.2s' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cafe-text-primary)' }}>Ticket #{card.id}</span>
                  {card.tableNumber && <span style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', background: 'var(--cafe-bg-surface)', borderRadius: 4, padding: '1px 5px' }}>T{card.tableNumber}</span>}
                  {isUrgent && <span style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', background: '#fee2e2', borderRadius: 4, padding: '1px 6px' }}>URGENT</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {safeArray(card.items || card.orderItems).slice(0,3).map(it => it.name || it.menuItem?.name || it.itemName).filter(Boolean).join(', ') || 'Items loading…'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isUrgent ? '#ef4444' : 'var(--cafe-text-tertiary)' }}>{waitMins}m</div>
                <div style={{ marginTop: 3, padding: '2px 7px', borderRadius: 10, background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700 }}>{meta.label}</div>
              </div>
            </div>
          );
        })}
        {cards.length > 8 && (
          <div onClick={() => onNavigate?.('kitchen')} style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--cafe-accent)', cursor: 'pointer' }}>
            +{cards.length - 8} more tickets — View All →
          </div>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 5 — Activity Feed
// ══════════════════════════════════════════════════════════════════════════════
const WidgetActivity = ({ recentOrders, onNavigate }) => {
  const [expandedId, setExpandedId] = useState(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--cafe-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>Live Orders</span>
        <button onClick={() => onNavigate?.('orders')} style={{ fontSize: 11, color: 'var(--cafe-accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>View All →</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {recentOrders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--cafe-text-tertiary)' }}>No recent orders.</div>
        ) : recentOrders.map((order, i) => {
          const statusColor = ['COMPLETED','READY'].includes(order.status) ? '#22c55e' : order.status === 'CANCELLED' ? '#ef4444' : '#f59e0b';
          const isExpanded = expandedId === order.id;
          return (
            <div key={order.id || i} onClick={() => setExpandedId(isExpanded ? null : order.id)} style={{ padding: '13px 20px', borderBottom: '1px solid var(--cafe-border-light)', cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--cafe-bg-surface)'; e.currentTarget.style.borderLeftColor=statusColor; }}
              onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderLeftColor='transparent'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--cafe-text-primary)' }}>#{order.id}</span>
                  <span style={{ padding: '1px 7px', borderRadius: 10, background: statusColor + '18', color: statusColor, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{order.status}</span>
                  {order.tableNumber && <span style={{ fontSize: 11, color: 'var(--cafe-text-secondary)' }}>T{order.tableNumber}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>{formatMoney(getOrderAmount(order))}</span>
                  <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>{timeSince(order.createdAt)}</span>
                </div>
              </div>
              {isExpanded && (
                <div style={{ marginTop: 10, padding: '10px', background: 'var(--cafe-bg-card)', borderRadius: 8, fontSize: 12 }}>
                  <div style={{ color: 'var(--cafe-text-secondary)', marginBottom: 6 }}>
                    <b>Customer:</b> {getOrderCustomerName(order) || 'Guest'} &nbsp;|&nbsp;
                    <b>Type:</b> {order.type || order.orderType || 'dine-in'}
                  </div>
                  <div style={{ color: 'var(--cafe-text-secondary)' }}>
                    <b>Items:</b> {getOrderDisplayItems(order) || '—'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 6 — Top Sellers
// ══════════════════════════════════════════════════════════════════════════════
const WidgetTopSellers = ({ orders }) => {
  const topItems = useMemo(() => {
    const counts = {};
    safeArray(orders).forEach(o => {
      safeArray(o.items || o.orderItems).forEach(it => {
        const name = it.name || it.menuItem?.name || it.itemName;
        if (name) counts[name] = (counts[name] || 0) + (it.quantity || 1);
      });
    });
    const COLORS = ['#6366f1','#8b5cf6','#ec4899','#10b981','#3b82f6'];
    if (Object.keys(counts).length === 0)
      return [['Espresso',42],['Cappuccino',38],['Croissant',24],['Avocado Toast',18],['Iced Latte',15]].map(([n,q],i) => ({ name:n, qty:q, color:COLORS[i] }));
    return Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5).map(([name,qty],i) => ({ name, qty, color: COLORS[i % COLORS.length] }));
  }, [orders]);

  const max = topItems.length > 0 ? topItems[0].qty : 1;
  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 18 }}>Top Sellers</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {topItems.map((item, i) => (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)', marginBottom: 5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: item.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800, flexShrink: 0 }}>{i+1}</span>
                {item.name}
              </span>
              <span style={{ color: 'var(--cafe-text-secondary)' }}>{item.qty}</span>
            </div>
            <div style={{ width: '100%', height: 5, background: 'var(--cafe-border-light)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${(item.qty / max) * 100}%`, height: '100%', background: item.color, borderRadius: 3, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 7 — Staff Shift
// ══════════════════════════════════════════════════════════════════════════════
const WidgetStaff = ({ staff, onNavigate: _onNavigate }) => {
  const staffList = safeArray(staff);
  const active = staffList.filter(s => s.clockedIn || (s.status || '').toUpperCase() === 'ACTIVE');
  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>Shift Status</div>
        <div style={{ fontSize: 12, color: 'var(--cafe-accent)', fontWeight: 700 }}>
          <AnimatedNumber value={active.length} /> / {staffList.length} On Shift
        </div>
      </div>
      {active.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--cafe-text-tertiary)' }}>
          <div style={{ fontSize: 28 }}>👥</div>
          <div style={{ fontSize: 13 }}>No staff currently on shift.</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {active.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--cafe-bg-surface)', borderRadius: 10, border: '1px solid var(--cafe-border-light)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `hsl(${(i * 67) % 360}, 70%, 60%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                {(s.name || 'S')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cafe-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || 'Staff Member'}</div>
                <div style={{ fontSize: 11, color: 'var(--cafe-text-secondary)' }}>{s.role || 'Staff'}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e88' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 8 — Waitlist
// ══════════════════════════════════════════════════════════════════════════════
const WidgetWaitlist = ({ waitlist, onNavigate: _onNavigate }) => {
  const active = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return safeArray(waitlist)
      .filter(w => w.status === 'waiting')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(w => ({
        ...w,
        _waitedMins: w.createdAt ? Math.floor((now - new Date(w.createdAt)) / 60000) : 0,
      }));
  }, [waitlist]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--cafe-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>Live Waitlist</span>
        <span style={{ fontSize: 12, color: active.length > 0 ? '#f59e0b' : 'var(--cafe-text-tertiary)', fontWeight: 700 }}>
          {active.length} Waiting
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {active.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--cafe-text-tertiary)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
            <div>Waitlist is empty!</div>
          </div>
        ) : active.map((w, i) => {
          const waitedMins = w._waitedMins ?? 0;
          const isLong = waitedMins >= 30;
          return (
            <div key={i} style={{ padding: '13px 20px', borderBottom: '1px solid var(--cafe-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isLong ? '#fef3c7' : 'transparent' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                  {w.name}
                  <span style={{ fontSize: 11, color: 'var(--cafe-text-secondary)', fontWeight: 600, marginLeft: 6 }}>({w.partySize} guests)</span>
                </div>
                {w.notes && <div style={{ fontSize: 11, color: '#d97706', marginTop: 2 }}>📝 {w.notes}</div>}
                {w.phone && <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>{w.phone}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: isLong ? '#ef4444' : '#f59e0b', padding: '3px 8px', borderRadius: 6, background: isLong ? '#fee2e2' : '#fef3c7' }}>
                  {waitedMins}m
                </div>
                {isLong && <div style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>OVERDUE</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET 9 — Inventory Alerts
// ══════════════════════════════════════════════════════════════════════════════
const WidgetInventory = ({ inventory, onNavigate }) => {
  const lowStock = useMemo(() => {
    return safeArray(inventory)
      .filter(item => {
        const qty = safeNumber(item.quantity ?? item.currentStock ?? item.stock ?? item.qty ?? item.amount);
        const minQty = safeNumber(item.minQuantity ?? item.reorderPoint ?? item.threshold ?? item.minStock ?? 5);
        return qty <= minQty && qty >= 0;
      })
      .sort((a, b) => {
        const qa = safeNumber(a.quantity ?? a.currentStock ?? a.stock ?? 0);
        const qb = safeNumber(b.quantity ?? b.currentStock ?? b.stock ?? 0);
        return qa - qb;
      })
      .slice(0, 6);
  }, [inventory]);

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>⚠️ Stock Alerts</div>
        <button onClick={() => onNavigate?.('inventory')} style={{ fontSize: 11, color: 'var(--cafe-accent)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
          Manage →
        </button>
      </div>
      {lowStock.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--cafe-text-tertiary)' }}>
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ fontSize: 13 }}>All stock levels are healthy!</div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {lowStock.map((item, i) => {
            const qty = safeNumber(item.quantity ?? item.currentStock ?? item.stock ?? item.qty ?? item.amount);
            const minQty = safeNumber(item.minQuantity ?? item.reorderPoint ?? item.threshold ?? item.minStock ?? 5);
            const pct = minQty > 0 ? Math.min(1, qty / (minQty * 2)) : 0;
            return (
              <div key={i} style={{ padding: '10px 12px', background: 'var(--cafe-bg-surface)', border: '1px solid #fde68a', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>{item.name || item.itemName}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: qty === 0 ? '#ef4444' : '#f59e0b' }}>{qty} {item.unit || ''}</span>
                </div>
                <div style={{ width: '100%', height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct * 100}%`, height: '100%', background: qty === 0 ? '#ef4444' : '#f59e0b', borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// WIDGET REGISTRY & DRAG ENGINE
// ══════════════════════════════════════════════════════════════════════════════
const WIDGET_REGISTRY = {
  HERO_STATS:     { title: 'Key Metrics',      component: WidgetKPIs,         defaultColSpan: 3 },
  REVENUE_CHART:  { title: 'Sales Trend',       component: WidgetRevenueChart, defaultColSpan: 2 },
  MINI_FLOOR:     { title: 'Live Floor Map',    component: WidgetMiniFloor,    defaultColSpan: 1 },
  KDS_KITCHEN:    { title: 'Kitchen KDS',       component: WidgetKitchen,      defaultColSpan: 1 },
  ACTIVITY_FEED:  { title: 'Live Orders',       component: WidgetActivity,     defaultColSpan: 1 },
  TOP_SELLERS:    { title: 'Top Sellers',       component: WidgetTopSellers,   defaultColSpan: 1 },
  STAFF_SHIFT:    { title: 'Staff Shift',       component: WidgetStaff,        defaultColSpan: 1 },
  WAITLIST_QUEUE: { title: 'Live Waitlist',     component: WidgetWaitlist,     defaultColSpan: 1 },
  INVENTORY:      { title: 'Stock Alerts',      component: WidgetInventory,    defaultColSpan: 1 },
};

// ── Widget-level RBAC ─────────────────────────────────────────────────────────
// Which roles are BLOCKED from each widget. Omission = all roles can see it.
// 'owner' is always unrestricted.
const WIDGET_BLOCKED_ROLES = {
  REVENUE_CHART:  ['kitchen'],                    // Kitchen staff don't need revenue charts
  HERO_STATS:     ['kitchen'],                    // KPIs like revenue hidden from kitchen
  TOP_SELLERS:    ['kitchen'],                    // Top sellers = business intel, not for kitchen
  STAFF_SHIFT:    ['cashier', 'kitchen'],         // Staff scheduling = manager+ only
  INVENTORY:      ['cashier'],                    // Stock alerts not for cashiers
};

const DEFAULT_LAYOUT = [
  { id: 'uid-1', type: 'HERO_STATS',    colSpan: 3 },
  { id: 'uid-2', type: 'REVENUE_CHART', colSpan: 2 },
  { id: 'uid-3', type: 'MINI_FLOOR',   colSpan: 1 },
  { id: 'uid-4', type: 'KDS_KITCHEN',  colSpan: 1 },
  { id: 'uid-5', type: 'ACTIVITY_FEED',colSpan: 1 },
  { id: 'uid-6', type: 'TOP_SELLERS',  colSpan: 1 },
  { id: 'uid-7', type: 'STAFF_SHIFT',  colSpan: 1 },
  { id: 'uid-8', type: 'WAITLIST_QUEUE',colSpan: 1 },
  { id: 'uid-9', type: 'INVENTORY',    colSpan: 1 },
];

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ orders, customers: _customers, inventory, kdsCards, tables, staff, waitlist, onNavigate }) {
  const { role, isOwner } = useSecurity();
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 800);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem('cafeos_dashboard_layout_v2');
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
    } catch { return DEFAULT_LAYOUT; }
  });
  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth <= 800);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const safeOrders   = safeArray(orders);
  const safeKds      = safeArray(kdsCards);

  const widgetProps = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayOrders = safeOrders.filter(o => o.createdAt && new Date(o.createdAt) >= today);
    const completed = todayOrders.filter(o => o.status === 'COMPLETED' || o.status === 'READY');
    const rev = completed.reduce((sum, o) => { try { return sum + getOrderAmount(o); } catch { return sum; } }, 0);
    return {
      orders: safeOrders,
      inventory: safeArray(inventory),
      kdsCards: safeKds,
      tables: safeArray(tables),
      staff: safeArray(staff),
      waitlist: safeArray(waitlist),
      recentOrders: safeOrders.filter(o => o.createdAt).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
      metrics: {
        totalRevenue: rev,
        activeOrders: todayOrders.filter(o => !['COMPLETED','CANCELLED'].includes(o.status)).length,
        completedOrders: completed.length,
        avgOrder: completed.length > 0 ? rev / completed.length : 0,
      },
      onNavigate,
    };
  }, [safeOrders, inventory, safeKds, tables, staff, waitlist, onNavigate]);

  const saveLayout = (l) => {
    setLayout(l);
    try { localStorage.setItem('cafeos_dashboard_layout_v2', JSON.stringify(l)); } catch {
      if (import.meta.env.DEV) console.warn('[Dashboard] Failed to persist layout to storage');
    }
  };

  const handleDragStart = (e, idx) => {
    if (!isEditMode) { e.preventDefault(); return; }
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (!isEditMode || draggedIdx === null || draggedIdx === idx) return;
    const newL = [...layout];
    const [item] = newL.splice(draggedIdx, 1);
    newL.splice(idx, 0, item);
    setDraggedIdx(idx);
    setLayout(newL);
  };
  const handleDragEnd = (_e) => { setDraggedIdx(null); saveLayout(layout); };

  const removeWidget = (id) => saveLayout(layout.filter(w => w.id !== id));
  const resizeWidget = (id) => {
    const w = layout.find(w => w.id === id);
    const next = (w.colSpan || 1) === 1 ? 2 : (w.colSpan || 1) === 2 ? 3 : 1;
    saveLayout(layout.map(w => w.id === id ? { ...w, colSpan: next } : w));
  };
  const addWidget = (type) => {
    const reg = WIDGET_REGISTRY[type];
    // eslint-disable-next-line react-hooks/purity
    saveLayout([...layout, { id: `uid-${Date.now()}`, type, colSpan: reg.defaultColSpan }]);
    setShowAddWidget(false);
  };

  const usedTypes = new Set(layout.map(w => w.type));
  // Filter available widgets by role — blocked roles can't add certain widgets either
  const availableWidgets = Object.entries(WIDGET_REGISTRY).filter(([k]) => {
    if (usedTypes.has(k)) return false;
    if (isOwner) return true;
    const blocked = WIDGET_BLOCKED_ROLES[k];
    return !blocked || !blocked.includes(role);
  });

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 🌤️' : 'Good evening 🌙';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
      <style>{`
        .dash-widget { background: var(--cafe-bg-card); border: 1px solid var(--cafe-border-light); border-radius: 16px; overflow: hidden; position: relative; transition: transform 0.2s, box-shadow 0.2s; }
        .dash-widget:not(.edit-active):hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.08); }
        .dash-widget.edit-active { border: 2px dashed var(--cafe-accent); animation: dashWiggle 1.8s infinite ease-in-out; cursor: grab; }
        .dash-widget.edit-active:active { cursor: grabbing; }
        @keyframes dashWiggle { 0%,100% { transform:rotate(0deg); } 25% { transform:rotate(-0.5deg); } 75% { transform:rotate(0.5deg); } }
        .edit-overlay-btn { padding: 5px 11px; border-radius: 6px; border: none; cursor: pointer; font-size: 11px; font-weight: 700; }
        .add-widget-row:hover { background: var(--cafe-bg-hover); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--cafe-text-primary)', letterSpacing: '-0.02em' }}>{greeting()}</h1>
          <div style={{ fontSize: 13, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
            {isEditMode ? 'Drag widgets to rearrange · Hover to resize or remove.' : 'Your operational command center — live data.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isEditMode ? (
            <>
              <button onClick={() => setShowAddWidget(true)} style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--cafe-bg-surface)', color: 'var(--cafe-accent)', border: '1.5px solid var(--cafe-accent)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>+ Add Widget</button>
              <button onClick={() => { saveLayout(DEFAULT_LAYOUT); }} style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-secondary)', border: '1px solid var(--cafe-border)', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Reset</button>
              <button onClick={() => setIsEditMode(false)} style={{ padding: '9px 18px', borderRadius: 10, background: '#22c55e', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Done ✓</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditMode(true)} style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Edit Layout</button>
              <button onClick={() => onNavigate?.('orders')} style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--cafe-accent)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13, boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>+ New Order</button>
            </>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20, gridAutoRows: 'minmax(280px, auto)' }}>
        {layout.map((item, index) => {
          const reg = WIDGET_REGISTRY[item.type];
          if (!reg) return null;
          // RBAC: hide widget if role is blocked from it
          if (!isOwner) {
            const blocked = WIDGET_BLOCKED_ROLES[item.type];
            if (blocked && blocked.includes(role)) return null;
          }
          const WidgetComp = reg.component;
          return (
            <div
              key={item.id}
              className={`dash-widget ${isEditMode ? 'edit-active' : ''}`}
              style={{ gridColumn: isMobile ? 'span 1' : `span ${item.colSpan || 1}` }}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {isEditMode && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>{reg.title}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="edit-overlay-btn" onClick={() => resizeWidget(item.id)} style={{ background: 'var(--cafe-bg-surface)', border: '1px solid var(--cafe-border)', color: 'var(--cafe-text-primary)' }}>
                      Width: {item.colSpan}×
                    </button>
                    <button className="edit-overlay-btn" onClick={() => removeWidget(item.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }}>Remove</button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Drag to reorder</div>
                </div>
              )}
              <WidgetComp {...widgetProps} />
            </div>
          );
        })}
      </div>

      {/* Add Widget Modal */}
      {showAddWidget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAddWidget(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--cafe-bg-card)', width: 440, maxHeight: '80vh', borderRadius: 18, overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--cafe-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Widget Library</div>
              <button onClick={() => setShowAddWidget(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--cafe-text-secondary)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto' }}>
              {availableWidgets.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--cafe-text-tertiary)', padding: 32 }}>All widgets are on your dashboard!</div>
              ) : (
                availableWidgets.map(([type, reg]) => (
                  <div key={type} className="add-widget-row" onClick={() => addWidget(type)}
                    style={{ padding: '14px 16px', borderRadius: 10, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, transition: 'background 0.15s' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--cafe-text-primary)' }}>{reg.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>Default: {reg.defaultColSpan} column{reg.defaultColSpan > 1 ? 's' : ''}</div>
                    </div>
                    <span style={{ fontSize: 22, color: 'var(--cafe-accent)', fontWeight: 700 }}>+</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(Dashboard);
