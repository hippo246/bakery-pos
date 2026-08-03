// eslint-disable-next-line no-unused-vars
import React from 'react';

const OrderHeader = ({ mode, activeCount, cartItemCount, onModeChange }) => {
  const tabs = [
    { id: 'active', label: 'Live Orders', icon: '📋', badge: activeCount > 0 ? activeCount : null, pulse: activeCount > 0 },
    { id: 'pos', label: 'Cash Desk', icon: '🧾', badge: cartItemCount > 0 ? cartItemCount : null, pulse: false },
  ];

  return (
    <>
      <style>{`
        .mode-tab { transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease; }
        .mode-tab:hover { background: var(--cafe-bg-hover) !important; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mode-tab { transition: none !important; }
        }
      `}</style>
      <div style={{ display: "flex", gap: 4, marginBottom: "var(--cafe-space-xl)", background: "var(--cafe-bg-surface)", borderRadius: "var(--cafe-radius-lg)", padding: 4, border: `1px solid var(--cafe-border)`, boxShadow: "var(--cafe-shadow-sm)" }}>
        {tabs.map(({ id, label, icon, badge, pulse }) => (
          <button
            key={id}
            className="mode-tab"
            onClick={() => onModeChange(id)}
            style={{
              flex: 1,
              padding: '13px 20px',
              borderRadius: "var(--cafe-radius-md)",
              border: mode === id ? `1px solid var(--cafe-accent)` : '1px solid transparent',
              background: mode === id ? "var(--cafe-accent-dim)" : 'transparent',
              color: mode === id ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
              fontSize: "var(--cafe-font-sm)",
              fontWeight: mode === id ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: mode === id ? "0 1px 4px rgba(0,0,0,.12)" : "none",
              letterSpacing: "0.01em",
            }}
          >
            <span style={{ fontSize: 15 }}>{icon}</span>
            {label}
            {pulse && mode !== id && (
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cafe-danger)", animation: "pulse-dot 1.4s ease-in-out infinite", flexShrink: 0 }} />
            )}
            {badge !== null && (
              <span style={{
                background: mode === id ? "var(--cafe-accent)" : "var(--cafe-bg-elevated)",
                color: mode === id ? "#1A1208" : "var(--cafe-text-secondary)",
                fontSize: "var(--cafe-font-xs)",
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: "var(--cafe-radius-sm)",
                minWidth: 22,
                textAlign: 'center',
                border: mode === id ? 'none' : `1px solid var(--cafe-border-light)`,
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default OrderHeader;
