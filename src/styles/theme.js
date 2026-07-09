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
    /* Backgrounds — stepped warmth, espresso-roast depth */
    --c-bg:        #080705;
    --c-bg2:       #0F0D0B;
    --c-bg3:       #181410;
    --c-bg4:       #201C17;

    /* Amber — pulled from single-origin honey, not safety-vest yellow */
    --c-amber:     #D4901A;
    --c-amber2:    #F2B84B;
    --c-amber3:    #6B3E00;
    --c-amber-dim: rgba(212,144,26,0.12);

    /* Text — warm whites, no blue cast */
    --c-text:      #EDE8DF;
    --c-text2:     #8A7E74;
    --c-text3:     #4E4740;

    /* Semantic — slightly desaturated so they don't scream */
    --c-green:     #3FA666;
    --c-red:       #D44E4E;
    --c-blue:      #4E8EC4;
    --c-purple:    #8B64C0;

    /* Borders — hairlines, not walls */
    --c-border:    #1E1A15;
    --c-border2:   #2C2620;

    --c-danger-bg: #220606;
    --c-success-bg:#061A0D;

    /* Tinted state surfaces */
    --c-red-bg:       #220606;
    --c-red-border:   #361212;
    --c-green-bg:     #061A0D;
    --c-green-border: #103820;
    --c-amber-bg:     #1E1100;
    --c-amber-border: #3C2C00;
    --c-blue-bg:      #06111E;
    --c-blue-border:  #122440;
    --c-purple-bg:    #120820;
    --c-purple-border:#2E1852;
    --c-neutral-bg:   #141210;

    --c-on-amber2:   #160E02;
    --c-on-amber3:   #F2E6C4;

    --c-warning:        #E8762A;
    --c-warning-bg:     #1E0C00;
    --c-warning-border: #4A2000;

    --c-muted-red: #965050;

    --c-banner-gradient: linear-gradient(135deg, #0F2820 0%, #1A0E2E 100%);
  }

  .light {
    --c-bg:        #F5F1EB;
    --c-bg2:       #FDFBF8;
    --c-bg3:       #EDE7DF;
    --c-bg4:       #E2D9CE;

    --c-amber:     #B86E00;
    --c-amber2:    #6B3E00;
    --c-amber3:    #F2B84B;
    --c-amber-dim: rgba(184,110,0,0.10);

    --c-text:      #18120A;
    --c-text2:     #524840;
    --c-text3:     #948578;

    --c-green:     #186830;
    --c-red:       #B03228;
    --c-blue:      #1F5898;
    --c-purple:    #5E34A0;

    --c-border:    #D8CFC4;
    --c-border2:   #C4B8AA;

    --c-danger-bg: #FDF2F0;
    --c-success-bg:#F0FDF4;

    --c-red-bg:       #FDF2F0;
    --c-red-border:   #EFCBC6;
    --c-green-bg:     #F0FDF4;
    --c-green-border: #C2E4CC;
    --c-amber-bg:     #FEF6E4;
    --c-amber-border: #EDD898;
    --c-blue-bg:      #EBF2FC;
    --c-blue-border:  #C2D8F0;
    --c-purple-bg:    #F2EDFB;
    --c-purple-border:#D8C4EE;
    --c-neutral-bg:   #EDEAE4;

    --c-on-amber2:   #F2E6C4;
    --c-on-amber3:   #160E02;

    --c-warning:        #964000;
    --c-warning-bg:     #FEF4E8;
    --c-warning-border: #EEC898;

    --c-muted-red: #7A3E3E;

    --c-banner-gradient: linear-gradient(135deg, #D8F0E6 0%, #EDE4FA 100%);
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
  gap: 4,
  padding: "2px 7px",
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.02em",
  background: bg,
  color,
  border: `1px solid ${border ?? color + "30"}`,
  whiteSpace: "nowrap",
  lineHeight: "18px",
});

/** Base card surface. Pass an object to merge extra styles. */
export const card = (extra = {}) => ({
  background: C.bg2,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "14px 16px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
  ...extra,
});

const BTN_BASE = {
  cursor: "pointer",
  minHeight: 44,
  minWidth: 44,
  transition: "opacity .12s ease, background .12s ease, color .12s ease, box-shadow .12s ease",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

/** Returns inline styles for a button variant. */
export const btn = (variant) => {
  switch (variant) {
    case "primary":
      return {
        ...BTN_BASE,
        padding: "10px 20px",
        borderRadius: 7,
        border: `1px solid ${C.amber3}`,
        background: C.amber2,
        color: C.onAmber2,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
      };
    case "ghost":
      return {
        ...BTN_BASE,
        padding: "10px 16px",
        borderRadius: 7,
        border: `1px solid ${C.border2}`,
        background: "transparent",
        color: C.text2,
        fontSize: 13,
        fontWeight: 500,
      };
    case "danger":
      return {
        ...BTN_BASE,
        padding: "9px 14px",
        borderRadius: 6,
        border: `1px solid var(--c-red-border)`,
        background: "var(--c-danger-bg)",
        color: C.red,
        fontSize: 13,
        fontWeight: 500,
      };
    case "success":
      return {
        ...BTN_BASE,
        padding: "9px 14px",
        borderRadius: 6,
        border: `1px solid var(--c-green-border)`,
        background: "var(--c-success-bg)",
        color: C.green,
        fontSize: 13,
        fontWeight: 500,
      };
    default:
      return { ...BTN_BASE };
  }
};

/** Shared input / select / textarea style. */
export const input = {
  background:   C.bg3,
  border:       `1px solid ${C.border2}`,
  borderRadius:  7,
  padding:      "10px 12px",
  color:         C.text,
  fontSize:      14,
  width:        "100%",
  outline:      "none",
  fontFamily:   "inherit",
  boxSizing:    "border-box",
  minHeight:     40,
  transition:   "border-color .15s ease",
};

/** Field label above inputs. */
export const label = {
  fontSize:      11,
  fontWeight:    500,
  color:         C.text3,
  letterSpacing: "0.01em",
  marginBottom:  5,
  display:       "block",
};
