import { useState, useEffect } from "react";
import { C } from "../../styles/theme";
import LiveClock from "../common/LiveClock";
import "../../styles/responsive.css";

const NAV = [
  { id: "orders", label: "Orders", icon: "📋" },
  { id: "kitchen", label: "Kitchen", icon: "🍳" },
  { id: "crm", label: "CRM", icon: "👥" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "menu", label: "Menu", icon: "🍽" },
  { id: "inventory", label: "Inventory", icon: "📦" },
  { id: "staff", label: "Staff", icon: "👨‍🍳" },
  { id: "tables", label: "Tables", icon: "🪑" },
  { id: "discounts", label: "Discounts", icon: "🎟️" },
];

export default function Layout({ tab, setTab, children, newOrderCount, urgentKds }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const titles = { 
    orders: "Orders", 
    kitchen: "Kitchen Display", 
    crm: "Customer CRM", 
    analytics: "Analytics", 
    menu: "Menu",
    inventory: "Inventory",
    staff: "Staff Management",
    tables: "Table Management",
    discounts: "Discounts & Coupons"
  };

  console.log("Layout rendering", { tab, newOrderCount, urgentKds, children });

  // Close mobile menu when tab changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [tab]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", background: C.bg, color: C.text, fontFamily: "'Sora','Inter',sans-serif", overflow: "hidden", position: "relative", margin: 0, padding: 0, boxSizing: "border-box", minWidth: 0, minHeight: 0 }}>
      {/* Mobile Header */}
      <div className="mobile-header" style={{ display: "none", width: "100%", padding: "12px 16px", alignItems: "center", gap: 12, background: C.bg2, borderBottom: `1px solid ${C.border}` }}>
        <button 
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(true)}
          style={{ background: "transparent", border: "none", color: C.text, fontSize: 24, cursor: "pointer", padding: 4, display: "none" }}
        >
          ☰
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.amber2 }}>☕ BrewCRM</div>
        <div style={{ marginLeft: "auto" }}>
          <LiveClock />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 998, display: "none" }}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}
        style={{ width: 196, background: C.bg2, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, position: "relative", zIndex: 10, height: "100%", overflow: "hidden", minWidth: 0 }}
      >
        <div style={{ padding: "18px 14px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 30, height: 30, background: C.amber, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>☕</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.amber2, letterSpacing: "-0.4px" }}>BrewCRM</div>
              <div style={{ fontSize: 9, color: C.text3, fontFamily: "monospace", marginTop: 1 }}>v2.1 · Pro</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "8px 6px", overflowY: "auto" }}>
          {NAV.map((n) => {
            const active = tab === n.id;
            const badge = n.id === "orders" ? newOrderCount : n.id === "kitchen" ? urgentKds : 0;
            return (
              <div key={n.id} onClick={() => { setTab(n.id); setIsMobileMenuOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 500, color: active ? C.amber2 : C.text2, background: active ? "rgba(232,160,32,.1)" : "transparent", border: `1px solid ${active ? C.amber3 : "transparent"}`, marginBottom: 2, transition: "all .12s" }}>
                <span style={{ width: 16, textAlign: "center" }}>{n.icon}</span>
                {n.label}
                {badge > 0 && !active && (
                  <span style={{ marginLeft: "auto", background: n.id === "kitchen" ? C.red : C.amber3, color: n.id === "kitchen" ? "#fff" : C.amber2, fontSize: 10, fontFamily: "monospace", padding: "1px 5px", borderRadius: 10 }}>{badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => setIsOpen(o => !o)}
            style={{ width: "100%", fontFamily: "monospace", fontSize: 10, background: isOpen ? "#0d2010" : "#2a0d0d", color: isOpen ? C.green : C.red, padding: "7px 10px", borderRadius: 6, border: `1px solid ${isOpen ? "#1a4020" : "#4a1a1a"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, letterSpacing: ".04em", transition: "all .2s", marginBottom: 8 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOpen ? C.green : C.red, boxShadow: `0 0 6px ${isOpen ? C.green : C.red}`, flexShrink: 0 }} />
            📍 {isOpen ? "OPEN" : "CLOSED"}
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{ width: "100%", fontFamily: "monospace", fontSize: 10, background: isDarkMode ? "#1a1a2e" : "#f5f5f5", color: isDarkMode ? C.text : "#1a1a2e", padding: "7px 10px", borderRadius: 6, border: `1px solid ${isDarkMode ? C.border : "#ddd"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontWeight: 700, letterSpacing: ".04em", transition: "all .2s" }}
          >
            {isDarkMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      {/* Main */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", zIndex: 1, background: C.bg, minHeight: 0, height: "100%", overflow: "hidden", minWidth: 0, width: "100%" }}>
        <div style={{ height: 50, background: C.bg2, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{titles[tab]}</div>
          <LiveClock />
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.amber3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: C.amber2, fontWeight: 700 }}>AD</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 18, minHeight: 0 }}>
          {children || <div style={{ color: C.text2 }}>No content to display</div>}
        </div>
      </main>
    </div>
  );
}
