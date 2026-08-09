export { TIER_COLORS, STATUS_COLORS, SRC_COLORS, PEAK_SOP, MENU_CATS } from "../data/constants";

// ── HELPERS ──
/** Maps an order source key to a human-readable label. */
export const srcLabel = (s) =>
  ({ WALK_IN: "Walk-in", SWIGGY: "Swiggy", ZOMATO: "Zomato", DIRECT_DELIVERY: "Delivery", QR_ORDERING: "QR Order" }[s] ?? s);

/** Returns up to 2 uppercase initials from a name string. */
export const initials = (n = "") =>
  n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

/** Formats a number as Indian rupees, e.g. 1234 → "₹1,234". */
export const formatRupees = (amount) =>
  "₹" + Number(amount ?? 0).toLocaleString("en-IN");

// ── STATUS FLOW ──
export const STATUS_FLOW = {
  NEW: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "READY",
  READY: "COMPLETED",
};
export const STATUS_FLOW_LABEL = {
  NEW: "Accept",
  ACCEPTED: "Start Prep",
  PREPARING: "Mark Ready",
  READY: "Complete",
};

// ── URGENCY ──
export const URGENCY_ORDER = { urgent: 0, soon: 1, ok: 2 };
export const URGENCY_NEXT  = { ok: "soon", soon: "urgent", urgent: "ok" };
export const URGENCY_PREV  = { urgent: "soon", soon: "ok", ok: "urgent" };

// ── TIER ──
export const TIER_SPEND = { BRONZE: 5000, SILVER: 10000, GOLD: 20000, PLATINUM: Infinity };
export const TIER_NEXT  = { BRONZE: "SILVER", SILVER: "GOLD", GOLD: "PLATINUM", PLATINUM: null };

// ── DESIGN TOKENS ──
// C maps semantic names to CSS custom properties.
// The actual values are set by :root / .light in your global CSS (see THEME_CSS below).
// This means toggling a class on <html> instantly repaints every component — no re-renders.
export const C = {
  bg:       "var(--c-bg)",
  bg2:      "var(--c-bg2)",
  bg3:      "var(--c-bg3)",
  bg4:      "var(--c-bg4)",

  amber:    "var(--c-amber)",
  amber2:   "var(--c-amber2)",
  amber3:   "var(--c-amber3)",
  amberDim: "var(--c-amber-dim)",

  text:     "var(--c-text)",
  text2:    "var(--c-text2)",
  text3:    "var(--c-text3)",

  green:    "var(--c-green)",
  red:      "var(--c-red)",
  blue:     "var(--c-blue)",
  purple:   "var(--c-purple)",
  warning:  "var(--c-warning)",

  border:   "var(--c-border)",
  border2:  "var(--c-border2)",

  // Soft tinted backgrounds — for status rows, alert banners, badge fills.
  // These flip with theme, unlike a literal hex like "#2a0808".
  redBg:    "var(--c-red-bg)",
  greenBg:  "var(--c-green-bg)",
  amberBg:  "var(--c-amber-bg)",
  blueBg:   "var(--c-blue-bg)",
  purpleBg: "var(--c-purple-bg)",
  neutralBg:"var(--c-neutral-bg)",

  // Soft tinted borders to pair with the backgrounds above.
  redBorder:    "var(--c-red-border)",
  greenBorder:  "var(--c-green-border)",
  amberBorder:  "var(--c-amber-border)",
  blueBorder:   "var(--c-blue-border)",
  purpleBorder: "var(--c-purple-border)",
  warningBg:    "var(--c-warning-bg)",
  warningBorder:"var(--c-warning-border)",

  // Fixed-purpose colors that should NOT flip with theme (paper receipts, brand marks).
  paperBg:   "#FFFFFF",
  paperText: "#000000",
  onColor:   "#FFFFFF", // text/icon on top of a saturated solid badge (e.g. white on red)

  // Contrast colors for marks/icons drawn directly on top of an accent-filled chip.
  // amber2 and amber3 are mirror images of each other across themes (amber2-dark ≈ amber3-light
  // and vice versa), so they need separate, oppositely-flipping contrast colors.
  onAmber2: "var(--c-on-amber2)", // use when the chip background is C.amber2
  onAmber3: "var(--c-on-amber3)", // use when the chip background is C.amber3

  // Muted, low-emphasis red for icon-only delete/remove buttons (dimmer than C.red).
  mutedRed: "var(--c-muted-red)",

  // Decorative banner gradient (e.g. a "demo/pro" highlight panel).
  bannerGradient: "var(--c-banner-gradient)",
};

/**
 * Inject this string into a <style> tag (or your global CSS file) once at app root.
 * It defines the dark palette by default and overrides it when <html class="light"> is set.
 *
 * Usage in your root component:
 *   import { THEME_CSS, applyTheme } from "../../styles/theme";
 *   useEffect(() => { const el = document.createElement("style"); el.textContent = THEME_CSS; document.head.appendChild(el); return () => el.remove(); }, []);
 */
export const THEME_CSS = `
  :root {
    /* ── CafeOS Design Tokens — Minimalist Modern ───────────────────── */
    
    /* Backgrounds — clean, subtle depth */
    --cafe-bg:              #0a0a0a;
    --cafe-bg-elevated:     #111111;
    --cafe-bg-surface:      #141414;
    --cafe-bg-card:         #1a1a1a;
    --cafe-bg-hover:        #222222;
    --cafe-bg-primary:      #0a0a0a;
    --cafe-bg-secondary:    #141414;
    
    /* Accent — refined amber */
    --cafe-accent:          #f59e0b;
    --cafe-accent-light:    #fbbf24;
    --cafe-accent-dark:     #d97706;
    --cafe-accent-dim:      rgba(245,158,11,0.08);
    --cafe-accent-bg:       rgba(245,158,11,0.06);
    --cafe-accent-border:   rgba(245,158,11,0.2);
    
    /* Text hierarchy — refined grays */
    --cafe-text-primary:    #f5f5f5;
    --cafe-text-secondary:  #a3a3a3;
    --cafe-text-tertiary:   #6b6b6b;
    --cafe-text-muted:      #4a4a4a;
    
    /* Semantic colors — muted, professional */
    --cafe-success:         #22c55e;
    --cafe-success-bg:      rgba(34,197,94,0.08);
    --cafe-success-border:  rgba(34,197,94,0.15);
    
    --cafe-danger:          #ef4444;
    --cafe-danger-bg:       rgba(239,68,68,0.08);
    --cafe-danger-border:   rgba(239,68,68,0.15);
    
    --cafe-warning:         #f97316;
    --cafe-warning-bg:      rgba(249,115,22,0.08);
    --cafe-warning-border:  rgba(249,115,22,0.15);
    
    --cafe-info:            #3b82f6;
    --cafe-info-bg:         rgba(59,130,246,0.08);
    --cafe-info-border:     rgba(59,130,246,0.15);
    
    /* Borders — subtle, minimal */
    --cafe-border:          #262626;
    --cafe-border-light:    #1f1f1f;
    --cafe-border-focus:    var(--cafe-accent);
    
    /* Shadows — soft, refined */
    --cafe-shadow-sm:       0 1px 2px rgba(0,0,0,0.3);
    --cafe-shadow-md:       0 2px 8px rgba(0,0,0,0.4);
    --cafe-shadow-lg:       0 4px 16px rgba(0,0,0,0.5);
    --cafe-shadow-glow:     0 0 12px rgba(245,158,11,0.15);
    
    /* Radius — consistent, modern */
    --cafe-radius-sm:       4px;
    --cafe-radius-md:       6px;
    --cafe-radius-lg:       8px;
    --cafe-radius-xl:       12px;
    
    /* Spacing scale — refined */
    --cafe-space-xs:        4px;
    --cafe-space-sm:        8px;
    --cafe-space-md:        12px;
    --cafe-space-lg:        16px;
    --cafe-space-xl:        20px;
    --cafe-space-2xl:       24px;
    --cafe-space-3xl:       32px;
    
    /* Typography scale — clean */
    --cafe-font-xs:         12px;
    --cafe-font-sm:         13px;
    --cafe-font-base:       14px;
    --cafe-font-lg:         15px;
    --cafe-font-xl:         17px;
    --cafe-font-2xl:        22px;
    --cafe-font-3xl:        28px;
    
    /* Status colors for operations */
    --cafe-status-new:      #3b82f6;
    --cafe-status-prep:     #f97316;
    --cafe-status-ready:    #22c55e;
    --cafe-status-completed:#6b6b6b;
    --cafe-status-cancelled:#ef4444;
    
    /* Legacy compatibility — map to new system */
    --c-bg:        var(--cafe-bg);
    --c-bg2:       var(--cafe-bg-elevated);
    --c-bg3:       var(--cafe-bg-surface);
    --c-bg4:       var(--cafe-bg-card);
    
    --c-amber:     var(--cafe-accent);
    --c-amber2:    var(--cafe-accent-light);
    --c-amber3:    var(--cafe-accent-dark);
    --c-amber-dim: var(--cafe-accent-dim);
    
    --c-text:      var(--cafe-text-primary);
    --c-text2:     var(--cafe-text-secondary);
    --c-text3:     var(--cafe-text-tertiary);
    
    --c-green:     var(--cafe-success);
    --c-red:       var(--cafe-danger);
    --c-blue:      var(--cafe-info);
    --c-purple:    #a855f7;
    --c-warning:   var(--cafe-warning);
    
    --c-border:    var(--cafe-border);
    --c-border2:   var(--cafe-border-light);
    
    --c-red-bg:       var(--cafe-danger-bg);
    --c-red-border:   var(--cafe-danger-border);
    --c-green-bg:     var(--cafe-success-bg);
    --c-green-border: var(--cafe-success-border);
    --c-amber-bg:     var(--cafe-accent-bg);
    --c-amber-border: var(--cafe-accent-border);
    --c-blue-bg:      var(--cafe-info-bg);
    --c-blue-border:  var(--cafe-info-border);
    --c-purple-bg:    rgba(168,85,247,0.1);
    --c-purple-border:rgba(168,85,247,0.3);
    --c-neutral-bg:   var(--cafe-bg-surface);
    
    --c-on-amber2:   #09090b;
    --c-on-amber3:   #fafafa;
    
    --c-warning-bg:     var(--cafe-warning-bg);
    --c-warning-border: var(--cafe-warning-border);
    
    --c-muted-red: #b91c1c;
    
    --c-danger-bg: var(--cafe-danger-bg);
    --c-success-bg:var(--cafe-success-bg);
    
    --c-banner-gradient: linear-gradient(135deg, #10b98120 0%, #3b82f620 100%);
  }

  .light {
    /* ── Light Theme ───────────────────────────────────────────────── */
    
    /* Backgrounds — pristine, crisp apple-like whites/grays */
    --cafe-bg:              #f8fafc;
    --cafe-bg-elevated:     #ffffff;
    --cafe-bg-surface:      #f1f5f9;
    --cafe-bg-card:         #ffffff;
    --cafe-bg-hover:        #e2e8f0;
    --cafe-bg-primary:      #f8fafc;
    --cafe-bg-secondary:    #ffffff;
    
    /* Accent — rich energetic amber */
    --cafe-accent:          #ea580c;
    --cafe-accent-light:    #f97316;
    --cafe-accent-dark:     #c2410c;
    --cafe-accent-dim:      rgba(234,88,12,0.1);
    --cafe-accent-bg:       rgba(234,88,12,0.06);
    --cafe-accent-border:   rgba(234,88,12,0.25);
    
    /* Text hierarchy — sharp, high contrast darks */
    --cafe-text-primary:    #0f172a;
    --cafe-text-secondary:  #475569;
    --cafe-text-tertiary:   #64748b;
    --cafe-text-muted:      #94a3b8;
    
    /* Semantic colors — bright and accessible */
    --cafe-success:         #059669;
    --cafe-success-bg:      #ecfdf5;
    --cafe-success-border:  #a7f3d0;
    
    --cafe-danger:          #dc2626;
    --cafe-danger-bg:       #fef2f2;
    --cafe-danger-border:   #fecaca;
    
    --cafe-warning:         #ea580c;
    --cafe-warning-bg:      #fff7ed;
    --cafe-warning-border:  #ffedd5;
    
    --cafe-info:            #2563eb;
    --cafe-info-bg:         #eff6ff;
    --cafe-info-border:     #bfdbfe;
    
    /* Borders — incredibly subtle grays */
    --cafe-border:          #cbd5e1;
    --cafe-border-light:    #e2e8f0;
    --cafe-border-focus:    var(--cafe-accent);
    
    /* Shadows — soft, airy depth */
    --cafe-shadow-sm:       0 1px 2px rgba(0,0,0,0.04);
    --cafe-shadow-md:       0 4px 12px rgba(0,0,0,0.06);
    --cafe-shadow-lg:       0 12px 32px rgba(0,0,0,0.08);
    --cafe-shadow-glow:     0 0 16px rgba(234,88,12,0.15);
    
    /* Status colors — adjusted for light mode */
    --cafe-status-new:      #2563eb;
    --cafe-status-prep:     #ea580c;
    --cafe-status-ready:    #059669;
    --cafe-status-completed:#64748b;
    --cafe-status-cancelled:#dc2626;
    
    /* Legacy compatibility */
    --c-bg:        var(--cafe-bg);
    --c-bg2:       var(--cafe-bg-elevated);
    --c-bg3:       var(--cafe-bg-surface);
    --c-bg4:       var(--cafe-bg-card);
    
    --c-amber:     var(--cafe-accent);
    --c-amber2:    var(--cafe-accent-dark);
    --c-amber3:    var(--cafe-accent-light);
    --c-amber-dim: var(--cafe-accent-dim);
    
    --c-text:      var(--cafe-text-primary);
    --c-text2:     var(--cafe-text-secondary);
    --c-text3:     var(--cafe-text-tertiary);
    
    --c-green:     var(--cafe-success);
    --c-red:       var(--cafe-danger);
    --c-blue:      var(--cafe-info);
    --c-purple:    #7B1FA2;
    --c-warning:   var(--cafe-warning);
    
    --c-border:    var(--cafe-border);
    --c-border2:   var(--cafe-border-light);
    
    --c-red-bg:       var(--cafe-danger-bg);
    --c-red-border:   var(--cafe-danger-border);
    --c-green-bg:     var(--cafe-success-bg);
    --c-green-border: var(--cafe-success-border);
    --c-amber-bg:     rgba(184,110,0,0.1);
    --c-amber-border: rgba(184,110,0,0.25);
    --c-blue-bg:      var(--cafe-info-bg);
    --c-blue-border:  var(--cafe-info-border);
    --c-purple-bg:    rgba(123,31,162,0.1);
    --c-purple-border:rgba(123,31,162,0.25);
    --c-neutral-bg:   var(--cafe-bg-surface);
    
    --c-on-amber2:   #F2EBE4;
    --c-on-amber3:   #1A1208;
    
    --c-warning-bg:     var(--cafe-warning-bg);
    --c-warning-border: var(--cafe-warning-border);
    
    --c-muted-red: #8E2424;
    
    --c-danger-bg: var(--cafe-danger-bg);
    --c-success-bg:var(--cafe-success-bg);
    
    --c-banner-gradient: linear-gradient(135deg, #E8F5E9 0%, #F3E5F5 100%);
  }
`;

/**
 * Toggle or explicitly set the theme.
 * Call applyTheme("light"), applyTheme("dark"), or applyTheme() to toggle.
 */
export const applyTheme = (mode) => {
  const html = document.documentElement;
  if (mode === "light") html.classList.add("light");
  else if (mode === "dark") html.classList.remove("light");
  else html.classList.toggle("light");
};

/** Read the current theme: "light" | "dark" */
export const getTheme = () =>
  document.documentElement.classList.contains("light") ? "light" : "dark";

// ── COMPONENT STYLES ──

/** Compact status / source pill badge — CafeOS operational style. */
export const pill = (bg, color, border) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 8px",
  borderRadius: "var(--cafe-radius-sm)",
  fontSize: "var(--cafe-font-xs)",
  fontWeight: 600,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  background: bg,
  color,
  border: `1px solid ${border ?? color + "30"}`,
  whiteSpace: "nowrap",
  lineHeight: 1.4,
});

/** Base card surface — CafeOS premium card style. */
// card() can be called as a function for extra props, OR spread as { ...card } for defaults.
// Both patterns are used across the codebase.
const _cardStyles = {
  background: "var(--cafe-bg-card)",
  border: `1px solid var(--cafe-border)`,
  borderRadius: "var(--cafe-radius-lg)",
  padding: "var(--cafe-space-lg)",
  boxShadow: "var(--cafe-shadow-sm)",
  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
};
export const card = Object.assign(
  (extra = {}) => ({ ..._cardStyles, ...extra }),
  _cardStyles
);

/** Stat card for dashboard metrics. */
export const statCard = (extra = {}) => ({
  ...card(),
  background: "var(--cafe-bg-elevated)",
  border: `1px solid var(--cafe-border-light)`,
  padding: "var(--cafe-space-xl)",
  ...extra,
});

const BTN_BASE = {
  cursor: "pointer",
  minHeight: 44,
  minWidth: 44,
  transition: "all 0.15s ease",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "inherit",
  fontWeight: 600,
  letterSpacing: "-0.01em",
};

/** Returns inline styles for a button variant — CafeOS operational buttons. */
export const btn = (variant) => {
  switch (variant) {
    case "primary":
      return {
        ...BTN_BASE,
        padding: "10px 20px",
        borderRadius: "var(--cafe-radius-md)",
        border: `1px solid var(--cafe-accent-dark)`,
        background: "var(--cafe-accent)",
        color: "#1A1208",
        fontSize: "var(--cafe-font-base)",
        boxShadow: "var(--cafe-shadow-sm)",
      };
    case "ghost":
      return {
        ...BTN_BASE,
        padding: "10px 16px",
        borderRadius: "var(--cafe-radius-md)",
        border: `1px solid var(--cafe-border-light)`,
        background: "transparent",
        color: "var(--cafe-text-secondary)",
        fontSize: "var(--cafe-font-base)",
        fontWeight: 500,
      };
    case "danger":
      return {
        ...BTN_BASE,
        padding: "10px 16px",
        borderRadius: "var(--cafe-radius-md)",
        border: `1px solid var(--cafe-danger-border)`,
        background: "var(--cafe-danger-bg)",
        color: "var(--cafe-danger)",
        fontSize: "var(--cafe-font-base)",
        fontWeight: 500,
      };
    case "success":
      return {
        ...BTN_BASE,
        padding: "10px 16px",
        borderRadius: "var(--cafe-radius-md)",
        border: `1px solid var(--cafe-success-border)`,
        background: "var(--cafe-success-bg)",
        color: "var(--cafe-success)",
        fontSize: "var(--cafe-font-base)",
        fontWeight: 500,
      };
    case "icon":
      return {
        ...BTN_BASE,
        padding: 8,
        borderRadius: "var(--cafe-radius-sm)",
        border: "1px solid transparent",
        background: "transparent",
        color: "var(--cafe-text-secondary)",
        fontSize: "var(--cafe-font-lg)",
        minWidth: 36,
        minHeight: 36,
      };
    default:
      return { ...BTN_BASE };
  }
};

/** Shared input / select / textarea style — CafeOS operational inputs. */
export const input = {
  background:   "var(--cafe-bg-surface)",
  border:       `1px solid var(--cafe-border-light)`,
  borderRadius:  "var(--cafe-radius-md)",
  padding:      "10px 12px",
  color:         "var(--cafe-text-primary)",
  fontSize:      "var(--cafe-font-base)",
  width:        "100%",
  outline:      "none",
  fontFamily:   "inherit",
  boxSizing:    "border-box",
  minHeight:    44,
  transition:   "border-color 0.15s ease, box-shadow 0.15s ease",
};

/** Field label above inputs — CafeOS clear labels. */
export const label = {
  fontSize:      "var(--cafe-font-xs)",
  fontWeight:    600,
  color:         "var(--cafe-text-tertiary)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom:  "var(--cafe-space-sm)",
  display:       "block",
};

/** Table row hover state */
export const tableRow = {
  transition: "background 0.15s ease",
  cursor: "pointer",
};

/** Status badge styles for operational states */
export const statusBadge = (status) => {
  const colors = {
    new: { bg: "var(--cafe-status-new)", text: "#fff" },
    preparing: { bg: "var(--cafe-status-prep)", text: "#fff" },
    ready: { bg: "var(--cafe-status-ready)", text: "#fff" },
    completed: { bg: "var(--cafe-status-completed)", text: "#fff" },
    cancelled: { bg: "var(--cafe-status-cancelled)", text: "#fff" },
  };
  const config = colors[status] || { bg: "var(--cafe-text-tertiary)", text: "#fff" };
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: "var(--cafe-radius-sm)",
    fontSize: "var(--cafe-font-xs)",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    background: config.bg,
    color: config.text,
  };
};

/** Empty state container */
const _emptyStateStyles = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "var(--cafe-space-3xl)",
  color: "var(--cafe-text-tertiary)",
  textAlign: "center",
  minHeight: 200,
};
// emptyState works as { ...emptyState } OR emptyState() — both are used across the codebase
export const emptyState = Object.assign(
  (extra = {}) => ({ ..._emptyStateStyles, ...extra }),
  _emptyStateStyles
);

/** Alert/warning banner */
export const alertBanner = (variant = "info") => {
  const configs = {
    info: { bg: "var(--cafe-info-bg)", border: "var(--cafe-info-border)", text: "var(--cafe-info)" },
    warning: { bg: "var(--cafe-warning-bg)", border: "var(--cafe-warning-border)", text: "var(--cafe-warning)" },
    danger: { bg: "var(--cafe-danger-bg)", border: "var(--cafe-danger-border)", text: "var(--cafe-danger)" },
    success: { bg: "var(--cafe-success-bg)", border: "var(--cafe-success-border)", text: "var(--cafe-success)" },
  };
  const config = configs[variant] || configs.info;
  return {
    padding: "var(--cafe-space-md) var(--cafe-space-lg)",
    borderRadius: "var(--cafe-radius-md)",
    background: config.bg,
    border: `1px solid ${config.border}`,
    color: config.text,
    fontSize: "var(--cafe-font-sm)",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "var(--cafe-space-sm)",
  };
};

/** Modal overlay */
export const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: "var(--cafe-space-lg)",
};

/** Modal content */
export const modalContent = {
  background: "var(--cafe-bg-card)",
  border: `1px solid var(--cafe-border)`,
  borderRadius: "var(--cafe-radius-lg)",
  padding: "var(--cafe-space-xl)",
  maxWidth: 500,
  width: "100%",
  maxHeight: "90vh",
  overflow: "auto",
  boxShadow: "var(--cafe-shadow-lg)",
};
