import React from 'react';
import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { MENU_ITEMS, INIT_ORDERS, INIT_CUSTOMERS, INIT_KDS } from "../data/constants";
import { INIT_TABLES } from "../data/tableConstants";
import { INIT_STAFF } from "../data/staffConstants";
import { INIT_INVENTORY } from "../data/inventoryConstants.js";
import { getSeedExpenses } from "../data/expenseConstants.js";
import { getSeedQRCodes } from "../data/qrConstants.js";
import { INIT_PRODUCTION_BATCHES } from "../data/productionConstants.js";
import { INIT_DRIVERS } from "../data/deliveryConstants.js";
import { applyTheme, getTheme } from "../styles/theme";
import Layout from "./layout/Layout";
import ErrorBoundary from "./common/ErrorBoundary";
import { ImportExportPermissions } from "../utils/permissionService.js";
import { createImportAuditLog, createPermissionDeniedAuditLog } from "../domain/auditLogModel.js";
import { getCurrentUserId } from "../utils/authService.js";
import { isSetupIncomplete, isDemoMode, isProductionMode, getAppMode, setAppMode, APP_MODES } from "../utils/appMode.js";
import { isFeatureEnabled } from "../utils/featureConfig.js";
import SystemControlCenter from "./settings/SystemControlCenter";
import DailyArchive from "../utils/DailyArchive.js";
import { useSecurity } from "../hooks/useSecurity.js";

// Lazy-loaded components
const WelcomeScreen = lazy(() => import("./setup/WelcomeScreen"));
const SetupWizard = lazy(() => import("./setup/SetupWizard"));
const Dashboard = lazy(() => import("./dashboard/Dashboard"));
const Orders = lazy(() => import("./orders/Orders"));
const Kitchen = lazy(() => import("./kitchen/Kitchen"));
const CRM = lazy(() => import("./crm/CRM"));
const AnalyticsReports = lazy(() => import("./analytics/AnalyticsReports"));
const Menu = lazy(() => import("./menu/Menu"));
const Inventory = lazy(() => import("./inventory/Inventory"));
const Staff = lazy(() => import("./staff/Staff"));
const Tables = lazy(() => import("./tables/Tables"));
const Settings = lazy(() => import("./settings/Settings"));
const Delivery = lazy(() => import("./delivery/Delivery"));
const Expenses = lazy(() => import("./expenses/Expenses"));
const QROrdering = lazy(() => import("./qr/QROrdering"));
const Production = lazy(() => import("./production/Production"));
const RouteTracking = lazy(() => import("./tracking/RouteTracking"));
const PurchasingDesk = lazy(() => import("./purchasing/PurchasingDesk"));
const Documents = lazy(() => import("./documents/Documents"));
const BackupCenter = lazy(() => import("./backup/BackupCenter"));
const OperationsDashboard = lazy(() => import("./operations/OperationsDashboard"));
const Workflows = lazy(() => import("./workflows/Workflows"));
const OperationalInbox = lazy(() => import("./notifications/OperationalInbox"));
const IntelligenceDashboard = lazy(() => import("./intelligence/IntelligenceDashboard"));
const SystemHealthDashboard = lazy(() => import("./health/SystemHealthDashboard"));
const SecurityCenter = lazy(() => import("./security/SecurityCenter"));
const ActivityFeed = lazy(() => import("./notifications/ActivityFeed"));

// --- Domain normalizers ---
// Each model exposes a normalizeX function that validates/coerces a single record.
// normalizeArray falls back to identity pass-through for any null normalizer entry.
import { normalizeOrder }     from "../domain/orderModel";
import { normalizeKdsTicket } from "../domain/kdsModel";
import { normalizeCustomer }  from "../domain/normalize";
import { normalizeStaff }    from "../domain/staffModel";
import { normalizeTable }    from "../domain/tableModel";

// --- Data mode boundary ---
// demo mode: state seeded from in-file demo constants, never persisted.
// local mode: state seeded from/persisted to localStorage.
// future modes (Firebase/Rust API) can sit behind this same state boundary.
const DATA_MODE = (import.meta.env.VITE_BREWCRM_MODE === "local") ? "local" : "demo";
const isLocalMode = DATA_MODE === "local";

const LOCAL_PREFIX = "brewcrm_local_";

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function loadLocalCollection(key, fallback) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (raw === null) return fallback;
    const parsed = safeParse(raw, undefined);
    if (parsed === undefined) {
      if (import.meta.env.DEV) console.warn(`[BrewCRM] Corrupted localStorage JSON for "${key}", resetting to fallback`);
      return fallback;
    }
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      if (import.meta.env.DEV) console.warn(`[BrewCRM] Non-array localStorage data for "${key}", resetting to fallback`);
      return fallback;
    }
    return parsed;
  } catch (err) {
    if (import.meta.env.DEV) console.warn(`[BrewCRM] Failed to load localStorage collection "${key}"`, err);
    return fallback;
  }
}

function saveLocalCollection(key, value) {
  try {
    if (value === undefined) return;
    if (!Array.isArray(value)) {
      if (import.meta.env.DEV) console.warn(`[BrewCRM] Skipped saving non-array collection "${key}"`);
      return;
    }
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    // QuotaExceededError must surface even in production — silent data loss is unacceptable.
    if (import.meta.env.DEV) console.warn(`[BrewCRM] Failed to save localStorage collection "${key}"`, err);
    // Fire a custom event so any mounted UI layer can show a persistent warning banner.
    try {
      window.dispatchEvent(new CustomEvent("brewcrm:storage-error", {
        detail: { key, name: err?.name, message: err?.message }
      }));
    } catch { /* window unavailable in SSR — ignore */ }
  }
}

function resetLocalCollection(key) {
  try {
    localStorage.removeItem(LOCAL_PREFIX + key);
  } catch {
    // ignore
  }
}

const LOCAL_COLLECTION_KEYS = ["orders", "customers", "kdsCards", "menuItems", "tables", "staff", "deliveryOrders", "inventory", "expenses", "qrCodes", "productionBatches", "drivers", "routes", "guestSessions", "waiterCalls", "suppliers", "purchaseOrders", "documents", "notifications", "workflows", "workflowExecutions", "workflowTemplates", "workflowVersions", "incidents", "approvals", "timelineEvents", "automationRules"];

const normalizeArray = (items, normalizer, collectionName) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      try {
        return normalizer ? normalizer(item) : item;
      } catch (err) {
        if (import.meta.env.DEV) console.warn(`[BrewCRM] Invalid ${collectionName} record skipped`, err, item);
        return null;
      }
    })
    .filter(Boolean);
};

export default function BrewCRM() {
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem("brewcrm_tab");
      return saved || "dashboard";
    } catch {
      return "dashboard";
    }
  });
  const [showSetupWizard, setShowSetupWizard] = useState(() => {
    const visited = localStorage.getItem('cafeos_visited');
    return visited && getAppMode() === APP_MODES.SETUP;
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    // Show welcome screen if user hasn't visited before
    return !localStorage.getItem('cafeos_visited');
  });
  const appMode = getAppMode();
  
  const [orders, setOrders] = useState(() => {
    let initialOrders = isLocalMode
      ? normalizeArray(loadLocalCollection("orders", []), normalizeOrder, "orders")
      : normalizeArray(INIT_ORDERS, normalizeOrder, "orders");
    
    const rolloverDate = DailyArchive.checkDayRollover();
    if (rolloverDate) {
      DailyArchive.archiveDay(rolloverDate, initialOrders);
      initialOrders = initialOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
      if (isLocalMode) {
        try { localStorage.setItem("cafeos_orders", JSON.stringify(initialOrders)); } catch {
          if (import.meta.env.DEV) console.warn('[BrewCRM] Failed to persist orders after rollover');
        }
      }
      DailyArchive.markTodayAsActive();
    } else if (!DailyArchive.getLastActiveDate()) {
      DailyArchive.markTodayAsActive();
    }
    return initialOrders;
  });
  const [customers, setCustomers] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("customers", []), normalizeCustomer, "customers")
    : normalizeArray(INIT_CUSTOMERS, normalizeCustomer, "customers"));
  const [kdsCards, setKdsCards] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("kdsCards", []), normalizeKdsTicket, "kdsCards")
    : normalizeArray(INIT_KDS, normalizeKdsTicket, "kdsCards"));
  const [menuItems, setMenuItems] = useState(() => {
    const starterMenu = MENU_ITEMS.map(m => ({ ...m, active: true, eightySixed: false }));
    const raw = isLocalMode ? loadLocalCollection("menuItems", starterMenu) : starterMenu;
    return Array.isArray(raw) ? raw : starterMenu;
  });
  const [tables, setTables] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("tables", []), normalizeTable, "tables")
    : normalizeArray(INIT_TABLES, normalizeTable, "tables"));
  const [staff, setStaff] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("staff", []), normalizeStaff, "staff")
    : normalizeArray(INIT_STAFF, normalizeStaff, "staff"));
  const [deliveryOrders, setDeliveryOrders] = useState(() => isLocalMode ? loadLocalCollection("deliveryOrders", []) : []);
  const [inventory, setInventory] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("inventory", []), null, "inventory")
    : normalizeArray(INIT_INVENTORY, null, "inventory"));
  const [expenses, setExpenses] = useState(() => isLocalMode
    ? loadLocalCollection("expenses", getSeedExpenses())
    : getSeedExpenses());
  const [qrCodes, setQRCodes] = useState(() => isLocalMode
    ? loadLocalCollection("qrCodes", getSeedQRCodes())
    : getSeedQRCodes());
  const [productionBatches, setProductionBatches] = useState(() => isLocalMode
    ? loadLocalCollection("productionBatches", INIT_PRODUCTION_BATCHES)
    : INIT_PRODUCTION_BATCHES);
  const [drivers, setDrivers] = useState(() => isLocalMode
    ? loadLocalCollection("drivers", INIT_DRIVERS)
    : INIT_DRIVERS);
  const [routes, setRoutes] = useState(() => isLocalMode
    ? loadLocalCollection("routes", [])
    : []);
  const [guestSessions, setGuestSessions] = useState(() => isLocalMode
    ? loadLocalCollection("guestSessions", [])
    : []);
  const [waiterCalls, setWaiterCalls] = useState(() => isLocalMode
    ? loadLocalCollection("waiterCalls", [])
    : []);
  const [suppliers, setSuppliers] = useState(() => isLocalMode
    ? loadLocalCollection("suppliers", [])
    : []);
  const [purchaseOrders, setPurchaseOrders] = useState(() => isLocalMode
    ? loadLocalCollection("purchaseOrders", [])
    : []);
  const [waitlist, setWaitlist] = useState(() => isLocalMode
    ? loadLocalCollection("waitlist", [])
    : []);
  const [documents, setDocuments] = useState(() => isLocalMode
    ? loadLocalCollection("documents", [])
    : []);
  const [notifications, setNotifications] = useState(() => isLocalMode
    ? loadLocalCollection("notifications", [])
    : []);
  const [workflows, setWorkflows] = useState(() => isLocalMode
    ? loadLocalCollection("workflows", [])
    : []);
  const [workflowExecutions, setWorkflowExecutions] = useState(() => isLocalMode
    ? loadLocalCollection("workflowExecutions", [])
    : []);
  const [workflowTemplates, setWorkflowTemplates] = useState(() => isLocalMode
    ? loadLocalCollection("workflowTemplates", [])
    : []);
  const [workflowVersions, setWorkflowVersions] = useState(() => isLocalMode
    ? loadLocalCollection("workflowVersions", [])
    : []);
  const [incidents, setIncidents] = useState(() => isLocalMode
    ? loadLocalCollection("incidents", [])
    : []);
  const [approvals, setApprovals] = useState(() => isLocalMode
    ? loadLocalCollection("approvals", [])
    : []);
  const [timelineEvents, setTimelineEvents] = useState(() => isLocalMode
    ? loadLocalCollection("timelineEvents", [])
    : []);
  const [automationRules, setAutomationRules] = useState(() => isLocalMode
    ? loadLocalCollection("automationRules", [])
    : []);
  const [theme, setTheme] = useState(() => getTheme());
  const [storageError, setStorageError] = useState(null);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("brewcrm_settings");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const { role, setRole, canSeeTab, ROLES } = useSecurity();

  const handleDemoMode = useCallback(() => {
    setAppMode(APP_MODES.DEMO);
    localStorage.setItem('cafeos_visited', 'true');
    setShowWelcome(false);
    setShowSetupWizard(false);
  }, []);

  const handleSetupStart = useCallback(() => {
    localStorage.setItem('cafeos_visited', 'true');
    setAppMode(APP_MODES.SETUP);
    setShowWelcome(false);
    setShowSetupWizard(true);
  }, []);

  const handleExitSetup = useCallback(() => {
    // Force show welcome screen when exiting setup
    localStorage.removeItem('cafeos_visited');
    setAppMode(APP_MODES.SETUP);
    setShowSetupWizard(false);
    setShowWelcome(true);
  }, []);

  const handleSetupComplete = useCallback(() => {
    setAppMode(APP_MODES.PRODUCTION);
    setShowSetupWizard(false);
    setTab("dashboard");
  }, []);

  const handleRestoreBackup = useCallback(() => {
    localStorage.setItem('cafeos_visited', 'true');
    setShowWelcome(false);
    setTab("backup");
  }, []);

  // Listen for quota/storage errors dispatched by saveLocalCollection so the UI
  // can surface a warning without the error silently vanishing.
  useEffect(() => {
    const handler = (e) => setStorageError(e.detail);
    window.addEventListener("brewcrm:storage-error", handler);
    return () => window.removeEventListener("brewcrm:storage-error", handler);
  }, []);

  // Persist tab to localStorage so it survives refresh
  useEffect(() => {
    try {
      localStorage.setItem("brewcrm_tab", tab);
    } catch {
      // ignore storage errors
    }
  }, [tab]);

  useEffect(() => { if (isLocalMode) saveLocalCollection("orders", orders); }, [orders]);

  // ── QR order polling ──────────────────────────────────────────────────────
  // The guest page always writes to localStorage (even in demo mode).
  // Poll every 2s and inject new orders/kdsCards/tables into React state.
  const lastKnownOrderCount = useRef(0);
  useEffect(() => {
    // Table status can flip (occupied/cleared) independently of whether the orders array
    // grew this tick, so it gets its own always-run sync instead of living inside the
    // orders-growth gate below. Falls back to matching by table `number` in case a table's
    // id in the guest page's copy of `tables` ever diverges from BrewCRM's normalized copy —
    // unlike orders/kdsCards (appended unconditionally, no id match required), this block
    // previously only ever *updated* an existing table by id, so a mismatch here meant it
    // silently did nothing while orders/kdsCards kept working fine.
    const syncTables = () => {
      try {
        const tablesRaw = localStorage.getItem(LOCAL_PREFIX + "tables");
        if (!tablesRaw) return;
        const tablesStored = JSON.parse(tablesRaw);
        if (!Array.isArray(tablesStored) || tablesStored.length === 0) return;
        setTables(prev => prev.map(t => {
          const updated = tablesStored.find(s => s.id === t.id) || tablesStored.find(s => String(s.number) === String(t.number));
          return updated ? { ...t, status: updated.status, currentOrderId: updated.currentOrderId } : t;
        }));
      } catch { /* ignore parse/storage errors */ }
    };

    const poll = () => {
      try {
        const raw = localStorage.getItem(LOCAL_PREFIX + "orders");
        if (!raw) { syncTables(); return; }
        const stored = JSON.parse(raw);
        if (!Array.isArray(stored)) { syncTables(); return; }
        // Only act on orders/kdsCards when there are MORE orders than we last saw
        if (stored.length > lastKnownOrderCount.current) {
          lastKnownOrderCount.current = stored.length;

          // Find only the new QR orders (don't stomp on the management app's state)
          const newQROrders = stored.filter(o => o.source === 'QR_ORDERING');
          if (newQROrders.length > 0) {
            setOrders(prev => {
              const existingIds = new Set(prev.map(o => o.id));
              const fresh = newQROrders.filter(o => !existingIds.has(o.id));
              if (fresh.length === 0) return prev;
              const normalized = normalizeArray(fresh, normalizeOrder, "orders");
              return [...normalized, ...prev];
            });

            // Sync KDS tickets for new QR orders
            const kdsRaw = localStorage.getItem(LOCAL_PREFIX + "kdsCards");
            if (kdsRaw) {
              const kdsStored = JSON.parse(kdsRaw);
              if (Array.isArray(kdsStored)) {
                const newQRTickets = kdsStored.filter(c => c.source === 'QR_ORDERING');
                if (newQRTickets.length > 0) {
                  setKdsCards(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const fresh = newQRTickets.filter(c => !existingIds.has(c.id));
                    if (fresh.length === 0) return prev;
                    return [...normalizeArray(fresh, normalizeKdsTicket, "kdsCards"), ...prev];
                  });
                }
              }
            }
          }
        }

        // Always check table status, independent of whether the orders count moved this tick.
        syncTables();
      } catch { /* ignore parse/storage errors */ }
    };

    poll(); // run immediately on mount
    const intervalId = setInterval(poll, 2000);
    return () => clearInterval(intervalId);
   
  }, []);
  useEffect(() => { if (isLocalMode) saveLocalCollection("customers", customers); }, [customers]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("kdsCards", kdsCards); }, [kdsCards]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("menuItems", menuItems); }, [menuItems]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("tables", tables); }, [tables]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("staff", staff); }, [staff]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("deliveryOrders", deliveryOrders); }, [deliveryOrders]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("inventory", inventory); }, [inventory]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("expenses", expenses); }, [expenses]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("qrCodes", qrCodes); }, [qrCodes]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("productionBatches", productionBatches); }, [productionBatches]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("drivers", drivers); }, [drivers]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("routes", routes); }, [routes]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("guestSessions", guestSessions); }, [guestSessions]);
  useEffect(() => saveLocalCollection("waiterCalls", waiterCalls), [waiterCalls]);
  useEffect(() => saveLocalCollection("suppliers", suppliers), [suppliers]);
  useEffect(() => saveLocalCollection("purchaseOrders", purchaseOrders), [purchaseOrders]);
  useEffect(() => saveLocalCollection("waitlist", waitlist), [waitlist]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("documents", documents); }, [documents]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("workflows", workflows); }, [workflows]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("workflowExecutions", workflowExecutions); }, [workflowExecutions]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("workflowTemplates", workflowTemplates); }, [workflowTemplates]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("workflowVersions", workflowVersions); }, [workflowVersions]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("incidents", incidents); }, [incidents]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("approvals", approvals); }, [approvals]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("timelineEvents", timelineEvents); }, [timelineEvents]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("automationRules", automationRules); }, [automationRules]);

  const toggleTheme = useCallback(() => {
    applyTheme();
    const next = getTheme();
    setTheme(next);
    localStorage.setItem("brew-theme", next);
  }, []);

  const newOrderCount = useMemo(() => orders.filter(o => o.status === "NEW").length, [orders]);
  const urgentKds    = useMemo(() => kdsCards.filter(c => c.urgency === "urgent").length, [kdsCards]);

  const exportLocalData = useCallback(() => {
    return JSON.stringify({
      app: "BrewCRM",
      version: 2,
      exportedAt: new Date().toISOString(),
      dataMode: DATA_MODE,
      collections: { orders, customers, kdsCards, menuItems, tables, staff, deliveryOrders, inventory, expenses, qrCodes, productionBatches, drivers, routes, guestSessions, waiterCalls, suppliers, purchaseOrders, documents, workflows, workflowExecutions, workflowTemplates, workflowVersions, incidents, approvals, timelineEvents, automationRules }
    }, null, 2);
  }, [orders, customers, kdsCards, menuItems, tables, staff, deliveryOrders, inventory, expenses, qrCodes, productionBatches, drivers, routes, guestSessions, waiterCalls, suppliers, purchaseOrders, documents, workflows, workflowExecutions, workflowTemplates, workflowVersions, incidents, approvals, timelineEvents, automationRules]);

  // jsonText must be a JSON string. Validates shape defensively, ignores unknown
  // collection keys, normalizes known collections before they enter state, and
  // only persists to localStorage when local mode is active.
  const importLocalData = useCallback((jsonText) => {
    // Check permission before allowing import
    const permissionCheck = ImportExportPermissions.canImport();
    if (!permissionCheck.allowed) {
      // Log permission denial (no notification system in BrewCRM)
      const denialLog = createPermissionDeniedAuditLog({
        userId: getCurrentUserId(),
        action: 'IMPORT_ATTEMPT',
        details: { requiredPermission: permissionCheck.requiredPermission }
      });
      console.warn('[BrewCRM] Import permission denied:', denialLog);
      
      return { ok: false, error: `Permission denied: ${permissionCheck.requiredPermission} required` };
    }
    
    if (typeof jsonText !== "string") {
      return { ok: false, error: "Import input must be a JSON string" };
    }
    const parsed = safeParse(jsonText, undefined);
    if (parsed === undefined || parsed === null || typeof parsed !== "object") {
      return { ok: false, error: "Invalid import file: could not parse JSON" };
    }
    if (parsed.app !== undefined && parsed.app !== "BrewCRM") {
      return { ok: false, error: `Invalid import file: unexpected app "${parsed.app}"` };
    }
    if (!parsed.collections || typeof parsed.collections !== "object" || Array.isArray(parsed.collections)) {
      return { ok: false, error: "Invalid import file: missing collections" };
    }
    const c = parsed.collections;
    const setters = {
      orders: setOrders,
      customers: setCustomers,
      kdsCards: setKdsCards,
      menuItems: setMenuItems,
      tables: setTables,
      staff: setStaff,
      deliveryOrders: setDeliveryOrders,
      inventory: setInventory,
      expenses: setExpenses,
      qrCodes: setQRCodes,
      productionBatches: setProductionBatches,
      drivers: setDrivers,
      routes: setRoutes,
      guestSessions: setGuestSessions,
      waiterCalls: setWaiterCalls,
      suppliers: setSuppliers,
      purchaseOrders: setPurchaseOrders,
      documents: setDocuments,
      workflows: setWorkflows,
      workflowExecutions: setWorkflowExecutions,
      workflowTemplates: setWorkflowTemplates,
      workflowVersions: setWorkflowVersions,
      incidents: setIncidents,
      approvals: setApprovals,
      timelineEvents: setTimelineEvents,
      automationRules: setAutomationRules
    };
    // Route to the appropriate normalizer so imported data is validated
    // through the same codepath as initial load.
    const normalizerMap = {
      orders: normalizeOrder,
      customers: normalizeCustomer,
      kdsCards: normalizeKdsTicket,
      tables: normalizeTable,
      staff: normalizeStaff,
    };
    const imported = [];
    const skipped = [];
    try {
      Object.keys(c).forEach((key) => {
        const setter = setters[key];
        if (!setter) {
          skipped.push(key);
          return;
        }
        if (!Array.isArray(c[key])) {
          skipped.push(key);
          return;
        }
        const normalized = normalizeArray(c[key], normalizerMap[key] ?? null, key);
        setter(normalized);
        imported.push(key);
        if (isLocalMode) saveLocalCollection(key, normalized);
      });
      
      // Log successful import (no notification system in BrewCRM)
      const importLog = createImportAuditLog({
        userId: getCurrentUserId(),
        details: { importedCollections: imported, skippedCollections: skipped }
      });
      console.log('[BrewCRM] Import successful:', importLog);
      
      return { ok: true, imported, skipped };
    } catch (e) {
      return { ok: false, error: e?.message || "Import failed" };
    }
  }, []);

  // Returns a diagnostic-only summary: counts and approx sizes per collection,
  // plus any pending-queue key that happens to exist under the local prefix.
  const getStorageSnapshot = useCallback(() => {
    const collections = {};
    let totalApproxBytes = 0;
    let pendingQueueCount = null;

    LOCAL_COLLECTION_KEYS.forEach((key) => {
      let raw;
      try {
        raw = localStorage.getItem(LOCAL_PREFIX + key);
      } catch {
        raw = null;
      }
      const parsed = raw === null ? null : safeParse(raw, null);
      const count = Array.isArray(parsed) ? parsed.length : 0;
      const approxBytes = raw ? raw.length : 0;
      totalApproxBytes += approxBytes;
      collections[key] = { present: raw !== null, count, approxBytes };
    });

    try {
      const queueRaw = localStorage.getItem(LOCAL_PREFIX + "pendingQueue");
      if (queueRaw !== null) {
        const queueParsed = safeParse(queueRaw, null);
        pendingQueueCount = Array.isArray(queueParsed) ? queueParsed.length : null;
      }
    } catch {
      pendingQueueCount = null;
    }

    return {
      dataMode: DATA_MODE,
      isDemoMode,
      isLocalMode,
      collections,
      totalApproxBytes,
      pendingQueueCount
    };
  }, []);

  // Snapshots current in-memory state into the local-mode localStorage keys
  // without switching env mode at runtime. The app must be reloaded with
  // VITE_BREWCRM_MODE=local for this saved data to be picked up as the source of truth.
  const convertCurrentDemoToLocalData = useCallback(() => {
    try {
      const snapshotCollections = { orders, customers, kdsCards, menuItems, tables, staff, deliveryOrders, inventory, expenses, qrCodes, productionBatches, drivers, routes, guestSessions, waiterCalls, suppliers, purchaseOrders, documents, workflows, workflowExecutions, workflowTemplates, workflowVersions, incidents, approvals, timelineEvents, automationRules };
      Object.entries(snapshotCollections).forEach(([key, value]) => {
        saveLocalCollection(key, Array.isArray(value) ? value : []);
      });
      return {
        ok: true,
        message: "Demo data saved to local storage. Restart/reload the app with VITE_BREWCRM_MODE=local to use it as local data."
      };
    } catch (e) {
      return { ok: false, error: e?.message || "Failed to convert demo data to local data" };
    }
  }, [orders, customers, kdsCards, menuItems, tables, staff, deliveryOrders, inventory, expenses, qrCodes, productionBatches, drivers, routes, guestSessions, waiterCalls, suppliers, purchaseOrders, documents, workflows, workflowExecutions, workflowTemplates, workflowVersions, incidents, approvals, timelineEvents, automationRules]);

  // Clears only BrewCRM local collection keys and resets in-memory state to
  // empty arrays. Theme and unrelated localStorage are left untouched.
  const resetLocalDataToEmpty = useCallback(() => {
    try {
      LOCAL_COLLECTION_KEYS.forEach(resetLocalCollection);
      const emptyMenu = MENU_ITEMS.map(m => ({ ...m, active: true, eightySixed: false }));
      setOrders([]);
      setCustomers([]);
      setKdsCards([]);
      setMenuItems(emptyMenu);
      setTables([]);
      setStaff([]);
      setDeliveryOrders([]);
      setInventory([]);
      setExpenses([]);
      setQRCodes([]);
      setProductionBatches([]);
      setDrivers([]);
      setRoutes([]);
      setGuestSessions([]);
      setWaiterCalls([]);
      setSuppliers([]);
      setPurchaseOrders([]);
      setDocuments([]);
      setWorkflows([]);
      setWorkflowExecutions([]);
      setWorkflowTemplates([]);
      setWorkflowVersions([]);
      setIncidents([]);
      setApprovals([]);
      setTimelineEvents([]);
      setAutomationRules([]);
      // NOTE: No manual saveLocalCollection calls here.
      // The useEffect hooks already persist to localStorage when isLocalMode is true.
      // Saving here would write stale values before React commits the new state.
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e?.message || "Failed to reset local data" };
    }
  }, []);

  // Thin alias kept for backwards-compat — declared AFTER resetLocalDataToEmpty.
  const clearLocalData = useCallback(() => {
    resetLocalDataToEmpty();
  }, [resetLocalDataToEmpty]);

  // Seeds starter data (menu, tables, inventory) with no fake history.
  const seedLocalStarterData = useCallback(() => {
    try {
      const starterMenu = MENU_ITEMS.map(m => ({ ...m, active: true, eightySixed: false }));
      const starterTables = normalizeArray(INIT_TABLES, normalizeTable, "tables");
      const starterInventory = normalizeArray(INIT_INVENTORY, null, "inventory");

      setOrders([]);
      setCustomers([]);
      setKdsCards([]);
      setMenuItems(starterMenu);
      setTables(starterTables);
      setStaff([]);
      setDeliveryOrders([]);
      setInventory(starterInventory);
      setExpenses(getSeedExpenses());
      setQRCodes(getSeedQRCodes());
      setProductionBatches(INIT_PRODUCTION_BATCHES);
      setDrivers(INIT_DRIVERS);
      setRoutes([]);
      setGuestSessions([]);
      setWaiterCalls([]);
      setSuppliers([]);
      setPurchaseOrders([]);

      // useEffect hooks handle localStorage persistence — no manual saves needed here.
      return {
        ok: true,
        seeded: ["menuItems", "tables", "inventory", "expenses", "qrCodes", "drivers"],
        empty: ["orders", "customers", "kdsCards", "staff", "deliveryOrders", "routes", "guestSessions", "waiterCalls", "suppliers", "purchaseOrders"]
      };
    } catch (e) {
      return { ok: false, error: e?.message || "Failed to seed starter data" };
    }
  }, []);

  const dataTools = {
    dataMode: DATA_MODE,
    isDemoMode,
    isLocalMode,
    exportLocalData,
    importLocalData,
    clearLocalData,
    resetLocalDataToEmpty,
    seedLocalStarterData,
    convertCurrentDemoToLocalData,
    getStorageSnapshot,
    storageError,
    clearStorageError: () => setStorageError(null),
  };

  useEffect(() => {
    if (import.meta.env.DEV) {
      window.__BREWCRM_DEBUG__ = {
        dataMode: DATA_MODE,
        getStorageSnapshot,
        exportLocalData
      };
    }
  }, [getStorageSnapshot, exportLocalData]);

  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>}>
          {showWelcome && (
            <WelcomeScreen
              onDemoMode={handleDemoMode}
              onSetupStart={handleSetupStart}
              onRestoreBackup={handleRestoreBackup}
            />
          )}
          
          {showSetupWizard && (
            <SetupWizard
              settings={settings}
              onSetupComplete={handleSetupComplete}
              onCancel={handleExitSetup}
            />
          )}
        </Suspense>
      </ErrorBoundary>
      
      {!showWelcome && !showSetupWizard && (
          <Layout 
          tab={tab} 
          setTab={setTab} 
          newOrderCount={newOrderCount} 
          urgentKds={urgentKds} 
          theme={theme} 
          toggleTheme={toggleTheme}
          appMode={appMode}
          role={role}
          setRole={setRole}
          canSeeTab={canSeeTab}
        >
          <ErrorBoundary>
            <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>}>
              {canSeeTab("dashboard") && tab === "dashboard" && isFeatureEnabled('dashboard') && <Dashboard orders={orders} customers={customers} inventory={inventory} kdsCards={kdsCards} tables={tables} staff={staff} waitlist={waitlist} onNavigate={setTab} />}
              {canSeeTab("orders") && tab === "orders" && isFeatureEnabled('orders') && <Orders orders={orders} setOrders={setOrders} kdsCards={kdsCards} setKdsCards={setKdsCards} menuItems={menuItems} tables={tables} setTables={setTables} staff={staff} discounts={[]} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} documents={documents} setDocuments={setDocuments} notifications={notifications} setNotifications={setNotifications} shifts={[]} setShifts={() => {}} currentShift={null} />}
              {canSeeTab("kitchen") && tab === "kitchen" && isFeatureEnabled('kitchen') && <Kitchen kdsCards={kdsCards} setKdsCards={setKdsCards} orders={orders} setOrders={setOrders} tables={tables} notifications={notifications} setNotifications={setNotifications} shifts={[]} setShifts={() => {}} />}
              {canSeeTab("crm") && tab === "crm" && isFeatureEnabled('crm') && <CRM customers={customers} setCustomers={setCustomers} orders={orders} kdsCards={kdsCards} tables={tables} documents={documents} setDocuments={setDocuments} notifications={notifications} setNotifications={setNotifications} />}
              {canSeeTab("analytics") && tab === "analytics" && isFeatureEnabled('analytics') && <AnalyticsReports orders={orders} customers={customers} staff={staff} inventory={inventory} tables={tables} deliveryOrders={deliveryOrders} drivers={drivers} suppliers={suppliers} purchaseOrders={purchaseOrders} productionBatches={productionBatches} documents={documents} />}
              {canSeeTab("menu") && tab === "menu" && isFeatureEnabled('menu') && <Menu menuItems={menuItems} setMenuItems={setMenuItems} />}
              {canSeeTab("inventory") && tab === "inventory" && isFeatureEnabled('inventory') && <Inventory inventory={inventory} setInventory={setInventory} />}
              {canSeeTab("staff") && tab === "staff" && isFeatureEnabled('staff') && <Staff staff={staff} setStaff={setStaff} orders={orders} tables={tables} notifications={notifications} setNotifications={setNotifications} />}
              {canSeeTab("tables") && tab === "tables" && isFeatureEnabled('tables') && <Tables tables={tables} setTables={setTables} orders={orders} kdsCards={kdsCards} staff={staff} waitlist={waitlist} setWaitlist={setWaitlist} />}
              {canSeeTab("delivery") && tab === "delivery" && isFeatureEnabled('delivery') && <Delivery deliveryOrders={deliveryOrders} setDeliveryOrders={setDeliveryOrders} orders={orders} setOrders={setOrders} kdsCards={kdsCards} setKdsCards={setKdsCards} menuItems={menuItems} tables={tables} documents={documents} setDocuments={setDocuments} staff={staff} notifications={notifications} setNotifications={setNotifications} />}
              {canSeeTab("qr") && tab === "qr" && isFeatureEnabled('qrOrdering') && <QROrdering qrCodes={qrCodes} setQRCodes={setQRCodes} tables={tables} orders={orders} guestSessions={guestSessions} setGuestSessions={setGuestSessions} waiterCalls={waiterCalls} setWaiterCalls={setWaiterCalls} />}
              {canSeeTab("production") && tab === "production" && isFeatureEnabled('production') && <Production productionBatches={productionBatches} setProductionBatches={setProductionBatches} menuItems={menuItems} />}
              {canSeeTab("tracking") && tab === "tracking" && isFeatureEnabled('routeTracking') && <RouteTracking deliveryOrders={deliveryOrders} setDeliveryOrders={setDeliveryOrders} drivers={drivers} setDrivers={setDrivers} />}
              {canSeeTab("purchasing") && tab === "purchasing" && isFeatureEnabled('purchasing') && <PurchasingDesk suppliers={suppliers} setSuppliers={setSuppliers} purchaseOrders={purchaseOrders} setPurchaseOrders={setPurchaseOrders} inventory={inventory} expenses={expenses} setExpenses={setExpenses} />}
              {canSeeTab("documents") && tab === "documents" && isFeatureEnabled('documents') && <Documents documents={documents} setDocuments={setDocuments} orders={orders} customers={customers} staff={staff} />}
              {canSeeTab("expenses") && tab === "expenses" && isFeatureEnabled('expenses') && <Expenses expenses={expenses} setExpenses={setExpenses} />}
              {canSeeTab("operations") && tab === "operations" && isFeatureEnabled('operationsDashboard') && <OperationsDashboard tables={tables} orders={orders} staff={staff} kdsCards={kdsCards} />}
              {canSeeTab("workflows") && tab === "workflows" && isFeatureEnabled('workflows') && <Workflows workflows={workflows} setWorkflows={setWorkflows} executions={workflowExecutions} setExecutions={setWorkflowExecutions} templates={workflowTemplates} setTemplates={setWorkflowTemplates} versions={workflowVersions} setVersions={setWorkflowVersions} incidents={incidents} setIncidents={setIncidents} approvals={approvals} setApprovals={setApprovals} timelineEvents={timelineEvents} setTimelineEvents={setTimelineEvents} automationRules={automationRules} setAutomationRules={setAutomationRules} staff={staff} tables={tables} equipment={[]} inventory={inventory} suppliers={suppliers} />}
              {canSeeTab("backup") && tab === "backup" && isFeatureEnabled('backup') && <BackupCenter dataTools={dataTools} businessDetails={{ name: settings?.cafeName || "CafeOS", branchId: settings?.defaultBranch }} />}
              {tab === "settings" && <SystemControlCenter theme={theme} toggleTheme={toggleTheme} dataTools={dataTools} />}
              {canSeeTab("notifications") && tab === "notifications" && <OperationalInbox notifications={notifications} setNotifications={setNotifications} currentUser={{ id: 'OWNER-001', name: settings?.ownerName || 'Owner', role: role?.toUpperCase() || 'OWNER' }} />}
              {canSeeTab("intelligence") && tab === "intelligence" && <IntelligenceDashboard />}
              {canSeeTab("health") && tab === "health" && <SystemHealthDashboard />}
              {canSeeTab("activity") && tab === "activity" && <ActivityFeed activity={[]} currentBranch={{ id: 'BRANCH-001', name: settings?.defaultBranchName || 'Main Branch' }} />}
              {canSeeTab("security") && tab === "security" && <SecurityCenter />}
            </Suspense>
          </ErrorBoundary>
        </Layout>
      )}
    </>
  );
}
