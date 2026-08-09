/**
 * AccessibleDashboard.jsx
 * Accessibility wrapper for Dashboard components
 * Provides screen reader support, keyboard navigation, and ARIA attributes for dashboard views
 */

import {
  AccessibleCard,
  AccessibleListItem,
  AccessibleTabs,
  AccessibleTabPanel,
  AccessibleLiveRegion,
  AccessibleStatus,
  AccessibleSkipLink,
} from './AccessibleWrapper.jsx';

/**
 * AccessibleDashboard - Main dashboard wrapper with full accessibility
 */
export const AccessibleDashboard = ({ children, title = "Dashboard" }) => {
  return (
    <>
      <AccessibleSkipLink targetId="main-content" />
      <div role="main" id="main-content" aria-label={title}>
        {children}
      </div>
    </>
  );
};

/**
 * AccessibleMetricCard - Dashboard metric card with accessibility
 */
export const AccessibleMetricCard = ({ 
  label, 
  value, 
  icon, 
  trend, 
  ariaLabel 
}) => {
  return (
    <AccessibleCard
      ariaLabel={ariaLabel || `${label}: ${value}`}
      isInteractive={false}
      style={{
        backgroundColor: '#FFFFFF',
        border: '2px solid #E63946',
        borderRadius: '6px',
        padding: '12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: '800', color: '#666', marginBottom: '4px' }}>
        {icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
        {value}
      </div>
      {trend && (
        <div style={{ fontSize: '10px', marginTop: '4px' }}>
          <span aria-hidden="true">{trend.icon}</span>
          <span className="sr-only">{trend.label}</span>
        </div>
      )}
    </AccessibleCard>
  );
};

/**
 * AccessibleOrderCard - Order card with full accessibility
 */
export const AccessibleOrderCard = ({ 
  order, 
  onClick, 
  isSelected = false,
  onStatusChange 
}) => {
  const statusLabels = {
    URGENT: 'Urgent',
    NORMAL: 'Normal',
    RELAXED: 'Relaxed',
  };

  const typeLabels = {
    DT1: 'Drive-Thru Lane 1',
    DT2: 'Drive-Thru Lane 2',
    DINE: 'Dine-In',
    TAKE: 'Takeout',
    DELIVERY: 'Delivery',
  };

  const ariaLabel = `Order ${order.id}, ${typeLabels[order.type] || order.type}, status ${statusLabels[order.status] || order.status}, time ${order.time}, total ₹${order.total}`;

  return (
    <AccessibleListItem
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#F8F9FA',
        border: '2px solid #E63946',
        borderRadius: '6px',
        padding: '12px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '900' }}>#{order.id}</span>
          <span style={{ marginLeft: '8px', fontSize: '14px' }}>
            {typeLabels[order.type] || order.type}
          </span>
        </div>
        <AccessibleStatus status={order.status.toLowerCase()} ariaLabel={`Status: ${statusLabels[order.status]}`} />
      </div>
      <div style={{ fontSize: '12px', color: '#666' }} aria-label={`Time: ${order.time}`}>
        ⏱️ {order.time}
      </div>
      <div style={{ fontSize: '16px', fontWeight: '900', color: '#E63946', marginTop: '6px' }} aria-label={`Total: ₹${order.total}`}>
        ₹{order.total}
      </div>
      {onStatusChange && (
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => onStatusChange(order.id)}
            aria-label={`Change status for order ${order.id}`}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              backgroundColor: '#E63946',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Update Status
          </button>
        </div>
      )}
    </AccessibleListItem>
  );
};

/**
 * AccessibleDashboardTabs - Tab navigation for dashboard views
 */
export const AccessibleDashboardTabs = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  ariaLabel = "Dashboard views" 
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
 * AccessibleDashboardPanel - Panel content for dashboard tabs
 */
export const AccessibleDashboardPanel = ({ 
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
 * AccessibleStaffCard - Staff performance card with accessibility
 */
export const AccessibleStaffCard = ({ 
  staff, 
  onClick, 
  isSelected = false 
}) => {
  const ariaLabel = `${staff.name}, ${staff.orders} orders, ₹${staff.revenue} revenue, speed ${staff.speed} out of 5`;

  return (
    <AccessibleListItem
      ariaLabel={ariaLabel}
      isInteractive={!!onClick}
      onClick={onClick}
      isSelected={isSelected}
      style={{
        backgroundColor: '#F8F9FA',
        padding: '16px',
        borderRadius: '8px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>
        {staff.name}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
        Orders: {staff.orders}
      </div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
        Revenue: ₹{staff.revenue}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Speed: {staff.speed}/5
      </div>
    </AccessibleListItem>
  );
};

/**
 * AccessibleStatCard - Statistics card with accessibility
 */
export const AccessibleStatCard = ({ 
  label, 
  value, 
  icon, 
  ariaLabel 
}) => {
  return (
    <AccessibleListItem
      ariaLabel={ariaLabel || `${label}: ${value}`}
      isInteractive={false}
      style={{
        backgroundColor: '#F8F9FA',
        padding: '16px',
        borderRadius: '8px',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: '800', color: '#666', marginBottom: '8px' }}>
        {icon && <span aria-hidden="true" style={{ marginRight: '4px' }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '900', color: '#E63946' }} aria-live="polite">
        {value}
      </div>
    </AccessibleListItem>
  );
};

/**
 * AccessibleDashboardAnnouncer - Live region for dashboard updates
 */
export const AccessibleDashboardAnnouncer = ({ message }) => {
  return (
    <AccessibleLiveRegion level="polite" ariaLabel="Dashboard update">
      {message}
    </AccessibleLiveRegion>
  );
};

export default {
  AccessibleDashboard,
  AccessibleMetricCard,
  AccessibleOrderCard,
  AccessibleDashboardTabs,
  AccessibleDashboardPanel,
  AccessibleStaffCard,
  AccessibleStatCard,
  AccessibleDashboardAnnouncer,
};
