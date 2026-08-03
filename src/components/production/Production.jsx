// eslint-disable-next-line no-unused-vars
import React from 'react';
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { card, btn, input, label, pill } from "../../styles/theme";  
// eslint-disable-next-line no-unused-vars
import { INIT_PRODUCTION_BATCHES, PRODUCTION_SECTIONS, calculateProductionStats, formatQuantity, formatPercentage, formatProductionDate, formatProductionDateTime, getRelativeTime } from "../../data/productionConstants.js";
// eslint-disable-next-line no-unused-vars
import { BATCH_STATUS, QC_GRADES, TRACEABILITY_STATES, EXPIRY_GROUPS, validateBatchId, checkBatchIdUnique, generateBatchId, getNextBatchSequence, normalizeProductionBatch, reconcileBatchQuantities, getExpiryGroup, getDaysUntilExpiry, calculateWastagePercentage, calculateTotalReplacements, searchBatches, filterByStatus, sortBatches } from "../../domain/productionModel.js";
import DestructiveDialog from "../common/DestructiveDialog";
 
// eslint-disable-next-line no-unused-vars
import WarningDialog from "../common/WarningDialog";
import { triggerProductionNotification } from "../../utils/notificationTriggers.js";
import { saveNotifications } from "../../utils/notificationService.js";

const genId = () => "PROD-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
const safeNum = (v, fb = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

export default function Production({ productionBatches: externalBatches, setProductionBatches: externalSetBatches, menuItems = [], notifications, setNotifications }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { const fn = () => setIsMobile(window.innerWidth <= 700); window.addEventListener("resize", fn); return () => window.removeEventListener("resize", fn); }, []);

  const [batches, setBatches] = useState(() => {
    const initial = Array.isArray(externalBatches) ? externalBatches : INIT_PRODUCTION_BATCHES;
    return initial;
  });

  const [activeSection, setActiveSection] = useState("overview");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showLogBatch, setShowLogBatch] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const stats = useMemo(() => calculateProductionStats(batches), [batches]);

  const filteredBatches = useMemo(() => {
    let result = [...batches];
    result = searchBatches(result, search);
    result = sortBatches(result, sortBy);
    return result;
  }, [batches, search, sortBy]);

  const [batchForm, setBatchForm] = useState({
    batchId: "",
    productName: "",
    plannedQuantity: "",
    unit: "pcs",
    operator: ""
  });

  // Notification helper
  const addNotification = useCallback((notification) => {
    if (!notification || !setNotifications) return;
    setNotifications(prev => {
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  }, [setNotifications]);

  // Track which notifications have already fired this session to avoid duplicates
  const notifiedRef = useRef(new Set());

  // Check for production batch issues periodically
  useEffect(() => {
    const maybeNotify = (batch, type, extra) => {
      const key = `${batch.id}:${type}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);
      const notif = triggerProductionNotification(batch, type, extra);
      addNotification(notif);
    };

    const check = () => {
      batches.forEach(batch => {
        if (!batch) return;
        if (batch.status === 'COMPLETED' && !batch.qualityControl)
          maybeNotify(batch, 'BATCH_AWAITING_QC');
        if (batch.qualityControl?.grade === 'F')
          maybeNotify(batch, 'QC_FAILED', { reason: batch.qualityControl.notes || 'Quality control failed' });
        const wastagePct = calculateWastagePercentage(batch);
        if (wastagePct > 10)
          maybeNotify(batch, 'WASTAGE_HIGH', { wastagePercentage: wastagePct.toFixed(1) });
        const daysUntilExpiry = getDaysUntilExpiry(batch);
        if (daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0)
          maybeNotify(batch, 'BATCH_EXPIRING_SOON', { expiryDate: batch.expiryDate });
        if (!batch.operator && batch.status !== 'DRAFT')
          maybeNotify(batch, 'BATCH_MISSING_OPERATOR');
      });
    };

    check(); // run immediately on mount
    const interval = setInterval(check, 300000);
    return () => clearInterval(interval);
  }, [batches, addNotification]);

  const handleOpenDetail = useCallback((batch) => {
    setSelectedBatch(batch);
    setShowDetailPanel(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedBatch(null);
    setShowDetailPanel(false);
  }, []);

  const handleOpenLogBatch = useCallback(() => {
    const nextSeq = getNextBatchSequence(batches);
    setBatchForm({
      batchId: generateBatchId(nextSeq),
      productName: "",
      plannedQuantity: "",
      unit: "pcs",
      operator: ""
    });
    setShowLogBatch(true);
  }, [batches]);

  const handleSaveBatch = useCallback(() => {
    const validation = validateBatchId(batchForm.batchId);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    const uniqueness = checkBatchIdUnique(batchForm.batchId, batches);
    if (!uniqueness.unique) {
      alert(uniqueness.error);
      return;
    }
    const newBatch = normalizeProductionBatch({
      id: batchForm.batchId,
      productName: batchForm.productName,
      plannedQuantity: safeNum(batchForm.plannedQuantity),
      unit: batchForm.unit,
      operator: batchForm.operator,
      status: "DRAFT",
      productionDate: Date.now(),
      actualProduced: 0,
      acceptedOutput: 0,
      rejectedOutput: 0,
      wastageQuantity: 0,
      finalUsableQuantity: 0,
      ingredients: [],
      qualityControl: null,
      traceability: [],
      replacements: [],
      activity: []
    }, batches);
    if (newBatch) {
      const updated = [...batches, newBatch];
      setBatches(updated);
      if (externalSetBatches) externalSetBatches(updated);
      setShowLogBatch(false);
    }
  }, [batchForm, batches, externalSetBatches]);

  const handleDeleteBatch = useCallback(() => {
    if (selectedBatch) {
      const updated = batches.filter(b => b.id !== selectedBatch.id);
      setBatches(updated);
      if (externalSetBatches) externalSetBatches(updated);
      setShowDeleteDialog(false);
      handleCloseDetail();
    }
  }, [selectedBatch, batches, externalSetBatches, handleCloseDetail]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5", paddingBottom: 40 }}>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: "#3d2c1f", marginBottom: 4 }}>
          Production Control
        </div>
        <div style={{ fontSize: 14, color: "#8b7355", marginBottom: 20 }}>
          Track production batches, output, quality, wastage, and traceability
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <button style={{ ...btn("primary"), padding: "10px 16px", fontSize: 14 }} onClick={handleOpenLogBatch}>
            Log Batch
          </button>
          <input style={{ ...input, padding: "10px 12px", borderRadius: 6, minWidth: 200 }} placeholder="Search batches..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {PRODUCTION_SECTIONS.map(section => (
            <button
              key={section.id}
              style={{
                ...btn(activeSection === section.id ? "primary" : "ghost"),
                padding: "8px 16px",
                fontSize: 13,
                borderRadius: 20,
                whiteSpace: "nowrap",
                backgroundColor: activeSection === section.id ? "#8b6914" : "transparent",
                color: activeSection === section.id ? "white" : "#3d2c1f",
                border: activeSection === section.id ? "none" : "1px solid #d4c4b0"
              }}
              onClick={() => setActiveSection(section.id)}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>

        {activeSection === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Active Batches</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#3d2c1f" }}>{stats.activeBatches}</div>
            </div>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Completed Today</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#27ae60" }}>{stats.completedToday}</div>
            </div>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Output Variance</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: stats.outputVariance < 0 ? "#e74c3c" : "#27ae60" }}>
                {formatPercentage(stats.outputVariance)}
              </div>
            </div>
            <div style={{ ...card, padding: 16 }}>
              <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Wastage Today</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#e67e22" }}>{formatQuantity(stats.wastageToday)}</div>
            </div>
          </div>
        )}

        {activeSection === "batches" && (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filteredBatches.map(batch => {
              const statusConfig = BATCH_STATUS[batch.status] || BATCH_STATUS.DRAFT;
              const reconciliation = reconcileBatchQuantities(batch);
              const expiryGroup = getExpiryGroup(batch.expiryDate);
              const expiryConfig = EXPIRY_GROUPS[expiryGroup];
              const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
              
              return (
                <div 
                  key={batch.id} 
                  style={{ 
                    ...card, 
                    backgroundColor: "white", 
                    padding: 16, 
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "box-shadow 0.2s"
                  }}
                  onClick={() => handleOpenDetail(batch)}
                >
                  <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4, fontFamily: "monospace" }}>{batch.id}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{batch.productName}</div>
                  <div style={{ ...pill, backgroundColor: statusConfig.color + "20", color: statusConfig.color, fontSize: 11, padding: "4px 8px", display: "inline-block", marginBottom: 8 }}>
                    {statusConfig.icon} {statusConfig.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#8b7355", marginBottom: 4 }}>
                    {formatQuantity(batch.plannedQuantity, batch.unit)} planned • {formatQuantity(batch.actualProduced, batch.unit)} actual
                  </div>
                  <div style={{ fontSize: 11, color: TRACEABILITY_STATES[reconciliation.traceabilityState]?.color || "#8b7355" }}>
                    {TRACEABILITY_STATES[reconciliation.traceabilityState]?.label || reconciliation.traceabilityState}
                  </div>
                  {batch.expiryDate && (
                    <div style={{ fontSize: 11, color: expiryConfig.color, marginTop: 4 }}>
                      {daysUntilExpiry !== null && (daysUntilExpiry <= 0 ? "Expired" : daysUntilExpiry === 0 ? "Expires today" : `${daysUntilExpiry}d left`)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeSection === "quality" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 16 }}>Quality & Output Overview</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>QC Pending</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#9b59b6" }}>{batches.filter(b => b.status === "AWAITING_QC").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Passed QC</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#27ae60" }}>{batches.filter(b => b.qualityControl?.status === "PASSED").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Rejected QC</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#e74c3c" }}>{batches.filter(b => b.qualityControl?.status === "FAILED").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Below Plan</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#e67e22" }}>{batches.filter(b => b.actualProduced < b.plannedQuantity && b.plannedQuantity > 0).length}</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>QC Pending Batches</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {batches.filter(b => b.status === "AWAITING_QC").map(batch => (
                <div key={batch.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8, cursor: "pointer" }} onClick={() => handleOpenDetail(batch)}>
                  <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4 }}>{batch.id}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{batch.productName}</div>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>{formatQuantity(batch.actualProduced, batch.unit)} produced</div>
                </div>
              ))}
              {batches.filter(b => b.status === "AWAITING_QC").length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 32, gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>No batches awaiting quality check</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "wastage" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 16 }}>Wastage Overview</div>
              <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Total Wastage Today</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#e67e22" }}>{formatQuantity(stats.wastageToday)}</div>
                <div style={{ fontSize: 13, color: "#8b7355", marginTop: 4 }}>{formatPercentage(stats.wastagePercentage)} of production</div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Batches with Wastage</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {batches.filter(b => b.wastageQuantity > 0).map(batch => {
                const wastagePercent = calculateWastagePercentage(batch.wastageQuantity, batch.actualProduced);
                return (
                  <div key={batch.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8, cursor: "pointer" }} onClick={() => handleOpenDetail(batch)}>
                    <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4 }}>{batch.id}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{batch.productName}</div>
                    <div style={{ fontSize: 13, color: "#e67e22", fontWeight: 600 }}>{formatQuantity(batch.wastageQuantity, batch.unit)}</div>
                    <div style={{ fontSize: 11, color: "#8b7355" }}>{formatPercentage(wastagePercent)} wastage</div>
                  </div>
                );
              })}
              {batches.filter(b => b.wastageQuantity > 0).length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 32, gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>No wastage recorded</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "expiry" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 16 }}>Expiry Watch</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div style={{ ...card, padding: 16, backgroundColor: "#e74c3c10" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Expired</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#c0392b" }}>{batches.filter(b => getExpiryGroup(b.expiryDate) === "EXPIRED").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#e74c3c10" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Expires Today</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#e74c3c" }}>{batches.filter(b => getExpiryGroup(b.expiryDate) === "EXPIRES_TODAY").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#f39c1210" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Expires Soon</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#f39c12" }}>{batches.filter(b => getExpiryGroup(b.expiryDate) === "EXPIRES_SOON").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#27ae6010" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Healthy</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#27ae60" }}>{batches.filter(b => getExpiryGroup(b.expiryDate) === "HEALTHY").length}</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Expiring Soon</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {batches.filter(b => ["EXPIRED", "EXPIRES_TODAY", "EXPIRES_SOON"].includes(getExpiryGroup(b.expiryDate))).map(batch => {
                const expiryGroup = getExpiryGroup(batch.expiryDate);
                const expiryConfig = EXPIRY_GROUPS[expiryGroup];
                const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
                return (
                  <div key={batch.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8, cursor: "pointer", border: `1px solid ${expiryConfig.color}30` }} onClick={() => handleOpenDetail(batch)}>
                    <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4 }}>{batch.id}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{batch.productName}</div>
                    <div style={{ fontSize: 13, color: expiryConfig.color, fontWeight: 600 }}>
                      {daysUntilExpiry !== null && (daysUntilExpiry <= 0 ? "Expired" : daysUntilExpiry === 0 ? "Expires today" : `${daysUntilExpiry} days left`)}
                    </div>
                    <div style={{ fontSize: 11, color: "#8b7355", marginTop: 4 }}>{batch.expiryDate ? formatProductionDate(batch.expiryDate) : "—"}</div>
                  </div>
                );
              })}
              {batches.filter(b => ["EXPIRED", "EXPIRES_TODAY", "EXPIRES_SOON"].includes(getExpiryGroup(b.expiryDate))).length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 32, gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>No batches nearing expiry</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "traceability" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 16 }}>Traceability Overview</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Complete</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#27ae60" }}>{batches.filter(b => reconcileBatchQuantities(b).traceabilityState === "COMPLETE").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Partial</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#f39c12" }}>{batches.filter(b => reconcileBatchQuantities(b).traceabilityState === "PARTIAL").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Missing</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#95a5a6" }}>{batches.filter(b => reconcileBatchQuantities(b).traceabilityState === "MISSING").length}</div>
                </div>
                <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5" }}>
                  <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Overallocated</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "#e74c3c" }}>{batches.filter(b => reconcileBatchQuantities(b).traceabilityState === "OVERALLOCATED").length}</div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Batches with Traceability</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {batches.filter(b => b.traceability.length > 0).map(batch => {
                const reconciliation = reconcileBatchQuantities(batch);
                const traceabilityConfig = TRACEABILITY_STATES[reconciliation.traceabilityState];
                return (
                  <div key={batch.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8, cursor: "pointer" }} onClick={() => handleOpenDetail(batch)}>
                    <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4 }}>{batch.id}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{batch.productName}</div>
                    <div style={{ fontSize: 13, color: traceabilityConfig?.color || "#8b7355", fontWeight: 600 }}>{traceabilityConfig?.label || reconciliation.traceabilityState}</div>
                    <div style={{ fontSize: 11, color: "#8b7355", marginTop: 4 }}>{batch.traceability.length} customer/delivery links</div>
                  </div>
                );
              })}
              {batches.filter(b => b.traceability.length > 0).length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 32, gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>No traceability records found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === "replacements" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#3d2c1f", marginBottom: 16 }}>Replacement Records</div>
              <div style={{ ...card, padding: 16, backgroundColor: "#faf8f5", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 4 }}>Total Replacements</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: "#3498db" }}>{formatQuantity(stats.replacements)}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Batches with Replacements</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {batches.filter(b => b.replacements.length > 0).map(batch => {
                const totalReplacements = calculateTotalReplacements(batch.replacements);
                return (
                  <div key={batch.id} style={{ ...card, backgroundColor: "white", padding: 16, borderRadius: 8, cursor: "pointer" }} onClick={() => handleOpenDetail(batch)}>
                    <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4 }}>{batch.id}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f", marginBottom: 8 }}>{batch.productName}</div>
                    <div style={{ fontSize: 13, color: "#3498db", fontWeight: 600 }}>{formatQuantity(totalReplacements, batch.unit)}</div>
                    <div style={{ fontSize: 11, color: "#8b7355", marginTop: 4 }}>{batch.replacements.length} replacement records</div>
                  </div>
                );
              })}
              {batches.filter(b => b.replacements.length > 0).length === 0 && (
                <div style={{ ...card, textAlign: "center", padding: 32, gridColumn: "1 / -1" }}>
                  <div style={{ fontSize: 13, color: "#8b7355" }}>No replacement records found</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Log Batch Modal */}
      {showLogBatch && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: 400, backgroundColor: "white", borderRadius: 12, padding: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Log Production Batch</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...label, marginBottom: 6 }}>Batch ID</label>
              <input style={{ ...input, width: "100%", padding: "10px" }} value={batchForm.batchId} onChange={(e) => setBatchForm({ ...batchForm, batchId: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...label, marginBottom: 6 }}>Product</label>
              <input style={{ ...input, width: "100%", padding: "10px" }} value={batchForm.productName} onChange={(e) => setBatchForm({ ...batchForm, productName: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...label, marginBottom: 6 }}>Planned Quantity</label>
              <input style={{ ...input, width: "100%", padding: "10px" }} type="number" value={batchForm.plannedQuantity} onChange={(e) => setBatchForm({ ...batchForm, plannedQuantity: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...label, marginBottom: 6 }}>Unit</label>
              <input style={{ ...input, width: "100%", padding: "10px" }} value={batchForm.unit} onChange={(e) => setBatchForm({ ...batchForm, unit: e.target.value })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ ...label, marginBottom: 6 }}>Operator</label>
              <input style={{ ...input, width: "100%", padding: "10px" }} value={batchForm.operator} onChange={(e) => setBatchForm({ ...batchForm, operator: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...btn("ghost"), flex: 1, padding: "10px" }} onClick={() => setShowLogBatch(false)}>Cancel</button>
              <button style={{ ...btn("primary"), flex: 1, padding: "10px" }} onClick={handleSaveBatch}>Log Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Detail Panel */}
      {showDetailPanel && selectedBatch && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ ...card, width: isMobile ? "100%" : 600, maxHeight: isMobile ? "90vh" : "85vh", backgroundColor: "white", borderRadius: isMobile ? "20px 20px 0 0" : 12, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: 20, borderBottom: "1px solid #e8e4df", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#8b6914", fontWeight: 600, marginBottom: 4, fontFamily: "monospace" }}>{selectedBatch.id}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#3d2c1f" }}>{selectedBatch.productName}</div>
              </div>
              <button style={{ ...btn("ghost"), fontSize: 20, padding: "4px 8px" }} onClick={handleCloseDetail}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Batch Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Status</div><div style={{ fontSize: 13, color: BATCH_STATUS[selectedBatch.status]?.color || "#8b7355" }}>{BATCH_STATUS[selectedBatch.status]?.label || selectedBatch.status}</div></div>
                  <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Operator</div><div style={{ fontSize: 13, color: "#3d2c1f" }}>{selectedBatch.operator || "—"}</div></div>
                  <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Production Date</div><div style={{ fontSize: 13, color: "#3d2c1f" }}>{formatProductionDate(selectedBatch.productionDate)}</div></div>
                  <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Branch</div><div style={{ fontSize: 13, color: "#3d2c1f" }}>{selectedBatch.branch || "—"}</div></div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Production Quantities</div>
                <div style={{ ...card, backgroundColor: "#faf8f5", padding: 16, borderRadius: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Planned</div><div style={{ fontSize: 15, fontWeight: 600, color: "#3d2c1f" }}>{formatQuantity(selectedBatch.plannedQuantity, selectedBatch.unit)}</div></div>
                    <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Actual Produced</div><div style={{ fontSize: 15, fontWeight: 600, color: "#27ae60" }}>{formatQuantity(selectedBatch.actualProduced, selectedBatch.unit)}</div></div>
                    <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Accepted</div><div style={{ fontSize: 15, fontWeight: 600, color: "#27ae60" }}>{formatQuantity(selectedBatch.acceptedOutput, selectedBatch.unit)}</div></div>
                    <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Rejected</div><div style={{ fontSize: 15, fontWeight: 600, color: "#e74c3c" }}>{formatQuantity(selectedBatch.rejectedOutput, selectedBatch.unit)}</div></div>
                    <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Wastage</div><div style={{ fontSize: 15, fontWeight: 600, color: "#e67e22" }}>{formatQuantity(selectedBatch.wastageQuantity, selectedBatch.unit)}</div></div>
                    <div><div style={{ fontSize: 11, color: "#a89070", marginBottom: 2 }}>Final Usable</div><div style={{ fontSize: 15, fontWeight: 600, color: "#8b6914" }}>{formatQuantity(selectedBatch.finalUsableQuantity, selectedBatch.unit)}</div></div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#3d2c1f", marginBottom: 12 }}>Quality Control</div>
                {selectedBatch.qualityControl ? (
                  <div style={{ ...card, backgroundColor: "#faf8f5", padding: 16, borderRadius: 8 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: QC_GRADES[selectedBatch.qualityControl.grade]?.color || "#8b7355", marginBottom: 8 }}>Grade {selectedBatch.qualityControl.grade}</div>
                    <div style={{ fontSize: 13, color: "#8b7355" }}>Checked by {selectedBatch.qualityControl.checkedBy || "—"}</div>
                  </div>
                ) : (
                  <div style={{ ...card, backgroundColor: "#faf8f5", padding: 16, borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: "#8b7355" }}>No quality control recorded</div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: 20, borderTop: "1px solid #e8e4df", display: "flex", gap: 8 }}>
              <button style={{ ...btn("ghost"), flex: 1, padding: "10px" }} onClick={handleCloseDetail}>Close</button>
              <button style={{ ...btn("ghost"), color: "#e74c3c", padding: "10px" }} onClick={() => setShowDeleteDialog(true)}>Delete Batch</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && (
        <DestructiveDialog
          title="Delete Batch"
          message={`Are you sure you want to delete batch ${selectedBatch?.id}? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDeleteBatch}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}
