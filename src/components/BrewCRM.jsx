import { useState, useCallback, useEffect, useMemo } from "react";
import { MENU_ITEMS, INIT_ORDERS, INIT_CUSTOMERS, INIT_KDS } from "../data/constants";
import { INIT_TABLES } from "../data/tableConstants";
import { INIT_STAFF } from "../data/staffConstants";
import { INIT_DISCOUNTS } from "../data/discountConstants";
import { INIT_INVENTORY } from "../data/inventoryConstants.js";
import { applyTheme, getTheme } from "../styles/theme";
import Orders from "./orders/Orders";
import Kitchen from "./kitchen/Kitchen";
import CRM from "./crm/CRM";
import Analytics from "./analytics/Analytics";
import Menu from "./menu/Menu";
import Inventory from "./inventory/Inventory";
import Staff from "./staff/Staff";
import Tables from "./tables/Tables";
import Discounts from "./discounts/Discounts";
import Settings from "./settings/Settings";
import Delivery from "./delivery/Delivery";
import Layout from "./layout/Layout";

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
const isDemoMode = DATA_MODE === "demo";
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

const LOCAL_COLLECTION_KEYS = ["orders", "customers", "kdsCards", "menuItems", "tables", "staff", "discounts", "deliveryOrders", "inventory"];

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
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("orders", []), normalizeOrder, "orders")
    : normalizeArray(INIT_ORDERS, normalizeOrder, "orders"));
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
  const [discounts, setDiscounts] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("discounts", []), null, "discounts")
    : normalizeArray(INIT_DISCOUNTS, null, "discounts"));
  const [deliveryOrders, setDeliveryOrders] = useState(() => isLocalMode ? loadLocalCollection("deliveryOrders", []) : []);
  const [inventory, setInventory] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("inventory", []), null, "inventory")
    : normalizeArray(INIT_INVENTORY, null, "inventory"));
  const [theme, setTheme] = useState(() => getTheme());
  const [storageError, setStorageError] = useState(null);

  // Listen for quota/storage errors dispatched by saveLocalCollection so the UI
  // can surface a warning without the error silently vanishing.
  useEffect(() => {
    const handler = (e) => setStorageError(e.detail);
    window.addEventListener("brewcrm:storage-error", handler);
    return () => window.removeEventListener("brewcrm:storage-error", handler);
  }, []);

  useEffect(() => { if (isLocalMode) saveLocalCollection("orders", orders); }, [orders]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("customers", customers); }, [customers]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("kdsCards", kdsCards); }, [kdsCards]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("menuItems", menuItems); }, [menuItems]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("tables", tables); }, [tables]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("staff", staff); }, [staff]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("discounts", discounts); }, [discounts]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("deliveryOrders", deliveryOrders); }, [deliveryOrders]);
  useEffect(() => { if (isLocalMode) saveLocalCollection("inventory", inventory); }, [inventory]);

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
      collections: { orders, customers, kdsCards, menuItems, tables, staff, discounts, deliveryOrders, inventory }
    }, null, 2);
  }, [orders, customers, kdsCards, menuItems, tables, staff, discounts, deliveryOrders, inventory]);

  // jsonText must be a JSON string. Validates shape defensively, ignores unknown
  // collection keys, normalizes known collections before they enter state, and
  // only persists to localStorage when local mode is active.
  const importLocalData = useCallback((jsonText) => {
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
      discounts: setDiscounts,
      deliveryOrders: setDeliveryOrders,
      inventory: setInventory
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
      let raw = null;
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
      const snapshotCollections = { orders, customers, kdsCards, menuItems, tables, staff, discounts, deliveryOrders, inventory };
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
  }, [orders, customers, kdsCards, menuItems, tables, staff, discounts, deliveryOrders, inventory]);

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
      setDiscounts([]);
      setDeliveryOrders([]);
      setInventory([]);
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
      setDiscounts([]);
      setDeliveryOrders([]);
      setInventory(starterInventory);

      // useEffect hooks handle localStorage persistence — no manual saves needed here.
      return {
        ok: true,
        seeded: ["menuItems", "tables", "inventory"],
        empty: ["orders", "customers", "kdsCards", "staff", "discounts", "deliveryOrders"]
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
    <Layout tab={tab} setTab={setTab} newOrderCount={newOrderCount} urgentKds={urgentKds} theme={theme} toggleTheme={toggleTheme}>
      {tab === "orders"    && <Orders    orders={orders} setOrders={setOrders} kdsCards={kdsCards} setKdsCards={setKdsCards} menuItems={menuItems} tables={tables} setTables={setTables} staff={staff} discounts={discounts} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} />}
      {tab === "kitchen"   && <Kitchen   kdsCards={kdsCards} setKdsCards={setKdsCards} orders={orders} setOrders={setOrders} />}
      {tab === "crm"       && <CRM       customers={customers} setCustomers={setCustomers} orders={orders} kdsCards={kdsCards} />}
      {tab === "analytics" && <Analytics orders={orders} customers={customers} />}
      {tab === "menu"      && <Menu      menuItems={menuItems} setMenuItems={setMenuItems} />}
      {tab === "inventory" && <Inventory inventory={inventory} setInventory={setInventory} />}
      {tab === "staff"     && <Staff     staff={staff} setStaff={setStaff} orders={orders} />}
      {tab === "tables"    && <Tables    tables={tables} setTables={setTables} />}
      {tab === "discounts" && <Discounts discounts={discounts} setDiscounts={setDiscounts} />}
      {tab === "delivery"  && <Delivery  deliveryOrders={deliveryOrders} setDeliveryOrders={setDeliveryOrders} orders={orders} setOrders={setOrders} kdsCards={kdsCards} setKdsCards={setKdsCards} menuItems={menuItems} />}
      {tab === "settings"  && <Settings  theme={theme} toggleTheme={toggleTheme} dataTools={dataTools} />}
    </Layout>
  );
}
