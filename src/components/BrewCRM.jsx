import React, { useState, useEffect, useCallback } from 'react';
import { MENU_ITEMS, INIT_ORDERS, INIT_CUSTOMERS } from "../data/constants";
import { INIT_STAFF } from "../data/staffConstants";
import { INIT_INVENTORY } from "../data/inventoryConstants.js";
import { applyTheme, getTheme } from "../styles/theme";
import { isDemoMode, isProductionMode, getAppMode, setAppMode, APP_MODES, exitDemoMode } from "../utils/appMode.js";
import { 
  getRuntimeMode, 
  isDemoMode as isRuntimeDemoMode,
  isProductionMode as isRuntimeProductionMode,
  getDataSource,
  isPersistenceEnabled
} from "../utils/runtimeMode.js";
import { useTerminal } from "../terminal/TerminalContext.jsx";
import TerminalSelector from "./terminal/TerminalSelector.jsx";
import BakeryPOS from "./BakeryPOS.jsx";

// --- Domain normalizers ---
import { normalizeOrder }     from "../domain/orderModel";
import { normalizeCustomer }  from "../domain/normalize";
import { normalizeStaff }    from "../domain/staffModel";

// --- Data mode boundary ---
const dataSource = getDataSource();
const isLocalMode = isPersistenceEnabled();

const LOCAL_PREFIX = "brewcrm_local_";

function safeParse(json, fallback) {
  try {
    const parsed = JSON.parse(json);
    return parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function loadCollection(key, fallback) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (raw === null) return fallback;
    const parsed = safeParse(raw, undefined);
    if (parsed === undefined) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn(`[BrewCRM] Corrupted localStorage JSON for "${key}", resetting to fallback`);
      return fallback;
    }
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn(`[BrewCRM] Non-array localStorage data for "${key}", resetting to fallback`);
      return fallback;
    }
    return parsed;
  } catch (err) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn(`[BrewCRM] Failed to load localStorage collection "${key}"`, err);
    return fallback;
  }
}

function saveLocalCollection(key, value) {
  try {
    if (value === undefined) return;
    if (!Array.isArray(value)) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn(`[BrewCRM] Skipped saving non-array collection "${key}"`);
      return;
    }
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn(`[BrewCRM] Failed to save localStorage collection "${key}"`, err);
    try {
      window.dispatchEvent(new CustomEvent("brewcrm:storage-error", {
        detail: { key, name: err?.name, message: err?.message }
      }));
    } catch { /* window unavailable in SSR — ignore */ }
  }
}

const LOCAL_COLLECTION_KEYS = ["orders", "customers", "menuItems", "staff", "inventory", "tables"];

const normalizeArray = (items, normalizer, collectionName) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      try {
        return normalizer ? normalizer(item) : item;
      } catch (err) {
        if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn(`[BrewCRM] Invalid ${collectionName} record skipped`, err, item);
        return null;
      }
    })
    .filter(Boolean);
};

export default function BrewCRM() {
  const { currentTerminal } = useTerminal();
  const [showTerminalSelector, setShowTerminalSelector] = useState(false);
  const appMode = getAppMode();

  // Show terminal selector if no terminal is set and not in demo mode
  useEffect(() => {
    if (!currentTerminal && appMode === APP_MODES.PRODUCTION) {
      setShowTerminalSelector(true);
    }
  }, [currentTerminal, appMode]);
  
  const [orders, setOrders] = useState(() => {
    let initialOrders = isLocalMode
      ? normalizeArray(loadLocalCollection("orders", []), normalizeOrder, "orders")
      : (() => {
          try {
            return normalizeArray(INIT_ORDERS(), normalizeOrder, "orders");
          } catch (error) {
            console.warn('[BrewCRM] Demo data not available:', error.message);
            return [];
          }
        })();
    
    // Load QR orders from localStorage
    try {
      const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
      if (qrOrders.length > 0) {
        initialOrders = [...initialOrders, ...qrOrders];
        // Clear QR orders after loading to prevent duplicates
        localStorage.removeItem('qr_orders');
      }
    } catch (e) {
      console.error('Failed to load QR orders:', e);
    }
    
    return initialOrders;
  });
  const [customers, setCustomers] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("customers", []), normalizeCustomer, "customers")
    : (() => {
        try {
          return normalizeArray(INIT_CUSTOMERS(), normalizeCustomer, "customers");
        } catch (error) {
          console.warn('[BrewCRM] Demo data not available:', error.message);
          return [];
        }
      })());
  const [menuItems, setMenuItems] = useState(() => {
    const starterMenu = MENU_ITEMS.map(m => ({ 
      ...m, 
      active: true, 
      eightySixed: false,
      category: m.cat, // Map 'cat' to 'category' for Toast POS compatibility
      description: m.desc // Map 'desc' to 'description'
    }));
    const raw = isLocalMode ? loadLocalCollection("menuItems", starterMenu) : starterMenu;
    const result = Array.isArray(raw) ? raw : starterMenu;
    console.log('[BrewCRM] Initial menuItems loaded:', result.length, 'items');
    console.log('[BrewCRM] Sample menu item:', result[0]);
    return result;
  });
  const [staff, setStaff] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("staff", []), normalizeStaff, "staff")
    : (() => {
        try {
          return normalizeArray(INIT_STAFF(), normalizeStaff, "staff");
        } catch (error) {
          console.warn('[BrewCRM] Demo data not available:', error.message);
          return [];
        }
      })());
  const [inventory, setInventory] = useState(() => isLocalMode
    ? normalizeArray(loadLocalCollection("inventory", []), null, "inventory")
    : (() => {
        try {
          return normalizeArray(INIT_INVENTORY(), null, "inventory");
        } catch (error) {
          console.warn('[BrewCRM] Demo data not available:', error.message);
          return [];
        }
      })());
  const [tables, setTables] = useState(() => isLocalMode
    ? loadLocalCollection("tables", [
        { id: 1, name: 'T1', status: 'available', capacity: 4 },
        { id: 2, name: 'T2', status: 'available', capacity: 4 },
        { id: 3, name: 'T3', status: 'occupied', capacity: 6 },
        { id: 4, name: 'T4', status: 'available', capacity: 2 },
        { id: 5, name: 'T5', status: 'available', capacity: 8 },
        { id: 6, name: 'T6', status: 'occupied', capacity: 4 },
        { id: 7, name: 'T7', status: 'available', capacity: 4 },
        { id: 8, name: 'T8', status: 'available', capacity: 6 }
      ])
    : [
        { id: 1, name: 'T1', status: 'available', capacity: 4 },
        { id: 2, name: 'T2', status: 'available', capacity: 4 },
        { id: 3, name: 'T3', status: 'occupied', capacity: 6 },
        { id: 4, name: 'T4', status: 'available', capacity: 2 },
        { id: 5, name: 'T5', status: 'available', capacity: 8 },
        { id: 6, name: 'T6', status: 'occupied', capacity: 4 },
        { id: 7, name: 'T7', status: 'available', capacity: 4 },
        { id: 8, name: 'T8', status: 'available', capacity: 6 }
      ]);
  const [theme, setTheme] = useState(() => getTheme());
  const [storageError, setStorageError] = useState(null);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("brewcrm_settings");
      const defaultSettings = {
        mobileNavPosition: 'bottom' // 'top' or 'bottom'
      };
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    } catch {
      return { mobileNavPosition: 'bottom' };
    }
  });

  const handleRestoreBackup = useCallback(() => {
    localStorage.setItem('cafeos_visited', 'true');
  }, []);

  // Listen for quota/storage errors
  useEffect(() => {
    const handler = (e) => setStorageError(e.detail);
    window.addEventListener("brewcrm:storage-error", handler);
    return () => window.removeEventListener("brewcrm:storage-error", handler);
  }, []);

  // Debounced localStorage saves to prevent performance issues
  useEffect(() => {
    if (!isLocalMode) return;
    
    const timeoutId = setTimeout(() => {
      saveLocalCollection("orders", orders);
      // Sync order statuses to localStorage for QR clients to poll
      try {
        const qrStatuses = {};
        orders.forEach(order => {
          if (order && order.id) {
            qrStatuses[order.id] = {
              id: order.id,
              status: order.status,
              items: order.items,
              total: order.total,
              tableName: order.tableName,
              token: order.token,
              createdAt: order.createdAt
            };
          }
        });
        localStorage.setItem('qr_order_statuses', JSON.stringify(qrStatuses));
      } catch (e) {
        console.error('Error syncing order statuses for QR:', e);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [orders, isLocalMode]);

  useEffect(() => { 
    if (!isLocalMode) return;
    const timeoutId = setTimeout(() => saveLocalCollection("customers", customers), 500);
    return () => clearTimeout(timeoutId);
  }, [customers, isLocalMode]);
  
  useEffect(() => { 
    if (!isLocalMode) return;
    const timeoutId = setTimeout(() => saveLocalCollection("menuItems", menuItems), 500);
    return () => clearTimeout(timeoutId);
  }, [menuItems, isLocalMode]);
  
  useEffect(() => { 
    if (!isLocalMode) return;
    const timeoutId = setTimeout(() => saveLocalCollection("staff", staff), 500);
    return () => clearTimeout(timeoutId);
  }, [staff, isLocalMode]);
  
  useEffect(() => { 
    if (!isLocalMode) return;
    const timeoutId = setTimeout(() => saveLocalCollection("inventory", inventory), 500);
    return () => clearTimeout(timeoutId);
  }, [inventory, isLocalMode]);
  
  useEffect(() => { 
    if (!isLocalMode) return;
    const timeoutId = setTimeout(() => saveLocalCollection("tables", tables), 500);
    return () => clearTimeout(timeoutId);
  }, [tables, isLocalMode]);
  
  useEffect(() => { 
    const timeoutId = setTimeout(() => localStorage.setItem("brewcrm_settings", JSON.stringify(settings)), 500);
    return () => clearTimeout(timeoutId);
  }, [settings]);

  // Sync menu items to localStorage for QR ordering
  useEffect(() => {
    try {
      if (menuItems && menuItems.length > 0) {
        // Transform to match QR ordering expected format
        const transformedMenu = menuItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || item.cat || 'Other',
          price: item.price,
          description: item.description || item.desc || '',
          emoji: item.emoji || '',
          veg: item.veg !== false,
          spicy: item.spicy || 0,
          active: item.active !== false,
          eightySixed: item.eightySixed || false
        }));
        
        localStorage.setItem('bakery_menu', JSON.stringify(transformedMenu));
        localStorage.setItem('cafeos_menu', JSON.stringify(transformedMenu));
        localStorage.setItem('brewcrm_local_menuItems', JSON.stringify(transformedMenu));
      }
    } catch (e) {
      console.error('[BrewCRM] Error syncing menu to localStorage:', e);
    }
  }, [menuItems]);

  // Poll for QR orders every 30 seconds (increased from 5s to reduce CPU usage)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const qrOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        if (qrOrders.length > 0) {
          setOrders(prevOrders => {
            // Filter out any orders that might already exist
            const existingIds = new Set(prevOrders.map(o => o.id));
            const newOrders = qrOrders.filter(o => !existingIds.has(o.id));
            if (newOrders.length > 0) {
              // Clear QR orders after processing
              localStorage.removeItem('qr_orders');
              return [...prevOrders, ...newOrders];
            }
            return prevOrders;
          });
        }
      } catch (e) {
        console.error('Failed to poll QR orders:', e);
      }
    }, 30000); // Increased from 5000ms to 30000ms

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme();
    const next = getTheme();
    setTheme(next);
    localStorage.setItem("cafeos-pos-theme", next);
  }, []);

  return (
    <>
      {/* Terminal Selector Modal */}
      {showTerminalSelector && (
        <TerminalSelector
          onClose={() => setShowTerminalSelector(false)}
          onTerminalSelected={(terminal) => {
            console.log('Terminal selected:', terminal);
            setShowTerminalSelector(false);
          }}
          staff={staff}
        />
      )}
      
      <BakeryPOS
          orders={orders}
          setOrders={setOrders}
          customers={customers}
          setCustomers={setCustomers}
          staff={staff}
          setStaff={setStaff}
          menuItems={menuItems}
          setMenuItems={setMenuItems}
          inventory={inventory}
          setInventory={setInventory}
          settings={settings}
          setSettings={setSettings}
          tables={tables}
          setTables={setTables}
      />
    </>
  );
}
