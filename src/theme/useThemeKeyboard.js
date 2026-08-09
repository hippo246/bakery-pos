/**
 * useThemeKeyboard Hook
 * 
 * Provides keyboard shortcut configuration from current theme.
 * Use this for keyboard-related functionality.
 */

import { useTheme } from './useTheme';

/**
 * useThemeKeyboard hook
 * 
 * @returns {Object} Keyboard configuration
 */
export function useThemeKeyboard() {
  const { theme } = useTheme();
  return theme.keyboard;
}

export default useThemeKeyboard;
