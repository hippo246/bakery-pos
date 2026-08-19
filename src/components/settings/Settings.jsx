import React, { useState, useEffect } from 'react';
import { KitchenStation } from '../../domain/kotTypes.js';

export default function SimpleSettings({ settings = {}, setSettings, onNavigate, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, orders = [], setOrders, staff = [], setStaff, tables = [], setTables }) {
  const [activeSection, setActiveSection] = useState('general');
  const [screenSize, setScreenSize] = useState('large'); // 'large', 'medium', 'small'

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
  const [formData, setFormData] = useState({
    storeName: settings.storeName || '',
    storeAddress: settings.storeAddress || '',
    phone: settings.phone || '',
    email: settings.email || '',
    taxRate: settings.taxRate || '18',
    currency: settings.currency || 'INR',
    language: settings.language || 'en',
    receiptFooter: settings.receiptFooter || '',
    codeType: settings.codeType || 'alphanumeric',
    razorpayKeyId: settings.razorpayKeyId || '',
    razorpayKeySecret: settings.razorpayKeySecret || '',
    printerType: settings.printerType || 'thermal',
    autoPrintReceipt: settings.autoPrintReceipt !== false,
    kitchenDisplayEnabled: settings.kitchenDisplayEnabled !== false,
    qrOrderingEnabled: settings.qrOrderingEnabled !== false,
    theme: settings.theme || 'light',
    orderTimeout: settings.orderTimeout || '30',
    lowStockAlert: settings.lowStockAlert !== false,
    dailyReportTime: settings.dailyReportTime || '23:00',
    enableNotifications: settings.enableNotifications !== false,
    gstin: settings.gstin || '',
    gstRegistered: settings.gstRegistered !== false,
    fssaiLicense: settings.fssaiLicense || '',
    dataRetentionDays: settings.dataRetentionDays || '365',
    posMode: settings.posMode || 'basic',
    receiptTemplate: settings.receiptTemplate || 'standard',
    customReceiptHeader: settings.customReceiptHeader || '',
    customReceiptFooter: settings.customReceiptFooter || '',
    showLogoOnReceipt: settings.showLogoOnReceipt !== false,
    showGstOnReceipt: settings.showGstOnReceipt !== false,
    showTableOnReceipt: settings.showTableOnReceipt !== false,
    showCustomerOnReceipt: settings.showCustomerOnReceipt !== false,
    receiptFontSize: settings.receiptFontSize || '12',
    // Workflow settings
    requireCustomer: settings.requireCustomer || false,
    requireTable: settings.requireTable || false,
    allowWalkIn: settings.allowWalkIn !== false,
    requirePaymentBeforeKOT: settings.requirePaymentBeforeKOT || false,
    autoCreateKOT: settings.autoCreateKOT !== false,
    allowedPaymentMethods: settings.allowedPaymentMethods || ['CASH', 'CARD', 'UPI'],
    enableSplitPayment: settings.enableSplitPayment !== false,
    maxSplitPayments: settings.maxSplitPayments || 5,
    enableDiscount: settings.enableDiscount !== false,
    maxDiscountPercent: settings.maxDiscountPercent || 50,
    requireManagerForHighDiscount: settings.requireManagerForHighDiscount || false,
    highDiscountThreshold: settings.highDiscountThreshold || 20,
    enableHoldOrders: settings.enableHoldOrders !== false,
    maxHoldOrders: settings.maxHoldOrders || 10,
    holdOrderTimeout: settings.holdOrderTimeout || 60,
    enableCustomOrders: settings.enableCustomOrders !== false,
    requireApprovalForCustomOrders: settings.requireApprovalForCustomOrders || false,
    enableVoid: settings.enableVoid !== false,
    requireManagerForVoid: settings.requireManagerForVoid || false,
    enableOrderNotes: settings.enableOrderNotes !== false,
    requireNotesForCustomOrders: settings.requireNotesForCustomOrders || false,
    workflowSteps: settings.workflowSteps || ['items', 'customer', 'table', 'payment'],
    autoPrintKOT: settings.autoPrintKOT !== false,
    kotPrintStations: settings.kotPrintStations || ['kitchen', 'bar'],
    enableTokenSystem: settings.enableTokenSystem !== false,
    tokenPrefix: settings.tokenPrefix || 'T',
    autoAssignTables: settings.autoAssignTables || false,
    // Receipt additional fields
    storeLogo: settings.storeLogo || '',
    cashierName: settings.cashierName || '',
    showCashierOnReceipt: settings.showCashierOnReceipt !== false,
    showEmailOnReceipt: settings.showEmailOnReceipt !== false,
    showPaymentDetailsOnReceipt: settings.showPaymentDetailsOnReceipt !== false,
    showBillIdOnReceipt: settings.showBillIdOnReceipt !== false
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [stations, setStations] = useState([
    { id: KitchenStation.BAKERY, name: 'Bakery', enabled: true, printer: null },
    { id: KitchenStation.KITCHEN, name: 'Kitchen', enabled: true, printer: null },
    { id: KitchenStation.BEVERAGE, name: 'Beverage', enabled: true, printer: null },
    { id: KitchenStation.DESSERT, name: 'Dessert', enabled: true, printer: null },
    { id: KitchenStation.GRILL, name: 'Grill', enabled: false, printer: null },
    { id: KitchenStation.FRYER, name: 'Fryer', enabled: false, printer: null },
    { id: KitchenStation.COLD, name: 'Cold', enabled: false, printer: null },
    { id: KitchenStation.GENERAL, name: 'General', enabled: true, printer: null }
  ]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('storeLogo', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Station configuration functions
  const toggleStation = (stationId) => {
    setStations(stations.map(s => 
      s.id === stationId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const updateStationPrinter = (stationId, printer) => {
    setStations(stations.map(s => 
      s.id === stationId ? { ...s, printer } : s
    ));
  };

  const saveStationConfiguration = () => {
    try {
      localStorage.setItem('cafeos_kitchen_stations', JSON.stringify(stations));
      alert('Station configuration saved!');
    } catch (error) {
      console.error('Error saving station configuration:', error);
      alert('Failed to save station configuration');
    }
  };

  const loadStationConfiguration = () => {
    try {
      const saved = localStorage.getItem('cafeos_kitchen_stations');
      if (saved) {
        setStations(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading station configuration:', error);
    }
  };

  useEffect(() => {
    loadStationConfiguration();
  }, []);

  // Helper function for station icons
  const getStationIcon = (stationId) => {
    const icons = {
      [KitchenStation.BAKERY]: '🥐',
      [KitchenStation.KITCHEN]: '🍳',
      [KitchenStation.BEVERAGE]: '☕',
      [KitchenStation.DESSERT]: '🍰',
      [KitchenStation.GRILL]: '🥩',
      [KitchenStation.FRYER]: '🍟',
      [KitchenStation.COLD]: '🥗',
      [KitchenStation.GENERAL]: '🍽️'
    };
    return icons[stationId] || '🍽️';
  };

  const generateCode = (index, codeType) => {
    switch (codeType) {
      case 'numeric':
        return String(index + 101);
      case 'alphabetic':
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const first = letters[Math.floor(index / 26) % 26];
        const second = letters[index % 26];
        return first + second;
      case 'alphanumeric':
      default:
        const alphaIndex = Math.floor(index / 10);
        const numIndex = index % 10;
        const letter = letters[alphaIndex % 26];
        return letter + numIndex;
    }
  };

  const updateMenuCodes = (newCodeType) => {
    const updatedMenuItems = menuItems.map((item, index) => ({
      ...item,
      code: generateCode(index, newCodeType)
    }));
    setMenuItems(updatedMenuItems);
  };

  const handleSave = () => {
    setSettings(formData);
    const oldCodeType = settings.codeType;
    const newCodeType = formData.codeType;
    
    // If code type changed, update all menu item codes
    if (oldCodeType !== newCodeType) {
      updateMenuCodes(newCodeType);
    }
    setHasChanges(false);
  };

  const handleBackup = () => {
    const backupData = {
      settings: formData,
      menuItems: menuItems || [],
      inventory: inventory || [],
      customers: customers || [],
      orders: orders || [],
      staff: staff || [],
      tables: tables || [],
      backupDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bakerypos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        
        if (confirm('This will replace all current data with the backup. Are you sure you want to continue?')) {
          if (backupData.settings) setSettings(backupData.settings);
          if (backupData.menuItems) setMenuItems(backupData.menuItems);
          if (backupData.inventory) setInventory(backupData.inventory);
          if (backupData.customers) setCustomers(backupData.customers);
          if (backupData.orders) setOrders(backupData.orders);
          if (backupData.staff) setStaff(backupData.staff);
          if (backupData.tables) setTables(backupData.tables);
          
          alert('Backup restored successfully!');
        }
      } catch (error) {
        alert('Error restoring backup: Invalid backup file');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleReset = () => {
    setFormData({
      storeName: settings.storeName || '',
      storeAddress: settings.storeAddress || '',
      phone: settings.phone || '',
      email: settings.email || '',
      taxRate: settings.taxRate || '18',
      currency: settings.currency || 'INR',
      language: settings.language || 'en',
      receiptFooter: settings.receiptFooter || '',
      codeType: settings.codeType || 'alphanumeric',
      razorpayKeyId: settings.razorpayKeyId || 'rzp_test_TNOHWmxS3Z0i8f',
      razorpayKeySecret: settings.razorpayKeySecret || 'YbVAsBPPz7NT6iwXnuvBUDHb',
      printerType: settings.printerType || 'thermal',
      autoPrintReceipt: settings.autoPrintReceipt !== false,
      kitchenDisplayEnabled: settings.kitchenDisplayEnabled !== false,
      qrOrderingEnabled: settings.qrOrderingEnabled !== false,
      theme: settings.theme || 'light',
      orderTimeout: settings.orderTimeout || '30',
      lowStockAlert: settings.lowStockAlert !== false,
      dailyReportTime: settings.dailyReportTime || '23:00',
      enableNotifications: settings.enableNotifications !== false,
      gstin: settings.gstin || '',
      gstRegistered: settings.gstRegistered !== false,
      fssaiLicense: settings.fssaiLicense || '',
      dataRetentionDays: settings.dataRetentionDays || '365',
      posMode: settings.posMode || 'basic',
      receiptTemplate: settings.receiptTemplate || 'standard',
      customReceiptHeader: settings.customReceiptHeader || '',
      customReceiptFooter: settings.customReceiptFooter || '',
      showLogoOnReceipt: settings.showLogoOnReceipt !== false,
      showGstOnReceipt: settings.showGstOnReceipt !== false,
      showTableOnReceipt: settings.showTableOnReceipt !== false,
      showCustomerOnReceipt: settings.showCustomerOnReceipt !== false,
      receiptFontSize: settings.receiptFontSize || '12',
      // Receipt additional fields
      storeLogo: settings.storeLogo || '',
      cashierName: settings.cashierName || '',
      showCashierOnReceipt: settings.showCashierOnReceipt !== false,
      showEmailOnReceipt: settings.showEmailOnReceipt !== false,
      showPaymentDetailsOnReceipt: settings.showPaymentDetailsOnReceipt !== false,
      showBillIdOnReceipt: settings.showBillIdOnReceipt !== false
    });
    setHasChanges(false);
  };

  const sections = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'business', label: 'Business', icon: '🏪' },
    { id: 'tax', label: 'Tax & Pricing', icon: '💰' },
    { id: 'compliance', label: 'Compliance', icon: '📋' },
    { id: 'receipt', label: 'Receipts', icon: '🧾' },
    { id: 'receipttemplate', label: 'Receipt Template', icon: '📄' },
    { id: 'workflow', label: 'Workflow & SOP', icon: '🔄' },
    { id: 'pos', label: 'POS Settings', icon: '🛒' },
    { id: 'itemcodes', label: 'Item Codes', icon: '🔢' },
    { id: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
    { id: 'qr', label: 'QR Ordering', icon: '📱' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'display', label: 'Display', icon: '🖥️' },
    { id: 'debug', label: 'Debug & Logs', icon: '🐛' },
    { id: 'backup', label: 'Backup & Restore', icon: '💾' }
  ];

  const ReceiptPreview = ({ settings }) => {
    const sampleOrder = {
      id: 'ORD-001',
      token: 'T001',
      billId: 'BILL-2024-0819-001',
      date: new Date().toLocaleString(),
      items: [
        { name: 'Sample Item 1', quantity: 2, price: 150 },
        { name: 'Sample Item 2', quantity: 1, price: 200 }
      ],
      subtotal: 500,
      tax: 90,
      total: 590,
      paymentMethod: 'CASH',
      paymentType: 'CASH',
      paymentEntry: 'POS Terminal 1',
      paymentStatus: 'COMPLETED',
      table: 'T-05',
      customer: 'John Doe',
      cashier: settings.cashierName || 'Staff Member'
    };

    const renderHeader = () => {
      if (settings.receiptTemplate === 'custom' && settings.customReceiptHeader) {
        return (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            {settings.customReceiptHeader}
          </div>
        );
      }
      
      return (
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          {settings.showLogoOnReceipt && settings.storeLogo && (
            <img 
              src={settings.storeLogo} 
              alt="Store Logo" 
              style={{ maxWidth: '80px', maxHeight: '80px', marginBottom: '8px' }}
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          {settings.showLogoOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) + 4}px`, fontWeight: 'bold' }}>
              {settings.storeName || 'My Store'}
            </div>
          )}
          {settings.showLogoOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              {settings.storeAddress || '123 Main St'}
            </div>
          )}
          {settings.showLogoOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              {settings.phone || '+91 9876543210'}
            </div>
          )}
          {settings.showEmailOnReceipt && settings.email && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              {settings.email}
            </div>
          )}
        </div>
      );
    };

    const renderFooter = () => {
      if (settings.receiptTemplate === 'custom' && settings.customReceiptFooter) {
        return (
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
            {settings.customReceiptFooter}
          </div>
        );
      }
      
      return (
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
          <div>{settings.receiptFooter || 'Thank you for visiting!'}</div>
          {settings.gstin && <div>GSTIN: {settings.gstin}</div>}
          {settings.fssaiLicense && <div>FSSAI: {settings.fssaiLicense}</div>}
          {settings.showBillIdOnReceipt && <div>Bill ID: {sampleOrder.billId}</div>}
        </div>
      );
    };

    const baseStyle = {
      fontFamily: 'monospace',
      fontSize: `${settings.receiptFontSize}px`,
      lineHeight: '1.4',
      color: '#000',
      padding: '16px',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '4px',
      maxWidth: '280px',
      margin: '0 auto'
    };

    const thermalStyle = {
      ...baseStyle,
      maxWidth: '240px',
      fontSize: `${parseInt(settings.receiptFontSize) - 2}px`
    };

    const simpleStyle = {
      ...baseStyle,
      padding: '12px'
    };

    const containerStyle = settings.receiptTemplate === 'thermal' ? thermalStyle : 
                          settings.receiptTemplate === 'simple' ? simpleStyle : baseStyle;

    return (
      <div style={containerStyle}>
        {renderHeader()}
        
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Order #: {sampleOrder.id}</span>
            {settings.receiptTemplate !== 'simple' && <span>Token: {sampleOrder.token}</span>}
          </div>
          <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>{sampleOrder.date}</div>
          {settings.showTableOnReceipt && <div>Table: {sampleOrder.table}</div>}
          {settings.showCustomerOnReceipt && <div>Customer: {sampleOrder.customer}</div>}
          {settings.showCashierOnReceipt && <div>Cashier: {sampleOrder.cashier}</div>}
        </div>

        <div style={{ marginBottom: '8px' }}>
          {sampleOrder.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <div>{item.name}</div>
                <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
                  {item.quantity} x ₹{item.price}
                </div>
              </div>
              <div>₹{item.quantity * item.price}</div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>₹{sampleOrder.subtotal}</span>
          </div>
          {settings.showGstOnReceipt && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>GST ({settings.taxRate || 18}%):</span>
              <span>₹{sampleOrder.tax}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>₹{sampleOrder.total}</span>
          </div>
          <div style={{ marginTop: '4px', fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
            Paid: {sampleOrder.paymentMethod}
          </div>
          {settings.showPaymentDetailsOnReceipt && (
            <div style={{ fontSize: `${parseInt(settings.receiptFontSize) - 2}px` }}>
              <div>Type: {sampleOrder.paymentType}</div>
              <div>Entry: {sampleOrder.paymentEntry}</div>
              <div>Status: {sampleOrder.paymentStatus}</div>
            </div>
          )}
        </div>

        {renderFooter()}
      </div>
    );
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
              Settings
            </div>
            <div style={{ color: '#6b7280', fontSize: screenSize === 'small' ? '12px' : '13px', marginTop: '4px' }}>
              Configure your POS system preferences
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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
        {/* Sidebar */}
        <div style={{
          width: screenSize === 'small' ? '100%' : '240px',
          background: '#ffffff',
          borderRight: screenSize === 'small' ? 'none' : '1px solid #e5e7eb',
          borderBottom: screenSize === 'small' ? '1px solid #e5e7eb' : 'none',
          padding: screenSize === 'small' ? '12px' : '16px',
          overflowY: screenSize === 'small' ? 'auto' : 'auto',
          overflowX: screenSize === 'small' ? 'auto' : 'hidden'
        }}>
          <div>
            <div style={{ margin: screenSize === 'small' ? '0 0 8px' : '0 0 12px', fontSize: screenSize === 'small' ? '11px' : '12px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.05em' }}>
              SECTIONS
            </div>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    padding: screenSize === 'small' ? '6px 12px' : '8px 12px',
                    background: activeSection === section.id ? '#f3f4f6' : 'transparent',
                    color: activeSection === section.id ? '#111827' : '#6b7280',
                    border: activeSection === section.id ? '1px solid #e5e7eb' : '1px solid transparent',
                    borderRadius: '6px',
                    fontSize: screenSize === 'small' ? '12px' : '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textAlign: 'left',
                    width: screenSize === 'small' ? 'auto' : '100%'
                  }}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: '#f9fafb' }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: screenSize === 'small' ? '16px' : '24px',
            maxWidth: '700px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ margin: '0 0 20px', fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '600', color: '#111827', paddingBottom: screenSize === 'small' ? '12px' : '16px', borderBottom: '1px solid #e5e7eb' }}>
              {sections.find(s => s.id === activeSection)?.label}
            </div>

            {activeSection === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '14px' : '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '14px' : '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Theme
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '14px' : '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            )}

            {activeSection === 'business' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    placeholder="My Bakery"
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '14px' : '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: screenSize === 'small' ? '13px' : '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.storeAddress}
                    onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                    placeholder="123 Main Street, City"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: screenSize === 'small' ? '10px 12px' : '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
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

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@bakery.com"
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
                </div>
              </div>
            )}

            {activeSection === 'tax' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={formData.taxRate}
                    onChange={(e) => handleInputChange('taxRate', e.target.value)}
                    placeholder="18"
                    min="0"
                    max="100"
                    step="0.1"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    This rate will be applied to all orders
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Tax Information
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Configure your tax rate according to local regulations. This will be automatically added to customer orders.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'compliance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    GST Registration
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      id="gstRegistered"
                      checked={formData.gstRegistered}
                      onChange={(e) => handleInputChange('gstRegistered', e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <label htmlFor="gstRegistered" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      GST Registered (Turnover above ₹40 lakh)
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    GSTIN (GST Identification Number)
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength="15"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    15-character GST identification number (if registered)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    FSSAI License Number
                  </label>
                  <input
                    type="text"
                    value={formData.fssaiLicense}
                    onChange={(e) => handleInputChange('fssaiLicense', e.target.value)}
                    placeholder="10012345678987"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    14-digit FSSAI license number for food safety compliance
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Data Retention Period (days)
                  </label>
                  <input
                    type="number"
                    value={formData.dataRetentionDays}
                    onChange={(e) => handleInputChange('dataRetentionDays', e.target.value)}
                    placeholder="365"
                    min="30"
                    max="2555"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Days to retain customer and order data (DPDP Act compliance)
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Compliance Information
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Configure GST, FSSAI, and data retention settings for regulatory compliance. These will appear on receipts and invoices.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'receipt' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Receipt Footer Message
                  </label>
                  <textarea
                    value={formData.receiptFooter}
                    onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                    placeholder="Thank you for visiting! Visit us again."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Printer Type
                  </label>
                  <select
                    value={formData.printerType}
                    onChange={(e) => handleInputChange('printerType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="thermal">Thermal Printer</option>
                    <option value="inkjet">Inkjet Printer</option>
                    <option value="laser">Laser Printer</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="autoPrintReceipt"
                    checked={formData.autoPrintReceipt}
                    onChange={(e) => handleInputChange('autoPrintReceipt', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="autoPrintReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    Auto-print receipts after order completion
                  </label>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Receipt Settings
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Customize the footer message that appears on customer receipts. This is a great place for thank you messages or promotions.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'receipttemplate' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Receipt Template
                  </label>
                  <select
                    value={formData.receiptTemplate}
                    onChange={(e) => handleInputChange('receiptTemplate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="standard">Standard - Full detailed receipt</option>
                    <option value="simple">Simple - Minimal receipt</option>
                    <option value="thermal">Thermal - Compact for thermal printers</option>
                    <option value="custom">Custom - Use custom template below</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Font Size (px)
                  </label>
                  <select
                    value={formData.receiptFontSize}
                    onChange={(e) => handleInputChange('receiptFontSize', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="10">Small (10px)</option>
                    <option value="12">Medium (12px)</option>
                    <option value="14">Large (14px)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showLogoOnReceipt"
                      checked={formData.showLogoOnReceipt}
                      onChange={(e) => handleInputChange('showLogoOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showLogoOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show store logo/name on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showGstOnReceipt"
                      checked={formData.showGstOnReceipt}
                      onChange={(e) => handleInputChange('showGstOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showGstOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show GST/Tax breakdown on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showTableOnReceipt"
                      checked={formData.showTableOnReceipt}
                      onChange={(e) => handleInputChange('showTableOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showTableOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show table number on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showCustomerOnReceipt"
                      checked={formData.showCustomerOnReceipt}
                      onChange={(e) => handleInputChange('showCustomerOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showCustomerOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show customer name on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showCashierOnReceipt"
                      checked={formData.showCashierOnReceipt}
                      onChange={(e) => handleInputChange('showCashierOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showCashierOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show cashier name on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showEmailOnReceipt"
                      checked={formData.showEmailOnReceipt}
                      onChange={(e) => handleInputChange('showEmailOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showEmailOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show email on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showPaymentDetailsOnReceipt"
                      checked={formData.showPaymentDetailsOnReceipt}
                      onChange={(e) => handleInputChange('showPaymentDetailsOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showPaymentDetailsOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show payment details (type, entry, status) on receipt
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="showBillIdOnReceipt"
                      checked={formData.showBillIdOnReceipt}
                      onChange={(e) => handleInputChange('showBillIdOnReceipt', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="showBillIdOnReceipt" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Show bill ID/database reference on receipt
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Store Logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  {formData.storeLogo && (
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                      <img 
                        src={formData.storeLogo} 
                        alt="Store Logo Preview" 
                        style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleInputChange('storeLogo', '')}
                        style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Upload your store logo image (PNG, JPG, etc.)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Default Cashier Name
                  </label>
                  <input
                    type="text"
                    value={formData.cashierName}
                    onChange={(e) => handleInputChange('cashierName', e.target.value)}
                    placeholder="John Doe"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    This will be used if no specific cashier is assigned to the order
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Custom Header
                  </label>
                  <textarea
                    value={formData.customReceiptHeader}
                    onChange={(e) => handleInputChange('customReceiptHeader', e.target.value)}
                    placeholder="My Store - 123 Main St"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Plain text for receipt header
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Custom Footer
                  </label>
                  <textarea
                    value={formData.customReceiptFooter}
                    onChange={(e) => handleInputChange('customReceiptFooter', e.target.value)}
                    placeholder="Thank you for visiting! Visit us again soon"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '13px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Plain text for receipt footer
                  </p>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#dbeafe',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                    💡 Tip
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
                    Select "Custom" template to use your own HTML header and footer. Standard templates use predefined layouts optimized for different printer types.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
                    📄 Live Receipt Preview
                  </label>
                  <div style={{ 
                    background: '#f9fafb', 
                    padding: '24px', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <ReceiptPreview settings={formData} />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'workflow' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#0369a1' }}>
                    🔄 Workflow Configuration
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0369a1', lineHeight: '1.5' }}>
                    Customize your POS workflow and Standard Operating Procedures (SOP). These settings control what steps are required during order processing and which features are available to staff.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Required Order Steps (Workflow)
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['items', 'customer', 'table', 'payment'].map(step => (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id={`workflow-${step}`}
                          checked={formData.workflowSteps?.includes(step)}
                          onChange={(e) => {
                            const newSteps = e.target.checked
                              ? [...(formData.workflowSteps || []), step]
                              : (formData.workflowSteps || []).filter(s => s !== step);
                            handleInputChange('workflowSteps', newSteps);
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`workflow-${step}`} style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          {step.charAt(0).toUpperCase() + step.slice(1)} {step === 'items' ? '(required)' : ''}
                        </label>
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Select the steps that must be completed before an order can be finalized. "Items" is always required.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Customer Requirements
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="requireCustomer"
                          checked={formData.requireCustomer}
                          onChange={(e) => handleInputChange('requireCustomer', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="requireCustomer" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Require customer selection
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="allowWalkIn"
                          checked={formData.allowWalkIn}
                          onChange={(e) => handleInputChange('allowWalkIn', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="allowWalkIn" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Allow walk-in customers
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Table Requirements
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="requireTable"
                          checked={formData.requireTable}
                          onChange={(e) => handleInputChange('requireTable', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="requireTable" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Require table assignment
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="autoAssignTables"
                          checked={formData.autoAssignTables}
                          onChange={(e) => handleInputChange('autoAssignTables', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="autoAssignTables" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Auto-assign available tables
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Payment Methods
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['CASH', 'CARD', 'UPI', 'SPLIT'].map(method => (
                      <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id={`payment-${method}`}
                          checked={formData.allowedPaymentMethods?.includes(method)}
                          onChange={(e) => {
                            const newMethods = e.target.checked
                              ? [...(formData.allowedPaymentMethods || []), method]
                              : (formData.allowedPaymentMethods || []).filter(m => m !== method);
                            handleInputChange('allowedPaymentMethods', newMethods);
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`payment-${method}`} style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          {method.charAt(0) + method.slice(1).toLowerCase()} {method === 'SPLIT' ? '(multiple payments)' : ''}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Discount Settings
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="enableDiscount"
                          checked={formData.enableDiscount}
                          onChange={(e) => handleInputChange('enableDiscount', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="enableDiscount" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Enable discounts
                        </label>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          Max discount percent
                        </label>
                        <input
                          type="number"
                          value={formData.maxDiscountPercent}
                          onChange={(e) => handleInputChange('maxDiscountPercent', parseInt(e.target.value))}
                          min="0"
                          max="100"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="requireManagerForHighDiscount"
                          checked={formData.requireManagerForHighDiscount}
                          onChange={(e) => handleInputChange('requireManagerForHighDiscount', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="requireManagerForHighDiscount" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Require manager for high discounts
                        </label>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          High discount threshold (%)
                        </label>
                        <input
                          type="number"
                          value={formData.highDiscountThreshold}
                          onChange={(e) => handleInputChange('highDiscountThreshold', parseInt(e.target.value))}
                          min="0"
                          max="100"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Hold Orders
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="enableHoldOrders"
                          checked={formData.enableHoldOrders}
                          onChange={(e) => handleInputChange('enableHoldOrders', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="enableHoldOrders" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Enable hold orders
                        </label>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          Max hold orders
                        </label>
                        <input
                          type="number"
                          value={formData.maxHoldOrders}
                          onChange={(e) => handleInputChange('maxHoldOrders', parseInt(e.target.value))}
                          min="1"
                          max="50"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          Hold order timeout (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.holdOrderTimeout}
                          onChange={(e) => handleInputChange('holdOrderTimeout', parseInt(e.target.value))}
                          min="5"
                          max="240"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Custom Orders
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        id="enableCustomOrders"
                        checked={formData.enableCustomOrders}
                        onChange={(e) => handleInputChange('enableCustomOrders', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="enableCustomOrders" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        Enable custom orders
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        id="requireApprovalForCustomOrders"
                        checked={formData.requireApprovalForCustomOrders}
                        onChange={(e) => handleInputChange('requireApprovalForCustomOrders', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="requireApprovalForCustomOrders" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        Require manager approval for custom orders
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        id="requireNotesForCustomOrders"
                        checked={formData.requireNotesForCustomOrders}
                        onChange={(e) => handleInputChange('requireNotesForCustomOrders', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="requireNotesForCustomOrders" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        Require notes for custom orders
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Order Notes
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="enableOrderNotes"
                      checked={formData.enableOrderNotes}
                      onChange={(e) => handleInputChange('enableOrderNotes', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="enableOrderNotes" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                      Enable order notes
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Void Orders
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        id="enableVoid"
                        checked={formData.enableVoid}
                        onChange={(e) => handleInputChange('enableVoid', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="enableVoid" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        Enable void functionality
                      </label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        id="requireManagerForVoid"
                        checked={formData.requireManagerForVoid}
                        onChange={(e) => handleInputChange('requireManagerForVoid', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label htmlFor="requireManagerForVoid" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                        Require manager approval for void
                      </label>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Kitchen Order Ticket (KOT)
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="autoCreateKOT"
                          checked={formData.autoCreateKOT}
                          onChange={(e) => handleInputChange('autoCreateKOT', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="autoCreateKOT" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Auto-create KOT on order
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="autoPrintKOT"
                          checked={formData.autoPrintKOT}
                          onChange={(e) => handleInputChange('autoPrintKOT', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="autoPrintKOT" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Auto-print KOT
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="requirePaymentBeforeKOT"
                          checked={formData.requirePaymentBeforeKOT}
                          onChange={(e) => handleInputChange('requirePaymentBeforeKOT', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="requirePaymentBeforeKOT" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Require payment before KOT
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Token System
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="checkbox"
                          id="enableTokenSystem"
                          checked={formData.enableTokenSystem}
                          onChange={(e) => handleInputChange('enableTokenSystem', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="enableTokenSystem" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                          Enable token system
                        </label>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                          Token prefix
                        </label>
                        <input
                          type="text"
                          value={formData.tokenPrefix}
                          onChange={(e) => handleInputChange('tokenPrefix', e.target.value)}
                          maxLength="3"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '13px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'pos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    POS Mode
                  </label>
                  <select
                    value={formData.posMode}
                    onChange={(e) => handleInputChange('posMode', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="basic">Basic Mode - Simplified for new employees & senior citizens</option>
                    <option value="advanced">Advanced Mode - Full features for experienced staff</option>
                  </select>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Basic mode shows a simplified interface with larger buttons and fewer options. Advanced mode provides full access to all POS features.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Quick Code Type
                  </label>
                  <select
                    value={formData.codeType}
                    onChange={(e) => handleInputChange('codeType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="alphanumeric">Alphanumeric (A1, B2, etc.)</option>
                    <option value="numeric">Numeric (101, 102, etc.)</option>
                    <option value="alphabetic">Alphabetic (AA, AB, etc.)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Order Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.orderTimeout}
                    onChange={(e) => handleInputChange('orderTimeout', e.target.value)}
                    placeholder="30"
                    min="5"
                    max="120"
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="lowStockAlert"
                    checked={formData.lowStockAlert}
                    onChange={(e) => handleInputChange('lowStockAlert', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="lowStockAlert" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    Enable low stock alerts
                  </label>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    POS Settings
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Configure POS mode, quick codes for menu items, and order timeout settings.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'itemcodes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Code Type
                  </label>
                  <select
                    value={formData.codeType}
                    onChange={(e) => handleInputChange('codeType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      background: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="alphanumeric">Alphanumeric (A1, B2, etc.)</option>
                    <option value="numeric">Numeric (101, 102, etc.)</option>
                    <option value="alphabetic">Alphabetic (AA, AB, etc.)</option>
                  </select>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Changing this will regenerate all item codes. Use with caution.
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Menu Item Codes
                  </label>
                  <div style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#f9fafb' }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Item Name</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuItems && menuItems.length > 0 ? menuItems.map((item, index) => (
                          <tr key={item.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '12px', fontSize: '13px', color: '#374151' }}>{item.name}</td>
                            <td style={{ padding: '12px' }}>
                              <input
                                type="text"
                                value={item.code || generateCode(index, formData.codeType)}
                                onChange={(e) => {
                                  const updatedItems = [...menuItems];
                                  updatedItems[index] = { ...item, code: e.target.value.toUpperCase() };
                                  setMenuItems(updatedItems);
                                  setHasChanges(true);
                                }}
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '4px',
                                  fontSize: '13px',
                                  width: '100px',
                                  textTransform: 'uppercase',
                                  outline: 'none'
                                }}
                              />
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                              No menu items available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#dbeafe',
                  borderRadius: '6px',
                  border: '1px solid #93c5fd'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                    💡 Tip
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#1e40af', lineHeight: '1.5' }}>
                    Item codes can be used in the numpad search to quickly add items to the cart. Keep codes short and memorable for faster operations.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'kitchen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="kitchenDisplayEnabled"
                    checked={formData.kitchenDisplayEnabled}
                    onChange={(e) => handleInputChange('kitchenDisplayEnabled', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="kitchenDisplayEnabled" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    Enable Kitchen Display System
                  </label>
                </div>

                <div style={{
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    🍳 Kitchen Station Configuration
                  </h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>
                    Configure kitchen stations for KOT routing
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <button
                      onClick={saveStationConfiguration}
                      style={{
                        padding: '10px 20px',
                        background: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Save Stations
                    </button>
                    <button
                      onClick={loadStationConfiguration}
                      style={{
                        padding: '10px 20px',
                        background: '#ffffff',
                        color: '#111827',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Reload
                    </button>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {stations.map(station => (
                      <div
                        key={station.id}
                        style={{
                          background: '#ffffff',
                          borderRadius: '8px',
                          padding: '16px',
                          border: station.enabled ? '2px solid #059669' : '1px solid #e5e7eb',
                          opacity: station.enabled ? 1 : 0.6
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              background: station.enabled ? '#f0fdf4' : '#f3f4f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '20px'
                            }}>
                              {getStationIcon(station.id)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{station.name}</div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{station.id}</div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => toggleStation(station.id)}
                            style={{
                              padding: '6px 12px',
                              background: station.enabled ? '#111827' : '#f9fafb',
                              color: station.enabled ? '#ffffff' : '#111827',
                              border: station.enabled ? 'none' : '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer'
                            }}
                          >
                            {station.enabled ? 'On' : 'Off'}
                          </button>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '6px', fontWeight: '500' }}>
                            Printer:
                          </label>
                          <input
                            type="text"
                            value={station.printer || ''}
                            onChange={(e) => updateStationPrinter(station.id, e.target.value)}
                            placeholder="e.g., Kitchen Printer 1"
                            disabled={!station.enabled}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              background: '#ffffff',
                              color: '#111827',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              fontSize: '13px',
                              opacity: station.enabled ? 1 : 0.5,
                              outline: 'none'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#dbeafe',
                    borderRadius: '6px',
                    border: '1px solid #93c5fd'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', lineHeight: '1.5' }}>
                      💡 Enable stations that are active in your kitchen. Items are automatically routed to stations based on their category. Disabled stations will not receive KOTs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="qrOrderingEnabled"
                    checked={formData.qrOrderingEnabled}
                    onChange={(e) => handleInputChange('qrOrderingEnabled', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="qrOrderingEnabled" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    Enable QR Code Ordering
                  </label>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    QR Ordering Settings
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    When enabled, customers can scan QR codes at tables to place orders directly from their phones.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    id="enableNotifications"
                    checked={formData.enableNotifications}
                    onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <label htmlFor="enableNotifications" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                    Enable Desktop Notifications
                  </label>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Daily Report Time
                  </label>
                  <input
                    type="time"
                    value={formData.dailyReportTime}
                    onChange={(e) => handleInputChange('dailyReportTime', e.target.value)}
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

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Notification Settings
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Configure when to receive notifications for orders, low stock alerts, and daily reports.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={formData.razorpayKeyId}
                    onChange={(e) => handleInputChange('razorpayKeyId', e.target.value)}
                    placeholder="rzp_live_xxxxx or rzp_test_xxxxx"
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
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    value={formData.razorpayKeySecret}
                    onChange={(e) => handleInputChange('razorpayKeySecret', e.target.value)}
                    placeholder="Your Razorpay secret key"
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

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    Payment Settings
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>
                    Configure Razorpay for digital payments. Staff can process payments directly through the POS.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Backup Data
                  </label>
                  <button
                    onClick={handleBackup}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      background: '#111827',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    💾 Download Backup
                  </button>
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Download a complete backup of all POS data (settings, menu, inventory, customers, orders, etc.)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Restore Data
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
                    Restore POS data from a previously created backup file
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'debug' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    🐛 Crash & Bug Tracking
                  </h3>
                  <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#6b7280' }}>
                    Monitor system errors and crashes for debugging
                  </p>

                  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <button
                      onClick={() => {
                        const stats = JSON.parse(localStorage.getItem('cafeos_crash_stats') || '{}');
                        alert(JSON.stringify(stats, null, 2));
                      }}
                      style={{
                        padding: '10px 20px',
                        background: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      View Crash Stats
                    </button>
                    <button
                      onClick={() => {
                        const errorLog = JSON.parse(localStorage.getItem('cafeos_error_log') || '[]');
                        alert(JSON.stringify(errorLog, null, 2));
                      }}
                      style={{
                        padding: '10px 20px',
                        background: '#ffffff',
                        color: '#111827',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      View Error Log
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Clear all error logs and crash statistics?')) {
                          localStorage.removeItem('cafeos_error_log');
                          localStorage.removeItem('cafeos_crash_stats');
                          alert('Error logs cleared successfully');
                        }
                      }}
                      style={{
                        padding: '10px 20px',
                        background: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Logs
                    </button>
                  </div>

                  <div style={{
                    padding: '16px',
                    background: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      System Information
                    </h4>
                    <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                      <div><strong>Browser:</strong> {navigator.userAgent}</div>
                      <div><strong>Platform:</strong> {navigator.platform}</div>
                      <div><strong>Language:</strong> {navigator.language}</div>
                      <div><strong>Screen:</strong> {window.screen.width}x{window.screen.height}</div>
                      <div><strong>Memory:</strong> {navigator.deviceMemory || 'Unknown'} GB</div>
                      <div><strong>Cores:</strong> {navigator.hardwareConcurrency || 'Unknown'}</div>
                      <div><strong>Connection:</strong> {navigator.connection?.effectiveType || 'Unknown'}</div>
                      <div><strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}</div>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#dbeafe',
                    borderRadius: '6px',
                    border: '1px solid #93c5fd'
                  }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1e40af', lineHeight: '1.5' }}>
                      💡 Error logs are automatically captured by the system and stored in localStorage. Use this information to diagnose issues and improve system stability.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: screenSize === 'small' ? '8px' : '12px',
              marginTop: screenSize === 'small' ? '16px' : '24px',
              paddingTop: screenSize === 'small' ? '16px' : '20px',
              borderTop: '1px solid #e5e7eb',
              justifyContent: screenSize === 'small' ? 'stretch' : 'flex-end',
              flexDirection: screenSize === 'small' ? 'column' : 'row'
            }}>
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: hasChanges ? '#f9fafb' : '#f3f4f6',
                  color: hasChanges ? '#111827' : '#9ca3af',
                  border: hasChanges ? '1px solid #e5e7eb' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: screenSize === 'small' ? '13px' : '14px',
                  fontWeight: '500',
                  cursor: hasChanges ? 'pointer' : 'not-allowed'
                }}
              >
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                style={{
                  padding: screenSize === 'small' ? '10px 20px' : '12px 24px',
                  background: hasChanges ? '#111827' : '#f3f4f6',
                  color: hasChanges ? '#ffffff' : '#9ca3af',
                  border: hasChanges ? 'none' : '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: screenSize === 'small' ? '13px' : '14px',
                  fontWeight: '500',
                  cursor: hasChanges ? 'pointer' : 'not-allowed'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
