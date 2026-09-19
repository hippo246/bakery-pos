import React, { useState, useEffect, useMemo } from 'react';
import KitchenDisplaySystem from './KitchenDisplaySystem';
import OracleKDS from './OracleKDS';
import SplitKDS from './SplitKDS';
import ChowbusKDS from './ChowbusKDS';
import KitchenSettingsPanel from './KitchenSettingsPanel';
import OracleKDSSettingsPanel from './OracleKDSSettingsPanel';
import { loadSettings } from './KitchenSettingsPanel';
import useScreenSize from '../../hooks/useScreenSize';

export default function Kitchen({ onNavigate, orders = [], setOrders, menuItems = [], staff = [] }) {
  const screenSize = useScreenSize();
  const [qrOrders, setQROrders] = useState([]);
  const [settings, setSettings] = useState(loadSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState(null);

  // Load KDS modes from settings
  const useOracleKDS = settings.oracleKDS?.enabled || false;
  const useSplitKDS = settings.splitKDS?.enabled || false;
  const useChowbusKDS = settings.chowbusKDS?.enabled || false;
  const oracleSettings = settings.oracleKDS || {};
  const splitSettings = settings.splitKDS || {};

  // Sync Oracle KDS, Split KDS, and Chowbus KDS settings with main settings when changed
  useEffect(() => {
    const checkMainSettings = () => {
      try {
        const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
        const oracleEnabled = mainSettings.kitchen?.useOracleKDS || mainSettings.kitchen?.oracleKDS?.enabled || false;
        const splitEnabled = mainSettings.kitchen?.useSplitKDS || mainSettings.kitchen?.splitKDS?.enabled || false;
        const chowbusEnabled = mainSettings.kitchen?.useChowbusKDS || mainSettings.kitchen?.chowbusKDS?.enabled || false;
        console.log('Kitchen modes sync:', { oracleEnabled, splitEnabled, chowbusEnabled });
        setSettings(prev => ({
          ...prev,
          oracleKDS: {
            ...prev.oracleKDS,
            enabled: oracleEnabled
          },
          splitKDS: {
            ...prev.splitKDS,
            enabled: splitEnabled
          },
          chowbusKDS: {
            ...prev.chowbusKDS,
            enabled: chowbusEnabled
          }
        }));
      } catch (error) {
        console.error('Error syncing kitchen mode settings:', error);
      }
    };

    const handleStorageChange = () => {
      checkMainSettings();
    };

    checkMainSettings();
    const interval = setInterval(checkMainSettings, 2000);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cafeos_settings_changed', handleStorageChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cafeos_settings_changed', handleStorageChange);
    };
  }, []);

  const handleOracleSettingsChange = (newOracleSettings) => {
    setSettings(prev => ({
      ...prev,
      oracleKDS: {
        ...prev.oracleKDS,
        ...newOracleSettings
      }
    }));
    try {
      const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      mainSettings.kitchen = mainSettings.kitchen || {};
      mainSettings.kitchen.oracleKDS = {
        ...mainSettings.kitchen.oracleKDS,
        ...newOracleSettings
      };
      localStorage.setItem('cafeos_settings', JSON.stringify(mainSettings));
      console.log('Oracle KDS settings saved:', mainSettings.kitchen.oracleKDS);
    } catch (error) {
      console.error('Error saving Oracle KDS settings:', error);
    }
  };

  const handleSplitSettingsChange = (newSplitSettings) => {
    setSettings(prev => ({
      ...prev,
      splitKDS: {
        ...prev.splitKDS,
        ...newSplitSettings
      }
    }));
    try {
      const mainSettings = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
      mainSettings.kitchen = mainSettings.kitchen || {};
      mainSettings.kitchen.splitKDS = {
        ...mainSettings.kitchen.splitKDS,
        ...newSplitSettings
      };
      localStorage.setItem('cafeos_settings', JSON.stringify(mainSettings));
      console.log('Split KDS settings saved:', mainSettings.kitchen.splitKDS);
    } catch (error) {
      console.error('Error saving Split KDS settings:', error);
    }
  };

  // Poll for QR orders from localStorage
  useEffect(() => {
    const loadQROrders = () => {
      try {
        const storedOrders = JSON.parse(localStorage.getItem('qr_orders') || '[]');
        setQROrders(Array.isArray(storedOrders) ? storedOrders : []);
        setError(null);
      } catch (error) {
        console.error('Error loading QR orders:', error);
        setQROrders([]); // Set empty array on error to prevent undefined issues
        setError('Failed to load QR orders');
      }
    };

    loadQROrders();
    const interval = setInterval(loadQROrders, 15000); // Reduced to 15s for better responsiveness

    return () => clearInterval(interval);
  }, []);

  // Combine regular orders with QR orders, with deduplication
  const allOrders = useMemo(() => {
    const orderMap = new Map();
    
    // Add regular orders
    orders.forEach(order => {
      orderMap.set(order.id, order);
    });
    
    // Add QR orders, avoiding duplicates
    qrOrders.forEach(qrOrder => {
      if (!orderMap.has(qrOrder.id)) {
        orderMap.set(qrOrder.id, { ...qrOrder, isQROrder: true });
      }
    });
    
    return Array.from(orderMap.values());
  }, [orders, qrOrders]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#000000',
      fontFamily: '"Courier New", monospace',
      overflow: 'hidden'
    }}>
      {/* Error Display */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#ef4444',
          color: '#ffffff',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: '1px solid #ffffff',
              color: '#ffffff',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Settings Button - Show in both modes */}
      <div style={{
        padding: '8px 16px',
        background: '#000000',
        borderBottom: '1px solid #00ff00',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: '8px 16px',
            background: '#000000',
            color: '#00ff00',
            border: '1px solid #00ff00',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontFamily: '"Courier New", monospace'
          }}
        >
          [SETTINGS]
        </button>
      </div>

      {/* Content - Switch between Standard Kitchen, Oracle KDS, Split KDS, and Chowbus KDS */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {useChowbusKDS ? (
          <ChowbusKDS 
            orders={allOrders} 
            setOrders={setOrders} 
            menuItems={menuItems}
            staff={staff}
          />
        ) : useSplitKDS ? (
          <SplitKDS 
            orders={allOrders} 
            setOrders={setOrders} 
            menuItems={menuItems} 
            splitSettings={splitSettings}
            onSplitSettingsChange={handleSplitSettingsChange}
            staff={staff}
          />
        ) : useOracleKDS ? (
          <OracleKDS 
            orders={allOrders} 
            setOrders={setOrders} 
            menuItems={menuItems} 
            oracleSettings={oracleSettings}
            onOracleSettingsChange={handleOracleSettingsChange}
            staff={staff}
          />
        ) : (
          <KitchenDisplaySystem 
            screenSize={screenSize} 
            orders={allOrders} 
            setOrders={setOrders} 
            settings={settings} 
            onSettingsChange={(newSettings) => {
              setSettings(newSettings);
            }}
            menuItems={menuItems}
            staff={staff}
          />
        )}
      </div>

      {/* Settings Panel - Switch based on KDS mode */}
      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          {useOracleKDS ? (
            <OracleKDSSettingsPanel
              settings={oracleSettings}
              onSettingsChange={handleOracleSettingsChange}
              darkMode={true}
            />
          ) : (
            <KitchenSettingsPanel
              onClose={() => setShowSettings(false)}
              settings={settings}
              onSettingsChange={(newSettings) => {
                setSettings(newSettings);
                // Also save Oracle KDS setting if changed
                if (newSettings.oracleKDS?.enabled !== settings.oracleKDS?.enabled) {
                  handleOracleSettingsChange({ enabled: newSettings.oracleKDS?.enabled });
                }
              }}
            />
          )}
          <button
            onClick={() => setShowSettings(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              padding: '8px 16px',
              background: '#ff0000',
              color: '#ffffff',
              border: '2px solid #ff0000',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: '"Courier New", monospace'
            }}
          >
            [CLOSE]
          </button>
        </div>
      )}
    </div>
  );
}
