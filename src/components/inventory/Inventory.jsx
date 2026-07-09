import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_INVENTORY, INVENTORY_CATEGORIES, SUPPLIERS } from "../../data/inventoryConstants.js";
import { normalizeInventoryItem, deductInventoryForOrder, BASIC_RECIPES, isLowStock, isOutOfStock, getLowStockItems, getOutOfStockItems, getTotalInventoryValue, restockInventoryItem } from "../../domain/inventoryModel.js";

export default function Inventory({ inventory: propInventory, setInventory: propSetInventory }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  const [inventory, setInventory] = useState(propInventory || INIT_INVENTORY);
  const handleSetInventory = propSetInventory || setInventory;
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "", expiryDate: "", batchNo: "" });
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [adjustmentModal, setAdjustmentModal] = useState(null);
  const [adjustmentError, setAdjustmentError] = useState("");
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500);
  }, []);

  // --- Safe accessors: never let a null inventory or missing item field crash the screen ---
  const safeArr = Array.isArray(inventory) ? inventory : [];
  const safeStr = (v, fallback = "") => (typeof v === "string" && v.trim() ? v.trim() : fallback);
  const safeNum = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : fallback; };
  const itemName = (it) => safeStr(it?.name, "Unnamed item");
  const itemCategory = (it) => safeStr(it?.category, "Uncategorized");
  const itemUnit = (it) => safeStr(it?.unit, "pcs");
  const itemSupplier = (it) => safeStr(it?.supplier, "Unknown supplier");
  const itemQuantity = (it) => safeNum(it?.quantity, 0);
  const itemMinStock = (it) => safeNum(it?.minStock, 0);
  const itemCost = (it) => safeNum(it?.cost, 0);
  const fmtCurrency = (n) => "₹" + (Number.isFinite(n) ? n : 0).toLocaleString();
  const safeIsLowStock = (it) => { try { return !!isLowStock(it); } catch { return itemQuantity(it) <= itemMinStock(it); } };
  const safeIsOutOfStock = (it) => { try { return !!isOutOfStock(it); } catch { return itemQuantity(it) === 0; } };

  // --- Movement history helpers (lightweight, stored on item.movements) ---
  const addMovement = (item, { type, qty, previousQty, newQty, reason }) => {
    const movement = {
      id: "mv-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      type, qty, previousQty, newQty,
      reason: (reason || "").trim(),
      createdAt: new Date().toISOString(),
    };
    const prevMovements = Array.isArray(item?.movements) ? item.movements : [];
    return [movement, ...prevMovements].slice(0, 50);
  };

  // --- Reorder / expiry helpers ---
  const reorderHint = (it) => {
    if (safeIsOutOfStock(it)) return { label: "Reorder now", color: C.red };
    if (safeIsLowStock(it)) return { label: "Reorder soon", color: C.amber };
    return { label: "Stock OK", color: C.green };
  };
  const suggestedReorderQty = (it) => {
    const qty = itemQuantity(it), min = itemMinStock(it);
    if (qty > min) return 0;
    return Math.max(0, Math.round(min * 3 - qty));
  };
  const expiryStatus = (it) => {
    const exp = it?.expiryDate;
    if (!exp) return null;
    const expDate = new Date(exp);
    if (isNaN(expDate.getTime())) return null;
    const days = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { label: "Expired", color: C.red };
    if (days <= 7) return { label: `Expires in ${days}d`, color: C.amber };
    return { label: "OK", color: C.green };
  };
  const getRecipesUsingItem = useCallback((it) => {
    try {
      if (!it || !BASIC_RECIPES || typeof BASIC_RECIPES !== "object") return [];
      const nm = itemName(it).toLowerCase();
      const id = it?.id;
      const matches = [];
      Object.entries(BASIC_RECIPES).forEach(([menuName, recipe]) => {
        const ingredients = Array.isArray(recipe) ? recipe : Array.isArray(recipe?.ingredients) ? recipe.ingredients : [];
        const uses = ingredients.some(ing => {
          if (!ing) return false;
          if (typeof ing === "string") return ing.toLowerCase() === nm;
          const ingId = ing.id || ing.itemId || ing.inventoryId;
          const ingName = ing.name || ing.item;
          return (ingId && ingId === id) || (typeof ingName === "string" && ingName.toLowerCase() === nm);
        });
        if (uses) matches.push(menuName);
      });
      return matches;
    } catch {
      return [];
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return safeArr.filter(item => {
      const matchesCategory = categoryFilter === "All" || itemCategory(item) === categoryFilter;
      const matchesSearch = !q || itemName(item).toLowerCase().includes(q) || itemSupplier(item).toLowerCase().includes(q);
      const matchesLowStock = !showLowStock || safeIsLowStock(item);
      const matchesOutOfStock = !showOutOfStock || safeIsOutOfStock(item);
      return matchesCategory && matchesSearch && matchesLowStock && matchesOutOfStock;
    });
  }, [inventory, categoryFilter, search, showLowStock, showOutOfStock]);

  // Memoized sorted inventory
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = itemName(a).localeCompare(itemName(b));
      else if (sortBy === "qty") comparison = itemQuantity(a) - itemQuantity(b);
      else if (sortBy === "value") comparison = (itemQuantity(a) * itemCost(a)) - (itemQuantity(b) * itemCost(b));
      else if (sortBy === "lastRestock") comparison = new Date(a?.lastRestock || 0) - new Date(b?.lastRestock || 0);
      else if (sortBy === "status") comparison = (safeIsOutOfStock(a) ? 0 : safeIsLowStock(a) ? 1 : 2) - (safeIsOutOfStock(b) ? 0 : safeIsLowStock(b) ? 1 : 2);
      else if (sortBy === "expiry") comparison = new Date(a?.expiryDate || "9999-12-31") - new Date(b?.expiryDate || "9999-12-31");
      else if (sortBy === "supplier") comparison = itemSupplier(a).localeCompare(itemSupplier(b));

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortBy, sortOrder]);

  let lowStockCount = 0, outOfStockCount = 0, totalValue = 0;
  try { lowStockCount = getLowStockItems(safeArr).length; } catch { lowStockCount = safeArr.filter(safeIsLowStock).length; }
  try { outOfStockCount = getOutOfStockItems(safeArr).length; } catch { outOfStockCount = safeArr.filter(safeIsOutOfStock).length; }
  try {
    const v = getTotalInventoryValue(safeArr);
    totalValue = Number.isFinite(v) ? v : safeArr.reduce((sum, it) => sum + itemQuantity(it) * itemCost(it), 0);
  } catch {
    totalValue = safeArr.reduce((sum, it) => sum + itemQuantity(it) * itemCost(it), 0);
  }
  const totalSuppliers = new Set(safeArr.map(itemSupplier)).size;

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "", expiryDate: "", batchNo: "" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item?.id);
    setForm({
      name: item?.name || "",
      category: item?.category || "Ingredients",
      quantity: String(itemQuantity(item)),
      unit: item?.unit || "pieces",
      minStock: String(itemMinStock(item)),
      cost: String(itemCost(item)),
      supplier: item?.supplier || "",
      expiryDate: item?.expiryDate || "",
      batchNo: item?.batchNo || "",
    });
    setShowModal(true);
  };

  const saveItem = () => {
    const name = (form.name || "").trim();
    const category = (form.category || "").trim();
    const unit = (form.unit || "").trim();
    const supplier = (form.supplier || "").trim();
    const batchNo = (form.batchNo || "").trim();
    const expiryDate = (form.expiryDate || "").trim();
    const quantity = Number(form.quantity);
    const minStock = Number(form.minStock === "" ? 0 : form.minStock);
    const cost = Number(form.cost);

    if (!name) return alert("Item name is required");
    if (!category) return alert("Category is required");
    if (!unit) return alert("Unit is required");
    if (form.quantity === "" || !Number.isFinite(quantity) || quantity < 0) return alert("Quantity must be a number 0 or greater");
    if (!Number.isFinite(minStock) || minStock < 0) return alert("Min stock must be a number 0 or greater");
    if (form.cost === "" || !Number.isFinite(cost) || cost < 0) return alert("Cost must be a number 0 or greater");

    const isDuplicate = safeArr.some(i =>
      i?.id !== editItem &&
      itemName(i).toLowerCase() === name.toLowerCase() &&
      itemCategory(i).toLowerCase() === category.toLowerCase()
    );
    if (isDuplicate) return alert(`"${name}" already exists in category "${category}". Use a different name or edit the existing item.`);

    const now = new Date().toISOString();
    const existing = editItem ? safeArr.find(i => i?.id === editItem) : null;

    const itemData = {
      name, category, unit, supplier, batchNo, expiryDate,
      quantity, minStock, cost,
      lastRestock: existing?.lastRestock || now.split("T")[0],
      movements: existing?.movements || [],
      updatedAt: now,
    };

    let normalizedItem;
    try {
      normalizedItem = normalizeInventoryItem(itemData) || itemData;
    } catch {
      normalizedItem = itemData;
    }

    if (editItem) {
      handleSetInventory(safeArr.map(i => (i?.id === editItem ? { ...existing, ...normalizedItem, id: editItem, updatedAt: now } : i)));
      showToast(`${name} updated`, "success");
    } else {
      handleSetInventory([...safeArr, { ...normalizedItem, id: "inv-" + Date.now(), movements: [], updatedAt: now }]);
      showToast(`${name} added`, "success");
    }
    setShowModal(false);
  };

  const deleteItem = useCallback((id) => {
    const target = safeArr.find(i => i?.id === id);
    const usedIn = getRecipesUsingItem(target);
    const hasHistory = Array.isArray(target?.movements) && target.movements.length > 0;
    let msg = `Delete "${itemName(target)}"?`;
    if (hasHistory) msg += ` This will also remove its ${target.movements.length} stock movement record(s).`;
    if (usedIn.length > 0) {
      msg = `"${itemName(target)}" is used in ${usedIn.length} menu recipe${usedIn.length > 1 ? "s" : ""} (${usedIn.join(", ")}).\n\nDeleting it may break those recipes${hasHistory ? " and will remove its movement history" : ""}. Delete anyway?`;
    }
    if (!window.confirm(msg)) return;
    handleSetInventory(safeArr.filter(i => i?.id !== id));
    showToast(`${itemName(target)} deleted`, "success");
  }, [safeArr, handleSetInventory, getRecipesUsingItem, showToast]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const exportInventory = useCallback(() => {
    try {
      const rows = [
        ["Name","Category","Unit","Quantity","Min Stock","Cost/Unit","Total Value","Supplier","Status","Suggested Reorder Qty","Expiry Date","Batch No","Latest Movement Type","Latest Movement Qty","Latest Movement Date","Latest Movement Reason","Last Restock"],
        ...safeArr.map(it => {
          const qty = itemQuantity(it);
          const min = itemMinStock(it);
          const cost = itemCost(it);
          const status = safeIsOutOfStock(it) ? "Out of Stock" : safeIsLowStock(it) ? "Low Stock" : "OK";
          const suggestQty = qty > min ? 0 : Math.max(0, Math.round(min * 3 - qty));
          const mv = Array.isArray(it?.movements) && it.movements.length > 0 ? it.movements[0] : null;
          return [
            itemName(it),
            itemCategory(it),
            itemUnit(it),
            qty,
            min,
            cost,
            qty * cost,
            itemSupplier(it),
            status,
            suggestQty > 0 ? `${suggestQty} ${itemUnit(it)}` : "",
            it?.expiryDate || "",
            it?.batchNo || "",
            mv?.type || "",
            mv?.qty ?? "",
            mv?.createdAt ? new Date(mv.createdAt).toLocaleString() : "",
            mv?.reason || "",
            it?.lastRestock || "",
          ];
        }),
      ];
      const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Inventory exported to CSV", "success");
    } catch (err) {
      showToast("Export failed — please try again", "error");
    }
  }, [safeArr, showToast]);

  const openAdjustmentModal = (item) => {
    setAdjustmentError("");
    setAdjustmentModal({
      item,
      type: "RESTOCK",
      quantity: "",
      reason: "",
      staff: "",
      note: ""
    });
  };

  const handleAdjustment = () => {
    if (!adjustmentModal) return;
    setAdjustmentError("");
    try {
      const { item, type, quantity, reason, note } = adjustmentModal;
      const qtyChange = Number(quantity);
      const isCorrection = type === "CORRECTION";
      if (quantity === "" || !Number.isFinite(qtyChange) || (!isCorrection && qtyChange <= 0) || (isCorrection && qtyChange < 0)) {
        return setAdjustmentError(isCorrection ? "Please enter a valid final quantity (0 or greater)" : "Please enter a valid quantity greater than 0");
      }

      const reasonText = (reason || note || "").trim();
      if ((type === "WASTAGE" || type === "CORRECTION") && !reasonText) {
        return setAdjustmentError("A reason is required for wastage and correction adjustments");
      }

      const current = safeArr.find(i => i?.id === item?.id);
      if (!current) return setAdjustmentError("Item not found");
      const previousQty = itemQuantity(current);
      const now = new Date().toISOString();
      let newQty;
      let movementType;

      if (type === "RESTOCK") {
        newQty = previousQty + qtyChange;
        movementType = "restock";
      } else if (type === "WASTAGE") {
        if (qtyChange > previousQty) return setAdjustmentError(`Wastage cannot exceed available stock (${previousQty} ${itemUnit(current)})`);
        newQty = previousQty - qtyChange;
        movementType = "wastage";
      } else if (type === "CORRECTION") {
        newQty = qtyChange; // final quantity set directly
        movementType = "correction";
      } else {
        // RETURN/Reduce — treated as a reduction movement
        if (qtyChange > previousQty) return setAdjustmentError(`Cannot reduce more than available stock (${previousQty} ${itemUnit(current)})`);
        newQty = previousQty - qtyChange;
        movementType = "reduce";
      }

      if (newQty < 0) return setAdjustmentError("This adjustment would take stock below zero");

      const movementQty = movementType === "correction" ? Math.abs(newQty - previousQty) : qtyChange;
      const movements = addMovement(current, { type: movementType, qty: movementQty, previousQty, newQty, reason: reasonText });
      const updatedInventory = safeArr.map(i => i?.id === item?.id ? {
        ...i,
        quantity: newQty,
        lastRestock: movementType === "restock" ? now.split("T")[0] : (i?.lastRestock || now.split("T")[0]),
        updatedAt: now,
        movements,
      } : i);

      handleSetInventory(updatedInventory);
      showToast(`${type === "WASTAGE" ? "Wastage recorded" : type === "CORRECTION" ? "Correction applied" : type === "RESTOCK" ? "Stock restocked" : "Stock reduced"} for ${itemName(current)}`, "success");
      setAdjustmentModal(null);
    } catch (err) {
      setAdjustmentError("Something went wrong applying this adjustment. Please try again.");
    }
  };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, background: C.bg1, border: `1px solid ${toast.type === "error" ? C.redBorder : C.border2}`, borderLeft: `3px solid ${toast.type === "error" ? C.red : C.green}`, borderRadius: 8, padding: "10px 16px", fontSize: 12, color: C.text1, boxShadow: "0 4px 20px rgba(0,0,0,.4)", maxWidth: 280, animation: "fadeInUp .18s ease" }}>
          {toast.msg}
        </div>
      )}

      {/* Summary Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 1, marginBottom: 18, border: `1px solid ${C.border2}`, borderRadius: 12, overflow: "hidden", background: C.border2 }}>
        {[
          { label: "Items", val: safeArr.length, color: C.text1, sub: "in stock" },
          { label: "Low Stock", val: lowStockCount, color: lowStockCount > 0 ? C.amber : C.text3, sub: lowStockCount > 0 ? "need reorder" : "all clear", alert: lowStockCount > 0 },
          { label: "Out of Stock", val: outOfStockCount, color: outOfStockCount > 0 ? C.red : C.text3, sub: outOfStockCount > 0 ? "blocked items" : "all clear", alert: outOfStockCount > 0 },
          { label: "Total Value", val: fmtCurrency(totalValue), color: C.green, sub: "on hand", mono: true },
          { label: "Suppliers", val: totalSuppliers, color: C.blue, sub: "active" },
          { label: "Categories", val: INVENTORY_CATEGORIES.length - 1, color: C.text2, sub: "tracked" },
        ].map((m, i) => (
          <div key={m.label} style={{ background: C.bg2, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 3, position: "relative" }}>
            {m.alert && <div style={{ position: "absolute", top: 10, right: 10, width: 6, height: 6, borderRadius: "50%", background: m.color, boxShadow: `0 0 6px ${m.color}` }} />}
            <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: m.mono ? "monospace" : "inherit", color: m.color, lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.text3, pointerEvents: "none" }}>⌕</span>
            <input style={{ ...input, paddingLeft: 26, width: 170, fontSize: 12 }} placeholder="Search items, suppliers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 4, padding: "3px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border2}` }}>
            {INVENTORY_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: categoryFilter === cat ? C.bg1 : "transparent", color: categoryFilter === cat ? C.amber2 : C.text3, fontSize: 11, fontWeight: categoryFilter === cat ? 600 : 400, cursor: "pointer", transition: "all .15s", boxShadow: categoryFilter === cat ? `0 1px 3px rgba(0,0,0,.3), inset 0 0 0 1px ${C.border2}` : "none" }}>
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setShowLowStock(v => !v)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${showLowStock ? C.amber : C.border2}`, background: showLowStock ? C.amberDim : "transparent", color: showLowStock ? C.amber : C.text3, fontSize: 11, cursor: "pointer", fontWeight: showLowStock ? 600 : 400 }}>
            ⚠ Low
          </button>
          <button onClick={() => setShowOutOfStock(v => !v)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${showOutOfStock ? C.red : C.border2}`, background: showOutOfStock ? C.redBg : "transparent", color: showOutOfStock ? C.red : C.text3, fontSize: 11, cursor: "pointer", fontWeight: showOutOfStock ? 600 : 400 }}>
            ✕ Empty
          </button>
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            <select style={{ ...input, fontSize: 11, padding: "5px 8px", width: "auto" }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="name">Name</option>
              <option value="qty">Qty</option>
              <option value="value">Value</option>
              <option value="lastRestock">Restocked</option>
              <option value="status">Status</option>
              <option value="expiry">Expiry</option>
              <option value="supplier">Supplier</option>
            </select>
            <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} style={{ padding: "6px 9px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text3, fontSize: 12, cursor: "pointer" }} title={sortOrder === "asc" ? "Ascending" : "Descending"}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btn("ghost")} onClick={exportInventory} title="Export inventory to CSV">↓ CSV</button>
          <button style={btn("primary")} onClick={openAdd}>+ Add Item</button>
        </div>
      </div>

      {/* Inventory Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 8 }} className="inventory-grid">
        {sorted.map(item => {
          const itemIsLowStock = safeIsLowStock(item);
          const itemIsOutOfStock = safeIsOutOfStock(item);
          const stockPercent = item.minStock > 0 ? Math.min(100, (item.quantity / item.minStock) * 100) : 100;
          const hint = reorderHint(item);
          const suggestQty = suggestedReorderQty(item);
          const exp = expiryStatus(item);
          const accentColor = itemIsOutOfStock ? C.red : itemIsLowStock ? C.amber : C.green;
          const mvTypeIcon = { restock: "↑", wastage: "✕", correction: "≈", reduce: "↓" };
          return (
            <div key={item.id} style={{ ...card(), padding: 0, overflow: "hidden", border: `1px solid ${itemIsOutOfStock ? C.redBorder : itemIsLowStock ? C.amberBorder : C.border}`, background: C.bg2, display: "flex", flexDirection: "column" }}>
              {/* Accent bar top */}
              <div style={{ height: 3, background: accentColor, opacity: itemIsOutOfStock || itemIsLowStock ? 1 : 0.3 }} />

              <div style={{ padding: "12px 14px 0", flex: 1 }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{item.category}</span>
                      {item.batchNo && <><span style={{ opacity: .4 }}>·</span><span style={{ fontFamily: "monospace", letterSpacing: ".03em" }}>{item.batchNo}</span></>}
                    </div>
                  </div>
                  {itemIsOutOfStock
                    ? <span style={{ ...pill(C.redBg, C.red), fontSize: 9, flexShrink: 0, marginLeft: 8 }}>EMPTY</span>
                    : itemIsLowStock
                    ? <span style={{ ...pill(C.amberBg, C.amber), fontSize: 9, flexShrink: 0, marginLeft: 8 }}>LOW</span>
                    : null}
                </div>

                {/* Stock bar + qty */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: accentColor, lineHeight: 1 }}>{item.quantity}<span style={{ fontSize: 11, fontWeight: 400, color: C.text3, marginLeft: 3 }}>{item.unit}</span></span>
                    <span style={{ fontSize: 10, color: C.text3 }}>min <strong style={{ color: C.text2, fontFamily: "monospace" }}>{item.minStock}</strong></span>
                  </div>
                  <div style={{ height: 3, background: C.bg4, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: accentColor, width: `${stockPercent}%`, transition: "width .3s", opacity: itemIsOutOfStock ? 0.5 : 1 }} />
                  </div>
                </div>

                {/* Value row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "7px 0", borderTop: `1px solid ${C.border2}`, borderBottom: `1px solid ${C.border2}` }}>
                  <div>
                    <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em" }}>Cost/unit</div>
                    <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>₹{item.cost}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em" }}>On hand</div>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: C.green }}>₹{(item.quantity * item.cost).toLocaleString()}</div>
                  </div>
                </div>

                {/* Meta row: supplier + restock date */}
                <div style={{ fontSize: 10, color: C.text3, marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.supplier || "—"}</span>
                  {item.lastRestock && <span style={{ flexShrink: 0 }}>last {item.lastRestock}</span>}
                </div>

                {/* Reorder / expiry signals */}
                {(suggestQty > 0 || exp) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    {suggestQty > 0 && (
                      <span style={{ fontSize: 10, color: hint.color, background: C.bg3, border: `1px solid ${C.border2}`, borderRadius: 4, padding: "2px 7px" }}>
                        Order <strong style={{ fontFamily: "monospace" }}>{suggestQty} {itemUnit(item)}</strong>
                      </span>
                    )}
                    {exp && exp.label !== "OK" && (
                      <span style={{ ...pill(C.bg3, exp.color), fontSize: 9 }}>{exp.label}</span>
                    )}
                  </div>
                )}

                {/* Recent movements — compact inline */}
                {Array.isArray(item?.movements) && item.movements.length > 0 && (
                  <div style={{ marginBottom: 10, paddingTop: 6, borderTop: `1px solid ${C.border2}` }}>
                    {item.movements.slice(0, 2).map(mv => (
                      <div key={mv.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.text3, marginBottom: 2 }}>
                        <span style={{ fontFamily: "monospace", color: mv.type === "restock" ? C.green : mv.type === "wastage" ? C.red : C.text3 }}>{mvTypeIcon[mv.type] || "·"}</span>
                        <span style={{ fontFamily: "monospace", color: C.text2 }}>{mv.qty} {itemUnit(item)}</span>
                        <span style={{ color: C.text3 }}>{mv.type}</span>
                        <span style={{ marginLeft: "auto", flexShrink: 0 }}>{new Date(mv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div style={{ display: "flex", borderTop: `1px solid ${C.border2}`, marginTop: "auto" }}>
                <button onClick={() => openAdjustmentModal(item)} style={{ flex: 1, padding: "9px 0", border: "none", borderRight: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>Adjust</button>
                <button onClick={() => openEdit(item)} style={{ padding: "9px 14px", border: "none", borderRight: `1px solid ${C.border2}`, background: "transparent", color: C.text3, fontSize: 12, cursor: "pointer" }}>✎</button>
                <button onClick={() => deleteItem(item.id)} style={{ padding: "9px 14px", border: "none", background: "transparent", color: C.mutedRed, fontSize: 12, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: C.text3 }}>
          <div style={{ fontSize: 28, marginBottom: 10, opacity: .4 }}>▣</div>
          <div style={{ fontSize: 13, color: C.text2, fontWeight: 500, marginBottom: 6 }}>
            {search || categoryFilter !== "All" || showLowStock || showOutOfStock ? "No items match these filters" : "No inventory yet"}
          </div>
          <div style={{ fontSize: 11, color: C.text3 }}>
            {search ? `No results for "${search}"` : showLowStock ? "All items are well-stocked" : showOutOfStock ? "Nothing's out of stock" : "Add your first item to start tracking stock"}
          </div>
          {(search || categoryFilter !== "All" || showLowStock || showOutOfStock) && (
            <button onClick={() => { setSearch(""); setCategoryFilter("All"); setShowLowStock(false); setShowOutOfStock(false); }} style={{ marginTop: 14, padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>Clear filters</button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(2px)" }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 16, padding: 24, width: "min(420px,95vw)", maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border2}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>{editItem ? "Edit Item" : "New Inventory Item"}</div>
                {editItem && <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>Changes save immediately</div>}
              </div>
              <button style={{ padding: "4px 8px", border: `1px solid ${C.border2}`, borderRadius: 6, background: "transparent", color: C.text3, cursor: "pointer", fontSize: 14, lineHeight: 1 }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Name *</label>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Category</label>
                <select style={{ ...input }} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {INVENTORY_CATEGORIES.filter(c => c !== "All").map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Unit</label>
                <input style={input} value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="kg, liters, pieces" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Quantity *</label>
                <input style={input} type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={label}>Min Stock</label>
                <input style={input} type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Cost per Unit *</label>
                <input style={input} type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={label}>Supplier</label>
                <select style={{ ...input }} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                  <option value="">Select supplier</option>
                  {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Expiry Date <span style={{ fontSize: 10, color: C.text3 }}>(optional)</span></label>
                <input style={input} type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
              <div>
                <label style={label}>Batch No. <span style={{ fontSize: 10, color: C.text3 }}>(optional)</span></label>
                <input style={input} value={form.batchNo} onChange={e => setForm({ ...form, batchNo: e.target.value })} placeholder="e.g. B-2024-07" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveItem}>{editItem ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 12, boxSizing: "border-box", backdropFilter: "blur(2px)" }} onClick={() => setAdjustmentModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 16, padding: 24, width: "min(450px,95vw)", maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border2}` }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text1 }}>Stock Adjustment</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>Logged to movement history</div>
              </div>
              <button style={{ padding: "4px 8px", border: `1px solid ${C.border2}`, borderRadius: 6, background: "transparent", color: C.text3, cursor: "pointer", fontSize: 14, lineHeight: 1 }} onClick={() => setAdjustmentModal(null)}>✕</button>
            </div>
            <div style={{ marginBottom: 16, padding: "10px 14px", background: C.bg3, borderRadius: 8, border: `1px solid ${C.border2}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>{adjustmentModal.item.name}</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{adjustmentModal.item.category}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: C.amber2, lineHeight: 1 }}>{adjustmentModal.item.quantity}</div>
                <div style={{ fontSize: 10, color: C.text3 }}>{adjustmentModal.item.unit} on hand</div>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Adjustment Type</label>
              <select style={{ ...input }} value={adjustmentModal.type} onChange={e => { setAdjustmentError(""); setAdjustmentModal({ ...adjustmentModal, type: e.target.value }); }}>
                <option value="RESTOCK">Restock (Add stock)</option>
                <option value="WASTAGE">Wastage (Remove stock)</option>
                <option value="CORRECTION">Correction (Set exact quantity)</option>
                <option value="RETURN">Reduce (Use / Return to supplier)</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>{adjustmentModal.type === "CORRECTION" ? "New Quantity (exact) *" : "Quantity Change *"}</label>
              <input style={input} type="number" min="0" value={adjustmentModal.quantity} onChange={e => { setAdjustmentError(""); setAdjustmentModal({ ...adjustmentModal, quantity: e.target.value }); }} placeholder={adjustmentModal.type === "CORRECTION" ? "Enter final quantity" : "Enter quantity to add/remove"} />
            </div>
            {(() => {
              const qtyChange = Number(adjustmentModal.quantity);
              if (adjustmentModal.quantity === "" || !Number.isFinite(qtyChange)) return null;
              const previousQty = itemQuantity(adjustmentModal.item);
              let projected;
              if (adjustmentModal.type === "RESTOCK") projected = previousQty + qtyChange;
              else if (adjustmentModal.type === "CORRECTION") projected = qtyChange; // direct final quantity
              else projected = previousQty - qtyChange;
              const projectedInvalid = projected < 0;
              return (
                <div style={{ marginBottom: 12, fontSize: 11, color: projectedInvalid ? C.red : C.text3 }}>
                  Projected quantity: <strong style={{ color: projectedInvalid ? C.red : C.text2 }}>{Math.max(0, Math.round(projected * 100) / 100)}</strong> {adjustmentModal.item.unit}
                  {projectedInvalid && " — cannot go below 0"}
                </div>
              );
            })()}
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Reason {(adjustmentModal.type === "WASTAGE" || adjustmentModal.type === "CORRECTION") && <span style={{ color: C.red }}>*</span>}</label>
              <input style={input} value={adjustmentModal.reason} onChange={e => { setAdjustmentError(""); setAdjustmentModal({ ...adjustmentModal, reason: e.target.value }); }} placeholder="Reason for adjustment" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Staff</label>
              <input style={input} value={adjustmentModal.staff} onChange={e => setAdjustmentModal({ ...adjustmentModal, staff: e.target.value })} placeholder="Staff name" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Note</label>
              <textarea style={{ ...input, resize: "none", wordBreak: "break-word" }} rows={2} value={adjustmentModal.note} onChange={e => setAdjustmentModal({ ...adjustmentModal, note: e.target.value })} placeholder="Additional notes" />
            </div>
            {adjustmentError && (
              <div style={{ marginBottom: 12, padding: "8px 10px", borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.mutedRed, fontSize: 12, wordBreak: "break-word" }}>
                {adjustmentError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button style={btn("ghost")} onClick={() => setAdjustmentModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={handleAdjustment}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
