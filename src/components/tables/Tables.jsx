import { useState } from "react";
import { C, card, btn, input, label, pill } from "../../styles/theme";
import { INIT_TABLES, TABLE_TYPES, TABLE_AREAS, TABLE_STATUS } from "../../data/tableConstants";

export default function Tables() {
  const [tables, setTables] = useState(INIT_TABLES);
  const [typeFilter, setTypeFilter] = useState("All");
  const [areaFilter, setAreaFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [form, setForm] = useState({ number: "", capacity: "", type: "indoor", area: "main" });
  const [selectedTable, setSelectedTable] = useState(null);

  const filtered = tables.filter(table => {
    const matchesType = typeFilter === "All" || table.type === typeFilter;
    const matchesArea = areaFilter === "All" || table.area === areaFilter;
    const matchesStatus = statusFilter === "All" || table.status === statusFilter;
    return matchesType && matchesArea && matchesStatus;
  });

  const availableCount = tables.filter(t => t.status === "available").length;
  const occupiedCount = tables.filter(t => t.status === "occupied").length;
  const reservedCount = tables.filter(t => t.status === "reserved").length;
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);

  const openAdd = () => {
    setEditTable(null);
    setForm({ number: "", capacity: "", type: "indoor", area: "main" });
    setShowModal(true);
  };

  const openEdit = (table) => {
    setEditTable(table.id);
    setForm({ number: String(table.number), capacity: String(table.capacity), type: table.type, area: table.area });
    setShowModal(true);
  };

  const saveTable = () => {
    if (!form.number || !form.capacity) return alert("Table number and capacity are required");
    const tableData = {
      ...form,
      number: Number(form.number),
      capacity: Number(form.capacity),
      status: "available",
      currentOrder: null,
    };
    if (editTable) {
      setTables(tables.map(t => t.id === editTable ? { ...t, ...tableData } : t));
    } else {
      setTables([...tables, { ...tableData, id: "tbl-" + Date.now() }]);
    }
    setShowModal(false);
  };

  const updateStatus = (id, status) => {
    setTables(tables.map(t => t.id === id ? { ...t, status, currentOrder: status === "available" ? null : t.currentOrder } : t));
  };

  const assignOrder = (tableId) => {
    const orderId = prompt("Enter order ID to assign:");
    if (orderId) {
      setTables(tables.map(t => t.id === tableId ? { ...t, status: "occupied", currentOrder: orderId } : t));
    }
  };

  const clearTable = (id) => {
    if (!window.confirm("Clear this table?")) return;
    setTables(tables.map(t => t.id === id ? { ...t, status: "cleaning", currentOrder: null } : t));
    setTimeout(() => {
      setTables(tables.map(t => t.id === id ? { ...t, status: "available" } : t));
    }, 3000);
  };

  const reserveTable = (id) => {
    const name = prompt("Reservation name:");
    const time = prompt("Reservation time (HH:MM):");
    if (name && time) {
      setTables(tables.map(t => t.id === id ? { ...t, status: "reserved", reservedFor: name, reservedTime: time } : t));
    }
  };

  const deleteTable = (id) => {
    if (!window.confirm("Delete this table?")) return;
    setTables(tables.filter(t => t.id !== id));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available": return { bg: "#0d2218", color: C.green };
      case "occupied": return { bg: "#2a0808", color: C.red };
      case "reserved": return { bg: "#2a1a00", color: C.amber };
      case "cleaning": return { bg: "#1a1a2e", color: C.blue };
      default: return { bg: C.bg4, color: C.text3 };
    }
  };

  return (
    <div>
      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total Tables", val: tables.length, color: C.amber2 },
          { label: "Available", val: availableCount, color: C.green },
          { label: "Occupied", val: occupiedCount, color: occupiedCount > 0 ? C.red : C.text3 },
          { label: "Reserved", val: reservedCount, color: reservedCount > 0 ? C.amber : C.text3 },
        ].map(m => (
          <div key={m.label} style={{ ...card(), padding: "12px 14px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 10, color: C.text3, marginTop: 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={{ ...card(), padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Total Capacity</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: C.blue }}>{totalCapacity} seats</div>
        </div>
        <div style={{ ...card(), padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Occupancy Rate</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "monospace", color: C.amber2 }}>{Math.round((occupiedCount / tables.length) * 100)}%</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {TABLE_TYPES.slice(1).map(type => (
            <button key={type} onClick={() => setTypeFilter(type)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${typeFilter === type ? C.amber3 : C.border2}`, background: typeFilter === type ? C.amberDim : C.bg3, color: typeFilter === type ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
              {type}
            </button>
          ))}
          {TABLE_AREAS.slice(1).map(area => (
            <button key={area} onClick={() => setAreaFilter(area)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${areaFilter === area ? C.amber3 : C.border2}`, background: areaFilter === area ? C.amberDim : C.bg3, color: areaFilter === area ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
              {area}
            </button>
          ))}
          {TABLE_STATUS.slice(1).map(status => (
            <button key={status} onClick={() => setStatusFilter(status)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${statusFilter === status ? C.amber3 : C.border2}`, background: statusFilter === status ? C.amberDim : C.bg3, color: statusFilter === status ? C.amber2 : C.text2, fontSize: 12, cursor: "pointer" }}>
              {status}
            </button>
          ))}
        </div>
        <button style={btn("primary")} onClick={openAdd}>＋ Add Table</button>
      </div>

      {/* Table Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
        {filtered.map(table => {
          const sc = getStatusColor(table.status);
          return (
            <div 
              key={table.id} 
              onClick={() => setSelectedTable(table.id)}
              style={{ 
                ...card(), 
                padding: "16px", 
                border: `2px solid ${selectedTable === table.id ? C.amber3 : sc.bg}`, 
                background: sc.bg, 
                cursor: "pointer",
                transition: "all .15s"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: sc.color }}>#{table.number}</div>
                <span style={{ ...pill(sc.bg, sc.color), fontSize: 9 }}>{table.status}</span>
              </div>
              
              <div style={{ fontSize: 11, color: C.text2, marginBottom: 8 }}>
                {table.capacity} seats · {table.type} · {table.area}
              </div>

              {table.currentOrder && (
                <div style={{ fontSize: 10, color: C.amber, marginBottom: 8, fontFamily: "monospace" }}>
                  📋 {table.currentOrder}
                </div>
              )}

              {table.status === "reserved" && (
                <div style={{ fontSize: 10, color: C.amber, marginBottom: 8 }}>
                  📅 {table.reservedFor} · {table.reservedTime}
                </div>
              )}

              {selectedTable === table.id && (
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                  {table.status === "available" && (
                    <button onClick={(e) => { e.stopPropagation(); reserveTable(table.id); }} style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer" }}>
                      📅 Reserve
                    </button>
                  )}
                  {table.status === "available" && (
                    <button onClick={(e) => { e.stopPropagation(); assignOrder(table.id); }} style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer" }}>
                      📋 Assign
                    </button>
                  )}
                  {table.status === "occupied" && (
                    <button onClick={(e) => { e.stopPropagation(); clearTable(table.id); }} style={{ flex: 1, padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 10, cursor: "pointer" }}>
                      ✓ Clear
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); openEdit(table); }} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 10, cursor: "pointer" }}>✎</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteTable(table.id); }} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #3a1a1a", background: "transparent", color: "#884444", fontSize: 10, cursor: "pointer" }}>🗑</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: C.text3, fontSize: 14 }}>No tables found</div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 18, padding: 24, width: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{editTable ? "Edit Table" : "Add Table"}</div>
              <span style={{ cursor: "pointer", color: C.text3 }} onClick={() => setShowModal(false)}>×</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Table Number *</label>
                <input style={input} type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="#" />
              </div>
              <div>
                <label style={label}>Capacity *</label>
                <input style={input} type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="seats" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={label}>Type</label>
                <select style={{ ...input }} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TABLE_TYPES.slice(1).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>Area</label>
                <select style={{ ...input }} value={form.area} onChange={e => setForm({ ...form, area: e.target.value })}>
                  {TABLE_AREAS.slice(1).map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={btn("ghost")} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={btn("primary")} onClick={saveTable}>{editTable ? "Save Changes" : "Add Table"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
