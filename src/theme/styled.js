/**
 * Theme-Aware Styling Utilities
 * 
 * Helper functions to create theme-aware styles that automatically
 * adapt to the current theme using CSS custom properties.
 * 
 * This allows components to use theme values without importing hooks,
 * making migration easier.
 */

import { useThemeColors, useThemeSpacing, useThemeTypography, useThemeBorderRadius } from './index';

/**
 * Get theme-aware style object
 * @param {Function} styleFn - Function that receives theme values and returns styles
 * @returns {Object} Style object
 */
export function themedStyle(styleFn) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const borderRadius = useThemeBorderRadius();
  
  return styleFn({ colors, spacing, typography, borderRadius });
}

/**
 * Create a themed component style
 * @param {Object} baseStyles - Base styles
 * @param {Function} themeFn - Optional function to add theme-specific styles
 * @returns {Object} Complete style object
 */
export function createThemedStyle(baseStyles = {}, themeFn = null) {
  const colors = useThemeColors();
  const spacing = useThemeSpacing();
  const typography = useThemeTypography();
  const borderRadius = useThemeBorderRadius();
  
  const themeStyles = themeFn ? themeFn({ colors, spacing, typography, borderRadius }) : {};
  
  return { ...baseStyles, ...themeStyles };
}

/**
 * Common theme-aware style presets
 */
export const themedPresets = {
  card: () => {
    const colors = useThemeColors();
    const spacing = useThemeSpacing();
    const borderRadius = useThemeBorderRadius();
    
    return {
      background: colors.backgroundCard,
      border: `1px solid ${colors.border}`,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
    };
  },
  
  button: (variant = 'primary') => {
    const colors = useThemeColors();
    const spacing = useThemeSpacing();
    const typography = useThemeTypography();
    const borderRadius = useThemeBorderRadius();
    
    const variants = {
      primary: {
        background: colors.primary,
        color: '#ffffff',
        border: `1px solid ${colors.primaryDark}`,
      },
      ghost: {
        background: 'transparent',
        color: colors.textSecondary,
        border: `1px solid ${colors.borderLight}`,
      },
      danger: {
        background: colors.dangerBg,
        color: colors.danger,
        border: `1px solid ${colors.dangerBorder}`,
      },
    };
    
    return {
      ...variants[variant],
      padding: `${spacing.md} ${spacing.lg}`,
      borderRadius: borderRadius.md,
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.semibold,
      minHeight: '44px',
      cursor: 'pointer',
    };
  },
  
  input: () => {
    const colors = useThemeColors();
    const spacing = useThemeSpacing();
    const typography = useThemeTypography();
    const borderRadius = useThemeBorderRadius();
    
    return {
      background: colors.backgroundSurface,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: borderRadius.md,
      padding: `${spacing.md} ${spacing.lg}`,
      color: colors.textPrimary,
      fontSize: typography.sizes.base,
      minHeight: '44px',
      outline: 'none',
    };
  },
};

export default themedStyle;
