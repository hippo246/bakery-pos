import { useState } from "react";
import { C, pill, input, btn, SRC_COLORS, URGENCY_ORDER, URGENCY_NEXT, URGENCY_PREV } from "../../styles/theme";
import ElapsedTimer from "../common/ElapsedTimer";
import { srcLabel } from "../../styles/theme";
import { getMinutesElapsed } from "../../domain/dates.js";

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

const VALID_URGENCIES = ["ok", "soon", "urgent"];

function KDSCard({ card, onDone, onHold, onUrgencyChange, onNoteEdit, onItemCheck, onStart, onMoveStation, onBump, compact }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(card?.note || "");
  const [holdReason, setHoldReason] = useState("");
  const [showHoldInput, setShowHoldInput] = useState(false);
  const [holdError, setHoldError] = useState("");

  // Defensive guard: don't crash if card is missing/malformed
  if (!card || typeof card !== "object") {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[KDSCard] received malformed card", card);
    }
    return (
      <div style={{ background: C.bg2, border: `1px dashed ${C.border2}`, borderRadius: 10, padding: 14, color: C.text3, fontSize: 12 }}>
        Ticket unavailable
      </div>
    );
  }

  const items = Array.isArray(card.items)
    ? card.items.filter(it => it && typeof it === "object")
    : [];
  const isCompleted = !!card.completed;
  const isHeld = !!card.held;
  const safeUrgency = VALID_URGENCIES.includes(card.urgency) ? card.urgency : "ok";
  const safeStartedAt = Number.isFinite(Number(card.startedAt)) ? Number(card.startedAt) : null;
  const safeSource = card.source || "unknown";
  const safeStation = card.station || "";
  const safeOrderId = card.orderId || card.id || "—";

  const safeItemName = (it) => (it && typeof it.name === "string" && it.name.trim()) ? it.name : "Item";
  const safeItemQty = (it) => {
    const q = Number(it?.qty);
    return Number.isFinite(q) && q > 0 ? q : 1;
  };

  const calculatePrepTime = () => {
    let totalTime = 0;
    items.forEach(item => {
      const prepTime = PREP_TIMES[safeItemName(item)];
      const safePrep = Number.isFinite(prepTime) ? prepTime : 5; // default if unknown
      totalTime += safePrep * safeItemQty(item);
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
      } catch {
        elapsedMinutes = 0;
      }
    }
    const remaining = Math.max(0, prepTime - elapsedMinutes);

    if (elapsedMinutes > prepTime + 3) return { label: "Delayed", color: C.red };
    if (remaining === 0) return { label: "Ready", color: C.green };
    if (remaining <= 2) return { label: `${remaining}m left`, color: C.amber };
    return { label: `${remaining}m left`, color: C.text3 };
  };

  const urgencyBorder = { urgent: C.red, soon: C.amber, ok: C.border2 };
  const urgencyGlow = { urgent: "rgba(224,82,82,0.12)", soon: "rgba(232,160,32,0.08)", ok: "transparent" };
  const urgencyAccentLine = { urgent: C.red, soon: C.amber, ok: "transparent" };
  const checkedAll = items.length > 0 && items.every(it => !!it.checked);
  const checkedCount = items.filter(it => !!it.checked).length;

  const handleItemCheck = (idx) => {
    if (isCompleted) return;
    if (!Number.isInteger(idx) || idx < 0 || idx >= items.length) {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] invalid item index", idx);
      return;
    }
    if (typeof onItemCheck !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onItemCheck missing");
      return;
    }
    onItemCheck(card.id, idx);
  };

  const handleUrgencyChange = (nextUrgency) => {
    if (isCompleted) return;
    if (!VALID_URGENCIES.includes(nextUrgency)) {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] invalid urgency", nextUrgency);
      return;
    }
    if (typeof onUrgencyChange !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onUrgencyChange missing");
      return;
    }
    onUrgencyChange(card.id, nextUrgency);
  };

  const handleHoldToggle = (reason) => {
    if (typeof onHold !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onHold missing");
      return;
    }
    onHold(card.id, reason);
  };

  const handleHold = () => {
    const trimmed = holdReason.trim();
    if (!trimmed) {
      setHoldError("Hold reason is required.");
      return;
    }
    handleHoldToggle(trimmed.slice(0, 200));
    setShowHoldInput(false);
    setHoldReason("");
    setHoldError("");
  };

  const handleNoteSave = () => {
    const trimmed = (noteVal ?? "").trim().slice(0, 500);
    if (typeof onNoteEdit === "function") {
      onNoteEdit(card.id, trimmed);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn("[KDSCard] onNoteEdit missing");
    }
    setEditingNote(false);
  };

  const cancelNoteEdit = () => {
    setNoteVal(card.note || "");
    setEditingNote(false);
  };

  // Done: confirm if items are left unchecked, never call onDone if missing/completed/cancelled
  const handleDone = () => {
    if (isCompleted) return;
    if (typeof onDone !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onDone missing");
      return;
    }
    if (items.length > 0 && !checkedAll) {
      const confirmed = window.confirm("Not all items are checked. Mark this ticket done anyway?");
      if (!confirmed) return;
    }
    onDone(card.id);
  };

  // Start: no-op if completed or already meaningfully started
  const handleStart = () => {
    if (isCompleted || safeStartedAt !== null) return;
    if (typeof onStart !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onStart missing");
      return;
    }
    onStart(card.id);
  };

  // Move station: confirm to avoid accidental misclicks, blocked while held/completed
  const handleMoveStation = () => {
    if (isCompleted || isHeld) return;
    if (typeof onMoveStation !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onMoveStation missing");
      return;
    }
    const confirmed = window.confirm("Move this ticket to a different station?");
    if (!confirmed) return;
    onMoveStation(card.id);
  };

  const handleBump = () => {
    if (isCompleted || isHeld) return;
    if (typeof onBump !== "function") {
      if (process.env.NODE_ENV !== "production") console.warn("[KDSCard] onBump missing");
      return;
    }
    onBump(card.id);
  };

  const stationColorMap = {
    Bar: { color: C.blue, bg: C.blueBg },
    Kitchen: { color: C.purple, bg: C.purpleBg },
    Packaging: { color: C.green, bg: C.greenBg },
    Dessert: { color: C.amber2, bg: C.amberBg },
  };
  const stationColors = stationColorMap[safeStation] || { color: C.text3, bg: C.bg3 };

  if (compact) {
    const prepStatus = getPrepTimeStatus();
    const urgencyColors = { urgent: C.red, soon: C.amber, ok: C.text3 };
    return (
      <div style={{
        background: C.bg2,
        border: `1px solid ${isHeld ? C.amber3 : urgencyBorder[safeUrgency]}`,
        borderLeft: `3px solid ${isHeld ? C.amber : urgencyColors[safeUrgency]}`,
        borderRadius: 7,
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        opacity: isCompleted ? 0.5 : 1,
        flexWrap: "wrap",
      }}>
        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 800, color: C.text1, letterSpacing: "-0.01em", width: 56, flexShrink: 0 }}>{safeOrderId}</span>
        <span style={pill(SRC_COLORS[safeSource]?.bg || C.bg4, SRC_COLORS[safeSource]?.color || C.text2)}>{srcLabel(safeSource)}</span>
        {safeStation && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: stationColors.color, background: stationColors.bg, padding: "2px 6px", borderRadius: 4 }}>{safeStation}</span>}
        {isHeld && <span style={{ fontSize: 9, fontWeight: 700, color: C.amber }}>⏸ HELD</span>}
        <div style={{ flex: 1, minWidth: 0, fontSize: 12, color: C.text2, wordBreak: "break-word" }}>
          {items.length > 0 ? items.map(it => `${it.checked ? "✓ " : ""}${safeItemName(it)} ×${safeItemQty(it)}`).join(" · ") : "No items"}
        </div>
        {card.note && <span style={{ fontSize: 11, color: C.amber, opacity: 0.8 }} title={card.note}>📝</span>}
        <span style={{ fontSize: 10, color: prepStatus.color, fontFamily: "monospace", fontWeight: 600 }}>{prepStatus.label}</span>
        <ElapsedTimer startedAt={safeStartedAt} urgency={isHeld ? "ok" : safeUrgency} />
        <button onClick={() => handleUrgencyChange(URGENCY_NEXT[safeUrgency])} disabled={isCompleted} aria-label="Cycle urgency" title="Cycle urgency"
          style={{ padding: "3px 7px", borderRadius: 4, border: `1px solid ${urgencyColors[safeUrgency]}40`, background: `${urgencyColors[safeUrgency]}14`, color: urgencyColors[safeUrgency], fontSize: 9, fontWeight: 800, fontFamily: "monospace", letterSpacing: "0.05em", cursor: isCompleted ? "default" : "pointer", opacity: isCompleted ? 0.4 : 1 }}>
          {{ urgent: "URG", soon: "SOON", ok: "OK" }[safeUrgency]}
        </button>
        <button onClick={() => handleHoldToggle()} disabled={isCompleted} aria-label={isHeld ? "Resume ticket" : "Hold ticket"} title={isHeld ? "Resume ticket" : "Hold ticket"}
          style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${C.border2}`, background: "transparent", color: isHeld ? C.amber : C.text3, fontSize: 12, cursor: isCompleted ? "default" : "pointer", opacity: isCompleted ? 0.4 : 1 }}>
          {isHeld ? "▶" : "⏸"}
        </button>
        <button onClick={handleDone} disabled={isCompleted} aria-label="Mark ticket done" title="Mark ticket done"
          style={{ padding: "4px 11px", borderRadius: 4, border: `1px solid ${checkedAll ? C.greenBorder : C.border2}`, background: checkedAll ? C.green : C.bg3, color: checkedAll ? "#fff" : C.text2, fontSize: 12, fontWeight: 700, cursor: isCompleted ? "default" : "pointer", opacity: isCompleted ? 0.4 : 1 }}>✓</button>
      </div>
    );
  }

  const prepStatusFull = getPrepTimeStatus();
  const prepTimeFull = calculatePrepTime();
  const safeNote = typeof card.note === "string" ? card.note : "";

  return (
    <div style={{
      background: isHeld ? `${C.amber}08` : C.bg2,
      border: `1px solid ${isHeld ? C.amber3 : urgencyBorder[safeUrgency]}`,
      borderRadius: 10,
      boxShadow: isHeld ? "none" : safeUrgency === "urgent"
        ? `0 0 0 1px ${C.red}30, 0 4px 16px ${urgencyGlow[safeUrgency]}`
        : `0 2px 8px ${urgencyGlow[safeUrgency]}`,
      transition: "box-shadow .3s, border-color .3s, opacity .2s",
      opacity: isCompleted ? 0.55 : 1,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Urgency accent bar — thin, high-signal */}
      <div style={{ height: 3, background: isHeld ? C.amber : (isCompleted ? C.green : urgencyAccentLine[safeUrgency]), transition: "background .3s" }} />

      <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Card Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 800, color: C.text1, letterSpacing: "-0.01em" }}>{safeOrderId}</span>
            <span style={pill(SRC_COLORS[safeSource]?.bg || C.bg4, SRC_COLORS[safeSource]?.color || C.text2)}>{srcLabel(safeSource)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            {safeStation && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: stationColors.color, background: stationColors.bg, padding: "2px 7px", borderRadius: 4 }}>{safeStation}</span>}
            {isHeld && <span style={{ fontSize: 9, fontWeight: 700, color: C.amber, background: `${C.amber}18`, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.05em" }}>⏸ HELD{typeof card.holdReason === "string" && card.holdReason.trim() ? ` · ${card.holdReason.trim().slice(0, 60)}` : ""}</span>}
            {isCompleted && <span style={{ fontSize: 9, fontWeight: 700, color: C.green, background: C.greenBg, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.05em" }}>✓ DONE</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: prepStatusFull.color, fontFamily: "monospace", fontWeight: 700 }}>{prepStatusFull.label}</span>
          <ElapsedTimer startedAt={safeStartedAt} urgency={isHeld ? "ok" : safeUrgency} />
        </div>
      </div>

      {/* Item progress bar */}
      {items.length > 1 && (
        <div style={{ height: 3, background: C.bg4, borderRadius: 99, marginBottom: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 99, background: checkedAll ? C.green : C.amber3, width: `${(checkedCount / items.length) * 100}%`, transition: "width .4s cubic-bezier(.4,0,.2,1)" }} />
        </div>
      )}
      {items.length > 0 && (
        <div style={{ fontSize: 10, color: checkedAll ? C.green : C.text3, marginBottom: 10, fontWeight: 600, letterSpacing: "0.02em" }}>
          {checkedAll ? "All checked" : `${checkedCount} / ${items.length}`}
        </div>
      )}

      {/* Note — editable inline */}
      {(safeNote || editingNote) && (
        <div style={{ marginBottom: 8 }}>
          {editingNote ? (
            <div style={{ display: "flex", gap: 5 }}>
              <input autoFocus maxLength={500} style={{ ...input, fontSize: 11, padding: "4px 8px", flex: 1 }} value={noteVal} onChange={e => setNoteVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { handleNoteSave(); } if (e.key === "Escape") { e.stopPropagation(); cancelNoteEdit(); } }}
                onBlur={handleNoteSave} />
            </div>
          ) : (
            <div onClick={() => setEditingNote(true)} style={{ fontSize: 11, color: C.amber2, background: `${C.amber}0f`, padding: "6px 10px", borderRadius: 6, borderLeft: `2px solid ${C.amber3}`, cursor: "text", display: "flex", gap: 6, alignItems: "center", wordBreak: "break-word" }}>
              <span style={{ flexShrink: 0, fontSize: 10, opacity: 0.7 }}>note</span><span style={{ flex: 1 }}>{safeNote || "add note…"}</span><span style={{ color: C.text3, fontSize: 9, flexShrink: 0 }}>edit</span>
            </div>
          )}
        </div>
      )}
      {!safeNote && !editingNote && (
        <button onClick={() => setEditingNote(true)} style={{ marginBottom: 8, fontSize: 10, color: C.text3, background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 5, padding: "2px 7px", cursor: "pointer", alignSelf: "flex-start" }}>+ note</button>
      )}

      {/* Items — per-item checkoff */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, flex: 1 }}>
        {items.length === 0 && (
          <div style={{ fontSize: 11, color: C.text3, padding: "8px 0", textAlign: "center" }}>No items</div>
        )}
        {items.map((it, j) => {
          const checked = !!it.checked;
          const qty = safeItemQty(it);
          const name = safeItemName(it);
          const mod = typeof it.mod === "string" && it.mod.trim() ? it.mod.trim() : "";
          const itemNotes = typeof it.notes === "string" && it.notes.trim() ? it.notes.trim() : "";
          return (
            <div
              key={j}
              role="checkbox"
              aria-checked={checked}
              aria-label={`${name} times ${qty}${checked ? ", checked" : ", unchecked"}`}
              aria-disabled={isCompleted}
              onClick={(e) => { e.stopPropagation(); handleItemCheck(j); }}
              style={{ background: checked ? `${C.green}0d` : C.bg3, border: `1px solid ${checked ? `${C.green}30` : C.border}`, borderRadius: 7, padding: "7px 10px", cursor: isCompleted ? "default" : "pointer", transition: "all .15s" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 15, height: 15, borderRadius: 3, border: `1.5px solid ${checked ? C.green : C.border2}`, background: checked ? C.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" }}>
                    {checked && <span style={{ color: "#fff", fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, textDecoration: checked ? "line-through" : "none", color: checked ? C.text3 : C.text1, wordBreak: "break-word", transition: "color .15s" }}>{name}</span>
                </div>
                <span style={{ color: checked ? C.text3 : C.text2, fontFamily: "monospace", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>×{qty}</span>
              </div>
              {(mod || itemNotes) && (
                <div style={{ marginTop: 4, marginLeft: 23, display: "flex", flexDirection: "column", gap: 2 }}>
                  {mod && <div style={{ fontSize: 10, color: C.text3, wordBreak: "break-word" }}>{mod}</div>}
                  {itemNotes && <div style={{ fontSize: 10, color: C.amber2, wordBreak: "break-word", fontStyle: "italic" }}>{itemNotes}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hold input */}
      {showHoldInput && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <input autoFocus maxLength={200} style={{ ...input, fontSize: 11, padding: "5px 8px", flex: 1 }} value={holdReason} onChange={e => { setHoldReason(e.target.value); if (holdError) setHoldError(""); }} placeholder="Hold reason (e.g. waiting on oat milk)…"
              onKeyDown={e => { if (e.key === "Enter") handleHold(); if (e.key === "Escape") { setShowHoldInput(false); setHoldReason(""); setHoldError(""); } }} />
            <button style={{ ...btn("ghost"), fontSize: 11, padding: "4px 9px" }} onClick={() => { setShowHoldInput(false); setHoldReason(""); setHoldError(""); }} aria-label="Cancel hold" title="Cancel hold">✕</button>
            <button style={{ ...btn("ghost"), fontSize: 11, padding: "4px 9px" }} onClick={handleHold} aria-label="Confirm hold" title="Confirm hold">✓</button>
          </div>
          {holdError && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>{holdError}</div>}
        </div>
      )}

      {/* Action row */}
      <div style={{ display: "flex", gap: 5 }}>
        <button
          onClick={handleDone}
          disabled={isCompleted}
          aria-label="Mark ticket done"
          title="Mark ticket done"
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 7,
            border: `1px solid ${checkedAll ? C.greenBorder : C.border2}`,
            background: checkedAll ? C.green : C.bg3,
            color: checkedAll ? "#fff" : C.text2,
            fontSize: 13,
            fontWeight: 700,
            cursor: isCompleted ? "default" : "pointer",
            transition: "all .2s",
            minHeight: 42,
            opacity: isCompleted ? 0.4 : 1,
          }}
        >
          {checkedAll ? "Done" : `Done ${checkedCount}/${items.length}`}
        </button>
        {isHeld ? (
          <button onClick={() => handleHoldToggle()} aria-label="Resume ticket" title="Resume ticket"
            style={{ padding: "10px 13px", borderRadius: 7, border: `1px solid ${C.amber3}`, background: `${C.amber}14`, color: C.amber2, fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 42 }}>▶</button>
        ) : (
          <button onClick={() => setShowHoldInput(h => !h)} disabled={isCompleted} aria-label="Hold ticket" title="Hold ticket"
            style={{ padding: "10px 13px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text3, fontSize: 13, cursor: isCompleted ? "default" : "pointer", minHeight: 42, opacity: isCompleted ? 0.4 : 1 }}>⏸</button>
        )}
        {onStart && (
          <button onClick={handleStart} disabled={isCompleted || safeStartedAt !== null} aria-label="Start ticket" title="Start ticket"
            style={{ padding: "10px 13px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: safeStartedAt !== null ? C.text3 : C.green, fontSize: 13, cursor: (isCompleted || safeStartedAt !== null) ? "default" : "pointer", minHeight: 42, opacity: (isCompleted || safeStartedAt !== null) ? 0.4 : 1 }}>▶</button>
        )}
        {onMoveStation && (
          <button onClick={handleMoveStation} disabled={isCompleted || isHeld} aria-label="Move to station" title="Move to station"
            style={{ padding: "10px 13px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text3, fontSize: 13, cursor: (isCompleted || isHeld) ? "default" : "pointer", minHeight: 42, opacity: (isCompleted || isHeld) ? 0.4 : 1 }}>↔</button>
        )}
        {onBump && (
          <button onClick={handleBump} disabled={isCompleted || isHeld} aria-label="Bump ticket" title="Bump ticket"
            style={{ padding: "10px 13px", borderRadius: 7, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text3, fontSize: 13, cursor: (isCompleted || isHeld) ? "default" : "pointer", minHeight: 42, opacity: (isCompleted || isHeld) ? 0.4 : 1 }}>⇪</button>
        )}
        {/* Urgency stepper */}
        <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: `1px solid ${C.border2}`, flexShrink: 0 }}>
          <button onClick={() => handleUrgencyChange(URGENCY_PREV[safeUrgency])} disabled={isCompleted} aria-label="Lower urgency" title="Lower urgency"
            style={{ padding: "10px 9px", background: "transparent", border: "none", borderRight: `1px solid ${C.border2}`, color: C.text3, fontSize: 12, cursor: isCompleted ? "default" : "pointer", minHeight: 42, opacity: isCompleted ? 0.4 : 1 }}>▽</button>
          <button onClick={() => handleUrgencyChange(URGENCY_NEXT[safeUrgency])} disabled={isCompleted} aria-label="Raise urgency" title="Raise urgency"
            style={{ padding: "10px 9px", background: "transparent", border: "none", color: { urgent: C.red, soon: C.amber, ok: C.text3 }[safeUrgency], fontSize: 12, cursor: isCompleted ? "default" : "pointer", minHeight: 42, opacity: isCompleted ? 0.4 : 1 }}>△</button>
        </div>
      </div>
      </div>{/* end padding wrapper */}
    </div>
  );
}

export default KDSCard;
