import React, { useState, useMemo, useEffect } from 'react';

export default function SimpleCRM({ customers = [], setCustomers, orders = [], onNavigate }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
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
    setFormData({ name: '', phone: '', email: '', notes: '' });
    setShowModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || ''
    });
    setShowModal(true);
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
    return {
      visits: customerOrders.length,
      spend: totalSpend
    };
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: '#ffffff',
        padding: screenSize === 'small' ? '16px' : '20px 24px',
        borderBottom: '1px solid #e5e7eb'
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
              color: '#111827',
              fontSize: screenSize === 'small' ? '18px' : '20px',
              fontWeight: '600'
            }}>
              Customer Management
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Manage your customer relationships
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('dashboard')}
            style={{
              padding: screenSize === 'small' ? '8px 16px' : '10px 20px',
              background: '#f9fafb',
              color: '#111827',
              border: '1px solid #e5e7eb',
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

      {/* Content */}
      <div style={{ padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', flex: 1 }}>
        {/* Controls */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: screenSize === 'small' ? '12px' : '16px',
          marginBottom: screenSize === 'small' ? '16px' : '20px',
          display: 'flex',
          gap: screenSize === 'small' ? '8px' : '12px',
          alignItems: screenSize === 'small' ? 'flex-start' : 'center',
          flexWrap: 'wrap',
          border: '1px solid #e5e7eb'
        }}>
          <input
            type="text"
            placeholder="Search customers by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: screenSize === 'small' ? '200px' : '300px',
              padding: screenSize === 'small' ? '10px 14px' : '12px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleAddCustomer}
            style={{
              padding: screenSize === 'small' ? '10px 16px' : '12px 24px',
              background: '#111827',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: screenSize === 'small' ? '13px' : '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            + Add Customer
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Total Customers
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{customers.length}</div>
          </div>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px', fontWeight: '500' }}>
              Filtered Results
            </div>
            <div style={{ fontSize: '28px', fontWeight: '600', color: '#111827' }}>{filteredCustomers.length}</div>
          </div>
        </div>

        {/* Customer List */}
        <div style={{
          background: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e5e7eb',
          overflow: 'auto'
        }}>
          {filteredCustomers.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {search ? 'No customers found matching your search' : 'No customers yet. Add your first customer!'}
              </div>
            </div>
          ) : (
            filteredCustomers.map(customer => {
              const stats = getCustomerStats(customer.id);
              return (
                <div
                  key={customer.id}
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '16px',
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827', marginBottom: '6px' }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                      📞 {customer.phone || 'N/A'} • ✉️ {customer.email || 'N/A'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      🛍️ Visits: <span style={{ color: '#111827', fontWeight: '500' }}>{stats.visits}</span> • 💰 Total Spend: <span style={{ color: '#111827', fontWeight: '500' }}>₹{stats.spend.toFixed(2)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEditCustomer(customer)}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        color: '#111827',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            width: '90%',
            overflow: 'hidden'
          }}>
            {/* Title Bar */}
            <div style={{
              background: '#111827',
              color: '#ffffff',
              padding: '20px 24px',
              fontSize: '16px',
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
            
            {/* Content */}
            <div style={{ padding: '24px', background: '#ffffff' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f9fafb',
                    color: '#111827',
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
                  onClick={handleSaveCustomer}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#111827',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  {selectedCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

