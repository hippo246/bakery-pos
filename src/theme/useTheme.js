/**
 * useTheme Hook
 * 
 * Main hook for accessing theme configuration.
 * Returns the current theme object and theme utilities.
 */

import { useTheme as useThemeContext } from './ThemeProvider';

/**
 * useTheme hook
 * 
 * @returns {Object} Theme context with theme, themeId, setTheme, etc.
 */
export function useTheme() {
  return useThemeContext();
}

export default useTheme;
