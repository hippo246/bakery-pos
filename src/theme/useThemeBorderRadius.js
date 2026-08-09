/**
 * useThemeBorderRadius Hook
 * 
 * Provides border radius scale from current theme.
 * Use this for all border radius-related styling.
 */

import { useTheme } from './useTheme';

/**
 * useThemeBorderRadius hook
 * 
 * @returns {Object} Border radius scale
 */
export function useThemeBorderRadius() {
  const { theme } = useTheme();
  return theme.borderRadius;
}

export default useThemeBorderRadius;
