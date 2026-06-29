import { useState, useMemo, useCallback, useEffect } from "react";
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
  const [form, setForm] = useState({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "" });
  const [showLowStock, setShowLowStock] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [adjustmentModal, setAdjustmentModal] = useState(null);

  // Memoized filtered inventory
  const filtered = useMemo(() => {
    return inventory.filter(item => {
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesSearch = !search.trim() || item.name.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
      const matchesLowStock = !showLowStock || isLowStock(item);
      const matchesOutOfStock = !showOutOfStock || isOutOfStock(item);
      return matchesCategory && matchesSearch && matchesLowStock && matchesOutOfStock;
    });
  }, [inventory, categoryFilter, search, showLowStock, showOutOfStock]);

  // Memoized sorted inventory
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "qty") comparison = a.quantity - b.quantity;
      else if (sortBy === "value") comparison = (a.quantity * a.cost) - (b.quantity * b.cost);
      else if (sortBy === "lastRestock") comparison = new Date(a.lastRestock || 0) - new Date(b.lastRestock || 0);
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filtered, sortBy, sortOrder]);

  const lowStockCount = getLowStockItems(inventory).length;
  const outOfStockCount = getOutOfStockItems(inventory).length;
  const totalValue = getTotalInventoryValue(inventory);
  const totalSuppliers = new Set(inventory.map(i => i.supplier)).size;

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item.id);
    setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, minStock: String(item.minStock), cost: String(item.cost), supplier: item.supplier });
    setShowModal(true);
  };

  const saveItem = () => {
    if (!form.name || !form.quantity || !form.cost) return alert("Name, quantity, and cost are required");
    const itemData = {
      ...form,
      quantity: Number(form.quantity),
      minStock: Number(form.minStock),
      cost: Number(form.cost),
      lastRestock: new Date().toISOString().split("T")[0],
    };
    const normalizedItem = normalizeInventoryItem(itemData);
    if (editItem) {
      handleSetInventory(inventory.map(i => i.id === editItem ? { ...normalizedItem, id: editItem } : i));
    } else {
      handleSetInventory([...inventory, { ...normalizedItem, id: "inv-" + Date.now() }]);
    }
    setShowModal(false);
  };

  const restockItem = useCallback((id) => {
    const restockAmount = prompt(`Enter amount to restock:`);
    if (restockAmount && !isNaN(restockAmount) && Number(restockAmount) > 0) {
      const updatedInventory = restockInventoryItem(inventory, id, Number(restockAmount));
      handleSetInventory(updatedInventory);
    }
  }, [inventory, handleSetInventory]);

  const deleteItem = useCallback((id) => {
    if (!window.confirm("Delete this inventory item?")) return;
    handleSetInventory(inventory.filter(i => i.id !== id));
  }, [inventory, handleSetInventory]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const openAdjustmentModal = (item) => {
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
    const { item, type, quantity, reason, staff, note } = adjustmentModal;
    if (!quantity || isNaN(quantity)) return alert("Please enter a valid quantity");

    const qtyChange = Number(quantity);
    let updatedInventory = [...inventory];

    if (type === "RESTOCK") {
      updatedInventory = restockInventoryItem(updatedInventory, item.id, qtyChange);
    } else if (type === "WASTAGE" || type === "CORRECTION" || type === "RETURN") {
      const itemIndex = updatedInventory.findIndex(i => i.id === item.id);
      if (itemIndex >= 0) {
        const newQty = Math.max(0, updatedInventory[itemIndex].quantity - qtyChange);
        updatedInventory[itemIndex] = {
          ...updatedInventory[itemIndex],
          quantity: newQty,
          lastRestock: new Date().toISOString().split("T")[0]
        };
      }
    }

    handleSetInventory(updatedInventory);
    setAdjustmentModal(null);
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-6" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Items", val: inventory.length, color: C.amber2 },
          { label: "Low Stock", val: lowStockCount, color: lowStockCount > 0 ? C.red : C.green },
          { label: "Out of Stock", val: outOfStockCount, color: outOfStockCount > 0 ? C.red : C.green },
          { label: "Total Value", val: "₹" + totalValue.toLocaleString(), color: C.green },
          { label: "Suppliers", val: totalSuppliers, color: C.blue },
          { label: "Categories", val: INVENTORY_CATEGORIES.length - 1, color: C.purple },
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
            <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search inventory…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {INVENTORY_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${categoryFilter === cat ? C.amber3 : C.border2}`, background: categoryFilter === cat ? C.amberDim : C.bg3, color: categoryFilter === cat ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }}>
              {cat}
            </button>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text2, cursor: "pointer", minHeight: 44 }}>
            <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} />
            Low Stock Only
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text2, cursor: "pointer", minHeight: 44 }}>
            <input type="checkbox" checked={showOutOfStock} onChange={e => setShowOutOfStock(e.target.checked)} />
            Out of Stock Only
          </label>
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", width: "auto", minHeight: 44 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="name">Sort: Name</option>
            <option value="qty">Sort: Quantity</option>
            <option value="value">Sort: Value</option>
            <option value="lastRestock">Sort: Last Restock</option>
          </select>
          <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }}>
            {sortOrder === "asc" ? "↑" : "↓"}
          </button>
        </div>
        <button style={btn("primary")} onClick={openAdd}>＋ Add Item</button>
      </div>

      {/* Inventory Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }} className="inventory-grid">
        {sorted.map(item => {
          const itemIsLowStock = isLowStock(item);
          const itemIsOutOfStock = isOutOfStock(item);
          const stockPercent = item.minStock > 0 ? (item.quantity / item.minStock) * 100 : 100;
          return (
            <div key={item.id} style={{ ...card(), padding: "14px", border: `1px solid ${itemIsOutOfStock ? C.redBorder : itemIsLowStock ? C.amberBorder : C.border}`, background: itemIsOutOfStock ? C.redBg : itemIsLowStock ? C.amberBg : C.bg2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{item.category}</div>
                </div>
                {itemIsOutOfStock && <span style={{ ...pill(C.redBg, C.red), fontSize: 9 }}>OUT OF STOCK</span>}
                {itemIsLowStock && !itemIsOutOfStock && <span style={{ ...pill(C.amberBg, C.amber), fontSize: 9 }}>LOW STOCK</span>}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Quantity</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: itemIsOutOfStock ? C.red : itemIsLowStock ? C.amber : C.amber2 }}>{item.quantity} {item.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Min Stock</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>{item.minStock} {item.unit}</div>
                </div>
              </div>

              <div style={{ height: 4, background: C.bg4, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: itemIsOutOfStock ? C.red : itemIsLowStock ? C.amber : stockPercent < 150 ? C.amber : C.green, width: `${Math.min(100, stockPercent)}%`, transition: "width .3s" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Cost/Unit</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>₹{item.cost}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Total Value</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.green }}>₹{(item.quantity * item.cost).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ fontSize: 10, color: C.text3, marginBottom: 12 }}>
                Supplier: {item.supplier} · Last: {item.lastRestock}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openAdjustmentModal(item)} style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", minHeight: 44 }}>⚙ Adjust</button>
                <button onClick={() => openEdit(item)} style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer", minHeight: 44 }}>✎</button>
                <button onClick={() => deleteItem(item.id)} style={{ padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.mutedRed, fontSize: 11, cursor: "pointer", minHeight: 44 }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.text3, fontSize: 14 }}>No inventory items found</div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(400px,95vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editItem ? "Edit Item" : "Add Inventory Item"}</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
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
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveItem}>{editItem ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustmentModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setAdjustmentModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(450px,95vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Stock Adjustment</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setAdjustmentModal(null)}>×</span>
            </div>
            <div style={{ marginBottom: 16, padding: 12, background: C.bg3, borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{adjustmentModal.item.name}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>Current: {adjustmentModal.item.quantity} {adjustmentModal.item.unit}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Adjustment Type</label>
              <select style={{ ...input }} value={adjustmentModal.type} onChange={e => setAdjustmentModal({ ...adjustmentModal, type: e.target.value })}>
                <option value="RESTOCK">Restock (Add stock)</option>
                <option value="WASTAGE">Wastage (Remove stock)</option>
                <option value="CORRECTION">Correction (Adjust stock)</option>
                <option value="RETURN">Return to Supplier</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Quantity Change *</label>
              <input style={input} type="number" value={adjustmentModal.quantity} onChange={e => setAdjustmentModal({ ...adjustmentModal, quantity: e.target.value })} placeholder="Enter quantity" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Reason</label>
              <input style={input} value={adjustmentModal.reason} onChange={e => setAdjustmentModal({ ...adjustmentModal, reason: e.target.value })} placeholder="Reason for adjustment" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Staff</label>
              <input style={input} value={adjustmentModal.staff} onChange={e => setAdjustmentModal({ ...adjustmentModal, staff: e.target.value })} placeholder="Staff name" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label}>Note</label>
              <textarea style={{ ...input, resize: "none" }} rows={2} value={adjustmentModal.note} onChange={e => setAdjustmentModal({ ...adjustmentModal, note: e.target.value })} placeholder="Additional notes" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setAdjustmentModal(null)}>Cancel</button>
              <button style={btn("primary")} onClick={handleAdjustment}>Apply Adjustment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
