import { useState } from "react";
import { C, card, input, btn, URGENCY_ORDER } from "../../styles/theme";
import KDSCard from "./KDSCard";

// Prep time estimates for menu items (in minutes)
const PREP_TIMES = {
  "Cappuccino": 3,
  "Flat White": 3,
  "Latte": 4,
  "Espresso": 2,
  "Americano": 2,
  "Mocha": 4,
  "Matcha Latte": 4,
  "Cold Brew": 1,
  "Avocado Toast": 8,
  "Breakfast Sandwich": 10,
  "Club Sandwich": 12,
  "Caesar Salad": 8,
  "Croissant": 2,
  "Blueberry Muffin": 3,
};

function Kitchen({ kdsCards, setKdsCards }) {
  const [view, setView] = useState("cards");
  const [doneLog, setDoneLog] = useState([]);
  const [sortBy, setSortBy] = useState("time");
  const [showDoneLog, setShowDoneLog] = useState(false);
  const [stationFilter, setStationFilter] = useState("ALL");

  const completeCard = (id) => {
    const card = kdsCards.find(c => c.id === id);
    if (!card) return;
    setDoneLog(l => [{ ...card, completedAt: Date.now(), duration: Math.round((Date.now() - card.startedAt) / 1000) }, ...l].slice(0, 20));
    setKdsCards(prev => prev.filter(c => c.id !== id));
  };

  const holdCard = (id, reason = "") => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, held: !c.held, holdReason: reason || c.holdReason || "" } : c));
  };

  const changeUrgency = (id, urgency) => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, urgency } : c));
  };

  const editNote = (id, note) => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, note } : c));
  };

  const checkItem = (cardId, itemIdx) => {
    setKdsCards(prev => prev.map(c => c.id === cardId
      ? { ...c, items: c.items.map((it, i) => i === itemIdx ? { ...it, checked: !it.checked } : it) }
      : c));
  };

  const bumpAllNonUrgent = () => {
    const done = kdsCards.filter(c => (c.urgency === "ok" || c.urgency === "soon") && !c.held);
    setDoneLog(l => [...done.map(d => ({ ...d, completedAt: Date.now(), duration: Math.round((Date.now() - d.startedAt) / 1000) })), ...l].slice(0, 20));
    setKdsCards(prev => prev.filter(c => c.urgency === "urgent" || c.held));
  };

  const recallLast = () => {
    if (!doneLog.length) return;
    const [last, ...rest] = doneLog;
    const { completedAt, duration, ...card } = last;
    setKdsCards(prev => [card, ...prev]);
    setDoneLog(rest);
  };

  const calculatePrepTime = (card) => {
    let totalTime = 0;
    card.items.forEach(item => {
      const prepTime = PREP_TIMES[item.name] || 5; // Default 5 mins if not found
      totalTime += prepTime * item.qty;
    });
    return totalTime;
  };

  const getPrepTimeStatus = (card) => {
    const prepTime = calculatePrepTime(card);
    const elapsedMinutes = Math.floor((Date.now() - card.startedAt) / 60000);
    const remaining = Math.max(0, prepTime - elapsedMinutes);
    
    if (remaining === 0) return { label: "Ready", color: C.green };
    if (remaining <= 2) return { label: `${remaining}m left`, color: C.amber };
    return { label: `${remaining}m left`, color: C.text3 };
  };

  const visibleCards = kdsCards.filter(c => stationFilter === "ALL" || c.station === stationFilter);
  const sorted = [...visibleCards].sort((a, b) => {
    if (sortBy === "time") return a.startedAt - b.startedAt;
    if (sortBy === "urgency") return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (sortBy === "source") return a.source.localeCompare(b.source);
    return 0;
  });

  const urgentCount = kdsCards.filter(c => c.urgency === "urgent" && !c.held).length;
  const heldCount = kdsCards.filter(c => c.held).length;
  const avgDuration = doneLog.length
    ? Math.round(doneLog.reduce((s, d) => s + (d.duration || 0), 0) / doneLog.length)
    : null;

  const stationCounts = { Bar: kdsCards.filter(c => c.station === "Bar").length, Kitchen: kdsCards.filter(c => c.station === "Kitchen").length };

  return (
    <div style={{ display: "flex", gap: 14, height: "calc(100vh - 130px)" }}>
      {/* Main KDS panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Throughput bar ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { val: kdsCards.length, lbl: "Active Tickets", color: C.amber2 },
            { val: urgentCount, lbl: "Urgent", color: urgentCount > 0 ? C.red : C.text3 },
            { val: heldCount, lbl: "On Hold", color: heldCount > 0 ? C.amber : C.text3 },
            { val: avgDuration ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : "—", lbl: "Avg Complete", color: C.green },
          ].map(m => (
            <div key={m.lbl} style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 10, color: C.text3, textTransform: "uppercase", letterSpacing: ".06em", marginTop: 2 }}>{m.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 4, background: C.bg3, padding: 3, borderRadius: 8 }}>
            {[["cards","⊞ Cards"],["list","≡ List"],["station","⊟ Station"]].map(([v, lbl]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "5px 11px", borderRadius: 6, border: "none", background: view === v ? C.bg4 : "transparent", color: view === v ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: view === v ? 600 : 400 }}>{lbl}</button>
            ))}
          </div>
          {/* Sort */}
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", width: "auto" }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="time">Sort: Oldest First</option>
            <option value="urgency">Sort: Urgency</option>
            <option value="source">Sort: Source</option>
          </select>
          {/* Station filter (hidden in station view) */}
          {view !== "station" && ["ALL","Bar","Kitchen"].map(s => (
            <button key={s} onClick={() => setStationFilter(s)} style={{ padding: "5px 10px", borderRadius: 6, border: `1px solid ${stationFilter === s ? C.amber3 : C.border2}`, background: stationFilter === s ? C.amberDim : C.bg3, color: stationFilter === s ? C.amber2 : C.text2, fontSize: 11, cursor: "pointer" }}>
              {s}{s !== "ALL" ? ` (${stationCounts[s] || 0})` : ""}
            </button>
          ))}
          {/* Bulk actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {kdsCards.filter(c => !c.held && c.urgency !== "urgent").length > 0 && (
              <button onClick={bumpAllNonUrgent} style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid #1a4020`, background: "#0d2010", color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✓ Bump Non-Urgent</button>
            )}
            {doneLog.length > 0 && (
              <button onClick={recallLast} style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer" }}>↩ Recall Last</button>
            )}
            <button onClick={() => setShowDoneLog(v => !v)} style={{ padding: "5px 11px", borderRadius: 7, border: `1px solid ${C.border2}`, background: showDoneLog ? C.amberDim : C.bg3, color: showDoneLog ? C.amber2 : C.text2, fontSize: 11, cursor: "pointer" }}>
              🕘 Log ({doneLog.length})
            </button>
          </div>
        </div>

        {/* ── Empty state ── */}
        {kdsCards.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.text3, flex: 1 }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.green }}>Kitchen clear</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>All orders complete</div>
          </div>
        )}

        {/* ── Cards view ── */}
        {kdsCards.length > 0 && view === "cards" && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }}>
              {sorted.map(card => (
                <KDSCard key={card.id} card={card} onDone={completeCard} onHold={holdCard} onUrgencyChange={changeUrgency} onNoteEdit={editNote} onItemCheck={checkItem} compact={false} />
              ))}
            </div>
          </div>
        )}

        {/* ── List view ── */}
        {kdsCards.length > 0 && view === "list" && (
          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {sorted.map(card => (
              <KDSCard key={card.id} card={card} onDone={completeCard} onHold={holdCard} onUrgencyChange={changeUrgency} onNoteEdit={editNote} onItemCheck={checkItem} compact={true} />
            ))}
          </div>
        )}

        {/* ── Station split view ── */}
        {kdsCards.length > 0 && view === "station" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, overflowY: "auto", flex: 1 }}>
            {["Bar", "Kitchen"].map(station => {
              const stCards = sorted.filter(c => c.station === station);
              return (
                <div key={station} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: station === "Bar" ? "#0d1a28" : "#1a0d1a", borderRadius: 8, border: `1px solid ${station === "Bar" ? "#1a3050" : "#2e1a3a"}` }}>
                    <span style={{ fontSize: 14 }}>{station === "Bar" ? "🍹" : "🍳"}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: station === "Bar" ? C.blue : C.purple }}>{station}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{stCards.length} tickets</span>
                    {stCards.filter(c => c.urgency === "urgent").length > 0 && (
                      <span style={{ fontSize: 10, color: C.red, fontFamily: "monospace", fontWeight: 700 }}>{stCards.filter(c => c.urgency === "urgent").length} urgent</span>
                    )}
                  </div>
                  {stCards.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: C.text3, fontSize: 12 }}>No tickets</div>}
                  {stCards.map(card => (
                    <KDSCard key={card.id} card={card} onDone={completeCard} onHold={holdCard} onUrgencyChange={changeUrgency} onNoteEdit={editNote} onItemCheck={checkItem} compact={false} />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Done log side panel ── */}
      {showDoneLog && (
        <div style={{ width: 260, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 12px", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text2 }}>🕘 Completed Log</span>
            <button onClick={recallLast} disabled={!doneLog.length} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: doneLog.length ? C.text2 : C.text3, cursor: doneLog.length ? "pointer" : "default" }}>↩ Recall</button>
          </div>
          {doneLog.length === 0 && <div style={{ fontSize: 12, color: C.text3, textAlign: "center", padding: "20px 0" }}>No completed tickets yet</div>}
          {doneLog.map((d, i) => {
            const mins = d.duration ? Math.floor(d.duration / 60) : 0;
            const secs = d.duration ? d.duration % 60 : 0;
            return (
              <div key={i} style={{ padding: "9px 10px", background: C.bg3, borderRadius: 8, marginBottom: 6, fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "monospace", color: C.text3 }}>{d.id}</span>
                  <span style={{ color: C.green, fontSize: 10, fontFamily: "monospace" }}>✓ {mins}m {String(secs).padStart(2,"0")}s</span>
                </div>
                <div style={{ color: C.text2, lineHeight: 1.5 }}>{d.items.map(it => `${it.name} ×${it.qty}`).join(", ")}</div>
                {d.station && <div style={{ marginTop: 3, color: d.station === "Bar" ? C.blue : C.purple, fontSize: 10 }}>{d.station}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Kitchen;
