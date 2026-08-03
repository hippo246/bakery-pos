import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { C } from "../../styles/theme";
import LiveClock from "../common/LiveClock";
import NotificationBell from "../notifications/NotificationBell";
import CommandPalette from "../common/CommandPalette";
import "../../styles/responsive.css";
import { isSetupIncomplete, isDemoMode, exitDemoMode } from "../../utils/appMode.js";
import { isFeatureEnabled } from "../../utils/featureConfig.js";

// Monoline SVG icons — no emoji, no fat color glyphs
const Icon = ({ name, size = 15, color = "currentColor" }) => {
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="12" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="3" y="12" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="12" y="12" width="7" height="7" rx="1" stroke={color} strokeWidth="1.4" fill="none"/></>,
    orders:    <><rect x="4" y="3" width="12" height="15" rx="1.5" stroke={color} strokeWidth="1.4" fill="none"/><line x1="7" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.4"/><line x1="7" y1="11.5" x2="14" y2="11.5" stroke={color} strokeWidth="1.4"/><line x1="7" y1="15" x2="11" y2="15" stroke={color} strokeWidth="1.4"/></>,
    kitchen:   <><path d="M5 3v7a4 4 0 0 0 8 0V3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/><line x1="9" y1="14" x2="9" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><line x1="6" y1="20" x2="12" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    crm:       <><circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.4" fill="none"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/><circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="1.4" fill="none"/><path d="M19.5 19c0-2.5-1.8-4.6-4.1-5.4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    analytics: <><polyline points="3,17 8,11 12,14 17,7" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="20" x2="20" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    menu:      <><rect x="3" y="3" width="7" height="9" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="13" y="3" width="7" height="5" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="13" y="11" width="7" height="9" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="3" y="15" width="7" height="5" rx="1" stroke={color} strokeWidth="1.4" fill="none"/></>,
    inventory: <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><polyline points="3,8 12,13 21,8" stroke={color} strokeWidth="1.4" fill="none"/><line x1="12" y1="13" x2="12" y2="21" stroke={color} strokeWidth="1.4"/></>,
    staff:     <><circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth="1.4" fill="none"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    tables:    <><rect x="2" y="6" width="20" height="3" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><line x1="8" y1="9" x2="6" y2="18" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><line x1="16" y1="9" x2="18" y2="18" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    delivery:  <><rect x="2" y="8" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.4" fill="none"/><polyline points="16,10 21,10 21,18 16,18" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><circle cx="7" cy="18" r="2" stroke={color} strokeWidth="1.4" fill="none"/><circle cx="16" cy="18" r="2" stroke={color} strokeWidth="1.4" fill="none"/></>,
    qr:        <><rect x="3" y="3" width="16" height="16" rx="2" stroke={color} strokeWidth="1.4" fill="none"/><rect x="6" y="6" width="3" height="3" fill={color}/><rect x="13" y="6" width="3" height="3" fill={color}/><rect x="6" y="13" width="3" height="3" fill={color}/><rect x="10" y="10" width="3" height="3" fill={color}/><rect x="13" y="13" width="3" height="3" fill={color}/></>,
    production: <><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5l7 3.5v7l-7 3.5-7-3.5v-7l7-3.5z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><path d="M12 7v5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><path d="M9 9l3-2 3 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
    tracking:  <><path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.4" fill="none"/><path d="M12 9v3l2 1" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
    intelligence: <><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.4" fill="none"/><path d="M12 9v3l2 1" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
    health: <><path d="M22 12h-4l-3 9L9 3l-6 9H2" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.4" fill="none"/><path d="M12 9v3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    operations: <><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9,5 9,11 13,11 13,5" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 11l4 4 4-4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    workflows: <><path d="M9 11l3 3L22 4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    purchasing: <><path d="M6 2L2 6v14l4 4h14l4-4V6l-4-4H6z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><line x1="6" y1="2" x2="6" y2="22" stroke={color} strokeWidth="1.4"/><line x1="2" y1="6" x2="22" y2="6" stroke={color} strokeWidth="1.4"/><path d="M9 10l2 2 4-4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><line x1="9" y1="16" x2="15" y2="16" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    expenses:  <><path d="M20 12V8H4v12h16v-4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 16l4-4-4-4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="20" y1="12" x2="12" y2="12" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    documents: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><polyline points="10,9 9,9 8,9" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    notifications: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>,
    activity: <><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    backup: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="17,21 17,13 7,13 7,21" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><polyline points="7,3 7,8 15,8" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    security:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    settings:  <><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.4" fill="none"/><path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.8a7 7 0 0 1 1.7.7l.6-.6a1.5 1.5 0 1 1 2.1 2.1l-.6.6c.3.5.5 1.1.7 1.7h.8a1.5 1.5 0 0 1 0 3h-.8a7 7 0 0 1-.7 1.7l.6.6a1.5 1.5 0 1 1-2.1 2.1l-.6-.6a7 7 0 0 1-1.7.7v.8a1.5 1.5 0 0 1-3 0v-.8a7 7 0 0 1-1.7-.7l-.6.6a1.5 1.5 0 1 1-2.1-2.1l.6-.6A7 7 0 0 1 4.3 13h-.8a1.5 1.5 0 0 1 0-3h.8a7 7 0 0 1 .7-1.7l-.6-.6A1.5 1.5 0 1 1 6.5 5.6l.6.6A7 7 0 0 1 8.8 5.5v-.8A1.5 1.5 0 0 1 10.5 3V2a1.5 1.5 0 0 1 1.5 0z" stroke={color} strokeWidth="1.4" fill="none"/>,</>,
  };
  return <svg viewBox="0 0 22 22" style={s} xmlns="http://www.w3.org/2000/svg">{paths[name]}</svg>;
};

const NAV_GROUPS = [
  {
    title: "Operations",
    items: [
      { id: "dashboard", label: "Today's Counter", short: "Counter", featureId: "dashboard" },
      { id: "orders",    label: "POS",             short: "POS",     featureId: "orders" },
      { id: "kitchen",   label: "Kitchen Flow",    short: "Kitchen", featureId: "kitchen" },
      { id: "tables",    label: "Floor Plan",      short: "Floor",   featureId: "tables" },
    ]
  },
  {
    title: "Management",
    items: [
      { id: "analytics", label: "Reports",         short: "Reports", featureId: "analytics" },
      { id: "crm",       label: "Guests",          short: "Guests",  featureId: "crm" },
      { id: "staff",     label: "Staff",           short: "Staff",   featureId: "staff" },
      { id: "menu",      label: "Menu Management", short: "Menu",    featureId: "menu" },
      { id: "inventory", label: "Stock Room",      short: "Stock",   featureId: "inventory" },
    ]
  },
  {
    title: "Logistics",
    items: [
      { id: "delivery",  label: "Delivery",        short: "Delivery", featureId: "delivery" },
      { id: "qr",        label: "QR Ordering",     short: "QR",      featureId: "qrOrdering" },
      { id: "production",label: "Production",      short: "Production", featureId: "production" },
      { id: "tracking",  label: "Route & Tracking", short: "Tracking", featureId: "routeTracking" },
      { id: "purchasing",label: "Purchasing Desk",  short: "Purchasing", featureId: "purchasing" },
    ]
  },
  {
    title: "Finance & Docs",
    items: [
      { id: "documents", label: "Receipts & Documents", short: "Documents", featureId: "documents" },
      { id: "expenses",  label: "Cost Control",    short: "Cost",    featureId: "expenses" },
    ]
  },
  {
    title: "System",
    items: [
      { id: "intelligence", label: "Intelligence", short: "Intel", featureId: null },
      { id: "health",    label: "System Health",    short: "Health",   featureId: null },
      { id: "operations", label: "Operations Center", short: "Ops",      featureId: "operationsDashboard" },
      { id: "activity",  label: "Activity Feed",   short: "Activity", featureId: null },
      { id: "notifications", label: "Inbox",       short: "Inbox",    featureId: null },
      { id: "workflows", label: "Workflows",        short: "Workflows", featureId: "workflows" },
      { id: "backup",    label: "Backup & Data",   short: "Backup",  featureId: "backup" },
      { id: "security",  label: "Security",        short: "Security", featureId: null },
      { id: "settings",  label: "Settings",        short: "Settings", featureId: null },
    ]
  }
];

const NAV = NAV_GROUPS.flatMap(g => g.items);

// First 4 get their own bottom-nav slot; the rest live in the More tray
const NAV_PRIMARY   = NAV.slice(0, 4);
const NAV_SECONDARY = NAV.slice(4);

const TITLES = {
  dashboard: "Today's Counter", orders: "POS", kitchen: "Kitchen Flow", crm: "Customers",
  analytics: "Reports", menu: "Menu Management", inventory: "Stock Room",
  staff: "Staff Management", tables: "Floor Plan",
  delivery: "Delivery Partners", qr: "QR Ordering", production: "Production Control", tracking: "Route & Tracking", purchasing: "Purchasing Desk", documents: "Receipts & Documents", expenses: "Cost Control", workflows: "Workflows", intelligence: "Operations Intelligence", health: "System Health", operations: "Operations Center", activity: "Activity Feed", notifications: "Operational Inbox", backup: "Backup & Data Center", security: "Security & Access", settings: "Settings",
};

export default function Layout({ tab, setTab, children, newOrderCount, urgentKds, notificationCount, theme, toggleTheme, notifications, setNotifications, appMode, role, setRole, canSeeTab }) {
  const [isOpen,       setIsOpen]       = useState(true);
  const [showMoreTray, setShowMoreTray] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Reactive mobile breakpoint — drives conditional JSX, not just CSS
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  const [isTablet, setIsTablet] = useState(() => typeof window !== "undefined" && window.innerWidth > 700 && window.innerWidth <= 1024);
  const [isSmallDesktop, setIsSmallDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth > 1024 && window.innerWidth <= 1280);
  
  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 700);
      setIsTablet(width > 700 && width <= 1024);
      setIsSmallDesktop(width > 1024 && width <= 1280);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close more tray when tab changes
  useEffect(() => { setShowMoreTray(false); }, [tab]);

  // Escape closes more tray
  useEffect(() => {
    const onKey = (e) => { 
      if (e.key === "Escape") {
        setShowMoreTray(false);
        setCommandPaletteOpen(false);
      }
      // Ctrl+K or Cmd+K opens command palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Safe badge: only positive integers, capped at 99, never NaN/undefined
  const badge = (id) => {
    const raw = id === "orders" ? newOrderCount : id === "kitchen" ? urgentKds : id === "notifications" ? notificationCount : 0;
    const n = Number(raw);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  };
  const badgeLabel = (n) => { const v = badge(n); return v > 99 ? "99+" : String(v); };

  const validTab = NAV.some(n => n.id === tab);
  const safeTitle = validTab ? (TITLES[tab] || String(tab || "")) : "CafeOS";
  const inMoreTray = NAV_SECONDARY.some(n => n.id === tab);
  const safeSetTab = (id) => { 
    // Guard: If setup is incomplete, only allow navigation to settings (for setup) or backup (for restore)
    if (isSetupIncomplete() && id !== "settings" && id !== "backup") {
      // In a real implementation, this would show a dialog or redirect
      // For now, we'll allow navigation but could add a warning banner
      console.warn('[Layout] Setup incomplete - navigation restricted');
    }
    if (typeof setTab === "function") setTab(id); 
  };

  // Handle command palette navigation
  const handleCommandNavigate = useCallback((item) => {
    // Map command palette items to actual tabs
    const tabMapping = {
      "dashboard": "dashboard",
      "orders": "orders",
      "kitchen": "kitchen",
      "menu": "menu",
      "guests": "crm",
      "tables": "tables",
      "reservations": "tables",
      "inventory": "inventory",
      "purchasing": "purchasing",
      "production": "production",
      "delivery": "delivery",
      "tracking": "tracking",
      "performance": "analytics",
      "staff": "staff",
      "settings": "settings",
      "displays": "notifications",
      "notifications": "notifications",
      "new-order": "orders",
      "add-guest": "crm",
      "add-menu-item": "menu",
      "create-reservation": "tables",
      "add-inventory": "inventory",
      "new-purchase-order": "purchasing",
      "new-production-batch": "production"
    };
    
    const targetTab = tabMapping[item.id] || item.module?.toLowerCase();
    if (targetTab) {
      safeSetTab(targetTab);
    }
  }, [safeSetTab]);

  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
    if (tab && !validTab) console.warn("[Layout] Unknown tab: \"" + tab + "\". Expected: " + NAV.map(n => n.id).join(", "));
    if (!setTab) console.warn("[Layout] setTab prop missing — nav clicks will be no-ops.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100vw", background: C.bg, color: C.text, fontFamily: "'Sora','Inter',sans-serif", overflow: "hidden", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: 0, boxSizing: "border-box" }}>

      {/* ── Mobile header ─────────────────────────────────────────── */}
      {isMobile && (
        <div style={{ 
          display: "flex", width: "100%", 
          padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px", 
          alignItems: "center", gap: 12, 
          background: "var(--cafe-bg-elevated)", 
          borderBottom: `1px solid var(--cafe-border)`, 
          minHeight: 64, 
          height: "calc(64px + env(safe-area-inset-top, 0px))", 
          boxSizing: "border-box", 
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 100
        }}>
          {/* Logo mark */}
          <div style={{ position: "relative" }}>
            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <rect width="32" height="32" rx="10" fill="var(--cafe-accent)"/>
              <rect x="8" y="10" width="16" height="2" rx="1" fill="#1A1208" fillOpacity="0.8"/>
              <rect x="10" y="14" width="12" height="10" rx="2" fill="#1A1208" fillOpacity="0.8"/>
            </svg>
            {appMode === "demo" && (
              <div style={{
                position: "absolute", bottom: -4, right: -4,
                background: "var(--cafe-warning)", width: 12, height: 12,
                borderRadius: "50%", border: "2px solid var(--cafe-bg-elevated)",
                boxShadow: "0 0 4px var(--cafe-warning)"
              }} />
            )}
          </div>

          {/* Current tab title & Status */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--cafe-text-primary)", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
              {safeTitle}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: isOpen ? "var(--cafe-success)" : "var(--cafe-danger)",
                boxShadow: `0 0 6px ${isOpen ? "var(--cafe-success)" : "var(--cafe-danger)"}`,
              }} />
              <span style={{ fontSize: 10, color: isOpen ? "var(--cafe-success)" : "var(--cafe-danger)", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {isOpen ? "System Live" : "System Offline"}
              </span>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationBell 
              notifications={notifications} 
              setNotifications={setNotifications}
              onNavigateToInbox={() => safeSetTab('notifications')}
            />
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "var(--cafe-accent-dim)",
              border: `1.5px solid var(--cafe-accent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, color: "var(--cafe-accent)", fontWeight: 800,
            }}>AD</div>
          </div>
        </div>
      )}

      {/* ── Sidebar + Main row ────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Overlay behind sidebar on mobile — not needed, sidebar gone on mobile */}

        {/* Sidebar — desktop only */}
        {!isMobile && (
        <div style={{
          width: 220, background: "var(--cafe-bg-elevated)", borderRight: `1px solid var(--cafe-border)`,
          display: "flex", flexDirection: "column", flexShrink: 0,
          height: "100%", overflow: "hidden",
        }}>
          {/* Brand lockup */}
          <div style={{ padding: "20px 16px 18px", borderBottom: `1px solid var(--cafe-border)`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect width="32" height="32" rx="8" fill="var(--cafe-accent)"/>
                <rect x="8" y="10" width="16" height="2" rx="1" fill="rgba(26,18,8,0.6)"/>
                <rect x="10" y="14" width="12" height="10" rx="2" fill="rgba(26,18,8,0.6)"/>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                    Cafe<span style={{ color: "var(--cafe-accent)" }}>OS</span>
                  </div>
                  {appMode === "demo" && (
                    <span style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--cafe-text-tertiary)",
                      background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border-light)",
                      padding: "2px 6px",
                      borderRadius: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em"
                    }}>
                      Demo
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", marginTop: 4, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>Operating System</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "10px 10px", overflowY: "auto", scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter(n => 
                (!n.featureId || isFeatureEnabled(n.featureId)) && 
                (typeof canSeeTab !== 'function' || canSeeTab(n.id))
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} style={{ marginBottom: 16 }}>
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 700, 
                    color: "var(--cafe-text-muted)", 
                    letterSpacing: "0.08em", 
                    textTransform: "uppercase", 
                    padding: "0 12px 8px",
                  }}>
                    {group.title}
                  </div>
                  {visibleItems.map((n) => {
                    const active = tab === n.id;
                    const b = badge(n.id);
                    return (
                      <button key={n.id} onClick={() => safeSetTab(n.id)}
                        aria-label={n.label} aria-current={active ? "page" : undefined}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, padding: "0 12px",
                          borderRadius: "var(--cafe-radius-md)", cursor: "pointer",
                          fontWeight: active ? 600 : 500,
                          color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                          background: active ? "var(--cafe-accent-dim)" : "transparent",
                          border: "none",
                          marginBottom: 2, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          height: 38, width: "100%", textAlign: "left",
                          boxSizing: "border-box", position: "relative",
                          boxShadow: active ? "inset 0 0 0 1px var(--cafe-accent-border)" : "none",
                        }}>
                        {/* Active indicator pill on left edge */}
                        {active && <span style={{ position: "absolute", left: -2, top: "25%", height: "50%", width: 4, borderRadius: "0 4px 4px 0", background: "var(--cafe-accent)", boxShadow: "var(--cafe-shadow-glow)" }} />}
                        <Icon name={n.id} size={16} color={active ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)"} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: 13, letterSpacing: "-0.01em" }}>{n.label}</span>
                        {b > 0 && (
                          <span style={{
                            marginLeft: "auto", flexShrink: 0,
                            background: n.id === "kitchen" ? "var(--cafe-danger)" : (active ? "var(--cafe-accent)" : "var(--cafe-bg-card)"),
                            color: active ? "#fff" : "var(--cafe-text-secondary)",
                            fontSize: 10, fontWeight: 700,
                            padding: "2px 6px", borderRadius: "var(--cafe-radius-sm)",
                            letterSpacing: "0.03em",
                            minWidth: 18, textAlign: "center",
                            border: active ? "none" : "1px solid var(--cafe-border)",
                          }}>{badgeLabel(n.id)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* Status + theme footer */}
          <div style={{ padding: "12px 10px", borderTop: `1px solid var(--cafe-border)`, display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Role Switcher */}
            {typeof setRole === 'function' && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--cafe-text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>
                  Active Role
                </div>
                <select
                  value={role || 'owner'}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: "100%", fontSize: 12,
                    background: "var(--cafe-bg-surface)",
                    color: "var(--cafe-text-secondary)",
                    padding: "8px 10px", borderRadius: "var(--cafe-radius-md)",
                    border: "1px solid var(--cafe-border)",
                    cursor: "pointer", height: 36,
                    fontWeight: 500,
                  }}
                >
                  <option value="owner">👑 Owner</option>
                  <option value="manager">🏢 Manager</option>
                  <option value="staff">🧑‍💼 Staff</option>
                  <option value="cashier">💰 Cashier</option>
                  <option value="kitchen">👨‍🍳 Kitchen</option>
                </select>
              </div>
            )}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              style={{
                width: "100%", fontSize: 11,
                background: "var(--cafe-bg-surface)",
                color: "var(--cafe-text-secondary)",
                padding: "10px 12px", borderRadius: "var(--cafe-radius-md)",
                border: `1px solid var(--cafe-border)`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                fontWeight: 500, letterSpacing: "0.04em", transition: "all 0.15s ease", height: 40,
              }}
            >
              <span style={{ fontSize: 14 }}>🔍</span>
              <span>Search...</span>
              <kbd style={{ marginLeft: "auto", fontSize: 9, padding: "2px 6px", background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: 4 }}>⌘K</kbd>
            </button>
            {isDemoMode() && (
              <button
                onClick={() => {
                  if (confirm("Exit demo mode and switch to production? This will clear demo data.")) {
                    exitDemoMode();
                    window.location.reload();
                  }
                }}
                style={{
                  width: "100%", fontSize: 11,
                  background: "var(--cafe-danger-bg)",
                  color: "var(--cafe-danger)",
                  padding: "10px 12px", borderRadius: "var(--cafe-radius-md)",
                  border: `1px solid var(--cafe-danger-border)`,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  fontWeight: 600, letterSpacing: "0.04em", transition: "all 0.15s ease", height: 40,
                }}
              >
                <span style={{ fontSize: 14 }}>🚪</span>
                <span>Exit Demo</span>
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NotificationBell 
                notifications={notifications} 
                setNotifications={setNotifications}
                onNavigateToInbox={() => safeSetTab('notifications')}
              />
            </div>
            <button
              onClick={() => setIsOpen(o => !o)}
              aria-label={isOpen ? "Mark cafe as closed" : "Mark cafe as open"}
              aria-pressed={isOpen}
              style={{
                width: "100%", fontSize: 11,
                background: isOpen ? "var(--cafe-success-bg)" : "var(--cafe-danger-bg)",
                color: isOpen ? "var(--cafe-success)" : "var(--cafe-danger)",
                padding: "10px 12px", borderRadius: "var(--cafe-radius-md)",
                border: `1px solid ${isOpen ? "var(--cafe-success-border)" : "var(--cafe-danger-border)"}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                fontWeight: 600, letterSpacing: "0.04em", transition: "all 0.15s ease", height: 40,
              }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: isOpen ? "var(--cafe-success)" : "var(--cafe-danger)",
                boxShadow: `0 0 8px ${isOpen ? "var(--cafe-success)" : "var(--cafe-danger)"}`,
                flexShrink: 0,
              }} />
              {isOpen ? "Open Now" : "Closed"}
            </button>
            <button
              onClick={() => typeof toggleTheme === "function" && toggleTheme()}
              aria-label={`Switch to ${typeof theme === "string" && theme === "dark" ? "light" : "dark"} theme`}
              style={{
                width: "100%", fontSize: 11,
                background: "var(--cafe-bg-surface)", color: "var(--cafe-text-secondary)",
                padding: "10px 12px", borderRadius: "var(--cafe-radius-md)",
                border: `1px solid var(--cafe-border-light)`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                fontWeight: 500, letterSpacing: "0.02em", transition: "all 0.15s ease", height: 40,
              }}>
              <span style={{ fontSize: 13 }}>{typeof theme === "string" ? (theme === "dark" ? "◐" : "◑") : "◐"}</span>
              {typeof theme === "string" ? (theme === "dark" ? "Dark Mode" : "Light Mode") : "Theme"}
            </button>
          </div>
        </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, background: "var(--cafe-bg)", minHeight: 0, overflow: "hidden", width: 0, minWidth: 0, flexGrow: 1 }}>
          {/* Desktop header bar */}
          {!isMobile && (
            <div style={{
              height: 64, background: "var(--cafe-bg-elevated)", borderBottom: `1px solid var(--cafe-border)`,
              display: "flex", alignItems: "center", padding: "0 24px", gap: 20, flexShrink: 0,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}>
              {/* Breadcrumbs & Title */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 10, color: "var(--cafe-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {NAV_GROUPS.find(g => g.items.some(i => i.id === tab))?.title || "CafeOS"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--cafe-text-muted)" }}>/</span>
                  <span style={{ fontSize: 10, color: "var(--cafe-accent)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {NAV.find(n => n.id === tab)?.short || safeTitle}
                  </span>
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 800,
                  letterSpacing: "-0.03em", color: "var(--cafe-text-primary)",
                  lineHeight: 1.1,
                }}>{safeTitle}</div>
              </div>

              {/* Quick Search */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                style={{
                  width: 280, height: 36, background: "var(--cafe-bg-surface)",
                  border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-md)",
                  padding: "0 12px", display: "flex", alignItems: "center", gap: 10,
                  cursor: "pointer", transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: 14 }}>🔍</span>
                <span style={{ fontSize: 13, color: "var(--cafe-text-tertiary)", flex: 1, textAlign: "left" }}>Search everything...</span>
                <kbd style={{ fontSize: 10, color: "var(--cafe-text-muted)", background: "var(--cafe-bg-card)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--cafe-border-light)" }}>⌘K</kbd>
              </button>

              <div style={{ height: 24, width: 1, background: "var(--cafe-border-light)" }} />

              <LiveClock />

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Status pill */}
                <button 
                  onClick={() => setIsOpen(o => !o)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: isOpen ? "var(--cafe-success-bg)" : "var(--cafe-danger-bg)",
                    border: `1px solid ${isOpen ? "var(--cafe-success-border)" : "var(--cafe-danger-border)"}`,
                    borderRadius: "var(--cafe-radius-lg)", padding: "6px 14px",
                    cursor: "pointer", transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ 
                    width: 8, height: 8, borderRadius: "50%", 
                    background: isOpen ? "var(--cafe-success)" : "var(--cafe-danger)", 
                    boxShadow: `0 0 8px ${isOpen ? "var(--cafe-success)" : "var(--cafe-danger)"}`, 
                    flexShrink: 0 
                  }} />
                  <span style={{ fontSize: 11, color: isOpen ? "var(--cafe-success)" : "var(--cafe-danger)", fontWeight: 700, letterSpacing: "0.05em" }}>
                    {isOpen ? "CAFE OPEN" : "CAFE CLOSED"}
                  </span>
                </button>

                {/* User Profile */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "4px",
                  paddingRight: 12, borderRadius: "var(--cafe-radius-xl)",
                  background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)",
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--cafe-accent)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "#1A1208", fontWeight: 800,
                  }}>AD</div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-primary)", lineHeight: 1 }}>Admin</div>
                    <div style={{ fontSize: 9, color: "var(--cafe-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>{role || "Owner"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable content — extra bottom padding on mobile for the nav bar + safe area */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "16px 16px 0" : "0", paddingBottom: isMobile ? "calc(72px + env(safe-area-inset-bottom))" : "0", minHeight: 0, WebkitOverflowScrolling: "touch" }}>
            {children != null ? children : <div style={{ color: "var(--cafe-text-secondary)" }}>No content to display</div>}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      {isMobile && (
        <>
          {/* "More" tray — slides up above the nav bar */}
          {showMoreTray && (
            <>
              <div onClick={() => setShowMoreTray(false)} style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)" }} />
              <div style={{
                position: "fixed", bottom: "calc(60px + env(safe-area-inset-bottom))",
                left: 0, right: 0, zIndex: 150, background: "var(--cafe-bg-elevated)",
                borderTop: `1px solid var(--cafe-border)`,
                borderRadius: "24px 24px 0 0",
                padding: "8px 20px 20px",
                maxHeight: "80vh", overflowY: "auto",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.3)",
              }}>
                {/* drag handle */}
                <div style={{ width: 40, height: 5, borderRadius: 2.5, background: "var(--cafe-border-light)", margin: "8px auto 20px" }} />
                
                {/* Search in tray */}
                <div style={{ marginBottom: 20 }}>
                  <button
                    onClick={() => { setCommandPaletteOpen(true); setShowMoreTray(false); }}
                    style={{
                      width: "100%", height: 44, background: "var(--cafe-bg-surface)",
                      border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-lg)",
                      padding: "0 16px", display: "flex", alignItems: "center", gap: 12,
                      cursor: "pointer", color: "var(--cafe-text-tertiary)", fontSize: 14
                    }}
                  >
                    <span>🔍</span>
                    <span style={{ flex: 1, textAlign: "left" }}>Search all modules...</span>
                  </button>
                </div>

                {NAV_GROUPS.map(group => {
                  const items = group.items.filter(n => 
                    !NAV_PRIMARY.some(p => p.id === n.id) && 
                    (!n.featureId || isFeatureEnabled(n.featureId))
                  );
                  if (items.length === 0) return null;

                  return (
                    <div key={group.title} style={{ marginBottom: 20 }}>
                      <div style={{
                        fontSize: 11, color: "var(--cafe-text-muted)", fontWeight: 700, 
                        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
                      }}>{group.title}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                        {items.map(n => {
                          const active = tab === n.id;
                          const b = badge(n.id);
                          return (
                            <button
                              key={n.id}
                              onClick={() => { safeSetTab(n.id); setShowMoreTray(false); }}
                              aria-label={n.label} aria-current={active ? "page" : undefined}
                              style={{
                                display: "flex", flexDirection: "column", alignItems: "center",
                                justifyContent: "center", gap: 8, padding: "16px 8px",
                                borderRadius: "var(--cafe-radius-lg)",
                                border: `1px solid ${active ? "var(--cafe-accent)" : "var(--cafe-border-light)"}`,
                                background: active ? "var(--cafe-accent-dim)" : "var(--cafe-bg-surface)",
                                cursor: "pointer", color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                                fontSize: 11, fontWeight: active ? 700 : 500,
                                position: "relative", WebkitTapHighlightColor: "transparent",
                                transition: "all 0.2s ease",
                              }}>
                              {b > 0 && (
                                <span style={{
                                  position: "absolute", top: 8, right: 8,
                                  background: "var(--cafe-danger)", color: "#fff",
                                  fontSize: 9, fontWeight: 800, borderRadius: "var(--cafe-radius-sm)",
                                  padding: "2px 5px", minWidth: 16, textAlign: "center",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}>{badgeLabel(n.id)}</span>
                              )}
                              <Icon name={n.id} size={22} color={active ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)"} />
                              <span style={{ lineHeight: 1.2, letterSpacing: "-0.01em", textAlign: "center" }}>{n.short}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Mobile System Controls */}
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid var(--cafe-border-light)` }}>
                  <div style={{
                    fontSize: 11, color: "var(--cafe-text-muted)", fontWeight: 700, 
                    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
                  }}>System Settings</div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Role Switcher Mobile */}
                    {typeof setRole === 'function' && (
                      <div style={{ 
                        background: "var(--cafe-bg-surface)", 
                        padding: "12px 16px", 
                        borderRadius: "var(--cafe-radius-lg)",
                        border: "1px solid var(--cafe-border-light)",
                        display: "flex", alignItems: "center", justifyContent: "space-between"
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--cafe-text-secondary)" }}>Active Role</span>
                        <select
                          value={role || 'owner'}
                          onChange={(e) => setRole(e.target.value)}
                          style={{
                            background: "transparent", border: "none", color: "var(--cafe-accent)",
                            fontSize: 13, fontWeight: 700, cursor: "pointer", outline: "none",
                            textAlign: "right"
                          }}
                        >
                          <option value="owner">👑 Owner</option>
                          <option value="manager">🏢 Manager</option>
                          <option value="staff">🧑‍💼 Staff</option>
                          <option value="cashier">💰 Cashier</option>
                          <option value="kitchen">👨‍🍳 Kitchen</option>
                        </select>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {/* Theme Toggle Mobile */}
                      <button
                         onClick={() => typeof toggleTheme === "function" && toggleTheme()}
                         style={{
                           display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                           padding: "14px", borderRadius: "var(--cafe-radius-lg)",
                           background: "var(--cafe-bg-surface)", border: "1px solid var(--cafe-border-light)",
                           color: "var(--cafe-text-primary)", fontSize: 13, fontWeight: 600
                         }}
                       >
                         <span style={{ fontSize: 16 }}>{typeof theme === "string" ? (theme === "dark" ? "🌙" : "☀️") : "🌓"}</span>
                         <span>{typeof theme === "string" ? (theme === "dark" ? "Dark" : "Light") : "Theme"}</span>
                       </button>

                       {/* Exit Demo Mobile */}
                       {isDemoMode() && (
                         <button
                           onClick={() => {
                             if (confirm("Exit demo mode and switch to production?")) {
                               exitDemoMode();
                               window.location.reload();
                             }
                           }}
                           style={{
                             display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                             padding: "14px", borderRadius: "var(--cafe-radius-lg)",
                             background: "var(--cafe-danger-bg)", border: "1px solid var(--cafe-danger-border)",
                             color: "var(--cafe-danger)", fontSize: 13, fontWeight: 700
                           }}
                         >
                          <span style={{ fontSize: 16 }}>🚪</span>
                          <span>Exit Demo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Bottom nav bar — 4 primary + More */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: "calc(64px + env(safe-area-inset-bottom))",
            background: "var(--cafe-bg-elevated)", 
            borderTop: `1px solid var(--cafe-border)`,
            display: "flex", alignItems: "flex-start",
            zIndex: 160, paddingBottom: "env(safe-area-inset-bottom)",
            backdropFilter: "blur(12px)",
            backgroundColor: "rgba(18, 18, 20, 0.85)"
          }}>
            {NAV_PRIMARY.map(n => {
              const active = tab === n.id;
              const b = badge(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => { safeSetTab(n.id); setShowMoreTray(false); }}
                  aria-label={n.label} aria-current={active ? "page" : undefined}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 4,
                    background: "transparent", border: "none", cursor: "pointer",
                    color: active ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                    fontSize: 10, fontWeight: active ? 700 : 500,
                    paddingTop: 8,
                    position: "relative", WebkitTapHighlightColor: "transparent",
                    minHeight: 56, transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                  {/* Active indicator bar */}
                  <div style={{
                    position: "absolute", top: 0, width: "40%", height: 3,
                    background: active ? "var(--cafe-accent)" : "transparent",
                    borderRadius: "0 0 4px 4px",
                    boxShadow: active ? "0 2px 8px var(--cafe-accent)" : "none",
                    transition: "all 0.2s ease"
                  }} />
                  
                  {b > 0 && !active && (
                    <span style={{
                      position: "absolute", top: 8, right: "calc(50% - 20px)",
                      background: n.id === "kitchen" ? "var(--cafe-danger)" : "var(--cafe-accent)",
                      color: "#fff",
                      fontSize: 9, fontWeight: 800, borderRadius: "var(--cafe-radius-sm)",
                      padding: "2px 5px", minWidth: 16, textAlign: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                    }}>{badgeLabel(n.id)}</span>
                  )}
                  <Icon name={n.id} size={20} color={active ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)"} />
                  <span style={{ letterSpacing: "0.02em", marginTop: 2 }}>{n.short}</span>
                </button>
              );
            })}
            {/* More button */}
            <button
              onClick={() => setShowMoreTray(t => !t)}
              aria-label="More navigation options"
              aria-expanded={showMoreTray}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 4,
                background: "transparent", border: "none", cursor: "pointer",
                color: (showMoreTray || inMoreTray) ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                fontSize: 10, fontWeight: (showMoreTray || inMoreTray) ? 700 : 500,
                paddingTop: 8,
                position: "relative",
                WebkitTapHighlightColor: "transparent", minHeight: 56,
                transition: "all 0.2s ease",
              }}>
              <div style={{
                position: "absolute", top: 0, width: "40%", height: 3,
                background: (showMoreTray || inMoreTray) ? "var(--cafe-accent)" : "transparent",
                borderRadius: "0 0 4px 4px",
                boxShadow: (showMoreTray || inMoreTray) ? "0 2px 8px var(--cafe-accent)" : "none",
                transition: "all 0.2s ease"
              }} />
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
              </svg>
              <span style={{ marginTop: 2 }}>More</span>
            </button>
          </div>

          {/* Mobile floating search button */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              position: "fixed",
              bottom: 80,
              right: 16,
              width: 56,
              height: 56,
              borderRadius: 28,
              background: "var(--cafe-accent)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              zIndex: 150,
              fontSize: 24
            }}
          >
            🔍
          </button>
        </>
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={handleCommandNavigate}
      />
    </div>
  );
}
