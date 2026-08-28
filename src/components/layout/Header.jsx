import React from 'react';

export default function Header({
  activeTab,
  darkMode,
  onToggleTheme,
  screenSize = 'large'
}) {
  const getTabTitle = (tab) => {
    const titles = {
      orders: 'Orders',
      dashboard: 'Dashboard',
      reports: 'Reports',
      crm: 'CRM',
      menu: 'Menu',
      inventory: 'Inventory',
      staff: 'Staff',
      tables: 'Tables',
      kitchen: 'Kitchen',
      recipes: 'Recipes',
      waste: 'Waste',
      reservations: 'Reservations',
      tokens: 'Tokens',
      waiters: 'Waiters',
      online: 'Online Ordering',
      settings: 'Settings'
    };
    return titles[tab] || 'BakeryPOS';
  };

  return (
    <div style={{
      background: darkMode ? '#1f2937' : '#ffffff',
      borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
      padding: screenSize === 'small' ? '12px 16px' : '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'fixed',
      top: 0,
      left: screenSize === 'small' ? 0 : '70px',
      right: 0,
      zIndex: 100,
      transition: 'left 0.3s ease'
    }}>
      <div>
        <h1 style={{
          fontSize: screenSize === 'small' ? '18px' : '20px',
          fontWeight: '700',
          color: darkMode ? '#ffffff' : '#1f2937',
          margin: 0
        }}>
          {getTabTitle(activeTab)}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleTheme}
          style={{
            padding: '8px 12px',
            background: darkMode ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
            color: darkMode ? '#ffffff' : '#1f2937',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {darkMode ? '☀️' : '🌙'}
          <span style={{ fontSize: '12px', fontWeight: '600' }}>
            {darkMode ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>
    </div>
  );
}
