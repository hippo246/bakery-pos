// Date Range Utilities for Analytics & Reports
// Handles date presets, comparison periods, and timezone-aware calculations

const isValidDate = (dt) => dt instanceof Date && !isNaN(dt.getTime());

export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValidDate(value) ? value : null;
  const dt = new Date(value);
  return isValidDate(dt) ? dt : null;
};

const startOfDay = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday = 0
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = startOfWeek(d);
  if (!result) return null;
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfMonth = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfQuarter = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  const month = result.getMonth();
  const quarterStart = Math.floor(month / 3) * 3;
  result.setMonth(quarterStart, 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfQuarter = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = startOfQuarter(d);
  if (!result) return null;
  result.setMonth(result.getMonth() + 3, 0);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfYear = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfYear = (date) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
};

const addDays = (date, days) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

const addWeeks = (date, weeks) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setDate(result.getDate() + (weeks * 7));
  return result;
};

const addMonths = (date, months) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addYears = (date, years) => {
  const d = parseDate(date);
  if (!d) return null;
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

// Date Range Presets
export const DATE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_WEEK: 'this_week',
  LAST_WEEK: 'last_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  LAST_QUARTER: 'last_quarter',
  THIS_YEAR: 'this_year',
  LAST_YEAR: 'last_year',
  CUSTOM: 'custom'
};

export const DATE_PRESET_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7_days: 'Last 7 Days',
  last_30_days: 'Last 30 Days',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  last_quarter: 'Last Quarter',
  this_year: 'This Year',
  last_year: 'Last Year',
  custom: 'Custom Range'
};

// Get date range for a preset
export const getDateRangeForPreset = (preset, customStart = null, customEnd = null) => {
  const now = new Date();
  
  switch (preset) {
    case DATE_PRESETS.TODAY:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: DATE_PRESET_LABELS.today
      };
    
    case DATE_PRESETS.YESTERDAY:
      return {
        start: startOfDay(addDays(now, -1)),
        end: endOfDay(addDays(now, -1)),
        label: DATE_PRESET_LABELS.yesterday
      };
    
    case DATE_PRESETS.LAST_7_DAYS:
      return {
        start: startOfDay(addDays(now, -6)),
        end: endOfDay(now),
        label: DATE_PRESET_LABELS.last_7_days
      };
    
    case DATE_PRESETS.LAST_30_DAYS:
      return {
        start: startOfDay(addDays(now, -29)),
        end: endOfDay(now),
        label: DATE_PRESET_LABELS.last_30_days
      };
    
    case DATE_PRESETS.THIS_WEEK:
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
        label: DATE_PRESET_LABELS.this_week
      };
    
    case DATE_PRESETS.LAST_WEEK:
      return {
        start: startOfWeek(addWeeks(now, -1)),
        end: endOfWeek(addWeeks(now, -1)),
        label: DATE_PRESET_LABELS.last_week
      };
    
    case DATE_PRESETS.THIS_MONTH:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: DATE_PRESET_LABELS.this_month
      };
    
    case DATE_PRESETS.LAST_MONTH:
      return {
        start: startOfMonth(addMonths(now, -1)),
        end: endOfMonth(addMonths(now, -1)),
        label: DATE_PRESET_LABELS.last_month
      };
    
    case DATE_PRESETS.THIS_QUARTER:
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
        label: DATE_PRESET_LABELS.this_quarter
      };
    
    case DATE_PRESETS.LAST_QUARTER:
      return {
        start: startOfQuarter(addMonths(now, -3)),
        end: endOfQuarter(addMonths(now, -3)),
        label: DATE_PRESET_LABELS.last_quarter
      };
    
    case DATE_PRESETS.THIS_YEAR:
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: DATE_PRESET_LABELS.this_year
      };
    
    case DATE_PRESETS.LAST_YEAR:
      return {
        start: startOfYear(addYears(now, -1)),
        end: endOfYear(addYears(now, -1)),
        label: DATE_PRESET_LABELS.last_year
      };
    
    case DATE_PRESETS.CUSTOM: {
      const start = parseDate(customStart);
      const end = parseDate(customEnd);
      if (!start || !end) {
        return {
          start: startOfDay(now),
          end: endOfDay(now),
          label: DATE_PRESET_LABELS.today
        };
      }
      return {
        start: startOfDay(start),
        end: endOfDay(end),
        label: `${formatDate(start)} - ${formatDate(end)}`
      };
    }
    
    default:
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: DATE_PRESET_LABELS.today
      };
  }
};

// Comparison Period Options
export const COMPARISON_PERIODS = {
  PREVIOUS_PERIOD: 'previous_period',
  PREVIOUS_WEEK: 'previous_week',
  PREVIOUS_MONTH: 'previous_month',
  PREVIOUS_YEAR: 'previous_year',
  SAME_PERIOD_LAST_YEAR: 'same_period_last_year',
  NONE: 'none'
};

export const COMPARISON_PERIOD_LABELS = {
  previous_period: 'Previous Period',
  previous_week: 'Previous Week',
  previous_month: 'Previous Month',
  previous_year: 'Previous Year',
  same_period_last_year: 'Same Period Last Year',
  none: 'No Comparison'
};

// Get comparison date range
export const getComparisonRange = (currentRange, comparisonType) => {
  if (comparisonType === COMPARISON_PERIODS.NONE) {
    return null;
  }
  
  const currentStart = parseDate(currentRange.start);
  const currentEnd = parseDate(currentRange.end);
  
  if (!currentStart || !currentEnd) {
    return null;
  }
  
  const duration = currentEnd.getTime() - currentStart.getTime();
  
  switch (comparisonType) {
    case COMPARISON_PERIODS.PREVIOUS_PERIOD:
      return {
        start: addDays(currentStart, -Math.ceil(duration / (1000 * 60 * 60 * 24))),
        end: currentStart,
        label: COMPARISON_PERIOD_LABELS.previous_period
      };
    
    case COMPARISON_PERIODS.PREVIOUS_WEEK:
      return {
        start: startOfWeek(addWeeks(currentStart, -1)),
        end: endOfWeek(addWeeks(currentStart, -1)),
        label: COMPARISON_PERIOD_LABELS.previous_week
      };
    
    case COMPARISON_PERIODS.PREVIOUS_MONTH:
      return {
        start: startOfMonth(addMonths(currentStart, -1)),
        end: endOfMonth(addMonths(currentStart, -1)),
        label: COMPARISON_PERIOD_LABELS.previous_month
      };
    
    case COMPARISON_PERIODS.PREVIOUS_YEAR:
      return {
        start: startOfYear(addYears(currentStart, -1)),
        end: endOfYear(addYears(currentStart, -1)),
        label: COMPARISON_PERIOD_LABELS.previous_year
      };
    
    case COMPARISON_PERIODS.SAME_PERIOD_LAST_YEAR:
      return {
        start: addYears(currentStart, -1),
        end: addYears(currentEnd, -1),
        label: COMPARISON_PERIOD_LABELS.same_period_last_year
      };
    
    default:
      return null;
  }
};

// Check if a date falls within a range (inclusive)
export const isDateInRange = (date, range) => {
  const d = parseDate(date);
  const start = parseDate(range.start);
  const end = parseDate(range.end);
  
  if (!d || !start || !end) return false;
  
  return d >= start && d <= end;
};

// Format date for display
export const formatDate = (date, format = 'short') => {
  const d = parseDate(date);
  if (!d) return '';
  
  if (format === 'short') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  
  if (format === 'time') {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }
  
  if (format === 'datetime') {
    return d.toLocaleString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toISOString();
};

// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) {
    return current === 0 ? 0 : null; // No comparison from zero
  }
  
  return ((current - previous) / previous) * 100;
};

// Format percentage change for display
export const formatPercentageChange = (current, previous) => {
  const change = calculatePercentageChange(current, previous);
  
  if (change === null) {
    return { value: 'N/A', direction: 'neutral', label: 'No comparison data' };
  }
  
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  const value = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  
  return { value, direction, label: `${direction === 'up' ? 'increase' : direction === 'down' ? 'decrease' : 'no change'}` };
};

// Get days between two dates
export const getDaysBetween = (start, end) => {
  const s = parseDate(start);
  const e = parseDate(end);
  
  if (!s || !e) return 0;
  
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
};

// Validate date range
export const validateDateRange = (start, end) => {
  const s = parseDate(start);
  const e = parseDate(end);
  
  if (!s || !e) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (s > e) {
    return { valid: false, error: 'Start date must be before end date' };
  }
  
  // Prevent ranges that are too large (e.g., more than 5 years)
  const maxDays = 365 * 5;
  const days = getDaysBetween(s, e);
  
  if (days > maxDays) {
    return { valid: false, error: 'Date range too large (maximum 5 years)' };
  }
  
  return { valid: true };
};

export default {
  isValidDate,
  parseDate,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  getDateRangeForPreset,
  COMPARISON_PERIODS,
  COMPARISON_PERIOD_LABELS,
  getComparisonRange,
  isDateInRange,
  formatDate,
  calculatePercentageChange,
  formatPercentageChange,
  getDaysBetween,
  validateDateRange
};
