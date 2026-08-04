import React from 'react';
import { useState, useEffect, useCallback } from "react";
import { C, pill, input, btn, SRC_COLORS, URGENCY_ORDER, URGENCY_NEXT, URGENCY_PREV, emptyState } from "../../styles/theme";
import ElapsedTimer from "../common/ElapsedTimer";
import { srcLabel } from "../../styles/theme";
import { getMinutesElapsed } from "../../domain/dates.js";
import WarningDialog from "../common/WarningDialog";

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

// Recipe reference data for menu items
const RECIPES = {
  "Cappuccino": {
    ingredients: ["Espresso shot", "Steamed milk", "Milk foam"],
    allergens: ["Dairy"],
    instructions: "Pull espresso, steam milk to 65°C, layer foam on top"
  },
  "Flat White": {
    ingredients: ["Espresso shot", "Microfoam milk"],
    allergens: ["Dairy"],
    instructions: "Pull double ristretto, texture milk with minimal foam, pour latte art pattern"
  },
  "Latte": {
    ingredients: ["Espresso shot", "Steamed milk", "Light foam"],
    allergens: ["Dairy"],
    instructions: "Pull espresso, steam milk with light foam, pour in glass"
  },
  "Avocado Toast": {
    ingredients: ["Sourdough bread", "Ripe avocado", "Lemon juice", "Salt", "Red pepper flakes", "Olive oil"],
    allergens: ["Gluten"],
    instructions: "Toast bread until golden, mash avocado with lemon and salt, spread generously, garnish"
  },
  "Breakfast Sandwich": {
    ingredients: ["Brioche bun", "Egg", "Cheese", "Bacon", "Butter"],
    allergens: ["Dairy", "Gluten", "Eggs"],
    instructions: "Toast brioche, cook egg to over-medium, melt cheese on bacon, assemble hot"
  },
  "Club Sandwich": {
    ingredients: ["White bread", "Turkey", "Bacon", "Lettuce", "Tomato", "Mayo"],
    allergens: ["Gluten", "Eggs"],
    instructions: "Toast bread, layer ingredients, cut diagonally, secure with toothpick"
  },
  "Caesar Salad": {
    ingredients: ["Romaine lettuce", "Parmesan", "Croutons", "Caesar dressing", "Anchovies"],
    allergens: ["Gluten", "Dairy", "Fish"],
    instructions: "Chill lettuce, toss with dressing, top with shaved parmesan and croutons"
  }
};

const VALID_URGENCIES = ["ok", "soon", "urgent"];

// Hoisted color maps
const URGENCY_BORDER = {
  urgent: "rgba(229,57,53,0.5)",
  soon: "rgba(255,152,0,0.4)",
  ok: "rgba(42,38,34,0.9)"
};
const URGENCY_GLOW = {
  urgent: "0 0 0 1px rgba(229,57,53,0.3), 0 4px 32px rgba(229,57,53,0.15), 0 2px 8px rgba(0,0,0,0.6)",
  soon: "0 0 0 1px rgba(255,152,0,0.25), 0 4px 24px rgba(255,152,0,0.1), 0 2px 8px rgba(0,0,0,0.5)",
  ok: "0 1px 3px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)"
};
const URGENCY_ACCENT_LINE = {
  urgent: "linear-gradient(90deg, #E53935 0%, #FF5252 100%)",
  soon: "linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)",
  ok: "transparent"
};
const URGENCY_TEXT_COLOR = {
  urgent: "var(--cafe-danger)",
  soon: "var(--cafe-warning)",
  ok: "var(--cafe-text-tertiary)"
};
const STATION_COLOR_MAP = {
  Bar:       { color: "var(--cafe-info)",    bg: "rgba(33,150,243,0.12)",  border: "rgba(33,150,243,0.25)" },
  Kitchen:   { color: "var(--cafe-purple)",  bg: "rgba(156,39,176,0.12)", border: "rgba(156,39,176,0.25)" },
  Packaging: { color: "var(--cafe-success)", bg: "rgba(76,175,80,0.12)",  border: "rgba(76,175,80,0.25)" },
  Dessert:   { color: "var(--cafe-warning)", bg: "rgba(255,152,0,0.12)",  border: "rgba(255,152,0,0.25)" },
};

// Inline CSS keyframes string injected once via style tag in Kitchen.jsx
// (KDSCard relies on parent to inject @keyframes kdsUrgentPulse)

function KDSCard({ card, tableName, onDone, onHold, onUrgencyChange, onNoteEdit, onItemCheck, onStart, onMoveStation, onBump, onDragStart, onFocusCard, focused, compact }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(card?.note || "");
  const [holdReason, setHoldReason] = useState("");
  const [showHoldInput, setShowHoldInput] = useState(false);
  const [holdError, setHoldError] = useState("");
  const [showRecipe, setShowRecipe] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const audioMuted = Boolean(card?.audioMuted);
  const safeCustomAlertSound = card?.customAlertSound || null;
  const [isAudioMuted, setIsAudioMuted] = useState(audioMuted);

  // Safe primitives
  const safeUrgency = VALID_URGENCIES.includes(card.urgency) ? card.urgency : "ok";
  const safeStartedAt = Number.isFinite(Number(card.startedAt)) ? Number(card.startedAt) : null;
  const safeSource = card.source || "unknown";
  const safeStation = card.station || "";
  const isCompleted = !!card.completed;
  const isHeld = !!card.held;

  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatTarget, setChatTarget] = useState("all");

  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleTouchStart = (e) => setTouchStartX(e.changedTouches[0].screenX);
  const handleTouchMove = (e) => setTouchEndX(e.changedTouches[0].screenX);
  const handleTouchEnd = () => {
    const swipeDistance = touchStartX - touchEndX;
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance < 0) {
        // finger moved left → right: swipe right, check everything
        handleBulkCheckAll();
      } else {
        // finger moved right → left: swipe left, uncheck everything
        handleBulkUncheckAll();
      }
    }
  };

  const playAlertSound = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const audio = new Audio(safeCustomAlertSound || '/sounds/alert.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => {
        if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] Audio play failed:", err);
      });
    } catch (err) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] Audio creation failed:", err);
    }
  }, [isAudioMuted, safeCustomAlertSound]);

  useEffect(() => {
    if (safeUrgency === "urgent" && !isCompleted && !isHeld) playAlertSound();
  }, [safeUrgency, isCompleted, isHeld, playAlertSound]);

  const toggleAudioMute = () => setIsAudioMuted(!isAudioMuted);

  const handleSendChat = () => {
    if (!chatMessage.trim()) return;
    const newMessage = {
      id: Date.now(), text: chatMessage,
      sender: safeStation || "Kitchen",
      target: chatTarget, timestamp: Date.now(), ticketId: card.id
    };
    const updatedMessages = [...safeKitchenMessages, newMessage];
    if (typeof onNoteEdit === 'function') onNoteEdit(card.id, { ...card, kitchenMessages: updatedMessages });
    setChatMessage("");
  };

  const STATIONS = ["Kitchen", "Bar", "Packaging", "Dessert", "all", "manager"];
  const stationColors = STATION_COLOR_MAP[safeStation] || { color: "var(--cafe-text-tertiary)", bg: "var(--cafe-bg-hover)", border: "var(--cafe-border)" };

  const [markDoneDialog, setMarkDoneDialog] = useState({ open: false, onConfirm: null });
  const [moveStationDialog, setMoveStationDialog] = useState({ open: false, onConfirm: null });

  if (!card || typeof card !== "object") {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] received malformed card", card);
    return (
      <div style={{ background: "var(--cafe-bg-surface)", border: "1px dashed var(--cafe-border)", borderRadius: 12, padding: 14, color: "var(--cafe-text-tertiary)", fontSize: 12 }}>
        Ticket unavailable
      </div>
    );
  }

  const items = Array.isArray(card.items) ? card.items.filter(it => it && typeof it === "object") : [];
  const safeOrderId = card.orderId || card.id || "—";
  const safeTableId = card.tableId || null;
  const safeGuestCount = Number.isFinite(Number(card.guestCount)) ? Number(card.guestCount) : null;
  const safeTableSeatedAt = Number.isFinite(Number(card.tableSeatedAt)) ? Number(card.tableSeatedAt) : null;
  const safeAssignedWaiterName = card.assignedWaiterName || null;
  const safeDietaryFlags = card.dietaryFlags || null;
  const safeAllergenWarnings = Array.isArray(card.allergenWarnings) ? card.allergenWarnings : [];
  const isVip = Boolean(card.isVip);
  const safeWasteReason = card.wasteReason || null;
  const safeWasteCost = Number.isFinite(Number(card.wasteCost)) ? Number(card.wasteCost) : null;
  const safeEquipmentName = card.equipmentName || null;
  const safeTemperatureLog = Number.isFinite(Number(card.temperatureLog)) ? Number(card.temperatureLog) : null;
  const safeDangerZoneTime = Number.isFinite(Number(card.dangerZoneTime)) ? Number(card.dangerZoneTime) : null;
  const safeHaccpChecklist = Array.isArray(card.haccpChecklist) ? card.haccpChecklist : [];
  const safeKitchenMessages = Array.isArray(card.kitchenMessages) ? card.kitchenMessages : [];

  const safeItemName = (it) => (it && typeof it.name === "string" && it.name.trim()) ? it.name : "Item";
  const safeItemQty = (it) => { const q = Number(it?.qty); return Number.isFinite(q) && q > 0 ? q : 1; };

  const calculatePrepTime = () => {
    let totalTime = 0;
    items.forEach(item => {
      const prepTime = PREP_TIMES[safeItemName(item)];
      totalTime += (Number.isFinite(prepTime) ? prepTime : 5) * safeItemQty(item);
    });
    return Number.isFinite(totalTime) ? totalTime : 0;
  };

  const getPrepTimeStatus = () => {
    const prepTime = calculatePrepTime();
    let elapsedMinutes = 0;
    if (safeStartedAt !== null) {
      try {
        const computed = getMinutesElapsed(safeStartedAt);
        elapsedMinutes = Number.isFinite(computed) ? computed : 0;
      } catch { elapsedMinutes = 0; }
    }
    const remaining = Math.max(0, prepTime - elapsedMinutes);
    if (elapsedMinutes > prepTime + 3) return { label: "Delayed", color: C.red, urgency: "urgent" };
    if (remaining === 0) return { label: "Ready", color: C.green, urgency: "ok" };
    if (remaining <= 2) return { label: `${remaining}m left`, color: C.amber, urgency: "soon" };
    return { label: `${remaining}m left`, color: C.text3, urgency: "ok" };
  };

  const getEstimatedCompletionTime = () => {
    if (!safeStartedAt) return null;
    const prepTime = calculatePrepTime();
    const estimatedMs = safeStartedAt + (prepTime * 60 * 1000);
    const now = Date.now();
    if (estimatedMs <= now) return null;
    const remainingMs = estimatedMs - now;
    const remainingMins = Math.ceil(remainingMs / 60000);
    if (remainingMins <= 0) return null;
    const completionDate = new Date(estimatedMs);
    const hours = completionDate.getHours();
    const mins = completionDate.getMinutes().toString().padStart(2, '0');
    return { time: `${hours}:${mins}`, remaining: remainingMins };
  };

  const getTableSeatedTime = () => {
    if (!safeTableSeatedAt) return null;
    try {
      const elapsed = getMinutesElapsed(safeTableSeatedAt);
      if (!Number.isFinite(elapsed)) return null;
      if (elapsed < 1) return "Just seated";
      if (elapsed < 60) return `${Math.floor(elapsed)}m`;
      const hours = Math.floor(elapsed / 60);
      const mins = Math.floor(elapsed % 60);
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } catch { return null; }
  };

  const checkedAll = items.length > 0 && items.every(it => !!it.checked);
  const checkedCount = items.filter(it => !!it.checked).length;

  const handleItemCheck = (idx) => {
    if (isCompleted) return;
    if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] invalid item index", idx);
      return;
    }
    if (typeof onItemCheck !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onItemCheck missing");
      return;
    }
    onItemCheck(card.id, idx);
  };

  const handleUrgencyChange = (nextUrgency) => {
    if (isCompleted) return;
    if (!VALID_URGENCIES.includes(nextUrgency)) {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] invalid urgency", nextUrgency);
      return;
    }
    if (typeof onUrgencyChange !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onUrgencyChange missing");
      return;
    }
    onUrgencyChange(card.id, nextUrgency);
  };

  const handleHoldToggle = (reason) => {
    if (typeof onHold !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onHold missing");
      return;
    }
    onHold(card.id, reason);
  };

  const handleHold = () => {
    const trimmed = holdReason.trim();
    if (!trimmed) { setHoldError("Hold reason is required."); return; }
    handleHoldToggle(trimmed.slice(0, 200));
    setShowHoldInput(false);
    setHoldReason("");
    setHoldError("");
  };

  const handleNoteSave = () => {
    const trimmed = (noteVal ?? "").trim().slice(0, 500);
    if (typeof onNoteEdit === "function") onNoteEdit(card.id, trimmed);
    else if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onNoteEdit missing");
    setEditingNote(false);
  };

  const cancelNoteEdit = () => { setNoteVal(card.note || ""); setEditingNote(false); };

  const handleDone = () => {
    if (isCompleted) return;
    if (typeof onDone !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onDone missing");
      return;
    }
    if (items.length > 0 && !checkedAll) {
      setMarkDoneDialog({ open: true, onConfirm: () => { setMarkDoneDialog({ open: false, onConfirm: null }); onDone(card.id); } });
      return;
    }
    onDone(card.id);
  };

  const handleStart = () => {
    if (isCompleted || safeStartedAt !== null) return;
    if (typeof onStart !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onStart missing");
      return;
    }
    onStart(card.id);
  };

  const handleMoveStation = () => {
    if (isCompleted || isHeld) return;
    if (typeof onMoveStation !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onMoveStation missing");
      return;
    }
    setMoveStationDialog({ open: true, onConfirm: () => { setMoveStationDialog({ open: false, onConfirm: null }); onMoveStation(card.id); } });
  };

  const handleBump = () => {
    if (isCompleted || isHeld) return;
    if (typeof onBump !== "function") {
      if (typeof import.meta !== "undefined" && import.meta.env?.DEV) console.warn("[KDSCard] onBump missing");
      return;
    }
    onBump(card.id);
  };

  const handleBulkCheckAll = () => {
    if (isCompleted || typeof onItemCheck !== "function") return;
    items.forEach((it, idx) => { if (!it.checked) onItemCheck(card.id, idx); });
  };

  const handleBulkUncheckAll = () => {
    if (isCompleted || typeof onItemCheck !== "function") return;
    items.forEach((it, idx) => { if (it.checked) onItemCheck(card.id, idx); });
  };

  const getRecipeForItem = (itemName) => RECIPES[itemName] || null;
  const handleShowRecipe = (itemName) => {
    const recipe = getRecipeForItem(itemName);
    if (recipe) setShowRecipe({ name: itemName, ...recipe });
  };

  // ── COMPACT VIEW ─────────────────────────────────────────────────────────
  if (compact) {
    const prepStatus = getPrepTimeStatus();
    return (
      <div
        draggable={typeof onDragStart === 'function'}
        onDragStart={(e) => { if (typeof onDragStart === 'function') { e.dataTransfer.effectAllowed = 'move'; onDragStart(card.id); } }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => typeof onFocusCard === 'function' && onFocusCard(card.id)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && typeof onFocusCard === 'function') {
            e.preventDefault();
            onFocusCard(card.id);
          }
        }}
        tabIndex={0}
        style={{
          background: isCompleted
            ? "var(--cafe-bg-surface)"
            : isHeld
            ? "rgba(212,146,42,0.06)"
            : "var(--cafe-bg-surface)",
          border: `1px solid ${isHeld ? "rgba(212,146,42,0.3)" : URGENCY_BORDER[safeUrgency]}`,
          borderLeft: safeUrgency === "urgent" ? "3px solid #E53935" : safeUrgency === "soon" ? "3px solid #FF9800" : "1px solid rgba(42,38,34,0.9)",
          borderRadius: "var(--cafe-radius-md)",
          padding: "10px 14px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          opacity: isCompleted ? 0.5 : 1,
          flexWrap: "wrap",
          boxShadow: focused ? "0 0 0 2px var(--cafe-accent), 0 4px 16px rgba(212,146,42,0.2)" : "0 1px 4px rgba(0,0,0,0.4)",
          outline: "none",
          transition: "all .2s ease",
          cursor: typeof onDragStart === 'function' ? 'move' : 'default',
          backdropFilter: "blur(8px)",
          minHeight: 52,
        }}
      >
        {/* Order ID */}
        <span style={{ fontFamily: "monospace", fontSize: "var(--cafe-font-sm)", fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.01em", width: 60, flexShrink: 0 }}>
          {safeOrderId}
        </span>

        {/* Source badge */}
        <span style={{ padding: "3px 8px", borderRadius: 4, background: SRC_COLORS[safeSource]?.bg || "var(--cafe-bg-hover)", color: SRC_COLORS[safeSource]?.color || "var(--cafe-text-secondary)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
          {srcLabel(safeSource)}
        </span>

        {/* VIP / special badges */}
        {isVip && <span style={{ fontSize: 10, fontWeight: 700, color: "#FFD700", background: "rgba(255,215,0,0.15)", padding: "3px 7px", borderRadius: 4, border: "1px solid rgba(255,215,0,0.3)", flexShrink: 0 }}>👑 VIP</span>}
        {tableName && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-info)", background: "rgba(33,150,243,0.1)", padding: "3px 7px", borderRadius: 4, flexShrink: 0 }}>Table {tableName}</span>}
        {isHeld && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-accent)", background: "rgba(212,146,42,0.15)", padding: "3px 7px", borderRadius: 4, flexShrink: 0 }}>⏸ HELD</span>}
        {safeStation && <span style={{ fontSize: 10, fontWeight: 700, color: stationColors.color, background: stationColors.bg, padding: "3px 7px", borderRadius: 4, flexShrink: 0 }}>{safeStation}</span>}

        {/* Items strip */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
          {items.length === 0 && <span style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>No items</span>}
          {items.map((it, j) => {
            const checked = !!it.checked;
            return (
              <span
                key={j}
                role="checkbox"
                aria-checked={checked}
                aria-label={`${safeItemName(it)} times ${safeItemQty(it)}${checked ? ", checked" : ", unchecked"}`}
                aria-disabled={isCompleted}
                onClick={(e) => { e.stopPropagation(); handleItemCheck(j); }}
                style={{
                  background: checked ? "rgba(76,175,80,0.15)" : "var(--cafe-bg-hover)",
                  border: `1px solid ${checked ? "rgba(76,175,80,0.3)" : "var(--cafe-border)"}`,
                  borderRadius: 5,
                  padding: "5px 9px",
                  cursor: isCompleted ? "default" : "pointer",
                  transition: "all .15s",
                  fontSize: 11,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontWeight: 600,
                  color: checked ? "var(--cafe-text-tertiary)" : "var(--cafe-text-primary)",
                  textDecoration: checked ? "line-through" : "none",
                }}
              >
                {checked && <span style={{ color: "var(--cafe-success)", fontSize: 9, fontWeight: 900 }}>✓</span>}
                {safeItemName(it)}
                <span style={{ opacity: 0.5, fontFamily: "monospace" }}>×{safeItemQty(it)}</span>
              </span>
            );
          })}
        </div>

        {/* Prep time & timer */}
        {card.note && <span style={{ fontSize: 10, color: "var(--cafe-accent)", opacity: 0.8 }} title={card.note}>📝</span>}
        <span style={{ fontSize: 10, color: prepStatus.color, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{prepStatus.label}</span>
        <ElapsedTimer startedAt={safeStartedAt} urgency={isHeld ? "ok" : prepStatus.urgency || safeUrgency} />

        {/* Action buttons (Full width row) */}
        <div style={{ flexBasis: "100%", display: "flex", gap: 6, marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--cafe-border-light)", flexWrap: "wrap" }}>
          {onStart && (
            <button onClick={(e) => { e.stopPropagation(); handleStart(); }} disabled={isCompleted || safeStartedAt !== null} style={{ flex: 1, minWidth: 60, padding: "8px 4px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: safeStartedAt !== null ? "rgba(76,175,80,0.1)" : "var(--cafe-bg-hover)", color: safeStartedAt !== null ? "rgba(76,175,80,0.5)" : "var(--cafe-success)", fontSize: 10, fontWeight: 700, cursor: isCompleted || safeStartedAt !== null ? "default" : "pointer" }}>
              ▶ {safeStartedAt !== null ? "STARTED" : "START"}
            </button>
          )}
          
          <button onClick={(e) => { e.stopPropagation(); handleHoldToggle(); }} disabled={isCompleted} style={{ flex: 1, minWidth: 60, padding: "8px 4px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: isHeld ? "rgba(212,146,42,0.15)" : "var(--cafe-bg-hover)", color: isHeld ? "var(--cafe-accent)" : "var(--cafe-text-secondary)", fontSize: 10, fontWeight: 700, cursor: isCompleted ? "default" : "pointer" }}>
            {isHeld ? "▶ RESUME" : "⏸ HOLD"}
          </button>

          {onMoveStation && (
            <button onClick={(e) => { e.stopPropagation(); onMoveStation(card.id); }} disabled={isCompleted} style={{ flex: 1, minWidth: 60, padding: "8px 4px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: "var(--cafe-bg-hover)", color: "var(--cafe-info)", fontSize: 10, fontWeight: 700, cursor: isCompleted ? "default" : "pointer" }}>
              → MOVE
            </button>
          )}

          <button onClick={(e) => { e.stopPropagation(); handleDone(); }} disabled={isCompleted} style={{ flex: 2, minWidth: 80, padding: "8px 4px", borderRadius: 6, border: checkedAll ? "1px solid rgba(76,175,80,0.4)" : "1px solid var(--cafe-border)", background: checkedAll ? "linear-gradient(135deg, rgba(76,175,80,0.35), rgba(56,142,60,0.25))" : "var(--cafe-bg-hover)", color: checkedAll ? "var(--cafe-success)" : "var(--cafe-text-primary)", fontSize: 11, fontWeight: 800, cursor: isCompleted ? "default" : "pointer" }}>
            {checkedAll ? "✓ BUMP" : "DONE"}
          </button>
        </div>
      </div>
    );
  }

  // ── FULL CARD VIEW ────────────────────────────────────────────────────────
  const prepStatusFull = getPrepTimeStatus();
  const safeNote = typeof card.note === "string" ? card.note : "";

  // VIP gets a subtle shimmer gradient background
  const cardBg = isHeld
    ? "rgba(212,146,42,0.06)"
    : isVip
    ? "linear-gradient(135deg, rgba(212,146,42,0.1) 0%, var(--cafe-bg-surface) 60%)"
    : isCompleted
    ? "var(--cafe-bg-surface)"
    : "var(--cafe-bg-surface)";

  return (
    <div
      draggable={typeof onDragStart === 'function'}
      onDragStart={(e) => { if (typeof onDragStart === 'function') onDragStart(e, card); }}
      onClick={() => { if (typeof onFocusCard === 'function') onFocusCard(card.id); }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && typeof onFocusCard === 'function') {
          e.preventDefault();
          onFocusCard(card.id);
        }
      }}
      tabIndex={0}
      style={{
        background: cardBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${isHeld ? "rgba(212,146,42,0.35)" : URGENCY_BORDER[safeUrgency]}`,
        borderRadius: "var(--cafe-radius-lg)",
        boxShadow: focused
          ? `0 0 0 2px var(--cafe-accent), ${URGENCY_GLOW[safeUrgency]}`
          : isHeld
          ? "0 2px 12px rgba(212,146,42,0.1)"
          : URGENCY_GLOW[safeUrgency],
        animation: (!isHeld && !isCompleted && safeUrgency === "urgent") ? "kdsUrgentPulse 1.8s ease-in-out infinite" : "none",
        transition: "box-shadow .25s ease, border-color .25s ease, opacity .2s ease",
        opacity: isCompleted ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        outline: "none",
        cursor: typeof onDragStart === 'function' ? 'move' : 'default',
      }}
    >
      {/* Top urgency accent bar */}
      <div style={{
        height: (isHeld || isCompleted || safeUrgency === "ok") ? 2 : 3,
        background: isHeld ? "var(--cafe-accent)" : isCompleted ? "var(--cafe-success)" : URGENCY_ACCENT_LINE[safeUrgency],
        transition: "background .3s, height .2s",
        flexShrink: 0,
      }} />

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", flex: 1, gap: 0 }}>

        {/* ── Card Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>

            {/* Order ID + Source row */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: "var(--cafe-font-sm)",
                fontWeight: 900,
                color: "var(--cafe-text-primary)",
                letterSpacing: "0.03em",
                padding: "3px 8px",
                background: "var(--cafe-bg-hover)",
                borderRadius: 4,
                border: "1px solid var(--cafe-border-light)",
              }}>
                {safeOrderId}
              </span>
              <span style={{
                padding: "3px 8px",
                borderRadius: 4,
                background: SRC_COLORS[safeSource]?.bg || "var(--cafe-bg-hover)",
                color: SRC_COLORS[safeSource]?.color || "var(--cafe-text-secondary)",
                fontSize: 9,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                border: `1px solid ${SRC_COLORS[safeSource]?.color ? SRC_COLORS[safeSource].color + "25" : "var(--cafe-border-light)"}`,
              }}>
                {srcLabel(safeSource)}
              </span>
              {isVip && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#FFD700", background: "rgba(255,215,0,0.15)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,215,0,0.3)", letterSpacing: "0.05em" }}>
                  👑 VIP
                </span>
              )}
            </div>

            {/* Meta badges row */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              {safeAssignedWaiterName && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--cafe-purple)", background: "rgba(156,39,176,0.12)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(156,39,176,0.2)" }}>
                  👤 {safeAssignedWaiterName}
                </span>
              )}
              {tableName && <span style={{ fontSize: 11, fontWeight: 800, color: "var(--cafe-info)", background: "rgba(33,150,243,0.15)", padding: "3px 8px", borderRadius: 5, border: "1px solid rgba(33,150,243,0.3)" }}>Table {tableName}</span>}
              {safeGuestCount && (
                <span style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", padding: "3px 6px", borderRadius: 4, background: "var(--cafe-bg-hover)" }}>
                  👥 {safeGuestCount}
                </span>
              )}
              {safeDietaryFlags && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--cafe-success)", background: "rgba(76,175,80,0.12)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(76,175,80,0.2)" }}>
                  🌱 {safeDietaryFlags}
                </span>
              )}
              {safeAllergenWarnings.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(229,57,53,0.7)", padding: "3px 8px", borderRadius: 4 }}>
                  ⚠️ {safeAllergenWarnings.join(", ")}
                </span>
              )}
              {safeStation && (
                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: stationColors.color, background: stationColors.bg, padding: "3px 8px", borderRadius: 4, border: `1px solid ${stationColors.border}` }}>
                  {safeStation}
                </span>
              )}
              {isHeld && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--cafe-accent)", background: "rgba(212,146,42,0.15)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(212,146,42,0.3)", letterSpacing: "0.05em" }}>
                  ⏸ HELD{typeof card.holdReason === "string" && card.holdReason.trim() ? ` · ${card.holdReason.trim().slice(0, 40)}` : ""}
                </span>
              )}
              {isCompleted && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "var(--cafe-success)", background: "rgba(76,175,80,0.12)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(76,175,80,0.25)", letterSpacing: "0.05em" }}>
                  ✓ DONE
                </span>
              )}
              {safeEquipmentName && (
                <span style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", padding: "3px 6px", borderRadius: 4, background: "var(--cafe-bg-hover)" }}>
                  ⚙️ {safeEquipmentName}
                </span>
              )}
              {safeTemperatureLog !== null && (
                <span style={{ fontSize: 10, fontWeight: 600, color: safeTemperatureLog > 5 && safeTemperatureLog < 60 ? "var(--cafe-success)" : "var(--cafe-danger)", background: "var(--cafe-bg-hover)", padding: "3px 6px", borderRadius: 4 }}>
                  🌡️ {safeTemperatureLog}°C
                </span>
              )}
              {safeDangerZoneTime !== null && safeDangerZoneTime > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-danger)", background: "rgba(229,57,53,0.1)", padding: "3px 8px", borderRadius: 4 }}>
                  ⏰ {safeDangerZoneTime}m danger
                </span>
              )}
              {safeKitchenMessages.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--cafe-accent)", background: "rgba(212,146,42,0.1)", padding: "3px 8px", borderRadius: 4 }}>
                  💬 {safeKitchenMessages.length}
                </span>
              )}
            </div>
          </div>

          {/* Right: prep status & timer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: prepStatusFull.color, fontFamily: "monospace", fontWeight: 800, letterSpacing: "0.02em" }}>
              {prepStatusFull.label}
            </span>
            {getEstimatedCompletionTime() && (
              <span style={{ fontSize: 9, color: "var(--cafe-text-tertiary)", fontFamily: "monospace" }}>
                ETA {getEstimatedCompletionTime().time}
              </span>
            )}
            <ElapsedTimer startedAt={safeStartedAt} urgency={isHeld ? "ok" : prepStatusFull.urgency || safeUrgency} />
          </div>
        </div>

        {/* ── Progress bar ── */}
        {items.length > 1 && (
          <div style={{ height: 2, background: "var(--cafe-bg-hover)", borderRadius: 99, marginBottom: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              borderRadius: 99,
              background: checkedAll
                ? "var(--cafe-success)"
                : "linear-gradient(90deg, var(--cafe-accent) 0%, var(--cafe-accent-light) 100%)",
              width: `${(checkedCount / items.length) * 100}%`,
              transition: "width .4s cubic-bezier(.4,0,.2,1)",
              boxShadow: checkedAll ? "0 0 6px rgba(76,175,80,0.4)" : "0 0 6px rgba(212,146,42,0.3)",
            }} />
          </div>
        )}
        {items.length > 0 && (
          <div style={{ fontSize: 10, color: checkedAll ? "var(--cafe-success)" : "var(--cafe-text-tertiary)", marginBottom: 10, fontWeight: 700, letterSpacing: "0.04em" }}>
            {checkedAll ? "✓ All ready" : `${checkedCount} / ${items.length} checked`}
          </div>
        )}

        {/* ── Note ── */}
        {(safeNote || editingNote) && (
          <div style={{ marginBottom: 10 }}>
            {editingNote ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  autoFocus
                  maxLength={500}
                  style={{
                    flex: 1,
                    background: "var(--cafe-bg-hover)",
                    border: "1px solid rgba(212,146,42,0.3)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    color: "var(--cafe-text-primary)",
                    fontSize: 12,
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                  value={noteVal}
                  onChange={e => setNoteVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleNoteSave(); if (e.key === "Escape") { e.stopPropagation(); cancelNoteEdit(); } }}
                  onBlur={handleNoteSave}
                />
              </div>
            ) : (
              <div
                onClick={() => setEditingNote(true)}
                style={{
                  fontSize: 11,
                  color: "var(--cafe-accent)",
                  background: "rgba(212,146,42,0.07)",
                  padding: "7px 10px",
                  borderRadius: 6,
                  borderLeft: "2px solid rgba(212,146,42,0.4)",
                  cursor: "text",
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  wordBreak: "break-word",
                }}
              >
                <span style={{ flexShrink: 0, fontSize: 9, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.05em" }}>note</span>
                <span style={{ flex: 1 }}>{safeNote || "add note…"}</span>
                <span style={{ color: "var(--cafe-text-tertiary)", fontSize: 9, flexShrink: 0, opacity: 0.6 }}>edit</span>
              </div>
            )}
          </div>
        )}
        {!safeNote && !editingNote && (
          <button
            onClick={() => setEditingNote(true)}
            style={{
              marginBottom: 10,
              fontSize: 10,
              color: "var(--cafe-text-tertiary)",
              background: "transparent",
              border: "1px dashed var(--cafe-border-light)",
              borderRadius: 5,
              padding: "3px 8px",
              cursor: "pointer",
              alignSelf: "flex-start",
              letterSpacing: "0.02em",
              transition: "border-color .15s, color .15s",
            }}
          >
            + note
          </button>
        )}

        {/* ── Items list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, flex: 1 }}>
          {/* Bulk actions */}
          {items.length > 1 && !isCompleted && (
            <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
              <button onClick={handleBulkCheckAll} disabled={isCompleted}
                style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.08)", color: "var(--cafe-success)", fontSize: 10, fontWeight: 700, cursor: isCompleted ? "default" : "pointer" }}>
                ✓ All
              </button>
              <button onClick={handleBulkUncheckAll} disabled={isCompleted}
                style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid var(--cafe-border-light)", background: "var(--cafe-bg-hover)", color: "var(--cafe-text-tertiary)", fontSize: 10, fontWeight: 700, cursor: isCompleted ? "default" : "pointer" }}>
                ✗ All
              </button>
            </div>
          )}
          {items.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", padding: "10px 0", textAlign: "center", opacity: 0.6 }}>No items</div>
          )}
          {items.map((it, j) => {
            const checked = !!it.checked;
            const qty = safeItemQty(it);
            const name = safeItemName(it);
            const mod = typeof it.mod === "string" && it.mod.trim() ? it.mod.trim() : "";
            const itemNotes = typeof it.notes === "string" && it.notes.trim() ? it.notes.trim() : "";
            const hasRecipe = getRecipeForItem(name) !== null;
            return (
              <div
                key={j}
                role="checkbox"
                aria-checked={checked}
                aria-label={`${name} times ${qty}${checked ? ", checked" : ", unchecked"}`}
                aria-disabled={isCompleted}
                onClick={(e) => { e.stopPropagation(); handleItemCheck(j); }}
                style={{
                  background: checked ? "rgba(76,175,80,0.1)" : "var(--cafe-bg-hover)",
                  border: `1px solid ${checked ? "rgba(76,175,80,0.25)" : "var(--cafe-border-light)"}`,
                  borderRadius: 7,
                  padding: "9px 11px",
                  cursor: isCompleted ? "default" : "pointer",
                  transition: "all .18s ease",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                    {/* Custom checkbox */}
                    <span style={{
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      border: `1.5px solid ${checked ? "var(--cafe-success)" : "var(--cafe-border)"}`,
                      background: checked ? "var(--cafe-success)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all .15s ease",
                      boxShadow: checked ? "0 0 6px rgba(76,175,80,0.35)" : "none",
                    }}>
                      {checked && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: checked ? "line-through" : "none",
                      color: checked ? "var(--cafe-text-tertiary)" : "var(--cafe-text-primary)",
                      wordBreak: "break-word",
                      transition: "color .15s, text-decoration .15s",
                    }}>
                      {name}
                    </span>
                    {hasRecipe && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShowRecipe(name); }}
                        style={{
                          padding: "2px 5px",
                          borderRadius: 3,
                          border: "1px solid var(--cafe-border)",
                          background: "var(--cafe-bg-hover)",
                          color: "var(--cafe-accent)",
                          fontSize: 9,
                          cursor: "pointer",
                          flexShrink: 0,
                          opacity: 0.7,
                        }}
                        title="View recipe"
                      >
                        📖
                      </button>
                    )}
                  </div>
                  <span style={{
                    color: checked ? "var(--cafe-text-tertiary)" : "var(--cafe-text-secondary)",
                    fontFamily: "monospace",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                    background: "var(--cafe-bg-hover)",
                    padding: "1px 6px",
                    borderRadius: 3,
                    letterSpacing: "0.02em",
                  }}>
                    ×{qty}
                  </span>
                </div>
                {(mod || itemNotes) && (
                  <div style={{ marginTop: 5, marginLeft: 27, display: "flex", flexDirection: "column", gap: 2 }}>
                    {mod && <div style={{ fontSize: 10, color: "var(--cafe-text-tertiary)", wordBreak: "break-word", fontStyle: "italic" }}>{mod}</div>}
                    {itemNotes && <div style={{ fontSize: 10, color: "var(--cafe-accent)", wordBreak: "break-word", opacity: 0.8 }}>{itemNotes}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Hold input ── */}
        {showHoldInput && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 5 }}>
              <input
                autoFocus
                maxLength={200}
                style={{
                  flex: 1,
                  background: "var(--cafe-bg-hover)",
                  border: "1px solid rgba(212,146,42,0.3)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: "var(--cafe-text-primary)",
                  fontSize: 11,
                  outline: "none",
                  fontFamily: "inherit",
                }}
                value={holdReason}
                onChange={e => { setHoldReason(e.target.value); if (holdError) setHoldError(""); }}
                placeholder="Hold reason…"
                onKeyDown={e => { if (e.key === "Enter") handleHold(); if (e.key === "Escape") { setShowHoldInput(false); setHoldReason(""); setHoldError(""); } }}
              />
              <button style={{ width: 28, height: 28, borderRadius: 5, border: "1px solid var(--cafe-border)", background: "transparent", color: "var(--cafe-text-tertiary)", fontSize: 11, cursor: "pointer" }} onClick={() => { setShowHoldInput(false); setHoldReason(""); setHoldError(""); }}>✕</button>
              <button style={{ width: 28, height: 28, borderRadius: 5, border: "1px solid rgba(76,175,80,0.3)", background: "rgba(76,175,80,0.1)", color: "var(--cafe-success)", fontSize: 11, cursor: "pointer" }} onClick={handleHold}>✓</button>
            </div>
            {holdError && <div style={{ fontSize: 10, color: "var(--cafe-danger)", marginTop: 4 }}>{holdError}</div>}
          </div>
        )}

        {/* ── Action row ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Primary done button */}
          <button
            onClick={handleDone}
            disabled={isCompleted}
            aria-label="Mark ticket done"
            style={{
              width: "100%",
              padding: "11px 0",
              borderRadius: 8,
              border: checkedAll
                ? "1px solid rgba(76,175,80,0.5)"
                : "1px solid var(--cafe-border)",
              background: checkedAll
                ? "linear-gradient(135deg, rgba(76,175,80,0.35) 0%, rgba(56,142,60,0.25) 100%)"
                : "var(--cafe-bg-hover)",
              color: checkedAll ? "var(--cafe-success)" : "var(--cafe-text-secondary)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.05em",
              cursor: isCompleted ? "default" : "pointer",
              transition: "all .2s ease",
              minHeight: 42,
              opacity: isCompleted ? 0.4 : 1,
              boxShadow: checkedAll ? "0 0 12px rgba(76,175,80,0.2)" : "none",
            }}
          >
            {checkedAll ? "✓  COMPLETE" : `DONE  ${checkedCount}/${items.length}`}
          </button>

          {/* ── Urgency selector: three distinct labeled buttons ── */}
          <div style={{ display: "flex", gap: 4 }}>
            {[
              { key: "ok",     label: "OK",        color: "var(--cafe-text-secondary)",  activeBg: "var(--cafe-bg-hover)", activeBorder: "var(--cafe-border)" },
              { key: "soon",   label: "⚡ Soon",   color: "var(--cafe-warning)",    activeBg: "rgba(255,152,0,0.15)",  activeBorder: "rgba(255,152,0,0.4)"   },
              { key: "urgent", label: "🚨 Urgent", color: "var(--cafe-danger)",     activeBg: "rgba(229,57,53,0.15)",  activeBorder: "rgba(229,57,53,0.45)"  },
            ].map(u => {
              const isActive = safeUrgency === u.key;
              return (
                <button
                  key={u.key}
                  onClick={() => handleUrgencyChange(u.key)}
                  disabled={isCompleted}
                  title={`Set urgency: ${u.key}`}
                  style={{
                    flex: 1,
                    padding: "7px 4px",
                    borderRadius: 6,
                    border: isActive ? `1px solid ${u.activeBorder}` : "1px solid var(--cafe-border-light)",
                    background: isActive ? u.activeBg : "transparent",
                    color: isActive ? u.color : "var(--cafe-text-tertiary)",
                    fontSize: 10,
                    fontWeight: isActive ? 800 : 500,
                    cursor: isCompleted ? "default" : "pointer",
                    transition: "all .15s ease",
                    opacity: isCompleted ? 0.3 : 1,
                    letterSpacing: "0.01em",
                    textAlign: "center",
                    boxShadow: isActive && u.key !== "ok" ? `0 0 8px ${u.activeBg}` : "none",
                  }}
                >
                  {u.label}
                </button>
              );
            })}
          </div>

          {/* ── Secondary controls: labeled icon+text buttons ── */}
          <div style={{ display: "flex", gap: 4 }}>
            {/* Start */}
            {onStart && (
              <button
                onClick={handleStart}
                disabled={isCompleted || safeStartedAt !== null}
                aria-label="Start ticket"
                title={safeStartedAt !== null ? "Already started" : "Start ticket"}
                style={actionBtn({
                  color: safeStartedAt !== null ? "rgba(76,175,80,0.45)" : "var(--cafe-success)",
                  activeBg: "rgba(76,175,80,0.1)",
                  disabled: isCompleted || safeStartedAt !== null,
                })}
              >
                <span style={{ fontSize: 12 }}>▶</span>
                <span>{safeStartedAt !== null ? "Started" : "Start"}</span>
              </button>
            )}

            {/* Hold / Resume */}
            {isHeld ? (
              <button
                onClick={() => handleHoldToggle()}
                aria-label="Resume ticket"
                title="Resume ticket"
                style={actionBtn({ color: "var(--cafe-accent)", activeBg: "rgba(212,146,42,0.15)", border: "rgba(212,146,42,0.4)" })}
              >
                <span style={{ fontSize: 12 }}>▶</span>
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={() => setShowHoldInput(h => !h)}
                disabled={isCompleted}
                aria-label="Hold ticket"
                title="Hold ticket"
                style={actionBtn({
                  color: showHoldInput ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                  activeBg: showHoldInput ? "rgba(212,146,42,0.1)" : "transparent",
                  border: showHoldInput ? "rgba(212,146,42,0.3)" : undefined,
                  disabled: isCompleted,
                })}
              >
                <span style={{ fontSize: 12 }}>⏸</span>
                <span>Hold</span>
              </button>
            )}

            {/* Move station */}
            {onMoveStation && (
              <button
                onClick={handleMoveStation}
                disabled={isCompleted || isHeld}
                aria-label="Move to station"
                title="Move ticket to another station"
                style={actionBtn({ color: "var(--cafe-info)", disabled: isCompleted || isHeld })}
              >
                <span style={{ fontSize: 12 }}>→</span>
                <span>Move</span>
              </button>
            )}


            {/* Bump */}
            {onBump && (
              <button
                onClick={handleBump}
                disabled={isCompleted || isHeld}
                aria-label="Bump ticket"
                title="Bump ticket (mark done & remove from queue)"
                style={actionBtn({
                  color: "var(--cafe-accent)",
                  activeBg: "rgba(212,146,42,0.1)",
                  border: "rgba(212,146,42,0.25)",
                  disabled: isCompleted || isHeld,
                })}
              >
                <span style={{ fontSize: 12 }}>⇡</span>
                <span>Bump</span>
              </button>
            )}
          </div>

          {/* ── Utility row: audio + chat ── */}
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={toggleAudioMute}
              aria-label={isAudioMuted ? "Unmute audio alerts" : "Mute audio alerts"}
              title={isAudioMuted ? "Unmute alerts" : "Mute alerts"}
              style={actionBtn({
                color: isAudioMuted ? "var(--cafe-text-tertiary)" : "var(--cafe-success)",
                activeBg: isAudioMuted ? "transparent" : "rgba(76,175,80,0.07)",
              })}
            >
              <span style={{ fontSize: 13 }}>{isAudioMuted ? "🔇" : "🔊"}</span>
              <span>{isAudioMuted ? "Muted" : "Sound"}</span>
            </button>

            <button
              onClick={() => setShowChat(true)}
              aria-label="Open kitchen chat"
              title="Kitchen chat"
              style={{
                ...actionBtn({
                  color: safeKitchenMessages.length > 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                  activeBg: safeKitchenMessages.length > 0 ? "rgba(212,146,42,0.08)" : "transparent",
                  border: safeKitchenMessages.length > 0 ? "rgba(212,146,42,0.2)" : undefined,
                }),
                position: "relative",
              }}
            >
              <span style={{ fontSize: 13 }}>💬</span>
              <span>Chat</span>
              {safeKitchenMessages.length > 0 && (
                <span style={{ marginLeft: 3, background: "var(--cafe-danger)", color: "#fff", borderRadius: 99, fontSize: 8, fontWeight: 900, padding: "1px 5px", lineHeight: 1.5, minWidth: 14, textAlign: "center", flexShrink: 0 }}>
                  {safeKitchenMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Warning dialogs ── */}
      {markDoneDialog.open && (
        <WarningDialog
          title="Mark ticket done?"
          message={`${items.length - checkedCount} item${items.length - checkedCount !== 1 ? "s" : ""} not checked yet.`}
          confirmLabel="Mark Done"
          onConfirm={markDoneDialog.onConfirm}
          onCancel={() => setMarkDoneDialog({ open: false, onConfirm: null })}
        />
      )}
      {moveStationDialog.open && (
        <WarningDialog
          title="Move station?"
          message="This ticket will be moved to the next station in the queue."
          confirmLabel="Move"
          onConfirm={moveStationDialog.onConfirm}
          onCancel={() => setMoveStationDialog({ open: false, onConfirm: null })}
        />
      )}

      {/* ── Recipe modal ── */}
      {showRecipe && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 20 }} onClick={() => setShowRecipe(null)}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: "1px solid rgba(212,146,42,0.3)", borderRadius: 14, padding: 24, maxWidth: 420, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,146,42,0.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--cafe-accent)", marginBottom: 4 }}>Recipe</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--cafe-text-primary)", marginBottom: 14, letterSpacing: "-0.02em" }}>{showRecipe.name}</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cafe-text-tertiary)", marginBottom: 6 }}>Ingredients</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {showRecipe.ingredients.map((ing, i) => (
                  <span key={i} style={{ fontSize: 11, padding: "3px 8px", background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 4, color: "var(--cafe-text-secondary)" }}>{ing}</span>
                ))}
              </div>
            </div>
            {showRecipe.allergens?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cafe-danger)", marginBottom: 6 }}>⚠️ Allergens</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {showRecipe.allergens.map((a, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", background: "rgba(229,57,53,0.12)", border: "1px solid rgba(229,57,53,0.25)", borderRadius: 4, color: "var(--cafe-danger)", fontWeight: 700 }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--cafe-text-tertiary)", marginBottom: 6 }}>Method</div>
              <div style={{ fontSize: 12, color: "var(--cafe-text-secondary)", lineHeight: 1.6 }}>{showRecipe.instructions}</div>
            </div>
            <button onClick={() => setShowRecipe(null)} style={{ width: "100%", padding: "10px 0", background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border)", borderRadius: 7, color: "var(--cafe-text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* ── Kitchen Chat modal ── */}
      {showChat && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: 20 }}>
          <div style={{ background: "var(--cafe-bg-elevated)", border: "1px solid var(--cafe-border)", borderRadius: 14, maxWidth: 500, width: "100%", maxHeight: "80vh", overflow: "auto", padding: 22, boxShadow: "0 8px 40px rgba(0,0,0,0.7)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--cafe-text-tertiary)", marginBottom: 2 }}>Ticket {card.id}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em" }}>Kitchen Chat</div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ width: 32, height: 32, borderRadius: 6, border: "1px solid var(--cafe-border)", background: "transparent", color: "var(--cafe-text-tertiary)", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>

            <div style={{ marginBottom: 12, maxHeight: 250, overflow: "auto", background: "var(--cafe-bg-hover)", borderRadius: 8, padding: 10, border: "1px solid var(--cafe-border-light)" }}>
              {safeKitchenMessages.length === 0 ? (
                <div style={{ color: "var(--cafe-text-tertiary)", textAlign: "center", fontSize: 12, padding: "16px 0" }}>No messages yet</div>
              ) : (
                safeKitchenMessages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: 10, padding: "7px 10px", borderRadius: 6, background: msg.sender === safeStation ? "rgba(33,150,243,0.1)" : "var(--cafe-bg-hover)", border: `1px solid ${msg.sender === safeStation ? "rgba(33,150,243,0.2)" : "var(--cafe-border-light)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "var(--cafe-text-secondary)" }}>{msg.sender}</span>
                      <span style={{ fontSize: 9, color: "var(--cafe-text-tertiary)" }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "var(--cafe-text-primary)" }}>{msg.text}</p>
                    {msg.target !== "all" && <span style={{ fontSize: 9, color: "var(--cafe-accent)", marginTop: 2, display: "block" }}>→ {msg.target}</span>}
                  </div>
                ))
              )}
            </div>

            <select value={chatTarget} onChange={(e) => setChatTarget(e.target.value)} style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", marginBottom: 8, fontSize: 12, outline: "none" }}>
              {STATIONS.map(station => (
                <option key={station} value={station}>{station === "all" ? "All Stations" : station === "manager" ? "Manager" : station}</option>
              ))}
            </select>
            <textarea value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Type your message..." style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--cafe-border)", background: "var(--cafe-bg-hover)", color: "var(--cafe-text-primary)", minHeight: 60, resize: "vertical", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 10, fontFamily: "inherit" }} />
            <button onClick={handleSendChat} disabled={!chatMessage.trim()} style={{ width: "100%", padding: "10px 0", borderRadius: 7, border: "none", background: chatMessage.trim() ? "var(--cafe-accent)" : "var(--cafe-bg-hover)", color: chatMessage.trim() ? "#1A1208" : "var(--cafe-text-tertiary)", fontSize: 13, fontWeight: 700, cursor: chatMessage.trim() ? "pointer" : "default", letterSpacing: "0.02em" }}>
              Send Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper for consistent secondary button styles (compact view)
function secondaryBtnStyle({ color, borderColor, bg, disabled = false }) {
  return {
    padding: "8px 6px",
    borderRadius: 6,
    border: `1px solid ${borderColor || "var(--cafe-border-light)"}`,
    background: bg || "var(--cafe-bg-hover)",
    color,
    fontSize: 13,
    cursor: disabled ? "default" : "pointer",
    minHeight: 38,
    transition: "all .15s ease",
    opacity: disabled ? 0.3 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };
}

// Helper for labeled icon+text action buttons (full card view)
function actionBtn({ color, activeBg, border, disabled = false }) {
  return {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "8px 6px",
    borderRadius: 7,
    border: `1px solid ${border || "var(--cafe-border-light)"}`,
    background: activeBg || "var(--cafe-bg-hover)",
    color,
    fontSize: 11,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    minHeight: 36,
    transition: "all .15s ease",
    opacity: disabled ? 0.3 : 1,
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  };
}

export default KDSCard;
