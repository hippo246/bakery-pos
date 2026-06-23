import { useState, useEffect, useMemo, useCallback } from "react";
import { C, card, input, btn, URGENCY_ORDER } from "../../styles/theme";
import KDSCard from "./KDSCard";
import { 
  createKdsTicketsFromOrder, 
  normalizeKdsTicket, 
  getTicketsByStation,
  getActiveTickets,
  getHeldTickets,
  areAllOrderTicketsCompleted,
  cancelOrderTickets,
  calculateUrgencyFromTime,
  recalculateUrgency,
  startKdsTicket,
  completeKdsTicket,
  holdKdsTicket,
  releaseKdsTicket,
  moveKdsTicketToStation,
  bumpKdsTicket,
  toggleKdsItemCheck,
  KDS_STATIONS
} from "../../domain/kdsModel.js";
import { getMinutesElapsed, toTimestamp } from "../../domain/dates.js";

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

function Kitchen({ kdsCards, setKdsCards, orders, setOrders }) {
  const [view, setView] = useState("cards");
  const [doneLog, setDoneLog] = useState([]);
  const [sortBy, setSortBy] = useState("time");
  const [showDoneLog, setShowDoneLog] = useState(false);
  const [stationFilter, setStationFilter] = useState("All");
  const [holdReasonModal, setHoldReasonModal] = useState(null);
  const [moveStationModal, setMoveStationModal] = useState(null);

  // Memoized filtered tickets by station
  const filteredTickets = useMemo(() => {
    return getTicketsByStation(kdsCards, stationFilter);
  }, [kdsCards, stationFilter]);

  // Memoized active and held tickets
  const activeTickets = useMemo(() => getActiveTickets(kdsCards), [kdsCards]);
  const heldTickets = useMemo(() => getHeldTickets(kdsCards), [kdsCards]);

  // Recalculate urgency for all tickets every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setKdsCards(prev => prev.map(ticket => recalculateUrgency(ticket)));
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [setKdsCards]);

  // Sync KDS cards with orders - create KDS cards for new orders
  const syncKDSWithOrders = useCallback(() => {
    if (!orders) return;
    
    orders.forEach(order => {
      // Only create KDS cards for orders that are accepted/preparing and don't have a KDS card yet
      if ((order.status === "ACCEPTED" || order.status === "PREPARING") && !kdsCards.find(c => c.orderId === order.id)) {
        const newTickets = createKdsTicketsFromOrder(order);
        if (newTickets.length > 0) {
          setKdsCards(prev => [...prev, ...newTickets]);
        }
      }
      
      // Cancel KDS tickets for cancelled orders
      if (order.status === "CANCELLED" && kdsCards.find(c => c.orderId === order.id)) {
        setKdsCards(prev => cancelOrderTickets(order.id, prev));
      }
      
      // Remove completed KDS tickets for ready/completed orders
      if ((order.status === "READY" || order.status === "COMPLETED") && kdsCards.find(c => c.orderId === order.id)) {
        setKdsCards(prev => cancelOrderTickets(order.id, prev));
      }
    });
  }, [orders, kdsCards, setKdsCards]);

  // Sync when orders change
  useEffect(() => {
    syncKDSWithOrders();
  }, [syncKDSWithOrders]);

  // Complete ticket and check if order should be marked as READY
  const completeCard = useCallback((id) => {
    const card = kdsCards.find(c => c.id === id);
    if (!card) return;
    
    const completedTicket = completeKdsTicket(card);
    setDoneLog(l => [{ ...completedTicket, completedAt: Date.now(), duration: Math.round((Date.now() - card.startedAt) / 1000) }, ...l].slice(0, 20));
    setKdsCards(prev => prev.map(c => c.id === id ? completedTicket : c));
    
    // Check if all tickets for this order are completed
    const updatedCards = kdsCards.map(c => c.id === id ? completedTicket : c);
    if (areAllOrderTicketsCompleted(card.orderId, updatedCards)) {
      // Update order status to READY
      setOrders(prev => prev.map(o => o.id === card.orderId ? { ...o, status: "READY" } : o));
    }
  }, [kdsCards, setOrders]);

  const holdCard = useCallback((id, reason = "") => {
    const card = kdsCards.find(c => c.id === id);
    if (!card) return;
    
    if (card.held) {
      // Release from hold
      setKdsCards(prev => prev.map(c => c.id === id ? releaseKdsTicket(c) : c));
    } else {
      // Put on hold
      if (reason) {
        setKdsCards(prev => prev.map(c => c.id === id ? holdKdsTicket(c, reason) : c));
      } else {
        setHoldReasonModal(id);
      }
    }
  }, [kdsCards, setKdsCards]);

  const confirmHold = useCallback((reason) => {
    if (holdReasonModal) {
      setKdsCards(prev => prev.map(c => c.id === holdReasonModal ? holdKdsTicket(c, reason) : c));
      setHoldReasonModal(null);
    }
  }, [holdReasonModal, setKdsCards]);

  const changeUrgency = useCallback((id, urgency) => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, urgency } : c));
  }, [setKdsCards]);

  const editNote = useCallback((id, note) => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, note } : c));
  }, [setKdsCards]);

  const checkItem = useCallback((cardId, itemIdx) => {
    const card = kdsCards.find(c => c.id === cardId);
    if (!card) return;
    
    const updatedTicket = toggleKdsItemCheck(card, itemIdx, !card.items[itemIdx].checked);
    setKdsCards(prev => prev.map(c => c.id === cardId ? updatedTicket : c));
  }, [kdsCards, setKdsCards]);

  const startTicket = useCallback((id) => {
    setKdsCards(prev => prev.map(c => c.id === id ? startKdsTicket(c) : c));
  }, [setKdsCards]);

  const moveStation = useCallback((id, newStation) => {
    const card = kdsCards.find(c => c.id === id);
    if (!card) return;
    
    try {
      const updatedTicket = moveKdsTicketToStation(card, newStation);
      setKdsCards(prev => prev.map(c => c.id === id ? updatedTicket : c));
      setMoveStationModal(null);
    } catch (error) {
      console.error(error);
    }
  }, [kdsCards, setKdsCards]);

  const bumpTicket = useCallback((id) => {
    const card = kdsCards.find(c => c.id === id);
    if (!card) return;
    
    const bumpedTicket = bumpKdsTicket(card);
    setDoneLog(l => [{ ...bumpedTicket, completedAt: Date.now(), duration: Math.round((Date.now() - card.startedAt) / 1000) }, ...l].slice(0, 20));
    setKdsCards(prev => prev.filter(c => c.id !== id));
    
    // Check if all tickets for this order are completed
    if (areAllOrderTicketsCompleted(card.orderId, kdsCards.filter(c => c.id !== id))) {
      setOrders(prev => prev.map(o => o.id === card.orderId ? { ...o, status: "READY" } : o));
    }
  }, [kdsCards, setOrders]);

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

  const visibleCards = filteredTickets;
  const sorted = [...visibleCards].sort((a, b) => {
    if (sortBy === "time") return a.startedAt - b.startedAt;
    if (sortBy === "urgency") return URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (sortBy === "source") return a.source.localeCompare(b.source);
    return 0;
  });

  const urgentCount = activeTickets.filter(c => c.urgency === "urgent").length;
  const heldCount = heldTickets.length;
  const avgDuration = doneLog.length
    ? Math.round(doneLog.reduce((s, d) => s + (d.duration || 0), 0) / doneLog.length)
    : null;

  const stationCounts = {
    All: kdsCards.filter(c => !c.completed).length,
    Bar: kdsCards.filter(c => c.station === "Bar" && !c.completed).length,
    Kitchen: kdsCards.filter(c => c.station === "Kitchen" && !c.completed).length,
    Packaging: kdsCards.filter(c => c.station === "Packaging" && !c.completed).length,
    Dessert: kdsCards.filter(c => c.station === "Dessert" && !c.completed).length,
  };

  return (
    <div style={{ display: "flex", gap: 14, height: "calc(100vh - 130px)" }}>
      {/* Main KDS panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Throughput bar ── */}
        <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
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
              <button key={v} onClick={() => setView(v)} style={{ padding: "10px 11px", borderRadius: 6, border: "none", background: view === v ? C.bg4 : "transparent", color: view === v ? C.amber2 : C.text3, fontSize: 12, cursor: "pointer", fontWeight: view === v ? 600 : 400, minHeight: 44 }}>{lbl}</button>
            ))}
          </div>
          {/* Sort */}
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", width: "auto", minHeight: 44 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="time">Sort: Oldest First</option>
            <option value="urgency">Sort: Urgency</option>
            <option value="source">Sort: Source</option>
          </select>
          {/* Station filter (hidden in station view) */}
          {view !== "station" && KDS_STATIONS.map(s => (
            <button key={s} onClick={() => setStationFilter(s)} style={{ padding: "10px 10px", borderRadius: 6, border: `1px solid ${stationFilter === s ? C.amber3 : C.border2}`, background: stationFilter === s ? C.amberDim : C.bg3, color: stationFilter === s ? C.amber2 : C.text2, fontSize: 11, cursor: "pointer", minHeight: 44 }}>
              {s}{s !== "All" ? ` (${stationCounts[s] || 0})` : ""}
            </button>
          ))}
          {/* Bulk actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {kdsCards.filter(c => !c.held && c.urgency !== "urgent").length > 0 && (
              <button onClick={bumpAllNonUrgent} style={{ padding: "10px 11px", borderRadius: 7, border: `1px solid #1a4020`, background: "#0d2010", color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 700, minHeight: 44 }}>✓ Bump Non-Urgent</button>
            )}
            {doneLog.length > 0 && (
              <button onClick={recallLast} style={{ padding: "10px 11px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 11, cursor: "pointer", minHeight: 44 }}>↩ Recall Last</button>
            )}
            <button onClick={() => setShowDoneLog(v => !v)} style={{ padding: "10px 11px", borderRadius: 7, border: `1px solid ${C.border2}`, background: showDoneLog ? C.amberDim : C.bg3, color: showDoneLog ? C.amber2 : C.text2, fontSize: 11, cursor: "pointer", minHeight: 44 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }} className="kitchen-grid">
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
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, overflowY: "auto", flex: 1 }}>
            {["Bar", "Kitchen", "Packaging", "Dessert"].map(station => {
              const stCards = sorted.filter(c => c.station === station);
              const stationColors = {
                Bar: { bg: "#0d1a28", border: "#1a3050", color: C.blue },
                Kitchen: { bg: "#1a0d1a", border: "#2e1a3a", color: C.purple },
                Packaging: { bg: "#0d1a15", border: "#1a3028", color: C.green },
                Dessert: { bg: "#1a150d", border: "#302818", color: C.amber2 },
              };
              const colors = stationColors[station] || stationColors.Bar;
              return (
                <div key={station} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: colors.bg, borderRadius: 8, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: 14 }}>{station === "Bar" ? "🍹" : station === "Kitchen" ? "🍳" : station === "Packaging" ? "📦" : "🍰"}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.color }}>{station}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{stCards.length} tickets</span>
                    {stCards.filter(c => c.urgency === "urgent").length > 0 && (
                      <span style={{ fontSize: 10, color: C.red, fontFamily: "monospace", fontWeight: 700 }}>{stCards.filter(c => c.urgency === "urgent").length} urgent</span>
                    )}
                  </div>
                  {stCards.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: C.text3, fontSize: 12 }}>No tickets</div>}
                  {stCards.map(card => (
                    <KDSCard 
                      key={card.id} 
                      card={card} 
                      onDone={completeCard} 
                      onHold={holdCard} 
                      onUrgencyChange={changeUrgency} 
                      onNoteEdit={editNote} 
                      onItemCheck={checkItem}
                      onStart={startTicket}
                      onMoveStation={(id) => setMoveStationModal(id)}
                      onBump={bumpTicket}
                      compact={false} 
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Hold Reason Modal ── */}
      {holdReasonModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setHoldReasonModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 20, width: 400, maxWidth: "95%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Hold Reason</div>
            <textarea
              style={{ ...input, resize: "none", marginBottom: 12 }}
              rows={3}
              placeholder="Enter hold reason..."
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  confirmHold(e.target.value);
                }
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setHoldReasonModal(null)} style={{ ...btn("ghost"), padding: "8px 16px" }}>Cancel</button>
              <button onClick={() => {
                const textarea = document.querySelector("textarea");
                if (textarea) confirmHold(textarea.value);
              }} style={{ ...btn("primary"), padding: "8px 16px" }}>Hold</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move Station Modal ── */}
      {moveStationModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setMoveStationModal(null)}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 20, width: 400, maxWidth: "95%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Move to Station</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["Bar", "Kitchen", "Packaging", "Dessert"].map(station => (
                <button
                  key={station}
                  onClick={() => moveStation(moveStationModal, station)}
                  style={{ padding: "12px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 13, cursor: "pointer", textAlign: "left" }}
                >
                  {station === "Bar" ? "🍹" : station === "Kitchen" ? "🍳" : station === "Packaging" ? "📦" : "🍰"} {station}
                </button>
              ))}
            </div>
            <button onClick={() => setMoveStationModal(null)} style={{ ...btn("ghost"), padding: "8px 16px", marginTop: 12, width: "100%" }}>Cancel</button>
          </div>
        </div>
      )}

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
