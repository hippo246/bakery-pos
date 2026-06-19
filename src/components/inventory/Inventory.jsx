import { useState } from "react";
import { C, card, btn, input, label } from "../../styles/theme";
import { INIT_INVENTORY, INVENTORY_CATEGORIES, SUPPLIERS } from "../../data/inventoryConstants";

export default function Inventory() {
  const [inventory, setInventory] = useState(INIT_INVENTORY);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Ingredients", quantity: "", unit: "pieces", minStock: "", cost: "", supplier: "" });
  const [showLowStock, setShowLowStock] = useState(false);

  const filtered = inventory.filter(item => {
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesSearch = !search.trim() || item.name.toLowerCase().includes(search.toLowerCase()) || item.supplier.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !showLowStock || item.quantity <= item.minStock;
    return matchesCategory && matchesSearch && matchesLowStock;
  });

  const lowStockCount = inventory.filter(i => i.quantity <= i.minStock).length;
  const totalValue = inventory.reduce((sum, i) => sum + (i.quantity * i.cost), 0);

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
    if (editItem) {
      setInventory(inventory.map(i => i.id === editItem ? { ...i, ...itemData } : i));
    } else {
      setInventory([...inventory, { ...itemData, id: "inv-" + Date.now() }]);
    }
    setShowModal(false);
  };

  const restockItem = (id) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    const restockAmount = prompt(`Restock ${item.name}. Current: ${item.quantity} ${item.unit}. Add amount:`);
    if (restockAmount && !isNaN(restockAmount)) {
      setInventory(inventory.map(i => i.id === id ? { ...i, quantity: i.quantity + Number(restockAmount), lastRestock: new Date().toISOString().split("T")[0] } : i));
    }
  };

  const deleteItem = (id) => {
    if (!window.confirm("Delete this inventory item?")) return;
    setInventory(inventory.filter(i => i.id !== id));
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Items", val: inventory.length, color: C.amber2 },
          { label: "Low Stock", val: lowStockCount, color: lowStockCount > 0 ? C.red : C.green },
          { label: "Total Value", val: "₹" + totalValue.toLocaleString(), color: C.green },
          { label: "Categories", val: INVENTORY_CATEGORIES.length - 1, color: C.blue },
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
            <button key={cat} onClick={() => setCategoryFilter(cat)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${categoryFilter === cat ? C.amber3 : C.border2}`, background: categoryFilter === cat ? C.amberDim : C.bg3, color: categoryFilter === cat ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
              {cat}
            </button>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text2, cursor: "pointer" }}>
            <input type="checkbox" checked={showLowStock} onChange={e => setShowLowStock(e.target.checked)} />
            Low Stock Only
          </label>
        </div>
        <button style={btn("primary")} onClick={openAdd}>＋ Add Item</button>
      </div>

      {/* Inventory Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
        {filtered.map(item => {
          const isLowStock = item.quantity <= item.minStock;
          const stockPercent = (item.quantity / item.minStock) * 100;
          return (
            <div key={item.id} style={{ ...card(), padding: "14px", border: `1px solid ${isLowStock ? "#3a1a1a" : C.border}`, background: isLowStock ? "#1a0d0d" : C.bg2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{item.category}</div>
                </div>
                {isLowStock && <span style={{ ...pill("#2a0808", C.red), fontSize: 9 }}>LOW STOCK</span>}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Quantity</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: isLowStock ? C.red : C.amber2 }}>{item.quantity} {item.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Min Stock</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>{item.minStock} {item.unit}</div>
                </div>
              </div>

              <div style={{ height: 4, background: C.bg4, borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: isLowStock ? C.red : stockPercent < 150 ? C.amber : C.green, width: `${Math.min(100, stockPercent)}%`, transition: "width .3s" }} />
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
                <button onClick={() => restockItem(item.id)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer" }}>📦 Restock</button>
                <button onClick={() => openEdit(item)} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>✎</button>
                <button onClick={() => deleteItem(item.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #3a1a1a", background: "transparent", color: "#884444", fontSize: 11, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.text3, fontSize: 14 }}>No inventory items found</div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 400 }} onClick={e => e.stopPropagation()}>
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
    </div>
  );
}
