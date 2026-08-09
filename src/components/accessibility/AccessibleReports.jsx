/**
 * AccessibleReports.jsx
 * Accessibility wrapper for Reports and Analytics components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for report viewing
 */

import {
  AccessibleCard,
  AccessibleList,
  AccessibleButton,
  AccessibleTabs,
  AccessibleTabPanel,
  AccessibleLiveRegion,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleReports - Main reports wrapper with full accessibility
 */
export const AccessibleReports = ({ children, title = "Reports and Analytics" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="reports-content" />
      <div role="main" id="reports-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleReportCard - Report card with accessibility
 */
export const AccessibleReportCard = ({ 
  report, 
  onClick, 
  isSelected = false 
}) => {
  const ariaLabel = `${report.title}, ${report.description}, last updated ${report.lastUpdated}`;

  return (
    <AccessibleCard
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px' }}>
        {report.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{report.icon}</span>}
        {report.title}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
        {report.description}
      </div>
      <div style={{ fontSize: '10px', color: '#999' }} aria-label={`Last updated ${report.lastUpdated}`}>
        Updated: {report.lastUpdated}
      </div>
    </AccessibleCard>
  );
};

/**
 * AccessibleReportGrid - Grid of reports with accessibility
 */
export const AccessibleReportGrid = ({ reports, onReportSelect, ariaLabel = "Available reports" }) => {
  return (
    <AccessibleList 
      ariaLabel={ariaLabel} 
      isGrid={true}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px',
      }}
    >
      {reports.map(report => (
        <AccessibleReportCard
          key={report.id}
          report={report}
          onClick={() => onReportSelect?.(report.id)}
        />
      ))}
    </AccessibleList>
  );
};

/**
 * AccessibleReportFilter - Filter controls for reports
 */
export const AccessibleReportFilter = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  ariaLabel = "Filter reports" 
}) => {
  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}
    >
      {filters.map(filter => (
        <AccessibleButton
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          ariaLabel={`Filter by ${filter.label}`}
          aria-pressed={activeFilter === filter.id}
          style={{
            padding: '8px 16px',
            backgroundColor: activeFilter === filter.id ? '#E63946' : '#FFFFFF',
            color: activeFilter === filter.id ? '#FFFFFF' : '#1A1A1A',
            border: '2px solid #E63946',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {filter.icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{filter.icon}</span>}
          {filter.label}
        </AccessibleButton>
      ))}
    </nav>
  );
};

/**
 * AccessibleReportTabs - Tab navigation for report views
 */
export const AccessibleReportTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  ariaLabel = "Report views" 
}) => {
  return (
    <AccessibleTabs
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={onTabChange}
      ariaLabel={ariaLabel}
    />
  );
};

/**
 * AccessibleReportPanel - Panel content for report tabs
 */
export const AccessibleReportPanel = ({ 
  children, 
  tabId, 
  isActive, 
  ariaLabel 
}) => {
  return (
    <AccessibleTabPanel
      tabId={tabId}
      isActive={isActive}
      ariaLabel={ariaLabel}
    >
      {children}
    </AccessibleTabPanel>
  );
};

/**
 * AccessibleDataTable - Data table with accessibility
 */
export const AccessibleDataTable = ({ 
  columns, 
  data, 
  onRowClick,
  ariaLabel = "Data table" 
}) => {
  return (
    <div
      role="table"
      aria-label={ariaLabel}
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px',
      }}
    >
      <div role="rowgroup">
        <div role="row" style={{ display: 'flex', borderBottom: '2px solid #E63946' }}>
          {columns.map(column => (
            <div
              key={column.key}
              role="columnheader"
              style={{
                flex: column.flex || 1,
                padding: '8px',
                fontWeight: '800',
                backgroundColor: '#E63946',
                color: '#FFFFFF',
              }}
            >
              {column.label}
            </div>
          ))}
        </div>
      </div>
      <div role="rowgroup">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            role="row"
            onClick={() => onRowClick?.(row)}
            style={{
              display: 'flex',
              borderBottom: '1px solid #E5E7EB',
              cursor: onRowClick ? 'pointer' : 'default',
              backgroundColor: rowIndex % 2 === 0 ? '#FFFFFF' : '#F8F9FA',
            }}
            tabIndex={onRowClick ? 0 : undefined}
            aria-label={`Row ${rowIndex + 1}`}
          >
            {columns.map(column => (
              <div
                key={column.key}
                role="cell"
                style={{
                  flex: column.flex || 1,
                  padding: '8px',
                }}
              >
                {row[column.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * AccessibleChart - Chart container with accessibility
 */
export const AccessibleChart = ({ 
  title, 
  description, 
  children,
  dataSummary 
}) => {
  return (
    <div
      role="img"
      aria-label={title}
      aria-describedby={description ? 'chart-description' : undefined}
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E5E7EB',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '900' }}>
        {title}
      </h3>
      {description && (
        <div id="chart-description" style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
          {description}
        </div>
      )}
      <div aria-hidden="true">
        {children}
      </div>
      {dataSummary && (
        <div className="sr-only" aria-label="Chart data summary">
          {dataSummary}
        </div>
      )}
    </div>
  );
};

/**
 * AccessibleReportStats - Report statistics with accessibility
 */
export const AccessibleReportStats = ({ stats }) => {
  return (
    <section
      aria-label="Report statistics"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}
    >
      <AccessibleCard
        ariaLabel={`Total revenue: ${stats.totalRevenue}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL REVENUE</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          ₹{stats.totalRevenue?.toLocaleString('en-IN')}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Total orders: ${stats.totalOrders}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>TOTAL ORDERS</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          {stats.totalOrders}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Average order value: ${stats.avgOrderValue}`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>AVG ORDER VALUE</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
          ₹{stats.avgOrderValue?.toLocaleString('en-IN')}
        </div>
      </AccessibleCard>
      <AccessibleCard
        ariaLabel={`Growth rate: ${stats.growthRate}%`}
        isInteractive={false}
        style={{
          backgroundColor: '#FFFFFF',
          border: '2px solid #E5E7EB',
          borderRadius: '6px',
          padding: '12px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '10px', fontWeight: '800', color: '#666' }}>GROWTH RATE</div>
        <div style={{ fontSize: '24px', fontWeight: '900', color: stats.growthRate >= 0 ? '#2ECC71' : '#E63946' }} aria-live="polite">
          {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate}%
        </div>
      </AccessibleCard>
    </section>
  );
};

/**
 * AccessibleReportAnnouncer - Live region for report updates
 */
export const AccessibleReportAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Report update">
      {message}
    </AccessibleLiveRegion>
  );
};

/**
 * AccessibleExportButton - Export button with accessibility
 */
export const AccessibleExportButton = ({ 
  onExport, 
  format = 'PDF',
  ariaLabel 
}) => {
  return (
    <AccessibleButton
      onClick={onExport}
      ariaLabel={ariaLabel || `Export report as ${format}`}
      style={{
        padding: '8px 16px',
        backgroundColor: '#E63946',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span aria-hidden="true">📥</span>
      Export as {format}
    </AccessibleButton>
  );
};

export default {
  AccessibleReports,
  AccessibleReportCard,
  AccessibleReportGrid,
  AccessibleReportFilter,
  AccessibleReportTabs,
  AccessibleReportPanel,
  AccessibleDataTable,
  AccessibleChart,
  AccessibleReportStats,
  AccessibleReportAnnouncer,
  AccessibleExportButton,
};
