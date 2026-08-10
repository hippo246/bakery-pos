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
import { alpha, chooseReadableText, getThemeMode, tint } from './themeColorUtils';

export function ThemeStyles({ theme }) {
  useEffect(() => {
    const root = document.documentElement;
    const mode = getThemeMode(theme);
    const onPrimary = chooseReadableText(theme.colors.primary, '#1a1208', '#ffffff');
    const purple = mode === 'dark' ? '#c084fc' : '#7c3aed';
    const neutralBg = mode === 'dark' ? theme.colors.backgroundSurface : theme.colors.backgroundElevated;
    
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
    root.style.setProperty('--cafe-accent-dim', theme.colors.primaryDim);
    root.style.setProperty('--cafe-accent-bg', theme.colors.primaryBg);
    root.style.setProperty('--cafe-accent-border', theme.colors.primaryBorder);
    root.style.setProperty('--cafe-bg', theme.colors.background);
    root.style.setProperty('--cafe-bg-elevated', theme.colors.backgroundElevated);
    root.style.setProperty('--cafe-bg-surface', theme.colors.backgroundSurface);
    root.style.setProperty('--cafe-bg-card', theme.colors.backgroundCard);
    root.style.setProperty('--cafe-bg-hover', theme.colors.backgroundHover);
    root.style.setProperty('--cafe-bg-primary', theme.colors.background);
    root.style.setProperty('--cafe-bg-secondary', theme.colors.backgroundSurface);
    root.style.setProperty('--cafe-text', theme.colors.textPrimary);
    root.style.setProperty('--cafe-text-primary', theme.colors.textPrimary);
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
    root.style.setProperty('--cafe-shadow-sm', theme.colors.shadowSm);
    root.style.setProperty('--cafe-shadow-md', theme.colors.shadowMd);
    root.style.setProperty('--cafe-shadow-lg', theme.colors.shadowLg);
    root.style.setProperty('--cafe-shadow-glow', theme.colors.shadowGlow);
    
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
    root.style.setProperty('--cafe-font-family', theme.typography.fontFamily);
    root.style.setProperty('--cafe-font-family-mono', theme.typography.fontFamilyMono);
    root.style.setProperty('--cafe-font-xs', theme.typography.sizes.xs);
    root.style.setProperty('--cafe-font-sm', theme.typography.sizes.sm);
    root.style.setProperty('--cafe-font-base', theme.typography.sizes.base);
    root.style.setProperty('--cafe-font-lg', theme.typography.sizes.lg);
    root.style.setProperty('--cafe-font-xl', theme.typography.sizes.xl);
    root.style.setProperty('--cafe-font-2xl', theme.typography.sizes['2xl']);
    root.style.setProperty('--cafe-font-3xl', theme.typography.sizes['3xl']);
    
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

    // Legacy semantic/status tokens used across older inline-style components.
    root.style.setProperty('--c-bg', theme.colors.background);
    root.style.setProperty('--c-bg2', theme.colors.backgroundElevated);
    root.style.setProperty('--c-bg3', theme.colors.backgroundSurface);
    root.style.setProperty('--c-bg4', theme.colors.backgroundCard);
    root.style.setProperty('--c-amber', theme.colors.primary);
    root.style.setProperty('--c-amber2', mode === 'dark' ? theme.colors.primaryLight : theme.colors.primaryDark);
    root.style.setProperty('--c-amber3', mode === 'dark' ? theme.colors.primaryDark : theme.colors.primaryLight);
    root.style.setProperty('--c-amber-dim', theme.colors.primaryDim);
    root.style.setProperty('--c-text', theme.colors.textPrimary);
    root.style.setProperty('--c-text2', theme.colors.textSecondary);
    root.style.setProperty('--c-text3', theme.colors.textTertiary);
    root.style.setProperty('--c-green', theme.colors.success);
    root.style.setProperty('--c-red', theme.colors.danger);
    root.style.setProperty('--c-blue', theme.colors.info);
    root.style.setProperty('--c-purple', purple);
    root.style.setProperty('--c-warning', theme.colors.warning);
    root.style.setProperty('--c-border', theme.colors.border);
    root.style.setProperty('--c-border2', theme.colors.borderLight);
    root.style.setProperty('--c-red-bg', theme.colors.dangerBg);
    root.style.setProperty('--c-red-border', theme.colors.dangerBorder);
    root.style.setProperty('--c-green-bg', theme.colors.successBg);
    root.style.setProperty('--c-green-border', theme.colors.successBorder);
    root.style.setProperty('--c-amber-bg', theme.colors.primaryBg);
    root.style.setProperty('--c-amber-border', theme.colors.primaryBorder);
    root.style.setProperty('--c-blue-bg', theme.colors.infoBg);
    root.style.setProperty('--c-blue-border', theme.colors.infoBorder);
    root.style.setProperty('--c-purple-bg', alpha(purple, mode === 'dark' ? 0.14 : 0.1));
    root.style.setProperty('--c-purple-border', alpha(purple, mode === 'dark' ? 0.36 : 0.24));
    root.style.setProperty('--c-neutral-bg', neutralBg);
    root.style.setProperty('--c-on-amber2', onPrimary);
    root.style.setProperty('--c-on-amber3', chooseReadableText(theme.colors.primaryLight, '#1a1208', '#ffffff'));
    root.style.setProperty('--c-warning-bg', theme.colors.warningBg);
    root.style.setProperty('--c-warning-border', theme.colors.warningBorder);
    root.style.setProperty('--c-muted-red', tint(theme.colors.danger, mode === 'dark' ? 0.08 : 0.18));
    root.style.setProperty('--c-danger-bg', theme.colors.dangerBg);
    root.style.setProperty('--c-success-bg', theme.colors.successBg);
    root.style.setProperty(
      '--c-banner-gradient',
      `linear-gradient(135deg, ${alpha(theme.colors.success, mode === 'dark' ? 0.18 : 0.12)} 0%, ${alpha(theme.colors.info, mode === 'dark' ? 0.18 : 0.12)} 100%)`
    );
    root.style.setProperty('--cafe-status-new', theme.colors.info);
    root.style.setProperty('--cafe-status-prep', theme.colors.warning);
    root.style.setProperty('--cafe-status-ready', theme.colors.success);
    root.style.setProperty('--cafe-status-completed', theme.colors.textTertiary);
    root.style.setProperty('--cafe-status-cancelled', theme.colors.danger);

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

    // ── TIER COLORS (Loyalty program badges) ────────────────────────────────────
    const tierBronze  = mode === 'dark' ? '#CD7F32' : '#B87333';
    const tierSilver  = mode === 'dark' ? '#C0C0C0' : '#9E9E9E';
    const tierGold    = mode === 'dark' ? '#E8A020' : '#D4A017';
    const tierPlatinum= mode === 'dark' ? '#4AD9D9' : '#20B2AA';

    root.style.setProperty('--tier-bronze-bg',      mode === 'dark' ? '#2a1a08' : '#FBF0E3');
    root.style.setProperty('--tier-bronze-color',   tierBronze);
    root.style.setProperty('--tier-bronze-glow',    alpha(tierBronze, mode === 'dark' ? 0.30 : 0.22));
    root.style.setProperty('--tier-silver-bg',      mode === 'dark' ? '#1e1e1e' : '#F5F5F5');
    root.style.setProperty('--tier-silver-color',   tierSilver);
    root.style.setProperty('--tier-silver-glow',    alpha(tierSilver, mode === 'dark' ? 0.22 : 0.18));
    root.style.setProperty('--tier-gold-bg',        mode === 'dark' ? '#2a2008' : '#FEF5E0');
    root.style.setProperty('--tier-gold-color',     tierGold);
    root.style.setProperty('--tier-gold-glow',      alpha(tierGold, mode === 'dark' ? 0.30 : 0.22));
    root.style.setProperty('--tier-platinum-bg',    mode === 'dark' ? '#0a1a1a' : '#E0F7F7');
    root.style.setProperty('--tier-platinum-color', tierPlatinum);
    root.style.setProperty('--tier-platinum-glow',  alpha(tierPlatinum, mode === 'dark' ? 0.30 : 0.22));

    // ── STATUS COLORS (Order lifecycle badges) ──────────────────────────────────
    root.style.setProperty('--status-new-bg',        alpha(theme.colors.info, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--status-new-border',    alpha(theme.colors.info, mode === 'dark' ? 0.36 : 0.28));
    root.style.setProperty('--status-new-color',     theme.colors.info);
    root.style.setProperty('--status-accepted-bg',   alpha(purple, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--status-accepted-border', alpha(purple, mode === 'dark' ? 0.36 : 0.28));
    root.style.setProperty('--status-accepted-color', purple);
    root.style.setProperty('--status-preparing-bg',  alpha(theme.colors.warning, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--status-preparing-border', alpha(theme.colors.warning, mode === 'dark' ? 0.36 : 0.28));
    root.style.setProperty('--status-preparing-color', theme.colors.warning);
    root.style.setProperty('--status-ready-bg',      alpha(theme.colors.success, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--status-ready-border',  alpha(theme.colors.success, mode === 'dark' ? 0.36 : 0.28));
    root.style.setProperty('--status-ready-color',   theme.colors.success);
    root.style.setProperty('--status-completed-bg',  alpha(theme.colors.textTertiary, mode === 'dark' ? 0.18 : 0.10));
    root.style.setProperty('--status-completed-border', alpha(theme.colors.textTertiary, mode === 'dark' ? 0.36 : 0.24));
    root.style.setProperty('--status-completed-color', theme.colors.textTertiary);
    root.style.setProperty('--status-cancelled-bg',  alpha(theme.colors.danger, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--status-cancelled-border', alpha(theme.colors.danger, mode === 'dark' ? 0.36 : 0.28));
    root.style.setProperty('--status-cancelled-color', theme.colors.danger);
    root.style.setProperty('--status-delivery-bg',   alpha('#14B8A6', mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--status-delivery-border', alpha('#14B8A6', mode === 'dark' ? 0.36 : 0.28));
    root.style.setProperty('--status-delivery-color', '#14B8A6');

    // ── SRC COLORS (Order source badges: Walk-in, Swiggy, Zomato, etc.) ─────────
    const swiggy   = mode === 'dark' ? '#FF8A50' : '#FF6B35';
    const zomato   = mode === 'dark' ? '#FF5566' : '#E8344E';
    const qrPurple = mode === 'dark' ? '#c4b5fd' : '#8b5cf6';

    root.style.setProperty('--src-walkin-bg',     alpha(theme.colors.success, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--src-walkin-color',  theme.colors.success);
    root.style.setProperty('--src-swiggy-bg',     alpha(swiggy, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--src-swiggy-color',  swiggy);
    root.style.setProperty('--src-zomato-bg',     alpha(zomato, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--src-zomato-color',  zomato);
    root.style.setProperty('--src-delivery-bg',   alpha(theme.colors.info, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--src-delivery-color', theme.colors.info);
    root.style.setProperty('--src-qr-bg',         alpha(qrPurple, mode === 'dark' ? 0.16 : 0.10));
    root.style.setProperty('--src-qr-color',      qrPurple);

    // ── POS CATEGORY TAB BAR ────────────────────────────────────────────────────
    const bgCard = theme.colors.backgroundCard;
    const bgSurface = theme.colors.backgroundElevated;
    const border = theme.colors.border;
    const textPri = theme.colors.textPrimary;
    const textSec = theme.colors.textSecondary;
    const accent = theme.colors.primary;
    const accentBg = theme.colors.primaryBg;
    const accentBorder = theme.colors.primaryBorder;
    const accentGlow = theme.colors.shadowGlow;
    const info = theme.colors.info;
    const infoBg = alpha(info, mode === 'dark' ? 0.16 : 0.10);
    const textTer = theme.colors.textTertiary;
    const warn = theme.colors.warning;
    const danger = theme.colors.danger;

    root.style.setProperty('--pos-catbar-bg',         bgSurface);
    root.style.setProperty('--pos-catbar-border',     border);
    root.style.setProperty('--pos-cat-inactive-bg',   bgCard);
    root.style.setProperty('--pos-cat-inactive-bg-hover', alpha(border, mode === 'dark' ? 0.60 : 0.90));
    root.style.setProperty('--pos-cat-inactive-color', textSec);
    root.style.setProperty('--pos-cat-active-bg',     accent);
    root.style.setProperty('--pos-cat-active-color',  '#ffffff');
    root.style.setProperty('--pos-cat-active-glow',   accentGlow);
    root.style.setProperty('--pos-cat-border-radius', theme.borderRadius.pill || '20px');
    root.style.setProperty('--pos-cat-nav-next-bg',   info);
    root.style.setProperty('--pos-cat-nav-next-bg-hover', '#2563EB');
    root.style.setProperty('--pos-cat-nav-prev-bg',   textTer);
    root.style.setProperty('--pos-cat-nav-prev-bg-hover', textSec);
    root.style.setProperty('--pos-cat-nav-color',     '#ffffff');

    // ── FAST-FOOD POS CATEGORY TAB BAR (red accent variant) ─────────────────────
    const ffAccent = mode === 'dark' ? '#E63946' : '#DC2626';
    root.style.setProperty('--ff-catbar-bg',              bgCard);
    root.style.setProperty('--ff-catbar-border',          border);
    root.style.setProperty('--ff-cat-inactive-bg',        alpha(border, mode === 'dark' ? 0.25 : 0.20));
    root.style.setProperty('--ff-cat-inactive-bg-hover',  alpha(ffAccent, mode === 'dark' ? 0.12 : 0.08));
    root.style.setProperty('--ff-cat-inactive-border',    alpha(border, mode === 'dark' ? 0.35 : 0.30));
    root.style.setProperty('--ff-cat-inactive-border-hover', alpha(ffAccent, mode === 'dark' ? 0.35 : 0.25));
    root.style.setProperty('--ff-cat-inactive-color',     textSec);
    root.style.setProperty('--ff-cat-active-bg',          ffAccent);
    root.style.setProperty('--ff-cat-active-border',      ffAccent);
    root.style.setProperty('--ff-cat-active-color',       '#ffffff');
    root.style.setProperty('--ff-cat-active-glow',        alpha(ffAccent, mode === 'dark' ? 0.40 : 0.25));
    root.style.setProperty('--ff-cat-nav-bg',             alpha(border, mode === 'dark' ? 0.30 : 0.20));
    root.style.setProperty('--ff-cat-nav-border',         alpha(border, mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--ff-cat-nav-color',          textSec);

    // ── TABLE STATUS CHIPS (floor plan / dine-in) ────────────────────────────────
    const successBright = theme.colors.success;
    root.style.setProperty('--table-available-color',    successBright);
    root.style.setProperty('--table-available-bg',       alpha(successBright, mode === 'dark' ? 0.14 : 0.10));
    root.style.setProperty('--table-available-border',   alpha(successBright, mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-reserved-color',     warn);
    root.style.setProperty('--table-reserved-bg',        alpha(warn, mode === 'dark' ? 0.14 : 0.10));
    root.style.setProperty('--table-reserved-border',    alpha(warn, mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-occupied-color',     danger);
    root.style.setProperty('--table-occupied-bg',        alpha(danger, mode === 'dark' ? 0.14 : 0.10));
    root.style.setProperty('--table-occupied-border',    alpha(danger, mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-ordering-color',     '#8b5cf6');
    root.style.setProperty('--table-ordering-bg',        alpha('#8b5cf6', mode === 'dark' ? 0.14 : 0.10));
    root.style.setProperty('--table-ordering-border',    alpha('#8b5cf6', mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-dining-color',       textTer);
    root.style.setProperty('--table-dining-bg',          alpha(textTer, mode === 'dark' ? 0.14 : 0.08));
    root.style.setProperty('--table-dining-border',      alpha(textTer, mode === 'dark' ? 0.40 : 0.25));
    root.style.setProperty('--table-billreq-color',      '#ec4899');
    root.style.setProperty('--table-billreq-bg',         alpha('#ec4899', mode === 'dark' ? 0.14 : 0.10));
    root.style.setProperty('--table-billreq-border',     alpha('#ec4899', mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-cleaning-color',     '#6366f1');
    root.style.setProperty('--table-cleaning-bg',        alpha('#6366f1', mode === 'dark' ? 0.14 : 0.10));
    root.style.setProperty('--table-cleaning-border',    alpha('#6366f1', mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-billed-color',       info);
    root.style.setProperty('--table-billed-bg',          infoBg);
    root.style.setProperty('--table-billed-border',      alpha(info, mode === 'dark' ? 0.40 : 0.30));
    root.style.setProperty('--table-default-color',      textTer);
    root.style.setProperty('--table-default-bg',         alpha(textTer, mode === 'dark' ? 0.14 : 0.08));
    root.style.setProperty('--table-default-border',     alpha(textTer, mode === 'dark' ? 0.40 : 0.25));

    // ── ORDER TYPE TABS (Dine-in / Takeaway / Delivery …) ────────────────────────
    root.style.setProperty('--ordertype-inactive-bg',     bgCard);
    root.style.setProperty('--ordertype-inactive-border', accentBorder);
    root.style.setProperty('--ordertype-inactive-color',  textSec);
    root.style.setProperty('--ordertype-active-bg',       accentBg);
    root.style.setProperty('--ordertype-active-border',   accent);
    root.style.setProperty('--ordertype-active-color',    accent);
    root.style.setProperty('--ordertype-active-glow',     accentGlow);
    root.style.setProperty('--ordertype-hover-bg',        theme.colors.hoverBg || alpha(border, mode === 'dark' ? 0.40 : 0.80));
    root.style.setProperty('--ordertype-hover-border',    accent);

    // ── MOBILE BOTTOM NAV TABS ───────────────────────────────────────────────────
    const backdrop = mode === 'dark' ? 'rgba(18,18,20,0.85)' : 'rgba(255,255,255,0.85)';
    root.style.setProperty('--mobile-nav-bg',             bgSurface);
    root.style.setProperty('--mobile-nav-border',         border);
    root.style.setProperty('--mobile-nav-inactive-color', textTer);
    root.style.setProperty('--mobile-nav-active-color',   accent);
    root.style.setProperty('--mobile-nav-active-bg',      accentBg);
    root.style.setProperty('--mobile-nav-backdrop',       backdrop);

    // ── POS SURFACES (generic fallback tokens) ───────────────────────────────────
    root.style.setProperty('--pos-surface',               bgCard);
    root.style.setProperty('--pos-surface-2',             bgSurface);
    root.style.setProperty('--pos-border',                border);
    root.style.setProperty('--pos-text',                  textPri);
    root.style.setProperty('--pos-text-muted',            textTer);
    root.style.setProperty('--pos-accent',                accent);

  }, [theme]);

  return null;
}

export default ThemeStyles;
