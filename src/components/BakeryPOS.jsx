import React, { useState, useEffect, useRef, useCallback } from 'react';
import Dashboard from './dashboard/Dashboard';
import Reports from './analytics/Reports';
import ComprehensiveReports from './analytics/ComprehensiveReports';
import CRM from './crm/CRM';
import Staff from './staff/Staff';
import Menu from './menu/Menu';
import Inventory from './inventory/Inventory';
import Settings from './settings/Settings';
import Tables from './tables/Tables';
import ToastTables from './tables/ToastTables';
import Waiters from './waiters/Waiters';
import Kitchen from './kitchen/Kitchen';
import SimplePOS from './SimplePOS';
import { ToastOrders } from './orders';
import RecipeManagement from './recipes/RecipeManagement';
import WasteManagement from './waste/WasteManagement';
import Reservations from './reservations/Reservations';
import OnlineOrdering from './onlineordering/OnlineOrdering';
import TokenManagement from './tokens/TokenManagement';
import GSTReports from './analytics/GSTReports';

/* ─── All tab metadata in one place ─────────────────────────────────── */
const ALL_TABS = [
  { id: 'orders',       label: 'Orders',       icon: '🛒' },
  { id: 'dashboard',    label: 'Dashboard',    icon: '📊' },
  { id: 'reports',      label: 'Reports',      icon: '📈' },
  { id: 'crm',          label: 'Customers',    icon: '👤' },
  { id: 'staff',        label: 'Staff',        icon: '👥' },
  { id: 'menu',         label: 'Menu',         icon: '🍽️' },
  { id: 'inventory',    label: 'Inventory',    icon: '📦' },
  { id: 'recipes',      label: 'Recipes',      icon: '📜' },
  { id: 'waste',        label: 'Waste',        icon: '♻️' },
  { id: 'reservations', label: 'Reservations', icon: '📅' },
  { id: 'tokens',       label: 'Tokens',       icon: '🎫' },
  { id: 'tables',       label: 'Tables',       icon: '🪑' },
  { id: 'waiters',      label: 'Waiters',      icon: '🛎️' },
  { id: 'kitchen',      label: 'Kitchen',      icon: '👨‍🍳' },
  { id: 'gst',          label: 'GST Reports',  icon: '🧾' },
  { id: 'settings',     label: 'Settings',     icon: '⚙️' },
];

const TAB_BY_ID = Object.fromEntries(ALL_TABS.map(t => [t.id, t]));

export default function BakeryPOS({
  orders, setOrders,
  customers, setCustomers,
  staff, setStaff,
  menuItems, setMenuItems,
  inventory, setInventory,
  settings, setSettings,
  tables, setTables,
}) {
  /* ── Navigation state ────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('bakerypos_active_tab') || 'orders');
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false);

  /* ── Responsive state ────────────────────────────────────────────── */
  const [isMobile,  setIsMobile]  = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768  : false);
  const [isMedium,  setIsMedium]  = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768  && window.innerWidth < 1024 : false);
  const [isTablet,  setIsTablet]  = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1280 : false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1280 : false);
  const [ordersMode, setOrdersMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      return saved.orders?.useToastOrders === true ? 'toast' : 'standard';
    } catch {
      return 'standard';
    }
  });

  const [kitchenMode, setKitchenMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      if (saved.kitchen?.useChowbusKDS) return 'chowbus';
      if (saved.kitchen?.useSplitKDS) return 'split';
      if (saved.kitchen?.useOracleKDS) return 'oracle';
      return 'standard';
    } catch {
      return 'standard';
    }
  });

  const [tablesMode, setTablesMode] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      return saved.tables?.useToastTables === true ? 'toast' : 'standard';
    } catch {
      return 'standard';
    }
  });

  useEffect(() => {
    const handle = () => {
      const w = window.innerWidth;
      setIsMobile(w < 768);
      setIsMedium(w >= 768  && w < 1024);
      setIsTablet(w >= 768 && w < 1280);
      setIsDesktop(w >= 1280);
    };
    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Handle orders mode changes and save to localStorage
  const handleOrdersModeChange = (newMode) => {
    setOrdersMode(newMode);
    try {
      const existingSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      existingSettings.orders = existingSettings.orders || {};
      existingSettings.orders.useToastOrders = newMode === 'toast';
      localStorage.setItem('cafeos_settings', JSON.stringify(existingSettings));
      window.dispatchEvent(new Event('cafeos_settings_changed'));
    } catch (error) {
      console.error('Failed to save orders mode:', error);
    }
  };

  // Handle tables mode changes and save to localStorage
  const handleTablesModeChange = (newMode) => {
    setTablesMode(newMode);
    try {
      const existingSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      existingSettings.tables = existingSettings.tables || {};
      existingSettings.tables.useToastTables = newMode === 'toast';
      localStorage.setItem('cafeos_settings', JSON.stringify(existingSettings));
      window.dispatchEvent(new Event('cafeos_settings_changed'));
    } catch (error) {
      console.error('Failed to save tables mode:', error);
    }
  };

  // Handle kitchen mode changes and save to localStorage
  const handleKitchenModeChange = (newMode) => {
    setKitchenMode(newMode);
    try {
      const existingSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      existingSettings.kitchen = existingSettings.kitchen || {};
      existingSettings.kitchen.useOracleKDS = newMode === 'oracle';
      existingSettings.kitchen.useSplitKDS = newMode === 'split';
      existingSettings.kitchen.useChowbusKDS = newMode === 'chowbus';
      existingSettings.kitchen.oracleKDS = { enabled: newMode === 'oracle' };
      existingSettings.kitchen.splitKDS = { enabled: newMode === 'split' };
      existingSettings.kitchen.chowbusKDS = { enabled: newMode === 'chowbus' };
      localStorage.setItem('cafeos_settings', JSON.stringify(existingSettings));
      window.dispatchEvent(new Event('cafeos_settings_changed'));
    } catch (error) {
      console.error('Failed to save kitchen mode:', error);
    }
  };

  // Sync orders, tables, and kitchen mode with localStorage changes
  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
        
        // Sync orders mode
        if (saved.orders?.useToastOrders) setOrdersMode('toast');
        else setOrdersMode('standard');
        
        // Sync tables mode
        if (saved.tables?.useToastTables) setTablesMode('toast');
        else setTablesMode('standard');

        // Sync kitchen mode
        if (saved.kitchen?.useChowbusKDS) setKitchenMode('chowbus');
        else if (saved.kitchen?.useSplitKDS) setKitchenMode('split');
        else if (saved.kitchen?.useOracleKDS) setKitchenMode('oracle');
        else setKitchenMode('standard');
      } catch {
        setOrdersMode('standard');
        setTablesMode('standard');
        setKitchenMode('standard');
      }
    };

    window.addEventListener('cafeos_settings_changed', handleSettingsChange);
    window.addEventListener('storage', handleSettingsChange);

    return () => {
      window.removeEventListener('cafeos_settings_changed', handleSettingsChange);
      window.removeEventListener('storage', handleSettingsChange);
    };
  }, []);

  /* ── Desktop header dropdown state ──────────────────────────────── */
  const [menuDropdownOpen,      setMenuDropdownOpen]      = useState(false);
  const [customersDropdownOpen, setCustomersDropdownOpen] = useState(false);
  const [ordersDropdownOpen,   setOrdersDropdownOpen]   = useState(false);
  const [tablesDropdownOpen,   setTablesDropdownOpen]   = useState(false);
  const [kitchenDropdownOpen,  setKitchenDropdownOpen]  = useState(false);
  const [dropdownCoords,        setDropdownCoords]        = useState({ top: 0, left: 0 });
  const tabsRef = useRef(null);

  /* ── Theme ───────────────────────────────────────────────────────── */
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('bakerypos_theme');
    return saved === 'dark' ? false : true; // true = light (inverted legacy)
  });
  useEffect(() => { localStorage.setItem('bakerypos_theme', darkMode ? 'light' : 'dark'); }, [darkMode]);

  const getTabDarkMode = (tab) => {
    if (settings?.tabDarkModes && settings.tabDarkModes[tab] !== undefined) return settings.tabDarkModes[tab];
    return darkMode;
  };

  useEffect(() => { localStorage.setItem('bakerypos_active_tab', activeTab); }, [activeTab]);

  // Force re-render of kitchen when mode changes
  const [kitchenKey, setKitchenKey] = useState(0);
  useEffect(() => {
    if (activeTab === 'kitchen') {
      setKitchenKey(prev => prev + 1);
    }
  }, [kitchenMode, activeTab]);

  /* ── Close dropdowns on outside click ───────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.closest('[data-dropdown-trigger]')) return;
      if (e.target.closest('[data-dropdown]')) return;
      setMenuDropdownOpen(false);
      setCustomersDropdownOpen(false);
      setOrdersDropdownOpen(false);
      setTablesDropdownOpen(false);
      setKitchenDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Settings helpers ────────────────────────────────────────────── */
  // Destructure all mobile/tablet settings with defaults
  const mobileNavPosition   = settings?.mobileNavPosition  ?? 'bottom';
  const mobileNavTabs       = settings?.mobileNavTabs       ?? ['orders', 'dashboard', 'reports', 'crm', 'more'];
  const mobileShowLabels    = settings?.mobileShowLabels    ?? true;
  const mobileNavStyle      = settings?.mobileNavStyle      ?? 'pill';   // 'pill' | 'underline' | 'icon-only'
  const mobileIconSize      = settings?.mobileIconSize      ?? 'md';     // 'sm' | 'md' | 'lg'
  // Force tablets to use topbar layout (same as laptops)
  const tabletLayoutMode    = isTablet ? 'topbar' : (settings?.tabletLayoutMode ?? 'topbar'); // 'sidebar' | 'topbar'
  const tabletSidebarMode   = settings?.tabletSidebarMode   ?? 'compact'; // 'compact' | 'full' | 'hidden'
  const storeName           = settings?.storeName           || 'BakeryPOS';

  const iconPx = mobileIconSize === 'sm' ? '18px' : mobileIconSize === 'lg' ? '28px' : '22px';

  /* ── Navigation helpers ──────────────────────────────────────────── */
  const handleNavigate = useCallback((tab) => {
    setActiveTab(tab);
    setMenuDropdownOpen(false);
    setCustomersDropdownOpen(false);
    setOrdersDropdownOpen(false);
    setTablesDropdownOpen(false);
    setKitchenDropdownOpen(false);
    setShowMobileMoreMenu(false);
    setTabletSidebarOpen(false);
  }, []);

  const scrollTabs = (dir) => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  /* ── Content renderer ────────────────────────────────────────────── */
  const renderContent = () => {
    // Use state instead of localStorage for reactivity
    const useToastOrders = ordersMode === 'toast';

    switch (activeTab) {
      case 'orders':       return useToastOrders
        ? <ToastOrders orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} onNavigate={handleNavigate} tables={tables} setTables={setTables} customers={customers} setCustomers={setCustomers} staff={staff} setStaff={setStaff} darkMode={getTabDarkMode('orders')} />
        : <SimplePOS orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} settings={settings} setSettings={setSettings} staff={staff} tables={tables} setTables={setTables} onNavigate={handleNavigate} darkMode={getTabDarkMode('orders')} />;
      case 'dashboard':    return <Dashboard orders={orders} setOrders={setOrders} menuItems={menuItems} inventory={inventory} customers={customers} staff={staff} tables={tables} settings={settings} onNavigate={handleNavigate} darkMode={getTabDarkMode('dashboard')} />;
      case 'reports':      return <Reports orders={orders} menuItems={menuItems} inventory={inventory} staff={staff} customers={customers} settings={settings} onNavigate={handleNavigate} darkMode={getTabDarkMode('reports')} />;
      case 'crm':          return <CRM customers={customers} setCustomers={setCustomers} darkMode={getTabDarkMode('crm')} />;
      case 'staff':        return <Staff staff={staff} setStaff={setStaff} darkMode={getTabDarkMode('staff')} />;
      case 'menu':         return <Menu menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('menu')} />;
      case 'inventory':    return <Inventory inventory={inventory} setInventory={setInventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('inventory')} />;
      case 'recipes':      return <RecipeManagement menuItems={menuItems} inventory={inventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('recipes')} />;
      case 'waste':        return <WasteManagement inventory={inventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('waste')} />;
      case 'reservations': return <Reservations tables={tables} customers={customers} onNavigate={handleNavigate} darkMode={getTabDarkMode('reservations')} />;
      case 'tokens':       return <TokenManagement orders={orders} setOrders={setOrders} onNavigate={handleNavigate} tables={tables} setTables={setTables} darkMode={getTabDarkMode('tokens')} />;
      case 'tables':       return tablesMode === 'toast'
        ? <ToastTables onNavigate={handleNavigate} orders={orders} setOrders={setOrders} tables={tables} setTables={setTables} menuItems={menuItems} settings={settings} staff={staff} darkMode={getTabDarkMode('tables')} />
        : <Tables onNavigate={handleNavigate} orders={orders} setOrders={setOrders} tables={tables} setTables={setTables} menuItems={menuItems} settings={settings} staff={staff} darkMode={getTabDarkMode('tables')} />;
      case 'waiters':      return <Waiters onNavigate={handleNavigate} orders={orders} setOrders={setOrders} staff={staff} tables={tables} darkMode={getTabDarkMode('waiters')} />;
      case 'kitchen':      return <Kitchen key={kitchenKey} onNavigate={handleNavigate} orders={orders} setOrders={setOrders} menuItems={menuItems} staff={staff} />;
      case 'gst':          return <GSTReports orders={orders} purchases={[]} business={{ gstin: '27AAPFU0939F1ZV', state: 'MH', name: 'Bakery POS', branchId: 'MAIN' }} branches={[{ id: 'MAIN', name: 'Main Branch', gstin: '27AAPFU0939F1ZV', state: 'MH' }]} vendors={[]} />;
      case 'settings':     return <Settings settings={settings} setSettings={setSettings} onNavigate={handleNavigate} menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} orders={orders} setOrders={setOrders} staff={staff} setStaff={setStaff} tables={tables} setTables={setTables} darkMode={getTabDarkMode('settings')} />;
      default:             return <SimplePOS orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} onNavigate={handleNavigate} darkMode={getTabDarkMode('orders')} />;
    }
  };

  /* ── "More" tabs (not in bottom bar) ────────────────────────────── */
  const moreTabs = ALL_TABS.filter(t =>
    !mobileNavTabs.includes(t.id) && t.id !== 'more'
  );

  /* ── Content padding-left for desktop sidebar / tablet sidebar ──── */
  const getContentPaddingLeft = () => {
    if (isMobile) return '0';
    if (isTablet) return '0'; // Tablets always use topbar now
    return '0'; // desktop uses header tab bar
  };

  /* ────────────────────────────────────────────────────────────────── */
  /* ── Tablet sidebar dimensions (disabled - tablets now use topbar) ── */
  const TABLET_SIDEBAR_FULL_W  = 220;
  const TABLET_SIDEBAR_ICON_W  = 64;
  const showTabletSidebar      = false; // Tablets always use topbar now
  const tabletSidebarW         = 0;

  /* ── Theme colors ────────────────────────────────────────────────── */
  const dm = darkMode; // shorthand

  /* ================================================================= */
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      maxWidth: '100%',
      background: 'var(--cafe-bg)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden',
    }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Bottom bar nav buttons */
        .mob-nav-btn { -webkit-tap-highlight-color: transparent; }
        .mob-nav-btn:active { transform: scale(0.92); }

        /* Tablet sidebar */
        .tablet-sidebar { transition: width 0.25s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
        .tablet-sidebar-btn:hover { background: var(--cafe-bg-hover) !important; }
        .tablet-sidebar-btn:active { transform: scale(0.96); }

        /* More drawer backdrop */
        .more-backdrop { animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .more-drawer   { animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideUp { from { transform:translateY(12px); opacity:0 } to { transform:translateY(0); opacity:1 } }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP HEADER (≥1280px)
          ══════════════════════════════════════════════════════════════ */}
      {isDesktop && (
        <header style={{
          background: 'var(--cafe-bg-elevated)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--cafe-border)',
          boxShadow: 'var(--cafe-shadow-sm)',
          height: '60px',
          flexShrink: 0,
          zIndex: 1000,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--cafe-accent) 0%, var(--cafe-accent-light) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '17px', boxShadow: 'var(--cafe-shadow-glow)',
              transform: 'rotate(-5deg)', transition: 'transform 0.3s ease',
              cursor: 'pointer',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'rotate(10deg) scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'rotate(-5deg) scale(1)'}
            >🥐</div>
            <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--cafe-text-primary)', letterSpacing: '-0.03em' }}>
              {storeName}
            </span>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center', maxWidth: '900px', minWidth: 0 }}>
            <button onClick={() => scrollTabs('left')} style={scrollBtnStyle}>‹</button>
            <div ref={tabsRef} className="no-scrollbar" style={{
              display: 'flex', gap: '5px', overflowX: 'auto', overflowY: 'hidden',
              scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch',
              paddingBottom: '2px', flex: 1, minWidth: 0, whiteSpace: 'nowrap',
            }}>
              {[
                { id: 'orders', label: 'Orders', hasDropdown: true },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'reports', label: 'Reports' },
                { id: 'crm', label: 'Customers', hasDropdown: true },
                { id: 'staff', label: 'Staff' },
                { id: 'menu', label: 'Menu', hasDropdown: true },
                { id: 'tokens', label: 'Tokens' },
                { id: 'tables', label: 'Tables', hasDropdown: true },
                { id: 'waiters', label: 'Waiters' },
                { id: 'kitchen', label: 'Kitchen', hasDropdown: true },
                { id: 'settings', label: 'Settings' },
              ].map(item => (
                <button
                  key={item.id}
                  data-dropdown-trigger
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.hasDropdown) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setDropdownCoords({ top: rect.bottom + 4, left: rect.left });
                      if (item.id === 'menu')      { setMenuDropdownOpen(p => !p); setCustomersDropdownOpen(false); setOrdersDropdownOpen(false); setTablesDropdownOpen(false); setKitchenDropdownOpen(false); }
                      if (item.id === 'crm')       { setCustomersDropdownOpen(p => !p); setMenuDropdownOpen(false); setOrdersDropdownOpen(false); setTablesDropdownOpen(false); setKitchenDropdownOpen(false); }
                      if (item.id === 'orders')    { setOrdersDropdownOpen(p => !p); setMenuDropdownOpen(false); setCustomersDropdownOpen(false); setTablesDropdownOpen(false); setKitchenDropdownOpen(false); }
                      if (item.id === 'tables')    { setTablesDropdownOpen(p => !p); setMenuDropdownOpen(false); setCustomersDropdownOpen(false); setOrdersDropdownOpen(false); setKitchenDropdownOpen(false); }
                      if (item.id === 'kitchen')   { setKitchenDropdownOpen(p => !p); setMenuDropdownOpen(false); setCustomersDropdownOpen(false); setOrdersDropdownOpen(false); setTablesDropdownOpen(false); }
                    } else {
                      handleNavigate(item.id);
                    }
                  }}
                  style={{
                    padding: '7px 14px',
                    background: activeTab === item.id ? 'var(--cafe-accent)' : 'transparent',
                    color: activeTab === item.id ? '#ffffff' : 'var(--cafe-text-secondary)',
                    border: 'none', borderRadius: '8px',
                    fontSize: '13px', fontWeight: activeTab === item.id ? '600' : '500',
                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                    whiteSpace: 'nowrap',
                    boxShadow: activeTab === item.id ? 'var(--cafe-shadow-glow)' : 'none',
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}
                  onMouseEnter={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'var(--cafe-bg-hover)'; e.currentTarget.style.color = 'var(--cafe-text-primary)'; } }}
                  onMouseLeave={e => { if (activeTab !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--cafe-text-secondary)'; } }}
                >
                  {item.label}
                  {item.hasDropdown && <span style={{ fontSize: '10px' }}>▼</span>}
                </button>
              ))}
            </div>
            <button onClick={() => scrollTabs('right')} style={scrollBtnStyle}>›</button>
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Mode Selector Button */}
            <button
              onClick={() => {
                if (activeTab === 'orders') {
                  handleOrdersModeChange(ordersMode === 'standard' ? 'toast' : 'standard');
                } else if (activeTab === 'tables') {
                  handleTablesModeChange(tablesMode === 'standard' ? 'toast' : 'standard');
                } else if (activeTab === 'kitchen') {
                  const modes = ['standard', 'oracle', 'split', 'chowbus'];
                  const currentIndex = modes.indexOf(kitchenMode);
                  const nextMode = modes[(currentIndex + 1) % modes.length];
                  handleKitchenModeChange(nextMode);
                }
              }}
              title={
                activeTab === 'orders' ? `Switch to ${ordersMode === 'standard' ? 'Toast Orders' : 'Standard'} mode` :
                activeTab === 'tables' ? `Switch to ${tablesMode === 'standard' ? 'Toast Floor Plan' : 'Standard Grid'} mode` :
                `Switch Kitchen mode (current: ${kitchenMode})`
              }
              style={{
                background: activeTab === 'orders' 
                  ? (ordersMode === 'toast' ? 'var(--cafe-accent)' : 'var(--cafe-bg-hover)')
                  : activeTab === 'tables'
                  ? (tablesMode === 'toast' ? '#f59e0b' : 'var(--cafe-bg-hover)')
                  : activeTab === 'kitchen'
                  ? (kitchenMode === 'chowbus' ? '#2563eb' : kitchenMode === 'oracle' ? '#ef4444' : kitchenMode === 'split' ? '#10b981' : 'var(--cafe-bg-hover)')
                  : 'var(--cafe-bg-hover)',
                border: activeTab === 'orders' && ordersMode === 'toast' ? '2px solid var(--cafe-accent)' : 
                         activeTab === 'tables' && tablesMode === 'toast' ? '2px solid #f59e0b' :
                         activeTab === 'kitchen' && kitchenMode !== 'standard' ? `2px solid ${kitchenMode === 'chowbus' ? '#2563eb' : kitchenMode === 'oracle' ? '#ef4444' : '#10b981'}` :
                         '1px solid var(--cafe-border)',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--cafe-text-primary)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {activeTab === 'orders' && (ordersMode === 'toast' ? '🍞' : '📋')}
              {activeTab === 'tables' && (tablesMode === 'toast' ? '🗺️' : '🪑')}
              {activeTab === 'kitchen' && (kitchenMode === 'chowbus' ? '⚡' : kitchenMode === 'oracle' ? '🔮' : kitchenMode === 'split' ? '🔄' : '📋')}
              <span style={{ display: activeTab === 'orders' || activeTab === 'tables' || activeTab === 'kitchen' ? 'inline' : 'none' }}>
                {activeTab === 'orders' ? (ordersMode === 'toast' ? 'Toast' : 'Standard') : 
                 activeTab === 'tables' ? (tablesMode === 'toast' ? 'Toast Floor' : 'Standard') :
                 activeTab === 'kitchen' ? (kitchenMode === 'chowbus' ? 'Chowbus' : kitchenMode === 'oracle' ? 'Oracle' : kitchenMode === 'split' ? 'Split' : 'Standard') : ''}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(p => !p)}
              title={darkMode ? 'Switch to dark mode' : 'Switch to light mode'}
              style={{
                background: 'var(--cafe-bg-hover)', border: '1px solid var(--cafe-border)',
                borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                fontSize: '16px', color: 'var(--cafe-text-primary)', transition: 'all 0.2s',
              }}
            >
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </header>
      )}

      {/* Desktop dropdowns */}
      {menuDropdownOpen && isDesktop && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'menu',    label: 'Menu Items' },
          { id: 'recipes', label: 'Recipes' },
          { id: 'waste',   label: 'Waste' },
        ]} activeTab={activeTab} onNavigate={(id) => { handleNavigate(id); setMenuDropdownOpen(false); }} />
      )}
      {customersDropdownOpen && isDesktop && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'crm',          label: 'Customers' },
          { id: 'reservations', label: 'Reservations' },
        ]} activeTab={activeTab} onNavigate={(id) => { handleNavigate(id); setCustomersDropdownOpen(false); }} />
      )}
      {ordersDropdownOpen && isDesktop && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'orders-standard', label: '📋 Standard', action: () => { 
            handleOrdersModeChange('standard'); 
            setOrdersDropdownOpen(false);
            handleNavigate('orders');
          }},
          { id: 'orders-toast', label: '🍞 Toast Orders', action: () => { 
            handleOrdersModeChange('toast'); 
            setOrdersDropdownOpen(false);
            handleNavigate('orders');
          }},
        ]} activeTab={activeTab} onNavigate={(id) => {}} customActions={true} />
      )}
      {tablesDropdownOpen && isDesktop && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'tables-standard', label: '🪑 Standard Grid', action: () => { 
            handleTablesModeChange('standard'); 
            setTablesDropdownOpen(false);
            handleNavigate('tables');
          }},
          { id: 'tables-toast', label: '🗺️ Toast Floor Plan', action: () => { 
            handleTablesModeChange('toast'); 
            setTablesDropdownOpen(false);
            handleNavigate('tables');
          }},
        ]} activeTab={activeTab} onNavigate={(id) => {}} customActions={true} />
      )}
      {kitchenDropdownOpen && isDesktop && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'kitchen-standard', label: '📋 Standard KDS', action: () => { 
            handleKitchenModeChange('standard'); 
            setKitchenDropdownOpen(false);
            handleNavigate('kitchen');
          }},
          { id: 'kitchen-oracle', label: '🔮 Oracle KDS', action: () => { 
            handleKitchenModeChange('oracle'); 
            setKitchenDropdownOpen(false);
            handleNavigate('kitchen');
          }},
          { id: 'kitchen-split', label: '🔄 Split KDS', action: () => { 
            handleKitchenModeChange('split'); 
            setKitchenDropdownOpen(false);
            handleNavigate('kitchen');
          }},
          { id: 'kitchen-chowbus', label: '⚡ Chowbus KDS', action: () => { 
            handleKitchenModeChange('chowbus'); 
            setKitchenDropdownOpen(false);
            handleNavigate('kitchen');
          }},
        ]} activeTab={activeTab} onNavigate={(id) => {}} customActions={true} />
      )}

      {/* ══════════════════════════════════════════════════════════════
          TABLET TOPBAR (768-1279px - always uses topbar like laptops)
          ══════════════════════════════════════════════════════════════ */}
      {isTablet && (
        <TabletTopbar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          darkMode={dm}
          storeName={storeName}
          onToggleTheme={() => setDarkMode(p => !p)}
          tabsRef={tabsRef}
          scrollTabs={scrollTabs}
          scrollBtnStyle={scrollBtnStyle}
          menuDropdownOpen={menuDropdownOpen}
          setMenuDropdownOpen={setMenuDropdownOpen}
          customersDropdownOpen={customersDropdownOpen}
          setCustomersDropdownOpen={setCustomersDropdownOpen}
          dropdownCoords={dropdownCoords}
          setDropdownCoords={setDropdownCoords}
        />
      )}

      {/* Tablet dropdowns (tablets always use topbar) */}
      {menuDropdownOpen && isTablet && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'menu',    label: 'Menu Items' },
          { id: 'recipes', label: 'Recipes' },
          { id: 'waste',   label: 'Waste' },
        ]} activeTab={activeTab} onNavigate={(id) => { handleNavigate(id); setMenuDropdownOpen(false); }} />
      )}
      {customersDropdownOpen && isTablet && (
        <DesktopDropdown ref={null} coords={dropdownCoords} items={[
          { id: 'crm',          label: 'Customers' },
          { id: 'reservations', label: 'Reservations' },
        ]} activeTab={activeTab} onNavigate={(id) => { handleNavigate(id); setCustomersDropdownOpen(false); }} />
      )}

      {/* ══════════════════════════════════════════════════════════════
          TABLET SIDEBAR (disabled - tablets now use topbar like laptops)
          ══════════════════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════════════════
          MOBILE HEADER  (phone only — top mini bar)
          ══════════════════════════════════════════════════════════════ */}
      {isMobile && (
        <MobileHeader
          storeName={storeName}
          activeTab={activeTab}
          darkMode={dm}
          onToggleTheme={() => setDarkMode(p => !p)}
          navPosition={mobileNavPosition}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          MAIN CONTENT
          ══════════════════════════════════════════════════════════════ */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        WebkitOverflowScrolling: 'touch',
        paddingLeft: isTablet ? '0' : (showTabletSidebar ? `${tabletSidebarW}px` : '0'),
        paddingBottom: isMobile && mobileNavPosition === 'bottom'
          ? 'calc(70px + env(safe-area-inset-bottom))'
          : '0',
        paddingTop: isMobile && mobileNavPosition === 'top'
          ? 'calc(56px + 64px)' // header + nav bar
          : isMobile
          ? '56px'              // just header
          : '0',
        transition: 'padding-left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {renderContent()}
      </main>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE BOTTOM / TOP NAV BAR
          ══════════════════════════════════════════════════════════════ */}
      {isMobile && (
        <MobileNavBar
          activeTab={activeTab}
          navTabs={mobileNavTabs}
          showLabels={mobileShowLabels}
          navStyle={mobileNavStyle}
          navPosition={mobileNavPosition}
          iconPx={iconPx}
          darkMode={dm}
          showMoreMenu={showMobileMoreMenu}
          onToggleMore={() => setShowMobileMoreMenu(p => !p)}
          onNavigate={handleNavigate}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          MOBILE MORE DRAWER
          ══════════════════════════════════════════════════════════════ */}
      {showMobileMoreMenu && isMobile && (
        <MobileMoreDrawer
          moreTabs={moreTabs}
          activeTab={activeTab}
          navPosition={mobileNavPosition}
          darkMode={dm}
          onNavigate={handleNavigate}
          onClose={() => setShowMobileMoreMenu(false)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════════════ */

/* ── Scroll arrow style (shared) ─────────────────────────────────────── */
const scrollBtnStyle = {
  background: 'var(--cafe-bg-elevated)',
  color: 'var(--cafe-text-primary)',
  border: '1px solid var(--cafe-border)',
  borderRadius: '50%',
  width: '28px', height: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
  boxShadow: 'var(--cafe-shadow-sm)',
  transition: 'all 0.2s ease',
  outline: 'none', flexShrink: 0,
};

/* ── Desktop dropdown ────────────────────────────────────────────────── */
function DesktopDropdown({ coords, items, activeTab, onNavigate, customActions = false }) {
  return (
    <div
      data-dropdown
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        background: '#1e1e2e',
        border: '1px solid #3d3d5c',
        borderRadius: '10px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
        zIndex: 999999,
        minWidth: '150px',
        padding: '4px',
      }}
    >
      {items.map(item => (
        <button
          key={item.id}
          data-dropdown-trigger
          type="button"
          onClick={() => {
            if (customActions && item.action) {
              item.action();
            }
            onNavigate(item.id);
          }}
          style={{
            width: '100%', textAlign: 'left',
            padding: '10px 16px',
            background: activeTab === item.id ? '#6366f1' : '#222222',
            color: activeTab === item.id ? '#ffffff' : '#e0e0e0',
            border: 'none', borderRadius: '6px',
            fontSize: '13px', fontWeight: activeTab === item.id ? '600' : '400',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { if (activeTab !== item.id) e.currentTarget.style.background = '#3d3d5c'; }}
          onMouseLeave={e => { if (activeTab !== item.id) e.currentTarget.style.background = '#222222'; }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ── Mobile Header ────────────────────────────────────────────────────── */
function MobileHeader({ storeName, activeTab, darkMode: dm, onToggleTheme, navPosition }) {
  const currentTab = TAB_BY_ID[activeTab];
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: '56px',
      background: dm
        ? 'rgba(15,15,30,0.92)'
        : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 'calc(16px + env(safe-area-inset-left))',
      paddingRight: 'calc(16px + env(safe-area-inset-right))',
      zIndex: 2100,
      boxShadow: dm ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
    }}>
      {/* Left: logo + store name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', boxShadow: '0 0 12px rgba(59,130,246,0.4)',
        }}>🥐</div>
        <div>
          <div style={{
            fontSize: '15px', fontWeight: '700', lineHeight: 1,
            color: dm ? '#ffffff' : '#0a0a0a',
            letterSpacing: '-0.02em',
          }}>{storeName}</div>
          {currentTab && (
            <div style={{ fontSize: '11px', color: dm ? '#9ca3af' : '#6b7280', marginTop: '1px' }}>
              {currentTab.icon} {currentTab.label}
            </div>
          )}
        </div>
      </div>

      {/* Right: theme toggle */}
      <button
        onClick={onToggleTheme}
        style={{
          background: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          border: 'none', borderRadius: '8px',
          padding: '6px 8px', cursor: 'pointer', fontSize: '18px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {dm ? '🌙' : '☀️'}
      </button>
    </div>
  );
}

/* ── Mobile Nav Bar ───────────────────────────────────────────────────── */
function MobileNavBar({
  activeTab, navTabs, showLabels, navStyle, navPosition,
  iconPx, darkMode: dm, showMoreMenu, onToggleMore, onNavigate,
}) {
  const isBottom = navPosition !== 'top';

  const barBg = dm
    ? 'rgba(15, 15, 30, 0.96)'
    : 'rgba(255, 255, 255, 0.96)';
  const barBorder = dm
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(0,0,0,0.08)';

  return (
    <div style={{
      position: 'fixed',
      ...(isBottom
        ? { bottom: 0 }
        : { top: '56px' }  /* below mobile header */
      ),
      left: 0, right: 0,
      background: barBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop:    isBottom ? `1px solid ${barBorder}` : 'none',
      borderBottom: isBottom ? 'none' : `1px solid ${barBorder}`,
      paddingTop:    isBottom ? '8px'  : '10px',
      paddingBottom: isBottom
        ? 'calc(12px + env(safe-area-inset-bottom))'
        : '8px',
      paddingLeft:  'calc(8px + env(safe-area-inset-left))',
      paddingRight: 'calc(8px + env(safe-area-inset-right))',
      display: 'flex',
      gap: '4px',
      zIndex: 2000,
      boxShadow: isBottom
        ? `0 -4px 24px ${dm ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'}`
        : `0 4px 24px ${dm ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.12)'}`,
    }}>
      {navTabs.map(tabId => {
        const tab = tabId === 'more'
          ? { id: 'more', label: 'More', icon: '⋯' }
          : (TAB_BY_ID[tabId] || { id: tabId, label: tabId, icon: '⋯' });

        const isActive = tabId === 'more' ? showMoreMenu : activeTab === tab.id;

        return (
          <NavBarButton
            key={tab.id}
            tab={tab}
            isActive={isActive}
            navStyle={navStyle}
            showLabels={showLabels}
            iconPx={iconPx}
            darkMode={dm}
            onClick={() => tabId === 'more' ? onToggleMore() : onNavigate(tab.id)}
          />
        );
      })}
    </div>
  );
}

/* ── Individual nav bar button ───────────────────────────────────────── */
function NavBarButton({ tab, isActive, navStyle, showLabels, iconPx, darkMode: dm, onClick }) {
  const accent = '#6366f1';

  const getBg = () => {
    if (!isActive) return 'transparent';
    if (navStyle === 'pill')       return dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)';
    return 'transparent';
  };

  const getColor = () => isActive ? accent : (dm ? '#6b7280' : '#9ca3af');

  const getUnderlineStyle = () => {
    if (navStyle !== 'underline') return {};
    return {
      borderBottom: isActive ? `2.5px solid ${accent}` : '2.5px solid transparent',
      borderRadius: 0,
      paddingBottom: '4px',
    };
  };

  return (
    <button
      className="mob-nav-btn"
      onClick={onClick}
      style={{
        flex: 1,
        padding: navStyle === 'icon-only' ? '10px 4px' : '8px 4px',
        background: getBg(),
        color: getColor(),
        border: 'none',
        borderRadius: navStyle === 'pill' ? '12px' : navStyle === 'underline' ? '0' : '10px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: showLabels && navStyle !== 'icon-only' ? '3px' : '0',
        outline: 'none',
        position: 'relative',
        ...getUnderlineStyle(),
      }}
    >
      {/* Pill active indicator dot (above icon) */}
      {navStyle === 'pill' && isActive && (
        <span style={{
          position: 'absolute',
          top: '6px',
          width: '4px', height: '4px',
          borderRadius: '50%',
          background: accent,
          boxShadow: `0 0 6px ${accent}`,
        }} />
      )}
      <span style={{
        fontSize: iconPx,
        lineHeight: 1,
        filter: isActive ? `drop-shadow(0 0 6px ${accent}88)` : 'none',
        transition: 'filter 0.2s',
      }}>
        {tab.icon}
      </span>
      {showLabels && navStyle !== 'icon-only' && (
        <span style={{
          fontSize: '9px',
          fontWeight: isActive ? '700' : '500',
          letterSpacing: '0.01em',
          color: getColor(),
          textTransform: 'uppercase',
        }}>
          {tab.label.length > 6 ? tab.label.slice(0, 6) : tab.label}
        </span>
      )}
    </button>
  );
}

/* ── Mobile More Drawer ──────────────────────────────────────────────── */
function MobileMoreDrawer({ moreTabs, activeTab, navPosition, darkMode: dm, onNavigate, onClose }) {
  const isBottom = navPosition !== 'top';
  const bg = dm ? '#000000' : '#ffffff';
  const border = dm ? '#222222' : '#e5e7eb';

  return (
    <>
      {/* Backdrop */}
      <div
        className="more-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(2px)',
          zIndex: 2050,
        }}
      />
      {/* Drawer */}
      <div
        className="more-drawer"
        style={{
          position: 'fixed',
          ...(isBottom
            ? { bottom: 'calc(70px + env(safe-area-inset-bottom))' }
            : { top: 'calc(56px + 64px)' }
          ),
          left: '12px', right: '12px',
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: '20px',
          boxShadow: dm
            ? '0 -8px 40px rgba(0,0,0,0.6)'
            : '0 -8px 40px rgba(0,0,0,0.15)',
          zIndex: 2051,
          padding: '16px',
          maxHeight: '55vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: dm ? '#9ca3af' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            More
          </span>
          <button
            onClick={onClose}
            style={{
              background: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              border: 'none', borderRadius: '8px',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: '14px',
              color: dm ? '#9ca3af' : '#6b7280',
            }}
          >✕</button>
        </div>

        {/* Grid of tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}>
          {moreTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className="mob-nav-btn"
                onClick={() => onNavigate(tab.id)}
                style={{
                  padding: '14px 8px',
                  background: isActive
                    ? (dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                    : (dm ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                  color: isActive ? '#6366f1' : (dm ? '#d1d5db' : '#111111'),
                  border: isActive
                    ? '1px solid rgba(99,102,241,0.4)'
                    : `1px solid ${dm ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
              >
                <span style={{ fontSize: '22px' }}>{tab.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500', textAlign: 'center' }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Tablet Sidebar ──────────────────────────────────────────────────── */
function TabletSidebar({
  activeTab, onNavigate, isOpen, onToggle, mode,
  width, darkMode: dm, storeName, onToggleTheme, isDark,
}) {
  const bg     = dm ? '#0a0a0a' : '#ffffff';
  const border = dm ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const accent = '#6366f1';

  const showText = mode === 'full' ? isOpen : false;

  /* Sidebar groups */
  const primary = ALL_TABS.filter(t => ['orders','dashboard','reports','crm','staff'].includes(t.id));
  const secondary = ALL_TABS.filter(t => ['menu','inventory','recipes','waste'].includes(t.id));
  const operations = ALL_TABS.filter(t => ['tables','waiters','kitchen','tokens','reservations'].includes(t.id));
  const system = ALL_TABS.filter(t => ['settings'].includes(t.id));

  const renderGroup = (label, tabs) => (
    <div style={{ marginBottom: '8px' }}>
      {showText && (
        <div style={{
          padding: '4px 12px', fontSize: '10px', fontWeight: '700',
          color: dm ? '#222222' : '#9ca3af', textTransform: 'uppercase',
          letterSpacing: '0.08em', marginBottom: '2px',
        }}>
          {label}
        </div>
      )}
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className="tablet-sidebar-btn"
            title={!showText ? tab.label : undefined}
            onClick={() => onNavigate(tab.id)}
            style={{
              width: '100%',
              padding: showText ? '10px 14px' : '10px 0',
              background: isActive
                ? (dm ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)')
                : 'transparent',
              color: isActive ? accent : (dm ? '#9ca3af' : '#6b7280'),
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: showText ? 'flex-start' : 'center',
              gap: showText ? '10px' : '0',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              transition: 'all 0.15s ease',
              outline: 'none',
              marginBottom: '2px',
              position: 'relative',
            }}
          >
            {/* Active bar */}
            {isActive && (
              <span style={{
                position: 'absolute',
                left: 0, top: '25%', bottom: '25%',
                width: '3px', borderRadius: '0 3px 3px 0',
                background: accent,
              }} />
            )}
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{tab.icon}</span>
            {showText && (
              <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tab.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="tablet-sidebar"
      style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        width: `${width}px`,
        background: bg,
        borderRight: `1px solid ${border}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1500,
        boxShadow: dm ? '2px 0 20px rgba(0,0,0,0.3)' : '2px 0 12px rgba(0,0,0,0.06)',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Top: logo + toggle */}
      <div style={{
        padding: showText ? '16px 14px' : '16px 0',
        borderBottom: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: showText ? 'space-between' : 'center',
        flexShrink: 0,
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px',
          }}>🥐</div>
          {showText && (
            <span style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#fff' : '#0a0a0a', whiteSpace: 'nowrap' }}>
              {storeName}
            </span>
          )}
        </div>
        {mode === 'full' && (
          <button
            onClick={onToggle}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            style={{
              background: 'transparent', border: 'none',
              cursor: 'pointer', fontSize: '16px',
              color: dm ? '#6b7280' : '#9ca3af',
              padding: '4px', borderRadius: '6px',
              flexShrink: 0,
            }}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        )}
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, padding: showText ? '12px 10px' : '12px 6px', overflowY: 'auto' }}>
        {renderGroup('Main', primary)}
        {renderGroup('Menu', secondary)}
        {renderGroup('Operations', operations)}
        {renderGroup('System', system)}
      </div>

      {/* Bottom: theme toggle */}
      <div style={{
        padding: showText ? '12px 14px' : '12px 6px',
        borderTop: `1px solid ${border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onToggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          style={{
            width: '100%',
            padding: showText ? '10px 14px' : '10px 0',
            background: 'transparent', border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: showText ? 'flex-start' : 'center',
            gap: showText ? '10px' : '0',
            borderRadius: '10px',
            color: dm ? '#9ca3af' : '#6b7280',
            fontSize: '14px', transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '18px' }}>{isDark ? '🌙' : '☀️'}</span>
          {showText && <span>Theme</span>}
        </button>
      </div>
    </div>
  );
}

/* ── Tablet Topbar ────────────────────────────────────────────────────── */
function TabletTopbar({
  activeTab, onNavigate, darkMode: dm, storeName, onToggleTheme,
  tabsRef, scrollTabs, scrollBtnStyle,
  menuDropdownOpen, setMenuDropdownOpen,
  customersDropdownOpen, setCustomersDropdownOpen,
  dropdownCoords, setDropdownCoords,
}) {
  return (
    <header style={{
      background: 'var(--cafe-bg-elevated)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--cafe-border)',
      boxShadow: 'var(--cafe-shadow-sm)',
      height: '56px',
      flexShrink: 0,
      zIndex: 1000,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--cafe-accent) 0%, var(--cafe-accent-light) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', boxShadow: 'var(--cafe-shadow-glow)',
        }}>🥐</div>
        <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--cafe-text-primary)', letterSpacing: '-0.03em' }}>
          {storeName}
        </span>
      </div>

      {/* Tab scroll bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center', maxWidth: '700px', minWidth: 0, margin: '0 12px' }}>
        <button onClick={() => scrollTabs('left')} style={scrollBtnStyle}>‹</button>
        <div ref={tabsRef} className="no-scrollbar" style={{
          display: 'flex', gap: '4px', overflowX: 'auto', overflowY: 'hidden',
          scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch',
          paddingBottom: '2px', flex: 1, minWidth: 0, whiteSpace: 'nowrap',
        }}>
          {[
            { id: 'orders', label: 'Orders' },
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'reports', label: 'Reports' },
            { id: 'crm', label: 'Customers', hasDropdown: true },
            { id: 'staff', label: 'Staff' },
            { id: 'menu', label: 'Menu', hasDropdown: true },
            { id: 'tokens', label: 'Tokens' },
            { id: 'tables', label: 'Tables' },
            { id: 'waiters', label: 'Waiters' },
            { id: 'kitchen', label: 'Kitchen' },
            { id: 'settings', label: 'Settings' },
          ].map(item => (
            <button
              key={item.id}
              data-dropdown-trigger
              onClick={(e) => {
                e.stopPropagation();
                if (item.hasDropdown) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropdownCoords({ top: rect.bottom + 4, left: rect.left });
                  if (item.id === 'menu')      { setMenuDropdownOpen(p => !p); setCustomersDropdownOpen(false); }
                  if (item.id === 'crm')       { setCustomersDropdownOpen(p => !p); setMenuDropdownOpen(false); }
                } else {
                  onNavigate(item.id);
                }
              }}
              style={{
                padding: '6px 12px',
                background: activeTab === item.id ? 'var(--cafe-accent)' : 'transparent',
                color: activeTab === item.id ? '#ffffff' : 'var(--cafe-text-secondary)',
                border: 'none', borderRadius: '8px',
                fontSize: '12px', fontWeight: activeTab === item.id ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === item.id ? 'var(--cafe-shadow-glow)' : 'none',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {item.label}
              {item.hasDropdown && <span style={{ fontSize: '10px' }}>▼</span>}
            </button>
          ))}
        </div>
        <button onClick={() => scrollTabs('right')} style={scrollBtnStyle}>›</button>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={onToggleTheme}
          style={{
            background: 'var(--cafe-bg-hover)', border: '1px solid var(--cafe-border)',
            borderRadius: '8px', padding: '6px 8px', cursor: 'pointer',
            fontSize: '14px', color: 'var(--cafe-text-primary)', transition: 'all 0.2s',
          }}
        >
          {dm ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}

