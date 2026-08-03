/**
 * GuestOrder.jsx
 * Customer-facing QR ordering page.
 * Loaded at /guest/<qrCode> — detected in App.jsx before BrewCRM mounts.
 *
 * Works in BOTH demo mode and local mode:
 * - Demo mode: reads seed data (QR codes, menu items, tables) directly from constants
 * - Local mode: reads from localStorage (brewcrm_local_*)
 * Orders are always written to localStorage so BrewCRM's polling picks them up.
 */
// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getSeedQRCodes } from '../data/qrConstants.js';
import { MENU_ITEMS } from '../data/constants.js';
import { INIT_TABLES } from '../data/tableConstants.js';
import { THEME_CSS } from '../styles/theme.js';

// ── Storage helpers ───────────────────────────────────────────────────────────
const LOCAL_PREFIX = 'brewcrm_local_';
const readLocal  = (key, fb) => { try { const r = localStorage.getItem(LOCAL_PREFIX + key); return r ? JSON.parse(r) : fb; } catch { return fb; } };
const writeLocal = (key, val) => {
  try { localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(val)); return true; }
  catch (e) { console.error('[GuestOrder] Failed to persist "' + key + '":', e); return false; }
};

// Read collection — prefer localStorage, fall back to seed data
const readCollection = (key, seedFallback) => {
  const stored = readLocal(key, null);
  if (Array.isArray(stored) && stored.length > 0) return stored;
  return Array.isArray(seedFallback) ? seedFallback : [];
};

// Snapshot of currently orderable menu items (active + not 86'd), read fresh from storage.
const loadActiveMenu = () => {
  const seedMenu = MENU_ITEMS.map(m => ({ ...m, active: true, eightySixed: false }));
  return readCollection('menuItems', seedMenu).filter(m => m.active !== false && !m.eightySixed);
};

// Re-checks a cart against the latest menu snapshot right before an order is submitted, since
// an item may have gone 86'd or been re-priced while the guest was browsing.
const reconcileCart = (cart, freshItems) => {
  const byId = new Map(freshItems.map(m => [m.id, m]));
  const removed = [];
  const priceChanged = [];
  const validCart = [];
  cart.forEach(c => {
    const fresh = byId.get(c.id);
    if (!fresh) { removed.push(c.name); return; }
    if (fresh.price !== c.price) { priceChanged.push(c.name); validCart.push({ ...c, price: fresh.price }); return; }
    validCart.push(c);
  });
  return { validCart, removed, priceChanged };
};

// ── ID generator ──────────────────────────────────────────────────────────────
const genId = () => 'QR-ORD-' + Date.now() + '-' + Math.random().toString(36).slice(2,7);

// ── Step enum ─────────────────────────────────────────────────────────────────
const STEP = { LOADING: 'loading', MENU: 'menu', CART: 'cart', DONE: 'done', ERROR: 'error' };

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

const MAX_QTY = 20; // per-item cap so a mis-tap can't spam a huge order

// ── Assistance requests ──────────────────────────────────────────────────────
const ASSISTANCE_OPTIONS = [
  { id: 'WAITER',  label: 'Call Waiter',        emoji: '🙋' },
  { id: 'WATER',   label: 'Water Refill',       emoji: '💧' },
  { id: 'CUTLERY', label: 'Cutlery / Napkins',  emoji: '🍴' },
  { id: 'BILL',    label: 'Request Bill',       emoji: '🧾' },
];
const ASSIST_COOLDOWN_MS = 90 * 1000; // prevents spamming staff with repeat taps

export default function GuestOrder() {
  // Parse QR code from URL: /guest/<qrCode>
  const qrCode = useMemo(() => {
    const parts = window.location.pathname.split('/');
    const idx = parts.findIndex(p => p === 'guest');
    return idx !== -1 ? parts[idx + 1] : null;
  }, []);

  // Inject the same CafeOS design tokens the main unit uses, since this page can mount
  // standalone (before BrewCRM/Layout) and wouldn't otherwise have --cafe-* vars defined.
  useEffect(() => {
    if (!document.getElementById('cafeos-theme-vars') && !document.getElementById('brew-theme')) {
      const el = document.createElement('style');
      el.id = 'cafeos-theme-vars';
      el.textContent = THEME_CSS;
      document.head.appendChild(el);
    }
    if (!document.getElementById('cafeos-guestorder-fx')) {
      const el2 = document.createElement('style');
      el2.id = 'cafeos-guestorder-fx';
      el2.textContent = `
        .qr-card:hover { border-color: var(--cafe-border-focus); box-shadow: var(--cafe-shadow-md); }
        .qr-card:active { transform: scale(0.99); }
        .qr-fab:hover { transform: translateX(-50%) translateY(-2px); }
        .qr-fab:active { transform: translateX(-50%) scale(0.98); }
        input:focus, textarea:focus { border-color: var(--cafe-border-focus) !important; box-shadow: 0 0 0 3px var(--cafe-accent-bg); }
      `;
      document.head.appendChild(el2);
    }
  }, []);

  const [step, setStep]     = useState(STEP.LOADING);
  const [menuItems, setMenuItems]   = useState([]);
  const [qrConfig, setQrConfig]     = useState(null);
  const [tableInfo, setTableInfo]   = useState(null);
  const [cart, setCart]     = useState([]);    // [{id, name, price, qty, emoji, cat, note}]
  const [notes, setNotes]   = useState('');
  const [orderId, setOrderId] = useState(null);
  const [error, setError]   = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [cartWarning, setCartWarning] = useState('');
  const [expandedNotes, setExpandedNotes] = useState(() => new Set());
  const [pulseId, setPulseId] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);
  const [assistSentAt, setAssistSentAt] = useState(null);
  const [assistLastType, setAssistLastType] = useState(null);
  const placingRef = useRef(false); // blocks a fast double-tap from placing two orders

  // Load data from localStorage on mount
  useEffect(() => {
    if (!qrCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError('Invalid QR code. Please scan again.');
       
      setStep(STEP.ERROR);
      return;
    }

    // Load QR codes — prefer localStorage, fall back to seed data
    const seedQRs = getSeedQRCodes();
    const qrCodes = readCollection('qrCodes', seedQRs);
    const qr = qrCodes.find(q => q.code === qrCode);
    if (!qr) {
      setError('QR code not found or expired.');
      setStep(STEP.ERROR);
      return;
    }
    if (!qr.active) {
      setError('This QR code is currently inactive.');
      setStep(STEP.ERROR);
      return;
    }
    if (!qr.settings?.orderingEnabled) {
      setError('Ordering is disabled for this QR code.');
      setStep(STEP.ERROR);
      return;
    }
    setQrConfig(qr);

    // Load table info — fall back to INIT_TABLES seed
    const tables = readCollection('tables', INIT_TABLES);
    const table = qr.tableId ? tables.find(t => t.id === qr.tableId) : null;
    setTableInfo(table);

    // Load menu — seed MENU_ITEMS are active by default
    setMenuItems(loadActiveMenu());

    // Increment scan count in localStorage (best-effort), once per browser session per QR
    // code so a page refresh doesn't inflate the analytics.
    const scanFlagKey = 'qr_scan_recorded_' + qrCode;
    let alreadyRecorded = false;
    try { alreadyRecorded = sessionStorage.getItem(scanFlagKey) === '1'; } catch { /* sessionStorage unavailable */ }
    if (!alreadyRecorded) {
      const storedQRs = readLocal('qrCodes', null);
      if (Array.isArray(storedQRs)) {
        writeLocal('qrCodes', storedQRs.map(q =>
          q.code === qrCode ? { ...q, scanCount: (q.scanCount || 0) + 1, lastScannedAt: Date.now() } : q
        ));
      }
      try { sessionStorage.setItem(scanFlagKey, '1'); } catch { /* ignore */ }
    }

    setStep(STEP.MENU);
  }, [qrCode]);

  // ── Cart operations ───────────────────────────────────────────────────────
  const addItem = useCallback((item) => {
    setCartWarning('');
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        if (existing.qty >= MAX_QTY) return prev; // capped
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1, emoji: item.emoji || '🍽️', cat: item.cat, note: '' }];
    });
    setPulseId(item.id);
    setTimeout(() => setPulseId(id => id === item.id ? null : id), 300);
  }, []);

  const removeItem = useCallback((id) => {
    setCartWarning('');
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));
  }, []);

  const updateItemNote = useCallback((id, note) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, note: note.slice(0, 200) } : c));
  }, []);

  const toggleNoteField = useCallback((id) => {
    setExpandedNotes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Assistance requests ───────────────────────────────────────────────────
  // Auto re-enable the "call waiter" bell once the cooldown window has passed.
  useEffect(() => {
    if (!assistSentAt) return;
    const remaining = ASSIST_COOLDOWN_MS - (Date.now() - assistSentAt);
    if (remaining <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssistSentAt(null);
      return;
    }
    const t = setTimeout(() => setAssistSentAt(null), remaining);
    return () => clearTimeout(t);
  }, [assistSentAt]);

  const sendAssistance = useCallback((type) => {
    const now = Date.now();
    const request = {
      id: 'SVC-' + now + '-' + Math.random().toString(36).slice(2, 7),
      type,
      qrCode,
      tableId:     qrConfig?.tableId || null,
      tableNumber: tableInfo?.number || null,
      status:      'PENDING',
      createdAt:   new Date(now).toISOString(),
    };
    const existing = readCollection('serviceRequests', []);
    const ok = writeLocal('serviceRequests', [request, ...existing]);
    if (ok) {
      setAssistLastType(type);
      setAssistSentAt(now);
      setAssistOpen(false);
    }
  }, [qrCode, qrConfig, tableInfo]);

  const cartTotal    = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount    = cart.reduce((s, c) => s + c.qty, 0);
  const taxAmount    = Math.round(cartTotal * 0.18);
  const grandTotal   = cartTotal + taxAmount;

  const categories = useMemo(() => {
    const cats = ['All', ...new Set(menuItems.map(m => m.cat).filter(Boolean))];
    return cats;
  }, [menuItems]);

  const visibleItems = useMemo(() => {
    let items = catFilter === 'All' ? menuItems : menuItems.filter(m => m.cat === catFilter);
    const q = search.trim().toLowerCase();
    if (q) items = items.filter(m => m.name.toLowerCase().includes(q));
    return items;
  }, [menuItems, catFilter, search]);

  // ── Place order ───────────────────────────────────────────────────────────
  const placeOrder = useCallback(() => {
    if (cart.length === 0 || placingRef.current) return;
    placingRef.current = true;

    try {
      // Re-validate against the latest menu snapshot right before submitting — an item may
      // have been 86'd or re-priced while the guest was browsing.
      const freshItems = loadActiveMenu();
      const { validCart, removed, priceChanged } = reconcileCart(cart, freshItems);

      if (removed.length > 0 || priceChanged.length > 0) {
        setMenuItems(freshItems);
        setCart(validCart);
        const msgs = [];
        if (removed.length) msgs.push(`${removed.join(', ')} ${removed.length > 1 ? "are no longer available and were" : "is no longer available and was"} removed from your order.`);
        if (priceChanged.length) msgs.push(`Price updated for ${priceChanged.join(', ')}.`);
        setCartWarning(msgs.join(' ') + ' Please review and place your order again.');
        placingRef.current = false;
        return;
      }

      const id = genId();
      const now = new Date().toISOString();

      const orderItems = cart.map(c => ({
        id: c.id, menuItemId: c.id, name: c.name, qty: c.qty,
        price: c.price, modifiers: [],
        station: c.cat === 'Coffee' ? 'Bar' : 'Kitchen',
        notes: c.note ? c.note.trim().slice(0, 200) : '',
      }));

      const newOrder = {
        id,
        source:        'QR_ORDERING',
        orderType:     'DINE_IN',
        qrCode:        qrCode,
        qrLabel:       qrConfig?.label || 'QR',
        tableId:       qrConfig?.tableId || null,
        tableNumber:   tableInfo?.number || null,
        customerName:  tableInfo ? `Table ${tableInfo.number} (QR)` : 'QR Guest',
        customerPhone: '',
        items:         orderItems,
        subtotal:      cartTotal,
        taxAmount,
        total:         grandTotal,
        discountAmount: 0, packagingAmount: 0,
        status:        'NEW',
        paymentStatus: 'UNPAID',
        paymentMethod: null,
        notes:         notes.trim().slice(0, 500),
        createdAt:     now,
        updatedAt:     now,
        completedAt:   null,
        inventoryDeducted: false,
      };

      // Write order to localStorage (BrewCRM polls this every 3s)
      const existingOrders = readCollection('orders', []);
      const orderWriteOk = writeLocal('orders', [newOrder, ...existingOrders]);

      // Write KDS tickets
      const kdsCards = readCollection('kdsCards', []);
      const newTickets = orderItems.map((it, i) => ({
        id: `KDS-${id}-${i}`,
        orderId: id,
        tableId:     newOrder.tableId,
        tableNumber: newOrder.tableNumber,
        station:     it.station,
        items:       [it],
        status:      'NEW',
        source:      'QR_ORDERING',
        createdAt:   now,
        updatedAt:   now,
      }));
      const kdsWriteOk = writeLocal('kdsCards', [...newTickets, ...kdsCards]);

      if (!orderWriteOk || !kdsWriteOk) {
        throw new Error('STORAGE_WRITE_FAILED');
      }

      // Mark table occupied
      if (qrConfig?.tableId) {
        const tables = readCollection('tables', INIT_TABLES);
        writeLocal('tables', tables.map(t => t.id === qrConfig.tableId
          ? { ...t, status: 'occupied', currentOrderId: id }
          : t
        ));
      }

      setOrderId(id);
      setStep(STEP.DONE);
    } catch (err) {
      console.error('[GuestOrder] Failed to place order:', err);
      setError(err?.message === 'STORAGE_WRITE_FAILED'
        ? "Couldn't save your order — your browser storage may be full or blocked. Please ask a staff member to place this order for you."
        : 'Failed to place order. Please try again.');
      setStep(STEP.ERROR);
      placingRef.current = false;
    }
  }, [cart, cartTotal, taxAmount, grandTotal, notes, qrCode, qrConfig, tableInfo]);

  // ── Styles ────────────────────────────────────────────────────────────────
  // Every color/radius/shadow below is pulled from the same CafeOS tokens (var(--cafe-*))
  // that the main BrewCRM unit uses, so this guest page always matches the active theme
  // (including a live light/dark switch, since these are CSS custom properties, not hex).
  const S = {
    page:   { minHeight: '100vh', background: 'var(--cafe-bg)', color: 'var(--cafe-text-primary)', fontFamily: "'Inter', system-ui, sans-serif", maxWidth: 480, margin: '0 auto', paddingBottom: 100 },
    header: { background: 'var(--cafe-bg-elevated)', backdropFilter: 'blur(20px)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--cafe-border-light)' },
    logo:   { fontSize: 22, fontWeight: 800, color: 'var(--cafe-accent)' },
    section:{ padding: '0 16px', marginTop: 16 },
    catRow: { display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px', scrollbarWidth: 'none', position: 'sticky', top: 61, zIndex: 9, background: 'var(--cafe-bg)' },
    catBtn: (active) => ({ padding: '7px 16px', borderRadius: 'var(--cafe-radius-xl)', border: `1px solid ${active ? 'var(--cafe-accent)' : 'var(--cafe-border-light)'}`, background: active ? 'var(--cafe-accent-bg)' : 'transparent', color: active ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s ease' }),
    card:   { background: 'var(--cafe-bg-card)', borderRadius: 'var(--cafe-radius-lg)', padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--cafe-border)', boxShadow: 'var(--cafe-shadow-sm)', transition: 'box-shadow 0.15s ease, border-color 0.15s ease, transform 0.15s ease' },
    name:   { fontSize: 14, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 2 },
    cat:    { fontSize: 11, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' },
    price:  { fontSize: 14, fontWeight: 800, color: 'var(--cafe-accent)', fontFamily: 'monospace' },
    qtyRow: { display: 'flex', alignItems: 'center', gap: 8 },
    // variant: 'danger' (minus) or 'success' (plus) — same tinted-chip pattern as the main unit's btn()
    qtyBtn: (variant, disabled) => {
      const tokens = variant === 'danger'
        ? { bg: 'var(--cafe-danger-bg)', border: 'var(--cafe-danger-border)', text: 'var(--cafe-danger)' }
        : { bg: 'var(--cafe-success-bg)', border: 'var(--cafe-success-border)', text: 'var(--cafe-success)' };
      return { width: 30, height: 30, borderRadius: 'var(--cafe-radius-sm)', border: `1px solid ${tokens.border}`, background: tokens.bg, color: tokens.text, fontSize: 18, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, opacity: disabled ? 0.35 : 1, transition: 'all 0.15s ease' };
    },
    qtyNum: { fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: 'var(--cafe-accent)', width: 22, textAlign: 'center' },
    fab:    { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,var(--cafe-accent),var(--cafe-accent-light))', color: '#1A1208', border: 'none', borderRadius: 'var(--cafe-radius-lg)', padding: '16px 32px', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: 'var(--cafe-shadow-lg), var(--cafe-shadow-glow)', zIndex: 20, whiteSpace: 'nowrap', transition: 'transform 0.15s ease' },
    input:  { width: '100%', padding: '10px 14px', borderRadius: 'var(--cafe-radius-md)', border: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 14, resize: 'none', boxSizing: 'border-box', minHeight: 44, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' },
    pill:   { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--cafe-radius-sm)', background: 'var(--c-purple-bg)', color: 'var(--c-purple)', border: '1px solid var(--c-purple-border)', letterSpacing: '0.06em' },
    warn:   { background: 'var(--cafe-danger-bg)', border: '1px solid var(--cafe-danger-border)', color: 'var(--cafe-danger)', borderRadius: 'var(--cafe-radius-md)', padding: '12px 14px', fontSize: 12.5, lineHeight: 1.5, margin: '16px 16px 0' },
    confirm:{ background: 'var(--cafe-success-bg)', border: '1px solid var(--cafe-success-border)', color: 'var(--cafe-success)', borderRadius: 'var(--cafe-radius-md)', padding: '12px 14px', fontSize: 12.5, lineHeight: 1.5, margin: '16px 16px 0' },
    bell:   (active) => ({ width: 34, height: 34, borderRadius: 'var(--cafe-radius-md)', border: `1px solid ${active ? 'var(--cafe-success-border)' : 'var(--cafe-border-light)'}`, background: active ? 'var(--cafe-success-bg)' : 'var(--cafe-bg-elevated)', color: active ? 'var(--cafe-success)' : 'var(--cafe-accent)', fontSize: 15, cursor: active ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s ease' }),
  };

  // ── Assistance bell + panel (shared across Menu/Cart/Done screens) ────────
  const assistBell = (
    <button
      onClick={() => setAssistOpen(o => !o)}
      disabled={!!assistSentAt}
      aria-label="Request assistance"
      title={assistSentAt ? "We've let staff know" : 'Request assistance'}
      style={S.bell(!!assistSentAt)}
    >
      {assistSentAt ? '✓' : '🔔'}
    </button>
  );

  const assistPanel = assistOpen && (
    <div style={{ padding: '10px 16px 4px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ASSISTANCE_OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => sendAssistance(opt.id)}
          style={{ padding: '8px 14px', borderRadius: 'var(--cafe-radius-xl)', border: '1px solid var(--cafe-accent-border)', background: 'var(--cafe-accent-bg)', color: 'var(--cafe-accent-light)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {opt.emoji} {opt.label}
        </button>
      ))}
    </div>
  );

  const assistConfirm = assistSentAt && (
    <div style={S.confirm}>
      ✓ {ASSISTANCE_OPTIONS.find(o => o.id === assistLastType)?.label || 'Request'} sent — staff have been notified.
    </div>
  );

  // ── Loading screen ───────────────────────────────────────────────────────
  if (step === STEP.LOADING) return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes qrSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 40, animation: 'qrSpin 1.1s linear infinite' }}>☕</div>
      <div style={{ marginTop: 14, fontSize: 13, color: 'var(--cafe-text-tertiary)' }}>Loading menu…</div>
    </div>
  );

  // ── Error screen ─────────────────────────────────────────────────────────
  if (step === STEP.ERROR) return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>⚠️</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Oops</div>
      <div style={{ fontSize: 14, color: 'var(--cafe-text-secondary)', lineHeight: 1.6 }}>{error}</div>
      <div style={{ marginTop: 24, fontSize: 12, color: 'var(--cafe-text-muted)' }}>Please ask a staff member for help.</div>
    </div>
  );

  // ── Done screen ───────────────────────────────────────────────────────────
  if (step === STEP.DONE) return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--cafe-accent)', marginBottom: 8 }}>Order Placed!</div>
      <div style={{ fontSize: 15, color: 'var(--cafe-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
        Your order has been sent to the kitchen.<br/>We'll bring it to you shortly!
      </div>
      <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border)', borderRadius: 'var(--cafe-radius-lg)', padding: '16px 24px', width: '100%', maxWidth: 320, boxShadow: 'var(--cafe-shadow-sm)' }}>
        <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Order Summary</div>
        {cart.map(c => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 5 }}>
            <span>{c.emoji} {c.name} × {c.qty}</span>
            <span style={{ color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>{fmt(c.price * c.qty)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--cafe-border)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
          <span>Total (incl. GST)</span><span style={{ color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>{fmt(grandTotal)}</span>
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--cafe-text-muted)' }}>Order ID: {orderId}</div>
      {tableInfo && <div style={{ marginTop: 6, fontSize: 13, color: 'var(--cafe-text-tertiary)' }}>Table {tableInfo.number}</div>}

      <div style={{ display: 'flex', gap: 10, marginTop: 28, width: '100%', maxWidth: 320 }}>
        <button
          onClick={() => { setCartWarning(''); setOrderId(null); setStep(STEP.CART); }}
          style={{ flex: 1, background: 'var(--cafe-accent)', color: '#1A1208', border: 'none', borderRadius: 'var(--cafe-radius-lg)', padding: '13px 10px', fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}
        >
          🔁 Order Again
        </button>
        <button
          onClick={() => { setCart([]); setNotes(''); setCartWarning(''); setOrderId(null); setExpandedNotes(new Set()); setStep(STEP.MENU); }}
          style={{ flex: 1, background: 'transparent', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-lg)', padding: '13px 10px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
        >
          🍽️ Order Something Else
        </button>
      </div>

      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {assistBell}
          <span style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)' }}>Need something while you wait?</span>
        </div>
        {assistPanel}
        {assistConfirm}
      </div>
    </div>
  );

  // ── Cart / confirm screen ─────────────────────────────────────────────────
  if (step === STEP.CART && cart.length === 0) return (
    <div style={{ ...S.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</div>
      <div style={{ fontSize: 13, color: 'var(--cafe-text-tertiary)', marginBottom: 24 }}>Add something tasty from the menu first.</div>
      <button
        onClick={() => setStep(STEP.MENU)}
        style={{ background: 'var(--cafe-accent)', color: '#1A1208', border: 'none', borderRadius: 'var(--cafe-radius-lg)', padding: '12px 28px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
      >
        Browse Menu
      </button>
    </div>
  );

  if (step === STEP.CART) return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => setStep(STEP.MENU)} style={{ background: 'none', border: 'none', color: 'var(--cafe-accent)', fontSize: 22, cursor: 'pointer', padding: 0 }}>←</button>
        <div style={S.logo}>☕ Your Order</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={S.pill}>QR Order</span>
          {assistBell}
        </div>
      </div>
      {assistPanel}
      {assistConfirm}
      {tableInfo && <div style={{ padding: '8px 20px 0', fontSize: 13, color: 'var(--cafe-text-tertiary)' }}>📍 Table {tableInfo.number}</div>}

      {cartWarning && <div style={S.warn}>⚠️ {cartWarning}</div>}

      <div style={S.section}>
        {cart.map(c => {
          const noteOpen = expandedNotes.has(c.id);
          return (
            <div key={c.id} className="qr-card" style={{ ...S.card, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 32, flexShrink: 0 }}>{c.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.name}>{c.name}</div>
                <div style={S.price}>{fmt(c.price)} each</div>
                <button
                  onClick={() => toggleNoteField(c.id)}
                  style={{ background: 'none', border: 'none', color: c.note ? 'var(--cafe-accent)' : 'var(--cafe-text-muted)', fontSize: 11, cursor: 'pointer', padding: '4px 0 0', textDecoration: 'underline' }}
                >
                  {c.note ? 'Edit note' : '+ Add note'}
                </button>
              </div>
              <div style={S.qtyRow}>
                <button style={S.qtyBtn('danger')} onClick={() => removeItem(c.id)}>−</button>
                <span style={S.qtyNum}>{c.qty}</span>
                <button
                  disabled={c.qty >= MAX_QTY}
                  style={S.qtyBtn('success', c.qty >= MAX_QTY)}
                  onClick={() => addItem(c)}
                >+</button>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: 'var(--cafe-accent)', minWidth: 60, textAlign: 'right' }}>{fmt(c.price * c.qty)}</div>
              {noteOpen && (
                <input
                  style={{ ...S.input, marginTop: 8 }}
                  value={c.note}
                  maxLength={200}
                  placeholder="E.g. no onion, extra spicy…"
                  onChange={e => updateItemNote(c.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ ...S.section, background: 'var(--cafe-bg-elevated)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-lg)', padding: 16, margin: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--cafe-text-secondary)' }}>
          <span>Subtotal</span><span style={{ fontFamily: 'monospace' }}>{fmt(cartTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13, color: 'var(--cafe-text-secondary)' }}>
          <span>GST (18%)</span><span style={{ fontFamily: 'monospace' }}>{fmt(taxAmount)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, borderTop: '1px solid var(--cafe-border)', paddingTop: 10 }}>
          <span>Total</span><span style={{ color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>{fmt(grandTotal)}</span>
        </div>
      </div>

      <div style={{ ...S.section, marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 6 }}>Kitchen notes / special requests (optional)</div>
        <textarea style={S.input} rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g. No onion, extra spicy, allergy info…" />
      </div>

      <div style={{ height: 80 }} />
      <button className="qr-fab" style={S.fab} onClick={placeOrder}>
        🍳 Place Order · {fmt(grandTotal)}
      </button>
    </div>
  );

  // ── Menu screen (default) ─────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @keyframes qrCardPulse { 0% { transform: scale(1); } 45% { transform: scale(1.025); } 100% { transform: scale(1); } }
        .qr-pulse { animation: qrCardPulse 280ms ease; }
      `}</style>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>☕ CafeOS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {tableInfo && <span style={{ fontSize: 13, color: 'var(--cafe-text-secondary)' }}>Table {tableInfo.number}</span>}
          <span style={S.pill}>📱 QR Order</span>
          {assistBell}
        </div>
      </div>
      {assistPanel}
      {assistConfirm}

      {/* Welcome */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>What would you like? 👋</div>
        <div style={{ fontSize: 13, color: 'var(--cafe-text-tertiary)' }}>Tap items to add them to your order</div>
      </div>

      {/* Search */}
      <div style={{ padding: '14px 20px 0' }}>
        <input
          style={S.input}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search the menu…"
        />
      </div>

      {/* Category filter */}
      <div style={S.catRow}>
        {categories.map(cat => (
          <button key={cat} style={S.catBtn(catFilter === cat)} onClick={() => setCatFilter(cat)}>{cat}</button>
        ))}
      </div>

      {/* Menu items */}
      <div style={{ padding: '0 16px' }}>
        {visibleItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--cafe-text-tertiary)', fontSize: 14 }}>
            {search.trim() ? `No items match "${search.trim()}"` : 'No items available right now'}
          </div>
        )}
        {visibleItems.map(item => {
          const inCart = cart.find(c => c.id === item.id);
          const qty = inCart?.qty || 0;
          const atCap = qty >= MAX_QTY;
          return (
            <div
              key={item.id}
              className={`qr-card${pulseId === item.id ? ' qr-pulse' : ''}`}
              style={{ ...S.card, cursor: atCap ? 'default' : 'pointer' }}
              onClick={() => !atCap && addItem(item)}
            >
              <div style={{ fontSize: 36, flexShrink: 0 }}>{item.emoji || '🍽️'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.name}>{item.name}</div>
                <div style={S.cat}>{item.cat}</div>
                {item.desc && <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={S.price}>{fmt(item.price)}</div>
                {qty > 0 ? (
                  <div style={S.qtyRow} onClick={e => e.stopPropagation()}>
                    <button style={S.qtyBtn('danger')} onClick={() => removeItem(item.id)}>−</button>
                    <span style={S.qtyNum}>{qty}</span>
                    <button
                      disabled={atCap}
                      style={S.qtyBtn('success', atCap)}
                      onClick={() => addItem(item)}
                    >+</button>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>tap to add</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 90 }} />

      {/* Cart FAB */}
      {cartCount > 0 && (
        <button className="qr-fab" style={S.fab} onClick={() => setStep(STEP.CART)}>
          🛒 View Order ({cartCount} items) · {fmt(grandTotal)}
        </button>
      )}
    </div>
  );
}
