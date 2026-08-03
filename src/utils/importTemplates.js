// Import Templates for CafeOS
// Defines CSV templates and validation schemas for module imports

/**
 * Menu Item Import Template
 */
export const menuItemTemplate = {
  headers: ['name', 'category', 'price', 'cost', 'description', 'active', 'eightySix', 'dietaryTags', 'allergens', 'prepTime'],
  schema: {
    name: { type: 'string', required: true },
    category: { type: 'string', required: true },
    price: { type: 'number', required: true, min: 0 },
    cost: { type: 'number', required: false, min: 0 },
    description: { type: 'string', required: false },
    active: { type: 'boolean', required: false },
    eightySix: { type: 'boolean', required: false },
    dietaryTags: { type: 'array', required: false },
    allergens: { type: 'array', required: false },
    prepTime: { type: 'integer', required: false, min: 0 }
  },
  example: [
    {
      name: 'Espresso',
      category: 'Beverages',
      price: 80,
      cost: 30,
      description: 'Single shot espresso',
      active: true,
      eightySix: false,
      dietaryTags: 'vegetarian',
      allergens: '',
      prepTime: 3
    },
    {
      name: 'Cappuccino',
      category: 'Beverages',
      price: 120,
      cost: 45,
      description: 'Espresso with steamed milk and foam',
      active: true,
      eightySix: false,
      dietaryTags: 'vegetarian',
      allergens: 'dairy',
      prepTime: 5
    }
  ]
};

/**
 * Customer Import Template
 */
export const customerTemplate = {
  headers: ['name', 'phone', 'email', 'address', 'notes', 'vip'],
  schema: {
    name: { type: 'string', required: true },
    phone: { type: 'phone', required: false },
    email: { type: 'email', required: false },
    address: { type: 'string', required: false },
    notes: { type: 'string', required: false },
    vip: { type: 'boolean', required: false }
  },
  example: [
    {
      name: 'John Doe',
      phone: '+91 9876543210',
      email: 'john@example.com',
      address: '123 Main Street',
      notes: 'Prefers window seating',
      vip: true
    },
    {
      name: 'Jane Smith',
      phone: '+91 9876543211',
      email: 'jane@example.com',
      address: '456 Oak Avenue',
      notes: '',
      vip: false
    }
  ]
};

/**
 * Supplier Import Template
 */
export const supplierTemplate = {
  headers: ['name', 'phone', 'email', 'address', 'contactPerson', 'notes'],
  schema: {
    name: { type: 'string', required: true },
    phone: { type: 'phone', required: false },
    email: { type: 'email', required: false },
    address: { type: 'string', required: false },
    contactPerson: { type: 'string', required: false },
    notes: { type: 'string', required: false }
  },
  example: [
    {
      name: 'Coffee Beans Co',
      phone: '+91 9876543220',
      email: 'orders@coffeebeans.co',
      address: '789 Industrial Area',
      contactPerson: 'Raj Kumar',
      notes: 'Primary coffee supplier'
    },
    {
      name: 'Fresh Dairy Ltd',
      phone: '+91 9876543221',
      email: 'supply@freshdairy.com',
      address: '321 Dairy Road',
      contactPerson: 'Priya Singh',
      notes: 'Milk and cream supplier'
    }
  ]
};

/**
 * Inventory Import Template
 */
export const inventoryTemplate = {
  headers: ['name', 'sku', 'quantity', 'unit', 'minStock', 'maxStock', 'category', 'supplier', 'costPerUnit'],
  schema: {
    name: { type: 'string', required: true },
    sku: { type: 'string', required: false },
    quantity: { type: 'number', required: true, min: 0 },
    unit: { type: 'string', required: true },
    minStock: { type: 'number', required: false, min: 0 },
    maxStock: { type: 'number', required: false, min: 0 },
    category: { type: 'string', required: false },
    supplier: { type: 'string', required: false },
    costPerUnit: { type: 'number', required: false, min: 0 }
  },
  example: [
    {
      name: 'Coffee Beans - Arabica',
      sku: 'COF-001',
      quantity: 50,
      unit: 'kg',
      minStock: 10,
      maxStock: 100,
      category: 'Beverages',
      supplier: 'Coffee Beans Co',
      costPerUnit: 450
    },
    {
      name: 'Whole Milk',
      sku: 'DAI-001',
      quantity: 20,
      unit: 'liters',
      minStock: 5,
      maxStock: 50,
      category: 'Dairy',
      supplier: 'Fresh Dairy Ltd',
      costPerUnit: 60
    }
  ]
};

/**
 * Get template by module name
 */
export function getTemplate(moduleName) {
  const templates = {
    menuItems: menuItemTemplate,
    customers: customerTemplate,
    suppliers: supplierTemplate,
    inventory: inventoryTemplate
  };

  return templates[moduleName] || null;
}

/**
 * Generate CSV template string for download
 */
export function generateTemplateCSV(moduleName) {
  const template = getTemplate(moduleName);
  if (!template) return null;

  const headers = template.headers.join(',');
  const exampleRows = template.example.map(row => {
    return template.headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (Array.isArray(value)) return value.join(',');
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return String(value);
    }).join(',');
  });

  return [headers, ...exampleRows].join('\n');
}

/**
 * Download template CSV file
 */
export function downloadTemplateCSV(moduleName) {
  const csv = generateTemplateCSV(moduleName);
  if (!csv) return;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `CafeOS-${moduleName}-template.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default {
  menuItemTemplate,
  customerTemplate,
  supplierTemplate,
  inventoryTemplate,
  getTemplate,
  generateTemplateCSV,
  downloadTemplateCSV
};
