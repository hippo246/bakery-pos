/**
 * Fast Food Settings Layout
 * 
 * Vibrant touch-friendly settings with fast food styling.
 */

import React, { useState, useCallback } from 'react';
import FunctionKeyPanel from '../fastfood-pos/FunctionKeyPanel';
import ActionButtons from '../fastfood-pos/ActionButtons';
import TopChrome from '../fastfood-pos/TopChrome';

export default function FastFoodSettings(props) {
  const { onNavigate } = props;
  const [customerName, setCustomerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');

  const settingsCategories = ['General', 'Display', 'Printer', 'Payment', 'Tax'];

  const handleFunctionKeyPress = useCallback((key, action) => {
    console.log(`Function key ${key} pressed: ${action}`);
    switch (action) {
      case 'exit':
        onNavigate?.('dashboard');
        break;
      case 'save':
        console.log('Save settings');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const handleActionClick = useCallback((action) => {
    console.log('Action clicked:', action);
    switch (action) {
      case 'dashboard':
        onNavigate?.('dashboard');
        break;
      default:
        console.log(`Unknown action: ${action}`);
    }
  }, [onNavigate]);

  const actionButtons = [
    { id: 'dashboard', label: 'DASHBOARD', style: 'teal' },
  ];

  const settingItemStyle = {
    padding: '16px',
    background: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const settings = {
    General: [
      { key: 'storeName', label: 'Store Name', type: 'text', value: 'Semi Cafe' },
      { key: 'address', label: 'Address', type: 'text', value: '123 Main St' },
      { key: 'phone', label: 'Phone', type: 'text', value: '+91 9876543210' },
      { key: 'gst', label: 'GST Number', type: 'text', value: '29ABCDE1234F1Z5' },
    ],
    Display: [
      { key: 'brightness', label: 'Brightness', type: 'range', value: 80 },
      { key: 'timeout', label: 'Screen Timeout', type: 'number', value: 300 },
      { key: 'theme', label: 'Theme', type: 'select', value: 'Fast Food' },
    ],
    Printer: [
      { key: 'printerName', label: 'Printer Name', type: 'text', value: 'EPSON TM-T82' },
      { key: 'copies', label: 'Receipt Copies', type: 'number', value: 1 },
      { key: 'autoPrint', label: 'Auto Print', type: 'checkbox', value: true },
    ],
    Payment: [
      { key: 'cashEnabled', label: 'Cash Enabled', type: 'checkbox', value: true },
      { key: 'gpayEnabled', label: 'GPay Enabled', type: 'checkbox', value: true },
      { key: 'phonepayEnabled', label: 'PhonePe Enabled', type: 'checkbox', value: true },
    ],
    Tax: [
      { key: 'taxRate', label: 'Tax Rate (%)', type: 'number', value: 18 },
      { key: 'serviceCharge', label: 'Service Charge (%)', type: 'number', value: 5 },
    ],
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#f5f5f5',
    }}>
      {/* Top Chrome Bar */}
      <TopChrome
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        terminalId="HQ-PC01"
      />

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        gap: '12px', 
        padding: '12px',
        overflow: 'hidden',
      }}>
        {/* Left Panel - Function Keys */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
        }}>
          <FunctionKeyPanel onKeyPress={handleFunctionKeyPress} />
        </div>

        {/* Center Panel - Settings */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          overflow: 'auto',
        }}>
          <h2 style={{ 
            margin: '0', 
            fontSize: '28px', 
            fontWeight: '800',
            color: '#2d3436',
          }}>
            Settings
          </h2>

          {/* Category Tabs */}
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {settingsCategories.map((category) => (
              <button
                key={category}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: selectedCategory === category
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)'
                    : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  color: selectedCategory === category ? '#ffffff' : '#2d3436',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: selectedCategory === category
                    ? '0 4px 8px rgba(255, 107, 107, 0.4)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                }}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Settings Items */}
          <div style={{ 
            flex: 1,
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            overflow: 'auto',
            border: '2px solid #e0e0e0',
          }}>
            {settings[selectedCategory]?.map((setting) => (
              <div key={setting.key} style={settingItemStyle}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#2d3436' }}>
                  {setting.label}
                </div>
                {setting.type === 'text' && (
                  <input
                    type="text"
                    defaultValue={setting.value}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid #e0e0e0',
                      fontSize: '14px',
                      width: '200px',
                    }}
                  />
                )}
                {setting.type === 'number' && (
                  <input
                    type="number"
                    defaultValue={setting.value}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid #e0e0e0',
                      fontSize: '14px',
                      width: '100px',
                    }}
                  />
                )}
                {setting.type === 'checkbox' && (
                  <input
                    type="checkbox"
                    defaultChecked={setting.value}
                    style={{
                      width: '20px',
                      height: '20px',
                    }}
                  />
                )}
                {setting.type === 'range' && (
                  <input
                    type="range"
                    defaultValue={setting.value}
                    min="0"
                    max="100"
                    style={{
                      width: '150px',
                    }}
                  />
                )}
                {setting.type === 'select' && (
                  <select
                    defaultValue={setting.value}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '2px solid #e0e0e0',
                      fontSize: '14px',
                      width: '150px',
                    }}
                  >
                    <option>Fast Food</option>
                    <option>Classic POS</option>
                    <option>Modern</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Actions */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          minWidth: '200px',
        }}>
          <ActionButtons buttons={actionButtons} onButtonClick={handleActionClick} />
        </div>
      </div>
    </div>
  );
}
