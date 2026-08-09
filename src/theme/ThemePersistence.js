/**
 * Theme Persistence Service
 * 
 * Handles theme persistence per business in the database.
 * This allows each business to have its own theme preference.
 */

import registry from './ThemeRegistry';

const STORAGE_KEY = 'cafeos-business-theme';
const API_ENDPOINT = '/api/settings/theme';

/**
 * Save theme preference for a business
 * @param {string} businessId - Business ID
 * @param {string} themeId - Theme ID to save
 * @returns {Promise<void>}
 */
export async function saveBusinessTheme(businessId, themeId) {
  if (!registry.has(themeId)) {
    throw new Error(`Theme "${themeId}" not found`);
  }

  // Save to localStorage as fallback
  try {
    localStorage.setItem(`${STORAGE_KEY}-${businessId}`, themeId);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }

  // Save to database
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ businessId, themeId }),
    });

    if (!response.ok) {
      throw new Error('Failed to save theme to database');
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to save theme to database, using localStorage fallback:', error);
    // Return success anyway since localStorage fallback worked
    return { success: true, fallback: true };
  }
}

/**
 * Load theme preference for a business
 * @param {string} businessId - Business ID
 * @returns {Promise<string>} Theme ID
 */
export async function loadBusinessTheme(businessId) {
  // Try database first
  try {
    const response = await fetch(`${API_ENDPOINT}?businessId=${businessId}`);
    if (response.ok) {
      const data = await response.json();
      if (data.themeId && registry.has(data.themeId)) {
        return data.themeId;
      }
    }
  } catch (error) {
    console.warn('Failed to load theme from database:', error);
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${businessId}`);
    if (saved && registry.has(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn('Failed to load theme from localStorage:', error);
  }

  // Return default theme
  return registry.getDefaultThemeId();
}

/**
 * Get theme preference from localStorage only (for immediate UI)
 * @param {string} businessId - Business ID
 * @returns {string|null} Theme ID or null
 */
export function getBusinessThemeFromStorage(businessId) {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}-${businessId}`);
    if (saved && registry.has(saved)) {
      return saved;
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }
  return null;
}

/**
 * Clear theme preference for a business
 * @param {string} businessId - Business ID
 * @returns {Promise<void>}
 */
export async function clearBusinessTheme(businessId) {
  // Clear localStorage
  try {
    localStorage.removeItem(`${STORAGE_KEY}-${businessId}`);
  } catch (error) {
    console.warn('Failed to clear theme from localStorage:', error);
  }

  // Clear from database
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ businessId }),
    });

    if (!response.ok) {
      throw new Error('Failed to clear theme from database');
    }

    return await response.json();
  } catch (error) {
    console.warn('Failed to clear theme from database:', error);
  }
}

export default {
  saveBusinessTheme,
  loadBusinessTheme,
  getBusinessThemeFromStorage,
  clearBusinessTheme,
};
