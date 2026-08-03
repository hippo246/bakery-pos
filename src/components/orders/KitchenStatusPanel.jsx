// eslint-disable-next-line no-unused-vars
import React from 'react';
/**
 * Kitchen Status Panel
 * Floating panel showing real-time kitchen status in POS mode
 */

function KitchenStatusPanel({ kdsCards = [], onClose }) {
  const queueLength = kdsCards.filter(c => ["NEW", "ACCEPTED", "PREPARING"].includes(c.status)).length;
  const avgPrepTime = 5; // minutes per order
  const estimatedMinutes = queueLength * avgPrepTime;

  // Derive the real set of stations from the data instead of hardcoding
  // ["Bar", "Kitchen"] — otherwise any card with a different station name
  // still counts toward Queue Length above but silently disappears from
  // the Station Load breakdown below, so the numbers stop adding up.
  const knownStations = [...new Set(kdsCards.map(c => c.station).filter(Boolean))];
  const stationsToShow = knownStations.length > 0 ? knownStations : ["Bar", "Kitchen"];

  return (
    <div style={{
      position: "fixed",
      top: 80,
      right: 20,
      width: 300,
      background: "var(--cafe-bg-card)",
      border: `1px solid var(--cafe-border)`,
      borderRadius: "var(--cafe-radius-lg)",
      padding: "var(--cafe-space-md)",
      zIndex: 100,
      boxShadow: "var(--cafe-shadow-lg)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--cafe-space-sm)" }}>
        <div style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
          🍳 Kitchen Status
        </div>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--cafe-text-tertiary)", fontSize: 18, cursor: "pointer" }}
        >
          ×
        </button>
      </div>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--cafe-space-sm)" }}>
        {/* Queue Length */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)" }}>Queue Length</span>
          <span style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-accent)" }}>
            {queueLength} orders
          </span>
        </div>

        {/* Prep Time Estimate */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)" }}>Est. Prep Time</span>
          <span style={{ fontSize: "var(--cafe-font-sm)", fontWeight: 700, color: "var(--cafe-success)" }}>
            {estimatedMinutes > 0 ? `${estimatedMinutes} min` : "Ready now"}
          </span>
        </div>

        {/* High Volume Warning */}
        {queueLength >= 5 && (
          <div style={{
            padding: "var(--cafe-space-sm)",
            background: "var(--cafe-warning-bg)",
            border: `1px solid var(--cafe-warning-border)`,
            borderRadius: "var(--cafe-radius-sm)",
          }}>
            <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-warning)", fontWeight: 600 }}>
              ⚠️ High Volume
            </div>
            <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-tertiary)", marginTop: 2 }}>
              Kitchen is busy. Expect delays.
            </div>
          </div>
        )}

        {/* Station Load */}
        <div style={{ marginTop: "var(--cafe-space-xs)" }}>
          <div style={{ fontSize: "var(--cafe-font-xs)", color: "var(--cafe-text-secondary)", marginBottom: 4 }}>
            Station Load
          </div>
          {stationsToShow.map(station => {
            const stationLoad = kdsCards.filter(c => c.station === station && ["NEW", "ACCEPTED", "PREPARING"].includes(c.status)).length;
            const loadPercent = Math.min((stationLoad / 5) * 100, 100);
            return (
              <div key={station} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--cafe-font-xs)", marginBottom: 2 }}>
                  <span style={{ color: "var(--cafe-text-secondary)" }}>{station}</span>
                  <span style={{ color: loadPercent > 80 ? "var(--cafe-warning)" : "var(--cafe-text-tertiary)" }}>{stationLoad} items</span>
                </div>
                <div style={{ height: 4, background: "var(--cafe-bg-hover)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${loadPercent}%`,
                    height: "100%",
                    background: loadPercent > 80 ? "var(--cafe-warning)" : "var(--cafe-accent)",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default KitchenStatusPanel;
