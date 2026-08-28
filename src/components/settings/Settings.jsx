import React, { useState, useEffect, useMemo } from 'react';
import { KitchenStation } from '../../domain/kotTypes.js';
import useScreenSize from '../../hooks/useScreenSize';

export default function SimpleSettings({ settings = {}, setSettings, onNavigate, menuItems = [], setMenuItems, inventory = [], setInventory, customers = [], setCustomers, orders = [], setOrders, staff = [], setStaff, tables = [], setTables, darkMode = true }) {
  const [activeSection, setActiveSection] = useState('general');
  const screenSize = useScreenSize();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

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
    razorpayKeyId: settings.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    razorpayKeySecret: settings.razorpayKeySecret || '',
    upiId: settings.upiId || '',
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
    // QR Payment controls
    qrEnablePaymentCash: settings.qrEnablePaymentCash !== false,
    qrEnablePaymentUPI: settings.qrEnablePaymentUPI !== false,
    qrEnablePaymentCard: settings.qrEnablePaymentCard !== false,
    // QR Tipping controls
    qrEnableTipping: settings.qrEnableTipping !== false,
    qrDefaultTipPercent: settings.qrDefaultTipPercent || 0,
    qrTipOptions: settings.qrTipOptions || [0, 5, 10, 15],
    // QR Customization controls
    qrEnableSizeOptions: settings.qrEnableSizeOptions !== false,
    qrEnableSpiceOptions: settings.qrEnableSpiceOptions !== false,
    qrEnableAddons: settings.qrEnableAddons !== false,
    qrAddonCheesePrice: settings.qrAddonCheesePrice || 15,
    qrAddonSaucePrice: settings.qrAddonSaucePrice || 10,
    qrSizeLargePrice: settings.qrSizeLargePrice || 20,
    // QR Order management
    qrEnableOrderCancel: settings.qrEnableOrderCancel !== false,
    qrEnableDarkMode: settings.qrEnableDarkMode !== false,
    qrEnableCombos: settings.qrEnableCombos !== false,
    qrEnableSplitBilling: settings.qrEnableSplitBilling !== false,
    // QR Session & Business Hours
    qrSessionTimeout: settings.qrSessionTimeout || 30, // minutes
    qrEnableBusinessHours: settings.qrEnableBusinessHours !== false,
    qrBusinessHoursStart: settings.qrBusinessHoursStart || '09:00',
    qrBusinessHoursEnd: settings.qrBusinessHoursEnd || '22:00',
    qrClosedMessage: settings.qrClosedMessage || 'We are currently closed. Please visit us during our business hours.',
    // GST & Invoice settings
    qrGstRoundingMode: settings.qrGstRoundingMode || 'standard', // 'standard', 'up', 'down', 'nearest'
    qrEnableSequentialInvoices: settings.qrEnableSequentialInvoices !== false,
    qrInvoicePrefix: settings.qrInvoicePrefix || 'INV',
    qrInvoiceStartNumber: settings.qrInvoiceStartNumber || 1,
    qrLastInvoiceNumber: settings.qrLastInvoiceNumber || 0,
    // Printer settings
    qrEnableThermalPrinter: settings.qrEnableThermalPrinter !== false,
    qrPrinterPort: settings.qrPrinterPort || '9100',
    qrPrinterPaperWidth: settings.qrPrinterPaperWidth || 80, // 58mm or 80mm
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
    allowedPaymentMethods: settings.allowedPaymentMethods || ['CASH', 'CARD', 'UPI', 'UPI_QR', 'SPLIT'],
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
    // Custom order accordion settings
    customOrderShowCategory:      settings.customOrderShowCategory !== false,
    customOrderShowNotes:         settings.customOrderShowNotes !== false,
    customOrderDefaultCategory:   settings.customOrderDefaultCategory || 'Custom',
    customOrderExtraCategories:   settings.customOrderExtraCategories || [],
    customOrderPresets: settings.customOrderPresets || [
      { name: 'Extra Sauce',      price: 10,  icon: '🥫' },
      { name: 'Extra Cheese',     price: 15,  icon: '🧀' },
      { name: 'Takeaway Box',     price: 15,  icon: '📦' },
      { name: 'Birthday Candles', price: 20,  icon: '🕯️' },
      { name: 'Special Message',  price: 25,  icon: '🖋️' },
      { name: 'Ice Cream Scoop',  price: 40,  icon: '🍨' },
    ],
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
    // Mobile & Tablet UI settings
    mobileNavPosition:  settings.mobileNavPosition  ?? 'bottom',
    mobileNavTabs:      settings.mobileNavTabs       ?? ['orders', 'dashboard', 'reports', 'crm', 'more'],
    mobileShowLabels:   settings.mobileShowLabels    ?? true,
    mobileNavStyle:     settings.mobileNavStyle      ?? 'pill',
    mobileIconSize:     settings.mobileIconSize      ?? 'md',
    tabletSidebarMode:  settings.tabletSidebarMode   ?? 'compact',
    // Receipt additional fields
    storeLogo: settings.storeLogo || '',
    cashierName: settings.cashierName || '',
    showCashierOnReceipt: settings.showCashierOnReceipt !== false,
    showEmailOnReceipt: settings.showEmailOnReceipt !== false,
    showPaymentDetailsOnReceipt: settings.showPaymentDetailsOnReceipt !== false,
    showBillIdOnReceipt: settings.showBillIdOnReceipt !== false,
    enableAutoRefund: settings.enableAutoRefund || false,
    refundTimeLimit: settings.refundTimeLimit || 24,
    // PCI DSS Compliance
    enablePciDssLogging: settings.enablePciDssLogging || false,
    enableCardTokenization: settings.enableCardTokenization !== false,
    requireCvvForSavedCards: settings.requireCvvForSavedCards || false,
    cardDataRetentionDays: settings.cardDataRetentionDays || 30,
    // GDPR Compliance
    enableGdprCompliance: settings.enableGdprCompliance !== false,
    requireDataConsent: settings.requireDataConsent || false,
    enableRightToDeletion: settings.enableRightToDeletion !== false,
    customerDataRetentionDays: settings.customerDataRetentionDays || 365,
    // Security Settings
    enableEncryption: settings.enableEncryption !== false,
    enableAuditLog: settings.enableAuditLog !== false,
    sessionTimeout: settings.sessionTimeout || 30,
    // Tab-specific settings
    orders: settings.orders || { enabled: true, autoRefresh: true, showTokens: true },
    dashboard: settings.dashboard || { enabled: true, showStats: true, showCharts: true },
    reports: settings.reports || { enabled: true, autoGenerate: false, reportTime: '23:00' },
    crm: settings.crm || { enabled: true, showLoyalty: true, allowGuestCheckout: true },
    staff: settings.staff || { enabled: true, showPerformance: true, allowSchedule: true },
    menu: settings.menu || { enabled: true, showImages: true, allowCustomItems: true },
    inventory: settings.inventory || { enabled: true, lowStockAlert: true, autoReorder: false },
    recipes: settings.recipes || { enabled: true, showCost: true, showYield: true },
    waste: settings.waste || { enabled: true, requireReason: true, trackCost: true },
    reservations: settings.reservations || { enabled: true, autoConfirm: false, maxAdvanceDays: 30 },
    tokens: settings.tokens || { enabled: false, prefix: 'T', autoReset: true },
    tables: settings.tables || { enabled: true, showCapacity: true, allowMerge: true },
    waiters: settings.waiters || { enabled: true, showAssignedOrders: true, allowCallWaiter: true },
    kitchen: settings.kitchen || { enabled: true, showTimers: true, autoPrintKOT: true },
    onlineOrdering: settings.onlineOrdering || { enabled: false, autoAccept: false, preparationTime: 30 },
    qrOrdering: settings.qrOrdering || { enabled: false, autoAccept: false, showMenuImages: true }
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
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('cafeos_kitchen_stations', JSON.stringify(stations));
      alert('Station configuration saved!');
    } catch (error) {
      console.error('Error saving station configuration:', error);
      alert('Failed to save station configuration');
    }
  };

  const loadStationConfiguration = () => {
    if (typeof window === 'undefined') return;
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
    if (typeof window !== 'undefined') {
      loadStationConfiguration();
    }
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
    if (typeof window !== 'undefined') {
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
          // Payment controls
          enablePaymentCash: formData.qrEnablePaymentCash,
          enablePaymentUPI: formData.qrEnablePaymentUPI,
          enablePaymentCard: formData.qrEnablePaymentCard,
          // Tipping controls
          enableTipping: formData.qrEnableTipping,
          defaultTipPercent: formData.qrDefaultTipPercent,
          tipOptions: formData.qrTipOptions,
          // Customization controls
          enableSizeOptions: formData.qrEnableSizeOptions,
          enableSpiceOptions: formData.qrEnableSpiceOptions,
          enableAddons: formData.qrEnableAddons,
          addonCheesePrice: formData.qrAddonCheesePrice,
          addonSaucePrice: formData.qrAddonSaucePrice,
          sizeLargePrice: formData.qrSizeLargePrice,
          // Order management
          enableOrderCancel: formData.qrEnableOrderCancel,
          enableDarkMode: formData.qrEnableDarkMode,
          enableCombos: formData.qrEnableCombos,
          enableSplitBilling: formData.qrEnableSplitBilling,
          // Session & Business Hours
          sessionTimeout: formData.qrSessionTimeout,
          enableBusinessHours: formData.qrEnableBusinessHours,
          businessHoursStart: formData.qrBusinessHoursStart,
          businessHoursEnd: formData.qrBusinessHoursEnd,
          closedMessage: formData.qrClosedMessage,
          // GST & Invoice
          gstRoundingMode: formData.qrGstRoundingMode,
          enableSequentialInvoices: formData.qrEnableSequentialInvoices,
          invoicePrefix: formData.qrInvoicePrefix,
          invoiceStartNumber: formData.qrInvoiceStartNumber,
          lastInvoiceNumber: formData.qrLastInvoiceNumber,
          // Printer
          enableThermalPrinter: formData.qrEnableThermalPrinter,
          printerPort: formData.qrPrinterPort,
          printerPaperWidth: formData.qrPrinterPaperWidth,
        };
        localStorage.setItem('qr_settings', JSON.stringify(qrConfig));
      } catch (e) { console.error('Failed to sync QR settings', e); }
    }

    setHasChanges(false);
    setAlertMessage('Settings saved successfully!');
    setAlertType('success');
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000);
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
      allowedPaymentMethods: settings.allowedPaymentMethods || ['CASH', 'CARD', 'UPI', 'UPI_QR', 'SPLIT'],
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
      showBillIdOnReceipt: settings.showBillIdOnReceipt !== false,
      enableAutoRefund: settings.enableAutoRefund || false,
      refundTimeLimit: settings.refundTimeLimit || 24,
      // PCI DSS Compliance
      enablePciDssLogging: settings.enablePciDssLogging || false,
      enableCardTokenization: settings.enableCardTokenization !== false,
      requireCvvForSavedCards: settings.requireCvvForSavedCards || false,
      cardDataRetentionDays: settings.cardDataRetentionDays || 30,
      // GDPR Compliance
      enableGdprCompliance: settings.enableGdprCompliance !== false,
      requireDataConsent: settings.requireDataConsent || false,
      enableRightToDeletion: settings.enableRightToDeletion !== false,
      customerDataRetentionDays: settings.customerDataRetentionDays || 365,
      // Security Settings
      enableEncryption: settings.enableEncryption !== false,
      enableAuditLog: settings.enableAuditLog !== false,
      sessionTimeout: settings.sessionTimeout || 30
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
      group: 'Devices',
      items: [
        { id: 'mobileui', label: 'Mobile & Tablet UI', icon: '📱' }
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
      group: 'Tabs',
      items: [
        { id: 'tab-orders', label: 'Orders', icon: '🛒' },
        { id: 'tab-dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'tab-reports', label: 'Reports', icon: '📈' },
        { id: 'tab-crm', label: 'CRM', icon: '👥' },
        { id: 'tab-staff', label: 'Staff', icon: '👨‍🍳' },
        { id: 'tab-menu', label: 'Menu', icon: '🍽️' },
        { id: 'tab-inventory', label: 'Inventory', icon: '📦' },
        { id: 'tab-recipes', label: 'Recipes', icon: '📝' },
        { id: 'tab-waste', label: 'Waste', icon: '🗑️' },
        { id: 'tab-reservations', label: 'Reservations', icon: '📅' },
        { id: 'tab-tokens', label: 'Tokens', icon: '🎫' },
        { id: 'tab-tables', label: 'Tables', icon: '🪑' },
        { id: 'tab-waiters', label: 'Waiters', icon: '🛎️' },
        { id: 'tab-kitchen', label: 'Kitchen', icon: '👨‍🍳' },
        { id: 'tab-online', label: 'Online Ordering', icon: '🌐' }
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
        { id: 'kitchen', label: 'Kitchen Ops', icon: '👨‍🍳' },
        { id: 'qr', label: 'QR Ordering', icon: '📱' }
      ]
    },
    { 
      group: 'System',
      items: [
        { id: 'backup', label: 'Backup & Restore', icon: '💾' },
        { id: 'refunds', label: 'Refunds', icon: '💸' },
        { id: 'compliance', label: 'Compliance', icon: '🔒' },
        { id: 'debug', label: 'Debug & Logs', icon: '🐛' }
      ]
    }
  ];

  const activeSectionMeta = useMemo(() => {
    for (const group of sections) {
      const found = group.items.find(item => item.id === activeSection);
      if (found) return found;
    }
    // Handle tab-specific sections
    if (activeSection.startsWith('tab-')) {
      const tabId = activeSection.replace('tab-', '');
      const tabConfig = {
        'orders': { icon: '🛒', label: 'Orders' },
        'dashboard': { icon: '📊', label: 'Dashboard' },
        'reports': { icon: '📈', label: 'Reports' },
        'crm': { icon: '👥', label: 'CRM' },
        'staff': { icon: '👨‍🍳', label: 'Staff' },
        'menu': { icon: '🍽️', label: 'Menu' },
        'inventory': { icon: '📦', label: 'Inventory' },
        'recipes': { icon: '📝', label: 'Recipes' },
        'waste': { icon: '🗑️', label: 'Waste' },
        'reservations': { icon: '📅', label: 'Reservations' },
        'tokens': { icon: '🎫', label: 'Tokens' },
        'tables': { icon: '🪑', label: 'Tables' },
        'waiters': { icon: '🛎️', label: 'Waiters' },
        'kitchen': { icon: '👨‍🍳', label: 'Kitchen' },
        'online': { icon: '🌐', label: 'Online Ordering' }
      };
      return tabConfig[tabId] || { icon: '⚙️', label: 'Settings' };
    }
    return { icon: '⚙️', label: 'Settings' };
  }, [activeSection]);

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
    bg:       darkMode ? '#1a1a2e' : '#f5f7fa',
    bgEle:    darkMode ? '#1f1f35' : '#ffffff',
    bgCard:   darkMode ? '#252538' : '#ffffff',
    bgInput:  darkMode ? '#1a1a2e' : '#f8fafc',
    border:   darkMode ? '#2d2d44' : '#d1d5db',
    text:     darkMode ? '#ffffff' : '#1f2937',
    textSub:  darkMode ? '#e0e0e0' : '#4b5563',
    textMute: darkMode ? '#8b8b9e' : '#6b7280',
    accent:   '#6366f1',
  };

  /* ─── Mobile: are we showing the list or a section detail? ─────── */
  const isMobileList = screenSize === 'small' && activeSection === '__list__';

  /* On first render on mobile, show the list, not a section */
  React.useEffect(() => {
    if (screenSize === 'small' && activeSection !== '__list__' && !_mobileEnteredSection.current) {
      // keep whatever section was saved; user navigated here intentionally
    }
  }, [screenSize]); // eslint-disable-line

  const _mobileEnteredSection = React.useRef(false);

  const handleMobileNav = (id) => {
    _mobileEnteredSection.current = true;
    setActiveSection(id);
  };

  // When we mount on mobile, default to the list view if no section was previously chosen
  React.useEffect(() => {
    if (screenSize === 'small' && !_mobileEnteredSection.current && activeSection === 'general') {
      setActiveSection('__list__');
    }
    // eslint-disable-next-line
  }, []);


  const renderSectionContent = () => (
    <>
      {activeSection === 'general' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🌍 Regional Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => handleInputChange('language', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quick-link card to Mobile & Tablet UI section */}
                <button
                  onClick={() => setActiveSection('mobileui')}
                  style={{
                    padding: '16px 20px',
                    background: darkMode ? '#252538' : '#f9fafb',
                    border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? '#2d2d44' : '#e5e7eb'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#1f2937' }}>Mobile & Tablet UI</div>
                      <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '2px' }}>
                        Bottom bar, nav style, icons, tablet sidebar
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', color: darkMode ? '#4b5563' : '#9ca3af' }}>›</span>
                </button>
              </div>
            )}

            {activeSection === 'mobileui' && (() => {
              const dm = darkMode;
              const card = {
                padding: '20px',
                background: screenSize === 'small' ? 'transparent' : (dm ? '#252538' : '#f9fafb'),
                borderRadius: '16px',
                border: screenSize === 'small' ? 'none' : `1px solid ${dm ? '#2d2d44' : '#e5e7eb'}`,
                marginBottom: '0',
              };
              const label = {
                display: 'block', fontSize: '13px', fontWeight: '600',
                color: dm ? '#e0e0e0' : '#374151', marginBottom: '8px',
              };
              const hint = { fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '6px' };
              const select = {
                width: '100%',
                padding: screenSize === 'small' ? '14px 16px' : '11px 14px',
                border: `1px solid ${dm ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: screenSize === 'small' ? '16px' : '14px',
                background: dm ? '#1a1a2e' : '#ffffff',
                color: dm ? '#ffffff' : '#1f2937',
                outline: 'none',
                minHeight: screenSize === 'small' ? '52px' : '44px',
                cursor: 'pointer',
              };
              const toggle = (key) => (
                <div
                  onClick={() => handleInputChange(key, !formData[key])}
                  style={{
                    width: '48px', height: '26px', borderRadius: '13px',
                    background: formData[key] ? '#6366f1' : (dm ? '#374151' : '#d1d5db'),
                    position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px',
                    left: formData[key] ? '25px' : '3px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: '#ffffff', transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  }} />
                </div>
              );
              const toggleRow = (key, title, desc) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: dm ? '#1a1a2e' : '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${dm ? '#2d2d44' : '#e5e7eb'}`,
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: dm ? '#ffffff' : '#1f2937' }}>{title}</div>
                    {desc && <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '3px' }}>{desc}</div>}
                  </div>
                  {toggle(key)}
                </div>
              );

              const ALL_TAB_OPTIONS = [
                { id: 'orders', label: 'Orders', icon: '🛒' },
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'reports', label: 'Reports', icon: '📈' },
                { id: 'crm', label: 'Customers', icon: '👤' },
                { id: 'staff', label: 'Staff', icon: '👥' },
                { id: 'menu', label: 'Menu', icon: '🍽️' },
                { id: 'inventory', label: 'Inventory', icon: '📦' },
                { id: 'tables', label: 'Tables', icon: '🪑' },
                { id: 'kitchen', label: 'Kitchen', icon: '👨‍🍳' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ];
              const currentTabs = formData.mobileNavTabs ?? ['orders', 'dashboard', 'reports', 'crm', 'more'];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* ── Section header ── */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '28px' }}>📱</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: dm ? '#ffffff' : '#111827' }}>Mobile & Tablet UI</div>
                      <div style={{ fontSize: '13px', color: dm ? '#6b7280' : '#9ca3af' }}>Customise navigation, icons, and layout for every screen size</div>
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────── */}
                  {/* PHONE — NAV BAR                               */}
                  {/* ────────────────────────────────────────────── */}
                  <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#1f2937', marginBottom: '16px' }}>
                      📲 Phone Navigation Bar
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Position */}
                      <div>
                        <label style={label}>Bar Position</label>
                        <select
                          value={formData.mobileNavPosition}
                          onChange={e => handleInputChange('mobileNavPosition', e.target.value)}
                          style={select}
                        >
                          <option value="bottom">Bottom (recommended)</option>
                          <option value="top">Top</option>
                        </select>
                        <div style={hint}>Bottom bar is easier to reach on tall phones</div>
                      </div>

                      {/* Style */}
                      <div>
                        <label style={label}>Active Tab Style</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { value: 'pill',      label: 'Pill',       desc: 'Rounded highlight', emoji: '💊' },
                            { value: 'underline', label: 'Underline',  desc: 'Bottom line',        emoji: '📏' },
                            { value: 'icon-only', label: 'Icon Only',  desc: 'No labels, minimal', emoji: '🔹' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleInputChange('mobileNavStyle', opt.value)}
                              style={{
                                padding: '12px 8px',
                                background: formData.mobileNavStyle === opt.value
                                  ? (dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                                  : (dm ? '#1a1a2e' : '#ffffff'),
                                border: `1.5px solid ${formData.mobileNavStyle === opt.value ? '#6366f1' : (dm ? '#2d2d44' : '#e5e7eb')}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '4px',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: '20px' }}>{opt.emoji}</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: formData.mobileNavStyle === opt.value ? '#6366f1' : (dm ? '#e0e0e0' : '#374151') }}>{opt.label}</span>
                              <span style={{ fontSize: '10px', color: dm ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Icon size */}
                      <div>
                        <label style={label}>Icon Size</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                          {[
                            { value: 'sm', label: 'Small',  px: '18px' },
                            { value: 'md', label: 'Medium', px: '22px' },
                            { value: 'lg', label: 'Large',  px: '28px' },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleInputChange('mobileIconSize', opt.value)}
                              style={{
                                padding: '12px 8px',
                                background: formData.mobileIconSize === opt.value
                                  ? (dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)')
                                  : (dm ? '#1a1a2e' : '#ffffff'),
                                border: `1.5px solid ${formData.mobileIconSize === opt.value ? '#6366f1' : (dm ? '#2d2d44' : '#e5e7eb')}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', flexDirection: 'column',
                                alignItems: 'center', gap: '6px',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: opt.px }}>🛒</span>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: formData.mobileIconSize === opt.value ? '#6366f1' : (dm ? '#e0e0e0' : '#374151') }}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Show labels */}
                      {toggleRow('mobileShowLabels', 'Show Tab Labels', 'Show text labels below icons in the nav bar')}

                    </div>
                  </div>

                  {/* ────────────────────────────────────────────── */}
                  {/* PHONE — VISIBLE TABS                          */}
                  {/* ────────────────────────────────────────────── */}
                  <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#1f2937', marginBottom: '4px' }}>
                      🗂 Bottom Bar Tabs
                    </div>
                    <div style={{ fontSize: '13px', color: dm ? '#6b7280' : '#9ca3af', marginBottom: '14px' }}>
                      Pick up to 5 tabs — unselected ones go in the "More" drawer.
                    </div>

                    {/* Visual preview strip */}
                    <div style={{
                      background: dm ? '#0f0f1e' : '#f3f4f6',
                      borderRadius: '12px',
                      padding: '10px 8px',
                      display: 'flex',
                      gap: '4px',
                      marginBottom: '14px',
                      overflowX: 'auto',
                    }}>
                      {currentTabs.map(tabId => {
                        const t = ALL_TAB_OPTIONS.find(x => x.id === tabId) ?? { id: tabId, label: 'More', icon: '⋯' };
                        return (
                          <div key={t.id} style={{
                            flex: 1, minWidth: '48px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                            padding: '8px 4px',
                            background: 'rgba(99,102,241,0.15)',
                            borderRadius: '10px',
                          }}>
                            <span style={{ fontSize: '18px' }}>{t.icon}</span>
                            <span style={{ fontSize: '9px', color: '#6366f1', fontWeight: '700' }}>{t.label.slice(0, 6)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {ALL_TAB_OPTIONS.map(tab => {
                        const isSelected = currentTabs.includes(tab.id);
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              const newTabs = isSelected
                                ? currentTabs.filter(t => t !== tab.id)
                                : currentTabs.length < 5
                                  ? [...currentTabs.filter(t => t !== 'more'), tab.id, 'more'].slice(0, 5)
                                  : currentTabs;
                              handleInputChange('mobileNavTabs', newTabs);
                              if (currentTabs.length >= 5 && !isSelected) {
                                setAlertMessage('Maximum 5 tabs. Remove one first.');
                                setAlertType('error');
                                setShowAlert(true);
                                setTimeout(() => setShowAlert(false), 2500);
                              }
                            }}
                            style={{
                              padding: '9px 13px',
                              background: isSelected
                                ? '#6366f1'
                                : (dm ? '#1a1a2e' : '#f3f4f6'),
                              color: isSelected ? '#ffffff' : (dm ? '#9ca3af' : '#6b7280'),
                              border: `1px solid ${isSelected ? '#6366f1' : (dm ? '#2d2d44' : '#e5e7eb')}`,
                              borderRadius: '10px',
                              fontSize: '13px', fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '6px',
                              transition: 'all 0.15s',
                              opacity: !isSelected && currentTabs.length >= 5 ? 0.45 : 1,
                            }}
                          >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                            {isSelected && <span style={{ fontSize: '10px', opacity: 0.7 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ ...hint, marginTop: '10px' }}>
                      {currentTabs.filter(t => t !== 'more').length}/5 tabs selected
                    </div>
                  </div>

                  {/* ────────────────────────────────────────────── */}
                  {/* TABLET — SIDEBAR                              */}
                  {/* ────────────────────────────────────────────── */}
                  <div style={card}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#1f2937', marginBottom: '16px' }}>
                      🖥️ Tablet Sidebar
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      <div>
                        <label style={label}>Sidebar Mode</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {[
                            {
                              value: 'compact',
                              title: 'Compact (icon-only)',
                              desc: 'Always visible, icons only — saves space without hiding navigation.',
                              emoji: '☰',
                            },
                            {
                              value: 'full',
                              title: 'Full (expandable)',
                              desc: 'Starts collapsed to icons, tap the toggle to expand with labels.',
                              emoji: '⬅️',
                            },
                            {
                              value: 'hidden',
                              title: 'Hidden (top bar)',
                              desc: 'No sidebar — uses the scrollable header tab bar instead.',
                              emoji: '🔝',
                            },
                          ].map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => handleInputChange('tabletSidebarMode', opt.value)}
                              style={{
                                padding: '14px 16px',
                                background: formData.tabletSidebarMode === opt.value
                                  ? (dm ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)')
                                  : (dm ? '#1a1a2e' : '#ffffff'),
                                border: `1.5px solid ${formData.tabletSidebarMode === opt.value ? '#6366f1' : (dm ? '#2d2d44' : '#e5e7eb')}`,
                                borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                textAlign: 'left', width: '100%',
                                transition: 'all 0.15s',
                              }}
                            >
                              <span style={{ fontSize: '22px', flexShrink: 0 }}>{opt.emoji}</span>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: formData.tabletSidebarMode === opt.value ? '#6366f1' : (dm ? '#e0e0e0' : '#1f2937') }}>
                                  {opt.title}
                                </div>
                                <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '2px', lineHeight: 1.4 }}>
                                  {opt.desc}
                                </div>
                              </div>
                              {formData.tabletSidebarMode === opt.value && (
                                <span style={{ marginLeft: 'auto', fontSize: '16px', color: '#6366f1', flexShrink: 0 }}>✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })()}

            {activeSection === 'business' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🏪 Store Information
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Store Name
                      </label>
                      <input
                        type="text"
                        value={formData.storeName}
                        onChange={(e) => handleInputChange('storeName', e.target.value)}
                        placeholder="My Bakery"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Store Address
                      </label>
                      <input
                        type="text"
                        value={formData.storeAddress}
                        onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                        placeholder="123 Main Street"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: screenSize === 'small' ? '1fr' : '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                          Phone
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+91 9876543210"
                          style={{
                            width: '100%',
                            padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: screenSize === 'small' ? '16px' : '15px',
                            background: darkMode ? '#1a1a2e' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#1f2937',
                            outline: 'none',
                            minHeight: screenSize === 'small' ? '52px' : '48px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="contact@example.com"
                          style={{
                            width: '100%',
                            padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                            border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                            borderRadius: '12px',
                            fontSize: screenSize === 'small' ? '16px' : '15px',
                            background: darkMode ? '#1a1a2e' : '#ffffff',
                            color: darkMode ? '#ffffff' : '#1f2937',
                            outline: 'none',
                            minHeight: screenSize === 'small' ? '52px' : '48px'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'tax' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    💰 Tax Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={formData.taxRate}
                        onChange={(e) => handleInputChange('taxRate', e.target.value)}
                        placeholder="18"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeSection === 'receipt' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Legal Compliance */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    📋 Legal Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.gstin}
                        onChange={(e) => handleInputChange('gstin', e.target.value)}
                        placeholder="29ABCDE1234F1Z5"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        FSSAI License
                      </label>
                      <input
                        type="text"
                        value={formData.fssaiLicense}
                        onChange={(e) => handleInputChange('fssaiLicense', e.target.value)}
                        placeholder="10012345678987"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Tariff Code
                      </label>
                      <input
                        type="text"
                        value={formData.tariffCode}
                        onChange={(e) => handleInputChange('tariffCode', e.target.value)}
                        placeholder="996311"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Google Review URL
                      </label>
                      <input
                        type="text"
                        value={formData.googleReviewUrl}
                        onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)}
                        placeholder="https://g.page/r/..."
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Receipt Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🧾 Receipt Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Store Logo URL
                      </label>
                      <input
                        type="text"
                        value={formData.storeLogo}
                        onChange={(e) => handleInputChange('storeLogo', e.target.value)}
                        placeholder="https://example.com/logo.png"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Receipt Footer
                      </label>
                      <input
                        type="text"
                        value={formData.receiptFooter}
                        onChange={(e) => handleInputChange('receiptFooter', e.target.value)}
                        placeholder="Thank you for your order!"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Receipt Font Size
                      </label>
                      <select
                        value={formData.receiptFontSize}
                        onChange={(e) => handleInputChange('receiptFontSize', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      >
                        <option value="10">10px (Small)</option>
                        <option value="12">12px (Medium)</option>
                        <option value="14">14px (Large)</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#1f2937' }}>Auto-print Receipt</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '4px' }}>Automatically print receipt after payment</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('autoPrintReceipt', !formData.autoPrintReceipt)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.autoPrintReceipt ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.autoPrintReceipt ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    👁️ Display Options
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'showLogoOnReceipt', label: 'Show Store Logo' },
                      { key: 'showGstOnReceipt', label: 'Show GST on Receipt' },
                      { key: 'showTableOnReceipt', label: 'Show Table on Receipt' },
                      { key: 'showCustomerOnReceipt', label: 'Show Customer on Receipt' },
                      { key: 'showCashierOnReceipt', label: 'Show Cashier/Staff on Receipt' },
                      { key: 'showEmailOnReceipt', label: 'Show Email on Receipt' },
                      { key: 'showPaymentDetailsOnReceipt', label: 'Show Payment Details' },
                      { key: 'showBillIdOnReceipt', label: 'Show Bill ID on Receipt' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#1f2937' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {activeSection === 'pos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* POS Mode */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🛒 POS Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        POS Mode
                      </label>
                      <select
                        value={formData.posMode}
                        onChange={(e) => handleInputChange('posMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
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
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    📋 Order Requirements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'requireCustomer', label: 'Require customer selection for orders' },
                      { key: 'requireTable', label: 'Require table selection for orders' },
                      { key: 'allowWalkIn', label: 'Allow walk-in orders (no customer/table)' },
                      { key: 'requirePaymentBeforeKOT', label: 'Require payment before sending to kitchen' },
                      { key: 'autoCreateKOT', label: 'Auto-create KOT on order completion' },
                      { key: 'autoAssignTables', label: 'Auto-assign available tables' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#1f2937' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    💳 Payment Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Razorpay Key ID
                      </label>
                      <input
                        type="text"
                        value={formData.razorpayKeyId}
                        onChange={(e) => handleInputChange('razorpayKeyId', e.target.value)}
                        placeholder="rzp_test_..."
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                      <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '8px' }}>
                        Your Razorpay key ID for card, UPI, and wallet payments
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        UPI ID (for QR payments)
                      </label>
                      <input
                        type="text"
                        value={formData.upiId}
                        onChange={(e) => handleInputChange('upiId', e.target.value)}
                        placeholder="yourupi@paytm"
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#1f2937' }}>Enable split payments</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '4px' }}>Allow customers to split payment across methods</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('enableSplitPayment', !formData.enableSplitPayment)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableSplitPayment ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.enableSplitPayment ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discount Settings */}
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🏷️ Discount Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'enableDiscount', label: 'Enable discounts on orders' },
                      { key: 'enableCustomOrders', label: 'Enable custom orders (items not in menu)' },
                      { key: 'enableVoid', label: 'Enable void orders' },
                      { key: 'enableOrderNotes', label: 'Enable order notes' },
                      { key: 'enableHoldOrders', label: 'Enable hold orders feature' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#1f2937' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Custom Order Accordion Settings ───────────────────── */}
            {activeSection === 'pos' && formData.enableCustomOrders && (() => {
              const dm = darkMode;
              const cardStyle = {
                padding: '20px',
                background: screenSize === 'small' ? 'transparent' : (dm ? '#252538' : '#f9fafb'),
                borderRadius: '16px',
                border: screenSize === 'small' ? 'none' : `1px solid ${dm ? '#2d2d44' : '#e5e7eb'}`,
              };
              const labelStyle = {
                display: 'block', fontSize: '13px', fontWeight: '600',
                color: dm ? '#e0e0e0' : '#374151', marginBottom: '8px',
              };
              const inputStyle = {
                padding: '10px 12px',
                border: `1px solid ${dm ? '#2d2d44' : '#d1d5db'}`,
                borderRadius: '10px',
                fontSize: screenSize === 'small' ? '16px' : '14px',
                background: dm ? '#1a1a2e' : '#ffffff',
                color: dm ? '#ffffff' : '#1f2937',
                outline: 'none',
                width: '100%',
              };
              const ToggleRow = ({ field, title, desc }) => (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: dm ? '#1a1a2e' : '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${dm ? '#2d2d44' : '#e5e7eb'}`,
                }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: dm ? '#f9fafb' : '#1f2937' }}>{title}</div>
                    {desc && <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '2px' }}>{desc}</div>}
                  </div>
                  <div
                    onClick={() => handleInputChange(field, !formData[field])}
                    style={{
                      width: '48px', height: '26px', borderRadius: '13px', flexShrink: 0,
                      background: formData[field] ? '#6366f1' : (dm ? '#374151' : '#d1d5db'),
                      position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: '3px',
                      left: formData[field] ? '25px' : '3px',
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: '#ffffff', transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }} />
                  </div>
                </div>
              );

              const presets = formData.customOrderPresets || [];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={cardStyle}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: dm ? '#ffffff' : '#1f2937', marginBottom: '16px' }}>
                      ✚ Custom Order — Inline Panel
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                      {/* Visibility toggles */}
                      <ToggleRow field="customOrderShowCategory" title="Show category field"
                        desc="Let staff assign a category to the custom item" />
                      <ToggleRow field="customOrderShowNotes" title="Show notes field"
                        desc="Let staff add a note or instruction to the custom item" />

                      {/* Default category */}
                      <div>
                        <label style={labelStyle}>Default Category</label>
                        <select
                          value={formData.customOrderDefaultCategory}
                          onChange={e => handleInputChange('customOrderDefaultCategory', e.target.value)}
                          style={{ ...inputStyle, cursor: 'pointer' }}
                        >
                          {['Food', 'Beverages', 'Extras', 'Services', 'Custom'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginTop: '6px' }}>
                          Pre-selected when a custom item is added
                        </div>
                      </div>

                      {/* Presets editor */}
                      <div>
                        <label style={labelStyle}>Quick-Add Presets</label>
                        <div style={{ fontSize: '12px', color: dm ? '#6b7280' : '#9ca3af', marginBottom: '10px' }}>
                          These chips appear at the top of the inline panel for one-tap entry.
                        </div>

                        {/* Preset rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                          {presets.map((preset, idx) => (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '10px 12px',
                              background: dm ? '#1a1a2e' : '#ffffff',
                              borderRadius: '10px',
                              border: `1px solid ${dm ? '#2d2d44' : '#e5e7eb'}`,
                            }}>
                              {/* Icon */}
                              <input
                                type="text"
                                value={preset.icon}
                                onChange={e => {
                                  const next = [...presets];
                                  next[idx] = { ...next[idx], icon: e.target.value };
                                  handleInputChange('customOrderPresets', next);
                                }}
                                style={{
                                  width: '44px', textAlign: 'center', padding: '6px 4px',
                                  background: dm ? '#252538' : '#f3f4f6',
                                  border: `1px solid ${dm ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px', fontSize: '18px', outline: 'none',
                                  color: dm ? '#ffffff' : '#1f2937',
                                }}
                              />
                              {/* Name */}
                              <input
                                type="text"
                                value={preset.name}
                                onChange={e => {
                                  const next = [...presets];
                                  next[idx] = { ...next[idx], name: e.target.value };
                                  handleInputChange('customOrderPresets', next);
                                }}
                                placeholder="Name"
                                style={{
                                  flex: 1, padding: '6px 10px',
                                  background: dm ? '#252538' : '#f3f4f6',
                                  border: `1px solid ${dm ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px', fontSize: '13px', outline: 'none',
                                  color: dm ? '#ffffff' : '#1f2937',
                                }}
                              />
                              {/* Price */}
                              <input
                                type="number"
                                value={preset.price}
                                onChange={e => {
                                  const next = [...presets];
                                  next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 };
                                  handleInputChange('customOrderPresets', next);
                                }}
                                placeholder="₹"
                                style={{
                                  width: '68px', padding: '6px 8px', textAlign: 'right',
                                  background: dm ? '#252538' : '#f3f4f6',
                                  border: `1px solid ${dm ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px', fontSize: '13px', outline: 'none',
                                  color: dm ? '#ffffff' : '#1f2937',
                                }}
                              />
                              {/* Remove */}
                              <button
                                onClick={() => handleInputChange('customOrderPresets', presets.filter((_, i) => i !== idx))}
                                style={{
                                  background: 'transparent',
                                  border: `1px solid ${dm ? '#374151' : '#e5e7eb'}`,
                                  borderRadius: '8px', padding: '6px 8px',
                                  cursor: 'pointer', fontSize: '13px',
                                  color: dm ? '#6b7280' : '#9ca3af',
                                }}
                              >🗑</button>
                            </div>
                          ))}
                        </div>

                        {/* Add preset */}
                        <button
                          onClick={() => handleInputChange('customOrderPresets', [...presets, { name: '', price: 0, icon: '⭐' }])}
                          style={{
                            width: '100%', padding: '11px',
                            background: 'transparent',
                            border: `1.5px dashed ${dm ? '#374151' : '#d1d5db'}`,
                            borderRadius: '10px', cursor: 'pointer',
                            fontSize: '13px', fontWeight: '600',
                            color: dm ? '#6b7280' : '#9ca3af',
                            transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#6366f1'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = dm ? '#374151' : '#d1d5db'}
                        >
                          + Add Preset
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}

            {activeSection === 'itemcodes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🔢 Item Code Configuration
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Code Type
                      </label>
                      <select
                        value={formData.codeType}
                        onChange={(e) => handleInputChange('codeType', e.target.value)}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    👨‍🍳 Kitchen Display
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#1f2937' }}>Enable Kitchen Display</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '4px' }}>Show kitchen orders on dedicated display</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('kitchenDisplayEnabled', !formData.kitchenDisplayEnabled)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.kitchenDisplayEnabled ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.kitchenDisplayEnabled ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
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

                  {/* Payment Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>💳 Payment Methods</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { key: 'qrEnablePaymentCash', label: 'Cash at Counter', desc: 'Pay when collecting order' },
                        { key: 'qrEnablePaymentUPI', label: 'UPI Payment', desc: 'GPay, PhonePe, Paytm' },
                        { key: 'qrEnablePaymentCard', label: 'Credit/Debit Card', desc: 'Visa, Mastercard, RuPay' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '40px', height: '22px', flexShrink: 0, background: formData[key] ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                          >
                            <div style={{ position: 'absolute', top: '3px', left: formData[key] ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tipping Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>💰 Tipping Options</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Enable Tipping</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Allow customers to add tips at checkout</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableTipping', !formData.qrEnableTipping)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableTipping ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableTipping ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Default Tip %</label>
                        <input
                          type="number"
                          value={formData.qrDefaultTipPercent}
                          onChange={e => handleInputChange('qrDefaultTipPercent', Number(e.target.value))}
                          min="0"
                          max="30"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Tip Options (%)</label>
                        <input
                          type="text"
                          value={formData.qrTipOptions?.join(', ') || '0, 5, 10, 15'}
                          onChange={e => handleInputChange('qrTipOptions', e.target.value.split(',').map(n => Number(n.trim())))}
                          placeholder="0, 5, 10, 15"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customization Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🎨 Item Customization</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                      {[
                        { key: 'qrEnableSizeOptions', label: 'Size Options', desc: 'Regular/Large sizes with price diff' },
                        { key: 'qrEnableSpiceOptions', label: 'Spice Level', desc: 'Mild/Medium/Hot spice options' },
                        { key: 'qrEnableAddons', label: 'Add-ons', desc: 'Extra cheese, sauce, etc.' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '40px', height: '22px', flexShrink: 0, background: formData[key] ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                          >
                            <div style={{ position: 'absolute', top: '3px', left: formData[key] ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: t.textSub, marginBottom: '4px' }}>Large Size +₹</label>
                        <input
                          type="number"
                          value={formData.qrSizeLargePrice}
                          onChange={e => handleInputChange('qrSizeLargePrice', Number(e.target.value))}
                          min="0"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '12px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: t.textSub, marginBottom: '4px' }}>Cheese +₹</label>
                        <input
                          type="number"
                          value={formData.qrAddonCheesePrice}
                          onChange={e => handleInputChange('qrAddonCheesePrice', Number(e.target.value))}
                          min="0"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '12px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: t.textSub, marginBottom: '4px' }}>Sauce +₹</label>
                        <input
                          type="number"
                          value={formData.qrAddonSaucePrice}
                          onChange={e => handleInputChange('qrAddonSaucePrice', Number(e.target.value))}
                          min="0"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, fontSize: '12px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Order Management Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>📋 Order Management</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { key: 'qrEnableOrderCancel', label: 'Allow Order Cancellation', desc: 'Customers can cancel pending orders' },
                        { key: 'qrEnableDarkMode', label: 'Dark Mode Toggle', desc: 'Enable dark/light theme switch' },
                        { key: 'qrEnableCombos', label: 'Combo/Meal Deals', desc: 'Show combo badge on bundled items' },
                        { key: 'qrEnableSplitBilling', label: 'Split Billing', desc: 'Show table orders summary for multi-orderer' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{desc}</div>
                          </div>
                          <div
                            onClick={() => handleInputChange(key, !formData[key])}
                            style={{ width: '40px', height: '22px', flexShrink: 0, background: formData[key] ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                          >
                            <div style={{ position: 'absolute', top: '3px', left: formData[key] ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session & Business Hours Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>⏰ Session & Business Hours</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Enable Business Hours</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Prevent orders outside operating hours</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableBusinessHours', !formData.qrEnableBusinessHours)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableBusinessHours ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableBusinessHours ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Opening Time</label>
                        <input
                          type="time"
                          value={formData.qrBusinessHoursStart}
                          onChange={e => handleInputChange('qrBusinessHoursStart', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Closing Time</label>
                        <input
                          type="time"
                          value={formData.qrBusinessHoursEnd}
                          onChange={e => handleInputChange('qrBusinessHoursEnd', e.target.value)}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Closed Message</label>
                      <textarea
                        value={formData.qrClosedMessage}
                        onChange={e => handleInputChange('qrClosedMessage', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', resize: 'none', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Session Timeout (minutes)</label>
                      <input
                        type="number"
                        value={formData.qrSessionTimeout}
                        onChange={e => handleInputChange('qrSessionTimeout', Number(e.target.value))}
                        min="5"
                        max="120"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                      />
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px' }}>Cart expires after inactivity</div>
                    </div>
                  </div>

                  {/* GST & Invoice Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🧾 GST & Invoice Settings</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Sequential Invoice Numbers</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Generate gap-free invoice numbers for GST compliance</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableSequentialInvoices', !formData.qrEnableSequentialInvoices)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableSequentialInvoices ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableSequentialInvoices ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Invoice Prefix</label>
                        <input
                          type="text"
                          value={formData.qrInvoicePrefix}
                          onChange={e => handleInputChange('qrInvoicePrefix', e.target.value)}
                          placeholder="INV"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Start Number</label>
                        <input
                          type="number"
                          value={formData.qrInvoiceStartNumber}
                          onChange={e => handleInputChange('qrInvoiceStartNumber', Number(e.target.value))}
                          min="1"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>GST Rounding Mode</label>
                      <select
                        value={formData.qrGstRoundingMode}
                        onChange={e => handleInputChange('qrGstRoundingMode', e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                      >
                        <option value="standard">Standard (Banker's rounding)</option>
                        <option value="up">Always Round Up</option>
                        <option value="down">Always Round Down</option>
                        <option value="nearest">Nearest Paisa</option>
                      </select>
                      <div style={{ fontSize: '11px', color: t.textMute, marginTop: '4px' }}>How to round tax amounts for GST compliance</div>
                    </div>

                    <div style={{ padding: '10px 12px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: '12px', color: t.textSub, marginBottom: '4px' }}>Last Invoice Number</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: t.text }}>{formData.qrInvoicePrefix}{formData.qrLastInvoiceNumber}</div>
                    </div>
                  </div>

                  {/* Thermal Printer Controls */}
                  <div style={{ padding: '18px', background: t.bgEle, borderRadius: '12px', border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: t.text, marginBottom: '16px' }}>🖨️ Thermal Printer</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '10px', border: `1px solid ${t.border}`, marginBottom: '14px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>Enable ESC/POS Printing</div>
                        <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>Direct thermal printer integration</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('qrEnableThermalPrinter', !formData.qrEnableThermalPrinter)}
                        style={{ width: '40px', height: '22px', flexShrink: 0, background: formData.qrEnableThermalPrinter ? '#10b981' : '#2d2d48', borderRadius: '11px', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', marginLeft: '12px' }}
                      >
                        <div style={{ position: 'absolute', top: '3px', left: formData.qrEnableThermalPrinter ? '21px' : '3px', width: '16px', height: '16px', background: t.bgInput, borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Printer Port</label>
                        <input
                          type="number"
                          value={formData.qrPrinterPort}
                          onChange={e => handleInputChange('qrPrinterPort', e.target.value)}
                          placeholder="9100"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: t.textSub, marginBottom: '6px' }}>Paper Width (mm)</label>
                        <select
                          value={formData.qrPrinterPaperWidth}
                          onChange={e => handleInputChange('qrPrinterPaperWidth', Number(e.target.value))}
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.border}`, fontSize: '13px', background: t.bgCard, color: t.text, outline: 'none' }}
                        >
                          <option value="58">58mm</option>
                          <option value="80">80mm</option>
                        </select>
                      </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🔔 Notifications
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#1f2937' }}>Enable Notifications</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '4px' }}>Receive alerts for important events</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('enableNotifications', !formData.enableNotifications)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.enableNotifications ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.enableNotifications ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'display' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🖥️ Display Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: darkMode ? '#ffffff' : '#1f2937' }}>Low Stock Alerts</div>
                        <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '4px' }}>Alert when inventory is running low</div>
                      </div>
                      <div
                        onClick={() => handleInputChange('lowStockAlert', !formData.lowStockAlert)}
                        style={{
                          width: '52px',
                          height: '28px',
                          borderRadius: '14px',
                          background: formData.lowStockAlert ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{
                          position: 'absolute',
                          top: '4px',
                          left: formData.lowStockAlert ? '28px' : '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          transition: 'left 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'backup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    💾 Backup & Restore
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <button
                      onClick={handleBackup}
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '16px 20px' : '14px 20px',
                        background: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: screenSize === 'small' ? '16px' : '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: screenSize === 'small' ? '56px' : '52px'
                      }}
                    >
                      Download Backup
                    </button>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Restore Backup
                      </label>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestore}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'refunds' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    💸 Refund Management
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#6b7280', lineHeight: '1.6' }}>
                      Process refunds for completed payments. All refunds are processed through Razorpay.
                    </div>
                    <button
                      onClick={() => {
                        if (typeof window === 'undefined') return;
                        try {
                          const payments = JSON.parse(localStorage.getItem('payment_transactions') || '[]');
                          const successfulPayments = payments.filter(p => p.status === 'success');
                          setAlertMessage(`Found ${successfulPayments.length} successful payments available for refund`);
                          setShowAlert(true);
                        } catch (e) {
                          setAlertMessage('Error loading payment transactions');
                          setShowAlert(true);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: screenSize === 'small' ? '16px 20px' : '14px 20px',
                        background: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: screenSize === 'small' ? '16px' : '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        minHeight: screenSize === 'small' ? '56px' : '52px'
                      }}
                    >
                      Load Payment Transactions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'compliance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🔒 PCI DSS Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#6b7280', lineHeight: '1.6' }}>
                      Payment Card Industry Data Security Standard compliance settings for secure payment processing.
                    </div>
                    {[
                      { key: 'enablePciDssLogging', label: 'Enable PCI DSS compliant logging (mask sensitive data)' },
                      { key: 'enableCardTokenization', label: 'Enable card tokenization (save cards securely)' },
                      { key: 'requireCvvForSavedCards', label: 'Require CVV for saved card payments' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#1f2937' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: darkMode ? '#e0e0e0' : '#374151', marginBottom: '8px' }}>
                        Card data retention period (days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="365"
                        value={formData.cardDataRetentionDays || 30}
                        onChange={(e) => handleInputChange('cardDataRetentionDays', parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          padding: screenSize === 'small' ? '14px 16px' : '12px 16px',
                          border: `1px solid ${darkMode ? '#2d2d44' : '#d1d5db'}`,
                          borderRadius: '12px',
                          fontSize: screenSize === 'small' ? '16px' : '15px',
                          background: darkMode ? '#1a1a2e' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#1f2937',
                          outline: 'none',
                          minHeight: screenSize === 'small' ? '52px' : '48px'
                        }}
                      />
                      <div style={{ fontSize: '13px', color: darkMode ? '#8b8b9e' : '#6b7280', marginTop: '8px' }}>
                        Maximum time to retain card data for security compliance
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '20px',
                  background: screenSize === 'small' ? '#f9fafb' : (darkMode ? '#252538' : '#f9fafb'),
                  borderRadius: '16px',
                  border: screenSize === 'small' ? 'none' : `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
                }}>
                  <div style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937' }}>
                    🛡️ GDPR Compliance
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#6b7280', lineHeight: '1.6' }}>
                      General Data Protection Regulation compliance for customer data handling.
                    </div>
                    {[
                      { key: 'enableGdprCompliance', label: 'Enable GDPR compliance mode' },
                      { key: 'enableDataExport', label: 'Allow customer data export requests' },
                      { key: 'enableDataDeletion', label: 'Allow customer data deletion requests' }
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: darkMode ? '#1a1a2e' : '#ffffff', borderRadius: '12px', border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}` }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: darkMode ? '#ffffff' : '#1f2937' }}>{label}</div>
                        <div
                          onClick={() => handleInputChange(key, !formData[key])}
                          style={{
                            width: '52px',
                            height: '28px',
                            borderRadius: '14px',
                            background: formData[key] ? '#10b981' : (darkMode ? '#2d2d44' : '#d1d5db'),
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            left: formData[key] ? '28px' : '4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: '#ffffff',
                            transition: 'left 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </div>
                      </div>
                    ))}
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

            {/* Tab-specific settings */}
            {activeSection.startsWith('tab-') && (() => {
              const tabId = activeSection.replace('tab-', '');
              const tabSettings = formData[tabId] || {};
              const tabConfig = {
                'orders': { icon: '🛒', label: 'Orders', settings: [
                  { key: 'enabled', label: 'Enable Orders Tab', desc: 'Show/hide the Orders tab in navigation' },
                  { key: 'autoRefresh', label: 'Auto Refresh', desc: 'Automatically refresh order list' },
                  { key: 'showTokens', label: 'Show Tokens', desc: 'Display token numbers on orders' }
                ]},
                'dashboard': { icon: '📊', label: 'Dashboard', settings: [
                  { key: 'enabled', label: 'Enable Dashboard Tab', desc: 'Show/hide the Dashboard tab' },
                  { key: 'showStats', label: 'Show Statistics', desc: 'Display key metrics' },
                  { key: 'showCharts', label: 'Show Charts', desc: 'Display visual charts' }
                ]},
                'reports': { icon: '📈', label: 'Reports', settings: [
                  { key: 'enabled', label: 'Enable Reports Tab', desc: 'Show/hide the Reports tab' },
                  { key: 'autoGenerate', label: 'Auto Generate', desc: 'Automatically generate daily reports' },
                  { key: 'reportTime', label: 'Report Time', desc: 'Time to generate reports', type: 'time' }
                ]},
                'crm': { icon: '👥', label: 'CRM', settings: [
                  { key: 'enabled', label: 'Enable CRM Tab', desc: 'Show/hide the CRM tab' },
                  { key: 'showLoyalty', label: 'Show Loyalty', desc: 'Display customer loyalty points' },
                  { key: 'allowGuestCheckout', label: 'Guest Checkout', desc: 'Allow checkout without registration' }
                ]},
                'staff': { icon: '👨‍🍳', label: 'Staff', settings: [
                  { key: 'enabled', label: 'Enable Staff Tab', desc: 'Show/hide the Staff tab' },
                  { key: 'showPerformance', label: 'Show Performance', desc: 'Display staff performance metrics' },
                  { key: 'allowSchedule', label: 'Allow Scheduling', desc: 'Enable staff scheduling' }
                ]},
                'menu': { icon: '🍽️', label: 'Menu', settings: [
                  { key: 'enabled', label: 'Enable Menu Tab', desc: 'Show/hide the Menu tab' },
                  { key: 'showImages', label: 'Show Images', desc: 'Display item images' },
                  { key: 'allowCustomItems', label: 'Custom Items', desc: 'Allow adding custom menu items' }
                ]},
                'inventory': { icon: '📦', label: 'Inventory', settings: [
                  { key: 'enabled', label: 'Enable Inventory Tab', desc: 'Show/hide the Inventory tab' },
                  { key: 'lowStockAlert', label: 'Low Stock Alert', desc: 'Alert when stock is low' },
                  { key: 'autoReorder', label: 'Auto Reorder', desc: 'Suggest reorder quantities' }
                ]},
                'recipes': { icon: '📝', label: 'Recipes', settings: [
                  { key: 'enabled', label: 'Enable Recipes Tab', desc: 'Show/hide the Recipes tab' },
                  { key: 'showCost', label: 'Show Cost', desc: 'Display recipe cost breakdown' },
                  { key: 'showYield', label: 'Show Yield', desc: 'Display recipe yield information' }
                ]},
                'waste': { icon: '🗑️', label: 'Waste', settings: [
                  { key: 'enabled', label: 'Enable Waste Tab', desc: 'Show/hide the Waste tab' },
                  { key: 'requireReason', label: 'Require Reason', desc: 'Mandatory reason for waste entry' },
                  { key: 'trackCost', label: 'Track Cost', desc: 'Calculate waste cost impact' }
                ]},
                'reservations': { icon: '📅', label: 'Reservations', settings: [
                  { key: 'enabled', label: 'Enable Reservations Tab', desc: 'Show/hide the Reservations tab' },
                  { key: 'autoConfirm', label: 'Auto Confirm', desc: 'Automatically confirm reservations' },
                  { key: 'maxAdvanceDays', label: 'Max Advance Days', desc: 'Maximum days in advance for booking', type: 'number' }
                ]},
                'tokens': { icon: '🎫', label: 'Tokens', settings: [
                  { key: 'enabled', label: 'Enable Token System', desc: 'Enable token-based ordering' },
                  { key: 'prefix', label: 'Token Prefix', desc: 'Prefix for token numbers', type: 'text' },
                  { key: 'autoReset', label: 'Auto Reset', desc: 'Reset tokens daily' }
                ]},
                'tables': { icon: '🪑', label: 'Tables', settings: [
                  { key: 'enabled', label: 'Enable Tables Tab', desc: 'Show/hide the Tables tab' },
                  { key: 'showCapacity', label: 'Show Capacity', desc: 'Display table capacity' },
                  { key: 'allowMerge', label: 'Allow Merge', desc: 'Allow merging tables' }
                ]},
                'waiters': { icon: '🛎️', label: 'Waiters', settings: [
                  { key: 'enabled', label: 'Enable Waiters Tab', desc: 'Show/hide the Waiters tab' },
                  { key: 'showAssignedOrders', label: 'Show Assigned Orders', desc: 'Display orders assigned to waiters' },
                  { key: 'allowCallWaiter', label: 'Allow Call Waiter', desc: 'Enable call waiter feature' }
                ]},
                'kitchen': { icon: '👨‍🍳', label: 'Kitchen', settings: [
                  { key: 'enabled', label: 'Enable Kitchen Tab', desc: 'Show/hide the Kitchen tab' },
                  { key: 'showTimers', label: 'Show Timers', desc: 'Display order preparation timers' },
                  { key: 'autoPrintKOT', label: 'Auto Print KOT', desc: 'Automatically print KOT tickets' }
                ]},
                'onlineOrdering': { icon: '🌐', label: 'Online Ordering', settings: [
                  { key: 'enabled', label: 'Enable Online Ordering', desc: 'Enable online ordering platform' },
                  { key: 'autoAccept', label: 'Auto Accept', desc: 'Automatically accept online orders' },
                  { key: 'preparationTime', label: 'Preparation Time (min)', desc: 'Default preparation time', type: 'number' }
                ]},
                'qrOrdering': { icon: '📱', label: 'QR Ordering', settings: [
                  { key: 'enabled', label: 'Enable QR Ordering', desc: 'Enable QR-based ordering' },
                  { key: 'autoAccept', label: 'Auto Accept', desc: 'Automatically accept QR orders' },
                  { key: 'showMenuImages', label: 'Show Menu Images', desc: 'Display images in QR menu' }
                ]}
              };
              const config = tabConfig[tabId];
              if (!config) return null;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{
                    padding: '16px',
                    background: t.bgEle,
                    borderRadius: '8px',
                    border: `1px solid ${t.border}`
                  }}>
                    <div style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '600', color: t.text }}>
                      {config.icon} {config.label} Settings
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {config.settings.map(setting => (
                        <div key={setting.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: t.bgCard, borderRadius: '8px', border: `1px solid ${t.border}` }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: t.text }}>{setting.label}</div>
                            <div style={{ fontSize: '11px', color: t.textMute, marginTop: '2px' }}>{setting.desc}</div>
                          </div>
                          {setting.type === 'time' ? (
                            <input
                              type="time"
                              value={tabSettings[setting.key] || '23:00'}
                              onChange={(e) => handleInputChange(tabId, { ...tabSettings, [setting.key]: e.target.value })}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.text, fontSize: '13px' }}
                            />
                          ) : setting.type === 'number' ? (
                            <input
                              type="number"
                              value={tabSettings[setting.key] || 0}
                              onChange={(e) => handleInputChange(tabId, { ...tabSettings, [setting.key]: parseInt(e.target.value) || 0 })}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.text, fontSize: '13px', width: '80px' }}
                            />
                          ) : setting.type === 'text' ? (
                            <input
                              type="text"
                              value={tabSettings[setting.key] || ''}
                              onChange={(e) => handleInputChange(tabId, { ...tabSettings, [setting.key]: e.target.value })}
                              style={{ padding: '6px 10px', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bgInput, color: t.text, fontSize: '13px', width: '100px' }}
                            />
                          ) : (
                            <div
                              onClick={() => handleInputChange(tabId, { ...tabSettings, [setting.key]: !tabSettings[setting.key] })}
                              style={{
                                width: '40px', height: '22px', flexShrink: 0,
                                background: tabSettings[setting.key] ? '#10b981' : '#2d2d48',
                                borderRadius: '11px', position: 'relative', cursor: 'pointer',
                                transition: 'background 0.2s', marginLeft: '12px'
                              }}
                            >
                              <div style={{
                                position: 'absolute', top: '3px',
                                left: tabSettings[setting.key] ? '21px' : '3px',
                                width: '16px', height: '16px',
                                background: t.bgInput, borderRadius: '50%',
                                transition: 'left 0.2s',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                              }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

    </>
  );

  return (
    <>
    <style>{`
      .settings-row-btn { -webkit-tap-highlight-color: transparent; transition: background 0.12s; }
      .settings-row-btn:active { background: rgba(99,102,241,0.08) !important; }
    `}</style>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: screenSize === 'small'
        ? (darkMode ? '#0f0f1e' : '#f2f2f7')
        : (darkMode ? '#1a1a2e' : '#f5f7fa'),
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      overflow: 'hidden'
    }}>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE LAYOUT — two-screen: list → detail
          ══════════════════════════════════════════════════════════════ */}
      {screenSize === 'small' && (
        <>
          {/* ── Mobile Nav Header ─────────────────────────────────── */}
          <div style={{
            background: darkMode
              ? 'rgba(15,15,30,0.94)'
              : 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 200,
          }}>
            {/* Left: back button */}
            <button
              onClick={() => {
                if (isMobileList) {
                  onNavigate('orders');
                } else {
                  _mobileEnteredSection.current = false;
                  setActiveSection('__list__');
                }
              }}
              style={{
                background: 'none', border: 'none',
                padding: '8px', margin: '-8px',
                cursor: 'pointer', borderRadius: '8px',
                display: 'flex', alignItems: 'center', gap: '4px',
                color: '#6366f1', fontSize: '16px', fontWeight: '500',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ fontSize: '20px' }}>‹</span>
              <span>{isMobileList ? 'Back' : 'Settings'}</span>
            </button>

            {/* Center: title */}
            <span style={{
              fontSize: '17px', fontWeight: '600',
              color: darkMode ? '#ffffff' : '#111827',
              position: 'absolute', left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              {isMobileList ? 'Settings' : (activeSectionMeta?.label ?? 'Settings')}
            </span>

            {/* Right: save button (only in detail view when changes) */}
            {!isMobileList && hasChanges && (
              <button
                onClick={handleSave}
                style={{
                  background: '#6366f1',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Save
              </button>
            )}
            {(isMobileList || !hasChanges) && <div style={{ width: '60px' }} />}
          </div>

          {/* ── SCREEN A: Section List ─────────────────────────────── */}
          {isMobileList && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 80px' }}>
              {sections.map((group, gi) => (
                <div key={group.group} style={{ marginBottom: '28px' }}>
                  {/* Group label */}
                  <div style={{
                    fontSize: '12px', fontWeight: '700',
                    color: darkMode ? '#4b5563' : '#8e8e93',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    paddingLeft: '4px', marginBottom: '8px',
                  }}>
                    {group.group}
                  </div>

                  {/* Grouped rows card */}
                  <div style={{
                    background: darkMode ? '#1c1c2e' : '#ffffff',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  }}>
                    {group.items.map((section, idx) => (
                      <button
                        key={section.id}
                        className="settings-row-btn"
                        onClick={() => handleMobileNav(section.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '14px 16px',
                          background: 'transparent',
                          border: 'none',
                          borderTop: idx > 0
                            ? `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`
                            : 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {/* Icon bubble */}
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '9px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '18px', flexShrink: 0,
                          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                        }}>
                          {section.icon}
                        </div>

                        {/* Label */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '16px', fontWeight: '500',
                            color: darkMode ? '#f9fafb' : '#111827',
                          }}>
                            {section.label}
                          </div>
                        </div>

                        {/* Chevron */}
                        <span style={{
                          fontSize: '18px',
                          color: darkMode ? '#374151' : '#c7c7cc',
                          flexShrink: 0,
                        }}>›</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── SCREEN B: Section Detail ───────────────────────────── */}
          {!isMobileList && (
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '0 0 100px',
              WebkitOverflowScrolling: 'touch',
            }}>
              {/* Mobile section content */}
              <div style={{ padding: '16px' }}>
                {renderSectionContent()}
              </div>

              {/* Mobile save bar (sticky bottom) */}
              {hasChanges && (
                <div style={{
                  position: 'fixed',
                  bottom: 'calc(70px + env(safe-area-inset-bottom))',
                  left: '12px', right: '12px',
                  background: darkMode
                    ? 'rgba(15,15,30,0.95)'
                    : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
                  borderRadius: '16px',
                  padding: '12px 16px',
                  display: 'flex', gap: '10px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  zIndex: 300,
                }}>
                  <button
                    onClick={handleReset}
                    style={{
                      flex: 1, padding: '13px',
                      background: darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
                      color: darkMode ? '#d1d5db' : '#374151',
                      border: 'none', borderRadius: '12px',
                      fontSize: '15px', fontWeight: '500',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      flex: 2, padding: '13px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#ffffff',
                      border: 'none', borderRadius: '12px',
                      fontSize: '15px', fontWeight: '600',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP / TABLET LAYOUT
          ══════════════════════════════════════════════════════════════ */}
      {screenSize !== 'small' && (
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: '280px',
          background: darkMode ? '#1f1f35' : '#ffffff',
          borderRight: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
          padding: '20px',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <div style={{ margin: '0 0 24px' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: darkMode ? '#ffffff' : '#1f2937', marginBottom: '4px' }}>
              Settings
            </div>
            <div style={{ fontSize: '14px', color: darkMode ? '#8b8b9e' : '#6b7280' }}>
              Configure your bakery
            </div>
          </div>
          {sections.map(group => (
            <div key={group.group} style={{ marginBottom: '20px' }}>
              <div style={{
                margin: '0 0 10px',
                fontSize: '11px', fontWeight: '700',
                color: '#9ca3af', letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>
                {group.group}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    style={{
                      padding: '12px 16px',
                      background: activeSection === section.id ? (darkMode ? '#6366f1' : '#eff6ff') : 'transparent',
                      color: activeSection === section.id ? '#ffffff' : (darkMode ? '#e0e0e0' : '#374151'),
                      border: activeSection === section.id ? 'none' : '1px solid transparent',
                      borderRadius: '10px',
                      fontSize: '14px', fontWeight: '500',
                      cursor: 'pointer', whiteSpace: 'nowrap',
                      textAlign: 'left', width: '100%',
                      display: 'flex', alignItems: 'center', gap: '10px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop main content */}
        <div style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto',
          background: darkMode ? '#1a1a2e' : '#f5f7fa',
          minHeight: 0
        }}>
          <div style={{
            background: darkMode ? '#1f1f35' : '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: activeSection === 'qr' ? '1100px' : '700px',
            border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
            margin: '0 auto',
            transition: 'max-width 0.2s ease-in-out',
          }}>
            <div style={{
              margin: '0 0 24px',
              fontSize: '18px', fontWeight: '700',
              color: darkMode ? '#ffffff' : '#1f2937',
              paddingBottom: '16px',
              borderBottom: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`
            }}>
              {activeSectionMeta?.label}
            </div>

            {renderSectionContent()}

            {/* Desktop action buttons */}
            <div style={{
              display: 'flex', gap: '12px',
              marginTop: '24px', paddingTop: '20px',
              borderTop: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                style={{
                  padding: '10px 24px',
                  background: hasChanges ? (darkMode ? '#252538' : '#f9fafb') : (darkMode ? '#1a1a2e' : '#f3f4f6'),
                  color: hasChanges ? (darkMode ? '#e0e0e0' : '#374151') : '#9ca3af',
                  border: `1px solid ${darkMode ? '#2d2d44' : '#e5e7eb'}`,
                  borderRadius: '10px', fontSize: '14px', fontWeight: '500',
                  cursor: hasChanges ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >Reset</button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                style={{
                  padding: '10px 24px',
                  background: hasChanges ? '#6366f1' : (darkMode ? '#252538' : '#e5e7eb'),
                  color: hasChanges ? '#ffffff' : '#9ca3af',
                  border: 'none', borderRadius: '10px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: hasChanges ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                }}
              >Save Changes</button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Alert Toast (both layouts) ────────────────────────────── */}
      {showAlert && (
        <div style={{
          position: 'fixed',
          top: screenSize === 'small' ? 'auto' : '20px',
          bottom: screenSize === 'small' ? 'calc(80px + env(safe-area-inset-bottom))' : 'auto',
          left: screenSize === 'small' ? '16px' : 'auto',
          right: screenSize === 'small' ? '16px' : '20px',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease-out',
        }}>
          <div style={{
            background: alertType === 'success' ? '#10b981' : '#ef4444',
            color: '#ffffff',
            padding: screenSize === 'small' ? '14px 18px' : '16px 24px',
            borderRadius: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            fontSize: '14px', fontWeight: '500',
            display: 'flex', alignItems: 'center', gap: '10px',
            minWidth: screenSize === 'small' ? 'unset' : '300px',
          }}>
            <span style={{ fontSize: '18px' }}>{alertType === 'success' ? '✓' : '⚠️'}</span>
            <span>{alertMessage}</span>
          </div>
        </div>
      )}
    </div>
    <style>{`
      @keyframes slideIn {
        from { transform: translateY(8px); opacity: 0; }
        to   { transform: translateY(0);   opacity: 1; }
      }
    `}</style>
    </>
  );
}

