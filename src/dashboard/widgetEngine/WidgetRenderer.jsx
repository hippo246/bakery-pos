/**
 * Widget Renderer
 * React component that renders individual widgets with drag, resize, and controls
 */

import React, { useState, useRef, useEffect, memo, Suspense, lazy } from 'react';
import { ErrorBoundary } from '../../components/common/ErrorBoundary.jsx';
import { WidgetState, WidgetSizes } from './WidgetTypes.js';
import dragDropManager from './DragDropManager.js';
import widgetLayoutManager from './WidgetLayoutManager.js';

// Lazy load widget components
const RevenueTodayWidget = lazy(() => import('./widgets/RevenueTodayWidget.jsx'));
const RevenueWeekWidget = lazy(() => import('./widgets/RevenueWeekWidget.jsx'));
const RevenueChartWidget = lazy(() => import('./widgets/RevenueChartWidget.jsx'));
const ActiveOrdersWidget = lazy(() => import('./widgets/ActiveOrdersWidget.jsx'));
const CompletedOrdersWidget = lazy(() => import('./widgets/CompletedOrdersWidget.jsx'));
const KitchenQueueWidget = lazy(() => import('./widgets/KitchenQueueWidget.jsx'));
const KitchenPriorityWidget = lazy(() => import('./widgets/KitchenPriorityWidget.jsx'));
const InventoryAlertsWidget = lazy(() => import('./widgets/InventoryAlertsWidget.jsx'));
const InventoryValueWidget = lazy(() => import('./widgets/InventoryValueWidget.jsx'));
const StaffOnShiftWidget = lazy(() => import('./widgets/StaffOnShiftWidget.jsx'));
const CustomersTodayWidget = lazy(() => import('./widgets/CustomersTodayWidget.jsx'));
const HealthStatusWidget = lazy(() => import('./widgets/HealthStatusWidget.jsx'));
const NotificationsWidget = lazy(() => import('./widgets/NotificationsWidget.jsx'));
const ReservationsTodayWidget = lazy(() => import('./widgets/ReservationsTodayWidget.jsx'));

// Lazy load live widget components
const LiveOrderWidget = lazy(() => import('../liveEngine/widgets/LiveOrderWidget.jsx'));
const LiveKitchenWidget = lazy(() => import('../liveEngine/widgets/LiveKitchenWidget.jsx'));
const LiveWaiterWidget = lazy(() => import('../liveEngine/widgets/LiveWaiterWidget.jsx'));
const LiveTablesWidget = lazy(() => import('../liveEngine/widgets/LiveTablesWidget.jsx'));
const LivePaymentsWidget = lazy(() => import('../liveEngine/widgets/LivePaymentsWidget.jsx'));
const LiveInventoryWidget = lazy(() => import('../liveEngine/widgets/LiveInventoryWidget.jsx'));
const LiveReservationsWidget = lazy(() => import('../liveEngine/widgets/LiveReservationsWidget.jsx'));
const LiveBusinessHealthWidget = lazy(() => import('../liveEngine/widgets/LiveBusinessHealthWidget.jsx'));
const LiveAlertCenterWidget = lazy(() => import('../liveEngine/widgets/LiveAlertCenterWidget.jsx'));
const LiveStaffStatusWidget = lazy(() => import('../liveEngine/widgets/LiveStaffStatusWidget.jsx'));
const LiveActivityTimelineWidget = lazy(() => import('../liveEngine/widgets/LiveActivityTimelineWidget.jsx'));

// Lazy load BI widget components
const ExecutiveSummaryWidget = lazy(() => import('../biEngine/widgets/ExecutiveSummaryWidget.jsx'));
const BusinessHealthScoreWidget = lazy(() => import('../biEngine/widgets/BusinessHealthScoreWidget.jsx'));
const RevenueAnalyticsWidget = lazy(() => import('../biEngine/widgets/RevenueAnalyticsWidget.jsx'));
const OrderIntelligenceWidget = lazy(() => import('../biEngine/widgets/OrderIntelligenceWidget.jsx'));
const KitchenIntelligenceWidget = lazy(() => import('../biEngine/widgets/KitchenIntelligenceWidget.jsx'));
const TableIntelligenceWidget = lazy(() => import('../biEngine/widgets/TableIntelligenceWidget.jsx'));
const PaymentAnalyticsWidget = lazy(() => import('../biEngine/widgets/PaymentAnalyticsWidget.jsx'));
const InventoryIntelligenceWidget = lazy(() => import('../biEngine/widgets/InventoryIntelligenceWidget.jsx'));
const CustomerAnalyticsWidget = lazy(() => import('../biEngine/widgets/CustomerAnalyticsWidget.jsx'));
const MenuIntelligenceWidget = lazy(() => import('../biEngine/widgets/MenuIntelligenceWidget.jsx'));
const RecommendationsWidget = lazy(() => import('../biEngine/widgets/RecommendationsWidget.jsx'));
const OperationalWarningsWidget = lazy(() => import('../biEngine/widgets/OperationalWarningsWidget.jsx'));
const TrendAnalysisWidget = lazy(() => import('../biEngine/widgets/TrendAnalysisWidget.jsx'));

// Widget component mapping
const widgetComponents = {
  'revenue-today': RevenueTodayWidget,
  'revenue-week': RevenueWeekWidget,
  'revenue-chart': RevenueChartWidget,
  'orders-active': ActiveOrdersWidget,
  'orders-completed': CompletedOrdersWidget,
  'kitchen-queue': KitchenQueueWidget,
  'kitchen-priority': KitchenPriorityWidget,
  'inventory-alerts': InventoryAlertsWidget,
  'inventory-value': InventoryValueWidget,
  'staff-on-shift': StaffOnShiftWidget,
  'customers-today': CustomersTodayWidget,
  'health-status': HealthStatusWidget,
  'notifications': NotificationsWidget,
  'reservations-today': ReservationsTodayWidget,
  'live-orders': LiveOrderWidget,
  'live-kitchen': LiveKitchenWidget,
  'live-waiter': LiveWaiterWidget,
  'live-tables': LiveTablesWidget,
  'live-payments': LivePaymentsWidget,
  'live-inventory': LiveInventoryWidget,
  'live-reservations': LiveReservationsWidget,
  'live-business-health': LiveBusinessHealthWidget,
  'live-alert-center': LiveAlertCenterWidget,
  'live-staff-status': LiveStaffStatusWidget,
  'live-activity-timeline': LiveActivityTimelineWidget,
  'executive-summary': ExecutiveSummaryWidget,
  'business-health-score': BusinessHealthScoreWidget,
  'revenue-analytics': RevenueAnalyticsWidget,
  'order-intelligence': OrderIntelligenceWidget,
  'kitchen-intelligence': KitchenIntelligenceWidget,
  'table-intelligence': TableIntelligenceWidget,
  'payment-analytics': PaymentAnalyticsWidget,
  'inventory-intelligence': InventoryIntelligenceWidget,
  'customer-analytics': CustomerAnalyticsWidget,
  'menu-intelligence': MenuIntelligenceWidget,
  'recommendations': RecommendationsWidget,
  'operational-warnings': OperationalWarningsWidget,
  'trend-analysis': TrendAnalysisWidget
};

function WidgetRenderer({ 
  instance, 
  widgetDef, 
  onMove, 
  onResize, 
  onToggleCollapse, 
  onToggleVisibility, 
  onTogglePin, 
  onToggleLock, 
  onDelete, 
  onDuplicate,
  onSettings,
  isEditing 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const widgetRef = useRef(null);
  const dragHandleRef = useRef(null);

  const { position, size, collapsed, pinned, locked, visible } = instance;
  const gridConfig = widgetLayoutManager.getGridConfig();
  const pixelPosition = widgetLayoutManager.getPositionInPixels(position.x, position.y);
  const pixelSize = widgetLayoutManager.getSizeInPixels(size);

  // Handle drag start
  const handleDragStart = (e) => {
    if (locked || !isEditing) return;
    
    e.preventDefault();
    
    const rect = widgetRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    dragDropManager.startDrag(instance.id, position, { x: offsetX, y: offsetY }, {
      onDragStart: () => setIsDragging(true),
      onDrag: (id, newPos, isValid) => {
        if (isValid) {
          // Update visual position during drag
        }
      },
      onDragEnd: (id, finalPos, cancelled) => {
        setIsDragging(false);
        if (!cancelled && onMove) {
          onMove(id, finalPos);
        }
      }
    });
  };

  // Handle mouse move during drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragDropManager.isActive()) return;
      
      const container = widgetRef.current?.parentElement;
      if (!container) return;
      
      const containerBounds = container.getBoundingClientRect();
      dragDropManager.updateDrag(e.clientX, e.clientY, containerBounds, size);
    };

    const handleMouseUp = () => {
      if (dragDropManager.isActive()) {
        dragDropManager.endDrag(size);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, size]);

  // Handle resize
  const handleResize = (newSize) => {
    if (locked || !isEditing) return;
    
    const canResize = widgetLayoutManager.canResize(
      instance.id,
      position.x,
      position.y,
      newSize
    );

    if (canResize && onResize) {
      onResize(instance.id, newSize);
    }
  };

  // Get widget component
  const WidgetComponent = widgetComponents[instance.widgetId];

  if (!visible) return null;

  return (
    <div
      ref={widgetRef}
      className={`widget widget-${size} ${collapsed ? 'widget-collapsed' : ''} ${isDragging ? 'widget-dragging' : ''} ${locked ? 'widget-locked' : ''}`}
      style={{
        position: 'absolute',
        left: `${pixelPosition.left}px`,
        top: `${pixelPosition.top}px`,
        width: `${pixelSize.width}px`,
        height: collapsed ? 'auto' : `${pixelSize.height}px`,
        minHeight: collapsed ? '60px' : `${pixelSize.height}px`,
        background: 'var(--cafe-bg-card)',
        border: '1px solid var(--cafe-border)',
        borderRadius: '12px',
        boxShadow: isDragging ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isDragging ? 1000 : pinned ? 100 : 1,
        overflow: 'hidden',
        cursor: locked ? 'default' : 'move'
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Widget Header */}
      <div
        ref={dragHandleRef}
        className="widget-header"
        onMouseDown={handleDragStart}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: collapsed ? 'none' : '1px solid var(--cafe-border)',
          background: 'var(--cafe-bg-surface)',
          cursor: locked ? 'default' : 'grab',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{widgetDef.icon}</span>
          <span style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: 'var(--cafe-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {widgetDef.name}
          </span>
        </div>

        {/* Widget Controls */}
        {(showControls || isEditing) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onToggleCollapse && onToggleCollapse(instance.id)}
              style={{
                padding: 4,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--cafe-text-secondary)',
                fontSize: 16,
                borderRadius: 4
              }}
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? '▼' : '▲'}
            </button>

            <button
              onClick={() => onTogglePin && onTogglePin(instance.id)}
              style={{
                padding: 4,
                background: pinned ? 'var(--cafe-accent-bg)' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: pinned ? 'var(--cafe-accent)' : 'var(--cafe-text-secondary)',
                fontSize: 16,
                borderRadius: 4
              }}
              title={pinned ? 'Unpin' : 'Pin'}
            >
              📌
            </button>

            {isEditing && (
              <>
                <button
                  onClick={() => onToggleLock && onToggleLock(instance.id)}
                  style={{
                    padding: 4,
                    background: locked ? 'var(--cafe-warning-bg)' : 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: locked ? 'var(--cafe-warning)' : 'var(--cafe-text-secondary)',
                    fontSize: 16,
                    borderRadius: 4
                  }}
                  title={locked ? 'Unlock' : 'Lock'}
                >
                  {locked ? '🔒' : '🔓'}
                </button>

                <button
                  onClick={() => onDuplicate && onDuplicate(instance.id)}
                  style={{
                    padding: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--cafe-text-secondary)',
                    fontSize: 16,
                    borderRadius: 4
                  }}
                  title="Duplicate"
                >
                  📋
                </button>

                <button
                  onClick={() => onSettings && onSettings(instance.id)}
                  style={{
                    padding: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--cafe-text-secondary)',
                    fontSize: 16,
                    borderRadius: 4
                  }}
                  title="Settings"
                >
                  ⚙️
                </button>

                <button
                  onClick={() => onDelete && onDelete(instance.id)}
                  style={{
                    padding: 4,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--cafe-danger)',
                    fontSize: 16,
                    borderRadius: 4
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Widget Content */}
      {!collapsed && (
        <div className="widget-content" style={{ padding: 16, height: 'calc(100% - 48px)', overflow: 'auto' }}>
          <ErrorBoundary>
            <Suspense fallback={<div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>}>
              {WidgetComponent ? (
                <WidgetComponent instance={instance} settings={instance.settings} />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--cafe-text-secondary)' }}>
                  Widget component not found
                </div>
              )}
            </Suspense>
          </ErrorBoundary>
        </div>
      )}

      {/* Resize Handle */}
      {isEditing && !locked && !collapsed && (
        <div
          className="resize-handle"
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '20px',
            height: '20px',
            cursor: 'se-resize',
            background: 'linear-gradient(135deg, transparent 50%, var(--cafe-accent) 50%)',
            opacity: 0.5,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = '0.5'}
          onClick={() => {
            // Cycle through sizes
            const sizes = [WidgetSizes.SMALL, WidgetSizes.MEDIUM, WidgetSizes.LARGE, WidgetSizes.EXTRA_LARGE];
            const currentIndex = sizes.indexOf(size);
            const nextIndex = (currentIndex + 1) % sizes.length;
            handleResize(sizes[nextIndex]);
          }}
        />
      )}
    </div>
  );
}

// Memoize widget renderer to prevent unnecessary re-renders
export default memo(WidgetRenderer);
