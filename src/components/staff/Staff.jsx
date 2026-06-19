import { useState } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_STAFF, STAFF_ROLES, STAFF_STATUS, SHIFT_TYPES } from "../../data/staffConstants";

export default function Staff() {
  const [staff, setStaff] = useState(INIT_STAFF);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [form, setForm] = useState({ name: "", role: "Barista", phone: "", email: "", status: "active", hourlyRate: "", shifts: [] });
  const [viewMode, setViewMode] = useState("grid"); // grid | list

  const filtered = staff.filter(person => {
    const matchesRole = roleFilter === "All" || person.role === roleFilter;
    const matchesStatus = statusFilter === "All" || person.status === statusFilter;
    const matchesSearch = !search.trim() || person.name.toLowerCase().includes(search.toLowerCase()) || person.email?.toLowerCase().includes(search.toLowerCase()) || person.phone.includes(search);
    return matchesRole && matchesStatus && matchesSearch;
  });

  const activeCount = staff.filter(s => s.status === "active").length;
  const onLeaveCount = staff.filter(s => s.status === "on_leave").length;
  const totalHourlyCost = staff.filter(s => s.status === "active").reduce((sum, s) => sum + s.hourlyRate, 0);

  const openAdd = () => {
    setEditStaff(null);
    setForm({ name: "", role: "Barista", phone: "", email: "", status: "active", hourlyRate: "", shifts: [] });
    setShowModal(true);
  };

  const openEdit = (person) => {
    setEditStaff(person.id);
    setForm({ name: person.name, role: person.role, phone: person.phone, email: person.email || "", status: person.status, hourlyRate: String(person.hourlyRate), shifts: person.shifts });
    setShowModal(true);
  };

  const saveStaff = () => {
    if (!form.name || !form.phone || !form.hourlyRate) return alert("Name, phone, and hourly rate are required");
    const staffData = {
      ...form,
      hourlyRate: Number(form.hourlyRate),
      avatar: form.name.split(" ").map(n => n[0]).join("").toUpperCase(),
      joinDate: new Date().toISOString().split("T")[0],
    };
    if (editStaff) {
      setStaff(staff.map(s => s.id === editStaff ? { ...s, ...staffData } : s));
    } else {
      setStaff([...staff, { ...staffData, id: "staff-" + Date.now() }]);
    }
    setShowModal(false);
  };

  const toggleShift = (shift) => {
    setForm(prev => ({
      ...prev,
      shifts: prev.shifts.includes(shift) ? prev.shifts.filter(s => s !== shift) : [...prev.shifts, shift]
    }));
  };

  const updateStatus = (id, status) => {
    setStaff(staff.map(s => s.id === id ? { ...s, status } : s));
  };

  const deleteStaff = (id) => {
    if (!window.confirm("Delete this staff member?")) return;
    setStaff(staff.filter(s => s.id !== id));
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Staff", val: staff.length, color: C.amber2 },
          { label: "Active", val: activeCount, color: C.green },
          { label: "On Leave", val: onLeaveCount, color: onLeaveCount > 0 ? C.amber : C.text3 },
          { label: "Hourly Cost", val: "₹" + totalHourlyCost.toLocaleString(), color: C.blue },
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
            <input style={{ ...input, paddingLeft: 28, width: 180 }} placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {STAFF_ROLES.slice(1).map(role => (
            <button key={role} onClick={() => setRoleFilter(role)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${roleFilter === role ? C.amber3 : C.border2}`, background: roleFilter === role ? C.amberDim : C.bg3, color: roleFilter === role ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
              {role}
            </button>
          ))}
          {STAFF_STATUS.slice(1).map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${statusFilter === status ? C.amber3 : C.border2}`, background: statusFilter === status ? C.amberDim : C.bg3, color: statusFilter === status ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ display: "flex", gap: 4, background: C.bg3, padding: 3, borderRadius: 8 }}>
            {["grid","list"].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ padding: "5px 11px", borderRadius: 6, border: "none", background: viewMode === v ? C.bg4 : "transparent", color: viewMode === v ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: viewMode === v ? 600 : 400 }}>
                {v === "grid" ? "⊞ Grid" : "≡ List"}
              </button>
            ))}
          </div>
          <button style={btn("primary")} onClick={openAdd}>＋ Add Staff</button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 10 }}>
          {filtered.map(person => (
            <div key={person.id} style={{ ...card(), padding: "16px", border: `1px solid ${person.status === "on_leave" ? "#3a2010" : C.border}`, background: person.status === "on_leave" ? "#1a1000" : C.bg2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.amber3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.amber2 }}>
                  {person.avatar}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{person.name}</div>
                  <div style={{ fontSize: 11, color: C.text3 }}>{person.role}</div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {person.shifts.map(shift => (
                  <span key={shift} style={{ ...pill("#1a1a2a", C.blue), fontSize: 9 }}>{shift}</span>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Status</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: person.status === "active" ? C.green : person.status === "on_leave" ? C.amber : C.red }}>
                    {person.status.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em" }}>Hourly</div>
                  <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: C.amber2 }}>₹{person.hourlyRate}</div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: C.text3, marginBottom: 12 }}>
                📞 {person.phone} · 📧 {person.email}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(person)} style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer" }}>✎ Edit</button>
                <button onClick={() => updateStatus(person.id, person.status === "active" ? "on_leave" : "active")} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>
                  {person.status === "active" ? "⏸ Leave" : "▶ Active"}
                </button>
                <button onClick={() => deleteStaff(person.id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #3a1a1a", background: "transparent", color: "#884444", fontSize: 11, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(person => (
            <div key={person.id} style={{ ...card(), padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: `1px solid ${person.status === "on_leave" ? "#3a2010" : C.border}`, background: person.status === "on_leave" ? "#1a1000" : C.bg2 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.amber3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.amber2, flexShrink: 0 }}>
                {person.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{person.name}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>{person.role} · {person.phone}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {person.shifts.map(shift => (
                  <span key={shift} style={{ ...pill("#1a1a2a", C.blue), fontSize: 9 }}>{shift}</span>
                ))}
              </div>
              <span style={{ ...pill(person.status === "active" ? "#0d2218" : "#2a0808", person.status === "active" ? C.green : person.status === "on_leave" ? C.amber : C.red), fontSize: 9 }}>
                {person.status.replace("_", " ")}
              </span>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: C.amber2, width: 60, textAlign: "right" }}>₹{person.hourlyRate}/hr</div>
              <button onClick={() => openEdit(person)} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer" }}>✎</button>
              <button onClick={() => deleteStaff(person.id)} style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid #3a1a1a", background: "transparent", color: "#884444", fontSize: 11, cursor: "pointer" }}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.text3, fontSize: 14 }}>No staff members found</div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editStaff ? "Edit Staff" : "Add Staff Member"}</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Name *</label>
              <input style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Role</label>
                <select style={{ ...input }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {STAFF_ROLES.slice(1).map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Status</label>
                <select style={{ ...input }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STAFF_STATUS.slice(1).map(status => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Phone *</label>
                <input style={input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="10-digit number" />
              </div>
              <div>
                <label style={label}>Hourly Rate *</label>
                <input style={input} type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="₹" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Email</label>
              <input style={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={label}>Shifts</label>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                {SHIFT_TYPES.map(shift => (
                  <button key={shift} onClick={() => toggleShift(shift)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${form.shifts.includes(shift) ? C.amber3 : C.border2}`, background: form.shifts.includes(shift) ? C.amberDim : C.bg3, color: form.shifts.includes(shift) ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
                    {shift}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveStaff}>{editStaff ? "Save Changes" : "Add Staff"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
