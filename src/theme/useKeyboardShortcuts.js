/**
 * useKeyboardShortcuts Hook
 * 
 * Handles keyboard shortcuts based on the current theme's keyboard configuration.
 * Automatically binds and unbinds keyboard event listeners.
 */

import { useEffect, useCallback } from 'react';
import { useTheme } from './useTheme';
import { useThemeKeyboard } from './useThemeKeyboard';

export function useKeyboardShortcuts(actions = {}) {
  const { themeId } = useTheme();
  const keyboard = useThemeKeyboard();

  useEffect(() => {
    if (!keyboard.enabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const key = e.key;
      const isCtrl = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;

      // Build shortcut string
      let shortcut = '';
      if (isCtrl) shortcut += 'Ctrl+';
      if (isAlt) shortcut += 'Alt+';
      if (isShift) shortcut += 'Shift+';
      shortcut += key;

      // Check against theme shortcuts
      Object.entries(keyboard.shortcuts).forEach(([actionName, shortcutKey]) => {
        if (shortcutKey && shortcut === shortcutKey) {
          e.preventDefault();
          if (actions[actionName]) {
            actions[actionName]();
          }
        }
      });

      // Check function keys
      if (key.startsWith('F') && keyboard.functionKeys[key]) {
        e.preventDefault();
        const actionName = keyboard.functionKeys[key];
        if (actions[actionName]) {
          actions[actionName]();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboard, actions, themeId]);

  return { enabled: keyboard.enabled, shortcuts: keyboard.shortcuts, functionKeys: keyboard.functionKeys };
}

export default useKeyboardShortcuts;
