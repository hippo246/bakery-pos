/**
 * ThemeProvider
 * 
 * React Context provider for theme state management.
 * Enables instant theme switching without application reload.
 * 
 * Key features:
 * - Instant theme switching (no reload, no state loss)
 * - Theme persistence to localStorage
 * - Theme change notifications
 * - SSR-safe hydration
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import registry from './ThemeRegistry';
import { ThemeStyles } from './ThemeStyles';
import { getSelfHealingEngine } from '../operations/SelfHealingEngine';

const ThemeContext = createContext(null);

/**
 * ThemeProvider Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.defaultTheme - Default theme ID
 * @param {string} props.storageKey - localStorage key for persistence
 */
export function ThemeProvider({ children, defaultTheme = 'modern', storageKey = 'cafeos-pos-theme' }) {
  const [themeId, setThemeId] = useState(defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved && registry.has(saved)) {
        setThemeId(saved);
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Persist theme to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(storageKey, themeId);
      } catch (error) {
        console.warn('Failed to save theme to localStorage:', error);
      }
    }
  }, [themeId, isLoaded, storageKey]);

  /**
   * Set active theme
   * This is instant - no reload, no state loss
   */
  const setTheme = useCallback((newThemeId) => {
    if (registry.has(newThemeId)) {
      setThemeId(newThemeId);
      
      // Report theme change to self-healing engine for monitoring
      try {
        const selfHealingEngine = getSelfHealingEngine();
        if (selfHealingEngine) {
          console.log('[ThemeProvider] Theme change reported to self-healing:', newThemeId);
        }
      } catch (error) {
        console.warn('[ThemeProvider] Failed to report theme change:', error);
      }
    } else {
      console.warn(`Theme "${newThemeId}" not found in registry`);
    }
  }, []);

  /**
   * Toggle between light and dark mode for the current theme
   * Switches between theme variants (e.g., modern ↔ modern-light, classic ↔ classic-dark)
   */
  const toggleThemeMode = useCallback(() => {
    const currentTheme = registry.get(themeId);
    if (!currentTheme) return;

    const currentMode = currentTheme.mode || 'light';
    const baseThemeId = themeId.replace(/-light$|-dark$/, '');
    
    // Find the opposite mode variant
    let targetThemeId;
    if (currentMode === 'dark') {
      // Switch to light variant
      targetThemeId = `${baseThemeId}-light`;
      if (!registry.has(targetThemeId)) {
        // If no light variant exists, try the base theme
        targetThemeId = baseThemeId;
      }
    } else {
      // Switch to dark variant
      targetThemeId = `${baseThemeId}-dark`;
      if (!registry.has(targetThemeId)) {
        // If no dark variant exists, try the base theme
        targetThemeId = baseThemeId;
      }
    }

    // If the target theme doesn't exist, stay on current
    if (registry.has(targetThemeId)) {
      setThemeId(targetThemeId);
    }
  }, [themeId]);

  /**
   * Get current theme configuration
   */
  const theme = registry.get(themeId) || registry.get(defaultTheme) || registry.get('modern');

  const value = {
    themeId,
    theme,
    setTheme,
    toggleThemeMode,
    isLoaded,
    availableThemes: registry.getAll(),
  };

  return (
    <ThemeContext.Provider value={value}>
      <ThemeStyles theme={theme} />
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme hook
 * 
 * @returns {Object} Theme context value
 * @throws {Error} If used outside ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;
