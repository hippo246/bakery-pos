/**
 * useThemeSpacing Hook
 * 
 * Provides spacing scale from current theme.
 * Use this for all spacing-related styling.
 */

import { useTheme } from './useTheme';

/**
 * useThemeSpacing hook
 * 
 * @returns {Object} Spacing scale
 */
export function useThemeSpacing() {
  const { theme } = useTheme();
  return theme.spacing;
}

export default useThemeSpacing;
