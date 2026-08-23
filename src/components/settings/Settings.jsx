import React, { useState, useEffect } from 'react';
import { KitchenStation } from '../../domain/kotTypes.js';
import useScreenSize from '../../hooks/useScreenSize';

export default function SimpleSettings({ settings = {}, setSettings, onNavigate, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, orders = [], setOrders, staff = [], setStaff, tables = [], setTables }) {
  const [activeSection, setActiveSection] = useState('general');
  const screenSize = useScreenSize();

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
    brevoApiKey: settings.brevoApiKey || '',
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
    tariffCode: settings.tariffCode || '',
    googleReviewUrl: settings.googleReviewUrl || '',
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
    enableHoldOrders: settings.enableHoldOrders === true,
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
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    switch (codeType) {
      case 'numeric':
        return String(index + 101);
      case 'alphabetic':
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
      razorpayKeyId: settings.razorpayKeyId || '',
      razorpayKeySecret: settings.razorpayKeySecret || '',
      brevoApiKey: settings.brevoApiKey || '',
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
      tariffCode: settings.tariffCode || '',
      googleReviewUrl: settings.googleReviewUrl || '',
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
      enableHoldOrders: settings.enableHoldOrders === true,
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
    setHasChanges(false);
  };

  const sections = [
    { 
      group: 'General',
      items: [
        { id: 'general', label: 'General', icon: '⚙️' },
        { id: 'display', label: 'Display', icon: '🖥️' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' }
      ]
    },
    { 
      group: 'Business',
      items: [
        { id: 'business', label: 'Business', icon: '🏪' },
        { id: 'tax', label: 'Tax & Pricing', icon: '💰' }
      ]
    },
    { 
      group: 'POS',
      items: [
        { id: 'pos', label: 'POS Settings', icon: '🛒' },
        { id: 'itemcodes', label: 'Item Codes', icon: '🔢' }
      ]
    },
    { 
      group: 'Receipts',
      items: [
        { id: 'receipt', label: 'Receipts', icon: '🧾' }
      ]
    },
    { 
      group: 'Operations',
      items: [
        { id: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
        { id: 'qr', label: 'QR Ordering', icon: '📱' }
      ]
    },
    { 
      group: 'System',
      items: [
        { id: 'backup', label: 'Backup & Restore', icon: '💾' },
        { id: 'debug', label: 'Debug & Logs', icon: '🐛' }
      ]
    }
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
      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
        {/* Sidebar */}
        <div style={{
          width: screenSize === 'small' ? '100%' : '280px',
          background: '#ffffff',
          borderRight: screenSize === 'small' ? 'none' : '1px solid #e5e7eb',
          borderBottom: screenSize === 'small' ? '1px solid #e5e7eb' : 'none',
          padding: screenSize === 'small' ? '12px' : '16px',
          overflowY: screenSize === 'small' ? 'auto' : 'auto',
          overflowX: screenSize === 'small' ? 'auto' : 'hidden'
        }}>
          {sections.map(group => (
            <div key={group.group} style={{ marginBottom: screenSize === 'small' ? '12px' : '16px' }}>
              <div style={{ 
                margin: screenSize === 'small' ? '0 0 8px' : '0 0 10px', 
                fontSize: screenSize === 'small' ? '10px' : '11px', 
                fontWeight: '700', 
                color: '#9ca3af', 
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                {group.group}
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '4px'
              }}>
                {group.items.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      padding: screenSize === 'small' ? '8px 12px' : '10px 12px',
                      background: activeSection === section.id ? '#f3f4f6' : 'transparent',
                      color: activeSection === section.id ? '#111827' : '#6b7280',
                      border: activeSection === section.id ? '1px solid #e5e7eb' : '1px solid transparent',
                      borderRadius: '6px',
                      fontSize: screenSize === 'small' ? '13px' : '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== section.id) {
                        e.target.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== section.id) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                  >
                    <span style={{ fontSize: screenSize === 'small' ? '14px' : '16px' }}>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
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
              {sections.flatMap(g => g.items).find(s => s.id === activeSection)?.label}
            </div>

            {activeSection === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🌍 Regional Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
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
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🎨 Appearance
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'business' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🏪 Store Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        placeholder="My Bakery"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Store Address
                      </label>
                      <input
                        type="text"
                        value={formData.storeAddress}
                        onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                        placeholder="123 Main Street"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Phone
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+91 9876543210"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contact@example.com"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tax' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    💰 Tax Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.taxRate}
                        onChange={(e) => handleInputChange('taxRate', e.target.value)}
                        placeholder="18"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeSection === 'receipt' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Legal Compliance */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    📋 Legal Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange('gstin', e.target.value)}
                        placeholder="29ABCDE1234F1Z5"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        FSSAI License
                      </label>
                      <input
                        type="text"
                        value={formData.fssaiLicense}
                        onChange={(e) => handleInputChange('fssaiLicense', e.target.value)}
                        placeholder="10012345678987"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Tariff Code
                      </label>
                      <input
                        type="text"
                        value={formData.tariffCode}
                        onChange={(e) => handleInputChange('tariffCode', e.target.value)}
                        placeholder="996311"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Google Review URL
                      </label>
                      <input
                        type="text"
                        value={formData.googleReviewUrl}
                        onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)}
                        placeholder="https://g.page/r/..."
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt Settings */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🧾 Receipt Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Store Logo URL
                      </label>
                      <input
                        type="text"
                        value={formData.storeLogo}
                        onChange={(e) => handleInputChange('storeLogo', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Receipt Footer
                      </label>
                      <input
                        type="text"
                        value={formData.receiptFooter}
                        onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                        placeholder="Thank you for your order!"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Receipt Font Size
                      </label>
                      <select
                        value={formData.receiptFontSize}
                        onChange={(e) => handleInputChange('receiptFontSize', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="10">10px (Small)</option>
                        <option value="12">12px (Medium)</option>
                        <option value="14">14px (Large)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.autoPrintReceipt}
                          onChange={(e) => handleInputChange('autoPrintReceipt', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Auto-print Receipt
                      </label>
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    👁️ Display Options
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showLogoOnReceipt}
                        onChange={(e) => handleInputChange('showLogoOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Store Logo
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showGstOnReceipt}
                        onChange={(e) => handleInputChange('showGstOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show GST on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showTableOnReceipt}
                        onChange={(e) => handleInputChange('showTableOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Table on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showCustomerOnReceipt}
                        onChange={(e) => handleInputChange('showCustomerOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Customer on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showCashierOnReceipt}
                        onChange={(e) => handleInputChange('showCashierOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Cashier/Staff on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showEmailOnReceipt}
                        onChange={(e) => handleInputChange('showEmailOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Email on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showPaymentDetailsOnReceipt}
                        onChange={(e) => handleInputChange('showPaymentDetailsOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Payment Details on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.showBillIdOnReceipt}
                        onChange={(e) => handleInputChange('showBillIdOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Bill ID on Receipt
                    </label>
                  </div>
                </div>
              </div>
            )}


            {activeSection === 'pos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* POS Mode */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🛒 POS Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        POS Mode
                      </label>
                      <select
                        value={formData.posMode}
                        onChange={(e) => handleInputChange('posMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="basic">Basic</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Order Requirements */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    📋 Order Requirements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.requireCustomer}
                        onChange={(e) => handleInputChange('requireCustomer', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require customer selection for orders
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.requireTable}
                        onChange={(e) => handleInputChange('requireTable', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require table selection for orders
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.allowWalkIn}
                        onChange={(e) => handleInputChange('allowWalkIn', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Allow walk-in orders (no customer/table)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.requirePaymentBeforeKOT}
                        onChange={(e) => handleInputChange('requirePaymentBeforeKOT', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require payment before sending to kitchen
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.autoCreateKOT}
                        onChange={(e) => handleInputChange('autoCreateKOT', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Auto-create KOT on order completion
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.autoAssignTables}
                        onChange={(e) => handleInputChange('autoAssignTables', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Auto-assign available tables
                    </label>
                  </div>
                </div>

                {/* Payment Settings */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    💳 Payment Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Brevo API Key (for email receipts)
                      </label>
                      <input
                        type="password"
                        value={formData.brevoApiKey}
                        onChange={(e) => handleInputChange('brevoApiKey', e.target.value)}
                        placeholder="Enter your Brevo API key"
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                        Used for sending email receipts to customers
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Allowed Payment Methods
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['CASH', 'CARD', 'UPI', 'NETBANKING', 'WALLET'].map(method => (
                          <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: '#374151', padding: '6px 10px', background: '#ffffff', border: formData.allowedPaymentMethods?.includes(method) ? '2px solid #8b5cf6' : '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.allowedPaymentMethods?.includes(method)}
                              onChange={(e) => {
                                const newMethods = e.target.checked
                                  ? [...(formData.allowedPaymentMethods || []), method]
                                  : formData.allowedPaymentMethods.filter(m => m !== method);
                                handleInputChange('allowedPaymentMethods', newMethods);
                              }}
                              style={{ width: '14px', height: '14px' }}
                            />
                            {method}
                          </label>
                        ))}
                      </div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableSplitPayment}
                        onChange={(e) => handleInputChange('enableSplitPayment', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable split payments
                    </label>
                    {formData.enableSplitPayment && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Maximum split payments per order
                        </label>
                        <input
                          type="number"
                          min="2"
                          max="10"
                          value={formData.maxSplitPayments}
                          onChange={(e) => handleInputChange('maxSplitPayments', parseInt(e.target.value))}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Discount Settings */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🏷️ Discount Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableDiscount}
                        onChange={(e) => handleInputChange('enableDiscount', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable discounts on orders
                    </label>
                    {formData.enableDiscount && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                            Maximum discount percentage (%)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.maxDiscountPercent}
                            onChange={(e) => handleInputChange('maxDiscountPercent', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={formData.requireManagerForHighDiscount}
                            onChange={(e) => handleInputChange('requireManagerForHighDiscount', e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Require manager approval for high discounts
                        </label>
                        {formData.requireManagerForHighDiscount && (
                          <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                              High discount threshold (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={formData.maxDiscountPercent}
                              value={formData.highDiscountThreshold}
                              onChange={(e) => handleInputChange('highDiscountThreshold', parseInt(e.target.value))}
                              style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                            />
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              Discounts above this percentage require manager approval
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Custom Orders */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    ✏️ Custom Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableCustomOrders}
                        onChange={(e) => handleInputChange('enableCustomOrders', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable custom orders (items not in menu)
                    </label>
                    {formData.enableCustomOrders && (
                      <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={formData.requireApprovalForCustomOrders}
                            onChange={(e) => handleInputChange('requireApprovalForCustomOrders', e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Require manager approval for custom orders
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                          <input
                            type="checkbox"
                            checked={formData.requireNotesForCustomOrders}
                            onChange={(e) => handleInputChange('requireNotesForCustomOrders', e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Require notes for custom orders
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Void Settings */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    ❌ Void Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableVoid}
                        onChange={(e) => handleInputChange('enableVoid', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable void orders
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.requireManagerForVoid}
                        onChange={(e) => handleInputChange('requireManagerForVoid', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require manager approval for void orders
                    </label>
                  </div>
                </div>

                {/* Order Notes */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    📝 Order Notes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableOrderNotes}
                        onChange={(e) => handleInputChange('enableOrderNotes', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable order notes
                    </label>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Allow staff to add special instructions to orders
                    </div>
                  </div>
                </div>

                {/* Hold Orders */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    ⏸️ Hold Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableHoldOrders}
                        onChange={(e) => handleInputChange('enableHoldOrders', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable hold orders feature
                    </label>
                    {formData.enableHoldOrders && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                            Maximum hold orders
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={formData.maxHoldOrders}
                            onChange={(e) => handleInputChange('maxHoldOrders', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                            Hold order timeout (minutes)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="120"
                            value={formData.holdOrderTimeout}
                            onChange={(e) => handleInputChange('holdOrderTimeout', parseInt(e.target.value))}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                            Orders held longer than this will be automatically released
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* KOT Settings */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🎫 KOT (Kitchen Order Ticket)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.autoPrintKOT}
                        onChange={(e) => handleInputChange('autoPrintKOT', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Auto-print KOT when order is sent to kitchen
                    </label>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        KOT Print Stations
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['kitchen', 'bar', 'bakery', 'grill', 'beverage'].map(station => (
                          <label key={station} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: '#374151', padding: '6px 10px', background: '#ffffff', border: formData.kotPrintStations?.includes(station) ? '2px solid #8b5cf6' : '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.kotPrintStations?.includes(station)}
                              onChange={(e) => {
                                const newStations = e.target.checked
                                  ? [...(formData.kotPrintStations || []), station]
                                  : formData.kotPrintStations.filter(s => s !== station);
                                handleInputChange('kotPrintStations', newStations);
                              }}
                              style={{ width: '14px', height: '14px' }}
                            />
                            {station.charAt(0).toUpperCase() + station.slice(1)}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token System */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🎫 Token System
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      <input
                        type="checkbox"
                        checked={formData.enableTokenSystem}
                        onChange={(e) => handleInputChange('enableTokenSystem', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable token system for order tracking
                    </label>
                    {formData.enableTokenSystem && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                          Token Prefix
                        </label>
                        <input
                          type="text"
                          maxLength="3"
                          value={formData.tokenPrefix}
                          onChange={(e) => handleInputChange('tokenPrefix', e.target.value.toUpperCase())}
                          placeholder="T"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            textTransform: 'uppercase'
                          }}
                        />
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                          Example: T001, T002, etc.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Configuration */}
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🔄 Workflow Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Order Workflow Steps
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['items', 'customer', 'table', 'payment', 'review'].map(step => (
                          <label key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: '#374151', padding: '6px 10px', background: '#ffffff', border: formData.workflowSteps?.includes(step) ? '2px solid #8b5cf6' : '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={formData.workflowSteps?.includes(step)}
                              onChange={(e) => {
                                const newSteps = e.target.checked
                                  ? [...(formData.workflowSteps || []), step]
                                  : formData.workflowSteps.filter(s => s !== step);
                                handleInputChange('workflowSteps', newSteps);
                              }}
                              style={{ width: '14px', height: '14px' }}
                            />
                            {step.charAt(0).toUpperCase() + step.slice(1)}
                          </label>
                        ))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        Define the order of steps in the order creation workflow
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'itemcodes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🔢 Item Code Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Code Type
                      </label>
                      <select
                        value={formData.codeType}
                        onChange={(e) => handleInputChange('codeType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: '#ffffff',
                          outline: 'none'
                        }}
                      >
                        <option value="alphanumeric">Alphanumeric (A1, B2...)</option>
                        <option value="numeric">Numeric (101, 102...)</option>
                        <option value="alphabetic">Alphabetic (AA, AB...)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'kitchen' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    👨‍🍳 Kitchen Display
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.kitchenDisplayEnabled}
                          onChange={(e) => handleInputChange('kitchenDisplayEnabled', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Enable Kitchen Display
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    📱 QR Ordering
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.qrOrderingEnabled}
                          onChange={(e) => handleInputChange('qrOrderingEnabled', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Enable QR Ordering
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🔔 Notifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.enableNotifications}
                          onChange={(e) => handleInputChange('enableNotifications', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Enable Notifications
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🖥️ Display Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        <input
                          type="checkbox"
                          checked={formData.lowStockAlert}
                          onChange={(e) => handleInputChange('lowStockAlert', e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        Low Stock Alerts
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    💾 Backup & Restore
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <button
                        onClick={handleBackup}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#111827',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Download Backup
                      </button>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                        Restore Backup
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'debug' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    🐛 Debug Information
                  </div>
                  <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                    <div><strong>Browser:</strong> {navigator.userAgent}</div>
                    <div><strong>Platform:</strong> {navigator.platform}</div>
                    <div><strong>Language:</strong> {navigator.language}</div>
                    <div><strong>Screen:</strong> {window.screen.width}x{window.screen.height}</div>
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

