import React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { C, card, input, btn, URGENCY_ORDER, emptyState } from "../../styles/theme";
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
import { triggerKitchenNotification } from "../../utils/notificationTriggers.js";
import { saveNotifications } from "../../utils/notificationService.js";
import printEngine, { DOCUMENT_TYPES } from "../../print/printEngine.js";
import { getActiveShift } from "../../domain/shiftModel.js";
import moduleEventPublisher from "../../dashboard/liveEngine/ModuleEventPublisher.js";
import { useTerminal } from "../../terminal/TerminalContext.jsx";

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

function Kitchen({ kdsCards, setKdsCards, orders, setOrders, tables, notifications, setNotifications, shifts, setShifts }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);
  
  // ── Multi-Terminal Integration ─────────────────────────────────────────────
  const { currentTerminal, syncClient } = useTerminal();

  const [isFullScreen, setIsFullScreen] = useState(true);
  const [view, setView] = useState("cards");
  const [doneLog, setDoneLog] = useState([]);
  const [sortBy, setSortBy] = useState("time");
  const [showDoneLog, setShowDoneLog] = useState(false);
  const [stationFilter, setStationFilter] = useState("All");
  const [holdReasonModal, setHoldReasonModal] = useState(null);
  const [moveStationModal, setMoveStationModal] = useState(null);
  const [draggedTicket, setDraggedTicket] = useState(null);
  const [dragOverStation, setDragOverStation] = useState(null);
  const [stationOrder, setStationOrder] = useState(["Bar", "Kitchen", "Packaging", "Dessert"]);

  // ── Usability additions: search, keyboard nav, toasts, sound ──────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedCardId, setFocusedCardId] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem("kds_sound_enabled") !== "0"; } catch { return true; }
  });
  const searchInputRef = useRef(null);
  const toastIdRef = useRef(0);
  const holdReasonInputRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // { message, onUndo? } — auto-dismisses after 6s, can be dismissed/undone earlier
  const addToast = useCallback((toast) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-3), { id, ...toast }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  }, []);

  const playChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      osc.onended = () => ctx.close();
    } catch {
      // Ignore audio failures (autoplay restrictions, unsupported browser, etc.)
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("kds_sound_enabled", next ? "1" : "0"); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Notification helper
  const addNotification = useCallback((notification) => {
    if (!notification || !setNotifications) return;
    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [setNotifications]);

  // ── Real-time Sync Integration ─────────────────────────────────────────────
  useEffect(() => {
    if (!syncClient || !currentTerminal) return;

    // Listen for order events from other terminals
    const handleOrderCreated = (data) => {
      console.log('[Kitchen] Order created from another terminal:', data);
      if (data.sourceTerminal !== currentTerminal.id) {
        // Create KDS tickets for the new order
        const newOrder = data.data;
        const tickets = createKdsTicketsFromOrder(newOrder);
        if (tickets?.length && setKdsCards) {
          setKdsCards(prev => [...tickets, ...prev]);
          addToast({ message: `New order from ${data.sourceTerminal}` });
        }
      }
    };

    const handleOrderUpdated = (data) => {
      console.log('[Kitchen] Order updated from another terminal:', data);
      if (data.sourceTerminal !== currentTerminal.id) {
        // Update KDS tickets if order status changed
        const updatedOrder = data.data;
        setKdsCards(prev => prev.map(ticket => 
          ticket.orderId === updatedOrder.id 
            ? { ...ticket, orderStatus: updatedOrder.status }
            : ticket
        ));
      }
    };

    const handleOrderDeleted = (data) => {
      console.log('[Kitchen] Order deleted from another terminal:', data);
      if (data.sourceTerminal !== currentTerminal.id) {
        // Remove KDS tickets for the deleted order
        setKdsCards(prev => prev.filter(ticket => ticket.orderId !== data.data.orderId));
        addToast({ message: `Order cancelled by ${data.sourceTerminal}` });
      }
    };

    const handleOrderToKitchen = (data) => {
      console.log('[Kitchen] Order routed to kitchen:', data);
      // Create KDS tickets for routed order
      const tickets = createKdsTicketsFromOrder(data.data);
      if (tickets?.length && setKdsCards) {
        setKdsCards(prev => [...tickets, ...prev]);
        playChime();
      }
    };

    syncClient.on('order_created', handleOrderCreated);
    syncClient.on('order_updated', handleOrderUpdated);
    syncClient.on('order_deleted', handleOrderDeleted);
    syncClient.on('order_to_kitchen', handleOrderToKitchen);

    return () => {
      syncClient.off('order_created', handleOrderCreated);
      syncClient.off('order_updated', handleOrderUpdated);
      syncClient.off('order_deleted', handleOrderDeleted);
      syncClient.off('order_to_kitchen', handleOrderToKitchen);
    };
  }, [syncClient, currentTerminal, setKdsCards, addToast, playChime]);

  // Safe base list: never let a null/undefined/malformed kdsCards crash the screen
  const safeKdsCards = useMemo(() => {
    if (!Array.isArray(kdsCards)) return [];
    return kdsCards.filter(c => {
      const ok = c && typeof c === "object" && c.orderId;
      if (!ok && typeof import.meta !== "undefined" && import.meta.env?.DEV) {
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

  // Alert staff (sound + toast) when a brand-new ticket lands
  const knownTicketIdsRef = useRef(new Set());
  const firstTicketSyncRef = useRef(true);
  useEffect(() => {
    const currentIds = new Set(safeKdsCards.filter(c => !c.completed).map(c => c.id));
    if (firstTicketSyncRef.current) {
      knownTicketIdsRef.current = currentIds;
      firstTicketSyncRef.current = false;
      return;
    }
    const arrivals = safeKdsCards.filter(c => !c.completed && !knownTicketIdsRef.current.has(c.id));
    if (arrivals.length > 0) {
      if (soundEnabled) playChime();
      arrivals.forEach(t => {
        addToast({ message: `🔔 New ticket ${t.orderId || t.id}${t.station ? ` · ${t.station}` : ""}` });
      });
    }
    knownTicketIdsRef.current = currentIds;
  }, [safeKdsCards, soundEnabled, playChime, addToast]);

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

  // Check for unaccepted tickets and trigger notifications
  useEffect(() => {
    const interval = setInterval(() => {
      safeKdsCards.forEach(ticket => {
        if (!ticket || ticket.startedAt || ticket.completed || ticket.held) return;
        const waitTime = getMinutesElapsed(ticket.createdAt);
        if (waitTime >= 3) {
          const notif = triggerKitchenNotification(ticket, 'TICKET_UNACCEPTED', { waitTime });
          addNotification(notif);
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [safeKdsCards, addNotification]);

  // Sync KDS cards with orders - create KDS cards for new orders
  const syncKDSWithOrders = useCallback(() => {
    if (!Array.isArray(orders)) return;

    orders.forEach(order => {
      // Guard against malformed orders crashing the screen
      if (!order || typeof order !== "object" || !order.id || !order.status) {
        if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
          console.warn("[Kitchen] skipped malformed order", order);
        }
        return;
      }

      const existingForOrder = (kdsCards || []).filter(c => c && c.orderId === order.id);

      // Only create KDS cards for valid active orders that don't already have tickets
      if ((order.status === "ACCEPTED" || order.status === "PREPARING") && existingForOrder.length === 0) {
        if (!Array.isArray(order.items) || order.items.length === 0) {
          if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
            console.warn("[Kitchen] order missing items, skipping KDS ticket creation", order.id);
          }
          return;
        }
        let newTickets = [];
        try {
          newTickets = createKdsTicketsFromOrder(order) || [];
        } catch (error) {
          if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
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
            if (toAdd.length < newTickets.length && typeof import.meta !== "undefined" && import.meta.env?.DEV) {
              console.warn("[Kitchen] skipped duplicate KDS ticket(s) for order", order.id);
            }
            return toAdd.length > 0 ? [...prevSafe, ...toAdd] : prevSafe;
          });
          
          // Trigger notification for new tickets
          newTickets.forEach(ticket => {
            const notif = triggerKitchenNotification(ticket, 'NEW_TICKET');
            addNotification(notif);
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
              if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
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
              if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
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

  // Drag and drop handlers
  const handleDragStart = useCallback((e, ticket) => {
    setDraggedTicket(ticket);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticket.id);
  }, []);

  const handleDragOver = useCallback((e, station) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStation(station);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverStation(null);
  }, []);

  const handleDrop = useCallback((e, targetStation) => {
    e.preventDefault();
    setDragOverStation(null);

    const ticket = draggedTicket;
    setDraggedTicket(null);
    if (!ticket || !targetStation) return;

    // Mirror the same guards the Move Station modal enforces, so dragging
    // a ticket can't silently move a completed ticket, target an invalid
    // station, or create a duplicate ticket for the same order+station.
    if (ticket.completed) return;
    if (!KDS_STATIONS.includes(targetStation) || targetStation === "All") return;
    if (ticket.station === targetStation) return;
    const duplicate = (kdsCards || []).some(c => c && c.id !== ticket.id && c.orderId === ticket.orderId && c.station === targetStation && !c.completed);
    if (duplicate) return;

    try {
      const updatedTicket = moveKdsTicketToStation(ticket, targetStation);
      setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => (c && c.id === ticket.id ? updatedTicket : c)));
    } catch (error) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[Kitchen] failed to move ticket via drag", error);
    }
  }, [draggedTicket, kdsCards, setKdsCards]);

  const handleStationDragStart = useCallback((e, station) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', station);
  }, []);

  const handleStationDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const draggedStation = e.dataTransfer.getData('text/plain');
    
    if (!draggedStation) return;
    
    const newOrder = [...stationOrder];
    const fromIndex = newOrder.indexOf(draggedStation);
    
    if (fromIndex === -1 || fromIndex === targetIndex) return;
    
    newOrder.splice(fromIndex, 1);
    newOrder.splice(targetIndex, 0, draggedStation);
    
    setStationOrder(newOrder);
  }, [stationOrder]);

  // Complete ticket and check if order should be marked as READY
  const completeCard = useCallback((id) => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card || card.completed) return;

    let completedTicket;
    try {
      completedTicket = completeKdsTicket(card);
    } catch (error) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[Kitchen] failed to complete ticket", id, error);
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

        // Publish event for real-time Dashboard synchronization
        moduleEventPublisher.publishOrderEvent('order.ready', {
          orderId: card.orderId,
          tableId: card.tableId,
          station: card.station
        });

        moduleEventPublisher.publishKitchenEvent('kitchen.ready', {
          orderId: card.orderId,
          cardId: card.id,
          station: card.station
        });
      }

      // Publish event for individual ticket completion
      moduleEventPublisher.publishKitchenEvent('kitchen.completed', {
        cardId: card.id,
        orderId: card.orderId,
        station: card.station,
        duration: Math.round((completedAt - startedAt) / 1000)
      });

      return next;
    });

    // Update current shift with kitchen ticket completion
    const currentShift = getActiveShift(shifts, 'REG-001');
    if (currentShift && setShifts) {
      try {
        const updatedShift = { ...currentShift, kitchenTickets: (currentShift.kitchenTickets || 0) + 1 };
        setShifts(prev => prev.map(s => s.id === currentShift.id ? updatedShift : s));
      } catch (e) {
        if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[Kitchen] failed to update shift", e);
      }
    }

    addToast({
      message: `Ticket ${card.orderId || card.id} marked done`,
      onUndo: () => {
        setDoneLog(l => (Array.isArray(l) ? l : []).filter(d => d.id !== card.id));
        setKdsCards(prev => [card, ...(Array.isArray(prev) ? prev : [])]);
      },
    });
  }, [kdsCards, setOrders, shifts, setShifts, addToast]);

  const [holdError, setHoldError] = useState("");

  const holdCard = useCallback((id, reason = "") => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card) return;

    if (card.held) {
      // Release from hold: clear held and holdReason, never touch completed tickets
      if (card.completed) return;
      setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === id ? releaseKdsTicket(c) : c));

      // Publish event for real-time Dashboard synchronization
      moduleEventPublisher.publishKitchenEvent('kitchen.released', {
        cardId: card.id,
        orderId: card.orderId,
        station: card.station
      });
    } else {
      const trimmed = (reason || "").trim();
      if (trimmed) {
        if (trimmed.length > 200) {
          setHoldError("Hold reason must be 200 characters or fewer.");
          return;
        }
        setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === id ? holdKdsTicket(c, trimmed) : c));

        // Publish event for real-time Dashboard synchronization
        moduleEventPublisher.publishKitchenEvent('kitchen.held', {
          cardId: card.id,
          orderId: card.orderId,
          station: card.station,
          reason: trimmed
        });
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
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[Kitchen] invalid item index", cardId, itemIdx);
      return;
    }

    let updatedTicket;
    try {
      updatedTicket = toggleKdsItemCheck(card, itemIdx, !card.items[itemIdx].checked);
    } catch (error) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[Kitchen] failed to toggle item check", error);
      return;
    }
    setKdsCards(prev => (Array.isArray(prev) ? prev : []).map(c => c.id === cardId ? updatedTicket : c));
  }, [kdsCards, setKdsCards]);

  const startTicket = useCallback((id) => {
    const card = (kdsCards || []).find(c => c && c.id === id);
    if (!card) return;
    
    setKdsCards(prev => prev.map(c => c.id === id ? startKdsTicket(c) : c));
    
    // Publish event for real-time Dashboard synchronization
    moduleEventPublisher.publishKitchenEvent('kitchen.started', {
      cardId: card.id,
      orderId: card.orderId,
      station: card.station,
      items: card.items
    });
    
    // Print kitchen ticket when started
    try {
      const order = (orders || []).find(o => o.id === card.orderId);
      if (order) {
        printEngine.addToQueue({
          type: DOCUMENT_TYPES.KITCHEN_TICKET,
          data: {
            order: {
              orderNumber: order.id,
              createdAt: order.createdAt,
              table: order.tableId
            },
            items: card.items || [],
            station: {
              name: card.station
            },
            urgency: card.urgency || 'normal',
            isReprint: false
          },
          template: {},
          paperSize: '80mm',
          printerId: 'kitchen'
        }).catch(err => {
          console.warn('Kitchen ticket print failed:', err);
        });
      }
    } catch (printError) {
      console.warn('Failed to queue kitchen ticket print:', printError);
    }
  }, [kdsCards, setKdsCards, orders]);

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
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[Kitchen] failed to bump ticket", id, error);
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

    addToast({
      message: `Ticket ${card.orderId || card.id} bumped`,
      onUndo: () => {
        setDoneLog(l => (Array.isArray(l) ? l : []).filter(d => d.id !== card.id));
        setKdsCards(prev => [card, ...(Array.isArray(prev) ? prev : [])]);
      },
    });
  }, [kdsCards, setOrders, addToast]);

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

    addToast({
      message: `Bumped ${done.length} ticket${done.length === 1 ? "" : "s"}`,
      onUndo: () => {
        const ids = new Set(done.map(d => d.id));
        setDoneLog(l => (Array.isArray(l) ? l : []).filter(d => !ids.has(d.id)));
        setKdsCards(prev => [...done, ...(Array.isArray(prev) ? prev : [])]);
      },
    });
  };

  const recallLast = () => {
    if (!doneLog.length) return;
    const [last, ...rest] = doneLog;
    const { completedAt, duration, ...card } = last;
    setKdsCards(prev => [card, ...prev]);
    setDoneLog(rest);
  };

  const calculatePrepTime = (card) => {
    const items = Array.isArray(card?.items) ? card.items : [];
    let totalTime = 0;
    items.forEach(item => {
      const qty = Number.isFinite(Number(item?.qty)) && Number(item.qty) > 0 ? Number(item.qty) : 1;
      const prepTime = PREP_TIMES[item?.name];
      totalTime += (Number.isFinite(prepTime) ? prepTime : 5) * qty; // default 5 mins if unknown
    });
    return Number.isFinite(totalTime) ? totalTime : 0;
  };

  const getPrepTimeStatus = (card) => {
    const prepTime = calculatePrepTime(card);
    const startedAt = Number.isFinite(Number(card?.startedAt)) ? Number(card.startedAt) : null;
    const elapsedMinutes = startedAt !== null ? Math.floor((Date.now() - startedAt) / 60000) : 0;
    const remaining = Math.max(0, prepTime - elapsedMinutes);

    if (startedAt !== null && elapsedMinutes > prepTime + 3) return { label: "Delayed", color: C.red };
    if (remaining === 0) return { label: "Ready", color: C.green };
    if (remaining <= 2) return { label: `${remaining}m left`, color: C.amber };
    return { label: `${remaining}m left`, color: C.text3 };
  };

  const visibleCards = Array.isArray(filteredTickets) ? filteredTickets : [];
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchedCards = trimmedQuery
    ? visibleCards.filter(c => {
        const orderMatch = String(c.orderId || c.id || "").toLowerCase().includes(trimmedQuery);
        const itemMatch = Array.isArray(c.items) && c.items.some(it => String(it?.name || "").toLowerCase().includes(trimmedQuery));
        const noteMatch = String(c.note || "").toLowerCase().includes(trimmedQuery);
        return orderMatch || itemMatch || noteMatch;
      })
    : visibleCards;
  const sorted = [...searchedCards].sort((a, b) => {
    if (sortBy === "time") return (a.startedAt || 0) - (b.startedAt || 0);
    if (sortBy === "urgency") return (URGENCY_ORDER[a.urgency] ?? 0) - (URGENCY_ORDER[b.urgency] ?? 0);
    if (sortBy === "source") return String(a.source || "").localeCompare(String(b.source || ""));
    return 0;
  });

  const urgentCount = activeTickets.filter(c => c.urgency === "urgent").length;
  const heldCount = heldTickets.length;
  const delayedCount = activeTickets.filter(c => !c.held && c.startedAt && getPrepTimeStatus(c).label === "Delayed").length;
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

  // Surface urgent/delayed count in the browser tab so staff can see status from any tab
  useEffect(() => {
    const originalTitle = document.title;
    const baseTitle = originalTitle.replace(/^\(\d+\)\s*/, "");
    const pending = urgentCount + delayedCount;
    document.title = pending > 0 ? `(${pending}) ${baseTitle}` : baseTitle;
    return () => { document.title = baseTitle; };
  }, [urgentCount, delayedCount]);

  // Global keyboard shortcuts: navigate tickets and act on the focused one
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable;

      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (isTyping) { e.target.blur(); return; }
        setFocusedCardId(null);
        return;
      }
      if (isTyping) return;
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(v => !v);
        return;
      }

      const list = sorted;
      if (list.length === 0) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "j") {
        e.preventDefault();
        setFocusedCardId(prev => {
          const idx = list.findIndex(c => c.id === prev);
          const next = idx === -1 ? 0 : Math.min(idx + 1, list.length - 1);
          return list[next]?.id ?? prev;
        });
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "k") {
        e.preventDefault();
        setFocusedCardId(prev => {
          const idx = list.findIndex(c => c.id === prev);
          const next = idx === -1 ? 0 : Math.max(idx - 1, 0);
          return list[next]?.id ?? prev;
        });
        return;
      }

      if (!focusedCardId) return;
      const focusedCard = list.find(c => c.id === focusedCardId);
      if (!focusedCard) return;

      if (e.key === "Enter" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        completeCard(focusedCard.id);
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        holdCard(focusedCard.id, focusedCard.held ? undefined : "");
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        startTicket(focusedCard.id);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        bumpTicket(focusedCard.id);
      } else if (e.key === "1" || e.key === "2" || e.key === "3") {
        e.preventDefault();
        const urgency = e.key === "1" ? "ok" : e.key === "2" ? "soon" : "urgent";
        changeUrgency(focusedCard.id, urgency);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sorted, focusedCardId, showShortcuts, completeCard, holdCard, startTicket, bumpTicket, changeUrgency]);

  return (
    <>
    <style>{`
      @keyframes kdsUrgentPulse {
        0%, 100% {
          box-shadow: 0 0 0 1px rgba(229,57,53,0.3), 0 4px 32px rgba(229,57,53,0.12), 0 2px 8px rgba(0,0,0,0.6);
        }
        50% {
          box-shadow: 0 0 0 1px rgba(229,57,53,0.55), 0 4px 40px rgba(229,57,53,0.22), 0 0 16px rgba(229,57,53,0.1), 0 2px 8px rgba(0,0,0,0.5);
        }
      }
      @keyframes kdsToastIn {
        from { opacity: 0; transform: translateY(10px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes kdsCardIn {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes stationRailGlow {
        0%, 100% { opacity: 0.7; }
        50%       { opacity: 1; }
      }
      .kds-secondary-btn:hover:not(:disabled) {
        filter: brightness(1.15);
        transform: translateY(-1px);
      }
      .kds-secondary-btn:active:not(:disabled) {
        transform: translateY(0) scale(0.97);
      }
      .kds-stat-card:hover {
        border-color: rgba(212,146,42,0.2) !important;
      }
    `}</style>
    <div style={isFullScreen ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "var(--cafe-bg)", display: "flex", gap: "var(--cafe-space-lg)", padding: "16px", flexDirection: isMobile && showDoneLog ? "column" : "row" } : { display: "flex", gap: "var(--cafe-space-lg)", flex: 1, height: isMobile ? "auto" : "100%", minHeight: 400, flexDirection: isMobile && showDoneLog ? "column" : "row" }}>
      {/* Main KDS panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── Kitchen Flow Header ── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 3 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: "var(--cafe-text-primary)", letterSpacing: "-0.03em" }}>Kitchen Flow</span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cafe-text-tertiary)" }}>Live</span>
            {urgentCount > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: "var(--cafe-danger)", background: "rgba(229,57,53,0.12)", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.05em", animation: "stationRailGlow 1.4s ease-in-out infinite" }}>
                {urgentCount} URGENT
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button onClick={() => setIsFullScreen(!isFullScreen)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: "var(--cafe-bg-hover)", color: "var(--cafe-text-secondary)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {isFullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginBottom: 12 }}>
            Live tickets across bar, kitchen, and packaging
          </div>

          {/* ── Premium Stat Cards ── */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: "Waiting",
                count: activeTickets.filter(c => !c.startedAt).length,
                color: "var(--cafe-info)",
                glow: "rgba(33,150,243,0.25)",
                icon: "⏳",
              },
              {
                label: "Preparing",
                count: activeTickets.filter(c => c.startedAt && !c.completed).length,
                color: "var(--cafe-warning)",
                glow: "rgba(255,152,0,0.25)",
                icon: "🔥",
              },
              {
                label: "Ready",
                count: activeTickets.filter(c => Array.isArray(c.items) && c.items.length > 0 && c.items.every(it => it && it.checked)).length,
                color: "var(--cafe-success)",
                glow: "rgba(76,175,80,0.25)",
                icon: "✓",
              },
              {
                label: "Urgent",
                count: urgentCount,
                color: urgentCount > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)",
                glow: urgentCount > 0 ? "rgba(229,57,53,0.3)" : "transparent",
                icon: "🚨",
                highlight: urgentCount > 0,
              },
              {
                label: "Delayed",
                count: delayedCount,
                color: delayedCount > 0 ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)",
                glow: delayedCount > 0 ? "rgba(229,57,53,0.2)" : "transparent",
                icon: "⚠️",
              },
              {
                label: "On Hold",
                count: heldCount,
                color: heldCount > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                glow: heldCount > 0 ? "rgba(212,146,42,0.2)" : "transparent",
                icon: "⏸",
              },
              {
                label: "Done Today",
                count: completedTodayCount,
                color: "var(--cafe-success)",
                glow: "rgba(76,175,80,0.15)",
                icon: "🏁",
              },
              ...(avgDuration !== null ? [{
                label: "Avg Time",
                count: `${Math.floor(avgDuration / 60)}m${String(avgDuration % 60).padStart(2, "00")}s`,
                color: "var(--cafe-text-secondary)",
                glow: "transparent",
                icon: "⏱",
              }] : []),
            ].map(chip => (
              <div
                key={chip.label}
                className="kds-stat-card"
                style={{
                  background: chip.highlight
                    ? "rgba(229,57,53,0.08)"
                    : "rgba(28,24,20,0.85)",
                  backdropFilter: "blur(8px)",
                  border: chip.highlight
                    ? "1px solid rgba(229,57,53,0.3)"
                    : "1px solid var(--cafe-border-light)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  transition: "border-color .2s, box-shadow .2s",
                  boxShadow: chip.highlight
                    ? `0 0 16px ${chip.glow}, 0 1px 4px rgba(0,0,0,0.5)`
                    : "0 1px 4px rgba(0,0,0,0.4)",
                  cursor: "default",
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>{chip.icon}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span style={{ fontSize: 9, color: "var(--cafe-text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1 }}>
                    {chip.label}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: chip.color, fontFamily: "monospace", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                    {chip.count}
                  </span>
                </div>
                {/* Right accent line based on glow color */}
                <div style={{ width: 2, height: 28, borderRadius: 99, background: chip.color, opacity: Number(chip.count) > 0 ? 0.5 : 0.1, marginLeft: "auto", flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Station Rail ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{
            display: "flex",
            gap: 5,
            overflowX: "auto",
            paddingBottom: 3,
            background: "var(--cafe-bg-surface)",
            backdropFilter: "blur(8px)",
            borderRadius: 10,
            padding: "6px 8px",
            border: "1px solid var(--cafe-border-light)",
          }}>
            {KDS_STATIONS.map(station => {
              const active = stationFilter === station;
              const count = stationCounts[station] || 0;
              const stationColorMap = {
                All:       { color: "var(--cafe-accent)",   glow: "var(--cafe-amber-bg)",  bg: "var(--cafe-amber-bg)" },
                Bar:       { color: "var(--cafe-info)",     glow: "var(--cafe-blue-bg)",   bg: "var(--cafe-blue-bg)" },
                Kitchen:   { color: "var(--cafe-purple)",   glow: "var(--cafe-purple-bg)", bg: "var(--cafe-purple-bg)" },
                Packaging: { color: "var(--cafe-success)",  glow: "var(--cafe-green-bg)",   bg: "var(--cafe-green-bg)" },
                Dessert:   { color: "var(--cafe-warning)",  glow: "var(--cafe-amber-bg)",   bg: "var(--cafe-amber-bg)" },
              };
              const sc = stationColorMap[station] || { color: "var(--cafe-text-tertiary)", glow: "transparent", bg: "transparent" };
              const isValidDropTarget = station !== "All";
              const isDragOver = isValidDropTarget && dragOverStation === station;
              return (
                <button
                  key={station}
                  onClick={() => setStationFilter(station)}
                  onDragOver={isValidDropTarget ? (e) => handleDragOver(e, station) : undefined}
                  onDragLeave={isValidDropTarget ? handleDragLeave : undefined}
                  onDrop={isValidDropTarget ? (e) => handleDrop(e, station) : undefined}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 7,
                    border: isDragOver
                      ? `1px dashed var(--cafe-accent)`
                      : active
                      ? `1px solid ${sc.color}40`
                      : "1px solid transparent",
                    background: isDragOver
                      ? "rgba(212,146,42,0.1)"
                      : active
                      ? sc.bg
                      : "transparent",
                    color: active ? sc.color : "var(--cafe-text-tertiary)",
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    whiteSpace: "nowrap",
                    transition: "all .18s ease",
                    letterSpacing: active ? "0.01em" : "0",
                    boxShadow: active ? `0 0 12px ${sc.glow}` : "none",
                    flexShrink: 0,
                  }}
                >
                  {station}
                  {count > 0 && (
                    <span style={{
                      background: active ? sc.color : "var(--cafe-bg-hover)",
                      color: active ? "#0A0908" : "var(--cafe-text-tertiary)",
                      fontSize: 9,
                      fontFamily: "monospace",
                      fontWeight: 900,
                      padding: "2px 6px",
                      borderRadius: 4,
                      minWidth: 18,
                      textAlign: "center",
                      lineHeight: 1.4,
                    }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", marginBottom: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "nowrap", minWidth: "max-content" }}>
            {/* View toggle */}
            <div style={{ display: "flex", gap: 0, background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 8, overflow: "hidden" }}>
              {[["cards","Cards"],["list","List"],["station","Station"]].map(([v, lbl]) => (
                <button key={v} onClick={() => setView(v)} style={{ padding: "8px 14px", border: "none", borderRight: "1px solid var(--cafe-border-light)", background: view === v ? "rgba(212,146,42,0.15)" : "transparent", color: view === v ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", fontSize: 11, cursor: "pointer", fontWeight: view === v ? 700 : 500, minHeight: 36, transition: "all .15s", whiteSpace: "nowrap", letterSpacing: view === v ? "0.01em" : "0" }}>{lbl}</button>
              ))}
            </div>
            {/* Sort */}
            <select
              style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 7, padding: "7px 10px", color: "var(--cafe-text-secondary)", fontSize: 11, outline: "none", minHeight: 36, fontFamily: "inherit", cursor: "pointer" }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="time">Oldest first</option>
              <option value="urgency">By urgency</option>
              <option value="source">By source</option>
            </select>
            {/* Search */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") { setSearchQuery(""); e.currentTarget.blur(); } }}
                placeholder="Search order # or item…  /"
                aria-label="Search tickets"
                style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 7, padding: "7px 28px 7px 10px", width: 200, minHeight: 36, color: "var(--cafe-text-secondary)", fontSize: 11, outline: "none", fontFamily: "inherit" }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} aria-label="Clear search"
                  style={{ position: "absolute", right: 8, background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 11, padding: 4 }}>✕</button>
              )}
            </div>
            {/* Bulk actions */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
              {safeKdsCards.filter(c => !c.held && c.urgency !== "urgent").length > 0 && (
                <button onClick={bumpAllNonUrgent} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.08)", color: "var(--cafe-success)", fontSize: 11, cursor: "pointer", fontWeight: 700, minHeight: 36 }}>Bump Non-Urgent</button>
              )}
              {doneLog.length > 0 && (
                <button onClick={recallLast} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-tertiary)", fontSize: 11, cursor: "pointer", minHeight: 36 }}>↩ Recall</button>
              )}
              <button onClick={() => setShowDoneLog(v => !v)} style={{ padding: "7px 12px", borderRadius: 7, border: `1px solid ${showDoneLog ? "rgba(212,146,42,0.4)" : "var(--cafe-border-light)"}`, background: showDoneLog ? "rgba(212,146,42,0.1)" : "transparent", color: showDoneLog ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", fontSize: 11, cursor: "pointer", minHeight: 36, display: "flex", alignItems: "center", gap: 7 }}>
                Log
                {doneLog.length > 0 && <span style={{ fontFamily: "monospace", fontSize: 9, background: showDoneLog ? "var(--cafe-accent)" : "var(--cafe-bg-hover)", padding: "2px 6px", borderRadius: 3, color: showDoneLog ? "#0A0908" : "var(--cafe-text-tertiary)", fontWeight: 900 }}>{doneLog.length}</span>}
              </button>
              <button onClick={toggleSound} aria-label={soundEnabled ? "Mute" : "Unmute"}
                style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--cafe-border-light)", background: "transparent", color: soundEnabled ? "var(--cafe-text-secondary)" : "var(--cafe-text-tertiary)", fontSize: 13, cursor: "pointer", minHeight: 36 }}>
                {soundEnabled ? "🔔" : "🔕"}
              </button>
              <button onClick={() => setShowShortcuts(true)} aria-label="Keyboard shortcuts"
                style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid var(--cafe-border-light)", background: "transparent", color: "var(--cafe-text-tertiary)", fontSize: 11, fontWeight: 800, cursor: "pointer", minHeight: 36, letterSpacing: "0.02em" }}>?</button>
            </div>
          </div>
        </div>

        {focusedCardId && (
          <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: -8, marginBottom: "var(--cafe-space-md)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--cafe-accent)" }}>●</span> Ticket focused — Enter/D done · H hold · S start · B bump · 1/2/3 urgency · Esc clear
          </div>
        )}

        {/* ── Empty state ── */}
        {safeKdsCards.length === 0 && (
          <div style={emptyState}>
            <div style={{ fontSize: 40, marginBottom: "var(--cafe-space-md)", opacity: 0.3 }}>🎫</div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
              Kitchen is clear
            </div>
            <div style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-tertiary)" }}>
              No tickets on this rail
            </div>
          </div>
        )}

        {/* ── No search results ── */}
        {safeKdsCards.length > 0 && sorted.length === 0 && trimmedQuery && (
          <div style={emptyState}>
            <div style={{ fontSize: 40, marginBottom: "var(--cafe-space-md)", opacity: 0.3 }}>🔍</div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 600, color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
              No tickets match "{searchQuery.trim()}"
            </div>
            <button onClick={() => setSearchQuery("")} style={{ ...btn("ghost"), marginTop: "var(--cafe-space-sm)", padding: "8px 16px", fontSize: "var(--cafe-font-sm)" }}>Clear search</button>
          </div>
        )}

        {/* ── Cards view ── */}
        {safeKdsCards.length > 0 && sorted.length > 0 && view === "cards" && (
          <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 12 }} className="kitchen-grid">
              {sorted.map(card => {
                const table = tables?.find(t => t.id === card.tableId);
                return (
                <KDSCard
                  key={card.id}
                  card={card}
                  tableName={table?.number}
                  onDone={completeCard}
                  onHold={holdCard}
                  onUrgencyChange={changeUrgency}
                  onNoteEdit={editNote}
                  onItemCheck={checkItem}
                  onStart={startTicket}
                  onMoveStation={(id) => setMoveStationModal(id)}
                  onBump={bumpTicket}
                  onDragStart={(e) => handleDragStart(e, card)}
                  onFocusCard={setFocusedCardId}
                  focused={focusedCardId === card.id}
                  compact={false}
                />
                );
              })}
            </div>
          </div>
        )}

        {/* ── List view ── */}
        {safeKdsCards.length > 0 && sorted.length > 0 && view === "list" && (
          <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map(card => {
              const table = tables?.find(t => t.id === card.tableId);
              return (
              <div key={card.id} style={{ marginBottom: 8 }}>
                <KDSCard
                  card={card}
                  tableName={table?.number}
                  onDone={completeCard}
                  onHold={holdCard}
                  onUrgencyChange={changeUrgency}
                  onNoteEdit={editNote}
                  onItemCheck={checkItem}
                  onStart={startTicket}
                  onMoveStation={(id) => setMoveStationModal(id)}
                  onBump={bumpTicket}
                  onDragStart={(e) => handleDragStart(e, card)}
                  onFocusCard={setFocusedCardId}
                  focused={focusedCardId === card.id}
                  compact={true}
                />
              </div>
            )})}
          </div>
        )}

        {/* ── Station split view ── */}
        {safeKdsCards.length > 0 && view === "station" && (
          <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, overflowY: "auto", flex: 1 }}>
            {stationOrder.map((station, index) => {
              const stCards = sorted.filter(c => c.station === station);
              const stationColorMap = {
                Bar: { color: "var(--cafe-info)", bg: "var(--cafe-blue-bg)", border: "var(--cafe-blue-border)" },
                Kitchen: { color: "var(--cafe-purple)", bg: "var(--cafe-purple-bg)", border: "var(--cafe-purple-border)" },
                Packaging: { color: "var(--cafe-success)", bg: "var(--cafe-green-bg)", border: "var(--cafe-green-border)" },
                Dessert: { color: "var(--cafe-warning)", bg: "var(--cafe-amber-bg)", border: "var(--cafe-amber-border)" },
              };
              const colors = stationColorMap[station] || { color: "var(--cafe-text-tertiary)", bg: "var(--cafe-bg-hover)", border: "var(--cafe-border)" };
              const urgentInStation = stCards.filter(c => c.urgency === "urgent").length;
              const heldInStation = stCards.filter(c => c.held).length;
              const delayedInStation = stCards.filter(c => !c.held && !c.completed && c.startedAt && getPrepTimeStatus(c).label === "Delayed").length;
              const isDragOver = dragOverStation === station;
              return (
                <div 
                  key={station} 
                  style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--cafe-bg-hover)", border: `1px solid ${colors.border}`, borderRadius: 12, padding: 10, height: "100%", minHeight: 200 }}
                  onDragOver={(e) => handleDragOver(e, station)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, station)}
                >
                  <div 
                    draggable
                    onDragStart={(e) => handleStationDragStart(e, station)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => handleStationDrop(e, index)}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 10, 
                      padding: "12px 16px", 
                      background: isDragOver ? colors.bg : "var(--cafe-bg-surface)", 
                      borderRadius: 8, 
                      border: `1px solid ${isDragOver ? colors.color : colors.border}`, 
                      borderTop: `3px solid ${colors.color}`,
                      cursor: "move",
                      userSelect: "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: colors.color }}>{station}</span>
                    <span style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: stCards.length > 0 ? "var(--cafe-text-secondary)" : "var(--cafe-text-tertiary)" }}>{stCards.length}</span>
                    {urgentInStation > 0 && (
                      <span style={{ fontSize: 10, color: "var(--cafe-danger)", fontWeight: 800, background: "var(--cafe-danger-bg)", borderRadius: 4, padding: "3px 8px", letterSpacing: "0.05em", fontFamily: "monospace" }}>{urgentInStation} URG</span>
                    )}
                    {delayedInStation > 0 && (
                      <span style={{ fontSize: 10, color: "var(--cafe-danger)", fontWeight: 800, background: "var(--cafe-danger-bg)", borderRadius: 4, padding: "3px 8px", letterSpacing: "0.05em", fontFamily: "monospace" }}>{delayedInStation} LATE</span>
                    )}
                    {heldInStation > 0 && (
                      <span style={{ fontSize: 10, color: "var(--cafe-accent)", fontWeight: 800, background: "var(--cafe-accent-bg)", borderRadius: 4, padding: "3px 8px", letterSpacing: "0.05em", fontFamily: "monospace" }}>{heldInStation} HELD</span>
                    )}
                  </div>
                  {stCards.length === 0 && <div style={{ textAlign: "center", padding: "32px 0", color: "var(--cafe-text-tertiary)", fontSize: 12, borderRadius: 8, border: `1px dashed var(--cafe-border-light)`, background: "var(--cafe-bg-surface)" }}>No tickets</div>}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, overflowY: "auto" }}>
                    {stCards.map(card => {
                      const table = tables?.find(t => t.id === card.tableId);
                      return (
                      <div key={card.id} style={{ marginBottom: 8 }}>
                        <KDSCard
                          card={card} 
                          tableName={table?.number} 
                          onDone={completeCard} 
                          onHold={holdCard} 
                          onUrgencyChange={changeUrgency} 
                          onNoteEdit={editNote} 
                          onItemCheck={checkItem}
                          onStart={startTicket}
                          onMoveStation={(id) => setMoveStationModal(id)}
                          onBump={bumpTicket}
                          onDragStart={(e) => handleDragStart(e, card)}
                          onFocusCard={setFocusedCardId}
                          focused={focusedCardId === card.id}
                          compact={true} 
                        />
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Hold Reason Modal ── */}
      {holdReasonModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setHoldReasonModal(null); setHoldError(""); }}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 400, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cafe-accent)", marginBottom: 6 }}>Hold Ticket</div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: "var(--cafe-space-lg)", letterSpacing: "-0.02em" }}>Why is this on hold?</div>
            <textarea
              ref={holdReasonInputRef}
              style={{ ...input, resize: "none", marginBottom: holdError ? "var(--cafe-space-sm)" : "var(--cafe-space-lg)", fontSize: "var(--cafe-font-sm)" }}
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
            {holdError && <div style={{ color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs)", marginBottom: "var(--cafe-space-md)" }}>{holdError}</div>}
            <div style={{ display: "flex", gap: "var(--cafe-space-sm)", justifyContent: "flex-end" }}>
              <button onClick={() => { setHoldReasonModal(null); setHoldError(""); }} style={{ ...btn("ghost"), padding: "10px 16px", fontSize: "var(--cafe-font-sm)" }}>Cancel</button>
              <button onClick={() => {
                if (holdReasonInputRef.current) confirmHold(holdReasonInputRef.current.value);
              }} style={{ ...btn("primary"), padding: "10px 20px", fontSize: "var(--cafe-font-sm)", fontWeight: 700, background: "var(--cafe-accent)", borderColor: "var(--cafe-accent-dark)", color: "#1A1208" }}>Hold</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move Station Modal ── */}
      {moveStationModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => { setMoveStationModal(null); setMoveError(""); }}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 380, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 6 }}>Move Ticket</div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: "var(--cafe-space-lg)", letterSpacing: "-0.02em" }}>Send to station</div>
            {moveError && <div style={{ color: "var(--cafe-danger)", fontSize: "var(--cafe-font-xs)", marginBottom: "var(--cafe-space-md)" }}>{moveError}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--cafe-space-sm)" }}>
              {[
                { name: "Bar", color: "var(--cafe-info)" },
                { name: "Kitchen", color: "var(--cafe-purple)" },
                { name: "Packaging", color: "var(--cafe-success)" },
                { name: "Dessert", color: "var(--cafe-warning)" },
              ].map(({ name, color }) => (
                <button
                  key={name}
                  onClick={() => moveStation(moveStationModal, name)}
                  style={{ padding: "12px 16px", borderRadius: "var(--cafe-radius-md)", border: `1px solid var(--cafe-border-light)`, background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", fontSize: "var(--cafe-font-sm)", fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "background .15s", display: "flex", alignItems: "center", gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--cafe-bg-hover)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--cafe-bg-surface)"}
                >
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  {name}
                </button>
              ))}
            </div>
            <button onClick={() => { setMoveStationModal(null); setMoveError(""); }} style={{ ...btn("ghost"), padding: "10px 16px", marginTop: "var(--cafe-space-md)", width: "100%", fontSize: "var(--cafe-font-sm)" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Done log side panel ── */}
      {showDoneLog && (
        <div style={{
          width: isMobile ? "100%" : "min(268px, 85vw)",
          background: "var(--cafe-bg-elevated)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--cafe-border-light)",
          borderRadius: 12,
          padding: 14,
          overflowY: "auto",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>
          {/* Panel header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Recently Bumped</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em" }}>
                {doneLog.length} <span style={{ fontSize: 10, fontWeight: 500, color: "var(--cafe-text-tertiary)" }}>tickets</span>
              </div>
            </div>
            <button
              onClick={recallLast}
              disabled={!doneLog.length}
              style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: "var(--cafe-bg-hover)", color: doneLog.length ? "var(--cafe-text-secondary)" : "var(--cafe-text-tertiary)", fontSize: 10, fontWeight: 700, cursor: doneLog.length ? "pointer" : "default", letterSpacing: "0.02em" }}
            >
              ↩ Recall
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "2px 0" }} />

          {doneLog.length === 0 && (
            <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", textAlign: "center", padding: "20px 0", borderRadius: 8, border: "1px dashed var(--cafe-border-light)" }}>Nothing completed yet</div>
          )}
          {doneLog.map((d, i) => {
            const mins = d.duration ? Math.floor(d.duration / 60) : 0;
            const secs = d.duration ? d.duration % 60 : 0;
            const stationColors = {
              Bar: { color: "var(--cafe-info)",    bg: "rgba(33,150,243,0.12)" },
              Kitchen: { color: "var(--cafe-purple)",  bg: "rgba(156,39,176,0.12)" },
              Packaging: { color: "var(--cafe-success)", bg: "rgba(76,175,80,0.12)" },
              Dessert: { color: "var(--cafe-warning)",  bg: "rgba(255,152,0,0.12)" },
            };
            const sc = stationColors[d.station] || { color: "var(--cafe-text-tertiary)", bg: "var(--cafe-bg-hover)" };
            return (
              <div
                key={i}
                style={{
                  padding: "9px 11px",
                  background: "var(--cafe-bg-hover)",
                  borderRadius: 8,
                  borderLeft: "2px solid rgba(76,175,80,0.4)",
                  transition: "background .15s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 900, color: "var(--cafe-text-secondary)", letterSpacing: "0.02em" }}>{d.id}</span>
                  <span style={{ color: "var(--cafe-success)", fontSize: 10, fontFamily: "monospace", fontWeight: 800, background: "rgba(76,175,80,0.1)", padding: "1px 6px", borderRadius: 3 }}>
                    {mins}m{String(secs).padStart(2, "0")}s
                  </span>
                </div>
                <div style={{ color: "var(--cafe-text-tertiary)", fontSize: 11, lineHeight: 1.5 }}>
                  {d.items?.map(it => `${it.name} ×${it.qty}`).join(", ")}
                </div>
                {d.station && (
                  <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: sc.color }}>{d.station}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Keyboard shortcuts help ── */}
      {showShortcuts && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setShowShortcuts(false)}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: `1px solid var(--cafe-border)`, borderRadius: "var(--cafe-radius-lg)", padding: "var(--cafe-space-xl)", width: 420, maxWidth: "95%", boxShadow: "var(--cafe-shadow-xl)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "var(--cafe-font-xs)", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cafe-accent)", marginBottom: 6 }}>Speed things up</div>
            <div style={{ fontSize: "var(--cafe-font-base)", fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: "var(--cafe-space-lg)", letterSpacing: "-0.02em" }}>Keyboard Shortcuts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["↑ / ↓  or  j / k", "Move focus between tickets"],
                ["Enter  or  D", "Mark focused ticket done"],
                ["S", "Start focused ticket"],
                ["H", "Hold / resume focused ticket"],
                ["B", "Bump focused ticket"],
                ["1 / 2 / 3", "Set urgency: OK / Soon / Urgent"],
                ["/", "Jump to search"],
                ["Esc", "Clear focus / close dialogs"],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-xs)", fontWeight: 700, color: "var(--cafe-accent)", background: "var(--cafe-accent-bg)", padding: "4px 10px", borderRadius: "var(--cafe-radius-sm)", whiteSpace: "nowrap" }}>{key}</span>
                  <span style={{ fontSize: "var(--cafe-font-sm)", color: "var(--cafe-text-secondary)", textAlign: "right" }}>{desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} style={{ ...btn("ghost"), padding: "10px 16px", marginTop: "var(--cafe-space-lg)", width: "100%", fontSize: "var(--cafe-font-sm)" }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Toast stack ── */}
      {toasts.length > 0 && (
        <div style={{ position: "fixed", bottom: 22, right: 22, display: "flex", flexDirection: "column", gap: 7, zIndex: 300, maxWidth: 310 }}>
          {toasts.map(t => (
            <div
              key={t.id}
              style={{
                background: "var(--cafe-bg-elevated)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 10,
                padding: "11px 14px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,146,42,0.08)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                animation: "kdsToastIn .22s cubic-bezier(.4,0,.2,1)",
              }}
            >
              <span style={{ width: 3, height: 28, borderRadius: 99, background: "var(--cafe-accent)", flexShrink: 0, opacity: 0.7 }} />
              <span style={{ fontSize: 12, color: "var(--cafe-text-primary)", flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              {t.onUndo && (
                <button
                  onClick={() => { t.onUndo(); dismissToast(t.id); }}
                  style={{ fontSize: 10, fontWeight: 800, color: "var(--cafe-accent)", background: "transparent", border: "none", cursor: "pointer", flexShrink: 0, letterSpacing: "0.03em" }}
                >
                  Undo
                </button>
              )}
              <button
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss"
                style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", background: "transparent", border: "none", cursor: "pointer", flexShrink: 0, opacity: 0.6 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}

export default Kitchen;
