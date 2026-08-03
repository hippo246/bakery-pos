// Operational Command Center Dashboard
// Premium operational dashboard with responsive grid layout

import React, { useState, useEffect } from 'react';
import DashboardHeader from '../../dashboard/components/DashboardHeader.jsx';
import StatusBar from '../../dashboard/components/StatusBar.jsx';
import BusinessHealthWidget from '../../dashboard/widgets/BusinessHealthWidget.jsx';
import QuickActionsWidget from '../../dashboard/widgets/QuickActionsWidget.jsx';
import TodayRevenueWidget from '../../dashboard/widgets/TodayRevenueWidget.jsx';
import TodayOrdersWidget from '../../dashboard/widgets/TodayOrdersWidget.jsx';
import ActiveOrdersWidget from '../../dashboard/widgets/ActiveOrdersWidget.jsx';
import KitchenQueueWidget from '../../dashboard/widgets/KitchenQueueWidget.jsx';
import WaiterQueueWidget from '../../dashboard/widgets/WaiterQueueWidget.jsx';
import ActiveTablesWidget from '../../dashboard/widgets/ActiveTablesWidget.jsx';
import ReservationsWidget from '../../dashboard/widgets/ReservationsWidget.jsx';
import InventoryAlertsWidget from '../../dashboard/widgets/InventoryAlertsWidget.jsx';
import StaffOnDutyWidget from '../../dashboard/widgets/StaffOnDutyWidget.jsx';
import PaymentOverviewWidget from '../../dashboard/widgets/PaymentOverviewWidget.jsx';
import RecentActivityWidget from '../../dashboard/widgets/RecentActivityWidget.jsx';
import OperationalAlertsWidget from '../../dashboard/widgets/OperationalAlertsWidget.jsx';
import QuickNotesWidget from '../../dashboard/widgets/QuickNotesWidget.jsx';

export default function OperationalCommandCenter({ 
  businessData = {},
  metricsData = {},
  onNavigate = null 
}) {
  const [viewport, setViewport] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewport('mobile');
      } else if (width < 1024) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getGridColumns = () => {
    switch (viewport) {
      case 'desktop':
        return 'grid-cols-12';
      case 'tablet':
        return 'grid-cols-8';
      case 'mobile':
        return 'grid-cols-1';
      default:
        return 'grid-cols-12';
    }
  };

  const handleQuickAction = (action) => {
    if (onNavigate) {
      const navigationMap = {
        new_order: 'orders',
        reservation: 'reservations',
        inventory: 'inventory',
        purchase_order: 'purchasing',
        customer: 'crm',
        supplier: 'suppliers',
        reports: 'reports',
        settings: 'settings',
        support: 'support',
        backups: 'backups'
      };
      const target = navigationMap[action.type];
      if (target) onNavigate(target);
    }
  };

  const handleWidgetClick = (widgetType) => {
    if (onNavigate) {
      const navigationMap = {
        kitchen_queue: 'kitchen',
        waiter_queue: 'waiters',
        active_tables: 'tables',
        reservations: 'reservations',
        inventory_alerts: 'inventory',
        staff_on_duty: 'staff',
        payment_overview: 'payments',
        recent_activity: 'activity',
        operational_alerts: 'alerts'
      };
      const target = navigationMap[widgetType];
      if (target) onNavigate(target);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        businessName={businessData.name || 'CafeOS'}
        branchName={businessData.branch || 'Main Branch'}
        currentShift={businessData.shift || 'Morning'}
        currentUser={businessData.user}
        userRole={businessData.role || 'Owner'}
        cloudStatus={metricsData.cloud?.status || 'connected'}
        notificationCount={metricsData.notifications || 0}
        onQuickSearch={(query) => console.log('Search:', query)}
        onProfileClick={(action) => console.log('Profile:', action)}
        onNotificationClick={() => console.log('Notifications clicked')}
      />

      {/* Status Bar */}
      <StatusBar
        cloudConnected={metricsData.cloud?.connected !== false}
        databaseHealthy={metricsData.database?.healthy !== false}
        backupStatus={metricsData.backup?.status || 'healthy'}
        syncStatus={metricsData.sync?.status || 'healthy'}
        printerStatus={metricsData.printer?.status || 'online'}
        kitchenStatus={metricsData.kitchen?.status || 'online'}
        waiterStatus={metricsData.waiters?.status || 'online'}
        paymentStatus={metricsData.payments?.status || 'online'}
        staffOnline={metricsData.staff?.online || 0}
        overallHealth={metricsData.health?.status || 'healthy'}
      />

      {/* Main Dashboard Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className={`grid ${getGridColumns()} gap-4 max-w-7xl mx-auto`}>
          {/* Row 1 */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <BusinessHealthWidget
              metrics={metricsData.health || {}}
              onClick={() => handleWidgetClick('business_health')}
            />
          </div>
          <div className="col-span-12 lg:col-span-8 xl:col-span-9">
            <QuickActionsWidget
              onActionClick={handleQuickAction}
            />
          </div>

          {/* Row 2 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <TodayRevenueWidget
              revenueData={metricsData.revenue || {}}
              onClick={() => handleWidgetClick('today_revenue')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <TodayOrdersWidget
              ordersData={metricsData.orders || {}}
              onClick={() => handleWidgetClick('today_orders')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <ActiveOrdersWidget
              activeOrdersData={metricsData.activeOrders || {}}
              onClick={() => handleWidgetClick('active_orders')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <KitchenQueueWidget
              kitchenData={metricsData.kitchen || {}}
              onClick={() => handleWidgetClick('kitchen_queue')}
            />
          </div>

          {/* Row 3 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <WaiterQueueWidget
              waiterData={metricsData.waiters || {}}
              onClick={() => handleWidgetClick('waiter_queue')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <ActiveTablesWidget
              tablesData={metricsData.tables || {}}
              onClick={() => handleWidgetClick('active_tables')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <ReservationsWidget
              reservationsData={metricsData.reservations || {}}
              onClick={() => handleWidgetClick('reservations')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <InventoryAlertsWidget
              inventoryData={metricsData.inventory || {}}
              onClick={() => handleWidgetClick('inventory_alerts')}
            />
          </div>

          {/* Row 4 */}
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <StaffOnDutyWidget
              staffData={metricsData.staff || {}}
              onClick={() => handleWidgetClick('staff_on_duty')}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 lg:col-span-3">
            <PaymentOverviewWidget
              paymentData={metricsData.payments || {}}
              onClick={() => handleWidgetClick('payment_overview')}
            />
          </div>
          <div className="col-span-12 lg:col-span-3">
            <QuickNotesWidget />
          </div>
          <div className="col-span-12 lg:col-span-3">
            <OperationalAlertsWidget
              alertsData={metricsData.alerts || []}
              onClick={() => handleWidgetClick('operational_alerts')}
            />
          </div>

          {/* Row 5 - Recent Activity (Full Width) */}
          <div className="col-span-12">
            <RecentActivityWidget
              activityData={metricsData.activity || []}
              onClick={() => handleWidgetClick('recent_activity')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
