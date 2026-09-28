import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ErrorBoundary from "../common/ErrorBoundary";

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

function elapsedColor(ms, settings) {
  const mins = ms / 60000;
  const warningThreshold = settings?.tables?.elapsedThresholdWarning || 30;
  const criticalThreshold = settings?.tables?.elapsedThresholdCritical || 60;
  if (mins < warningThreshold) return '#22c55e';
  if (mins < criticalThreshold) return '#f59e0b';
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

function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/* ─── component ─────────────────────────────────────────────────────── */
function Tables({
  onNavigate,
  orders = [],
  setOrders,
  tables: externalTables = [],
  setTables: setExternalTables,
  menuItems = [],
  settings = {},
  darkMode = true,
  staff = [],
}) {
  const colorBlindMode = settings.colorBlindMode !== false;
  /* ── screen size ─────────────────────────────────────────────────── */
  const [screenSize, setScreenSize] = useState('large');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  /* ── filters ─────────────────────────────────────────────────────── */
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'yesterday', 'week', 'month', 'custom'
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [modalDateFilter, setModalDateFilter] = useState('today'); // Separate filter for modal
  const [modalCustomDateRange, setModalCustomDateRange] = useState({ start: '', end: '' });
  useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      setScreenSize(w < 768 ? 'small' : w < 1200 ? 'medium' : 'large');
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Simulate initial loading state
  useEffect(() => {
    if (externalTables.length > 0) {
      const timer = setTimeout(() => setIsInitialLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [externalTables.length]);

  // Debounce order search query (200ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(orderSearchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [orderSearchQuery]);

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

  /* ── session tracking: { [sessionId]: { tableId, tableName, startTime, endTime, staff, orders, revenue } } ─────────────────── */
  const TABLE_SESSIONS_KEY = 'tables_sessions_history';
  
  const loadSessions = () => {
    try { return JSON.parse(localStorage.getItem(TABLE_SESSIONS_KEY) || '{}'); }
    catch { return {}; }
  };
  
  const saveSessions = (sessions) => {
    localStorage.setItem(TABLE_SESSIONS_KEY, JSON.stringify(sessions));
  };
  
  const [sessions, setSessions] = useState(loadSessions);

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
    const id = setInterval(load, 30000); // Increased from 3s to 30s to reduce CPU usage
    
    // Cross-tab sync via storage event
    const handleStorage = (e) => {
      if (e.key === 'qr_orders') load();
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  /* ── reservations (read from localStorage, same key Reservations.jsx uses) */
  const [reservations, setReservations] = useState([]);
  useEffect(() => {
    const load = () => {
      try { setReservations(JSON.parse(localStorage.getItem('bakerypos_reservations') || '[]')); }
      catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 30000); // Increased from 10s to 30s to reduce CPU usage
    
    // Cross-tab sync via storage event
    const handleStorage = (e) => {
      if (e.key === 'bakerypos_reservations') load();
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearInterval(id);
      window.removeEventListener('storage', handleStorage);
    };
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
    const id = setInterval(check, 30000); // Increased from 5s to 30s to reduce CPU usage
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
  const [showUnmergeAllConfirm, setShowUnmergeAllConfirm] = useState(false);
  const [selectedTable,       setSelectedTable]       = useState(null);
  const [formData,            setFormData]            = useState({ name: '', capacity: 4 });
  const [initialFormData,     setInitialFormData]     = useState({ name: '', capacity: 4 });
  const [formAlert,           setFormAlert]           = useState('');
  const [showUnsavedChangesConfirm, setShowUnsavedChangesConfirm] = useState(false);
  const [pendingModalClose,   setPendingModalClose]   = useState(null);
  const [deletedTable,       setDeletedTable]       = useState(null);
  const dropdownRef = useRef(null);

  /* ── QR modal ────────────────────────────────────────────────────── */
  const [showQRModal,      setShowQRModal]      = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(null);
  const [showQRPrintModal, setShowQRPrintModal] = useState(false);
  
  // QR Print Settings
  const defaultSettings = {
    restaurantName: '',
    restaurantLogo: null,
    ctaText: 'Scan to Order',
    showWifi: false,
    wifiSsid: '',
    wifiPassword: '',
    showCapacity: true,
    qrSize: 'large',
    cardsPerPage: 6,
    paperSize: 'a4',
    layoutType: 'flat',
    copiesPerTable: 1,
    selectedTables: [],
    accentColor: '#6366f1',
    orientation: 'portrait',
    margin: '10',
    borderStyle: 'solid',
    fontFamily: 'Inter',
    cardBackground: '#ffffff',
    cardBackgroundType: 'solid',
    gradientStart: '#ffffff',
    gradientEnd: '#f3f4f6',
    cardGap: 16,
    cardRadius: 12,
    previewZoom: 1,
    expandedSections: ['branding', 'content', 'layout', 'tables'],
    hideGuides: false,
  };

  const [qrPrintSettings, setQrPrintSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bakerypos_qr_print_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure all new properties exist
        return { ...defaultSettings, ...parsed };
      }
      return defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  // Persist QR print settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bakerypos_qr_print_settings', JSON.stringify(qrPrintSettings));
    } catch {
      // Ignore storage errors
    }
  }, [qrPrintSettings]);

  /* ── live-order detail modal (replaces old history modal) ─────────── */
  const [showLiveModal,    setShowLiveModal]    = useState(false);
  const [liveModalTable,   setLiveModalTable]   = useState(null);

  /* ── merge modal ─────────────────────────────────────────────────── */
  const [showMergeModal,   setShowMergeModal]   = useState(false);
  const [mergeSource,      setMergeSource]      = useState(null);
  const [mergeTarget,      setMergeTarget]      = useState(null);
  const [mergeConflictConfirm, setMergeConflictConfirm] = useState(false);
  const [qrLoadErrors, setQrLoadErrors] = useState({});
  const [selectedTables, setSelectedTables] = useState(new Set());
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [bulkPrintTables, setBulkPrintTables] = useState(null);
  const [bulkAssignTables, setBulkAssignTables] = useState(null);

  /* ── waitlist modal ─────────────────────────────────────────────────── */
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistForm, setWaitlistForm] = useState({ name: '', partySize: '', quotedWait: '' });

  /* ── order-level merge management ───────────────────────────────────── */
  const [showOrderMergeModal, setShowOrderMergeModal] = useState(false);
  const [orderMergeSource, setOrderMergeSource] = useState(null);
  const [orderMergeTarget, setOrderMergeTarget] = useState(null);

  /* ── alert settings ─────────────────────────────────────────────────── */
  const [alertSettings, setAlertSettings] = useState(() => {
    const saved = localStorage.getItem('bakerypos_alert_settings');
    return saved ? JSON.parse(saved) : {
      criticalThreshold: 45, // minutes
      soundEnabled: true,
      pushEnabled: false,
      noShowThreshold: 15 // minutes past reservation time to mark as no-show
    };
  });
  const [alertedTables, setAlertedTables] = useState(new Set());
  const [showAlertSettingsModal, setShowAlertSettingsModal] = useState(false);

  /* ── attention filter ─────────────────────────────────────────────────── */
  const [attentionFilter, setAttentionFilter] = useState(false);

  /* ── table grid filters ───────────────────────────────────────────────── */
  const [statusFilter, setStatusFilter] = useState('all'); // all, available, occupied, reserved, merged, cleaning
  const [staffFilter, setStaffFilter] = useState('all'); // all, or specific staff name

  /* ── audit trail ─────────────────────────────────────────────────────── */
  const [auditTrail, setAuditTrail] = useState(() => {
    const saved = localStorage.getItem('bakerypos_audit_trail');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAuditModal, setShowAuditModal] = useState(false);

  /* ── table notes ─────────────────────────────────────────────────────── */
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesTable, setNotesTable] = useState(null);
  const [tableNotes, setTableNotes] = useState('');

  const logAuditEvent = (action, details) => {
    const event = {
      id: generateUniqueId(),
      action,
      details,
      timestamp: new Date().toISOString(),
      actor: 'current_user' // This could be enhanced with actual user info
    };
    setAuditTrail(prev => {
      const newTrail = [event, ...prev].slice(0, 100); // Keep last 100 events
      localStorage.setItem('bakerypos_audit_trail', JSON.stringify(newTrail));
      return newTrail;
    });
  };

  /* ── no-show detection ─────────────────────────────────────────────────── */
  useEffect(() => {
    const checkNoShows = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const noShowThreshold = alertSettings.noShowThreshold || 15;

      reservations.forEach(r => {
        if (r.status === 'cancelled' || r.status === 'no_show') return;
        if (r.date !== todayStr) return;
        
        const [rh, rm] = (r.time || '00:00').split(':').map(Number);
        const rMins = rh * 60 + rm;
        const diffMins = nowMins - rMins;
        
        // Mark as no-show if past threshold and reservation time has passed
        if (diffMins >= noShowThreshold && diffMins > 0) {
          // This would need to integrate with the actual reservation system
          // For now, we'll just log it
          console.log(`Reservation ${r.id} for table ${r.tableId} is a no-show (${diffMins} minutes past time)`);
        }
      });
    };

    const interval = setInterval(checkNoShows, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [alertSettings.noShowThreshold, reservations]);

  /* ── staff assignment modal ─────────────────────────────────────────── */
  const [showStaffModal,   setShowStaffModal]   = useState(false);
  const [staffTable,       setStaffTable]       = useState(null);

  /* ── analytics modal ─────────────────────────────────────────────────── */
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  /* ── toast/snackbar system ─────────────────────────────────────────────── */
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    if (type !== 'undo') {
      setTimeout(() => setToast(null), 3000);
    }
  };

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
      
      // Check for unsaved changes in the table form modal
      if (showModal && (formData.name !== initialFormData.name || formData.capacity !== initialFormData.capacity)) {
        setPendingModalClose('showModal');
        setShowUnsavedChangesConfirm(true);
        return;
      }
      
      setShowDropdown(false); setShowModal(false); setShowManageModal(false);
      setShowDeleteAllConfirm(false); setShowQRModal(false); setShowLiveModal(false);
      setShowDeleteConfirm(false); setShowWaiterCalls(false); setShowMergeModal(false);
      setShowStaffModal(false); setShowAnalyticsModal(false); setShowUnmergeAllConfirm(false);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [showModal, formData, initialFormData]);

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

    // Build a map of which tables are merged with which (bidirectional)
    const mergeMap = {};
    (tables || []).forEach(t => {
      if (t.mergedWith && t.mergedWith.length > 0) {
        // This table is merged with others
        mergeMap[t.id] = t.mergedWith;
        // Also add reverse mapping for the other tables
        t.mergedWith.forEach(mergedId => {
          const mergedTable = tables.find(mt => mt.id === mergedId);
          if (mergedTable) {
            if (!mergeMap[mergedTable.id]) {
              mergeMap[mergedTable.id] = [];
            }
            if (!mergeMap[mergedTable.id].includes(t.id)) {
              mergeMap[mergedTable.id].push(t.id);
            }
          }
        });
      }
    });

    const result = (tables || []).map(t => {
      const activeOrders = tableOrders[t.id] || [];
      const isOccupied = activeOrders.some(
        o => o.status === 'IN_PROGRESS' || o.status === 'PENDING'
      );
      
      // Check if this table is part of any merge (either as source or target)
      const mergedWith = mergeMap[t.id] || [];
      const isMerged = mergedWith.length > 0;
      
      // For merged tables, combine orders from all merged tables
      let allActiveOrders = [...activeOrders];
      if (isMerged) {
        mergedWith.forEach(mergedId => {
          const mergedTable = tables.find(mt => mt.id === mergedId);
          if (mergedTable && mergedTable.id !== t.id) {
            const mergedOrders = tableOrders[mergedTable.id] || [];
            allActiveOrders = [...allActiveOrders, ...mergedOrders];
          }
        });
      }
      
      // Use combined orders for occupancy check
      const finalIsOccupied = allActiveOrders.some(
        o => o.status === 'IN_PROGRESS' || o.status === 'PENDING'
      );
      
      const sinceMs = finalIsOccupied && occupiedSince[t.id]
        ? now - new Date(occupiedSince[t.id]).getTime()
        : null;
      
      // Determine status: occupied -> cleaning (if has cleaning flag) -> available
      let status = 'available';
      if (finalIsOccupied) {
        status = 'occupied';
      } else if (t.needsCleaning) {
        status = 'cleaning';
      }
      
      return { 
        ...t, 
        status,
        activeOrders: allActiveOrders, 
        sinceMs,
        mergedWith: isMerged ? mergedWith : undefined,
        finalIsOccupied
      };
    });

    return result;
  }, [tables, tableOrders, tick, occupiedSince]);

  // Sync occupiedSince with localStorage based on table status changes
  useEffect(() => {
    const newOccupied = { ...occupiedSince };
    let changed = false;

    tablesWithStatus.forEach(table => {
      if (table.finalIsOccupied && !newOccupied[table.id]) {
        newOccupied[table.id] = new Date().toISOString();
        changed = true;
      }
      if (!table.finalIsOccupied && newOccupied[table.id]) {
        delete newOccupied[table.id];
        changed = true;
        // When table becomes unoccupied, mark it as needing cleaning
        setTables(prev => prev.map(t => 
          t.id === table.id ? { ...t, needsCleaning: true } : t
        ));
      }
    });

    if (changed) {
      saveOccupiedSince(newOccupied);
      setOccupiedSince(newOccupied);
    }
  }, [tablesWithStatus, saveOccupiedSince]);

  /* ── upcoming reservations per table (configurable window) ─────────── */
  const upcomingReservations = useMemo(() => {
    const map = {};
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const windowMinutes = settings?.tables?.upcomingReservationWindow || 120;
    const windowMs = windowMinutes * 60000;
    const nowMins  = now.getHours() * 60 + now.getMinutes();
    reservations.forEach(r => {
      if (r.status === 'cancelled') return;
      if (r.date !== todayStr) return;
      const [rh, rm] = (r.time || '00:00').split(':').map(Number);
      const rMins = rh * 60 + rm;
      const diffMins = rMins - nowMins;
      if (diffMins >= 0 && diffMins <= windowMinutes) {
        const tid = r.tableId;
        if (!map[tid] || diffMins < map[tid].diffMins)
          map[tid] = { ...r, diffMins };
      }
    });
    return map;
  }, [reservations, settings?.tables?.upcomingReservationWindow]);

  /* ── stats ───────────────────────────────────────────────────────── */
  const availableCount = tablesWithStatus.filter(t => t.status === 'available').length;
  const occupiedCount  = tablesWithStatus.filter(t => t.status === 'occupied').length;
  const totalTables    = tablesWithStatus.length;
  const totalSeats     = tablesWithStatus.reduce((s, t) => s + (t.capacity || 0), 0);
  const occupiedSeats  = tablesWithStatus
    .filter(t => t.status === 'occupied')
    .reduce((s, t) => s + (t.capacity || 0), 0);
  const occupancyPct = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  /* ── attention filter ─────────────────────────────────────────────────── */
  const needsAttention = useMemo(() => {
    const criticalThresholdMs = alertSettings.criticalThreshold * 60 * 1000;
    return tablesWithStatus.filter(table => {
      // Overdue tables
      if (table.status === 'occupied' && table.sinceMs >= criticalThresholdMs) return true;
      // Tables with waiter calls
      if (waiterCalls.some(call => call.tableId === table.id)) return true;
      // Tables without assigned staff
      if (table.status === 'occupied' && !table.assignedStaff) return true;
      return false;
    });
  }, [tablesWithStatus, alertSettings.criticalThreshold, waiterCalls]);

  /* ── alert checking ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!alertSettings.soundEnabled) return;

    const checkAlerts = () => {
      const criticalThresholdMs = alertSettings.criticalThreshold * 60 * 1000;
      tablesWithStatus.forEach(table => {
        if (table.status === 'occupied' && table.sinceMs >= criticalThresholdMs) {
          if (!alertedTables.has(table.id)) {
            // Play alert sound
            playAlertSound();
            setAlertedTables(prev => new Set([...prev, table.id]));
            showToast(`⚠️ ${table.name} has been occupied for ${alertSettings.criticalThreshold}+ minutes`);
          }
        } else if (table.status !== 'occupied') {
          // Reset alert when table becomes available
          setAlertedTables(prev => {
            const newSet = new Set(prev);
            newSet.delete(table.id);
            return newSet;
          });
        }
      });
    };

    const interval = setInterval(checkAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [alertSettings, alertedTables, tablesWithStatus]);

  const playAlertSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      console.error('Failed to play alert sound:', e);
    }
  };

  useEffect(() => {
    localStorage.setItem('bakerypos_alert_settings', JSON.stringify(alertSettings));
  }, [alertSettings]);

  /* ── CRUD handlers ───────────────────────────────────────────────── */
  const handleSaveTable = () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) { setFormAlert('Please enter a table name.'); return; }
    
    // Check for duplicate names (excluding current table when editing)
    const duplicateName = tables.find(t => 
      t.name === trimmedName && t.id !== selectedTable?.id
    );
    if (duplicateName) {
      setFormAlert('A table with this name already exists.');
      return;
    }
    
    const trimmedFormData = { ...formData, name: trimmedName };
    
    if (selectedTable) {
      setTables(p => p.map(t => t.id === selectedTable.id ? { ...t, ...trimmedFormData } : t));
      showToast('Table updated successfully');
    } else {
      setTables(p => [...(p || []), { id: generateUniqueId(), ...trimmedFormData, status: 'available' }]);
      showToast('Table added successfully');
    }
    setInitialFormData(trimmedFormData);
    setShowModal(false);
  };
  const confirmDeleteTable = () => {
    const table = tables.find(t => t.id === tableToDelete);
    setTables(p => p.filter(t => t.id !== tableToDelete));
    setDeletedTable(table);
    logAuditEvent('DELETE_TABLE', { tableName: table?.name, tableId: tableToDelete });
    setShowDeleteConfirm(false); setTableToDelete(null);
    showToast('Table deleted successfully', 'undo');
  };

  const undoDelete = () => {
    if (deletedTable) {
      setTables(p => [...p, deletedTable]);
      setDeletedTable(null);
      showToast('Table restored');
    }
  };

  const handleUnmergeAll = () => {
    setShowUnmergeAllConfirm(true);
  };

  const confirmUnmergeAll = () => {
    const mergedTables = tables.filter(t => t.mergedWith?.length > 0);
    setTables(p => p.map(t => ({
      ...t,
      mergedWith: undefined
    })));
    logAuditEvent('UNMERGE_ALL', { 
      tableIds: mergedTables.map(t => t.id),
      tableNames: mergedTables.map(t => t.name)
    });
    setShowUnmergeAllConfirm(false);
    showToast('All tables unmerged successfully');
  };

  const handleAssignStaff = (staffName) => {
    if (bulkAssignTables) {
      // Bulk assignment
      setTables(p => p.map(t => 
        bulkAssignTables.some(bt => bt.id === t.id)
          ? { ...t, assignedStaff: staffName }
          : t
      ));
      logAuditEvent('BULK_ASSIGN_STAFF', { 
        staffName, 
        tableIds: bulkAssignTables.map(t => t.id),
        tableNames: bulkAssignTables.map(t => t.name)
      });
      showToast(`Staff assigned to ${bulkAssignTables.length} table${bulkAssignTables.length > 1 ? 's' : ''}`);
      setBulkAssignTables(null);
      setShowStaffModal(false);
    } else if (staffTable) {
      // Single table assignment
      setTables(p => p.map(t => 
        t.id === staffTable.id 
          ? { ...t, assignedStaff: staffName }
          : t
      ));
      logAuditEvent('ASSIGN_STAFF', { 
        staffName, 
        tableId: staffTable.id,
        tableName: staffTable.name 
      });
      showToast('Staff assigned successfully');
      setShowStaffModal(false);
    }
  };

  /* ── waitlist handlers ─────────────────────────────────────────────────── */
  const addToWaitlist = () => {
    if (!waitlistForm.name.trim() || !waitlistForm.partySize) {
      showToast('Please fill in all fields');
      return;
    }
    const newParty = {
      id: generateUniqueId(),
      name: waitlistForm.name.trim(),
      partySize: parseInt(waitlistForm.partySize),
      quotedWait: waitlistForm.quotedWait ? parseInt(waitlistForm.quotedWait) : null,
      addedAt: new Date().toISOString(),
      seated: false
    };
    setWaitlist(prev => [...prev, newParty]);
    setWaitlistForm({ name: '', partySize: '', quotedWait: '' });
    showToast('Party added to waitlist');
  };

  const removeFromWaitlist = (id) => {
    setWaitlist(prev => prev.filter(p => p.id !== id));
    showToast('Party removed from waitlist');
  };

  const seatParty = (partyId, tableId) => {
    const party = waitlist.find(p => p.id === partyId);
    const table = tables.find(t => t.id === tableId);
    if (!party || !table) return;
    
    // Check for capacity mismatch
    if (party.partySize > table.capacity) {
      if (!confirm(`Warning: Party size (${party.partySize}) exceeds table capacity (${table.capacity}). Continue?`)) {
        return;
      }
    }
    
    setWaitlist(prev => prev.map(p => p.id === partyId ? { ...p, seated: true, seatedAt: new Date().toISOString(), seatedAtTable: tableId } : p));
    showToast(`${party.name} seated at table ${table.name}`);
    setShowWaitlistModal(false);
  };

  const getSuggestedTable = (partySize) => {
    // Find tables that will be available soon based on elapsed time
    const occupiedTables = tablesWithStatus.filter(t => t.status === 'occupied');
    const soonToBeAvailable = occupiedTables
      .filter(t => t.sinceMs && t.sinceMs > 30 * 60 * 1000) // Occupied for more than 30 minutes
      .sort((a, b) => b.sinceMs - a.sinceMs)
      .slice(0, 3);
    
    // Also check available tables that fit the party size
    const availableTables = tablesWithStatus.filter(t => t.status === 'available' && t.capacity >= partySize);
    
    return [...availableTables, ...soonToBeAvailable].slice(0, 5);
  };

  /* ── order-level merge handlers ─────────────────────────────────────── */
  const moveOrderToTable = (orderId, fromTableId, toTableId) => {
    // This would need to integrate with the actual order management system
    // For now, we'll update the table's activeOrders to reflect the move
    const fromTable = tables.find(t => t.id === fromTableId);
    const toTable = tables.find(t => t.id === toTableId);
    setTables(prev => prev.map(t => {
      if (t.id === fromTableId) {
        return {
          ...t,
          activeOrders: (t.activeOrders || []).filter(o => o.id !== orderId)
        };
      }
      if (t.id === toTableId) {
        const fromTable = prev.find(ft => ft.id === fromTableId);
        const orderToMove = fromTable?.activeOrders?.find(o => o.id === orderId);
        if (orderToMove) {
          return {
            ...t,
            activeOrders: [...(t.activeOrders || []), { ...orderToMove, tableId: toTableId }]
          };
        }
      }
      return t;
    }));
    logAuditEvent('MOVE_ORDER', { 
      orderId, 
      fromTableId, 
      toTableId,
      fromTableName: fromTable?.name,
      toTableName: toTable?.name
    });
    showToast('Order moved successfully');
  };

  const splitOrder = (orderId, fromTableId, toTableId, itemsToMove) => {
    // Split specific items from an order to another table
    setTables(prev => prev.map(t => {
      if (t.id === fromTableId) {
        const remainingItems = (t.activeOrders || []).find(o => o.id === orderId)?.items?.filter(item => !itemsToMove.includes(item.id)) || [];
        return {
          ...t,
          activeOrders: (t.activeOrders || []).map(o => 
            o.id === orderId 
              ? { ...o, items: remainingItems, total: remainingItems.reduce((sum, i) => sum + (i.price * i.quantity), 0) }
              : o
          )
        };
      }
      if (t.id === toTableId) {
        const fromTable = prev.find(ft => ft.id === fromTableId);
        const originalOrder = fromTable?.activeOrders?.find(o => o.id === orderId);
        const movedItems = originalOrder?.items?.filter(item => itemsToMove.includes(item.id)) || [];
        const newOrderId = generateUniqueId();
        return {
          ...t,
          activeOrders: [...(t.activeOrders || []), {
            id: newOrderId,
            tableId: toTableId,
            items: movedItems,
            total: movedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            status: 'ACTIVE',
            splitFrom: orderId
          }]
        };
      }
      return t;
    }));
    showToast('Order split successfully');
  };

  /* ── analytics calculations ─────────────────────────────────────────── */
  const analyticsData = useMemo(() => {
    const now = new Date();
    const occupiedTables = tablesWithStatus.filter(t => t.status === 'occupied');
    
    // Session-based analytics
    const sessionList = Object.values(sessions).filter(s => s.endTime);
    const activeSessions = Object.values(sessions).filter(s => !s.endTime);
    
    // Calculate session durations
    const sessionDurations = sessionList.map(s => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return end - start;
    });
    
    const avgSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
      : 0;
    
    // Revenue analytics
    const totalRevenue = sessionList.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const avgRevenuePerSession = sessionList.length > 0 ? totalRevenue / sessionList.length : 0;
    
    // Staff performance
    const staffStats = {};
    sessionList.forEach(s => {
      if (s.staff) {
        if (!staffStats[s.staff]) {
          staffStats[s.staff] = { sessions: 0, revenue: 0, duration: 0 };
        }
        staffStats[s.staff].sessions++;
        staffStats[s.staff].revenue += s.revenue || 0;
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        staffStats[s.staff].duration += (end - start);
      }
    });
    
    // Calculate average duration per staff member
    Object.keys(staffStats).forEach(staffName => {
      const staffSessions = sessionList.filter(s => s.staff === staffName);
      const durations = staffSessions.map(s => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        return end - start;
      });
      staffStats[staffName].avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;
    });
    
    // Table performance
    const tableStats = {};
    sessionList.forEach(s => {
      if (!tableStats[s.tableName]) {
        tableStats[s.tableName] = { sessions: 0, revenue: 0, avgDuration: 0 };
      }
      tableStats[s.tableName].sessions++;
      tableStats[s.tableName].revenue += s.revenue || 0;
    });
    
    // Calculate average duration per table
    Object.keys(tableStats).forEach(tableName => {
      const tableSessions = sessionList.filter(s => s.tableName === tableName);
      const durations = tableSessions.map(s => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        return end - start;
      });
      tableStats[tableName].avgDuration = durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0;
    });
    
    // Busiest hours (from session start times)
    const hourCounts = {};
    [...sessionList, ...activeSessions].forEach(s => {
      const hour = new Date(s.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const busiestHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => {
        const hourNum = parseInt(hour);
        return {
          hour: hourNum,
          count,
          label: `${hourNum}:00 - ${hourNum + 1}:00`
        };
      });
    
    // Today's sessions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todaySessions = sessionList.filter(s => new Date(s.startTime) >= todayStart);
    const todayRevenue = todaySessions.reduce((sum, s) => sum + (s.revenue || 0), 0);
    
    return {
      // Session metrics
      totalSessions: sessionList.length,
      activeSessionCount: activeSessions.length,
      avgSessionDuration,
      totalRevenue,
      avgRevenuePerSession,
      todaySessions: todaySessions.length,
      todayRevenue,
      
      // Performance metrics
      staffStats,
      tableStats,
      busiestHours,
      
      // Current state
      currentlyOccupied: occupiedTables.length,
      totalTables: tablesWithStatus.length,
      
      // Raw session data for detailed view
      sessionList: sessionList.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).slice(0, 50),
      activeSessions: activeSessions
    };
  }, [sessions, tablesWithStatus]);

  /* ── session tracking hooks ─────────────────────────────────────────── */
  const startSession = useCallback((table) => {
    const sessionId = `${table.id}_${Date.now()}`;
    const session = {
      id: sessionId,
      tableId: table.id,
      tableName: table.name,
      startTime: new Date().toISOString(),
      endTime: null,
      staff: table.assignedStaff || null,
      orders: [],
      revenue: 0
    };
    setSessions(prev => {
      const updated = { ...prev, [sessionId]: session };
      saveSessions(updated);
      return updated;
    });
  }, []);

  const endSession = useCallback((tableId) => {
    setSessions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(sessionId => {
        if (updated[sessionId].tableId === tableId && !updated[sessionId].endTime) {
          updated[sessionId].endTime = new Date().toISOString();
        }
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  const updateSessionRevenue = useCallback((tableId, revenue) => {
    setSessions(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(sessionId => {
        if (updated[sessionId].tableId === tableId && !updated[sessionId].endTime) {
          updated[sessionId].revenue = revenue;
        }
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  // Track session starts/ends based on table status changes
  useEffect(() => {
    tablesWithStatus.forEach(table => {
      const wasOccupied = Object.keys(occupiedSince).includes(String(table.id));
      const isOccupied = table.status === 'occupied';
      
      if (isOccupied && !wasOccupied) {
        startSession(table);
      } else if (!isOccupied && wasOccupied) {
        endSession(table.id);
      }
    });
  }, [tablesWithStatus, occupiedSince, startSession, endSession]);

  // Update session revenue from active orders
  useEffect(() => {
    tablesWithStatus.forEach(table => {
      if (table.status === 'occupied') {
        const liveOrders = table.activeOrders || [];
        const revenue = liveOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        updateSessionRevenue(table.id, revenue);
      }
    });
  }, [tablesWithStatus, updateSessionRevenue]);
  const generateQRCode = (table) => {
    const data = encodeURIComponent(JSON.stringify({ tableId: table.id, tableName: table.name }));
    const base = window.location.origin + window.location.pathname;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(base + '?table=' + data)}`;
  };

  const generateWifiQRCode = () => {
    if (!qrPrintSettings.wifiSsid) return null;
    const wifiString = `WIFI:S:${qrPrintSettings.wifiSsid};T:WPA;P:${qrPrintSettings.wifiPassword || ''};;`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(wifiString)}`;
  };

  /* ── filter helpers ─────────────────────────────────────────────────── */
  const getDateRange = (filter = dateFilter, custom = customDateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: monthStart, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'custom':
        return { 
          start: custom.start ? new Date(custom.start) : today,
          end: custom.end ? new Date(new Date(custom.end).getTime() + 24 * 60 * 60 * 1000) : new Date(today.getTime() + 24 * 60 * 60 * 1000)
        };
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
  };

  const filteredOrders = useMemo(() => {
    const { start, end } = getDateRange(dateFilter, customDateRange);
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const matchesDate = orderDate >= start && orderDate < end;
      const matchesSearch = debouncedSearchQuery === '' || 
        order.id?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        order.token?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [orders, dateFilter, customDateRange, debouncedSearchQuery]);

  const filteredTablesWithStatus = useMemo(() => {
    let tablesToFilter = tablesWithStatus.map(table => {
      const tableOrders = filteredOrders.filter(o => o.tableId === table.id);
      return {
        ...table,
        activeOrders: tableOrders,
        sinceMs: tableOrders.length > 0 ? table.sinceMs : null
      };
    });

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'merged') {
        tablesToFilter = tablesToFilter.filter(table => table.mergedWith?.length > 0);
      } else if (statusFilter === 'reserved') {
        tablesToFilter = tablesToFilter.filter(table => upcomingReservations[table.id]);
      } else {
        tablesToFilter = tablesToFilter.filter(table => table.status === statusFilter);
      }
    }

    // Apply staff filter
    if (staffFilter !== 'all') {
      tablesToFilter = tablesToFilter.filter(table => table.assignedStaff === staffFilter);
    }

    // Apply attention filter if active
    if (attentionFilter) {
      const criticalThresholdMs = alertSettings.criticalThreshold * 60 * 1000;
      tablesToFilter = tablesToFilter.filter(table => {
        // Overdue tables
        if (table.status === 'occupied' && table.sinceMs >= criticalThresholdMs) return true;
        // Tables with waiter calls
        if (waiterCalls.some(call => call.tableId === table.id)) return true;
        // Tables without assigned staff
        if (table.status === 'occupied' && !table.assignedStaff) return true;
        return false;
      });
    }

    return tablesToFilter;
  }, [tablesWithStatus, filteredOrders, statusFilter, staffFilter, attentionFilter, alertSettings.criticalThreshold, waiterCalls, upcomingReservations]);

  const getModalFilteredOrders = (tableId) => {
    const { start, end } = getDateRange(modalDateFilter, modalCustomDateRange);
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const matchesDate = orderDate >= start && orderDate < end;
      const matchesTable = order.tableId === tableId;
      return matchesDate && matchesTable;
    });
  };

  /* ── theme shortcuts ─────────────────────────────────────────────── */
  const bg      = dm ? '#000000' : '#f8fafc';
  const bgElev  = dm ? '#111111' : '#ffffff';
  const bgDeep  = dm ? '#000000' : '#f1f5f9';
  const border  = dm ? '#222222' : '#e5e7eb';
  const text    = dm ? '#ffffff' : '#0a0a0a';
  const muted   = dm ? '#888888' : '#222222'; // Darkened for WCAG AA compliance in light mode
  const accent  = '#6366f1';

  /* ── reusable sub-components ─────────────────────────────────────── */
  const getStatusColor = (merged, occupied, upcoming, elColor) => {
    if (merged) return { color: '#8b5cf6', label: 'MERGED GROUP' };
    if (occupied) return { color: elColor || '#f59e0b', label: 'OCCUPIED' };
    if (upcoming) return { color: '#8b5cf6', label: 'RESERVED' };
    return { color: '#22c55e', label: 'AVAILABLE' };
  };

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
    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />
      <div style={{
        width: '44px', height: '24px', borderRadius: '12px', flexShrink: 0,
        background: value ? accent : (dm ? '#111111' : '#d1d5db'),
        position: 'absolute', top: 0, left: 0, cursor: 'pointer', transition: 'background 0.2s',
      }}>
        <div style={{
          position: 'absolute', top: '2px',
          left: value ? '22px' : '2px',
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#fff', transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }} />
      </div>
    </label>
  );

  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: bg, fontFamily: 'Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', overflow: 'hidden' }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .table-card:hover { transform: translateY(-3px) !important; }
        .table-card { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
        
        @media (prefers-reduced-motion: reduce) {
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:1} }
          @keyframes fadeSlide { from{opacity:1;transform:translateY(0)} to{opacity:1;transform:translateY(0)} }
          .table-card:hover { transform: none !important; }
          .table-card { transition: none !important; }
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media print {
          body * {
            visibility: hidden;
          }
          #qr-print-preview, #qr-print-preview * {
            visibility: visible;
          }
          #qr-print-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: #fff !important;
          }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────────── */}
      <div style={{ padding: sm ? '12px 16px' : '16px 28px', borderBottom: `1px solid ${border}`, background: bgElev, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Back → Orders (not dashboard) */}
          <button
            onClick={() => onNavigate?.('orders')}
            style={{ padding: sm ? '7px 12px' : '8px 16px', background: dm ? '#111111' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '12px' : '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            ← Orders
          </button>
          <div style={{ fontSize: sm ? '16px' : '20px', fontWeight: '700', color: text }}>🪑 Tables</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Date filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: '8px 12px', background: dm ? '#111111' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Custom date inputs */}
          {dateFilter === 'custom' && (
            <>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                style={{ padding: '8px 12px', background: dm ? '#111111' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '11px' : '13px' }}
              />
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                style={{ padding: '8px 12px', background: dm ? '#111111' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '11px' : '13px' }}
              />
            </>
          )}

          {/* Order search */}
          <input
            type="text"
            placeholder="Search order #..."
            value={orderSearchQuery}
            onChange={(e) => setOrderSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', background: dm ? '#111111' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '11px' : '13px', width: sm ? '120px' : '150px' }}
          />

          {/* Waiter call bell */}
          {waiterCalls.length > 0 && (
            <button onClick={() => setShowWaiterCalls(true)} aria-label={`View ${waiterCalls.length} waiter calls`} style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', animation: 'pulse 2s infinite' }}>
              🔔 {waiterCalls.length}
            </button>
          )}

          {/* Merge tables */}
          <button
            onClick={() => { setMergeSource(null); setMergeTarget(null); setShowMergeModal(true); }}
            style={{ padding: '8px 14px', background: dm ? '#111111' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            ⇆ Merge
          </button>

          {/* Unmerge tables - only show if there are merged tables */}
          {tablesWithStatus.some(t => t.mergedWith?.length > 0) && (
            <button
              onClick={() => handleUnmergeAll()}
              style={{ padding: '8px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              🔗 Unmerge All
            </button>
          )}

          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ 
              padding: sm ? '8px 12px' : '8px 16px', 
              background: dm ? '#111111' : '#f3f4f6', 
              color: dm ? '#e0e0e0' : '#111111', 
              border: `1px solid ${border}`, 
              borderRadius: '8px', 
              fontSize: sm ? '11px' : '13px', 
              fontWeight: '600', 
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="cleaning">Needs Cleaning</option>
            <option value="reserved">Reserved</option>
            <option value="merged">Merged</option>
          </select>

          {/* Staff filter dropdown */}
          <select
            value={staffFilter}
            onChange={e => setStaffFilter(e.target.value)}
            style={{ 
              padding: sm ? '8px 12px' : '8px 16px', 
              background: dm ? '#111111' : '#f3f4f6', 
              color: dm ? '#e0e0e0' : '#111111', 
              border: `1px solid ${border}`, 
              borderRadius: '8px', 
              fontSize: sm ? '11px' : '13px', 
              fontWeight: '600', 
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            <option value="all">All Staff</option>
            {staff.map(s => (
              <option key={s.id || s.name} value={s.name}>{s.name}</option>
            ))}
          </select>

          {/* Bulk action toggle */}
          <button
            onClick={() => {
              setBulkActionMode(!bulkActionMode);
              setSelectedTables(new Set());
            }}
            style={{ 
              padding: sm ? '8px 12px' : '8px 16px', 
              background: bulkActionMode ? accent : '#0a0a0a', 
              color: '#fff', 
              border: 'none', 
              fontSize: sm ? '11px' : '13px', 
              fontWeight: '700', 
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            {bulkActionMode ? '✓ Done' : '☐ Bulk'}
          </button>

          {/* Bulk action buttons (shown when in bulk mode and tables selected) */}
          {bulkActionMode && selectedTables.size > 0 && (
            <div style={{ display: 'flex', gap: '8px', marginRight: '8px' }}>
              <button
                onClick={() => {
                  const selectedTableData = tables.filter(t => selectedTables.has(t.id));
                  if (selectedTableData.length > 0) {
                    setBulkAssignTables(selectedTableData);
                    setShowStaffModal(true);
                  }
                }}
                style={{ padding: '8px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                👤 Assign Staff
              </button>
              <button
                onClick={() => {
                  const selectedTableData = tables.filter(t => selectedTables.has(t.id));
                  if (selectedTableData.length > 0) {
                    setBulkPrintTables(selectedTableData);
                    setShowQRPrintModal(true);
                  }
                }}
                style={{ padding: '8px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                🖨️ Print QR
              </button>
              <button
                onClick={() => {
                  if (confirm(`Clear ${selectedTables.size} selected tables?`)) {
                    setTables(prev => prev.filter(t => !selectedTables.has(t.id)));
                    setSelectedTables(new Set());
                    setBulkActionMode(false);
                    showToast(`${selectedTables.size} tables cleared`);
                  }
                }}
                style={{ padding: '8px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontSize: sm ? '11px' : '13px', fontWeight: '600', cursor: 'pointer' }}
              >
                🗑️ Clear
              </button>
            </div>
          )}

          {/* Add table split-button */}
          <div style={{ position: 'relative', display: 'flex', borderRadius: '8px', overflow: 'visible', boxShadow: '0 2px 4px rgba(17,24,39,0.2)' }} ref={dropdownRef}>
            <button
              onClick={() => { setSelectedTable(null); setFormData({ name: '', capacity: 4 }); setInitialFormData({ name: '', capacity: 4 }); setFormAlert(''); setShowModal(true); }}
              style={{ padding: sm ? '8px 12px' : '8px 16px', background: '#0a0a0a', color: '#fff', border: 'none', fontSize: sm ? '11px' : '13px', fontWeight: '700', cursor: 'pointer' }}
            >
              ➕ Add
            </button>
            <button
              onClick={() => setShowDropdown(p => !p)}
              aria-label="Open menu"
              style={{ padding: '8px 8px', background: '#0a0a0a', color: '#fff', border: 'none', borderLeft: '1px solid #111111', cursor: 'pointer' }}
            >▾</button>
            {showDropdown && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: bgElev, border: `1px solid ${border}`, borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', zIndex: 200, minWidth: '180px', overflow: 'hidden' }}>
                {[
                  { label: '➕ Add New Table', action: () => { setSelectedTable(null); setFormData({ name: '', capacity: 4 }); setInitialFormData({ name: '', capacity: 4 }); setFormAlert(''); setShowModal(true); setShowDropdown(false); } },
                  { label: '⚙️ Manage Tables',  action: () => { setShowManageModal(true); setShowDropdown(false); } },
                  { label: '📊 Analytics',       action: () => { setShowAnalyticsModal(true); setShowDropdown(false); } },
                  { label: '🖨️ Print QR Codes', action: () => { setShowQRPrintModal(true); setShowDropdown(false); } },
                  { label: '⏱ Waitlist',       action: () => { setShowWaitlistModal(true); setShowDropdown(false); } },
                  { label: '🔔 Alerts',         action: () => { setShowAlertSettingsModal(true); setShowDropdown(false); } },
                  { label: '📋 Audit Trail',    action: () => { setShowAuditModal(true); setShowDropdown(false); } },
                  { label: `⚠️ Attention (${needsAttention.length})`, action: () => { setAttentionFilter(!attentionFilter); setShowDropdown(false); } },
                  { label: '🗑️ Delete All',      action: () => { setDeleteAllInput(''); setShowDeleteAllConfirm(true); setShowDropdown(false); }, danger: true },
                ].map(item => (
                  <div key={item.label} onClick={item.action} style={{ padding: '10px 14px', fontSize: '13px', color: item.danger ? '#ef4444' : text, cursor: 'pointer', borderTop: item.danger ? `1px solid ${border}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = item.danger ? (dm ? '#3a1a1a' : '#fee2e2') : (dm ? '#000000' : '#f3f4f6')}
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
        {isInitialLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${sm ? '140px' : '180px'}, 1fr))`, gap: sm ? '12px' : '18px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                background: bgElev,
                borderRadius: '14px',
                padding: sm ? '14px' : '18px',
                border: `1px solid ${border}`,
                minHeight: sm ? '120px' : '140px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: dm ? '#222222' : '#e5e7eb', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ width: '60%', height: '12px', borderRadius: '6px', background: dm ? '#222222' : '#e5e7eb' }} />
                <div style={{ width: '40%', height: '10px', borderRadius: '5px', background: dm ? '#222222' : '#e5e7eb' }} />
              </div>
            ))}
          </div>
        ) : tablesWithStatus.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            background: bgElev,
            borderRadius: '16px',
            border: `1px solid ${border}`,
            minHeight: '300px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🪑</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: text, marginBottom: '8px' }}>
              No Tables Yet
            </div>
            <div style={{ fontSize: '14px', color: muted, marginBottom: '24px', textAlign: 'center', maxWidth: '300px' }}>
              Get started by adding your first table. You can manage seating capacity and track table status.
            </div>
            <button
              onClick={() => { setSelectedTable(null); setFormData({ name: '', capacity: 4 }); setInitialFormData({ name: '', capacity: 4 }); setFormAlert(''); setShowModal(true); }}
              style={{
                padding: '12px 24px',
                background: accent,
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              ➕ Add Your First Table
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: sm
              ? 'repeat(2, 1fr)'
              : screenSize === 'medium'
                ? 'repeat(3, 1fr)'
                : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: sm ? '10px' : '16px',
          }}>
          {filteredTablesWithStatus.map(table => {
            const occupied  = table.status === 'occupied';
            const elapsed   = formatElapsed(table.sinceMs);
            const elColor   = table.sinceMs ? elapsedColor(table.sinceMs, settings) : null;
            const upcoming  = upcomingReservations[table.id];
            const merged    = table.mergedWith?.length > 0;
            const liveOrders = table.activeOrders || [];
            const liveTotal  = liveOrders.reduce((s, o) => s + (o.total || 0), 0);
            const hasQROrders = liveOrders.some(o => o.source === 'qr');

            return (
              <div
                key={table.id}
                className="table-card"
                onClick={(e) => {
                  if (bulkActionMode) {
                    e.stopPropagation();
                    setSelectedTables(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(table.id)) {
                        newSet.delete(table.id);
                      } else {
                        newSet.add(table.id);
                      }
                      return newSet;
                    });
                  } else {
                    setLiveModalTable(table);
                    setShowLiveModal(true);
                  }
                }}
                style={{
                  background: bgElev,
                  borderRadius: '14px',
                  padding: sm ? '14px' : '18px',
                  border: merged
                    ? `3px solid #8b5cf6`
                    : occupied
                      ? `2px solid ${elColor || '#f59e0b'}`
                      : upcoming
                        ? `2px solid #8b5cf6`
                        : `1px solid ${border}`,
                  cursor: bulkActionMode ? 'pointer' : 'default',
                  position: 'relative',
                  boxShadow: merged
                    ? '0 4px 12px rgba(139, 92, 246, 0.3)'
                    : dm ? '0 4px 6px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.07)',
                  animation: 'fadeSlide 0.25s ease',
                }}
              >
                {/* Bulk selection checkbox */}
                {bulkActionMode && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: `2px solid ${selectedTables.has(table.id) ? accent : border}`,
                    background: selectedTables.has(table.id) ? accent : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}>
                    {selectedTables.has(table.id) && <span style={{ color: '#fff', fontSize: '14px', fontWeight: '700' }}>✓</span>}
                  </div>
                )}

                {/* Merged indicator badge */}
                {merged && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#8b5cf6',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.4)',
                    zIndex: 10
                  }}>
                    🔗 Merged
                  </div>
                )}

                {/* Status indicator with shape/icon for color-blind mode */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {colorBlindMode ? (
                    // Shape-based indicators for color-blind mode
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: getStatusColor(merged, occupied, upcoming, elColor).color,
                      borderRadius: merged ? '50%' : occupied ? '0' : upcoming ? '3px' : '50%',
                      transform: occupied ? 'rotate(45deg)' : 'none',
                      boxShadow: `0 0 0 3px ${getStatusColor(merged, occupied, upcoming, elColor).color}22`
                    }} />
                  ) : (
                    // Color-only mode
                    <div style={{
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: getStatusColor(merged, occupied, upcoming, elColor).color, 
                      boxShadow: `0 0 0 3px ${getStatusColor(merged, occupied, upcoming, elColor).color}22` 
                    }} />
                  )}
                </div>

                {/* QR order indicator */}
                {hasQROrders && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    left: '10px', 
                    background: '#10b981', 
                    color: '#fff', 
                    padding: '2px 6px', 
                    borderRadius: '6px', 
                    fontSize: '10px', 
                    fontWeight: '700',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}>
                    📱
                  </div>
                )}

                {/* QR button — top-left */}
                <button
                  onClick={e => { 
                    e.stopPropagation(); 
                    const data = encodeURIComponent(JSON.stringify({ tableId: table.id, tableName: table.name }));
                    const qrUrl = settings?.qrOrderingUrl || (typeof window !== 'undefined' ? window.location.origin + '/qr-ordering.html' : '/qr-ordering.html');
                    window.open(qrUrl + '?table=' + data, '_blank');
                  }}
                  aria-label={`Open QR ordering for table ${table.name}`}
                  style={{ position: 'absolute', top: hasQROrders ? '32px' : '10px', left: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.45, padding: '2px' }}
                  title="Open QR Ordering"
                >📱</button>

                {/* Assign staff button — top-right next to status dot */}
                <button
                  onClick={e => { e.stopPropagation(); setStaffTable(table); setShowStaffModal(true); }}
                  aria-label={`Assign staff to table ${table.name}`}
                  style={{ position: 'absolute', top: '10px', right: '30px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: table.assignedStaff ? 1 : 0.45, padding: '2px' }}
                  title="Assign Staff"
                >👤</button>

                {/* Move order button — shown when table has orders */}
                {occupied && liveOrders.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setOrderMergeSource(table); setShowOrderMergeModal(true); }}
                    aria-label={`Move order from table ${table.name}`}
                    style={{ position: 'absolute', top: '10px', right: '55px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.45, padding: '2px' }}
                    title="Move Order"
                  >📦</button>
                )}

                {/* Mark as cleaned button — shown when table needs cleaning */}
                {table.status === 'cleaning' && (
                  <button
                    onClick={e => { 
                      e.stopPropagation(); 
                      setTables(prev => prev.map(t => 
                        t.id === table.id ? { ...t, needsCleaning: false } : t
                      ));
                      showToast(`${table.name} marked as cleaned`);
                    }}
                    aria-label={`Mark table ${table.name} as cleaned`}
                    style={{ position: 'absolute', top: '10px', right: '55px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.45, padding: '2px' }}
                    title="Mark as Cleaned"
                  >✨</button>
                )}

                {/* Notes button */}
                <button
                  onClick={e => { 
                    e.stopPropagation(); 
                    setNotesTable(table);
                    setTableNotes(table.notes || '');
                    setShowNotesModal(true);
                  }}
                  aria-label={`Add notes for table ${table.name}`}
                  style={{ position: 'absolute', top: '10px', right: '80px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: table.notes ? 1 : 0.45, padding: '2px', color: table.notes ? '#8b5cf6' : 'inherit' }}
                  title="Table Notes"
                >📝</button>

                {/* Table name */}
                <div style={{ fontSize: sm ? '24px' : '28px', fontWeight: '800', color: text, marginTop: '14px', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                  {table.name}
                </div>

                {/* Capacity with icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: muted, marginBottom: '8px', fontWeight: '500' }}>
                  <span>👥</span>
                  <span>{table.capacity} seats</span>
                  {merged && (
                    <span style={{ color: '#8b5cf6', fontWeight: '600' }}>· {table.capacity + (table.mergedWith?.length || 0) * 4} total</span>
                  )}
                </div>

                {/* Merged group indicator - shows full merge relationship */}
                {merged && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#8b5cf6', 
                    fontWeight: '700',
                    background: 'rgba(139, 92, 246, 0.12)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}>
                    <span>🔗</span>
                    <span><strong>{table.name}</strong> + {table.mergedWith?.join(', ')}</span>
                  </div>
                )}

                {/* Assignment info - for both merged and regular tables */}
                {(merged || table.currentToken || liveOrders.length > 0 || table.assignedStaff) && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#6b7280', 
                    fontWeight: '600',
                    background: 'rgba(107, 114, 128, 0.08)',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    border: '1px solid rgba(107, 114, 128, 0.2)'
                  }}>
                    {table.assignedStaff && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👤</span>
                        <span>Staff: <strong>{table.assignedStaff}</strong></span>
                      </div>
                    )}
                    {table.currentToken && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🎫</span>
                        <span>Token: <strong>{table.currentToken}</strong></span>
                      </div>
                    )}
                    {liveOrders.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>📋</span>
                        <span>{liveOrders.length} order{liveOrders.length > 1 ? 's' : ''} active</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status pill - larger and clearer */}
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  background: merged 
                    ? 'rgba(139, 92, 246, 0.15)' 
                    : occupied 
                      ? (elColor ? `${elColor}20` : 'rgba(245,158,11,0.15)') 
                      : upcoming 
                        ? 'rgba(139,92,246,0.15)' 
                        : 'rgba(34,197,94,0.15)', 
                  marginBottom: '12px',
                  border: merged 
                    ? '1px solid rgba(139, 92, 246, 0.4)' 
                    : occupied 
                      ? `1px solid ${elColor || '#f59e0b'}40` 
                      : upcoming 
                        ? '1px solid rgba(139,92,246,0.4)' 
                        : '1px solid rgba(34,197,94,0.4)'
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(merged, occupied, upcoming, elColor).color, animation: occupied ? 'pulse 2s infinite' : 'none' }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: getStatusColor(merged, occupied, upcoming, elColor).color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {getStatusColor(merged, occupied, upcoming, elColor).label}
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
                    {/* Show items from all orders as a compact list */}
                    {liveOrders.flatMap(order => order.items || []).slice(0, 3).map((item, i) => (
                      <div key={`${item.name}-${i}`} style={{ fontSize: '11px', color: muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.quantity}× {item.name}
                      </div>
                    ))}
                    {liveOrders.flatMap(order => order.items || []).length > 3 && (
                      <div style={{ fontSize: '10px', color: muted }}>+{liveOrders.flatMap(order => order.items || []).length - 3} more items</div>
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
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          LIVE ORDER DETAIL MODAL
          ══════════════════════════════════════════════════════════ */}
      {showLiveModal && liveModalTable && (() => {
        const t = liveModalTable;
        const modalFilteredOrders = getModalFilteredOrders(t.id);
        const liveOrds = modalFilteredOrders || [];
        const occupied = t.status === 'occupied';
        const elapsed  = formatElapsed(t.sinceMs);
        const elColor  = t.sinceMs ? elapsedColor(t.sinceMs, settings) : null;
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
              <div style={{ padding: '18px 20px', borderBottom: `1px solid ${border}`, background: dm ? '#111111' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  <button onClick={() => setShowLiveModal(false)} style={{ width: '34px', height: '34px', background: dm ? '#000000' : '#e5e7eb', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', color: text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>

                {/* Modal date filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    value={modalDateFilter}
                    onChange={(e) => setModalDateFilter(e.target.value)}
                    style={{ padding: '6px 10px', background: dm ? '#000000' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="custom">Custom Range</option>
                  </select>

                  {modalDateFilter === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={modalCustomDateRange.start}
                        onChange={(e) => setModalCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                        style={{ padding: '6px 10px', background: dm ? '#000000' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '6px', fontSize: '12px' }}
                      />
                      <input
                        type="date"
                        value={modalCustomDateRange.end}
                        onChange={(e) => setModalCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                        style={{ padding: '6px 10px', background: dm ? '#000000' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '6px', fontSize: '12px' }}
                      />
                    </>
                  )}
                </div>
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
                  <div key={order.id || oi} style={{ marginBottom: '14px', background: dm ? '#111111' : '#f8fafc', borderRadius: '12px', border: `1px solid ${border}`, overflow: 'hidden' }}>
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
                            <span style={{ color: dm ? '#d0d0e0' : '#111111' }}>{item.quantity || 1}× {item.name}</span>
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
                        }} style={{ padding: '5px 10px', background: order.status === st ? (statusColor[st] || '#6b7280') : (dm ? '#000000' : '#f3f4f6'), color: order.status === st ? '#fff' : (dm ? '#c0c0d0' : '#111111'), border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          {st === 'IN_PROGRESS' ? 'Cooking' : st === 'READY' ? 'Ready' : 'Done ✓'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

              </div>

              {/* Footer quick actions */}
              <div style={{ padding: '14px 20px', borderTop: `1px solid ${border}`, background: dm ? '#111111' : '#f8fafc', display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => {
                    // Create new order for this table
                    const newOrder = {
                      id: `ORD-${Date.now().toString().slice(-6)}`,
                      tableId: t.id,
                      tableName: t.name,
                      items: [],
                      total: 0,
                      status: 'PENDING',
                      createdAt: new Date().toISOString(),
                      paymentStatus: 'unpaid',
                      source: 'staff' // Mark as staff-entered order
                    };
                    setOrders(prev => [newOrder, ...prev]);
                    setShowLiveModal(false);
                    onNavigate?.('orders');
                  }}
                  style={{ flex: 1, padding: '11px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  + New Order
                </button>
                <button
                  onClick={() => { setSelectedTableForQR(t); setShowQRModal(true); setShowLiveModal(false); }}
                  style={{ padding: '11px 16px', background: dm ? '#000000' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                >
                  📱 QR
                </button>
                <button
                  onClick={() => setShowLiveModal(false)}
                  style={{ padding: '11px 16px', background: dm ? '#000000' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
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
              {qrLoadErrors[selectedTableForQR.id] ? (
                <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px', color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px' }}>⚠️</div>
                  <div>Failed to load QR code</div>
                  <button 
                    onClick={() => setQrLoadErrors(prev => ({ ...prev, [selectedTableForQR.id]: false }))}
                    style={{ padding: '6px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <img 
                  src={generateQRCode(selectedTableForQR)} 
                  alt={`QR ${selectedTableForQR.name}`} 
                  style={{ width: '180px', height: '180px' }}
                  onError={() => setQrLoadErrors(prev => ({ ...prev, [selectedTableForQR.id]: true }))}
                />
              )}
            </div>
            <p style={{ fontSize: '12px', color: muted, margin: 0, lineHeight: 1.5 }}>Customers scan this to self-order from their table.</p>
            <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
              <button onClick={() => { const url = `${window.location.origin}/qr-ordering.html?table=${encodeURIComponent(JSON.stringify({ tableId: selectedTableForQR.id, tableName: selectedTableForQR.name }))}`; window.open(url, '_blank'); }} style={{ flex: 1, padding: '11px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Open Page</button>
              <button onClick={() => setShowQRModal(false)} style={{ padding: '11px 16px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#c0c0d0' : '#111111', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          QR PRINT MODAL
          ══════════════════════════════════════════════════════════ */}
      {showQRPrintModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowQRPrintModal(false)}>
          <div style={{ 
            background: '#fff', 
            borderRadius: '20px', 
            width: '100%', 
            maxWidth: '1200px', 
            height: '90vh',
            maxHeight: '90vh',
            padding: '24px', 
            border: `1px solid ${border}`, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            overflow: 'hidden'
          }}
            onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>🖨️ Print QR Codes</div>
              <button onClick={() => setShowQRPrintModal(false)} aria-label="Close modal" style={{ width: '32px', height: '32px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: '#111111' }}>×</button>
            </div>

            {/* Main Content - Settings and Preview */}
            <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
              
              {/* Settings Panel */}
              <div style={{ 
                width: '380px', 
                overflowY: 'auto', 
                paddingRight: '12px',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px' 
              }}>
                
                {/* Collapsible Branding Section */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    onClick={() => setQrPrintSettings(p => ({ 
                      ...p, 
                      expandedSections: p.expandedSections.includes('branding') 
                        ? p.expandedSections.filter(s => s !== 'branding')
                        : [...p.expandedSections, 'branding']
                    }))}
                    style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', border: 'none', borderBottom: qrPrintSettings.expandedSections.includes('branding') ? '1px solid #e5e7eb' : 'none', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}
                  >
                    <span>🏪 Branding</span>
                    <span style={{ fontSize: '12px' }}>{qrPrintSettings.expandedSections.includes('branding') ? '▼' : '▶'}</span>
                  </button>
                  {qrPrintSettings.expandedSections.includes('branding') && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Restaurant Name</label>
                        <input
                          type="text"
                          value={qrPrintSettings.restaurantName}
                          onChange={e => setQrPrintSettings(p => ({ ...p, restaurantName: e.target.value }))}
                          placeholder="Your Restaurant Name"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setQrPrintSettings(p => ({ ...p, restaurantLogo: reader.result }));
                              reader.readAsDataURL(file);
                            }
                          }}
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                        {qrPrintSettings.restaurantLogo && (
                          <img src={qrPrintSettings.restaurantLogo} alt="Logo" style={{ width: '60px', height: '60px', objectFit: 'contain', marginTop: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Accent Color</label>
                        <input
                          type="color"
                          value={qrPrintSettings.accentColor}
                          onChange={e => setQrPrintSettings(p => ({ ...p, accentColor: e.target.value }))}
                          style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Content Section */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    onClick={() => setQrPrintSettings(p => ({ 
                      ...p, 
                      expandedSections: p.expandedSections.includes('content') 
                        ? p.expandedSections.filter(s => s !== 'content')
                        : [...p.expandedSections, 'content']
                    }))}
                    style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', border: 'none', borderBottom: qrPrintSettings.expandedSections.includes('content') ? '1px solid #e5e7eb' : 'none', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}
                  >
                    <span>📝 Content</span>
                    <span style={{ fontSize: '12px' }}>{qrPrintSettings.expandedSections.includes('content') ? '▼' : '▶'}</span>
                  </button>
                  {qrPrintSettings.expandedSections.includes('content') && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Call-to-Action Text</label>
                        <input
                          type="text"
                          value={qrPrintSettings.ctaText}
                          onChange={e => setQrPrintSettings(p => ({ ...p, ctaText: e.target.value }))}
                          placeholder="Scan to Order"
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6b7280', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={qrPrintSettings.showCapacity}
                            onChange={e => setQrPrintSettings(p => ({ ...p, showCapacity: e.target.checked }))}
                            style={{ cursor: 'pointer' }}
                          />
                          Show Table Capacity
                        </label>
                      </div>

                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: '#6b7280', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={qrPrintSettings.showWifi}
                            onChange={e => setQrPrintSettings(p => ({ ...p, showWifi: e.target.checked }))}
                            style={{ cursor: 'pointer' }}
                          />
                          Show WiFi Credentials
                        </label>
                        {qrPrintSettings.showWifi && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                              type="text"
                              value={qrPrintSettings.wifiSsid}
                              onChange={e => setQrPrintSettings(p => ({ ...p, wifiSsid: e.target.value }))}
                              placeholder="WiFi Network Name"
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            />
                            <input
                              type="text"
                              value={qrPrintSettings.wifiPassword}
                              onChange={e => setQrPrintSettings(p => ({ ...p, wifiPassword: e.target.value }))}
                              placeholder="WiFi Password"
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Layout Section */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    onClick={() => setQrPrintSettings(p => ({ 
                      ...p, 
                      expandedSections: p.expandedSections.includes('layout') 
                        ? p.expandedSections.filter(s => s !== 'layout')
                        : [...p.expandedSections, 'layout']
                    }))}
                    style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', border: 'none', borderBottom: qrPrintSettings.expandedSections.includes('layout') ? '1px solid #e5e7eb' : 'none', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}
                  >
                    <span>📐 Layout & Style</span>
                    <span style={{ fontSize: '12px' }}>{qrPrintSettings.expandedSections.includes('layout') ? '▼' : '▶'}</span>
                  </button>
                  {qrPrintSettings.expandedSections.includes('layout') && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>QR Size</label>
                          <select
                            value={qrPrintSettings.qrSize}
                            onChange={e => setQrPrintSettings(p => ({ ...p, qrSize: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                          >
                            <option value="small">Small</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Cards/Page</label>
                          <select
                            value={qrPrintSettings.cardsPerPage}
                            onChange={e => setQrPrintSettings(p => ({ ...p, cardsPerPage: parseInt(e.target.value) }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                          >
                            <option value="4">4</option>
                            <option value="6">6</option>
                            <option value="9">9</option>
                            <option value="12">12</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Paper</label>
                          <select
                            value={qrPrintSettings.paperSize}
                            onChange={e => setQrPrintSettings(p => ({ ...p, paperSize: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                          >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="label">Label</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Layout</label>
                          <select
                            value={qrPrintSettings.layoutType}
                            onChange={e => setQrPrintSettings(p => ({ ...p, layoutType: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                          >
                            <option value="flat">Flat</option>
                            <option value="tent">Tent</option>
                            <option value="sticker">Sticker</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Orientation</label>
                          <select
                            value={qrPrintSettings.orientation}
                            onChange={e => setQrPrintSettings(p => ({ ...p, orientation: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                          >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Border</label>
                          <select
                            value={qrPrintSettings.borderStyle}
                            onChange={e => setQrPrintSettings(p => ({ ...p, borderStyle: e.target.value }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                          >
                            <option value="solid">Solid</option>
                            <option value="dashed">Dashed</option>
                            <option value="double">Double</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Card Background</label>
                        <select
                          value={qrPrintSettings.cardBackgroundType}
                          onChange={e => setQrPrintSettings(p => ({ ...p, cardBackgroundType: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer', marginBottom: '8px' }}
                        >
                          <option value="solid">Solid</option>
                          <option value="gradient">Gradient</option>
                        </select>
                        {qrPrintSettings.cardBackgroundType === 'solid' ? (
                          <input
                            type="color"
                            value={qrPrintSettings.cardBackground}
                            onChange={e => setQrPrintSettings(p => ({ ...p, cardBackground: e.target.value }))}
                            style={{ width: '100%', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              type="color"
                              value={qrPrintSettings.gradientStart}
                              onChange={e => setQrPrintSettings(p => ({ ...p, gradientStart: e.target.value }))}
                              style={{ flex: 1, height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
                            />
                            <input
                              type="color"
                              value={qrPrintSettings.gradientEnd}
                              onChange={e => setQrPrintSettings(p => ({ ...p, gradientEnd: e.target.value }))}
                              style={{ flex: 1, height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' }}
                            />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Gap: {qrPrintSettings.cardGap}px</label>
                          <input
                            type="range"
                            min="8"
                            max="32"
                            value={qrPrintSettings.cardGap}
                            onChange={e => setQrPrintSettings(p => ({ ...p, cardGap: parseInt(e.target.value) }))}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Radius: {qrPrintSettings.cardRadius}px</label>
                          <input
                            type="range"
                            min="0"
                            max="24"
                            value={qrPrintSettings.cardRadius}
                            onChange={e => setQrPrintSettings(p => ({ ...p, cardRadius: parseInt(e.target.value) }))}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Margin (mm)</label>
                          <input
                            type="number"
                            min="0"
                            max="25"
                            value={qrPrintSettings.margin}
                            onChange={e => setQrPrintSettings(p => ({ ...p, margin: Math.max(0, Math.min(25, parseInt(e.target.value) || 10)) }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Copies</label>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={qrPrintSettings.copiesPerTable}
                            onChange={e => setQrPrintSettings(p => ({ ...p, copiesPerTable: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)) }))}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>Font</label>
                        <select
                          value={qrPrintSettings.fontFamily}
                          onChange={e => setQrPrintSettings(p => ({ ...p, fontFamily: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                        >
                          <option value="Inter">Inter</option>
                          <option value="Arial">Arial</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Courier New">Courier</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Tables Section */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    onClick={() => setQrPrintSettings(p => ({ 
                      ...p, 
                      expandedSections: p.expandedSections.includes('tables') 
                        ? p.expandedSections.filter(s => s !== 'tables')
                        : [...p.expandedSections, 'tables']
                    }))}
                    style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', border: 'none', borderBottom: qrPrintSettings.expandedSections.includes('tables') ? '1px solid #e5e7eb' : 'none', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}
                  >
                    <span>🪑 Tables ({qrPrintSettings.selectedTables.length || 'All'})</span>
                    <span style={{ fontSize: '12px' }}>{qrPrintSettings.expandedSections.includes('tables') ? '▼' : '▶'}</span>
                  </button>
                  {qrPrintSettings.expandedSections.includes('tables') && (
                    <div style={{ padding: '16px' }}>
                      <button
                        onClick={() => {
                          const allSelected = qrPrintSettings.selectedTables.length === tables.length;
                          setQrPrintSettings(p => ({ ...p, selectedTables: allSelected ? [] : tables.map(t => t.id) }));
                        }}
                        style={{ width: '100%', padding: '8px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginBottom: '12px' }}
                      >
                        {qrPrintSettings.selectedTables.length === tables.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {tables.map(table => (
                          <label key={table.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111111', cursor: 'pointer', padding: '6px', borderRadius: '6px', background: qrPrintSettings.selectedTables.includes(table.id) ? '#f0f9ff' : 'transparent' }}>
                            <input
                              type="checkbox"
                              checked={qrPrintSettings.selectedTables.includes(table.id)}
                              onChange={() => {
                                setQrPrintSettings(p => ({
                                  ...p,
                                  selectedTables: p.selectedTables.includes(table.id)
                                    ? p.selectedTables.filter(id => id !== table.id)
                                    : [...p.selectedTables, table.id]
                                }));
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            {table.name} ({table.capacity} seats)
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Templates */}
                <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                  <button
                    onClick={() => setQrPrintSettings(p => ({ 
                      ...p, 
                      expandedSections: p.expandedSections.includes('templates') 
                        ? p.expandedSections.filter(s => s !== 'templates')
                        : [...p.expandedSections, 'templates']
                    }))}
                    style={{ width: '100%', padding: '12px 16px', background: '#f9fafb', border: 'none', borderBottom: qrPrintSettings.expandedSections.includes('templates') ? '1px solid #e5e7eb' : 'none', borderRadius: '12px 12px 0 0', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', color: '#0a0a0a' }}
                  >
                    <span>🎨 Quick Templates</span>
                    <span style={{ fontSize: '12px' }}>{qrPrintSettings.expandedSections.includes('templates') ? '▼' : '▶'}</span>
                  </button>
                  {qrPrintSettings.expandedSections.includes('templates') && (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={() => setQrPrintSettings(p => ({ ...p, qrSize: 'small', cardsPerPage: 12, layoutType: 'sticker', showCapacity: false, ctaText: 'Scan to Order' }))}
                        style={{ padding: '10px 12px', background: '#fff', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'left', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        📦 Compact Stickers (12/page)
                      </button>
                      <button
                        onClick={() => setQrPrintSettings(p => ({ ...p, qrSize: 'large', cardsPerPage: 6, layoutType: 'flat', showCapacity: true, ctaText: 'Scan for Menu' }))}
                        style={{ padding: '10px 12px', background: '#fff', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'left', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        🍽️ Restaurant Menu (6/page)
                      </button>
                      <button
                        onClick={() => setQrPrintSettings(p => ({ ...p, qrSize: 'large', cardsPerPage: 4, layoutType: 'tent', showCapacity: true, showWifi: true, ctaText: 'Order Here' }))}
                        style={{ padding: '10px 12px', background: '#fff', color: '#111111', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textAlign: 'left', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        ☕ Cafe Table Tent (4/page + WiFi)
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Preview Panel */}
              <div style={{ 
                flex: 1, 
                background: '#f3f4f6', 
                borderRadius: '12px', 
                padding: '20px', 
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0a0a0a' }}>
                    👁️ Print Preview 
                    {((qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables.length : tables.length) > qrPrintSettings.cardsPerPage) && (
                      <span style={{ fontSize: '12px', fontWeight: '400', color: '#6b7280', marginLeft: '8px' }}>
                        ({Math.ceil((qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables.length : tables.length) / qrPrintSettings.cardsPerPage)} pages)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', color: '#6b7280', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={qrPrintSettings.hideGuides || false}
                        onChange={e => setQrPrintSettings(p => ({ ...p, hideGuides: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      Hide Guides
                    </label>
                    <button
                      onClick={() => setQrPrintSettings(p => ({ ...p, previewZoom: Math.max(0.5, p.previewZoom - 0.1) }))}
                      style={{ padding: '6px 10px', background: '#fff', color: '#111111', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}
                    >
                      −
                    </button>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', minWidth: '40px', textAlign: 'center' }}>
                      {Math.round(qrPrintSettings.previewZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setQrPrintSettings(p => ({ ...p, previewZoom: Math.min(1.5, p.previewZoom + 0.1) }))}
                      style={{ padding: '6px 10px', background: '#fff', color: '#111111', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                {/* Scrollable Preview Container */}
                <div style={{ 
                  flex: 1, 
                  overflow: 'auto', 
                  minHeight: 0,
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <div 
                    id="qr-print-preview"
                    style={{
                      background: '#fff',
                      padding: `${qrPrintSettings.margin}px`,
                      borderRadius: '4px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                      minHeight: '400px',
                      maxWidth: qrPrintSettings.paperSize === 'a4' ? '794px' : qrPrintSettings.paperSize === 'letter' ? '816px' : '100%',
                      width: qrPrintSettings.paperSize === 'a4' ? '794px' : qrPrintSettings.paperSize === 'letter' ? '816px' : '100%',
                      fontFamily: qrPrintSettings.fontFamily,
                      position: 'relative',
                      transform: `scale(${qrPrintSettings.previewZoom})`,
                      transformOrigin: 'top center',
                      transition: 'transform 0.2s ease',
                      backgroundImage: 'rad-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
                      backgroundSize: '20px 20px',
                      margin: '0 auto'
                    }}
                  >
                  {/* Crop Marks */}
                  {!qrPrintSettings.hideGuides && (
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      pointerEvents: 'none',
                      opacity: 0.3
                    }}>
                      {/* Top-left */}
                      <div style={{ position: 'absolute', top: '0', left: '0', width: '20px', height: '20px' }}>
                        <div style={{ position: 'absolute', top: '0', left: '0', width: '10px', height: '1px', background: '#000' }} />
                        <div style={{ position: 'absolute', top: '0', left: '0', width: '1px', height: '10px', background: '#000' }} />
                      </div>
                      {/* Top-right */}
                      <div style={{ position: 'absolute', top: '0', right: '0', width: '20px', height: '20px' }}>
                        <div style={{ position: 'absolute', top: '0', right: '0', width: '10px', height: '1px', background: '#000' }} />
                        <div style={{ position: 'absolute', top: '0', right: '0', width: '1px', height: '10px', background: '#000' }} />
                      </div>
                      {/* Bottom-left */}
                      <div style={{ position: 'absolute', bottom: '0', left: '0', width: '20px', height: '20px' }}>
                        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '10px', height: '1px', background: '#000' }} />
                        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '1px', height: '10px', background: '#000' }} />
                      </div>
                      {/* Bottom-right */}
                      <div style={{ position: 'absolute', bottom: '0', right: '0', width: '20px', height: '20px' }}>
                        <div style={{ position: 'absolute', bottom: '0', right: '0', width: '10px', height: '1px', background: '#000' }} />
                        <div style={{ position: 'absolute', bottom: '0', right: '0', width: '1px', height: '10px', background: '#000' }} />
                      </div>
                    </div>
                  )}
                  {/* Multiple pages */}
                  {Array.from({ length: Math.ceil((bulkPrintTables ? bulkPrintTables.length : (qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables.length : tables.length)) / qrPrintSettings.cardsPerPage) }).map((_, pageIndex) => (
                    <div key={pageIndex} style={{ marginBottom: pageIndex > 0 ? '32px' : '0', paddingBottom: '32px', borderBottom: pageIndex < Math.ceil((bulkPrintTables ? bulkPrintTables.length : (qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables.length : tables.length)) / qrPrintSettings.cardsPerPage) - 1 ? '1px solid #e5e7eb' : 'none', position: 'relative' }}>
                      {/* Page number indicator */}
                      {!qrPrintSettings.hideGuides && Math.ceil((bulkPrintTables ? bulkPrintTables.length : (qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables.length : tables.length)) / qrPrintSettings.cardsPerPage) > 1 && (
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '12px', textAlign: 'center', fontWeight: '500', letterSpacing: '0.5px' }}>
                          — PAGE {pageIndex + 1} OF {Math.ceil((bulkPrintTables ? bulkPrintTables.length : (qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables.length : tables.length)) / qrPrintSettings.cardsPerPage)} —
                        </div>
                      )}
                      
                      {/* Fold guide for table tent layout */}
                      {!qrPrintSettings.hideGuides && qrPrintSettings.layoutType === 'tent' && (
                        <div style={{
                          position: 'relative',
                          marginBottom: '16px',
                          padding: '20px 0'
                        }}>
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '0',
                            right: '0',
                            height: '0',
                            borderTop: '2px dashed #9ca3af',
                            pointerEvents: 'none',
                            zIndex: 10,
                            opacity: 0.6
                          }}>
                            <div style={{
                              position: 'absolute',
                              left: '50%',
                              top: '-12px',
                              transform: 'translateX(-50%)',
                              background: '#f3f4f6',
                              padding: '4px 10px',
                              fontSize: '10px',
                              color: '#6b7280',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontWeight: '600',
                              letterSpacing: '0.5px'
                            }}>
                              ✂ FOLD HERE
                            </div>
                          </div>
                          {/* Fold arrows */}
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '10px',
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#9ca3af',
                            opacity: 0.5
                          }}>↓</div>
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '10px',
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#9ca3af',
                            opacity: 0.5
                          }}>↓</div>
                        </div>
                      )}
                      
                      {/* Preview Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${qrPrintSettings.cardsPerPage <= 4 ? 2 : qrPrintSettings.cardsPerPage <= 9 ? 3 : 4}, 1fr)`,
                        gap: `${qrPrintSettings.cardGap}px`,
                        alignItems: 'start',
                        transform: qrPrintSettings.orientation === 'landscape' ? 'rotate(90deg)' : 'none',
                        transformOrigin: 'top left',
                        transition: 'gap 0.2s ease'
                      }}
                      >
                        {(bulkPrintTables ? bulkPrintTables.map(t => t.id) : (qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables : tables.map(t => t.id)))
                          .slice(pageIndex * qrPrintSettings.cardsPerPage, (pageIndex + 1) * qrPrintSettings.cardsPerPage)
                          .map((tableId, index) => {
                            const table = tables.find(t => t.id === tableId);
                            if (!table) return null;
                            const qrSize = qrPrintSettings.qrSize === 'small' ? 80 : 200;
                            
                            return (
                              <div
                                key={`${table.id}-${index}`}
                                style={{
                                  border: qrPrintSettings.borderStyle === 'none' ? 'none' : qrPrintSettings.borderStyle === 'double' ? `4px double ${qrPrintSettings.accentColor}` : qrPrintSettings.borderStyle === 'dashed' ? `2px dashed ${qrPrintSettings.accentColor}` : `2px solid ${qrPrintSettings.accentColor}`,
                                  borderRadius: `${qrPrintSettings.cardRadius}px`,
                                  padding: '16px',
                                  textAlign: 'center',
                                  background: qrPrintSettings.cardBackgroundType === 'gradient' 
                                    ? `linear-gradient(135deg, ${qrPrintSettings.gradientStart}, ${qrPrintSettings.gradientEnd})`
                                    : qrPrintSettings.cardBackground,
                                  minHeight: qrPrintSettings.qrSize === 'small' ? '180px' : '280px',
                                  position: qrPrintSettings.layoutType === 'tent' ? 'relative' : undefined,
                                  transition: 'all 0.2s ease',
                                  boxShadow: qrPrintSettings.borderStyle === 'none' 
                                    ? '0 2px 8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)'
                                    : '0 4px 12px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.05)'
                                }}
                              >
                                {/* Logo */}
                                {qrPrintSettings.restaurantLogo && (
                                  <img 
                                    src={qrPrintSettings.restaurantLogo} 
                                    alt="Logo" 
                                    style={{ width: '48px', height: '48px', objectFit: 'contain', marginBottom: '10px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} 
                                  />
                                )}
                                
                                {/* Restaurant Name */}
                                {qrPrintSettings.restaurantName && (
                                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    {qrPrintSettings.restaurantName}
                                  </div>
                                )}
                                
                                {/* Table Name */}
                                <div style={{ fontSize: '20px', fontWeight: '800', color: qrPrintSettings.accentColor, marginBottom: '6px', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
                                  {table.name}
                                </div>
                                
                                {/* Capacity */}
                                {qrPrintSettings.showCapacity && (
                                  <div style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                    {table.capacity} SEATS
                                  </div>
                                )}
                                
                                {/* QR Code */}
                                <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', display: 'inline-block', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                                  {qrLoadErrors[table.id] ? (
                                    <div style={{ width: `${qrSize}px`, height: `${qrSize}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px', color: '#ef4444', fontSize: '10px', textAlign: 'center' }}>
                                      <div style={{ fontSize: '20px' }}>⚠️</div>
                                      <div>QR Error</div>
                                    </div>
                                  ) : (
                                    <img 
                                      src={generateQRCode(table)} 
                                      alt={`QR ${table.name}`} 
                                      style={{ width: `${qrSize}px`, height: `${qrSize}px`, display: 'block' }}
                                      onError={() => setQrLoadErrors(prev => ({ ...prev, [table.id]: true }))}
                                    />
                                  )}
                                </div>
                                
                                {/* CTA Text */}
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0a0a0a', marginBottom: '8px', letterSpacing: '0.2px' }}>
                                  {qrPrintSettings.ctaText}
                                </div>
                                
                                {/* WiFi */}
                                {qrPrintSettings.showWifi && qrPrintSettings.wifiSsid && (
                                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', padding: '6px', background: '#f9fafb', borderRadius: '6px' }}>
                                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>WiFi: {qrPrintSettings.wifiSsid}</div>
                                    {qrPrintSettings.wifiPassword && <div style={{ marginBottom: '4px' }}>PW: {qrPrintSettings.wifiPassword}</div>}
                                    {generateWifiQRCode() && (
                                      <img 
                                        src={generateWifiQRCode()} 
                                        alt="WiFi QR" 
                                        style={{ width: '60px', height: '60px', marginTop: '4px' }} 
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
              <button 
                onClick={() => setShowQRPrintModal(false)}
                style={{ padding: '12px 24px', background: '#f3f4f6', color: '#111111', border: '1px solid #d1d5db', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  const preview = document.getElementById('qr-print-preview');
                  if (preview) {
                    const exportData = {
                      settings: qrPrintSettings,
                      tables: (qrPrintSettings.selectedTables.length > 0 ? qrPrintSettings.selectedTables : tables.map(t => t.id)).map(id => tables.find(t => t.id === id)),
                      exportDate: new Date().toISOString()
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `qr-cards-export-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Export saved successfully');
                  }
                }}
                style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
              >
                📥 Export
              </button>
              <button 
                onClick={() => window.print()}
                style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
              >
                🖨️ Print / Save PDF
              </button>
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
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>⇆ Merge Tables</div>
              <button onClick={() => setShowMergeModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.5 }}>
              Select two tables to merge — orders for both will appear under the primary table.
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>SELECT TABLES (pick 2)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {filteredTablesWithStatus.map(t => {
                  const sel = mergeSource?.id === t.id || mergeTarget?.id === t.id;
                  const isMerged = t.mergedWith?.length > 0;
                  const isOccupied = t.status === 'occupied';
                  const isPrimary = mergeSource?.id === t.id;
                  return (
                    <button 
                      key={t.id} 
                      onClick={() => {
                        if (mergeSource?.id === t.id) { setMergeSource(null); return; }
                        if (mergeTarget?.id === t.id) { setMergeTarget(null); return; }
                        if (!mergeSource) setMergeSource(t);
                        else if (!mergeTarget) setMergeTarget(t);
                      }} 
                      style={{ 
                        padding: '12px 8px', 
                        background: sel 
                          ? 'rgba(99,102,241,0.15)' 
                          : isMerged 
                            ? 'rgba(139,92,246,0.1)' 
                            : isOccupied 
                              ? 'rgba(245,158,11,0.1)' 
                              : (dm ? '#111111' : '#f3f4f6'), 
                        color: sel 
                          ? accent 
                          : isMerged 
                            ? '#8b5cf6' 
                            : isOccupied 
                              ? '#f59e0b' 
                              : text, 
                        border: sel 
                          ? `2px solid ${accent}` 
                          : isMerged 
                            ? '2px solid #8b5cf6' 
                            : isOccupied 
                              ? '2px solid #f59e0b' 
                              : `1.5px solid ${border}`, 
                        borderRadius: '10px', 
                        fontWeight: '700', 
                        cursor: 'pointer', 
                        fontSize: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative',
                        boxShadow: sel ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                      }}
                    >
                      {isPrimary && (
                        <span style={{ 
                          position: 'absolute', 
                          top: '-6px', 
                          right: '-6px', 
                          background: accent, 
                          color: '#fff', 
                          fontSize: '9px', 
                          fontWeight: '700', 
                          padding: '2px 6px', 
                          borderRadius: '6px' 
                        }}>
                          PRIMARY
                        </span>
                      )}
                      <span style={{ fontSize: '16px' }}>{t.name}</span>
                      <span style={{ fontSize: '10px', fontWeight: '500', opacity: 0.8 }}>
                        👥 {t.capacity}
                      </span>
                      {isMerged && (
                        <span style={{ fontSize: '9px', fontWeight: '600' }}>
                          🔗 {t.mergedWith?.length} merged
                        </span>
                      )}
                      {isOccupied && (
                        <span style={{ fontSize: '9px', fontWeight: '600' }}>
                          ⏱ {formatElapsed(t.sinceMs)}
                        </span>
                      )}
                      {t.currentToken && (
                        <span style={{ fontSize: '9px', fontWeight: '600' }}>
                          🎫 {t.currentToken}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            {mergeSource && mergeTarget && (
              <div style={{ padding: '12px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '10px', fontSize: '13px', color: text }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>Merge Preview:</div>
                <div><strong>{mergeSource.name}</strong> + <strong>{mergeTarget.name}</strong></div>
                <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>
                  Total capacity: {mergeSource.capacity + mergeTarget.capacity} seats
                  {mergeSource.currentToken && ` · Token: ${mergeSource.currentToken}`}
                </div>
                {/* Conflict warning */}
                {mergeSource.currentToken && mergeTarget.currentToken && mergeSource.currentToken !== mergeTarget.currentToken && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: 'rgba(239, 68, 68, 0.15)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)', 
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#ef4444',
                    fontWeight: '600'
                  }}>
                    ⚠️ Warning: These tables have different active tokens ({mergeSource.currentToken} vs {mergeTarget.currentToken}). Merging may cause billing conflicts.
                  </div>
                )}
                {(mergeSource.currentToken || mergeTarget.currentToken) && !(mergeSource.currentToken && mergeTarget.currentToken) && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: 'rgba(245, 158, 11, 0.15)', 
                    border: '1px solid rgba(245, 158, 11, 0.3)', 
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#f59e0b',
                    fontWeight: '600'
                  }}>
                    ⚠️ One table has an active token ({mergeSource.currentToken || mergeTarget.currentToken}). The other will inherit this token.
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowMergeModal(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button
                disabled={!mergeSource || !mergeTarget}
                onClick={() => {
                  // Check for conflicting tokens
                  if (mergeSource.currentToken && mergeTarget.currentToken && mergeSource.currentToken !== mergeTarget.currentToken) {
                    setMergeConflictConfirm(true);
                    return;
                  }
                  
                  setTables(prev => prev.map(t => {
                    if (t.id === mergeSource.id) return { ...t, mergedWith: [...(t.mergedWith || []), mergeTarget.id] };
                    if (t.id === mergeTarget.id) {
                      // Preserve existing merges instead of overwriting
                      const existingMerges = t.mergedWith || [];
                      const newMerges = [...existingMerges, mergeSource.id];
                      return { ...t, mergedWith: newMerges };
                    }
                    return t;
                  }));
                  setShowMergeModal(false);
                  showToast('Tables merged successfully');
                }}
                style={{ flex: 1, padding: '11px', background: (mergeSource && mergeTarget) ? accent : (dm ? '#111111' : '#e5e7eb'), color: (mergeSource && mergeTarget) ? '#fff' : muted, border: 'none', borderRadius: '10px', fontWeight: '700', cursor: (mergeSource && mergeTarget) ? 'pointer' : 'not-allowed', fontSize: '13px' }}
              >
                Merge Tables
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          MERGE CONFLICT CONFIRM MODAL
          ══════════════════════════════════════════════════════════ */}
      {mergeConflictConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setMergeConflictConfirm(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>⚠️ Token Conflict Warning</div>
            <div style={{ fontSize: '13px', color: text, lineHeight: 1.6 }}>
              These tables have different active tokens:
              <div style={{ marginTop: '8px', padding: '12px', background: dm ? '#111111' : '#f8fafc', borderRadius: '8px', border: `1px solid ${border}` }}>
                <div style={{ marginBottom: '4px' }}><strong>{mergeSource?.name}:</strong> Token {mergeSource?.currentToken}</div>
                <div><strong>{mergeTarget?.name}:</strong> Token {mergeTarget?.currentToken}</div>
              </div>
              Merging them may cause billing conflicts. Are you sure you want to proceed?
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setMergeConflictConfirm(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button
                onClick={() => {
                  setTables(prev => prev.map(t => {
                    if (t.id === mergeSource.id) return { ...t, mergedWith: [...(t.mergedWith || []), mergeTarget.id] };
                    if (t.id === mergeTarget.id) {
                      // Preserve existing merges instead of overwriting
                      const existingMerges = t.mergedWith || [];
                      const newMerges = [...existingMerges, mergeSource.id];
                      return { ...t, mergedWith: newMerges };
                    }
                    return t;
                  }));
                  setShowMergeModal(false);
                  setMergeConflictConfirm(false);
                  showToast('Tables merged successfully');
                }}
                style={{ flex: 1, padding: '11px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STAFF ASSIGNMENT MODAL
          ══════════════════════════════════════════════════════════ */}
      {showStaffModal && (staffTable || bulkAssignTables) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowStaffModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>👤 Assign Staff</div>
              <button onClick={() => { setShowStaffModal(false); setBulkAssignTables(null); }} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.5 }}>
              {bulkAssignTables 
                ? `Assign staff member to ${bulkAssignTables.length} table${bulkAssignTables.length > 1 ? 's' : ''}`
                : `Assign a staff member to <strong>${staffTable.name}</strong>`
              }
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>SELECT STAFF</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleAssignStaff('')}
                  style={{ 
                    padding: '12px', 
                    background: (bulkAssignTables ? false : staffTable?.assignedStaff === '') ? 'rgba(239, 68, 68, 0.15)' : (dm ? '#111111' : '#f3f4f6'), 
                    color: (bulkAssignTables ? false : staffTable?.assignedStaff === '') ? '#ef4444' : text, 
                    border: (bulkAssignTables ? false : staffTable?.assignedStaff === '') ? '2px solid #ef4444' : `1px solid ${border}`, 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    cursor: 'pointer', 
                    fontSize: '14px',
                    textAlign: 'left'
                  }}
                >
                  ❌ Remove Staff Assignment
                </button>
                {staff.length > 0 ? staff.map(s => (
                  <button
                    key={s.id || s.name}
                    onClick={() => handleAssignStaff(s.name)}
                    style={{ 
                      padding: '12px', 
                      background: staffTable.assignedStaff === s.name ? 'rgba(99,102,241,0.15)' : (dm ? '#111111' : '#f3f4f6'), 
                      color: staffTable.assignedStaff === s.name ? accent : text, 
                      border: staffTable.assignedStaff === s.name ? '2px solid #6366f1' : `1px solid ${border}`, 
                      borderRadius: '10px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      fontSize: '14px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>👤</span>
                    <span>{s.name}</span>
                  </button>
                )) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: muted, fontSize: '13px' }}>
                    No staff members available
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowStaffModal(false)} style={{ padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ANALYTICS MODAL
          ══════════════════════════════════════════════════════════ */}
      {showAnalyticsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAnalyticsModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '700px', maxHeight: '85vh', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>📊 Advanced Table Analytics</div>
              <button onClick={() => setShowAnalyticsModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            
            {(() => {
              const analytics = analyticsData;
              const formatTime = (ms) => {
                if (!ms || ms < 0) return 'N/A';
                const totalMins = Math.floor(ms / 60000);
                if (totalMins < 60) return `${totalMins}m`;
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                return m === 0 ? `${h}h` : `${h}h ${m}m`;
              };
              const formatCurrency = (amount) => `₹${Math.round(amount).toLocaleString()}`;
              
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Key Metrics Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ background: dm ? '#111111' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${border}` }}>
                      <div style={{ fontSize: '10px', color: muted, marginBottom: '4px', fontWeight: '600' }}>TOTAL SESSIONS</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: accent }}>{analytics.totalSessions}</div>
                      <div style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>{analytics.activeSessionCount} active now</div>
                    </div>
                    <div style={{ background: dm ? '#111111' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${border}` }}>
                      <div style={{ fontSize: '10px', color: muted, marginBottom: '4px', fontWeight: '600' }}>AVG SESSION TIME</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>{formatTime(analytics.avgSessionDuration)}</div>
                      <div style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>Per table</div>
                    </div>
                    <div style={{ background: dm ? '#111111' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${border}` }}>
                      <div style={{ fontSize: '10px', color: muted, marginBottom: '4px', fontWeight: '600' }}>TOTAL REVENUE</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#f59e0b' }}>{formatCurrency(analytics.totalRevenue)}</div>
                      <div style={{ fontSize: '10px', color: muted, marginTop: '2px' }}>{formatCurrency(analytics.avgRevenuePerSession)}/session</div>
                    </div>
                  </div>

                  {/* Today's Performance */}
                  <div style={{ background: dm ? '#111111' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${border}` }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '12px' }}>TODAY'S PERFORMANCE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: muted, marginBottom: '4px' }}>Sessions Today</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: text }}>{analytics.todaySessions}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: muted, marginBottom: '4px' }}>Revenue Today</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(analytics.todayRevenue)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Performance */}
                  {Object.keys(analytics.staffStats).length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>STAFF PERFORMANCE</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.entries(analytics.staffStats)
                          .sort((a, b) => b[1].revenue - a[1].revenue)
                          .map(([staffName, stats]) => (
                          <div key={staffName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: dm ? '#111111' : '#f8fafc', borderRadius: '8px', border: `1px solid ${border}` }}>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: text }}>👤 {staffName}</div>
                              <div style={{ fontSize: '11px', color: muted }}>{stats.sessions} sessions · {formatTime(stats.duration / stats.sessions)} avg</div>
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(stats.revenue)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Table Performance */}
                  {Object.keys(analytics.tableStats).length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>TABLE PERFORMANCE</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        {Object.entries(analytics.tableStats)
                          .sort((a, b) => b[1].revenue - a[1].revenue)
                          .map(([tableName, stats]) => (
                          <div key={tableName} style={{ padding: '12px', background: dm ? '#111111' : '#f8fafc', borderRadius: '8px', border: `1px solid ${border}` }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: text }}>🪑 {tableName}</div>
                            <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>{stats.sessions} sessions · {formatTime(stats.avgDuration)}</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>{formatCurrency(stats.revenue)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Busiest Hours */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>BUSIEST HOURS</div>
                    {analytics.busiestHours.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {analytics.busiestHours.map((hour, idx) => (
                          <div key={hour.hour} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: dm ? '#111111' : '#f8fafc', borderRadius: '8px', border: `1px solid ${border}` }}>
                            <span style={{ fontSize: '13px', color: text, fontWeight: '500' }}>{hour.label}</span>
                            <span style={{ fontSize: '12px', color: muted, fontWeight: '600' }}>{hour.count} sessions</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: muted, fontSize: '13px' }}>
                        No data available yet
                      </div>
                    )}
                  </div>

                  {/* Recent Sessions */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>RECENT SESSIONS (Last 50)</div>
                    {analytics.sessionList.length > 0 ? (
                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {analytics.sessionList.slice(0, 10).map(session => (
                      <div key={session.id} style={{ padding: '10px 12px', background: dm ? '#111111' : '#f8fafc', borderRadius: '6px', border: `1px solid ${border}`, fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '600', color: text }}>🪑 {session.tableName}</span>
                          <span style={{ color: muted }}>{new Date(session.startTime).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ color: muted }}>
                            {session.staff && `👤 ${session.staff} · `}
                            {formatTime(new Date(session.endTime) - new Date(session.startTime))}
                          </span>
                          <span style={{ fontWeight: '600', color: '#10b981' }}>{formatCurrency(session.revenue)}</span>
                        </div>
                      </div>
                    ))}
                    {analytics.sessionList.length > 10 && (
                      <div style={{ textAlign: 'center', fontSize: '11px', color: muted, padding: '8px' }}>
                        +{analytics.sessionList.length - 10} more sessions
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: muted, fontSize: '13px' }}>
                    No completed sessions yet
                  </div>
                )}
                  </div>

                  {/* Active Sessions */}
                  {analytics.activeSessions.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>ACTIVE SESSIONS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {analytics.activeSessions.map(session => (
                          <div key={session.id} style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: '600', color: text }}>🪑 {session.tableName}</span>
                              <span style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600' }}>LIVE</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ color: muted }}>
                                {session.staff && `👤 ${session.staff} · `}
                                Started {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span style={{ fontWeight: '600', color: '#10b981' }}>{formatCurrency(session.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button 
                onClick={() => {
                  if (confirm('Clear all session history? This cannot be undone.')) {
                    setSessions({});
                    saveSessions({});
                    saveOccupiedSince({});
                    setOccupiedSince({});
                    showToast('Session history cleared');
                  }
                }}
                style={{ flex: 1, padding: '11px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                🗑️ Clear History
              </button>
              <button onClick={() => setShowAnalyticsModal(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          BULK QR PRINT MODAL
          ══════════════════════════════════════════════════════════ */}
      {showQRModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowQRModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '600px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>🖨️ Print Table QR Codes</div>
              <button onClick={() => setShowQRModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.5 }}>
              Print QR codes for table tents. Each QR code will allow customers to scan and order from their table.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', maxHeight: '300px', overflowY: 'auto', padding: '8px' }}>
              {tables.map(table => (
                <div key={table.id} style={{ background: dm ? '#111111' : '#f8fafc', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: text }}>{table.name}</div>
                  <img 
                    src={generateQRCode(table)} 
                    alt={`QR for ${table.name}`}
                    style={{ width: '100px', height: '100px', border: `1px solid ${border}`, borderRadius: '8px' }}
                  />
                  <div style={{ fontSize: '11px', color: muted }}>{table.capacity} seats</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  window.print();
                  showToast('QR codes sent to printer');
                }}
                style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
              >
                🖨️ Print All
              </button>
              <button 
                onClick={() => {
                  const qrData = tables.map(t => ({
                    table: t.name,
                    qr: generateQRCode(t),
                    capacity: t.capacity
                  }));
                  const blob = new Blob([JSON.stringify(qrData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'table-qr-codes.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('QR codes exported successfully');
                }}
                style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
              >
                📥 Export JSON
              </button>
            </div>
            
            <button onClick={() => setShowQRModal(false)} style={{ padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          WAITLIST MODAL
          ══════════════════════════════════════════════════════════ */}
      {showWaitlistModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowWaitlistModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '80vh', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>⏱ Waitlist</div>
              <button onClick={() => setShowWaitlistModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>

            {/* Add to waitlist form */}
            <div style={{ background: dm ? '#111111' : '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${border}` }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>ADD PARTY TO WAITLIST</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={waitlistForm.name}
                  onChange={e => setWaitlistForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ flex: 1, padding: '8px 12px', border: `1px solid ${border}`, borderRadius: '8px', background: dm ? '#1e1e2e' : '#fff', color: text, fontSize: '14px' }}
                />
                <input
                  type="number"
                  placeholder="Party size"
                  value={waitlistForm.partySize}
                  onChange={e => setWaitlistForm(prev => ({ ...prev, partySize: e.target.value }))}
                  style={{ width: '80px', padding: '8px 12px', border: `1px solid ${border}`, borderRadius: '8px', background: dm ? '#1e1e2e' : '#fff', color: text, fontSize: '14px' }}
                />
                <input
                  type="number"
                  placeholder="Wait (min)"
                  value={waitlistForm.quotedWait}
                  onChange={e => setWaitlistForm(prev => ({ ...prev, quotedWait: e.target.value }))}
                  style={{ width: '80px', padding: '8px 12px', border: `1px solid ${border}`, borderRadius: '8px', background: dm ? '#1e1e2e' : '#fff', color: text, fontSize: '14px' }}
                />
              </div>
              <button
                onClick={addToWaitlist}
                style={{ width: '100%', padding: '8px', background: accent, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                ➕ Add to Waitlist
              </button>
            </div>

            {/* Waitlist */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {waitlist.filter(p => !p.seated).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: muted }}>No parties waiting</div>
              ) : (
                waitlist.filter(p => !p.seated).map(party => {
                  const suggestedTables = getSuggestedTable(party.partySize);
                  return (
                    <div key={party.id} style={{ background: dm ? '#111111' : '#f8fafc', padding: '12px', borderRadius: '10px', border: `1px solid ${border}`, marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '700', color: text }}>{party.name}</div>
                          <div style={{ fontSize: '12px', color: muted }}>
                            👥 {party.partySize} · {party.quotedWait ? `~${party.quotedWait} min wait` : 'No quote'}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromWaitlist(party.id)}
                          style={{ padding: '6px 10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                      {suggestedTables.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: '600', color: muted, marginBottom: '4px' }}>SUGGESTED TABLES:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {suggestedTables.map(table => (
                              <button
                                key={table.id}
                                onClick={() => seatParty(party.id, table.id)}
                                style={{
                                  padding: '6px 10px',
                                  background: table.status === 'available' ? '#10b981' : '#f59e0b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                {table.name} {table.status === 'occupied' ? `(${formatElapsed(table.sinceMs)})` : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ORDER MERGE/MOVE MODAL
          ══════════════════════════════════════════════════════════ */}
      {showOrderMergeModal && orderMergeSource && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowOrderMergeModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>📦 Move/Split Order</div>
              <button onClick={() => setShowOrderMergeModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>
            
            <div style={{ fontSize: '13px', color: muted, lineHeight: 1.5 }}>
              Select a destination table to move the order from <strong>{orderMergeSource.name}</strong>
            </div>

            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>SELECT DESTINATION TABLE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {tablesWithStatus.filter(t => t.id !== orderMergeSource.id).map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      moveOrderToTable(orderMergeSource.activeOrders?.[0]?.id, orderMergeSource.id, t.id);
                      setShowOrderMergeModal(false);
                    }}
                    style={{
                      padding: '12px',
                      background: t.status === 'available' ? '#10b981' : t.status === 'occupied' ? '#f59e0b' : '#6b7280',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: orderMergeTarget?.id === t.id ? 0.7 : 1
                    }}
                  >
                    <div>{t.name}</div>
                    <div style={{ fontSize: '11px', opacity: 0.9 }}>{t.capacity} seats</div>
                  </button>
                ))}
              </div>
            </div>

            {orderMergeSource.activeOrders?.[0]?.items && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>ORDER ITEMS</div>
                <div style={{ background: dm ? '#111111' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${border}` }}>
                  {orderMergeSource.activeOrders[0].items.map((item, i) => (
                    <div key={i} style={{ fontSize: '12px', color: text, marginBottom: '4px' }}>
                      {item.quantity}× {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ALERT SETTINGS MODAL
          ══════════════════════════════════════════════════════════ */}
      {showAlertSettingsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAlertSettingsModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>🔔 Alert Settings</div>
              <button onClick={() => setShowAlertSettingsModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: text, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertSettings.soundEnabled}
                  onChange={e => setAlertSettings(p => ({ ...p, soundEnabled: e.target.checked }))}
                  style={{ cursor: 'pointer' }}
                />
                Enable Sound Alerts
              </label>
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>Play a sound when tables exceed critical threshold</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>CRITICAL THRESHOLD (minutes)</label>
              <input
                type="number"
                value={alertSettings.criticalThreshold}
                onChange={e => setAlertSettings(p => ({ ...p, criticalThreshold: parseInt(e.target.value) || 45 }))}
                min="5"
                max="180"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${border}`, borderRadius: '8px', background: dm ? '#1e1e2e' : '#fff', color: text, fontSize: '14px' }}
              />
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>Alert when table occupied for this many minutes</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>NO-SHOW THRESHOLD (minutes)</label>
              <input
                type="number"
                value={alertSettings.noShowThreshold}
                onChange={e => setAlertSettings(p => ({ ...p, noShowThreshold: parseInt(e.target.value) || 15 }))}
                min="5"
                max="60"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${border}`, borderRadius: '8px', background: dm ? '#1e1e2e' : '#fff', color: text, fontSize: '14px' }}
              />
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>Mark reservation as no-show after this many minutes past time</div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', color: text, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={alertSettings.pushEnabled}
                  onChange={e => setAlertSettings(p => ({ ...p, pushEnabled: e.target.checked }))}
                  style={{ cursor: 'pointer' }}
                />
                Enable Push Notifications
              </label>
              <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>Send push notifications for alerts (requires setup)</div>
            </div>

            <button
              onClick={() => {
                playAlertSound(); // Test sound
                showToast('Alert sound test');
              }}
              style={{ padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              🔊 Test Alert Sound
            </button>

            <button
              onClick={() => setShowAlertSettingsModal(false)}
              style={{ padding: '12px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          AUDIT TRAIL MODAL
          ══════════════════════════════════════════════════════════ */}
      {showAuditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuditModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '80vh', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>📋 Audit Trail</div>
              <button onClick={() => setShowAuditModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {auditTrail.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: muted }}>No audit events recorded</div>
              ) : (
                auditTrail.map(event => (
                  <div key={event.id} style={{ background: dm ? '#111111' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${border}`, marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: text }}>{event.action}</div>
                      <div style={{ fontSize: '11px', color: muted }}>{new Date(event.timestamp).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: muted }}>
                      Actor: {event.actor}
                    </div>
                    <div style={{ fontSize: '11px', color: muted, marginTop: '4px', fontFamily: 'monospace' }}>
                      {JSON.stringify(event.details, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setAuditTrail([]);
                localStorage.removeItem('bakerypos_audit_trail');
                showToast('Audit trail cleared');
              }}
              style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
            >
              Clear Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TABLE NOTES MODAL
          ══════════════════════════════════════════════════════════ */}
      {showNotesModal && notesTable && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowNotesModal(false); }}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '20px', width: '100%', maxWidth: '500px', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: text }}>📝 Notes for {notesTable.name}</div>
              <button onClick={() => setShowNotesModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '8px' }}>SPECIAL REQUESTS / ALLERGIES / NOTES</label>
              <textarea
                value={tableNotes}
                onChange={e => setTableNotes(e.target.value)}
                placeholder="Add any special requests, allergies, or notes for this table..."
                rows={4}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: `1px solid ${border}`, 
                  borderRadius: '8px', 
                  background: dm ? '#1e1e2e' : '#fff', 
                  color: text, 
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => {
                  setTables(prev => prev.map(t => 
                    t.id === notesTable.id ? { ...t, notes: tableNotes } : t
                  ));
                  logAuditEvent('UPDATE_TABLE_NOTES', { 
                    tableId: notesTable.id,
                    tableName: notesTable.name,
                    notes: tableNotes
                  });
                  showToast('Notes saved successfully');
                  setShowNotesModal(false);
                }}
                style={{ flex: 1, padding: '12px', background: accent, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
              >
                Save Notes
              </button>
              <button
                onClick={() => {
                  setTables(prev => prev.map(t => 
                    t.id === notesTable.id ? { ...t, notes: '' } : t
                  ));
                  setTableNotes('');
                  showToast('Notes cleared');
                }}
                style={{ padding: '12px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}
              >
                Clear
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
              <button onClick={() => setShowModal(false)} aria-label="Close modal" style={{ width: '32px', height: '32px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', color: text }}>×</button>
            </div>
            {formAlert && <div style={{ padding: '10px 12px', background: dm ? '#3a1a1a' : '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>⚠️ {formAlert}</div>}
            {[
              { label: 'Table Name / Number', placeholder: 'e.g. T9', key: 'name', type: 'text' },
              { label: 'Seating Capacity',    placeholder: '4',      key: 'capacity', type: 'number', min: 1, max: 50 },
            ].map(({ label, placeholder, key, type, min, max }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: muted, marginBottom: '6px' }}>{label}</label>
                <input
                  type={type} value={formData[key]} placeholder={placeholder} min={min} max={max}
                  onChange={e => { 
                    if (type === 'number') {
                      const value = parseInt(e.target.value) || min;
                      const clampedValue = Math.max(min, Math.min(max, value));
                      setFormData(p => ({ ...p, [key]: clampedValue }));
                    } else {
                      setFormData(p => ({ ...p, [key]: e.target.value }));
                    }
                    setFormAlert('');
                  }}
                  autoFocus={key === 'name'}
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${formAlert && key === 'name' ? '#ef4444' : border}`, borderRadius: '8px', background: dm ? '#252535' : '#fff', color: text, fontSize: sm ? '16px' : '14px', outline: 'none', boxSizing: 'border-box', minHeight: sm ? '48px' : 'auto' }}
                />
                {key === 'capacity' && (
                  <div style={{ fontSize: '11px', color: muted, marginTop: '4px' }}>Capacity must be between {min} and {max} seats</div>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
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
              <button onClick={() => setShowManageModal(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
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
                    <button onClick={() => { setSelectedTable(t); setFormData({ name: t.name, capacity: t.capacity }); setInitialFormData({ name: t.name, capacity: t.capacity }); setFormAlert(''); setShowManageModal(false); setShowModal(true); }} aria-label={`Edit table ${t.name}`} style={{ padding: '5px 10px', background: dm ? '#000000' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>✏️</button>
                    <button onClick={() => { setTableToDelete(t.id); setShowManageModal(false); setShowDeleteConfirm(true); }} aria-label={`Delete table ${t.name}`} style={{ padding: '5px 10px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🗑️</button>
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
              <button onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmDeleteTable} style={{ flex: 1, padding: '11px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          UNMERGE ALL CONFIRM
          ══════════════════════════════════════════════════════════ */}
      {showUnmergeAllConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowUnmergeAllConfirm(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px' }}>🔗</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: text }}>Unmerge All Tables?</div>
            <p style={{ fontSize: '13px', color: muted, margin: 0, lineHeight: 1.5 }}>This will separate all merged tables back to individual tables. This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowUnmergeAllConfirm(false)} style={{ flex: 1, padding: '12px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmUnmergeAll} style={{ flex: 1, padding: '12px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Unmerge All</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          UNSAVED CHANGES CONFIRM
          ══════════════════════════════════════════════════════════ */}
      {showUnsavedChangesConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '16px' }}
          onClick={() => setShowUnsavedChangesConfirm(false)}>
          <div style={{ background: dm ? '#1e1e2e' : '#fff', borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '24px', border: `1px solid ${border}`, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '36px' }}>⚠️</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: text }}>Unsaved Changes</div>
            <p style={{ fontSize: '13px', color: muted, margin: 0, lineHeight: 1.5 }}>You have unsaved changes to this table. Do you want to discard them?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowUnsavedChangesConfirm(false); }} style={{ flex: 1, padding: '12px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Keep Editing</button>
              <button onClick={() => { 
                setShowUnsavedChangesConfirm(false);
                if (pendingModalClose === 'showModal') {
                  setShowModal(false);
                  setFormData(initialFormData);
                }
                setPendingModalClose(null);
              }} style={{ flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Discard</button>
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
              <button onClick={() => setShowDeleteAllConfirm(false)} style={{ flex: 1, padding: '11px', background: dm ? '#2a2a3a' : '#f3f4f6', color: dm ? '#e0e0e0' : '#111111', border: `1px solid ${border}`, borderRadius: '10px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button disabled={deleteAllInput !== 'DELETE ALL'} onClick={() => { setTables([]); saveOccupiedSince({}); setOccupiedSince({}); setShowDeleteAllConfirm(false); }} style={{ flex: 1, padding: '11px', background: deleteAllInput === 'DELETE ALL' ? '#ef4444' : (dm ? '#111111' : '#e5e7eb'), color: deleteAllInput === 'DELETE ALL' ? '#fff' : muted, border: 'none', borderRadius: '10px', fontWeight: '700', cursor: deleteAllInput === 'DELETE ALL' ? 'pointer' : 'not-allowed' }}>Delete All</button>
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
              <button onClick={() => setShowWaiterCalls(false)} aria-label="Close modal" style={{ width: '30px', height: '30px', background: dm ? '#2a2a3a' : '#e5e7eb', border: 'none', borderRadius: '7px', cursor: 'pointer', color: text, fontSize: '16px' }}>×</button>
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

      {/* ══════════════════════════════════════════════════════════
          TOAST/SNACKBAR
          ══════════════════════════════════════════════════════════ */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : toast.type === 'undo' ? '#3b82f6' : '#3b82f6',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '14px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 3000,
          animation: 'fadeSlide 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toast.type === 'success' && '✓'}
          {toast.type === 'error' && '✕'}
          {toast.type === 'info' && 'ℹ'}
          {toast.type === 'undo' && '↩️'}
          {toast.message}
          {toast.type === 'undo' && (
            <button 
              onClick={() => { undoDelete(); setToast(null); }}
              style={{ 
                marginLeft: '12px', 
                padding: '4px 12px', 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                borderRadius: '6px', 
                color: '#fff', 
                fontSize: '12px', 
                fontWeight: '700', 
                cursor: 'pointer' 
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}

    {/* Print-specific CSS for QR modal */}
    <style>{`
      @media print {
        body * {
          visibility: hidden;
        }
        #qr-print-preview,
        #qr-print-preview * {
          visibility: visible;
        }
        #qr-print-preview {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          margin: 0;
          padding: 0;
          box-shadow: none;
        }
      }
    `}</style>

    </div>
  );
}

/* ─── Export with Error Boundary ─────────────────────────────────────── */
export default function TablesWithErrorBoundary(props) {
  return (
    <ErrorBoundary>
      <Tables {...props} />
    </ErrorBoundary>
  );
}
