// GST Constants and Configuration for Indian Bakery POS

// GST Rates for different item categories
export const GST_RATES = {
  RESTAURANT_SERVICE: 0.05,    // 5% for restaurant service (small cafes)
  RESTAURANT_SERVICE_18: 0.18, // 18% for restaurants in hotels with room tariff > ₹7,500
  PACKAGED_FOOD: 0.12,         // 12% for packaged food items
  BEVERAGES: 0.18,            // 18% for beverages
  GENERAL: 0.18                // Default 18% for most items
};

// SAC (Services Accounting Code) for restaurant services
export const SAC_CODES = {
  RESTAURANT_SERVICE: '9963',  // Restaurant services
  CATERING: '996311',         // Outdoor catering
  ROOM_SERVICE: '996312'      // Room service in hotels
};

// HSN (Harmonized System of Nomenclature) codes for goods
export const HSN_CODES = {
  COFFEE: '0901',             // Coffee, whether or not roasted or decaffeinated
  TEA: '0902',                // Tea
  BAKED_GOODS: '1905',        // Bread, pastry, cakes, biscuits
  PACKAGED_FOOD: '2106',      // Food preparations
  BEVERAGES: '2202',          // Waters, including mineral waters and aerated waters
  JUICES: '2009',             // Fruit juices
  DAIRY: '0401',              // Milk and cream
  PACKAGED_SNACKS: '1905'     // Biscuits and similar products
};

// Invoice types for GST
export const INVOICE_TYPES = {
  B2B: 'B2B',                 // Business to Business
  B2C: 'B2C',                 // Business to Consumer
  B2CL: 'B2CL',               // Business to Consumer Large (interstate > ₹2.5L)
  B2CS: 'B2CS',               // Business to Consumer Small
  EXPORT: 'EXPORT',           // Export with payment
  EXPORT_WOP: 'EXPORT_WOP'    // Export without payment
};

// Transaction types for GST
export const TRANSACTION_TYPES = {
  SALE: 'SALE',
  PURCHASE: 'PURCHASE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  CREDIT_NOTE: 'CREDIT_NOTE',
  ADVANCE_RECEIPT: 'ADVANCE_RECEIPT',
  REFUND: 'REFUND'
};

// GSTIN format validation (15 characters: 2 state code + 10 PAN + 3 entity code)
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// State codes for GSTIN (first 2 digits)
export const STATE_CODES = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Dadra and Nagar Haveli and Daman and Diu',
  '26': 'Maharashtra',
  '27': 'Andhra Pradesh',
  '28': 'Karnataka',
  '29': 'Goa',
  '30': 'Lakshadweep',
  '31': 'Kerala',
  '32': 'Tamil Nadu',
  '33': 'Puducherry',
  '34': 'Andaman and Nicobar Islands',
  '35': 'Telangana',
  '36': 'Ladakh'
};

// Turnover thresholds for GST registration
export const GST_THRESHOLDS = {
  REGISTRATION_LIMIT: 4000000,      // ₹40 lakh - mandatory registration
  COMPOSITION_LIMIT: 15000000,      // ₹1.5 crore - composition scheme limit
  E_INVOICE_LIMIT: 50000000,       // ₹5 crore - e-invoice mandatory
  QR_CODE_LIMIT: 50000000          // ₹5 crore - dynamic QR code mandatory
};

// GST return periods
export const RETURN_PERIODS = {
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  ANNUAL: 'ANNUAL'
};

// GSTR-1 filing sections
export const GSTR1_SECTIONS = {
  B2B_INVOICES: 'B2B',
  B2C_LARGE: 'B2CL',
  B2C_SMALL: 'B2CS',
  EXPORTS: 'EXP',
  ADVANCE_RECEIPTS: 'ADV',
  CREDIT_DEBIT_NOTES: 'CDN',
  HSN_SUMMARY: 'HSN'
};

// Tax types
export const TAX_TYPES = {
  CGST: 'CGST',    // Central GST
  SGST: 'SGST',    // State GST
  IGST: 'IGST',    // Integrated GST (interstate)
  CESS: 'CESS'     // Additional cess
};

// E-invoice status
export const EINVOICE_STATUS = {
  GENERATED: 'GENERATED',
  PENDING: 'PENDING',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

// Report frequencies for email scheduling
export const REPORT_FREQUENCIES = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY'
};

// Report types
export const REPORT_TYPES = {
  GSTR1: 'GSTR1',
  GSTR3B: 'GSTR3B',
  GSTR9: 'GSTR9',
  EINVOICE: 'EINVOICE',
  HSN_SAC: 'HSN_SAC',
  TAX_PAYMENT: 'TAX_PAYMENT',
  DISCOUNT_ANALYSIS: 'DISCOUNT_ANALYSIS',
  SERVICE_CHARGE: 'SERVICE_CHARGE',
  MULTI_OUTLET: 'MULTI_OUTLET',
  VENDOR_VALIDATION: 'VENDOR_VALIDATION',
  TURNOVER_TRACKER: 'TURNOVER_TRACKER',
  INVOICE_SEQUENCE: 'INVOICE_SEQUENCE',
  AMENDMENT_LOG: 'AMENDMENT_LOG'
};

// Invoice sequence validation rules
export const INVOICE_SEQUENCE_RULES = {
  MAX_GAP_SIZE: 10,              // Alert if gap > 10 consecutive numbers
  ALLOW_DUPLICATES: false,        // Never allow duplicate invoice numbers
  RESET_PERIOD: 'MONTHLY',        // Reset sequence monthly
  PREFIX_FORMAT: '{BRANCH}-{YYYY-MM}'  // Invoice number prefix format
};

// Service charge configuration
export const SERVICE_CHARGE_CONFIG = {
  DEFAULT_RATE: 0.05,             // 5% default service charge
  IS_TAXABLE: false,              // Service charge is NOT taxable
  IS_MANDATORY: false,            // Service charge is optional
  DISPLAY_SEPARATELY: true        // Must show separately from GST
};

// Discount tax treatment
export const DISCOUNT_TAX_TREATMENT = {
  TAX_ON_DISCOUNTED_PRICE: true,  // GST on discounted price, not MRP
  TRACK_DISCOUNT_IMPACT: true,    // Track how discounts affect taxable value
  SEPARATE_DISCOUNT_LEDGER: true  // Maintain separate discount ledger
};
