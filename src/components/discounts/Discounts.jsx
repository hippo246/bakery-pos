import { useState, useEffect } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_DISCOUNTS, DISCOUNT_TYPES, DISCOUNT_STATUS, TIER_REQUIREMENTS } from "../../data/discountConstants";

export default function Discounts({ discounts: externalDiscounts, setDiscounts: externalSetDiscounts }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  const [discounts, setDiscounts] = useState(externalDiscounts || INIT_DISCOUNTS);
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [form, setForm] = useState({ code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", maxUsage: "", expiryDate: "", description: "", tierRequired: "All" });

  // Use external setter if provided, otherwise use local state
  const handleSetDiscounts = externalSetDiscounts || setDiscounts;

  const filtered = discounts.filter(discount => {
    const matchesType = typeFilter === "All" || discount.type === typeFilter;
    const matchesStatus = statusFilter === "All" || discount.status === statusFilter;
    const matchesSearch = !search.trim() || discount.code.toLowerCase().includes(search.toLowerCase()) || discount.description.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const activeCount = discounts.filter(d => d.status === "active").length;
  const totalUsage = discounts.reduce((sum, d) => sum + d.usageCount, 0);

  const openAdd = () => {
    setEditDiscount(null);
    setForm({ code: "", type: "percentage", value: "", minOrder: "", maxDiscount: "", maxUsage: "", expiryDate: "", description: "", tierRequired: "All" });
    setShowModal(true);
  };

  const openEdit = (discount) => {
    setEditDiscount(discount.id);
    setForm({ 
      code: discount.code, 
      type: discount.type, 
      value: String(discount.value), 
      minOrder: String(discount.minOrder), 
      maxDiscount: String(discount.maxDiscount), 
      maxUsage: String(discount.maxUsage), 
      expiryDate: discount.expiryDate, 
      description: discount.description,
      tierRequired: discount.tierRequired || "All"
    });
    setShowModal(true);
  };

  const saveDiscount = () => {
    if (!form.code || !form.value || !form.minOrder) return alert("Code, value, and minimum order are required");
    const discountData = {
      ...form,
      value: Number(form.value),
      minOrder: Number(form.minOrder),
      maxDiscount: Number(form.maxDiscount),
      maxUsage: Number(form.maxUsage),
      status: "active",
      usageCount: 0,
    };
    if (editDiscount) {
      handleSetDiscounts(discounts.map(d => d.id === editDiscount ? { ...d, ...discountData } : d));
    } else {
      handleSetDiscounts([...discounts, { ...discountData, id: "disc-" + Date.now() }]);
    }
    setShowModal(false);
  };

  const updateStatus = (id, status) => {
    handleSetDiscounts(discounts.map(d => d.id === id ? { ...d, status } : d));
  };

  const deleteDiscount = (id) => {
    if (!window.confirm("Delete this discount?")) return;
    handleSetDiscounts(discounts.filter(d => d.id !== id));
  };

  const calculateDiscount = (orderAmount, discount) => {
    if (orderAmount < discount.minOrder) return 0;
    if (discount.type === "percentage") {
      const discountAmount = (orderAmount * discount.value) / 100;
      return Math.min(discountAmount, discount.maxDiscount);
    } else {
      return Math.min(discount.value, discount.maxDiscount);
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Discounts", val: discounts.length, color: C.amber2 },
          { label: "Active", val: activeCount, color: C.green },
          { label: "Total Usage", val: totalUsage, color: C.blue },
          { label: "Expired", val: discounts.filter(d => isExpired(d.expiryDate)).length, color: C.red },
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
            <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search discounts…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {DISCOUNT_TYPES.map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${typeFilter === type ? C.amber3 : C.border2}`, background: typeFilter === type ? C.amberDim : C.bg3, color: typeFilter === type ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }}>
              {type}
            </button>
          ))}
          {DISCOUNT_STATUS.slice(1).map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: "10px 12px", borderRadius: 6, border: `1px solid ${statusFilter === status ? C.amber3 : C.border2}`, background: statusFilter === status ? C.amberDim : C.bg3, color: statusFilter === status ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }}>
              {status}
            </button>
          ))}
        </div>
        <button style={btn("primary")} onClick={openAdd}>＋ Add Discount</button>
      </div>

      {/* Discount List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {filtered.map(discount => {
          const expired = isExpired(discount.expiryDate);
          const statusColor = discount.status === "active" && !expired ? C.green : expired ? C.red : C.text3;
          const exampleDiscount = calculateDiscount(1000, discount);
          return (
            <div key={discount.id} style={{ ...card(), padding: "14px 16px", border: `1px solid ${discount.status === "active" && !expired ? C.border : C.redBorder}`, background: discount.status === "active" && !expired ? C.bg2 : C.redBg }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{discount.code}</span>
                    <span style={{ ...pill(discount.type === "percentage" ? C.blueBg : C.amberBg, discount.type === "percentage" ? C.blue : C.amber), fontSize: 9 }}>
                      {discount.type === "percentage" ? `-${discount.value}%` : `-₹${discount.value}`}
                    </span>
                    <span style={{ ...pill(discount.status === "active" && !expired ? C.greenBg : C.redBg, statusColor), fontSize: 9 }}>
                      {expired ? "EXPIRED" : discount.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.text2 }}>{discount.description}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(discount)} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>✎</button>
                  <button onClick={() => deleteDiscount(discount.id)} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.redBorder}`, background: "transparent", color: C.mutedRed, fontSize: 11, cursor: "pointer" }}>🗑</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 8, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Min Order</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>₹{discount.minOrder}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Max Discount</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.text2 }}>₹{discount.maxDiscount}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Usage</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: C.amber2 }}>{discount.usageCount} / {discount.maxUsage}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Expiry</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace", color: expired ? C.red : C.text2 }}>{discount.expiryDate}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: C.text3 }}>
                <div>
                  {discount.tierRequired !== "All" && <span style={{ ...pill(C.purpleBg, C.purple), fontSize: 9, marginRight: 6 }}>{discount.tierRequired}+ only</span>}
                  Example: ₹1000 order → -₹{exampleDiscount}
                </div>
                {discount.status === "active" && !expired && (
                  <button onClick={() => updateStatus(discount.id, "inactive")} style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>
                    Disable
                  </button>
                )}
                {discount.status === "inactive" && (
                  <button onClick={() => updateStatus(discount.id, "active")} style={{ padding: "4px 10px", borderRadius: 5, border: `1px solid ${C.greenBorder}`, background: "transparent", color: C.green, fontSize: 11, cursor: "pointer" }}>
                    Enable
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.text3, fontSize: 14 }}>No discounts found</div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: "min(420px,95vw)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editDiscount ? "Edit Discount" : "Add Discount"}</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Code *</label>
              <input style={input} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="DISCOUNT10" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Type</label>
                <select style={{ ...input }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {DISCOUNT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Value *</label>
                <input style={input} type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={form.type === "percentage" ? "%" : "₹"} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Min Order *</label>
                <input style={input} type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })} placeholder="₹" />
              </div>
              <div>
                <label style={label}>Max Discount</label>
                <input style={input} type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} placeholder="₹" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Max Usage</label>
                <input style={input} type="number" value={form.maxUsage} onChange={e => setForm({ ...form, maxUsage: e.target.value })} placeholder="unlimited" />
              </div>
              <div>
                <label style={label}>Expiry Date</label>
                <input style={input} type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Tier Required</label>
                <select style={{ ...input }} value={form.tierRequired} onChange={e => setForm({ ...form, tierRequired: e.target.value })}>
                  {TIER_REQUIREMENTS.map(tier => <option key={tier} value={tier}>{tier}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Description</label>
              <input style={input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Discount description" />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveDiscount}>{editDiscount ? "Save Changes" : "Add Discount"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
