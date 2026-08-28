import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

/* ─── helpers ──────────────────────────────────────────────────────── */
function formatElapsed(ms) {
  if (!ms || ms < 0) return null;
  const totalMins = Math.floor(ms / 60000);
  if (totalMins < 1) return '< 1m';
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function elapsedColor(ms) {
  const mins = ms / 60000;
  if (mins < 30) return '#22c55e';
  if (mins < 60) return '#f59e0b';
  return '#ef4444';
}

const OCCUPIED_SINCE_KEY = 'tables_occupied_since';

function loadOccupiedSince() {
  try { return JSON.parse(localStorage.getItem(OCCUPIED_SINCE_KEY) || '{}'); }
  catch { return {}; }
}
function saveOccupiedSince(map) {
  localStorage.setItem(OCCUPIED_SINCE_KEY, JSON.stringify(map));
}

/* ─── component ─────────────────────────────────────────────────────── */
export default function Tables({
  onNavigate,
  orders = [],
  setOrders,
  tables: externalTables = [],
  setTables: setExternalTables,
  menuItems = [],
  settings = {},
  darkMode = true,
}) {
  /* ── screen size ─────────────────────────────────────────────────── */
  const [screenSize, setScreenSize] = useState('large');
  useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      setScreenSize(w < 768 ? 'small' : w < 1200 ? 'medium' : 'large');
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);
  const sm = screenSize === 'small';
  const dm = darkMode;

  /* ── tables state ────────────────────────────────────────────────── */
  const defaultTables = settings.defaultTables || [
    { id: 1, name: 'T1', status: 'available', capacity: 4 },
    { id: 2, name: 'T2', status: 'available', capacity: 4 },
    { id: 3, name: 'T3', status: 'occupied',  capacity: 6 },
    { id: 4, name: 'T4', status: 'available', capacity: 2 },
    { id: 5, name: 'T5', status: 'available', capacity: 8 },
    { id: 6, name: 'T6', status: 'occupied',  capacity: 4 },
    { id: 7, name: 'T7', status: 'available', capacity: 4 },
    { id: 8, name: 'T8', status: 'available', capacity: 6 },
  ];
  const [localTables, setLocalTables] = useState(defaultTables);
  const tables  = (externalTables?.length > 0) ? externalTables : localTables;
  const setTables = setExternalTables || setLocalTables;

  /* ── occupiedSince map: { [tableId]: isoString } ─────────────────── */
  const [occupiedSince, setOccupiedSince] = useState(loadOccupiedSince);

  /* ── tick every 30s to re-render timers ─────────────────────────── */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  /* ── qr orders ───────────────────────────────────────────────────── */
  const [qrOrders, setQROrders] = useState([]);
  useEffect(() => {
    const load = () => {
      try { setQROrders(JSON.parse(localStorage.getItem('qr_orders') || '[]')); }
      catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  /* ── reservations (read from localStorage, same key Reservations.jsx uses) */
  const [reservations, setReservations] = useState([]);
  useEffect(() => {
    const load = () => {
      try { setReservations(JSON.parse(localStorage.getItem('bakerypos_reservations') || '[]')); }
      catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  /* ── waiter calls ────────────────────────────────────────────────── */
  const [waiterCalls,    setWaiterCalls]    = useState([]);
  const [showWaiterCalls, setShowWaiterCalls] = useState(false);
  const [lastCallCount,  setLastCallCount]  = useState(0);
  const audioCtxRef = useRef(null);

  const playChime = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 800; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } catch { /* audio blocked */ }
  }, []);

  useEffect(() => {
    const check = () => {
      try {
        const calls = JSON.parse(localStorage.getItem('waiter_calls') || '[]');
        const pending = calls.filter(c => c.status === 'PENDING');
        if (pending.length > lastCallCount && lastCallCount >= 0) playChime();
        setLastCallCount(pending.length);
        setWaiterCalls(pending);
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [lastCallCount, playChime]);

  useEffect(() => () => { audioCtxRef.current?.close().catch(() => {}); }, []);

  const handleDismissWaiterCall = (callId) => {
    try {
      const all = JSON.parse(localStorage.getItem('waiter_calls') || '[]');
      localStorage.setItem('waiter_calls', JSON.stringify(
        all.map(c => c.id === callId ? { ...c, status: 'ACKNOWLEDGED' } : c)
      ));
      setWaiterCalls(p => p.filter(c => c.id !== callId));
    } catch { /* ignore */ }
  };

  /* ── table CRUD modals ───────────────────────────────────────────── */
  const [showDropdown,        setShowDropdown]        = useState(false);
  const [showModal,           setShowModal]           = useState(false);
  const [showManageModal,     setShowManageModal]      = useState(false);
  const [showDeleteAllConfirm,setShowDeleteAllConfirm] = useState(false);
  const [deleteAllInput,      setDeleteAllInput]      = useState('');
  const [showDeleteConfirm,   setShowDeleteConfirm]   = useState(false);
  const [tableToDelete,       setTableToDelete]       = useState(null);
  const [selectedTable,       setSelectedTable]       = useState(null);
  const [formData,            setFormData]            = useState({ name: '', capacity: 4 });
  const [formAlert,           setFormAlert]           = useState('');
  const dropdownRef = useRef(null);

  /* ── QR modal ────────────────────────────────────────────────────── */
  const [showQRModal,      setShowQRModal]      = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);

  /* ── live-order detail modal (replaces old history modal) ─────────── */
  const [showLiveModal,    setShowLiveModal]    = useState(false);
  const [liveModalTable,   setLiveModalTable]   = useState(null);

  /* ── merge modal ─────────────────────────────────────────────────── */
  const [showMergeModal,   setShowMergeModal]   = useState(false);
  const [mergeSource,      setMergeSource]      = useState(null);
  const [mergeTarget,      setMergeTarget]      = useState(null);

  /* ── close dropdown on outside click ────────────────────────────── */
  useEffect(() => {
    if (!showDropdown) return;
    const h = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showDropdown]);

  /* ── escape to close everything ─────────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (e.key !== 'Escape') return;
      setShowDropdown(false); setShowModal(false); setShowManageModal(false);
      setShowDeleteAllConfirm(false); setShowQRModal(false); setShowLiveModal(false);
      setShowDeleteConfirm(false); setShowWaiterCalls(false); setShowMergeModal(false);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  /* ── tableOrders: live orders grouped by tableId ─────────────────── */
  const tableOrders = useMemo(() => {
    const map = {};
    const all = [...orders, ...qrOrders];
    all.forEach(order => {
      if (!order) return;
      const tid = order.tableId
        ?? (order.tableName ? tables.find(t => t.name === order.tableName)?.id : null);
      if (!tid) return;
      if (order.status === 'CANCELLED' || order.status === 'COMPLETED') return;
      if (!map[tid]) map[tid] = [];
      if (!map[tid].find(o => o.id === order.id)) map[tid].push(order);
    });
    return map;
  }, [orders, qrOrders, tables]);

  /* ── tablesWithStatus: derive live status + stamp occupiedSince ───── */
  const tablesWithStatus = useMemo(() => {
    const now = Date.now();
    const newOccupied = { ...occupiedSince };
    let changed = false;

    const result = (tables || []).map(t => {
      const activeOrders = tableOrders[t.id] || [];
      const isOccupied = activeOrders.some(
        o => o.status === 'IN_PROGRESS' || o.status === 'PENDING'
      );
      if (isOccupied && !newOccupied[t.id]) {
        newOccupied[t.id] = new Date().toISOString();
        changed = true;
      }
      if (!isOccupied && newOccupied[t.id]) {
        delete newOccupied[t.id];
        changed = true;
      }
      const sinceMs = isOccupied && newOccupied[t.id]
        ? now - new Date(newOccupied[t.id]).getTime()
        : null;
      return { ...t, status: isOccupied ? 'occupied' : 'available', activeOrders, sinceMs };
    });

    if (changed) {
      saveOccupiedSince(newOccupied);
      setOccupiedSince(newOccupied);
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables, tableOrders, tick]);

  /* ── upcoming reservations per table (next 2 hours) ─────────────── */
  const upcomingReservations = useMemo(() => {
    const map = {};
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowMins  = now.getHours() * 60 + now.getMinutes();
    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      if (r.date !== todayStr) return;
      const [rh, rm] = (r.time || '00:00').split(':').map(Number);
      const rMins = rh * 60 + rm;
      const diffMins = rMins - nowMins;
      if (diffMins >= 0 && diffMins <= 120) {
        const tid = r.tableId;
        if (!map[tid] || diffMins < map[tid].diffMins)
          map[tid] = { ...r, diffMins };
      }
    });
    return map;
  }, [reservations]);

  /* ── stats ───────────────────────────────────────────────────────── */
  const availableCount = tablesWithStatus.filter(t => t.status === 'available').length;
  const occupiedCount  = tablesWithStatus.filter(t => t.status === 'occupied').length;
  const totalTables    = tablesWithStatus.length;
  const totalSeats     = tablesWithStatus.reduce((s, t) => s + (t.capacity || 0), 0);
  const occupiedSeats  = tablesWithStatus
    .filter(t => t.status === 'occupied')
    .reduce((s, t) => s + (t.capacity || 0), 0);
  const occupancyPct = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  /* ── CRUD handlers ───────────────────────────────────────────────── */
  const handleSaveTable = () => {
    if (!formData.name.trim()) { setFormAlert('Please enter a table name.'); return; }
    if (selectedTable) {
      setTables(p => p.map(t => t.id === selectedTable.id ? { ...t, ...formData } : t));
    } else {
      setTables(p => [...(p || []), { id: Date.now(), ...formData, status: 'available' }]);
    }
    setShowModal(false);
  };
  const confirmDeleteTable = () => {
    setTables(p => p.filter(t => t.id !== tableToDelete));
    setShowDeleteConfirm(false); setTableToDelete(null);
  };

  /* ── QR helper ───────────────────────────────────────────────────── */
  const generateQRCode = (table) => {
    const data = encodeURIComponent(JSON.stringify({ tableId: table.id, tableName: table.name }));
    const base = window.location.origin + window.location.pathname;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(base + '?table=' + data)}`;
  };

  /* ── theme shortcuts ─────────────────────────────────────────────── */
  const bg      = dm ? '#1a1a2e' : '#f8fafc';
  const bgElev  = dm ? '#252538' : '#ffffff';
  const bgDeep  = dm ? '#14142a' : '#f1f5f9';
  const border  = dm ? '#2d2d44' : '#e5e7eb';
  const text    = dm ? '#ffffff' : '#111827';
  const muted   = dm ? '#8b8b9e' : '#6b7280';
  const accent  = '#6366f1';

  /* ── reusable sub-components ─────────────────────────────────────── */
  const StatCard = ({ label, value, color, sub }) => (
    <div style={{
      background: bgElev, borderRadius: '16px',
      padding: sm ? '14px' : '20px',
      border: `1px solid ${border}`,
      boxShadow: dm ? '0 4px 6px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: '-16px', right: '-16px',
        width: '64px', height: '64px', borderRadius: '50%',
        background: color, opacity: 0.12,
      }} />
      <div style={{ fontSize: sm ? '11px' : '12px', color: muted, marginBottom: '6px', fontWeight: '600' }}>{label}</div>
      <div style={{ fontSize: sm ? '26px' : '32px', fontWeight: '800', color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{
      width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
      background: value ? accent : (dm ? '#374151' : '#d1d5db'),
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
    }}>
      <div style={{
        position: 'absolute', top: '2px',
        left: value ? '22px' : '2px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </div>
  );

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg, fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .table-card:hover { transform: translateY(-3px) !important; }
        .table-card { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div style={{ padding: sm ? '12px 16px' : '16px 28px', borderBottom: `1px solid ${border}`, background: bgElev, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Back → Orders (not dashboard) */}
          <button
            onClick={() => onNavigate?.('orders')}
            style={{ padding: sm ? '7px 12px' : '8px 16px', background: dm ? '#252538' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '12px' : '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            ← Orders
          </button>
          <div style={{ fontSize: sm ? '16px' : '20px', fontWeight: '700', color: text }}>🪑 Tables</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Waiter call bell */}
          {waiterCalls.length > 0 && (
            <button onClick={() => setShowWaiterCalls(true)} style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', animation: 'pulse 2s infinite' }}>
              🔔 {waiterCalls.length}
            </button>
          )}

          {/* Merge tables */}
          <button
            onClick={() => { setMergeSource(null); setMergeTarget(null); setShowMergeModal(true); }}
            style={{ padding: '8px 14px', background: dm ? '#252538' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            ⇆ Merge
          </button>

          {/* Add table split-button */}
          <div style={{ position: 'relative', display: 'flex', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(17,24,39,0.2)' }} ref={dropdownRef}>
            <button
              onClick={() => { setSelectedTable(null); setFormData({ name: '', capacity: 4 }); setFormAlert(''); setShowModal(true); }}
              style={{ padding: sm ? '8px 12px' : '8px 16px', background: '#111827', color: '#fff', border: 'none', fontSize: sm ? '11px' : '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              ➕ Add
            </button>
            <button
              onClick={() => setShowDropdown(p => !p)}
              style={{ padding: '8px 8px', background: '#1f2937', color: '#fff', border: 'none', borderLeft: '1px solid #374151', cursor: 'pointer' }}
            >▾</button>
            {showDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: bgElev, border: `1px solid ${border}`, borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', zIndex: 200, minWidth: '180px', overflow: 'hidden' }}>
                {[
                  { label: '➕ Add New Table', action: () => { setSelectedTable(null); setFormData({ name: '', capacity: 4 }); setFormAlert(''); setShowModal(true); setShowDropdown(false); } },
                  { label: '⚙️ Manage Tables',  action: () => { setShowManageModal(true); setShowDropdown(false); } },
                  { label: '🗑️ Delete All',      action: () => { setDeleteAllInput(''); setShowDeleteAllConfirm(true); setShowDropdown(false); }, danger: true },
                ].map(item => (
                  <div key={item.label} onClick={item.action} style={{ padding: '10px 14px', fontSize: '13px', color: item.danger ? '#ef4444' : text, cursor: 'pointer', borderTop: item.danger ? `1px solid ${border}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = item.danger ? (dm ? '#3a1a1a' : '#fee2e2') : (dm ? '#2d2d48' : '#f3f4f6')}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >{item.label}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: sm ? '14px' : '24px 28px', background: bgDeep }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sm ? 2 : 4}, 1fr)`, gap: sm ? '10px' : '16px', marginBottom: sm ? '16px' : '24px' }}>
          <StatCard label="🟢 Available" value={availableCount} color="#22c55e" />
          <StatCard label="🟠 Occupied"  value={occupiedCount}  color="#f59e0b" sub={`of ${totalTables} tables`} />
          <StatCard label="💺 Occupancy" value={`${occupancyPct}%`} color={occupancyPct > 75 ? '#ef4444' : occupancyPct > 40 ? '#f59e0b' : '#22c55e'} sub={`${occupiedSeats}/${totalSeats} seats`} />
          <StatCard label="🪑 Total Seats" value={totalSeats} color={accent} sub={`${totalTables} tables`} />
        </div>

        {/* Tables grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: sm
            ? 'repeat(2, 1fr)'
            : screenSize === 'medium'
              ? 'repeat(3, 1fr)'
              : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: sm ? '10px' : '16px',
        }}>
          {tablesWithStatus.map(table => {
            const occupied  = table.status === 'occupied';
            const elapsed   = formatElapsed(table.sinceMs);
            const elColor   = table.sinceMs ? elapsedColor(table.sinceMs) : null;
            const upcoming  = upcomingReservations[table.id];
            const merged    = table.mergedWith?.length > 0;
            const liveOrders = table.activeOrders || [];
            const liveTotal  = liveOrders.reduce((s, o) => s + (o.total || 0), 0);

            return (
              <div
                key={table.id}
                className="table-card"
                onClick={() => { setLiveModalTable(table); setShowLiveModal(true); }}
                style={{
                  background: bgElev,
                  borderRadius: '14px',
                  padding: sm ? '14px' : '18px',
                  border: occupied
                    ? `2px solid ${elColor || '#f59e0b'}`
                    : upcoming
                      ? `2px solid #8b5cf6`
                      : `1px solid ${border}`,
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: dm ? '0 4px 6px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.07)',
                  animation: 'fadeSlide 0.25s ease',
                }}
              >
                {/* Status dot */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '10px', height: '10px', borderRadius: '50%', background: occupied ? (elColor || '#f59e0b') : upcoming ? '#8b5cf6' : '#22c55e', boxShadow: `0 0 0 3px ${occupied ? (elColor || '#f59e0b') : upcoming ? '#8b5cf6' : '#22c55e'}22` }} />

                {/* QR button — top-left */}
                <button
                  onClick={e => { e.stopPropagation(); setSelectedTableForQR(table); setShowQRModal(true); }}
                  style={{ position: 'absolute', top: '10px', left: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.45, padding: '2px' }}
                  title="QR Code"
                >📱</button>

                {/* Table name */}
                <div style={{ fontSize: sm ? '22px' : '26px', fontWeight: '800', color: text, marginTop: '14px', marginBottom: '2px', letterSpacing: '-0.02em' }}>
                  {table.name}
                  {merged && <span style={{ fontSize: '11px', marginLeft: '6px', color: '#8b5cf6', fontWeight: '600' }}>MERGED</span>}
                </div>

                {/* Capacity */}
                <div style={{ fontSize: '11px', color: muted, marginBottom: '8px' }}>
                  {table.capacity} seats
                </div>

                {/* Status pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '20px', background: occupied ? (elColor ? `${elColor}18` : 'rgba(245,158,11,0.1)') : upcoming ? 'rgba(139,92,246,0.1)' : 'rgba(34,197,94,0.1)', marginBottom: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: occupied ? (elColor || '#f59e0b') : upcoming ? '#8b5cf6' : '#22c55e' }} />
                  <span style={{ fontSize: '10px', fontWeight: '700', color: occupied ? (elColor || '#f59e0b') : upcoming ? '#8b5cf6' : '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {occupied ? 'Occupied' : upcoming ? 'Reserved' : 'Available'}
                  </span>
                </div>

                {/* ── Elapsed timer (occupied) */}
                {occupied && elapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: muted }}>⏱</span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: elColor }}>{elapsed}</span>
                  </div>
                )}

                {/* ── Upcoming reservation badge (available) */}
                {!occupied && upcoming && (
                  <div style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: '600', marginBottom: '8px', background: 'rgba(139,92,246,0.08)', padding: '4px 8px', borderRadius: '6px' }}>
                    📅 {upcoming.customerName} · {upcoming.time} · {upcoming.guests}p
                  </div>
                )}

                {/* ── Live order summary (occupied) */}
                {occupied && liveOrders.length > 0 && (
                  <div style={{ borderTop: `1px solid ${border}`, paddingTop: '8px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: muted }}>{liveOrders.length} order{liveOrders.length > 1 ? 's' : ''}</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#22c55e' }}>₹{liveTotal.toFixed(0)}</span>
                    </div>
                    {/* Show first order's items as a compact list */}
                    {liveOrders[0]?.items?.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ fontSize: '11px', color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.quantity}× {item.name}
                      </div>
                    ))}
                    {(liveOrders[0]?.items?.length || 0) > 3 && (
                      <div style={{ fontSize: '10px', color: muted }}>+{liveOrders[0].items.length - 3} more items</div>
                    )}
                  </div>
                )}

                {/* ── Empty available state */}
                {!occupied && !upcoming && (
                  <div style={{ fontSize: '11px', color: muted, opacity: 0.6 }}>
                    Tap to view details
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          LIVE ORDER DETAIL MODAL
          ══════════════════════════════════════════════════════════ */}
      {showLiveModal && liveModalTable && (() => {
        const t = liveModalTable;
        const liveOrds = t.activeOrders || [];
        const occupied = t.status === 'occupied';
        const elapsed  = formatElapsed(t.sinceMs);
        const elColor  = t.sinceMs ? elapsedColor(t.sinceMs) : null;
        const upcoming = upcomingReservations[t.id];
        const grandTotal = liveOrds.reduce((s, o) => s + (o.total || 0), 0);

        const statusColor = {
          PENDING: '#f59e0b', IN_PROGRESS: '#3b82f6',
          READY: '#22c55e', PREPARING: '#8b5cf6',
        };

        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: sm ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2000, padding: sm ? 0 : '16px' }}
            onClick={e => { if (e.target === e.currentTarget) setShowLiveModal(false); }}>
            <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: sm ? '20px 20px 0 0' : '20px', width: sm ? '100%' : '100%', maxWidth: sm ? '100%' : '600px', maxHeight: sm ? '90vh' : '85vh', display: 'flex', flexDirection: 'column', border: `1px solid ${border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.4)', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}`, background: dm ? '#252538' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: text }}>
                    🪑 {t.name}
                    {elapsed && <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: '700', color: elColor }}>⏱ {elapsed}</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: muted, marginTop: '3px' }}>
                    {occupied ? `${liveOrds.length} active order${liveOrds.length !== 1 ? 's' : ''}` : 'Table available'}
                    {occupied && ` · ₹${grandTotal.toFixed(2)} running total`}
                  </div>
                </div>
                <button onClick={() => setShowLiveModal(false)} style={{ width: '34px', height: '34px', background: dm ? '#2d2d48' : '#e5e7eb', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', color: text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

                {/* Reservation notice */}
                {upcoming && (
                  <div style={{ padding: '12px 14px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#8b5cf6', marginBottom: '2px' }}>📅 Upcoming Reservation</div>
                    <div style={{ fontSize: '12px', color: muted }}>{upcoming.customerName} · {upcoming.guests} guests · {upcoming.time}{upcoming.notes ? ` · ${upcoming.notes}` : ''}</div>
                  </div>
                )}

                {/* No active orders */}
                {!occupied && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: muted }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: text }}>Table is free</div>
                    <div style={{ fontSize: '13px', marginTop: '6px' }}>No active orders</div>
                    <button
                      onClick={() => { setShowLiveModal(false); onNavigate?.('orders'); }}
                      style={{ marginTop: '16px', padding: '10px 20px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Start New Order
                    </button>
                  </div>
                )}

                {/* Live orders */}
                {liveOrds.map((order, oi) => (
                  <div key={order.id || oi} style={{ marginBottom: '14px', background: dm ? '#252538' : '#f8fafc', borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden' }}>
                    {/* Order header */}
                    <div style={{ padding: '10px 14px', background: dm ? '#2a2a3a' : '#f3f4f6', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: text }}>#{String(order.id || oi).slice(-6)}</span>
                        {order.token && <span style={{ padding: '2px 7px', background: accent, color: '#fff', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>{order.token}</span>}
                        {order.isQROrder && <span style={{ padding: '2px 7px', background: '#8b5cf6', color: '#fff', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>QR</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: muted }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </span>
                        <span style={{ padding: '3px 8px', background: statusColor[order.status] || muted, color: '#fff', borderRadius: '5px', fontSize: '10px', fontWeight: '700' }}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order items */}
                    <div style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: '12px', color: muted, marginBottom: '8px' }}>
                        {order.customerName || 'Walk-in'}
                        {order.staffName && ` · Staff: ${order.staffName}`}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                        {(order.items || []).map((item, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: dm ? '#d0d0e0' : '#374151' }}>{item.quantity || 1}× {item.name}</span>
                            <span style={{ color: muted }}>₹{((item.price || 0) * (item.quantity || 1)).toFixed(0)}</span>
                          </div>
                        ))}
                      </div>
                      {order.notes && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', fontStyle: 'italic', marginBottom: '8px' }}>📝 {order.notes}</div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: `1px solid ${border}` }}>
                        <span style={{ fontSize: '13px', color: muted }}>Order total</span>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: '#22c55e' }}>₹{(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Quick status actions */}
                    <div style={{ padding: '8px 14px', borderTop: `1px solid ${border}`, display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {['IN_PROGRESS','READY','COMPLETED'].map(st => (
                        <button key={st} onClick={() => {
                          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: st } : o));
                        }} style={{ padding: '5px 10px', background: order.status === st ? (statusColor[st] || '#6b7280') : (dm ? '#2d2d48' : '#f3f4f6'), color: order.status === st ? '#fff' : (dm ? '#c0c0d0' : '#374151'), border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          {st === 'IN_PROGRESS' ? 'Cooking' : st === 'READY' ? 'Ready' : 'Done ✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              </div>

              {/* Footer quick actions */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${border}`, background: dm ? '#252538' : '#f8fafc', display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => { setShowLiveModal(false); onNavigate?.('orders'); }}
                  style={{ flex: 1, padding: '11px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  + New Order
                </button>
                <button
                  onClick={() => { setSelectedTableForQR(t); setShowQRModal(true); setShowLiveModal(false); }}
                  style={{ padding: '11px 16px', background: dm ? '#2d2d48' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  📱 QR
                </button>
                <button
                  onClick={() => setShowLiveModal(false)}
                  style={{ padding: '11px 16px', background: dm ? '#2d2d48' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════
          QR CODE MODAL
          ══════════════════════════════════════════════════════════ */}
      {showQRModal && selectedTableForQR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowQRModal(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: text }}>📱 {selectedTableForQR.name}</div>
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <img src={generateQRCode(selectedTableForQR)} alt={`QR ${selectedTableForQR.name}`} style={{ width: '180px', height: '180px' }} />
            </div>
            <p style={{ fontSize: '12px', color: muted, margin: 0, lineHeight: 1.5 }}>Customers scan this to self-order from their table.</p>
            <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
              <button onClick={() => { const url = `${window.location.origin}/qr-ordering.html?table=${encodeURIComponent(JSON.stringify({ tableId: selectedTableForQR.id, tableName: selectedTableForQR.name }))}`; window.open(url, '_blank'); }} style={{ flex: 1, padding: '11px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Open Page</button>
              <button onClick={() => setShowQRModal(false)} style={{ padding: '11px 16px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#c0c0d0' : '#374151', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MERGE TABLES MODAL
          ══════════════════════════════════════════════════════════ */}
      {showMergeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMergeModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>⇆ Merge Tables</div>
              <button onClick={() => setShowMergeModal(false)} style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.5 }}>
              Select two tables to merge — orders for both will appear under the primary table.
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>SELECT TABLES (pick 2)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {tables.map(t => {
                  const sel = mergeSource?.id === t.id || mergeTarget?.id === t.id;
                  return (
                    <button key={t.id} onClick={() => {
                      if (mergeSource?.id === t.id) { setMergeSource(null); return; }
                      if (mergeTarget?.id === t.id) { setMergeTarget(null); return; }
                      if (!mergeSource) setMergeSource(t);
                      else if (!mergeTarget) setMergeTarget(t);
                    }} style={{ padding: '10px 6px', background: sel ? 'rgba(99,102,241,0.15)' : (dm ? '#252538' : '#f3f4f6'), color: sel ? accent : text, border: `1.5px solid ${sel ? accent : border}`, borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {mergeSource && mergeTarget && (
              <div style={{ padding: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', fontSize: '13px', color: text }}>
                Merge <strong>{mergeSource.name}</strong> + <strong>{mergeTarget.name}</strong> → orders shown under <strong>{mergeSource.name}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowMergeModal(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button
                disabled={!mergeSource || !mergeTarget}
                onClick={() => {
                  setTables(prev => prev.map(t => {
                    if (t.id === mergeSource.id) return { ...t, mergedWith: [...(t.mergedWith || []), mergeTarget.id] };
                    if (t.id === mergeTarget.id) return { ...t, mergedInto: mergeSource.id };
                    return t;
                  }));
                  setShowMergeModal(false);
                }}
                style={{ flex: 1, padding: '11px', background: (mergeSource && mergeTarget) ? accent : (dm ? '#252538' : '#e5e7eb'), color: (mergeSource && mergeTarget) ? '#fff' : muted, border: 'none', borderRadius: '10px', fontWeight: '700', cursor: (mergeSource && mergeTarget) ? 'pointer' : 'not-allowed', fontSize: '13px' }}
              >
                Merge Tables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD / EDIT TABLE MODAL
          ══════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: sm ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2000, padding: sm ? 0 : '16px' }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: sm ? '20px 20px 0 0' : '16px', width: sm ? '100%' : '100%', maxWidth: sm ? '100%' : '380px', padding: sm ? '24px 20px 32px' : '22px', border: sm ? 'none' : `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '14px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: text }}>{selectedTable ? '✏️ Edit Table' : '➕ Add Table'}</div>
              <button onClick={() => setShowModal(false)} style={{ width: '32px', height: '32px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: text }}>×</button>
            </div>
            {formAlert && <div style={{ padding: '10px 12px', background: dm ? '#3a1a1a' : '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>⚠️ {formAlert}</div>}
            {[
              { label: 'Table Name / Number', placeholder: 'e.g. T9', key: 'name', type: 'text' },
              { label: 'Seating Capacity',    placeholder: '4',      key: 'capacity', type: 'number' },
            ].map(({ label, placeholder, key, type }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '6px' }}>{label}</label>
                <input
                  type={type} value={formData[key]} placeholder={placeholder}
                  onChange={e => { setFormData(p => ({ ...p, [key]: type === 'number' ? Math.max(1, parseInt(e.target.value) || 1) : e.target.value })); setFormAlert(''); }}
                  autoFocus={key === 'name'}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${formAlert && key === 'name' ? '#ef4444' : border}`, borderRadius: '8px', background: dm ? '#252535' : '#fff', color: text, fontSize: sm ? '16px' : '14px', outline: 'none', boxSizing: 'border-box', minHeight: sm ? '48px' : 'auto' }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
              <button onClick={handleSaveTable} style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MANAGE TABLES MODAL
          ══════════════════════════════════════════════════════════ */}
      {showManageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowManageModal(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '22px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>⚙️ Manage Tables</div>
              <button onClick={() => setShowManageModal(false)} style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            {tables.length === 0
              ? <div style={{ textAlign: 'center', padding: '24px', color: muted }}>No tables yet.</div>
              : tables.map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: dm ? '#252535' : '#f8fafc', border: `1px solid ${border}`, borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: text, fontSize: '14px' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: muted }}>{t.capacity} seats · {tablesWithStatus.find(tw => tw.id === t.id)?.status || 'available'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setSelectedTable(t); setFormData({ name: t.name, capacity: t.capacity }); setFormAlert(''); setShowManageModal(false); setShowModal(true); }} style={{ padding: '5px 10px', background: dm ? '#2d2d48' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✏️</button>
                    <button onClick={() => { setTableToDelete(t.id); setShowManageModal(false); setShowDeleteConfirm(true); }} style={{ padding: '5px 10px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🗑️</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE ONE CONFIRM
          ══════════════════════════════════════════════════════════ */}
      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '16px', maxWidth: '340px', width: '100%', padding: '22px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px' }}>🗑️</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444' }}>Delete this table?</div>
            <div style={{ fontSize: '13px', color: muted }}>This cannot be undone.</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDeleteTable} style={{ flex: 1, padding: '11px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE ALL CONFIRM
          ══════════════════════════════════════════════════════════ */}
      {showDeleteAllConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowDeleteAllConfirm(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '16px', maxWidth: '360px', width: '100%', padding: '22px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px' }}>🚨</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444' }}>Delete ALL Tables?</div>
            <p style={{ fontSize: '13px', color: muted, margin: 0, lineHeight: 1.5 }}>Type <strong style={{ color: text }}>DELETE ALL</strong> to confirm.</p>
            <input type="text" placeholder="Type DELETE ALL" value={deleteAllInput} onChange={e => setDeleteAllInput(e.target.value)} autoFocus
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${deleteAllInput === 'DELETE ALL' ? '#10b981' : border}`, background: dm ? '#252535' : '#fff', color: text, fontSize: '14px', textAlign: 'center', fontWeight: '700', boxSizing: 'border-box', outline: 'none' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowDeleteAllConfirm(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#374151', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button disabled={deleteAllInput !== 'DELETE ALL'} onClick={() => { setTables([]); saveOccupiedSince({}); setOccupiedSince({}); setShowDeleteAllConfirm(false); }} style={{ flex: 1, padding: '11px', background: deleteAllInput === 'DELETE ALL' ? '#ef4444' : (dm ? '#252538' : '#e5e7eb'), color: deleteAllInput === 'DELETE ALL' ? '#fff' : muted, border: 'none', borderRadius: '10px', fontWeight: '700', cursor: deleteAllInput === 'DELETE ALL' ? 'pointer' : 'not-allowed' }}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          WAITER CALLS MODAL
          ══════════════════════════════════════════════════════════ */}
      {showWaiterCalls && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowWaiterCalls(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '440px', padding: '22px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>🔔 Waiter Calls ({waiterCalls.length})</div>
              <button onClick={() => setShowWaiterCalls(false)} style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            {waiterCalls.length === 0
              ? <div style={{ textAlign: 'center', padding: '28px', color: muted }}>No active waiter calls.</div>
              : waiterCalls.map(call => (
                <div key={call.id} style={{ background: dm ? '#252535' : '#f8fafc', border: `1px solid ${border}`, borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: text, fontSize: '14px' }}>🪑 {call.tableName || 'Table'}</span>
                    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', background: '#ef4444', color: '#fff' }}>
                      {(call.type || 'CALL').replace('CALL_', '').replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: muted }}>{new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <button onClick={() => handleDismissWaiterCall(call.id)} style={{ width: '100%', padding: '8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>✓ Acknowledge</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

    </div>
  );
}
