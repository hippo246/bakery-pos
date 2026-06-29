import { useState, useEffect } from "react";
import { C } from "../../styles/theme";
import LiveClock from "../common/LiveClock";
import "../../styles/responsive.css";

const NAV = [
  { id: "orders",    label: "Orders",    icon: "📋" },
  { id: "kitchen",   label: "Kitchen",   icon: "🍳" },
  { id: "crm",       label: "CRM",       icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "menu",      label: "Menu",      icon: "🍽" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "staff",     label: "Staff",     icon: "👨‍🍳" },
  { id: "tables",    label: "Tables",    icon: "🪑" },
  { id: "discounts", label: "Discounts", icon: "🎟️" },
  { id: "delivery",  label: "Delivery",  icon: "🚴" },
  { id: "settings",  label: "Settings",  icon: "⚙️" },
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

  const badge = (id) => id === "orders" ? newOrderCount : id === "kitchen" ? urgentKds : 0;
  const inMoreTray = NAV_SECONDARY.some(n => n.id === tab);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", width: "100%", background: C.bg, color: C.text, fontFamily: "'Sora','Inter',sans-serif", overflow: "hidden", position: "relative", margin: 0, padding: 0, boxSizing: "border-box" }}>

      {/* ── Mobile header ─────────────────────────────────────────── */}
      {isMobile && (
        <div style={{ display: "flex", width: "100%", padding: "0 12px", alignItems: "center", gap: 10, background: C.bg2, borderBottom: `1px solid ${C.border}`, height: 52, flexShrink: 0 }}>
          {/* Logo mark */}
          <div style={{ width: 28, height: 28, background: C.amber, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>☕</div>
          {/* Current tab title */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{TITLES[tab]}</div>
            {/* Tap the status dot to toggle open/closed */}
            <button onClick={() => setIsOpen(o => !o)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: isOpen ? C.green : C.red }} />
              <span style={{ fontSize: 10, color: isOpen ? C.green : C.red, fontWeight: 600, fontFamily: "monospace" }}>{isOpen ? "OPEN" : "CLOSED"}</span>
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
          width: 196, background: C.bg2, borderRight: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column", flexShrink: 0,
          height: "100%", overflow: "hidden",
        }}>
          <div style={{ padding: "18px 14px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 30, height: 30, background: C.amber, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>☕</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.amber2, letterSpacing: "-0.4px" }}>BrewCRM</div>
                <div style={{ fontSize: 9, color: C.text3, fontFamily: "monospace", marginTop: 1 }}>v2.1 · Pro</div>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
            {NAV.map((n) => {
              const active = tab === n.id;
              const b = badge(n.id);
              return (
                <div key={n.id} onClick={() => setTab(n.id)}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: active ? C.amber2 : C.text2, background: active ? "rgba(232,160,32,.1)" : "transparent", border: `1px solid ${active ? C.amber3 : "transparent"}`, marginBottom: 2, transition: "all .12s", minHeight: 44 }}>
                  <span style={{ width: 16, textAlign: "center" }}>{n.icon}</span>
                  {n.label}
                  {b > 0 && !active && (
                    <span style={{ marginLeft: "auto", background: n.id === "kitchen" ? C.red : C.amber3, color: n.id === "kitchen" ? C.onColor : C.amber2, fontSize: 10, fontFamily: "monospace", padding: "2px 6px", borderRadius: 10 }}>{b}</span>
                  )}
                </div>
              );
            })}
          </nav>

          <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
            <button onClick={() => setIsOpen(o => !o)} style={{ width: "100%", fontFamily: "monospace", fontSize: 10, background: isOpen ? C.greenBg : C.redBg, color: isOpen ? C.green : C.red, padding: "10px 12px", borderRadius: 6, border: `1px solid ${isOpen ? C.greenBorder : C.redBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, letterSpacing: ".04em", transition: "all .2s", marginBottom: 8, minHeight: 44 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOpen ? C.green : C.red, boxShadow: `0 0 6px ${isOpen ? C.green : C.red}`, flexShrink: 0 }} />
              📍 {isOpen ? "OPEN" : "CLOSED"}
            </button>
            <button onClick={toggleTheme} style={{ width: "100%", fontFamily: "monospace", fontSize: 10, background: C.bg3, color: C.text, padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, letterSpacing: ".04em", transition: "all .2s", minHeight: 44 }}>
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          </div>
        </div>
        )}

        {/* Main content */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 1, background: C.bg, minHeight: 0, overflow: "hidden", width: 0, minWidth: 0, flexGrow: 1 }}>
          {/* Desktop header bar */}
          {!isMobile && (
            <div style={{ height: 50, background: C.bg2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{TITLES[tab]}</div>
              <LiveClock />
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.amber3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.amber2, fontWeight: 700 }}>AD</div>
            </div>
          )}

          {/* Scrollable content — extra bottom padding on mobile for the nav bar + safe area */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: isMobile ? "12px 12px 0" : 18, paddingBottom: isMobile ? "calc(72px + env(safe-area-inset-bottom))" : 18, minHeight: 0, WebkitOverflowScrolling: "touch" }}>
            {children || <div style={{ color: C.text2 }}>No content to display</div>}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────────────── */}
      {isMobile && (
        <>
          {/* "More" tray — slides up above the nav bar */}
          {showMoreTray && (
            <>
              <div onClick={() => setShowMoreTray(false)} style={{ position: "fixed", inset: 0, zIndex: 140, background: "rgba(0,0,0,.5)" }} />
              <div style={{ position: "fixed", bottom: "calc(60px + env(safe-area-inset-bottom))", left: 0, right: 0, zIndex: 150, background: C.bg2, borderTop: `1px solid ${C.border2}`, borderRadius: "16px 16px 0 0", padding: "14px 10px 6px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <div style={{ gridColumn: "1 / -1", fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 4, paddingLeft: 2 }}>More</div>
                {NAV_SECONDARY.map(n => {
                  const active = tab === n.id;
                  const b = badge(n.id);
                  return (
                    <button key={n.id} onClick={() => { setTab(n.id); setShowMoreTray(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "12px 4px", borderRadius: 10, border: `1px solid ${active ? C.amber3 : C.border}`, background: active ? "rgba(232,160,32,.12)" : C.bg3, cursor: "pointer", color: active ? C.amber2 : C.text3, fontSize: 10, fontWeight: active ? 700 : 400, position: "relative", WebkitTapHighlightColor: "transparent" }}>
                      {b > 0 && <span style={{ position: "absolute", top: 6, right: 8, background: C.red, color: C.onColor, fontSize: 8, fontWeight: 900, borderRadius: 8, padding: "1px 4px" }}>{b}</span>}
                      <span style={{ fontSize: 22 }}>{n.icon}</span>
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom nav bar — 4 primary + More */}
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "calc(60px + env(safe-area-inset-bottom))", background: C.bg2, borderTop: `1px solid ${C.border2}`, display: "flex", alignItems: "flex-start", zIndex: 160, paddingBottom: "env(safe-area-inset-bottom)" }}>
            {NAV_PRIMARY.map(n => {
              const active = tab === n.id;
              const b = badge(n.id);
              return (
                <button key={n.id} onClick={() => { setTab(n.id); setShowMoreTray(false); }} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "transparent", border: "none", cursor: "pointer", color: active ? C.amber2 : C.text3, fontSize: 9, fontWeight: active ? 700 : 400, borderTop: active ? `2px solid ${C.amber2}` : "2px solid transparent", position: "relative", WebkitTapHighlightColor: "transparent" }}>
                  {b > 0 && !active && (
                    <span style={{ position: "absolute", top: 6, right: "calc(50% - 14px)", background: n.id === "kitchen" ? C.red : C.amber, color: n.id === "kitchen" ? C.onColor : "#000000", fontSize: 8, fontWeight: 900, borderRadius: 8, padding: "1px 5px", minWidth: 14, textAlign: "center" }}>
                      {b > 99 ? "99+" : b}
                    </span>
                  )}
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{n.icon}</span>
                  {n.label}
                </button>
              );
            })}
            {/* More button */}
            <button onClick={() => setShowMoreTray(t => !t)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "transparent", border: "none", cursor: "pointer", color: (showMoreTray || inMoreTray) ? C.amber2 : C.text3, fontSize: 9, fontWeight: (showMoreTray || inMoreTray) ? 700 : 400, borderTop: (showMoreTray || inMoreTray) ? `2px solid ${C.amber2}` : "2px solid transparent", WebkitTapHighlightColor: "transparent" }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>⋯</span>
              More
            </button>
          </div>
        </>
      )}
    </div>
  );
}
