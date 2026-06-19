import { useState } from "react";
import { C, pill, card, btn, input, label, STATUS_FLOW, STATUS_FLOW_LABEL, STATUS_COLORS, SRC_COLORS, PEAK_SOP, MENU_CATS } from "../../styles/theme";
import { INIT_TABLES } from "../../data/tableConstants";

function Orders({ orders, setOrders, kdsCards, setKdsCards, menuItems }) {
  console.log("Orders component rendering", { orders, menuItems });

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newItems, setNewItems] = useState({});
  const [newSource, setNewSource] = useState("WALK_IN");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newPay, setNewPay] = useState("PAID");
  const [editingItems, setEditingItems] = useState(null);
  const [itemsVal, setItemsVal] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const SOURCE_FILTERS = ["ALL", "WALK_IN", "SWIGGY", "ZOMATO", "DIRECT_DELIVERY"];

  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const advanceSelected = () => {
    setOrders(orders.map(o => selected.has(o.id) && STATUS_FLOW[o.status] ? { ...o, status: STATUS_FLOW[o.status] } : o));
    setSelected(new Set());
  };
  const cancelSelected = () => {
    setOrders(orders.map(o => selected.has(o.id) && ["NEW","ACCEPTED","PREPARING"].includes(o.status) ? { ...o, status: "CANCELLED" } : o));
    setSelected(new Set());
  };
  const STATUS_FILTERS = ["NEW", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "COMPLETED"];

  const isStatusFilter = (f) => STATUS_FILTERS.includes(f);
  const isSrcFilter = (f) => SOURCE_FILTERS.slice(1).includes(f);

  let filtered = orders;
  if (filter !== "ALL") {
    if (isStatusFilter(filter)) filtered = orders.filter((o) => o.status === filter);
    else if (isSrcFilter(filter)) filtered = orders.filter((o) => o.source === filter);
  }
  if (search.trim()) filtered = filtered.filter((o) => o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase()));

  const updateStatus = (id, status) => setOrders(orders.map((o) => o.id === id ? { ...o, status } : o));

  const totalItems = Object.values(newItems).reduce((a, b) => a + b, 0);
  const totalAmt = Object.entries(newItems).reduce((sum, [id, qty]) => {
    const item = menuItems.find((m) => m.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const adjustQty = (item, delta) => {
    setNewItems((prev) => {
      const cur = prev[item.id] || 0;
      const next = cur + delta;
      if (next <= 0) { const { [item.id]: _, ...rest } = prev; return rest; }
      return { ...prev, [item.id]: next };
    });
  };

  const placeOrder = () => {
    if (!totalItems) return alert("Add at least one item");
    const id = "ORD-" + String(orders.length + 1).padStart(3, "0");
    const itemStr = Object.entries(newItems).map(([mid, qty]) => {
      const m = menuItems.find((x) => x.id === mid);
      return `${m.name} × ${qty}`;
    }).join(", ");
    
    const finalAmount = totalAmt - discountAmount;
    
    setOrders([{ 
      id, 
      source: newSource, 
      customer: newName || "Guest", 
      items: itemStr, 
      amount: finalAmount, 
      originalAmount: totalAmt,
      status: "NEW", 
      time: 0, 
      payStatus: newPay,
      table: selectedTable,
      staff: selectedStaff,
      discount: appliedDiscount,
      discountAmount: discountAmount,
      splitBill: showSplitBill ? splitCount : null
    }, ...orders]);
    
    setKdsCards([{ 
      id, 
      source: newSource, 
      station: newSource === "WALK_IN" ? "Bar" : "Bar", 
      items: Object.entries(newItems).map(([mid, qty]) => ({ name: menuItems.find((x) => x.id === mid)?.name, qty, mod: "" })), 
      note: newNotes, 
      startedAt: Date.now(), 
      urgency: "urgent",
      table: selectedTable,
      staff: selectedStaff
    }, ...kdsCards]);
    
    // Reset form
    setShowModal(false); 
    setNewItems({}); 
    setNewName(""); 
    setNewPhone(""); 
    setNewNotes(""); 
    setNewPay("PAID");
    setSelectedTable(null);
    setSelectedStaff(null);
    setShowSplitBill(false);
    setSplitCount(2);
    setAppliedDiscount(null);
    setDiscountAmount(0);
  };

  const counts = {};
  orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

  const srcLabel = (s) => ({ WALK_IN: "Walk-in", SWIGGY: "Swiggy", ZOMATO: "Zomato", DIRECT_DELIVERY: "Delivery" }[s] || s);

  return (
    <div>
      {/* Summary Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Active Orders", val: orders.filter(o => !["COMPLETED","CANCELLED"].includes(o.status)).length, color: C.amber2 },
          { label: "Need Action", val: (counts["NEW"] || 0) + (counts["READY"] || 0), color: C.red },
          { label: "Today's Revenue", val: "₹" + orders.filter(o => o.status !== "CANCELLED").reduce((s, o) => s + o.amount, 0).toLocaleString(), color: C.green },
          { label: "Avg Order", val: "₹" + Math.round(orders.filter(o=>o.status!=="CANCELLED").reduce((s,o)=>s+o.amount,0) / Math.max(1, orders.filter(o=>o.status!=="CANCELLED").length)), color: C.blue },
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Peak SOP Alerts */}
      {(() => {
        const sops = PEAK_SOP.filter(s => counts[s.stat] >= s.threshold);
        if (!sops.length) return null;
        return (
          <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            {sops.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 9, background: s.level === "alert" ? "#2a0808" : "#281f00", border: `1px solid ${s.level === "alert" ? "#5a1a1a" : "#4a3800"}` }}>
                <span style={{ fontSize: 15 }}>{s.level === "alert" ? "🔴" : "🟡"}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.level === "alert" ? C.red : C.amber, marginRight: 8 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: C.text2 }}>{s.msg}</span>
                </div>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{counts[s.stat]} / {s.threshold}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
            <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {["ALL", "NEW", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "WALK_IN", "SWIGGY", "ZOMATO", "DIRECT_DELIVERY"].map((f) => {
            const active = filter === f;
            const count = f === "ALL" ? orders.length : f === "WALK_IN" || f === "SWIGGY" || f === "ZOMATO" || f === "DIRECT_DELIVERY"
              ? orders.filter(o => o.source === f).length
              : orders.filter(o => o.status === f).length;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 11px", borderRadius: 6, border: `1px solid ${active ? C.amber3 : C.border2}`, background: active ? C.amberDim : C.bg3, color: active ? C.amber2 : C.text2, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                {f === "ALL" ? "All" : f === "WALK_IN" ? "Walk-in" : f === "DIRECT_DELIVERY" ? "Delivery" : f.charAt(0) + f.slice(1).toLowerCase().replace("_", " ")}
                {count > 0 && <span style={{ background: active ? C.amber3 : C.bg4, color: active ? C.amber2 : C.text3, fontSize: 9, padding: "0 4px", borderRadius: 3, fontFamily: "monospace" }}>{count}</span>}
              </button>
            );
          })}
        </div>
        <button style={btn("primary")} onClick={() => setShowModal(true)}>＋ New Order</button>
      </div>

      {selected.size > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.amberDim, border: `1px solid ${C.amber3}`, borderRadius: 8, padding: "8px 14px", marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.amber2, fontFamily: "monospace", fontWeight: 700 }}>{selected.size} selected</span>
          <button style={{ ...btn("primary"), fontSize: 11, padding: "5px 12px" }} onClick={advanceSelected}>⏩ Advance All</button>
          <button style={{ ...btn("danger"), fontSize: 11 }} onClick={cancelSelected}>✕ Cancel All</button>
          <button style={{ ...btn("ghost"), fontSize: 11, marginLeft: "auto" }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}

      {/* Order List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: C.text3, fontSize: 14 }}>No orders found</div>
        )}
        {filtered.map((o) => {
          const sc = STATUS_COLORS[o.status] || {};
          const src = SRC_COLORS[o.source] || {};
          const expanded = expandedId === o.id;
          const nextStatus = STATUS_FLOW[o.status];
          const isOld = !["COMPLETED","CANCELLED"].includes(o.status) && o.time > 15;
          return (
            <div key={o.id} style={{ background: isOld ? "#1a0d0d" : C.bg2, border: `1px solid ${expanded ? C.border2 : isOld ? "#3a1a1a" : C.border}`, borderRadius: 12, overflow: "hidden", transition: "border-color .15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }} onClick={() => setExpandedId(expanded ? null : o.id)}>
                <input type="checkbox" checked={selected.has(o.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(o.id); }} onClick={e => e.stopPropagation()} style={{ accentColor: C.amber, cursor: "pointer", flexShrink: 0 }} />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text3, width: 58, flexShrink: 0 }}>{o.id}</div>
                <span style={pill(src.bg, src.color)}>{srcLabel(o.source)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.customer}</div>
                  <div style={{ fontSize: 11, color: C.text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{o.items}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.amber2 }}>₹{o.amount}</div>
                  <div style={{ fontSize: 10, color: o.payStatus === "COD" ? C.red : C.green, fontFamily: "monospace", marginTop: 1 }}>{o.payStatus}</div>
                </div>
                <span style={pill(sc.bg, sc.color, sc.border)}>{sc.label || o.status}</span>
                <div style={{ fontSize: 11, color: isOld ? C.red : C.text3, fontFamily: "monospace", width: 38, textAlign: "right", fontWeight: isOld ? 700 : 400 }}>{o.time}m {isOld && "⚠"}</div>
                <span style={{ color: C.text3, fontSize: 12, marginLeft: 4 }}>{expanded ? "▲" : "▼"}</span>
              </div>

              {expanded && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 14px", background: C.bg3, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, color: C.text3, marginBottom: 5, textTransform: "uppercase", letterSpacing: ".06em" }}>Items <span style={{ color: C.text3, fontSize: 10, textTransform: "none", letterSpacing: 0 }}>(click to edit)</span></div>
                    {editingItems === o.id ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input style={{ ...input, fontSize: 12, padding: "5px 8px" }} value={itemsVal} onChange={e => setItemsVal(e.target.value)} autoFocus />
                        <button style={btn("success")} onClick={e => { e.stopPropagation(); setOrders(orders.map(x => x.id === o.id ? { ...x, items: itemsVal } : x)); setEditingItems(null); }}>✓</button>
                        <button style={btn("danger")} onClick={e => { e.stopPropagation(); setEditingItems(null); }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: C.text, cursor: "text", padding: "4px 6px", borderRadius: 5, border: `1px solid transparent`, transition: "border-color .15s" }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = C.border2}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "transparent"}
                        onClick={e => { e.stopPropagation(); setEditingItems(o.id); setItemsVal(o.items); }}>
                        {o.items} ✎
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {nextStatus && (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, nextStatus); }} style={{ ...btn("primary"), fontSize: 11, padding: "6px 12px" }}>
                        {STATUS_FLOW_LABEL[o.status]}
                      </button>
                    )}
                    {["NEW", "ACCEPTED", "PREPARING"].includes(o.status) && (
                      <button onClick={(e) => { e.stopPropagation(); updateStatus(o.id, "CANCELLED"); }} style={btn("danger")}>Cancel</button>
                    )}
                    {o.payStatus === "COD" && o.status === "COMPLETED" && (
                      <button onClick={(e) => { e.stopPropagation(); setOrders(orders.map(x => x.id === o.id ? { ...x, payStatus: "PAID" } : x)); }} style={{ ...btn("success"), fontSize: 11 }}>Mark Paid</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Order Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 480, maxHeight: "88vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>New Order</div>
              <span style={{ cursor: "pointer", color: C.text3, fontSize: 18 }} onClick={() => setShowModal(false)}>×</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={label}>Source</label>
                <select style={{ ...input }} value={newSource} onChange={e => setNewSource(e.target.value)}>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="DIRECT_DELIVERY">Direct Delivery</option>
                </select>
              </div>
              <div>
                <label style={label}>Payment</label>
                <select style={{ ...input }} value={newPay} onChange={e => setNewPay(e.target.value)}>
                  <option value="PAID">Paid</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={label}>Customer Name</label>
                <input style={input} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Enter name…" />
              </div>
              <div>
                <label style={label}>Phone</label>
                <input style={input} value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="10-digit number" />
              </div>
            </div>

            {/* Table & Staff Selection */}
            {newSource === "WALK_IN" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={label}>Table (Optional)</label>
                  <select style={{ ...input }} value={selectedTable || ""} onChange={e => setSelectedTable(e.target.value || null)}>
                    <option value="">No table</option>
                    {INIT_TABLES.filter(t => t.status === "available").map(t => (
                      <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={label}>Staff (Optional)</label>
                  <select style={{ ...input }} value={selectedStaff || ""} onChange={e => setSelectedStaff(e.target.value || null)}>
                    <option value="">No staff assigned</option>
                    <option value="staff-001">Rahul Sharma (Manager)</option>
                    <option value="staff-002">Priya Patel (Barista)</option>
                    <option value="staff-003">Amit Kumar (Barista)</option>
                    <option value="staff-004">Sneha Reddy (Waiter)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Split Bill & Discount */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ ...label, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={showSplitBill} onChange={e => setShowSplitBill(e.target.checked)} />
                  Split Bill
                </label>
                {showSplitBill && (
                  <div style={{ marginTop: 6 }}>
                    <select style={{ ...input }} value={splitCount} onChange={e => setSplitCount(Number(e.target.value))}>
                      <option value={2}>Split 2 ways</option>
                      <option value={3}>Split 3 ways</option>
                      <option value={4}>Split 4 ways</option>
                      <option value={5}>Split 5 ways</option>
                      <option value={6}>Split 6 ways</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label style={label}>Discount Code (Optional)</label>
                <input 
                  style={input} 
                  value={appliedDiscount || ""} 
                  onChange={e => {
                    const code = e.target.value.toUpperCase();
                    setAppliedDiscount(code);
                    // Simple discount calculation (in real app, validate against discount system)
                    if (code === "WELCOME10") setDiscountAmount(Math.round(totalAmt * 0.1));
                    else if (code === "COFFEE20") setDiscountAmount(Math.round(totalAmt * 0.2));
                    else if (code === "FLAT100") setDiscountAmount(Math.min(100, totalAmt));
                    else setDiscountAmount(0);
                  }} 
                  placeholder="Enter code" 
                />
                {discountAmount > 0 && (
                  <div style={{ fontSize: 10, color: C.green, marginTop: 2 }}>Discount: -₹{discountAmount}</div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={label}>Items</label>
              {["Coffee", "Special", "Food"].map(cat => (
                <div key={cat} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>{cat}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {menuItems.filter(m => m.cat === cat && m.active).map(m => {
                      const qty = newItems[m.id] || 0;
                      const is86 = m.eightySixed;
                      return (
                        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, background: is86 ? "#1a0d0d" : qty > 0 ? "rgba(232,160,32,.07)" : C.bg3, border: `1px solid ${is86 ? "#3a1a1a" : qty > 0 ? C.amber3 : C.border2}`, borderRadius: 8, padding: "7px 10px", opacity: is86 ? 0.55 : 1 }}>
                          <span style={{ fontSize: 15 }}>{m.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{m.name}{is86 && <span style={{ marginLeft: 6, fontSize: 9, color: C.red, fontWeight: 700 }}>86'D</span>}</div>
                            <div style={{ fontSize: 10, color: C.text3 }}>{m.desc}</div>
                          </div>
                          <div style={{ fontFamily: "monospace", fontSize: 12, color: C.amber2, marginRight: 8 }}>₹{m.price}</div>
                          {!is86 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {qty > 0 && <button onClick={() => adjustQty(m, -1)} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg4, color: C.text, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>}
                              {qty > 0 && <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: C.amber2, minWidth: 14, textAlign: "center" }}>{qty}</span>}
                              <button onClick={() => adjustQty(m, 1)} style={{ width: 22, height: 22, borderRadius: 6, border: `1px solid ${qty > 0 ? C.amber3 : C.border2}`, background: qty > 0 ? C.amberDim : C.bg4, color: qty > 0 ? C.amber2 : C.text2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={label}>Special Instructions</label>
              <textarea style={{ ...input, resize: "none" }} rows={2} value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g. no sugar, extra hot…" />
            </div>

            {totalItems > 0 && (
              <div style={{ background: C.amberDim, border: `1px solid ${C.amber3}`, borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.text2, marginBottom: 4 }}>{totalItems} item{totalItems > 1 ? "s" : ""} selected</div>
                <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: C.amber2 }}>₹{totalAmt} total</div>
                {discountAmount > 0 && (
                  <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>After discount: ₹{totalAmt - discountAmount}</div>
                )}
                {showSplitBill && (
                  <div style={{ fontSize: 11, color: C.blue, marginTop: 2 }}>₹{Math.round((totalAmt - discountAmount) / splitCount)} per person ({splitCount} ways)</div>
                )}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={placeOrder}>Place Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
