import React, { useState, useMemo, useEffect } from 'react';

export default function SimpleCRM({ customers = [], setCustomers, orders = [], onNavigate, darkMode = true }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    loyaltyPoints: 0,
    tier: 'BRONZE'
  });

  // Loyalty settings
  const [loyaltySettings, setLoyaltySettings] = useState({
    enabled: true,
    pointsPerRupee: 1,
    rupeesPerPoint: 0.5,
    tiers: {
      BRONZE: { minPoints: 0, discount: 0, color: '#cd7f32' },
      SILVER: { minPoints: 500, discount: 5, color: '#c0c0c0' },
      GOLD: { minPoints: 2000, discount: 10, color: '#ffd700' },
      PLATINUM: { minPoints: 5000, discount: 15, color: '#e5e4e2' }
    }
  });
  const [marketingFormData, setMarketingFormData] = useState({
    title: '',
    message: '',
    targetSegment: 'all',
    channel: 'email'
  });

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
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!search) return customers;
    const query = search.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.phone?.includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [customers, search]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setFormData({ name: '', phone: '', email: '', notes: '', loyaltyPoints: 0, tier: 'BRONZE' });
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || '',
      loyaltyPoints: customer.loyaltyPoints || 0,
      tier: customer.tier || 'BRONZE'
    });
    setShowModal(true);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleSaveCustomer = () => {
    if (!formData.name.trim()) return;

    if (selectedCustomer) {
      setCustomers(customers.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, ...formData, updatedAt: new Date().toISOString() }
          : c
      ));
    } else {
      const newCustomer = {
        id: `c${Date.now()}`,
        ...formData,
        visits: 0,
        spend: 0,
        loyaltyPoints: 0,
        tier: 'BRONZE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setCustomers([...customers, newCustomer]);
    }
    setShowModal(false);
  };

  const handleDeleteCustomer = (customerId) => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone and is required for DPDP Act compliance.')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const handleDeleteCustomerData = (customerId) => {
    if (confirm('This will permanently delete all customer data including personal information and order history. This is required for DPDP Act compliance requests. Continue?')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter(o => o.customerId === customerId && o.status === 'COMPLETED');
    const totalSpend = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const customer = customers.find(c => c.id === customerId);
    return {
      visits: customerOrders.length,
      spend: totalSpend,
      loyaltyPoints: customer?.loyaltyPoints || 0,
      tier: customer?.tier || 'BRONZE'
    };
  };

  const calculateLoyaltyPoints = (amount) => {
    return Math.floor(amount * loyaltySettings.pointsPerRupee);
  };

  const calculateTier = (points) => {
    if (points >= loyaltySettings.tiers.PLATINUM.minPoints) return 'PLATINUM';
    if (points >= loyaltySettings.tiers.GOLD.minPoints) return 'GOLD';
    if (points >= loyaltySettings.tiers.SILVER.minPoints) return 'SILVER';
    return 'BRONZE';
  };

  const addLoyaltyPoints = (customerId, amount) => {
    const points = calculateLoyaltyPoints(amount);
    setCustomers(customers.map(c => {
      if (c.id === customerId) {
        const newPoints = (c.loyaltyPoints || 0) + points;
        return {
          ...c,
          loyaltyPoints: newPoints,
          tier: calculateTier(newPoints)
        };
      }
      return c;
    }));
    return points;
  };

  const redeemPoints = (customerId, pointsToRedeem) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || (customer.loyaltyPoints || 0) < pointsToRedeem) {
      return { success: false, message: 'Insufficient points' };
    }
    
    const discountValue = pointsToRedeem * loyaltySettings.rupeesPerPoint;
    setCustomers(customers.map(c => {
      if (c.id === customerId) {
        const newPoints = (c.loyaltyPoints || 0) - pointsToRedeem;
        return {
          ...c,
          loyaltyPoints: newPoints,
          tier: calculateTier(newPoints)
        };
      }
      return c;
    }));
    
    return { success: true, discountValue, message: `Redeemed ₹${discountValue.toFixed(2)}` };
  };

  const getCustomerOrderHistory = (customerId) => {
    return orders.filter(o => o.customerId === customerId).sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  };

  const getCustomerPreferences = (customerId) => {
    const customerOrders = orders.filter(o => o.customerId === customerId && o.status === 'COMPLETED');
    const itemFrequency = {};
    
    customerOrders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const itemName = item.name || item.itemName;
          if (itemName) {
            itemFrequency[itemName] = (itemFrequency[itemName] || 0) + (item.quantity || 1);
          }
        });
      }
    });

    const sortedItems = Object.entries(itemFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return sortedItems;
  };

  const getRecommendations = (customerId) => {
    const preferences = getCustomerPreferences(customerId);
    const allItems = new Set();
    
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const itemName = item.name || item.itemName;
          if (itemName) allItems.add(itemName);
        });
      }
    });

    const customerItems = new Set(preferences.map(p => p.name));
    const recommendations = Array.from(allItems)
      .filter(item => !customerItems.has(item))
      .slice(0, 5);

    return recommendations;
  };

  const handleViewHistory = (customer) => {
    setSelectedCustomer(customer);
    setShowHistoryModal(true);
  };

  const handleSendMarketing = () => {
    setShowMarketingModal(true);
    setMarketingFormData({
      title: '',
      message: '',
      targetSegment: 'all',
      channel: 'email'
    });
  };

  const handleSendCampaign = () => {
    const targetCustomers = marketingFormData.targetSegment === 'all' 
      ? customers 
      : customers.filter(c => {
          const stats = getCustomerStats(c.id);
          if (marketingFormData.targetSegment === 'vip') return stats.spend > 5000;
          if (marketingFormData.targetSegment === 'regular') return stats.visits > 5;
          if (marketingFormData.targetSegment === 'new') return stats.visits <= 2;
          return true;
        });

    console.log('Sending campaign to', targetCustomers.length, 'customers');
    console.log('Campaign:', marketingFormData);
    alert(`Campaign "${marketingFormData.title}" sent to ${targetCustomers.length} customers via ${marketingFormData.channel}`);
    setShowMarketingModal(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: darkMode ? '#000000' : '#f5f7fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '20px' : '32px', overflow: 'auto', flex: 1, background: darkMode ? '#000000' : '#f8fafc' }}>
        {/* Header */}
        <div style={{
          marginBottom: screenSize === 'small' ? '24px' : '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: screenSize === 'small' ? '26px' : '34px',
              fontWeight: '700',
              color: darkMode ? '#ffffff' : '#0a0a0a',
              margin: 0,
              marginBottom: '6px',
              letterSpacing: '-0.5px'
            }}>
              👥 Customer Management
            </h1>
            <p style={{
              fontSize: screenSize === 'small' ? '13px' : '15px',
              color: darkMode ? '#888888' : '#6b7280',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Manage customers, loyalty programs, and marketing campaigns
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          background: darkMode ? '#111111' : '#ffffff',
          borderRadius: '16px',
          padding: screenSize === 'small' ? '18px' : '24px',
          marginBottom: screenSize === 'small' ? '24px' : '32px',
          display: 'flex',
          gap: screenSize === 'small' ? '14px' : '18px',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
          boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}>
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: screenSize === 'small' ? '200px' : '300px',
              padding: screenSize === 'small' ? '12px 16px' : '14px 18px',
              border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              outline: 'none',
              background: darkMode ? '#000000' : '#ffffff',
              color: darkMode ? '#ffffff' : '#0a0a0a'
            }}
          />
          <button
            onClick={handleAddCustomer}
            style={{
              padding: screenSize === 'small' ? '12px 20px' : '14px 24px',
              background: '#0a0a0a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(17, 24, 39, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#0a0a0a';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#0a0a0a';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            ➕ Add Customer
          </button>
          <button
            onClick={handleSendMarketing}
            style={{
              padding: screenSize === 'small' ? '12px 20px' : '14px 24px',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#047857';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#059669';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            📧 Send Marketing
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: screenSize === 'small' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: screenSize === 'small' ? '18px' : '24px',
          marginBottom: screenSize === 'small' ? '24px' : '32px'
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '20px' : '28px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#888888' : '#64748b', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              👥 Total Customers
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '30px' : '38px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', lineHeight: '1' }}>
              {customers.length}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '20px' : '28px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#888888' : '#64748b', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              👑 VIP Customers
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '30px' : '38px', fontWeight: '700', color: '#f59e0b', lineHeight: '1' }}>
              {customers.filter(c => c.tier === 'GOLD' || c.tier === 'PLATINUM').length}
            </div>
          </div>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '16px',
            padding: screenSize === 'small' ? '20px' : '28px',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
            boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#888888' : '#64748b', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              ⭐ Total Loyalty Points
            </div>
            <div style={{ fontSize: screenSize === 'small' ? '30px' : '38px', fontWeight: '700', color: '#8b5cf6', lineHeight: '1' }}>
              {customers.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)}
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div style={{
          background: darkMode ? '#111111' : '#ffffff',
          borderRadius: '16px',
          padding: screenSize === 'small' ? '24px' : '28px',
          border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
          boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'auto'
        }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center', color: darkMode ? '#888888' : '#9ca3af' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '8px' }}>
                {search ? 'No customers found' : 'No customers yet'}
              </div>
              <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#888888' }}>
                {search ? 'Try a different search term' : 'Add your first customer to get started'}
              </div>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const stats = getCustomerStats(customer.id);
              return (
                <div
                  key={customer.id}
                  style={{
                    background: darkMode ? '#000000' : '#f8f9fa',
                    borderRadius: '12px',
                    padding: screenSize === 'small' ? '18px' : '24px',
                    marginBottom: '18px',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = darkMode ? '0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: screenSize === 'small' ? '17px' : '19px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '10px', letterSpacing: '-0.3px' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '13px' : '14px', color: darkMode ? '#888888' : '#64748b', marginBottom: '8px', lineHeight: '1.6' }}>
                      📞 {customer.phone || 'N/A'} • ✉️ {customer.email || 'N/A'}
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#888888' : '#64748b', marginBottom: '8px' }}>
                      🛍️ Visits: <span style={{ color: darkMode ? '#ffffff' : '#0a0a0a', fontWeight: '600' }}>{stats.visits}</span> • 💰 Total Spend: <span style={{ color: darkMode ? '#ffffff' : '#0a0a0a', fontWeight: '600' }}>₹{stats.spend.toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '12px' : '13px', color: darkMode ? '#888888' : '#64748b', marginTop: '8px' }}>
                      ⭐ Points: <span style={{ color: darkMode ? '#ffffff' : '#0a0a0a', fontWeight: '600' }}>{stats.loyaltyPoints}</span> • 
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: '600',
                        background: loyaltySettings.tiers[stats.tier]?.color || '#cd7f32',
                        color: '#ffffff',
                        marginLeft: '8px'
                      }}>
                        {stats.tier}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: screenSize === 'small' ? '12px' : '16px' }}>
                    <button
                      onClick={() => handleViewCustomer(customer)}
                      style={{
                        padding: screenSize === 'small' ? '10px 14px' : '12px 18px',
                        background: darkMode ? '#222222' : '#f3f4f6',
                        color: darkMode ? '#ffffff' : '#0a0a0a',
                        border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontSize: screenSize === 'small' ? '12px' : '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = darkMode ? '#222222' : '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = darkMode ? '#222222' : '#f3f4f6';
                      }}
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      style={{
                        padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: screenSize === 'small' ? '12px' : '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#2563eb';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#3b82f6';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleViewHistory(customer)}
                      style={{
                        padding: screenSize === 'small' ? '8px 12px' : '10px 16px',
                        background: '#8b5cf6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: screenSize === 'small' ? '12px' : '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(139, 92, 246, 0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#7c3aed';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = '#8b5cf6';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      📜 History
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
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
          zIndex: 5000,
          padding: screenSize === 'small' ? '0' : '16px'
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: screenSize === 'small' ? '0' : '12px',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: screenSize === 'small' ? '100vw' : '500px',
            width: screenSize === 'small' ? '100vw' : '90%',
            maxHeight: screenSize === 'small' ? '100vh' : '90vh',
            overflow: 'auto',
            border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
          }}>
            {/* Title Bar */}
            <div style={{
              background: '#0a0a0a',
              color: '#ffffff',
              padding: screenSize === 'small' ? '16px 20px' : '20px 24px',
              fontSize: screenSize === 'small' ? '15px' : '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</span>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: screenSize === 'small' ? '16px' : '14px',
                  fontWeight: '500',
                  padding: screenSize === 'small' ? '8px 16px' : '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  minHeight: screenSize === 'small' ? '40px' : 'auto'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: screenSize === 'small' ? '20px' : '24px', background: darkMode ? '#111111' : '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: screenSize === 'small' ? '14px' : '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '500', color: darkMode ? '#888888' : '#64748b', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      background: darkMode ? '#000000' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '500', color: darkMode ? '#888888' : '#64748b', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      background: darkMode ? '#000000' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '500', color: darkMode ? '#888888' : '#64748b', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      outline: 'none',
                      background: darkMode ? '#000000' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      minHeight: screenSize === 'small' ? '48px' : 'auto'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '500', color: darkMode ? '#888888' : '#64748b', marginBottom: '6px' }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '14px' : '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '16px' : '14px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      background: darkMode ? '#000000' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#0a0a0a',
                      minHeight: screenSize === 'small' ? '80px' : 'auto'
                    }}
                  />
                </div>

                {selectedCustomer && (
                  <>
                    <div style={{ display: 'flex', gap: screenSize === 'small' ? '12px' : '16px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '500', color: darkMode ? '#888888' : '#64748b', marginBottom: '6px' }}>
                          Loyalty Points
                        </label>
                        <input
                          type="number"
                          value={formData.loyaltyPoints}
                          onChange={(e) => setFormData({ ...formData, loyaltyPoints: parseInt(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: screenSize === 'small' ? '14px' : '12px 16px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '6px',
                            fontSize: screenSize === 'small' ? '16px' : '14px',
                            outline: 'none',
                            background: darkMode ? '#000000' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#0a0a0a',
                            minHeight: screenSize === 'small' ? '48px' : 'auto'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: screenSize === 'small' ? '12px' : '13px', fontWeight: '500', color: darkMode ? '#888888' : '#64748b', marginBottom: '6px' }}>
                          Tier
                        </label>
                        <select
                          value={formData.tier}
                          onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                          style={{
                            width: '100%',
                            padding: screenSize === 'small' ? '14px' : '12px 16px',
                            border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                            borderRadius: '6px',
                            fontSize: screenSize === 'small' ? '16px' : '14px',
                            outline: 'none',
                            background: darkMode ? '#000000' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#0a0a0a',
                            minHeight: screenSize === 'small' ? '48px' : 'auto'
                          }}
                        >
                          <option value="BRONZE">Bronze (0 pts)</option>
                          <option value="SILVER">Silver (500+ pts)</option>
                          <option value="GOLD">Gold (2000+ pts)</option>
                          <option value="PLATINUM">Platinum (5000+ pts)</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ fontSize: screenSize === 'small' ? '11px' : '12px', color: darkMode ? '#888888' : '#64748b', padding: screenSize === 'small' ? '10px 14px' : '8px 12px', background: darkMode ? '#000000' : '#f9fafb', borderRadius: '6px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                      Tip: Points are automatically calculated from order amounts. Manual adjustment is for special cases.
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: screenSize === 'small' ? '8px' : '12px', marginTop: screenSize === 'small' ? '20px' : '24px', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: screenSize === 'small' ? '14px' : '12px',
                    background: darkMode ? '#000000' : '#f9fafb',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: screenSize === 'small' ? '15px' : '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                  onMouseEnter={(e) => e.target.style.background = darkMode ? '#111111' : '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.background = darkMode ? '#000000' : '#f9fafb'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCustomer}
                  style={{
                    flex: 1,
                    padding: screenSize === 'small' ? '14px' : '12px',
                    background: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: screenSize === 'small' ? '15px' : '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minHeight: screenSize === 'small' ? '48px' : 'auto'
                  }}
                >
                  {selectedCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && selectedCustomer && (
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
          zIndex: 5000
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
          }}>
            <div style={{
              background: '#0a0a0a',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>👤 Customer Details</span>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', overflow: 'auto', background: darkMode ? '#111111' : '#ffffff' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '8px' }}>
                  {selectedCustomer.name}
                </div>
                <div style={{ fontSize: '14px', color: darkMode ? '#888888' : '#64748b', marginBottom: '16px' }}>
                  Customer ID: {selectedCustomer.id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: darkMode ? '#000000' : '#f9fafb', padding: '16px', borderRadius: '8px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#64748b', marginBottom: '4px' }}>📞 Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    {selectedCustomer.phone || 'N/A'}
                  </div>
                </div>
                <div style={{ background: darkMode ? '#000000' : '#f9fafb', padding: '16px', borderRadius: '8px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
                  <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#64748b', marginBottom: '4px' }}>✉️ Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                    {selectedCustomer.email || 'N/A'}
                  </div>
                </div>
              </div>

              {(() => {
                const stats = getCustomerStats(selectedCustomer.id);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ background: darkMode ? '#1e3a5f' : '#dbeafe', padding: '12px', borderRadius: '8px', textAlign: 'center', border: `1px solid ${darkMode ? '#3b82f6' : '#93c5fd'}` }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#60a5fa' : '#1e40af' }}>{stats.visits}</div>
                      <div style={{ fontSize: '11px', color: darkMode ? '#93c5fd' : '#64748b' }}>Visits</div>
                    </div>
                    <div style={{ background: darkMode ? '#14532d' : '#d1fae5', padding: '12px', borderRadius: '8px', textAlign: 'center', border: `1px solid ${darkMode ? '#22c55e' : '#6ee7b7'}` }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#4ade80' : '#065f46' }}>₹{stats.spend.toFixed(0)}</div>
                      <div style={{ fontSize: '11px', color: darkMode ? '#86efac' : '#64748b' }}>Total Spend</div>
                    </div>
                    <div style={{ background: darkMode ? '#78350f' : '#fef3c7', padding: '12px', borderRadius: '8px', textAlign: 'center', border: `1px solid ${darkMode ? '#f59e0b' : '#fcd34d'}` }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: darkMode ? '#fbbf24' : '#92400e' }}>{stats.loyaltyPoints}</div>
                      <div style={{ fontSize: '11px', color: darkMode ? '#fde68a' : '#64748b' }}>Points</div>
                    </div>
                    <div style={{ 
                      background: loyaltySettings.tiers[stats.tier]?.color || '#cd7f32',
                      padding: '12px', 
                      borderRadius: '8px', 
                      textAlign: 'center',
                      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`
                    }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>{stats.tier}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>Tier</div>
                    </div>
                  </div>
                );
              })()}

              {selectedCustomer.notes && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', color: darkMode ? '#888888' : '#64748b', marginBottom: '8px', fontWeight: '500' }}>📝 Notes</div>
                  <div style={{ 
                    background: darkMode ? '#000000' : '#f9fafb', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    whiteSpace: 'pre-wrap',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
                  }}>
                    {selectedCustomer.notes}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#0a0a0a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#0a0a0a';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#0a0a0a';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Edit Customer
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleViewHistory(selectedCustomer);
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: darkMode ? '#1e3a5f' : '#dbeafe',
                    color: darkMode ? '#60a5fa' : '#1e40af',
                    border: `1px solid ${darkMode ? '#3b82f6' : '#93c5fd'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = darkMode ? '#2563eb' : '#bfdbfe';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = darkMode ? '#1e3a5f' : '#dbeafe';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showHistoryModal && selectedCustomer && (
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
          zIndex: 5000
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
          }}>
            <div style={{
              background: '#0a0a0a',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📜 Order History - {selectedCustomer.name}</span>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', overflow: 'auto', flex: 1, background: darkMode ? '#111111' : '#ffffff' }}>
              {/* Preferences Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '12px' }}>
                  🎯 Favorite Items
                </div>
                {(() => {
                  const preferences = getCustomerPreferences(selectedCustomer.id);
                  return preferences.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {preferences.map((pref, idx) => (
                        <span key={idx} style={{
                          background: darkMode ? '#1e3a5f' : '#dbeafe',
                          color: darkMode ? '#60a5fa' : '#1e40af',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500',
                          border: `1px solid ${darkMode ? '#3b82f6' : '#93c5fd'}`
                        }}>
                          {pref.name} ({pref.count}x)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: darkMode ? '#888888' : '#888888', fontSize: '13px' }}>No order history yet</div>
                  );
                })()}
              </div>

              {/* Recommendations Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '12px' }}>
                  Recommended for You
                </div>
                {(() => {
                  const recommendations = getRecommendations(selectedCustomer.id);
                  return recommendations.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {recommendations.map((item, idx) => (
                        <span key={idx} style={{
                          background: darkMode ? '#78350f' : '#fef3c7',
                          color: darkMode ? '#fbbf24' : '#92400e',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500',
                          border: `1px solid ${darkMode ? '#f59e0b' : '#fcd34d'}`
                        }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: darkMode ? '#888888' : '#888888', fontSize: '13px' }}>Try ordering more items to get recommendations</div>
                  );
                })()}
              </div>

              {/* Order History */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a', marginBottom: '12px' }}>
                  📋 Past Orders
                </div>
                {(() => {
                  const history = getCustomerOrderHistory(selectedCustomer.id);
                  return history.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {history.map((order, idx) => (
                        <div key={idx} style={{
                          background: darkMode ? '#000000' : '#f9fafb',
                          border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          padding: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                              Order #{order.id || order.orderId}
                            </span>
                            <span style={{ fontSize: '12px', color: darkMode ? '#888888' : '#888888' }}>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: darkMode ? '#e0e0e0' : '#e0e0e0', marginBottom: '8px' }}>
                            {order.items?.map((item, i) => (
                              <span key={i}>{item.name || item.itemName}{i < order.items.length - 1 ? ', ' : ''}</span>
                            ))}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: order.status === 'COMPLETED' ? '#059669' : '#f59e0b', fontWeight: '500' }}>
                              {order.status}
                            </span>
                            <span style={{ fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
                              ₹{(order.total || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: darkMode ? '#888888' : '#888888', fontSize: '13px' }}>No orders yet</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Campaign Modal */}
      {showMarketingModal && (
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
          zIndex: 5000
        }}>
          <div style={{
            background: darkMode ? '#111111' : '#ffffff',
            borderRadius: '12px',
            boxShadow: darkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            overflow: 'hidden',
            border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`
          }}>
            <div style={{
              background: '#059669',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>📧 Send Marketing Campaign</span>
              <button
                onClick={() => setShowMarketingModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '24px', background: darkMode ? '#111111' : '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '6px' }}>
                    Campaign Title
                  </label>
                  <input
                    type="text"
                    value={marketingFormData.title}
                    onChange={(e) => setMarketingFormData({ ...marketingFormData, title: e.target.value })}
                    placeholder="e.g., Weekend Special Offer"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      background: darkMode ? '#000000' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#0a0a0a'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '6px' }}>
                    Message
                  </label>
                  <textarea
                    value={marketingFormData.message}
                    onChange={(e) => setMarketingFormData({ ...marketingFormData, message: e.target.value })}
                    placeholder="Your promotional message..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
                      background: darkMode ? '#000000' : '#ffffff',
                      color: darkMode ? '#ffffff' : '#0a0a0a'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '6px' }}>
                    Target Segment
                  </label>
                  <select
                    value={marketingFormData.targetSegment}
                    onChange={(e) => setMarketingFormData({ ...marketingFormData, targetSegment: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: darkMode ? '#000000' : '#ffffff',
                      outline: 'none',
                      color: darkMode ? '#ffffff' : '#0a0a0a'
                    }}
                  >
                    <option value="all">All Customers ({customers.length})</option>
                    <option value="vip">VIP Customers (Spend &gt; ₹5000)</option>
                    <option value="regular">Regular Customers (5+ visits)</option>
                    <option value="new">New Customers (≤2 visits)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: darkMode ? '#888888' : '#e0e0e0', marginBottom: '6px' }}>
                    Channel
                  </label>
                  <select
                    value={marketingFormData.channel}
                    onChange={(e) => setMarketingFormData({ ...marketingFormData, channel: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: darkMode ? '#000000' : '#ffffff',
                      outline: 'none',
                      color: darkMode ? '#ffffff' : '#0a0a0a'
                    }}
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowMarketingModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: darkMode ? '#000000' : '#f9fafb',
                    color: darkMode ? '#ffffff' : '#0a0a0a',
                    border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.background = darkMode ? '#111111' : '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.background = darkMode ? '#000000' : '#f9fafb'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendCampaign}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#047857';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#059669';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  Send Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

