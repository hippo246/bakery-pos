import React, { useState, useEffect } from 'react';
import KitchenDisplaySystem from './KitchenDisplaySystem';
import KitchenSettingsPanel, { loadSettings } from './KitchenSettingsPanel';

export default function Kitchen({ onNavigate, orders = [], setOrders, menuItems = [] }) {
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [qrOrders, setQROrders] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(loadSettings());

  // Poll for QR orders from localStorage
  useEffect(() => {
    const loadQROrders = () => {
      try {
        const storedOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        setQROrders(storedOrders);
      } catch (error) {
        console.error('Error loading QR orders:', error);
      }
    };

    loadQROrders();
    const interval = setInterval(loadQROrders, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Combine regular orders with QR orders
  const allOrders = [...orders, ...qrOrders];

  // Screen size detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('small');
      } else if (width < 1200) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('rotate', handleResize);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: settings.display?.darkMode ? '#0f172a' : '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: settings.display?.darkMode ? '#1e293b' : '#ffffff',
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: settings.display?.darkMode ? '1px solid #334155' : '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexDirection: screenSize === 'small' ? 'column' : 'row',
          gap: screenSize === 'small' ? '12px' : '0'
        }}>
          <div>
            <div style={{
              color: settings.display?.darkMode ? '#f8fafc' : '#111827',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              👨‍🍳 Kitchen
            </div>
            <div style={{ color: settings.display?.darkMode ? '#94a3b8' : '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Manage kitchen orders
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: settings.display?.darkMode ? '#334155' : '#111827',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '12px' : '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => onNavigate?.('dashboard')}
              style={{
                padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
                background: settings.display?.darkMode ? '#334155' : '#f9fafb',
                color: settings.display?.darkMode ? '#f1f5f9' : '#111827',
                border: settings.display?.darkMode ? '1px solid #475569' : '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: screenSize === 'small' ? '12px' : '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <KitchenDisplaySystem screenSize={screenSize} orders={allOrders} setOrders={setOrders} settings={settings} onSettingsChange={setSettings} menuItems={menuItems} />
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <KitchenSettingsPanel
          onClose={() => setShowSettings(false)}
          settings={settings}
          onSettingsChange={setSettings}
        />
      )}
    </div>
  );
}
