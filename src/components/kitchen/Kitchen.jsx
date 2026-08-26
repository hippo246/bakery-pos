import React, { useState, useEffect } from 'react';
import KitchenDisplaySystem from './KitchenDisplaySystem';
import { loadSettings } from './KitchenSettingsPanel';
import useScreenSize from '../../hooks/useScreenSize';

export default function Kitchen({ onNavigate, orders = [], setOrders, menuItems = [] }) {
  const screenSize = useScreenSize();
  const [qrOrders, setQROrders] = useState([]);
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#000000',
      fontFamily: '"Courier New", monospace',
      overflow: 'hidden'
    }}>
      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <KitchenDisplaySystem screenSize={screenSize} orders={allOrders} setOrders={setOrders} settings={settings} onSettingsChange={setSettings} menuItems={menuItems} />
      </div>
    </div>
  );
}
