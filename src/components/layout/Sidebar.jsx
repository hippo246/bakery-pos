import React, { useRef, useEffect } from 'react';

export default function Sidebar({
  activeTab,
  onNavigate,
  isMenuOpen,
  menuDropdownOpen,
  customersDropdownOpen,
  onToggleMenu,
  onToggleMenuDropdown,
  onToggleCustomersDropdown,
  darkMode,
  screenSize = 'large'
}) {
  const menuDropdownRef = useRef(null);
  const customersDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest('[data-dropdown-trigger]')) return;
      if (event.target.closest('[data-dropdown]')) return;
      onToggleMenuDropdown(null);
      onToggleCustomersDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onToggleMenuDropdown, onToggleCustomersDropdown]);

  const mainTabs = [
    { id: 'orders', label: '🛒 Orders', icon: '🛒' },
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'reports', label: '📈 Reports', icon: '📈' },
    { id: 'crm', label: '👤 CRM', icon: '👤' }
  ];

  const menuTabs = [
    { id: 'menu', label: '🍽️ Menu', icon: '🍽️' },
    { id: 'inventory', label: '📦 Inventory', icon: '📦' },
    { id: 'staff', label: '👥 Staff', icon: '👥' },
    { id: 'tables', label: '🪑 Tables', icon: '🪑' },
    { id: 'kitchen', label: '👨‍🍳 Kitchen', icon: '👨‍🍳' },
    { id: 'recipes', label: '📜 Recipes', icon: '📜' },
    { id: 'waste', label: '♻️ Waste', icon: '♻️' }
  ];

  const customersTabs = [
    { id: 'reservations', label: '📅 Reservations', icon: '📅' },
    { id: 'tokens', label: '🎫 Tokens', icon: '🎫' },
    { id: 'waiters', label: '🛎️ Waiters', icon: '🛎️' },
    { id: 'online', label: '🌐 Online', icon: '🌐' }
  ];

  const settingsTabs = [
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' }
  ];

  if (screenSize === 'small') return null;

  return (
    <div style={{
      width: isMenuOpen ? '260px' : '70px',
      background: darkMode ? '#1f2937' : '#ffffff',
      borderRight: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 1000
    }}>
      {/* Logo/Brand */}
      <div style={{
        padding: isMenuOpen ? '20px' : '15px',
        borderBottom: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: isMenuOpen ? 'flex-start' : 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '28px' }}>🥐</span>
        {isMenuOpen && (
          <span style={{
            fontSize: '18px',
            fontWeight: '700',
            color: darkMode ? '#ffffff' : '#1f2937'
          }}>
            BakeryPOS
          </span>
        )}
      </div>

      {/* Main Tabs */}
      <div style={{ padding: '12px 8px' }}>
        {mainTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              width: '100%',
              padding: isMenuOpen ? '12px 16px' : '12px',
              background: activeTab === tab.id 
                ? (darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
                : 'transparent',
              color: activeTab === tab.id 
                ? '#6366f1' 
                : (darkMode ? '#9ca3af' : '#6b7280'),
              border: activeTab === tab.id 
                ? `1px solid ${darkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
                : 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMenuOpen ? '12px' : '0',
              justifyContent: isMenuOpen ? 'flex-start' : 'center',
              marginBottom: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.05)' : '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            {isMenuOpen && <span>{tab.label.split(' ')[1]}</span>}
          </button>
        ))}
      </div>

      {/* Menu Dropdown */}
      <div style={{ padding: '8px' }}>
        <button
          data-dropdown-trigger="menu"
          onClick={(e) => onToggleMenuDropdown(e, 'menu')}
          style={{
            width: '100%',
            padding: isMenuOpen ? '12px 16px' : '12px',
            background: menuDropdownOpen 
              ? (darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
              : 'transparent',
            color: menuDropdownOpen 
              ? '#6366f1' 
              : (darkMode ? '#9ca3af' : '#6b7280'),
            border: menuDropdownOpen 
              ? `1px solid ${darkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
              : 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: menuDropdownOpen ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: isMenuOpen ? '12px' : '0',
            justifyContent: isMenuOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '20px' }}>🍽️</span>
          {isMenuOpen && (
            <>
              <span>Menu</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                {menuDropdownOpen ? '▼' : '▶'}
              </span>
            </>
          )}
        </button>

        {menuDropdownOpen && isMenuOpen && (
          <div 
            ref={menuDropdownRef}
            data-dropdown="menu"
            style={{
              marginLeft: '16px',
              marginTop: '8px',
              padding: '8px',
              background: darkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
            }}
          >
            {menuTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: activeTab === tab.id 
                    ? (darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
                    : 'transparent',
                  color: activeTab === tab.id 
                    ? '#6366f1' 
                    : (darkMode ? '#9ca3af' : '#6b7280'),
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customers Dropdown */}
      <div style={{ padding: '8px' }}>
        <button
          data-dropdown-trigger="customers"
          onClick={(e) => onToggleCustomersDropdown(e, 'customers')}
          style={{
            width: '100%',
            padding: isMenuOpen ? '12px 16px' : '12px',
            background: customersDropdownOpen 
              ? (darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
              : 'transparent',
            color: customersDropdownOpen 
              ? '#6366f1' 
              : (darkMode ? '#9ca3af' : '#6b7280'),
            border: customersDropdownOpen 
              ? `1px solid ${darkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
              : 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: customersDropdownOpen ? '600' : '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: isMenuOpen ? '12px' : '0',
            justifyContent: isMenuOpen ? 'flex-start' : 'center',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '20px' }}>👥</span>
          {isMenuOpen && (
            <>
              <span>Customers</span>
              <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                {customersDropdownOpen ? '▼' : '▶'}
              </span>
            </>
          )}
        </button>

        {customersDropdownOpen && isMenuOpen && (
          <div 
            ref={customersDropdownRef}
            data-dropdown="customers"
            style={{
              marginLeft: '16px',
              marginTop: '8px',
              padding: '8px',
              background: darkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`
            }}
          >
            {customersTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: activeTab === tab.id 
                    ? (darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
                    : 'transparent',
                  color: activeTab === tab.id 
                    ? '#6366f1' 
                    : (darkMode ? '#9ca3af' : '#6b7280'),
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label.split(' ')[1]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{ padding: '8px', marginTop: 'auto' }}>
        {settingsTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              width: '100%',
              padding: isMenuOpen ? '12px 16px' : '12px',
              background: activeTab === tab.id 
                ? (darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)')
                : 'transparent',
              color: activeTab === tab.id 
                ? '#6366f1' 
                : (darkMode ? '#9ca3af' : '#6b7280'),
              border: activeTab === tab.id 
                ? `1px solid ${darkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
                : 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isMenuOpen ? '12px' : '0',
              justifyContent: isMenuOpen ? 'flex-start' : 'center',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '20px' }}>{tab.icon}</span>
            {isMenuOpen && <span>{tab.label.split(' ')[1]}</span>}
          </button>
        ))}
      </div>

      {/* Toggle Button */}
      <div style={{ padding: '12px' }}>
        <button
          onClick={onToggleMenu}
          style={{
            width: '100%',
            padding: '12px',
            background: darkMode ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
            color: darkMode ? '#9ca3af' : '#6b7280',
            border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isMenuOpen ? '◀' : '▶'}
        </button>
      </div>
    </div>
  );
}
