/**
 * Classic Settings - Classic POS Theme
 * 
 * Modern flat/gradient touchscreen POS skin for Settings with:
 * - Top function key panel (maroon gradient tiles, MENU/MORE tabs)
 * - Top chrome bar (license info, customer name, terminal ID, checkboxes)
 * - Settings categories as dark tiles
 * - Purple/lavender header bars for field groups
 * - Action buttons (SAVE, RESET, EXIT) in gradient maroon tile style
 */

import React, { useState, useCallback } from 'react';
import FunctionKeyPanel from '../classic-pos/FunctionKeyPanel';
import TopChrome from '../classic-pos/TopChrome';
import ActionButtons from '../classic-pos/ActionButtons';

export default function ClassicSettings({
  settings = {},
  setSettings,
  onNavigate,
}) {
  const [customerName, setCustomerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('GENERAL');

  const settingsCategories = ['GENERAL', 'PRINTER', 'PAYMENT', 'TAX', 'INVENTORY', 'STAFF'];

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit': onNavigate?.('dashboard'); break;
    }
  }, [onNavigate]);

  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const handleActionClick = useCallback((actionId) => {
    console.log('Settings action:', actionId);
    switch (actionId) {
      case 'save':
        console.log('Save settings');
        break;
      case 'reset':
        console.log('Reset settings');
        break;
      case 'exit':
        onNavigate?.('dashboard');
        break;
    }
  }, [onNavigate]);

  const inputStyle = {
    padding: '6px 8px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '12px',
    width: '100%',
  };

  // Dark tile style for categories (matches ProductGrid)
  const categoryTileStyle = (isSelected) => ({
    width: '150px',
    height: '80px',
    borderRadius: '8px',
    border: isSelected ? '2px solid #ffd700' : '1px solid #e0e0e0',
    background: '#2d2d2d',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  });

  const categoryLabelStyle = {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Top Chrome Bar */}
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      {/* Function Key Panel */}
      <div style={{ padding: '8px', background: '#e8e8e8', borderBottom: '1px solid #d0d0d0' }}>
        <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side - Category Tiles */}
        <div style={{ width: '200px', padding: '16px', background: '#e8e8e8', borderRight: '1px solid #d0d0d0', overflowY: 'auto' }}>
          
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Categories
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {settingsCategories.map((category) => (
              <div
                key={category}
                style={categoryTileStyle(selectedCategory === category)}
                onClick={() => handleCategorySelect(category)}
                onMouseEnter={(e) => {
                  e.target.style.background = '#3d3d3d';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#2d2d2d';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={categoryLabelStyle}>{category}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Settings Fields */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#333333', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {selectedCategory} Settings
          </div>

          {/* Purple Header Bar - General Settings */}
          <div style={{ background: '#8b7dd8', padding: '8px', marginBottom: '16px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>
              General Configuration
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #d0d0d0', borderRadius: '4px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>Store Name</label>
                <input type="text" defaultValue="My Cafe" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>Terminal ID</label>
                <input type="text" defaultValue="HQ-PC01" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>Currency</label>
                <input type="text" defaultValue="INR" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>Timezone</label>
                <input type="text" defaultValue="Asia/Kolkata" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Purple Header Bar - Tax Settings */}
          <div style={{ background: '#8b7dd8', padding: '8px', marginBottom: '16px', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#ffffff', textTransform: 'uppercase' }}>
              Tax Configuration
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '16px', border: '1px solid #d0d0d0', borderRadius: '4px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>CGST Rate (%)</label>
                <input type="number" defaultValue="9" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>SGST Rate (%)</label>
                <input type="number" defaultValue="9" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>Service Tax (%)</label>
                <input type="number" defaultValue="0" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#333333', marginBottom: '4px', display: 'block' }}>VAT Rate (%)</label>
                <input type="number" defaultValue="0" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '24px' }}>
            <ActionButtons
              buttons={[
                { id: 'save', label: 'SAVE', style: 'teal' },
                { id: 'reset', label: 'RESET', style: 'purple' },
                { id: 'exit', label: 'EXIT', style: 'black' },
              ]}
              onButtonClick={handleActionClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
