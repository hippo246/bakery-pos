import React, { useState } from 'react';

export default function CustomerSelector({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddCustomer,
  screenSize = 'large',
  darkMode = true
}) {
  const [showLookup, setShowLookup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleAddCustomer = () => {
    if (newCustomer.name && newCustomer.phone) {
      const customerToAdd = {
        id: `CUST-${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        totalOrders: 0,
        totalSpent: 0,
        createdAt: new Date().toISOString()
      };
      onAddCustomer(customerToAdd);
      onSelectCustomer(customerToAdd);
      setShowAddForm(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setSearchQuery('');
    }
  };

  return (
    <div style={{
      background: darkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
      borderRadius: '12px',
      padding: '16px',
      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: darkMode ? '#e0e0e0' : '#374151'
        }}>
          👤 Customer
        </div>
        <button
          onClick={() => setShowLookup(!showLookup)}
          style={{
            padding: '6px 12px',
            background: darkMode ? '#6366f1' : '#6366f1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {selectedCustomer ? 'Change' : 'Select'}
        </button>
      </div>

      {selectedCustomer && (
        <div style={{
          padding: '12px',
          background: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
          borderRadius: '8px',
          border: `1px solid ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'}`
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: darkMode ? '#ffffff' : '#1f2937',
            marginBottom: '4px'
          }}>
            {selectedCustomer.name}
          </div>
          <div style={{
            fontSize: '12px',
            color: darkMode ? '#8b8b9e' : '#6b7280'
          }}>
            {selectedCustomer.phone}
          </div>
          {selectedCustomer.totalOrders > 0 && (
            <div style={{
              fontSize: '11px',
              color: darkMode ? '#6b7280' : '#9ca3af',
              marginTop: '4px'
            }}>
              {selectedCustomer.totalOrders} orders • ₹{selectedCustomer.totalSpent?.toFixed(2) || '0'}
            </div>
          )}
        </div>
      )}

      {showLookup && (
        <div style={{
          marginTop: '12px',
          borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          paddingTop: '12px'
        }}>
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: darkMode ? '#1f2937' : '#ffffff',
              border: `1px solid ${darkMode ? '#374151' : '#d1d5db'}`,
              borderRadius: '8px',
              color: darkMode ? '#ffffff' : '#1f2937',
              fontSize: '13px',
              outline: 'none',
              marginBottom: '8px'
            }}
          />

          <div style={{
            maxHeight: '200px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelectCustomer(customer);
                  setShowLookup(false);
                  setSearchQuery('');
                }}
                style={{
                  padding: '10px 12px',
                  background: darkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : '#f9fafb';
                }}
              >
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: darkMode ? '#ffffff' : '#1f2937'
                }}>
                  {customer.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: darkMode ? '#8b8b9e' : '#6b7280'
                }}>
                  {customer.phone}
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '8px',
              background: darkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
              border: `1px solid ${darkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)'}`,
              borderRadius: '8px',
              color: darkMode ? '#10b981' : '#059669',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Add New Customer
          </button>

          {showAddForm && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: darkMode ? '#374151' : '#f9fafb',
              borderRadius: '8px',
              border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
            }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Name *"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    background: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                    borderRadius: '6px',
                    color: darkMode ? '#ffffff' : '#1f2937',
                    fontSize: '12px'
                  }}
                />
                <input
                  type="text"
                  placeholder="Phone *"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    background: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                    borderRadius: '6px',
                    color: darkMode ? '#ffffff' : '#1f2937',
                    fontSize: '12px'
                  }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  style={{
                    padding: '8px 12px',
                    background: darkMode ? '#1f2937' : '#ffffff',
                    border: `1px solid ${darkMode ? '#4b5563' : '#d1d5db'}`,
                    borderRadius: '6px',
                    color: darkMode ? '#ffffff' : '#1f2937',
                    fontSize: '12px'
                  }}
                />
                <button
                  onClick={handleAddCustomer}
                  disabled={!newCustomer.name || !newCustomer.phone}
                  style={{
                    padding: '8px',
                    background: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: (!newCustomer.name || !newCustomer.phone) ? 'not-allowed' : 'pointer'
                  }}
                >
                  Add Customer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
