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
    background: 'var(--classic-pos-modal-bg)',
    border: '2px solid var(--classic-pos-modal-border)',
    borderRadius: '8px',
    width: '500px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  const headerStyle = {
    background: 'var(--classic-pos-modal-header-bg)',
    padding: '16px 20px',
    borderBottom: '2px solid var(--classic-pos-modal-header-border)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--classic-pos-name-color)',
  };

  const closeButtonStyle = {
    background: 'var(--classic-pos-close-btn-bg)',
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
    borderBottom: '1px solid var(--classic-pos-modal-header-border)',
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '4px',
    border: '1px solid var(--classic-pos-input-border)',
    background: 'var(--classic-pos-input-bg)',
    color: 'var(--classic-pos-name-color)',
    fontSize: '14px',
    outline: 'none',
  };

  const contentStyle = {
    padding: '12px 20px',
    overflowY: 'auto',
    flex: 1,
  };

  const customerCardStyle = {
    background: 'var(--classic-pos-card-bg)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--classic-pos-card-border)',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const customerNameStyle = {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--classic-pos-name-color)',
    marginBottom: '4px',
  };

  const customerPhoneStyle = {
    fontSize: '12px',
    color: 'var(--classic-pos-code-color)',
    marginBottom: '4px',
  };

  const customerEmailStyle = {
    fontSize: '11px',
    color: 'var(--classic-pos-empty-color)',
  };

  const walkInButtonStyle = {
    width: '100%',
    background: 'var(--classic-pos-walkin-btn-bg)',
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
          <button
            style={closeButtonStyle}
            onClick={onClose}
            onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-close-btn-hover)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-close-btn-bg)'; }}
          >
            Close
          </button>
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
                e.currentTarget.style.background = 'var(--classic-pos-card-bg-hover)';
                e.currentTarget.style.borderColor = 'var(--classic-pos-card-border-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--classic-pos-card-bg)';
                e.currentTarget.style.borderColor = 'var(--classic-pos-card-border)';
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
            onMouseEnter={(e) => { e.target.style.background = 'var(--classic-pos-walkin-btn-hover)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'var(--classic-pos-walkin-btn-bg)'; }}
          >
            Walk-in Customer
          </button>
        </div>
      </div>
    </div>
  );
}
