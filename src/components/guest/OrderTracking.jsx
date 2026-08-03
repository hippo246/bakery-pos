import React from 'react';
import { useState, useMemo, useEffect, useRef } from "react";
import { card, btn } from "../../styles/theme";

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const ORDER_STAGES = {
  SENT: { label: "Sent", icon: "📤", color: "#95a5a6" },
  CONFIRMED: { label: "Confirmed", icon: "✅", color: "#3498db" },
  PREPARING: { label: "Preparing", icon: "👨‍🍳", color: "#f39c12" },
  READY: { label: "Ready", icon: "🔔", color: "#27ae60" },
  SERVED: { label: "Served", icon: "🍽️", color: "#8b6914" },
  COMPLETED: { label: "Completed", icon: "✓", color: "#27ae60" }
};

const TAKEAWAY_STAGES = {
  SENT: { label: "Sent", icon: "📤", color: "#95a5a6" },
  CONFIRMED: { label: "Confirmed", icon: "✅", color: "#3498db" },
  PREPARING: { label: "Preparing", icon: "👨‍🍳", color: "#f39c12" },
  READY_FOR_PICKUP: { label: "Ready for Pickup", icon: "📦", color: "#27ae60" },
  COLLECTED: { label: "Collected", icon: "🤝", color: "#8b6914" }
};

// Rotating kitchen banter per stage — small, silly, keeps the wait feeling alive
const STAGE_BANTER = {
  SENT: ["Your order just landed in the kitchen queue…", "Ticket printed, chefs incoming."],
  CONFIRMED: ["Kitchen said yes! Prep is starting.", "Confirmed — ingredients are being gathered."],
  PREPARING: ["👨‍🍳 Chef is going full speed on this one.", "Pans are hot, things are happening.", "Someone's definitely tasting the sauce right now."],
  READY: ["🔔 It's ready! Come grab it while it's hot.", "Piping hot and waiting on you."],
  READY_FOR_PICKUP: ["📦 Packed up and ready for pickup!", "All boxed up — swing by the counter."],
  SERVED: ["Enjoy every bite! 🍽️", "Bon appétit — flag us down if you need anything."],
  COMPLETED: ["Hope that hit the spot! ✓", "Order complete — thanks for stopping by."],
  COLLECTED: ["Order collected — enjoy! 🤝", "Picked up and on the way to being devoured."]
};

const ORDER_TRACKING_STYLE_ID = "order-tracking-cray-styles";
const ORDER_TRACKING_CSS = `
@keyframes ot-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.35); } 70% { box-shadow: 0 0 0 12px rgba(0,0,0,0); } 100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); } }
@keyframes ot-bounce-icon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes ot-fade-slide { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
@keyframes ot-confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(540deg); opacity: 0; } }
@keyframes ot-live-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes ot-fill { from { width: 0%; } to { width: 100%; } }
.ot-current-stage { animation: ot-pulse-ring 1.8s infinite, ot-bounce-icon 1.2s ease-in-out infinite; }
.ot-banter { animation: ot-fade-slide 0.35s ease; }
.ot-live-dot { animation: ot-live-dot 1.4s ease-in-out infinite; }
`;

const CONFETTI_EMOJIS = ["🎉", "✨", "🎊", "⭐", "🥳"];

export default function OrderTracking({ order, tableId, onAddMoreItems, onCallWaiter }) {
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  
  const isTakeaway = order?.orderType === "TAKEAWAY" || order?.orderType === "DIRECT_TAKEAWAY";
  const stages = isTakeaway ? TAKEAWAY_STAGES : ORDER_STAGES;
  
  const currentStageIndex = useMemo(() => {
    if (!order?.status) return 0;
    const stageKeys = Object.keys(stages);
    return stageKeys.indexOf(order.status);
  }, [order?.status, stages]);

  const estimatedTime = order?.estimatedPrepTime || 15;

  // Live countdown from estimated prep time
  const [countdownSeconds, setCountdownSeconds] = useState(() => estimatedTime * 60);
  useEffect(() => {
    if (!order?.createdAt) return;
    const orderAge = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
    const remaining = Math.max(0, estimatedTime * 60 - orderAge);
    setCountdownSeconds(remaining);
    if (remaining === 0) return;
    const id = setInterval(() => setCountdownSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [order?.createdAt, estimatedTime]);
  const countdownMins = Math.floor(countdownSeconds / 60);
  const countdownSecs = countdownSeconds % 60;
  const countdownLabel = countdownSeconds === 0
    ? "Any moment now! 🔔"
    : `${countdownMins}:${String(countdownSecs).padStart(2, "0")} remaining`;

  const [staffMsgDismissed, setStaffMsgDismissed] = useState(false);

  // Inject the flourish keyframes once
  useEffect(() => {
    if (typeof document !== "undefined" && !document.getElementById(ORDER_TRACKING_STYLE_ID)) {
      const el = document.createElement("style");
      el.id = ORDER_TRACKING_STYLE_ID;
      el.textContent = ORDER_TRACKING_CSS;
      document.head.appendChild(el);
    }
  }, []);

  // Live "time since order placed" ticker
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!order?.createdAt) return;
    const tick = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.createdAt]);
  const elapsedLabel = elapsedSeconds < 5
    ? "just now"
    : elapsedSeconds < 60
    ? `${elapsedSeconds}s ago`
    : elapsedSeconds < 3600
    ? `${Math.floor(elapsedSeconds / 60)}m ago`
    : `${Math.floor(elapsedSeconds / 3600)}h ${Math.floor((elapsedSeconds % 3600) / 60)}m ago`;

  // Rotating banter line for whatever stage we're currently in
  const [banterIndex, setBanterIndex] = useState(0);
  useEffect(() => {
    setBanterIndex(0);
    const lines = STAGE_BANTER[order?.status] || [];
    if (lines.length <= 1) return;
    const id = setInterval(() => setBanterIndex(i => (i + 1) % lines.length), 3500);
    return () => clearInterval(id);
  }, [order?.status]);
  const banterLines = STAGE_BANTER[order?.status] || [];
  const banterText = banterLines[banterIndex] || "";

  // Confetti burst whenever the order crosses into a "big moment" stage
  const [confettiPieces, setConfettiPieces] = useState([]);
  const prevStatusRef = useRef(order?.status);
  useEffect(() => {
    const celebrateOn = ["READY", "READY_FOR_PICKUP", "SERVED", "COMPLETED", "COLLECTED"];
    if (order?.status !== prevStatusRef.current && celebrateOn.includes(order?.status)) {
      const pieces = Array.from({ length: 24 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.2,
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)]
      }));
      setConfettiPieces(pieces);
      const t = setTimeout(() => setConfettiPieces([]), 3200);
      prevStatusRef.current = order?.status;
      return () => clearTimeout(t);
    }
    prevStatusRef.current = order?.status;
  }, [order?.status]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", paddingBottom: 80, position: "relative", overflow: "hidden" }}>
      {/* Confetti overlay — fires on big status moments */}
      {confettiPieces.length > 0 && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1200, overflow: "hidden" }}>
          {confettiPieces.map(p => (
            <span key={p.id} style={{
              position: "absolute",
              top: -20,
              left: `${p.left}%`,
              fontSize: 22,
              animation: `ot-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`
            }}>
              {p.emoji}
            </span>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ 
        backgroundColor: "#faf8f5", 
        borderBottom: "1px solid #e8e4df",
        padding: isMobile ? "16px" : "20px 24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="ot-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#27ae60", display: "inline-block" }} />
          <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#3d2c1f" }}>
            Order Tracking
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#8b7355" }}>
          {tableId ? `Table ${tableId}` : "Takeaway Order"} · placed {elapsedLabel}
        </div>
      </div>

      {/* Success State */}
      <div style={{ padding: isMobile ? 16 : 24, textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#27ae60", marginBottom: 8 }}>
          Order Submitted Successfully
        </div>
        <div style={{ fontSize: 14, color: "#8b7355", marginBottom: 20 }}>
          Your order has been sent to the kitchen
        </div>

        <div style={{ ...card, backgroundColor: "white", padding: 20, marginBottom: 24, textAlign: "left" }}>
          <div style={{ fontSize: 12, color: "#a89070", marginBottom: 4 }}>Order Reference</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#3d2c1f", marginBottom: 16 }}>
            #{order?.id || "GUEST-" + Date.now()}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#a89070", marginBottom: 4 }}>Table</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f" }}>
                {tableId || "Takeaway"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#a89070", marginBottom: 4 }}>Time</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f" }}>
                {formatTime(order?.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Tracker */}
        <div style={{ ...card, backgroundColor: "white", padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f" }}>Order Status</div>
            <div style={{ fontSize: 12, color: "#8b7355" }}>
              {currentStageIndex + 1}/{Object.keys(stages).length} · {Math.round(((currentStageIndex + 1) / Object.keys(stages).length) * 100)}%
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
            {/* connector track */}
            <div style={{ position: "absolute", top: 20, left: "5%", right: "5%", height: 3, backgroundColor: "#e8e4df", borderRadius: 2, zIndex: 0 }}>
              <div style={{
                height: "100%",
                borderRadius: 2,
                backgroundColor: "#27ae60",
                width: `${Math.min(100, (currentStageIndex / (Object.keys(stages).length - 1)) * 100)}%`,
                transition: "width 0.6s ease"
              }} />
            </div>
            {Object.entries(stages).map(([key, stage], index) => {
              const isActive = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", zIndex: 1 }}>
                  <div
                    className={isCurrent ? "ot-current-stage" : ""}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: isActive ? stage.color : "#e8e4df",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      marginBottom: 8,
                      border: isCurrent ? `3px solid ${stage.color}` : "none",
                      transition: "background-color 0.4s ease"
                    }}>
                    {stage.icon}
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontWeight: isCurrent ? 600 : 400,
                    color: isActive ? "#3d2c1f" : "#a89070",
                    textAlign: "center"
                  }}>
                    {stage.label}
                  </div>
                </div>
              );
            })}
          </div>

          {banterText && (
            <div key={banterText} className="ot-banter" style={{ 
              fontSize: 13, 
              color: "#8b6914", 
              textAlign: "center", 
              marginBottom: 12,
              fontStyle: "italic"
            }}>
              {banterText}
            </div>
          )}

          <div style={{
            padding: 16,
            backgroundColor: countdownSeconds === 0 ? "#e8f8ef" : "#f5f0e8",
            borderRadius: 8,
            textAlign: "center",
            transition: "background-color 0.5s ease"
          }}>
            <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 4 }}>
              {countdownSeconds === 0 ? "Ready!" : "Estimated time remaining"}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: countdownSeconds === 0 ? "#27ae60" : "#8b6914" }}>
              {countdownLabel}
            </div>
          </div>
        </div>

        {/* Order Items */}
        {order?.items && order.items.length > 0 && (
          <div style={{ ...card, backgroundColor: "white", padding: 20, marginBottom: 24, textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f" }}>Order Items</div>
              <span style={{ fontSize: 12, color: "#8b7355", backgroundColor: "#f5f0e8", borderRadius: 12, padding: "2px 10px" }}>
                {order.items.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {order.items.map((item, index) => (
                <div key={index} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  paddingBottom: 12,
                  borderBottom: index < order.items.length - 1 ? "1px solid #f0ebe3" : "none"
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 4 }}>
                      {item.quantity}x {item.name}
                    </div>
                    {item.notes && (
                      <div style={{ fontSize: 12, color: "#8b7355" }}>
                        Note: {item.notes}
                      </div>
                    )}
                    {item.allergyNote && (
                      <div style={{ fontSize: 12, color: "#c0392b" }}>
                        ⚠️ Allergy: {item.allergyNote}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#8b6914" }}>
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ 
              marginTop: 16, 
              paddingTop: 16, 
              borderTop: "1px solid #e8e4df",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: 16, color: "#8b7355" }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#3d2c1f" }}>
                {formatCurrency(order?.total || 0)}
              </span>
            </div>
          </div>
        )}

        {/* Staff Message */}
        {order?.staffMessage && !staffMsgDismissed && (
          <div style={{
            ...card,
            backgroundColor: "#e8f4fd",
            padding: 16,
            marginBottom: 24,
            borderLeft: "4px solid #3498db",
            position: "relative"
          }}>
            <div style={{ fontSize: 12, color: "#3498db", marginBottom: 4, fontWeight: 600 }}>
              Message from Staff
            </div>
            <div style={{ fontSize: 14, color: "#3d2c1f", paddingRight: 28 }}>
              {order.staffMessage}
            </div>
            <button
              onClick={() => setStaffMsgDismissed(true)}
              style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", fontSize: 16, color: "#8b7355", cursor: "pointer", lineHeight: 1 }}
              aria-label="Dismiss"
            >×</button>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderTop: "1px solid #e8e4df",
        padding: "12px 16px",
        display: "flex",
        gap: 12,
        zIndex: 100
      }}>
        <button
          style={{
            ...btn("ghost"),
            flex: 1,
            padding: "14px",
            fontSize: 15,
            border: "1px solid #d4c4b0",
            borderRadius: 8
          }}
          onClick={onCallWaiter}
        >
          🙋 Call Waiter
        </button>
        <button
          style={{
            ...btn("primary"),
            flex: 1,
            padding: "14px",
            fontSize: 15,
            borderRadius: 8,
            backgroundColor: "#8b6914"
          }}
          onClick={onAddMoreItems}
        >
          + Add More Items
        </button>
      </div>
    </div>
  );
}
