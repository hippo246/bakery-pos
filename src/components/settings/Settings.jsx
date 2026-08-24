import React, { useState, useEffect } from 'react';
import { KitchenStation } from '../../domain/kotTypes.js';
import useScreenSize from '../../hooks/useScreenSize';

export default function SimpleSettings({ settings = {}, setSettings, onNavigate, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, orders = [], setOrders, staff = [], setStaff, tables = [], setTables, darkMode = true }) {
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
    qrRestaurantName: settings.qrRestaurantName || settings.storeName || '',
    qrWelcomeMessage: settings.qrWelcomeMessage || 'Welcome! Scan to order from your table.',
    qrGstRate: settings.qrGstRate ?? 18,
    qrSplitGst: settings.qrSplitGst !== false,
    qrAllowSpecialRequests: settings.qrAllowSpecialRequests !== false,
    qrAutoAcceptOrders: settings.qrAutoAcceptOrders !== false,
    qrShowItemDescriptions: settings.qrShowItemDescriptions !== false,
    qrShowCategoryFilter: settings.qrShowCategoryFilter !== false,
    qrShowSearch: settings.qrShowSearch !== false,
    qrAllowCallWaiter: settings.qrAllowCallWaiter !== false,
    qrPrimaryColor: settings.qrPrimaryColor || '#111827',
    qrAccentColor: settings.qrAccentColor || '#10b981',
    qrOrderingUrl: settings.qrOrderingUrl || (typeof window !== 'undefined' ? window.location.origin + '/qr-ordering.html' : '/qr-ordering.html'),
    // QR Receipt controls
    qrReceiptFooter: settings.qrReceiptFooter || '',
    qrShowReceiptOnOrder: settings.qrShowReceiptOnOrder !== false,
    qrReceiptShowFssai: settings.qrReceiptShowFssai !== false,
    qrReceiptShowTariff: settings.qrReceiptShowTariff !== false,
    qrReceiptShowReviewQr: settings.qrReceiptShowReviewQr !== false,
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
    // Per-tab dark mode settings
    tabDarkModes: settings.tabDarkModes || {
      orders: false,
      dashboard: false,
      reports: false,
      crm: false,
      staff: false,
      menu: false,
      inventory: false,
      recipes: false,
      waste: false,
      reservations: false,
      tokens: false,
      tables: false,
      waiters: false,
      settings: false
    },
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

    // Sync QR settings to localStorage so the HTML ordering page can read them
    try {
      const qrConfig = {
        enabled: formData.qrOrderingEnabled,
        restaurantName: formData.qrRestaurantName || formData.storeName,
        welcomeMessage: formData.qrWelcomeMessage,
        gstRate: Number(formData.qrGstRate) || 18,
        splitGst: formData.qrSplitGst,
        allowSpecialRequests: formData.qrAllowSpecialRequests,
        autoAcceptOrders: formData.qrAutoAcceptOrders,
        showItemDescriptions: formData.qrShowItemDescriptions,
        showCategoryFilter: formData.qrShowCategoryFilter,
        showSearch: formData.qrShowSearch,
        allowCallWaiter: formData.qrAllowCallWaiter,
        primaryColor: formData.qrPrimaryColor,
        accentColor: formData.qrAccentColor,
        googleReviewUrl: formData.googleReviewUrl || '',
        storeName: formData.storeName,
        storeAddress: formData.storeAddress,
        // Receipt controls
        receiptFooter: formData.qrReceiptFooter || formData.receiptFooter || '',
        showReceiptOnOrder: formData.qrShowReceiptOnOrder,
        receiptShowFssai: formData.qrReceiptShowFssai,
        receiptShowTariff: formData.qrReceiptShowTariff,
        receiptShowReviewQr: formData.qrReceiptShowReviewQr,
        // Pass through licence/compliance fields
        gstin: formData.gstin,
        fssaiLicense: formData.fssaiLicense,
        tariffCode: formData.tariffCode,
        phone: formData.phone,
      };
      localStorage.setItem('qr_settings', JSON.stringify(qrConfig));
    } catch (e) { console.error('Failed to sync QR settings', e); }

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
      // QR Receipt controls
      qrReceiptFooter: settings.qrReceiptFooter || '',
      qrShowReceiptOnOrder: settings.qrShowReceiptOnOrder !== false,
      qrReceiptShowFssai: settings.qrReceiptShowFssai !== false,
      qrReceiptShowTariff: settings.qrReceiptShowTariff !== false,
      qrReceiptShowReviewQr: settings.qrReceiptShowReviewQr !== false,
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
        { id: 'themes', label: 'Themes', icon: '🎨' },
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
      background: '#ffffff',
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

  // Theme colors
  const t = {
    bg:       darkMode ? '#1a1a2e' : '#f8fafc',
    bgEle:    darkMode ? '#1f1f35' : '#ffffff',
    bgCard:   darkMode ? '#252538' : '#ffffff',
    bgInput:  darkMode ? '#1a1a2e' : '#f1f5f9',
    border:   darkMode ? '#2d2d44' : '#e2e8f0',
    text:     darkMode ? '#ffffff' : '#111827',
    textSub:  darkMode ? '#e0e0e0' : '#374151',
    textMute: darkMode ? '#8b8b9e' : '#6b7280',
    accent:   '#6366f1',
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: t.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: screenSize === 'small' ? 'column' : 'row' }}>
        {/* Sidebar */}
        <div style={{
          width: screenSize === 'small' ? '100%' : '280px',
          background: t.bgInput,
          borderRight: `1px solid ${t.border}`,
          borderBottom: `1px solid ${t.border}`,
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
                      color: activeSection === section.id ? '#111827' : '#8b8b9e',
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
        <div style={{ flex: 1, padding: screenSize === 'small' ? '16px' : '24px', overflow: 'auto', background: t.bgEle }}>
          <div style={{
            background: t.bgInput,
            borderRadius: '12px',
            padding: screenSize === 'small' ? '16px' : '24px',
            maxWidth: activeSection === 'qr' ? '1100px' : '700px',
            border: `1px solid ${t.border}`,
            transition: 'max-width 0.2s ease-in-out'
          }}>
            <div style={{ margin: '0 0 20px', fontSize: screenSize === 'small' ? '16px' : '18px', fontWeight: '600', color: t.text, paddingBottom: screenSize === 'small' ? '12px' : '16px', borderBottom: `1px solid ${t.border}` }}>
              {sections.flatMap(g => g.items).find(s => s.id === activeSection)?.label}
            </div>

            {activeSection === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🌍 Regional Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: t.bgInput,
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
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: t.bgInput,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🎨 Appearance
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                      Theme
                    </label>
                    <select
                      value={formData.theme}
                      onChange={(e) => handleInputChange('theme', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: `1px solid ${t.border}`,
                        borderRadius: '6px',
                        fontSize: '14px',
                        background: t.bgInput,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🏪 Store Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                            border: `1px solid ${t.border}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                            border: `1px solid ${t.border}`,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    💰 Tax Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    📋 Legal Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🧾 Receipt Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Receipt Font Size
                      </label>
                      <select
                        value={formData.receiptFontSize}
                        onChange={(e) => handleInputChange('receiptFontSize', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: t.bgInput,
                          outline: 'none'
                        }}
                      >
                        <option value="10">10px (Small)</option>
                        <option value="12">12px (Medium)</option>
                        <option value="14">14px (Large)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    👁️ Display Options
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showLogoOnReceipt}
                        onChange={(e) => handleInputChange('showLogoOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Store Logo
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showGstOnReceipt}
                        onChange={(e) => handleInputChange('showGstOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show GST on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showTableOnReceipt}
                        onChange={(e) => handleInputChange('showTableOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Table on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showCustomerOnReceipt}
                        onChange={(e) => handleInputChange('showCustomerOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Customer on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showCashierOnReceipt}
                        onChange={(e) => handleInputChange('showCashierOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Cashier/Staff on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showEmailOnReceipt}
                        onChange={(e) => handleInputChange('showEmailOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Email on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.showPaymentDetailsOnReceipt}
                        onChange={(e) => handleInputChange('showPaymentDetailsOnReceipt', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Show Payment Details on Receipt
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🛒 POS Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        POS Mode
                      </label>
                      <select
                        value={formData.posMode}
                        onChange={(e) => handleInputChange('posMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: t.bgInput,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    📋 Order Requirements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.requireCustomer}
                        onChange={(e) => handleInputChange('requireCustomer', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require customer selection for orders
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.requireTable}
                        onChange={(e) => handleInputChange('requireTable', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require table selection for orders
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.allowWalkIn}
                        onChange={(e) => handleInputChange('allowWalkIn', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Allow walk-in orders (no customer/table)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.requirePaymentBeforeKOT}
                        onChange={(e) => handleInputChange('requirePaymentBeforeKOT', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Require payment before sending to kitchen
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.autoCreateKOT}
                        onChange={(e) => handleInputChange('autoCreateKOT', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Auto-create KOT on order completion
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    💳 Payment Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px' }}>
                        Used for sending email receipts to customers
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Allowed Payment Methods
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['CASH', 'CARD', 'UPI', 'NETBANKING', 'WALLET'].map(method => (
                          <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: t.textSub, padding: '6px 10px', background: t.bgInput, border: formData.allowedPaymentMethods?.includes(method) ? '2px solid #8b5cf6' : '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                            border: `1px solid ${t.border}`,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🏷️ Discount Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                              border: `1px solid ${t.border}`,
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                                border: `1px solid ${t.border}`,
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none'
                              }}
                            />
                            <div style={{ fontSize: '12px', color: t.textMute, marginTop: '4px' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    ✏️ Custom Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                          <input
                            type="checkbox"
                            checked={formData.requireApprovalForCustomOrders}
                            onChange={(e) => handleInputChange('requireApprovalForCustomOrders', e.target.checked)}
                            style={{ width: '16px', height: '16px' }}
                          />
                          Require manager approval for custom orders
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    ❌ Void Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.enableVoid}
                        onChange={(e) => handleInputChange('enableVoid', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable void orders
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    📝 Order Notes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.enableOrderNotes}
                        onChange={(e) => handleInputChange('enableOrderNotes', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Enable order notes
                    </label>
                    <div style={{ fontSize: '12px', color: t.textMute }}>
                      Allow staff to add special instructions to orders
                    </div>
                  </div>
                </div>

                {/* Hold Orders */}
                <div style={{
                  padding: '16px',
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    ⏸️ Hold Orders
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                              border: `1px solid ${t.border}`,
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                              border: `1px solid ${t.border}`,
                              borderRadius: '6px',
                              fontSize: '14px',
                              outline: 'none'
                            }}
                          />
                          <div style={{ fontSize: '12px', color: t.textMute, marginTop: '4px' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🎫 KOT (Kitchen Order Ticket)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
                      <input
                        type="checkbox"
                        checked={formData.autoPrintKOT}
                        onChange={(e) => handleInputChange('autoPrintKOT', e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      Auto-print KOT when order is sent to kitchen
                    </label>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        KOT Print Stations
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['kitchen', 'bar', 'bakery', 'grill', 'beverage'].map(station => (
                          <label key={station} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: t.textSub, padding: '6px 10px', background: t.bgInput, border: formData.kotPrintStations?.includes(station) ? '2px solid #8b5cf6' : '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🎫 Token System
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub }}>
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
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                            border: `1px solid ${t.border}`,
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            textTransform: 'uppercase'
                          }}
                        />
                        <div style={{ fontSize: '12px', color: t.textMute, marginTop: '4px' }}>
                          Example: T001, T002, etc.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Configuration */}
                <div style={{
                  padding: '16px',
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🔄 Workflow Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Order Workflow Steps
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {['items', 'customer', 'table', 'payment', 'review'].map(step => (
                          <label key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: t.textSub, padding: '6px 10px', background: t.bgInput, border: formData.workflowSteps?.includes(step) ? '2px solid #8b5cf6' : '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
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
                      <div style={{ fontSize: '12px', color: t.textMute, marginTop: '4px' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🔢 Item Code Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Code Type
                      </label>
                      <select
                        value={formData.codeType}
                        onChange={(e) => handleInputChange('codeType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${t.border}`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: t.bgInput,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    👨‍🍳 Kitchen Display
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
              <div style={{ display: 'flex', flexDirection: screenSize === 'small' ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* Left Column: Form Controls */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Status Banner */}
                  <div style={{
                    padding: '16px 20px',
                    background: formData.qrOrderingEnabled
                      ? 'linear-gradient(135deg, #10b98122, #05966933)'
                      : 'linear-gradient(135deg, #ef444422, #dc262633)',
                    borderRadius: '12px',
                    border: `1px solid ${formData.qrOrderingEnabled ? '#10b98188' : '#ef444488'}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: formData.qrOrderingEnabled ? '#10b981' : '#ef4444' }}>
                        {formData.qrOrderingEnabled ? '✅ QR Ordering is ENABLED' : '🚫 QR Ordering is DISABLED'}
                      </div>
                      <div style={{ fontSize: '12px', color: t.textMute, marginTop: '3px' }}>
                        {formData.qrOrderingEnabled
                          ? 'Customers can scan table QR codes to place orders'
                          : 'The QR ordering page will show a disabled notice'}
                      </div>
                    </div>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        onClick={() => handleInputChange('qrOrderingEnabled', !formData.qrOrderingEnabled)}
                        style={{
                          width: '48px', height: '26px',
                          background: formData.qrOrderingEnabled ? '#10b981' : '#2d2d48',
                          borderRadius: '13px', position: 'relative', cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: formData.qrOrderingEnabled ? '25px' : '3px',
                          width: '20px', height: '20px',
                          background: t.bgInput, borderRadius: '50%',
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </label>
                  </div>

                  {/* Quick Preview Link */}
                  <div style={{ padding: '14px 18px', background: t.bgEle, borderRadius: '10px', border: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>🔗 Ordering Page URL</div>
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '3px', fontFamily: 'monospace' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/qr-ordering.html?table=...</div>
                    </div>
                    <button
                      onClick={() => window.open('/qr-ordering.html?table=' + encodeURIComponent(JSON.stringify({ tableId: 1, tableName: 'T1' })), '_blank')}
                      style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Open Live App 📱
                    </button>
                  </div>

                  {/* Branding & Content */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🏪 Branding</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Restaurant Name</label>
                        <input
                          value={formData.qrRestaurantName}
                          onChange={e => handleInputChange('qrRestaurantName', e.target.value)}
                          placeholder={formData.storeName || 'Your Restaurant'}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>GST Rate (%)</label>
                        <select
                          value={formData.qrGstRate}
                          onChange={e => handleInputChange('qrGstRate', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5% GST</option>
                          <option value={12}>12% GST</option>
                          <option value={18}>18% GST</option>
                          <option value={28}>28% GST</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ marginTop: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Welcome Message</label>
                      <textarea
                        value={formData.qrWelcomeMessage}
                        onChange={e => handleInputChange('qrWelcomeMessage', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Header Theme Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={formData.qrPrimaryColor} onChange={e => handleInputChange('qrPrimaryColor', e.target.value)} style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '12px', color: t.textMute, fontFamily: 'monospace' }}>{formData.qrPrimaryColor}</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Accent Button Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={formData.qrAccentColor} onChange={e => handleInputChange('qrAccentColor', e.target.value)} style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer' }} />
                          <span style={{ fontSize: '12px', color: t.textMute, fontFamily: 'monospace' }}>{formData.qrAccentColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>⚙️ Feature Toggles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { key: 'qrSplitGst', label: 'Show CGST + SGST split', desc: 'Breaks tax down into central + state components' },
                        { key: 'qrAllowSpecialRequests', label: 'Special Requests field', desc: 'Add a customized notes textbox inside checkout' },
                        { key: 'qrAutoAcceptOrders', label: 'Auto-accept orders', desc: 'Skip server confirmation checks' },
                        { key: 'qrShowItemDescriptions', label: 'Show item descriptions', desc: 'Display descriptive text under food cards' },
                        { key: 'qrShowCategoryFilter', label: 'Category filter bar', desc: 'Show horizontal category navigation tags' },
                        { key: 'qrShowSearch', label: 'Search bar', desc: 'Let customers search specific bakery items' },
                        { key: 'qrAllowCallWaiter', label: 'Call Waiter button', desc: 'Place a digital request button inside table header' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{
                              width: '40px', height: '22px', flexShrink: 0,
                              background: formData[key] ? '#10b981' : '#2d2d48',
                              borderRadius: '11px', position: 'relative', cursor: 'pointer',
                              transition: 'background 0.2s', marginLeft: '12px'
                            }}
                          >
                            <div style={{
                              position: 'absolute', top: '3px',
                              left: formData[key] ? '21px' : '3px',
                              width: '16px', height: '16px',
                              background: t.bgInput, borderRadius: '50%',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receipt Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🧾 Receipt Options</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Show receipt after order</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Display thermal receipt preview on success screen</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrShowReceiptOnOrder', !formData.qrShowReceiptOnOrder)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrShowReceiptOnOrder ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrShowReceiptOnOrder ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {[
                        { key: 'qrReceiptShowFssai',    label: 'Show FSSAI details',   desc: 'Print official FSSAI licensing number' },
                        { key: 'qrReceiptShowTariff',   label: 'Show Tariff / HSN',   desc: 'Print item taxation codes' },
                        { key: 'qrReceiptShowReviewQr', label: 'Google Review QR Code',    desc: 'Generate review links' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '10px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '36px', height: '20px', flexShrink: 0, background: formData[key] ? '#10b981' : '#2d2d48', borderRadius: '10px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '10px' }}
                          >
                            <div style={{ position: 'absolute', top: '2px', left: formData[key] ? '18px' : '2px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Receipt Footer message</label>
                      <textarea
                        value={formData.qrReceiptFooter}
                        onChange={e => handleInputChange('qrReceiptFooter', e.target.value)}
                        placeholder={formData.receiptFooter || 'Thank you for your order!'}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', resize: 'none', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Smart Phone Mockup */}
                {!screenSize.includes('small') && (
                  <div style={{
                    width: '320px',
                    position: 'sticky',
                    top: '24px',
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: t.textMute, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      📱 Live Customer App Preview
                    </div>
                    
                    {/* CSS Smartphone chassis */}
                    <div style={{
                      width: '300px',
                      height: '580px',
                      background: '#000000',
                      borderRadius: '36px',
                      border: '12px solid #000000',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 3px #2d2d44',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative'
                    }}>
                      
                      {/* Notch / Dynamic Island */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90px',
                        height: '18px',
                        background: '#000000',
                        borderRadius: '10px',
                        zIndex: 99
                      }} />

                      {/* Phone Screen Container */}
                      <div style={{
                        flex: 1,
                        background: '#121214',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                        color: t.text,
                        overflow: 'hidden'
                      }}>
                        
                        {/* Mock App Header */}
                        <div style={{
                          background: formData.qrPrimaryColor || '#1f1f35',
                          padding: '24px 12px 14px',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          textAlign: 'center',
                          position: 'relative'
                        }}>
                          <div style={{ fontSize: '13px', fontWeight: '700' }}>
                            {formData.qrRestaurantName || 'BakeryPOS Café'}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                            Table 05
                          </div>
                          {formData.qrAllowCallWaiter && (
                            <button style={{
                              position: 'absolute',
                              right: '8px',
                              top: '24px',
                              background: '#ef4444',
                              color: t.text,
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '8px',
                              padding: '2px 4px',
                              fontWeight: '600'
                            }}>
                              🔔 Waiter
                            </button>
                          )}
                        </div>

                        {/* Welcome Banner */}
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '10px', color: '#cbd5e1', margin: 0 }}>
                            {formData.qrWelcomeMessage || 'Welcome! Scan to order.'}
                          </p>
                        </div>

                        {/* Category filter bar */}
                        {formData.qrShowCategoryFilter && (
                          <div style={{ display: 'flex', gap: '6px', padding: '8px 10px', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            {['All', 'Beverages', 'Pastries', 'Dessert'].map((cat, idx) => (
                              <span key={idx} style={{
                                fontSize: '9px',
                                padding: '3px 8px',
                                background: idx === 0 ? (formData.qrAccentColor || '#10b981') : 'rgba(255,255,255,0.05)',
                                color: idx === 0 ? '#ffffff' : '#94a3b8',
                                borderRadius: '10px',
                                whiteSpace: 'nowrap'
                              }}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Search Bar */}
                        {formData.qrShowSearch && (
                          <div style={{ padding: '8px 10px' }}>
                            <div style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              fontSize: '9px',
                              color: '#94a3b8'
                            }}>
                              🔍 Search menu...
                            </div>
                          </div>
                        )}

                        {/* Menu Item list mock */}
                        <div style={{ flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            { name: 'Signature Chocolate Croissant', price: 180, desc: 'Fresh butter croissant baked with premium dark chocolate rods.', icon: '🥐' },
                            { name: 'Blueberry Danish Roll', price: 220, desc: 'Sweet danish topped with wild blueberries & cream cheese.', icon: '🫐' }
                          ].map((item, idx) => (
                            <div key={idx} style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              borderRadius: '8px',
                              padding: '8px',
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: '20px' }}>{item.icon}</span>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', fontWeight: '700' }}>{item.name}</div>
                                {formData.qrShowItemDescriptions && (
                                  <div style={{ fontSize: '8px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.2' }}>{item.desc}</div>
                                )}
                                <div style={{ fontSize: '9px', fontWeight: '700', marginTop: '4px', color: formData.qrAccentColor || '#10b981' }}>
                                  ₹{item.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Mock Checkout button */}
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                          <button style={{
                            width: '100%',
                            padding: '10px',
                            background: formData.qrAccentColor || '#10b981',
                            color: t.text,
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}>
                            🛒 View Basket (₹0)
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {activeSection === 'themes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Global Toggle */}
                <div style={{
                  background: 'linear-gradient(135deg, #1f1f35 0%, #252538 100%)',
                  borderRadius: '16px',
                  border: `1px solid ${t.border}`,
                  padding: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: t.text, marginBottom: '6px' }}>
                      🌗 Global Theme
                    </div>
                    <div style={{ fontSize: '13px', color: t.textMute, lineHeight: '1.5' }}>
                      Set all tabs to dark or light mode at once. You can override individual tabs below.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        const allDark = {};
                        Object.keys(formData.tabDarkModes).forEach(t => { allDark[t] = true; });
                        handleInputChange('tabDarkModes', allDark);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: Object.values(formData.tabDarkModes).every(Boolean) ? '#6366f1' : '#1a1a2e',
                        color: t.text,
                        border: `1px solid ${Object.values(formData.tabDarkModes).every(Boolean) ? '#6366f1' : '#2d2d44'}`,
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🌙 All Dark
                    </button>
                    <button
                      onClick={() => {
                        const allLight = {};
                        Object.keys(formData.tabDarkModes).forEach(t => { allLight[t] = false; });
                        handleInputChange('tabDarkModes', allLight);
                      }}
                      style={{
                        padding: '10px 20px',
                        background: Object.values(formData.tabDarkModes).every(v => !v) ? '#f59e0b' : '#1a1a2e',
                        color: t.text,
                        border: `1px solid ${Object.values(formData.tabDarkModes).every(v => !v) ? '#f59e0b' : '#2d2d44'}`,
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      ☀️ All Light
                    </button>
                  </div>
                </div>

                {/* Per-Tab Toggle Switches */}
                <div style={{
                  background: t.bgEle,
                  borderRadius: '16px',
                  border: `1px solid ${t.border}`,
                  padding: '24px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '6px' }}>
                    🎛️ Per-Tab Theme Control
                  </div>
                  <div style={{ fontSize: '12px', color: t.textMute, marginBottom: '20px' }}>
                    Toggle each tab individually — Kitchen is always dark.
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {(() => {
                      const tabMeta = {
                        orders:    { icon: '🛒', label: 'Orders (POS)' },
                        dashboard: { icon: '📊', label: 'Dashboard' },
                        reports:   { icon: '📈', label: 'Reports' },
                        crm:       { icon: '👥', label: 'Customers (CRM)' },
                        staff:     { icon: '🧑‍💼', label: 'Staff' },
                        menu:      { icon: '🍽️', label: 'Menu' },
                        inventory: { icon: '📦', label: 'Inventory' },
                        recipes:   { icon: '📖', label: 'Recipes' },
                        waste:     { icon: '♻️', label: 'Waste' },
                        reservations: { icon: '📅', label: 'Reservations' },
                        tokens:    { icon: '🎫', label: 'Tokens' },
                        tables:    { icon: '🪑', label: 'Tables' },
                        waiters:   { icon: '🤵', label: 'Waiters' },
                        settings:  { icon: '⚙️', label: 'Settings' },
                      };
                      return Object.keys(formData.tabDarkModes).map(tab => {
                        const meta = tabMeta[tab] || { icon: '🔲', label: tab };
                        const isDark = formData.tabDarkModes[tab];
                        return (
                          <div key={tab} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '14px 16px',
                            background: t.bgInput,
                            borderRadius: '12px',
                            border: `1px solid ${isDark ? '#6366f1' : '#2d2d44'}`,
                            transition: 'border-color 0.2s'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '18px' }}>{meta.icon}</span>
                              <span style={{ fontSize: '13px', fontWeight: '500', color: isDark ? '#c4b5fd' : '#e0e0e0' }}>
                                {meta.label}
                              </span>
                            </div>
                            {/* Toggle switch */}
                            <div
                              onClick={() => handleInputChange('tabDarkModes', {
                                ...formData.tabDarkModes,
                                [tab]: !isDark
                              })}
                              style={{
                                width: '44px',
                                height: '24px',
                                borderRadius: '12px',
                                background: isDark ? '#6366f1' : '#374151',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.25s',
                                flexShrink: 0
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: '3px',
                                left: isDark ? '23px' : '3px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#ffffff',
                                transition: 'left 0.25s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.4)'
                              }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Info card */}
                <div style={{
                  background: 'linear-gradient(135deg, #1e3a5f 0%, #1e3050 100%)',
                  borderRadius: '12px',
                  border: '1px solid #2563eb40',
                  padding: '18px 20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#93c5fd', marginBottom: '4px' }}>
                      Pro Tip
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                      Use <strong style={{ color: '#c4b5fd' }}>dark mode</strong> for Reports, Staff, and Waiters to reduce eye strain during extended sessions. Use <strong style={{ color: '#fbbf24' }}>light mode</strong> for Dashboard and CRM in bright-lit environments.
                    </div>
                  </div>
                </div>

              </div>
            )}

            {activeSection === 'notifications' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  padding: '16px',
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🔔 Notifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🖥️ Display Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
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
                          color: t.text,
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
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: t.textSub, marginBottom: '6px' }}>
                        Restore Backup
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${t.border}`,
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
                  background: t.bgEle,
                  borderRadius: '8px',
                  border: `1px solid ${t.border}`
                }}>
                  <div style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                    🐛 Debug Information
                  </div>
                  <div style={{ fontSize: '13px', color: t.textSub, lineHeight: '1.8' }}>
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

