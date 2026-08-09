/**
 * useThemeTypography Hook
 * 
 * Provides typography settings from current theme.
 * Use this for all font-related styling.
 */

import { useTheme } from './useTheme';

/**
 * useThemeTypography hook
 * 
 * @returns {Object} Typography settings
 */
export function useThemeTypography() {
  const { theme } = useTheme();
  return theme.typography;
}

export default useThemeTypography;
