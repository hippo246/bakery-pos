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
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [view, setView] = useState("cards");
  const [doneLog, setDoneLog] = useState([]);
  const [sortBy, setSortBy] = useState("time");
  const [showDoneLog, setShowDoneLog] = useState(false);
  const [stationFilter, setStationFilter] = useState("All");
  const [holdReasonModal, setHoldReasonModal] = useState(null);
  const [moveStationModal, setMoveStationModal] = useState(null);

  // Safe base list: never let a null/undefined/malformed kdsCards crash the screen
  const safeKdsCards = useMemo(() => {
    if (!Array.isArray(kdsCards)) return [];
    return kdsCards.filter(c => {
      const ok = c && typeof c === "object" && c.orderId;
      if (!ok && process.env.NODE_ENV !== "production") {
        console.warn("[Kitchen] skipped malformed ticket", c);
      }
      return ok;
    });
  }, [kdsCards]);

  // Memoized filtered tickets by station
  const filteredTickets = useMemo(() => {
    try {
      const result = getTicketsByStation(safeKdsCards, stationFilter);
      return Array.isArray(result) ? result : [];
    } catch {
      // Fallback defensive filtering if the helper itself throws
      return stationFilter === "All" ? safeKdsCards : safeKdsCards.filter(c => c.station === stationFilter);
    }
  }, [safeKdsCards, stationFilter]);

  // Memoized active and held tickets
  const activeTickets = useMemo(() => {
    try {
      return getActiveTickets(safeKdsCards) || [];
    } catch {
      return safeKdsCards.filter(c => !c.completed && !c.held);
    }
  }, [safeKdsCards]);
  const heldTickets = useMemo(() => {
    try {
      return getHeldTickets(safeKdsCards) || [];
    } catch {
      return safeKdsCards.filter(c => c.held);
    }
  }, [safeKdsCards]);

  // Recalculate urgency for all tickets every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setKdsCards(prev => {
        const prevSafe = Array.isArray(prev) ? prev : [];
        let changed = false;
        const next = prevSafe.map(ticket => {
          // Only recalc active, non-held, non-completed tickets
          if (!ticket || ticket.held || ticket.completed) return ticket;
          // Respect a manual urgency override flag if the model supports one
          if (ticket.manualUrgency || ticket.urgencyOverride) return ticket;
          if (!ticket.startedAt || !Number.isFinite(Number(ticket.startedAt))) return ticket;
          let recalced;
          try {
            recalced = recalculateUrgency(ticket);
          } catch {
            return ticket;
          }
          if (!recalced || recalced.urgency === ticket.urgency) return ticket;
          changed = true;
          return recalced;
        });
        return changed ? next : prevSafe;
      });
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, [setKdsCards]);

  // Sync KDS cards with orders - create KDS cards for new orders
  const syncKDSWithOrders = useCallback(() => {
    if (!Array.isArray(orders)) return;

    orders.forEach(order => {
      // Guard against malformed orders crashing the screen
      if (!order || typeof order !== "object" || !order.id || !order.status) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[Kitchen] skipped malformed order", order);
        }
        return;
      }

      const existingForOrder = (kdsCards || []).filter(c => c && c.orderId === order.id);

      // Only create KDS cards for valid active orders that don't already have tickets
      if ((order.status === "ACCEPTED" || order.status === "PREPARING") && existingForOrder.length === 0) {
        if (!Array.isArray(order.items) || order.items.length === 0) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[Kitchen] order missing items, skipping KDS ticket creation", order.id);
          }
          return;
        }
        let newTickets = [];
        try {
          newTickets = createKdsTicketsFromOrder(order) || [];
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[Kitchen] failed to create KDS tickets for order", order.id, error);
          }
          return;
        }
        if (newTickets.length > 0) {
          setKdsCards(prev => {
            const prevSafe = Array.isArray(prev) ? prev : [];
            // De-dupe by orderId + station so the same ticket is never created twice
            const existingKeys = new Set(prevSafe.filter(c => c).map(c => `${c.orderId}::${c.station}`));
            const toAdd = newTickets.filter(t => t && !existingKeys.has(`${t.orderId}::${t.station}`));
            if (toAdd.length < newTickets.length && process.env.NODE_ENV !== "production") {
              console.warn("[Kitchen] skipped duplicate KDS ticket(s) for order", order.id);
            }
            return toAdd.length > 0 ? [...prevSafe, ...toAdd] : prevSafe;
          });
        }
        return;
      }

      // Cancel/remove KDS tickets for cancelled orders (safely, if helper exists)
      if (order.status === "CANCELLED" && existingForOrder.length > 0) {
        if (typeof cancelOrderTickets === "function") {
          setKdsCards(prev => {
            try {
              return cancelOrderTickets(order.id, Array.isArray(prev) ? prev : []);
            } catch (error) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("[Kitchen] failed to cancel tickets for order", order.id, error);
              }
              return prev;
            }
          });
        }
        return;
      }

      // Clean up tickets for ready/completed orders only once every related station ticket is completed
      if ((order.status === "READY" || order.status === "COMPLETED") && existingForOrder.length > 0) {
        const allCompleted = existingForOrder.every(c => c.completed);
        if (allCompleted) {
          setKdsCards(prev => {
            const prevSafe = Array.isArray(prev) ? prev : [];
            try {
              return cancelOrderTickets(order.id, prevSafe);
            } catch (error) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("[Kitchen] failed to clean up tickets for order", order.id, error);
              }
              return prevSafe;
            }
          });
        }
      }
    });
  }, [orders, kdsCards, setKdsCards]);

  // Sync when orders change
  useEffect(() => {
    syncKDSWithOrders();
  }, [syncKDSWithOrders]);

  // Complete ticket and check if order should be marked as READY
  const completeCard = useCallback((id) => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card || card.completed) return;

    let completedTicket;
    try {
      completedTicket = completeKdsTicket(card);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("[Kitchen] failed to complete ticket", id, error);
      return;
    }
    const completedAt = Date.now();
    const startedAt = Number.isFinite(Number(card.startedAt)) ? card.startedAt : completedAt;

    setDoneLog(l => {
      const lSafe = Array.isArray(l) ? l : [];
      if (lSafe.some(d => d.id === card.id)) return lSafe; // avoid duplicate doneLog entries
      const entry = { ...completedTicket, completedAt, duration: Math.round((completedAt - startedAt) / 1000) };
      return [entry, ...lSafe].slice(0, 50);
    });

    setKdsCards(prev => {
      const prevSafe = Array.isArray(prev) ? prev : [];
      const next = prevSafe.map(c => (c && c.id === id ? completedTicket : c));
      // Only mark order READY once every ticket for that order is completed
      const allCompleted = areAllOrderTicketsCompleted(card.orderId, next);
      if (allCompleted) {
        setOrders(prevOrders => {
          const ordersSafe = Array.isArray(prevOrders) ? prevOrders : [];
          return ordersSafe.map(o => {
            if (!o || o.id !== card.orderId) return o;
            if (o.status === "COMPLETED" || o.status === "CANCELLED") return o; // never touch finalized orders
            return { ...o, status: "READY" };
          });
        });
      }
      return next;
    });
  }, [kdsCards, setOrders]);

  const [holdError, setHoldError] = useState("");

  const holdCard = useCallback((id, reason = "") => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card) return;

    if (card.held) {
      // Release from hold: clear held and holdReason, never touch completed tickets
      if (card.completed) return;
      setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === id ? releaseKdsTicket(c) : c));
    } else {
      const trimmed = (reason || "").trim();
      if (trimmed) {
        if (trimmed.length > 200) {
          setHoldError("Hold reason must be 200 characters or fewer.");
          return;
        }
        setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === id ? holdKdsTicket(c, trimmed) : c));
      } else {
        setHoldReasonModal(id);
      }
    }
  }, [kdsCards, setKdsCards]);

  const confirmHold = useCallback((reason) => {
    if (!holdReasonModal) return;
    const trimmed = (reason || "").trim();
    if (!trimmed) {
      setHoldError("A hold reason is required.");
      return;
    }
    if (trimmed.length > 200) {
      setHoldError("Hold reason must be 200 characters or fewer.");
      return;
    }
    setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === holdReasonModal ? holdKdsTicket(c, trimmed.slice(0, 200)) : c));
    setHoldError("");
    setHoldReasonModal(null);
  }, [holdReasonModal, setKdsCards]);

  const changeUrgency = useCallback((id, urgency) => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, urgency } : c));
  }, [setKdsCards]);

  const editNote = useCallback((id, note) => {
    setKdsCards(prev => prev.map(c => c.id === id ? { ...c, note } : c));
  }, [setKdsCards]);

  const checkItem = useCallback((cardId, itemIdx) => {
    const card = (kdsCards || []).find(c => c && c.id === cardId);
    if (!card || card.completed) return;
    if (!Array.isArray(card.items) || !Number.isInteger(itemIdx) || itemIdx < 0 || itemIdx >= card.items.length) {
      if (process.env.NODE_ENV !== "production") console.warn("[Kitchen] invalid item index", cardId, itemIdx);
      return;
    }

    let updatedTicket;
    try {
      updatedTicket = toggleKdsItemCheck(card, itemIdx, !card.items[itemIdx].checked);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("[Kitchen] failed to toggle item check", error);
      return;
    }
    setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === cardId ? updatedTicket : c));
  }, [kdsCards, setKdsCards]);

  const startTicket = useCallback((id) => {
    setKdsCards(prev => prev.map(c => c.id === id ? startKdsTicket(c) : c));
  }, [setKdsCards]);

  const [moveError, setMoveError] = useState("");

  const moveStation = useCallback((id, newStation) => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card) return;

    if (card.completed) {
      setMoveError("Completed tickets cannot be moved.");
      return;
    }
    if (!KDS_STATIONS.includes(newStation) || newStation === "All") {
      setMoveError("Invalid target station.");
      return;
    }
    if (card.station === newStation) {
      setMoveError("Ticket is already at that station.");
      return;
    }
    const duplicate = (kdsCards || []).some(c => c && c.id !== id && c.orderId === card.orderId && c.station === newStation && !c.completed);
    if (duplicate) {
      setMoveError("A ticket for this order already exists at that station.");
      return;
    }

    try {
      const updatedTicket = moveKdsTicketToStation(card, newStation);
      setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === id ? updatedTicket : c));
      setMoveError("");
      setMoveStationModal(null);
    } catch (error) {
      setMoveError("Could not move ticket to that station.");
      console.error(error);
    }
  }, [kdsCards, setKdsCards]);

  const bumpTicket = useCallback((id) => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card || card.completed || card.held) return; // only bump active tickets

    let bumpedTicket;
    try {
      bumpedTicket = bumpKdsTicket(card);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.warn("[Kitchen] failed to bump ticket", id, error);
      return;
    }
    const completedAt = Date.now();
    const startedAt = Number.isFinite(Number(card.startedAt)) ? card.startedAt : completedAt;

    setDoneLog(l => {
      const lSafe = Array.isArray(l) ? l : [];
      if (lSafe.some(d => d.id === card.id)) return lSafe;
      const entry = { ...bumpedTicket, completedAt, duration: Math.round((completedAt - startedAt) / 1000) };
      return [entry, ...lSafe].slice(0, 50);
    });

    setKdsCards(prev => {
      const prevSafe = Array.isArray(prev) ? prev : [];
      const next = prevSafe.filter(c => c.id !== id);
      if (areAllOrderTicketsCompleted(card.orderId, next)) {
        setOrders(prevOrders => {
          const ordersSafe = Array.isArray(prevOrders) ? prevOrders : [];
          return ordersSafe.map(o => {
            if (!o || o.id !== card.orderId) return o;
            if (o.status === "COMPLETED" || o.status === "CANCELLED") return o;
            return { ...o, status: "READY" };
          });
        });
      }
      return next;
    });
  }, [kdsCards, setOrders]);

  const bumpAllNonUrgent = () => {
    const cardsSafe = Array.isArray(kdsCards) ? kdsCards : [];
    const done = cardsSafe.filter(c => c && (c.urgency === "ok" || c.urgency === "soon") && !c.held && !c.completed);
    if (done.length === 0) return;
    const completedAt = Date.now();
    setDoneLog(l => {
      const lSafe = Array.isArray(l) ? l : [];
      const existingIds = new Set(lSafe.map(d => d.id));
      const newEntries = done
        .filter(d => !existingIds.has(d.id))
        .map(d => ({ ...d, completedAt, duration: Math.round((completedAt - (Number.isFinite(Number(d.startedAt)) ? d.startedAt : completedAt)) / 1000) }));
      return [...newEntries, ...lSafe].slice(0, 50);
    });
    setKdsCards(prev => (Array.isArray(prev) ? prev : []).filter(c => c.urgency === "urgent" || c.held || c.completed));
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

  const visibleCards = Array.isArray(filteredTickets) ? filteredTickets : [];
  const sorted = [...visibleCards].sort((a, b) => {
    if (sortBy === "time") return (a.startedAt || 0) - (b.startedAt || 0);
    if (sortBy === "urgency") return (URGENCY_ORDER[a.urgency] ?? 0) - (URGENCY_ORDER[b.urgency] ?? 0);
    if (sortBy === "source") return String(a.source || "").localeCompare(String(b.source || ""));
    return 0;
  });

  const urgentCount = activeTickets.filter(c => c.urgency === "urgent").length;
  const heldCount = heldTickets.length;
  const avgDuration = doneLog.length
    ? Math.round(doneLog.reduce((s, d) => s + (d.duration || 0), 0) / doneLog.length)
    : null;

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const completedTodayCount = doneLog.filter(d => d.completedAt && d.completedAt >= startOfToday).length;

  const stationCounts = {
    All: safeKdsCards.filter(c => !c.completed).length,
    Bar: safeKdsCards.filter(c => c.station === "Bar" && !c.completed).length,
    Kitchen: safeKdsCards.filter(c => c.station === "Kitchen" && !c.completed).length,
    Packaging: safeKdsCards.filter(c => c.station === "Packaging" && !c.completed).length,
    Dessert: safeKdsCards.filter(c => c.station === "Dessert" && !c.completed).length,
  };

  return (
    <div style={{ display: "flex", gap: 14, height: isMobile ? "auto" : "calc(100dvh - 160px)", minHeight: 400, flexDirection: isMobile && showDoneLog ? "column" : "row" }}>
      {/* Main KDS panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Throughput bar ── */}
        <div style={{ display: "flex", gap: 1, marginBottom: 12, background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 9, overflow: "hidden" }}>
          {[
            { val: safeKdsCards.length, lbl: "Active", color: C.amber2, active: safeKdsCards.length > 0 },
            { val: urgentCount, lbl: "Urgent", color: C.red, active: urgentCount > 0 },
            { val: heldCount, lbl: "Held", color: C.amber, active: heldCount > 0 },
            { val: avgDuration ? `${Math.floor(avgDuration / 60)}m ${avgDuration % 60}s` : "—", lbl: "Avg", color: C.green, active: !!avgDuration },
            { val: completedTodayCount, lbl: "Done", color: C.text2, active: completedTodayCount > 0 },
          ].map((m, i, arr) => (
            <div key={m.lbl} style={{ flex: 1, padding: "10px 12px", borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 800, color: m.active ? m.color : C.text3, lineHeight: 1, letterSpacing: "-0.02em" }}>{m.val}</div>
              <div style={{ fontSize: 9, color: C.text3, textTransform: "uppercase", letterSpacing: ".08em", marginTop: 3, fontWeight: 700 }}>{m.lbl}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap", minWidth: "max-content" }}>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 0, background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 7, overflow: "hidden" }}>
            {[["cards","Cards"],["list","List"],["station","Station"]].map(([v, lbl]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "7px 13px", border: "none", borderRight: `1px solid ${C.border2}`, background: view === v ? C.amber2 : "transparent", color: view === v ? C.bg : C.text3, fontSize: 12, cursor: "pointer", fontWeight: view === v ? 700 : 400, minHeight: 34, transition: "all .15s", whiteSpace: "nowrap" }}>{lbl}</button>
            ))}
          </div>
          {/* Sort */}
          <select style={{ ...input, fontSize: 11, padding: "5px 8px", width: "auto", minHeight: 34, color: C.text2, borderRadius: 7 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="time">Oldest first</option>
            <option value="urgency">By urgency</option>
            <option value="source">By source</option>
          </select>
          {/* Station filter (hidden in station view) */}
          {view !== "station" && KDS_STATIONS.map(s => {
            const active = stationFilter === s;
            const stationDotColors = { Bar: C.blue, Kitchen: C.purple, Packaging: C.green, Dessert: C.amber2 };
            const dot = stationDotColors[s];
            return (
              <button key={s} onClick={() => setStationFilter(s)} style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${active ? C.amber3 : C.border2}`, background: active ? C.amberDim : "transparent", color: active ? C.amber2 : C.text3, fontSize: 11, fontWeight: active ? 700 : 400, cursor: "pointer", minHeight: 34, transition: "all .15s", display: "flex", alignItems: "center", gap: 5 }}>
                {dot && s !== "All" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? C.amber2 : dot, flexShrink: 0 }} />}
                {s}{s !== "All" && <span style={{ fontFamily: "monospace", fontSize: 10, opacity: 0.65 }}>{stationCounts[s] || 0}</span>}
              </button>
            );
          })}
          {/* Bulk actions */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
            {safeKdsCards.filter(c => !c.held && c.urgency !== "urgent").length > 0 && (
              <button onClick={bumpAllNonUrgent} style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${C.greenBorder}`, background: C.greenBg, color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 700, minHeight: 34 }}>Bump non-urgent</button>
            )}
            {doneLog.length > 0 && (
              <button onClick={recallLast} style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "transparent", color: C.text2, fontSize: 11, cursor: "pointer", minHeight: 34 }}>↩ Recall</button>
            )}
            <button onClick={() => setShowDoneLog(v => !v)} style={{ padding: "6px 11px", borderRadius: 7, border: `1px solid ${showDoneLog ? C.amber3 : C.border2}`, background: showDoneLog ? C.amberDim : "transparent", color: showDoneLog ? C.amber2 : C.text2, fontSize: 11, cursor: "pointer", minHeight: 34, display: "flex", alignItems: "center", gap: 5 }}>
              Log {doneLog.length > 0 && <span style={{ fontFamily: "monospace", fontSize: 10, background: showDoneLog ? `${C.amber2}22` : C.bg3, padding: "1px 5px", borderRadius: 4 }}>{doneLog.length}</span>}
            </button>
          </div>
        </div>
        </div>

        {/* ── Empty state ── */}
        {safeKdsCards.length === 0 && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.greenBg, border: `1px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.green, fontSize: 16 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.green, letterSpacing: "-0.02em" }}>Kitchen clear</div>
            <div style={{ fontSize: 12, color: C.text3 }}>No active tickets</div>
          </div>
        )}

        {/* ── Cards view ── */}
        {safeKdsCards.length > 0 && view === "cards" && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }} className="kitchen-grid">
              {sorted.map(card => (
                <KDSCard key={card.id} card={card} onDone={completeCard} onHold={holdCard} onUrgencyChange={changeUrgency} onNoteEdit={editNote} onItemCheck={checkItem} compact={false} />
              ))}
            </div>
          </div>
        )}

        {/* ── List view ── */}
        {safeKdsCards.length > 0 && view === "list" && (
          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            {sorted.map(card => (
              <KDSCard key={card.id} card={card} onDone={completeCard} onHold={holdCard} onUrgencyChange={changeUrgency} onNoteEdit={editNote} onItemCheck={checkItem} compact={true} />
            ))}
          </div>
        )}

        {/* ── Station split view ── */}
        {safeKdsCards.length > 0 && view === "station" && (
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14, overflowY: "auto", flex: 1 }}>
            {["Bar", "Kitchen", "Packaging", "Dessert"].map(station => {
              const stCards = sorted.filter(c => c.station === station);
              const stationColorMap = {
                Bar: { color: C.blue },
                Kitchen: { color: C.purple },
                Packaging: { color: C.green },
                Dessert: { color: C.amber2 },
              };
              const colors = stationColorMap[station] || { color: C.text3 };
              const urgentInStation = stCards.filter(c => c.urgency === "urgent").length;
              return (
                <div key={station} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: C.bg2, borderRadius: 7, border: `1px solid ${C.border}`, borderTop: `2px solid ${colors.color}` }}>
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.color }}>{station}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: stCards.length > 0 ? C.text2 : C.text3 }}>{stCards.length}</span>
                    {urgentInStation > 0 && (
                      <span style={{ fontSize: 9, color: C.red, fontWeight: 800, background: `${C.red}18`, borderRadius: 4, padding: "2px 6px", letterSpacing: "0.05em", fontFamily: "monospace" }}>{urgentInStation} URG</span>
                    )}
                  </div>
                  {stCards.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: C.text3, fontSize: 11, borderRadius: 7, border: `1px dashed ${C.border}` }}>No tickets</div>}
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setHoldReasonModal(null); setHoldError(""); }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 24, width: 380, maxWidth: "95%", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amber, marginBottom: 6 }}>Hold Ticket</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 16, letterSpacing: "-0.02em" }}>Why is this on hold?</div>
            <textarea
              style={{ ...input, resize: "none", marginBottom: holdError ? 6 : 16, fontSize: 13 }}
              rows={3}
              maxLength={200}
              placeholder="e.g. waiting on oat milk, customer stepped out…"
              autoFocus
              onChange={() => { if (holdError) setHoldError(""); }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  confirmHold(e.target.value);
                }
              }}
            />
            {holdError && <div style={{ color: C.red, fontSize: 11, marginBottom: 12 }}>{holdError}</div>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setHoldReasonModal(null); setHoldError(""); }} style={{ ...btn("ghost"), padding: "9px 16px", fontSize: 13 }}>Cancel</button>
              <button onClick={() => {
                const textarea = document.querySelector("textarea");
                if (textarea) confirmHold(textarea.value);
              }} style={{ ...btn("primary"), padding: "9px 20px", fontSize: 13, fontWeight: 700, background: C.amber, borderColor: C.amber3, color: C.bg }}>Hold</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move Station Modal ── */}
      {moveStationModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setMoveStationModal(null); setMoveError(""); }}>
          <div style={{ background: C.bg2, border: `1px solid ${C.border2}`, borderRadius: 12, padding: 24, width: 360, maxWidth: "95%", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.text3, marginBottom: 6 }}>Move Ticket</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text1, marginBottom: 16, letterSpacing: "-0.02em" }}>Send to station</div>
            {moveError && <div style={{ color: C.red, fontSize: 11, marginBottom: 12 }}>{moveError}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { name: "Bar", color: C.blue },
                { name: "Kitchen", color: C.purple },
                { name: "Packaging", color: C.green },
                { name: "Dessert", color: C.amber2 },
              ].map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => moveStation(moveStationModal, name)}
                  style={{ padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text1, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "background .15s", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg4}
                  onMouseLeave={e => e.currentTarget.style.background = C.bg3}
                >
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {name}
                </button>
              ))}
            </div>
            <button onClick={() => { setMoveStationModal(null); setMoveError(""); }} style={{ ...btn("ghost"), padding: "9px 16px", marginTop: 12, width: "100%", fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Done log side panel ── */}
      {showDoneLog && (
        <div style={{ width: isMobile ? "100%" : "min(240px, 85vw)", background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 12px", overflowY: "auto", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase", color: C.text3, marginBottom: 2 }}>Completed</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text1, letterSpacing: "-0.02em" }}>{doneLog.length} tickets</div>
            </div>
            <button onClick={recallLast} disabled={!doneLog.length} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${C.border2}`, background: "transparent", color: doneLog.length ? C.text2 : C.text3, cursor: doneLog.length ? "pointer" : "default" }}>↩ Recall</button>
          </div>
          {doneLog.length === 0 && <div style={{ fontSize: 12, color: C.text3, textAlign: "center", padding: "24px 0", borderRadius: 7, border: `1px dashed ${C.border}` }}>Nothing completed yet</div>}
          {doneLog.map((d, i) => {
            const mins = d.duration ? Math.floor(d.duration / 60) : 0;
            const secs = d.duration ? d.duration % 60 : 0;
            const stationDotColors = { Bar: C.blue, Kitchen: C.purple, Packaging: C.green, Dessert: C.amber2 };
            return (
              <div key={i} style={{ padding: "9px 10px", background: C.bg3, borderRadius: 7, borderLeft: `2px solid ${C.green}40` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 800, color: C.text2 }}>{d.id}</span>
                  <span style={{ color: C.green, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{mins}m{String(secs).padStart(2,"0")}s</span>
                </div>
                <div style={{ color: C.text3, fontSize: 11, lineHeight: 1.5 }}>{d.items?.map(it => `${it.name} ×${it.qty}`).join(", ")}</div>
                {d.station && (
                  <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: stationDotColors[d.station] || C.text3 }} />
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: stationDotColors[d.station] || C.text3 }}>{d.station}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Kitchen;
