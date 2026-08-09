/**
 * useThemeLayout Hook
 * 
 * Provides layout-specific theme values.
 * Use this for grid layouts, panel positions, and responsive configurations.
 */

import { useTheme } from './useTheme';

/**
 * useThemeLayout hook
 * 
 * @returns {Object} Layout configuration
 * @returns {string} return.mode - Layout mode
 * @returns {Object} return.grid - Grid configuration
 * @returns {Object} return.panels - Panel configurations
 */
export function useThemeLayout() {
  const { theme } = useTheme();
  return theme.layout;
}

export default useThemeLayout;
