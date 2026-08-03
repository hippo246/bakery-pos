// Client Configuration Templates for CafeOS
// Pre-built configurations for different business types to enable instant client setup

export const BUSINESS_TEMPLATES = {
  cafe: {
    id: 'cafe',
    name: 'Cafe',
    icon: '☕',
    description: 'Coffee shop with quick service and takeaway options',
    settings: {
      cafeos_business_details: {
        cafeName: '',
        tagline: 'Quality Coffee & More',
        businessType: 'cafe',
        industry: 'food_beverage',
        establishedYear: new Date().getFullYear(),
        website: '',
        socialMedia: {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      },
      cafeos_operating_hours: {
        template: 'cafe_standard',
        hours: {
          monday: { open: '07:00', close: '20:00', enabled: true },
          tuesday: { open: '07:00', close: '20:00', enabled: true },
          wednesday: { open: '07:00', close: '20:00', enabled: true },
          thursday: { open: '07:00', close: '20:00', enabled: true },
          friday: { open: '07:00', close: '21:00', enabled: true },
          saturday: { open: '08:00', close: '21:00', enabled: true },
          sunday: { open: '08:00', close: '19:00', enabled: true }
        }
      },
      cafeos_payment_methods: {
        enabledMethods: ['cash', 'card', 'upi'],
        cardTypes: ['visa', 'mastercard', 'amex'],
        tipsEnabled: true,
        receiptBehavior: 'always',
        emailReceipt: false
      },
      cafeos_tax_config: {
        gstEnabled: true,
        gstRate: 5,
        serviceChargeEnabled: true,
        serviceChargeRate: 10,
        serviceChargeName: 'Service Charge',
        taxMode: 'inclusive'
      },
      cafeos_kitchen_stations: {
        stations: [
          { id: 'bar', name: 'Bar', icon: '🍸', color: '#8b5cf6' },
          { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', color: '#f59e0b' }
        ]
      },
      cafeos_tables_config: {
        areas: [
          { id: 'indoor', name: 'Indoor Seating', tables: [
            { id: 1, number: 1, capacity: 2, shape: 'round', x: 100, y: 100 },
            { id: 2, number: 2, capacity: 2, shape: 'round', x: 200, y: 100 },
            { id: 3, number: 3, capacity: 4, shape: 'square', x: 100, y: 200 },
            { id: 4, number: 4, capacity: 4, shape: 'square', x: 200, y: 200 },
            { id: 5, number: 5, capacity: 6, shape: 'rect', x: 150, y: 300 }
          ]},
          { id: 'outdoor', name: 'Outdoor Seating', tables: [
            { id: 6, number: 6, capacity: 2, shape: 'round', x: 350, y: 100 },
            { id: 7, number: 7, capacity: 4, shape: 'square', x: 350, y: 200 }
          ]}
        ]
      },
      cafeos_staff_roles: {
        roles: [
          { id: 'manager', name: 'Manager', permissions: ['all'] },
          { id: 'barista', name: 'Barista', permissions: ['pos', 'orders'] },
          { id: 'cashier', name: 'Cashier', permissions: ['pos', 'orders', 'payments'] },
          { id: 'server', name: 'Server', permissions: ['pos', 'orders', 'tables'] }
        ]
      },
      cafeos_menu_categories: {
        categories: [
          { id: 'coffee', name: 'Coffee', icon: '☕', order: 1 },
          { id: 'tea', name: 'Tea', icon: '🍵', order: 2 },
          { id: 'pastries', name: 'Pastries', icon: '🥐', order: 3 },
          { id: 'sandwiches', name: 'Sandwiches', icon: '🥪', order: 4 },
          { id: 'beverages', name: 'Other Beverages', icon: '🥤', order: 5 }
        ]
      },
      cafeos_printer_config: {
        kitchenPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9100
        },
        receiptPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9101
        }
      },
      cafeos_order_settings: {
        autoAcceptOrders: false,
        orderTimeoutMinutes: 30,
        allowModifications: true,
        requireTableForDineIn: true
      },
      cafeos_receipt_settings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showTaxBreakdown: true,
        showServiceCharge: true,
        footerMessage: 'Thank you for visiting!'
      }
    }
  },
  
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    description: 'Full-service restaurant with table service',
    settings: {
      cafeos_business_details: {
        cafeName: '',
        tagline: 'Fine Dining Experience',
        businessType: 'restaurant',
        industry: 'food_beverage',
        establishedYear: new Date().getFullYear(),
        website: '',
        socialMedia: {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      },
      cafeos_operating_hours: {
        template: 'restaurant_standard',
        hours: {
          monday: { open: '11:00', close: '22:00', enabled: true },
          tuesday: { open: '11:00', close: '22:00', enabled: true },
          wednesday: { open: '11:00', close: '22:00', enabled: true },
          thursday: { open: '11:00', close: '22:00', enabled: true },
          friday: { open: '11:00', close: '23:00', enabled: true },
          saturday: { open: '10:00', close: '23:00', enabled: true },
          sunday: { open: '10:00', close: '22:00', enabled: true }
        }
      },
      cafeos_payment_methods: {
        enabledMethods: ['cash', 'card', 'upi'],
        cardTypes: ['visa', 'mastercard', 'amex'],
        tipsEnabled: true,
        receiptBehavior: 'always',
        emailReceipt: true
      },
      cafeos_tax_config: {
        gstEnabled: true,
        gstRate: 5,
        serviceChargeEnabled: true,
        serviceChargeRate: 10,
        serviceChargeName: 'Service Charge',
        taxMode: 'inclusive'
      },
      cafeos_kitchen_stations: {
        stations: [
          { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', color: '#f59e0b' },
          { id: 'grill', name: 'Grill Station', icon: '🔥', color: '#ef4444' },
          { id: 'cold', name: 'Cold Station', icon: '❄️', color: '#3b82f6' },
          { id: 'pass', name: 'Pass', icon: '🍽️', color: '#10b981' }
        ]
      },
      cafeos_tables_config: {
        areas: [
          { id: 'main', name: 'Main Dining', tables: [
            { id: 1, number: 1, capacity: 2, shape: 'round', x: 100, y: 100 },
            { id: 2, number: 2, capacity: 2, shape: 'round', x: 200, y: 100 },
            { id: 3, number: 3, capacity: 4, shape: 'square', x: 100, y: 200 },
            { id: 4, number: 4, capacity: 4, shape: 'square', x: 200, y: 200 },
            { id: 5, number: 5, capacity: 6, shape: 'rect', x: 150, y: 300 },
            { id: 6, number: 6, capacity: 8, shape: 'rect', x: 150, y: 400 }
          ]},
          { id: 'private', name: 'Private Dining', tables: [
            { id: 7, number: 7, capacity: 10, shape: 'rect', x: 350, y: 100 },
            { id: 8, number: 8, capacity: 12, shape: 'rect', x: 350, y: 250 }
          ]},
          { id: 'patio', name: 'Patio', tables: [
            { id: 9, number: 9, capacity: 4, shape: 'round', x: 350, y: 400 },
            { id: 10, number: 10, capacity: 4, shape: 'round', x: 450, y: 400 }
          ]}
        ]
      },
      cafeos_staff_roles: {
        roles: [
          { id: 'manager', name: 'Manager', permissions: ['all'] },
          { id: 'host', name: 'Host', permissions: ['tables', 'reservations'] },
          { id: 'server', name: 'Server', permissions: ['pos', 'orders', 'tables', 'payments'] },
          { id: 'kitchen', name: 'Kitchen Staff', permissions: ['kds', 'inventory'] },
          { id: 'bartender', name: 'Bartender', permissions: ['pos', 'orders', 'bar'] }
        ]
      },
      cafeos_menu_categories: {
        categories: [
          { id: 'appetizers', name: 'Appetizers', icon: '🥗', order: 1 },
          { id: 'soups', name: 'Soups & Salads', icon: '🥣', order: 2 },
          { id: 'mains', name: 'Main Courses', icon: '🍝', order: 3 },
          { id: 'grill', name: 'From the Grill', icon: '🥩', order: 4 },
          { id: 'desserts', name: 'Desserts', icon: '🍰', order: 5 },
          { id: 'beverages', name: 'Beverages', icon: '🍷', order: 6 }
        ]
      },
      cafeos_printer_config: {
        kitchenPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9100
        },
        receiptPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9101
        },
        barPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9102
        }
      },
      cafeos_order_settings: {
        autoAcceptOrders: false,
        orderTimeoutMinutes: 45,
        allowModifications: true,
        requireTableForDineIn: true
      },
      cafeos_receipt_settings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showTaxBreakdown: true,
        showServiceCharge: true,
        footerMessage: 'Thank you for dining with us!'
      }
    }
  },
  
  bar: {
    id: 'bar',
    name: 'Bar & Pub',
    icon: '🍺',
    description: 'Bar with pub food and drinks',
    settings: {
      cafeos_business_details: {
        cafeName: '',
        tagline: 'Great Drinks & Good Times',
        businessType: 'bar',
        industry: 'food_beverage',
        establishedYear: new Date().getFullYear(),
        website: '',
        socialMedia: {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      },
      cafeos_operating_hours: {
        template: 'bar_standard',
        hours: {
          monday: { open: '16:00', close: '02:00', enabled: true },
          tuesday: { open: '16:00', close: '02:00', enabled: true },
          wednesday: { open: '16:00', close: '02:00', enabled: true },
          thursday: { open: '16:00', close: '03:00', enabled: true },
          friday: { open: '16:00', close: '03:00', enabled: true },
          saturday: { open: '12:00', close: '03:00', enabled: true },
          sunday: { open: '12:00', close: '00:00', enabled: true }
        }
      },
      cafeos_payment_methods: {
        enabledMethods: ['cash', 'card', 'upi'],
        cardTypes: ['visa', 'mastercard', 'amex'],
        tipsEnabled: true,
        receiptBehavior: 'on_request',
        emailReceipt: false
      },
      cafeos_tax_config: {
        gstEnabled: true,
        gstRate: 5,
        serviceChargeEnabled: true,
        serviceChargeRate: 10,
        serviceChargeName: 'Service Charge',
        taxMode: 'exclusive'
      },
      cafeos_kitchen_stations: {
        stations: [
          { id: 'bar', name: 'Bar', icon: '🍸', color: '#8b5cf6' },
          { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', color: '#f59e0b' }
        ]
      },
      cafeos_tables_config: {
        areas: [
          { id: 'bar_seating', name: 'Bar Seating', tables: [
            { id: 1, number: 1, capacity: 2, shape: 'round', x: 100, y: 100 },
            { id: 2, number: 2, capacity: 2, shape: 'round', x: 200, y: 100 },
            { id: 3, number: 3, capacity: 2, shape: 'round', x: 300, y: 100 }
          ]},
          { id: 'lounge', name: 'Lounge Area', tables: [
            { id: 4, number: 4, capacity: 4, shape: 'square', x: 100, y: 200 },
            { id: 5, number: 5, capacity: 4, shape: 'square', x: 200, y: 200 },
            { id: 6, number: 6, capacity: 6, shape: 'rect', x: 150, y: 300 }
          ]},
          { id: 'outdoor', name: 'Outdoor Patio', tables: [
            { id: 7, number: 7, capacity: 4, shape: 'round', x: 350, y: 100 },
            { id: 8, number: 8, capacity: 4, shape: 'round', x: 350, y: 200 }
          ]}
        ]
      },
      cafeos_staff_roles: {
        roles: [
          { id: 'manager', name: 'Manager', permissions: ['all'] },
          { id: 'bartender', name: 'Bartender', permissions: ['pos', 'orders', 'bar', 'payments'] },
          { id: 'server', name: 'Server', permissions: ['pos', 'orders', 'tables'] },
          { id: 'security', name: 'Security', permissions: ['access_control'] }
        ]
      },
      cafeos_menu_categories: {
        categories: [
          { id: 'cocktails', name: 'Cocktails', icon: '🍸', order: 1 },
          { id: 'beer', name: 'Beer', icon: '🍺', order: 2 },
          { id: 'wine', name: 'Wine', icon: '🍷', order: 3 },
          { id: 'shots', name: 'Shots', icon: '🥃', order: 4 },
          { id: 'food', name: 'Pub Food', icon: '🍔', order: 5 },
          { id: 'non_alcoholic', name: 'Non-Alcoholic', icon: '🥤', order: 6 }
        ]
      },
      cafeos_printer_config: {
        barPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9100
        },
        receiptPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9101
        }
      },
      cafeos_order_settings: {
        autoAcceptOrders: false,
        orderTimeoutMinutes: 30,
        allowModifications: true,
        requireTableForDineIn: false
      },
      cafeos_receipt_settings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showTaxBreakdown: true,
        showServiceCharge: true,
        footerMessage: 'Drink responsibly!'
      }
    }
  },
  
  quick_service: {
    id: 'quick_service',
    name: 'Quick Service',
    icon: '🍔',
    description: 'Fast food and quick service restaurant',
    settings: {
      cafeos_business_details: {
        cafeName: '',
        tagline: 'Fast & Fresh',
        businessType: 'quick_service',
        industry: 'food_beverage',
        establishedYear: new Date().getFullYear(),
        website: '',
        socialMedia: {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      },
      cafeos_operating_hours: {
        template: 'quick_service_standard',
        hours: {
          monday: { open: '10:00', close: '22:00', enabled: true },
          tuesday: { open: '10:00', close: '22:00', enabled: true },
          wednesday: { open: '10:00', close: '22:00', enabled: true },
          thursday: { open: '10:00', close: '22:00', enabled: true },
          friday: { open: '10:00', close: '23:00', enabled: true },
          saturday: { open: '10:00', close: '23:00', enabled: true },
          sunday: { open: '11:00', close: '21:00', enabled: true }
        }
      },
      cafeos_payment_methods: {
        enabledMethods: ['cash', 'card', 'upi'],
        cardTypes: ['visa', 'mastercard'],
        tipsEnabled: false,
        receiptBehavior: 'on_request',
        emailReceipt: false
      },
      cafeos_tax_config: {
        gstEnabled: true,
        gstRate: 5,
        serviceChargeEnabled: false,
        serviceChargeRate: 0,
        serviceChargeName: '',
        taxMode: 'inclusive'
      },
      cafeos_kitchen_stations: {
        stations: [
          { id: 'kitchen', name: 'Kitchen', icon: '👨‍🍳', color: '#f59e0b' },
          { id: 'fry', name: 'Fry Station', icon: '🍟', color: '#f97316' },
          { id: 'assembly', name: 'Assembly', icon: '🍔', color: '#84cc16' }
        ]
      },
      cafeos_tables_config: {
        areas: [
          { id: 'dine_in', name: 'Dine-In', tables: [
            { id: 1, number: 1, capacity: 2, shape: 'square', x: 100, y: 100 },
            { id: 2, number: 2, capacity: 2, shape: 'square', x: 200, y: 100 },
            { id: 3, number: 3, capacity: 4, shape: 'square', x: 100, y: 200 },
            { id: 4, number: 4, capacity: 4, shape: 'square', x: 200, y: 200 },
            { id: 5, number: 5, capacity: 6, shape: 'rect', x: 150, y: 300 }
          ]}
        ]
      },
      cafeos_staff_roles: {
        roles: [
          { id: 'manager', name: 'Manager', permissions: ['all'] },
          { id: 'cashier', name: 'Cashier', permissions: ['pos', 'orders', 'payments'] },
          { id: 'kitchen', name: 'Kitchen Staff', permissions: ['kds', 'inventory'] },
          { id: 'crew', name: 'Crew', permissions: ['pos', 'orders'] }
        ]
      },
      cafeos_menu_categories: {
        categories: [
          { id: 'burgers', name: 'Burgers', icon: '🍔', order: 1 },
          { id: 'fries', name: 'Sides', icon: '🍟', order: 2 },
          { id: 'drinks', name: 'Drinks', icon: '🥤', order: 3 },
          { id: 'desserts', name: 'Desserts', icon: '🍦', order: 4 },
          { id: 'combos', name: 'Combos', icon: '📦', order: 5 }
        ]
      },
      cafeos_printer_config: {
        kitchenPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9100
        },
        receiptPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9101
        }
      },
      cafeos_order_settings: {
        autoAcceptOrders: true,
        orderTimeoutMinutes: 15,
        allowModifications: false,
        requireTableForDineIn: false
      },
      cafeos_receipt_settings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showTaxBreakdown: true,
        showServiceCharge: false,
        footerMessage: 'Thank you for your order!'
      }
    }
  },
  
  bakery: {
    id: 'bakery',
    name: 'Bakery',
    icon: '🥐',
    description: 'Bakery with fresh baked goods and cafe items',
    settings: {
      cafeos_business_details: {
        cafeName: '',
        tagline: 'Fresh Baked Daily',
        businessType: 'bakery',
        industry: 'food_beverage',
        establishedYear: new Date().getFullYear(),
        website: '',
        socialMedia: {
          instagram: '',
          facebook: '',
          twitter: ''
        }
      },
      cafeos_operating_hours: {
        template: 'bakery_standard',
        hours: {
          monday: { open: '07:00', close: '19:00', enabled: true },
          tuesday: { open: '07:00', close: '19:00', enabled: true },
          wednesday: { open: '07:00', close: '19:00', enabled: true },
          thursday: { open: '07:00', close: '19:00', enabled: true },
          friday: { open: '07:00', close: '20:00', enabled: true },
          saturday: { open: '08:00', close: '20:00', enabled: true },
          sunday: { open: '08:00', close: '18:00', enabled: true }
        }
      },
      cafeos_payment_methods: {
        enabledMethods: ['cash', 'card', 'upi'],
        cardTypes: ['visa', 'mastercard'],
        tipsEnabled: true,
        receiptBehavior: 'always',
        emailReceipt: false
      },
      cafeos_tax_config: {
        gstEnabled: true,
        gstRate: 5,
        serviceChargeEnabled: false,
        serviceChargeRate: 0,
        serviceChargeName: '',
        taxMode: 'inclusive'
      },
      cafeos_kitchen_stations: {
        stations: [
          { id: 'bakery', name: 'Bakery', icon: '🥐', color: '#f59e0b' },
          { id: 'decorating', name: 'Decorating', icon: '🎂', color: '#ec4899' }
        ]
      },
      cafeos_tables_config: {
        areas: [
          { id: 'seating', name: 'Seating Area', tables: [
            { id: 1, number: 1, capacity: 2, shape: 'round', x: 100, y: 100 },
            { id: 2, number: 2, capacity: 2, shape: 'round', x: 200, y: 100 },
            { id: 3, number: 3, capacity: 4, shape: 'square', x: 100, y: 200 },
            { id: 4, number: 4, capacity: 4, shape: 'square', x: 200, y: 200 }
          ]}
        ]
      },
      cafeos_staff_roles: {
        roles: [
          { id: 'manager', name: 'Manager', permissions: ['all'] },
          { id: 'baker', name: 'Baker', permissions: ['inventory', 'production'] },
          { id: 'cashier', name: 'Cashier', permissions: ['pos', 'orders', 'payments'] },
          { id: 'server', name: 'Server', permissions: ['pos', 'orders'] }
        ]
      },
      cafeos_menu_categories: {
        categories: [
          { id: 'breads', name: 'Breads', icon: '🍞', order: 1 },
          { id: 'pastries', name: 'Pastries', icon: '🥐', order: 2 },
          { id: 'cakes', name: 'Cakes', icon: '🎂', order: 3 },
          { id: 'cookies', name: 'Cookies', icon: '🍪', order: 4 },
          { id: 'coffee', name: 'Coffee', icon: '☕', order: 5 },
          { id: 'custom', name: 'Custom Orders', icon: '🎁', order: 6 }
        ]
      },
      cafeos_printer_config: {
        receiptPrinter: {
          enabled: true,
          type: 'thermal',
          ip: '',
          port: 9100
        }
      },
      cafeos_order_settings: {
        autoAcceptOrders: false,
        orderTimeoutMinutes: 30,
        allowModifications: true,
        requireTableForDineIn: false
      },
      cafeos_receipt_settings: {
        showLogo: true,
        showAddress: true,
        showPhone: true,
        showTaxBreakdown: true,
        showServiceCharge: false,
        footerMessage: 'Fresh baked goodness!'
      }
    }
  }
};

/**
 * Get template by ID
 */
export function getTemplateById(templateId) {
  return BUSINESS_TEMPLATES[templateId] || null;
}

/**
 * Get all available templates
 */
export function getAllTemplates() {
  return Object.values(BUSINESS_TEMPLATES);
}

/**
 * Apply template to configuration
 */
export function applyTemplate(templateId, clientInfo = {}) {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const config = {
    app: "CafeOS",
    exportType: "fullConfiguration",
    templateId: templateId,
    templateName: template.name,
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    settings: {},
    collections: {}
  };

  // Apply template settings with client info override
  Object.keys(template.settings).forEach(key => {
    config.settings[key] = {
      ...template.settings[key],
      ...clientInfo[key]
    };
  });

  // Override business details with client info
  if (clientInfo.businessName) {
    config.settings.cafeos_business_details.cafeName = clientInfo.businessName;
  }
  if (clientInfo.tagline) {
    config.settings.cafeos_business_details.tagline = clientInfo.tagline;
  }
  if (clientInfo.phone) {
    config.settings.cafeos_business_details.phone = clientInfo.phone;
  }
  if (clientInfo.email) {
    config.settings.cafeos_business_details.email = clientInfo.email;
  }
  if (clientInfo.address) {
    config.settings.cafeos_business_details.address = clientInfo.address;
  }

  // Initialize empty collections
  config.collections = {
    orders: [],
    customers: [],
    menuItems: [],
    inventory: [],
    staff: [],
    suppliers: [],
    tables: [],
    deliveryOrders: [],
    expenses: [],
    kdsCards: []
  };

  return config;
}

/**
 * Validate template compatibility
 */
export function validateTemplate(templateId) {
  const template = getTemplateById(templateId);
  if (!template) {
    return { valid: false, errors: ['Template not found'] };
  }

  const errors = [];
  const warnings = [];

  // Check required settings
  const requiredSettings = [
    'cafeos_business_details',
    'cafeos_operating_hours',
    'cafeos_payment_methods',
    'cafeos_tax_config'
  ];

  requiredSettings.forEach(key => {
    if (!template.settings[key]) {
      errors.push(`Missing required setting: ${key}`);
    }
  });

  // Check hours format
  if (template.settings.cafeos_operating_hours?.hours) {
    Object.values(template.settings.cafeos_operating_hours.hours).forEach(day => {
      if (day.enabled) {
        if (!day.open || !day.close) {
          warnings.push(`Day has missing hours: ${JSON.stringify(day)}`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
