export { TIER_COLORS, STATUS_COLORS, SRC_COLORS, PEAK_SOP, MENU_CATS } from "../data/constants";

// ── HELPERS ──
/** Maps an order source key to a human-readable label. */
export const srcLabel = (s) =>
  ({ WALK_IN: "Walk-in", SWIGGY: "Swiggy", ZOMATO: "Zomato", DIRECT_DELIVERY: "Delivery" }[s] ?? s);

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
    --c-bg:        #0C0A08;
    --c-bg2:       #131110;
    --c-bg3:       #1C1916;
    --c-bg4:       #242019;
    --c-amber:     #E8A020;
    --c-amber2:    #F5C060;
    --c-amber3:    #7A4A00;
    --c-amber-dim: rgba(232,160,32,0.1);
    --c-text:      #F0EBE3;
    --c-text2:     #9E9189;
    --c-text3:     #5A5249;
    --c-green:     #4CAF72;
    --c-red:       #E05252;
    --c-blue:      #5B9BD5;
    --c-purple:    #9B72CF;
    --c-border:    #251F1A;
    --c-border2:   #332C26;
    --c-danger-bg: #2a0808;
    --c-success-bg:#0d2a14;

    --c-red-bg:      #2a0808;
    --c-red-border:  #3a1a1a;
    --c-green-bg:    #0d2218;
    --c-green-border:#1a4020;
    --c-amber-bg:    #2a1a00;
    --c-amber-border:#4a3800;
    --c-blue-bg:     #0d1a28;
    --c-blue-border: #1a3050;
    --c-purple-bg:   #1a0d2a;
    --c-purple-border:#3a2060;
    --c-neutral-bg:  #1a1a1a;

    --c-on-amber2:   #1a1206;
    --c-on-amber3:   #F5E8C8;

    --c-warning:        #FF8C42;
    --c-warning-bg:     #2a1200;
    --c-warning-border: #5a2a00;

    --c-muted-red: #A05858;

    --c-banner-gradient: linear-gradient(135deg, #1a3a2e 0%, #2a1a3e 100%);
  }

  .light {
    --c-bg:        #F9F6F2;
    --c-bg2:       #FFFFFF;
    --c-bg3:       #F2EDE7;
    --c-bg4:       #E8E0D6;
    --c-amber:     #C47A00;
    --c-amber2:    #7A4A00;
    --c-amber3:    #F5C060;
    --c-amber-dim: rgba(196,122,0,0.1);
    --c-text:      #1A1410;
    --c-text2:     #5A4E45;
    --c-text3:     #9E8E80;
    --c-green:     #1E7A3A;
    --c-red:       #C0392B;
    --c-blue:      #2563A8;
    --c-purple:    #6B3FA0;
    --c-border:    #DDD5CC;
    --c-border2:   #C8BBAF;
    --c-danger-bg: #fdf0ef;
    --c-success-bg:#f0fdf4;

    --c-red-bg:      #fdf0ef;
    --c-red-border:  #f3c9c5;
    --c-green-bg:    #f0fdf4;
    --c-green-border:#c8e8d0;
    --c-amber-bg:    #fdf3e0;
    --c-amber-border:#f0d9a0;
    --c-blue-bg:     #eaf2fb;
    --c-blue-border: #c8ddf2;
    --c-purple-bg:   #f3edfb;
    --c-purple-border:#dcc8f0;
    --c-neutral-bg:  #f0ece6;

    --c-on-amber2:   #F5E8C8;
    --c-on-amber3:   #1a1206;

    --c-warning:        #A04000;
    --c-warning-bg:     #fdf0e3;
    --c-warning-border: #f0cba0;

    --c-muted-red: #884444;

    --c-banner-gradient: linear-gradient(135deg, #e0f5ea 0%, #f0e6fb 100%);
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

/** Compact status / source pill badge. */
export const pill = (bg, color, border) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 9px",
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".04em",
  background: bg,
  color,
  border: `1px solid ${border ?? bg}`,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  whiteSpace: "nowrap",
});

/** Base card surface. Pass an object to merge extra styles. */
export const card = (extra = {}) => ({
  background: C.bg2,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: "14px 16px",
  ...extra,
});

const BTN_BASE = {
  cursor: "pointer",
  minHeight: 44,
  minWidth: 44,
  transition: "opacity .15s, background .15s, color .15s, border-color .15s",
};

/** Returns inline styles for a button variant. */
export const btn = (variant) => {
  switch (variant) {
    case "primary":
      return { ...BTN_BASE, padding: "12px 20px", borderRadius: 8, border: `1px solid ${C.amber3}`, background: C.amber,  color: "#000",   fontSize: 14, fontWeight: 700, letterSpacing: ".02em" };
    case "ghost":
      return { ...BTN_BASE, padding: "12px 16px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3,   color: C.text2,  fontSize: 14, fontWeight: 600 };
    case "danger":
      return { ...BTN_BASE, padding: "10px 14px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "var(--c-danger-bg)",  color: C.red,   fontSize: 13 };
    case "success":
      return { ...BTN_BASE, padding: "10px 14px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "var(--c-success-bg)", color: C.green, fontSize: 13 };
    default:
      return { ...BTN_BASE };
  }
};

/** Shared input / select / textarea style. */
export const input = {
  background:   C.bg3,
  border:       `1px solid ${C.border2}`,
  borderRadius:  8,
  padding:      "12px 14px",
  color:         C.text,
  fontSize:      16,
  width:        "100%",
  outline:      "none",
  fontFamily:   "inherit",
  boxSizing:    "border-box",
  minHeight:     44,
};

/** Uppercase field label above inputs. */
export const label = {
  fontSize:      10,
  fontWeight:    700,
  color:         C.text3,
  letterSpacing: ".08em",
  textTransform: "uppercase",
  marginBottom:  6,
  display:       "block",
};
