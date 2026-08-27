import React from 'react';
import { DATE_PRESETS, DATE_PRESET_LABELS } from '../../utils/dateRangeUtils.js';

export default function AnalyticsReportsTopbar({
  isMobile,
  datePreset,
  setDatePreset,
  setExportDialog,
  isExporting,
  currentPeriodOrders,
  handlePrint,
  currentDateRange
}) {
  return (
    <div style={{ 
      display: "flex", justifyContent: "space-between",
      alignItems: isMobile ? "flex-start" : "center",
      marginBottom: isMobile ? 20 : 28, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 0,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.03em" }}>
          Analytics &amp; Reports
        </div>
        <div style={{ fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-tertiary)" }}>
          Review sales, costs, operations, and business performance
        </div>
      </div>

      <div style={{ display: "flex", gap: isMobile ? 8 : 10, alignItems: "center", flexWrap: "wrap", width: isMobile ? '100%' : 'auto' }}>
        {/* Date Range Selector */}
        <div style={{ display: "flex", gap: 2, background: "var(--cafe-bg-hover)", padding: isMobile ? 3 : 4, borderRadius: 10, overflowX: 'auto', maxWidth: isMobile ? '100%' : 'none' }}>
          {Object.values(DATE_PRESETS).slice(0, isMobile ? 4 : 6).map(preset => (
            <button
              key={preset} type="button" aria-pressed={datePreset === preset}
              onClick={() => setDatePreset(preset)}
              style={{ 
                padding: isMobile ? "8px 12px" : "10px 18px", borderRadius: 8, border: "none",
                background: datePreset === preset ? "var(--cafe-bg-card)" : "transparent",
                color: datePreset === preset ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)",
                fontSize: isMobile ? 11 : 13, cursor: "pointer",
                fontWeight: datePreset === preset ? 700 : 500, minHeight: isMobile ? 36 : 38, transition: "all .18s",
                whiteSpace: 'nowrap'
              }}
            >
              {DATE_PRESET_LABELS[preset]}
            </button>
          ))}
        </div>

        {/* Export Button */}
        <button type="button"
          onClick={() => setExportDialog({ open: true, format: 'csv' })}
          disabled={isExporting || currentPeriodOrders.length === 0}
          style={{
            background: 'transparent', border: '1px solid var(--cafe-border-light)',
            borderRadius: 10, color: 'var(--cafe-text-primary)',
            fontSize: isMobile ? 11 : 13, padding: isMobile ? "8px 12px" : "10px 18px", minHeight: isMobile ? 36 : 38,
            opacity: (isExporting || currentPeriodOrders.length === 0) ? 0.5 : 1,
            cursor: (isExporting || currentPeriodOrders.length === 0) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
          }}
        >
          <span>📥</span>{isExporting ? 'Exporting...' : 'Export'}
        </button>

        {/* Print Button */}
        <button type="button" onClick={handlePrint}
          disabled={currentPeriodOrders.length === 0}
          style={{
            background: 'transparent', border: '1px solid var(--cafe-border-light)',
            borderRadius: 10, color: 'var(--cafe-text-primary)',
            fontSize: isMobile ? 11 : 13, padding: isMobile ? "8px 12px" : "10px 18px", minHeight: isMobile ? 36 : 38,
            opacity: currentPeriodOrders.length === 0 ? 0.5 : 1,
            cursor: currentPeriodOrders.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
          }}
        >
          <span>🖨️</span>Print
        </button>
      </div>
    </div>
  );
}
