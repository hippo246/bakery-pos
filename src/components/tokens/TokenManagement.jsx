import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import orderEventManager from '../../services/OrderEventManager.js';
import orderWorkflowService from '../../services/OrderWorkflowService.js';

/* ─── Mobile detection ─────────────────────────────────────────── */
function useIsMobile() {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

/* ─── Theme ────────────────────────────────────────────────────── */
const DARK = {
  bg:       '#0e0e0e',
  panel:    '#161616',
  card:     '#1c1c1c',
  cardHov:  '#222222',
  border:   '#2e2e2e',
  borderHi: '#444444',
  text:     '#f2f2f2',
  textSub:  '#b0b0b0',
  textMut:  '#666666',
  input:    '#111111',
};

const LIGHT = {
  bg:       '#f4f5f7',
  panel:    '#ffffff',
  card:     '#ffffff',
  cardHov:  '#f8f9fb',
  border:   '#dde1e7',
  borderHi: '#bbc1cb',
  text:     '#111827',
  textSub:  '#374151',
  textMut:  '#9ca3af',
  input:    '#f9fafb',
};

const STATUS = {
  PENDING:   { color: '#d97706', bg: '#d9780611', label: 'PENDING',   short: 'PND' },
  PREPARING: { color: '#2563eb', bg: '#2563eb11', label: 'PREPARING', short: 'PRE' },
  READY:     { color: '#16a34a', bg: '#16a34a11', label: 'READY',     short: 'RDY' },
  COMPLETED: { color: '#6b7280', bg: '#6b728011', label: 'SERVED',    short: 'SRV' },
};

/* ─── Elapsed timer ────────────────────────────────────────────── */
function useElapsed(ts) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const base = new Date(ts || Date.now()).getTime();
    const tick = () => setS(Math.floor((Date.now() - base) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [ts]);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const str = m > 0 ? `${m}m ${sec < 10 ? '0' : ''}${sec}s` : `${sec}s`;
  const warn = s > 900; // >15min
  const caution = s > 600; // >10min
  return { str, warn, caution };
}

/* ─── Toast ────────────────────────────────────────────────────── */
function useToast() {
  const [msgs, setMsgs] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Date.now();
    setMsgs(p => [{ id, msg, type }, ...p.slice(0, 3)]);
    setTimeout(() => setMsgs(p => p.filter(m => m.id !== id)), 2800);
  }, []);
  return { msgs, push };
}

function ToastBanner({ msgs }) {
  if (!msgs.length) return null;
  const colors = { ok: '#16a34a', err: '#dc2626', info: '#2563eb' };
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {msgs.map(m => (
        <div key={m.id} style={{ background: colors[m.type] || colors.ok, color: '#fff', padding: '9px 16px', borderRadius: 4, fontSize: 13, fontWeight: 600, fontFamily: 'monospace', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', maxWidth: 280 }}>
          {m.msg}
        </div>
      ))}
    </div>
  );
}

/* ─── Single ticket row (compact Kanban card) ──────────────────── */
function Ticket({ t, onAction, onDetail, th }) {
  const st = (t.status || 'PENDING').toUpperCase();
  const sc = STATUS[st] || STATUS.PENDING;
  const { str: elapsed, warn, caution } = useElapsed(t.createdAt);
  const elColor = warn ? '#dc2626' : caution ? '#d97706' : th.textMut;

  const nextAction = {
    PENDING:   { label: 'START',    next: 'PREPARING', color: '#2563eb' },
    PREPARING: { label: 'READY',    next: 'READY',     color: '#16a34a' },
    READY:     { label: 'SERVED',   next: 'COMPLETED', color: '#374151' },
    COMPLETED: null,
  }[st];

  return (
    <div style={{
      background: th.card,
      border: `1px solid ${th.border}`,
      borderLeft: `3px solid ${sc.color}`,
      marginBottom: 6,
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: 8, borderBottom: `1px solid ${th.border}` }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 20, color: th.text, letterSpacing: -0.5, minWidth: 64 }}>{t.token}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 6px', borderRadius: 2, letterSpacing: 0.5 }}>{sc.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: elColor, fontFamily: 'monospace' }}>{elapsed}</span>
        {(t.source === 'qr' || t.id?.toString().startsWith('QR-')) && (
          <span style={{ fontSize: 10, color: th.textMut, background: th.border, padding: '2px 6px', borderRadius: 2, fontWeight: 700 }}>QR</span>
        )}
      </div>

      {/* Info row */}
      <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: th.textSub, fontWeight: 600 }}>{t.customerName || 'Walk-in'}</span>
        {(t.tableName || t.tableNumber) && (
          <span style={{ fontSize: 11, color: th.textMut }}>Tbl {t.tableName || t.tableNumber}</span>
        )}
        <span style={{ fontSize: 11, color: th.textMut, marginLeft: 'auto' }}>
          {t.items?.length || 0} items · <span style={{ color: th.textSub, fontWeight: 700 }}>₹{(t.total || 0).toFixed(0)}</span>
        </span>
      </div>

      {/* Items (compact) */}
      {t.items && t.items.length > 0 && (
        <div style={{ padding: '0 10px 8px 10px', display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
          {t.items.slice(0, 4).map((item, i) => (
            <span key={i} style={{ fontSize: 11, color: th.textMut }}>
              {item.qty || item.quantity || 1}× {item.name}
            </span>
          ))}
          {t.items.length > 4 && <span style={{ fontSize: 11, color: th.textMut }}>+{t.items.length - 4} more</span>}
        </div>
      )}

      {/* Action row */}
      <div style={{ padding: '0 10px 8px', display: 'flex', gap: 6 }}>
        {nextAction && (
          <button onClick={() => onAction(t.id, nextAction.next, t.token)} style={{
            padding: '6px 14px', background: nextAction.color, color: '#fff',
            border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer',
            letterSpacing: 0.5, borderRadius: 2,
          }}>{nextAction.label} →</button>
        )}
        <button onClick={() => onDetail(t)} style={{ padding: '6px 10px', background: 'none', color: th.textMut, border: `1px solid ${th.border}`, fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 2 }}>DETAIL</button>
        {st !== 'PENDING' && st !== 'COMPLETED' && (
          <button onClick={() => onAction(t.id, 'PENDING', t.token)} style={{ padding: '6px 10px', background: 'none', color: th.textMut, border: `1px solid ${th.border}`, fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 2 }}>↩ RESET</button>
        )}
      </div>
    </div>
  );
}

/* ─── Sort bar ──────────────────────────────────────────────────── */
function SortBar({ sortKey, sortDir, onSort, th }) {
  const COLS = [
    { key: 'article', label: 'Article' },
    { key: 'qty',     label: 'Qty'     },
    { key: 'price',   label: 'Price'   },
  ];
  return (
    <div style={{ display: 'flex', gap: 1, background: th.border, borderBottom: `1px solid ${th.border}` }}>
      {COLS.map(col => {
        const active = sortKey === col.key;
        return (
          <div key={col.key} style={{ flex: 1, background: th.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: active ? th.text : th.textMut, letterSpacing: 0.5, textTransform: 'uppercase' }}>{col.label}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <button
                onClick={() => onSort(col.key, 'asc')}
                title={`Sort ${col.label} ascending`}
                style={{
                  background: 'none', border: 'none', padding: '1px 3px',
                  cursor: 'pointer', lineHeight: 1, fontSize: 10,
                  color: active && sortDir === 'asc' ? th.text : th.textMut,
                  fontWeight: active && sortDir === 'asc' ? 900 : 400,
                }}
              >▲</button>
              <button
                onClick={() => onSort(col.key, 'desc')}
                title={`Sort ${col.label} descending`}
                style={{
                  background: 'none', border: 'none', padding: '1px 3px',
                  cursor: 'pointer', lineHeight: 1, fontSize: 10,
                  color: active && sortDir === 'desc' ? th.text : th.textMut,
                  fontWeight: active && sortDir === 'desc' ? 900 : 400,
                }}
              >▼</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function applySortToTickets(tickets, sortKey, sortDir) {
  if (!sortKey) return tickets;
  return [...tickets].sort((a, b) => {
    let va, vb;
    if (sortKey === 'qty')     { va = a.items?.length || 0;             vb = b.items?.length || 0; }
    if (sortKey === 'price')   { va = a.total || 0;                     vb = b.total || 0; }
    if (sortKey === 'article') { va = (a.customerName || a.token || '').toLowerCase(); vb = (b.customerName || b.token || '').toLowerCase(); }
    if (sortKey === 'article') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortDir === 'asc' ? va - vb : vb - va;
  });
}

/* ─── Kanban column ────────────────────────────────────────────── */
function Column({ title, color, tickets, onAction, onDetail, th }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key, dir) => {
    setSortKey(key);
    setSortDir(dir);
  };

  const sorted = applySortToTickets(tickets, sortKey, sortDir);

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: th.panel, border: `1px solid ${th.border}` }}>
      {/* Column header */}
      <div style={{ padding: '10px 14px', borderBottom: `2px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: th.bg }}>
        <span style={{ fontSize: 12, fontWeight: 800, color, letterSpacing: 1, textTransform: 'uppercase' }}>{title}</span>
        <span style={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1 }}>{tickets.length}</span>
      </div>
      {/* Sort bar */}
      <SortBar sortKey={sortKey} sortDir={sortDir} onSort={handleSort} th={th} />
      {/* Tickets */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: th.textMut, fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
            — CLEAR —
          </div>
        ) : sorted.map(t => (
          <Ticket key={t.id} t={t} onAction={onAction} onDetail={onDetail} th={th} />
        ))}
      </div>
    </div>
  );
}

/* ─── Search results with sort ─────────────────────────────────── */
function SearchSortResults({ tokens, onAction, onDetail, th }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const sorted = applySortToTickets(tokens, sortKey, sortDir);
  return (
    <>
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${th.border}`, background: th.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: th.textMut, letterSpacing: 1 }}>
          SEARCH — {tokens.length} found
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 1, background: th.border, borderRadius: 3, overflow: 'hidden' }}>
          {[{ key: 'article', label: 'Article' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Price' }].map(col => {
            const active = sortKey === col.key;
            return (
              <div key={col.key} style={{ background: th.card, display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: active ? th.text : th.textMut, letterSpacing: 0.3, textTransform: 'uppercase' }}>{col.label}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button onClick={() => { setSortKey(col.key); setSortDir('asc'); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', fontSize: 9, lineHeight: 1, color: active && sortDir === 'asc' ? th.text : th.textMut, fontWeight: active && sortDir === 'asc' ? 900 : 400 }}>▲</button>
                  <button onClick={() => { setSortKey(col.key); setSortDir('desc'); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', fontSize: 9, lineHeight: 1, color: active && sortDir === 'desc' ? th.text : th.textMut, fontWeight: active && sortDir === 'desc' ? 900 : 400 }}>▼</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {sorted.length === 0
          ? <div style={{ color: th.textMut, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>No matches</div>
          : sorted.map(t => <Ticket key={t.id} t={t} onAction={onAction} onDetail={onDetail} th={th} />)
        }
      </div>
    </>
  );
}

/* ─── TV / Customer Display ────────────────────────────────────── */
function TVDisplay({ tokens, onExit }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);

  const preparing = tokens.filter(t => (t.status || '').toUpperCase() === 'PREPARING');
  const ready     = tokens.filter(t => (t.status || '').toUpperCase() === 'READY');

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 9999, display: 'flex', flexDirection: 'column', fontFamily: 'monospace' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: '#111', borderBottom: '1px solid #222' }}>
        <div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>ORDER STATUS BOARD</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>🥐 BAKERY POS</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', letterSpacing: 4 }}>
            {time.toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {/* Two panes */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
        {/* Preparing pane */}
        <div style={{ borderRight: '1px solid #1e1e1e', padding: '28px 36px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', letterSpacing: 2, marginBottom: 4, textTransform: 'uppercase' }}>In the Kitchen</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#e5e7eb', marginBottom: 24 }}>Being Prepared</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, overflowY: 'auto' }}>
            {preparing.length === 0
              ? <div style={{ color: '#333', fontSize: 14, fontWeight: 600, width: '100%', marginTop: 60, textAlign: 'center' }}>Kitchen is caught up</div>
              : preparing.map(t => (
                <div key={t.id} style={{ background: '#111', border: '1px solid #2563eb33', borderLeft: '3px solid #2563eb', padding: '16px 24px', minWidth: 100, textAlign: 'center' }}>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{t.token}</div>
                  {t.customerName && <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{t.customerName}</div>}
                </div>
              ))}
          </div>
        </div>

        {/* Ready pane */}
        <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0c110e' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', letterSpacing: 2, marginBottom: 4, textTransform: 'uppercase' }}>Ready to Collect</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#e5e7eb', marginBottom: 24 }}>Please Pick Up</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, overflowY: 'auto' }}>
            {ready.length === 0
              ? <div style={{ color: '#1a2e22', fontSize: 14, fontWeight: 600, width: '100%', marginTop: 60, textAlign: 'center' }}>Nothing ready yet</div>
              : ready.map(t => (
                <div key={t.id} style={{ background: '#16a34a', padding: '16px 24px', minWidth: 100, textAlign: 'center', animation: 'blink 2.5s ease-in-out infinite' }}>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{t.token}</div>
                  {t.customerName && <div style={{ fontSize: 11, color: '#dcfce7', marginTop: 4 }}>{t.customerName}</div>}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Footer ticker */}
      <div style={{ background: '#111', borderTop: '1px solid #1e1e1e', padding: '10px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#555', letterSpacing: 1, animation: 'ticker 30s linear infinite' }}>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PLEASE WAIT AT THE COUNTER — YOUR TOKEN WILL APPEAR IN GREEN WHEN YOUR ORDER IS READY FOR COLLECTION&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;THANK YOU FOR YOUR PATIENCE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          PLEASE WAIT AT THE COUNTER — YOUR TOKEN WILL APPEAR IN GREEN WHEN YOUR ORDER IS READY FOR COLLECTION&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;THANK YOU FOR YOUR PATIENCE
        </div>
      </div>

      <button onClick={onExit} style={{ position: 'absolute', top: 16, right: 16, padding: '6px 14px', background: '#1e1e1e', color: '#666', border: '1px solid #333', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>ESC / EXIT</button>

      <style>{`
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

/* ─── Detail drawer / modal ─────────────────────────────────────── */
function DetailModal({ t, onClose, onAction, onPrint, th }) {
  if (!t) return null;
  const st = (t.status || 'PENDING').toUpperCase();
  const sc = STATUS[st] || STATUS.PENDING;
  const { str: elapsed, warn, caution } = useElapsed(t.createdAt);
  const elColor = warn ? '#dc2626' : caution ? '#d97706' : th.textMut;

  const nextAction = {
    PENDING:   { label: 'START PREPARING', next: 'PREPARING', color: '#2563eb' },
    PREPARING: { label: 'MARK READY',      next: 'READY',     color: '#16a34a' },
    READY:     { label: 'CONFIRM SERVED',  next: 'COMPLETED', color: '#374151' },
    COMPLETED: null,
  }[st];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10000 }}>
      <div style={{ width: 400, height: '100%', background: th.panel, borderLeft: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, color: th.textMut, fontWeight: 700, letterSpacing: 1 }}>ORDER DETAIL</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: th.text, fontFamily: 'monospace', letterSpacing: -1, lineHeight: 1.1 }}>{t.token}</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 2, letterSpacing: 0.5 }}>{sc.label}</span>
              <span style={{ fontSize: 12, color: elColor, fontFamily: 'monospace', fontWeight: 700 }}>{elapsed}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: `1px solid ${th.border}`, color: th.textMut, padding: '6px 10px', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>

        {/* Info grid */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: th.border }}>
            {[
              ['Customer',  t.customerName || 'Walk-in'],
              ['Table',     t.tableName || t.tableNumber || '—'],
              ['Type',      t.orderType || 'Dine-in'],
              ['Source',    t.source === 'qr' ? 'QR Scan' : 'Counter'],
              ['Time',      new Date(t.createdAt || Date.now()).toLocaleTimeString()],
              ['Total',     `₹${(t.total || 0).toFixed(2)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: th.card, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: th.textMut, fontWeight: 700, letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: th.text }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Items */}
          {t.items && t.items.length > 0 && (
            <div style={{ padding: '0 20px 16px' }}>
              <div style={{ fontSize: 11, color: th.textMut, fontWeight: 700, letterSpacing: 1, padding: '14px 0 8px', borderBottom: `1px solid ${th.border}`, marginBottom: 0 }}>ORDER ITEMS</div>
              {t.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${th.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: th.text }}>{item.name}</div>
                    {item.variant && <div style={{ fontSize: 11, color: th.textMut }}>{item.variant}</div>}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13 }}>
                    <span style={{ color: th.textMut }}>×{item.qty || item.quantity || 1}&nbsp;&nbsp;</span>
                    <span style={{ fontWeight: 700, color: th.text }}>₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 0 0', fontSize: 15, fontWeight: 800, color: th.text }}>
                Total: ₹{(t.total || 0).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ padding: 16, borderTop: `1px solid ${th.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {nextAction && (
            <button onClick={() => { onAction(t.id, nextAction.next, t.token); onClose(); }} style={{ padding: '12px 0', background: nextAction.color, color: '#fff', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}>
              {nextAction.label}
            </button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onPrint(t)} style={{ flex: 1, padding: '10px 0', background: 'none', color: th.textSub, border: `1px solid ${th.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>PRINT RECEIPT</button>
            {st !== 'PENDING' && st !== 'COMPLETED' && (
              <button onClick={() => { onAction(t.id, 'PENDING', t.token); onClose(); }} style={{ flex: 1, padding: '10px 0', background: 'none', color: th.textMut, border: `1px solid ${th.border}`, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>RESET</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── TV PIN modal ──────────────────────────────────────────────── */
function TVPinModal({ onConfirm, onCancel, th }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (pin === (localStorage.getItem('tv_mode_pin') || '1234') || pin === '1234') onConfirm();
    else setErr('Wrong PIN — default is 1234');
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: th.panel, border: `1px solid ${th.border}`, padding: 28, width: 300, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: th.textMut, letterSpacing: 1, marginBottom: 12 }}>TV DISPLAY — PIN REQUIRED</div>
        <input
          type="password" placeholder="Enter PIN" maxLength={6} autoFocus
          value={pin} onChange={e => { setPin(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ width: '100%', padding: '10px 12px', background: th.input, border: `1px solid ${err ? '#dc2626' : th.border}`, color: th.text, fontSize: 20, fontFamily: 'monospace', textAlign: 'center', letterSpacing: 8, boxSizing: 'border-box', outline: 'none', marginBottom: err ? 6 : 16 }}
        />
        {err && <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '10px 0', background: 'none', border: `1px solid ${th.border}`, color: th.textMut, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>CANCEL</button>
          <button onClick={submit} style={{ flex: 1, padding: '10px 0', background: '#111', border: `1px solid ${th.borderHi}`, color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}>LAUNCH TV</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Completed row (compact table) ────────────────────────────── */
function CompletedRow({ t, th }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderBottom: `1px solid ${th.border}`, fontSize: 12 }}>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: th.textMut, minWidth: 54 }}>{t.token}</span>
      <span style={{ color: th.textMut, flex: 1 }}>{t.customerName || 'Walk-in'}</span>
      {(t.tableName || t.tableNumber) && <span style={{ color: th.textMut }}>Tbl {t.tableName || t.tableNumber}</span>}
      <span style={{ color: th.textMut, fontFamily: 'monospace' }}>₹{(t.total || 0).toFixed(0)}</span>
      <span style={{ color: th.textMut }}>{new Date(t.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOBILE PHONE VIEW
═══════════════════════════════════════════════════════════════════ */

/* Mobile elapsed inline */
function MobileElapsed({ createdAt }) {
  const { str, warn, caution } = useElapsed(createdAt);
  const color = warn ? '#dc2626' : caution ? '#d97706' : '#9ca3af';
  return <span style={{ fontSize: 11, color, fontFamily: 'monospace', fontWeight: 700 }}>{str}</span>;
}

/* Mobile bottom-sheet detail */
function MobileSheet({ t, th, onClose, onAction, onPrint }) {
  const st = (t.status || 'PENDING').toUpperCase();
  const sc = STATUS[st] || STATUS.PENDING;
  const nextAction = {
    PENDING:   { label: 'Start Preparing', next: 'PREPARING', color: '#2563eb' },
    PREPARING: { label: 'Mark Ready',      next: 'READY',     color: '#16a34a' },
    READY:     { label: 'Confirm Served',  next: 'COMPLETED', color: '#374151' },
    COMPLETED: null,
  }[st];

  // Close on backdrop tap
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 10000, display: 'flex', alignItems: 'flex-end' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', background: th.panel,
          borderRadius: '20px 20px 0 0',
          borderTop: `3px solid ${sc.color}`,
          maxHeight: '88vh', overflowY: 'auto',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: th.border }} />
        </div>

        {/* Token + status */}
        <div style={{ padding: '4px 20px 14px', borderBottom: `1px solid ${th.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: th.textMut, fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>ORDER</div>
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'monospace', color: th.text, letterSpacing: -2, lineHeight: 1 }}>{t.token}</div>
            </div>
            <button onClick={onClose} style={{ marginTop: 4, padding: '6px 12px', background: 'none', border: `1px solid ${th.border}`, color: th.textMut, fontSize: 13, borderRadius: 8, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: sc.color, background: sc.bg, padding: '3px 10px', borderRadius: 4 }}>{sc.label}</span>
            <MobileElapsed createdAt={t.createdAt} />
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: th.border, margin: '0' }}>
          {[
            ['Customer',  t.customerName || 'Walk-in'],
            ['Table',     t.tableName || t.tableNumber || '—'],
            ['Type',      t.orderType || 'Dine-in'],
            ['Source',    t.source === 'qr' ? 'QR Scan' : 'Counter'],
            ['Time',      new Date(t.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })],
            ['Total',     `₹${(t.total || 0).toFixed(2)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ background: th.card, padding: '11px 16px' }}>
              <div style={{ fontSize: 10, color: th.textMut, fontWeight: 700, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: th.text }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Items */}
        {t.items && t.items.length > 0 && (
          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ fontSize: 10, color: th.textMut, fontWeight: 700, letterSpacing: 1, padding: '12px 0 8px', textTransform: 'uppercase' }}>Items</div>
            {t.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: `1px solid ${th.border}` }}>
                <span style={{ fontSize: 14, color: th.text }}>×{item.qty || item.quantity || 1}&nbsp; {item.name}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: th.text }}>₹{((item.price || 0) * (item.qty || item.quantity || 1)).toFixed(0)}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ padding: '12px 16px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nextAction && (
            <button
              onClick={() => { onAction(t.id, nextAction.next, t.token); onClose(); }}
              style={{ width: '100%', padding: '16px 0', background: nextAction.color, color: '#fff', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer', borderRadius: 10, letterSpacing: 0.3 }}
            >
              {nextAction.label}
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { onPrint(t); onClose(); }} style={{ flex: 1, padding: '13px 0', background: 'none', border: `1px solid ${th.border}`, color: th.textSub, fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer' }}>
              Print Receipt
            </button>
            {st !== 'PENDING' && st !== 'COMPLETED' && (
              <button onClick={() => { onAction(t.id, 'PENDING', t.token); onClose(); }} style={{ flex: 1, padding: '13px 0', background: 'none', border: `1px solid ${th.border}`, color: th.textMut, fontSize: 13, fontWeight: 700, borderRadius: 10, cursor: 'pointer' }}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Mobile ticket card */
function MobileCard({ t, onTap, th }) {
  const st = (t.status || 'PENDING').toUpperCase();
  const sc = STATUS[st] || STATUS.PENDING;

  const nextLabel = { PENDING: 'START', PREPARING: 'READY', READY: 'SERVED' }[st];
  const nextStatus = { PENDING: 'PREPARING', PREPARING: 'READY', READY: 'COMPLETED' }[st];

  return (
    <div
      onClick={() => onTap(t)}
      style={{
        background: th.card,
        border: `1px solid ${th.border}`,
        borderLeft: `4px solid ${sc.color}`,
        borderRadius: 10,
        padding: '14px 14px 12px',
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 26, color: th.text, letterSpacing: -1, minWidth: 72 }}>{t.token}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: th.textSub, lineHeight: 1.2 }}>{t.customerName || 'Walk-in'}</div>
          {(t.tableName || t.tableNumber) && (
            <div style={{ fontSize: 11, color: th.textMut, marginTop: 1 }}>Table {t.tableName || t.tableNumber}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: th.text }}>₹{(t.total || 0).toFixed(0)}</div>
          <MobileElapsed createdAt={t.createdAt} />
        </div>
      </div>

      {/* Items row */}
      {t.items && t.items.length > 0 && (
        <div style={{ fontSize: 12, color: th.textMut, display: 'flex', flexWrap: 'wrap', gap: '2px 10px' }}>
          {t.items.slice(0, 3).map((item, i) => (
            <span key={i}>×{item.qty || item.quantity || 1} {item.name}</span>
          ))}
          {t.items.length > 3 && <span>+{t.items.length - 3} more</span>}
        </div>
      )}

      {/* Action + status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 3, letterSpacing: 0.5 }}>
          {sc.label}
        </span>
        {t.source === 'qr' && (
          <span style={{ fontSize: 10, fontWeight: 700, color: th.textMut, background: th.border, padding: '2px 8px', borderRadius: 3 }}>QR</span>
        )}
        {nextLabel && nextStatus && (
          <button
            onClick={e => { e.stopPropagation(); onTap({ ...t, _quickAction: { next: nextStatus } }); }}
            style={{
              marginLeft: 'auto',
              padding: '7px 18px',
              background: sc.color,
              color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 800,
              borderRadius: 6, cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            {nextLabel} →
          </button>
        )}
      </div>
    </div>
  );
}

/* The full mobile view */
function MobileTokenView({
  th, allTokens, pending, preparing, ready, completed,
  stats, totalActive, updateStatus, printToken,
  onNavigate, voice, setVoice, tvPin, setTvPin,
  tvMode, setTvMode, msgs,
}) {
  const [activeTab, setActiveTab] = useState('pending');
  const [sheet, setSheet] = useState(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Quick-action shortcut: if _quickAction is set, fire immediately
  const handleTap = useCallback((t) => {
    if (t._quickAction) {
      updateStatus(t.id, t._quickAction.next, t.token);
    } else {
      setSheet(t);
    }
  }, [updateStatus]);

  const tabMap = {
    pending:   pending,
    preparing: preparing,
    ready:     ready,
    completed: completed,
  };

  const listTokens = search
    ? allTokens.filter(t =>
        t.token?.toLowerCase().includes(search.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(search.toLowerCase())
      )
    : tabMap[activeTab] || [];

  // Per-tab sort
  const [mobileSortKey, setMobileSortKey] = useState(null);
  const [mobileSortDir, setMobileSortDir] = useState('asc');
  // Reset sort when tab changes
  useEffect(() => { setMobileSortKey(null); setMobileSortDir('asc'); }, [activeTab]);
  const sortedListTokens = applySortToTickets(listTokens, mobileSortKey, mobileSortDir);

  const TABS = [
    { key: 'pending',   label: 'Pending',   color: '#d97706', count: stats.pending },
    { key: 'preparing', label: 'Preparing', color: '#2563eb', count: stats.preparing },
    { key: 'ready',     label: 'Ready',     color: '#16a34a', count: stats.ready },
    { key: 'completed', label: 'Served',    color: '#6b7280', count: stats.completed },
  ];

  const activeColor = TABS.find(t => t.key === activeTab)?.color || '#111';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: th.bg, color: th.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <ToastBanner msgs={msgs} />

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{ background: th.panel, borderBottom: `1px solid ${th.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => onNavigate?.('dashboard')} style={{ padding: '8px 10px', background: 'none', border: `1px solid ${th.border}`, color: th.textSub, fontSize: 18, lineHeight: 1, borderRadius: 8, cursor: 'pointer' }}>‹</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: th.text }}>Tokens</div>
          <div style={{ fontSize: 11, color: th.textMut }}>{totalActive} active · {stats.ready} ready</div>
        </div>
        <button onClick={() => setShowSearch(v => !v)} style={{ padding: '8px 10px', background: showSearch ? th.border : 'none', border: `1px solid ${th.border}`, color: th.textSub, fontSize: 14, borderRadius: 8, cursor: 'pointer' }}>
          🔍
        </button>
        <button onClick={() => setVoice(v => !v)} style={{ padding: '8px 10px', background: 'none', border: `1px solid ${th.border}`, color: voice ? '#16a34a' : th.textMut, fontSize: 13, fontWeight: 700, borderRadius: 8, cursor: 'pointer' }}>
          {voice ? '♪' : '✕'}
        </button>
        <button onClick={() => setTvPin(true)} style={{ padding: '8px 12px', background: th.text, color: th.panel, border: 'none', fontSize: 11, fontWeight: 800, borderRadius: 8, cursor: 'pointer', letterSpacing: 0.5 }}>
          TV
        </button>
      </div>

      {/* ── Search bar ──────────────────────────────────────── */}
      {showSearch && (
        <div style={{ background: th.panel, borderBottom: `1px solid ${th.border}`, padding: '8px 14px' }}>
          <input
            type="text" placeholder="Search token or name..." value={search} autoFocus
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', background: th.bg, border: `1px solid ${th.border}`, color: th.text, borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
        </div>
      )}

      {/* ── Status Tabs Bar ─────────────────────────────────── */}
      <div style={{ background: th.panel, borderBottom: `1px solid ${th.border}`, display: 'flex' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 4px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? `3px solid ${tab.color}` : '3px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer'
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: tab.count > 0 ? tab.color : th.textMut, lineHeight: 1 }}>
              {tab.count}
            </span>
            <span style={{ fontSize: 9, fontWeight: 800, color: activeTab === tab.key ? tab.color : th.textMut, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Mobile sort bar ─────────────────────────────────── */}
      {listTokens.length > 0 && (
        <div style={{ background: th.panel, borderBottom: `1px solid ${th.border}`, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 10, color: th.textMut, fontWeight: 700, letterSpacing: 0.5, marginRight: 8 }}>SORT:</span>
          {[{ key: 'article', label: 'Article' }, { key: 'qty', label: 'Qty' }, { key: 'price', label: 'Price' }].map(col => {
            const active = mobileSortKey === col.key;
            return (
              <div key={col.key} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', background: active ? th.border : 'none', borderRadius: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? th.text : th.textMut }}>{col.label}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <button onClick={() => { setMobileSortKey(col.key); setMobileSortDir('asc'); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', fontSize: 10, lineHeight: 1, color: active && mobileSortDir === 'asc' ? th.text : th.textMut, fontWeight: active && mobileSortDir === 'asc' ? 900 : 400 }}>▲</button>
                  <button onClick={() => { setMobileSortKey(col.key); setMobileSortDir('desc'); }} style={{ background: 'none', border: 'none', padding: '0 2px', cursor: 'pointer', fontSize: 10, lineHeight: 1, color: active && mobileSortDir === 'desc' ? th.text : th.textMut, fontWeight: active && mobileSortDir === 'desc' ? 900 : 400 }}>▼</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Token list ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 80px', WebkitOverflowScrolling: 'touch' }}>
        {search && (
          <div style={{ fontSize: 11, fontWeight: 700, color: th.textMut, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
            {sortedListTokens.length} result{sortedListTokens.length !== 1 ? 's' : ''}
          </div>
        )}
        {sortedListTokens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: th.textMut }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.35 }}>🎫</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: th.textSub }}>
              {search ? 'No matches' : 'Nothing here yet'}
            </div>
            <div style={{ fontSize: 12, color: th.textMut, marginTop: 6 }}>
              {search ? 'Try a different search.' : `No ${activeTab} orders right now.`}
            </div>
          </div>
        ) : (
          sortedListTokens.map(t => (
            <MobileCard key={t.id} t={t} onTap={handleTap} th={th} />
          ))
        )}
      </div>

      {/* ── Bottom action bar (only when ready count > 0) ── */}
      {stats.ready > 0 && activeTab !== 'ready' && (
        <div
          onClick={() => setActiveTab('ready')}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: '#16a34a', color: '#fff',
            padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', zIndex: 100,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 800 }}>
            {stats.ready} order{stats.ready !== 1 ? 's' : ''} ready for pickup
          </span>
          <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'monospace' }}>→</span>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────── */}
      {tvMode && <TVDisplay tokens={allTokens} onExit={() => setTvMode(false)} />}
      {tvPin  && <TVPinModal th={th} onConfirm={() => { setTvPin(false); setTvMode(true); }} onCancel={() => setTvPin(false)} />}
      {sheet  && (
        <MobileSheet
          t={allTokens.find(x => x.id === sheet.id) || sheet}
          th={th}
          onClose={() => setSheet(null)}
          onAction={updateStatus}
          onPrint={printToken}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════ */
export default function TokenManagement({ orders = [], setOrders, onNavigate, darkMode = true }) {
  const th = darkMode ? LIGHT : DARK;
  const { msgs, push: toast } = useToast();

  const [qrOrders, setQROrders] = useState([]);
  const [filter, setFilter] = useState('ACTIVE'); // ACTIVE | ALL | COMPLETED
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [tvMode, setTvMode] = useState(false);
  const [tvPin, setTvPin] = useState(false);
  const [voice, setVoice] = useState(true);
  const pollingRef = useRef(null);

  useEffect(() => {
    const load = () => {
      try { setQROrders(JSON.parse(localStorage.getItem('qr_orders') || '[]')); }
      catch {}
    };
    load();
    pollingRef.current = setInterval(load, 12000);
    return () => clearInterval(pollingRef.current);
  }, []);

  // Real-time order event synchronization
  useEffect(() => {
    // Subscribe to token generation events
    const unsubscribeTokenGenerated = orderEventManager.on('token:generated', ({ orderId, tokenNumber }) => {
      console.log('[TokenManagement] Token generated:', tokenNumber, 'for order:', orderId);
      // Find the order and add token number
      if (setOrders) {
        setOrders(prev => prev.map(o => 
          o.id === orderId ? { ...o, token: `T-${tokenNumber}` } : o
        ));
      }
    });

    // Subscribe to token status change events
    const unsubscribeTokenStatus = orderEventManager.on('token:status', ({ tokenNumber, newStatus }) => {
      console.log('[TokenManagement] Token status changed:', tokenNumber, newStatus);
      // Update token status
      if (setOrders) {
        setOrders(prev => prev.map(o => 
          o.token === `T-${tokenNumber}` ? { ...o, status: newStatus } : o
        ));
      }
    });

    // Subscribe to order completed events
    const unsubscribeOrderCompleted = orderEventManager.on('order:completed', (order) => {
      console.log('[TokenManagement] Order completed:', order.id);
      if (setOrders) {
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, status: 'COMPLETED' } : o
        ));
      }
    });

    // Subscribe to order paid events
    const unsubscribeOrderPaid = orderEventManager.on('order:paid', ({ order, paymentData }) => {
      console.log('[TokenManagement] Order paid:', order.id);
      if (setOrders) {
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, status: 'PAID', payment: paymentData } : o
        ));
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribeTokenGenerated();
      unsubscribeTokenStatus();
      unsubscribeOrderCompleted();
      unsubscribeOrderPaid();
    };
  }, []);

  const announce = useCallback((num, status) => {
    if (!voice || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = status === 'READY'
      ? `Token ${num.replace('T-', '')} — ready for pickup at the counter.`
      : `Token ${num.replace('T-', '')} — now being prepared.`;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88; u.volume = 1;
    window.speechSynthesis.speak(u);
  }, [voice]);

  const allTokens = useMemo(() => {
    return [...orders, ...qrOrders]
      .filter(o => o.token || o.id)
      .map(o => ({ ...o, token: o.token || `T-${String(o.id).slice(-4).toUpperCase()}` }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders, qrOrders]);

  const updateStatus = useCallback((id, newStatus, tokenNum) => {
    const isQR = qrOrders.some(q => q.id === id) || id?.toString().startsWith('QR-');
    if (isQR) {
      try {
        const s = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        const u = s.map(o => o.id === id ? { ...o, status: newStatus } : o);
        localStorage.setItem('qr_orders', JSON.stringify(u));
        setQROrders(u);
      } catch {}
    }
    if (setOrders) setOrders(p => p.map(o => o.id === id ? { ...o, status: newStatus } : o));
    const labels = { PREPARING: 'Preparing', READY: 'Ready — announcing', COMPLETED: 'Served' };
    toast(`${tokenNum}  →  ${labels[newStatus] || newStatus}`, newStatus === 'READY' ? 'ok' : 'info');
    if (newStatus === 'READY' || newStatus === 'PREPARING') announce(tokenNum, newStatus);
    if (navigator.vibrate && newStatus === 'READY') navigator.vibrate([80, 40, 160]);
    // Update detail panel if open
    setDetail(d => d && d.id === id ? { ...d, status: newStatus } : d);
  }, [qrOrders, setOrders, announce, toast]);

  const printToken = useCallback((t) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    doc.setFillColor(17, 17, 17);
    doc.rect(0, 0, 148, 30, 'F');
    doc.setFontSize(16); doc.setTextColor(255, 255, 255);
    doc.text('BAKERY POS', 74, 12, { align: 'center' });
    doc.setFontSize(9); doc.setTextColor(150, 150, 150);
    doc.text('TOKEN RECEIPT', 74, 20, { align: 'center' });
    doc.setFontSize(48); doc.setTextColor(17, 17, 17); doc.setFont(undefined, 'bold');
    doc.text(t.token, 74, 60, { align: 'center' });
    doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.setFont(undefined, 'normal');
    doc.text(`STATUS: ${t.status || 'PENDING'}`, 74, 72, { align: 'center' });
    doc.setDrawColor(220, 220, 220); doc.line(12, 78, 136, 78);
    doc.setFontSize(10); doc.setTextColor(40, 40, 40);
    doc.text(`Customer: ${t.customerName || 'Walk-in'}`, 12, 88);
    doc.text(`Time: ${new Date(t.createdAt || Date.now()).toLocaleString()}`, 12, 96);
    if (t.tableName) doc.text(`Table: ${t.tableName}`, 12, 104);
    if (t.items?.length > 0) {
      autoTable(doc, {
        startY: 112, margin: { left: 12, right: 12 },
        head: [['Item', 'Qty', 'Total']],
        body: t.items.map(i => [i.name, `×${i.qty || i.quantity || 1}`, `Rs.${((i.price||0)*(i.qty||i.quantity||1)).toFixed(2)}`]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontSize: 8 },
        theme: 'plain',
      });
    }
    const y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 125;
    doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(17, 17, 17);
    doc.text(`Total: Rs.${(t.total || 0).toFixed(2)}`, 74, y, { align: 'center' });
    doc.save(`${t.token}.pdf`);
    toast(`${t.token} receipt saved`, 'ok');
  }, [toast]);

  // Kanban columns
  const pending   = allTokens.filter(t => (t.status || '').toUpperCase() === 'PENDING');
  const preparing = allTokens.filter(t => ['PREPARING','IN_PROGRESS'].includes((t.status||'').toUpperCase()));
  const ready     = allTokens.filter(t => (t.status || '').toUpperCase() === 'READY');
  const completed = allTokens.filter(t => (t.status || '').toUpperCase() === 'COMPLETED');

  const searchTokens = search
    ? allTokens.filter(t => t.token?.toLowerCase().includes(search.toLowerCase()) || t.customerName?.toLowerCase().includes(search.toLowerCase()))
    : null;

  const stats = { pending: pending.length, preparing: preparing.length, ready: ready.length, completed: completed.length };
  const totalActive = stats.pending + stats.preparing + stats.ready;

  // ── Phone layout ──────────────────────────────────────────────
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <MobileTokenView
        th={th}
        allTokens={allTokens}
        pending={pending} preparing={preparing} ready={ready} completed={completed}
        stats={stats} totalActive={totalActive}
        updateStatus={updateStatus}
        printToken={printToken}
        onNavigate={onNavigate}
        voice={voice} setVoice={setVoice}
        tvPin={tvPin} setTvPin={setTvPin}
        tvMode={tvMode} setTvMode={setTvMode}
        msgs={msgs}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: th.bg, color: th.text, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <ToastBanner msgs={msgs} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: th.panel, borderBottom: `1px solid ${th.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate?.('dashboard')} style={{ padding: '6px 12px', background: 'none', border: `1px solid ${th.border}`, color: th.textSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← Back</button>

        <div style={{ width: 1, height: 28, background: th.border }} />

        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: th.text, letterSpacing: -0.3 }}>Token Management</div>
          <div style={{ fontSize: 11, color: th.textMut, marginTop: 1 }}>
            {totalActive} active &nbsp;·&nbsp; {stats.ready} ready &nbsp;·&nbsp; {stats.completed} served today
          </div>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'PENDING',   val: stats.pending,   color: '#d97706' },
            { label: 'PREPARING', val: stats.preparing, color: '#2563eb' },
            { label: 'READY',     val: stats.ready,     color: '#16a34a' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', border: `1px solid ${th.border}`, background: th.bg }}>
              <span style={{ width: 6, height: 6, background: s.color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: th.textMut, letterSpacing: 0.5 }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.val}</span>
            </div>
          ))}

          <div style={{ width: 1, height: 28, background: th.border }} />

          {/* Search */}
          <input
            type="text" placeholder="Search token / name..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 10px', background: th.input, border: `1px solid ${th.border}`, color: th.text, fontSize: 12, width: 180, outline: 'none', fontFamily: 'inherit' }}
          />

          <button onClick={() => setVoice(v => !v)} style={{ padding: '6px 12px', background: 'none', border: `1px solid ${th.border}`, color: voice ? '#16a34a' : th.textMut, fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}>
            {voice ? '♪ VOICE' : '✕ MUTED'}
          </button>
          <button onClick={() => setTvPin(true)} style={{ padding: '6px 14px', background: th.text, color: th.panel, border: 'none', fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5 }}>
            TV MODE
          </button>
        </div>
      </div>

      {/* ── Search results overlay ─────────────────────────────── */}
      {searchTokens && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <SearchSortResults tokens={searchTokens} onAction={updateStatus} onDetail={setDetail} th={th} />
        </div>
      )}

      {/* ── Kanban board ──────────────────────────────────────── */}
      {!searchTokens && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 3-column kanban */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: th.border, overflow: 'hidden', minHeight: 0 }}>
            <Column title="Pending" color={STATUS.PENDING.color} tickets={pending} onAction={updateStatus} onDetail={setDetail} th={th} />
            <Column title="Preparing" color={STATUS.PREPARING.color} tickets={preparing} onAction={updateStatus} onDetail={setDetail} th={th} />
            <Column title="Ready for Pickup" color={STATUS.READY.color} tickets={ready} onAction={updateStatus} onDetail={setDetail} th={th} />
          </div>

          {/* Completed list (collapsible compact strip) */}
          {completed.length > 0 && (
            <div style={{ background: th.panel, borderTop: `1px solid ${th.border}`, maxHeight: 180, overflowY: 'auto' }}>
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: th.bg, position: 'sticky', top: 0, zIndex: 1, borderBottom: `1px solid ${th.border}` }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: th.textMut, letterSpacing: 1 }}>SERVED TODAY</span>
                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 900, color: th.textMut }}>{completed.length}</span>
              </div>
              {completed.map(t => <CompletedRow key={t.id} t={t} th={th} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────── */}
      {tvMode && <TVDisplay tokens={allTokens} onExit={() => setTvMode(false)} />}
      {tvPin && <TVPinModal th={th} onConfirm={() => { setTvPin(false); setTvMode(true); }} onCancel={() => setTvPin(false)} />}
      {detail && <DetailModal t={detail} th={th} onClose={() => setDetail(null)} onAction={updateStatus} onPrint={printToken} />}
    </div>
  );
}
