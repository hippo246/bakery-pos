/**
 * Data Validation Utilities
 * Validates data structure and types before use
 */

/**
 * Validate order object structure
 */
export function validateOrder(order) {
  if (!order || typeof order !== 'object') {
    return false;
  }

  // Required fields
  const requiredFields = ['id', 'items', 'total'];
  for (const field of requiredFields) {
    if (!(field in order)) {
      return false;
    }
  }

  // Validate items array
  if (!Array.isArray(order.items)) {
    return false;
  }

  // Validate each item
  for (const item of order.items) {
    if (!item || typeof item !== 'object') {
      return false;
    }
    if (!('name' in item) || !('price' in item)) {
      return false;
    }
  }

  // Validate total is a number
  if (typeof order.total !== 'number' || isNaN(order.total)) {
    return false;
  }

  return true;
}

/**
 * Validate orders array
 */
export function validateOrders(orders) {
  if (!Array.isArray(orders)) {
    return false;
  }

  return orders.every(validateOrder);
}

/**
 * Validate customer object
 */
export function validateCustomer(customer) {
  if (!customer || typeof customer !== 'object') {
    return false;
  }

  // Required fields
  if (!('name' in customer) || !('id' in customer)) {
    return false;
  }

  // Validate name is a non-empty string
  if (typeof customer.name !== 'string' || customer.name.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Validate table object
 */
export function validateTable(table) {
  if (!table || typeof table !== 'object') {
    return false;
  }

  // Required fields
  if (!('id' in table) || !('status' in table)) {
    return false;
  }

  // Validate status is one of the allowed values
  const validStatuses = ['available', 'occupied', 'reserved', 'cleaning'];
  if (!validStatuses.includes(table.status)) {
    return false;
  }

  return true;
}

/**
 * Validate staff object
 */
export function validateStaff(staff) {
  if (!staff || typeof staff !== 'object') {
    return false;
  }

  // Required fields
  if (!('id' in staff) || !('name' in staff)) {
    return false;
  }

  // Validate name is a non-empty string
  if (typeof staff.name !== 'string' || staff.name.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Validate and filter orders from localStorage
 */
export function getValidatedOrders(key = 'cafeos_orders') {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }

    const orders = JSON.parse(data);
    
    if (!Array.isArray(orders)) {
      console.warn(`[Validation] ${key} is not an array`);
      return [];
    }

    // Filter out invalid orders
    const validOrders = orders.filter(validateOrder);
    
    if (validOrders.length !== orders.length) {
      console.warn(`[Validation] Filtered out ${orders.length - validOrders.length} invalid orders from ${key}`);
    }

    return validOrders;
  } catch (error) {
    console.error(`[Validation] Error reading ${key}:`, error);
    return [];
  }
}

/**
 * Validate and filter customers from localStorage
 */
export function getValidatedCustomers(key = 'cafeos_customers') {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }

    const customers = JSON.parse(data);
    
    if (!Array.isArray(customers)) {
      console.warn(`[Validation] ${key} is not an array`);
      return [];
    }

    // Filter out invalid customers
    const validCustomers = customers.filter(validateCustomer);
    
    if (validCustomers.length !== customers.length) {
      console.warn(`[Validation] Filtered out ${customers.length - validCustomers.length} invalid customers from ${key}`);
    }

    return validCustomers;
  } catch (error) {
    console.error(`[Validation] Error reading ${key}:`, error);
    return [];
  }
}

/**
 * Validate and filter tables from localStorage
 */
export function getValidatedTables(key = 'cafeos_tables') {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }

    const tables = JSON.parse(data);
    
    if (!Array.isArray(tables)) {
      console.warn(`[Validation] ${key} is not an array`);
      return [];
    }

    // Filter out invalid tables
    const validTables = tables.filter(validateTable);
    
    if (validTables.length !== tables.length) {
      console.warn(`[Validation] Filtered out ${tables.length - validTables.length} invalid tables from ${key}`);
    }

    return validTables;
  } catch (error) {
    console.error(`[Validation] Error reading ${key}:`, error);
    return [];
  }
}

/**
 * Validate and filter staff from localStorage
 */
export function getValidatedStaff(key = 'cafeos_staff') {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      return [];
    }

    const staff = JSON.parse(data);
    
    if (!Array.isArray(staff)) {
      console.warn(`[Validation] ${key} is not an array`);
      return [];
    }

    // Filter out invalid staff
    const validStaff = staff.filter(validateStaff);
    
    if (validStaff.length !== staff.length) {
      console.warn(`[Validation] Filtered out ${staff.length - validStaff.length} invalid staff from ${key}`);
    }

    return validStaff;
  } catch (error) {
    console.error(`[Validation] Error reading ${key}:`, error);
    return [];
  }
}

/**
 * Generic validator for any data type
 */
export function validateData(data, schema) {
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  // Check required fields
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in data)) {
        return false;
      }
    }
  }

  // Check field types
  if (schema.fields && typeof schema.fields === 'object') {
    for (const [field, type] of Object.entries(schema.fields)) {
      if (field in data) {
        if (type === 'string' && typeof data[field] !== 'string') {
          return false;
        }
        if (type === 'number' && typeof data[field] !== 'number') {
          return false;
        }
        if (type === 'boolean' && typeof data[field] !== 'boolean') {
          return false;
        }
        if (type === 'array' && !Array.isArray(data[field])) {
          return false;
        }
        if (type === 'object' && typeof data[field] !== 'object') {
          return false;
        }
      }
    }
  }

  return true;
}
