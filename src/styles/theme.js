import { TIER_COLORS, STATUS_COLORS, SRC_COLORS, PEAK_SOP, MENU_CATS } from "../data/constants";

// ── HELPERS ──
export const srcLabel = (s) => ({ WALK_IN: "Walk-in", SWIGGY: "Swiggy", ZOMATO: "Zomato", DIRECT_DELIVERY: "Delivery" }[s] || s);
export const initials = (n) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

// ── STATUS FLOW ──
export const STATUS_FLOW = { NEW: "ACCEPTED", ACCEPTED: "PREPARING", PREPARING: "READY", READY: "COMPLETED" };
export const STATUS_FLOW_LABEL = { NEW: "Accept", ACCEPTED: "Start Prep", PREPARING: "Mark Ready", READY: "Complete" };

// ── URGENCY ──
export const URGENCY_ORDER = { urgent: 0, soon: 1, ok: 2 };
export const URGENCY_NEXT = { ok: "soon", soon: "urgent", urgent: "ok" };
export const URGENCY_PREV = { urgent: "soon", soon: "ok", ok: "urgent" };

// ── TIER ──
export const TIER_SPEND = { BRONZE: 5000, SILVER: 10000, GOLD: 20000, PLATINUM: Infinity };
export const TIER_NEXT = { BRONZE: "SILVER", SILVER: "GOLD", GOLD: "PLATINUM", PLATINUM: null };

// ── DESIGN TOKENS ──
export const C = {
  bg: "#0C0A08", bg2: "#131110", bg3: "#1C1916", bg4: "#242019",
  amber: "#E8A020", amber2: "#F5C060", amber3: "#7A4A00", amberDim: "rgba(232,160,32,0.1)",
  text: "#F0EBE3", text2: "#9E9189", text3: "#5A5249",
  green: "#4CAF72", red: "#E05252", blue: "#5B9BD5", purple: "#9B72CF",
  border: "#251F1A", border2: "#332C26",
};

export const pill = (bg, color, border) => ({
  display: "inline-flex", alignItems: "center",
  padding: "3px 9px", borderRadius: 20,
  fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
  background: bg, color, border: `1px solid ${border || bg}`,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  whiteSpace: "nowrap",
});

export const card = (extra = {}) => ({
  background: C.bg2,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: "14px 16px",
  ...extra,
});

export const btn = (variant) => {
  if (variant === "primary") return { padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.amber3}`, background: C.amber, color: "#000", fontSize: 12, cursor: "pointer", fontWeight: 700, letterSpacing: ".02em", transition: "opacity .15s" };
  if (variant === "ghost") return { padding: "8px 14px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "all .15s" };
  if (variant === "danger") return { padding: "5px 10px", borderRadius: 7, border: `1px solid #3a1a1a`, background: "transparent", color: C.red, fontSize: 11, cursor: "pointer" };
  if (variant === "success") return { padding: "5px 10px", borderRadius: 7, border: `1px solid #1a3a1a`, background: "transparent", color: C.green, fontSize: 11, cursor: "pointer" };
  return {};
};

export const input = {
  background: C.bg3, border: `1px solid ${C.border2}`,
  borderRadius: 8, padding: "9px 12px",
  color: C.text, fontSize: 13, width: "100%",
  outline: "none", fontFamily: "inherit",
  boxSizing: "border-box",
};

export const label = { fontSize: 10, fontWeight: 700, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6, display: "block" };

export { TIER_COLORS, STATUS_COLORS, SRC_COLORS, PEAK_SOP, MENU_CATS };
