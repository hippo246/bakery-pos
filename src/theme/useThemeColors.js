/**
 * useThemeColors Hook
 * 
 * Provides color palette from current theme.
 * Use this for all color-related styling.
 */

import { useTheme } from './useTheme';

/**
 * useThemeColors hook
 * 
 * @returns {Object} Color palette
 */
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export default useThemeColors;
