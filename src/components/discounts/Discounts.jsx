import { useState, useEffect } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_DISCOUNTS, DISCOUNT_TYPES, DISCOUNT_STATUS, TIER_REQUIREMENTS } from "../../data/discountConstants";

// --- Safety helpers --------------------------------------------------------
// Fall back to sane defaults if the constants file ever exports something
// missing/malformed — this file only owns Discounts.jsx, so it can't fix
// discountConstants.js itself, only survive it.
const SAFE_TYPES = Array.isArray(DISCOUNT_TYPES) && DISCOUNT_TYPES.length ? DISCOUNT_TYPES : ["percentage", "flat"];
const SAFE_STATUSES = Array.isArray(DISCOUNT_STATUS) ? DISCOUNT_STATUS : ["All", "active", "inactive"];
const SAFE_TIERS = Array.isArray(TIER_REQUIREMENTS) && TIER_REQUIREMENTS.length ? TIER_REQUIREMENTS : ["All"];
const SAFE_INIT_DISCOUNTS = Array.isArray(INIT_DISCOUNTS) ? INIT_DISCOUNTS : [];

const genId = () => "disc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const toNum = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// Parses expiryDate defensively — missing/garbage input safely resolves to
// `null` instead of an Invalid Date or a timezone-dependent crash.
const parseExpiry = (v) => {
  if (!v) return null;
  const dt = new Date(v);
  return isNaN(dt.getTime()) ? null : dt;
};
const isExpired = (v) => { const dt = parseExpiry(v); return dt ? dt.getTime() < Date.now() : false; };
const isExpiringSoon = (v) => {
  const dt = parseExpiry(v);
  if (!dt) return false;
  const ms = dt.getTime() - Date.now();
  return ms >= 0 && ms <= 7 * 24 * 60 * 60 * 1000;
};
const formatExpiry = (v) => {
  const dt = parseExpiry(v);
  return dt ? dt.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "No valid expiry";
};

// A discount's *stored* status ("active"/"inactive") is intent, not fact —
// this derives the real, current-in-time status so expired or maxed-out
// discounts are never displayed as usable just because nobody flipped a flag.
const getEffectiveStatus = (d) => {
  if (!d || safeStr(d.status).toLowerCase() === "inactive") return "inactive";
  if (isExpired(d.expiryDate)) return "expired";
  const maxUsage = toNum(d.maxUsage, 0);
  const used = Math.max(0, toNum(d.usageCount ?? d.currentUsage, 0));
  if (maxUsage > 0 && used >= maxUsage) return "limit_reached";
  return "active";
};

const usageInfo = (d) => {
  const used = Math.max(0, toNum(d?.usageCount ?? d?.currentUsage, 0));
  const maxUsage = Math.max(0, toNum(d?.maxUsage, 0));
  const hasLimit = maxUsage > 0;
  return {
    used,
    maxUsage,
    hasLimit,
    remaining: hasLimit ? Math.max(0, maxUsage - used) : null,
    usagePct: hasLimit ? Math.min(100, Math.round((used / maxUsage) * 100)) : null,
  };
};

// "flat" and "fixed" are treated as the same non-percentage type throughout —
// the project has used both historically, and neither is "wrong".
const isPercentageType = (type) => safeStr(type).toLowerCase() === "percentage";

// Normalizes a raw (possibly malformed) discount into everything the UI
// needs to render safely — never NaN/undefined/null, and a single source of
// truth for status/expiry/usage display logic.
const getDiscountView = (d) => {
  const code = safeStr(d?.code).trim().toUpperCase() || "—";
  const percentageType = isPercentageType(d?.type);
  const typeLabel = percentageType ? "Percentage" : "Flat Amount";
  const value = Math.max(0, toNum(d?.value, 0));
  const valueLabel = percentageType ? `-${value}%` : `-₹${value.toLocaleString("en-IN")}`;
  const minOrder = Math.max(0, toNum(d?.minOrder, 0));
  const hasMaxDiscount = d?.maxDiscount !== undefined && d?.maxDiscount !== null && d?.maxDiscount !== "";
  const maxDiscount = hasMaxDiscount ? Math.max(0, toNum(d.maxDiscount, 0)) : null;
  const description = safeStr(d?.description).trim();
  const tierRequired = safeStr(d?.tierRequired).trim() || "All";
  return {
    id: d?.id ?? null,
    code,
    type: safeStr(d?.type).toLowerCase(),
    percentageType,
    typeLabel,
    value,
    valueLabel,
    minOrder,
    maxDiscount,
    description,
    tierRequired,
    usage: usageInfo(d),
    expired: isExpired(d?.expiryDate),
    expiringSoon: !isExpired(d?.expiryDate) && isExpiringSoon(d?.expiryDate),
    expiryLabel: formatExpiry(d?.expiryDate),
    effectiveStatus: getEffectiveStatus(d),
  };
};

// Example-amount calculator for the "Example: ₹1000 order → -₹X" preview —
// always returns a finite, non-negative number regardless of bad input.
const calculateDiscount = (orderAmount, discount) => {
  const amt = Math.max(0, toNum(orderAmount, 0));
  const view = getDiscountView(discount);
  if (amt < view.minOrder) return 0;
  let raw = view.percentageType ? (amt * view.value) / 100 : view.value;
  if (view.maxDiscount !== null) raw = Math.min(raw, view.maxDiscount);
  return Math.max(0, Math.round(raw));
};

export default function Discounts({ discounts: externalDiscounts, setDiscounts: externalSetDiscounts }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  const [discounts, setDiscounts] = useState(Array.isArray(externalDiscounts) ? externalDiscounts : SAFE_INIT_DISCOUNTS);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [form, setForm] = useState({ code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", maxUsage: "", expiryDate: "", description: "", tierRequired: "All" });

  // Use external setter if provided, otherwise use local state
  const handleSetDiscounts = externalSetDiscounts || setDiscounts;

  const filtered = (Array.isArray(discounts) ? discounts : []).filter(discount => {
    if (!discount) return false;
    const view = getDiscountView(discount);
    const typeLower = safeStr(typeFilter).toLowerCase();
    const statusLower = safeStr(statusFilter).toLowerCase();
    const matchesType = typeFilter === "All" || view.type === typeLower;
    // Match either the effective (computed) status or the raw stored status
    // so existing status-filter buttons keep working regardless of exactly
    // which status strings discountConstants.js defines.
    const matchesStatus = statusFilter === "All" || view.effectiveStatus === statusLower || safeStr(discount.status).toLowerCase() === statusLower;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || [view.code, view.description, view.type, view.effectiveStatus, view.tierRequired].some(f => safeStr(f).toLowerCase().includes(q));
    return matchesType && matchesStatus && matchesSearch;
  });

  const activeCount = (Array.isArray(discounts) ? discounts : []).filter(d => d && getEffectiveStatus(d) === "active").length;
  const totalUsage = (Array.isArray(discounts) ? discounts : []).reduce((sum, d) => sum + Math.max(0, toNum(d?.usageCount ?? d?.currentUsage, 0)), 0);

  const openAdd = () => {
    setEditDiscount(null);
    setForm({ code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", maxUsage: "", expiryDate: "", description: "", tierRequired: "All" });
    setShowModal(true);
  };

  const openEdit = (discount) => {
    if (!discount) return;
    setEditDiscount(discount.id ?? null);
    setForm({
      code: safeStr(discount.code),
      type: safeStr(discount.type) || "percentage",
      value: discount.value !== undefined && discount.value !== null && discount.value !== "" ? String(discount.value) : "",
      minOrder: discount.minOrder !== undefined && discount.minOrder !== null && discount.minOrder !== "" ? String(discount.minOrder) : "",
      maxDiscount: discount.maxDiscount !== undefined && discount.maxDiscount !== null && discount.maxDiscount !== "" ? String(discount.maxDiscount) : "",
      maxUsage: discount.maxUsage !== undefined && discount.maxUsage !== null && discount.maxUsage !== "" ? String(discount.maxUsage) : "",
      expiryDate: parseExpiry(discount.expiryDate) ? discount.expiryDate : "",
      description: safeStr(discount.description),
      tierRequired: safeStr(discount.tierRequired) || "All",
    });
    setShowModal(true);
  };

  const saveDiscount = () => {
    const code = safeStr(form.code).trim().toUpperCase();
    if (!code) return alert("Code is required");
    if (!/^[A-Z0-9_-]+$/.test(code)) return alert("Code can only contain letters, numbers, - and _");
    const isDuplicate = (Array.isArray(discounts) ? discounts : []).some(
      d => d && safeStr(d.code).trim().toUpperCase() === code && d.id !== editDiscount
    );
    if (isDuplicate) return alert(`Code "${code}" is already used by another discount`);

    const type = safeStr(form.type).toLowerCase() || "percentage";
    if (!SAFE_TYPES.some(t => safeStr(t).toLowerCase() === type)) return alert("Please choose a valid discount type");

    if (form.value === "" || form.value === null || form.value === undefined) return alert("Value is required");
    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) return alert("Value must be a number greater than 0");
    if (type === "percentage" && value > 100) return alert("Percentage value cannot exceed 100");

    // minOrder is optional — empty means 0 (no minimum), not an error.
    const minOrder = form.minOrder === "" || form.minOrder === null || form.minOrder === undefined ? 0 : Number(form.minOrder);
    if (!Number.isFinite(minOrder) || minOrder < 0) return alert("Minimum order must be a number 0 or greater");

    let maxDiscount = "";
    if (form.maxDiscount !== "" && form.maxDiscount !== null && form.maxDiscount !== undefined) {
      const md = Number(form.maxDiscount);
      if (!Number.isFinite(md) || md < 0) return alert("Max discount must be a number 0 or greater");
      maxDiscount = md;
    }

    let maxUsage = "";
    if (form.maxUsage !== "" && form.maxUsage !== null && form.maxUsage !== undefined) {
      const mu = Number(form.maxUsage);
      if (!Number.isFinite(mu) || mu < 0) return alert("Max usage must be a number 0 or greater");
      maxUsage = mu;
    }

    if (form.expiryDate && !parseExpiry(form.expiryDate)) return alert("Expiry date is invalid");

    const description = safeStr(form.description).trim();
    const tierRequired = form.tierRequired || "All";
    const now = new Date().toISOString();

    const discountData = {
      code,
      type,
      value,
      minOrder,
      maxDiscount,
      maxUsage,
      expiryDate: form.expiryDate || "",
      description,
      tierRequired,
      updatedAt: now,
    };

    if (editDiscount) {
      // Preserve id, status, and usageCount — editing details shouldn't
      // silently reset a coupon's history or availability.
      handleSetDiscounts(discounts.map(d => d.id === editDiscount ? { ...d, ...discountData } : d));
    } else {
      handleSetDiscounts([
        ...(Array.isArray(discounts) ? discounts : []),
        { ...discountData, id: genId(), status: "active", usageCount: 0, createdAt: now },
      ]);
    }
    setShowModal(false);
  };

  const updateStatus = (id, status) => {
    handleSetDiscounts(discounts.map(d => d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d));
  };

  const duplicateDiscount = (discount) => {
    if (!discount) return;
    const baseCode = safeStr(discount.code).trim().toUpperCase() || "DISCOUNT";
    const existingCodes = new Set((Array.isArray(discounts) ? discounts : []).map(d => safeStr(d?.code).trim().toUpperCase()));
    let newCode = `${baseCode}-COPY`;
    let n = 2;
    while (existingCodes.has(newCode)) { newCode = `${baseCode}-COPY${n}`; n++; }
    const now = new Date().toISOString();
    handleSetDiscounts([
      ...(Array.isArray(discounts) ? discounts : []),
      { ...discount, id: genId(), code: newCode, status: "active", usageCount: 0, createdAt: now, updatedAt: now },
    ]);
  };

  const resetUsage = (id) => {
    const target = (Array.isArray(discounts) ? discounts : []).find(d => d && d.id === id);
    if (!target) return;
    const code = safeStr(target.code).trim().toUpperCase() || "this discount";
    if (!window.confirm(`Reset usage count for "${code}" back to 0?`)) return;
    handleSetDiscounts(discounts.map(d => d.id === id ? { ...d, usageCount: 0, updatedAt: new Date().toISOString() } : d));
  };

  const deleteDiscount = (id) => {
    if (!id) return;
    const target = (Array.isArray(discounts) ? discounts : []).find(d => d && d.id === id);
    const code = target ? (safeStr(target.code).trim().toUpperCase() || "this discount") : "this discount";
    if (!window.confirm(`Delete discount "${code}"? Past orders that used this code keep their history, but the code will no longer be usable.`)) return;
    handleSetDiscounts((Array.isArray(discounts) ? discounts : []).filter(d => d && d.id !== id));
  };

  // Export visible (filtered) discounts as a clean CSV — safe against missing
  // fields, commas in descriptions, and undefined/null values.
  const exportDiscounts = () => {
    const rows = filtered.map(d => {
      if (!d) return null;
      const v = getDiscountView(d);
      const u = v.usage;
      const esc = (s) => `"${safeStr(s).replace(/"/g, '""')}"`;
      return [
        esc(v.code),
        esc(v.type),
        v.value,
        v.minOrder,
        v.maxDiscount === null ? "" : v.maxDiscount,
        esc(v.effectiveStatus),
        u.used,
        u.hasLimit ? u.maxUsage : "",
        u.hasLimit ? u.remaining : "",
        esc(v.expiryLabel === "No valid expiry" ? "" : v.expiryLabel),
        esc(v.tierRequired),
        esc(v.description),
      ].join(",");
    }).filter(Boolean);

    const header = ["code","type","value","minOrder","maxDiscount","status","usageCount","maxUsage","remainingUsage","expiryDate","tierRequired","description"].join(",");
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `discounts-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Total", sub: "discounts", val: discounts.length, color: C.amber2, icon: "🏷" },
          { label: "Active", sub: "right now", val: activeCount, color: C.green, icon: "✓" },
          { label: "Uses", sub: "all time", val: totalUsage, color: C.blue, icon: "↗" },
          { label: "Expired", sub: "need cleanup", val: discounts.filter(d => d && isExpired(d.expiryDate)).length, color: C.red, icon: "✕" },
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "16px 18px", borderLeft: `3px solid ${m.color}`, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "monospace", color: m.color, lineHeight: 1 }}>{m.val}</div>
              <span style={{ fontSize: 16, opacity: 0.35 }}>{m.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginTop: 1 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: C.text3, pointerEvents: "none" }}>⌕</span>
            <input style={{ ...input, paddingLeft: 30, width: 200 }} placeholder="Search codes, descriptions…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Pill tab groups */}
          <div style={{ display: "flex", background: C.bg3, borderRadius: 8, padding: 3, gap: 2 }}>
            {["All", ...SAFE_TYPES].map(type => {
              const active = typeFilter === type;
              const label = type === "All" ? "All types" : isPercentageType(type) ? "%" : "₹ Flat";
              return (
                <button key={type} onClick={() => setTypeFilter(type)} style={{ padding: "6px 11px", borderRadius: 6, border: "none", background: active ? C.bg2 : "transparent", color: active ? C.amber2 : C.text3, fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", boxShadow: active ? `0 1px 3px rgba(0,0,0,.18)` : "none", transition: "all .15s" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", background: C.bg3, borderRadius: 8, padding: 3, gap: 2 }}>
            {["All", ...SAFE_STATUSES.slice(1)].map(status => {
              const active = statusFilter === status;
              const label = status === "All" ? "All status" : status.charAt(0).toUpperCase() + status.slice(1);
              return (
                <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: "6px 11px", borderRadius: 6, border: "none", background: active ? C.bg2 : "transparent", color: active ? C.amber2 : C.text3, fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer", boxShadow: active ? `0 1px 3px rgba(0,0,0,.18)` : "none", transition: "all .15s" }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btn("ghost")} onClick={exportDiscounts} title="Export visible discounts as CSV">↓ Export</button>
          <button style={btn("primary")} onClick={openAdd}>+ New Discount</button>
        </div>
      </div>

      {/* Result count */}
      {filtered.length > 0 && (
        <div style={{ fontSize: 11, color: C.text3, marginBottom: 8 }}>
          Showing {filtered.length} of {discounts.length} discount{discounts.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Discount List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(discount => {
          if (!discount) return null;
          const view = getDiscountView(discount);
          const unavailable = view.effectiveStatus !== "active";
          const statusMeta = {
            active: { label: "active", color: C.green, bg: C.greenBg },
            inactive: { label: "inactive", color: C.text3, bg: C.bg3 },
            expired: { label: "EXPIRED", color: C.red, bg: C.redBg },
            limit_reached: { label: "LIMIT REACHED", color: C.red, bg: C.redBg },
          }[view.effectiveStatus] || { label: view.effectiveStatus, color: C.text3, bg: C.bg3 };
          const exampleDiscount = calculateDiscount(1000, discount);
          // "rawStatus" is the staff-set intent (active/inactive), independent
          // of expiry/usage-limit facts, so Enable/Disable always reflects
          // what toggling the flag will actually do.
          const rawStatus = safeStr(discount?.status).toLowerCase() === "inactive" ? "inactive" : "active";

          const warnings = [];
          if (view.effectiveStatus === "expired") warnings.push("expired");
          if (view.effectiveStatus === "limit_reached") warnings.push("usage limit reached");
          if (!view.usage.hasLimit) warnings.push("no max usage set");
          if (view.minOrder === 0) warnings.push("no minimum order");
          if (view.tierRequired !== "All") warnings.push(`${view.tierRequired}+ tier only`);
          if (view.percentageType && view.value > 100) warnings.push("invalid: over 100%");

          return (
            <div key={discount.id ?? view.code} style={{ ...card(), padding: "16px 18px", border: `1px solid ${unavailable ? C.redBorder : C.border}`, background: unavailable ? C.redBg : C.bg2 }}>
              {/* Header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "monospace", letterSpacing: ".04em", color: C.amber2, background: C.amberDim, padding: "3px 9px", borderRadius: 6, overflowWrap: "anywhere" }}>{view.code}</span>
                    <span style={{ ...pill(view.percentageType ? C.blueBg : C.amberBg, view.percentageType ? C.blue : C.amber), fontSize: 11, fontWeight: 700, padding: "3px 8px" }} title={view.typeLabel}>
                      {view.valueLabel}
                    </span>
                    <span style={{ ...pill(statusMeta.bg, statusMeta.color), fontSize: 10, fontWeight: 600, padding: "3px 8px", textTransform: "uppercase", letterSpacing: ".04em" }}>
                      {statusMeta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text3, wordBreak: "break-word", fontStyle: view.description ? "normal" : "italic" }}>{view.description || "No description"}</div>
                </div>
                <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                  <button onClick={() => openEdit(discount)} title="Edit" style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", lineHeight: 1 }}>✎</button>
                  <button onClick={() => duplicateDiscount(discount)} title="Duplicate" style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", lineHeight: 1 }}>⧉</button>
                  <button onClick={() => resetUsage(discount.id)} title="Reset usage" style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", lineHeight: 1 }}>↺</button>
                  <button onClick={() => deleteDiscount(discount.id)} title="Delete" style={{ padding: "5px 9px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.mutedRed, fontSize: 12, cursor: "pointer", lineHeight: 1 }}>✕</button>
                </div>
              </div>

              {/* Stat row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 10, marginBottom: 12, padding: "10px 12px", background: C.bg3, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>Min Order</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>₹{view.minOrder.toLocaleString("en-IN")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>Max Discount</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>{view.maxDiscount === null ? <span style={{ color: C.text3, fontStyle: "italic", fontWeight: 400 }}>No cap</span> : `₹${view.maxDiscount.toLocaleString("en-IN")}`}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>
                    Usage {view.usage.hasLimit && <span style={{ color: C.text3 }}>· {view.usage.remaining} left</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.amber2, marginBottom: view.usage.hasLimit ? 5 : 0 }}>
                    {view.usage.used} <span style={{ color: C.text3, fontWeight: 400 }}>/ {view.usage.hasLimit ? view.usage.maxUsage : "∞"}</span>
                  </div>
                  {view.usage.hasLimit && (
                    <div style={{ height: 3, background: C.border2, borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${view.usage.usagePct}%`, background: view.usage.usagePct >= 90 ? C.red : view.usage.usagePct >= 60 ? C.amber2 : C.green, borderRadius: 99, transition: "width .3s" }} />
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>Expiry</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: view.expired ? C.red : view.expiringSoon ? C.amber2 : C.text2 }}>
                    {view.expiryLabel}{view.expiringSoon && <span style={{ fontSize: 10, marginLeft: 4, fontWeight: 400 }}>↑ soon</span>}
                  </div>
                </div>
              </div>

              {/* Footer row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.text3, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {view.tierRequired !== "All" && <span style={{ ...pill(C.purpleBg, C.purple), fontSize: 10 }}>{view.tierRequired}+ tier</span>}
                  <span>₹1,000 order → saves ₹{exampleDiscount}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {rawStatus === "active" && (
                    <button onClick={() => updateStatus(discount.id, "inactive")} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>
                      Disable
                    </button>
                  )}
                  {rawStatus === "inactive" && (
                    <button onClick={() => updateStatus(discount.id, "active")} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.greenBorder}`, background: "transparent", color: C.green, fontSize: 11, cursor: "pointer" }}>
                      Enable
                    </button>
                  )}
                </div>
              </div>

              {warnings.length > 0 && (
                <div style={{ marginTop: 10, padding: "6px 10px", background: `${C.amber2}12`, borderRadius: 6, fontSize: 10, color: C.amber2, wordBreak: "break-word", borderLeft: `2px solid ${C.amber2}` }}>
                  ⚠ {warnings.join(" · ")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "52px 24px", color: C.text3 }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🏷</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text2, marginBottom: 6 }}>
            {search || typeFilter !== "All" || statusFilter !== "All" ? "No matching discounts" : "No discounts yet"}
          </div>
          <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>
            {search || typeFilter !== "All" || statusFilter !== "All"
              ? "Try adjusting your filters or search query."
              : "Create your first discount code to give customers a reason to buy."}
          </div>
          {!search && typeFilter === "All" && statusFilter === "All" && (
            <button style={btn("primary")} onClick={openAdd}>+ Create a Discount</button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 16, width: "min(440px,95vw)", maxHeight: "90dvh", overflowY: "auto", boxShadow: "0 24px 48px rgba(0,0,0,.4)" }} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: `1px solid ${C.border2}` }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text1 }}>{editDiscount ? "Edit Discount" : "New Discount"}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{editDiscount ? "Changes apply immediately" : "Code will be active as soon as you save"}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", color: C.text3, fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Code */}
              <div>
                <label style={label}>Code <span style={{ color: C.red }}>*</span></label>
                <input style={input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
              </div>

              {/* Type + Value */}
              <div>
                <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, fontWeight: 600 }}>Discount</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={label}>Type</label>
                    <select style={{ ...input }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {SAFE_TYPES.map(type => <option key={type} value={type}>{isPercentageType(type) ? "Percentage (%)" : "Flat Amount (₹)"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={label}>Value <span style={{ color: C.red }}>*</span></label>
                    <input style={input} type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={isPercentageType(form.type) ? "10" : "50"} />
                  </div>
                </div>
              </div>

              {/* Order limits */}
              <div>
                <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, fontWeight: 600 }}>Order Limits</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={label}>Min Order (₹)</label>
                    <input style={input} type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} placeholder="No minimum" />
                  </div>
                  <div>
                    <label style={label}>Max Discount (₹)</label>
                    <input style={input} type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="No cap" />
                  </div>
                </div>
              </div>

              {/* Usage & expiry */}
              <div>
                <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8, fontWeight: 600 }}>Availability</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={label}>Max Uses</label>
                    <input style={input} type="number" value={form.maxUsage} onChange={e => setForm({ ...form, maxUsage: e.target.value })} placeholder="Unlimited" />
                  </div>
                  <div>
                    <label style={label}>Expiry Date</label>
                    <input style={input} type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={label}>Tier Required</label>
                  <select style={{ ...input }} value={form.tierRequired} onChange={e => setForm({ ...form, tierRequired: e.target.value })}>
                    {SAFE_TIERS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={label}>Description</label>
                <input style={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's this discount for?" />
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", padding: "16px 24px", borderTop: `1px solid ${C.border2}` }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveDiscount}>{editDiscount ? "Save Changes" : "Create Discount"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
