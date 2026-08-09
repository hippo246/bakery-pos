/**
 * useThemeAnimation Hook
 * 
 * Provides animation settings from current theme.
 * Use this for all animation-related styling.
 */

import { useTheme } from './useTheme';

/**
 * useThemeAnimation hook
 * 
 * @returns {Object} Animation settings
 */
export function useThemeAnimation() {
  const { theme } = useTheme();
  return theme.animation;
}

export default useThemeAnimation;
