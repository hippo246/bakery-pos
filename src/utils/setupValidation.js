// Setup Validation Engine
// Real-time validation for onboarding with visual feedback

export const VALIDATION_STATUS = {
  VALID: 'valid',
  WARNING: 'warning',
  ERROR: 'error',
  REQUIRED: 'required',
  PENDING: 'pending'
};

export const VALIDATION_ICONS = {
  [VALIDATION_STATUS.VALID]: '✓',
  [VALIDATION_STATUS.WARNING]: '⚠',
  [VALIDATION_STATUS.ERROR]: '❌',
  [VALIDATION_STATUS.REQUIRED]: '○',
  [VALIDATION_STATUS.PENDING]: '○'
};

export const VALIDATION_COLORS = {
  [VALIDATION_STATUS.VALID]: '#10b981',
  [VALIDATION_STATUS.WARNING]: '#f59e0b',
  [VALIDATION_STATUS.ERROR]: '#ef4444',
  [VALIDATION_STATUS.REQUIRED]: '#6b7280',
  [VALIDATION_STATUS.PENDING]: '#9ca3af'
};

// Required fields for setup completion
export const REQUIRED_FIELDS = {
  cafeName: { label: 'Cafe Name', section: 'Business Identity' },
  address: { label: 'Business Address', section: 'Location' },
  country: { label: 'Country', section: 'Location' },
  currency: { label: 'Currency', section: 'Location' },
  timezone: { label: 'Timezone', section: 'Location' },
  phone: { label: 'Phone Number', section: 'Contact Details' },
  operatingHours: { label: 'Operating Hours', section: 'Operating Hours' },
  tables: { label: 'Tables', section: 'Table Configuration' },
  kitchenStations: { label: 'Kitchen Stations', section: 'Kitchen Stations' },
  paymentMethods: { label: 'Payment Methods', section: 'Payment Methods' },
  taxConfiguration: { label: 'Tax Configuration', section: 'Tax Configuration' },
  orderSources: { label: 'Order Sources', section: 'Order Sources' },
  ownerName: { label: 'Owner Account', section: 'Owner Access' }
};

// Validation rules
export const validateField = (fieldName, value, context = {}) => {
  switch (fieldName) {
    case 'cafeName':
      return validateCafeName(value);
    case 'legalName':
      return validateLegalName(value);
    case 'tagline':
      return validateTagline(value);
    case 'phone':
      return validatePhone(value);
    case 'email':
      return validateEmail(value);
    case 'address':
      return validateAddress(value);
    case 'city':
      return validateCity(value);
    case 'state':
      return validateState(value);
    case 'country':
      return validateCountry(value);
    case 'postalCode':
      return validatePostalCode(value);
    case 'gstin':
      return validateGSTIN(value);
    case 'fssaiNumber':
      return validateFSSAI(value);
    case 'businessRegistration':
      return validateBusinessRegistration(value);
    case 'website':
      return validateWebsite(value);
    case 'instagram':
      return validateSocialHandle(value);
    case 'facebook':
      return validateSocialHandle(value);
    case 'whatsapp':
      return validatePhone(value);
    case 'gstRate':
      return validateTaxRate(value);
    case 'serviceChargeRate':
      return validateTaxRate(value);
    case 'openingTime':
      return validateTime(value, context.closingTime);
    case 'closingTime':
      return validateTime(value, context.openingTime, true);
    case 'tableCapacity':
      return validateTableCapacity(value);
    case 'ownerName':
      return validateOwnerName(value);
    case 'ownerEmail':
      return validateEmail(value);
    default:
      return { status: VALIDATION_STATUS.PENDING, message: '' };
  }
};

const validateCafeName = (value) => {
  if (!value || value.trim() === '') {
    return { status: VALIDATION_STATUS.REQUIRED, message: 'Cafe name is required' };
  }
  if (value.trim().length < 2) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Too short (min 2 characters)' };
  }
  if (value.trim().length > 100) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Too long (max 100 characters)' };
  }
  if (!/^[a-zA-Z0-9\s\-&']+$/.test(value)) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Contains special characters' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Looks good' };
};

const validateLegalName = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value.trim().length < 2) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Too short' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateTagline = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value.length > 100) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Too long' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validatePhone = (value) => {
  if (!value) return { status: VALIDATION_STATUS.REQUIRED, message: 'Phone number is required' };
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  if (!phoneRegex.test(value)) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Invalid phone format' };
  }
  const digitsOnly = value.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Too short (min 10 digits)' };
  }
  if (digitsOnly.length > 15) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Too long (max 15 digits)' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid number' };
};

const validateEmail = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Invalid email format' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid email' };
};

const validateAddress = (value) => {
  if (!value || value.trim() === '') {
    return { status: VALIDATION_STATUS.REQUIRED, message: 'Address is required' };
  }
  if (value.trim().length < 5) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Too short' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateCity = (value) => {
  if (!value || value.trim() === '') {
    return { status: VALIDATION_STATUS.REQUIRED, message: 'City is required' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateState = (value) => {
  if (!value || value.trim() === '') {
    return { status: VALIDATION_STATUS.REQUIRED, message: 'State is required' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateCountry = (value) => {
  if (!value) return { status: VALIDATION_STATUS.REQUIRED, message: 'Country is required' };
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validatePostalCode = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value.trim().length < 3) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Too short' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateGSTIN = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(value)) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Invalid GSTIN format' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid GSTIN' };
};

const validateFSSAI = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value.length < 10 || value.length > 14) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Invalid FSSAI length' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateBusinessRegistration = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateWebsite = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  try {
    new URL(value);
    return { status: VALIDATION_STATUS.VALID, message: 'Valid URL' };
  } catch {
    return { status: VALIDATION_STATUS.ERROR, message: 'Invalid URL' };
  }
};

const validateSocialHandle = (value) => {
  if (!value) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value.startsWith('@')) {
    return { status: VALIDATION_STATUS.VALID, message: 'Valid handle' };
  }
  return { status: VALIDATION_STATUS.WARNING, message: 'Should start with @' };
};

const validateTaxRate = (value) => {
  if (value === null || value === undefined) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value < 0) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Cannot be negative' };
  }
  if (value > 100) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Cannot exceed 100%' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid rate' };
};

const validateTime = (value, compareTime = null, isClosing = false) => {
  if (!value) return { status: VALIDATION_STATUS.REQUIRED, message: 'Time is required' };
  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Invalid time format (HH:MM)' };
  }
  
  if (compareTime && isClosing) {
    const [openHour, openMin] = compareTime.split(':').map(Number);
    const [closeHour, closeMin] = value.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    if (closeMinutes <= openMinutes) {
      return { status: VALIDATION_STATUS.ERROR, message: 'Must be after opening time' };
    }
  }
  
  return { status: VALIDATION_STATUS.VALID, message: 'Valid time' };
};

const validateTableCapacity = (value) => {
  if (value === null || value === undefined) return { status: VALIDATION_STATUS.PENDING, message: '' };
  if (value < 1) {
    return { status: VALIDATION_STATUS.ERROR, message: 'Minimum 1 seat' };
  }
  if (value > 20) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Large capacity (max 20)' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

const validateOwnerName = (value) => {
  if (!value || value.trim() === '') {
    return { status: VALIDATION_STATUS.REQUIRED, message: 'Owner name is required' };
  }
  if (value.trim().length < 2) {
    return { status: VALIDATION_STATUS.WARNING, message: 'Too short' };
  }
  return { status: VALIDATION_STATUS.VALID, message: 'Valid' };
};

// Validate entire settings object
export const validateSettings = (settings) => {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  Object.keys(REQUIRED_FIELDS).forEach(field => {
    const fieldConfig = REQUIRED_FIELDS[field];
    const value = settings[field];
    
    if (field === 'paymentMethods') {
      const hasPayment = settings.cashEnabled || settings.upiEnabled || settings.cardEnabled || settings.onlineEnabled;
      if (!hasPayment) {
        errors.push({
          field,
          section: fieldConfig.section,
          message: `At least one payment method is required`
        });
      }
    } else if (field === 'tables') {
      if (!settings.tables || settings.tables.length === 0) {
        errors.push({
          field,
          section: fieldConfig.section,
          message: `At least one table is required`
        });
      }
    } else if (field === 'kitchenStations') {
      if (!settings.kitchenStations || settings.kitchenStations.length === 0) {
        errors.push({ field, section: fieldConfig.section, message: `At least one kitchen station is required` });
      }
    } else if (field === 'operatingHours') {
      if (!settings.operatingHours || Object.keys(settings.operatingHours).length === 0) {
        errors.push({
          field,
          section: fieldConfig.section,
          message: `Operating hours are required`
        });
      } else {
        // Check if at least one day is enabled
        const hasEnabledDay = Object.values(settings.operatingHours).some(day => day.enabled);
        if (!hasEnabledDay) {
          errors.push({
            field,
            section: fieldConfig.section,
            message: `At least one day must be enabled`
          });
        }
      }
    } else if (field === 'taxConfiguration') {
      // Tax configuration is always valid (defaults exist)
    } else if (field === 'orderSources') {
      const hasSource = settings.walkinEnabled || settings.takeawayEnabled || settings.deliveryEnabled;
      if (!hasSource) {
        errors.push({
          field,
          section: fieldConfig.section,
          message: `At least one order source is required`
        });
      }
    } else {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push({
          field,
          section: fieldConfig.section,
          message: `${fieldConfig.label} is required`
        });
      }
    }
  });
  
  // Business rules validation
  if (settings.gstin && settings.gstin.length > 0) {
    const gstinValidation = validateGSTIN(settings.gstin);
    if (gstinValidation.status === VALIDATION_STATUS.ERROR) {
      errors.push({
        field: 'gstin',
        section: 'Legal Information',
        message: gstinValidation.message
      });
    }
  }
  
  if (settings.fssaiNumber && settings.fssaiNumber.length > 0) {
    if (settings.fssaiNumber.length < 10 || settings.fssaiNumber.length > 14) {
      warnings.push({
        field: 'fssaiNumber',
        section: 'Legal Information',
        message: 'FSSAI number may be invalid'
      });
    }
  }
  
  if (settings.email && settings.email.length > 0) {
    const emailValidation = validateEmail(settings.email);
    if (emailValidation.status === VALIDATION_STATUS.ERROR) {
      warnings.push({
        field: 'email',
        section: 'Contact Details',
        message: emailValidation.message
      });
    }
  }
  
  if (settings.website && settings.website.length > 0) {
    try {
      new URL(settings.website);
    } catch {
      warnings.push({
        field: 'website',
        section: 'Contact Details',
        message: 'Website URL may be invalid'
      });
    }
  }
  
  return { errors, warnings };
};

// Check if setup can be completed
export const canCompleteSetup = (settings) => {
  const validation = validateSettings(settings);
  return validation.errors.length === 0;
};

// Get first error section for scrolling
export const getFirstErrorSection = (settings) => {
  const validation = validateSettings(settings);
  if (validation.errors.length === 0) return null;
  return validation.errors[0].section;
};
