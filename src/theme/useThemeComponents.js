/**
 * useThemeComponents Hook
 * 
 * Provides component-specific styles from current theme.
 * Use this for styled components that need theme-aware styling.
 */

import { useTheme } from './useTheme';

/**
 * useThemeComponents hook
 * 
 * @returns {Object} Component styles
 */
export function useThemeComponents() {
  const { theme } = useTheme();
  return theme.components;
}

export default useThemeComponents;
