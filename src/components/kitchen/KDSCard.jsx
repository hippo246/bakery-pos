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

function KDSCard({ card, onDone, onHold, onUrgencyChange, onNoteEdit, onItemCheck, onStart, onMoveStation, onBump, compact }) {
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(card.note || "");
  const [holdReason, setHoldReason] = useState("");
  const [showHoldInput, setShowHoldInput] = useState(false);

  const calculatePrepTime = () => {
    let totalTime = 0;
    card.items.forEach(item => {
      const prepTime = PREP_TIMES[item.name] || 5;
      totalTime += prepTime * item.qty;
    });
    return totalTime;
  };

  const getPrepTimeStatus = () => {
    const prepTime = calculatePrepTime();
    const elapsedMinutes = getMinutesElapsed(card.startedAt);
    const remaining = Math.max(0, prepTime - elapsedMinutes);
    
    if (remaining === 0) return { label: "Ready", color: C.green };
    if (remaining <= 2) return { label: `${remaining}m left`, color: C.amber };
    return { label: `${remaining}m left`, color: C.text3 };
  };

  const urgencyBorder = { urgent: C.red, soon: C.amber, ok: C.border2 };
  const urgencyGlow = { urgent: "rgba(224,82,82,0.15)", soon: "rgba(232,160,32,0.10)", ok: "transparent" };
  const checkedAll = card.items.every(it => it.checked);
  const checkedCount = card.items.filter(it => it.checked).length;

  if (compact) {
    const prepStatus = getPrepTimeStatus();
    return (
      <div style={{ background: card.held ? C.amberBg : C.bg2, border: `1px solid ${card.held ? C.amber3 : urgencyBorder[card.urgency]}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, opacity: card.held ? 0.7 : 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, width: 64, flexShrink: 0 }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{card.id}</span>
          {card.held && <span style={{ fontSize: 9, color: C.amber, fontWeight: 700 }}>HELD</span>}
        </div>
        <span style={pill(SRC_COLORS[card.source]?.bg || C.bg4, SRC_COLORS[card.source]?.color || C.text2)}>{srcLabel(card.source)}</span>
        {card.station && <span style={{ ...pill(card.station === "Bar" ? C.blueBg : C.purpleBg, card.station === "Bar" ? C.blue : C.purple), fontSize: 9 }}>{card.station}</span>}
        <div style={{ flex: 1, fontSize: 12, color: C.text2 }}>{card.items.map(it => `${it.checked ? "✓ " : ""}${it.name} ×${it.qty}`).join(" · ")}</div>
        {card.note && <span style={{ fontSize: 11, color: C.amber }} title={card.note}>📝</span>}
        <span style={{ fontSize: 10, color: C.text3, fontFamily: "monospace" }}>{checkedCount}/{card.items.length}</span>
        <span style={{ fontSize: 10, color: prepStatus.color, fontFamily: "monospace", fontWeight: 600 }}>{prepStatus.label}</span>
        <ElapsedTimer startedAt={card.startedAt} urgency={card.held ? "ok" : card.urgency} />
        <button onClick={() => onUrgencyChange(card.id, URGENCY_NEXT[card.urgency])} style={{ padding: "3px 7px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: { urgent: C.red, soon: C.amber, ok: C.text3 }[card.urgency], fontSize: 10, cursor: "pointer" }} title="Cycle urgency">⬤</button>
        <button onClick={() => onHold(card.id)} style={{ padding: "3px 8px", borderRadius: 5, border: `1px solid ${C.border2}`, background: "transparent", color: card.held ? C.amber : C.text3, fontSize: 11, cursor: "pointer" }}>{card.held ? "▶" : "⏸"}</button>
        <button onClick={() => onDone(card.id)} style={{ ...btn("success"), fontSize: 11, padding: "4px 10px" }}>✓</button>
      </div>
    );
  }

  return (
    <div style={{ background: card.held ? C.amberBg : C.bg2, border: `2px solid ${card.held ? C.amber3 : urgencyBorder[card.urgency]}`, borderRadius: 14, padding: 14, boxShadow: card.held ? "none" : `0 0 18px ${urgencyGlow[card.urgency]}`, transition: "all .25s", opacity: card.held ? 0.75 : 1, display: "flex", flexDirection: "column" }}>
      {/* Card Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: C.text3 }}>{card.id}</span>
          <span style={pill(SRC_COLORS[card.source]?.bg || C.bg4, SRC_COLORS[card.source]?.color || C.text2)}>{srcLabel(card.source)}</span>
          {card.station && <span style={{ ...pill(card.station === "Bar" ? C.blueBg : C.purpleBg, card.station === "Bar" ? C.blue : C.purple), fontSize: 9 }}>{card.station}</span>}
          {card.held && <span style={{ ...pill(C.amberBg, C.amber), fontSize: 9 }}>⏸ HELD{card.holdReason ? ` · ${card.holdReason}` : ""}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: getPrepTimeStatus().color, fontFamily: "monospace", fontWeight: 600 }}>{getPrepTimeStatus().label}</span>
          <ElapsedTimer startedAt={card.startedAt} urgency={card.held ? "ok" : card.urgency} />
        </div>
      </div>

      {/* Item progress bar */}
      {card.items.length > 1 && (
        <div style={{ height: 3, background: C.bg4, borderRadius: 2, marginBottom: 8, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: checkedAll ? C.green : C.amber3, width: `${(checkedCount / card.items.length) * 100}%`, transition: "width .3s" }} />
        </div>
      )}

      {/* Note — editable inline */}
      {(card.note || editingNote) && (
        <div style={{ marginBottom: 8 }}>
          {editingNote ? (
            <div style={{ display: "flex", gap: 5 }}>
              <input autoFocus style={{ ...input, fontSize: 11, padding: "4px 8px", flex: 1 }} value={noteVal} onChange={e => setNoteVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { onNoteEdit(card.id, noteVal); setEditingNote(false); } if (e.key === "Escape") setEditingNote(false); }}
                onBlur={() => { onNoteEdit(card.id, noteVal); setEditingNote(false); }} />
            </div>
          ) : (
            <div onClick={() => setEditingNote(true)} style={{ fontSize: 11, color: C.amber, background: "rgba(232,160,32,.07)", padding: "5px 9px", borderRadius: 6, borderLeft: `2px solid ${C.amber3}`, cursor: "text", display: "flex", gap: 6, alignItems: "center" }}>
              <span>📝</span><span style={{ flex: 1 }}>{card.note || "add note…"}</span><span style={{ color: C.text3, fontSize: 10 }}>✎</span>
            </div>
          )}
        </div>
      )}
      {!card.note && !editingNote && (
        <button onClick={() => setEditingNote(true)} style={{ marginBottom: 8, fontSize: 10, color: C.text3, background: "transparent", border: `1px dashed ${C.border}`, borderRadius: 5, padding: "2px 7px", cursor: "pointer", alignSelf: "flex-start" }}>+ note</button>
      )}

      {/* Items — per-item checkoff */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, flex: 1 }}>
        {card.items.map((it, j) => (
          <div key={j} onClick={() => onItemCheck(card.id, j)} style={{ background: it.checked ? C.greenBg : C.bg3, border: `1px solid ${it.checked ? C.greenBorder : C.border}`, borderRadius: 7, padding: "7px 10px", cursor: "pointer", transition: "all .15s", opacity: it.checked ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14, color: it.checked ? C.green : C.text3, transition: "color .15s" }}>{it.checked ? "✓" : "○"}</span>
                <span style={{ textDecoration: it.checked ? "line-through" : "none", color: it.checked ? C.text3 : C.text }}>{it.name}</span>
              </div>
              <span style={{ color: it.checked ? C.text3 : C.amber2, fontFamily: "monospace", fontSize: 12 }}>× {it.qty}</span>
            </div>
            {it.mod && <div style={{ fontSize: 10, color: C.text3, marginTop: 3, marginLeft: 21 }}>→ {it.mod}</div>}
          </div>
        ))}
      </div>

      {/* Hold input */}
      {showHoldInput && (
        <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
          <input autoFocus style={{ ...input, fontSize: 11, padding: "5px 8px", flex: 1 }} value={holdReason} onChange={e => setHoldReason(e.target.value)} placeholder="Hold reason (e.g. waiting on oat milk)…"
            onKeyDown={e => { if (e.key === "Enter") { onHold(card.id, holdReason); setShowHoldInput(false); setHoldReason(""); } if (e.key === "Escape") setShowHoldInput(false); }} />
          <button style={{ ...btn("ghost"), fontSize: 11, padding: "4px 9px" }} onClick={() => setShowHoldInput(false)}>✕</button>
        </div>
      )}

      {/* Action row */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        <button onClick={() => onDone(card.id)} style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: checkedAll ? C.greenBg : C.bg4, color: checkedAll ? C.green : C.text2, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: ".03em", transition: "all .2s", minHeight: 44 }}>
          {checkedAll ? "✓ Done" : `✓ Done (${checkedCount}/${card.items.length})`}
        </button>
        {card.held ? (
          <button onClick={() => onHold(card.id)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${C.amber3}`, background: "rgba(232,160,32,.1)", color: C.amber2, fontSize: 12, cursor: "pointer", minHeight: 44 }}>▶ Resume</button>
        ) : (
          <button onClick={() => { if (card.held) { onHold(card.id); } else { setShowHoldInput(h => !h); } }} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }}>⏸ Hold</button>
        )}
        {onStart && (
          <button onClick={() => onStart(card.id)} style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }} title="Start ticket">▶ Start</button>
        )}
        {onMoveStation && (
          <button onClick={() => onMoveStation(card.id)} style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }} title="Move to station">↔ Move</button>
        )}
        {onBump && (
          <button onClick={() => onBump(card.id)} style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${C.border2}`, background: C.bg3, color: C.text2, fontSize: 12, cursor: "pointer", minHeight: 44 }} title="Bump ticket">⇪ Bump</button>
        )}
        {/* Urgency stepper */}
        <button onClick={() => onUrgencyChange(card.id, URGENCY_PREV[card.urgency])} title="Lower urgency" style={{ padding: "10px 8px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "transparent", color: C.text3, fontSize: 14, cursor: "pointer", minHeight: 44 }}>▽</button>
        <button onClick={() => onUrgencyChange(card.id, URGENCY_NEXT[card.urgency])} title="Raise urgency" style={{ padding: "10px 8px", borderRadius: 7, border: `1px solid ${C.border2}`, background: "transparent", color: { urgent: C.red, soon: C.amber, ok: C.text3 }[card.urgency], fontSize: 14, cursor: "pointer", minHeight: 44 }}>△</button>
      </div>
    </div>
  );
}

export default KDSCard;
