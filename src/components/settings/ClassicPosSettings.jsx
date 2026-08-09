/**
 * ClassicPosSettings.jsx
 * High-contrast Settings for Classic POS Theme
 */

import React, { useState } from 'react';

export default function ClassicPosSettings() {
  const [activeSection, setActiveSection] = useState('GENERAL');

  // Settings state
  const [settings, setSettings] = useState({
    // General
    storeName: 'Goa Flagship Cafe',
    storeAddress: '123 Beach Road, Goa',
    storePhone: '+91 9876543210',
    currency: 'INR',
    language: 'en',
    
    // Display
    theme: 'classic-pos',
    fontSize: 'medium',
    showKotPreview: true,
    autoRefreshKds: true,
    
    // Printer
    printerType: 'thermal',
    printerWidth: '80mm',
    autoPrintKot: true,
    autoPrintBill: true,
    printLogo: true,
    
    // Taxes
    gstEnabled: true,
    gstRate: 5,
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceCharge: 0,
    serviceChargeRate: 0,
    
    // Orders
    defaultOrderType: 'DINE_IN',
    requireTableSelection: true,
    allowPartialPayment: true,
    enableSplitBill: true,
    
    // Kitchen
    kotBumpSound: true,
    kotExpiryMinutes: 30,
    autoClearCompleted: false,
  });

  // Settings sections
  const sections = [
    { id: 'GENERAL', label: 'GENERAL', icon: '⚙️' },
    { id: 'DISPLAY', label: 'DISPLAY', icon: '🖥️' },
    { id: 'PRINTER', label: 'PRINTER', icon: '🖨️' },
    { id: 'TAXES', label: 'TAXES', icon: '💰' },
    { id: 'ORDERS', label: 'ORDERS', icon: '📝' },
    { id: 'KITCHEN', label: 'KITCHEN', icon: '👨‍🍳' },
  ];

  // Toggle switch component
  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '2px solid #333333' }}>
      <span style={{ fontSize: '14px', fontWeight: '700' }}>{label}</span>
      <div
        onClick={onChange}
        style={{
          width: '52px',
          height: '28px',
          backgroundColor: checked ? '#22C55E' : '#333333',
          borderRadius: '14px',
          position: 'relative',
          cursor: 'pointer',
          border: '2px solid #FFFFFF',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '26px' : '2px',
            width: '24px',
            height: '24px',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            transition: 'transform 0.2s',
          }}
        />
      </div>
    </div>
  );

  // Input field component
  const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#888888', marginBottom: '8px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#000000',
          border: '2px solid #FFFFFF',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: '700',
        }}
      />
    </div>
  );

  // Select component
  const SelectField = ({ label, value, onChange, options }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#888888', marginBottom: '8px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#000000',
          border: '2px solid #FFFFFF',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: '700',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  // Styles
  const containerStyle = {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000000',
    color: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    overflow: 'hidden',
  };

  const sidebarStyle = {
    width: '25%',
    backgroundColor: '#1A1A1A',
    borderRight: '3px solid #FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  };

  const sidebarHeaderStyle = {
    padding: '20px',
    borderBottom: '3px solid #FFFFFF',
  };

  const sidebarTitleStyle = {
    fontSize: '20px',
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  };

  const sectionListStyle = {
    flex: 1,
    padding: '12px',
  };

  const sectionItemStyle = (isActive) => ({
    padding: '14px 16px',
    marginBottom: '4px',
    backgroundColor: isActive ? '#22C55E' : 'transparent',
    borderLeft: isActive ? '4px solid #FFFFFF' : '4px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    fontWeight: '800',
  });

  const contentStyle = {
    width: '75%',
    backgroundColor: '#000000',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  };

  const contentHeaderStyle = {
    padding: '20px',
    backgroundColor: '#1A1A1A',
    borderBottom: '3px solid #FFFFFF',
  };

  const contentTitleStyle = {
    fontSize: '20px',
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  };

  const contentBodyStyle = {
    padding: '24px',
  };

  const sectionCardStyle = {
    backgroundColor: '#1A1A1A',
    border: '3px solid #FFFFFF',
    padding: '20px',
    marginBottom: '20px',
  };

  const sectionTitleStyle = {
    fontSize: '16px',
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid #FFFFFF',
    paddingBottom: '12px',
  };

  const saveButtonStyle = {
    padding: '14px 32px',
    fontSize: '14px',
    fontWeight: '900',
    backgroundColor: '#22C55E',
    color: '#000000',
    border: '2px solid #FFFFFF',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  // Render settings content based on active section
  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'GENERAL':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>STORE INFORMATION</div>
            <InputField
              label="Store Name"
              value={settings.storeName}
              onChange={(val) => setSettings({...settings, storeName: val})}
              placeholder="Enter store name"
            />
            <InputField
              label="Store Address"
              value={settings.storeAddress}
              onChange={(val) => setSettings({...settings, storeAddress: val})}
              placeholder="Enter store address"
            />
            <InputField
              label="Store Phone"
              value={settings.storePhone}
              onChange={(val) => setSettings({...settings, storePhone: val})}
              placeholder="Enter phone number"
            />
            <SelectField
              label="Currency"
              value={settings.currency}
              onChange={(val) => setSettings({...settings, currency: val})}
              options={[
                { value: 'INR', label: 'Indian Rupee (₹)' },
                { value: 'USD', label: 'US Dollar ($)' },
                { value: 'EUR', label: 'Euro (€)' },
              ]}
            />
          </div>
        );

      case 'DISPLAY':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>DISPLAY SETTINGS</div>
            <SelectField
              label="Theme"
              value={settings.theme}
              onChange={(val) => setSettings({...settings, theme: val})}
              options={[
                { value: 'classic-pos', label: 'Classic POS' },
                { value: 'modern', label: 'Modern' },
                { value: 'fastfood-pos', label: 'Fast Food POS' },
              ]}
            />
            <SelectField
              label="Font Size"
              value={settings.fontSize}
              onChange={(val) => setSettings({...settings, fontSize: val})}
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' },
              ]}
            />
            <ToggleSwitch
              label="Show KOT Preview"
              checked={settings.showKotPreview}
              onChange={() => setSettings({...settings, showKotPreview: !settings.showKotPreview})}
            />
            <ToggleSwitch
              label="Auto-Refresh KDS"
              checked={settings.autoRefreshKds}
              onChange={() => setSettings({...settings, autoRefreshKds: !settings.autoRefreshKds})}
            />
          </div>
        );

      case 'PRINTER':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>PRINTER SETTINGS</div>
            <SelectField
              label="Printer Type"
              value={settings.printerType}
              onChange={(val) => setSettings({...settings, printerType: val})}
              options={[
                { value: 'thermal', label: 'Thermal Printer' },
                { value: 'inkjet', label: 'Inkjet Printer' },
                { value: 'laser', label: 'Laser Printer' },
              ]}
            />
            <SelectField
              label="Paper Width"
              value={settings.printerWidth}
              onChange={(val) => setSettings({...settings, printerWidth: val})}
              options={[
                { value: '58mm', label: '58mm' },
                { value: '80mm', label: '80mm' },
                { value: 'A4', label: 'A4' },
              ]}
            />
            <ToggleSwitch
              label="Auto-Print KOT"
              checked={settings.autoPrintKot}
              onChange={() => setSettings({...settings, autoPrintKot: !settings.autoPrintKot})}
            />
            <ToggleSwitch
              label="Auto-Print Bill"
              checked={settings.autoPrintBill}
              onChange={() => setSettings({...settings, autoPrintBill: !settings.autoPrintBill})}
            />
            <ToggleSwitch
              label="Print Logo on Receipt"
              checked={settings.printLogo}
              onChange={() => setSettings({...settings, printLogo: !settings.printLogo})}
            />
          </div>
        );

      case 'TAXES':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>TAX CONFIGURATION</div>
            <ToggleSwitch
              label="Enable GST"
              checked={settings.gstEnabled}
              onChange={() => setSettings({...settings, gstEnabled: !settings.gstEnabled})}
            />
            <InputField
              label="GST Rate (%)"
              value={settings.gstRate}
              onChange={(val) => setSettings({...settings, gstRate: parseFloat(val) || 0})}
              type="number"
              placeholder="Enter GST rate"
            />
            <InputField
              label="CGST Rate (%)"
              value={settings.cgstRate}
              onChange={(val) => setSettings({...settings, cgstRate: parseFloat(val) || 0})}
              type="number"
              placeholder="Enter CGST rate"
            />
            <InputField
              label="SGST Rate (%)"
              value={settings.sgstRate}
              onChange={(val) => setSettings({...settings, sgstRate: parseFloat(val) || 0})}
              type="number"
              placeholder="Enter SGST rate"
            />
            <InputField
              label="Service Charge (%)"
              value={settings.serviceChargeRate}
              onChange={(val) => setSettings({...settings, serviceChargeRate: parseFloat(val) || 0})}
              type="number"
              placeholder="Enter service charge rate"
            />
          </div>
        );

      case 'ORDERS':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>ORDER SETTINGS</div>
            <SelectField
              label="Default Order Type"
              value={settings.defaultOrderType}
              onChange={(val) => setSettings({...settings, defaultOrderType: val})}
              options={[
                { value: 'DINE_IN', label: 'Dine-In' },
                { value: 'TAKEAWAY', label: 'Takeaway' },
                { value: 'DELIVERY', label: 'Delivery' },
              ]}
            />
            <ToggleSwitch
              label="Require Table Selection"
              checked={settings.requireTableSelection}
              onChange={() => setSettings({...settings, requireTableSelection: !settings.requireTableSelection})}
            />
            <ToggleSwitch
              label="Allow Partial Payment"
              checked={settings.allowPartialPayment}
              onChange={() => setSettings({...settings, allowPartialPayment: !settings.allowPartialPayment})}
            />
            <ToggleSwitch
              label="Enable Split Bill"
              checked={settings.enableSplitBill}
              onChange={() => setSettings({...settings, enableSplitBill: !settings.enableSplitBill})}
            />
          </div>
        );

      case 'KITCHEN':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>KITCHEN DISPLAY SETTINGS</div>
            <ToggleSwitch
              label="KOT Bump Sound"
              checked={settings.kotBumpSound}
              onChange={() => setSettings({...settings, kotBumpSound: !settings.kotBumpSound})}
            />
            <InputField
              label="KOT Expiry (Minutes)"
              value={settings.kotExpiryMinutes}
              onChange={(val) => setSettings({...settings, kotExpiryMinutes: parseInt(val) || 30})}
              type="number"
              placeholder="Enter expiry time"
            />
            <ToggleSwitch
              label="Auto-Clear Completed Orders"
              checked={settings.autoClearCompleted}
              onChange={() => setSettings({...settings, autoClearCompleted: !settings.autoClearCompleted})}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <div style={sidebarTitleStyle}>SETTINGS</div>
        </div>
        <div style={sectionListStyle}>
          {sections.map(section => (
            <div
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={sectionItemStyle(activeSection === section.id)}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={contentStyle}>
        <div style={contentHeaderStyle}>
          <div style={contentTitleStyle}>{activeSection.replace(/_/g, ' ')}</div>
        </div>
        <div style={contentBodyStyle}>
          {renderSettingsContent()}
          <button style={saveButtonStyle}>
            SAVE CHANGES
          </button>
        </div>
      </div>
    </div>
  );
}
