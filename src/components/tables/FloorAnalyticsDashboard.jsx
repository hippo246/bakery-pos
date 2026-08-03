/**
 * Floor Analytics Dashboard — Premium Redesign
 * Full-featured analytics modal with live data, KPI cards, heatmaps, and leaderboard.
 */

import React, { useState, useMemo } from 'react';
import floorEngine from '../../tables/FloorEngine.js';
import tableEngine from '../../tables/TableEngine.js';
import jsPDF from 'jspdf';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDuration = (minutes) => {
  if (!minutes || minutes < 1) return '—';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const getWaitTime = (createdAt) => {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

// Orders that don't carry one of these statuses are treated as still "open"
// for the waiting-orders panel below.
const TERMINAL_ORDER_STATUSES = new Set(['completed', 'cancelled', 'paid', 'closed', 'void']);

// Returns [current period start/end) and the equivalent previous period,
// so KPI cards can show a real trend instead of a hardcoded number.
const getRangeBounds = (range) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const DAY = 24 * 60 * 60 * 1000;

  if (range === 'week') {
    const start = new Date(startOfToday.getTime() - startOfToday.getDay() * DAY);
    return { start, end: new Date(start.getTime() + 7 * DAY), prevStart: new Date(start.getTime() - 7 * DAY), prevEnd: start, label: 'vs last week' };
  }
  if (range === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start, end, prevStart, prevEnd: start, label: 'vs last month' };
  }
  // 'today' (default)
  return { start: startOfToday, end: new Date(startOfToday.getTime() + DAY), prevStart: new Date(startOfToday.getTime() - DAY), prevEnd: startOfToday, label: 'vs yesterday' };
};

// ─── Report export helpers ─────────────────────────────────────────────────

const PERIOD_LABELS = { today: 'Today', week: 'This Week', month: 'This Month' };

// Converts rows into CSV text. Values are stringified and quoted only when
// they contain a comma, quote, or newline, per the standard CSV escaping rule.
const toCSV = (rows, columns) => {
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(c => escape(c.label)).join(',');
  const lines = rows.map(row => columns.map(c => escape(c.value(row))).join(','));
  return [header, ...lines].join('\n');
};

const downloadFile = (filename, content, mime = 'text/plain') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const dateStamp = () => new Date().toISOString().slice(0, 10);

// Minimal table renderer for jsPDF — no external plugin needed. Draws a dark
// header row plus striped body rows and auto-paginates when content overflows.
// colWidths are relative weights (e.g. [1, 2, 1]), scaled to the usable page width.
const drawPdfTable = (doc, { startY, margin, pageWidth, head, rows, colWidths, fontSize = 8.5 }) => {
  const rowH = fontSize + 12;
  const bottomLimit = doc.internal.pageSize.getHeight() - 40;
  const usableWidth = pageWidth - margin * 2;
  const totalWeight = colWidths.reduce((a, b) => a + b, 0);
  const widths = colWidths.map(w => (w / totalWeight) * usableWidth);
  let y = startY;

  const drawHeaderRow = () => {
    doc.setFillColor(17, 17, 17);
    doc.rect(margin, y, usableWidth, rowH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(fontSize); doc.setTextColor(255, 255, 255);
    let x = margin;
    head.forEach((h, i) => {
      doc.text(String(h), x + 6, y + rowH / 2 + 3, { maxWidth: widths[i] - 10 });
      x += widths[i];
    });
    y += rowH;
  };

  drawHeaderRow();
  doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);

  rows.forEach((row, ri) => {
    if (y + rowH > bottomLimit) {
      doc.addPage();
      y = 48;
      drawHeaderRow();
      doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40);
    }
    if (ri % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, usableWidth, rowH, 'F');
    }
    let x = margin;
    row.forEach((cell, ci) => {
      doc.setFontSize(fontSize);
      doc.text(String(cell), x + 6, y + rowH / 2 + 3, { maxWidth: widths[ci] - 10 });
      x += widths[ci];
    });
    y += rowH;
  });

  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, margin + usableWidth, y);
  return y;
};

// Shared styling for the printable Report tab, kept separate from the other
// tabs' inline styles so the report reads like a document rather than a UI panel.
const reportCardStyle = { background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: 24 };
const reportHeaderStyle = { fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 14 };
const reportThStyle = { textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 10px', borderBottom: '2px solid var(--cafe-border-light)' };
const reportTdStyle = { fontSize: 13, color: 'var(--cafe-text-primary)', padding: '8px 10px', borderBottom: '1px solid var(--cafe-border-light)' };
const reportBtnStyle = { padding: '7px 14px', borderRadius: 8, border: '1px solid var(--cafe-border-light)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' };
const reportBtnClass = 'fad-report-btn';

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, icon, trend, trendLabel = 'vs previous period' }) {
  return (
    <div className="fad-kpi-card" style={{
      background: 'var(--cafe-bg-card)',
      border: '1px solid var(--cafe-border-light)',
      borderRadius: 16,
      padding: '20px 22px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    }}>
      {/* Accent corner blob */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 72, height: 72,
        background: color + '15',
        borderRadius: '0 16px 0 72px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: '11px 13px',
        fontSize: 22
      }}>{icon}</div>
      {/* Bottom accent line */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: color + '40', borderRadius: '0 0 16px 16px' }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1.15, marginTop: 6, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--cafe-text-tertiary)', marginTop: 1 }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
          fontSize: 11, fontWeight: 700,
          color: trend >= 0 ? '#10b981' : '#ef4444',
          background: trend >= 0 ? '#10b98115' : '#ef444415',
          borderRadius: 20, padding: '3px 8px', alignSelf: 'flex-start'
        }}>
          <span style={{ fontSize: 9 }}>{trend >= 0 ? '▲' : '▼'}</span>
          {Math.abs(trend)}% {trendLabel}
        </div>
      )}
    </div>
  );
}

function OccupancyGauge({ rate }) {
  const pct = Math.min(100, Math.max(0, rate));
  const color = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#10b981';
  const statusLabel = pct >= 80 ? 'Packed' : pct >= 60 ? 'Busy' : pct >= 30 ? 'Active' : 'Quiet';
  // Semicircle arc: r=52, arc spans 180° across the bottom half
  const r = 52;
  const cx = 70, cy = 70;
  const arcLen = Math.PI * r; // half circumference
  const filled = arcLen * (pct / 100);
  const gap = arcLen - filled;
  // Track arc: left to right across bottom semicircle (start at 180deg)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 0' }}>
      <svg width="140" height="82" viewBox="0 0 140 82">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="var(--cafe-border-light)" strokeWidth="10" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${filled} ${gap + 1}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        {/* Glow dot at fill end */}
        {pct > 2 && pct < 98 && (() => {
          const angle = Math.PI - (Math.PI * pct / 100);
          const dx = cx + r * Math.cos(angle);
          const dy = cy - r * Math.sin(angle);
          return <circle cx={dx} cy={dy} r="5" fill={color} opacity="0.9" />;
        })()}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--cafe-text-primary)" fontSize="26" fontWeight="800" fontFamily="inherit">{pct}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="inherit">{statusLabel}</text>
      </svg>
    </div>
  );
}

function SectionBar({ section }) {
  const pct = section.occupancyRate || 0;
  const barColor = pct >= 80 ? '#ef4444' : pct >= 50 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--cafe-border-light)' }}>
      <div style={{ width: 12, height: 30, borderRadius: 4, background: section.color || barColor, flexShrink: 0, opacity: 0.85 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>{section.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: '#10b98115', borderRadius: 10, padding: '2px 7px' }}>{formatCurrency(section.revenue)}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: barColor, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
          </div>
        </div>
        <div style={{ height: 7, background: 'var(--cafe-border-light)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`, borderRadius: 4, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>🪑 {section.occupied}/{section.totalTables} tables</span>
          <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>📋 {section.orders} orders</span>
        </div>
      </div>
    </div>
  );
}

function TableRow({ table, index, formatCurrency, maxRevenue = 1 }) {
  const medals = ['🥇', '🥈', '🥉'];
  const revPct = Math.round((table.totalRevenue / maxRevenue) * 100);
  const isTop3 = index < 3;
  return (
    <div className="fad-table-row" style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px',
      background: isTop3 ? `rgba(99,102,241,0.05)` : 'transparent',
      borderRadius: 10,
      border: `1px solid ${isTop3 ? 'var(--cafe-accent-border)' : 'transparent'}`,
      marginBottom: 3,
      cursor: 'default'
    }}>
      <div style={{ width: 30, fontSize: isTop3 ? 19 : 11, textAlign: 'center', fontWeight: 700, color: 'var(--cafe-text-tertiary)', flexShrink: 0 }}>
        {isTop3 ? medals[index] : `#${index + 1}`}
      </div>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: isTop3 ? 'var(--cafe-accent)' : 'var(--cafe-accent-bg)',
        border: `1px solid ${isTop3 ? 'var(--cafe-accent)' : 'var(--cafe-accent-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800,
        color: isTop3 ? 'white' : 'var(--cafe-accent)',
        flexShrink: 0
      }}>{table.number}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>Table #{table.number}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{formatCurrency(table.totalRevenue)}</span>
        </div>
        {/* Revenue bar */}
        <div style={{ height: 4, background: 'var(--cafe-border-light)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{ height: '100%', width: `${revPct}%`, background: isTop3 ? 'var(--cafe-accent)' : '#10b981', borderRadius: 2, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--cafe-text-tertiary)' }}>
          {table.totalSessions || 0} sessions · {formatDuration(table.avgOccupancyTime || 0)} avg · <span style={{ color: 'var(--cafe-text-secondary)' }}>{formatCurrency(table.revenuePerSession)}/session</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

function FloorAnalyticsDashboard({ tables = [], orders = [], selectedFloor = 'floor-main' }) {
  const [tab, setTab] = useState('overview'); // overview | sections | tables | service
  const [timeRange, setTimeRange] = useState('today');

  // timeRange previously had no effect anywhere — wire it up here.
  const { start, end, prevStart, prevEnd, label: trendLabel } = useMemo(() => getRangeBounds(timeRange), [timeRange]);

  const filteredOrders = useMemo(
    () => orders.filter(o => o.createdAt && new Date(o.createdAt) >= start && new Date(o.createdAt) < end),
    [orders, start, end]
  );
  const prevPeriodOrders = useMemo(
    () => orders.filter(o => o.createdAt && new Date(o.createdAt) >= prevStart && new Date(o.createdAt) < prevEnd),
    [orders, prevStart, prevEnd]
  );

  const currentRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0), [filteredOrders]);
  const prevRevenue = useMemo(() => prevPeriodOrders.reduce((sum, o) => sum + (o.total || 0), 0), [prevPeriodOrders]);
  const revenueTrend = prevRevenue > 0
    ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
    : (currentRevenue > 0 ? 100 : 0);

  const floorAnalytics = useMemo(() => floorEngine.getFloorAnalytics(selectedFloor, tables, filteredOrders), [selectedFloor, tables, filteredOrders]);
  const floorOccupancy = useMemo(() => floorEngine.calculateFloorOccupancy(selectedFloor, tables), [selectedFloor, tables]);
  const sections = useMemo(() => floorEngine.getFloorSections(selectedFloor), [selectedFloor]);

  const sectionMetrics = useMemo(() => sections.map(section => {
    const sectionTables = tables.filter(t => t.sectionId === section.id);
    const sectionTableIds = new Set(sectionTables.map(t => t.id));
    const sectionOrders = filteredOrders.filter(o => o.tableId && sectionTableIds.has(o.tableId));
    const occupied = sectionTables.filter(t => t.status === 'occupied').length;
    const revenue = sectionOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      ...section,
      totalTables: sectionTables.length,
      occupied,
      available: sectionTables.filter(t => t.status === 'available').length,
      occupancyRate: sectionTables.length > 0 ? Math.round((occupied / sectionTables.length) * 100) : 0,
      revenue,
      orders: sectionOrders.length
    };
  }), [sections, tables, filteredOrders]);

  // Ranked view for the Overview heatmap — busiest sections first, not just list order.
  const heatmapSections = useMemo(
    () => [...sectionMetrics].sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 4),
    [sectionMetrics]
  );

  const tableEfficiency = useMemo(() => tables.map(table => {
    const metrics = tableEngine.calculateTableMetrics(table.id);
    const tableOrders = filteredOrders.filter(o => o.tableId === table.id);
    const revenue = tableOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return { ...table, ...metrics, totalRevenue: revenue, revenuePerSession: metrics.totalSessions > 0 ? revenue / metrics.totalSessions : 0 };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10), [tables, filteredOrders]);

  // Orders still open, oldest first — this is what getWaitTime was originally built for.
  const activeOrders = useMemo(() => {
    return orders
      .filter(o => o.createdAt && !TERMINAL_ORDER_STATUSES.has(o.status))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 6);
  }, [orders]);

  // Real hour-of-day distribution from all order history, instead of a hardcoded shape.
  const peakHoursData = useMemo(() => {
    const buckets = Array(24).fill(0);
    let any = false;
    orders.forEach(o => {
      if (!o.createdAt) return;
      buckets[new Date(o.createdAt).getHours()] += 1;
      any = true;
    });
    const max = Math.max(1, ...buckets);
    return { buckets: buckets.map(c => Math.round((c / max) * 100)), hasData: any };
  }, [orders]);

  const occupancyRate = floorOccupancy?.occupancyRate || 0;
  const availableCount = (floorOccupancy?.total || 0) - (floorOccupancy?.occupied || 0);

  // ── Report tab: revenue-ranked sections, a flat KPI table, and a plain-language summary ──
  const reportSections = useMemo(() => [...sectionMetrics].sort((a, b) => b.revenue - a.revenue), [sectionMetrics]);

  const kpiRows = useMemo(() => [
    { label: 'Occupancy Rate', value: `${occupancyRate}%`, detail: `${floorOccupancy?.occupied || 0} of ${floorOccupancy?.total || 0} tables occupied` },
    { label: 'Total Revenue', value: formatCurrency(currentRevenue), detail: prevRevenue > 0 ? `${revenueTrend >= 0 ? '+' : ''}${revenueTrend}% ${trendLabel}` : 'No prior-period data to compare' },
    { label: 'Avg Dining Time', value: formatDuration(floorAnalytics?.avgDiningTime), detail: 'Per completed session' },
    { label: 'Table Turnover', value: `${floorAnalytics?.turnover || 0}x`, detail: 'Sessions per table' },
    { label: 'Completed Orders', value: floorAnalytics?.completedOrders || 0, detail: `In selected period (${PERIOD_LABELS[timeRange]})` },
    { label: 'Open Orders', value: activeOrders.length, detail: activeOrders.length > 0 ? `Longest waiting: ${getWaitTime(activeOrders[0].createdAt)}` : 'None currently open' },
  ], [occupancyRate, floorOccupancy, currentRevenue, prevRevenue, revenueTrend, trendLabel, floorAnalytics, timeRange, activeOrders]);

  const executiveSummary = useMemo(() => {
    const parts = [];
    parts.push(`This floor is currently at ${occupancyRate}% occupancy (${floorOccupancy?.occupied || 0} of ${floorOccupancy?.total || 0} tables).`);
    if (filteredOrders.length > 0) {
      const trendPhrase = prevRevenue > 0 ? `, ${revenueTrend >= 0 ? 'up' : 'down'} ${Math.abs(revenueTrend)}% ${trendLabel}` : '';
      parts.push(`Over ${PERIOD_LABELS[timeRange].toLowerCase()}, it generated ${formatCurrency(currentRevenue)} across ${filteredOrders.length} order${filteredOrders.length === 1 ? '' : 's'}${trendPhrase}.`);
    } else {
      parts.push(`No orders were recorded for the selected period (${PERIOD_LABELS[timeRange]}).`);
    }
    if (reportSections[0] && reportSections[0].revenue > 0) {
      parts.push(`${reportSections[0].name} is the top-earning section, bringing in ${formatCurrency(reportSections[0].revenue)}.`);
    }
    if (tableEfficiency[0] && tableEfficiency[0].totalRevenue > 0) {
      parts.push(`Table #${tableEfficiency[0].number} is the top performer at ${formatCurrency(tableEfficiency[0].totalRevenue)}.`);
    }
    if (activeOrders.length > 0) {
      parts.push(`${activeOrders.length} order${activeOrders.length === 1 ? ' is' : 's are'} currently open, with the longest waiting ${getWaitTime(activeOrders[0].createdAt)}.`);
    }
    return parts.join(' ');
  }, [occupancyRate, floorOccupancy, filteredOrders, currentRevenue, prevRevenue, revenueTrend, trendLabel, timeRange, reportSections, tableEfficiency, activeOrders]);

  // ── Floor Health Score — weighted composite of occupancy, revenue trend, and wait times ──
  const floorHealthScore = useMemo(() => {
    const occScore = Math.min(100, occupancyRate * 1.2); // penalise if below ~83%
    const trendScore = prevRevenue > 0 ? Math.min(100, 50 + revenueTrend) : 60;
    const waitPenalty = activeOrders.length > 0
      ? activeOrders.reduce((sum, o) => {
          const m = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
          return sum + (m >= 30 ? 20 : m >= 15 ? 8 : 0);
        }, 0)
      : 0;
    const raw = Math.round((occScore * 0.4 + trendScore * 0.4 + 20) - Math.min(40, waitPenalty));
    return Math.max(0, Math.min(100, raw));
  }, [occupancyRate, revenueTrend, prevRevenue, activeOrders]);

  const healthLabel = floorHealthScore >= 80 ? 'Excellent' : floorHealthScore >= 60 ? 'Good' : floorHealthScore >= 40 ? 'Fair' : 'Needs Attention';
  const healthColor = floorHealthScore >= 80 ? '#10b981' : floorHealthScore >= 60 ? '#f59e0b' : '#ef4444';

  // Revenue share per section for donut chart
  const totalSectionRevenue = reportSections.reduce((s, r) => s + r.revenue, 0);
  const sectionColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

  const exportSectionsCSV = () => downloadFile(
    `sections-${timeRange}-${dateStamp()}.csv`,
    toCSV(reportSections, [
      { label: 'Section', value: s => s.name },
      { label: 'Type', value: s => s.type },
      { label: 'Total Tables', value: s => s.totalTables },
      { label: 'Occupied', value: s => s.occupied },
      { label: 'Available', value: s => s.available },
      { label: 'Occupancy %', value: s => s.occupancyRate },
      { label: 'Orders', value: s => s.orders },
      { label: 'Revenue', value: s => s.revenue },
    ]),
    'text/csv'
  );

  const exportTablesCSV = () => downloadFile(
    `tables-${timeRange}-${dateStamp()}.csv`,
    toCSV(tableEfficiency, [
      { label: 'Table #', value: t => t.number },
      { label: 'Sessions', value: t => t.totalSessions || 0 },
      { label: 'Avg Duration (min)', value: t => t.avgOccupancyTime || 0 },
      { label: 'Total Revenue', value: t => t.totalRevenue },
      { label: 'Revenue Per Session', value: t => Math.round(t.revenuePerSession || 0) },
    ]),
    'text/csv'
  );

  const downloadTextReport = () => {
    const lines = [];
    lines.push('FLOOR PERFORMANCE REPORT');
    lines.push(`Period: ${PERIOD_LABELS[timeRange]}`);
    lines.push(`Generated: ${new Date().toLocaleString('en-IN')}`);
    lines.push('');
    lines.push('EXECUTIVE SUMMARY');
    lines.push(executiveSummary);
    lines.push('');
    lines.push('KEY METRICS');
    kpiRows.forEach(r => lines.push(`- ${r.label}: ${r.value} (${r.detail})`));
    lines.push('');
    lines.push('SECTION PERFORMANCE (by revenue)');
    if (reportSections.length === 0) lines.push('- No sections configured');
    reportSections.forEach(s => lines.push(`- ${s.name} (${s.type}): ${s.occupied}/${s.totalTables} occupied, ${s.occupancyRate}%, ${s.orders} orders, ${formatCurrency(s.revenue)}`));
    lines.push('');
    lines.push('TOP TABLES (by revenue)');
    if (tableEfficiency.length === 0) lines.push('- No table data yet');
    tableEfficiency.forEach((t, i) => lines.push(`${i + 1}. Table #${t.number} — ${formatCurrency(t.totalRevenue)} (${t.totalSessions || 0} sessions, ${formatDuration(t.avgOccupancyTime || 0)} avg)`));
    if (activeOrders.length > 0) {
      lines.push('');
      lines.push('CURRENTLY OPEN ORDERS');
      activeOrders.forEach(o => {
        const t = tables.find(tb => tb.id === o.tableId);
        lines.push(`- ${t ? `Table #${t.number}` : `Order #${String(o.id).slice(-4)}`}: waiting ${getWaitTime(o.createdAt)}`);
      });
    }
    downloadFile(`floor-report-${timeRange}-${dateStamp()}.txt`, lines.join('\n'), 'text/plain');
  };

  // Builds an actual vector PDF document (not a screenshot of the UI).
  // Static hex colors are used throughout since jsPDF can't resolve CSS vars.
  const exportPDFReport = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 48;

    const INK = [17, 17, 17];
    const MUTED = [110, 110, 110];
    const GREEN = [16, 185, 129];
    const AMBER = [245, 158, 11];
    const RED = [239, 68, 68];
    const ACCENT = [99, 102, 241];
    const LINE = [225, 225, 225];

    const healthRGB = floorHealthScore >= 80 ? GREEN : floorHealthScore >= 60 ? AMBER : RED;
    const occRGB = occupancyRate >= 80 ? RED : occupancyRate >= 60 ? AMBER : GREEN;

    // Header
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(...INK);
    doc.text('Floor Performance Report', margin, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
    y += 16;
    doc.text(`${PERIOD_LABELS[timeRange]} · Generated ${new Date().toLocaleString('en-IN')} · Floor ID: ${selectedFloor}`, margin, y);
    y += 10;
    doc.setDrawColor(...LINE); doc.line(margin, y, pageWidth - margin, y);
    y += 26;

    // Scorecards row
    const cardW = (pageWidth - margin * 2 - 24) / 4;
    const cards = [
      { label: 'FLOOR HEALTH', value: String(floorHealthScore), color: healthRGB, sub: healthLabel },
      { label: `REVENUE (${PERIOD_LABELS[timeRange].toUpperCase()})`, value: formatCurrency(currentRevenue), color: GREEN, sub: `${filteredOrders.length} orders` },
      { label: 'LIVE OCCUPANCY', value: `${occupancyRate}%`, color: occRGB, sub: `${floorOccupancy?.occupied || 0} occupied · ${availableCount} free` },
      { label: 'TOP SECTION', value: reportSections[0]?.name || '—', color: ACCENT, sub: reportSections[0] ? formatCurrency(reportSections[0].revenue) : 'No data' },
    ];
    cards.forEach((c, i) => {
      const x = margin + i * (cardW + 8);
      doc.setDrawColor(...LINE); doc.setLineWidth(1);
      doc.roundedRect(x, y, cardW, 62, 4, 4);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(...MUTED);
      doc.text(c.label, x + 10, y + 16, { maxWidth: cardW - 20 });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...c.color);
      doc.text(String(c.value), x + 10, y + 34, { maxWidth: cardW - 20 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(String(c.sub), x + 10, y + 48, { maxWidth: cardW - 20 });
    });
    y += 62 + 24;

    // Executive summary
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
    doc.text('Executive Summary', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(60, 60, 60);
    const summaryLines = doc.splitTextToSize(executiveSummary, pageWidth - margin * 2);
    doc.text(summaryLines, margin, y);
    y += summaryLines.length * 12 + 18;

    // Key Metrics table
    y = drawPdfTable(doc, {
      startY: y,
      margin,
      pageWidth,
      head: ['Metric', 'Value', 'Detail'],
      rows: kpiRows.map(r => [r.label, String(r.value), r.detail]),
      colWidths: [1, 1, 2],
    });
    y += 24;

    // Section Performance table
    if (reportSections.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 48; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
      doc.text('Section Performance', margin, y);
      y += 10;
      y = drawPdfTable(doc, {
        startY: y,
        margin,
        pageWidth,
        head: ['#', 'Section', 'Occupancy', 'Orders', 'Revenue', 'Share'],
        rows: reportSections.map((s, i) => {
          const share = totalSectionRevenue > 0 ? Math.round((s.revenue / totalSectionRevenue) * 100) : 0;
          return [String(i + 1), `${s.name} (${s.type})`, `${s.occupied}/${s.totalTables} · ${s.occupancyRate}%`, String(s.orders), formatCurrency(s.revenue), `${share}%`];
        }),
        colWidths: [0.5, 2, 1.5, 1, 1.2, 0.8],
      });
      y += 24;
    }

    // Top Performing Tables
    if (tableEfficiency.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 48; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
      doc.text('Top Performing Tables', margin, y);
      y += 10;
      const totalTableRev = tableEfficiency.reduce((s, t) => s + t.totalRevenue, 0);
      y = drawPdfTable(doc, {
        startY: y,
        margin,
        pageWidth,
        head: ['Rank', 'Table', 'Sessions', 'Avg Duration', 'Revenue', 'Rev/Session', 'Share'],
        rows: tableEfficiency.map((t, i) => {
          const share = totalTableRev > 0 ? Math.round((t.totalRevenue / totalTableRev) * 100) : 0;
          return [String(i + 1), `Table #${t.number}`, String(t.totalSessions || 0), formatDuration(t.avgOccupancyTime || 0), formatCurrency(t.totalRevenue), formatCurrency(t.revenuePerSession), `${share}%`];
        }),
        colWidths: [0.7, 1, 0.8, 1, 1.2, 1.2, 0.8],
      });
      y += 24;
    }

    // Open Orders
    if (activeOrders.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); y = 48; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK);
      doc.text(`Open Orders (${activeOrders.length} waiting)`, margin, y);
      y += 10;
      drawPdfTable(doc, {
        startY: y,
        margin,
        pageWidth,
        head: ['Table / Order', 'Waiting', 'Order Value'],
        rows: activeOrders.map(o => {
          const tbl = tables.find(tb => tb.id === o.tableId);
          return [tbl ? `Table #${tbl.number}` : `Order #${String(o.id).slice(-4)}`, getWaitTime(o.createdAt), o.total > 0 ? formatCurrency(o.total) : '—'];
        }),
        colWidths: [1.5, 1, 1],
      });
    }

    // Footer page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED);
      doc.text(`Page ${p} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
    }

    doc.save(`floor-report-${timeRange}-${dateStamp()}.pdf`);
  };

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'sections', label: '🏢 Sections' },
    { id: 'tables', label: '🏆 Tables' },
    { id: 'service', label: '⚡ Service' },
    { id: 'report', label: '📄 Report' },
  ];

  return (
    <div className="fad-print-root" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--cafe-bg-surface)' }}>
      <style>{`
        @media print {
          .fad-no-print { display: none !important; }
          .fad-print-root {
            height: auto !important;
            --cafe-bg-card: #ffffff;
            --cafe-bg-surface: #ffffff;
            --cafe-border-light: #dddddd;
            --cafe-text-primary: #111111;
            --cafe-text-secondary: #444444;
            --cafe-text-tertiary: #777777;
            --cafe-accent: #333333;
            --cafe-accent-bg: #f0f0f0;
          }
          .fad-content-scroll {
            overflow: visible !important;
            height: auto !important;
            padding: 0 !important;
          }
          .fad-print-root * {
            box-shadow: none !important;
            text-shadow: none !important;
            animation: none !important;
            transition: none !important;
          }
          .fad-kpi-card, [style*="border-radius: 14"] { break-inside: avoid; }
          table { break-inside: auto; }
          tr { break-inside: avoid; }
        }
        @keyframes fad-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fad-slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fad-bar-fill { from{width:0} to{width:var(--bar-w)} }
        .fad-kpi-card { transition: transform 0.18s ease, box-shadow 0.18s ease; }
        .fad-kpi-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .fad-tab-btn { transition: all 0.2s; position: relative; }
        .fad-tab-btn:hover:not(.fad-tab-active) { background: var(--cafe-bg-card) !important; color: var(--cafe-text-primary) !important; }
        .fad-section-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .fad-section-card:hover { transform: translateX(3px); }
        .fad-table-row { transition: background 0.15s ease; }
        .fad-table-row:hover { background: var(--cafe-accent-bg) !important; }
        .fad-urgent { animation: fad-pulse 1.8s ease-in-out infinite; }
        .fad-animate-in { animation: fad-slide-in 0.3s ease both; }
        .fad-report-btn { transition: all 0.15s ease; }
        .fad-report-btn:hover { background: var(--cafe-accent) !important; color: white !important; border-color: var(--cafe-accent) !important; }
      `}</style>
      {/* Toolbar */}
      <div className="fad-no-print" style={{ padding: '14px 24px', borderBottom: '1px solid var(--cafe-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--cafe-bg-card)', boxShadow: '0 1px 0 var(--cafe-border-light)' }}>
        <div style={{ display: 'flex', gap: 2, background: 'var(--cafe-bg-surface)', borderRadius: 11, padding: 4, border: '1px solid var(--cafe-border-light)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`fad-tab-btn${tab === t.id ? ' fad-tab-active' : ''}`}
              style={{
                padding: '7px 15px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: tab === t.id ? 700 : 500,
                background: tab === t.id ? 'var(--cafe-accent)' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--cafe-text-secondary)',
                boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                letterSpacing: tab === t.id ? '-0.1px' : 'normal'
              }}>{t.label}</button>
          ))}
        </div>
        <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={{
          padding: '7px 14px', borderRadius: 9, border: '1px solid var(--cafe-border-light)',
          background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)', fontSize: 12.5,
          fontWeight: 600, cursor: 'pointer', outline: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
        }}>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} key={tab} className="fad-animate-in fad-content-scroll">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <KpiCard label="Occupancy Rate" value={`${occupancyRate}%`} sub={`${floorOccupancy?.occupied || 0} of ${floorOccupancy?.total || 0} tables`} color="var(--cafe-accent)" icon="🪑" />
              <KpiCard label="Total Revenue" value={formatCurrency(floorAnalytics?.totalRevenue)} sub={`${floorAnalytics?.completedOrders || 0} completed orders`} color="#10b981" icon="💰" trend={revenueTrend} trendLabel={trendLabel} />
              <KpiCard label="Avg Dining Time" value={formatDuration(floorAnalytics?.avgDiningTime)} sub="Per session" color="#f59e0b" icon="⏱️" />
              <KpiCard label="Table Turnover" value={`${floorAnalytics?.turnover || 0}x`} sub="Sessions per table today" color="#8b5cf6" icon="🔄" />
            </div>

            {/* Gauge + Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
                <OccupancyGauge rate={occupancyRate} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>Live Table Status</div>
                  {(() => {
                    const total = floorOccupancy?.total || 1;
                    return [
                      { label: 'Occupied', count: floorOccupancy?.occupied || 0, color: '#ef4444' },
                      { label: 'Available', count: availableCount, color: '#10b981' },
                      { label: 'Reserved', count: tables.filter(t => t.status === 'reserved').length, color: '#8b5cf6' },
                      { label: 'Cleaning', count: tables.filter(t => t.status === 'cleaning').length, color: '#f59e0b' },
                    ].map(item => (
                      <div key={item.label} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12.5, color: 'var(--cafe-text-secondary)' }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.count}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--cafe-border-light)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.round((item.count / total) * 100)}%`, background: item.color, borderRadius: 2, transition: 'width 0.6s ease', opacity: 0.7 }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 16 }}>Section Heatmap</div>
                {heatmapSections.length > 0
                  ? heatmapSections.map(s => <SectionBar key={s.id} section={s} />)
                  : <div style={{ color: 'var(--cafe-text-tertiary)', fontSize: 13, textAlign: 'center', paddingTop: 24 }}>No sections configured</div>
                }
              </div>
            </div>

            {/* Longest Waiting Orders */}
            {activeOrders.length > 0 && (
              <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>Longest Waiting Orders</div>
                <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 16 }}>Orders still open, oldest first</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeOrders.map((o, idx) => {
                    const waitMin = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
                    const isUrgent = waitMin >= 30;
                    const waitColor = isUrgent ? '#ef4444' : waitMin >= 15 ? '#f59e0b' : '#10b981';
                    const table = tables.find(t => t.id === o.tableId);
                    return (
                      <div key={o.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '9px 12px',
                        background: isUrgent ? '#ef444408' : 'var(--cafe-bg-surface)',
                        borderRadius: 9,
                        border: `1px solid ${isUrgent ? '#ef444430' : 'transparent'}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isUrgent && <div className="fad-urgent" style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />}
                          <span style={{ fontSize: 13, color: 'var(--cafe-text-primary)', fontWeight: 600 }}>
                            {table ? `Table #${table.number}` : `Order #${String(o.id).slice(-4)}`}
                          </span>
                          {idx === 0 && <span style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', background: 'var(--cafe-border-light)', borderRadius: 10, padding: '1px 6px' }}>oldest</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: waitColor, background: waitColor + '18', borderRadius: 8, padding: '3px 8px' }}>{getWaitTime(o.createdAt)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTIONS TAB */}
        {tab === 'sections' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sectionMetrics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--cafe-text-tertiary)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
                <div style={{ fontWeight: 600 }}>No sections configured</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Add sections in the Layout Studio</div>
              </div>
            ) : sectionMetrics.map(section => {
              const oColor = section.occupancyRate >= 80 ? '#ef4444' : section.occupancyRate >= 50 ? '#f59e0b' : '#10b981';
              return (
              <div key={section.id} className="fad-section-card" style={{
                background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)',
                borderRadius: 16, padding: 20, borderLeft: `4px solid ${section.color || oColor}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-text-primary)', letterSpacing: '-0.2px' }}>{section.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--cafe-text-tertiary)', marginTop: 3, textTransform: 'capitalize' }}>{section.type} · {section.totalTables} tables</div>
                  </div>
                  <div style={{
                    padding: '5px 13px', borderRadius: 20, fontWeight: 800, fontSize: 13,
                    background: oColor + '18', color: oColor,
                    border: `1px solid ${oColor}30`
                  }}>{section.occupancyRate}% full</div>
                </div>
                <div style={{ height: 8, background: 'var(--cafe-border-light)', borderRadius: 4, marginBottom: 16, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
                    width: `${section.occupancyRate}%`,
                    background: `linear-gradient(90deg, ${oColor}99, ${oColor})`
                  }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Occupied', value: section.occupied, icon: '🔴', color: '#ef4444' },
                    { label: 'Available', value: section.available, icon: '🟢', color: '#10b981' },
                    { label: 'Orders', value: section.orders, icon: '📋', color: 'var(--cafe-accent)' },
                    { label: 'Revenue', value: formatCurrency(section.revenue), icon: '💰', color: '#f59e0b' },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--cafe-bg-surface)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', border: '1px solid var(--cafe-border-light)' }}>
                      <div style={{ fontSize: 11, marginBottom: 4 }}>{m.icon}</div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: m.color, letterSpacing: '-0.3px' }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', marginTop: 2, fontWeight: 500 }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            );})}

          </div>
        )}

        {/* TABLES TAB */}
        {tab === 'tables' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '10px 14px', background: 'var(--cafe-bg-card)', borderRadius: 10, border: '1px solid var(--cafe-border-light)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--cafe-text-tertiary)', fontWeight: 500 }}>Top {tableEfficiency.length} tables · ranked by revenue</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#10b981' }}>
                Total: {formatCurrency(tableEfficiency.reduce((s, t) => s + t.totalRevenue, 0))}
              </span>
            </div>
            {tableEfficiency.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--cafe-text-tertiary)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                <div style={{ fontWeight: 600 }}>No table data yet</div>
              </div>
            ) : tableEfficiency.map((table, i) => (
              <TableRow key={table.id} table={table} index={i} formatCurrency={formatCurrency} maxRevenue={tableEfficiency[0]?.totalRevenue || 1} />
            ))}
          </div>
        )}

        {/* SERVICE TAB */}
        {tab === 'service' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[
                { label: 'Avg Table Turnover', value: `${floorAnalytics?.turnover || 0}x`, sub: 'Sessions per table', color: '#8b5cf6', icon: '🔄' },
                { label: 'Avg Dining Duration', value: formatDuration(floorAnalytics?.avgDiningTime || 0), sub: 'Per session', color: '#f59e0b', icon: '⏱️' },
                { label: 'Est. Cleaning Time', value: '~8m', sub: 'Per table reset', color: '#6b7280', icon: '🧹' },
                { label: 'Avg Response Time', value: '~3m', sub: 'Order to kitchen', color: '#10b981', icon: '⚡' },
              ].map(m => <KpiCard key={m.label} {...m} />)}
            </div>

            {/* Peak Hours Simulation */}
            <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cafe-text-primary)', marginBottom: 4 }}>Estimated Peak Hours</div>
              <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 16 }}>Based on order volume by hour, all-time</div>
              {!peakHoursData.hasData ? (
                <div style={{ color: 'var(--cafe-text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Not enough order history yet</div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110, paddingBottom: 0 }}>
                    {peakHoursData.buckets.slice(8, 24).map((h, i) => {
                      const hour = 8 + i;
                      const label = hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour-12}p`;
                      const isNow = new Date().getHours() === hour;
                      const isPeak = h > 80;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          {isNow && <div style={{ fontSize: 7, color: 'var(--cafe-accent)', fontWeight: 700, letterSpacing: 0 }}>NOW</div>}
                          <div title={`${hour}:00 — ${h}% of peak`} style={{
                            width: '100%',
                            height: `${Math.max(h, 4)}%`,
                            borderRadius: '4px 4px 2px 2px',
                            background: isNow
                              ? 'var(--cafe-accent)'
                              : isPeak
                              ? 'linear-gradient(180deg,#ef444488,#ef444455)'
                              : h > 50
                              ? 'linear-gradient(180deg,#f59e0b88,#f59e0b55)'
                              : 'linear-gradient(180deg,#10b98188,#10b98144)',
                            boxShadow: isNow ? '0 0 8px var(--cafe-accent)44' : 'none',
                            transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)'
                          }} />
                          <div style={{ fontSize: 7.5, color: isNow ? 'var(--cafe-accent)' : 'var(--cafe-text-tertiary)', fontWeight: isNow ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--cafe-border-light)' }}>
                    {[
                      { dot: '#10b981', label: 'Low' },
                      { dot: '#f59e0b', label: 'Moderate' },
                      { dot: '#ef4444', label: 'Peak' },
                      { dot: 'var(--cafe-accent)', label: 'Now' },
                    ].map(l => (
                      <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: l.dot }} />
                        <span style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORT TAB */}
        {tab === 'report' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── Report Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--cafe-text-primary)', letterSpacing: '-0.5px' }}>Floor Performance Report</span>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--cafe-accent)', color: 'white', borderRadius: 20, padding: '3px 10px', letterSpacing: '0.3px' }}>{PERIOD_LABELS[timeRange].toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--cafe-text-tertiary)' }}>
                  Generated {new Date().toLocaleString('en-IN')} · Floor ID: {selectedFloor}
                </div>
              </div>
              <div className="fad-no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => window.print()} className={reportBtnClass} style={reportBtnStyle}>🖨️ Print</button>
                <button onClick={exportPDFReport} className={reportBtnClass} style={{ ...reportBtnStyle, background: 'var(--cafe-accent)', color: 'white', borderColor: 'var(--cafe-accent)' }}>⬇️ Report (.pdf)</button>
                <button onClick={downloadTextReport} className={reportBtnClass} style={reportBtnStyle}>⬇️ Report (.txt)</button>
                <button onClick={exportSectionsCSV} className={reportBtnClass} style={reportBtnStyle}>⬇️ Sections CSV</button>
                <button onClick={exportTablesCSV} className={reportBtnClass} style={reportBtnStyle}>⬇️ Tables CSV</button>
              </div>
            </div>

            {/* ── Top Scorecards Row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              {/* Floor Health Score */}
              <div style={{ background: 'var(--cafe-bg-card)', border: `2px solid ${healthColor}40`, borderRadius: 14, padding: '16px 18px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: healthColor + '08' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>Floor Health</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: healthColor, lineHeight: 1, letterSpacing: '-2px' }}>{floorHealthScore}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: healthColor, marginTop: 4 }}>{healthLabel}</div>
                <div style={{ height: 4, background: 'var(--cafe-border-light)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${floorHealthScore}%`, background: `linear-gradient(90deg,${healthColor}99,${healthColor})`, borderRadius: 2, transition: 'width 1s ease' }} />
                </div>
              </div>
              {/* Total Revenue */}
              <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#10b981,#059669)' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>Revenue ({PERIOD_LABELS[timeRange]})</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{formatCurrency(currentRevenue)}</div>
                {prevRevenue > 0 && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: revenueTrend >= 0 ? '#10b981' : '#ef4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span>{revenueTrend >= 0 ? '▲' : '▼'} {Math.abs(revenueTrend)}%</span>
                    <span style={{ fontWeight: 400, color: 'var(--cafe-text-tertiary)' }}>{trendLabel}</span>
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>{filteredOrders.length} orders · {floorAnalytics?.completedOrders || 0} completed</div>
              </div>
              {/* Occupancy */}
              <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: occupancyRate >= 80 ? '#ef4444' : occupancyRate >= 60 ? '#f59e0b' : '#10b981' }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>Live Occupancy</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: occupancyRate >= 80 ? '#ef4444' : occupancyRate >= 60 ? '#f59e0b' : '#10b981', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{occupancyRate}%</div>
                <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 6 }}>{floorOccupancy?.occupied || 0} occupied · {availableCount} free</div>
                <div style={{ height: 4, background: 'var(--cafe-border-light)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${occupancyRate}%`, background: occupancyRate >= 80 ? '#ef4444' : '#10b981', borderRadius: 2 }} />
                </div>
              </div>
              {/* Top Section */}
              {reportSections[0] && reportSections[0].revenue > 0 && (
                <div style={{ background: 'var(--cafe-bg-card)', border: '1px solid var(--cafe-border-light)', borderRadius: 14, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cafe-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>Top Section</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--cafe-text-primary)', lineHeight: 1.2, marginBottom: 4 }}>{reportSections[0].name}</div>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.5px' }}>{formatCurrency(reportSections[0].revenue)}</div>
                  <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 4 }}>{reportSections[0].orders} orders · {reportSections[0].occupancyRate}% full</div>
                </div>
              )}
            </div>

            {/* ── Executive Summary ── */}
            <div style={{ ...reportCardStyle, borderLeft: '4px solid var(--cafe-accent)', background: 'var(--cafe-accent-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div style={{ ...reportHeaderStyle, margin: 0 }}>Executive Summary</div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.8, color: 'var(--cafe-text-primary)', margin: 0, fontStyle: 'normal' }}>{executiveSummary}</p>
            </div>

            {/* ── Key Metrics — two-column card grid ── */}
            <div style={reportCardStyle}>
              <div style={reportHeaderStyle}>Key Metrics</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {kpiRows.map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--cafe-bg-surface)', borderRadius: 10, border: '1px solid var(--cafe-border-light)' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', fontWeight: 600, marginBottom: 2 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>{r.detail}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--cafe-text-primary)', textAlign: 'right', letterSpacing: '-0.3px' }}>{r.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Section Performance ── */}
            <div style={reportCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={reportHeaderStyle}>Section Performance</div>
                {totalSectionRevenue > 0 && <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>Total: <strong style={{ color: 'var(--cafe-text-primary)' }}>{formatCurrency(totalSectionRevenue)}</strong></span>}
              </div>
              {reportSections.length === 0 ? (
                <div style={{ color: 'var(--cafe-text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No sections configured</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={reportThStyle}>#</th>
                      <th style={reportThStyle}>Section</th>
                      <th style={reportThStyle}>Occupancy</th>
                      <th style={reportThStyle}>Orders</th>
                      <th style={reportThStyle}>Revenue</th>
                      <th style={reportThStyle}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportSections.map((s, i) => {
                      const sOcc = s.occupancyRate;
                      const occColor = sOcc >= 80 ? '#ef4444' : sOcc >= 50 ? '#f59e0b' : '#10b981';
                      const share = totalSectionRevenue > 0 ? Math.round((s.revenue / totalSectionRevenue) * 100) : 0;
                      const accentColor = sectionColors[i % sectionColors.length];
                      return (
                        <tr key={s.id} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--cafe-bg-surface)' }}>
                          <td style={{ ...reportTdStyle, width: 28 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: accentColor }}>#{i + 1}</span>
                          </td>
                          <td style={{ ...reportTdStyle }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: accentColor, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--cafe-text-primary)' }}>{s.name}</div>
                                <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', textTransform: 'capitalize' }}>{s.type} · {s.totalTables} tables</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...reportTdStyle, minWidth: 110 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 5, background: 'var(--cafe-border-light)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${sOcc}%`, background: occColor, borderRadius: 3, transition: 'width 0.6s ease' }} />
                              </div>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: occColor, minWidth: 30 }}>{sOcc}%</span>
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--cafe-text-tertiary)', marginTop: 3 }}>{s.occupied}/{s.totalTables} occupied</div>
                          </td>
                          <td style={{ ...reportTdStyle, fontWeight: 600, textAlign: 'center' }}>{s.orders}</td>
                          <td style={{ ...reportTdStyle, fontWeight: 800, color: '#10b981', fontSize: 13 }}>{formatCurrency(s.revenue)}</td>
                          <td style={{ ...reportTdStyle, minWidth: 80 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1, height: 5, background: 'var(--cafe-border-light)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${share}%`, background: accentColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', minWidth: 26 }}>{share}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Revenue Share Visual ── */}
            {totalSectionRevenue > 0 && reportSections.length > 1 && (
              <div style={reportCardStyle}>
                <div style={reportHeaderStyle}>Revenue Share by Section</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Stacked bar */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ height: 28, borderRadius: 8, overflow: 'hidden', display: 'flex' }}>
                      {reportSections.filter(s => s.revenue > 0).map((s, i) => {
                        const share = Math.round((s.revenue / totalSectionRevenue) * 100);
                        return (
                          <div key={s.id} title={`${s.name}: ${share}%`} style={{
                            width: `${share}%`, background: sectionColors[i % sectionColors.length],
                            transition: 'width 0.8s ease', minWidth: share > 0 ? 3 : 0
                          }} />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12 }}>
                      {reportSections.filter(s => s.revenue > 0).map((s, i) => {
                        const share = Math.round((s.revenue / totalSectionRevenue) * 100);
                        return (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 2, background: sectionColors[i % sectionColors.length], flexShrink: 0 }} />
                            <span style={{ fontSize: 11.5, color: 'var(--cafe-text-secondary)', fontWeight: 500 }}>{s.name}</span>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>{share}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Top Performing Tables ── */}
            <div style={reportCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={reportHeaderStyle}>Top Performing Tables</div>
                {tableEfficiency.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)' }}>
                    Total: <strong style={{ color: '#10b981' }}>{formatCurrency(tableEfficiency.reduce((s, t) => s + t.totalRevenue, 0))}</strong>
                  </span>
                )}
              </div>
              {tableEfficiency.length === 0 ? (
                <div style={{ color: 'var(--cafe-text-tertiary)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No table data yet</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={reportThStyle}>Rank</th>
                      <th style={reportThStyle}>Table</th>
                      <th style={reportThStyle}>Sessions</th>
                      <th style={reportThStyle}>Avg Duration</th>
                      <th style={reportThStyle}>Revenue</th>
                      <th style={reportThStyle}>Rev/Session</th>
                      <th style={reportThStyle}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const maxRev = tableEfficiency[0]?.totalRevenue || 1;
                      const totalTableRev = tableEfficiency.reduce((s, t) => s + t.totalRevenue, 0);
                      return tableEfficiency.map((t, i) => {
                        const medals = ['🥇', '🥈', '🥉'];
                        const share = totalTableRev > 0 ? Math.round((t.totalRevenue / totalTableRev) * 100) : 0;
                        const barPct = Math.round((t.totalRevenue / maxRev) * 100);
                        return (
                          <tr key={t.id} style={{ background: i < 3 ? 'rgba(99,102,241,0.03)' : i % 2 === 0 ? 'transparent' : 'var(--cafe-bg-surface)' }}>
                            <td style={{ ...reportTdStyle, textAlign: 'center', fontSize: 16 }}>
                              {i < 3 ? medals[i] : <span style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', fontWeight: 700 }}>#{i + 1}</span>}
                            </td>
                            <td style={{ ...reportTdStyle, fontWeight: 700 }}>Table #{t.number}</td>
                            <td style={{ ...reportTdStyle, textAlign: 'center' }}>{t.totalSessions || 0}</td>
                            <td style={reportTdStyle}>{formatDuration(t.avgOccupancyTime || 0)}</td>
                            <td style={{ ...reportTdStyle }}>
                              <div style={{ fontWeight: 800, color: '#10b981', fontSize: 13 }}>{formatCurrency(t.totalRevenue)}</div>
                              <div style={{ height: 4, background: 'var(--cafe-border-light)', borderRadius: 2, marginTop: 4, overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ height: '100%', width: `${barPct}%`, background: i < 3 ? 'var(--cafe-accent)' : '#10b981', borderRadius: 2 }} />
                              </div>
                            </td>
                            <td style={{ ...reportTdStyle, color: 'var(--cafe-text-secondary)', fontWeight: 600 }}>{formatCurrency(t.revenuePerSession)}</td>
                            <td style={{ ...reportTdStyle, color: 'var(--cafe-text-tertiary)', fontSize: 12 }}>{share}%</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            {/* ── Open Orders ── */}
            {activeOrders.length > 0 && (
              <div style={reportCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={reportHeaderStyle}>Open Orders</div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#ef444420', color: '#ef4444', borderRadius: 10, padding: '2px 8px' }}>
                    {activeOrders.length} waiting
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeOrders.map((o, idx) => {
                    const tbl = tables.find(tb => tb.id === o.tableId);
                    const waitMin = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000);
                    const isUrgent = waitMin >= 30;
                    const isWarning = waitMin >= 15;
                    const waitColor = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981';
                    return (
                      <div key={o.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px',
                        background: isUrgent ? '#ef444408' : isWarning ? '#f59e0b08' : 'var(--cafe-bg-surface)',
                        borderRadius: 10,
                        border: `1px solid ${isUrgent ? '#ef444430' : isWarning ? '#f59e0b30' : 'var(--cafe-border-light)'}`,
                      }}>
                        {/* Wait indicator dot */}
                        <div className={isUrgent ? 'fad-urgent' : ''} style={{ width: 8, height: 8, borderRadius: '50%', background: waitColor, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
                            {tbl ? `Table #${tbl.number}` : `Order #${String(o.id).slice(-4)}`}
                            {idx === 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cafe-text-tertiary)', background: 'var(--cafe-border-light)', borderRadius: 8, padding: '1px 6px', marginLeft: 8 }}>oldest</span>}
                          </div>
                          {o.total > 0 && <div style={{ fontSize: 11, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>Order value: {formatCurrency(o.total)}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: waitColor, background: waitColor + '18', borderRadius: 8, padding: '4px 10px' }}>
                            {getWaitTime(o.createdAt)}
                          </div>
                          {isUrgent && <div style={{ fontSize: 9, color: '#ef4444', fontWeight: 700, marginTop: 3, textAlign: 'center' }}>ACTION NEEDED</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Wait time summary */}
                {activeOrders.length > 1 && (() => {
                  const urgentCount = activeOrders.filter(o => Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000) >= 30).length;
                  const warnCount = activeOrders.filter(o => { const m = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000); return m >= 15 && m < 30; }).length;
                  return (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cafe-border-light)' }}>
                      {urgentCount > 0 && <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>🔴 {urgentCount} urgent (30m+)</div>}
                      {warnCount > 0 && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>🟡 {warnCount} warning (15–30m)</div>}
                      <div style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>🟢 {activeOrders.length - urgentCount - warnCount} on track</div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        )}


      </div>
    </div>
  );
}

export default FloorAnalyticsDashboard;
