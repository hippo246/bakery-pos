import React, { useState, useEffect } from 'react';

export default function AggregatorIntegration({ orders = [], onNavigate }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [screenSize, setScreenSize] = useState('large');
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAutoAcceptSettings, setShowAutoAcceptSettings] = useState(false);

  // Aggregator accounts
  const [aggregatorAccounts, setAggregatorAccounts] = useState([
    { id: 1, name: 'Zomato', status: 'connected', apiKey: 'zomato_***', commission: 18, autoAccept: true, lastSync: '2 mins ago' },
    { id: 2, name: 'Swiggy', status: 'connected', apiKey: 'swiggy_***', commission: 20, autoAccept: true, lastSync: '5 mins ago' },
    { id: 3, name: 'Foodpanda', status: 'disconnected', apiKey: '', commission: 15, autoAccept: false, lastSync: 'Never' }
  ]);

  // Auto-acceptance settings
  const [autoAcceptSettings, setAutoAcceptSettings] = useState({
    enabled: true,
    maxPrepTime: 30, // minutes
    autoRejectOutOfStock: true,
    autoRejectHighValue: false,
    maxOrderValue: 5000,
    autoAcceptHours: { start: '10:00', end: '22:00' }
  });

  // Commission tracking data
  const [commissionData, setCommissionData] = useState([
    { aggregator: 'Zomato', totalOrders: 125, grossRevenue: 45000, commission: 8100, netRevenue: 36900 },
    { aggregator: 'Swiggy', totalOrders: 98, grossRevenue: 38000, commission: 7600, netRevenue: 30400 },
    { aggregator: 'Foodpanda', totalOrders: 45, grossRevenue: 15000, commission: 2250, netRevenue: 12750 }
  ]);

  // Recent online orders
  const [onlineOrders, setOnlineOrders] = useState([
    { id: 'ORD-001', aggregator: 'Zomato', customer: 'Rahul Sharma', items: 'Butter Naan, Paneer Tikka', total: 450, status: 'Preparing', time: '2 mins ago' },
    { id: 'ORD-002', aggregator: 'Swiggy', customer: 'Priya Singh', items: 'Chicken Biryani, Raita', total: 380, status: 'Pending', time: '5 mins ago' },
    { id: 'ORD-003', aggregator: 'Zomato', customer: 'Amit Patel', items: 'Veg Thali, Dal Makhani', total: 520, status: 'Delivered', time: '15 mins ago' },
    { id: 'ORD-004', aggregator: 'Swiggy', customer: 'Neha Gupta', items: 'Samosa (2x), Chai', total: 120, status: 'Preparing', time: '8 mins ago' },
    { id: 'ORD-005', aggregator: 'Zomato', customer: 'Vikram Reddy', items: 'Pizza, Garlic Bread', total: 650, status: 'Cancelled', time: '20 mins ago' }
  ]);

  // Native ordering settings
  const [nativeOrdering, setNativeOrdering] = useState({
    enabled: true,
    domain: 'bakery.example.com',
    customBranding: true,
    logo: '',
    themeColor: '#6366f1',
    enableDelivery: true,
    enablePickup: true,
    deliveryRadius: 5, // km
    minOrderValue: 200,
    deliveryFee: 50
  });

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

  const handleToggleAutoAccept = (accountId) => {
    setAggregatorAccounts(accounts => 
      accounts.map(acc => 
        acc.id === accountId ? { ...acc, autoAccept: !acc.autoAccept } : acc
      )
    );
  };

  const handleSyncAccount = (accountId) => {
    setAggregatorAccounts(accounts => 
      accounts.map(acc => 
        acc.id === accountId ? { ...acc, lastSync: 'Just now' } : acc
      )
    );
  };

  const handleAcceptOrder = (orderId) => {
    setOnlineOrders(orders => 
      orders.map(order => 
        order.id === orderId ? { ...order, status: 'Preparing' } : order
      )
    );
  };

  const handleRejectOrder = (orderId) => {
    setOnlineOrders(orders => 
      orders.map(order => 
        order.id === orderId ? { ...order, status: 'Rejected' } : order
      )
    );
  };

  const totalCommission = commissionData.reduce((sum, data) => sum + data.commission, 0);
  const totalGrossRevenue = commissionData.reduce((sum, data) => sum + data.grossRevenue, 0);
  const totalNetRevenue = commissionData.reduce((sum, data) => sum + data.netRevenue, 0);
  const totalOnlineOrders = commissionData.reduce((sum, data) => sum + data.totalOrders, 0);

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
              🛵 Aggregator Integration
            </div>
            <div style={{ color: '#64748b', fontSize: screenSize === 'small' ? '12px' : '14px' }}>
              Manage Zomato, Swiggy & other delivery platforms
            </div>
          </div>
          <button
            onClick={() => setShowAddAccountModal(true)}
            style={{
              padding: screenSize === 'small' ? '10px 16px' : '12px 24px',
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Add Account
          </button>
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
        {['dashboard', 'accounts', 'auto-accept', 'commission', 'native'].map(tab => (
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
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px 32px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: screenSize === 'small' ? '16px' : '24px'
            }}>
              <StatCard
                label="Total Online Orders"
                value={totalOnlineOrders}
                icon="📦"
                color="#6366f1"
                screenSize={screenSize}
              />
              <StatCard
                label="Gross Revenue"
                value={`₹${totalGrossRevenue.toLocaleString()}`}
                icon="💰"
                color="#10b981"
                screenSize={screenSize}
              />
              <StatCard
                label="Commission Paid"
                value={`₹${totalCommission.toLocaleString()}`}
                icon="📊"
                color="#f59e0b"
                screenSize={screenSize}
              />
              <StatCard
                label="Net Revenue"
                value={`₹${totalNetRevenue.toLocaleString()}`}
                icon="🎯"
                color="#8b5cf6"
                screenSize={screenSize}
              />
            </div>

            {/* Recent Online Orders */}
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '700', color: '#0a0a0a' }}>
                  📋 Recent Online Orders
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowAutoAcceptSettings(true)}
                    style={{
                      padding: '8px 16px',
                      background: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ⚙️ Auto-Accept Settings
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Aggregator</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Items</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Time</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {onlineOrders.map((order, index) => (
                      <tr key={order.id} style={{ borderBottom: index < onlineOrders.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0a0a0a', fontWeight: '600' }}>{order.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{order.aggregator}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0a0a0a' }}>{order.customer}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{order.items}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#0a0a0a', fontWeight: '600' }}>₹{order.total}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: order.status === 'Preparing' ? '#fef3c7' : order.status === 'Pending' ? '#dbeafe' : order.status === 'Delivered' ? '#dcfce7' : '#fee2e2',
                            color: order.status === 'Preparing' ? '#92400e' : order.status === 'Pending' ? '#1e40af' : order.status === 'Delivered' ? '#166534' : '#991b1b'
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>{order.time}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {order.status === 'Pending' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => handleAcceptOrder(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#10b981',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleRejectOrder(order.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'accounts' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: screenSize === 'small' ? '1fr' : 'repeat(3, 1fr)',
            gap: '20px'
          }}>
            {aggregatorAccounts.map(account => (
              <div key={account.id} style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#0a0a0a' }}>{account.name}</div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '600',
                    background: account.status === 'connected' ? '#dcfce7' : '#fee2e2',
                    color: account.status === 'connected' ? '#166534' : '#991b1b'
                  }}>
                    {account.status}
                  </span>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>API Key</div>
                  <div style={{ fontSize: '14px', color: '#0a0a0a', fontFamily: 'monospace' }}>{account.apiKey || 'Not configured'}</div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Commission Rate</div>
                  <div style={{ fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>{account.commission}%</div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Last Sync</div>
                  <div style={{ fontSize: '14px', color: '#0a0a0a' }}>{account.lastSync}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#0a0a0a', fontWeight: '500' }}>Auto-Accept</div>
                  <button
                    onClick={() => handleToggleAutoAccept(account.id)}
                    style={{
                      padding: '6px 16px',
                      background: account.autoAccept ? '#10b981' : '#e5e7eb',
                      color: account.autoAccept ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {account.autoAccept ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSyncAccount(account.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: '#6366f1',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Sync Now
                  </button>
                  <button
                    style={{
                      padding: '10px',
                      background: '#ffffff',
                      color: '#64748b',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'auto-accept' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: screenSize === 'small' ? '20px' : '32px',
            maxWidth: '600px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a', marginBottom: '24px' }}>
              ⚙️ Auto-Acceptance Settings
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '4px' }}>
                    Enable Auto-Acceptance
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Automatically accept incoming orders
                  </div>
                </div>
                <button
                  onClick={() => setAutoAcceptSettings({ ...autoAcceptSettings, enabled: !autoAcceptSettings.enabled })}
                  style={{
                    padding: '6px 16px',
                    background: autoAcceptSettings.enabled ? '#10b981' : '#e5e7eb',
                    color: autoAcceptSettings.enabled ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {autoAcceptSettings.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Maximum Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  value={autoAcceptSettings.maxPrepTime}
                  onChange={(e) => setAutoAcceptSettings({ ...autoAcceptSettings, maxPrepTime: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '4px' }}>
                    Auto-Reject Out of Stock Items
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Reject orders if items are out of stock
                  </div>
                </div>
                <button
                  onClick={() => setAutoAcceptSettings({ ...autoAcceptSettings, autoRejectOutOfStock: !autoAcceptSettings.autoRejectOutOfStock })}
                  style={{
                    padding: '6px 16px',
                    background: autoAcceptSettings.autoRejectOutOfStock ? '#10b981' : '#e5e7eb',
                    color: autoAcceptSettings.autoRejectOutOfStock ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {autoAcceptSettings.autoRejectOutOfStock ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Auto-Accept Hours
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="time"
                    value={autoAcceptSettings.autoAcceptHours.start}
                    onChange={(e) => setAutoAcceptSettings({ ...autoAcceptSettings, autoAcceptHours: { ...autoAcceptSettings.autoAcceptHours, start: e.target.value } })}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', color: '#64748b' }}>to</span>
                  <input
                    type="time"
                    value={autoAcceptSettings.autoAcceptHours.end}
                    onChange={(e) => setAutoAcceptSettings({ ...autoAcceptSettings, autoAcceptHours: { ...autoAcceptSettings.autoAcceptHours, end: e.target.value } })}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <button
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

        {activeTab === 'commission' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: screenSize === 'small' ? '16px' : '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '700', color: '#0a0a0a' }}>
                📊 Commission Tracking
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Aggregator</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Orders</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Gross Revenue</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Commission %</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Commission Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Net Revenue</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Margin %</th>
                  </tr>
                </thead>
                <tbody>
                  {commissionData.map((data, index) => (
                    <tr key={index} style={{ borderBottom: index < commissionData.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>{data.aggregator}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#0a0a0a' }}>{data.totalOrders}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#0a0a0a', fontWeight: '600' }}>₹{data.grossRevenue.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>{((data.commission / data.grossRevenue) * 100).toFixed(1)}%</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}>₹{data.commission.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#10b981', fontWeight: '600' }}>₹{data.netRevenue.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>{((data.netRevenue / data.grossRevenue) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0a0a0a', fontWeight: '700' }}>Total</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#0a0a0a', fontWeight: '700' }}>{totalOnlineOrders}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#0a0a0a', fontWeight: '700' }}>₹{totalGrossRevenue.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>-</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#ef4444', fontWeight: '700' }}>₹{totalCommission.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#10b981', fontWeight: '700' }}>₹{totalNetRevenue.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>{((totalNetRevenue / totalGrossRevenue) * 100).toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'native' && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            padding: screenSize === 'small' ? '20px' : '32px',
            maxWidth: '700px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0a0a0a', marginBottom: '24px' }}>
              🌐 Native Online Ordering
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '4px' }}>
                    Enable Native Ordering
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Accept orders directly from your branded website
                  </div>
                </div>
                <button
                  onClick={() => setNativeOrdering({ ...nativeOrdering, enabled: !nativeOrdering.enabled })}
                  style={{
                    padding: '6px 16px',
                    background: nativeOrdering.enabled ? '#10b981' : '#e5e7eb',
                    color: nativeOrdering.enabled ? '#ffffff' : '#64748b',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {nativeOrdering.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Domain
                </label>
                <input
                  type="text"
                  value={nativeOrdering.domain}
                  onChange={(e) => setNativeOrdering({ ...nativeOrdering, domain: e.target.value })}
                  placeholder="yourbakery.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                  Theme Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNativeOrdering({ ...nativeOrdering, themeColor: color })}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: color,
                        border: nativeOrdering.themeColor === color ? '3px solid #0a0a0a' : '2px solid #e5e7eb',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={nativeOrdering.deliveryFee}
                    onChange={(e) => setNativeOrdering({ ...nativeOrdering, deliveryFee: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#0a0a0a', marginBottom: '8px' }}>
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={nativeOrdering.minOrderValue}
                    onChange={(e) => setNativeOrdering({ ...nativeOrdering, minOrderValue: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '13px', color: '#166534', fontWeight: '600', marginBottom: '4px' }}>
                  💡 Benefits of Native Ordering
                </div>
                <div style={{ fontSize: '12px', color: '#166534' }}>
                  • No commission fees (save 15-25% per order)<br/>
                  • Full control over customer data<br/>
                  • Custom branding and domain<br/>
                  • Direct customer relationships
                </div>
              </div>

              <button
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
                Save Configuration
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddAccountModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            padding: '24px'
          }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#0a0a0a',
              marginBottom: '20px'
            }}>
              Add Aggregator Account
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  Platform
                </label>
                <select style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}>
                  <option>Zomato</option>
                  <option>Swiggy</option>
                  <option>Foodpanda</option>
                  <option>Uber Eats</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  API Key
                </label>
                <input
                  type="text"
                  placeholder="Enter API key"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#111111', marginBottom: '6px' }}>
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 18"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#0a0a0a',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color, screenSize }) {
  return (
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
}
