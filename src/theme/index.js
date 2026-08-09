/**
 * CafeOS Theme Engine
 * 
 * A production-grade, dynamic theme system that allows instant runtime theme switching
 * without application reload or state loss.
 * 
 * Architecture:
 * - ThemeProvider: React Context provider for theme state
 * - ThemeRegistry: Central registry of all available themes
 * - ThemeContext: React context for theme consumption
 * - Theme hooks: useTheme, useThemeLayout, useThemeColors, etc.
 * - LayoutEngine: Renders different component structures based on theme
 * 
 * Theme switching is instant - no reload, no state loss, no reconnection.
 */

export { ThemeProvider } from './ThemeProvider';
export { ThemeRegistry } from './ThemeRegistry';
export { useTheme } from './useTheme';
export { useThemeLayout } from './useThemeLayout';
export { useThemeColors } from './useThemeColors';
export { useThemeSpacing } from './useThemeSpacing';
export { useThemeTypography } from './useThemeTypography';
export { useThemeAnimation } from './useThemeAnimation';
export { useThemeComponents } from './useThemeComponents';
export { useThemeKeyboard } from './useThemeKeyboard';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useThemeBorderRadius } from './useThemeBorderRadius';
export { themedStyle, createThemedStyle, themedPresets } from './styled';

export { LayoutEngine, LayoutRegion } from './LayoutEngine';

export { default as themes } from './themes';
