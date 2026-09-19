import React from 'react';

export default function RoleSecurityPanel({ formData, handleInputChange, darkMode }) {
  const roles = ['Admin', 'Manager', 'Cashier', 'Waiter', 'Kitchen Staff'];
  const permissions = [
    { id: 'view_reports', name: 'View Sales Reports & Analytics' },
    { id: 'apply_discount', name: 'Apply Custom Discounts' },
    { id: 'void_items', name: 'Void Items & Cancel Orders' },
    { id: 'edit_menu', name: 'Edit Menu Prices & Stock' },
    { id: 'access_settings', name: 'Access System Settings Studio' },
    { id: 'refund_payments', name: 'Process Payment Refunds' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '8px' }}>
        🔒 Role & Access Permission Matrix
      </div>

      {/* Permissions Matrix Grid */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: darkMode ? '#ffffff' : '#0a0a0a' }}>
          <thead>
            <tr style={{ background: darkMode ? '#111111' : '#f9fafb', borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
              <th style={{ textAlign: 'left', padding: '12px' }}>Permission Action</th>
              {roles.map(r => (
                <th key={r} style={{ padding: '12px', textAlign: 'center' }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissions.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${darkMode ? '#222222' : '#f3f4f6'}` }}>
                <td style={{ padding: '12px', fontWeight: '600' }}>{p.name}</td>
                {roles.map(r => {
                  const isAdmin = r === 'Admin';
                  return (
                    <td key={r} style={{ padding: '12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAdmin || true} // Mock checkable grid state
                        disabled={isAdmin}
                        style={{ cursor: isAdmin ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '8px', marginTop: '16px' }}>
        🛡️ PCI-DSS & GDPR Compliance Standards
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ToggleRow label="Enable PCI-DSS Card Tokenization" value={formData.enableCardTokenization !== false} onChange={v => handleInputChange('enableCardTokenization', v)} darkMode={darkMode} />
        <ToggleRow label="Require CVV for Saved Cards" value={formData.requireCvvForSavedCards || false} onChange={v => handleInputChange('requireCvvForSavedCards', v)} darkMode={darkMode} />
        <ToggleRow label="Enable GDPR Compliance Mode" value={formData.enableGdprCompliance !== false} onChange={v => handleInputChange('enableGdprCompliance', v)} darkMode={darkMode} />
        <ToggleRow label="Enable Right-to-Deletion (Customer Data)" value={formData.enableRightToDeletion !== false} onChange={v => handleInputChange('enableRightToDeletion', v)} darkMode={darkMode} />
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange, darkMode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: darkMode ? '#111111' : '#f9fafb', borderRadius: '8px', border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}` }}>
      <span style={{ fontSize: '13px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#111111' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          background: value ? '#6366f1' : (darkMode ? '#222222' : '#d1d5db'),
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s'
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '3px',
          left: value ? '21px' : '3px',
          transition: 'left 0.2s'
        }} />
      </button>
    </div>
  );
}
