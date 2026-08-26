import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './dashboard/Dashboard';
import Reports from './analytics/Reports';
import ComprehensiveReports from './analytics/ComprehensiveReports';
import CRM from './crm/CRM';
import Staff from './staff/Staff';
import Menu from './menu/Menu';
import Inventory from './inventory/Inventory';
import Settings from './settings/Settings';
import Tables from './tables/Tables';
import Waiters from './waiters/Waiters';
import Kitchen from './kitchen/Kitchen';
import SimplePOS from './SimplePOS';
import RecipeManagement from './recipes/RecipeManagement';
import WasteManagement from './waste/WasteManagement';
import Reservations from './reservations/Reservations';
import OnlineOrdering from './onlineordering/OnlineOrdering';
import TokenManagement from './tokens/TokenManagement';
import QROrdering from './qrodering/QROrdering';

export default function BakeryPOS({
  orders = [],
  setOrders,
  customers = [],
  setCustomers,
  staff = [],
  setStaff,
  menuItems = [],
  setMenuItems,
  inventory = [],
  setInventory,
  settings = {},
  setSettings,
  tables = [],
  setTables,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('bakerypos_active_tab');
    return savedTab || 'orders';
  });
  const [isMobile, setIsMobile] = useState(false);
  const [isMedium, setIsMedium] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [customersDropdownOpen, setCustomersDropdownOpen] = useState(false);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0 });
  const menuDropdownRef = useRef(null);
  const customersDropdownRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('bakerypos_theme');
    return savedTheme === 'dark' ? false : true; // Default to light mode
  });

  // Get per-tab dark mode preference from settings
  const getTabDarkMode = (tab) => {
    if (settings.tabDarkModes && settings.tabDarkModes[tab] !== undefined) {
      return settings.tabDarkModes[tab];
    }
    return darkMode; // Fall back to global theme
  };
  const tabsRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsMedium(width >= 768 && width < 1024);
      setIsTablet(width >= 1024 && width < 1366);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('bakerypos_theme', darkMode ? 'light' : 'dark');
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // If click is on a dropdown trigger, let the onClick handler handle the toggle
      if (event.target.closest('[data-dropdown-trigger]')) {
        return;
      }
      // If click is inside a dropdown menu container, let it be
      if (event.target.closest('[data-dropdown]')) {
        return;
      }
      // Otherwise, close all dropdowns
      setMenuDropdownOpen(false);
      setCustomersDropdownOpen(false);
      setIsMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    localStorage.setItem('bakerypos_active_tab', activeTab);
  }, [activeTab]);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    setMenuDropdownOpen(false);
    setCustomersDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const toggleMenuDropdown = (e, dropdownType) => {
    e.stopPropagation();
    e.preventDefault();
    if (dropdownType === 'menu') {
      setMenuDropdownOpen(prev => !prev);
      setCustomersDropdownOpen(false);
    } else if (dropdownType === 'crm') {
      setCustomersDropdownOpen(prev => !prev);
      setMenuDropdownOpen(false);
    }
  };

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <SimplePOS orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} settings={settings} setSettings={setSettings} staff={staff} tables={tables} setTables={setTables} onNavigate={handleNavigate} darkMode={getTabDarkMode('orders')} />;
      case 'dashboard':
        return <Dashboard orders={orders} setOrders={setOrders} menuItems={menuItems} inventory={inventory} customers={customers} staff={staff} tables={tables} settings={settings} onNavigate={handleNavigate} darkMode={getTabDarkMode('dashboard')} />;
      case 'reports':
        return <Reports orders={orders} menuItems={menuItems} inventory={inventory} staff={staff} customers={customers} settings={settings} onNavigate={handleNavigate} darkMode={getTabDarkMode('reports')} />;
      case 'crm':
        return <CRM customers={customers} setCustomers={setCustomers} darkMode={getTabDarkMode('crm')} />;
      case 'staff':
        return <Staff staff={staff} setStaff={setStaff} darkMode={getTabDarkMode('staff')} />;
      case 'menu':
        return <Menu menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('menu')} />;
      case 'inventory':
        return <Inventory inventory={inventory} setInventory={setInventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('inventory')} />;
      case 'recipes':
        return <RecipeManagement menuItems={menuItems} inventory={inventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('recipes')} />;
      case 'waste':
        return <WasteManagement inventory={inventory} onNavigate={handleNavigate} darkMode={getTabDarkMode('waste')} />;
      case 'reservations':
        return <Reservations tables={tables} customers={customers} onNavigate={handleNavigate} darkMode={getTabDarkMode('reservations')} />;
      case 'tokens':
        return <TokenManagement orders={orders} setOrders={setOrders} onNavigate={handleNavigate} darkMode={getTabDarkMode('tokens')} />;
      case 'tables':
        return <Tables onNavigate={handleNavigate} orders={orders} setOrders={setOrders} tables={tables} setTables={setTables} menuItems={menuItems} darkMode={getTabDarkMode('tables')} />;
      case 'waiters':
        return <Waiters onNavigate={handleNavigate} orders={orders} setOrders={setOrders} staff={staff} darkMode={getTabDarkMode('waiters')} />;
      case 'kitchen':
        return <Kitchen onNavigate={handleNavigate} orders={orders} setOrders={setOrders} menuItems={menuItems} />;
      case 'qrodering':
        return <QROrdering menuItems={menuItems} onNavigate={handleNavigate} darkMode={getTabDarkMode('qrodering')} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} onNavigate={handleNavigate} menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} orders={orders} setOrders={setOrders} staff={staff} setStaff={setStaff} tables={tables} setTables={setTables} darkMode={getTabDarkMode('settings')} />;
      default:
        return <SimplePOS orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} onNavigate={handleNavigate} darkMode={getTabDarkMode('orders')} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      maxWidth: '100%',
      background: 'var(--cafe-bg)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      {/* Header */}
      <header style={{
        background: 'var(--cafe-bg-elevated)',
        padding: isMobile ? '10px 12px' : isMedium ? '12px 16px' : isTablet ? '14px 20px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--cafe-border)',
        boxShadow: 'var(--cafe-shadow-sm)',
        position: 'relative',
        transition: 'all 0.25s ease',
        zIndex: 1000,
        height: isMobile ? '50px' : isMedium ? '55px' : isTablet ? '58px' : '60px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : isMedium ? '10px' : isTablet ? '11px' : '12px' }}>
          <div style={{
            width: isMobile ? '28px' : isMedium ? '32px' : isTablet ? '34px' : '36px',
            height: isMobile ? '28px' : isMedium ? '32px' : isTablet ? '34px' : '36px',
            borderRadius: isMobile ? '8px' : isMedium ? '9px' : isTablet ? '9px' : '10px',
            background: 'linear-gradient(135deg, var(--cafe-accent) 0%, var(--cafe-accent-light) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '14px' : isMedium ? '16px' : isTablet ? '17px' : '18px',
            boxShadow: 'var(--cafe-shadow-glow)',
            transform: 'rotate(-5deg)',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(10deg) scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(-5deg) scale(1)'}
          >
            🥐
          </div>
          <div>
            <div style={{
              fontSize: isMobile ? '14px' : isMedium ? '16px' : isTablet ? '17px' : '18px',
              fontWeight: '700',
              color: 'var(--cafe-text-primary)',
              letterSpacing: '-0.03em',
              fontFamily: '"Outfit", "Sora", sans-serif'
            }}>
              BakeryPOS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : isMedium ? '10px' : isTablet ? '11px' : '12px', flex: 1, justifyContent: 'center', maxWidth: isMobile || isMedium ? '800px' : isTablet ? '900px' : '1000px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : isMedium ? '5px' : isTablet ? '5px' : '6px', flex: 1, minWidth: 0, maxWidth: isMobile || isMedium ? '800px' : isTablet ? '900px' : '1000px' }}>
            <button
              onClick={() => scrollTabs('left')}
              style={{
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border)',
                borderRadius: '50%',
                width: isMobile ? '28px' : isMedium ? '26px' : isTablet ? '27px' : '28px',
                height: isMobile ? '28px' : isMedium ? '26px' : isTablet ? '27px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : isMedium ? '13px' : isTablet ? '13px' : '14px',
                fontWeight: 'bold',
                boxShadow: 'var(--cafe-shadow-sm)',
                transition: 'all 0.2s ease',
                outline: 'none',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--cafe-bg-elevated)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ‹
            </button>
            <div ref={tabsRef} className="no-scrollbar" style={{
              display: 'flex',
              gap: isMobile ? '4px' : isMedium ? '5px' : isTablet ? '5px' : '6px',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '2px',
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap'
            }}>
              {[
                { id: 'orders', label: 'Orders' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'reports', label: 'Reports' },
                { id: 'crm', label: 'Customers', hasDropdown: true },
                { id: 'staff', label: 'Staff' },
                { id: 'menu', label: 'Menu', hasDropdown: true },
                { id: 'recipes', label: 'Recipes', subItem: true },
                { id: 'waste', label: 'Waste', subItem: true },
                { id: 'reservations', label: 'Reservations', subItem: true },
                { id: 'tokens', label: 'Tokens' },
                { id: 'tables', label: 'Tables' },
                { id: 'waiters', label: 'Waiters' },
                { id: 'kitchen', label: 'Kitchen' },
                { id: 'qrodering', label: 'QR Ordering' },
                { id: 'settings', label: 'Settings' }
              ].filter(item => !item.subItem).map(item => (
                <div key={item.id} style={{ position: 'relative' }}>
                  <button
                    data-dropdown-trigger
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.hasDropdown) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setDropdownCoords({
                          top: rect.bottom + 4,
                          left: rect.left
                        });
                        if (item.id === 'menu') {
                          setMenuDropdownOpen(!menuDropdownOpen);
                          setCustomersDropdownOpen(false);
                        }
                        if (item.id === 'crm') {
                          setCustomersDropdownOpen(!customersDropdownOpen);
                          setMenuDropdownOpen(false);
                        }
                      } else {
                        handleNavigate(item.id);
                      }
                    }}
                    style={{
                      padding: isMobile ? '6px 10px' : isMedium ? '7px 12px' : isTablet ? '7px 14px' : '8px 16px',
                      background: activeTab === item.id ? 'var(--cafe-accent)' : 'transparent',
                      color: activeTab === item.id ? '#ffffff' : 'var(--cafe-text-secondary)',
                      border: 'none',
                      borderRadius: isMobile ? '6px' : isMedium ? '7px' : isTablet ? '7px' : '8px',
                      fontSize: isMobile ? '11px' : isMedium ? '12px' : isTablet ? '12px' : '13px',
                      fontWeight: activeTab === item.id ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      whiteSpace: 'nowrap',
                      boxShadow: activeTab === item.id ? 'var(--cafe-shadow-glow)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.background = 'var(--cafe-bg-hover)';
                        e.currentTarget.style.color = 'var(--cafe-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--cafe-text-secondary)';
                      }
                    }}
                  >
                    {item.label}
                    {item.hasDropdown && <span style={{ fontSize: '10px' }}>▼</span>}
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => scrollTabs('right')}
              style={{
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border)',
                borderRadius: '50%',
                width: isMobile ? '28px' : isMedium ? '26px' : isTablet ? '27px' : '28px',
                height: isMobile ? '28px' : isMedium ? '26px' : isTablet ? '27px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : isMedium ? '13px' : isTablet ? '13px' : '14px',
                fontWeight: 'bold',
                boxShadow: 'var(--cafe-shadow-sm)',
                transition: 'all 0.2s ease',
                outline: 'none',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--cafe-bg-elevated)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              ›
            </button>
          </div>
      </div>

      {/* Desktop Dropdowns positioned fixed to avoid overflow clipping */}
      {menuDropdownOpen && (
        <div 
          ref={menuDropdownRef}
          data-dropdown
          style={{
            position: 'fixed',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            background: 'var(--cafe-bg-elevated)',
            border: '1px solid var(--cafe-border)',
            borderRadius: '8px',
            boxShadow: 'var(--cafe-shadow-lg)',
            zIndex: 999999,
            minWidth: '140px',
            padding: '4px'
          }}>
          <button
            data-dropdown-trigger
            type="button"
            onClick={() => {
              handleNavigate('menu');
              setMenuDropdownOpen(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: activeTab === 'menu' ? 'var(--cafe-accent-dim)' : 'transparent',
              color: activeTab === 'menu' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'menu' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'menu') {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'menu') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Menu Items
          </button>
          <button
            data-dropdown-trigger
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('recipes');
              setMenuDropdownOpen(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: activeTab === 'recipes' ? 'var(--cafe-accent-dim)' : 'transparent',
              color: activeTab === 'recipes' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'recipes' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'recipes') {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'recipes') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Recipes
          </button>
          <button
            data-dropdown-trigger
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('waste');
              setMenuDropdownOpen(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: activeTab === 'waste' ? 'var(--cafe-accent-dim)' : 'transparent',
              color: activeTab === 'waste' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'waste' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'waste') {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'waste') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Waste
          </button>
        </div>
      )}

      {customersDropdownOpen && (
        <div 
          ref={customersDropdownRef}
          data-dropdown
          style={{
            position: 'fixed',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            background: 'var(--cafe-bg-elevated)',
            border: '1px solid var(--cafe-border)',
            borderRadius: '8px',
            boxShadow: 'var(--cafe-shadow-lg)',
            zIndex: 999999,
            minWidth: '140px',
            padding: '4px'
          }}>
          <button
            data-dropdown-trigger
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('crm');
              setCustomersDropdownOpen(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: activeTab === 'crm' ? 'var(--cafe-accent-dim)' : 'transparent',
              color: activeTab === 'crm' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'crm' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'crm') {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'crm') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Customers
          </button>
          <button
            data-dropdown-trigger
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('reservations');
              setCustomersDropdownOpen(false);
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              background: activeTab === 'reservations' ? 'var(--cafe-accent-dim)' : 'transparent',
              color: activeTab === 'reservations' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: activeTab === 'reservations' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'reservations') {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'reservations') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            Reservations
          </button>
        </div>
      )}
      </header>

      {/* Main Content */}
      <main style={{ padding: '0' }}>
        {renderContent()}
      </main>
    </div>
  );
}
