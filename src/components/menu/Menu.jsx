import { useState } from "react";
import { C, pill, btn, input, label } from "../../styles/theme";
import { MENU_CATS } from "../../data/constants";

function Menu({ menuItems, setMenuItems }) {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [catFilter, setCatFilter] = useState("ALL");
  const [form, setForm] = useState({ name: "", price: "", cat: "Coffee", desc: "", emoji: "☕", popular: false });

  const [menuSearch, setMenuSearch] = useState("");
  const filtered = (catFilter === "ALL" ? menuItems : menuItems.filter(m => m.cat === catFilter))
    .filter(m => !menuSearch.trim() || m.name.toLowerCase().includes(menuSearch.toLowerCase()) || m.desc.toLowerCase().includes(menuSearch.toLowerCase()));

  const cats = MENU_CATS;
  const activeCount = menuItems.filter(m => m.active).length;
  const eightySixedCount = menuItems.filter(m => m.eightySixed).length;

  const toggleActive = (id) => setMenuItems(menuItems.map(m => m.id === id ? { ...m, active: !m.active } : m));
  const togglePopular = (id) => setMenuItems(menuItems.map(m => m.id === id ? { ...m, popular: !m.popular } : m));
  const toggle86 = (id) => setMenuItems(menuItems.map(m => m.id === id ? { ...m, eightySixed: !m.eightySixed } : m));
  const deleteItem = (id) => setMenuItems(menuItems.filter(m => m.id !== id));

  const openEdit = (item) => {
    setEditItem(item.id);
    setForm({ name: item.name, price: String(item.price), cat: item.cat, desc: item.desc, emoji: item.emoji, popular: item.popular });
    setShowModal(true);
  };
  const openNew = () => {
    setEditItem(null);
    setForm({ name: "", price: "", cat: "Coffee", desc: "", emoji: "☕", popular: false });
    setShowModal(true);
  };
  const saveItem = () => {
    if (!form.name || !form.price) return alert("Name and price required");
    if (editItem) {
      setMenuItems(menuItems.map(m => m.id === editItem ? { ...m, ...form, price: Number(form.price) } : m));
    } else {
      setMenuItems([...menuItems, { ...form, id: "m" + Date.now(), price: Number(form.price), active: true }]);
    }
    setShowModal(false);
  };

  const [editingPrice, setEditingPrice] = useState(null);
  const [priceVal, setPriceVal] = useState("");

  return (
    <div>
      {/* Header Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
            <input style={{ ...input, paddingLeft: 28, width: 160 }} placeholder="Search menu…" value={menuSearch} onChange={e => setMenuSearch(e.target.value)} />
          </div>
          {cats.map(cat => {
            const catCount = menuItems.filter(m => (cat === "ALL" || m.cat === cat)).length;
            return (
            <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${catFilter === cat ? C.amber3 : C.border2}`, background: catFilter === cat ? C.amberDim : C.bg3, color: catFilter === cat ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, minHeight: 44 }}>
              {cat}
              <span style={{ fontSize: 10, fontFamily: "monospace", background: catFilter === cat ? C.amber3 : C.bg4, color: catFilter === cat ? C.amber2 : C.text3, padding: "2px 5px", borderRadius: 3 }}>{catCount}</span>
            </button>
          )})}
          <span style={{ fontSize: 11, color: C.text3, marginLeft: 8 }}>{activeCount}/{menuItems.length} active{eightySixedCount > 0 && <span style={{ color: C.warning, marginLeft: 6 }}>· {eightySixedCount} 86'd</span>}</span>
        </div>
        <button style={btn("primary")} onClick={openNew}>＋ Add Item</button>
      </div>

      {/* Menu Grid */}
      {cats.filter(c => c !== "ALL" && (catFilter === "ALL" || catFilter === c)).map(cat => {
        const items = filtered.filter(m => m.cat === cat);
        if (!items.length) return null;
        return (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
              {cat}
              <span style={{ color: C.text3, fontWeight: 400, letterSpacing: 0, fontSize: 11 }}>({items.filter(m => m.active).length} active)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }} className="menu-grid">
              {items.map(m => (
                <div key={m.id} style={{ background: m.eightySixed ? C.redBg : m.active ? C.bg2 : C.bg3, border: `1px solid ${m.eightySixed ? C.redBorder : C.border}`, borderRadius: 12, padding: "12px 14px", opacity: m.active && !m.eightySixed ? 1 : 0.6, transition: "opacity .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 22 }}>{m.emoji}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {m.popular && <span style={{ ...pill(C.amberBg, C.amber), fontSize: 9 }}>★ TOP</span>}
                      {m.eightySixed && <span style={{ ...pill(C.redBg, C.red), fontSize: 9 }}>86'D</span>}
                      <span style={{ ...pill(m.active ? C.greenBg : C.redBg, m.active ? C.green : C.red), fontSize: 9 }}>{m.active ? "ACTIVE" : "OFF"}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginBottom: 8, lineHeight: 1.4 }}>{m.desc}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {editingPrice === m.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 13, color: C.text3 }}>₹</span>
                        <input type="number" autoFocus style={{ ...input, padding: "2px 6px", width: 64, fontSize: 14, fontFamily: "monospace", color: C.amber2, fontWeight: 700 }} value={priceVal} onChange={e => setPriceVal(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { setMenuItems(menuItems.map(x => x.id === m.id ? { ...x, price: Number(priceVal) } : x)); setEditingPrice(null); } if (e.key === "Escape") setEditingPrice(null); }}
                          onBlur={() => { setMenuItems(menuItems.map(x => x.id === m.id ? { ...x, price: Number(priceVal) } : x)); setEditingPrice(null); }} />
                      </div>
                    ) : (
                      <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: C.amber2, cursor: "pointer", borderBottom: `1px dashed ${C.amber3}` }} title="Click to edit price" onClick={() => { setEditingPrice(m.id); setPriceVal(String(m.price)); }}>₹{m.price}</div>
                    )}
                    <div style={{ display: "flex", gap: 5 }}>
                      <button onClick={() => togglePopular(m.id)} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: m.popular ? C.amber : C.text3, fontSize: 11, cursor: "pointer" }} title="Toggle popular">★</button>
                      <button onClick={() => openEdit(m)} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>✎</button>
                      <button onClick={() => toggle86(m.id)} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${m.eightySixed ? C.redBorder : C.greenBorder}`, background: "transparent", color: m.eightySixed ? C.red : C.text3, fontSize: 10, cursor: "pointer", fontWeight: 700 }} title="86 (out of stock)">{m.eightySixed ? "↺" : "86"}</button>
                      <button onClick={() => toggleActive(m.id)} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${m.active ? C.redBorder : C.greenBorder}`, background: "transparent", color: m.active ? C.red : C.green, fontSize: 11, cursor: "pointer" }}>{m.active ? "×" : "✓"}</button>
                      <button onClick={() => deleteItem(m.id)} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.mutedRed, fontSize: 11, cursor: "pointer" }} title="Delete item">🗑</button>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(380px,95vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editItem ? "Edit Item" : "Add Menu Item"}</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Name *</label>
                <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
              </div>
              <div>
                <label style={label}>Emoji</label>
                <input style={{ ...input, textAlign: "center", fontSize: 18 }} value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })} placeholder="☕" maxLength={2} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Price (₹) *</label>
                <input style={input} type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>
              <div>
                <label style={label}>Category</label>
                <select style={{ ...input }} value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                  <option>Coffee</option>
                  <option>Special</option>
                  <option>Food</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Description</label>
              <input style={input} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} placeholder="Short description…" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <input type="checkbox" id="pop" checked={form.popular} onChange={e => setForm({ ...form, popular: e.target.checked })} />
              <label htmlFor="pop" style={{ fontSize: 12, color: C.text2, cursor: "pointer" }}>Mark as Popular ★</label>
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

export default Menu;
