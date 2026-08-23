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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [customersDropdownOpen, setCustomersDropdownOpen] = useState(false);
  const tabsRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsMedium(width >= 768 && width < 1200);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuDropdownOpen || customersDropdownOpen) {
        const target = event.target;
        const menuButton = target.closest('button');
        if (menuButton && (menuButton.textContent.includes('Menu') || menuButton.textContent.includes('Customers'))) {
          return;
        }
        setMenuDropdownOpen(false);
        setCustomersDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuDropdownOpen, customersDropdownOpen]);

  useEffect(() => {
    localStorage.setItem('bakerypos_active_tab', activeTab);
  }, [activeTab]);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 180;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <SimplePOS orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} settings={settings} setSettings={setSettings} staff={staff} tables={tables} setTables={setTables} onNavigate={handleNavigate} />;
      case 'dashboard':
        return <Dashboard orders={orders} setOrders={setOrders} menuItems={menuItems} inventory={inventory} onNavigate={handleNavigate} />;
      case 'reports':
        return <Reports orders={orders} menuItems={menuItems} staff={staff} customers={customers} inventory={inventory} onNavigate={handleNavigate} />;
      case 'crm':
        return <CRM customers={customers} setCustomers={setCustomers} orders={orders} onNavigate={handleNavigate} />;
      case 'staff':
        return <Staff staff={staff} setStaff={setStaff} onNavigate={handleNavigate} />;
      case 'menu':
        return <Menu menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} onNavigate={handleNavigate} />;
      case 'inventory':
        return <Menu menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} onNavigate={handleNavigate} />;
      case 'recipes':
        return <RecipeManagement menuItems={menuItems} inventory={inventory} onNavigate={handleNavigate} />;
      case 'waste':
        return <WasteManagement inventory={inventory} onNavigate={handleNavigate} />;
      case 'reservations':
        return <Reservations tables={tables} customers={customers} onNavigate={handleNavigate} />;
      case 'tokens':
        return <TokenManagement orders={orders} setOrders={setOrders} onNavigate={handleNavigate} />;
      case 'tables':
        return <Tables onNavigate={handleNavigate} orders={orders} setOrders={setOrders} tables={tables} setTables={setTables} menuItems={menuItems} />;
      case 'waiters':
        return <Waiters onNavigate={handleNavigate} orders={orders} setOrders={setOrders} staff={staff} />;
      case 'kitchen':
        return <Kitchen onNavigate={handleNavigate} orders={orders} setOrders={setOrders} menuItems={menuItems} />;
      case 'settings':
        return <Settings settings={settings} setSettings={setSettings} onNavigate={handleNavigate} menuItems={menuItems} setMenuItems={setMenuItems} inventory={inventory} setInventory={setInventory} customers={customers} setCustomers={setCustomers} orders={orders} setOrders={setOrders} staff={staff} setStaff={setStaff} tables={tables} setTables={setTables} />;
      default:
        return <SimplePOS orders={orders} setOrders={setOrders} menuItems={menuItems} setMenuItems={setMenuItems} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      maxWidth: '100%',
      background: 'var(--cafe-bg)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
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
        padding: isMobile ? '10px 12px' : isMedium ? '12px 16px' : '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--cafe-border)',
        boxShadow: 'var(--cafe-shadow-sm)',
        position: 'relative',
        transition: 'all 0.25s ease',
        zIndex: 50,
        minHeight: isMobile ? '50px' : isMedium ? '55px' : '60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : isMedium ? '10px' : '12px' }}>
          {onNavigate && (
            <button
              onClick={() => onNavigate?.('dashboard')}
              style={{
                padding: isMobile ? '6px 10px' : isMedium ? '8px 12px' : '10px 16px',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border)',
                borderRadius: isMobile ? '6px' : isMedium ? '7px' : '8px',
                fontSize: isMobile ? '11px' : isMedium ? '12px' : '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--cafe-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--cafe-bg-elevated)';
              }}
            >
              ← Back
            </button>
          )}
          <div style={{
            width: isMobile ? '28px' : isMedium ? '32px' : '36px',
            height: isMobile ? '28px' : isMedium ? '32px' : '36px',
            borderRadius: isMobile ? '8px' : isMedium ? '9px' : '10px',
            background: 'linear-gradient(135deg, var(--cafe-accent) 0%, var(--cafe-accent-light) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '14px' : isMedium ? '16px' : '18px',
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
              fontSize: isMobile ? '14px' : isMedium ? '16px' : '18px',
              fontWeight: '700',
              color: 'var(--cafe-text-primary)',
              letterSpacing: '-0.03em',
              fontFamily: '"Outfit", "Sora", sans-serif'
            }}>
              BakeryPOS
            </div>
          </div>
        </div>

        {isMobile ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                padding: isMobile ? '6px 10px' : '8px 14px',
                background: 'var(--cafe-accent)',
                color: '#ffffff',
                border: 'none',
                borderRadius: isMobile ? '6px' : '8px',
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'var(--cafe-shadow-glow)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{activeTab.toUpperCase()}</span>
              <span>▼</span>
            </button>
            {isMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                background: 'var(--cafe-bg-elevated)',
                border: '1px solid var(--cafe-border)',
                borderRadius: '12px',
                boxShadow: 'var(--cafe-shadow-lg)',
                zIndex: 3000,
                marginTop: '8px',
                width: '180px',
                maxHeight: '260px',
                overflowY: 'auto',
                padding: '4px'
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
                  { id: 'settings', label: 'Settings' }
                ].filter(item => !item.subItem).map(item => (
                  <div key={item.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        if (item.hasDropdown) {
                          if (item.id === 'menu') setMenuDropdownOpen(!menuDropdownOpen);
                          if (item.id === 'crm') setCustomersDropdownOpen(!customersDropdownOpen);
                        } else {
                          handleNavigate(item.id);
                          setIsMenuOpen(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 14px',
                        background: activeTab === item.id ? 'var(--cafe-accent-dim)' : 'transparent',
                        color: activeTab === item.id ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: activeTab === item.id ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                      onMouseEnter={(e) => {
                        if (activeTab !== item.id) {
                          e.currentTarget.style.background = 'var(--cafe-bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTab !== item.id) {
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      <span>{item.label}</span>
                      {item.hasDropdown && <span style={{ fontSize: '10px' }}>▼</span>}
                    </button>
                    
                    {item.hasDropdown && (
                      <div style={{
                        marginLeft: '12px',
                        marginTop: '4px',
                        display: (item.id === 'menu' && menuDropdownOpen) || (item.id === 'crm' && customersDropdownOpen) ? 'block' : 'none'
                      }}>
                        {item.id === 'menu' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate('menu');
                                setMenuDropdownOpen(false);
                                setIsMenuOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: activeTab === 'menu' ? 'var(--cafe-accent-dim)' : 'transparent',
                                color: activeTab === 'menu' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: activeTab === 'menu' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Menu Items
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate('recipes');
                                setMenuDropdownOpen(false);
                                setIsMenuOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: activeTab === 'recipes' ? 'var(--cafe-accent-dim)' : 'transparent',
                                color: activeTab === 'recipes' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: activeTab === 'recipes' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Recipes
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate('waste');
                                setMenuDropdownOpen(false);
                                setIsMenuOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: activeTab === 'waste' ? 'var(--cafe-accent-dim)' : 'transparent',
                                color: activeTab === 'waste' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: activeTab === 'waste' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Waste
                            </button>
                          </>
                        )}
                        
                        {item.id === 'crm' && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate('crm');
                                setCustomersDropdownOpen(false);
                                setIsMenuOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: activeTab === 'crm' ? 'var(--cafe-accent-dim)' : 'transparent',
                                color: activeTab === 'crm' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: activeTab === 'crm' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Customers
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate('reservations');
                                setCustomersDropdownOpen(false);
                                setIsMenuOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 14px',
                                background: activeTab === 'reservations' ? 'var(--cafe-accent-dim)' : 'transparent',
                                color: activeTab === 'reservations' ? 'var(--cafe-accent)' : 'var(--cafe-text-primary)',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: activeTab === 'reservations' ? '600' : '400',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              Reservations
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : isMedium ? '5px' : '6px', flex: 1, minWidth: 0, position: 'relative' }}>
            <button
              onClick={() => scrollTabs('left')}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border)',
                borderRadius: '50%',
                width: isMobile ? '28px' : isMedium ? '26px' : '28px',
                height: isMobile ? '28px' : isMedium ? '26px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : isMedium ? '13px' : '14px',
                fontWeight: 'bold',
                boxShadow: 'var(--cafe-shadow-sm)',
                transition: 'all 0.2s ease',
                outline: 'none',
                flexShrink: 0,
                zIndex: 100
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
              gap: isMobile ? '4px' : isMedium ? '5px' : '6px',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '2px',
              flex: 1,
              minWidth: 0,
              paddingLeft: isMobile ? '36px' : isMedium ? '34px' : '36px',
              paddingRight: isMobile ? '36px' : isMedium ? '34px' : '36px'
            }}>
              {[
                { id: 'orders', label: 'Orders' },
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'reports', label: 'Reports (80+)' },
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
                { id: 'settings', label: 'Settings' }
              ].filter(item => !item.subItem).map(item => (
                <div key={item.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      if (item.hasDropdown) {
                        if (item.id === 'menu') setMenuDropdownOpen(!menuDropdownOpen);
                        if (item.id === 'crm') setCustomersDropdownOpen(!customersDropdownOpen);
                      } else {
                        handleNavigate(item.id);
                      }
                    }}
                    style={{
                      padding: isMobile ? '6px 10px' : isMedium ? '7px 12px' : '8px 16px',
                      background: activeTab === item.id ? 'var(--cafe-accent)' : 'transparent',
                      color: activeTab === item.id ? '#ffffff' : 'var(--cafe-text-secondary)',
                      border: 'none',
                      borderRadius: isMobile ? '6px' : isMedium ? '7px' : '8px',
                      fontSize: isMobile ? '11px' : isMedium ? '12px' : '13px',
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
                  
                  {item.hasDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: 'var(--cafe-bg-elevated)',
                      border: '1px solid var(--cafe-border)',
                      borderRadius: '8px',
                      boxShadow: 'var(--cafe-shadow-lg)',
                      zIndex: 99999,
                      marginTop: '4px',
                      minWidth: '140px',
                      display: (item.id === 'menu' && menuDropdownOpen) || (item.id === 'crm' && customersDropdownOpen) ? 'block' : 'none'
                    }}>
                      {item.id === 'menu' && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
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
                        </>
                      )}
                      
                      {item.id === 'crm' && (
                        <>
                          <button
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
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => scrollTabs('right')}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'var(--cafe-bg-elevated)',
                color: 'var(--cafe-text-primary)',
                border: '1px solid var(--cafe-border)',
                borderRadius: '50%',
                width: isMobile ? '28px' : isMedium ? '26px' : '28px',
                height: isMobile ? '28px' : isMedium ? '26px' : '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: isMobile ? '14px' : isMedium ? '13px' : '14px',
                fontWeight: 'bold',
                boxShadow: 'var(--cafe-shadow-sm)',
                transition: 'all 0.2s ease',
                outline: 'none',
                flexShrink: 0,
                zIndex: 100
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
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '0', minHeight: 0 }}>
        {renderContent()}
      </main>
    </div>
  );
}
