/**
 * ThemeStyles Component
 * 
 * Injects CSS custom properties based on the current theme.
 * This enables instant theme switching by updating CSS variables.
 * 
 * Components can use these CSS variables in their styles:
 * - var(--theme-primary)
 * - var(--theme-background)
 * - var(--theme-spacing-md)
 * etc.
 */

import React, { useEffect } from 'react';

export function ThemeStyles({ theme }) {
  useEffect(() => {
    const root = document.documentElement;
    
    // Colors --theme- prefix
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-primary-light', theme.colors.primaryLight);
    root.style.setProperty('--theme-primary-dark', theme.colors.primaryDark);
    root.style.setProperty('--theme-primary-dim', theme.colors.primaryDim);
    root.style.setProperty('--theme-primary-bg', theme.colors.primaryBg);
    root.style.setProperty('--theme-primary-border', theme.colors.primaryBorder);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-background-elevated', theme.colors.backgroundElevated);
    root.style.setProperty('--theme-background-surface', theme.colors.backgroundSurface);
    root.style.setProperty('--theme-background-card', theme.colors.backgroundCard);
    root.style.setProperty('--theme-background-hover', theme.colors.backgroundHover);
    root.style.setProperty('--theme-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--theme-text-tertiary', theme.colors.textTertiary);
    root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
    root.style.setProperty('--theme-success', theme.colors.success);
    root.style.setProperty('--theme-success-bg', theme.colors.successBg);
    root.style.setProperty('--theme-success-border', theme.colors.successBorder);
    root.style.setProperty('--theme-danger', theme.colors.danger);
    root.style.setProperty('--theme-danger-bg', theme.colors.dangerBg);
    root.style.setProperty('--theme-danger-border', theme.colors.dangerBorder);
    root.style.setProperty('--theme-warning', theme.colors.warning);
    root.style.setProperty('--theme-warning-bg', theme.colors.warningBg);
    root.style.setProperty('--theme-warning-border', theme.colors.warningBorder);
    root.style.setProperty('--theme-info', theme.colors.info);
    root.style.setProperty('--theme-info-bg', theme.colors.infoBg);
    root.style.setProperty('--theme-info-border', theme.colors.infoBorder);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-border-light', theme.colors.borderLight);
    root.style.setProperty('--theme-border-focus', theme.colors.borderFocus);
    
    // Colors --cafe- prefix (for backward compatibility with existing components)
    root.style.setProperty('--cafe-accent', theme.colors.primary);
    root.style.setProperty('--cafe-accent-light', theme.colors.primaryLight);
    root.style.setProperty('--cafe-accent-dark', theme.colors.primaryDark);
    root.style.setProperty('--cafe-bg', theme.colors.background);
    root.style.setProperty('--cafe-bg-elevated', theme.colors.backgroundElevated);
    root.style.setProperty('--cafe-bg-surface', theme.colors.backgroundSurface);
    root.style.setProperty('--cafe-bg-card', theme.colors.backgroundCard);
    root.style.setProperty('--cafe-bg-hover', theme.colors.backgroundHover);
    root.style.setProperty('--cafe-text', theme.colors.textPrimary);
    root.style.setProperty('--cafe-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--cafe-text-tertiary', theme.colors.textTertiary);
    root.style.setProperty('--cafe-text-muted', theme.colors.textMuted);
    root.style.setProperty('--cafe-success', theme.colors.success);
    root.style.setProperty('--cafe-success-bg', theme.colors.successBg);
    root.style.setProperty('--cafe-success-border', theme.colors.successBorder);
    root.style.setProperty('--cafe-danger', theme.colors.danger);
    root.style.setProperty('--cafe-danger-bg', theme.colors.dangerBg);
    root.style.setProperty('--cafe-danger-border', theme.colors.dangerBorder);
    root.style.setProperty('--cafe-warning', theme.colors.warning);
    root.style.setProperty('--cafe-warning-bg', theme.colors.warningBg);
    root.style.setProperty('--cafe-warning-border', theme.colors.warningBorder);
    root.style.setProperty('--cafe-info', theme.colors.info);
    root.style.setProperty('--cafe-info-bg', theme.colors.infoBg);
    root.style.setProperty('--cafe-info-border', theme.colors.infoBorder);
    root.style.setProperty('--cafe-border', theme.colors.border);
    root.style.setProperty('--cafe-border-light', theme.colors.borderLight);
    root.style.setProperty('--cafe-border-focus', theme.colors.borderFocus);
    
    // Typography --theme- prefix
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
    root.style.setProperty('--theme-font-family-mono', theme.typography.fontFamilyMono);
    root.style.setProperty('--theme-font-xs', theme.typography.sizes.xs);
    root.style.setProperty('--theme-font-sm', theme.typography.sizes.sm);
    root.style.setProperty('--theme-font-base', theme.typography.sizes.base);
    root.style.setProperty('--theme-font-lg', theme.typography.sizes.lg);
    root.style.setProperty('--theme-font-xl', theme.typography.sizes.xl);
    root.style.setProperty('--theme-font-2xl', theme.typography.sizes['2xl']);
    root.style.setProperty('--theme-font-3xl', theme.typography.sizes['3xl']);
    
    // Spacing --theme- prefix
    root.style.setProperty('--theme-spacing-xs', theme.spacing.xs);
    root.style.setProperty('--theme-spacing-sm', theme.spacing.sm);
    root.style.setProperty('--theme-spacing-md', theme.spacing.md);
    root.style.setProperty('--theme-spacing-lg', theme.spacing.lg);
    root.style.setProperty('--theme-spacing-xl', theme.spacing.xl);
    root.style.setProperty('--theme-spacing-2xl', theme.spacing['2xl']);
    root.style.setProperty('--theme-spacing-3xl', theme.spacing['3xl']);
    root.style.setProperty('--theme-spacing-4xl', theme.spacing['4xl']);
    
    // Border Radius --theme- prefix
    root.style.setProperty('--theme-radius-none', theme.borderRadius.none);
    root.style.setProperty('--theme-radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--theme-radius-md', theme.borderRadius.md);
    root.style.setProperty('--theme-radius-lg', theme.borderRadius.lg);
    root.style.setProperty('--theme-radius-xl', theme.borderRadius.xl);
    root.style.setProperty('--theme-radius-2xl', theme.borderRadius['2xl']);
    root.style.setProperty('--theme-radius-full', theme.borderRadius.full);
    
    // Border Radius --cafe- prefix (for backward compatibility)
    root.style.setProperty('--cafe-radius-none', theme.borderRadius.none);
    root.style.setProperty('--cafe-radius-sm', theme.borderRadius.sm);
    root.style.setProperty('--cafe-radius-md', theme.borderRadius.md);
    root.style.setProperty('--cafe-radius-lg', theme.borderRadius.lg);
    root.style.setProperty('--cafe-radius-xl', theme.borderRadius.xl);
    root.style.setProperty('--cafe-radius-2xl', theme.borderRadius['2xl']);
    root.style.setProperty('--cafe-radius-full', theme.borderRadius.full);
    
    // Shadows --theme- prefix
    root.style.setProperty('--theme-shadow-sm', theme.colors.shadowSm);
    root.style.setProperty('--theme-shadow-md', theme.colors.shadowMd);
    root.style.setProperty('--theme-shadow-lg', theme.colors.shadowLg);
    root.style.setProperty('--theme-shadow-glow', theme.colors.shadowGlow);
    
    // Animation --theme- prefix
    root.style.setProperty('--theme-duration', theme.animation.duration);
    root.style.setProperty('--theme-easing', theme.animation.easing);
    
    // Layout grid --theme- prefix
    root.style.setProperty('--theme-grid-desktop', theme.layout.grid.desktop);
    root.style.setProperty('--theme-grid-tablet', theme.layout.grid.tablet);
    root.style.setProperty('--theme-grid-mobile', theme.layout.grid.mobile);

    // Payment UI tokens — derived from existing theme colors so they work on ALL themes
    // These are the canonical variables every payment component must use
    root.style.setProperty('--theme-payment-surface', theme.colors.backgroundCard);
    root.style.setProperty('--theme-payment-surface-elevated', theme.colors.backgroundElevated);
    root.style.setProperty('--theme-payment-border', theme.colors.border);
    root.style.setProperty('--theme-payment-selected-bg', theme.colors.primaryBg);
    root.style.setProperty('--theme-payment-selected-border', theme.colors.primaryBorder);
    root.style.setProperty('--theme-payment-selected-glow', theme.colors.shadowGlow);
    root.style.setProperty('--theme-payment-text', theme.colors.textPrimary);
    root.style.setProperty('--theme-payment-subtext', theme.colors.textSecondary);
    root.style.setProperty('--theme-payment-muted', theme.colors.textMuted);
    root.style.setProperty('--theme-payment-overlay', theme.components?.modal?.overlay?.background || 'rgba(0,0,0,0.6)');
    root.style.setProperty('--theme-payment-modal-bg', theme.components?.modal?.content?.background || theme.colors.backgroundCard);
    root.style.setProperty('--theme-payment-modal-border', theme.colors.border);
    root.style.setProperty('--theme-payment-modal-radius', theme.borderRadius.xl);
    root.style.setProperty('--theme-payment-modal-shadow', theme.colors.shadowLg);
    root.style.setProperty('--theme-payment-accent', theme.colors.primary);
    root.style.setProperty('--theme-payment-accent-bg', theme.colors.primaryBg);
    root.style.setProperty('--theme-payment-success', theme.colors.success);
    root.style.setProperty('--theme-payment-success-bg', theme.colors.successBg);
    root.style.setProperty('--theme-payment-danger', theme.colors.danger);
    root.style.setProperty('--theme-payment-danger-bg', theme.colors.dangerBg);
    
  }, [theme]);

  return null;
}

export default ThemeStyles;
