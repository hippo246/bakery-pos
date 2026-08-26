import React, { useState, useMemo, useEffect } from "react";
import { REPORT_CATEGORIES, REPORTS } from "../../dashboard/biEngine/ReportRegistry";
import { calculateReportData } from "../../dashboard/biEngine/ReportCalculations";
import ReportViewer from "./ReportViewer";
import { AnalyticsPermissions } from "../../utils/permissionService.js";
import { getCurrentUserId } from "../../utils/authService.js";
import AlertDialog from "../common/AlertDialog.jsx";

const S = {
  container: { display: "flex", background: "var(--cafe-bg)", flexDirection: "column" },
  header: { padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 },
  title: { fontSize: 24, fontWeight: 900, color: "var(--cafe-text-primary)", letterSpacing: "-0.03em" },
  main: { display: "flex", flex: 1 },
  sidebar: { width: 280, borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", background: "var(--cafe-bg-card)", flexShrink: 0 },
  searchBar: { padding: 16, borderBottom: "1px solid rgba(255,255,255,0.05)" },
  searchInput: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "var(--cafe-text-primary)", fontSize: 13, outline: "none" },
  navItem: { padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.02)", transition: "background 0.15s" },
  navItemActive: { background: "rgba(212,146,42,0.1)", borderLeft: "3px solid var(--cafe-accent)" },
  navItemText: { fontSize: 13, fontWeight: 600, color: "var(--cafe-text-secondary)" },
  navItemTextActive: { color: "var(--cafe-accent)", fontWeight: 800 },
  reportList: { flex: 1, overflowY: "auto", padding: "16px 0" },
  reportLink: { padding: "8px 16px 8px 48px", cursor: "pointer", fontSize: 13, color: "var(--cafe-text-tertiary)", display: "flex", alignItems: "center", transition: "color 0.1s" },
  reportLinkActive: { color: "var(--cafe-text-primary)", fontWeight: 700 },
  contentArea: { flex: 1, overflowY: "auto", padding: 32, background: "rgba(0,0,0,0.2)" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--cafe-text-tertiary)" }
};

export default function Analytics({ orders, customers, inventory, staff }) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("financial");
  const [activeReportId, setActiveReportId] = useState("fin_01");
  const [dateRange, setDateRange] = useState("today"); // today, week, month
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      setAlertDialog({
        isOpen: true,
        title: 'Permission Denied',
        message: `Requires ${perm.requiredPermission} to export reports.`,
        type: 'error'
      });
      return;
    }
    setAlertDialog({
      isOpen: true,
      title: 'Export Successful',
      message: 'Report exported successfully. (Check downloads folder in a real environment)',
      type: 'success'
    });
  };

  return (
    <div style={S.container}>
      {/* Header */}
      <div style={{
        ...S.header,
        padding: screenSize === 'small' ? '12px 16px' : '16px 24px',
        flexDirection: screenSize === 'small' ? 'column' : 'row',
        alignItems: screenSize === 'small' ? 'flex-start' : 'center',
        gap: screenSize === 'small' ? '12px' : '0'
      }}>
        <div style={{ ...S.title, fontSize: screenSize === 'small' ? '18px' : '24px' }}>CafeOS Analytics Engine</div>
        <div style={{ display: "flex", gap: screenSize === 'small' ? '8px' : '12', flexWrap: 'wrap' }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ background: "rgba(255,255,255,0.05)", color: "var(--cafe-text-primary)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: screenSize === 'small' ? '6px 10px' : '8px 12px', outline: "none", fontSize: screenSize === 'small' ? '12px' : '13px' }}>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button onClick={handleExport} style={{ background: "var(--cafe-primary)", color: "var(--cafe-text-primary)", border: "none", borderRadius: 6, padding: screenSize === 'small' ? '6px 12px' : '8px 16px', fontWeight: 700, cursor: "pointer", fontSize: screenSize === 'small' ? '12px' : '13px' }}>
            Export Report
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{
        ...S.main,
        flexDirection: screenSize === 'small' ? 'column' : 'row'
      }}>
        {/* Sidebar Explorer */}
        <div style={{
          ...S.sidebar,
          width: screenSize === 'small' ? '100%' : 280,
          display: screenSize === 'small' ? 'none' : 'flex'
        }}>
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

      {/* AlertDialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
  );
}
