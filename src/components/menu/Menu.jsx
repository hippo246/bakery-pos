import React from 'react';
import { useState, useRef, useEffect, useMemo } from "react";
import { C, pill, btn, input, label, emptyState } from "../../styles/theme";
import { MENU_CATS } from "../../data/constants";

function Menu({ menuItems, setMenuItems }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [catFilter, setCatFilter] = useState("ALL");
  const [form, setForm] = useState({ name: "", price: "", cat: "Coffee", desc: "", emoji: "☕", popular: false, station: "Bar", prepTime: "", allergens: "", dietTags: "", costPrice: "" });
  const [formError, setFormError] = useState("");

  const [menuSearch, setMenuSearch] = useState("");
  const [sortBy, setSortBy] = useState("manual"); // manual | name | price-asc | price-desc | margin-asc | margin-desc | prep
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [allergenExclude, setAllergenExclude] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive | 86ed | popular
  const [lastDeleted, setLastDeleted] = useState(null); // { snapshot, msg } for undo — full prior array so it works for single or bulk delete
  const [undoMsg, setUndoMsg] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [importMsgType, setImportMsgType] = useState("success"); // success | error
  const [showImportMenu, setShowImportMenu] = useState(false);
  const fileInputRef = useRef(null);
  const [dragId, setDragId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const searchInputRef = useRef(null);

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

  const mMargin = (m) => { const cp = mCostPrice(m); return cp != null ? mPrice(m) - cp : null; };
  const mMarginPct = (m) => { const p = mPrice(m), mg = mMargin(m); return mg != null && p > 0 ? mg / p : null; };
  const LOW_MARGIN_THRESHOLD = 0.2; // 20%

  // Memoized so hovering a card, dragging, or editing an inline price doesn't
  // re-filter/re-sort the entire menu on every render — only real filter/data changes do.
  const { filtered, sortedFiltered } = useMemo(() => {
    const q = menuSearch.trim().toLowerCase();
    const pMin = priceMin.trim() !== "" && Number.isFinite(Number(priceMin)) ? Number(priceMin) : null;
    const pMax = priceMax.trim() !== "" && Number.isFinite(Number(priceMax)) ? Number(priceMax) : null;
    const allergenExcludeList = allergenExclude.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

    const f = safeItems
      .filter(m => catFilter === "ALL" || mCat(m) === catFilter)
      .filter(m => !q ||
        mName(m).toLowerCase().includes(q) ||
        mDesc(m).toLowerCase().includes(q) ||
        mCat(m).toLowerCase().includes(q)
      )
      .filter(m => pMin == null || mPrice(m) >= pMin)
      .filter(m => pMax == null || mPrice(m) <= pMax)
      .filter(m => allergenExcludeList.length === 0 ||
        !mAllergens(m).some(a => allergenExcludeList.includes(a.toLowerCase()))
      )
      .filter(m => {
        switch (statusFilter) {
          case "active":   return !!m?.active && !m?.eightySixed;
          case "inactive": return !m?.active;
          case "86ed":     return !!m?.eightySixed;
          case "popular":  return !!m?.popular;
          default:         return true;
        }
      });

    const sf = [...f].sort((a, b) => {
      switch (sortBy) {
        case "name":        return mName(a).localeCompare(mName(b));
        case "price-asc":   return mPrice(a) - mPrice(b);
        case "price-desc":  return mPrice(b) - mPrice(a);
        case "prep":        return (Number(mPrepTime(a)) || 0) - (Number(mPrepTime(b)) || 0);
        case "margin-asc":  return (mMarginPct(a) ?? 999) - (mMarginPct(b) ?? 999);
        case "margin-desc": return (mMarginPct(b) ?? -999) - (mMarginPct(a) ?? -999);
        default:            return 0; // manual — preserve stored order
      }
    });

    return { filtered: f, sortedFiltered: sf };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeItems, catFilter, menuSearch, priceMin, priceMax, allergenExclude, statusFilter, sortBy]);

  const cats = Array.isArray(MENU_CATS) ? MENU_CATS : ["ALL"];

  // --- Header stats + margin/performance analytics (memoized: only depends on the items) ---
  const { activeCount, eightySixedCount, popularCount, itemsWithCost, avgMarginPct, lowMarginItems, noSalesDataCount, sellableRevenue } = useMemo(() => {
    const withCost = safeItems.filter(m => mCostPrice(m) != null);
    const avgMargin = withCost.length
      ? withCost.reduce((sum, m) => sum + (mMarginPct(m) || 0), 0) / withCost.length
      : null;
    return {
      activeCount: safeItems.filter(m => m?.active).length,
      eightySixedCount: safeItems.filter(m => m?.eightySixed).length,
      popularCount: safeItems.filter(m => m?.popular).length,
      itemsWithCost: withCost,
      avgMarginPct: avgMargin,
      lowMarginItems: withCost.filter(m => (mMarginPct(m) ?? 1) < LOW_MARGIN_THRESHOLD),
      noSalesDataCount: safeItems.length - withCost.length,
      sellableRevenue: safeItems.filter(m => m?.active && !m?.eightySixed).reduce((sum, m) => sum + mPrice(m), 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeItems]);

  const now = () => new Date().toISOString();
  const withHistory = (item, note) => {
    const history = Array.isArray(item?.history) ? item.history : [];
    return [...history, { ts: now(), note }].slice(-10);
  };
  const toggleActive  = (id) => setMenuItems(safeItems.map(m => m?.id === id ? { ...m, active: !m.active, updatedAt: now() } : m));
  const togglePopular = (id) => setMenuItems(safeItems.map(m => m?.id === id ? { ...m, popular: !m.popular, updatedAt: now() } : m));
  const toggle86 = (id) => {
    const target = safeItems.find(m => m?.id === id);
    if (!target) return;
    if (target.eightySixed) {
      // Turning off: immediate, no reason needed
      setMenuItems(safeItems.map(m => m?.id === id ? { ...m, eightySixed: false, unavailableReason: "", updatedAt: now(), history: withHistory(m, "Marked available again") } : m));
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
      history: withHistory(m, `86'd${reason86.trim() ? `: ${reason86.trim()}` : ""}`),
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
    const item = safeItems.find(m => m?.id === confirmDeleteId);
    const snapshot = safeItems;
    setMenuItems(safeItems.filter(m => m?.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    setSelectedIds(prev => { if (!prev.has(confirmDeleteId)) return prev; const next = new Set(prev); next.delete(confirmDeleteId); return next; });
    if (item) {
      setLastDeleted({ snapshot, msg: `Deleted "${mName(item)}".` });
      setUndoMsg(`Deleted "${mName(item)}".`);
      setTimeout(() => { setLastDeleted(null); setUndoMsg(""); }, 6000);
    }
  };
  const undoDelete = () => {
    if (!lastDeleted) return;
    setMenuItems(lastDeleted.snapshot);
    setLastDeleted(null);
    setUndoMsg("");
  };

  const duplicateItem = (id) => {
    const src = safeItems.find(m => m?.id === id);
    if (!src) return;
    const ts = now();
    let newName = `${mName(src)} (Copy)`;
    let n = 2;
    while (safeItems.some(m => mName(m).toLowerCase() === newName.toLowerCase() && mCat(m) === mCat(src))) {
      newName = `${mName(src)} (Copy ${n})`; n++;
    }
    setMenuItems([...safeItems, {
      ...src,
      id: "m" + Date.now() + Math.random().toString(36).slice(2, 6),
      name: newName,
      popular: false,
      active: true,
      eightySixed: false,
      unavailableReason: "",
      createdAt: ts,
      updatedAt: ts,
      history: [{ ts, note: `Duplicated from "${mName(src)}"` }],
    }]);
  };

  // --- Selection (for targeted bulk actions) ---
  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const selectAllShown  = () => setSelectedIds(new Set(filtered.map(m => m?.id).filter(Boolean)));
  const clearSelection  = () => setSelectedIds(new Set());
  const allShownSelected = filtered.length > 0 && filtered.every(m => selectedIds.has(m?.id));

  const [bulkMsg, setBulkMsg] = useState("");
  // When items are selected, bulk actions target only the selection; otherwise they
  // fall back to whatever is currently filtered/shown (previous behavior).
  const applyBulk = (label, updater) => {
    const targets = selectedIds.size > 0 ? safeItems.filter(m => selectedIds.has(m?.id)) : filtered;
    if (!targets.length) return;
    const ids = new Set(targets.map(m => m?.id));
    setMenuItems(safeItems.map(m => ids.has(m?.id) ? { ...m, ...updater(m), updatedAt: now(), history: withHistory(m, label) } : m));
    setBulkMsg(`${label} applied to ${targets.length} item(s).`);
    setTimeout(() => setBulkMsg(""), 3000);
  };
  const bulkActivate   = () => applyBulk("Activate",   () => ({ active: true }));
  const bulkDeactivate = () => applyBulk("Deactivate", () => ({ active: false }));
  const bulkClear86    = () => applyBulk("Clear 86",   () => ({ eightySixed: false, unavailableReason: "" }));
  const bulkPriceAdjust = (pct) => applyBulk(
    `${pct > 0 ? "+" : ""}${pct}% price`,
    (m) => ({ price: Math.max(0, Math.round(mPrice(m) * (1 + pct / 100) * 100) / 100) })
  );
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const bulkDeleteSelected = () => {
    if (!selectedIds.size) return;
    setConfirmBulkDelete(true);
  };
  const confirmBulkDeleteApply = () => {
    const count = selectedIds.size;
    if (!count) { setConfirmBulkDelete(false); return; }
    const snapshot = safeItems;
    setMenuItems(safeItems.filter(m => !selectedIds.has(m?.id)));
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
    const msg = `Deleted ${count} item(s).`;
    setLastDeleted({ snapshot, msg });
    setUndoMsg(msg);
    setTimeout(() => { setLastDeleted(null); setUndoMsg(""); }, 6000);
  };
  const bulkDuplicateSelected = () => {
    if (!selectedIds.size) return;
    const ts = now();
    const toAdd = [];
    let working = [...safeItems];
    for (const src of safeItems.filter(m => selectedIds.has(m?.id))) {
      let newName = `${mName(src)} (Copy)`;
      let n = 2;
      while (working.some(m => mName(m).toLowerCase() === newName.toLowerCase() && mCat(m) === mCat(src)) ||
             toAdd.some(m => m.name.toLowerCase() === newName.toLowerCase() && m.cat === mCat(src))) {
        newName = `${mName(src)} (Copy ${n})`; n++;
      }
      toAdd.push({
        ...src,
        id: "m" + Date.now() + Math.random().toString(36).slice(2, 6),
        name: newName,
        popular: false, active: true, eightySixed: false, unavailableReason: "",
        createdAt: ts, updatedAt: ts,
        history: [{ ts, note: `Duplicated from "${mName(src)}"` }],
      });
    }
    setMenuItems([...safeItems, ...toAdd]);
    setSelectedIds(new Set());
    setBulkMsg(`Duplicated ${toAdd.length} item(s).`);
    setTimeout(() => setBulkMsg(""), 3000);
  };

  // --- Reorder (drag & drop, manual sort only) ---
  const reorderItem = (draggedId, targetId) => {
    if (!draggedId || !targetId || draggedId === targetId) return;
    const list = [...safeItems];
    const from = list.findIndex(m => m?.id === draggedId);
    const to = list.findIndex(m => m?.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setMenuItems(list);
  };

  const downloadTemplate = () => {
    try {
      const headers = ["Name", "Price", "Category", "Description", "Emoji", "Station", "PrepTime", "Allergens", "DietTags", "CostPrice"];
      const exampleRows = [
        ["Caramel Latte", "160", "Coffee", "Espresso, steamed milk, caramel drizzle", "☕", "Bar", "6", "dairy", "", "70"],
        ["Veggie Sandwich", "180", "Food", "Grilled veggies, pesto, sourdough", "🥪", "Kitchen", "12", "gluten", "vegetarian", "90"],
      ];
      const rows = [headers, ...exampleRows];
      const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "menu-import-template.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent — template download is non-critical */ }
  };

  // --- CSV Import (also accepts .xlsx via SheetJS if available in the project) ---
  const parseCsvLine = (line) => {
    const out = []; let cur = ""; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else cur += ch;
      } else {
        if (ch === '"') inQuotes = true;
        else if (ch === ",") { out.push(cur); cur = ""; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  };
  // Splits raw CSV text into rows without breaking on newlines embedded inside quoted fields
  // (a plain text.split(/\r?\n/) would cut a multi-line quoted description in half).
  const splitCsvRows = (text) => {
    const rows = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') { cur += '""'; i++; continue; }
        inQuotes = !inQuotes;
        cur += ch;
        continue;
      }
      if ((ch === "\n" || ch === "\r") && !inQuotes) {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        rows.push(cur);
        cur = "";
        continue;
      }
      cur += ch;
    }
    if (cur.trim() !== "") rows.push(cur);
    return rows;
  };
  const processImportLines = (lines) => {
    lines = lines.filter(l => l.trim() !== "");
    if (lines.length < 2) { setImportMsgType("error"); setImportMsg("File has no data rows."); return; }
    const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());
    const idx = (key) => header.indexOf(key);
    const iName = idx("name"), iPrice = idx("price"), iCat = idx("category"), iDesc = idx("description"),
          iEmoji = idx("emoji"), iStation = idx("station"), iPrep = idx("preptime"),
          iAllerg = idx("allergens"), iDiet = idx("diettags"), iCost = idx("costprice");
    if (iName === -1 || iPrice === -1) { setImportMsgType("error"); setImportMsg("File must include Name and Price columns."); return; }

    const ts = now();
    let added = 0, updated = 0, skipped = 0;
    let working = [...safeItems];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const name = (cols[iName] || "").trim();
      if (!name) { skipped++; continue; }
      const price = Number(cols[iPrice]);
      if (!Number.isFinite(price) || price < 0) { skipped++; continue; }
      const cat = iCat !== -1 ? (cols[iCat] || "").trim() || "Coffee" : "Coffee";
      const desc = iDesc !== -1 ? (cols[iDesc] || "").trim() : "";
      const emoji = iEmoji !== -1 && (cols[iEmoji] || "").trim() ? cols[iEmoji].trim() : "🍽";
      const station = iStation !== -1 && (cols[iStation] || "").trim() ? cols[iStation].trim() : inferStation(cat, name);
      const prepTime = iPrep !== -1 && Number.isFinite(Number(cols[iPrep])) ? Math.min(180, Math.max(0, Math.round(Number(cols[iPrep])))) : defaultPrepTime(station);
      const allergens = iAllerg !== -1 ? (cols[iAllerg] || "").split(";").map(s => s.trim()).filter(Boolean) : [];
      const dietTags  = iDiet !== -1 ? (cols[iDiet] || "").split(";").map(s => s.trim()).filter(Boolean) : [];
      const costRaw = iCost !== -1 ? Number(cols[iCost]) : NaN;
      const costPrice = Number.isFinite(costRaw) && costRaw >= 0 ? costRaw : null;

      const existingIdx = working.findIndex(m =>
        mName(m).toLowerCase() === name.toLowerCase() && mCat(m).toLowerCase() === cat.toLowerCase()
      );
      if (existingIdx !== -1) {
        working[existingIdx] = { ...working[existingIdx], price, desc, emoji, station, prepTime, allergens, dietTags, costPrice, updatedAt: ts, history: withHistory(working[existingIdx], "Updated via import") };
        updated++;
      } else {
        working.push({
          id: "m" + Date.now() + Math.random().toString(36).slice(2, 6),
          name, price, cat, desc, emoji, station, prepTime, allergens, dietTags, costPrice,
          popular: false, active: true, eightySixed: false, unavailableReason: "",
          createdAt: ts, updatedAt: ts,
          history: [{ ts, note: "Created via import" }],
        });
        added++;
      }
    }
    setMenuItems(working);
    const skippedMsg = skipped ? `, ${skipped} skipped` : "";
    setImportMsgType("success");
    setImportMsg(`Imported: ${added} added, ${updated} updated${skippedMsg}.`);
    setTimeout(() => setImportMsg(""), 5000);
  };

  const importCsv = (file) => {
    if (!file) return;
    const isExcel = /\.xlsx?$/i.test(file.name || "");
    if (isExcel) {
      // No spreadsheet-parsing library is bundled in this project, so we can't read
      // binary .xlsx files directly. Ask for a CSV instead — Excel/Sheets can save to CSV
      // in two clicks, and it round-trips through our own Export/Template perfectly.
      setImportMsgType("error");
      setImportMsg("Excel (.xlsx) files aren't supported directly — open it and use \"Save As → CSV\", then import that file instead.");
      setTimeout(() => setImportMsg(""), 7000);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        processImportLines(splitCsvRows(text));
      } catch {
        setImportMsgType("error");
        setImportMsg("Couldn't parse that CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const exportMenu = (items) => {
    try {
      const list = Array.isArray(items) && items.length ? items : safeItems;
      const rows = [
        ["Name","Price","Category","Description","Emoji","Station","PrepTime","Allergens","DietTags","CostPrice","Margin","Active","86'd","UnavailableReason","Popular"],
        ...list.map(m => {
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
      const suffix = list.length !== safeItems.length ? "-selection" : "";
      a.href = url; a.download = `menu-export${suffix}-${new Date().toISOString().slice(0,10)}.csv`; a.click();
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
        history: withHistory(existing, "Edited details"),
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
  const [priceEditError, setPriceEditError] = useState("");
  const [hoveredCard, setHoveredCard] = useState(null);

  // Inline 86 reason dialog — no window.prompt
  const [confirm86Id, setConfirm86Id] = useState(null);
  const [reason86, setReason86] = useState("");

  // Inline delete confirm — no window.confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Escape closes whichever overlay is topmost; also lock background scroll while one is open
  const anyModalOpen = showModal || !!confirm86Id || !!confirmDeleteId || confirmBulkDelete;
  useEffect(() => {
    if (!anyModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (confirm86Id) { setConfirm86Id(null); setReason86(""); return; }
      if (confirmDeleteId) { setConfirmDeleteId(null); return; }
      if (confirmBulkDelete) { setConfirmBulkDelete(false); return; }
      if (showModal) { setShowModal(false); return; }
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [anyModalOpen, confirm86Id, confirmDeleteId, confirmBulkDelete, showModal]);

  // Quick shortcuts: "/" jumps to search, "n" opens New Item — only when no overlay
  // is open and focus isn't already inside a text field (so normal typing is untouched).
  useEffect(() => {
    if (anyModalOpen) return;
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); searchInputRef.current?.focus(); }
      else if (e.key === "n" || e.key === "N") { e.preventDefault(); openNew(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [anyModalOpen]);

  return (
    <div>
      <style>{`
        @keyframes menuCardIn { from { opacity: 0; transform: translateY(6px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .menu-card-anim { animation: menuCardIn 0.22s ease both; }
        @keyframes menuToastIn { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
      {/* Menu Studio Header */}
      <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
        <div style={{ fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Menu Studio
        </div>
        <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-md)" }}>
          Control items, pricing, availability, and station routing
        </div>
        
        {/* Operational Stat Chips */}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", flexWrap: "wrap" }}>
          {[
            { label: "Total Items", count: safeItems.length, color: "var(--cafe-text-secondary)" },
            { label: "Active", count: activeCount, color: "var(--cafe-success)", statusKey: "active" },
            { label: "86'd", count: eightySixedCount, color: eightySixedCount > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", statusKey: "86ed" },
            { label: "Popular", count: popularCount, color: popularCount > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", statusKey: "popular" },
            { label: "Categories", count: cats.length - 1, color: "var(--cafe-info)" },
            { label: "Sellable Value", count: `₹${sellableRevenue.toLocaleString()}`, color: "var(--cafe-text-secondary)" },
          ].map(chip => {
            const clickable = !!chip.statusKey;
            const activeChip = clickable && statusFilter === chip.statusKey;
            const Tag = clickable ? "button" : "div";
            return (
              <Tag key={chip.label}
                type={clickable ? "button" : undefined}
                onClick={clickable ? () => setStatusFilter(activeChip ? "all" : chip.statusKey) : undefined}
                title={clickable ? `Filter to ${chip.label.toLowerCase()} items` : undefined}
                style={{
                  background: activeChip ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)",
                  border: `1px solid ${activeChip ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
                  borderRadius: "var(--cafe-radius-md)",
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: clickable ? "pointer" : "default",
                  transition: "background .15s, border-color .15s",
                }}>
                <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {chip.label}
                </span>
                <span style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: chip.color, fontFamily: "monospace" }}>
                  {chip.count}
                </span>
              </Tag>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
        {/* Primary row: search + add */}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", alignItems: "center", flexWrap: "wrap", marginBottom: "var(--cafe-space-sm)" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 400 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", pointerEvents: "none" }}>⌕</span>
            <input ref={searchInputRef} style={{ ...input, paddingLeft: 36, paddingRight: menuSearch ? 32 : 30, width: "100%", borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)" }} placeholder="Search items…" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
            {!menuSearch && (
              <span aria-hidden="true" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "var(--cafe-text-tertiary)", opacity: 0.6, border: `1px solid var(--cafe-border-light)`, borderRadius: 4, padding: "1px 5px", pointerEvents: "none" }}>/</span>
            )}
            {menuSearch && (
              <button
                onClick={() => setMenuSearch("")}
                title="Clear search"
                aria-label="Clear search"
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: "var(--cafe-font-sm)", padding: 4, lineHeight: 1 }}
              >✕</button>
            )}
          </div>
          <button style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)", fontWeight: 600, padding: "10px 18px", minHeight: 40 }} onClick={openNew}>+ Add Item</button>
          <div style={{ flex: 1 }} />
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls,text/csv" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} />
          <div style={{ position: "relative" }}>
            <button
              style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)", padding: "10px 16px", minHeight: 40, display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => setShowImportMenu(v => !v)}
            >
              ↑ Import <span style={{ fontSize: 10, opacity: 0.7 }}>{showImportMenu ? "▲" : "▼"}</span>
            </button>
            {showImportMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowImportMenu(false)} />
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-md)", boxShadow: "var(--cafe-shadow-xl)", width: 240, zIndex: 50, overflow: "hidden" }}>
                  <button
                    onClick={() => { downloadTemplate(); setShowImportMenu(false); }}
                    style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--cafe-bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontWeight: 600 }}>⬇ Download Excel Template</span>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>Pre-filled columns + example rows</span>
                  </button>
                  <div style={{ height: 1, background: "var(--cafe-border-light)" }} />
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowImportMenu(false); }}
                    style={{ width: "100%", textAlign: "left", padding: "12px 14px", background: "transparent", border: "none", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--cafe-bg-hover)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontWeight: 600 }}>📤 Import File</span>
                    <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)" }}>.csv — matches items by name + category</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)", padding: "10px 16px", minHeight: 40 }} onClick={() => exportMenu(selectedIds.size > 0 ? safeItems.filter(m => selectedIds.has(m?.id)) : null)} title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected item(s) to CSV` : "Export menu to CSV"}>↓ Export{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}</button>
        </div>

        {/* Filters row: sort + price range + allergen exclude, visually grouped */}
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", alignItems: "center", flexWrap: "wrap", padding: "8px 10px", background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, borderRadius: "var(--cafe-radius-md)" }}>
          <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", paddingLeft: 4 }}>Filters</span>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...input, width: "auto", borderRadius: "var(--cafe-radius-sm)", fontSize: "var(--cafe-font-xs)", minHeight: 34, padding: "6px 10px" }} title="Sort items">
            <option value="manual">Sort: Manual</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="price-asc">Sort: Price ↑</option>
            <option value="price-desc">Sort: Price ↓</option>
            <option value="margin-asc">Sort: Margin ↑</option>
            <option value="margin-desc">Sort: Margin ↓</option>
            <option value="prep">Sort: Prep Time</option>
          </select>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min="0" placeholder="Min ₹" value={priceMin} onChange={e => setPriceMin(e.target.value)} style={{ ...input, width: 70, borderRadius: "var(--cafe-radius-sm)", fontSize: "var(--cafe-font-xs)", minHeight: 34, padding: "6px 8px" }} />
            <span style={{ color: "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-xs)" }}>–</span>
            <input type="number" min="0" placeholder="Max ₹" value={priceMax} onChange={e => setPriceMax(e.target.value)} style={{ ...input, width: 70, borderRadius: "var(--cafe-radius-sm)", fontSize: "var(--cafe-font-xs)", minHeight: 34, padding: "6px 8px" }} />
          </div>

          <input placeholder="Exclude allergens (nuts, dairy…)" value={allergenExclude} onChange={e => setAllergenExclude(e.target.value)} style={{ ...input, width: 190, borderRadius: "var(--cafe-radius-sm)", fontSize: "var(--cafe-font-xs)", minHeight: 34, padding: "6px 10px" }} />

          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "all",      label: "All" },
              { key: "active",   label: "Active" },
              { key: "inactive", label: "Inactive" },
              { key: "86ed",     label: "86'd" },
              { key: "popular",  label: "★ Popular" },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "var(--cafe-radius-sm)",
                  border: `1px solid ${statusFilter === s.key ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`,
                  background: statusFilter === s.key ? "var(--cafe-accent-bg)" : "transparent",
                  color: statusFilter === s.key ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                  fontSize: "var(--cafe-font-xs)",
                  fontWeight: statusFilter === s.key ? 700 : 500,
                  cursor: "pointer",
                  minHeight: 34,
                  whiteSpace: "nowrap",
                }}
              >{s.label}</button>
            ))}
          </div>

          {(sortBy !== "manual" || priceMin || priceMax || allergenExclude || statusFilter !== "all") && (
            <button
              onClick={() => { setSortBy("manual"); setPriceMin(""); setPriceMax(""); setAllergenExclude(""); setStatusFilter("all"); }}
              style={{ background: "transparent", border: "none", color: "var(--cafe-accent)", fontSize: "var(--cafe-font-xs)", fontWeight: 600, cursor: "pointer", padding: "6px 8px" }}
            >
              Clear filters
            </button>
          )}
        </div>
        {importMsg && (
          <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: "var(--cafe-font-xs)", color: importMsgType === "error" ? "var(--cafe-danger)" : "var(--cafe-success)", fontWeight: 600 }}>
            {importMsgType === "error" ? "⚠" : "✓"} {importMsg}
          </div>
        )}
      </div>

      {/* Margin & Performance Insights */}
      {itemsWithCost.length > 0 && (
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", marginBottom: "var(--cafe-space-lg)", flexWrap: "wrap" }}>
          <div style={{ background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, borderRadius: "var(--cafe-radius-md)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Avg Margin</span>
            <span style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, fontFamily: "monospace", color: avgMarginPct != null && avgMarginPct < LOW_MARGIN_THRESHOLD ? "var(--cafe-danger)" : "var(--cafe-success)" }}>
              {avgMarginPct != null ? `${Math.round(avgMarginPct * 100)}%` : "—"}
            </span>
          </div>
          <div style={{ background: "var(--cafe-bg-surface)", border: `1px solid ${lowMarginItems.length ? "var(--cafe-danger-border)" : "var(--cafe-border-light)"}`, borderRadius: "var(--cafe-radius-md)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>Low Margin (&lt;{Math.round(LOW_MARGIN_THRESHOLD * 100)}%)</span>
            <span style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, fontFamily: "monospace", color: lowMarginItems.length ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)" }}>{lowMarginItems.length}</span>
          </div>
          {noSalesDataCount > 0 && (
            <div style={{ background: "var(--cafe-bg-surface)", border: `1px solid var(--cafe-border-light)`, borderRadius: "var(--cafe-radius-md)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600, textTransform: "uppercase" }}>No Cost Data</span>
              <span style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-text-tertiary)" }}>{noSalesDataCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Category Rail */}
      <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
        <div style={{ display: "flex", gap: "var(--cafe-space-sm)", overflowX: "auto", paddingBottom: 4 }}>
          {cats.map(cat => {
            const catCount = safeItems.filter(m => (cat === "ALL" || mCat(m) === cat)).length;
            const active = catFilter === cat;
            return (
              <button key={cat} onClick={() => setCatFilter(cat)} style={{
                padding: "12px 18px",
                borderRadius: "var(--cafe-radius-md)",
                border: "none",
                background: active ? "var(--cafe-accent-dim)" : "transparent",
                color: active ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
                fontSize: "var(--cafe-font-sm)",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}>
                {cat}
                <span style={{
                  background: active ? "var(--cafe-accent)" : "var(--cafe-bg-hover)",
                  color: active ? "#1A1208" : "var(--cafe-text-tertiary)",
                  fontSize: "var(--cafe-font-xs)",
                  fontFamily: "monospace",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "var(--cafe-radius-sm)",
                  minWidth: 20,
                  textAlign: "center",
                }}>{catCount}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      {filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--cafe-space-lg)" }}>
          <div style={{ display: "flex", gap: "var(--cafe-space-sm)", flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>
              <input type="checkbox" checked={allShownSelected} onChange={() => (allShownSelected ? clearSelection() : selectAllShown())} style={{ accentColor: "var(--cafe-accent)" }} aria-label="Select all shown items" />
              {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filtered.length} shown`}
            </label>
            {selectedIds.size > 0 && (
              <button onClick={clearSelection} style={{ background: "transparent", border: "none", color: "var(--cafe-accent)", fontSize: "var(--cafe-font-xs)", fontWeight: 600, cursor: "pointer", padding: "6px 4px" }}>Clear selection</button>
            )}
            <span style={{ width: 1, alignSelf: "stretch", background: "var(--cafe-border-light)" }} />
            <button onClick={bulkActivate} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-success-border)`, background: "var(--cafe-success-bg)", color: "var(--cafe-success)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600, minHeight: 36 }}>{selectedIds.size > 0 ? "Activate" : "Activate All"}</button>
            <button onClick={bulkDeactivate} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", minHeight: 36 }}>{selectedIds.size > 0 ? "Deactivate" : "Deactivate All"}</button>
            <button onClick={bulkClear86} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-accent-border)`, background: "var(--cafe-accent-bg)", color: "var(--cafe-accent)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600, minHeight: 36 }}>Clear 86'd</button>
            <span style={{ width: 1, alignSelf: "stretch", background: "var(--cafe-border-light)" }} />
            <button onClick={() => bulkPriceAdjust(10)} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", minHeight: 36 }} title={selectedIds.size > 0 ? "Raise price of selected items by 10%" : "Raise price of shown items by 10%"}>+10% Price</button>
            <button onClick={() => bulkPriceAdjust(-10)} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", minHeight: 36 }} title={selectedIds.size > 0 ? "Lower price of selected items by 10%" : "Lower price of shown items by 10%"}>−10% Price</button>
            {selectedIds.size > 0 && (
              <>
                <span style={{ width: 1, alignSelf: "stretch", background: "var(--cafe-border-light)" }} />
                <button onClick={bulkDuplicateSelected} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", minHeight: 36 }}>⧉ Duplicate</button>
                <button onClick={bulkDeleteSelected} style={{ padding: "8px 14px", borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-danger-border)`, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 600, minHeight: 36 }}>🗑 Delete</button>
              </>
            )}
            {bulkMsg && <span role="status" aria-live="polite" style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-success)", fontWeight: 600 }}>✓ {bulkMsg}</span>}
          </div>
        </div>
      )}

      {/* Empty states */}
      {safeItems.length === 0 && (
        <div style={emptyState}>
          <div style={{ fontSize: 40, marginBottom: "var(--cafe-space-md)", opacity: 0.3 }}>🍽</div>
          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
            No items on this board
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)" }}>
            Add your first item to get started
          </div>
          <button style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-md)", fontWeight: 600, padding: "10px 18px" }} onClick={openNew}>+ Add First Item</button>
        </div>
      )}
      {safeItems.length > 0 && filtered.length === 0 && (
        <div style={emptyState}>
          <div style={{ fontSize: 40, marginBottom: "var(--cafe-space-md)", opacity: 0.3 }}>🔍</div>
          <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
            No matching menu items
          </div>
          <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-md)" }}>
            Try a different search or category
          </div>
          <button
            style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)", padding: "8px 16px" }}
            onClick={() => { setMenuSearch(""); setCatFilter("ALL"); setPriceMin(""); setPriceMax(""); setAllergenExclude(""); setStatusFilter("all"); }}
          >
            Clear search & filters
          </button>
        </div>
      )}

      {/* Menu Grid */}
      {cats.filter(c => c !== "ALL" && (catFilter === "ALL" || catFilter === c)).map(cat => {
        const items = sortedFiltered.filter(m => mCat(m) === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom: "var(--cafe-space-xl)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "var(--cafe-space-md)" }}>
              <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>{cat}</span>
              <span style={{ flex: 1, height: 1, background: "var(--cafe-border-light)", display: "inline-block" }} />
              <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>{items.filter(m => m?.active).length}/{items.length} active</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "var(--cafe-space-md)" }} className="menu-grid">
              {items.map((m, idx) => (
                <div key={m.id}
                  onMouseEnter={() => setHoveredCard(m.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  draggable={sortBy === "manual"}
                  onDragStart={() => setDragId(m.id)}
                  onDragOver={(e) => { if (sortBy === "manual") { e.preventDefault(); setDragOverId(m.id); } }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => { e.preventDefault(); reorderItem(dragId, m.id); setDragId(null); setDragOverId(null); }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  className="menu-card-anim"
                  style={{
                    background: m.eightySixed ? "var(--cafe-danger-bg)" : m.active ? "var(--cafe-bg-card)" : "var(--cafe-bg-hover)",
                    border: `1px solid ${selectedIds.has(m.id) ? "var(--cafe-accent)" : dragOverId === m.id ? "var(--cafe-accent)" : m.eightySixed ? "var(--cafe-danger-border)" : (hoveredCard === m.id && m.active && !m.eightySixed) ? "var(--cafe-accent-border)" : m.active ? "var(--cafe-border-light)" : "var(--cafe-border-light)"}`,
                    borderRadius: "var(--cafe-radius-lg)",
                    padding: "var(--cafe-space-md)",
                    opacity: dragId === m.id ? 0.4 : m.active && !m.eightySixed ? 1 : 0.5,
                    transition: "opacity .15s, box-shadow .15s, border-color .15s, transform .15s ease",
                    transform: hoveredCard === m.id && m.active && !m.eightySixed && sortBy !== "manual" ? "translateY(-3px)" : "translateY(0)",
                    boxShadow: selectedIds.has(m.id)
                      ? "0 0 0 3px var(--cafe-accent-bg)"
                      : m.active && !m.eightySixed
                        ? hoveredCard === m.id ? "var(--cafe-shadow-md)" : "var(--cafe-shadow-sm)"
                        : "none",
                    display: "flex", flexDirection: "column",
                    cursor: sortBy === "manual" ? "grab" : "default",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--cafe-space-sm)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        onClick={e => e.stopPropagation()}
                        aria-label={selectedIds.has(m.id) ? `Deselect ${mName(m)}` : `Select ${mName(m)}`}
                        style={{ accentColor: "var(--cafe-accent)", width: 15, height: 15, cursor: "pointer", flexShrink: 0 }}
                      />
                      <div style={{ fontSize: 28, lineHeight: 1 }}>{mEmoji(m)}</div>
                      {sortBy === "manual" && items.length > 1 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <button
                            onClick={() => reorderItem(m.id, items[idx - 1]?.id)}
                            disabled={idx === 0}
                            aria-label={`Move ${mName(m)} up`}
                            title="Move up"
                            style={{ width: 18, height: 14, lineHeight: 1, padding: 0, border: "none", background: "transparent", color: idx === 0 ? "var(--cafe-border-light)" : "var(--cafe-text-tertiary)", cursor: idx === 0 ? "default" : "pointer", fontSize: 10 }}
                          >▲</button>
                          <button
                            onClick={() => reorderItem(m.id, items[idx + 1]?.id)}
                            disabled={idx === items.length - 1}
                            aria-label={`Move ${mName(m)} down`}
                            title="Move down"
                            style={{ width: 18, height: 14, lineHeight: 1, padding: 0, border: "none", background: "transparent", color: idx === items.length - 1 ? "var(--cafe-border-light)" : "var(--cafe-text-tertiary)", cursor: idx === items.length - 1 ? "default" : "pointer", fontSize: 10 }}
                          >▼</button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {m.popular && <span style={{ padding: "4px 8px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-accent-bg)", color: "var(--cafe-accent)", fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.05em" }}>★ POPULAR</span>}
                      {m.eightySixed && <span style={{ padding: "4px 8px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.05em" }}>86'D</span>}
                      {!m.active && <span style={{ padding: "4px 8px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-bg-hover)", color: "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.05em" }}>OFF</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, marginBottom: 6, wordBreak: "break-word", overflowWrap: "anywhere", lineHeight: 1.3, color: "var(--cafe-text-primary)" }}>{mName(m)}</div>
                  <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-md)", lineHeight: 1.45, wordBreak: "break-word", overflowWrap: "anywhere", flex: 1 }}>{mDesc(m)}</div>

                  {/* Unavailable reason */}
                  {m?.eightySixed && m?.unavailableReason && (
                    <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginBottom: 6, wordBreak: "break-word", fontWeight: 600 }}>⚠ {m.unavailableReason}</div>
                  )}

                  {/* Station + prep time */}
                  <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {(() => { 
                      const st = mStation(m) || inferStation(mCat(m), mName(m));
                      const stationColors = { Bar: "var(--cafe-info)", Kitchen: "var(--cafe-purple)", Dessert: "var(--cafe-warning)", Packaging: "var(--cafe-success)" };
                      const stationColor = stationColors[st] || "var(--cafe-text-tertiary)";
                      return <span style={{ fontWeight: 600, color: stationColor }}>{st}</span>;
                    })()}
                    {mPrepTime(m) ? <span style={{ color: "var(--cafe-text-tertiary)" }}>{mPrepTime(m)} min</span> : <span style={{ color: "var(--cafe-accent)", opacity: 0.6 }}>— min</span>}
                  </div>

                  {/* Allergen + diet chips */}
                  {(mAllergens(m).length > 0 || mDietTags(m).length > 0) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "var(--cafe-space-sm)" }}>
                      {mAllergens(m).map(a => <span key={a} style={{ padding: "3px 8px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs)", fontWeight: 600 }}>{a}</span>)}
                      {mDietTags(m).map(t => <span key={t} style={{ padding: "3px 8px", borderRadius: "var(--cafe-radius-sm)", background: "var(--cafe-success-bg)", color: "var(--cafe-success)", fontSize: "var(--cafe-font-xs)", fontWeight: 600 }}>{t}</span>)}
                    </div>
                  )}

                  {/* Cost / margin */}
                  {(() => {
                    const cp = mCostPrice(m);
                    if (cp == null) return null;
                    const p = mPrice(m), margin = p - cp;
                    const pct = p > 0 ? Math.round((margin / p) * 100) : 0;
                    return <div style={{ fontSize: "var(--cafe-font-xs)", color: margin >= 0 ? "var(--cafe-success)" : "var(--cafe-danger)", marginBottom: 6, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>Margin ₹{margin} · {pct}%</div>;
                  })()}

                  {/* Health warnings — only genuinely actionable issues, not values that already have sensible defaults shown above */}
                  {(() => {
                    const w = [];
                    if (!mPrice(m)) w.push("no price set");
                    const cp = mCostPrice(m);
                    if (cp != null && mPrice(m) > 0 && cp > mPrice(m)) w.push("cost exceeds price");
                    if (!w.length) return null;
                    return <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginBottom: 6, letterSpacing: "0.02em", wordBreak: "break-word", fontWeight: 600 }}>⚠ {w.join(" · ")}</div>;
                  })()}
                  <div style={{ marginTop: "auto", paddingTop: "var(--cafe-space-sm)", borderTop: `1px solid var(--cafe-border-light)` }}>
                    <div style={{ marginBottom: 10 }}>
                    {editingPrice === m.id ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>₹</span>
                          <input type="number" autoFocus style={{ ...input, padding: "6px 10px", width: 80, fontSize: "var(--cafe-font-base)", fontFamily: "monospace", color: "var(--cafe-accent)", fontWeight: 700, borderRadius: "var(--cafe-radius-sm)", borderColor: priceEditError ? "var(--cafe-danger-border)" : undefined }} value={priceVal} onChange={e => { setPriceVal(e.target.value); if (priceEditError) setPriceEditError(""); }}
                            onKeyDown={e => {
                              if (e.key === "Escape") { setEditingPrice(null); setPriceEditError(""); return; }
                              if (e.key === "Enter") {
                                const p = Number(priceVal);
                                if (priceVal.trim() === "" || !Number.isFinite(p) || p < 0) { setPriceEditError("Must be 0 or greater"); return; }
                                if (p !== mPrice(m)) setMenuItems(safeItems.map(x => x?.id === m.id ? { ...x, price: p, updatedAt: now(), history: withHistory(x, `Price ₹${mPrice(m)} → ₹${p}`) } : x));
                                setEditingPrice(null);
                                setPriceEditError("");
                              }
                            }}
                            onBlur={() => {
                              const p = Number(priceVal);
                              if (priceVal.trim() !== "" && Number.isFinite(p) && p >= 0 && p !== mPrice(m)) {
                                setMenuItems(safeItems.map(x => x?.id === m.id ? { ...x, price: p, updatedAt: now(), history: withHistory(x, `Price ₹${mPrice(m)} → ₹${p}`) } : x));
                              }
                              setEditingPrice(null);
                              setPriceEditError("");
                            }} />
                        </div>
                        {priceEditError && <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-danger)", marginTop: 4, fontWeight: 600 }}>{priceEditError}</div>}
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <div style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-lg)", fontWeight: 700, color: "var(--cafe-accent)", cursor: "pointer", borderBottom: `1px dashed var(--cafe-accent-border)`, lineHeight: 1.3 }} title="Click to edit price" onClick={() => { setEditingPrice(m.id); setPriceVal(String(mPrice(m))); }}>₹{mPrice(m)}</div>
                        {mMarginPct(m) != null && (
                          <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 600, color: mMarginPct(m) < LOW_MARGIN_THRESHOLD ? "var(--cafe-danger)" : "var(--cafe-success)" }}>
                            {Math.round(mMarginPct(m) * 100)}% margin
                          </div>
                        )}
                      </div>
                    )}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {/* star */}
                      <button onClick={() => togglePopular(m.id)} aria-label={m.popular ? "Unmark as popular" : "Mark as popular"} aria-pressed={!!m.popular} style={{ flex: "1 1 0", minWidth: 30, height: 30, borderRadius: "var(--cafe-radius-sm)", border: `1px solid ${m.popular ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`, background: m.popular ? "var(--cafe-accent-bg)" : "transparent", color: m.popular ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Toggle popular">★</button>
                      {/* edit */}
                      <button onClick={() => openEdit(m)} aria-label={`Edit ${mName(m)}`} style={{ flex: "1 1 0", minWidth: 30, height: 30, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Edit item">✎</button>
                      {/* duplicate */}
                      <button onClick={() => duplicateItem(m.id)} aria-label={`Duplicate ${mName(m)}`} style={{ flex: "1 1 0", minWidth: 30, height: 30, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-secondary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Duplicate item">⧉</button>
                      {/* 86 */}
                      <button onClick={() => toggle86(m.id)} aria-label={m.eightySixed ? `Mark ${mName(m)} available again` : `86 ${mName(m)} (mark unavailable)`} aria-pressed={!!m.eightySixed} style={{ flex: "1.3 1 0", minWidth: 34, height: 30, borderRadius: "var(--cafe-radius-sm)", border: `1px solid ${m.eightySixed ? "var(--cafe-danger-border)" : "var(--cafe-border-light)"}`, background: m.eightySixed ? "var(--cafe-danger-bg)" : "transparent", color: m.eightySixed ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-xs)", cursor: "pointer", fontWeight: 700, letterSpacing: "0.03em" }} title="86 (out of stock)">{m.eightySixed ? "↺" : "86"}</button>
                      {/* active toggle */}
                      <button onClick={() => toggleActive(m.id)} aria-label={m.active ? `Deactivate ${mName(m)}` : `Activate ${mName(m)}`} aria-pressed={!!m.active} style={{ flex: "1 1 0", minWidth: 30, height: 30, borderRadius: "var(--cafe-radius-sm)", border: `1px solid ${m.active ? "var(--cafe-danger-border)" : "var(--cafe-success-border)"}`, background: "transparent", color: m.active ? "var(--cafe-danger)" : "var(--cafe-success)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }} title={m.active ? "Deactivate" : "Activate"}>{m.active ? "×" : "✓"}</button>
                      {/* delete */}
                      <button onClick={() => deleteItem(m.id)} aria-label={`Delete ${mName(m)}`} style={{ flex: "1 1 0", minWidth: 30, height: 30, borderRadius: "var(--cafe-radius-sm)", border: `1px solid var(--cafe-border-light)`, background: "transparent", color: "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-sm)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Delete item">🗑</button>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)" }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", width: "min(480px,96vw)", maxHeight: "90vh", boxShadow: "var(--cafe-shadow-xl)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
            {/* Sticky header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--cafe-space-lg)", borderBottom: `1px solid var(--cafe-border-light)`, flexShrink: 0 }}>
              <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, letterSpacing: "-0.01em" }}>{editItem ? "Edit Item" : "New Item"}</div>
              <button aria-label="Close" style={{ background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", fontSize: "var(--cafe-font-lg)", cursor: "pointer", lineHeight: 1, padding: "4px 8px", borderRadius: "var(--cafe-radius-sm)" }} onClick={() => setShowModal(false)}>×</button>
            </div>
            {/* Scrollable body */}
            <div style={{ overflowY: "auto", padding: "var(--cafe-space-lg)", flex: 1 }}>
              {/* Basic Info Section */}
              <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)" }}>Basic Info</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: "var(--cafe-space-sm)", marginBottom: "var(--cafe-space-sm)" }}>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Name *</label>
                    <input autoFocus style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name"
                      onKeyDown={e => { if (e.key === "Enter") saveItem(); }} />
                  </div>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Icon</label>
                    <input style={{ ...input, textAlign: "center", fontSize: "var(--cafe-font-lg)", borderRadius: "var(--cafe-radius-md)", padding: "8px 4px" }} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="☕" maxLength={2} />
                  </div>
                </div>
                <div style={{ marginBottom: "var(--cafe-space-sm)" }}>
                  <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Description</label>
                  <input style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Short description…" />
                </div>
              </div>

              {/* Pricing Section */}
              <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)" }}>Pricing</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--cafe-space-sm)" }}>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Price (₹) *</label>
                    <input style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Cost Price (₹) <span style={{ fontWeight: 400, opacity: 0.55, textTransform: "none", letterSpacing: 0 }}>optional</span></label>
                    <input style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} placeholder="for margin tracking" />
                  </div>
                </div>
              </div>

              {/* Availability Section */}
              <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)" }}>Availability</div>
                <div style={{ marginBottom: "var(--cafe-space-sm)" }}>
                  <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Category</label>
                  <select style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                    {cats.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-bg-surface)", border: `1px solid ${form.popular ? "var(--cafe-accent-border)" : "var(--cafe-border-light)"}`, cursor: "pointer" }} onClick={() => setForm({ ...form, popular: !form.popular })}>
                  <input type="checkbox" id="pop" checked={form.popular} onChange={e => setForm({ ...form, popular: e.target.checked })} style={{ accentColor: "var(--cafe-accent)" }} />
                  <label htmlFor="pop" style={{ fontSize: "var(--cafe-font-sm)", color: form.popular ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", cursor: "pointer", fontWeight: form.popular ? 600 : 400 }}>Mark as popular ★</label>
                </div>
              </div>

              {/* Station & Prep Section */}
              <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)" }}>Station & Prep</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--cafe-space-sm)" }}>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Station</label>
                    <select style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} value={form.station} onChange={e => setForm({ ...form, station: e.target.value })}>
                      {["Bar", "Kitchen", "Dessert", "Packaging"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Prep Time (min)</label>
                    <input style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} type="number" min="0" value={form.prepTime} onChange={e => setForm({ ...form, prepTime: e.target.value })} placeholder="5" />
                  </div>
                </div>
              </div>

              {/* Allergens & Tags Section */}
              <div style={{ marginBottom: "var(--cafe-space-lg)" }}>
                <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)" }}>Allergens & Tags</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--cafe-space-sm)" }}>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Allergens</label>
                    <input style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} value={form.allergens} onChange={e => setForm({ ...form, allergens: e.target.value })} placeholder="nuts, dairy…" />
                  </div>
                  <div>
                    <label style={{ ...label, fontSize: "var(--cafe-font-xs)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Diet Tags</label>
                    <input style={{ ...input, borderRadius: "var(--cafe-radius-md)" }} value={form.dietTags} onChange={e => setForm({ ...form, dietTags: e.target.value })} placeholder="vegan, GF…" />
                  </div>
                </div>
              </div>

              {/* History Section */}
              {editItem && (() => {
                const target = safeItems.find(m => m?.id === editItem);
                const hist = Array.isArray(target?.history) ? [...target.history].reverse() : [];
                if (!hist.length) return null;
                return (
                  <div>
                    <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-sm)" }}>Recent History</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 120, overflowY: "auto" }}>
                      {hist.map((h, i) => (
                        <div key={i} style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", display: "flex", gap: 8 }}>
                          <span style={{ opacity: 0.7, whiteSpace: "nowrap" }}>{new Date(h.ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          <span>{h.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            {/* Sticky footer */}
            <div style={{ padding: "var(--cafe-space-lg)", borderTop: `1px solid var(--cafe-border-light)`, flexShrink: 0, display: "flex", flexDirection: "column", gap: "var(--cafe-space-sm)" }}>
              {formError && (
                <div style={{ padding: "10px 14px", borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-danger-bg)", border: `1px solid var(--cafe-danger-border)`, color: "var(--cafe-danger)", fontSize: "var(--cafe-font-sm)", wordBreak: "break-word", lineHeight: 1.4 }}>
                  {formError}
                </div>
              )}
              <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
                <button style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)" }} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-md)", fontWeight: 600, fontSize: "var(--cafe-font-sm)" }} onClick={saveItem}>{editItem ? "Save Changes" : "Add Item"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline 86 reason dialog */}
      {confirm86Id && (() => {
        const target = safeItems.find(m => m?.id === confirm86Id);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(4px)" }} onClick={() => setConfirm86Id(null)}>
            <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-danger-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-lg)", width: "min(380px,94vw)", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, marginBottom: 8 }}>86 "{mName(target)}"?</div>
              <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)", lineHeight: 1.4 }}>This item will show as unavailable. Add a reason for the kitchen.</div>
              <input
                autoFocus
                style={{ ...input, borderRadius: "var(--cafe-radius-md)", width: "100%", marginBottom: "var(--cafe-space-lg)" }}
                placeholder="Reason (optional)"
                value={reason86}
                onChange={e => setReason86(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirm86Apply(); if (e.key === "Escape") setConfirm86Id(null); }}
              />
              <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
                <button style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)" }} onClick={() => setConfirm86Id(null)}>Cancel</button>
                <button style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-danger)", borderColor: "var(--cafe-danger-border)", fontWeight: 600, fontSize: "var(--cafe-font-sm)" }} onClick={confirm86Apply}>86 This Item</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Undo-delete toast */}
      {lastDeleted && (
        <div role="status" aria-live="polite" style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", animation: "menuToastIn 0.2s ease both", background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-md)", padding: "10px 16px", boxShadow: "var(--cafe-shadow-xl)", display: "flex", alignItems: "center", gap: 14, zIndex: 120 }}>
          <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)" }}>{undoMsg}</span>
          <button onClick={undoDelete} style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-sm)", fontSize: "var(--cafe-font-xs)", fontWeight: 700, padding: "6px 12px" }}>Undo</button>
        </div>
      )}

      {/* Inline delete confirm */}
      {confirmDeleteId && (() => {
        const target = safeItems.find(m => m?.id === confirmDeleteId);
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(4px)" }} onClick={() => setConfirmDeleteId(null)}>
            <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-danger-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-lg)", width: "min(380px,94vw)", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, marginBottom: 8 }}>Delete "{mName(target)}"?</div>
              <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)", lineHeight: 1.5 }}>
                It will be removed from the menu. Historical orders won't be affected.
                {target?.popular && <span style={{ color: "var(--cafe-accent)", display: "block", marginTop: 8, fontWeight: 600 }}>⚠ This item is marked as popular.</span>}
              </div>
              <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
                <button style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)" }} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
                <button style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-danger)", borderColor: "var(--cafe-danger-border)", fontWeight: 600, fontSize: "var(--cafe-font-sm)" }} onClick={confirmDeleteApply}>Delete</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk delete confirm */}
      {confirmBulkDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110, backdropFilter: "blur(4px)" }} onClick={() => setConfirmBulkDelete(false)}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-danger-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-lg)", width: "min(380px,94vw)", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, marginBottom: 8 }}>Delete {selectedIds.size} item{selectedIds.size === 1 ? "" : "s"}?</div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)", marginBottom: "var(--cafe-space-lg)", lineHeight: 1.5 }}>
              They'll be removed from the menu. Historical orders won't be affected, and you can undo this right after.
            </div>
            <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
              <button style={{ ...btn("ghost"), borderRadius: "var(--cafe-radius-md)", fontSize: "var(--cafe-font-sm)" }} onClick={() => setConfirmBulkDelete(false)}>Cancel</button>
              <button style={{ ...btn("primary"), borderRadius: "var(--cafe-radius-md)", background: "var(--cafe-danger)", borderColor: "var(--cafe-danger-border)", fontWeight: 600, fontSize: "var(--cafe-font-sm)" }} onClick={confirmBulkDeleteApply}>Delete {selectedIds.size}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
