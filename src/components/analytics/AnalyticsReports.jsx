// Analytics & Reports - Main Component
// Comprehensive analytics and reporting workspace for CafeOS

import { useState, useMemo, useCallback, useEffect } from "react";
import AlertDialog from "../common/AlertDialog.jsx";
import AnalyticsReportsTopbar from "./AnalyticsReportsTopbar.jsx";
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  getDateRangeForPreset,
  formatDate
} from "../../utils/dateRangeUtils.js";
import {
  calculateKPIs,
  calculateChannelPerformance,
  calculateItemPerformance,
  calculateCategoryPerformance,
  calculatePaymentMethodBreakdown,
  calculateCustomerPerformance,
  calculateNewVsReturningCustomers,
  calculateStaffPerformance,
  calculateTablePerformance,
  calculateDeliveryPerformance,
  calculateInventoryPerformance,
  calculatePurchasingPerformance,
  calculateProductionPerformance,
  calculateDocumentStats,
  filterOrdersByDateRange
} from "../../utils/analyticsCalculations.js";
import {
  exportSalesReportCSV,
  exportChannelReportCSV,
  exportMenuReportCSV,
  exportOrderReportCSV,
  exportCustomerReportCSV,
  exportPaymentReportCSV,
  exportStaffReportCSV,
  exportCategoryReportCSV,
  exportFullAnalyticsCSV,
  exportGenericCSV,
  printReport
} from "../../utils/exportUtilities.js";

// Report sections with icons
const REPORT_SECTIONS = [
  { id: 'overview',      label: 'Overview',      icon: '📊' },
  { id: 'sales',         label: 'Sales',         icon: '💰' },
  { id: 'orders',        label: 'Orders',        icon: '🧾' },
  { id: 'menu',          label: 'Menu',          icon: '🍽️' },
  { id: 'channels',      label: 'Channels',      icon: '📡' },
  { id: 'customers',     label: 'Customers',     icon: '👥' },
  { id: 'payments',      label: 'Payments',      icon: '💳' },
  { id: 'staff',         label: 'Staff',         icon: '👨‍🍳' },
  { id: 'categories',    label: 'Categories',    icon: '🏷️' },
  { id: 'profitability', label: 'Profitability', icon: '📈' },
  { id: 'tables',        label: 'Tables',        icon: '🪑' },
  { id: 'delivery',      label: 'Delivery',      icon: '🚴' },
  { id: 'inventory',     label: 'Inventory',     icon: '📦' },
  { id: 'purchasing',    label: 'Purchasing',    icon: '🛒' },
  { id: 'production',    label: 'Production',    icon: '🏭' },
  { id: 'documents',     label: 'Documents',     icon: '📄' },
  { id: 'history',       label: 'History',       icon: '🕰️' },
];

// ─── Interactive Line Chart Component ─────────────────────────────────────────
const InteractiveLineChart = ({ data, height = 200, showTooltip = true, onPointClick }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - ((d.value - minValue) / range) * 100,
    ...d
  }));
  
  const createPath = () => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x}% ${p.y}%`).join(' ');
  };
  
  const createAreaPath = () => {
    return `${createPath()} L 100% 100% L 0% 100% Z`;
  };
  
  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <svg style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(pct => (
          <line
            key={pct}
            x1="0%" y1={`${pct}%`}
            x2="100%" y2={`${pct}%`}
            stroke="var(--cafe-border-light)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}
        
        {/* Area fill */}
        <path
          d={createAreaPath()}
          fill="var(--cafe-accent-bg)"
          opacity="0.3"
        />
        
        {/* Line */}
        <path
          d={createPath()}
          fill="none"
          stroke="var(--cafe-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={`${p.x}%`}
            cy={`${p.y}%`}
            r={hoveredPoint === i ? 6 : 4}
            fill="var(--cafe-accent)"
            stroke="var(--cafe-bg-card)"
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.2s' }}
            onMouseEnter={() => setHoveredPoint(i)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={() => onPointClick && onPointClick(p)}
          />
        ))}
      </svg>
      
      {/* Tooltip */}
      {showTooltip && hoveredPoint !== null && (
        <div style={{
          position: 'absolute',
          left: `${points[hoveredPoint].x}%`,
          top: `${points[hoveredPoint].y - 10}%`,
          transform: 'translate(-50%, -100%)',
          background: 'var(--cafe-bg-card)',
          border: '1px solid var(--cafe-border)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 12,
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ color: 'var(--cafe-text-secondary)' }}>{points[hoveredPoint].label}</div>
          <div style={{ color: 'var(--cafe-accent)', fontSize: 14 }}>{points[hoveredPoint].value}</div>
        </div>
      )}
    </div>
  );
};

// ─── Interactive Pie Chart Component ─────────────────────────────────────────
const InteractivePieChart = ({ data, size = 200, showLegend = true, onSliceClick }) => {
  const [hoveredSlice, setHoveredSlice] = useState(null);
  
  if (!data || data.length === 0) return null;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  
  let cumulativePercent = 0;
  const slices = data.map((d, i) => {
    const percent = (d.value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...d,
      percent,
      startPercent,
      endPercent: cumulativePercent,
      color: d.color || colors[i % colors.length]
    };
  });
  
  const createSlicePath = (startPercent, endPercent, isHovered) => {
    const radius = isHovered ? 48 : 45;
    const innerRadius = 0;
    
    const startAngle = (startPercent / 100) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (endPercent / 100) * 2 * Math.PI - Math.PI / 2;
    
    const x1 = 50 + radius * Math.cos(startAngle);
    const y1 = 50 + radius * Math.sin(startAngle);
    const x2 = 50 + radius * Math.cos(endAngle);
    const y2 = 50 + radius * Math.sin(endAngle);
    
    const largeArc = endPercent - startPercent > 50 ? 1 : 0;
    
    if (endPercent - startPercent >= 100) {
      return `M 50 50 m -${radius} 0 a ${radius} ${radius} 0 1 0 ${radius * 2} 0 a ${radius} ${radius} 0 1 0 -${radius * 2} 0`;
    }
    
    return `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={createSlicePath(slice.startPercent, slice.endPercent, hoveredSlice === i)}
            fill={slice.color}
            stroke="var(--cafe-bg-card)"
            strokeWidth="1"
            style={{ 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              transform: hoveredSlice === i ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: '50% 50%'
            }}
            onMouseEnter={() => setHoveredSlice(i)}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => onSliceClick && onSliceClick(slice)}
          />
        ))}
        
        {/* Center text */}
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" style={{
          fontSize: 14,
          fontWeight: 700,
          fill: 'var(--cafe-text-primary)'
        }}>
          {total.toLocaleString()}
        </text>
      </svg>
      
      {/* Legend */}
      {showLegend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          {slices.map((slice, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 6,
                background: hoveredSlice === i ? 'var(--cafe-bg-hover)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={() => setHoveredSlice(i)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              <div style={{ width: 12, height: 12, borderRadius: 3, background: slice.color }} />
              <span style={{ fontSize: 12, color: 'var(--cafe-text-secondary)' }}>{slice.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>{slice.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Heatmap Component ───────────────────────────────────────────────────────
const Heatmap = ({ data, xLabels, yLabels, cellSize = 40, showValues = true }) => {
  const maxValue = Math.max(...data.flat(), 1);
  const minValue = Math.min(...data.flat(), 0);
  
  const getColor = (value) => {
    if (value === 0) return 'var(--cafe-bg-surface)';
    const intensity = (value - minValue) / (maxValue - minValue || 1);
    const hue = 220 - intensity * 60; // Blue to green
    const lightness = 90 - intensity * 40;
    return `hsl(${hue}, 70%, ${lightness}%)`;
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Y labels */}
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ width: 60 }} />
        {xLabels.map((label, i) => (
          <div key={i} style={{ 
            width: cellSize, 
            fontSize: 10, 
            textAlign: 'center', 
            color: 'var(--cafe-text-tertiary)',
            fontWeight: 500
          }}>
            {label}
          </div>
        ))}
      </div>
      
      {data.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <div style={{ 
            width: 60, 
            fontSize: 10, 
            color: 'var(--cafe-text-tertiary)',
            fontWeight: 500,
            textAlign: 'right'
          }}>
            {yLabels[i]}
          </div>
          {row.map((value, j) => (
            <div
              key={j}
              style={{
                width: cellSize,
                height: cellSize,
                background: getColor(value),
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: showValues ? 10 : 0,
                fontWeight: 600,
                color: value > maxValue * 0.5 ? '#fff' : 'var(--cafe-text-primary)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              title={`${yLabels[i]} ${xLabels[j]}: ${value}`}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {showValues && value > 0 ? value : ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Drill-down Modal Component ───────────────────────────────────────────────
const DrillDownModal = ({ isOpen, onClose, metric, data, formatCurrency }) => {
  if (!isOpen || !metric) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--cafe-bg-card)',
        borderRadius: 16,
        maxWidth: 800,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        padding: 24,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
            {metric.label} - Detailed Breakdown
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-surface)',
              color: 'var(--cafe-text-secondary)',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ 
            padding: 16, 
            background: 'var(--cafe-bg-hover)', 
            borderRadius: 12,
            border: '1px solid var(--cafe-border-light)'
          }}>
            <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginBottom: 4 }}>Total Value</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
              {formatCurrency(metric.value)}
            </div>
          </div>
          
          {data && data.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.map((item, idx) => (
                <div key={idx} style={{
                  padding: 12,
                  background: 'var(--cafe-bg-hover)',
                  borderRadius: 8,
                  border: '1px solid var(--cafe-border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cafe-text-primary)' }}>
                      {item.label}
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: 12, color: 'var(--cafe-text-tertiary)', marginTop: 2 }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--cafe-accent)', fontFamily: 'monospace' }}>
                    {formatCurrency(item.value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--cafe-text-tertiary)' }}>
              No detailed data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Mini Bar Chart (pure CSS/inline divs) ───────────────────────────────────
// items: [{ label, value, color? }]  maxValue: number (optional, auto if omitted)
const MiniBarChart = ({ items, maxValue, height = 48, barColor = "var(--cafe-accent)" }) => {
  if (!items || items.length === 0) return null;
  const max = maxValue || Math.max(...items.map(i => i.value || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, marginTop: 10 }}>
      {items.map((item, idx) => {
        const pct = max > 0 ? Math.max(2, (item.value / max) * 100) : 2;
        return (
          <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div
              title={`${item.label}: ${item.value}`}
              style={{
                width: "100%",
                height: `${pct}%`,
                background: item.color || barColor,
                borderRadius: "3px 3px 0 0",
                minHeight: 3,
                transition: "height .35s",
                opacity: 0.9,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// ─── Inline Progress Bar ──────────────────────────────────────────────────────
const ProgressBar = ({ value, max = 100, color = "var(--cafe-accent)", height = 6 }) => {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div style={{
      width: "100%", height, background: "var(--cafe-bg-surface)",
      borderRadius: height + 2, overflow: "hidden", marginTop: 6,
    }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: color, borderRadius: height + 2, transition: "width .45s",
      }} />
    </div>
  );
};

// ─── KPI Card with trend indicator ───────────────────────────────────────────
const KPICard = ({ label, value, change, isPositive, isLoading, isMobile, onClick, sparkline }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  if (isLoading) {
    return (
      <div style={{
        background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)",
        borderRadius: 12, padding: isMobile ? 14 : 18, minHeight: isMobile ? 90 : 110,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ width: 60, height: 12, background: "var(--cafe-bg-surface)", borderRadius: 4, marginBottom: 14 }} />
        <div style={{ width: 100, height: 26, background: "var(--cafe-bg-surface)", borderRadius: 4, marginBottom: 10 }} />
        <div style={{ width: 80, height: 16, background: "var(--cafe-bg-surface)", borderRadius: 4 }} />
      </div>
    );
  }

  const changeDisplay = change !== null && change !== undefined ? change : '—';
  const isNeutral = change === null || change === undefined || change === 0 || change === '—' || change === 'N/A';

  // Trend emoji
  const trendEmoji = isNeutral ? '→' : isPositive ? '↑' : '↓';
  const valueColor = isNeutral ? "var(--cafe-text-primary)" : isPositive ? "var(--cafe-success)" : "var(--cafe-danger)";

  return (
    <div 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "var(--cafe-bg-hover)", 
        border: "1px solid var(--cafe-border-light)",
        borderRadius: 12, 
        padding: isMobile ? 14 : 18,
        borderLeft: `4px solid ${  isNeutral ? "var(--cafe-text-tertiary)" : isPositive ? "var(--cafe-success)" : "var(--cafe-danger)"}`,
        transition: 'all 0.3s ease',
        cursor: onClick ? 'pointer' : 'default',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isHovered ? 'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(139,92,246,0.05) 100%)' : 'transparent',
        transition: 'background 0.3s ease',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: isMobile ? 10 : 11, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: isMobile ? 8 : 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {label}
          {onClick && <span style={{ fontSize: 10, opacity: 0.5 }}>→</span>}
        </div>
        <div style={{
          fontSize: isMobile ? 18 : 22, fontWeight: 800, fontFamily: "monospace",
          color: valueColor, lineHeight: 1, marginBottom: isMobile ? 8 : 10,
          letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: isMobile ? 12 : 14 }}>{trendEmoji}</span>
          <span style={{
            fontSize: isMobile ? 11 : 12, fontWeight: 700, fontFamily: "monospace",
            color: isNeutral ? "var(--cafe-text-tertiary)" : isPositive ? "var(--cafe-success)" : "var(--cafe-danger)",
            background: isNeutral ? "var(--cafe-bg-surface)" : isPositive ? "var(--cafe-success-bg)" : "var(--cafe-danger-bg)",
            borderRadius: 6, padding: isMobile ? "3px 6px" : "4px 8px",
          }}>
            {changeDisplay}
          </span>
        </div>
        
        {/* Mini sparkline */}
        {sparkline && sparkline.length > 0 && (
          <div style={{ marginTop: 8, height: 24 }}>
            <MiniBarChart items={sparkline} height={24} barColor={isPositive ? "var(--cafe-success)" : isNeutral ? "var(--cafe-text-tertiary)" : "var(--cafe-danger)"} />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ message, icon = "📊" }) => (
  <div style={{ textAlign: "center", padding: 56, color: "var(--cafe-text-tertiary)" }}>
    <div style={{ fontSize: 52, marginBottom: 18, opacity: 0.4 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 500, color: "var(--cafe-text-secondary)" }}>{message}</div>
  </div>
);

import DailyArchive from "../../utils/DailyArchive.js";

// ─── Main Analytics & Reports Component ──────────────────────────────────────
function AnalyticsReports({ 
  orders: externalOrders, 
  customers: externalCustomers, 
  staff: externalStaff,
  inventory: externalInventory,
  tables: externalTables,
  deliveryOrders: externalDeliveryOrders,
  drivers: externalDrivers,
  suppliers: externalSuppliers,
  purchaseOrders: externalPurchaseOrders,
  productionBatches: externalProductionBatches,
  documents: externalDocuments,
  businessDetails 
}) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth <= 700);
  useEffect(() => { 
    const fn = () => setIsMobile(window.innerWidth <= 700); 
    window.addEventListener("resize", fn); 
    return () => window.removeEventListener("resize", fn); 
  }, []);

  const [datePreset, setDatePreset] = useState(DATE_PRESETS.TODAY);
  const [activeSection, setActiveSection] = useState('overview');
  const [exportDialog, setExportDialog] = useState({ open: false, format: 'csv' });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });
  const [isExporting, setIsExporting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [advancedFilters, setAdvancedFilters] = useState({
    channels: [],
    categories: [],
    staff: [],
    tables: [],
    minAmount: null,
    maxAmount: null
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [comparisonMode, setComparisonMode] = useState('none');
  const [drillDownMetric, setDrillDownMetric] = useState(null);
  const [showDrillDown, setShowDrillDown] = useState(false);

  // Normalize data
  const orders = useMemo(() => Array.isArray(externalOrders) ? externalOrders : [], [externalOrders]);
  const customers = useMemo(() => Array.isArray(externalCustomers) ? externalCustomers : [], [externalCustomers]);
  const staff = useMemo(() => Array.isArray(externalStaff) ? externalStaff : [], [externalStaff]);
  const inventory = useMemo(() => Array.isArray(externalInventory) ? externalInventory : [], [externalInventory]);
  const tables = useMemo(() => Array.isArray(externalTables) ? externalTables : [], [externalTables]);
  const deliveryOrders = useMemo(() => Array.isArray(externalDeliveryOrders) ? externalDeliveryOrders : [], [externalDeliveryOrders]);
  const drivers = useMemo(() => Array.isArray(externalDrivers) ? externalDrivers : [], [externalDrivers]);
  const suppliers = useMemo(() => Array.isArray(externalSuppliers) ? externalSuppliers : [], [externalSuppliers]);
  const purchaseOrders = useMemo(() => Array.isArray(externalPurchaseOrders) ? externalPurchaseOrders : [], [externalPurchaseOrders]);
  const productionBatches = useMemo(() => Array.isArray(externalProductionBatches) ? externalProductionBatches : [], [externalProductionBatches]);
  const documents = useMemo(() => Array.isArray(externalDocuments) ? externalDocuments : [], [externalDocuments]);

  const currentDateRange = useMemo(() => getDateRangeForPreset(datePreset), [datePreset]);
  
  // Apply advanced filters
  const filteredOrders = useMemo(() => {
    let result = currentPeriodOrders;
    
    if (advancedFilters.channels.length > 0) {
      result = result.filter(o => advancedFilters.channels.includes(o.source));
    }
    if (advancedFilters.categories.length > 0) {
      result = result.filter(o => 
        o.items?.some(item => advancedFilters.categories.includes(item.category))
      );
    }
    if (advancedFilters.staff.length > 0) {
      result = result.filter(o => advancedFilters.staff.includes(o.staffId));
    }
    if (advancedFilters.tables.length > 0) {
      result = result.filter(o => advancedFilters.tables.includes(o.tableName));
    }
    if (advancedFilters.minAmount !== null) {
      result = result.filter(o => (o.total || o.amount || 0) >= advancedFilters.minAmount);
    }
    if (advancedFilters.maxAmount !== null) {
      result = result.filter(o => (o.total || o.amount || 0) <= advancedFilters.maxAmount);
    }
    
    return result;
  }, [currentPeriodOrders, advancedFilters]);
  
  const currentPeriodOrders = filteredOrders;
  const currentKPIs = useMemo(() => calculateKPIs(currentPeriodOrders, currentDateRange), [currentPeriodOrders, currentDateRange]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Trigger re-render by updating date preset (this will recalculate all data)
      setDatePreset(prev => ({ ...prev }));
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const previousDateRange = useMemo(() => {
    const { start, end } = currentDateRange || {};
    if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start) || isNaN(end)) return null;
    const durationMs = end.getTime() - start.getTime();
    if (durationMs <= 0) return null;
    return { start: new Date(start.getTime() - durationMs), end: new Date(start.getTime()) };
  }, [currentDateRange]);

  const previousPeriodOrders = useMemo(() => {
    if (!previousDateRange) return [];
    return filterOrdersByDateRange(orders, previousDateRange);
  }, [orders, previousDateRange]);

  const previousKPIs = useMemo(() => {
    if (!previousDateRange) return null;
    return calculateKPIs(previousPeriodOrders, previousDateRange);
  }, [previousPeriodOrders, previousDateRange]);

  const buildComparisonMetric = (current, previous) => {
    if (!Number.isFinite(current)) current = 0;
    if (!Number.isFinite(previous) || previous === 0) {
      return { value: null, percentage: 0, direction: "neutral" };
    }
    const diff = current - previous;
    const percentage = Math.abs((diff / previous) * 100);
    const direction = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";
    return { value: diff, percentage, direction };
  };

  const comparison = useMemo(() => {
    if (!previousKPIs || !currentKPIs) return null;
    try {
      return {
        netSales:         buildComparisonMetric(currentKPIs.sales?.netSales,            previousKPIs.sales?.netSales),
        grossSales:       buildComparisonMetric(currentKPIs.sales?.grossSales,          previousKPIs.sales?.grossSales),
        averageOrderValue:buildComparisonMetric(currentKPIs.sales?.averageOrderValue,   previousKPIs.sales?.averageOrderValue),
        refunds:          buildComparisonMetric(currentKPIs.sales?.refunds,             previousKPIs.sales?.refunds),
        orders:           buildComparisonMetric(currentKPIs.orders?.total,              previousKPIs.orders?.total),
        completionRate:   buildComparisonMetric(currentKPIs.orders?.completionRate,     previousKPIs.orders?.completionRate),
        cancellationRate: buildComparisonMetric(currentKPIs.orders?.cancellationRate,   previousKPIs.orders?.cancellationRate),
      };
    } catch (err) {
      console.warn("AnalyticsReports: error calculating comparison", err);
      return null;
    }
  }, [currentKPIs, previousKPIs]);

  const channelPerformance    = useMemo(() => calculateChannelPerformance(currentPeriodOrders),                [currentPeriodOrders]);
  const menuPerformance       = useMemo(() => calculateItemPerformance(currentPeriodOrders),                   [currentPeriodOrders]);
  const categoryPerformance   = useMemo(() => calculateCategoryPerformance(currentPeriodOrders),               [currentPeriodOrders]);
  const paymentBreakdown      = useMemo(() => calculatePaymentMethodBreakdown(currentPeriodOrders),            [currentPeriodOrders]);
  const customerPerformance   = useMemo(() => calculateCustomerPerformance(currentPeriodOrders, customers),    [currentPeriodOrders, customers]);
  const newVsReturning        = useMemo(() => calculateNewVsReturningCustomers(orders, currentDateRange),      [orders, currentDateRange]);
  const staffPerformance      = useMemo(() => calculateStaffPerformance(currentPeriodOrders, staff),           [currentPeriodOrders, staff]);
  const tablePerformance      = useMemo(() => calculateTablePerformance(currentPeriodOrders, tables),          [currentPeriodOrders, tables]);
  const deliveryPerformance   = useMemo(() => calculateDeliveryPerformance(deliveryOrders, drivers),           [deliveryOrders, drivers]);
  const inventoryPerformance  = useMemo(() => calculateInventoryPerformance(inventory, currentPeriodOrders),   [inventory, currentPeriodOrders]);
  const purchasingPerformance = useMemo(() => calculatePurchasingPerformance(purchaseOrders, suppliers),       [purchaseOrders, suppliers]);
  const productionPerformance = useMemo(() => calculateProductionPerformance(productionBatches),               [productionBatches]);
  const documentStats         = useMemo(() => calculateDocumentStats(documents),                               [documents]);

  // Count badges: how many data items each section has
  const sectionCounts = useMemo(() => ({
    overview:      currentPeriodOrders.length,
    sales:         currentPeriodOrders.length,
    orders:        currentPeriodOrders.length,
    menu:          menuPerformance.length,
    channels:      channelPerformance.length,
    customers:     customerPerformance.length,
    payments:      paymentBreakdown.length,
    staff:         staffPerformance.length,
    categories:    categoryPerformance.length,
    profitability: currentPeriodOrders.length,
    tables:        tablePerformance.length,
    delivery:      deliveryPerformance.length,
    inventory:     inventoryPerformance.length,
    purchasing:    purchasingPerformance.length,
    production:    productionBatches.length,
    documents:     documents.length,
    history:       0,
  }), [
    currentPeriodOrders.length, menuPerformance.length, channelPerformance.length,
    customerPerformance.length, paymentBreakdown.length, staffPerformance.length,
    categoryPerformance.length, tablePerformance.length, deliveryPerformance.length,
    inventoryPerformance.length, purchasingPerformance.length, productionBatches.length,
    documents.length,
  ]);

  // Export handler
  const handleExport = useCallback(async (format) => {
    if (isExporting) return;
    if (currentPeriodOrders.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'No Data Available',
        message: 'No data available for the selected period.',
        type: 'warning'
      });
      return;
    }
    setIsExporting(true);
    try {
      // Use the passed format or default to 'csv'
      const exportFormat = format || 'csv';
      switch (activeSection) {
        case 'overview':      exportFullAnalyticsCSV({ kpis: currentKPIs, channels: channelPerformance, menuItems: menuPerformance, payments: paymentBreakdown }, currentDateRange, exportFormat); break;
        case 'sales':         exportSalesReportCSV(currentKPIs, channelPerformance, currentDateRange, exportFormat); break;
        case 'orders':        exportOrderReportCSV(currentPeriodOrders, currentDateRange, exportFormat); break;
        case 'menu':          exportMenuReportCSV(menuPerformance, currentDateRange, exportFormat); break;
        case 'channels':      exportChannelReportCSV(channelPerformance, currentDateRange, exportFormat); break;
        case 'customers':     exportCustomerReportCSV(customerPerformance, currentDateRange, exportFormat); break;
        case 'payments':      exportPaymentReportCSV(paymentBreakdown, currentDateRange, exportFormat); break;
        case 'staff':         exportStaffReportCSV(staffPerformance, currentDateRange, exportFormat); break;
        case 'categories':    exportCategoryReportCSV(categoryPerformance, currentDateRange, exportFormat); break;
        case 'profitability': exportGenericCSV([currentKPIs.profitability], 'Profitability', currentDateRange, exportFormat); break;
        case 'tables':        exportGenericCSV(tablePerformance, 'Table-Performance', currentDateRange, exportFormat); break;
        case 'delivery':      exportGenericCSV(deliveryPerformance, 'Delivery-Performance', currentDateRange, exportFormat); break;
        case 'inventory':     exportGenericCSV(inventoryPerformance, 'Inventory-Performance', currentDateRange, exportFormat); break;
        case 'purchasing':    exportGenericCSV(purchasingPerformance, 'Purchasing-Performance', currentDateRange, exportFormat); break;
        case 'production':    exportGenericCSV([productionPerformance], 'Production-Performance', currentDateRange, exportFormat); break;
        case 'documents':     exportGenericCSV([documentStats], 'Document-Stats', currentDateRange, exportFormat); break;
        default:              exportFullAnalyticsCSV({ kpis: currentKPIs, channels: channelPerformance, menuItems: menuPerformance, payments: paymentBreakdown }, currentDateRange, exportFormat);
      }
      setAlertDialog({
        isOpen: true,
        title: 'Export Successful',
        message: `Report exported successfully as ${exportFormat.toUpperCase()}.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Export failed:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Export Failed',
        message: 'Export failed. Please try again.',
        type: 'error'
      });
    } finally {
      setIsExporting(false);
      setExportDialog({ open: false, format: 'csv' });
    }
  }, [activeSection, currentKPIs, channelPerformance, menuPerformance, paymentBreakdown, customerPerformance, staffPerformance, categoryPerformance, currentPeriodOrders, currentDateRange, isExporting, tablePerformance, deliveryPerformance, inventoryPerformance, purchasingPerformance, productionPerformance, documentStats]);

  const generateReportHTML = useCallback(() => {
    return `<div>Report content for ${  activeSection  }</div>`;
  }, [activeSection]);

  const handlePrint = useCallback(() => {
    const reportData = generateReportHTML();
    const sectionTitle = `${activeSection.charAt(0).toUpperCase() + activeSection.slice(1)  } Report`;
    printReport(sectionTitle, currentDateRange, reportData, businessDetails);
  }, [activeSection, currentDateRange, businessDetails, generateReportHTML]);

  const formatCurrency = (value) => `₹${  Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const formatComparison = (comparisonValue) => {
    if (!comparisonValue) return { display: '—', isPositive: true };
    const { value, percentage, direction } = comparisonValue;
    if (value === null) return { display: 'N/A', isPositive: true };
    const sign = direction === 'up' ? '+' : '';
    const display = `${sign + percentage.toFixed(1)  }%`;
    return { display, isPositive: direction === 'up' || direction === 'neutral' };
  };

  return (
    <div style={{ padding: isMobile ? 16 : 28, maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <AnalyticsReportsTopbar
        isMobile={isMobile}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        setExportDialog={setExportDialog}
        isExporting={isExporting}
        currentPeriodOrders={currentPeriodOrders}
        handlePrint={handlePrint}
        currentDateRange={currentDateRange}
      />

      {/* Date Range Display & Controls */}
      <div style={{ 
        marginBottom: isMobile ? 16 : 24, padding: isMobile ? "12px 14px" : "14px 18px", background: "var(--cafe-bg-hover)",
        borderRadius: 12, fontSize: isMobile ? 12 : 13, color: "var(--cafe-text-secondary)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        border: "1px solid var(--cafe-border-light)", flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div><strong>Period:</strong> {currentDateRange.label}</div>
          <div style={{ fontSize: isMobile ? 11 : 12, color: "var(--cafe-text-tertiary)" }}>
            {currentPeriodOrders.length} orders in period
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--cafe-border-light)',
              background: autoRefresh ? 'var(--cafe-success-bg)' : 'var(--cafe-bg-surface)',
              color: autoRefresh ? 'var(--cafe-success)' : 'var(--cafe-text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            {autoRefresh ? '🔄' : '⏸️'} Auto-refresh
          </button>
          
          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--cafe-border-light)',
              background: showAdvancedFilters ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
              color: showAdvancedFilters ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            🔍 Filters
          </button>
          
          {/* Comparison mode */}
          <select
            value={comparisonMode}
            onChange={(e) => setComparisonMode(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: '1px solid var(--cafe-border-light)',
              background: 'var(--cafe-bg-surface)',
              color: 'var(--cafe-text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="none">No Comparison</option>
            <option value="previousPeriod">Previous Period</option>
            <option value="sameDayLastWeek">Same Day Last Week</option>
            <option value="sameDayLastYear">Same Day Last Year</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div style={{
          marginBottom: 24,
          padding: 16,
          background: 'var(--cafe-bg-hover)',
          border: '1px solid var(--cafe-border-light)',
          borderRadius: 12,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-tertiary)' }}>Channels</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['WALK_IN', 'SWIGGY', 'ZOMATO'].map(channel => (
                <button
                  key={channel}
                  onClick={() => {
                    setAdvancedFilters(prev => ({
                      ...prev,
                      channels: prev.channels.includes(channel)
                        ? prev.channels.filter(c => c !== channel)
                        : [...prev.channels, channel]
                    }));
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--cafe-border-light)',
                    background: advancedFilters.channels.includes(channel) ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-surface)',
                    color: advancedFilters.channels.includes(channel) ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 11, fontWeight: 600, color: 'var(--cafe-text-tertiary)' }}>Amount Range</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                placeholder="Min"
                value={advancedFilters.minAmount || ''}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAmount: e.target.value ? Number(e.target.value) : null }))}
                style={{
                  width: '80px',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--cafe-border-light)',
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: 11
                }}
              />
              <span style={{ color: 'var(--cafe-text-tertiary' }}>to</span>
              <input
                type="number"
                placeholder="Max"
                value={advancedFilters.maxAmount || ''}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxAmount: e.target.value ? Number(e.target.value) : null }))}
                style={{
                  width: '80px',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--cafe-border-light)',
                  background: 'var(--cafe-bg-surface)',
                  color: 'var(--cafe-text-primary)',
                  fontSize: 11
                }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => setAdvancedFilters({
                channels: [],
                categories: [],
                staff: [],
                tables: [],
                minAmount: null,
                maxAmount: null
              })}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--cafe-border-light)',
                background: 'var(--cafe-bg-surface)',
                color: 'var(--cafe-text-secondary)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Report Navigation */}
      <div style={{ display: "flex", gap: isMobile ? 4 : 6, flexWrap: "wrap", paddingBottom: 6, marginBottom: isMobile ? 16 : 24 }}>
        {REPORT_SECTIONS.map(section => {
          const count = sectionCounts[section.id] || 0;
          const isActive = activeSection === section.id;
          return (
            <button key={section.id} type="button" aria-pressed={isActive}
              onClick={() => setActiveSection(section.id)}
              style={{ 
                padding: isMobile ? "8px 12px" : "10px 16px", borderRadius: 10, border: "none",
                background: isActive ? "var(--cafe-accent)" : "transparent",
                color: isActive ? "#1A1208" : "var(--cafe-text-secondary)",
                fontSize: isMobile ? 11 : 13, cursor: "pointer", fontWeight: isActive ? 700 : 500,
                whiteSpace: "nowrap", transition: "all .18s",
                display: "flex", alignItems: "center", gap: 6, position: "relative",
              }}
            >
              <span style={{ fontSize: isMobile ? 12 : 14 }}>{section.icon}</span>
              {section.label}
              {count > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: isMobile ? 16 : 18, height: isMobile ? 16 : 18, borderRadius: isMobile ? 8 : 9, fontSize: isMobile ? 9 : 10, fontWeight: 800,
                  background: isActive ? "rgba(26,18,8,0.2)" : "var(--cafe-accent-bg)",
                  color: isActive ? "#1A1208" : "var(--cafe-accent)", padding: "0 4px",
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      {currentPeriodOrders.length === 0 ? (
        <EmptyState message={`No orders recorded for ${  currentDateRange.label.toLowerCase()  }. Select a different date range to view analytics.`} />
      ) : (
        <>
          {activeSection === 'overview' && (
            <OverviewSection currentKPIs={currentKPIs} comparison={comparison} channelPerformance={channelPerformance} menuPerformance={menuPerformance} currentPeriodOrders={currentPeriodOrders} isMobile={isMobile} formatCurrency={formatCurrency} formatComparison={formatComparison} />
          )}
          {activeSection === 'sales' && (
            <SalesSection currentKPIs={currentKPIs} comparison={comparison} channelPerformance={channelPerformance} isMobile={isMobile} formatCurrency={formatCurrency} formatComparison={formatComparison} />
          )}
          {activeSection === 'orders' && (
            <OrdersSection currentKPIs={currentKPIs} comparison={comparison} orders={currentPeriodOrders} isMobile={isMobile} formatCurrency={formatCurrency} formatComparison={formatComparison} />
          )}
          {activeSection === 'menu' && (
            <MenuSection menuPerformance={menuPerformance} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'channels' && (
            <ChannelsSection channelPerformance={channelPerformance} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'customers' && (
            <CustomersSection customerPerformance={customerPerformance} newVsReturning={newVsReturning} isMobile={isMobile} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'payments' && (
            <PaymentsSection paymentBreakdown={paymentBreakdown} currentKPIs={currentKPIs} isMobile={isMobile} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'staff' && (
            <StaffSection staffPerformance={staffPerformance} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'categories' && (
            <CategoriesSection categoryPerformance={categoryPerformance} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'profitability' && (
            <ProfitabilitySection profitability={currentKPIs.profitability} currentKPIs={currentKPIs} isMobile={isMobile} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'tables' && (
            <TablesSection tablePerformance={tablePerformance} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'delivery' && (
            <DeliverySection deliveryPerformance={deliveryPerformance} />
          )}
          {activeSection === 'inventory' && (
            <InventorySection inventoryPerformance={inventoryPerformance} />
          )}
          {activeSection === 'purchasing' && (
            <PurchasingSection purchasingPerformance={purchasingPerformance} formatCurrency={formatCurrency} />
          )}
          {activeSection === 'production' && (
            <ProductionSection productionPerformance={productionPerformance} isMobile={isMobile} />
          )}
          {activeSection === 'documents' && (
            <DocumentsSection documentStats={documentStats} isMobile={isMobile} />
          )}
          {activeSection === 'history' && (
            <HistorySection isMobile={isMobile} />
          )}
        </>
      )}

      {/* Export Dialog */}
      {exportDialog.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--cafe-bg-card)', padding: 24, borderRadius: 'var(--cafe-radius-md)', maxWidth: 400, width: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Export Report</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 500 }}>Format</label>
              <select value={exportDialog.format} onChange={(e) => setExportDialog({ ...exportDialog, format: e.target.value })}
                style={{ width: '100%', padding: 8, borderRadius: 'var(--cafe-radius-sm)', border: '1px solid var(--cafe-border)', background: 'var(--cafe-bg-surface)', color: 'var(--cafe-text-primary)' }}>
                <option value="csv">CSV</option>
                <option value="xlsx">XLSX (Tab-separated)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setExportDialog({ open: false, format: 'csv' })}
                style={{ background: 'transparent', border: '1px solid var(--cafe-border-light)', borderRadius: 'var(--cafe-radius-sm)', color: 'var(--cafe-text-primary)', padding: '8px 16px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => handleExport(exportDialog.format)} disabled={isExporting}
                style={{ background: 'var(--cafe-primary)', border: '1px solid var(--cafe-primary)', borderRadius: 'var(--cafe-radius-sm)', color: 'var(--cafe-text-primary)', padding: '8px 16px', opacity: isExporting ? 0.5 : 1, cursor: isExporting ? 'not-allowed' : 'pointer' }}>
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drill-down Modal */}
      {drillDownMetric && (
        <DrillDownModal
          isOpen={!!drillDownMetric}
          onClose={() => setDrillDownMetric(null)}
          metric={drillDownMetric}
          data={null}
          formatCurrency={formatCurrency}
        />
      )}

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

// ─── Helper: channel color ────────────────────────────────────────────────────
function channelColor(source) {
  if (source === 'WALK_IN') return "var(--cafe-success)";
  if (source === 'SWIGGY')  return "#FF6B35";
  if (source === 'ZOMATO')  return "#E8344E";
  return "var(--cafe-info)";
}

// ─── Overview Section ─────────────────────────────────────────────────────────
function OverviewSection({ currentKPIs, comparison, channelPerformance, menuPerformance, currentPeriodOrders, isMobile, formatCurrency, formatComparison }) {
  const salesComparison  = formatComparison(comparison?.netSales);
  const ordersComparison = formatComparison(comparison?.orders);
  const aovComparison    = formatComparison(comparison?.averageOrderValue);

  // Hourly revenue breakdown (24 slots)
  const hourlyRevenue = useMemo(() => {
    const slots = Array.from({ length: 24 }, (_, h) => ({ hour: h, revenue: 0, count: 0 }));
    (currentPeriodOrders || []).forEach(o => {
      try {
        const d = new Date(o.createdAt);
        if (isNaN(d)) return;
        const h = d.getHours();
        slots[h].revenue += Number(o.total || o.amount || 0);
        slots[h].count += 1;
      } catch (_) {
        // Skip invalid orders
      }
    });
    return slots;
  }, [currentPeriodOrders]);

  const maxHourlyRevenue = Math.max(...hourlyRevenue.map(s => s.revenue), 1);
  const channelMax = Math.max(...channelPerformance.map(c => c.grossSales || 0), 1);
  const menuMax = Math.max(...menuPerformance.slice(0,5).map(m => m.grossSales || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Cards with drill-down */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard 
          label="Net Sales" 
          value={formatCurrency(currentKPIs.sales.netSales)} 
          change={salesComparison.display}  
          isPositive={salesComparison.isPositive} 
          isMobile={isMobile}
          onClick={() => setDrillDownMetric({ label: 'Net Sales', value: currentKPIs.sales.netSales })}
        />
        <KPICard 
          label="Orders" 
          value={currentKPIs.orders.total} 
          change={ordersComparison.display} 
          isPositive={ordersComparison.isPositive} 
          isMobile={isMobile}
          onClick={() => setDrillDownMetric({ label: 'Total Orders', value: currentKPIs.orders.total })}
        />
        <KPICard 
          label="Avg Order Value" 
          value={formatCurrency(currentKPIs.sales.averageOrderValue)} 
          change={aovComparison.display}    
          isPositive={aovComparison.isPositive} 
          isMobile={isMobile}
          onClick={() => setDrillDownMetric({ label: 'Average Order Value', value: currentKPIs.sales.averageOrderValue })}
        />
        <KPICard 
          label="Completion Rate" 
          value={`${currentKPIs.orders.completionRate.toFixed(1)}%`}      
          change={formatComparison(comparison?.completionRate).display} 
          isPositive={true} 
          isMobile={isMobile}
        />
        <KPICard 
          label="Refunds" 
          value={formatCurrency(currentKPIs.sales.refunds)}               
          change="—"                        
          isPositive={false} 
          isMobile={isMobile}
          onClick={() => setDrillDownMetric({ label: 'Total Refunds', value: currentKPIs.sales.refunds })}
        />
        <KPICard 
          label="Tax Collected"   
          value={formatCurrency(currentKPIs.sales.taxCollected)}          
          change="—"                        
          isPositive={true} 
          isMobile={isMobile}
          onClick={() => setDrillDownMetric({ label: 'Tax Collected', value: currentKPIs.sales.taxCollected })}
        />
      </div>

      {/* Hourly Revenue Chart - Interactive Line Chart */}
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 14 }}>
          Hourly Revenue Trend
        </div>
        <InteractiveLineChart 
          data={hourlyRevenue.map(s => ({ label: `${s.hour}:00`, value: s.revenue }))}
          height={180}
          onPointClick={(point) => console.log('Hour clicked:', point)}
        />
      </div>

      {/* Channel Breakdown - Interactive Pie Chart */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 24 }}>
        <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>
            Sales by Channel
          </div>
          {channelPerformance.length === 0 ? <EmptyState message="No channel data available" /> : (
            <InteractivePieChart
              data={channelPerformance.map(c => ({ label: c.name, value: c.grossSales, color: channelColor(c.source) }))}
              size={200}
              onSliceClick={(slice) => console.log('Channel clicked:', slice)}
            />
          )}
        </div>

        <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>
            Channel Details
          </div>
          {channelPerformance.length === 0 ? <EmptyState message="No channel data available" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {channelPerformance.map((channel, idx) => (
                <div key={channel.source} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: idx < channelPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 5, background: channelColor(channel.source), flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{channel.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{channel.orders} orders · {formatCurrency(channel.averageOrderValue)} avg</div>
                    <ProgressBar value={channel.grossSales} max={channelMax} color={channelColor(channel.source)} height={5} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(channel.grossSales)}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{channel.revenueShare.toFixed(1)}% share</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Items */}
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>
          Top Selling Items
        </div>
        {menuPerformance.length === 0 ? <EmptyState message="No menu data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {menuPerformance.slice(0, 5).map((item, idx) => {
              const medals = ['🏆','🥈','🥉'];
              const badge = medals[idx] || null;
              return (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: idx < Math.min(5, menuPerformance.length) - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: idx === 0 ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: badge ? 15 : 11, color: idx === 0 ? "var(--cafe-accent)" : "var(--cafe-text-tertiary)", fontFamily: "monospace", fontWeight: 800, flexShrink: 0 }}>
                    {badge || (idx + 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{item.category} · {item.quantitySold} sold</div>
                    <ProgressBar value={item.grossSales} max={menuMax} height={4} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(item.grossSales)}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(item.averagePrice)} avg</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sales Section ────────────────────────────────────────────────────────────
function SalesSection({ currentKPIs, comparison, channelPerformance, isMobile, formatCurrency, formatComparison }) {
  const grossSalesComparison = formatComparison(comparison?.grossSales);
  const netSalesComparison   = formatComparison(comparison?.netSales);
  const refundsComparison    = formatComparison(comparison?.refunds);
  const _channelMax = Math.max(...channelPerformance.map(c => c.grossSales || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Gross Sales"     value={formatCurrency(currentKPIs.sales.grossSales)}    change={grossSalesComparison.display} isPositive={grossSalesComparison.isPositive} isMobile={isMobile} />
        <KPICard label="Net Sales"       value={formatCurrency(currentKPIs.sales.netSales)}       change={netSalesComparison.display}   isPositive={netSalesComparison.isPositive} isMobile={isMobile} />
        <KPICard label="Tax Collected"   value={formatCurrency(currentKPIs.sales.taxCollected)}   change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Total Collected" value={formatCurrency(currentKPIs.sales.totalCollected)} change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Outstanding"     value={formatCurrency(currentKPIs.sales.outstanding)}    change="—" isPositive={false} isMobile={isMobile} />
        <KPICard label="Refunds"         value={formatCurrency(currentKPIs.sales.refunds)}        change={refundsComparison.display}    isPositive={false} isMobile={isMobile} />
      </div>

      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Sales by Channel</div>
        {channelPerformance.length === 0 ? <EmptyState message="No channel data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {channelPerformance.map((channel, idx) => (
              <div key={channel.source} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < channelPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{channel.name}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{channel.orders} orders · {formatCurrency(channel.averageOrderValue)} avg</div>
                  <ProgressBar value={channel.revenueShare} max={100} color={channelColor(channel.source)} height={5} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(channel.grossSales)}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{channel.revenueShare.toFixed(1)}% share</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────
function OrdersSection({ currentKPIs, comparison, orders, isMobile, formatCurrency, formatComparison }) {
  const ordersComparison      = formatComparison(comparison?.orders);
  const completionComparison  = formatComparison(comparison?.completionRate);
  const cancellationComparison= formatComparison(comparison?.cancellationRate);

  // Status breakdown counts
  const statusCounts = useMemo(() => {
    const counts = {};
    (orders || []).forEach(o => {
      const s = o.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [orders]);

  const statusColors = { COMPLETED: "var(--cafe-success)", CANCELLED: "var(--cafe-danger)", OPEN: "var(--cafe-info)", PENDING: "var(--cafe-warning)", REFUNDED: "#a855f7" };
  const totalOrders = orders.length || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Total Orders"     value={currentKPIs.orders.total}                              change={ordersComparison.display}      isPositive={ordersComparison.isPositive} isMobile={isMobile} />
        <KPICard label="Completed"        value={currentKPIs.orders.completed}                          change="—"                             isPositive={true} isMobile={isMobile} />
        <KPICard label="Cancelled"        value={currentKPIs.orders.cancelled}                          change="—"                             isPositive={false} isMobile={isMobile} />
        <KPICard label="Completion Rate"  value={`${currentKPIs.orders.completionRate.toFixed(1)  }%`}    change={completionComparison.display}  isPositive={true} isMobile={isMobile} />
        <KPICard label="Cancellation Rate"value={`${currentKPIs.orders.cancellationRate.toFixed(1)  }%`}  change={cancellationComparison.display} isPositive={cancellationComparison.isPositive} isMobile={isMobile} />
        <KPICard label="Open Orders"      value={currentKPIs.orders.open}                               change="—"                             isPositive={true} isMobile={isMobile} />
      </div>

      {/* Order Status Breakdown — pie-style row */}
      {statusCounts.length > 0 && (
        <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 14 }}>
            Order Status Breakdown
          </div>
          {/* Stacked bar */}
          <div style={{ display: "flex", height: 18, borderRadius: 9, overflow: "hidden", marginBottom: 14, gap: 1 }}>
            {statusCounts.map(([status, count]) => {
              const pct = (count / totalOrders) * 100;
              const color = statusColors[status] || "var(--cafe-text-tertiary)";
              return (
                <div key={status} title={`${status}: ${count} (${pct.toFixed(1)}%)`}
                  style={{ width: `${pct}%`, background: color, minWidth: 2 }} />
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {statusCounts.map(([status, count]) => {
              const pct = (count / totalOrders) * 100;
              const color = statusColors[status] || "var(--cafe-text-tertiary)";
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--cafe-text-secondary)", fontWeight: 600 }}>{status}</span>
                  <span style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontFamily: "monospace" }}>{count} ({pct.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Orders Table */}
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22, overflowX: "auto" }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Recent Orders</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
              {["Order ID","Date","Customer","Source","Status","Amount"].map((h, i) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: i === 5 ? "right" : "left", fontWeight: 700, color: "var(--cafe-text-tertiary)", fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 20).map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 500 }}>{order.id}</td>
                <td style={{ padding: "10px 12px" }}>{formatDate(order.createdAt, 'short')}</td>
                <td style={{ padding: "10px 12px" }}>{order.customer?.name || order.customerName || 'Guest'}</td>
                <td style={{ padding: "10px 12px" }}>{order.source}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: statusColors[order.status] ? `${statusColors[order.status]  }22` : "var(--cafe-bg-surface)", color: statusColors[order.status] || "var(--cafe-text-tertiary)", fontWeight: 700 }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatCurrency(order.total || order.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Menu Section ─────────────────────────────────────────────────────────────
function MenuSection({ menuPerformance, formatCurrency }) {
  const medals = ['🏆','🥈','🥉'];
  const maxSales = Math.max(...menuPerformance.map(m => m.grossSales || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Menu Performance</div>
        {menuPerformance.length === 0 ? <EmptyState message="No menu data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {menuPerformance.map((item, idx) => {
              const isTop3 = idx < 3;
              const isZero = item.quantitySold === 0;
              const isVeryLow = !isZero && item.quantitySold <= 2 && menuPerformance.length > 3;
              return (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: idx < menuPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: isTop3 ? "var(--cafe-accent-bg)" : "var(--cafe-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isTop3 ? 15 : 11, fontFamily: "monospace", fontWeight: 800, flexShrink: 0 }}>
                    {isTop3 ? medals[idx] : (idx + 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                      {isZero && <span title="No sales this period" style={{ fontSize: 11, background: "var(--cafe-danger-bg)", color: "var(--cafe-danger)", borderRadius: 5, padding: "2px 6px" }}>⚠ 0 sold</span>}
                      {isVeryLow && <span title="Very low sales" style={{ fontSize: 11, background: "var(--cafe-warning-bg)", color: "var(--cafe-warning)", borderRadius: 5, padding: "2px 6px" }}>⚠ low</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{item.category} · {item.quantitySold} sold</div>
                    <ProgressBar value={item.grossSales} max={maxSales} height={4} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(item.grossSales)}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(item.averagePrice)} avg</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Channels Section ─────────────────────────────────────────────────────────
function ChannelsSection({ channelPerformance, formatCurrency }) {
  const _maxSales = Math.max(...channelPerformance.map(c => c.grossSales || 0), 1);
  const maxOrders = Math.max(...channelPerformance.map(c => c.orders || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 10 }}>Channel Performance</div>
        {/* Mini bar chart of orders per channel */}
        {channelPerformance.length > 0 && (
          <MiniBarChart
            items={channelPerformance.map(c => ({ label: c.name, value: c.orders, color: channelColor(c.source) }))}
            maxValue={maxOrders}
            height={40}
          />
        )}
        <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "16px 0" }} />
        {channelPerformance.length === 0 ? <EmptyState message="No channel data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {channelPerformance.map((channel, idx) => (
              <div key={channel.source} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < channelPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{channel.name}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{channel.orders} orders · {formatCurrency(channel.averageOrderValue)} avg</div>
                  <ProgressBar value={channel.revenueShare} max={100} color={channelColor(channel.source)} height={5} />
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{channel.revenueShare.toFixed(1)}% revenue share</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(channel.grossSales)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Customers Section ────────────────────────────────────────────────────────
function CustomersSection({ customerPerformance, newVsReturning, isMobile, formatCurrency }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="New Customers"         value={newVsReturning.newCustomerCount}               change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Returning Customers"   value={newVsReturning.returningCustomerCount}          change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="New Customer Sales"    value={formatCurrency(newVsReturning.newCustomerSales)}      change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Returning Sales"       value={formatCurrency(newVsReturning.returningCustomerSales)} change="—" isPositive={true} isMobile={isMobile} />
      </div>

      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Top Customers</div>
        {customerPerformance.length === 0 ? <EmptyState message="No customer data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {customerPerformance.slice(0, 20).map((customer, idx) => (
              <div key={customer.id || customer.phone} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: idx < Math.min(20, customerPerformance.length) - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customer.name}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{customer.orderCount} orders · {formatDate(customer.lastOrderDate, 'short')}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(customer.totalSpend)}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(customer.averageOrderValue)} avg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Payments Section ─────────────────────────────────────────────────────────
function PaymentsSection({ paymentBreakdown, currentKPIs, isMobile, formatCurrency }) {
  const maxAmount = Math.max(...paymentBreakdown.map(p => p.amountCollected || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Total Collected" value={formatCurrency(currentKPIs.sales.totalCollected)} change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Outstanding"     value={formatCurrency(currentKPIs.sales.outstanding)}    change="—" isPositive={false} isMobile={isMobile} />
        <KPICard label="Tax Collected"   value={formatCurrency(currentKPIs.sales.taxCollected)}   change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Refunds"         value={formatCurrency(currentKPIs.sales.refunds)}        change="—" isPositive={false} isMobile={isMobile} />
      </div>

      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 10 }}>Payment Methods</div>
        {paymentBreakdown.length > 0 && (
          <MiniBarChart
            items={paymentBreakdown.map(p => ({ label: p.name, value: p.amountCollected }))}
            maxValue={maxAmount}
            height={40}
          />
        )}
        <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "16px 0" }} />
        {paymentBreakdown.length === 0 ? <EmptyState message="No payment data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {paymentBreakdown.map((payment, idx) => (
              <div key={payment.method} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < paymentBreakdown.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{payment.name}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{payment.transactionCount} transactions</div>
                  <ProgressBar value={payment.share} max={100} height={5} />
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{payment.share.toFixed(1)}% share</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(payment.amountCollected)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Staff Section ────────────────────────────────────────────────────────────
function StaffSection({ staffPerformance, formatCurrency }) {
  const maxSales = Math.max(...staffPerformance.map(s => s.salesProcessed || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 10 }}>Staff Performance</div>
        {staffPerformance.length > 0 && (
          <MiniBarChart
            items={staffPerformance.map(s => ({ label: s.staffName, value: s.salesProcessed }))}
            maxValue={maxSales}
            height={40}
          />
        )}
        <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "16px 0" }} />
        {staffPerformance.length === 0 ? <EmptyState message="No staff data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staffPerformance.map((s, idx) => (
              <div key={s.staffId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < staffPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{s.staffName}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{s.ordersHandled} orders handled</div>
                  <ProgressBar value={s.salesProcessed} max={maxSales} height={4} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(s.salesProcessed)}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(s.averageOrderValue)} avg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Categories Section ───────────────────────────────────────────────────────
function CategoriesSection({ categoryPerformance, formatCurrency }) {
  const maxSales = Math.max(...categoryPerformance.map(c => c.grossSales || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 10 }}>Category Performance</div>
        {categoryPerformance.length > 0 && (
          <MiniBarChart
            items={categoryPerformance.map(c => ({ label: c.category, value: c.grossSales }))}
            maxValue={maxSales}
            height={40}
          />
        )}
        <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "16px 0" }} />
        {categoryPerformance.length === 0 ? <EmptyState message="No category data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryPerformance.map((category, idx) => (
              <div key={category.category} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < categoryPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{category.category}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{category.quantitySold} items sold</div>
                  <ProgressBar value={category.orderShare} max={100} height={5} />
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{category.orderShare.toFixed(1)}% share</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(category.grossSales)}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(category.averagePrice)} avg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Profitability Section ────────────────────────────────────────────────────
function ProfitabilitySection({ profitability, currentKPIs, isMobile, formatCurrency }) {
  const cogs         = profitability && profitability.estimatedCOGS !== undefined ? profitability.estimatedCOGS : 0;
  const grossProfit  = profitability && profitability.grossProfit !== undefined ? profitability.grossProfit : 0;
  const marginPercent= currentKPIs.sales.netSales > 0 ? (grossProfit / currentKPIs.sales.netSales) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Net Sales"       value={formatCurrency(currentKPIs.sales.netSales)} change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Estimated COGS"  value={formatCurrency(cogs)}                      change="—" isPositive={false} isMobile={isMobile} />
        <KPICard label="Gross Profit"    value={formatCurrency(grossProfit)}               change="—" isPositive={grossProfit >= 0} isMobile={isMobile} />
        <KPICard label="Gross Margin"    value={`${marginPercent.toFixed(1)  }%`}             change="—" isPositive={marginPercent >= 0} isMobile={isMobile} />
      </div>

      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Profitability Summary</div>
        <div style={{ fontSize: 14, color: "var(--cafe-text-secondary)", lineHeight: 1.7 }}>
          {[
            { label: "Net Sales",       val: formatCurrency(currentKPIs.sales.netSales) },
            { label: "Estimated COGS",  val: `${formatCurrency(cogs)  } (calculated from menu item costs)` },
            { label: "Gross Profit",    val: `${formatCurrency(grossProfit)  } (Net Sales - COGS)` },
            { label: "Gross Margin",    val: `${marginPercent.toFixed(1)  }% (Gross Profit / Net Sales)` },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 10 }}><strong>{r.label}:</strong> {r.val}</div>
          ))}
          <div style={{ marginTop: 18, fontSize: 12, color: "var(--cafe-text-tertiary)" }}>
            Note: COGS is estimated based on menu item cost data. Actual costs may vary.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tables Section ───────────────────────────────────────────────────────────
function TablesSection({ tablePerformance, formatCurrency }) {
  const maxSpend = Math.max(...tablePerformance.map(t => t.totalSpend || 0), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 10 }}>Table Performance</div>
        {tablePerformance.length > 0 && (
          <MiniBarChart
            items={tablePerformance.map(t => ({ label: t.tableName, value: t.totalSpend }))}
            maxValue={maxSpend}
            height={40}
          />
        )}
        <div style={{ height: 1, background: "var(--cafe-border-light)", margin: "16px 0" }} />
        {tablePerformance.length === 0 ? <EmptyState message="No table data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tablePerformance.map((table, idx) => (
              <div key={table.tableId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < tablePerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{table.tableName}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{table.orders} orders · {table.averageGuests.toFixed(1)} avg guests</div>
                  <ProgressBar value={table.totalSpend} max={maxSpend} height={4} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(table.totalSpend)}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(table.averageSpend)} avg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delivery Section ─────────────────────────────────────────────────────────
function DeliverySection({ deliveryPerformance }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Delivery Performance</div>
        {deliveryPerformance.length === 0 ? <EmptyState message="No delivery data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {deliveryPerformance.map((driver, idx) => (
              <div key={driver.driverId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < deliveryPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{driver.driverName}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>
                    {driver.deliveries} deliveries · {driver.onTimeRate.toFixed(1)}% on-time
                  </div>
                  <ProgressBar value={driver.onTimeRate} max={100} color="var(--cafe-success)" height={4} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>
                    {driver.averageDeliveryTime ? `${driver.averageDeliveryTime.toFixed(1)  }m` : 'N/A'}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{driver.completionRate.toFixed(1)}% complete</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inventory Section ────────────────────────────────────────────────────────
function InventorySection({ inventoryPerformance }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Inventory Performance</div>
        {inventoryPerformance.length === 0 ? <EmptyState message="No inventory data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {inventoryPerformance.map((item, idx) => (
              <div key={item.itemId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < inventoryPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.isOutOfStock ? "var(--cafe-danger)" : item.isLowStock ? "var(--cafe-warning)" : "var(--cafe-success)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{item.totalUsed} used · {item.currentStock} {item.unit} in stock</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: item.isOutOfStock ? "var(--cafe-danger)" : item.isLowStock ? "var(--cafe-warning)" : "var(--cafe-success)", fontWeight: 600 }}>
                    {item.isOutOfStock ? 'Out of Stock' : item.isLowStock ? 'Low Stock' : 'In Stock'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Purchasing Section ───────────────────────────────────────────────────────
function PurchasingSection({ purchasingPerformance, formatCurrency }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Purchasing Performance</div>
        {purchasingPerformance.length === 0 ? <EmptyState message="No purchasing data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {purchasingPerformance.map((supplier, idx) => (
              <div key={supplier.supplierId} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < purchasingPerformance.length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{supplier.supplierName}</div>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", marginTop: 3 }}>{supplier.orders} orders · {supplier.onTimeRate.toFixed(1)}% on-time</div>
                  <ProgressBar value={supplier.onTimeRate} max={100} color="var(--cafe-info)" height={4} />
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{formatCurrency(supplier.totalAmount)}</div>
                  <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{formatCurrency(supplier.averageOrderValue)} avg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Production Section ───────────────────────────────────────────────────────
function ProductionSection({ productionPerformance, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Total Batches"  value={productionPerformance.totalBatches}               change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Completed"      value={productionPerformance.completedBatches}            change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="In Progress"    value={productionPerformance.inProgressBatches}           change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Failed"         value={productionPerformance.failedBatches}               change="—" isPositive={false} isMobile={isMobile} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Average Yield"  value={`${productionPerformance.averageYield.toFixed(1)}%`} change="—" isPositive={true} isMobile={isMobile} />
        <KPICard label="Waste Rate"     value={`${productionPerformance.wasteRate.toFixed(1)}%`}    change="—" isPositive={false} isMobile={isMobile} />
      </div>
    </div>
  );
}

// ─── Documents Section ────────────────────────────────────────────────────────
function DocumentsSection({ documentStats, isMobile }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(180px,1fr))", gap: isMobile ? 10 : 14 }}>
        <KPICard label="Total Documents" value={documentStats.totalDocuments} change="—" isPositive={true} isMobile={isMobile} />
      </div>

      <div style={{ background: "var(--cafe-bg-hover)", border: "1px solid var(--cafe-border-light)", borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 18 }}>Documents by Type</div>
        {Object.keys(documentStats.byType).length === 0 ? <EmptyState message="No document data available" /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(documentStats.byType).map(([type, count], idx) => {
              const total = documentStats.totalDocuments || 1;
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: idx < Object.keys(documentStats.byType).length - 1 ? "1px solid var(--cafe-border-light)" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--cafe-text-primary)" }}>{type}</div>
                    <ProgressBar value={count} max={total} height={4} />
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace", color: "var(--cafe-accent)" }}>{count}</div>
                    <div style={{ fontSize: 11, color: "var(--cafe-text-tertiary)" }}>{((count / total) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── History Section ──────────────────────────────────────────────────────────
function HistorySection({ isMobile }) {
  const [archivedDays, setArchivedDays] = useState([]);
  const [selectedDay, setSelectedDay]   = useState("");
  const [archivedData, setArchivedData] = useState(null);
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    const days = DailyArchive.getArchivedDays();
    setTimeout(() => {
      setArchivedDays(days);
      if (days.length > 0) setSelectedDay(days[0]);
    }, 0);
  }, []);

  useEffect(() => {
    if (selectedDay) {
      const orders = DailyArchive.getArchivedOrders(selectedDay);
      setTimeout(() => {
        setArchivedData(DailyArchive.summarizeOrders(orders));
      }, 0);
    }
  }, [selectedDay]);

  const rs = (v) => `₹${  Number(v).toLocaleString('en-IN')}`;

  // Build a monthly comparison mini-table from all archived days
  // (hooks must be called before any conditional return)
  const monthlyComparison = useMemo(() => {
    const byMonth = {};
    archivedDays.forEach(day => {
      try {
        const d = new Date(day);
        if (isNaN(d)) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const orders = DailyArchive.getArchivedOrders(day);
        const summary = DailyArchive.summarizeOrders(orders);
        if (!byMonth[key]) byMonth[key] = { month: key, revenue: 0, orders: 0, days: 0 };
        byMonth[key].revenue += summary?.totalRevenue || 0;
        byMonth[key].orders  += summary?.completedOrders || 0;
        byMonth[key].days    += 1;
      } catch (_) {
        // Skip invalid archive entries
      }
    });
    return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));
  }, [archivedDays]);

  const maxMonthRevenue = Math.max(...monthlyComparison.map(m => m.revenue), 1);

  if (archivedDays.length === 0) {
    return <EmptyState message="No historical archives found yet. Previous days' data will appear here automatically." icon="🕰️" />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Monthly Comparison Table */}
      {monthlyComparison.length > 1 && (
        <div style={{ background: "var(--cafe-bg-card)", border: "1px solid var(--cafe-border-light)", borderRadius: "var(--cafe-radius-md)", padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--cafe-text-tertiary)", marginBottom: 16 }}>Monthly Comparison</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                  {["Month","Revenue","Orders","Avg/Day","Bar"].map((h, i) => (
                    <th key={h} style={{ padding: "8px", textAlign: i >= 1 ? "right" : "left", fontWeight: 600, color: "var(--cafe-text-tertiary)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyComparison.map((m, idx) => {
                  const barPct = maxMonthRevenue > 0 ? (m.revenue / maxMonthRevenue) * 100 : 0;
                  const prevRevenue = monthlyComparison[idx + 1]?.revenue;
                  const trend = prevRevenue ? (m.revenue > prevRevenue ? '↑' : m.revenue < prevRevenue ? '↓' : '→') : '—';
                  const trendColor = trend === '↑' ? "var(--cafe-success)" : trend === '↓' ? "var(--cafe-danger)" : "var(--cafe-text-tertiary)";
                  return (
                    <tr key={m.month} style={{ borderBottom: "1px solid var(--cafe-border-light)" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 600, color: "var(--cafe-text-primary)" }}>
                        {m.month}
                        <span style={{ marginLeft: 6, fontSize: 12, color: trendColor }}>{trend}</span>
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--cafe-accent)" }}>{rs(m.revenue)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{m.orders}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace" }}>{m.days > 0 ? rs(Math.round(m.revenue / m.days)) : '—'}</td>
                      <td style={{ padding: "10px 8px", width: 80 }}>
                        <div style={{ background: "var(--cafe-bg-surface)", borderRadius: 4, overflow: "hidden", height: 8 }}>
                          <div style={{ width: `${barPct}%`, height: "100%", background: "var(--cafe-accent)", borderRadius: 4 }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div style={{ marginBottom: 4 }}>
        <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600 }}>Select Date Archive:</label>
        <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)}
          style={{ padding: 8, borderRadius: 6, border: "1px solid var(--cafe-border)", background: "var(--cafe-bg-surface)", color: "var(--cafe-text-primary)", minWidth: 200 }}>
          {archivedDays.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {archivedData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
            <KPICard label="Total Revenue"     value={rs(archivedData.totalRevenue)}    change={0} isPositive={true} />
            <KPICard label="Completed Orders"  value={archivedData.completedOrders}     change={0} isPositive={true} />
            <KPICard label="Cancelled Orders"  value={archivedData.cancelledOrders}     change={0} isPositive={false} />
            <KPICard label="Avg Order Value"   value={rs(archivedData.avgOrderValue)}   change={0} isPositive={true} />
          </div>

          <div style={{ background: "var(--cafe-bg-card)", padding: 20, borderRadius: "var(--cafe-radius-lg)", border: "1px solid var(--cafe-border-light)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16 }}>Payment Breakdown</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
              {Object.entries(archivedData.paymentBreakdown).map(([method, amount]) => (
                <div key={method} style={{ background: "var(--cafe-bg-surface)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--cafe-text-tertiary)", fontWeight: 600 }}>{method}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, fontFamily: "monospace" }}>{rs(amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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

export default AnalyticsReports;
