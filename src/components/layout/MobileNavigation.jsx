import React from 'react';

export default function MobileNavigation({
  activeTab,
  onNavigate,
  showMoreMenu,
  onToggleMoreMenu,
  settings,
  darkMode
}) {
  const mainTabs = [
    { id: 'orders', label: '📋 Orders', icon: '📋' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'reports', label: '📈 Reports', icon: '📈' },
    { id: 'crm', label: '👤 CRM', icon: '👤' }
  ];

  const moreTabs = [
    { id: 'menu', label: '🍽️ Menu', icon: '🍽️' },
    { id: 'inventory', label: '📦 Inventory', icon: '📦' },
    { id: 'staff', label: '👥 Staff', icon: '👥' },
    { id: 'tables', label: '🪑 Tables', icon: '🪑' },
    { id: 'kitchen', label: '👨‍🍳 Kitchen', icon: '👨‍🍳' },
    { id: 'recipes', label: '📜 Recipes', icon: '📜' },
    { id: 'waste', label: '♻️ Waste', icon: '♻️' },
    { id: 'reservations', label: '📅 Reservations', icon: '📅' },
    { id: 'tokens', label: '🎫 Tokens', icon: '🎫' },
    { id: 'waiters', label: '🛎️ Waiters', icon: '🛎️' },
    { id: 'online', label: '🌐 Online', icon: '🌐' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  const tabConfig = {
    orders: { id: 'orders', label: '📋 Orders', icon: '📋' },
    dashboard: { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    reports: { id: 'reports', label: '📈 Reports', icon: '📈' },
    crm: { id: 'crm', label: '👤 CRM', icon: '👤' },
    menu: { id: 'menu', label: '🍽️ Menu', icon: '🍽️' },
    inventory: { id: 'inventory', label: '📦 Inventory', icon: '📦' },
    staff: { id: 'staff', label: '👥 Staff', icon: '👥' },
    tables: { id: 'tables', label: '🪑 Tables', icon: '🪑' },
    kitchen: { id: 'kitchen', label: '👨‍🍳 Kitchen', icon: '👨‍🍳' },
    settings: { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
    more: { id: 'more', label: '⋯ More', icon: '⋯' }
  };

  const navTabs = (settings?.mobileNavTabs || ['orders', 'dashboard', 'reports', 'crm', 'more']);

  return (
    <>
      {/* Mobile Navigation Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#0a0a0a',
        borderTop: '1px solid #222222',
        padding: '10px 12px',
        paddingBottom: '20px',
        display: 'flex',
        gap: '6px',
        zIndex: 2000,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.3)'
      }}>
        {navTabs.map(tabId => {
          const tab = tabConfig[tabId] || tabConfig.more;
          return (
            <button
              key={tab.id}
              onClick={() => tab.id === 'more' ? onToggleMoreMenu(!showMoreMenu) : onNavigate(tab.id)}
              style={{
                flex: 1,
                padding: '10px 6px',
                background: activeTab === tab.id ? '#6366f1' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : '#888888',
                border: activeTab === tab.id ? 'none' : '1px solid transparent',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '22px' }}>{tab.icon}</span>
              <span style={{ fontSize: '10px' }}>{tab.label.split(' ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile More Menu */}
      {showMoreMenu && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          left: '12px',
          right: '12px',
          background: '#0a0a0a',
          border: '1px solid #222222',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          zIndex: 2001,
          padding: '12px',
          maxHeight: '320px',
          overflow: 'auto'
        }}>
          {moreTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                onNavigate(tab.id);
                onToggleMoreMenu(false);
              }}
              style={{
                width: '100%',
                padding: '14px 16px',
                background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: activeTab === tab.id ? '#6366f1' : '#e0e0e0',
                border: activeTab === tab.id ? '1px solid #6366f1' : '1px solid transparent',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '4px'
              }}
            >
              <span style={{ fontSize: '20px' }}>{tab.icon}</span>
              <span>{tab.label.split(' ')[1]}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
