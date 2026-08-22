import React, { useState, useEffect } from 'react';

export default function WhatsAppBilling({ orders, customers, onNavigate }) {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [screenSize, setScreenSize] = useState('large');
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [whatsappSettings, setWhatsappSettings] = useState({
    enabled: true,
    autoSend: false,
    template: 'standard',
    businessNumber: '+919876543210',
    apiKey: ''
  });

  const [ewaySettings, setEwaySettings] = useState({
    enabled: true,
    gstin: '',
    username: '',
    password: '',
    environment: 'production'
  });

  const [sentBills, setSentBills] = useState([
    { id: 1, orderId: 'ORD-001', customer: 'Rahul Sharma', phone: '+919876543210', sentAt: '2024-01-15 14:30', status: 'delivered' },
    { id: 2, orderId: 'ORD-002', customer: 'Priya Singh', phone: '+919876543211', sentAt: '2024-01-15 15:45', status: 'delivered' },
    { id: 3, orderId: 'ORD-003', customer: 'Amit Patel', phone: '+919876543212', sentAt: '2024-01-15 16:20', status: 'failed' }
  ]);

  const [ewayBills, setEwayBills] = useState([
    { id: 1, orderId: 'ORD-001', ewayNo: 'EWB1234567890', generatedAt: '2024-01-15 14:35', validUntil: '2024-01-16 14:35', status: 'active' },
    { id: 2, orderId: 'ORD-002', ewayNo: 'EWB1234567891', generatedAt: '2024-01-15 15:50', validUntil: '2024-01-16 15:50', status: 'active' }
  ]);

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

  const handleSendWhatsApp = (order) => {
    setSelectedOrder(order);
    setShowSendModal(true);
  };

  const handleGenerateEway = (order) => {
    const newEwayBill = {
      id: Date.now(),
      orderId: order.id,
      ewayNo: `EWB${Date.now()}`,
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16),
      status: 'active'
    };
    setEwayBills([newEwayBill, ...ewayBills]);
  };

  const handleCancelEway = (ewayId) => {
    setEwayBills(ewayBills.map(bill => bill.id === ewayId ? { ...bill, status: 'cancelled' } : bill));
  };

  const handleExtendEway = (ewayId) => {
    setEwayBills(ewayBills.map(bill => bill.id === ewayId ? { 
      ...bill, 
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16) 
    } : bill));
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
      <div style={{ fontSize: screenSize === 'small' ? '24px' : '28px', fontWeight: '700', color: '#1e293b' }}>
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
              color: '#1e293b',
              letterSpacing: '-0.5px'
            }}>
              📱 WhatsApp Billing & E-Way Bills
            </div>
            <div style={{ color: '#64748b', fontSize: screenSize === 'small' ? '12px' : '14px' }}>
              Send e-bills via WhatsApp and generate E-way bills
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
        {['whatsapp', 'eway', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: activeTab === tab ? '#25d366' : 'transparent',
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
            {tab === 'whatsapp' ? '📱 WhatsApp' : tab === 'eway' ? '📋 E-Way Bills' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px 32px', overflow: 'auto', flex: 1 }}>
        {activeTab === 'whatsapp' && (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: screenSize === 'small' ? '16px' : '24px'
            }}>
              <StatCard label="Bills Sent" value={sentBills.length} icon="📤" color="#25d366" screenSize={screenSize} />
              <StatCard label="Delivered" value={sentBills.filter(b => b.status === 'delivered').length} icon="✅" color="#10b981" screenSize={screenSize} />
              <StatCard label="Failed" value={sentBills.filter(b => b.status === 'failed').length} icon="❌" color="#ef4444" screenSize={screenSize} />
              <StatCard label="Success Rate" value="67%" icon="📊" color="#6366f1" screenSize={screenSize} />
            </div>

            {/* Sent Bills Table */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: screenSize === 'small' ? '16px' : '20px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                📤 Sent WhatsApp Bills
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Phone</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Sent At</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentBills.map((bill, index) => (
                      <tr key={bill.id} style={{ borderBottom: index < sentBills.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{bill.orderId}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{bill.customer}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{bill.phone}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{bill.sentAt}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: bill.status === 'delivered' ? '#10b981' : '#ef4444',
                            color: '#ffffff'
                          }}>
                            {bill.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sample Orders for Sending */}
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
                color: '#1e293b'
              }}>
                📋 Orders (Send Bill via WhatsApp)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Customer</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Phone</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 'ORD-006', customer: 'Suresh Kumar', amount: 1250, phone: '+919876543213' },
                      { id: 'ORD-007', customer: 'Anita Desai', amount: 890, phone: '+919876543214' },
                      { id: 'ORD-008', customer: 'Rajesh Verma', amount: 2100, phone: '+919876543215' }
                    ].map((order, index) => (
                      <tr key={order.id} style={{ borderBottom: index < 2 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{order.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.customer}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b', fontWeight: '600' }}>₹{order.amount}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{order.phone}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleSendWhatsApp(order)}
                            style={{
                              padding: '8px 16px',
                              background: '#25d366',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            📱 Send
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'eway' && (
          <>
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: screenSize === 'small' ? '12px' : '20px',
              marginBottom: screenSize === 'small' ? '16px' : '24px'
            }}>
              <StatCard label="E-Way Bills" value={ewayBills.length} icon="📋" color="#6366f1" screenSize={screenSize} />
              <StatCard label="Active" value={ewayBills.filter(b => b.status === 'active').length} icon="✅" color="#10b981" screenSize={screenSize} />
              <StatCard label="Cancelled" value={ewayBills.filter(b => b.status === 'cancelled').length} icon="❌" color="#ef4444" screenSize={screenSize} />
              <StatCard label="Expiring Soon" value="1" icon="⏰" color="#f59e0b" screenSize={screenSize} />
            </div>

            {/* E-Way Bills Table */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <div style={{
                padding: screenSize === 'small' ? '16px' : '20px',
                borderBottom: '1px solid #e5e7eb',
                fontSize: screenSize === 'small' ? '16px' : '18px',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                📋 Generated E-Way Bills
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>E-Way No</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Order ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Generated At</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Valid Until</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ewayBills.map((bill, index) => (
                      <tr key={bill.id} style={{ borderBottom: index < ewayBills.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '600', fontFamily: 'monospace' }}>{bill.ewayNo}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{bill.orderId}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{bill.generatedAt}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{bill.validUntil}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: bill.status === 'active' ? '#10b981' : '#ef4444',
                            color: '#ffffff'
                          }}>
                            {bill.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {bill.status === 'active' && (
                              <>
                                <button
                                  onClick={() => handleExtendEway(bill.id)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#f59e0b',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Extend
                                </button>
                                <button
                                  onClick={() => handleCancelEway(bill.id)}
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
                                  Cancel
                                </button>
                              </>
                            )}
                            <button
                              style={{
                                padding: '6px 12px',
                                background: '#6366f1',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Generate E-Way Bill Form */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                Generate New E-Way Bill
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Order ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Order ID"
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Invoice Number"
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Invoice Date
                  </label>
                  <input
                    type="date"
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Invoice Value (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Enter Invoice Value"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
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
                Generate E-Way Bill
              </button>
            </div>
          </>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* WhatsApp Settings */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                📱 WhatsApp Settings
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      Enable WhatsApp Billing
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Allow sending bills via WhatsApp
                    </div>
                  </div>
                  <button
                    onClick={() => setWhatsappSettings({ ...whatsappSettings, enabled: !whatsappSettings.enabled })}
                    style={{
                      padding: '6px 16px',
                      background: whatsappSettings.enabled ? '#25d366' : '#e5e7eb',
                      color: whatsappSettings.enabled ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {whatsappSettings.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      Auto-Send Bills
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Automatically send bills after order completion
                    </div>
                  </div>
                  <button
                    onClick={() => setWhatsappSettings({ ...whatsappSettings, autoSend: !whatsappSettings.autoSend })}
                    style={{
                      padding: '6px 16px',
                      background: whatsappSettings.autoSend ? '#25d366' : '#e5e7eb',
                      color: whatsappSettings.autoSend ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {whatsappSettings.autoSend ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    Business Number
                  </label>
                  <input
                    type="text"
                    value={whatsappSettings.businessNumber}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, businessNumber: e.target.value })}
                    placeholder="+91XXXXXXXXXX"
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    value={whatsappSettings.apiKey}
                    onChange={(e) => setWhatsappSettings({ ...whatsappSettings, apiKey: e.target.value })}
                    placeholder="Enter WhatsApp Business API Key"
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
                  style={{
                    padding: '12px 24px',
                    background: '#25d366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Save WhatsApp Settings
                </button>
              </div>
            </div>

            {/* E-Way Bill Settings */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              padding: '24px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
                📋 E-Way Bill Settings
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                      Enable E-Way Bills
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Enable E-Way bill generation
                    </div>
                  </div>
                  <button
                    onClick={() => setEwaySettings({ ...ewaySettings, enabled: !ewaySettings.enabled })}
                    style={{
                      padding: '6px 16px',
                      background: ewaySettings.enabled ? '#10b981' : '#e5e7eb',
                      color: ewaySettings.enabled ? '#ffffff' : '#64748b',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {ewaySettings.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={ewaySettings.gstin}
                    onChange={(e) => setEwaySettings({ ...ewaySettings, gstin: e.target.value })}
                    placeholder="Enter GSTIN"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      textTransform: 'uppercase'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    Username
                  </label>
                  <input
                    type="text"
                    value={ewaySettings.username}
                    onChange={(e) => setEwaySettings({ ...ewaySettings, username: e.target.value })}
                    placeholder="Enter E-Way Portal Username"
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={ewaySettings.password}
                    onChange={(e) => setEwaySettings({ ...ewaySettings, password: e.target.value })}
                    placeholder="Enter E-Way Portal Password"
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    Environment
                  </label>
                  <select
                    value={ewaySettings.environment}
                    onChange={(e) => setEwaySettings({ ...ewaySettings, environment: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="production">Production</option>
                    <option value="sandbox">Sandbox</option>
                  </select>
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
                  Save E-Way Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send WhatsApp Modal */}
      {showSendModal && selectedOrder && (
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
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            padding: '32px'
          }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '20px' }}>
              📱 Send Bill via WhatsApp
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                <strong>Order ID:</strong> {selectedOrder.id}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                <strong>Customer:</strong> {selectedOrder.customer}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                <strong>Amount:</strong> ₹{selectedOrder.amount}
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                <strong>Phone:</strong> {selectedOrder.phone}
              </div>
            </div>

            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              The bill will be sent as a PDF to the customer's WhatsApp number.
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSendModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#f9fafb',
                  color: '#111827',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newBill = {
                    id: Date.now(),
                    orderId: selectedOrder.id,
                    customer: selectedOrder.customer,
                    phone: selectedOrder.phone,
                    sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                    status: 'delivered'
                  };
                  setSentBills([newBill, ...sentBills]);
                  setShowSendModal(false);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#25d366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                📱 Send Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
