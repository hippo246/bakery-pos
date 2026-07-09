import { useState, useEffect } from "react";
import { C } from "../../styles/theme";
import LiveClock from "../common/LiveClock";
import "../../styles/responsive.css";

// Monoline SVG icons — no emoji, no fat color glyphs
const Icon = ({ name, size = 15, color = "currentColor" }) => {
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  const paths = {
    orders:    <><rect x="4" y="3" width="12" height="15" rx="1.5" stroke={color} strokeWidth="1.4" fill="none"/><line x1="7" y1="8" x2="14" y2="8" stroke={color} strokeWidth="1.4"/><line x1="7" y1="11.5" x2="14" y2="11.5" stroke={color} strokeWidth="1.4"/><line x1="7" y1="15" x2="11" y2="15" stroke={color} strokeWidth="1.4"/></>,
    kitchen:   <><path d="M5 3v7a4 4 0 0 0 8 0V3" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/><line x1="9" y1="14" x2="9" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><line x1="6" y1="20" x2="12" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    crm:       <><circle cx="9" cy="7" r="3.5" stroke={color} strokeWidth="1.4" fill="none"/><path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/><circle cx="17" cy="7" r="2.5" stroke={color} strokeWidth="1.4" fill="none"/><path d="M19.5 19c0-2.5-1.8-4.6-4.1-5.4" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    analytics: <><polyline points="3,17 8,11 12,14 17,7" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/><line x1="3" y1="20" x2="20" y2="20" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    menu:      <><rect x="3" y="3" width="7" height="9" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="13" y="3" width="7" height="5" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="13" y="11" width="7" height="9" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><rect x="3" y="15" width="7" height="5" rx="1" stroke={color} strokeWidth="1.4" fill="none"/></>,
    inventory: <><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><polyline points="3,8 12,13 21,8" stroke={color} strokeWidth="1.4" fill="none"/><line x1="12" y1="13" x2="12" y2="21" stroke={color} strokeWidth="1.4"/></>,
    staff:     <><circle cx="12" cy="7" r="3.5" stroke={color} strokeWidth="1.4" fill="none"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round"/></>,
    tables:    <><rect x="2" y="6" width="20" height="3" rx="1" stroke={color} strokeWidth="1.4" fill="none"/><line x1="8" y1="9" x2="6" y2="18" stroke={color} strokeWidth="1.4" strokeLinecap="round"/><line x1="16" y1="9" x2="18" y2="18" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    discounts: <><circle cx="9" cy="9" r="2" stroke={color} strokeWidth="1.4" fill="none"/><circle cx="16" cy="16" r="2" stroke={color} strokeWidth="1.4" fill="none"/><line x1="5" y1="19" x2="19" y2="5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></>,
    delivery:  <><rect x="2" y="8" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.4" fill="none"/><polyline points="16,10 21,10 21,18 16,18" stroke={color} strokeWidth="1.4" fill="none" strokeLinejoin="round"/><circle cx="7" cy="18" r="2" stroke={color} strokeWidth="1.4" fill="none"/><circle cx="16" cy="18" r="2" stroke={color} strokeWidth="1.4" fill="none"/></>,
    settings:  <><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.4" fill="none"/><path d="M12 2a1.5 1.5 0 0 1 1.5 1.5v.8a7 7 0 0 1 1.7.7l.6-.6a1.5 1.5 0 1 1 2.1 2.1l-.6.6c.3.5.5 1.1.7 1.7h.8a1.5 1.5 0 0 1 0 3h-.8a7 7 0 0 1-.7 1.7l.6.6a1.5 1.5 0 1 1-2.1 2.1l-.6-.6a7 7 0 0 1-1.7.7v.8a1.5 1.5 0 0 1-3 0v-.8a7 7 0 0 1-1.7-.7l-.6.6a1.5 1.5 0 1 1-2.1-2.1l.6-.6A7 7 0 0 1 4.3 13h-.8a1.5 1.5 0 0 1 0-3h.8a7 7 0 0 1 .7-1.7l-.6-.6A1.5 1.5 0 1 1 6.5 5.6l.6.6A7 7 0 0 1 8.8 5.5v-.8A1.5 1.5 0 0 1 10.5 3V2a1.5 1.5 0 0 1 1.5 0z" stroke={color} strokeWidth="1.4" fill="none"/></>,
  };
  return <svg viewBox="0 0 22 22" style={s} xmlns="http://www.w3.org/2000/svg">{paths[name]}</svg>;
};

const NAV = [
  { id: "orders",    label: "Orders",     short: "Orders"   },
  { id: "kitchen",   label: "Kitchen",    short: "Kitchen"  },
  { id: "crm",       label: "CRM",        short: "CRM"      },
  { id: "analytics", label: "Analytics",  short: "Stats"    },
  { id: "menu",      label: "Menu",       short: "Menu"     },
  { id: "inventory", label: "Inventory",  short: "Stock"    },
  { id: "staff",     label: "Staff",      short: "Staff"    },
  { id: "tables",    label: "Tables",     short: "Tables"   },
  { id: "discounts", label: "Discounts",  short: "Deals"    },
  { id: "delivery",  label: "Delivery",   short: "Delivery" },
  { id: "settings",  label: "Settings",   short: "Settings" },
];

// First 4 get their own bottom-nav slot; the rest live in the More tray
const NAV_PRIMARY   = NAV.slice(0, 4);
const NAV_SECONDARY = NAV.slice(4);

const TITLES = {
  orders: "Orders", kitchen: "Kitchen Display", crm: "Customer CRM",
  analytics: "Analytics", menu: "Menu", inventory: "Inventory",
  staff: "Staff Management", tables: "Table Management",
  discounts: "Discounts & Coupons", delivery: "Delivery Partners", settings: "Settings",
};

export default function Layout({ tab, setTab, children, newOrderCount, urgentKds, theme, toggleTheme }) {
  const [isOpen,       setIsOpen]       = useState(true);
  const [showMoreTray, setShowMoreTray] = useState(false);

  // Reactive mobile breakpoint — drives conditional JSX, not just CSS
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close more tray when tab changes
  useEffect(() => { setShowMoreTray(false); }, [tab]);

  // Escape closes more tray
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setShowMoreTray(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Safe badge: only positive integers, capped at 99, never NaN/undefined
  const badge = (id) => {
    const raw = id === "orders" ? newOrderCount : id === "kitchen" ? urgentKds : 0;
    const n = Number(raw);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  };
  const badgeLabel = (n) => { const v = badge(n); return v > 99 ? "99+" : String(v); };

  const validTab = NAV.some(n => n.id === tab);
  const safeTitle = validTab ? (TITLES[tab] || String(tab || "")) : "BrewCRM";
  const inMoreTray = NAV_SECONDARY.some(n => n.id === tab);
  const safeSetTab = (id) => { if (typeof setTab === "function") setTab(id); };

  if (typeof process !== "undefined" && process.env && process.env.NODE_ENV !== "production") {
    if (tab && !validTab) console.warn("[Layout] Unknown tab: \"" + tab + "\". Expected: " + NAV.map(n => n.id).join(", "));
    if (!setTab) console.warn("[Layout] setTab prop missing — nav clicks will be no-ops.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", background: C.bg, color: C.text, fontFamily: "'Sora','Inter',sans-serif", overflow: "hidden", position: "relative", margin: 0, padding: 0, boxSizing: "border-box" }}>

      {/* ── Mobile header ─────────────────────────────────────────── */}
      {isMobile && (
        <div style={{ display: "flex", width: "100%", padding: "0 14px", alignItems: "center", gap: 10, background: C.bg2, borderBottom: `1px solid ${C.border}`, height: 52, flexShrink: 0 }}>
          {/* Logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <rect width="28" height="28" rx="7" fill={C.amber2}/>
            <rect x="8" y="8" width="12" height="2" rx="1" fill="rgba(0,0,0,0.5)"/>
            <rect x="9" y="12" width="10" height="8" rx="2" fill="rgba(0,0,0,0.5)"/>
          </svg>
          {/* Current tab title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>{safeTitle}</div>
            <button
              onClick={() => setIsOpen(o => !o)}
              aria-label={isOpen ? "Mark cafe as closed" : "Mark cafe as open"}
              aria-pressed={isOpen}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}
            >
              <span style={{
                display: "inline-block", width: 5, height: 5, borderRadius: "50%",
                background: isOpen ? C.green : C.red,
                boxShadow: `0 0 4px ${isOpen ? C.green : C.red}`,
              }} />
              <span style={{ fontSize: 9.5, color: isOpen ? C.green : C.red, fontWeight: 600, letterSpacing: "0.04em" }}>
                {isOpen ? "Open now" : "Closed"}
              </span>
            </button>
          </div>
          <LiveClock />
        </div>
      )}

      {/* ── Sidebar + Main row ────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* Overlay behind sidebar on mobile — not needed, sidebar gone on mobile */}

        {/* Sidebar — desktop only */}
        {!isMobile && (
        <div style={{
          width: 200, background: C.bg2, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", flexShrink: 0,
          height: "100%", overflow: "hidden",
        }}>
          {/* Brand lockup */}
          <div style={{ padding: "18px 14px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect width="28" height="28" rx="7" fill={C.amber2}/>
                <rect x="8" y="8" width="12" height="2" rx="1" fill="rgba(0,0,0,0.5)"/>
                <rect x="9" y="12" width="10" height="8" rx="2" fill="rgba(0,0,0,0.5)"/>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.text, letterSpacing: "-0.4px", lineHeight: 1 }}>
                  Brew<span style={{ color: C.amber2 }}>CRM</span>
                </div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 3, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Pro · v2.1</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
            {NAV.map((n) => {
              const active = tab === n.id;
              const b = badge(n.id);
              return (
                <button key={n.id} onClick={() => safeSetTab(n.id)}
                  aria-label={n.label} aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "0 10px",
                    borderRadius: 7, cursor: "pointer",
                    fontWeight: active ? 600 : 400,
                    color: active ? C.amber2 : C.text2,
                    background: active ? `${C.amber2}15` : "transparent",
                    border: "none",
                    marginBottom: 2, transition: "background 0.1s, color 0.1s",
                    height: 36, width: "100%", textAlign: "left",
                    boxSizing: "border-box", position: "relative",
                  }}>
                  {/* Active indicator pill on left edge */}
                  {active && <span style={{ position: "absolute", left: 0, top: "25%", height: "50%", width: 3, borderRadius: "0 2px 2px 0", background: C.amber2 }} />}
                  <Icon name={n.id} size={15} color={active ? C.amber2 : C.text3} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: 12.5, letterSpacing: "-0.01em" }}>{n.label}</span>
                  {b > 0 && !active && (
                    <span style={{
                      marginLeft: "auto", flexShrink: 0,
                      background: n.id === "kitchen" ? C.red : `${C.amber2}22`,
                      color: n.id === "kitchen" ? "#fff" : C.amber2,
                      fontSize: 9.5, fontWeight: 700,
                      padding: "2px 5px", borderRadius: 4,
                      letterSpacing: "0.02em",
                    }}>{badgeLabel(n.id)}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Status + theme footer */}
          <div style={{ padding: "10px 10px", borderTop: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 5 }}>
            <button
              onClick={() => setIsOpen(o => !o)}
              aria-label={isOpen ? "Mark cafe as closed" : "Mark cafe as open"}
              aria-pressed={isOpen}
              style={{
                width: "100%", fontSize: 11,
                background: isOpen ? `${C.green}14` : `${C.red}14`,
                color: isOpen ? C.green : C.red,
                padding: "8px 10px", borderRadius: 7,
                border: `1px solid ${isOpen ? C.green : C.red}33`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                fontWeight: 600, letterSpacing: "0.04em", transition: "all .18s", height: 36,
              }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isOpen ? C.green : C.red,
                boxShadow: `0 0 6px ${isOpen ? C.green : C.red}`,
                flexShrink: 0,
              }} />
              {isOpen ? "Open now" : "Closed"}
              <span style={{ marginLeft: "auto", fontSize: 9, opacity: 0.6, fontWeight: 500 }}>tap to change</span>
            </button>
            <button
              onClick={() => typeof toggleTheme === "function" && toggleTheme()}
              aria-label={`Switch to ${typeof theme === "string" && theme === "dark" ? "light" : "dark"} theme`}
              style={{
                width: "100%", fontSize: 11,
                background: C.bg3, color: C.text2,
                padding: "8px 10px", borderRadius: 7,
                border: `1px solid ${C.border2}`,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                fontWeight: 500, letterSpacing: "0.02em", transition: "all .18s", height: 36,
              }}>
              <span style={{ fontSize: 12 }}>{typeof theme === "string" ? (theme === "dark" ? "🌙" : "☀️") : "🌙"}</span>
              {typeof theme === "string" ? (theme === "dark" ? "Dark mode" : "Light mode") : "Theme"}
            </button>
          </div>
        </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, background: C.bg, minHeight: 0, overflow: "hidden", width: 0, minWidth: 0, flexGrow: 1 }}>
          {/* Desktop header bar */}
          {!isMobile && (
            <div style={{
              height: 52, background: C.bg, borderBottom: `1px solid ${C.border}`,
              display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
            }}>
              {/* Page title with subtle section label */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
                <div style={{
                  fontSize: 15, fontWeight: 700,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  letterSpacing: "-0.02em", color: C.text,
                }}>{safeTitle}</div>
              </div>
              <LiveClock />
              {/* Status pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                background: isOpen ? `${C.green}12` : `${C.red}12`,
                border: `1px solid ${isOpen ? C.green : C.red}30`,
                borderRadius: 6, padding: "4px 9px",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: isOpen ? C.green : C.red, boxShadow: `0 0 5px ${isOpen ? C.green : C.red}`, flexShrink: 0 }} />
                <span style={{ fontSize: 10.5, color: isOpen ? C.green : C.red, fontWeight: 600, letterSpacing: "0.03em" }}>{isOpen ? "Open" : "Closed"}</span>
              </div>
              {/* User avatar */}
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${C.amber2}20`,
                border: `1.5px solid ${C.amber2}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: C.amber2, fontWeight: 700, letterSpacing: "0.04em",
                flexShrink: 0,
              }}>AD</div>
            </div>
          )}

          {/* Scrollable content — extra bottom padding on mobile for the nav bar + safe area */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "12px 12px 0" : 18, paddingBottom: isMobile ? "calc(72px + env(safe-area-inset-bottom))" : 18, minHeight: 0, WebkitOverflowScrolling: "touch" }}>
            {children != null ? children : <div style={{ color: C.text2 }}>No content to display</div>}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      {isMobile && (
        <>
          {/* "More" tray — slides up above the nav bar */}
          {showMoreTray && (
            <>
              <div onClick={() => setShowMoreTray(false)} style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(0,0,0,.55)" }} />
              <div style={{
                position: "fixed", bottom: "calc(60px + env(safe-area-inset-bottom))",
                left: 0, right: 0, zIndex: 150, background: C.bg2,
                borderTop: `1px solid ${C.border2}`,
                borderRadius: "14px 14px 0 0",
                padding: "6px 12px 10px",
              }}>
                {/* drag handle */}
                <div style={{ width: 32, height: 3, borderRadius: 2, background: C.border2, margin: "6px auto 12px" }} />
                <div style={{
                  fontSize: 10, color: C.text3, fontWeight: 600, letterSpacing: ".05em",
                  textTransform: "uppercase", marginBottom: 8, paddingLeft: 2,
                }}>More pages</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {(NAV_SECONDARY || []).map(n => {
                    const active = tab === n.id;
                    const b = badge(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => { safeSetTab(n.id); setShowMoreTray(false); }}
                        aria-label={n.label} aria-current={active ? "page" : undefined}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", gap: 5, padding: "12px 4px",
                          borderRadius: 9,
                          border: `1px solid ${active ? C.amber2 + "60" : C.border}`,
                          background: active ? `${C.amber2}12` : C.bg3,
                          cursor: "pointer", color: active ? C.amber2 : C.text2,
                          fontSize: 10, fontWeight: active ? 600 : 400,
                          position: "relative", WebkitTapHighlightColor: "transparent", minHeight: 62,
                          transition: "all 0.12s",
                        }}>
                        {b > 0 && (
                          <span style={{
                            position: "absolute", top: 6, right: 7,
                            background: C.red, color: "#fff",
                            fontSize: 8, fontWeight: 700, borderRadius: 3,
                            padding: "1px 3px", minWidth: 13, textAlign: "center",
                          }}>{badgeLabel(n.id)}</span>
                        )}
                        <Icon name={n.id} size={18} color={active ? C.amber2 : C.text3} />
                        <span style={{ lineHeight: 1.2, letterSpacing: "-0.01em" }}>{n.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Bottom nav bar — 4 primary + More */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: "calc(60px + env(safe-area-inset-bottom))",
            background: C.bg2, borderTop: `1px solid ${C.border2}`,
            display: "flex", alignItems: "flex-start",
            zIndex: 160, paddingBottom: "env(safe-area-inset-bottom)",
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
                    justifyContent: "center", gap: 3,
                    background: "transparent", border: "none", cursor: "pointer",
                    color: active ? C.amber2 : C.text3,
                    fontSize: 9, fontWeight: active ? 600 : 400,
                    paddingTop: 2,
                    borderTop: `2px solid ${active ? C.amber2 : "transparent"}`,
                    position: "relative", WebkitTapHighlightColor: "transparent",
                    minHeight: 44, transition: "color 0.12s",
                  }}>
                  {b > 0 && !active && (
                    <span style={{
                      position: "absolute", top: 5, right: "calc(50% - 16px)",
                      background: n.id === "kitchen" ? C.red : C.amber2,
                      color: n.id === "kitchen" ? "#fff" : C.bg,
                      fontSize: 8, fontWeight: 700, borderRadius: 4,
                      padding: "1px 4px", minWidth: 14, textAlign: "center",
                    }}>{badgeLabel(n.id)}</span>
                  )}
                  <Icon name={n.id} size={17} color={active ? C.amber2 : C.text3} />
                  <span style={{ letterSpacing: "0.01em" }}>{n.short}</span>
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
                justifyContent: "center", gap: 3,
                background: "transparent", border: "none", cursor: "pointer",
                color: (showMoreTray || inMoreTray) ? C.amber2 : C.text3,
                fontSize: 9, fontWeight: (showMoreTray || inMoreTray) ? 600 : 400,
                paddingTop: 2,
                borderTop: `2px solid ${(showMoreTray || inMoreTray) ? C.amber2 : "transparent"}`,
                WebkitTapHighlightColor: "transparent", minHeight: 44,
                transition: "color 0.12s",
              }}>
              {/* Three dots as SVG */}
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <circle cx="3.5" cy="8.5" r="1.5" fill="currentColor"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <circle cx="13.5" cy="8.5" r="1.5" fill="currentColor"/>
              </svg>
              <span>More</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
