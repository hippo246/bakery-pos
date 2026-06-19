import { useState, useEffect } from "react";
import { C, pill, card, btn, input, label, TIER_COLORS, TIER_SPEND, TIER_NEXT } from "../../styles/theme";
import { initials } from "../../styles/theme";
import { INIT_HIST } from "../../data/constants";
import LogVisit from "./LogVisit";

// Loyalty points system
const POINTS_PER_RUPEE = 1;
const POINTS_REWARD_THRESHOLD = 1000;
const REWARD_AMOUNT = 100;

function CRM({ customers, setCustomers }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [tierFilter, setTierFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [modalData, setModalData] = useState({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "", loyaltyPoints: 0 });
  const [noteVal, setNoteVal] = useState("");
  const [sortBy, setSortBy] = useState("spend");
  const [profileTab, setProfileTab] = useState("overview");
  const [editField, setEditField] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [redeemAmount, setRedeemAmount] = useState("");

  let filtered = customers;
  if (tierFilter !== "ALL") filtered = filtered.filter(c => c.tier === tierFilter);
  if (search.trim()) filtered = filtered.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()));
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "spend") return b.spend - a.spend;
    if (sortBy === "visits") return b.visits - a.visits;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "recent") {
      const order = { "Today": 0, "Yesterday": 1 };
      const av = order[a.lastVisit] ?? parseInt(a.lastVisit) ?? 99;
      const bv = order[b.lastVisit] ?? parseInt(b.lastVisit) ?? 99;
      return av - bv;
    }
    return 0;
  });

  const isAtRisk = (c) => {
    if (c.lastVisit === "Today" || c.lastVisit === "Yesterday") return false;
    const days = parseInt(c.lastVisit);
    return !isNaN(days) && days >= 10;
  };

  const churnRisk = (c) => {
    if (c.lastVisit === "Today") return { label: "Active", color: C.green };
    if (c.lastVisit === "Yesterday") return { label: "Good", color: C.green };
    const days = parseInt(c.lastVisit);
    if (isNaN(days)) return { label: "Unknown", color: C.text3 };
    if (days <= 5) return { label: "Good", color: C.green };
    if (days <= 10) return { label: "Cooling", color: C.amber };
    if (days <= 20) return { label: "At Risk", color: "#FF8C42" };
    return { label: "Churned", color: C.red };
  };

  const maxSpend = Math.max(...customers.map(c => c.spend), 1);

  const profile = selected ? customers.find(c => c.id === selected) : null;
  const hist = selected ? (INIT_HIST[selected] || []) : [];

  useEffect(() => { if (profile) setNoteVal(profile.notes || ""); }, [profile?.id]);

  const openAddModal = () => {
    setEditMode(false);
    setModalData({ name: "", phone: "", email: "", tier: "BRONZE", fav: "—", birthday: "", allergy: "", visits: 0, spend: 0, tags: "", notes: "" });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditMode(true);
    setModalData({ name: c.name, phone: c.phone, email: c.email || "", tier: c.tier, fav: c.fav, birthday: c.birthday || "", allergy: c.allergy || "", visits: c.visits, spend: c.spend, tags: c.tags.join(", "), notes: c.notes || "" });
    setShowModal(true);
  };

  const saveModal = () => {
    if (!modalData.name || !modalData.phone) return alert("Name and phone required");
    const tagArr = modalData.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editMode) {
      setCustomers(customers.map(c => c.id === selected ? { ...c, ...modalData, visits: Number(modalData.visits), spend: Number(modalData.spend), tags: tagArr } : c));
    } else {
      const newC = { id: "c" + Date.now(), ...modalData, visits: Number(modalData.visits), spend: Number(modalData.spend), tags: tagArr.length ? tagArr : ["New Customer"], lastVisit: "Never" };
      setCustomers([...customers, newC]);
      setSelected(newC.id);
    }
    setShowModal(false);
  };

  const updateNote = () => setCustomers(customers.map(c => c.id === selected ? { ...c, notes: noteVal } : c));

  const deleteCustomer = (id) => {
    if (!window.confirm("Delete this customer?")) return;
    setCustomers(customers.filter(c => c.id !== id));
    setSelected(null);
  };

  const saveField = (field) => {
    setCustomers(customers.map(c => c.id === selected ? { ...c, [field]: editVal } : c));
    setEditField(null);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    setCustomers(customers.map(c => c.id === selected && !c.tags.includes(newTag.trim()) ? { ...c, tags: [...c.tags, newTag.trim()] } : c));
    setNewTag("");
  };

  const removeTag = (tag) => setCustomers(customers.map(c => c.id === selected ? { ...c, tags: c.tags.filter(t => t !== tag) } : c));

  const addVisitEntry = (cid, items, amt) => {
    const today = new Date(); const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dateStr = `${months[today.getMonth()]} ${today.getDate()}`;
    INIT_HIST[cid] = [{ date: dateStr, items, amt: Number(amt) }, ...(INIT_HIST[cid] || [])];
    const pointsEarned = Math.floor(Number(amt) * POINTS_PER_RUPEE);
    setCustomers(customers.map(c => c.id === cid ? { 
      ...c, 
      visits: c.visits + 1, 
      spend: c.spend + Number(amt), 
      lastVisit: "Today",
      loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned
    } : c));
  };

  const redeemPoints = (cid, amount) => {
    const customer = customers.find(c => c.id === cid);
    if (!customer) return;
    const pointsNeeded = amount * POINTS_PER_RUPEE;
    if ((customer.loyaltyPoints || 0) < pointsNeeded) {
      alert(`Insufficient points. You need ${pointsNeeded} points but have ${customer.loyaltyPoints || 0}.`);
      return;
    }
    setCustomers(customers.map(c => c.id === cid ? { 
      ...c, 
      loyaltyPoints: (c.loyaltyPoints || 0) - pointsNeeded,
      spend: c.spend - amount
    } : c));
    setShowLoyaltyModal(false);
    setRedeemAmount("");
    alert(`Successfully redeemed ₹${amount} using ${pointsNeeded} points!`);
  };

  const calculatePoints = (spend) => Math.floor(spend * POINTS_PER_RUPEE);
  const calculateRedeemable = (points) => Math.floor(points / POINTS_PER_RUPEE);

  const tierCounts = { ALL: customers.length };
  customers.forEach(c => { tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1; });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 16, height: "calc(100vh - 130px)" }}>
      {/* Left: Customer List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.text3 }}>🔍</span>
            <input style={{ ...input, paddingLeft: 28 }} placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button style={btn("primary")} onClick={openAddModal}>＋ Add</button>
        </div>

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", flex: 1 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="spend">Sort: Top Spenders</option>
            <option value="visits">Sort: Most Visits</option>
            <option value="recent">Sort: Most Recent</option>
            <option value="name">Sort: Name A–Z</option>
          </select>
        </div>

        {/* Tier Filter */}
        <div style={{ display: "flex", gap: 4 }}>
          {["ALL", "PLATINUM", "GOLD", "SILVER", "BRONZE"].map(t => {
            const tc = TIER_COLORS[t] || { color: C.text2, bg: C.bg3 };
            const active = tierFilter === t;
            return (
              <button key={t} onClick={() => setTierFilter(t)} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: `1px solid ${active ? tc.color : C.border}`, background: active ? tc.bg : "transparent", color: active ? tc.color : C.text3, fontSize: 9, fontWeight: 700, cursor: "pointer", letterSpacing: ".04em" }}>
                {t === "ALL" ? `All ${tierCounts.ALL}` : `${t.slice(0,2)} ${tierCounts[t] || 0}`}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 5, paddingRight: 2 }}>
          {filtered.map(c => {
            const tc = TIER_COLORS[c.tier] || {};
            const active = selected === c.id;
            const risk = churnRisk(c);
            const atRisk = isAtRisk(c);
            return (
              <div key={c.id} onClick={() => { setSelected(c.id); setProfileTab("overview"); }} style={{ background: active ? C.bg3 : C.bg2, border: `1px solid ${active ? C.amber3 : atRisk ? "#3a2010" : C.border}`, borderRadius: 10, padding: 11, cursor: "pointer", transition: "all .12s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: tc.bg || C.bg4, border: `2px solid ${tc.color || C.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: tc.color || C.text2, flexShrink: 0 }}>{initials(c.name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>{c.phone}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                    <span style={{ ...pill(tc.bg || C.bg4, tc.color || C.text2), fontSize: 9 }}>{c.tier}</span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {c.allergy && <span title={`Allergy: ${c.allergy}`} style={{ fontSize: 11 }}>⚠️</span>}
                      {c.birthday && new Date().toISOString().slice(5,10) === c.birthday?.slice(5,10) && <span title="Birthday today!" style={{ fontSize: 11 }}>🎂</span>}
                      {atRisk && <span style={{ ...pill("#2a1200", "#FF8C42"), fontSize: 8 }}>⚠ RISK</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 7, fontSize: 11, color: C.text2 }}>
                  <span>{c.visits} visits</span>
                  <span>₹{c.spend.toLocaleString()}</span>
                  <span style={{ marginLeft: "auto", color: risk.color, fontSize: 10, fontWeight: 600 }}>{risk.label}</span>
                </div>
                <div style={{ marginTop: 6, height: 3, background: C.bg4, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: tc.color || C.amber3, width: `${Math.min(100, (c.spend / maxSpend) * 100)}%`, transition: "width .4s" }} />
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.text3, fontSize: 13 }}>No customers found</div>}
        </div>
      </div>

      {/* Right: Profile Panel */}
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, overflowY: "auto" }}>
        {!profile ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: C.text3 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>👤</div>
            <div style={{ fontSize: 14 }}>Select a customer to view their profile</div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
              {(() => {
                const tc = TIER_COLORS[profile.tier] || {};
                return (
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.color}`, boxShadow: `0 0 16px ${tc.glow}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: tc.color, flexShrink: 0 }}>
                    {initials(profile.name)}
                  </div>
                );
              })()}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  {editField === "name" ? (
                    <input autoFocus style={{ ...input, fontSize: 16, fontWeight: 700, padding: "3px 8px", width: 180 }} value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveField("name"); if (e.key === "Escape") setEditField(null); }}
                      onBlur={() => saveField("name")} />
                  ) : (
                    <div style={{ fontSize: 18, fontWeight: 700, cursor: "pointer", borderBottom: `1px dashed ${C.border2}` }} title="Click to edit" onClick={() => { setEditField("name"); setEditVal(profile.name); }}>{profile.name}</div>
                  )}
                  <span style={{ ...pill(TIER_COLORS[profile.tier]?.bg, TIER_COLORS[profile.tier]?.color), fontSize: 10 }}>{profile.tier}</span>
                  <span style={{ ...pill("#1a1a2a", churnRisk(profile).color), fontSize: 9, marginLeft: "auto" }}>{churnRisk(profile).label}</span>
                  <button onClick={() => openEditModal(profile)} style={{ ...btn("ghost"), fontSize: 11, padding: "4px 10px" }}>✎ Edit</button>
                  <button onClick={() => deleteCustomer(profile.id)} style={{ padding: "3px 8px", borderRadius: 6, border: "1px solid #3a1a1a", background: "transparent", color: "#884444", fontSize: 11, cursor: "pointer" }} title="Delete customer">🗑</button>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  {["phone","email"].map(field => (
                    editField === field ? (
                      <input key={field} autoFocus style={{ ...input, fontSize: 11, padding: "2px 7px", width: 160, fontFamily: "monospace" }} value={editVal} onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveField(field); if (e.key === "Escape") setEditField(null); }}
                        onBlur={() => saveField(field)} />
                    ) : (
                      <span key={field} style={{ fontSize: 12, color: C.text2, fontFamily: "monospace", cursor: "pointer", borderBottom: `1px dashed ${C.border2}` }} title={`Click to edit ${field}`} onClick={() => { setEditField(field); setEditVal(profile[field] || ""); }}>
                        {profile[field] || `+ add ${field}`}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Tier Progress Bar */}
            {(() => {
              const tc = TIER_COLORS[profile.tier] || {};
              const next = TIER_NEXT[profile.tier];
              const nextThreshold = TIER_SPEND[profile.tier];
              const prevThreshold = profile.tier === "BRONZE" ? 0 : TIER_SPEND[{ SILVER: "BRONZE", GOLD: "SILVER", PLATINUM: "GOLD" }[profile.tier]];
              const pct = next ? Math.min(100, ((profile.spend - prevThreshold) / (nextThreshold - prevThreshold)) * 100) : 100;
              return (
                <div style={{ marginBottom: 16, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.text3, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    <span>{profile.tier}</span>
                    {next ? <span>→ {next} · ₹{(nextThreshold - profile.spend).toLocaleString()} to go</span> : <span style={{ color: tc.color }}>MAX TIER ✦</span>}
                  </div>
                  <div style={{ height: 5, background: C.bg4, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: tc.color || C.amber, width: `${pct}%`, transition: "width .5s", boxShadow: `0 0 8px ${tc.glow || "transparent"}` }} />
                  </div>
                </div>
              );
            })()}

            {/* Allergy Warning */}
            {profile.allergy && (
              <div style={{ background: "#2a1400", border: `1px solid #5a2a00`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 10, color: "#FF8C42", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Allergy Alert</div>
                  <div style={{ fontSize: 12, color: C.text }}>{profile.allergy}</div>
                </div>
              </div>
            )}
            {profile.birthday && new Date().toISOString().slice(5,10) === profile.birthday?.slice(5,10) && (
              <div style={{ background: "#1a0d2a", border: `1px solid #4a2a6a`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎂</span>
                <div style={{ fontSize: 12, color: C.purple }}>It's {profile.name.split(" ")[0]}'s birthday today! Consider a free treat 🎁</div>
              </div>
            )}

            {/* Profile Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 16, background: C.bg3, padding: 3, borderRadius: 8 }}>
              {["overview","loyalty","history","notes"].map(t => (
                <button key={t} onClick={() => setProfileTab(t)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", background: profileTab === t ? C.bg4 : "transparent", color: profileTab === t ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: profileTab === t ? 600 : 400, transition: "all .15s" }}>
                  {t === "overview" ? "📊 Overview" : t === "loyalty" ? "⭐ Loyalty" : t === "history" ? "🧾 History" : "📝 Notes"}
                </button>
              ))}
            </div>

            {/* TAB: OVERVIEW */}
            {profileTab === "overview" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
                  {[
                    { val: profile.visits, lbl: "Visits" },
                    { val: "₹" + profile.spend.toLocaleString(), lbl: "Lifetime" },
                    { val: "₹" + Math.round(profile.spend / Math.max(1, profile.visits)), lbl: "Avg Order" },
                    { val: profile.lastVisit, lbl: "Last Visit" },
                  ].map(s => (
                    <div key={s.lbl} style={{ background: C.bg3, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.amber2, fontFamily: "monospace" }}>{s.val}</div>
                      <div style={{ fontSize: 9, color: C.text3, marginTop: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Favourite Item</div>
                    <div style={{ fontSize: 13, color: C.amber2, fontWeight: 600 }}>☕ {profile.fav}</div>
                  </div>
                  <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Repeat Rate</div>
                    <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>{profile.visits > 20 ? "High" : profile.visits > 8 ? "Medium" : "Low"}</div>
                  </div>
                  {profile.birthday && (
                    <div style={{ flex: 1, background: C.bg3, borderRadius: 10, padding: "10px 12px" }}>
                      <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Birthday</div>
                      <div style={{ fontSize: 13, color: C.purple, fontWeight: 600 }}>🎂 {new Date(profile.birthday).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                    </div>
                  )}
                </div>

                <LogVisit profile={profile} addVisitEntry={addVisitEntry} />

                {/* Tags */}
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Tags</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>
                  {profile.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: C.bg4, color: C.text2, border: `1px solid ${C.border2}`, display: "flex", alignItems: "center", gap: 5 }}>
                      {t}
                      <span style={{ cursor: "pointer", color: C.text3, fontSize: 12, lineHeight: 1 }} onClick={() => removeTag(t)}>×</span>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                  <input style={{ ...input, fontSize: 11, padding: "5px 9px" }} value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add tag…" onKeyDown={e => e.key === "Enter" && addTag()} />
                  <button style={{ ...btn("ghost"), fontSize: 11, whiteSpace: "nowrap" }} onClick={addTag}>+ Add</button>
                </div>
              </>
            )}

            {/* TAB: LOYALTY */}
            {profileTab === "loyalty" && (
              <>
                <div style={{ background: "#1a1a2e", border: `1px solid ${C.amber3}`, borderRadius: 12, padding: "16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Loyalty Points Balance</div>
                  <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{profile.loyaltyPoints || 0}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>points earned</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Redeemable Amount</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: C.green }}>₹{calculateRedeemable(profile.loyaltyPoints || 0)}</div>
                  </div>
                  <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Points per ₹1</div>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: C.blue }}>{POINTS_PER_RUPEE}</div>
                  </div>
                </div>

                <div style={{ background: C.bg3, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 5 }}>Points Progress</div>
                  <div style={{ height: 6, background: C.bg4, borderRadius: 3, marginBottom: 8, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: C.amber, width: `${Math.min(100, ((profile.loyaltyPoints || 0) % POINTS_REWARD_THRESHOLD) / POINTS_REWARD_THRESHOLD * 100)}%`, transition: "width .3s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.text2 }}>
                    {(profile.loyaltyPoints || 0) % POINTS_REWARD_THRESHOLD} / {POINTS_REWARD_THRESHOLD} points to next reward
                  </div>
                </div>

                <button 
                  onClick={() => setShowLoyaltyModal(true)}
                  disabled={calculateRedeemable(profile.loyaltyPoints || 0) < 10}
                  style={{ 
                    ...btn("primary"), 
                    fontSize: 12, 
                    width: "100%",
                    opacity: calculateRedeemable(profile.loyaltyPoints || 0) < 10 ? 0.5 : 1,
                    cursor: calculateRedeemable(profile.loyaltyPoints || 0) < 10 ? "not-allowed" : "pointer"
                  }}
                >
                  ⭐ Redeem Points (Min ₹10)
                </button>
              </>
            )}

            {/* TAB: HISTORY */}
            {profileTab === "history" && (
              <>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 10 }}>Order History</div>
                {hist.length === 0 ? (
                  <div style={{ fontSize: 12, color: C.text3, padding: "12px 0" }}>No history available</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {hist.map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.bg3, borderRadius: 8, fontSize: 12 }}>
                        <div style={{ color: C.text3, fontFamily: "monospace", width: 72, flexShrink: 0, fontSize: 11 }}>{h.date}</div>
                        <div style={{ flex: 1, color: C.text }}>{h.items}</div>
                        <div style={{ color: C.amber2, fontFamily: "monospace", fontWeight: 600 }}>₹{h.amt}</div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.text3, padding: "8px 12px", borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
                      <span>{hist.length} orders shown</span>
                      <span style={{ color: C.amber2, fontFamily: "monospace" }}>₹{hist.reduce((s, h) => s + h.amt, 0)} total</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB: NOTES */}
            {profileTab === "notes" && (
              <>
                <div style={{ fontSize: 10, color: C.text3, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>Staff Notes</div>
                <textarea
                  style={{ ...input, resize: "none", lineHeight: 1.6, marginBottom: 8 }}
                  rows={6}
                  placeholder="Add notes about this customer…"
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                />
                <button style={{ ...btn("primary"), fontSize: 11 }} onClick={updateNote}>Save Notes</button>
              </>
            )}
          </>
        )}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Add Customer</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
            </div>
            {[{ lbl: "Name *", val: modalData.name, set: (v) => setModalData({...modalData, name: v}), ph: "Full name" }, { lbl: "Phone *", val: modalData.phone, set: (v) => setModalData({...modalData, phone: v}), ph: "10-digit number" }, { lbl: "Email (optional)", val: modalData.email, set: (v) => setModalData({...modalData, email: v}), ph: "email@example.com" }].map(f => (
              <div key={f.lbl} style={{ marginBottom: 12 }}>
                <label style={label}>{f.lbl}</label>
                <input style={input} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveModal}>Add Customer</button>
            </div>
          </div>
        </div>
      )}

      {/* Loyalty Points Redemption Modal */}
      {showLoyaltyModal && profile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowLoyaltyModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.amber3}`, borderRadius: 18, padding: 24, width: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>⭐ Redeem Points</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowLoyaltyModal(false)}>×</span>
            </div>
            <div style={{ background: "#1a1a2e", borderRadius: 10, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Available Points</div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{profile.loyaltyPoints || 0}</div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>≈ ₹{calculateRedeemable(profile.loyaltyPoints || 0)} redeemable</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Amount to Redeem (₹)</label>
              <input 
                style={input} 
                type="number" 
                value={redeemAmount} 
                onChange={e => setRedeemAmount(e.target.value)} 
                placeholder="Min ₹10" 
                min="10"
                max={calculateRedeemable(profile.loyaltyPoints || 0)}
              />
              <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
                Points needed: {(Number(redeemAmount) || 0) * POINTS_PER_RUPEE}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => { setShowLoyaltyModal(false); setRedeemAmount(""); }}>Cancel</button>
              <button 
                style={btn("primary")} 
                onClick={() => redeemPoints(profile.id, Number(redeemAmount))}
                disabled={!redeemAmount || Number(redeemAmount) < 10 || Number(redeemAmount) > calculateRedeemable(profile.loyaltyPoints || 0)}
              >
                Redeem ₹{redeemAmount || 0}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CRM;
