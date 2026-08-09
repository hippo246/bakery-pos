/**
 * FastFoodSettingsComprehensive.jsx
 * Comprehensive Settings with drive-thru configuration
 */

import React, { useState } from 'react';
import AlertDialog from '../common/AlertDialog.jsx';

export default function FastFoodSettingsComprehensive() {
  const [activeSection, setActiveSection] = useState('STORE');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Settings state
  const [settings, setSettings] = useState({
    // Store
    storeName: 'McDonald\'s Goa',
    storeAddress: '123 Beach Road, Goa',
    storePhone: '+91 9876543210',
    
    // Drive-Thru
    targetTime: '3:00',
    soundAlerts: true,
    queueDisplay: true,
    priorityMode: true,
    dualLane: true,
    
    // Printer
    kitchenPrinter: 'thermal',
    kitchenWidth: '80mm',
    receiptPrinter: 'thermal',
    receiptWidth: '58mm',
    autoPrint: true,
    printLogo: true,
    
    // Payment
    cashEnabled: true,
    cardEnabled: true,
    mobileEnabled: true,
    giftEnabled: true,
    splitPayment: true,
    
    // Kitchen
    routingEnabled: true,
    stationGrill: true,
    stationFry: true,
    stationOven: true,
    stationDrinks: true,
    stationPack: true,
    autoClear: false,
    expiryTime: 30,
    
    // Loyalty
    loyaltyEnabled: true,
    pointsPerRupee: 1,
    goldThreshold: 1000,
    silverThreshold: 500,
    bronzeThreshold: 100,
    
    // Taxes
    gstEnabled: true,
    gstRate: 5,
    serviceCharge: 0,
    serviceChargeRate: 0,
  });

  // Settings sections
  const sections = [
    { id: 'STORE', label: 'STORE', icon: '🏪' },
    { id: 'DRIVE_THRU', label: 'DRIVE-THRU', icon: '🚗' },
    { id: 'PRINTER', label: 'PRINTER', icon: '🖨️' },
    { id: 'PAYMENT', label: 'PAYMENT', icon: '💳' },
    { id: 'KITCHEN', label: 'KITCHEN', icon: '👨‍🍳' },
    { id: 'LOYALTY', label: 'LOYALTY', icon: '⭐' },
    { id: 'TAXES', label: 'TAXES', icon: '💰' },
  ];

  // Handler functions
  const handleSaveSettings = () => {
    setAlertDialog({ isOpen: true, title: 'Settings Saved', message: 'Settings saved successfully!', type: 'success' });
  };

  // Toggle switch component
  const ToggleSwitch = ({ checked, onChange, label }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '2px solid #E63946' }}>
      <span style={{ fontSize: '14px', fontWeight: '700' }}>{label}</span>
      <div
        onClick={onChange}
        style={{
          width: '52px',
          height: '28px',
          backgroundColor: checked ? '#E63946' : '#F8F9FA',
          borderRadius: '14px',
          position: 'relative',
          cursor: 'pointer',
          border: '2px solid #E63946',
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
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#666666', marginBottom: '8px', textTransform: 'uppercase' }}>
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
          backgroundColor: '#F8F9FA',
          border: '2px solid #E63946',
          color: '#1A1A1A',
          fontSize: '14px',
          fontWeight: '700',
          borderRadius: '4px',
        }}
      />
    </div>
  );

  // Select component
  const SelectField = ({ label, value, onChange, options }) => (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#666666', marginBottom: '8px', textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: '#F8F9FA',
          border: '2px solid #E63946',
          color: '#1A1A1A',
          fontSize: '14px',
          fontWeight: '700',
          borderRadius: '4px',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: '#F8F9FA', color: '#1A1A1A' }}>
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
    backgroundColor: '#F8F9FA',
    color: '#1A1A1A',
    fontFamily: 'Inter, Arial, sans-serif',
    display: 'flex',
    overflow: 'hidden',
  };

  const sidebarStyle = {
    width: '20%',
    minWidth: '180px',
    maxWidth: '250px',
    backgroundColor: '#FFFFFF',
    borderRight: '2px solid #E63946',
    display: 'flex',
    flexDirection: 'column',
  };

  const sidebarHeaderStyle = {
    padding: '12px',
    borderBottom: '2px solid #E63946',
  };

  const sidebarTitleStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#E63946',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const sectionListStyle = {
    flex: 1,
    padding: '8px',
  };

  const sectionItemStyle = (isActive) => ({
    padding: '10px 12px',
    marginBottom: '4px',
    backgroundColor: isActive ? '#E63946' : 'transparent',
    borderLeft: isActive ? '4px solid #E63946' : '4px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    fontWeight: '800',
    color: isActive ? '#FFFFFF' : '#1A1A1A',
  });

  const contentStyle = {
    width: '80%',
    backgroundColor: '#F8F9FA',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  };

  const contentHeaderStyle = {
    padding: '12px',
    backgroundColor: '#E63946',
    borderBottom: '2px solid #E63946',
  };

  const contentTitleStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const contentBodyStyle = {
    padding: '16px',
  };

  const sectionCardStyle = {
    backgroundColor: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  };

  const sectionTitleStyle = {
    fontSize: '14px',
    fontWeight: '900',
    color: '#E63946',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '2px solid #E63946',
    paddingBottom: '8px',
  };

  const saveButtonStyle = {
    padding: '10px 24px',
    fontSize: '12px',
    fontWeight: '900',
    backgroundColor: '#E63946',
    color: '#FFFFFF',
    border: '2px solid #E63946',
    borderRadius: '4px',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  // Render settings content based on active section
  const renderSettingsContent = () => {
    switch (activeSection) {
      case 'STORE':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>🏪 STORE INFORMATION</div>
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
          </div>
        );

      case 'DRIVE_THRU':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>🚗 DRIVE-THRU CONFIGURATION</div>
            <InputField
              label="Target Time"
              value={settings.targetTime}
              onChange={(val) => setSettings({...settings, targetTime: val})}
              placeholder="Enter target time"
            />
            <ToggleSwitch
              label="Sound Alerts"
              checked={settings.soundAlerts}
              onChange={() => setSettings({...settings, soundAlerts: !settings.soundAlerts})}
            />
            <ToggleSwitch
              label="Queue Display"
              checked={settings.queueDisplay}
              onChange={() => setSettings({...settings, queueDisplay: !settings.queueDisplay})}
            />
            <ToggleSwitch
              label="Priority Mode"
              checked={settings.priorityMode}
              onChange={() => setSettings({...settings, priorityMode: !settings.priorityMode})}
            />
            <ToggleSwitch
              label="Dual Lane Support"
              checked={settings.dualLane}
              onChange={() => setSettings({...settings, dualLane: !settings.dualLane})}
            />
          </div>
        );

      case 'PRINTER':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>🖨️ PRINTER SETTINGS</div>
            <SelectField
              label="Kitchen Printer Type"
              value={settings.kitchenPrinter}
              onChange={(val) => setSettings({...settings, kitchenPrinter: val})}
              options={[
                { value: 'thermal', label: 'Thermal Printer' },
                { value: 'inkjet', label: 'Inkjet Printer' },
                { value: 'laser', label: 'Laser Printer' },
              ]}
            />
            <SelectField
              label="Kitchen Paper Width"
              value={settings.kitchenWidth}
              onChange={(val) => setSettings({...settings, kitchenWidth: val})}
              options={[
                { value: '58mm', label: '58mm' },
                { value: '80mm', label: '80mm' },
                { value: 'A4', label: 'A4' },
              ]}
            />
            <SelectField
              label="Receipt Printer Type"
              value={settings.receiptPrinter}
              onChange={(val) => setSettings({...settings, receiptPrinter: val})}
              options={[
                { value: 'thermal', label: 'Thermal Printer' },
                { value: 'inkjet', label: 'Inkjet Printer' },
              ]}
            />
            <SelectField
              label="Receipt Paper Width"
              value={settings.receiptWidth}
              onChange={(val) => setSettings({...settings, receiptWidth: val})}
              options={[
                { value: '58mm', label: '58mm' },
                { value: '80mm', label: '80mm' },
              ]}
            />
            <ToggleSwitch
              label="Auto-Print Orders"
              checked={settings.autoPrint}
              onChange={() => setSettings({...settings, autoPrint: !settings.autoPrint})}
            />
            <ToggleSwitch
              label="Print Logo on Receipt"
              checked={settings.printLogo}
              onChange={() => setSettings({...settings, printLogo: !settings.printLogo})}
            />
          </div>
        );

      case 'PAYMENT':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>💳 PAYMENT SETTINGS</div>
            <ToggleSwitch
              label="Cash Payment"
              checked={settings.cashEnabled}
              onChange={() => setSettings({...settings, cashEnabled: !settings.cashEnabled})}
            />
            <ToggleSwitch
              label="Card Payment"
              checked={settings.cardEnabled}
              onChange={() => setSettings({...settings, cardEnabled: !settings.cardEnabled})}
            />
            <ToggleSwitch
              label="Mobile Payment"
              checked={settings.mobileEnabled}
              onChange={() => setSettings({...settings, mobileEnabled: !settings.mobileEnabled})}
            />
            <ToggleSwitch
              label="Gift Cards"
              checked={settings.giftEnabled}
              onChange={() => setSettings({...settings, giftEnabled: !settings.giftEnabled})}
            />
            <ToggleSwitch
              label="Split Payment"
              checked={settings.splitPayment}
              onChange={() => setSettings({...settings, splitPayment: !settings.splitPayment})}
            />
          </div>
        );

      case 'KITCHEN':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>👨‍🍳 KITCHEN SETTINGS</div>
            <ToggleSwitch
              label="Enable Routing"
              checked={settings.routingEnabled}
              onChange={() => setSettings({...settings, routingEnabled: !settings.routingEnabled})}
            />
            <ToggleSwitch
              label="Grill Station"
              checked={settings.stationGrill}
              onChange={() => setSettings({...settings, stationGrill: !settings.stationGrill})}
            />
            <ToggleSwitch
              label="Fry Station"
              checked={settings.stationFry}
              onChange={() => setSettings({...settings, stationFry: !settings.stationFry})}
            />
            <ToggleSwitch
              label="Oven Station"
              checked={settings.stationOven}
              onChange={() => setSettings({...settings, stationOven: !settings.stationOven})}
            />
            <ToggleSwitch
              label="Drinks Station"
              checked={settings.stationDrinks}
              onChange={() => setSettings({...settings, stationDrinks: !settings.stationDrinks})}
            />
            <ToggleSwitch
              label="Packaging Station"
              checked={settings.stationPack}
              onChange={() => setSettings({...settings, stationPack: !settings.stationPack})}
            />
            <ToggleSwitch
              label="Auto-Clear Completed"
              checked={settings.autoClear}
              onChange={() => setSettings({...settings, autoClear: !settings.autoClear})}
            />
            <InputField
              label="KOT Expiry (Minutes)"
              value={settings.expiryTime}
              onChange={(val) => setSettings({...settings, expiryTime: parseInt(val) || 30})}
              type="number"
              placeholder="Enter expiry time"
            />
          </div>
        );

      case 'LOYALTY':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>⭐ LOYALTY PROGRAM</div>
            <ToggleSwitch
              label="Enable Loyalty Program"
              checked={settings.loyaltyEnabled}
              onChange={() => setSettings({...settings, loyaltyEnabled: !settings.loyaltyEnabled})}
            />
            <InputField
              label="Points Per ₹1 Spent"
              value={settings.pointsPerRupee}
              onChange={(val) => setSettings({...settings, pointsPerRupee: parseFloat(val) || 1})}
              type="number"
              placeholder="Enter points rate"
            />
            <InputField
              label="Gold Tier Threshold (Points)"
              value={settings.goldThreshold}
              onChange={(val) => setSettings({...settings, goldThreshold: parseInt(val) || 1000})}
              type="number"
              placeholder="Enter gold threshold"
            />
            <InputField
              label="Silver Tier Threshold (Points)"
              value={settings.silverThreshold}
              onChange={(val) => setSettings({...settings, silverThreshold: parseInt(val) || 500})}
              type="number"
              placeholder="Enter silver threshold"
            />
            <InputField
              label="Bronze Tier Threshold (Points)"
              value={settings.bronzeThreshold}
              onChange={(val) => setSettings({...settings, bronzeThreshold: parseInt(val) || 100})}
              type="number"
              placeholder="Enter bronze threshold"
            />
          </div>
        );

      case 'TAXES':
        return (
          <div style={sectionCardStyle}>
            <div style={sectionTitleStyle}>💰 TAX CONFIGURATION</div>
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
              label="Service Charge (%)"
              value={settings.serviceChargeRate}
              onChange={(val) => setSettings({...settings, serviceChargeRate: parseFloat(val) || 0})}
              type="number"
              placeholder="Enter service charge rate"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div style={containerStyle}>
        {/* SIDEBAR */}
        <div style={sidebarStyle}>
          <div style={sidebarHeaderStyle}>
            <div style={sidebarTitleStyle}>⚙️ SETTINGS</div>
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
            <button onClick={handleSaveSettings} style={saveButtonStyle}>
              💾 SAVE CHANGES
            </button>
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </>
  );
}
