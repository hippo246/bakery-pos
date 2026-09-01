import React, { useState, useEffect } from 'react';
import { getAggregatorService } from '../../services/aggregators/AggregatorService.js';

export default function AggregatorIntegration({ onNavigate, menuItems = [] }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [screenSize, setScreenSize] = useState('large');
  
  const aggregatorService = getAggregatorService();

  // Aggregator connection status - initialized from service
  const [zomatoStatus, setZomatoStatus] = useState({
    connected: false,
    apiKey: '',
    lastSync: null,
    ordersToday: 0,
    revenueToday: 0
  });

  const [swiggyStatus, setSwiggyStatus] = useState({
    connected: false,
    apiKey: '',
    lastSync: null,
    ordersToday: 0,
    revenueToday: 0
  });

  // Orders from aggregators - fetched from service
  const [aggregatorOrders, setAggregatorOrders] = useState([]);

  // Menu sync status
  const [menuSyncStatus, setMenuSyncStatus] = useState({
    zomato: { lastSync: null, status: 'not_synced', items: 0 },
    swiggy: { lastSync: null, status: 'not_synced', items: 0 }
  });

  // Commission data - calculated from service
  const [commissionData, setCommissionData] = useState([
    { platform: 'Zomato', totalOrders: 0, totalRevenue: 0, commission: 0, rate: 0 },
    { platform: 'Swiggy', totalOrders: 0, totalRevenue: 0, commission: 0, rate: 0 }
  ]);

  // Settings
  const [settings, setSettings] = useState({
    zomatoApiKey: '',
    zomatoRestaurantId: '',
    swiggyApiKey: '',
    swiggyRestaurantId: '',
    autoAcceptOrders: true,
    autoSyncMenu: true,
    syncInterval: 30
  });

  // Initialize service and load data
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('aggregator_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    };

    const initializeAggregator = async () => {
      const config = {
        zomato: {
          enabled: !!settings.zomatoApiKey,
          apiKey: settings.zomatoApiKey,
          restaurantId: settings.zomatoRestaurantId,
          environment: 'production'
        },
        swiggy: {
          enabled: !!settings.swiggyApiKey,
          apiKey: settings.swiggyApiKey,
          restaurantId: settings.swiggyRestaurantId,
          environment: 'production'
        },
        polling: {
          enabled: true,
          interval: (settings.syncInterval || 30) * 1000
        }
      };

      try {
        await aggregatorService.initialize(config);
        await refreshData();
      } catch (error) {
        console.error('Failed to initialize aggregator service:', error);
      }
    };

    loadSettings();
    if (settings.zomatoApiKey || settings.swiggyApiKey) {
      initializeAggregator();
    }
  }, []);

  // Refresh data from service
  const refreshData = async () => {
    if (!aggregatorService.isInitialized()) return;

    try {
      const orders = aggregatorService.getOrders();
      const stats = aggregatorService.getStatistics();
      
      setAggregatorOrders(orders);
      
      // Update status based on orders
      const zomatoOrders = orders.filter(o => o.platform === 'Zomato');
      const swiggyOrders = orders.filter(o => o.platform === 'Swiggy');
      
      setZomatoStatus(prev => ({
        ...prev,
        connected: !!settings.zomatoApiKey,
        ordersToday: zomatoOrders.length,
        revenueToday: zomatoOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      }));
      
      setSwiggyStatus(prev => ({
        ...prev,
        connected: !!settings.swiggyApiKey,
        ordersToday: swiggyOrders.length,
        revenueToday: swiggyOrders.reduce((sum, o) => sum + (o.total || 0), 0)
      }));

      // Update commission data
      setCommissionData([
        { 
          platform: 'Zomato', 
          totalOrders: zomatoOrders.length, 
          totalRevenue: zomatoOrders.reduce((sum, o) => sum + (o.total || 0), 0), 
          commission: zomatoOrders.reduce((sum, o) => sum + (o.commission || 0), 0),
          rate: 10
        },
        { 
          platform: 'Swiggy', 
          totalOrders: swiggyOrders.length, 
          totalRevenue: swiggyOrders.reduce((sum, o) => sum + (o.total || 0), 0), 
          commission: swiggyOrders.reduce((sum, o) => sum + (o.commission || 0), 0),
          rate: 10
        }
      ]);
    } catch (error) {
      console.error('Failed to refresh aggregator data:', error);
    }
  };

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSyncMenu = async (platform) => {
    if (!aggregatorService.isInitialized()) {
      alert('Aggregator service not initialized. Please configure API keys first.');
      return;
    }

    try {
      if (platform === 'zomato') {
        setMenuSyncStatus(prev => ({
          ...prev,
          zomato: { ...prev.zomato, status: 'syncing', lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16) }
        }));
        
        const result = await aggregatorService.syncMenu('Zomato', menuItems);
        
        setMenuSyncStatus(prev => ({
          ...prev,
          zomato: { 
            ...prev.zomato, 
            status: 'synced', 
            lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
            items: result.synced || menuItems.length
          }
        }));
      } else {
        setMenuSyncStatus(prev => ({
          ...prev,
          swiggy: { ...prev.swiggy, status: 'syncing', lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16) }
        }));
        
        const result = await aggregatorService.syncMenu('Swiggy', menuItems);
        
        setMenuSyncStatus(prev => ({
          ...prev,
          swiggy: { 
            ...prev.swiggy, 
            status: 'synced', 
            lastSync: new Date().toISOString().replace('T', ' ').substring(0, 16),
            items: result.synced || menuItems.length
          }
        }));
      }
    } catch (error) {
      console.error(`Failed to sync ${platform} menu:`, error);
      setMenuSyncStatus(prev => ({
        ...prev,
        [platform]: { ...prev[platform], status: 'error' }
      }));
      alert(`Failed to sync ${platform} menu: ${error.message}`);
    }
  };

  const handleSaveSettings = async () => {
    // Save to localStorage
    localStorage.setItem('aggregator_settings', JSON.stringify(settings));
    
    // Reinitialize service with new config
    const config = {
      zomato: {
        enabled: !!settings.zomatoApiKey,
        apiKey: settings.zomatoApiKey,
        restaurantId: settings.zomatoRestaurantId,
        environment: 'production'
      },
      swiggy: {
        enabled: !!settings.swiggyApiKey,
        apiKey: settings.swiggyApiKey,
        restaurantId: settings.swiggyRestaurantId,
        environment: 'production'
      },
      polling: {
        enabled: true,
        interval: (settings.syncInterval || 30) * 1000
      }
    };

    try {
      await aggregatorService.updateConfig(config);
      await refreshData();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert(`Failed to save settings: ${error.message}`);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await aggregatorService.updateOrderStatus(orderId, newStatus);
      setAggregatorOrders(orders => orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert(`Failed to update order status: ${error.message}`);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await aggregatorService.acceptOrder(orderId, 30);
      setAggregatorOrders(orders => orders.map(order => 
        order.id === orderId ? { ...order, status: 'preparing' } : order
      ));
    } catch (error) {
      console.error('Failed to accept order:', error);
      alert(`Failed to accept order: ${error.message}`);
    }
  };

  const handleRejectOrder = async (orderId, reason) => {
    try {
      await aggregatorService.rejectOrder(orderId, reason);
      setAggregatorOrders(orders => orders.map(order => 
        order.id === orderId ? { ...order, status: 'rejected' } : order
      ));
    } catch (error) {
      console.error('Failed to reject order:', error);
      alert(`Failed to reject order: ${error.message}`);
    }
  };

  const StatCard = ({ label, value, icon, color, screenSize }) => (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      padding: screenSize === 'small' ? '16px' : '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div style={{ fontSize: '24px' }}>{icon}</div>
      </div>
      <div style={{ fontSize: screenSize === 'small' ? '24px' : '28px', fontWeight: '700', color: '#0a0a0a' }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '16px' : '24px 32px',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
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
              fontSize: screenSize === 'small' ? '20px' : '28px',
              fontWeight: '800',
              color: '#0a0a0a',
              letterSpacing: '-0.5px'
            }}>
              🍔 Aggregator Integration
            </div>
            <div style={{ color: '#64748b', fontSize: screenSize === 'small' ? '12px' : '14px' }}>
              Manage Zomato & Swiggy orders, menu sync, and analytics
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '12px 16px' : '16px 32px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        overflow: 'auto'
      }}>
        {['dashboard', 'orders', 'menu', 'analytics', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#64748b',
              border: activeTab === tab ? 'none' : '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '12px' : '13px',
              fontWeight: '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px 32px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'dashboard' && (
          <>
            {/* Connection Status */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)',
              gap: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>🟢</div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a' }}>Zomato</div>
                      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Connected</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: '#10b981',
                    color: '#ffffff'
                  }}>
                    Online
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Orders Today</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>{zomatoStatus.ordersToday}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Revenue Today</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>₹{zomatoStatus.revenueToday.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>🟢</div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a' }}>Swiggy</div>
                      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Connected</div>
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: '#10b981',
                    color: '#ffffff'
                  }}>
                    Online
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Orders Today</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>{swiggyStatus.ordersToday}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Revenue Today</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a' }}>₹{swiggyStatus.revenueToday.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: '24px'
            }}>
              <StatCard label="Total Orders" value={zomatoStatus.ordersToday + swiggyStatus.ordersToday} icon="📦" color="#6366f1" screenSize={screenSize} />
              <StatCard label="Total Revenue" value={`₹${(zomatoStatus.revenueToday + swiggyStatus.revenueToday).toLocaleString()}`} icon="💰" color="#10b981" screenSize={screenSize} />
              <StatCard label="Commission Paid" value={`₹${(zomatoStatus.revenueToday * 0.1 + swiggyStatus.revenueToday * 0.1).toLocaleString()}`} icon="📊" color="#f59e0b" screenSize={screenSize} />
              <StatCard label="Menu Sync" value="Active" icon="🔄" color="#8b5cf6" screenSize={screenSize} />
            </div>

            {/* Recent Orders */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: screenSize === 'small' ? '16px' : '20px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '700',
                color: '#0a0a0a'
              }}>
                📦 Recent Aggregator Orders
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Platform</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Items</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatorOrders.map((order, index) => (
                      <tr key={order.id} style={{ borderBottom: index < aggregatorOrders.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: order.platform === 'Zomato' ? '#ef4444' : '#f97316',
                            color: '#ffffff'
                          }}>
                            {order.platform}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>{order.orderId}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.customer}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', maxWidth: '200px' }}>{order.items}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>₹{order.total}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              border: '1px solid #e5e7eb',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="ready">Ready</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: screenSize === 'small' ? '16px' : '20px',
              borderBottom: '1px solid #e5e7eb',
              fontSize: screenSize === 'small' ? '16px' : '18px',
              fontWeight: '700',
              color: '#0a0a0a'
            }}>
              📦 All Aggregator Orders
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Platform</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Items</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatorOrders.map((order, index) => (
                    <tr key={order.id} style={{ borderBottom: index < aggregatorOrders.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: order.platform === 'Zomato' ? '#ef4444' : '#f97316',
                          color: '#ffffff'
                        }}>
                          {order.platform}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>{order.orderId}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.customer}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', maxWidth: '200px' }}>{order.items}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>₹{order.total}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>-₹{order.commission}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="picked_up">Picked Up</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(2, 1fr)',
            gap: '24px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a', marginBottom: '20px' }}>
                🍔 Zomato Menu Sync
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  Last Sync: {menuSyncStatus.zomato.lastSync}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  Status: <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: menuSyncStatus.zomato.status === 'synced' ? '#10b981' : '#f59e0b',
                    color: '#ffffff'
                  }}>
                    {menuSyncStatus.zomato.status}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  Items Synced: {menuSyncStatus.zomato.items}
                </div>
              </div>
              <button
                onClick={() => handleSyncMenu('zomato')}
                disabled={menuSyncStatus.zomato.status === 'syncing'}
                style={{
                  padding: '12px 24px',
                  background: menuSyncStatus.zomato.status === 'syncing' ? '#9ca3af' : '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: menuSyncStatus.zomato.status === 'syncing' ? 'not-allowed' : 'pointer'
                }}
              >
                {menuSyncStatus.zomato.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a', marginBottom: '20px' }}>
                🍕 Swiggy Menu Sync
              </div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  Last Sync: {menuSyncStatus.swiggy.lastSync}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                  Status: <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: menuSyncStatus.swiggy.status === 'synced' ? '#10b981' : '#f59e0b',
                    color: '#ffffff'
                  }}>
                    {menuSyncStatus.swiggy.status}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  Items Synced: {menuSyncStatus.swiggy.items}
                </div>
              </div>
              <button
                onClick={() => handleSyncMenu('swiggy')}
                disabled={menuSyncStatus.swiggy.status === 'syncing'}
                style={{
                  padding: '12px 24px',
                  background: menuSyncStatus.swiggy.status === 'syncing' ? '#9ca3af' : '#f97316',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: menuSyncStatus.swiggy.status === 'syncing' ? 'not-allowed' : 'pointer'
                }}
              >
                {menuSyncStatus.swiggy.status === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: '24px'
            }}>
              <StatCard label="Zomato Orders" value={commissionData[0].totalOrders} icon="🔴" color="#ef4444" screenSize={screenSize} />
              <StatCard label="Swiggy Orders" value={commissionData[1].totalOrders} icon="🟠" color="#f97316" screenSize={screenSize} />
              <StatCard label="Total Commission" value={`₹${(commissionData[0].commission + commissionData[1].commission).toLocaleString()}`} icon="💸" color="#ef4444" screenSize={screenSize} />
              <StatCard label="Avg Commission" value="10%" icon="📊" color="#6366f1" screenSize={screenSize} />
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a', marginBottom: '20px' }}>
                💰 Commission Breakdown
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Platform</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Orders</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Revenue</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Commission</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionData.map((data, index) => (
                      <tr key={data.platform} style={{ borderBottom: index < commissionData.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: data.platform === 'Zomato' ? '#ef4444' : '#f97316',
                            color: '#ffffff'
                          }}>
                            {data.platform}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{data.totalOrders}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>₹{data.totalRevenue.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>-₹{data.commission.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{data.rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: '24px',
            maxWidth: '600px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a', marginBottom: '20px' }}>
              ⚙️ Aggregator Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Zomato API Key
                </label>
                <input
                  type="password"
                  value={settings.zomatoApiKey}
                  onChange={(e) => setSettings({ ...settings, zomatoApiKey: e.target.value })}
                  placeholder="Enter Zomato API Key"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Zomato Restaurant ID
                </label>
                <input
                  type="text"
                  value={settings.zomatoRestaurantId}
                  onChange={(e) => setSettings({ ...settings, zomatoRestaurantId: e.target.value })}
                  placeholder="Enter Zomato Restaurant ID"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Swiggy API Key
                </label>
                <input
                  type="password"
                  value={settings.swiggyApiKey}
                  onChange={(e) => setSettings({ ...settings, swiggyApiKey: e.target.value })}
                  placeholder="Enter Swiggy API Key"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Swiggy Restaurant ID
                </label>
                <input
                  type="text"
                  value={settings.swiggyRestaurantId}
                  onChange={(e) => setSettings({ ...settings, swiggyRestaurantId: e.target.value })}
                  placeholder="Enter Swiggy Restaurant ID"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Sync Interval (seconds)
                </label>
                <input
                  type="number"
                  value={settings.syncInterval}
                  onChange={(e) => setSettings({ ...settings, syncInterval: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                onClick={handleSaveSettings}
                style={{
                  padding: '12px 24px',
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
