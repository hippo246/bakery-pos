import React from 'react';

export default function WorkflowEnginePanel({ formData, handleInputChange, darkMode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '8px' }}>
        ⚡ POS Workflow & Gate Rules
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ToggleCard
          title="Mandatory Customer Details"
          subtitle="Require customer phone/name before completing an order"
          value={formData.requireCustomer}
          onChange={v => handleInputChange('requireCustomer', v)}
          darkMode={darkMode}
        />
        <ToggleCard
          title="Mandatory Table Selection"
          subtitle="Require table assignment before sending items to kitchen"
          value={formData.requireTable}
          onChange={v => handleInputChange('requireTable', v)}
          darkMode={darkMode}
        />
        <ToggleCard
          title="Allow Walk-In Orders"
          subtitle="Permit fast checkout without seating guests"
          value={formData.allowWalkIn !== false}
          onChange={v => handleInputChange('allowWalkIn', v)}
          darkMode={darkMode}
        />
        <ToggleCard
          title="Require Payment Before KOT"
          subtitle="Customer must pay before KOT is sent to kitchen (QSR mode)"
          value={formData.requirePaymentBeforeKOT}
          onChange={v => handleInputChange('requirePaymentBeforeKOT', v)}
          darkMode={darkMode}
        />
      </div>

      <div style={{ fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '8px', marginTop: '12px' }}>
        💰 Discount & Void Manager Controls
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle(darkMode)}>Max Allowed Discount (%)</label>
          <input
            type="number"
            value={formData.maxDiscountPercent || 50}
            onChange={e => handleInputChange('maxDiscountPercent', parseInt(e.target.value) || 0)}
            style={inputStyle(darkMode)}
          />
        </div>
        <div>
          <label style={labelStyle(darkMode)}>High Discount Manager Threshold (%)</label>
          <input
            type="number"
            value={formData.highDiscountThreshold || 20}
            onChange={e => handleInputChange('highDiscountThreshold', parseInt(e.target.value) || 0)}
            style={inputStyle(darkMode)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <ToggleCard
          title="Require Manager Approval for High Discount"
          subtitle="Prompt for manager PIN when discount exceeds threshold"
          value={formData.requireManagerForHighDiscount}
          onChange={v => handleInputChange('requireManagerForHighDiscount', v)}
          darkMode={darkMode}
        />
        <ToggleCard
          title="Require Manager Approval for Void / Cancellation"
          subtitle="Require PIN override before voiding an item or ticket"
          value={formData.requireManagerForVoid}
          onChange={v => handleInputChange('requireManagerForVoid', v)}
          darkMode={darkMode}
        />
      </div>

      <div style={{ fontSize: '15px', fontWeight: '700', color: darkMode ? '#ffffff' : '#0a0a0a', borderBottom: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`, paddingBottom: '8px', marginTop: '12px' }}>
        ⏸️ Hold Orders & Timeout Rules
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <ToggleCard
          title="Enable Hold Orders"
          subtitle="Allow pausing orders in progress"
          value={formData.enableHoldOrders === true}
          onChange={v => handleInputChange('enableHoldOrders', v)}
          darkMode={darkMode}
        />
        <div>
          <label style={labelStyle(darkMode)}>Max Concurrent Hold Orders</label>
          <input
            type="number"
            value={formData.maxHoldOrders || 10}
            onChange={e => handleInputChange('maxHoldOrders', parseInt(e.target.value) || 1)}
            style={inputStyle(darkMode)}
          />
        </div>
        <div>
          <label style={labelStyle(darkMode)}>Hold Timeout (mins)</label>
          <input
            type="number"
            value={formData.holdOrderTimeout || 60}
            onChange={e => handleInputChange('holdOrderTimeout', parseInt(e.target.value) || 10)}
            style={inputStyle(darkMode)}
          />
        </div>
      </div>
    </div>
  );
}

function ToggleCard({ title, subtitle, value, onChange, darkMode }) {
  return (
    <div style={{
      padding: '16px',
      background: darkMode ? '#111111' : '#f9fafb',
      border: `1px solid ${darkMode ? '#222222' : '#e5e7eb'}`,
      borderRadius: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', color: darkMode ? '#ffffff' : '#0a0a0a' }}>{title}</div>
        <div style={{ fontSize: '12px', color: darkMode ? '#888888' : '#6b7280', marginTop: '2px' }}>{subtitle}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          background: value ? '#6366f1' : (darkMode ? '#222222' : '#d1d5db'),
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0
        }}
      >
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#ffffff',
          position: 'absolute',
          top: '3px',
          left: value ? '23px' : '3px',
          transition: 'left 0.2s'
        }} />
      </button>
    </div>
  );
}

const labelStyle = (darkMode) => ({
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: darkMode ? '#e0e0e0' : '#111111',
  marginBottom: '6px'
});

const inputStyle = (darkMode) => ({
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${darkMode ? '#222222' : '#d1d5db'}`,
  borderRadius: '8px',
  fontSize: '14px',
  background: darkMode ? '#000000' : '#ffffff',
  color: darkMode ? '#ffffff' : '#0a0a0a',
  outline: 'none',
  boxSizing: 'border-box'
});
