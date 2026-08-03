import React from 'react';
import { useState, useCallback } from "react";
import { getCompletionStatistics, getTaskHistory, getTasks } from "../../utils/operationsManager.js";

function OperationsReports() {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  const reportTypes = [
    { id: 'DAILY_CHECKLIST', label: 'Daily Checklist Report', description: 'Summary of daily task completion', icon: '📋' },
    { id: 'CLEANING', label: 'Cleaning Report', description: 'Cleaning task completion status', icon: '🧹' },
    { id: 'MAINTENANCE', label: 'Maintenance Report', description: 'Maintenance task history', icon: '🔧' },
    { id: 'OPENING', label: 'Opening Report', description: 'Opening procedure compliance', icon: '🌅' },
    { id: 'CLOSING', label: 'Closing Report', description: 'Closing procedure compliance', icon: '🌙' },
    { id: 'STAFF', label: 'Staff Completion Report', description: 'Task completion by staff member', icon: '👥' }
  ];

  const generateReport = useCallback((reportId) => {
    const tasks = getTasks();
    const stats = getCompletionStatistics(7);
    const history = getTaskHistory(7);

    let data;
    switch (reportId) {
      case 'DAILY_CHECKLIST':
        data = {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'COMPLETED' || t.status === 'APPROVED').length,
          pendingTasks: tasks.filter(t => t.status === 'PENDING').length,
          overallCompletion: Math.round((tasks.filter(t => t.status === 'COMPLETED' || t.status === 'APPROVED').length / tasks.length) * 100) || 0
        };
        break;
      case 'CLEANING':
        data = {
          cleaningTasks: tasks.filter(t => t.category === 'CLEANING'),
          completed: tasks.filter(t => t.category === 'CLEANING' && (t.status === 'COMPLETED' || t.status === 'APPROVED')).length,
          completionRate: 0
        };
        data.completionRate = data.cleaningTasks.length > 0 ? Math.round((data.completed / data.cleaningTasks.length) * 100) : 0;
        break;
      case 'MAINTENANCE':
        data = {
          maintenanceTasks: tasks.filter(t => t.category === 'MAINTENANCE'),
          completed: tasks.filter(t => t.category === 'MAINTENANCE' && (t.status === 'COMPLETED' || t.status === 'APPROVED')).length,
          completionRate: 0
        };
        data.completionRate = data.maintenanceTasks.length > 0 ? Math.round((data.completed / data.maintenanceTasks.length) * 100) : 0;
        break;
      case 'OPENING':
        data = {
          openingTasks: tasks.filter(t => t.category === 'OPENING'),
          completed: tasks.filter(t => t.category === 'OPENING' && (t.status === 'COMPLETED' || t.status === 'APPROVED')).length,
          completionRate: 0
        };
        data.completionRate = data.openingTasks.length > 0 ? Math.round((data.completed / data.openingTasks.length) * 100) : 0;
        break;
      case 'CLOSING':
        data = {
          closingTasks: tasks.filter(t => t.category === 'CLOSING'),
          completed: tasks.filter(t => t.category === 'CLOSING' && (t.status === 'COMPLETED' || t.status === 'APPROVED')).length,
          completionRate: 0
        };
        data.completionRate = data.closingTasks.length > 0 ? Math.round((data.completed / data.closingTasks.length) * 100) : 0;
        break;
      case 'STAFF':
        data = {
          stats: stats,
          byStaff: stats.byStaff || {}
        };
        break;
      default:
        data = {};
    }

    setSelectedReport(reportId);
    setReportData(data);
  }, []);

  const downloadReport = () => {
    if (!reportData) return;

    const report = {
      reportId: selectedReport,
      generatedAt: new Date().toISOString(),
      data: reportData
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafeos-operations-report-${selectedReport.toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>Operations Reports</div>

      {!selectedReport ? (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
          {reportTypes.map(report => (
            <ReportCard key={report.id} report={report} onGenerate={() => generateReport(report.id)} />
          ))}
        </div>
      ) : (
        <div>
          <button onClick={() => { setSelectedReport(null); setReportData(null); }} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-bg-elevated)', color: 'var(--cafe-text-primary)', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer', marginBottom: '16px' }}>
            ← Back to Reports
          </button>
          <ReportView reportId={selectedReport} data={reportData} onDownload={downloadReport} />
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onGenerate }) {
  return (
    <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)', cursor: 'pointer' }} onClick={onGenerate}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '32px' }}>{report.icon}</span>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{report.label}</div>
          <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>{report.description}</div>
        </div>
      </div>
      <button style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-sm)', cursor: 'pointer' }}>
        Generate Report
      </button>
    </div>
  );
}

function ReportView({ reportId, data, onDownload }) {
  const reportLabels = {
    'DAILY_CHECKLIST': 'Daily Checklist Report',
    'CLEANING': 'Cleaning Report',
    'MAINTENANCE': 'Maintenance Report',
    'OPENING': 'Opening Report',
    'CLOSING': 'Closing Report',
    'STAFF': 'Staff Completion Report'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cafe-text-primary)' }}>{reportLabels[reportId]}</div>
        <button onClick={onDownload} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', background: 'var(--cafe-primary)', color: 'white', border: 'none', borderRadius: 'var(--cafe-radius-md)', cursor: 'pointer' }}>
          Download Report
        </button>
      </div>

      <div style={{ background: 'var(--cafe-bg-surface)', borderRadius: 'var(--cafe-radius-lg)', padding: '24px', border: '1px solid var(--cafe-border-light)' }}>
        <div style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)', marginBottom: '16px' }}>
          Generated at: {new Date().toLocaleString()}
        </div>
        
        {reportId === 'DAILY_CHECKLIST' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MetricRow label="Total Tasks" value={data.totalTasks} />
            <MetricRow label="Completed Tasks" value={data.completedTasks} />
            <MetricRow label="Pending Tasks" value={data.pendingTasks} />
            <MetricRow label="Overall Completion" value={`${data.overallCompletion}%`} />
          </div>
        )}

        {reportId === 'CLEANING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MetricRow label="Cleaning Tasks" value={data.cleaningTasks.length} />
            <MetricRow label="Completed" value={data.completed} />
            <MetricRow label="Completion Rate" value={`${data.completionRate}%`} />
          </div>
        )}

        {reportId === 'MAINTENANCE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MetricRow label="Maintenance Tasks" value={data.maintenanceTasks.length} />
            <MetricRow label="Completed" value={data.completed} />
            <MetricRow label="Completion Rate" value={`${data.completionRate}%`} />
          </div>
        )}

        {reportId === 'OPENING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MetricRow label="Opening Tasks" value={data.openingTasks.length} />
            <MetricRow label="Completed" value={data.completed} />
            <MetricRow label="Completion Rate" value={`${data.completionRate}%`} />
          </div>
        )}

        {reportId === 'CLOSING' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MetricRow label="Closing Tasks" value={data.closingTasks.length} />
            <MetricRow label="Completed" value={data.completed} />
            <MetricRow label="Completion Rate" value={`${data.completionRate}%`} />
          </div>
        )}

        {reportId === 'STAFF' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MetricRow label="Total Completions" value={data.stats.totalCompletions} />
            <MetricRow label="Approved Completions" value={data.stats.approvedCompletions} />
            <MetricRow label="Rejected Completions" value={data.stats.rejectedCompletions} />
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)', marginBottom: '8px' }}>By Staff</div>
              {Object.entries(data.byStaff).map(([staffId, count]) => (
                <MetricRow key={staffId} label={staffId} value={count} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--cafe-bg-elevated)', borderRadius: 'var(--cafe-radius-md)' }}>
      <div style={{ fontSize: '14px', color: 'var(--cafe-text-primary)' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cafe-text-primary)' }}>{value}</div>
    </div>
  );
}

export default OperationsReports;
