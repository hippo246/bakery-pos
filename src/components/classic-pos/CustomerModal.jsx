/**
 * Classic POS Customer Modal
 * 
 * Popup to select or create a customer
 */

import { useState } from 'react';

export default function CustomerModal({ customers, onSelectCustomer, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const modalStyle = {
    background: '#1E1E1E',
    border: '2px solid #333333',
    borderRadius: '8px',
    width: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  const headerStyle = {
    background: '#252525',
    padding: '16px 20px',
    borderBottom: '2px solid #333333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: '#ffffff',
  };

  const closeButtonStyle = {
    background: '#DC2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const searchStyle = {
    padding: '12px 20px',
    borderBottom: '1px solid #333333',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid #444444',
    background: '#252525',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  };

  const contentStyle = {
    padding: '12px 20px',
    overflowY: 'auto',
    flex: 1,
  };

  const customerCardStyle = {
    background: '#2A2A2A',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#3A3A3A',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const customerNameStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: '4px',
  };

  const customerPhoneStyle = {
    fontSize: '12px',
    color: '#888888',
    marginBottom: '4px',
  };

  const customerEmailStyle = {
    fontSize: '11px',
    color: '#666666',
  };

  const walkInButtonStyle = {
    width: '100%',
    background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'all 0.15s ease',
  };

  // Generate sample customers if none provided
  const sampleCustomers = customers || [
    { id: 1, name: 'John Doe', phone: '9876543210', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', phone: '9876543211', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', phone: '9876543212', email: 'bob@example.com' },
    { id: 4, name: 'Alice Williams', phone: '9876543213', email: 'alice@example.com' },
    { id: 5, name: 'Charlie Brown', phone: '9876543214', email: 'charlie@example.com' },
  ];

  const filteredCustomers = searchTerm
    ? sampleCustomers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
      )
    : sampleCustomers;

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <span style={titleStyle}>Select Customer</span>
          <button style={closeButtonStyle} onClick={onClose}>Close</button>
        </div>
        <div style={searchStyle}>
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={contentStyle}>
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              style={customerCardStyle}
              onClick={() => onSelectCustomer(customer)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#3A3A3A';
                e.currentTarget.style.borderColor = '#4A4A4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2A2A2A';
                e.currentTarget.style.borderColor = '#3A3A3A';
              }}
            >
              <div style={customerNameStyle}>{customer.name}</div>
              <div style={customerPhoneStyle}>{customer.phone}</div>
              <div style={customerEmailStyle}>{customer.email}</div>
            </div>
          ))}
          <button
            style={walkInButtonStyle}
            onClick={() => onSelectCustomer({ name: 'Walk-in Customer' })}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)';
            }}
          >
            Walk-in Customer
          </button>
        </div>
      </div>
    </div>
  );
}
