import React from 'react';
import { useMemo } from "react";

const formatMoney = (n) => `₹${  (Number.isFinite(n) ? Math.round(n) : 0).toLocaleString("en-IN")}`;

// Premium styling tokens matching CafeOS
const S = {
  card: { background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border)", borderRadius: 12, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" },
  title: { fontSize: 20, fontWeight: 800, color: "var(--cafe-text-primary)", letterSpacing: "-0.02em", marginBottom: 8 },
  desc: { fontSize: 13, color: "var(--cafe-text-tertiary)", marginBottom: 24 },
  barBg: { background: "rgba(255,255,255,0.03)", borderRadius: 6, flex: 1, position: "relative", overflow: "hidden" },
  barFill: { background: "var(--cafe-primary)", position: "absolute", top: 0, bottom: 0, left: 0, borderRadius: 6, transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)" },
  kpiVal: { fontSize: 48, fontWeight: 900, fontFamily: "monospace", color: "var(--cafe-text-primary)", letterSpacing: "-0.05em" }
};

export default function ReportViewer({ report, data }) {
  if (!report) return null;

  // Placeholder state for unimplemented reports
  if (data?.type === "placeholder") {
    return (
      <div style={S.card}>
        <h2 style={S.title}>{report.title}</h2>
        <p style={S.desc}>{report.description}</p>
        <div style={{ padding: 40, textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8, color: "var(--cafe-text-secondary)" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
          <div style={{ fontWeight: 600 }}>Building Report</div>
          <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 6 }}>{data.message}</div>
        </div>
      </div>
    );
  }

  const renderKPI = () => {
    return (
      <div style={{ ...S.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <h2 style={{ ...S.title, alignSelf: "flex-start" }}>{report.title}</h2>
        <p style={{ ...S.desc, alignSelf: "flex-start", width: "100%" }}>{report.description}</p>
        
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={S.kpiVal}>{data?.kpi || "0"}</div>
          {data?.subtext && (
            <div style={{ fontSize: 13, color: "var(--cafe-text-secondary)", marginTop: 8, fontWeight: 500 }}>
              {data.trend === "up" && <span style={{ color: "var(--cafe-success)", marginRight: 6 }}>▲</span>}
              {data.trend === "down" && <span style={{ color: "var(--cafe-danger)", marginRight: 6 }}>▼</span>}
              {data.subtext}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const max = Math.max(...(data?.values || [1]), 1);
    return (
      <div style={S.card}>
        <h2 style={S.title}>{report.title}</h2>
        <p style={S.desc}>{report.description}</p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {(data?.labels || []).map((lbl, i) => {
            const val = data.values[i];
            const pct = (val / max) * 100;
            const displayVal = data.format === "currency" ? formatMoney(val) : val;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 100, fontSize: 12, fontWeight: 600, color: "var(--cafe-text-secondary)", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {lbl}
                </div>
                <div style={{ ...S.barBg, height: 28 }}>
                  <div style={{ ...S.barFill, width: `${pct}%`, background: report.category === "financial" ? "var(--cafe-success)" : "var(--cafe-primary)" }} />
                </div>
                <div style={{ width: 80, fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "var(--cafe-text-primary)" }}>
                  {displayVal}
                </div>
              </div>
            );
          })}
          {(!data?.labels || data.labels.length === 0) && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--cafe-text-tertiary)", fontSize: 13 }}>No data for this period</div>
          )}
        </div>
      </div>
    );
  };

  const renderHeatmap = () => {
    // Simplified heatmap rendering as a bar chart for now
    return renderBarChart();
  };

  const renderPieChart = () => {
    // Simple segmented bar for pie fallback
    const total = (data?.values || []).reduce((a, b) => a + b, 0);
    const colors = ["var(--cafe-primary)", "var(--cafe-success)", "var(--cafe-accent)", "var(--cafe-info)", "var(--cafe-warning)", "var(--cafe-danger)"];
    
    return (
      <div style={S.card}>
        <h2 style={S.title}>{report.title}</h2>
        <p style={S.desc}>{report.description}</p>
        
        {total === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--cafe-text-tertiary)", fontSize: 13 }}>No data for this period</div>
        ) : (
          <>
            <div style={{ height: 32, display: "flex", borderRadius: 8, overflow: "hidden", marginBottom: 24, background: "rgba(255,255,255,0.05)" }}>
              {(data?.labels || []).map((lbl, i) => {
                const pct = (data.values[i] / total) * 100;
                if (pct === 0) return null;
                return <div key={i} style={{ width: `${pct}%`, background: colors[i % colors.length] }} title={`${lbl}: ${pct.toFixed(1)}%`} />
              })}
            </div>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {(data?.labels || []).map((lbl, i) => {
                if (data.values[i] === 0) return null;
                const displayVal = data.format === "currency" ? formatMoney(data.values[i]) : data.values[i];
                const pct = ((data.values[i] / total) * 100).toFixed(1);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: colors[i % colors.length] }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--cafe-text-primary)" }}>{lbl}</span>
                      <span style={{ fontSize: 11, color: "var(--cafe-text-secondary)", fontFamily: "monospace" }}>{displayVal} ({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderTable = () => {
    return (
      <div style={S.card}>
        <h2 style={S.title}>{report.title}</h2>
        <p style={S.desc}>{report.description}</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left" }}>
                <th style={{ padding: "12px 8px", color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>Metric</th>
                <th style={{ padding: "12px 8px", color: "var(--cafe-text-tertiary)", fontWeight: 600, textAlign: "right" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {(data?.labels || []).map((lbl, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 8px", fontWeight: 500, color: "var(--cafe-text-primary)" }}>{lbl}</td>
                  <td style={{ padding: "12px 8px", fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-text-primary)", textAlign: "right" }}>
                    {data.format === "currency" ? formatMoney(data.values[i]) : data.values[i]}
                  </td>
                </tr>
              ))}
              {(!data?.labels || data.labels.length === 0) && (
                <tr>
                  <td colSpan={2} style={{ padding: 24, textAlign: "center", color: "var(--cafe-text-tertiary)" }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  switch (report.type) {
    case "kpi": return renderKPI();
    case "pie": return renderPieChart();
    case "table": return renderTable();
    case "heatmap": return renderHeatmap();
    case "line":
    case "bar":
    default:
      return renderBarChart();
  }
}
