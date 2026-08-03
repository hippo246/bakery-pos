import React from 'react';
import { useState, useEffect, useCallback, useMemo } from "react";
import { generateInsights, generateDailyBrief, searchInsights } from "../../utils/intelligenceEngine.js";
import { updateInsightStatus } from "../../domain/intelligenceModel.js";

// Import intelligence components
import DailyBrief from "./DailyBrief.jsx";
import TodayPriorities from "./TodayPriorities.jsx";
import RevenueInsights from "./RevenueInsights.jsx";
import InventoryIntelligence from "./InventoryIntelligence.jsx";
import KitchenIntelligence from "./KitchenIntelligence.jsx";
import FloorIntelligence from "./FloorIntelligence.jsx";
import MenuIntelligence from "./MenuIntelligence.jsx";
import StaffIntelligence from "./StaffIntelligence.jsx";
import ReservationIntelligence from "./ReservationIntelligence.jsx";
import DeliveryIntelligence from "./DeliveryIntelligence.jsx";
import PurchasingIntelligence from "./PurchasingIntelligence.jsx";
import ActionCenter from "./ActionCenter.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import IntelligenceTimeline from "./IntelligenceTimeline.jsx";

function IntelligenceDashboard({
  orders,
  inventory,
  menuItems,
  kdsCards,
  tables,
  staff,
  reservations,
  shifts,
  purchases,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState('BRIEF');
  const [insights, setInsights] = useState([]);
  const [brief, setBrief] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Generate insights from operational data
  useEffect(() => {
    const data = {
      orders,
      inventory,
      menuItems,
      kdsCards,
      tables,
      staff,
      reservations,
      shifts,
      purchases
    };

    const generatedInsights = generateInsights(data);
    setInsights(generatedInsights);

    const dailyBrief = generateDailyBrief(data);
    setBrief(dailyBrief);
  }, [orders, inventory, menuItems, kdsCards, tables, staff, reservations, shifts, purchases]);

  // Handle action execution
  const handleAction = useCallback((action) => {
    if (action.type === 'NAVIGATE' && action.target) {
      onNavigate?.(action.target);
    }
    // Handle other action types as needed
  }, [onNavigate]);

  // Handle insight dismissal
  const handleDismiss = useCallback((insight) => {
    const updated = updateInsightStatus(insight, 'DISMISSED', 'current-user');
    setInsights(prev => prev.map(i => i.id === insight.id ? updated : i));
  }, []);

  // Handle insight completion
  const handleComplete = useCallback((insight) => {
    const updated = updateInsightStatus(insight, 'COMPLETED', 'current-user');
    setInsights(prev => prev.map(i => i.id === insight.id ? updated : i));
  }, []);

  // Tab configuration
  const tabs = [
    { id: 'BRIEF', label: 'Brief', icon: '📋' },
    { id: 'PRIORITIES', label: 'Priorities', icon: '🎯' },
    { id: 'REVENUE', label: 'Revenue', icon: '💰' },
    { id: 'INVENTORY', label: 'Inventory', icon: '📦' },
    { id: 'KITCHEN', label: 'Kitchen', icon: '👨‍🍳' },
    { id: 'FLOOR', label: 'Floor', icon: '🪑' },
    { id: 'MENU', label: 'Menu', icon: '📜' },
    { id: 'STAFF', label: 'Staff', icon: '👥' },
    { id: 'RESERVATIONS', label: 'Reservations', icon: '📅' },
    { id: 'DELIVERY', label: 'Delivery', icon: '🛵' },
    { id: 'PURCHASING', label: 'Purchasing', icon: '🛒' },
    { id: 'ACTIONS', label: 'Actions', icon: '⚡' },
    { id: 'TIMELINE', label: 'Timeline', icon: '📅' }
  ];

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'BRIEF':
        return <DailyBrief brief={brief} onAction={handleAction} />;
      case 'PRIORITIES':
        return <TodayPriorities insights={insights} onAction={handleAction} onDismiss={handleDismiss} onComplete={handleComplete} />;
      case 'REVENUE':
        return <RevenueInsights insights={insights} orders={orders} onAction={handleAction} />;
      case 'INVENTORY':
        return <InventoryIntelligence insights={insights} inventory={inventory} onAction={handleAction} />;
      case 'KITCHEN':
        return <KitchenIntelligence insights={insights} kdsCards={kdsCards} onAction={handleAction} />;
      case 'FLOOR':
        return <FloorIntelligence insights={insights} tables={tables} orders={orders} onAction={handleAction} />;
      case 'MENU':
        return <MenuIntelligence insights={insights} orders={orders} menuItems={menuItems} onAction={handleAction} />;
      case 'STAFF':
        return <StaffIntelligence insights={insights} shifts={shifts} staff={staff} onAction={handleAction} />;
      case 'RESERVATIONS':
        return <ReservationIntelligence insights={insights} reservations={reservations} onAction={handleAction} />;
      case 'DELIVERY':
        return <DeliveryIntelligence insights={insights} orders={orders} onAction={handleAction} />;
      case 'PURCHASING':
        return <PurchasingIntelligence insights={insights} purchases={purchases} onAction={handleAction} />;
      case 'ACTIONS':
        return <ActionCenter insights={insights} onAction={handleAction} />;
      case 'TIMELINE':
        return <IntelligenceTimeline insights={insights} onAction={handleAction} />;
      default:
        return <DailyBrief brief={brief} onAction={handleAction} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--cafe-bg-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        background: 'var(--cafe-bg-surface)',
        borderBottom: '1px solid var(--cafe-border-light)'
      }}>
        <div>
          <div style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--cafe-text-primary)',
            marginBottom: '4px'
          }}>
            Operations Intelligence
          </div>
          <div style={{
            fontSize: '13px',
            color: 'var(--cafe-text-secondary)'
          }}>
            AI-free commercial decision engine
          </div>
        </div>
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            background: 'var(--cafe-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--cafe-radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔍 Search
        </button>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '100px',
          zIndex: 1000
        }}>
          <div style={{
            width: isMobile ? '90%' : '600px',
            background: 'var(--cafe-bg-surface)',
            borderRadius: 'var(--cafe-radius-lg)',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <GlobalSearch
              insights={insights}
              orders={orders}
              menuItems={menuItems}
              inventory={inventory}
              staff={staff}
              onNavigate={(target) => {
                onNavigate?.(target);
                setSearchOpen(false);
              }}
            />
            <button
              onClick={() => setSearchOpen(false)}
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border-light)',
                borderRadius: 'var(--cafe-radius-md)',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        {/* Sidebar Tabs */}
        <div style={{
          width: isMobile ? '60px' : '200px',
          background: 'var(--cafe-bg-surface)',
          borderRight: '1px solid var(--cafe-border-light)',
          overflowY: 'auto',
          padding: isMobile ? '12px 8px' : '16px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0' : '12px',
                  padding: isMobile ? '12px' : '12px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background: activeTab === tab.id ? 'var(--cafe-primary)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--cafe-text-primary)',
                  border: 'none',
                  borderRadius: 'var(--cafe-radius-md)',
                  cursor: 'pointer',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '18px' }}>{tab.icon}</span>
                {!isMobile && <span>{tab.label}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

export default IntelligenceDashboard;
