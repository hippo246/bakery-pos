import React, { useState, useMemo } from "react";
import { REPORT_CATEGORIES, REPORTS } from "../../dashboard/biEngine/ReportRegistry";
import { calculateReportData } from "../../dashboard/biEngine/ReportCalculations";
import ReportViewer from "./ReportViewer";
import { AnalyticsPermissions } from "../../utils/permissionService.js";
import { getCurrentUserId } from "../../utils/authService.js";

const S = {
  container: { display: "flex", height: "100%", background: "var(--cafe-bg)", overflow: "hidden", flexDirection: "column" },
  header: { padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  title: { fontSize: 24, fontWeight: 900, color: "var(--cafe-text-primary)", letterSpacing: "-0.03em" },
  main: { display: "flex", flex: 1, overflow: "hidden" },
  sidebar: { width: 280, borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", background: "var(--cafe-bg-card)", flexShrink: 0 },
  searchBar: { padding: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" },
  searchInput: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "white", fontSize: 13, outline: "none" },
  navItem: { padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.15s" },
  navItemActive: { background: "rgba(212,146,42,0.1)", borderLeft: "3px solid var(--cafe-accent)" },
  navItemText: { fontSize: 13, fontWeight: 600, color: "var(--cafe-text-secondary)" },
  navItemTextActive: { color: "var(--cafe-accent)", fontWeight: 800 },
  reportList: { flex: 1, overflowY: "auto", padding: "16px 0" },
  reportLink: { padding: "8px 16px 8px 48px", cursor: "pointer", fontSize: 13, color: "var(--cafe-text-tertiary)", display: "flex", alignItems: "center", transition: "color 0.1s" },
  reportLinkActive: { color: "white", fontWeight: 700 },
  contentArea: { flex: 1, overflowY: "auto", padding: 32, background: "rgba(0,0,0,0.2)" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--cafe-text-tertiary)" }
};

export default function Analytics({ orders, customers, inventory, staff }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("financial");
  const [activeReportId, setActiveReportId] = useState("fin_01");
  const [dateRange, setDateRange] = useState("today"); // today, week, month

  const filteredReports = useMemo(() => {
    if (!search.trim()) return REPORTS;
    const lower = search.toLowerCase();
    return REPORTS.filter(r => r.title.toLowerCase().includes(lower) || r.description.toLowerCase().includes(lower));
  }, [search]);

  const activeReport = REPORTS.find(r => r.id === activeReportId);

  // Generate the data required for the selected report using the biEngine
  const reportData = useMemo(() => {
    if (!activeReport) return null;
    return calculateReportData(activeReport.dataFn, { orders, customers, inventory, staff, dateRange });
  }, [activeReport, orders, customers, inventory, staff, dateRange]);

  const handleExport = () => {
    const perm = AnalyticsPermissions.canExport();
    if (!perm.allowed) {
      alert(`Permission Denied: Requires ${perm.requiredPermission} to export reports.`);
      return;
    }
    alert("Report exported successfully. (Check downloads folder in a real environment)");
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>CafeOS Analytics Engine</div>
        <div style={{ display: "flex", gap: 12 }}>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 12px", outline: "none" }}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={handleExport} style={{ background: "var(--cafe-primary)", color: "white", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, cursor: "pointer" }}>
            Export Report
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={S.main}>
        {/* Sidebar Explorer */}
        <div style={S.sidebar}>
          <div style={S.searchBar}>
            <input 
              type="text" 
              placeholder="Search 80+ reports..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={S.searchInput} 
            />
          </div>
          
          <div style={S.reportList}>
            {search.trim() ? (
              filteredReports.map(r => (
                <div 
                  key={r.id} 
                  style={{ ...S.reportLink, ...(activeReportId === r.id ? S.reportLinkActive : {}), paddingLeft: 24 }}
                  onClick={() => { setActiveReportId(r.id); setActiveCat(r.category); }}
                >
                  {r.title}
                </div>
              ))
            ) : (
              REPORT_CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <div 
                    style={{ ...S.navItem, ...(activeCat === cat.id ? S.navItemActive : {}) }}
                    onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                  >
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ ...S.navItemText, ...(activeCat === cat.id ? S.navItemTextActive : {}) }}>{cat.label}</span>
                  </div>
                  {activeCat === cat.id && (
                    <div style={{ padding: "8px 0", background: "rgba(0,0,0,0.15)" }}>
                      {REPORTS.filter(r => r.category === cat.id).map(r => (
                        <div 
                          key={r.id} 
                          style={{ ...S.reportLink, ...(activeReportId === r.id ? S.reportLinkActive : {}) }}
                          onClick={() => setActiveReportId(r.id)}
                        >
                          {activeReportId === r.id ? <span style={{ color: "var(--cafe-accent)", marginRight: 6 }}>•</span> : null}
                          {r.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content Area */}
        <div style={S.contentArea}>
          {activeReport ? (
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
              <ReportViewer report={activeReport} data={reportData} />
            </div>
          ) : (
            <div style={S.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--cafe-text-primary)", marginBottom: 8 }}>Select a Report</div>
              <div style={{ fontSize: 14 }}>Browse the explorer on the left to view analytics.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
