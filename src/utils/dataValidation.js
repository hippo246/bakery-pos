// Data validation on load utilities

export const DATA_VERSION = '1.0';

export const validateOrderData = (order) => {
  if (!order || typeof order !== 'object') return null;
  
  const validated = {
    id: typeof order.id === 'string' ? order.id : `ORDER-${Date.now()}`,
    customerName: typeof order.customerName === 'string' ? order.customerName.substring(0, 100) : 'Guest',
    tableNumber: typeof order.tableNumber === 'string' ? order.tableNumber : '1',
    items: Array.isArray(order.items) ? order.items.filter(item => {
      return typeof item === 'object' &&
             typeof item.id === 'string' &&
             typeof item.name === 'string' &&
             typeof item.price === 'number' &&
             typeof item.quantity === 'number' &&
             item.quantity > 0;
    }) : [],
    total: typeof order.total === 'number' && order.total >= 0 ? order.total : 0,
    paymentMethod: ['CASH', 'CARD', 'UPI', 'LOYALTY'].includes(order.paymentMethod) ? order.paymentMethod : 'CASH',
    status: ['PENDING', 'COMPLETED', 'CANCELLED'].includes(order.status) ? order.status : 'PENDING',
    createdAt: new Date(order.createdAt).toISOString() || new Date().toISOString(),
    version: DATA_VERSION
  };
  
  return validated;
};

export const validateCustomerData = (customer) => {
  if (!customer || typeof customer !== 'object') return null;
  
  const validated = {
    id: typeof customer.id === 'string' ? customer.id : `CUST-${Date.now()}`,
    name: typeof customer.name === 'string' ? customer.name.substring(0, 100) : 'Guest',
    email: typeof customer.email === 'string' ? customer.email.substring(0, 100) : '',
    phone: typeof customer.phone === 'string' ? customer.phone.replace(/\D/g, '').substring(0, 15) : '',
    loyaltyPoints: typeof customer.loyaltyPoints === 'number' && customer.loyaltyPoints >= 0 ? customer.loyaltyPoints : 0,
    visits: typeof customer.visits === 'number' && customer.visits >= 0 ? customer.visits : 0,
    totalSpent: typeof customer.totalSpent === 'number' && customer.totalSpent >= 0 ? customer.totalSpent : 0,
    version: DATA_VERSION
  };
  
  return validated;
};

export const validateInventoryData = (inventory) => {
  if (!inventory || typeof inventory !== 'object') return {};
  
  const validated = {};
  
  Object.keys(inventory).forEach(itemId => {
    const item = inventory[itemId];
    if (typeof item === 'object' && typeof item.quantity === 'number') {
      validated[itemId] = {
        quantity: Math.max(0, item.quantity),
        lastUpdated: item.lastUpdated || new Date().toISOString()
      };
    }
  });
  
  return validated;
};

export const validateSettingsData = (settings) => {
  if (!settings || typeof settings !== 'object') return {};
  
  const validated = {
    defaultServiceCharge: typeof settings.defaultServiceCharge === 'number' ? 
      Math.max(0, Math.min(30, settings.defaultServiceCharge)) : 0,
    receiptAutoPrint: typeof settings.receiptAutoPrint === 'boolean' ? settings.receiptAutoPrint : false,
    autoPrintKOT: typeof settings.autoPrintKOT === 'boolean' ? settings.autoPrintKOT : true,
    customReceiptHeader: typeof settings.customReceiptHeader === 'string' ? 
      settings.customReceiptHeader.substring(0, 200) : '',
    customReceiptFooter: typeof settings.customReceiptFooter === 'string' ? 
      settings.customReceiptFooter.substring(0, 200) : '',
    showLogoOnReceipt: typeof settings.showLogoOnReceipt === 'boolean' ? settings.showLogoOnReceipt : true,
    showCashierOnReceipt: typeof settings.showCashierOnReceipt === 'boolean' ? settings.showCashierOnReceipt : true,
    brevoApiKey: typeof settings.brevoApiKey === 'string' ? settings.brevoApiKey.substring(0, 100) : '',
    storeName: typeof settings.storeName === 'string' ? settings.storeName.substring(0, 100) : '',
    storeEmail: typeof settings.storeEmail === 'string' ? settings.storeEmail.substring(0, 100) : '',
    version: DATA_VERSION
  };
  
  return validated;
};

export const validateAllData = () => {
  const validationResults = {
    orders: { valid: true, errors: [] },
    customers: { valid: true, errors: [] },
    inventory: { valid: true, errors: [] },
    settings: { valid: true, errors: [] }
  };
  
  try {
    // Validate orders
    const ordersData = JSON.parse(localStorage.getItem('order_history') || '[]');
    const validatedOrders = ordersData.map((order, index) => {
      const validated = validateOrderData(order);
      if (!validated) {
        validationResults.orders.valid = false;
        validationResults.orders.errors.push(`Invalid order at index ${index}`);
      }
      return validated;
    }).filter(Boolean);
    
    if (validatedOrders.length !== ordersData.length) {
      localStorage.setItem('order_history', JSON.stringify(validatedOrders));
    }
    
    // Validate customers
    const customersData = JSON.parse(localStorage.getItem('customers') || '[]');
    const validatedCustomers = customersData.map((customer, index) => {
      const validated = validateCustomerData(customer);
      if (!validated) {
        validationResults.customers.valid = false;
        validationResults.customers.errors.push(`Invalid customer at index ${index}`);
      }
      return validated;
    }).filter(Boolean);
    
    if (validatedCustomers.length !== customersData.length) {
      localStorage.setItem('customers', JSON.stringify(validatedCustomers));
    }
    
    // Validate inventory
    const inventoryData = JSON.parse(localStorage.getItem('inventory') || '{}');
    const validatedInventory = validateInventoryData(inventoryData);
    
    if (Object.keys(validatedInventory).length !== Object.keys(inventoryData).length) {
      localStorage.setItem('inventory', JSON.stringify(validatedInventory));
    }
    
    // Validate settings
    const settingsData = JSON.parse(localStorage.getItem('cafeos_settings') || '{}');
    const validatedSettings = validateSettingsData(settingsData);
    
    if (JSON.stringify(validatedSettings) !== JSON.stringify(settingsData)) {
      localStorage.setItem('cafeos_settings', JSON.stringify(validatedSettings));
    }
    
    // Save validation timestamp
    localStorage.setItem('last_validation', new Date().toISOString());
    localStorage.setItem('data_version', DATA_VERSION);
    
  } catch (error) {
    console.error('Data validation failed:', error);
    validationResults.orders.valid = false;
    validationResults.orders.errors.push(error.message);
  }
  
  return validationResults;
};

export const runDataMigration = () => {
  const currentVersion = localStorage.getItem('data_version');
  
  if (currentVersion === DATA_VERSION) {
    return { migrated: false, reason: 'Already at latest version' };
  }
  
  if (!currentVersion) {
    // First time or no version - run full validation
    const results = validateAllData();
    return { migrated: true, from: 'none', to: DATA_VERSION, results };
  }
  
  // Future: Add specific migration logic for version upgrades
  return { migrated: false, reason: 'No migration needed' };
};
