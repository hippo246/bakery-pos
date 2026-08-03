import React from 'react';
import { useState, useEffect } from "react";
import { 
  getActiveShift, 
  getShiftHistory, 
  SHIFT_TYPES, 
  SHIFT_STATUS,
  closeShift,
  canCloseShift,
  generateShiftReport
} from "../../utils/shiftManagement.js";
import OpeningShiftWizard from "./OpeningShiftWizard.jsx";
import ClosingShiftWizard from "./ClosingShiftWizard.jsx";
import ShiftTimeline from "./ShiftTimeline.jsx";
import CashDrawerReconciliation from "./CashDrawerReconciliation.jsx";

// ── Shift Operations Component ───────────────────────────────────────────
export default function ShiftOperations({ tables, orders, staff, isMobile = false }) {
  const [activeShift, setActiveShift] = useState(null);
  const [shiftHistory, setShiftHistory] = useState([]);
  const [showOpeningWizard, setShowOpeningWizard] = useState(false);
  const [showClosingWizard, setShowClosingWizard] = useState(false);
  const [showReport, setShowReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setActiveShift(getActiveShift());
    setShiftHistory(getShiftHistory(10));
  };

  const handleOpenShift = () => {
    setShowOpeningWizard(true);
  };

  const handleCloseShift = () => {
    if (activeShift) {
      const validation = canCloseShift(activeShift.id);
      if (validation.canClose) {
        setShowClosingWizard(true);
      } else {
        alert(`Cannot close shift:\n${validation.issues.join('\n')}`);
      }
    }
  };

  const handleViewReport = (shiftId) => {
    const report = generateShiftReport(shiftId);
    setShowReport(report);
  };

  const exportReportAsCSV = (report) => {
    const rows = [
      ['Shift Report', ''],
      ['Shift ID', report.shiftId],
      ['Shift Type', report.shiftType],
      ['Started At', new Date(report.startedAt).toLocaleString()],
      ['Closed At', report.closedAt ? new Date(report.closedAt).toLocaleString() : 'N/A'],
      ['Duration', report.duration],
      ['Started By', report.startedBy],
      ['Closed By', report.closedBy || 'N/A'],
      [''],
      ['Metrics', ''],
      ['Orders', report.metrics.orders],
      ['Revenue', report.metrics.revenue],
      ['Average Order', report.metrics.averageOrder],
      ['Customers', report.metrics.customers],
      [''],
      ['Cash Drawer', ''],
      ['Expected', report.cashDrawer.expected],
      ['Actual', report.cashDrawer.actual],
      ['Difference', report.cashDrawer.difference],
      [''],
      ['Payment Methods', ''],
      ...Object.entries(report.paymentMethods || {}).map(([method, amount]) => [method, amount]),
      [''],
      ['Top Selling Items', ''],
      ...(report.topItems || []).map(item => [item.name, item.quantity, item.revenue]),
      [''],
      ['Staff', ''],
      ...(report.staff || []).map(s => [s.name, s.role, s.hours])
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shift-report-${report.shiftId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpeningComplete = (shift) => {
    setShowOpeningWizard(false);
    loadData();
  };

  const handleClosingComplete = () => {
    setShowClosingWizard(false);
    loadData();
  };

  const getShiftType = (typeId) => {
    return SHIFT_TYPES.find(t => t.id === typeId) || SHIFT_TYPES[0];
  };

  const formatDuration = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: isMobile ? "flex-start" : "center",
        gap: 16,
        flexDirection: isMobile ? "column" : "row"
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? 24 : 28,
            fontWeight: 700,
            color: "var(--cafe-text-primary)",
            marginBottom: 4
          }}>
            Shift Operations
          </h1>
          <p style={{
            fontSize: 13,
            color: "var(--cafe-text-tertiary)"
          }}>
            Manage opening, active operations, and end-of-day closing
          </p>
        </div>
        {!activeShift && (
          <button
            onClick={handleOpenShift}
            style={{
              padding: "12px 24px",
              background: "var(--cafe-accent)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <span>🚀</span>
            Open New Shift
          </button>
        )}
      </div>

      {/* Active Shift Card */}
      {activeShift ? (
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "2px solid var(--cafe-accent)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20
          }}>
            <div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8
              }}>
                <span style={{ fontSize: 32 }}>{getShiftType(activeShift.type).icon}</span>
                <div>
                  <h2 style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "var(--cafe-text-primary)",
                    marginBottom: 4
                  }}>
                    {getShiftType(activeShift.type).name} Shift
                  </h2>
                  <div style={{
                    fontSize: 12,
                    color: "var(--cafe-text-tertiary)"
                  }}>
                    {getShiftType(activeShift.type).hours}
                  </div>
                </div>
              </div>
              <div style={{
                display: "flex",
                gap: 16,
                fontSize: 13,
                color: "var(--cafe-text-secondary)"
              }}>
                <span>Started: {new Date(activeShift.startedAt).toLocaleTimeString()}</span>
                <span>Duration: {formatDuration(Date.now() - new Date(activeShift.startedAt))}</span>
                <span>By: {activeShift.startedBy}</span>
              </div>
            </div>
            <div style={{
              padding: "8px 16px",
              background: "var(--cafe-success-bg)",
              border: "1px solid var(--cafe-success-border)",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--cafe-success)",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              Active
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 20
          }}>
            <div style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              borderRadius: 12,
              border: "1px solid var(--cafe-border)"
            }}>
              <div style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)",
                marginBottom: 8
              }}>
                Orders
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--cafe-text-primary)"
              }}>
                {activeShift.metrics.orders}
              </div>
            </div>
            <div style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              borderRadius: 12,
              border: "1px solid var(--cafe-border)"
            }}>
              <div style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)",
                marginBottom: 8
              }}>
                Revenue
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--cafe-success)"
              }}>
                {formatCurrency(activeShift.metrics.revenue)}
              </div>
            </div>
            <div style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              borderRadius: 12,
              border: "1px solid var(--cafe-border)"
            }}>
              <div style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)",
                marginBottom: 8
              }}>
                Average Order
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--cafe-text-primary)"
              }}>
                {formatCurrency(activeShift.metrics.averageOrder)}
              </div>
            </div>
            <div style={{
              padding: 16,
              background: "var(--cafe-bg-surface)",
              borderRadius: 12,
              border: "1px solid var(--cafe-border)"
            }}>
              <div style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)",
                marginBottom: 8
              }}>
                Customers
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--cafe-text-primary)"
              }}>
                {activeShift.metrics.customers}
              </div>
            </div>
          </div>

          {/* Cash Drawer */}
          <div style={{
            padding: 16,
            background: activeShift.cashDrawer.difference !== 0 
              ? "var(--cafe-warning-bg)" 
              : "var(--cafe-bg-surface)",
            border: activeShift.cashDrawer.difference !== 0 
              ? "1px solid var(--cafe-warning-border)" 
              : "1px solid var(--cafe-border)",
            borderRadius: 12,
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{
                fontSize: 12,
                color: "var(--cafe-text-tertiary)",
                marginBottom: 4
              }}>
                Cash Drawer
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-primary)"
              }}>
                Expected: {formatCurrency(activeShift.cashDrawer.expected)} | 
                Actual: {formatCurrency(activeShift.cashDrawer.actual)}
              </div>
            </div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              color: activeShift.cashDrawer.difference > 0 
                ? "var(--cafe-success)" 
                : activeShift.cashDrawer.difference < 0 
                  ? "var(--cafe-danger)" 
                  : "var(--cafe-text-primary)"
            }}>
              {activeShift.cashDrawer.difference !== 0 
                ? (activeShift.cashDrawer.difference > 0 ? "+" : "") + formatCurrency(activeShift.cashDrawer.difference)
                : "Balanced"}
            </div>
          </div>

          {/* Actions */}
          <div style={{
            display: "flex",
            gap: 12
          }}>
            <button
              onClick={handleCloseShift}
              style={{
                flex: 1,
                padding: "14px 24px",
                background: "var(--cafe-bg-surface)",
                border: "1px solid var(--cafe-border)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "var(--cafe-text-secondary)",
                cursor: "pointer"
              }}
            >
              Close Shift
            </button>
            <button
              onClick={() => handleViewReport(activeShift.id)}
              style={{
                padding: "14px 24px",
                background: "var(--cafe-accent)",
                border: "1px solid var(--cafe-accent)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                cursor: "pointer"
              }}
            >
              View Report
            </button>
          </div>

          {/* Shift Timeline */}
          <ShiftTimeline shiftId={activeShift.id} isMobile={isMobile} />

          {/* Cash Drawer Reconciliation */}
          <CashDrawerReconciliation 
            shift={activeShift} 
            onUpdate={(actualCash, reason) => {
              // In production, this would call updateCashDrawer
              console.log('Update cash drawer:', actualCash, reason);
            }}
            isMobile={isMobile}
          />
        </div>
      ) : (
        <div style={{
          background: "var(--cafe-bg-card)",
          border: "1px dashed var(--cafe-border)",
          borderRadius: 16,
          padding: 48,
          textAlign: "center"
        }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>📋</div>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 8
          }}>
            No Active Shift
          </h3>
          <p style={{
            fontSize: 14,
            color: "var(--cafe-text-tertiary)",
            marginBottom: 24
          }}>
            Open a new shift to begin tracking operations
          </p>
          <button
            onClick={handleOpenShift}
            style={{
              padding: "12px 24px",
              background: "var(--cafe-accent)",
              border: "1px solid var(--cafe-accent)",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Open Shift
          </button>
        </div>
      )}

      {/* Shift History */}
      {shiftHistory.length > 0 && (
        <div>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--cafe-text-primary)",
            marginBottom: 16
          }}>
            Recent Shifts
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16
          }}>
            {shiftHistory.map(shift => {
              const shiftType = getShiftType(shift.type);
              return (
                <div
                  key={shift.id}
                  onClick={() => handleViewReport(shift.id)}
                  style={{
                    background: "var(--cafe-bg-card)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 12,
                    padding: 16,
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12
                  }}>
                    <span style={{ fontSize: 24 }}>{shiftType.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--cafe-text-primary)"
                      }}>
                        {shiftType.name}
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: "var(--cafe-text-tertiary)"
                      }}>
                        {new Date(shift.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{
                      padding: "4px 10px",
                      background: shift.status === SHIFT_STATUS.CLOSED 
                        ? "var(--cafe-success-bg)" 
                        : "var(--cafe-warning-bg)",
                      border: shift.status === SHIFT_STATUS.CLOSED 
                        ? "1px solid var(--cafe-success-border)" 
                        : "1px solid var(--cafe-warning-border)",
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 600,
                      color: shift.status === SHIFT_STATUS.CLOSED 
                        ? "var(--cafe-success)" 
                        : "var(--cafe-warning)",
                      textTransform: "uppercase"
                    }}>
                      {shift.status}
                    </div>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "var(--cafe-text-secondary)"
                  }}>
                    <span>{shift.metrics.orders} orders</span>
                    <span>{formatCurrency(shift.metrics.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizards */}
      {showOpeningWizard && (
        <OpeningShiftWizard
          onComplete={handleOpeningComplete}
          onCancel={() => setShowOpeningWizard(false)}
          isMobile={isMobile}
        />
      )}

      {showClosingWizard && activeShift && (
        <ClosingShiftWizard
          shift={activeShift}
          onComplete={handleClosingComplete}
          onCancel={() => setShowClosingWizard(false)}
          isMobile={isMobile}
        />
      )}

      {/* Report Modal */}
      {showReport && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
          onClick={() => setShowReport(null)}
        >
          <div
            style={{
              width: "90%",
              maxWidth: 600,
              maxHeight: "80vh",
              background: "var(--cafe-bg-card)",
              border: "1px solid var(--cafe-border)",
              borderRadius: 16,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: 20,
              borderBottom: "1px solid var(--cafe-border-light)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--cafe-text-primary)"
              }}>
                Shift Report
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => exportReportAsCSV(showReport)}
                  style={{
                    padding: "8px 16px",
                    background: "var(--cafe-accent)",
                    border: "1px solid var(--cafe-accent)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  Export CSV
                </button>
                <button
                  onClick={() => setShowReport(null)}
                  style={{
                    padding: "8px 12px",
                    background: "var(--cafe-bg-surface)",
                    border: "1px solid var(--cafe-border)",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "var(--cafe-text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: "auto",
              padding: 20
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Shift Info */}
                <div style={{ padding: 16, background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Shift Information</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Type:</span> {showReport.shiftType}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>ID:</span> {showReport.shiftId}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Started:</span> {new Date(showReport.startedAt).toLocaleString()}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Duration:</span> {showReport.duration}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Started By:</span> {showReport.startedBy}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Closed By:</span> {showReport.closedBy || 'N/A'}</div>
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ padding: 16, background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Metrics</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Orders:</span> {showReport.metrics.orders}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Revenue:</span> {formatCurrency(showReport.metrics.revenue)}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Avg Order:</span> {formatCurrency(showReport.metrics.averageOrder)}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Customers:</span> {showReport.metrics.customers}</div>
                  </div>
                </div>

                {/* Cash Drawer */}
                <div style={{ padding: 16, background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Cash Drawer</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Expected:</span> {formatCurrency(showReport.cashDrawer.expected)}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Actual:</span> {formatCurrency(showReport.cashDrawer.actual)}</div>
                    <div><span style={{ color: "var(--cafe-text-tertiary)" }}>Difference:</span> {formatCurrency(showReport.cashDrawer.difference)}</div>
                  </div>
                </div>

                {/* Payment Methods */}
                {showReport.paymentMethods && Object.keys(showReport.paymentMethods).length > 0 && (
                  <div style={{ padding: 16, background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Payment Methods</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      {Object.entries(showReport.paymentMethods).map(([method, amount]) => (
                        <div key={method} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--cafe-text-tertiary)" }}>{method}:</span>
                          <span>{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Items */}
                {showReport.topItems && showReport.topItems.length > 0 && (
                  <div style={{ padding: 16, background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Top Selling Items</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      {showReport.topItems.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--cafe-text-tertiary)" }}>{item.name}:</span>
                          <span>{item.quantity} sold ({formatCurrency(item.revenue)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff */}
                {showReport.staff && showReport.staff.length > 0 && (
                  <div style={{ padding: 16, background: "var(--cafe-bg-surface)", borderRadius: 8 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Staff</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
                      {showReport.staff.map((s, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--cafe-text-tertiary)" }}>{s.name} ({s.role}):</span>
                          <span>{s.hours} hours</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
