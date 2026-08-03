import React from 'react';
import { useState, useMemo } from "react";
import { C, card } from "../../styles/theme";
import { EXECUTION_STATUS, TASK_STATUS } from "../../domain/workflowModel";

function WorkflowReports({ workflows = [], executions = [] }) {
  const [timeRange, setTimeRange] = useState('7d');

  const filteredExecutions = useMemo(() => {
    const now = Date.now();
    const ranges = { '1d': 86400000, '7d': 604800000, '30d': 2592000000 };
    const cutoff = now - (ranges[timeRange] || ranges['7d']);
    return executions.filter(e => e.createdAt >= cutoff);
  }, [executions, timeRange]);

  const metrics = useMemo(() => {
    const total = filteredExecutions.length;
    const completed = filteredExecutions.filter(e => e.status === EXECUTION_STATUS.COMPLETED);
    const completionRate = total > 0 ? (completed.length / total) * 100 : 0;
    const durations = completed.map(e => e.duration).filter(Boolean);
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return { total, completed: completed.length, completionRate, avgDuration };
  }, [filteredExecutions]);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "20px" }}>Workflow Reports</h1>
      <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{ padding: "10px", marginBottom: "20px" }}>
        <option value="1d">Last 24 hours</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }}>
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: "12px", color: C.text3, marginBottom: "8px" }}>TOTAL EXECUTIONS</div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{metrics.total}</div>
        </div>
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: "12px", color: C.text3, marginBottom: "8px" }}>COMPLETION RATE</div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{metrics.completionRate.toFixed(1)}%</div>
        </div>
        <div style={{ ...card, padding: "20px" }}>
          <div style={{ fontSize: "12px", color: C.text3, marginBottom: "8px" }}>AVG DURATION</div>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{Math.floor(metrics.avgDuration / 60000)}m</div>
        </div>
      </div>
    </div>
  );
}

export default WorkflowReports;
