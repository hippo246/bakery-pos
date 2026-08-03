import React from 'react';
import { useState, useMemo, useEffect, useRef } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { getSeedQRCodes, QR_TYPE_CONFIG, SESSION_STATUS_CONFIG, WAITER_CALL_TYPE_CONFIG, WAITER_CALL_STATUS_CONFIG, generateGuestUrl, formatSessionDuration, formatWaiterCallWaitTime, isWaiterCallUrgent } from "../../data/qrConstants";
import { createQRCode, validateQRCode, normalizeQRCode, createGuestSession, normalizeGuestSession, isSessionExpired, updateSessionActivity, createWaiterCall, normalizeWaiterCall, acknowledgeWaiterCall, resolveWaiterCall, getSessionDuration, getWaiterCallWaitTime } from "../../domain/qrModel.js";
import DestructiveDialog from "../common/DestructiveDialog";

// QR image with offline fallback — shows a styled placeholder if the API is unreachable
const QR_SCANLINE_STYLE_ID = "qr-scanline-cray-styles";
const QR_SCANLINE_CSS = `
@keyframes qr-scan { 0% { top: 0%; opacity: 0.9; } 100% { top: 100%; opacity: 0; } }
`;

function QRImage({ url, size = 140, label: qrLabel }) {
  const [errored, setErrored] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById(QR_SCANLINE_STYLE_ID)) {
      const el = document.createElement("style");
      el.id = QR_SCANLINE_STYLE_ID;
      el.textContent = QR_SCANLINE_CSS;
      document.head.appendChild(el);
    }
  }, []);
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  if (errored) {
    return (
      <div style={{ width: size, height: size, background: C.bg3, border: `2px dashed ${C.border}`, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: 8 }}>
        <span style={{ fontSize: 28 }}>📱</span>
        <div style={{ fontSize: 9, color: C.text3, textAlign: "center", wordBreak: "break-all" }}>
          {qrLabel || "QR Code"}
        </div>
        <div style={{ fontSize: 8, color: C.text3, textAlign: "center" }}>
          Offline — scan URL manually
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: size, height: size, borderRadius: 8, overflow: "hidden" }}>
      <img
        src={apiUrl}
        alt={qrLabel || "QR Code"}
        width={size}
        height={size}
        style={{ borderRadius: 8, display: "block" }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
      {!loaded && !errored && (
        <div style={{ position: "absolute", left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #27ae60, transparent)", animation: "qr-scan 1.1s linear infinite" }} />
      )}
    </div>
  );
}

const SAFE_QR_TYPES = Object.keys(QR_TYPE_CONFIG);
const SAFE_INIT = getSeedQRCodes();

const genId = () => "QR-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
const safeArr = (v) => (Array.isArray(v) ? v : []);

const formatCurrency = (amount) => `₹${toNum(amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return null;
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
};

const SettingRow = ({ label: settingLabel, description, checked, onChange }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--cafe-border-light)" }}>
    <div style={{ flex: 1, paddingRight: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 2 }}>{settingLabel}</div>
      <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{description}</div>
    </div>
    <label className="qr-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} aria-label={settingLabel} />
      <span className="qr-toggle-slider" />
    </label>
  </div>
);

const normalizeQRRecord = (qr) => ({
  ...qr,
  id: safeStr(qr?.id) || genId(),
  code: safeStr(qr?.code) || `QR-${Date.now()}`,
  type: SAFE_QR_TYPES.includes(qr?.type) ? qr.type : 'TABLE',
  label: safeStr(qr?.label).trim() || 'Untitled QR',
  tableId: qr?.tableId || null,
  branchId: qr?.branchId || null,
  active: Boolean(qr?.active),
  guestUrl: qr?.guestUrl || null,
  scanCount: toNum(qr?.scanCount, 0),
  lastScannedAt: qr?.lastScannedAt ? new Date(qr.lastScannedAt).getTime() : null,
  createdAt: qr?.createdAt ? new Date(qr.createdAt).getTime() : Date.now(),
  updatedAt: qr?.updatedAt ? new Date(qr.updatedAt).getTime() : Date.now(),
  settings: {
    orderingEnabled: Boolean(qr?.settings?.orderingEnabled !== false),
    waiterCallEnabled: Boolean(qr?.settings?.waiterCallEnabled !== false),
    billRequestEnabled: Boolean(qr?.settings?.billRequestEnabled !== false),
    orderType: qr?.settings?.orderType || 'DINE_IN'
  }
});

export default function QROrdering({ qrCodes: externalQRCodes, setQRCodes: externalSetQRCodes, tables, orders, guestSessions: externalGuestSessions, setGuestSessions: externalSetGuestSessions, waiterCalls: externalWaiterCalls, setWaiterCalls: externalSetWaiterCalls }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [qrCodes, setQRCodes] = useState(() => safeArr(externalQRCodes).length ? safeArr(externalQRCodes) : SAFE_INIT);
  const [guestSessions, setGuestSessions] = useState(() => safeArr(externalGuestSessions));
  const [waiterCalls, setWaiterCalls] = useState(() => safeArr(externalWaiterCalls));
  const [viewMode, setViewMode] = useState("qrcodes");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [editQR, setEditQR] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [form, setForm] = useState({
    type: 'TABLE',
    label: '',
    tableId: '',
    branchId: '',
    orderingEnabled: true,
    waiterCallEnabled: true,
    billRequestEnabled: true,
    orderType: 'DINE_IN'
  });
  const [formError, setFormError] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({ open: false, label: null, sessionCount: 0, onConfirm: null });
  const [disableWarning, setDisableWarning] = useState({ open: false, qr: null, sessionCount: 0 });
  const [qrSearchQuery, setQrSearchQuery] = useState("");
  const [qrTypeFilter, setQrTypeFilter] = useState("All");
  const [qrStatusFilter, setQrStatusFilter] = useState("All");
  const [openQrMenuId, setOpenQrMenuId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try { return localStorage.getItem('brewcrm_qr_sound_enabled') !== '0'; } catch { return true; }
  });
  const toastIdRef = useRef(0);
  const qrRef = useRef(null);
  const [qrSettings, setQrSettings] = useState(() => {
    const defaults = {
      orderingEnabled: true,
      guestCheckout: true,
      approvalRequired: false,
      waiterCallEnabled: true,
      billRequestEnabled: true,
      requireGuestName: false,
      allowNotes: true,
      allowAllergyNotes: true
    };
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem('brewcrm_qr_settings') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge over defaults so a settings schema saved before a new toggle was
        // added doesn't leave that toggle as `undefined` (which reads as unchecked
        // in some browsers but not others, and breaks the "off"/"on" invariant).
        return { ...defaults, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
      }
    } catch {
      // Corrupt JSON or storage access blocked (private browsing, disabled storage) — use defaults
    }
    return defaults;
  });

  const handleSetQRCodes = externalSetQRCodes || setQRCodes;
  const handleSetGuestSessions = externalSetGuestSessions || setGuestSessions;
  const handleSetWaiterCalls = externalSetWaiterCalls || setWaiterCalls;

  // BUGFIX: local state was only ever seeded from these props at mount, so if the
  // parent updated qrCodes/guestSessions/waiterCalls later (e.g. after an async load,
  // or a change made elsewhere), this view would silently go stale. Re-sync whenever
  // the parent's data actually changes.
  useEffect(() => {
    if (safeArr(externalQRCodes).length) setQRCodes(safeArr(externalQRCodes));
  }, [externalQRCodes]);
  useEffect(() => {
    if (externalGuestSessions !== undefined) setGuestSessions(safeArr(externalGuestSessions));
  }, [externalGuestSessions]);
  useEffect(() => {
    if (externalWaiterCalls !== undefined) setWaiterCalls(safeArr(externalWaiterCalls));
  }, [externalWaiterCalls]);

  useEffect(() => {
    try {
      localStorage.setItem('brewcrm_qr_settings', JSON.stringify(qrSettings));
    } catch {
      // Ignore storage failures (private browsing, quota exceeded, storage disabled)
    }
  }, [qrSettings]);

  useEffect(() => {
    if (!openQrMenuId) return;
    const close = (e) => {
      if (e.type === 'keydown' && e.key !== 'Escape') return;
      setOpenQrMenuId(null);
    };
    document.addEventListener('click', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', close);
    };
  }, [openQrMenuId]);

  useEffect(() => {
    if (!showModal) return;
    const close = (e) => { if (e.key === 'Escape') setShowModal(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [showModal]);

  const toastTimersRef = useRef({});

  const dismissToast = (id) => {
    clearTimeout(toastTimersRef.current[id]);
    delete toastTimersRef.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const scheduleToastDismiss = (id, ms = 6000) => {
    clearTimeout(toastTimersRef.current[id]);
    toastTimersRef.current[id] = setTimeout(() => {
      delete toastTimersRef.current[id];
      setToasts(prev => prev.filter(t => t.id !== id));
    }, ms);
  };

  const addToast = (toast) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-3), { id, ...toast }]);
    scheduleToastDismiss(id);
  };

  // Clean up any pending toast timers on unmount so they don't fire against a
  // component that's no longer there.
  useEffect(() => () => {
    Object.values(toastTimersRef.current).forEach(clearTimeout);
  }, []);

  // BUGFIX: previously created (and never fully closed, since arrivals can fire
  // faster than the .onended callback) a brand new AudioContext per chime — bursts
  // of waiter calls/orders could exhaust the browser's context limit and silently
  // stop alerting. Reuse one context instead.
  const audioCtxRef = useRef(null);
  useEffect(() => {
    return () => {
      try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    };
  }, []);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      let ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioCtx();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Ignore audio failures (autoplay restrictions, unsupported browser, etc.)
    }
  };

  const toggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem('brewcrm_qr_sound_enabled', next ? '1' : '0'); } catch { /* ignore */ }
      return next;
    });
  };

  // Alert staff (sound + toast) the moment a new waiter call comes in — these are
  // time-sensitive, a guest is physically waiting for someone to notice.
  const knownCallIdsRef = useRef(new Set());
  const firstCallSyncRef = useRef(true);
  useEffect(() => {
    const pending = waiterCalls.filter(c => c.status === 'PENDING');
    const currentIds = new Set(pending.map(c => c.id));
    if (firstCallSyncRef.current) {
      knownCallIdsRef.current = currentIds;
      firstCallSyncRef.current = false;
      return;
    }
    const arrivals = pending.filter(c => !knownCallIdsRef.current.has(c.id));
    if (arrivals.length > 0) {
      if (soundEnabled) playChime();
      arrivals.forEach(c => {
        const typeConfig = WAITER_CALL_TYPE_CONFIG[c.type] || WAITER_CALL_TYPE_CONFIG.NEED_ASSISTANCE;
        addToast({ message: `🔔 ${typeConfig.label} — Table ${c.tableId || 'N/A'}` });
      });
    }
    knownCallIdsRef.current = currentIds;
  }, [waiterCalls, soundEnabled]);

  const openGuestOrders = useMemo(() =>
    orders.filter(o => o.source === 'QR_ORDERING' && (o.status === 'NEW' || o.status === 'CONFIRMED')),
    [orders]
  );

  // Alert staff when a new guest order lands via QR
  const knownOrderIdsRef = useRef(new Set());
  const firstOrderSyncRef = useRef(true);
  useEffect(() => {
    const currentIds = new Set(openGuestOrders.map(o => o.id));
    if (firstOrderSyncRef.current) {
      knownOrderIdsRef.current = currentIds;
      firstOrderSyncRef.current = false;
      return;
    }
    const arrivals = openGuestOrders.filter(o => !knownOrderIdsRef.current.has(o.id));
    if (arrivals.length > 0) {
      if (soundEnabled) playChime();
      arrivals.forEach(o => {
        addToast({ message: `📋 New guest order #${safeStr(o.id).slice(-6)} — ${formatCurrency(o.total)}` });
      });
    }
    knownOrderIdsRef.current = currentIds;
  }, [openGuestOrders, soundEnabled]);

  const summary = useMemo(() => {
    const activeQRs = qrCodes.filter(qr => qr.active);
    const activeTableQRs = activeQRs.filter(qr => qr.type === 'TABLE');
    const activeSessions = guestSessions.filter(s => !isSessionExpired(s) && s.status !== 'COMPLETED' && s.status !== 'EXPIRED');
    const pendingCalls = waiterCalls.filter(c => c.status === 'PENDING');
    const disabledCodes = qrCodes.filter(qr => !qr.active);
    const ordersToday = orders.filter(o => {
      if (!o.createdAt) return false;
      const today = new Date();
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === today.toDateString() && o.source === 'QR_ORDERING';
    });

    return {
      activeQRs: activeQRs.length,
      activeTableQRs: activeTableQRs.length,
      guestSessions: activeSessions.length,
      openGuestOrders: openGuestOrders.length,
      pendingCalls: pendingCalls.length,
      disabledCodes: disabledCodes.length,
      ordersToday: ordersToday.length
    };
  }, [qrCodes, guestSessions, waiterCalls, orders, openGuestOrders]);

  const qrTypeCounts = useMemo(() => {
    const counts = { All: qrCodes.length };
    for (const type of SAFE_QR_TYPES) counts[type] = 0;
    for (const qr of qrCodes) {
      if (counts[qr.type] !== undefined) counts[qr.type] += 1;
    }
    return counts;
  }, [qrCodes]);

  const filteredQRCodes = useMemo(() => {
    const q = qrSearchQuery.trim().toLowerCase();
    return qrCodes.filter(qr => {
      if (qrTypeFilter !== "All" && qr.type !== qrTypeFilter) return false;
      if (qrStatusFilter === "Active" && !qr.active) return false;
      if (qrStatusFilter === "Disabled" && qr.active) return false;
      if (!q) return true;
      return safeStr(qr.label).toLowerCase().includes(q) ||
        safeStr(qr.code).toLowerCase().includes(q) ||
        safeStr(qr.tableId).toLowerCase().includes(q);
    });
  }, [qrCodes, qrSearchQuery, qrTypeFilter, qrStatusFilter]);

  const filteredSessions = useMemo(() => {
    return guestSessions
      .filter(s => !isSessionExpired(s) || s.status === 'BLOCKED')
      // Longest-running session first — that's the table most likely to need attention.
      .sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
  }, [guestSessions]);

  const filteredCalls = useMemo(() => {
    return waiterCalls
      .filter(c => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED')
      // Pending calls before acknowledged ones, oldest first within each group,
      // so the call a guest has been waiting longest for surfaces at the top.
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'PENDING' ? -1 : 1;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
  }, [waiterCalls]);

  const handleAddQR = () => {
    setEditQR(null);
    setForm({
      type: 'TABLE',
      label: '',
      tableId: '',
      branchId: '',
      orderingEnabled: true,
      waiterCallEnabled: true,
      billRequestEnabled: true,
      orderType: 'DINE_IN'
    });
    setFormError("");
    setModalType('addqr');
    setShowModal(true);
  };

  const handleEditQR = (qr) => {
    setEditQR(qr);
    setForm({
      type: qr.type || 'TABLE',
      label: qr.label || '',
      tableId: qr.tableId || '',
      branchId: qr.branchId || '',
      orderingEnabled: qr.settings?.orderingEnabled !== false,
      waiterCallEnabled: qr.settings?.waiterCallEnabled !== false,
      billRequestEnabled: qr.settings?.billRequestEnabled !== false,
      orderType: qr.settings?.orderType || 'DINE_IN'
    });
    setFormError("");
    setModalType('addqr');
    setShowModal(true);
  };

  const handleSaveQR = () => {
    const trimmedLabel = safeStr(form.label).trim();
    const trimmedTableId = safeStr(form.tableId).trim();
    const trimmedBranchId = safeStr(form.branchId).trim();

    const qrData = {
      ...form,
      label: trimmedLabel,
      // A non-TABLE code (e.g. Counter/Takeaway) shouldn't carry over a stale
      // tableId left in the form from a previous edit — that field is hidden
      // for those types but its value was still being persisted.
      tableId: form.type === 'TABLE' ? trimmedTableId : '',
      branchId: trimmedBranchId,
      settings: {
        orderingEnabled: form.orderingEnabled,
        waiterCallEnabled: form.waiterCallEnabled,
        billRequestEnabled: form.billRequestEnabled,
        orderType: form.orderType
      }
    };

    const validation = validateQRCode(qrData);
    if (!validation.valid) {
      setFormError(validation.message);
      return;
    }

    // BUGFIX: nothing previously stopped two QR codes from sharing the same
    // label or, worse, the same table — which would make it impossible for
    // staff to tell them apart and could route guests to the wrong table.
    const duplicateLabel = qrCodes.some(q =>
      q.id !== editQR?.id && safeStr(q.label).trim().toLowerCase() === trimmedLabel.toLowerCase()
    );
    if (duplicateLabel) {
      setFormError(`A QR code named "${trimmedLabel}" already exists. Choose a different label.`);
      return;
    }
    if (qrData.type === 'TABLE' && trimmedTableId) {
      const duplicateTable = qrCodes.some(q =>
        q.id !== editQR?.id && q.type === 'TABLE' && safeStr(q.tableId).trim().toLowerCase() === trimmedTableId.toLowerCase()
      );
      if (duplicateTable) {
        setFormError(`Table "${trimmedTableId}" is already linked to another QR code.`);
        return;
      }
    }

    if (editQR) {
      const updated = qrCodes.map(qr => qr.id === editQR.id ? normalizeQRRecord({ ...qrData, id: editQR.id, code: editQR.code }) : qr);
      handleSetQRCodes(updated);
    } else {
      const newQR = normalizeQRRecord(qrData);
      handleSetQRCodes([newQR, ...qrCodes]);
    }

    setShowModal(false);
    setFormError("");
  };

  const handleDeleteQR = (qr) => {
    // BUGFIX: deleting a QR code used to silently orphan any in-progress guest
    // sessions tied to it (disable already warned about this, delete didn't).
    const activeSessionCount = guestSessions.filter(s =>
      s.qrCodeId === qr.id && !isSessionExpired(s) && s.status !== 'COMPLETED' && s.status !== 'EXPIRED'
    ).length;
    setDeleteDialog({
      open: true,
      label: qr.label,
      sessionCount: activeSessionCount,
      onConfirm: () => {
        handleSetQRCodes(qrCodes.filter(q => q.id !== qr.id));
        setDeleteDialog({ open: false, label: null, sessionCount: 0, onConfirm: null });
      }
    });
  };

  const handleRegenerateQR = (qr) => {
    setEditQR(qr);
    setModalType('regenerate');
    setShowModal(true);
  };

  const handleConfirmRegenerate = () => {
    if (!editQR) return;
    const newQR = normalizeQRRecord({
      ...editQR,
      code: `QR-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      updatedAt: Date.now()
    });
    const updated = qrCodes.map(qr => qr.id === editQR.id ? newQR : qr);
    handleSetQRCodes(updated);
    setShowModal(false);
    setEditQR(null);
  };

  const handlePreviewQR = (qr) => {
    setEditQR(qr);
    setModalType('preview');
    setShowModal(true);
  };

  const handleToggleActive = (qr) => {
    if (qr.active) {
      const activeSessionCount = guestSessions.filter(s =>
        s.qrCodeId === qr.id && !isSessionExpired(s) && s.status !== 'COMPLETED' && s.status !== 'EXPIRED'
      ).length;
      if (activeSessionCount > 0) {
        setDisableWarning({ open: true, qr, sessionCount: activeSessionCount });
        return;
      }
    }
    const updated = qrCodes.map(q => q.id === qr.id ? { ...q, active: !q.active, updatedAt: Date.now() } : q);
    handleSetQRCodes(updated);
  };

  const handleConfirmDisable = () => {
    const qr = disableWarning.qr;
    if (!qr) return;
    const updated = qrCodes.map(q => q.id === qr.id ? { ...q, active: false, updatedAt: Date.now() } : q);
    handleSetQRCodes(updated);
    setDisableWarning({ open: false, qr: null, sessionCount: 0 });
  };

  const handleDownloadQR = (qr) => {
    const url = generateGuestUrl(qr);
    const link = document.createElement('a');
    link.download = `qr-${safeStr(qr.label).replace(/\s+/g, '-').toLowerCase() || 'code'}.png`;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast({ message: `Downloading QR for "${qr.label}"` });
  };

  const handleCopyLink = (qr) => {
    const url = generateGuestUrl(qr);

    // Fallback for non-HTTPS origins / older browsers where navigator.clipboard
    // doesn't exist at all (calling .writeText on it would throw synchronously
    // rather than reject, skipping the .catch() below).
    const legacyCopy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        addToast({ message: ok ? "Guest link copied to clipboard" : "Couldn't copy link — copy it manually below" });
      } catch {
        addToast({ message: "Couldn't copy link — copy it manually below" });
      }
    };

    if (!navigator.clipboard) {
      legacyCopy();
      return;
    }
    navigator.clipboard.writeText(url)
      .then(() => addToast({ message: "Guest link copied to clipboard" }))
      .catch(legacyCopy);
  };

  const handlePrintQR = (qr) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      addToast({ message: "Popup blocked — allow popups for this site to print QR codes" });
      return;
    }
    const guestUrl = generateGuestUrl(qr);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${qr.label} - QR Code</title>
        <style>
          body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
          .qr-card { text-align: center; border: 2px solid #333; padding: 40px; border-radius: 8px; }
          .qr-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .qr-subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
          .qr-code { margin: 20px auto; }
          .qr-instructions { font-size: 12px; color: #888; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="qr-card">
          <div class="qr-title">${qr.label}</div>
          <div class="qr-subtitle">Scan to order from your table</div>
          <div class="qr-code">
            <QRImage url={guestUrl} size={200} label={qr.label} />
          </div>
          <div class="qr-instructions">No app required • Scan with camera</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleViewSession = (session) => {
    setSelectedSession(session);
    setModalType('sessiondetail');
    setShowModal(true);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setModalType('orderdetail');
    setShowModal(true);
  };

  const handleAcknowledgeCall = (call) => {
    const updated = waiterCalls.map(c => c.id === call.id ? acknowledgeWaiterCall(c, 'current-staff') : c);
    handleSetWaiterCalls(updated);
  };

  const handleResolveCall = (call) => {
    const updated = waiterCalls.map(c => c.id === call.id ? resolveWaiterCall(c, 'current-staff') : c);
    handleSetWaiterCalls(updated);
  };

  return (
    <>
    <style>{`
      @keyframes qrBadgePulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(231,76,60,0.5); }
        50% { box-shadow: 0 0 0 5px rgba(231,76,60,0); }
      }
      @keyframes qrToastIn {
        from { opacity: 0; transform: translateY(12px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes qrCardIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes qrModalIn {
        from { opacity: 0; transform: scale(0.96) translateY(8px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .qr-stat-card {
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        animation: qrCardIn 0.2s ease both;
      }
      .qr-stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.10);
      }
      .qr-tab-btn {
        position: relative;
        transition: color 0.15s, background 0.15s;
      }
      .qr-tab-btn::after {
        content: '';
        position: absolute;
        bottom: -13px;
        left: 0; right: 0;
        height: 2px;
        background: var(--cafe-accent);
        border-radius: 2px 2px 0 0;
        transform: scaleX(0);
        transition: transform 0.2s ease;
      }
      .qr-tab-btn.active::after { transform: scaleX(1); }
      .qr-toggle {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 24px;
        flex-shrink: 0;
      }
      .qr-toggle input { opacity: 0; width: 0; height: 0; }
      .qr-toggle-slider {
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: var(--cafe-border, #ddd);
        transition: background 0.2s;
        cursor: pointer;
      }
      .qr-toggle-slider::before {
        content: '';
        position: absolute;
        width: 18px; height: 18px;
        left: 3px; top: 3px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: transform 0.2s;
      }
      .qr-toggle input:checked + .qr-toggle-slider { background: var(--cafe-accent); }
      .qr-toggle input:checked + .qr-toggle-slider::before { transform: translateX(20px); }
      .qr-menu-item {
        display: flex; align-items: center; gap: 8px;
        width: 100%; text-align: left;
        padding: 10px 14px; font-size: 13px;
        background: transparent; border: none;
        cursor: pointer;
        transition: background 0.1s;
      }
      .qr-menu-item:hover { background: var(--cafe-bg-hover); }
      .qr-menu-item.danger { color: #e74c3c; }
      .qr-section-divider {
        border: none;
        border-top: 1px solid var(--cafe-border-light);
        margin: 4px 0;
      }
      .qr-close-btn {
        border-radius: 7px;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .qr-close-btn:hover {
        background: var(--cafe-bg-hover);
        color: var(--cafe-text-primary);
      }
      .qr-link-copy {
        transition: background 0.15s ease, box-shadow 0.15s ease;
      }
      .qr-link-copy:hover {
        background: var(--cafe-accent-dim, rgba(212,160,23,0.12));
        box-shadow: inset 0 0 0 1px var(--cafe-accent);
      }
      .qr-ghost-action {
        transition: background 0.15s ease, transform 0.1s ease, border-color 0.15s ease;
      }
      .qr-ghost-action:hover {
        background: var(--cafe-bg-hover);
        transform: translateY(-1px);
      }
      .qr-ghost-action:active {
        transform: translateY(0);
      }
      .qr-table-row {
        transition: background 0.12s ease;
      }
      .qr-table-row:hover {
        background: var(--cafe-bg-hover);
      }
      .qr-filter-chip {
        transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
      }
      .qr-filter-chip:hover {
        border-color: var(--cafe-accent);
        transform: translateY(-1px);
      }
      .qr-search-input:focus {
        outline: none;
        border-color: var(--cafe-accent) !important;
        box-shadow: 0 0 0 3px var(--cafe-accent-dim, rgba(212,160,23,0.15));
      }
      .qr-status-pill {
        text-transform: capitalize;
      }
      .qr-primary-btn-lg {
        transition: transform 0.12s ease, box-shadow 0.12s ease;
      }
      .qr-primary-btn-lg:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 14px rgba(0,0,0,0.12);
      }
      button:focus-visible,
      [role="menuitem"]:focus-visible,
      input:focus-visible,
      select:focus-visible {
        outline: 2px solid var(--cafe-accent);
        outline-offset: 2px;
      }
    `}</style>
    <div style={{ padding: isMobile ? 16 : 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 4, letterSpacing: "-0.5px" }}>
            QR Ordering
          </h1>
          <p style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", margin: 0 }}>
            Table codes · guest sessions · live orders · waiter calls
          </p>
        </div>
        <button
          onClick={toggleSound}
          title={soundEnabled ? "Mute alerts" : "Unmute alerts"}
          aria-label={soundEnabled ? "Mute alerts" : "Unmute alerts"}
          style={{
            ...btn("ghost"),
            padding: "7px 13px",
            fontSize: 12,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 8,
            opacity: soundEnabled ? 1 : 0.55,
          }}>
          <span style={{ fontSize: 15 }}>{soundEnabled ? "🔔" : "🔕"}</span>
          {soundEnabled ? "Alerts on" : "Muted"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(6,1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Active Tables", value: summary.activeTableQRs, color: "var(--cafe-accent)", icon: "📶" },
          { label: "Guest Sessions", value: summary.guestSessions, color: "#3498db", icon: "👥" },
          { label: "Open Orders", value: summary.openGuestOrders, color: "#27ae60", icon: "📋" },
          { label: "Waiter Calls", value: summary.pendingCalls, color: "#e74c3c", icon: "🔔" },
          { label: "Disabled Codes", value: summary.disabledCodes, color: "#95a5a6", icon: "⛔" },
          { label: "Orders Today", value: summary.ordersToday, color: "#9b59b6", icon: "📅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="qr-stat-card" style={{ ...card(), borderTop: `3px solid ${color}`, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
              <span style={{ fontSize: 14, opacity: 0.7 }}>{icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid var(--cafe-border-light)", flexWrap: "wrap" }}>
        {[
          ["qrcodes", "QR Codes", qrCodes.length, false, "📱"],
          ["sessions", "Sessions", summary.guestSessions, false, "👥"],
          ["orders", "Orders", summary.openGuestOrders, summary.openGuestOrders > 0, "📋"],
          ["calls", "Waiter Calls", summary.pendingCalls, summary.pendingCalls > 0, "🔔"],
          ["settings", "Settings", 0, false, "⚙️"],
        ].map(([key, lbl, count, urgent, icon]) => {
          const isActive = viewMode === key;
          return (
            <button
              key={key}
              className={`qr-tab-btn${isActive ? " active" : ""}`}
              style={{
                background: "transparent",
                border: "none",
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: -1,
                borderBottom: isActive ? "2px solid var(--cafe-accent)" : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
              }}
              onClick={() => setViewMode(key)}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {lbl}
              {count > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 99,
                  background: urgent ? "#e74c3c" : (isActive ? "var(--cafe-accent-dim, rgba(212,160,23,0.15))" : "var(--cafe-bg-hover)"),
                  color: urgent ? "#fff" : (isActive ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)"),
                  animation: urgent ? "qrBadgePulse 1.4s ease-in-out infinite" : "none",
                  minWidth: 18,
                  textAlign: "center",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {viewMode === "qrcodes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--cafe-text-primary)" }}>QR Codes</h2>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={qrSearchQuery}
                  onChange={(e) => setQrSearchQuery(e.target.value)}
                  placeholder="Search by label, code, or table…"
                  className="qr-search-input"
                  style={{ ...input, width: 240, padding: "8px 30px 8px 12px", fontSize: 13 }}
                />
                {qrSearchQuery && (
                  <button onClick={() => setQrSearchQuery("")} aria-label="Clear search" title="Clear search"
                    style={{ position: "absolute", right: 8, background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 13, padding: 4 }}>✕</button>
                )}
              </div>
              <button className="qr-primary-btn-lg" style={{ ...btn("primary") }} onClick={handleAddQR}>
                + Generate QR Code
              </button>
            </div>
          </div>

          {/* Filter chips: type + status */}
          <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>Type</span>
              {["All", ...SAFE_QR_TYPES].map(t => {
                const active = qrTypeFilter === t;
                const count = qrTypeCounts[t] || 0;
                return (
                  <button key={t} onClick={() => setQrTypeFilter(t)} className="qr-filter-chip"
                    style={{
                      padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${active ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                      background: active ? "var(--cafe-accent-dim, rgba(212,160,23,0.12))" : "transparent",
                      color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {t === "All" ? "All" : (QR_TYPE_CONFIG[t]?.label || t)}
                    <span style={{ fontSize: 10, fontFamily: "monospace", opacity: 0.75 }}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", marginRight: 2 }}>Status</span>
              {["All", "Active", "Disabled"].map(s => {
                const active = qrStatusFilter === s;
                return (
                  <button key={s} onClick={() => setQrStatusFilter(s)} className="qr-filter-chip"
                    style={{
                      padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${active ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                      background: active ? "var(--cafe-accent-dim, rgba(212,160,23,0.12))" : "transparent",
                      color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {qrCodes.length === 0 && (
            <div style={{ ...card(), textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No QR codes found</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>Generate your first QR code to enable self-service ordering</div>
              <button style={{ ...btn("primary") }} onClick={handleAddQR}>+ Generate QR Code</button>
            </div>
          )}

          {qrCodes.length > 0 && filteredQRCodes.length === 0 && (
            <div style={{ ...card(), textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>
                {qrSearchQuery.trim() ? `No QR codes match "${qrSearchQuery.trim()}"` : "No QR codes match these filters"}
              </div>
              <button style={{ ...btn("ghost"), marginTop: 8 }} onClick={() => { setQrSearchQuery(""); setQrTypeFilter("All"); setQrStatusFilter("All"); }}>Clear filters</button>
            </div>
          )}

          {filteredQRCodes.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filteredQRCodes.map(qr => {
                const config = QR_TYPE_CONFIG[qr.type] || QR_TYPE_CONFIG.TABLE;
                const guestUrl = generateGuestUrl(qr);
                const menuOpen = openQrMenuId === qr.id;
                const relScan = formatRelativeTime(qr.lastScannedAt);

                return (
                  <div
                    key={qr.id}
                    onClick={() => handlePreviewQR(qr)}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.10)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
                    style={{
                      ...card(),
                      borderLeft: `4px solid ${qr.active ? config.color : '#95a5a6'}`,
                      opacity: qr.active ? 1 : 0.7,
                      cursor: "pointer",
                      position: "relative",
                      transition: "box-shadow .15s, transform .15s",
                    }}
                  >
                    {/* Kebab menu trigger */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenQrMenuId(menuOpen ? null : qr.id); }}
                      aria-label="More actions" title="More actions"
                      aria-haspopup="menu" aria-expanded={menuOpen}
                      style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, borderRadius: 8, border: "1px solid transparent", background: menuOpen ? "var(--cafe-bg-hover)" : "transparent", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 18, fontWeight: 800, lineHeight: 1, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.12s, border-color 0.12s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--cafe-bg-hover)"; e.currentTarget.style.borderColor = "var(--cafe-border-light)"; }}
                      onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; } }}
                    >⋯</button>

                    {menuOpen && (
                      <div
                        role="menu"
                        aria-label={`Actions for ${qr.label}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "absolute", top: 44, right: 10, background: "var(--cafe-bg-elevated, #fff)", border: "1px solid var(--cafe-border, #e0e0e0)", borderRadius: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.15)", width: 180, zIndex: 3, overflow: "hidden", animation: "qrCardIn 0.15s ease" }}
                      >
                        <button role="menuitem" className="qr-menu-item" onClick={() => { setOpenQrMenuId(null); handleEditQR(qr); }}>✏️ Edit details</button>
                        <button role="menuitem" className="qr-menu-item" onClick={() => { setOpenQrMenuId(null); handleRegenerateQR(qr); }}>🔄 Regenerate code</button>
                        <button role="menuitem" className="qr-menu-item" onClick={() => { setOpenQrMenuId(null); handleToggleActive(qr); }}>{qr.active ? "⛔ Disable" : "✅ Enable"}</button>
                        <hr className="qr-section-divider" />
                        <button role="menuitem" className="qr-menu-item danger" onClick={() => { setOpenQrMenuId(null); handleDeleteQR(qr); }}>🗑 Delete</button>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      {/* Live thumbnail */}
                      <div style={{ width: 68, height: 68, borderRadius: 8, background: "#fff", border: "1px solid var(--cafe-border-light)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        <QRImage url={guestUrl} size={140} label={qr.label} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{config.icon}</span>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--cafe-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{qr.label}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{config.label}</span>
                          <span style={{ ...pill(qr.active ? "#d5f5e3" : "#eaeded", qr.active ? "#27ae60" : "#95a5a6"), fontSize: 10, padding: "2px 8px" }}>
                            {qr.active ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px", fontSize: 11, color: "var(--cafe-text-secondary)" }}>
                          {qr.tableId && <span>🪑 {qr.tableId}</span>}
                          <span>👁 {qr.scanCount} scan{qr.scanCount === 1 ? '' : 's'}</span>
                          {relScan && <span>🕓 {relScan}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Guest link with inline copy */}
                    <div
                      onClick={(e) => { e.stopPropagation(); handleCopyLink(qr); }}
                      title="Click to copy guest link"
                      className="qr-link-copy"
                      style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-hover)", borderRadius: 6, padding: "6px 10px", marginBottom: 12, cursor: "pointer" }}
                    >
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{guestUrl}</span>
                      <span style={{ flexShrink: 0, fontWeight: 700, color: "var(--cafe-text-secondary)" }}>Copy ⧉</span>
                    </div>

                    {/* Primary actions */}
                    <div style={{ display: "flex", gap: 6, borderTop: "1px solid var(--cafe-border-light)", paddingTop: 12, marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                      <button className="qr-ghost-action" style={{ ...btn("ghost"), flex: 1, fontSize: 11, padding: "7px 4px", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => handlePreviewQR(qr)}>👁 Preview</button>
                      <button className="qr-ghost-action" style={{ ...btn("ghost"), flex: 1, fontSize: 11, padding: "7px 4px", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => handleDownloadQR(qr)}>⬇ Download</button>
                      <button className="qr-ghost-action" style={{ ...btn("ghost"), flex: 1, fontSize: 11, padding: "7px 4px", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} onClick={() => handlePrintQR(qr)}>🖨 Print</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === "sessions" && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--cafe-text-primary)", margin: 0 }}>Guest Sessions</h2>
            {filteredSessions.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#e8f4fd", color: "#3498db" }}>
                {filteredSessions.length} active
              </span>
            )}
          </div>

          {filteredSessions.length === 0 ? (
            <div style={{ ...card(), textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No active guest sessions</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>Sessions will appear here when guests scan QR codes</div>
            </div>
          ) : (
            <div style={{ ...card(), padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-hover)" }}>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Table</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Status</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Duration</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Guests</th>
                    <th style={{ padding: 12, textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Cart Items</th>
                    <th style={{ padding: 12, textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map(session => {
                    const statusConfig = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.BROWSING;
                    const duration = getSessionDuration(session);

                    return (
                      <tr key={session.id} className="qr-table-row" style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                        <td style={{ padding: 12 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{session.tableId || 'N/A'}</div>
                          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatTime(session.startedAt)}</div>
                        </td>
                        <td style={{ padding: 12 }}>
                          <span style={{ 
                            ...pill(statusConfig.bgColor, statusConfig.color), 
                            fontSize: 10
                          }}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td style={{ padding: 12, fontSize: 12 }}>
                          {formatSessionDuration(duration)}
                        </td>
                        <td style={{ padding: 12, fontSize: 12 }}>
                          {session.guestCount || '-'}
                        </td>
                        <td style={{ padding: 12, fontSize: 12 }}>
                          {session.cart?.length || 0}
                        </td>
                        <td style={{ padding: 12, textAlign: "center" }}>
                          <button style={{ ...btn("primary"), fontSize: 11, padding: "4px 8px" }} onClick={() => handleViewSession(session)}>View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === "orders" && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--cafe-text-primary)", margin: 0 }}>Incoming Orders</h2>
            {summary.openGuestOrders > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#e9f7ef", color: "#27ae60" }}>
                {summary.openGuestOrders} open
              </span>
            )}
          </div>

          {summary.openGuestOrders === 0 ? (
            <div style={{ ...card(), textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No incoming orders</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>Guest orders will appear here when submitted</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {openGuestOrders.map(order => {
                const session = guestSessions.find(s => s.orderId === order.id);
                const qrCode = qrCodes.find(qr => qr.id === session?.qrCodeId);

                return (
                  <div key={order.id} className="qr-stat-card" style={{ ...card(), borderLeft: "4px solid var(--cafe-accent)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>Order #{safeStr(order.id).slice(-6)}</div>
                        <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{formatTime(order.createdAt)}</div>
                      </div>
                      <div className="qr-status-pill" style={{ ...pill(order.status === 'NEW' ? '#fef5e7' : '#d5f5e3', order.status === 'NEW' ? '#e67e22' : '#27ae60'), fontSize: 11 }}>
                        {order.status}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", marginBottom: 12 }}>
                      <div>Table: {qrCode?.label || session?.tableId || 'N/A'}</div>
                      <div>Items: {order.items?.length || 0}</div>
                      <div>Total: {formatCurrency(order.total)}</div>
                      {order.customer?.name && <div>Guest: {order.customer.name}</div>}
                    </div>

                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 12 }}>
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx}>{item.quantity}x {item.name}</div>
                      ))}
                      {order.items?.length > 3 && <div>+{order.items.length - 3} more items</div>}
                    </div>

                    <button style={{ ...btn("primary"), width: "100%", fontSize: 12, padding: "8px" }} onClick={() => handleViewOrder(order)}>
                      View Full Order
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === "calls" && (
        <div>
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--cafe-text-primary)", margin: 0 }}>Waiter Calls</h2>
            {filteredCalls.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: "#fdecea", color: "#e74c3c" }}>
                {filteredCalls.filter(c => c.status === 'PENDING').length} pending
              </span>
            )}
          </div>

          {filteredCalls.length === 0 ? (
            <div style={{ ...card(), textAlign: "center", padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
              <div style={{ fontSize: 16, color: "var(--cafe-text-secondary)", marginBottom: 8 }}>No pending waiter calls</div>
              <div style={{ fontSize: 14, color: "var(--cafe-text-tertiary)" }}>Calls will appear here when guests request assistance</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {filteredCalls.map(call => {
                const typeConfig = WAITER_CALL_TYPE_CONFIG[call.type] || WAITER_CALL_TYPE_CONFIG.NEED_ASSISTANCE;
                const statusConfig = WAITER_CALL_STATUS_CONFIG[call.status] || WAITER_CALL_STATUS_CONFIG.PENDING;
                const waitTime = getWaiterCallWaitTime(call);
                const isUrgent = isWaiterCallUrgent(call, waitTime);

                return (
                  <div key={call.id} className="qr-stat-card" style={{ ...card(), borderLeft: `4px solid ${isUrgent ? '#e74c3c' : typeConfig.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 24 }}>{typeConfig.icon}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{typeConfig.label}</div>
                          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Table {call.tableId || 'N/A'}</div>
                        </div>
                      </div>
                      <div style={{ 
                        ...pill(statusConfig.bgColor, statusConfig.color), 
                        fontSize: 11
                      }}>
                        {statusConfig.label}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      <div style={{ background: "var(--cafe-bg-hover)", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: "var(--cafe-text-secondary)" }}>
                        🕐 Called {formatTime(call.createdAt)}
                      </div>
                      <div style={{ background: isUrgent ? "#fdecea" : "var(--cafe-bg-hover)", borderRadius: 6, padding: "5px 10px", fontSize: 11, color: isUrgent ? "#e74c3c" : "var(--cafe-text-secondary)", fontWeight: isUrgent ? 700 : 400 }}>
                        ⏳ {formatWaiterCallWaitTime(waitTime)}
                      </div>
                    </div>
                    {call.note && (
                      <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", fontStyle: "italic", marginBottom: 12, padding: "6px 10px", background: "var(--cafe-bg-hover)", borderRadius: 6 }}>
                        "{call.note}"
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      {call.status === 'PENDING' && (
                        <button style={{ ...btn("primary"), flex: 1, fontSize: 12, padding: "8px 12px" }} onClick={() => handleAcknowledgeCall(call)}>✓ Acknowledge</button>
                      )}
                      {call.status === 'ACKNOWLEDGED' && (
                        <button style={{ ...btn("primary"), flex: 1, fontSize: 12, padding: "8px 12px" }} onClick={() => handleResolveCall(call)}>✓ Resolve</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === "settings" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 4 }}>QR Ordering Settings</h2>
            <p style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", margin: 0 }}>Changes save automatically.</p>
          </div>

          {(() => {
            return (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 900 }}>
                <div style={{ ...card() }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Ordering</div>
                  <SettingRow label="QR Ordering" description="Guests can place orders by scanning" checked={qrSettings.orderingEnabled} onChange={(e) => setQrSettings({ ...qrSettings, orderingEnabled: e.target.checked })} />
                  <SettingRow label="Guest Checkout" description="Guests can complete checkout themselves" checked={qrSettings.guestCheckout} onChange={(e) => setQrSettings({ ...qrSettings, guestCheckout: e.target.checked })} />
                  <SettingRow label="Staff Approval" description="Orders need staff sign-off before kitchen" checked={qrSettings.approvalRequired} onChange={(e) => setQrSettings({ ...qrSettings, approvalRequired: e.target.checked })} />
                </div>

                <div style={{ ...card() }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Guest features</div>
                  <SettingRow label="Waiter Call" description="Guests can summon a waiter from the table" checked={qrSettings.waiterCallEnabled} onChange={(e) => setQrSettings({ ...qrSettings, waiterCallEnabled: e.target.checked })} />
                  <SettingRow label="Bill Request" description="Guests can ask for the bill via QR" checked={qrSettings.billRequestEnabled} onChange={(e) => setQrSettings({ ...qrSettings, billRequestEnabled: e.target.checked })} />
                  <SettingRow label="Require Name" description="Guests must enter their name to order" checked={qrSettings.requireGuestName} onChange={(e) => setQrSettings({ ...qrSettings, requireGuestName: e.target.checked })} />
                  <SettingRow label="Order Notes" description="Guests can add notes to their order" checked={qrSettings.allowNotes} onChange={(e) => setQrSettings({ ...qrSettings, allowNotes: e.target.checked })} />
                  <SettingRow label="Allergy Notes" description="Guests can flag dietary restrictions" checked={qrSettings.allowAllergyNotes} onChange={(e) => setQrSettings({ ...qrSettings, allowAllergyNotes: e.target.checked })} />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {showModal && modalType === 'addqr' && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-addqr-title" style={{ ...card(), width: isMobile ? "100%" : 480, maxHeight: "90vh", overflowY: "auto", animation: "qrModalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 id="qr-addqr-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                {editQR ? "Edit QR Code" : "New QR Code"}
              </h2>
              <button onClick={() => setShowModal(false)} className="qr-close-btn" style={{ background: "transparent", border: "none", fontSize: 18, color: "var(--cafe-text-tertiary)", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            {formError && (
              <div style={{ backgroundColor: "#fef0ef", color: "#c0392b", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, borderLeft: "3px solid #e74c3c", display: "flex", alignItems: "center", gap: 8 }}>
                ⚠️ {formError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={label}>QR Type *</label>
                <select className="qr-search-input" style={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {SAFE_QR_TYPES.map(type => (
                    <option key={type} value={type}>{QR_TYPE_CONFIG[type].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={label}>Label *</label>
                <input
                  autoFocus
                  maxLength={60}
                  className="qr-search-input"
                  style={input}
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveQR(); }}
                  placeholder="e.g., Table 8"
                />
              </div>

              {form.type === 'TABLE' && (
                <div>
                  <label style={label}>Table ID</label>
                  <input className="qr-search-input" style={input} value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} placeholder="TABLE-008" />
                </div>
              )}

              <div>
                <label style={label}>Branch ID</label>
                <input className="qr-search-input" style={input} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} placeholder="Optional" />
              </div>

              <div>
                <label style={label}>Order Type</label>
                <select className="qr-search-input" style={input} value={form.orderType} onChange={(e) => setForm({ ...form, orderType: e.target.value })}>
                  <option value="DINE_IN">Dine In</option>
                  <option value="DIRECT">Counter</option>
                  <option value="DIRECT_TAKEAWAY">Takeaway</option>
                </select>
              </div>

              <div style={{ borderTop: "1px solid var(--cafe-border-light)", paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Features for this code</div>
                {[
                  ["orderingEnabled", "Guest Ordering", "Guests can browse the menu and place orders"],
                  ["waiterCallEnabled", "Waiter Call", "Guests can call a waiter from this table"],
                  ["billRequestEnabled", "Bill Request", "Guests can request the bill"],
                ].map(([key, lbl, desc]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, marginBottom: 10, borderBottom: "1px solid var(--cafe-border-light)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{lbl}</div>
                      <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{desc}</div>
                    </div>
                    <label className="qr-toggle">
                      <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                      <span className="qr-toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  disabled={!form.label.trim()}
                  style={{ ...btn("primary"), flex: 2, opacity: form.label.trim() ? 1 : 0.5, cursor: form.label.trim() ? "pointer" : "not-allowed" }}
                  onClick={handleSaveQR}
                >
                  {editQR ? "Save changes" : "Generate QR Code"}
                </button>
                <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && modalType === 'regenerate' && editQR && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-regen-title" style={{ ...card(), width: isMobile ? "100%" : 420, animation: "qrModalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 id="qr-regen-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Regenerate QR Code</h2>
              <button onClick={() => setShowModal(false)} className="qr-close-btn" style={{ background: "transparent", border: "none", fontSize: 18, color: "var(--cafe-text-tertiary)", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            <div style={{ background: "#fff8e1", border: "1px solid #f9ca24", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#856404", fontWeight: 600, marginBottom: 6 }}>⚠️ This will invalidate "{editQR.label}"</div>
              <ul style={{ fontSize: 12, color: "#856404", paddingLeft: 16, margin: 0, lineHeight: 1.7 }}>
                <li>The current QR code stops working immediately</li>
                <li>Active guest sessions on this code will end</li>
                <li>All printed materials will need to be reprinted</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...btn("primary"), flex: 2 }} onClick={handleConfirmRegenerate}>Regenerate</button>
              <button style={{ ...btn("ghost"), flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showModal && modalType === 'preview' && editQR && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-preview-title" style={{ ...card(), width: isMobile ? "100%" : 380, textAlign: "center", animation: "qrModalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <div id="qr-preview-title" style={{ fontSize: 16, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{editQR.label}</div>
                  <span style={{ ...pill(editQR.active ? "#d5f5e3" : "#eaeded", editQR.active ? "#27ae60" : "#95a5a6"), fontSize: 10, padding: "2px 8px" }}>
                    {editQR.active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{QR_TYPE_CONFIG[editQR.type]?.label || editQR.type}</div>
              </div>
              <button onClick={() => setShowModal(false)} className="qr-close-btn" style={{ background: "transparent", border: "none", fontSize: 18, color: "var(--cafe-text-tertiary)", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            <div ref={qrRef} style={{ backgroundColor: "white", padding: 20, borderRadius: 12, marginBottom: 14, display: "inline-block", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", border: "1px solid var(--cafe-border-light)" }}>
              <QRImage url={generateGuestUrl(editQR)} size={220} label={editQR?.label} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, background: "var(--cafe-bg-hover)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scans</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{toNum(editQR.scanCount, 0)}</div>
              </div>
              <div style={{ flex: 1, background: "var(--cafe-bg-hover)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Last Scanned</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{formatRelativeTime(editQR.lastScannedAt) || 'Never'}</div>
              </div>
            </div>

            <div
              onClick={() => handleCopyLink(editQR)}
              title="Click to copy"
              className="qr-link-copy"
              style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--cafe-text-tertiary)", background: "var(--cafe-bg-hover)", borderRadius: 8, padding: "7px 12px", marginBottom: 14, cursor: "pointer", textAlign: "left" }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{generateGuestUrl(editQR)}</span>
              <span style={{ flexShrink: 0, fontWeight: 700, color: "var(--cafe-accent)" }}>Copy ⧉</span>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button className="qr-primary-btn-lg" style={{ ...btn("primary"), flex: 2, fontSize: 13 }} onClick={() => handleDownloadQR(editQR)}>⬇ Download</button>
              <button style={{ ...btn("ghost"), flex: 1, fontSize: 13 }} onClick={() => handlePrintQR(editQR)}>🖨 Print</button>
            </div>
            <button style={{ ...btn("ghost"), width: "100%", marginTop: 8, fontSize: 13 }} onClick={() => { setModalType('addqr'); setForm({ type: editQR.type, label: editQR.label, tableId: editQR.tableId || '', branchId: editQR.branchId || '', orderingEnabled: editQR.settings?.orderingEnabled !== false, waiterCallEnabled: editQR.settings?.waiterCallEnabled !== false, billRequestEnabled: editQR.settings?.billRequestEnabled !== false, orderType: editQR.settings?.orderType || 'DINE_IN' }); setFormError(""); }}>✎ Edit Details</button>
          </div>
        </div>
      )}

      {showModal && modalType === 'sessiondetail' && selectedSession && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-session-title" style={{ ...card(), width: isMobile ? "100%" : 460, maxHeight: "90vh", overflowY: "auto", animation: "qrModalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 id="qr-session-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Session Details</h2>
              <button onClick={() => setShowModal(false)} className="qr-close-btn" style={{ background: "transparent", border: "none", fontSize: 18, color: "var(--cafe-text-tertiary)", cursor: "pointer", lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                ["Table", selectedSession.tableId || 'N/A'],
                ["Status", selectedSession.status],
                ["Started", formatTime(selectedSession.startedAt)],
                ["Duration", formatSessionDuration(getSessionDuration(selectedSession))],
                ["Cart Items", selectedSession.cart?.length || 0],
                ["Session ID", safeStr(selectedSession.id).slice(-8)],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "var(--cafe-bg-hover)", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{v}</div>
                </div>
              ))}
            </div>

            <button style={{ ...btn("ghost"), width: "100%" }} onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showModal && modalType === 'orderdetail' && selectedOrder && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div role="dialog" aria-modal="true" aria-labelledby="qr-order-title" style={{ ...card(), width: isMobile ? "100%" : 480, maxHeight: "90vh", overflowY: "auto", animation: "qrModalIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h2 id="qr-order-title" style={{ fontSize: 18, fontWeight: 700, margin: "0 0 2px" }}>Order #{safeStr(selectedOrder.id).slice(-6)}</h2>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{formatDate(selectedOrder.createdAt)} · {formatTime(selectedOrder.createdAt)}</div>
              </div>
              <button onClick={() => setShowModal(false)} className="qr-close-btn" style={{ background: "transparent", border: "none", fontSize: 18, color: "var(--cafe-text-tertiary)", cursor: "pointer", lineHeight: 1, padding: 4, marginTop: 2 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  ["Status", selectedOrder.status],
                  ["Total", formatCurrency(selectedOrder.total)],
                  ...(selectedOrder.customer?.name ? [["Guest", selectedOrder.customer.name]] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{ flex: 1, background: "var(--cafe-bg-hover)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginBottom: 8 }}>Items</div>
                <div style={{ border: "1px solid var(--cafe-border-light)", borderRadius: 8, overflow: "hidden" }}>
                  {safeArr(selectedOrder.items).length === 0 && (
                    <div style={{ padding: 12, fontSize: 13, color: "var(--cafe-text-tertiary)", textAlign: "center" }}>No items on this order</div>
                  )}
                  {safeArr(selectedOrder.items).map((item, idx, arr) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderBottom: idx < arr.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, color: "var(--cafe-text-primary)", fontWeight: 600 }}>{item.quantity}× {item.name}</div>
                        {item.notes && <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", fontStyle: "italic" }}>{item.notes}</div>}
                      </div>
                      {Number.isFinite(Number(item.price)) && (
                        <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)" }}>{formatCurrency(item.price * (item.quantity || 1))}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>Order Notes</div>
                  <div style={{ fontSize: 13, color: "var(--cafe-text-primary)" }}>{selectedOrder.notes}</div>
                </div>
              )}

              <button style={{ ...btn("ghost"), width: "100%" }} onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}


      <DestructiveDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, label: null, sessionCount: 0, onConfirm: null })}
        onConfirm={deleteDialog.onConfirm}
        title="Delete QR Code"
        description={`Are you sure you want to delete "${deleteDialog.label}"? This action cannot be undone.`}
        recordName="QR Code"
        consequence={
          deleteDialog.sessionCount > 0
            ? `This QR code will be permanently removed and will no longer work for guest ordering. It also has ${deleteDialog.sessionCount} active guest session${deleteDialog.sessionCount === 1 ? '' : 's'} right now, which will be cut off.`
            : "This QR code will be permanently removed and will no longer work for guest ordering."
        }
        confirmLabel="Delete"
      />

      <DestructiveDialog
        open={disableWarning.open}
        onClose={() => setDisableWarning({ open: false, qr: null, sessionCount: 0 })}
        onConfirm={handleConfirmDisable}
        title="Disable QR Code"
        description={`"${disableWarning.qr?.label || ''}" has ${disableWarning.sessionCount} active guest session${disableWarning.sessionCount === 1 ? '' : 's'} right now.`}
        recordName="QR Code"
        consequence="Guests already browsing can keep going, but no one will be able to scan this code again until it's re-enabled."
        confirmLabel="Disable Anyway"
      />

      {/* ── Toast stack: order/call alerts, copy/download confirmations ── */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 24, right: 20, display: "flex", flexDirection: "column", gap: 8, zIndex: 1100, maxWidth: 340 }}>
          {toasts.map(t => (
            <div
              key={t.id}
              onMouseEnter={() => clearTimeout(toastTimersRef.current[t.id])}
              onMouseLeave={() => scheduleToastDismiss(t.id)}
              style={{ background: "var(--cafe-bg-elevated, #fff)", border: "1px solid var(--cafe-border, #e0e0e0)", borderLeft: "4px solid #27ae60", borderRadius: 12, padding: "11px 14px", boxShadow: "0 8px 28px rgba(0,0,0,0.14)", display: "flex", alignItems: "center", gap: 10, animation: "qrToastIn .32s cubic-bezier(0.34,1.56,0.64,1)", backdropFilter: "blur(6px)" }}>
              <span style={{ fontSize: 15 }}>✨</span>
              <span style={{ fontSize: 13, color: "var(--cafe-text-primary)", flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" style={{ fontSize: 14, color: "var(--cafe-text-tertiary)", background: "transparent", border: "none", cursor: "pointer", flexShrink: 0, lineHeight: 1, opacity: 0.6 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
