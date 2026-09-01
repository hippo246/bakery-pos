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
  `₹${  Number(amount ?? 0).toLocaleString("en-IN")}`;

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
    /* ── Modern Minimalist Theme (Dark Mode) ───────────────────── */
    
    /* Backgrounds — true black and dark grays */
    --cafe-bg:              #000000;
    --cafe-bg-elevated:     #0a0a0a;
    --cafe-bg-surface:      #111111;
    --cafe-bg-card:         #1a1a1a;
    --cafe-bg-hover:        #222222;
    --cafe-bg-primary:      #000000;
    --cafe-bg-secondary:    #111111;
    
    /* Accent — modern amber */
    --cafe-accent:          #f59e0b;
    --cafe-accent-light:    #fbbf24;
    --cafe-accent-dark:     #d97706;
    --cafe-accent-dim:      rgba(245,158,11,0.1);
    --cafe-accent-bg:       rgba(245,158,11,0.08);
    --cafe-accent-border:   rgba(245,158,11,0.2);
    
    /* Text hierarchy — clean whites */
    --cafe-text-primary:    #f1f5f9;
    --cafe-text-secondary:  #cbd5e1;
    --cafe-text-tertiary:   #94a3b8;
    --cafe-text-muted:      #64748b;
    
    /* Semantic colors — modern palette */
    --cafe-success:         #22c55e;
    --cafe-success-bg:      rgba(34,197,94,0.1);
    --cafe-success-border:  rgba(34,197,94,0.2);
    
    --cafe-danger:          #ef4444;
    --cafe-danger-bg:       rgba(239,68,68,0.1);
    --cafe-danger-border:   rgba(239,68,68,0.2);
    
    --cafe-warning:         #f59e0b;
    --cafe-warning-bg:      rgba(245,158,11,0.1);
    --cafe-warning-border:  rgba(245,158,11,0.2);
    
    --cafe-info:            #3b82f6;
    --cafe-info-bg:         rgba(59,130,246,0.1);
    --cafe-info-border:     rgba(59,130,246,0.2);
    
    /* Borders — subtle, modern */
    --cafe-border:          #222222;
    --cafe-border-light:    #333333;
    --cafe-border-focus:    var(--cafe-accent);
    
    /* Shadows — soft, modern */
    --cafe-shadow-sm:       0 1px 2px rgba(0,0,0,0.1);
    --cafe-shadow-md:       0 4px 6px rgba(0,0,0,0.15);
    --cafe-shadow-lg:       0 10px 15px rgba(0,0,0,0.2);
    --cafe-shadow-glow:     0 0 20px rgba(245,158,11,0.15);
    
    /* Radius — modern, consistent */
    --cafe-radius-sm:       4px;
    --cafe-radius-md:       6px;
    --cafe-radius-lg:       8px;
    --cafe-radius-xl:       12px;
    
    /* Spacing scale — modern */
    --cafe-space-xs:        4px;
    --cafe-space-sm:        8px;
    --cafe-space-md:        12px;
    --cafe-space-lg:        16px;
    --cafe-space-xl:        20px;
    --cafe-space-2xl:       24px;
    --cafe-space-3xl:       32px;
    
    /* Typography scale — modern */
    --cafe-font-xs:         12px;
    --cafe-font-sm:         13px;
    --cafe-font-base:       14px;
    --cafe-font-lg:         16px;
    --cafe-font-xl:         18px;
    --cafe-font-2xl:        24px;
    --cafe-font-3xl:        30px;
    
    /* Status colors for operations */
    --cafe-status-new:      #3b82f6;
    --cafe-status-prep:     #f59e0b;
    --cafe-status-ready:    #22c55e;
    --cafe-status-completed:#64748b;
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
    --c-purple:    #9b59b6;
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
    --c-purple-bg:    rgba(155,89,182,0.12);
    --c-purple-border:rgba(155,89,182,0.3);
    --c-neutral-bg:   var(--cafe-bg-surface);
    
    --c-on-amber2:   #1a1614;
    --c-on-amber3:   #faf6f2;
    
    --c-warning-bg:     var(--cafe-warning-bg);
    --c-warning-border: var(--cafe-warning-border);
    
    --c-muted-red: #c0392b;
    
    --c-danger-bg: var(--cafe-danger-bg);
    --c-success-bg:var(--cafe-success-bg);
    
    --c-banner-gradient: linear-gradient(135deg, rgba(92,184,92,0.15) 0%, rgba(52,152,219,0.15) 100%);

    /* ── TIER COLORS (Loyalty) ─────────────────────────────────────── */
    --tier-bronze-bg:        #2a1a08;
    --tier-bronze-color:     #CD7F32;
    --tier-bronze-glow:      rgba(205,127,50,0.30);
    --tier-silver-bg:        #1e1e1e;
    --tier-silver-color:     #C0C0C0;
    --tier-silver-glow:      rgba(192,192,192,0.22);
    --tier-gold-bg:          #2a2008;
    --tier-gold-color:       #E8A020;
    --tier-gold-glow:        rgba(232,160,32,0.30);
    --tier-platinum-bg:      #0a1a1a;
    --tier-platinum-color:   #4AD9D9;
    --tier-platinum-glow:    rgba(74,217,217,0.30);

    /* ── STATUS COLORS (Order lifecycle) ───────────────────────────── */
    --status-new-bg:         rgba(52,152,219,0.16);
    --status-new-border:     rgba(52,152,219,0.36);
    --status-new-color:      #3498db;
    --status-accepted-bg:    rgba(155,89,182,0.16);
    --status-accepted-border:rgba(155,89,182,0.36);
    --status-accepted-color: #9b59b6;
    --status-preparing-bg:   rgba(243,156,18,0.16);
    --status-preparing-border: rgba(243,156,18,0.36);
    --status-preparing-color: #f39c12;
    --status-ready-bg:       rgba(92,184,92,0.16);
    --status-ready-border:   rgba(92,184,92,0.36);
    --status-ready-color:    #5cb85c;
    --status-completed-bg:   rgba(138,126,118,0.18);
    --status-completed-border: rgba(138,126,118,0.36);
    --status-completed-color: #8a7e76;
    --status-cancelled-bg:   rgba(231,76,60,0.16);
    --status-cancelled-border: rgba(231,76,60,0.36);
    --status-cancelled-color: #e74c3c;
    --status-delivery-bg:    rgba(20,184,166,0.16);
    --status-delivery-border: rgba(20,184,166,0.36);
    --status-delivery-color: #14B8A6;

    /* ── SRC COLORS (Order sources) ───────────────────────────────── */
    --src-walkin-bg:         rgba(92,184,92,0.16);
    --src-walkin-color:      #5cb85c;
    --src-swiggy-bg:         rgba(255,138,80,0.16);
    --src-swiggy-color:      #FF8A50;
    --src-zomato-bg:         rgba(255,85,102,0.16);
    --src-zomato-color:      #FF5566;
    --src-delivery-bg:       rgba(52,152,219,0.16);
    --src-delivery-color:    #3498db;
    --src-qr-bg:             rgba(196,181,253,0.16);
    --src-qr-color:          #c4b5fd;

    /* ── POS CATEGORY TAB BAR ─────────────────────────────────────── */
    --pos-catbar-bg:            #1E1E1E;
    --pos-catbar-border:        rgba(255,255,255,0.05);
    --pos-cat-inactive-bg:      #2A2A2A;
    --pos-cat-inactive-bg-hover:#3A3A3A;
    --pos-cat-inactive-color:   #ffffff;
    --pos-cat-active-bg:        #0D9488;
    --pos-cat-active-color:     #ffffff;
    --pos-cat-active-glow:      rgba(13, 148, 136, 0.40);
    --pos-cat-border-radius:    20px;
    --pos-cat-nav-next-bg:      #3B82F6;
    --pos-cat-nav-next-bg-hover:#2563EB;
    --pos-cat-nav-prev-bg:      #6B7280;
    --pos-cat-nav-prev-bg-hover:#4B5563;
    --pos-cat-nav-color:        #ffffff;

    /* ── FAST-FOOD POS CATEGORY TAB BAR (red accent variant) ─────── */
    --ff-catbar-bg:             #111116;
    --ff-catbar-border:         rgba(255,255,255,0.05);
    --ff-cat-inactive-bg:       rgba(255,255,255,0.04);
    --ff-cat-inactive-bg-hover: rgba(230,57,70,0.10);
    --ff-cat-inactive-border:   rgba(255,255,255,0.08);
    --ff-cat-inactive-border-hover: rgba(230,57,70,0.30);
    --ff-cat-inactive-color:    rgba(255,255,255,0.50);
    --ff-cat-active-bg:         linear-gradient(135deg, #E63946 0%, #C1121F 100%);
    --ff-cat-active-border:     #E63946;
    --ff-cat-active-color:      #ffffff;
    --ff-cat-active-glow:       rgba(230,57,70,0.35);
    --ff-cat-nav-bg:            rgba(255,255,255,0.05);
    --ff-cat-nav-border:        rgba(255,255,255,0.10);
    --ff-cat-nav-color:         rgba(255,255,255,0.50);

    /* ── TABLE STATUS CHIPS (floor plan / dine-in) ────────────────── */
    --table-available-color:    #22c55e;
    --table-available-bg:       #052e16;
    --table-available-border:   #16a34a;
    --table-reserved-color:     #f59e0b;
    --table-reserved-bg:        #1c0a00;
    --table-reserved-border:    #92400e;
    --table-occupied-color:     #ef4444;
    --table-occupied-bg:        #1c0606;
    --table-occupied-border:    #991b1b;
    --table-ordering-color:     #8b5cf6;
    --table-ordering-bg:        #1e1030;
    --table-ordering-border:    #6d28d9;
    --table-dining-color:       #64748b;
    --table-dining-bg:          #0f172a;
    --table-dining-border:      #334155;
    --table-billreq-color:      #ec4899;
    --table-billreq-bg:         #1c0614;
    --table-billreq-border:     #9d174d;
    --table-cleaning-color:     #6366f1;
    --table-cleaning-bg:        #10102a;
    --table-cleaning-border:    #4338ca;
    --table-billed-color:       #3b82f6;
    --table-billed-bg:          #0c1929;
    --table-billed-border:      #1d4ed8;
    --table-default-color:      #94a3b8;
    --table-default-bg:         #0f172a;
    --table-default-border:     #334155;

    /* ── ORDER TYPE TABS (Dine-in / Takeaway / Delivery …) ────────── */
    --ordertype-inactive-bg:    var(--cafe-bg-surface);
    --ordertype-inactive-border:var(--cafe-border-light);
    --ordertype-inactive-color: var(--cafe-text-secondary);
    --ordertype-active-bg:      var(--cafe-accent-bg);
    --ordertype-active-border:  var(--cafe-accent);
    --ordertype-active-color:   var(--cafe-accent);
    --ordertype-active-glow:    rgba(99,102,241,0.30);
    --ordertype-hover-bg:       var(--cafe-bg-hover);
    --ordertype-hover-border:   var(--cafe-accent);

    /* ── MOBILE BOTTOM NAV TABS ───────────────────────────────────── */
    --mobile-nav-bg:            var(--cafe-bg-elevated);
    --mobile-nav-border:        var(--cafe-border);
    --mobile-nav-inactive-color:var(--cafe-text-tertiary);
    --mobile-nav-active-color:  var(--cafe-accent);
    --mobile-nav-active-bg:     var(--cafe-accent-dim);
    --mobile-nav-backdrop:      rgba(18, 18, 20, 0.85);

    /* ── POS SURFACES (generic fallback tokens) ───────────────────── */
    --pos-surface:              #111116;
    --pos-surface-2:            #18181f;
    --pos-border:               rgba(255,255,255,0.07);
    --pos-text:                 #f1f1f3;
    --pos-text-muted:           rgba(255,255,255,0.38);
    --pos-accent:               var(--cafe-accent);

    /* ── CLASSIC POS COMPONENT TOKENS (Dark Mode) ─────────────────── */
    --classic-pos-grid-bg:          #121212;
    --classic-pos-tile-bg:          #2A2A2A;
    --classic-pos-tile-bg-hover:    #3A3A3A;
    --classic-pos-tile-border:      #3A3A3A;
    --classic-pos-tile-border-hover:#4A4A4A;
    --classic-pos-price-color:      #38EF7D;
    --classic-pos-code-color:       #888888;
    --classic-pos-name-color:       #ffffff;
    --classic-pos-panel-bg:         #1E1E1E;
    --classic-pos-panel-border:     #333333;
    --classic-pos-header-bg:        #2A2A2A;
    --classic-pos-header-border:    #444444;
    --classic-pos-row-bg:           #252525;
    --classic-pos-row-bg-hover:     #2A2A2A;
    --classic-pos-row-selected-bg:  #0D9488;
    --classic-pos-row-border:       #333333;
    --classic-pos-empty-color:      #666666;
    --classic-pos-input-bg:         #252525;
    --classic-pos-input-border:     #444444;
    --classic-pos-suggest-bg:       #2A2A2A;
    --classic-pos-suggest-border:   #444444;
    --classic-pos-suggest-selected: #0D9488;
    --classic-pos-suggest-divider:  #333333;
    --classic-pos-summary-bg:       #EBF8FF;
    --classic-pos-summary-border:   #BEE3F8;
    --classic-pos-summary-label:    #4A5568;
    --classic-pos-summary-value:    #2B6CB0;
    --classic-pos-summary-net-bg:   #22C55E;
    --classic-pos-summary-net-glow: rgba(34, 197, 94, 0.3);
    --classic-pos-func-btn-bg:      linear-gradient(135deg, #5B2020 0%, #3D1414 100%);
    --classic-pos-func-btn-bg-hover:linear-gradient(135deg, #7B3030 0%, #5B2020 100%);
    --classic-pos-func-tab-active:  #5B2020;
    --classic-pos-func-tab-inactive:#2A2A2A;
    --classic-pos-func-grid-bg:     #1E1E1E;
    --classic-pos-keypad-bg:        #1E1E1E;
    --classic-pos-keypad-num-bg:    linear-gradient(135deg, #2B6CB0 0%, #3182CE 100%);
    --classic-pos-keypad-danger-bg: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
    --classic-pos-keypad-success-bg:linear-gradient(135deg, #059669 0%, #10B981 100%);
    --classic-pos-keypad-action-bg: linear-gradient(135deg, #4B5563 0%, #6B7280 100%);
    --classic-pos-keypad-text:      #ffffff;
    --classic-pos-modal-bg:         #1E1E1E;
    --classic-pos-modal-border:     #333333;
    --classic-pos-modal-header-bg:  #252525;
    --classic-pos-modal-header-border:#333333;
    --classic-pos-card-bg:          #2A2A2A;
    --classic-pos-card-bg-hover:    #3A3A3A;
    --classic-pos-card-border:      #3A3A3A;
    --classic-pos-card-border-hover:#4A4A4A;
    --classic-pos-close-btn-bg:     #DC2626;
    --classic-pos-close-btn-hover:  #EF4444;
    --classic-pos-recall-btn-bg:    linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    --classic-pos-recall-btn-hover: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%);
    --classic-pos-print-btn-bg:     linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    --classic-pos-print-btn-hover:  linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
    --classic-pos-walkin-btn-bg:    linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    --classic-pos-walkin-btn-hover: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%);
    --classic-pos-table-avail-bg:   #2A2A2A;
    --classic-pos-table-active-bg:  #1A2E25;
    --classic-pos-table-active-border: #38EF7D;
    --classic-pos-status-active-bg: #38EF7D;
    --classic-pos-status-active-text:#000000;
    --classic-pos-status-inactive-bg:#6B7280;
    --classic-pos-status-inactive-text:#ffffff;
    --classic-pos-quickbar-bg:      #1E1E1E;
    --classic-pos-quickbar-border:  #333333;
    --classic-pos-detail-text:      #cccccc;
    --classic-pos-status-pending:   #F59E0B;
    --classic-pos-delete-btn-bg:    #DC2626;
    --classic-pos-delete-btn-hover: #EF4444;
    --classic-pos-menu-btn-1:       #16A085;
    --classic-pos-menu-btn-2:       #D35400;
    --classic-pos-menu-btn-3:       #1ABC9C;
    --classic-pos-menu-btn-4:       #E67E22;
    --classic-pos-menu-btn-5:       #34495E;
    --classic-pos-menu-btn-6:       #7F8C8D;
  }

  .light {
    /* ── Modern Minimalist Theme (Light Mode) ───────────────────── */
    
    /* Backgrounds — clean light tones */
    --cafe-bg:              #f8fafc;
    --cafe-bg-elevated:     #ffffff;
    --cafe-bg-surface:      #f1f5f9;
    --cafe-bg-card:         #ffffff;
    --cafe-bg-hover:        #f8fafc;
    --cafe-bg-primary:      #f8fafc;
    --cafe-bg-secondary:    #ffffff;
    
    /* Accent — modern amber */
    --cafe-accent:          #f59e0b;
    --cafe-accent-light:    #fbbf24;
    --cafe-accent-dark:     #d97706;
    --cafe-accent-dim:      rgba(245,158,11,0.08);
    --cafe-accent-bg:       rgba(245,158,11,0.06);
    --cafe-accent-border:   rgba(245,158,11,0.15);
    
    /* Text hierarchy — clean darks */
    --cafe-text-primary:    #1e293b;
    --cafe-text-secondary:  #475569;
    --cafe-text-tertiary:   #64748b;
    --cafe-text-muted:      #94a3b8;
    
    /* Semantic colors — modern palette */
    --cafe-success:         #22c55e;
    --cafe-success-bg:      #dcfce7;
    --cafe-success-border:  #bbf7d0;
    
    --cafe-danger:          #ef4444;
    --cafe-danger-bg:       #fee2e2;
    --cafe-danger-border:   #fecaca;
    
    --cafe-warning:         #f59e0b;
    --cafe-warning-bg:      #fef3c7;
    --cafe-warning-border:  #fde68a;
    
    --cafe-info:            #3b82f6;
    --cafe-info-bg:         #dbeafe;
    --cafe-info-border:     #bfdbfe;
    
    /* Borders — subtle, modern */
    --cafe-border:          #e2e8f0;
    --cafe-border-light:    #f1f5f9;
    --cafe-border-focus:    var(--cafe-accent);
    
    /* Shadows — soft, modern */
    --cafe-shadow-sm:       0 1px 2px rgba(0,0,0,0.05);
    --cafe-shadow-md:       0 4px 6px rgba(0,0,0,0.08);
    --cafe-shadow-lg:       0 10px 15px rgba(0,0,0,0.1);
    --cafe-shadow-glow:     0 0 20px rgba(245,158,11,0.1);
    
    /* Status colors — adjusted for light mode */
    --cafe-status-new:      #3b82f6;
    --cafe-status-prep:     #f59e0b;
    --cafe-status-ready:    #22c55e;
    --cafe-status-completed:#64748b;
    --cafe-status-cancelled:#ef4444;
    
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
    --c-purple:    #8e44ad;
    --c-warning:   var(--cafe-warning);
    
    --c-border:    var(--cafe-border);
    --c-border2:   var(--cafe-border-light);
    
    --c-red-bg:       var(--cafe-danger-bg);
    --c-red-border:   var(--cafe-danger-border);
    --c-green-bg:     var(--cafe-success-bg);
    --c-green-border: var(--cafe-success-border);
    --c-amber-bg:     rgba(139,105,20,0.08);
    --c-amber-border: rgba(139,105,20,0.2);
    --c-blue-bg:      var(--cafe-info-bg);
    --c-blue-border:  var(--cafe-info-border);
    --c-purple-bg:    rgba(142,68,173,0.08);
    --c-purple-border:rgba(142,68,173,0.2);
    --c-neutral-bg:   var(--cafe-bg-surface);
    
    --c-on-amber2:   #faf8f5;
    --c-on-amber3:   #2c2420;
    
    --c-warning-bg:     var(--cafe-warning-bg);
    --c-warning-border: var(--cafe-warning-border);
    
    --c-muted-red: #a93226;
    
    --c-danger-bg: var(--cafe-danger-bg);
    --c-success-bg:var(--cafe-success-bg);
    
    --c-banner-gradient: linear-gradient(135deg, #e8f5e9 0%, #eaf2f8 100%);

    /* ── TIER COLORS (Loyalty) — Light mode ──────────────────────── */
    --tier-bronze-bg:        #FBF0E3;
    --tier-bronze-color:     #B87333;
    --tier-bronze-glow:      rgba(184,115,51,0.22);
    --tier-silver-bg:        #F5F5F5;
    --tier-silver-color:     #9E9E9E;
    --tier-silver-glow:      rgba(158,158,158,0.18);
    --tier-gold-bg:          #FEF5E0;
    --tier-gold-color:       #D4A017;
    --tier-gold-glow:        rgba(212,160,23,0.22);
    --tier-platinum-bg:      #E0F7F7;
    --tier-platinum-color:   #20B2AA;
    --tier-platinum-glow:    rgba(32,178,170,0.22);

    /* ── STATUS COLORS (Order lifecycle) — Light mode ────────────── */
    --status-new-bg:         rgba(41,128,185,0.10);
    --status-new-border:     rgba(41,128,185,0.28);
    --status-new-color:      #2980b9;
    --status-accepted-bg:    rgba(142,68,173,0.10);
    --status-accepted-border:rgba(142,68,173,0.28);
    --status-accepted-color: #8e44ad;
    --status-preparing-bg:   rgba(214,137,16,0.10);
    --status-preparing-border: rgba(214,137,16,0.28);
    --status-preparing-color: #d68910;
    --status-ready-bg:       rgba(39,174,96,0.10);
    --status-ready-border:   rgba(39,174,96,0.28);
    --status-ready-color:    #27ae60;
    --status-completed-bg:   rgba(138,126,118,0.10);
    --status-completed-border: rgba(138,126,118,0.24);
    --status-completed-color: #8a7e76;
    --status-cancelled-bg:   rgba(192,57,43,0.10);
    --status-cancelled-border: rgba(192,57,43,0.28);
    --status-cancelled-color: #c0392b;
    --status-delivery-bg:    rgba(20,184,166,0.10);
    --status-delivery-border: rgba(20,184,166,0.28);
    --status-delivery-color: #14B8A6;

    /* ── SRC COLORS (Order sources) — Light mode ─────────────────── */
    --src-walkin-bg:         rgba(39,174,96,0.10);
    --src-walkin-color:      #27ae60;
    --src-swiggy-bg:         rgba(255,107,53,0.10);
    --src-swiggy-color:      #FF6B35;
    --src-zomato-bg:         rgba(232,52,78,0.10);
    --src-zomato-color:      #E8344E;
    --src-delivery-bg:       rgba(41,128,185,0.10);
    --src-delivery-color:    #2980b9;
    --src-qr-bg:             rgba(139,92,246,0.10);
    --src-qr-color:          #8b5cf6;

    /* ── POS CATEGORY TAB BAR — Light mode ────────────────────────── */
    --pos-catbar-bg:            #F5F1EA;
    --pos-catbar-border:        rgba(0,0,0,0.05);
    --pos-cat-inactive-bg:      #FFFFFF;
    --pos-cat-inactive-bg-hover:#F0EBE0;
    --pos-cat-inactive-color:   #4A3F35;
    --pos-cat-active-bg:        #0D9488;
    --pos-cat-active-color:     #ffffff;
    --pos-cat-active-glow:      rgba(13, 148, 136, 0.25);
    --pos-cat-border-radius:    20px;
    --pos-cat-nav-next-bg:      #3B82F6;
    --pos-cat-nav-next-bg-hover:#2563EB;
    --pos-cat-nav-prev-bg:      #94A3B8;
    --pos-cat-nav-prev-bg-hover:#64748B;
    --pos-cat-nav-color:        #ffffff;

    /* ── FAST-FOOD POS CATEGORY TAB BAR — Light mode ─────────────── */
    --ff-catbar-bg:             #FFFFFF;
    --ff-catbar-border:         rgba(0,0,0,0.06);
    --ff-cat-inactive-bg:       rgba(0,0,0,0.03);
    --ff-cat-inactive-bg-hover: rgba(230,57,70,0.08);
    --ff-cat-inactive-border:   rgba(0,0,0,0.08);
    --ff-cat-inactive-border-hover: rgba(230,57,70,0.25);
    --ff-cat-inactive-color:    rgba(0,0,0,0.55);
    --ff-cat-active-bg:         linear-gradient(135deg, #E63946 0%, #C1121F 100%);
    --ff-cat-active-border:     #E63946;
    --ff-cat-active-color:      #ffffff;
    --ff-cat-active-glow:       rgba(230,57,70,0.25);
    --ff-cat-nav-bg:            rgba(0,0,0,0.04);
    --ff-cat-nav-border:        rgba(0,0,0,0.10);
    --ff-cat-nav-color:         rgba(0,0,0,0.50);

    /* ── TABLE STATUS CHIPS — Light mode ─────────────────────────── */
    --table-available-color:    #16a34a;
    --table-available-bg:       #DCFCE7;
    --table-available-border:   #BBF7D0;
    --table-reserved-color:     #d97706;
    --table-reserved-bg:        #FEF3C7;
    --table-reserved-border:    #FDE68A;
    --table-occupied-color:     #dc2626;
    --table-occupied-bg:        #FEE2E2;
    --table-occupied-border:    #FECACA;
    --table-ordering-color:     #7c3aed;
    --table-ordering-bg:        #EDE9FE;
    --table-ordering-border:    #DDD6FE;
    --table-dining-color:       #475569;
    --table-dining-bg:          #F1F5F9;
    --table-dining-border:      #E2E8F0;
    --table-billreq-color:      #db2777;
    --table-billreq-bg:         #FCE7F3;
    --table-billreq-border:     #FBCFE8;
    --table-cleaning-color:     #4f46e5;
    --table-cleaning-bg:        #EEF2FF;
    --table-cleaning-border:    #E0E7FF;
    --table-billed-color:       #2563eb;
    --table-billed-bg:          #DBEAFE;
    --table-billed-border:      #BFDBFE;
    --table-default-color:      #64748b;
    --table-default-bg:         #F1F5F9;
    --table-default-border:     #E2E8F0;

    /* ── ORDER TYPE TABS — Light mode ─────────────────────────────── */
    --ordertype-inactive-bg:    #FFFFFF;
    --ordertype-inactive-border:var(--cafe-border-light);
    --ordertype-inactive-color: var(--cafe-text-secondary);
    --ordertype-active-bg:      var(--cafe-accent-bg);
    --ordertype-active-border:  var(--cafe-accent);
    --ordertype-active-color:   var(--cafe-accent);
    --ordertype-active-glow:    rgba(99,102,241,0.18);
    --ordertype-hover-bg:       var(--cafe-bg-hover);
    --ordertype-hover-border:   var(--cafe-accent);

    /* ── MOBILE BOTTOM NAV TABS — Light mode ─────────────────────── */
    --mobile-nav-bg:            #FFFFFF;
    --mobile-nav-border:        var(--cafe-border-light);
    --mobile-nav-inactive-color:var(--cafe-text-tertiary);
    --mobile-nav-active-color:  var(--cafe-accent);
    --mobile-nav-active-bg:     var(--cafe-accent-bg);
    --mobile-nav-backdrop:      rgba(255, 255, 255, 0.85);

    /* ── POS SURFACES — Light mode ───────────────────────────────── */
    --pos-surface:              #FFFFFF;
    --pos-surface-2:            #FAF7F2;
    --pos-border:               rgba(0,0,0,0.07);
    --pos-text:                 #2C2420;
    --pos-text-muted:           rgba(0,0,0,0.50);
    --pos-accent:               var(--cafe-accent);

    /* ── CLASSIC POS COMPONENT TOKENS (Light Mode) ────────────────── */
    --classic-pos-grid-bg:          #F5F1EA;
    --classic-pos-tile-bg:          #FFFFFF;
    --classic-pos-tile-bg-hover:    #F0EBE0;
    --classic-pos-tile-border:      #E0D8D0;
    --classic-pos-tile-border-hover:#D0C8C0;
    --classic-pos-price-color:      #059669;
    --classic-pos-code-color:       #8A7E76;
    --classic-pos-name-color:       #2C2420;
    --classic-pos-panel-bg:         #FFFFFF;
    --classic-pos-panel-border:     #E0D8D0;
    --classic-pos-header-bg:        #F5F1EA;
    --classic-pos-header-border:    #D4C8C0;
    --classic-pos-row-bg:           #FFFFFF;
    --classic-pos-row-bg-hover:     #FAF7F2;
    --classic-pos-row-selected-bg:  #0D9488;
    --classic-pos-row-border:       #E8E0D8;
    --classic-pos-empty-color:      #8A7E76;
    --classic-pos-input-bg:         #FFFFFF;
    --classic-pos-input-border:     #D4C8C0;
    --classic-pos-suggest-bg:       #FFFFFF;
    --classic-pos-suggest-border:   #D4C8C0;
    --classic-pos-suggest-selected: #0D9488;
    --classic-pos-suggest-divider:  #E8E0D8;
    --classic-pos-summary-bg:       #EFF6FF;
    --classic-pos-summary-border:   #BFDBFE;
    --classic-pos-summary-label:    #475569;
    --classic-pos-summary-value:    #1D4ED8;
    --classic-pos-summary-net-bg:   #22C55E;
    --classic-pos-summary-net-glow: rgba(34, 197, 94, 0.25);
    --classic-pos-func-btn-bg:      linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
    --classic-pos-func-btn-bg-hover:linear-gradient(135deg, #B91C1C 0%, #991B1B 100%);
    --classic-pos-func-tab-active:  #991B1B;
    --classic-pos-func-tab-inactive:#F5F1EA;
    --classic-pos-func-grid-bg:     #FFFFFF;
    --classic-pos-keypad-bg:        #FFFFFF;
    --classic-pos-keypad-num-bg:    linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
    --classic-pos-keypad-danger-bg: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
    --classic-pos-keypad-success-bg:linear-gradient(135deg, #059669 0%, #10B981 100%);
    --classic-pos-keypad-action-bg: linear-gradient(135deg, #475569 0%, #64748B 100%);
    --classic-pos-keypad-text:      #ffffff;
    --classic-pos-modal-bg:         #FFFFFF;
    --classic-pos-modal-border:     #E0D8D0;
    --classic-pos-modal-header-bg:  #F5F1EA;
    --classic-pos-modal-header-border:#E0D8D0;
    --classic-pos-card-bg:          #FFFFFF;
    --classic-pos-card-bg-hover:    #FAF7F2;
    --classic-pos-card-border:      #E0D8D0;
    --classic-pos-card-border-hover:#D0C8C0;
    --classic-pos-close-btn-bg:     #DC2626;
    --classic-pos-close-btn-hover:  #EF4444;
    --classic-pos-recall-btn-bg:    linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    --classic-pos-recall-btn-hover: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%);
    --classic-pos-print-btn-bg:     linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
    --classic-pos-print-btn-hover:  linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%);
    --classic-pos-walkin-btn-bg:    linear-gradient(135deg, #0D9488 0%, #14B8A6 100%);
    --classic-pos-walkin-btn-hover: linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%);
    --classic-pos-table-avail-bg:   #FFFFFF;
    --classic-pos-table-active-bg:  #ECFDF5;
    --classic-pos-table-active-border: #10B981;
    --classic-pos-status-active-bg: #10B981;
    --classic-pos-status-active-text:#ffffff;
    --classic-pos-status-inactive-bg:#64748B;
    --classic-pos-status-inactive-text:#ffffff;
    --classic-pos-quickbar-bg:      #FFFFFF;
    --classic-pos-quickbar-border:  #E0D8D0;
    --classic-pos-detail-text:      #5C5048;
    --classic-pos-status-pending:   #D97706;
    --classic-pos-delete-btn-bg:    #DC2626;
    --classic-pos-delete-btn-hover: #EF4444;
    --classic-pos-menu-btn-1:       #0D9488;
    --classic-pos-menu-btn-2:       #C2410C;
    --classic-pos-menu-btn-3:       #059669;
    --classic-pos-menu-btn-4:       #B45309;
    --classic-pos-menu-btn-5:       #334155;
    --classic-pos-menu-btn-6:       #475569;
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
  border: `1px solid ${border ?? `${color  }30`}`,
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
