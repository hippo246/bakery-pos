import { useState } from "react";
import { C, pill, btn, input, label } from "../../styles/theme";
import { MENU_CATS } from "../../data/constants";

function Menu({ menuItems, setMenuItems }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [catFilter, setCatFilter] = useState("ALL");
  const [form, setForm] = useState({ name: "", price: "", cat: "Coffee", desc: "", emoji: "☕", popular: false, station: "Bar", prepTime: "", allergens: "", dietTags: "", costPrice: "" });
  const [formError, setFormError] = useState("");

  const [menuSearch, setMenuSearch] = useState("");

  // --- Safe guards: never crash if menuItems or item fields are absent ---
  const safeItems = Array.isArray(menuItems) ? menuItems : [];
  const mName = (m) => (typeof m?.name === "string" ? m.name : "");
  const mDesc = (m) => (typeof m?.desc === "string" ? m.desc : "");
  const mCat  = (m) => (typeof m?.cat  === "string" ? m.cat  : "");
  const mEmoji= (m) => (typeof m?.emoji === "string" && m.emoji.trim() ? m.emoji.trim() : "🍽");
  const mPrice= (m) => { const n = Number(m?.price); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const mStation  = (m) => (typeof m?.station === "string" && m.station.trim() ? m.station.trim() : "");
  const mPrepTime = (m) => { const n = Number(m?.prepTime); return Number.isFinite(n) && n >= 0 ? String(Math.round(Math.min(180, n))) : ""; };
  const mAllergens= (m) => (Array.isArray(m?.allergens) ? m.allergens : []);
  const mDietTags = (m) => (Array.isArray(m?.dietTags)  ? m.dietTags  : []);
  const mCostPrice= (m) => { const n = Number(m?.costPrice); return Number.isFinite(n) && n >= 0 ? n : null; };

  // Infer sensible defaults from category/name when explicit values are missing
  const inferStation = (cat, name) => {
    const c = (cat  || "").toLowerCase();
    const n = (name || "").toLowerCase();
    if (c === "food" || n.includes("sandwich") || n.includes("toast") || n.includes("wrap") || n.includes("salad")) return "Kitchen";
    if (c === "dessert" || n.includes("cake") || n.includes("cookie") || n.includes("waffle") || n.includes("brownie")) return "Dessert";
    return "Bar";
  };
  const defaultPrepTime = (station) => ({ Bar: 5, Kitchen: 10, Dessert: 8, Packaging: 3 }[station] ?? 5);

  const q = menuSearch.trim().toLowerCase();
  const filtered = safeItems
    .filter(m => catFilter === "ALL" || mCat(m) === catFilter)
    .filter(m => !q ||
      mName(m).toLowerCase().includes(q) ||
      mDesc(m).toLowerCase().includes(q) ||
      mCat(m).toLowerCase().includes(q)
    );

  const cats = Array.isArray(MENU_CATS) ? MENU_CATS : ["ALL"];
  const activeCount      = safeItems.filter(m => m?.active).length;
  const eightySixedCount = safeItems.filter(m => m?.eightySixed).length;
  const popularCount     = safeItems.filter(m => m?.popular).length;

  const now = () => new Date().toISOString();
  const toggleActive  = (id) => setMenuItems(safeItems.map(m => m?.id === id ? { ...m, active: !m.active, updatedAt: now() } : m));
  const togglePopular = (id) => setMenuItems(safeItems.map(m => m?.id === id ? { ...m, popular: !m.popular, updatedAt: now() } : m));
  const toggle86 = (id) => {
    const target = safeItems.find(m => m?.id === id);
    if (!target) return;
    if (target.eightySixed) {
      // Turning off: immediate, no reason needed
      setMenuItems(safeItems.map(m => m?.id === id ? { ...m, eightySixed: false, unavailableReason: "", updatedAt: now() } : m));
    } else {
      // Turning on: show inline reason dialog
      setReason86("");
      setConfirm86Id(id);
    }
  };
  const confirm86Apply = () => {
    if (!confirm86Id) return;
    setMenuItems(safeItems.map(m => m?.id === confirm86Id ? {
      ...m, eightySixed: true, unavailableReason: reason86.trim(), updatedAt: now(),
    } : m));
    setConfirm86Id(null);
    setReason86("");
  };
  const deleteItem = (id) => {
    if (!id) return;
    setConfirmDeleteId(id);
  };
  const confirmDeleteApply = () => {
    if (!confirmDeleteId) return;
    setMenuItems(safeItems.filter(m => m?.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  const [bulkMsg, setBulkMsg] = useState("");
  const applyBulk = (label, updater) => {
    if (!filtered.length) return;
    const ids = new Set(filtered.map(m => m?.id));
    setMenuItems(safeItems.map(m => ids.has(m?.id) ? { ...m, ...updater(m), updatedAt: now() } : m));
    setBulkMsg(`${label} applied to ${filtered.length} item(s).`);
    setTimeout(() => setBulkMsg(""), 3000);
  };
  const bulkActivate   = () => applyBulk("Activate",   () => ({ active: true }));
  const bulkDeactivate = () => applyBulk("Deactivate", () => ({ active: false }));
  const bulkClear86    = () => applyBulk("Clear 86",   () => ({ eightySixed: false, unavailableReason: "" }));

  const exportMenu = () => {
    try {
      const rows = [
        ["Name","Price","Category","Description","Emoji","Station","PrepTime","Allergens","DietTags","CostPrice","Margin","Active","86'd","UnavailableReason","Popular"],
        ...safeItems.map(m => {
          const p = mPrice(m), cp = mCostPrice(m);
          const margin = cp != null ? p - cp : "";
          return [
            mName(m), p, mCat(m), mDesc(m), mEmoji(m),
            mStation(m) || inferStation(mCat(m), mName(m)),
            mPrepTime(m),
            mAllergens(m).join("; "),
            mDietTags(m).join("; "),
            cp ?? "",
            margin,
            m?.active ? "yes" : "no",
            m?.eightySixed ? "yes" : "no",
            (m?.unavailableReason || ""),
            m?.popular ? "yes" : "no",
          ];
        }),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `menu-export-${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent — export is non-critical */ }
  };

  const openEdit = (item) => {
    if (!item?.id) return;
    setEditItem(item.id);
    setFormError("");
    const cat  = mCat(item) || "Coffee";
    const name = mName(item);
    setForm({
      name,
      price:     String(mPrice(item)),
      cat,
      desc:      mDesc(item),
      emoji:     mEmoji(item),
      popular:   !!item.popular,
      station:   mStation(item) || inferStation(cat, name),
      prepTime:  mPrepTime(item),
      allergens: mAllergens(item).join(", "),
      dietTags:  mDietTags(item).join(", "),
      costPrice: mCostPrice(item) != null ? String(mCostPrice(item)) : "",
    });
    setShowModal(true);
  };
  const openNew = () => {
    setEditItem(null);
    setFormError("");
    setForm({ name: "", price: "", cat: "Coffee", desc: "", emoji: "☕", popular: false, station: inferStation("Coffee", ""), prepTime: "", allergens: "", dietTags: "", costPrice: "" });
    setShowModal(true);
  };
  const saveItem = () => {
    setFormError("");
    const name     = (form.name || "").trim();
    const desc     = (form.desc || "").trim();
    const cat      = (form.cat  || "").trim();
    const emoji    = (form.emoji || "").trim() || "🍽";
    const station    = (form.station || "").trim() || inferStation(cat, name);
    const allergens  = (form.allergens  || "").split(",").map(s => s.trim()).filter(Boolean);
    const dietTags   = (form.dietTags   || "").split(",").map(s => s.trim()).filter(Boolean);
    const price      = Number(form.price);
    let prepTimeNum  = Number(form.prepTime);
    if (!Number.isFinite(prepTimeNum) || prepTimeNum < 0) prepTimeNum = defaultPrepTime(station);
    prepTimeNum = Math.min(180, Math.max(0, Math.round(prepTimeNum)));
    const costPriceRaw = Number(form.costPrice);
    const costPrice  = Number.isFinite(costPriceRaw) && costPriceRaw >= 0 ? costPriceRaw : null;

    if (!name)                                 { setFormError("Item name is required."); return; }
    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      setFormError("Price must be a number 0 or greater."); return;
    }
    if (!cat)                                  { setFormError("Category is required."); return; }

    const duplicate = safeItems.some(m =>
      m?.id !== editItem &&
      mName(m).trim().toLowerCase() === name.toLowerCase() &&
      mCat(m).trim().toLowerCase() === cat.toLowerCase()
    );
    if (duplicate) { setFormError(`"${name}" already exists in "${cat}". Use a different name or edit the existing item.`); return; }

    const ts = now();
    if (editItem) {
      const existing = safeItems.find(m => m?.id === editItem);
      setMenuItems(safeItems.map(m => m?.id === editItem ? {
        ...existing,
        name, desc, cat, emoji, price, station, allergens, dietTags,
        prepTime: prepTimeNum,
        costPrice,
        popular:          !!form.popular,
        active:           existing?.active ?? true,
        eightySixed:      existing?.eightySixed ?? false,
        unavailableReason: existing?.eightySixed ? (existing?.unavailableReason || "") : "",
        updatedAt:   ts,
        createdAt:   existing?.createdAt || ts,
      } : m));
    } else {
      setMenuItems([...safeItems, {
        id: "m" + Date.now(),
        name, desc, cat, emoji, price, station, allergens, dietTags,
        prepTime: prepTimeNum,
        costPrice,
        popular:           !!form.popular,
        active:            true,
        eightySixed:       false,
        unavailableReason: "",
        createdAt:    ts,
        updatedAt:    ts,
      }]);
    }
    setShowModal(false);
  };

  const [editingPrice, setEditingPrice] = useState(null);
  const [priceVal, setPriceVal] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

  // Inline 86 reason dialog — no window.prompt
  const [confirm86Id, setConfirm86Id] = useState(null);
  const [reason86, setReason86] = useState("");

  // Inline delete confirm — no window.confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  return (
    <div>
      {/* Header Controls */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.text3, pointerEvents: "none" }}>⌕</span>
              <input style={{ ...input, paddingLeft: 28, width: 180, borderRadius: 8 }} placeholder="Search items…" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
            </div>
            <span style={{ fontSize: 11, color: C.text3, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span>{safeItems.length} items · {activeCount} active</span>
              {eightySixedCount > 0 && <span style={{ color: C.red }}>· {eightySixedCount} 86'd</span>}
              {popularCount > 0 && <span style={{ color: C.amber }}>· {popularCount} ★</span>}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...btn("ghost"), borderRadius: 8, fontSize: 12, letterSpacing: ".02em" }} onClick={exportMenu} title="Export menu to CSV">↓ Export CSV</button>
            <button style={{ ...btn("primary"), borderRadius: 8, fontSize: 12, fontWeight: 600, letterSpacing: ".02em" }} onClick={openNew}>+ Add Item</button>
          </div>
        </div>
        {/* Category filter strip */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>
          {cats.map(cat => {
            const catCount = safeItems.filter(m => (cat === "ALL" || mCat(m) === cat)).length;
            const active = catFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                padding: "5px 11px", borderRadius: 20, border: "none",
                background: active ? C.amber2 : "transparent",
                color: active ? (C.bg ?? "#0a0a0a") : C.text2,
                fontSize: 11, fontWeight: active ? 700 : 400,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                transition: "background .15s, color .15s",
                letterSpacing: ".03em",
              }}>
                {cat}
                <span style={{
                  fontSize: 10, fontFamily: "monospace",
                  background: active ? "rgba(0,0,0,.18)" : C.bg3,
                  color: active ? "inherit" : C.text3,
                  padding: "1px 5px", borderRadius: 10, fontWeight: 600,
                }}>{catCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk actions for filtered set */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: C.text3, marginRight: 2 }}>{filtered.length} shown —</span>
          <button onClick={bulkActivate}   style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.greenBorder}`,  background: "transparent", color: C.green,  cursor: "pointer", letterSpacing: ".02em" }}>Activate all</button>
          <button onClick={bulkDeactivate} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.border2}`,       background: "transparent", color: C.text3,  cursor: "pointer", letterSpacing: ".02em" }}>Deactivate all</button>
          <button onClick={bulkClear86}    style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, border: `1px solid ${C.amberBorder ?? C.amber3}`, background: "transparent", color: C.amber, cursor: "pointer", letterSpacing: ".02em" }}>Clear 86'd</button>
          {bulkMsg && <span style={{ fontSize: 10, color: C.green, marginLeft: 4 }}>✓ {bulkMsg}</span>}
        </div>
      )}

      {/* Empty states */}
      {safeItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 24px", color: C.text3 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🍽</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text2, marginBottom: 6 }}>No menu items yet</div>
          <div style={{ fontSize: 12, marginBottom: 20 }}>Add your first item to get started.</div>
          <button style={{ ...btn("primary"), borderRadius: 8, fontWeight: 600 }} onClick={openNew}>+ Add first item</button>
        </div>
      )}
      {safeItems.length > 0 && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.text3 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 4 }}>No items match</div>
          <div style={{ fontSize: 12 }}>Try a different search or category.</div>
        </div>
      )}

      {/* Menu Grid */}
      {cats.filter(c => c !== "ALL" && (catFilter === "ALL" || catFilter === c)).map(cat => {
        const items = filtered.filter(m => mCat(m) === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: C.text2, letterSpacing: ".12em", textTransform: "uppercase", fontWeight: 700 }}>{cat}</span>
              <span style={{ flex: 1, height: 1, background: C.border, display: "inline-block", verticalAlign: "middle", position: "relative", top: -2 }} />
              <span style={{ fontSize: 10, color: C.text3 }}>{items.filter(m => m?.active).length}/{items.length} active</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(210px,1fr))", gap: 10 }} className="menu-grid">
              {items.map(m => (
                <div key={m.id}
                  onMouseEnter={() => setHoveredCard(m.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: m.eightySixed ? C.redBg : m.active ? C.bg2 : C.bg3,
                    border: `1px solid ${m.eightySixed ? C.redBorder : (hoveredCard === m.id && m.active && !m.eightySixed) ? C.amber3 : m.active ? C.border : C.border2}`,
                    borderRadius: 14,
                    padding: "14px 15px",
                    opacity: m.active && !m.eightySixed ? 1 : 0.5,
                    transition: "opacity .15s, box-shadow .15s, border-color .15s",
                    boxShadow: m.active && !m.eightySixed
                      ? hoveredCard === m.id ? `0 4px 16px rgba(0,0,0,.26)` : `0 1px 4px rgba(0,0,0,.16)`
                      : "none",
                    display: "flex", flexDirection: "column",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontSize: 24, lineHeight: 1 }}>{mEmoji(m)}</div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {m.popular && <span style={{ ...pill(C.amberBg, C.amber), fontSize: 9, fontWeight: 700, letterSpacing: ".05em" }}>★ POPULAR</span>}
                      {m.eightySixed && <span style={{ ...pill(C.redBg, C.red), fontSize: 9, fontWeight: 700, letterSpacing: ".05em" }}>86'D</span>}
                      {!m.active && <span style={{ ...pill(C.bg3, C.text3), fontSize: 9, fontWeight: 700, letterSpacing: ".05em" }}>OFF</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.3 }}>{mName(m)}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 8, lineHeight: 1.45, wordBreak: "break-word", overflowWrap: "anywhere", flex: 1 }}>{mDesc(m)}</div>

                  {/* Unavailable reason */}
                  {m?.eightySixed && m?.unavailableReason && (
                    <div style={{ fontSize: 10, color: C.red, marginBottom: 5, wordBreak: "break-word" }}>⚠ {m.unavailableReason}</div>
                  )}

                  {/* Station + prep time */}
                  <div style={{ fontSize: 10, color: C.text3, marginBottom: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {(() => { const st = mStation(m) || inferStation(mCat(m), mName(m)); return <span style={{ fontWeight: 500 }}>{st}</span>; })()}
                    {mPrepTime(m) ? <span style={{ color: C.text3 }}>{mPrepTime(m)} min</span> : <span style={{ color: C.amber, opacity: 0.6 }}>— min</span>}
                  </div>

                  {/* Allergen + diet chips */}
                  {(mAllergens(m).length > 0 || mDietTags(m).length > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 6 }}>
                      {mAllergens(m).map(a => <span key={a} style={{ ...pill(C.redBg, C.red), fontSize: 9, padding: "1px 6px", borderRadius: 10 }}>{a}</span>)}
                      {mDietTags(m).map(t => <span key={t} style={{ ...pill(C.greenBg, C.green), fontSize: 9, padding: "1px 6px", borderRadius: 10 }}>{t}</span>)}
                    </div>
                  )}

                  {/* Cost / margin */}
                  {(() => {
                    const cp = mCostPrice(m);
                    if (cp == null) return null;
                    const p = mPrice(m), margin = p - cp;
                    const pct = p > 0 ? Math.round((margin / p) * 100) : 0;
                    return <div style={{ fontSize: 10, color: margin >= 0 ? C.green : C.red, marginBottom: 5, fontVariantNumeric: "tabular-nums" }}>Margin ₹{margin} · {pct}%</div>;
                  })()}

                  {/* Health warnings */}
                  {(() => {
                    const w = [];
                    if (!mPrice(m)) w.push("no price");
                    if (!mStation(m)) w.push("no station");
                    if (!mPrepTime(m)) w.push("no prep time");
                    const cp = mCostPrice(m);
                    if (cp != null && mPrice(m) > 0 && cp > mPrice(m)) w.push("cost > price");
                    if (!m?.active) w.push("inactive");
                    if (m?.eightySixed) w.push("86'd");
                    if (!w.length) return null;
                    return <div style={{ fontSize: 9, color: C.amber, marginBottom: 5, letterSpacing: ".02em", wordBreak: "break-word" }}>⚠ {w.join(" · ")}</div>;
                  })()}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
                    {editingPrice === m.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: C.text3 }}>₹</span>
                        <input type="number" autoFocus style={{ ...input, padding: "2px 6px", width: 68, fontSize: 14, fontFamily: "monospace", color: C.amber2, fontWeight: 700, borderRadius: 6 }} value={priceVal} onChange={e => setPriceVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Escape") { setEditingPrice(null); return; }
                            if (e.key === "Enter") {
                              const p = Number(priceVal);
                              if (priceVal.trim() === "" || !Number.isFinite(p) || p < 0) { alert("Price must be 0 or greater"); return; }
                              if (p !== mPrice(m)) setMenuItems(safeItems.map(x => x?.id === m.id ? { ...x, price: p, updatedAt: now() } : x));
                              setEditingPrice(null);
                            }
                          }}
                          onBlur={() => {
                            const p = Number(priceVal);
                            if (priceVal.trim() !== "" && Number.isFinite(p) && p >= 0 && p !== mPrice(m)) {
                              setMenuItems(safeItems.map(x => x?.id === m.id ? { ...x, price: p, updatedAt: now() } : x));
                            }
                            setEditingPrice(null);
                          }} />
                      </div>
                    ) : (
                      <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: C.amber2, cursor: "pointer", borderBottom: `1px dashed ${C.amber3}`, lineHeight: 1.3 }} title="Click to edit price" onClick={() => { setEditingPrice(m.id); setPriceVal(String(mPrice(m))); }}>₹{mPrice(m)}</div>
                    )}
                    <div style={{ display: "flex", gap: 3 }}>
                      {/* star */}
                      <button onClick={() => togglePopular(m.id)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${m.popular ? C.amber3 : C.border2}`, background: m.popular ? C.amberDim : "transparent", color: m.popular ? C.amber : C.text3, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Toggle popular">★</button>
                      {/* edit */}
                      <button onClick={() => openEdit(m)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit item">✎</button>
                      {/* 86 */}
                      <button onClick={() => toggle86(m.id)} style={{ padding: "0 7px", height: 26, borderRadius: 6, border: `1px solid ${m.eightySixed ? C.redBorder : C.border2}`, background: m.eightySixed ? C.redBg : "transparent", color: m.eightySixed ? C.red : C.text3, fontSize: 10, cursor: "pointer", fontWeight: 700, letterSpacing: ".03em" }} title="86 (out of stock)">{m.eightySixed ? "↺" : "86"}</button>
                      {/* active toggle */}
                      <button onClick={() => toggleActive(m.id)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${m.active ? C.redBorder : C.greenBorder}`, background: "transparent", color: m.active ? C.red : C.green, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }} title={m.active ? "Deactivate" : "Activate"}>{m.active ? "×" : "✓"}</button>
                      {/* delete */}
                      <button onClick={() => deleteItem(m.id)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.text3, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete item">🗑</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 20, width: "min(420px,96vw)", maxHeight: "90vh", boxShadow: "0 24px 60px rgba(0,0,0,.5)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            {/* Sticky header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px 14px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".01em" }}>{editItem ? "Edit item" : "New item"}</div>
              <button style={{ background: "transparent", border: "none", color: C.text3, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 6px", borderRadius: 6 }} onClick={() => setShowModal(false)}>×</button>
            </div>
            {/* Scrollable body */}
            <div style={{ overflowY: "auto", padding: "18px 24px", flex: 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Name *</label>
                  <input style={{ ...input, borderRadius: 8 }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
                </div>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Icon</label>
                  <input style={{ ...input, textAlign: "center", fontSize: 20, borderRadius: 8, padding: "6px 4px" }} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="☕" maxLength={2} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Price (₹) *</label>
                  <input style={{ ...input, borderRadius: 8 }} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Category</label>
                  <select style={{ ...input, borderRadius: 8 }} value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                    {cats.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Description</label>
                <input style={{ ...input, borderRadius: 8 }} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Short description…" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Station</label>
                  <select style={{ ...input, borderRadius: 8 }} value={form.station} onChange={e => setForm({ ...form, station: e.target.value })}>
                    {["Bar", "Kitchen", "Dessert", "Packaging"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Prep time (min)</label>
                  <input style={{ ...input, borderRadius: 8 }} type="number" min="0" value={form.prepTime} onChange={e => setForm({ ...form, prepTime: e.target.value })} placeholder="5" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Allergens</label>
                  <input style={{ ...input, borderRadius: 8 }} value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} placeholder="nuts, dairy…" />
                </div>
                <div>
                  <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Diet tags</label>
                  <input style={{ ...input, borderRadius: 8 }} value={form.dietTags} onChange={e => setForm({ ...form, dietTags: e.target.value })} placeholder="vegan, GF…" />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...label, fontSize: 10, letterSpacing: ".06em", textTransform: "uppercase" }}>Cost price (₹) <span style={{ fontWeight: 400, opacity: .55, textTransform: "none", letterSpacing: 0 }}>optional</span></label>
                <input style={{ ...input, borderRadius: 8 }} type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} placeholder="for margin tracking" />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, padding: "10px 12px", borderRadius: 8, background: C.bg3, border: `1px solid ${form.popular ? C.amber3 : C.border}`, cursor: "pointer" }} onClick={() => setForm({ ...form, popular: !form.popular })}>
                <input type="checkbox" id="pop" checked={form.popular} onChange={e => setForm({ ...form, popular: e.target.checked })} style={{ accentColor: C.amber2 }} />
                <label htmlFor="pop" style={{ fontSize: 12, color: form.popular ? C.amber2 : C.text2, cursor: "pointer", fontWeight: form.popular ? 600 : 400 }}>Mark as popular ★</label>
              </div>
            </div>
            {/* Sticky footer */}
            <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {formError && (
                <div style={{ padding: "9px 12px", borderRadius: 8, background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.mutedRed, fontSize: 12, wordBreak: "break-word", lineHeight: 1.4 }}>
                  {formError}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={{ ...btn("ghost"), borderRadius: 8 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={{ ...btn("primary"), borderRadius: 8, fontWeight: 600 }} onClick={saveItem}>{editItem ? "Save changes" : "Add item"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline 86 reason dialog */}
      {confirm86Id && (() => {
        const target = safeItems.find(m => m?.id === confirm86Id);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(2px)" }} onClick={() => setConfirm86Id(null)}>
            <div style={{ background: C.bg2, border: `1px solid ${C.redBorder}`, borderRadius: 16, padding: 24, width: "min(360px,94vw)", boxShadow: "0 20px 50px rgba(0,0,0,.5)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>86 "{mName(target)}"?</div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 14, lineHeight: 1.4 }}>This item will show as unavailable. Add a reason for the kitchen.</div>
              <input
                autoFocus
                style={{ ...input, borderRadius: 8, width: "100%", boxSizing: "border-box", marginBottom: 14 }}
                placeholder="Reason (optional)"
                value={reason86}
                onChange={e => setReason86(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirm86Apply(); if (e.key === "Escape") setConfirm86Id(null); }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={{ ...btn("ghost"), borderRadius: 8 }} onClick={() => setConfirm86Id(null)}>Cancel</button>
                <button style={{ ...btn("primary"), borderRadius: 8, background: C.red, borderColor: C.redBorder, fontWeight: 600 }} onClick={confirm86Apply}>86 this item</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Inline delete confirm */}
      {confirmDeleteId && (() => {
        const target = safeItems.find(m => m?.id === confirmDeleteId);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(2px)" }} onClick={() => setConfirmDeleteId(null)}>
            <div style={{ background: C.bg2, border: `1px solid ${C.redBorder}`, borderRadius: 16, padding: 24, width: "min(340px,94vw)", boxShadow: "0 20px 50px rgba(0,0,0,.5)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Delete "{mName(target)}"?</div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 18, lineHeight: 1.5 }}>
                It will be removed from the menu. Historical orders won't be affected.
                {target?.popular && <span style={{ color: C.amber, display: "block", marginTop: 6 }}>⚠ This item is marked as popular.</span>}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={{ ...btn("ghost"), borderRadius: 8 }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                <button style={{ ...btn("primary"), borderRadius: 8, background: C.red, borderColor: C.redBorder, fontWeight: 600 }} onClick={confirmDeleteApply}>Delete</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Menu;
