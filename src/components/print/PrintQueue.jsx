import React from 'react';
// CafeOS Print Queue Management Component
// Central queue for managing print jobs with status, retry, and history

import { useState, useCallback, useEffect } from "react";
import printEngine, { PRINT_STATUS } from "../../print/printEngine.js";

export default function PrintQueue({ isMobile }) {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState({});
  const [activeTab, setActiveTab] = useState("queue");

  useEffect(() => {
    loadQueue();
    loadHistory();
    loadStatus();

    // Listen to print engine events
    const unsubscribe = printEngine.addListener((event, data) => {
      if (event === "job_added" || event === "job_completed" || event === "job_failed" || event === "job_cancelled") {
        loadQueue();
        loadHistory();
        loadStatus();
      }
    });

    return unsubscribe;
  }, []);

  const loadQueue = useCallback(() => {
    try {
      const savedQueue = localStorage.getItem("cafeos_print_queue");
      if (savedQueue) {
        setQueue(JSON.parse(savedQueue));
      }
    } catch (e) {
      console.error("Failed to load queue:", e);
    }
  }, []);

  const loadHistory = useCallback(() => {
    try {
      const savedHistory = localStorage.getItem("cafeos_print_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }, []);

  const loadStatus = useCallback(() => {
    setStatus(printEngine.getQueueStatus());
  }, []);

  const handleRetry = useCallback(async (jobId) => {
    try {
      await printEngine.retryJob(jobId);
      loadQueue();
      loadStatus();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  }, [loadQueue, loadStatus]);

  const handleCancel = useCallback(async (jobId) => {
    try {
      await printEngine.cancelJob(jobId);
      loadQueue();
      loadStatus();
    } catch (error) {
      console.error("Cancel failed:", error);
    }
  }, [loadQueue, loadStatus]);

  const handleClearHistory = useCallback(() => {
    printEngine.clearHistory();
    loadHistory();
  }, [loadHistory]);

  const handleProcessQueue = useCallback(() => {
    printEngine.processQueue();
  }, []);

  const tabs = [
    { id: "queue", label: "Queue", icon: "📋", count: queue.length },
    { id: "history", label: "History", icon: "📜", count: history.length }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case PRINT_STATUS.PENDING:
        return "var(--cafe-warning)";
      case PRINT_STATUS.PRINTING:
        return "var(--cafe-accent)";
      case PRINT_STATUS.COMPLETED:
        return "var(--cafe-success)";
      case PRINT_STATUS.FAILED:
        return "var(--cafe-danger)";
      case PRINT_STATUS.CANCELLED:
        return "var(--cafe-text-tertiary)";
      default:
        return "var(--cafe-text-secondary)";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case PRINT_STATUS.PENDING:
        return "Pending";
      case PRINT_STATUS.PRINTING:
        return "Printing";
      case PRINT_STATUS.COMPLETED:
        return "Completed";
      case PRINT_STATUS.FAILED:
        return "Failed";
      case PRINT_STATUS.CANCELLED:
        return "Cancelled";
      default:
        return status;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--cafe-border-light)",
        background: "var(--cafe-bg-elevated)"
      }}>
        <h2 style={{
          fontSize: isMobile ? 18 : 20,
          fontWeight: 700,
          color: "var(--cafe-text-primary)",
          margin: 0
        }}>
          Print Queue
        </h2>
        <p style={{
          fontSize: isMobile ? 11 : 12,
          color: "var(--cafe-text-tertiary)",
          margin: "4px 0 0"
        }}>
          Manage print jobs and view history
        </p>
      </div>

      {/* Status Bar */}
      <div style={{
        padding: "12px 20px",
        background: "var(--cafe-bg-surface)",
        borderBottom: "1px solid var(--cafe-border-light)",
        display: "flex",
        gap: 24,
        flexWrap: "wrap"
      }}>
        <StatusItem label="Pending" value={status.pending} color="var(--cafe-warning)" />
        <StatusItem label="Printing" value={status.printing} color="var(--cafe-accent)" />
        <StatusItem label="Completed" value={status.completed} color="var(--cafe-success)" />
        <StatusItem label="Failed" value={status.failed} color="var(--cafe-danger)" />
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 4,
        padding: "0 20px",
        borderBottom: "1px solid var(--cafe-border-light)"
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              border: "none",
              background: "transparent",
              color: activeTab === tab.id ? "var(--cafe-accent)" : "var(--cafe-text-secondary)",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--cafe-accent)" : "2px solid transparent",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span style={{
                padding: "2px 6px",
                fontSize: 10,
                background: "var(--cafe-accent)",
                color: "white",
                borderRadius: 10
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {activeTab === "queue" && (
          <QueueTab
            queue={queue}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onProcess={handleProcessQueue}
            isMobile={isMobile}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab
            history={history}
            onClear={handleClearHistory}
            isMobile={isMobile}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
          />
        )}
      </div>
    </div>
  );
}

// Status Item Component
function StatusItem({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)" }}>{label}:</span>
      <span style={{
        fontSize: 16,
        fontWeight: 700,
        color
      }}>
        {value}
      </span>
    </div>
  );
}

// Queue Tab Component
function QueueTab({ queue, onRetry, onCancel, onProcess, isMobile, getStatusColor, getStatusLabel }) {
  if (queue.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--cafe-text-tertiary)"
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>No print jobs in queue</div>
        <div style={{ fontSize: 12 }}>Print jobs will appear here when added</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Process Button */}
      <button
        onClick={onProcess}
        style={{
          padding: "12px 20px",
          fontSize: 13,
          border: "1px solid var(--cafe-accent)",
          borderRadius: 8,
          background: "var(--cafe-accent)",
          color: "white",
          cursor: "pointer",
          alignSelf: "flex-start"
        }}
      >
        Process Queue
      </button>

      {/* Queue Items */}
      {queue.map(job => (
        <QueueItem
          key={job.id}
          job={job}
          onRetry={onRetry}
          onCancel={onCancel}
          isMobile={isMobile}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      ))}
    </div>
  );
}

// Queue Item Component
function QueueItem({ job, onRetry, onCancel, isMobile, getStatusColor, getStatusLabel }) {
  return (
    <div style={{
      background: "var(--cafe-bg-card)",
      border: "1px solid var(--cafe-border)",
      borderRadius: 12,
      padding: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
            {job.documentType.replace("_", " ").toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
            {new Date(job.createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 12,
          background: `${getStatusColor(job.status)}20`,
          color: getStatusColor(job.status)
        }}>
          {getStatusLabel(job.status)}
        </div>
      </div>

      {job.error && (
        <div style={{
          padding: "8px 12px",
          background: "var(--cafe-danger-bg)",
          border: "1px solid var(--cafe-danger-border)",
          borderRadius: 6,
          fontSize: 11,
          color: "var(--cafe-danger)",
          marginBottom: 12
        }}>
          {job.error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {job.status === PRINT_STATUS.FAILED && (
          <button
            onClick={() => onRetry(job.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              border: "1px solid var(--cafe-accent)",
              borderRadius: 6,
              background: "var(--cafe-accent)",
              color: "white",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        )}
        {(job.status === PRINT_STATUS.PENDING || job.status === PRINT_STATUS.FAILED) && (
          <button
            onClick={() => onCancel(job.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              border: "1px solid var(--cafe-danger)",
              borderRadius: 6,
              background: "var(--cafe-danger-bg)",
              color: "var(--cafe-danger)",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        )}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--cafe-text-tertiary)", display: "flex", alignItems: "center" }}>
          {job.retryCount > 0 && <span>Retries: {job.retryCount}/{job.maxRetries}</span>}
        </div>
      </div>
    </div>
  );
}

// History Tab Component
function HistoryTab({ history, onClear, isMobile, getStatusColor, getStatusLabel }) {
  if (history.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--cafe-text-tertiary)"
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📜</div>
        <div style={{ fontSize: 14, marginBottom: 8 }}>No print history</div>
        <div style={{ fontSize: 12 }}>Completed print jobs will appear here</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Clear Button */}
      <button
        onClick={onClear}
        style={{
          padding: "8px 16px",
          fontSize: 12,
          border: "1px solid var(--cafe-danger)",
          borderRadius: 8,
          background: "var(--cafe-danger-bg)",
          color: "var(--cafe-danger)",
          cursor: "pointer",
          alignSelf: "flex-start"
        }}
      >
        Clear History
      </button>

      {/* History Items */}
      {history.map((job, index) => (
        <HistoryItem
          key={`${job.id}-${index}`}
          job={job}
          isMobile={isMobile}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      ))}
    </div>
  );
}

// History Item Component
function HistoryItem({ job, isMobile, getStatusColor, getStatusLabel }) {
  return (
    <div style={{
      background: "var(--cafe-bg-card)",
      border: "1px solid var(--cafe-border)",
      borderRadius: 12,
      padding: 16
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", marginBottom: 4 }}>
            {job.documentType.replace("_", " ").toUpperCase()}
          </div>
          <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
            {new Date(job.createdAt).toLocaleString()}
          </div>
        </div>
        <div style={{
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 600,
          borderRadius: 12,
          background: `${getStatusColor(job.status)}20`,
          color: getStatusColor(job.status)
        }}>
          {getStatusLabel(job.status)}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--cafe-text-tertiary)" }}>
        <span>Printer: {job.printerId}</span>
        <span>Copies: {job.copies}</span>
        {job.duration && <span>Duration: {Math.round(job.duration / 1000)}s</span>}
      </div>
    </div>
  );
}
