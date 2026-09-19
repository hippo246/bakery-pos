import React from 'react';
import { formatCurrency, formatAmount } from '../../domain/money.js';
import { useAppSettings } from '../../hooks/useAppSettings.js';

/**
 * Component to display currency values with proper formatting based on app settings
 * @param {number} amount - The amount to display
 * @param {boolean} showSymbol - Whether to show currency symbol (default: true)
 */
export function CurrencyDisplay({ amount, showSymbol = true }) {
  const settings = useAppSettings();
  
  if (showSymbol) {
    return formatCurrency(amount, settings.currency, settings.numberFormat, settings.decimalPlaces);
  }
  
  return formatAmount(amount, settings.numberFormat, settings.decimalPlaces);
}

/**
 * Hook to get formatted currency string
 */
export function useCurrencyFormatter() {
  const settings = useAppSettings();
  
  return {
    formatCurrency: (amount) => formatCurrency(amount, settings.currency, settings.numberFormat, settings.decimalPlaces),
    formatAmount: (amount) => formatAmount(amount, settings.numberFormat, settings.decimalPlaces),
    currencyCode: settings.currency,
    numberFormat: settings.numberFormat,
    decimalPlaces: settings.decimalPlaces
  };
}
