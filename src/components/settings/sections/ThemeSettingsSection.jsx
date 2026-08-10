/**
 * ThemeSettingsSection.jsx
 * 
 * Settings UI for POS theme selection with live preview.
 * Allows instant theme switching without reload.
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../../theme/useTheme';

export default function ThemeSettingsSection({ settings, onSettingChange }) {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState((theme?.id || 'modern').replace(/-light$|-dark$/, ''));

  // Sync with current theme from ThemeProvider
  useEffect(() => {
    if (theme?.id) {
      setSelectedTheme(theme.id.replace(/-light$|-dark$/, ''));
    }
  }, [theme?.id]);

  const themes = [
    { id: 'modern', name: 'Modern', description: 'Clean, modern interface', icon: '🎨', color: '#6366f1' },
    { id: 'classic', name: 'Classic POS', description: 'Traditional layout', icon: '📟', color: '#10b981' },
    { id: 'fastfood', name: 'Fast Food', description: 'Large touch targets', icon: '🍔', color: '#f59e0b' },
    { id: 'cafe', name: 'Cafe', description: 'Warm, cozy aesthetic', icon: '☕', color: '#8b5cf6' },
    { id: 'finedining', name: 'Fine Dining', description: 'Elegant, minimalist', icon: '🍽️', color: '#ec4899' },
    { id: 'bar', name: 'Bar', description: 'Dark mode with neon', icon: '🍸', color: '#3b82f6' },
    { id: 'bakery', name: 'Bakery', description: 'Soft pastels', icon: '🥐', color: '#f97316' },
    { id: 'accessibility', name: 'Accessibility', description: 'WCAG compliant', icon: '♿', color: '#14b8a6' },
  ];

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    // Update ThemeProvider directly
    if (setTheme) {
      setTheme(themeId);
    }
    // Also update settings for persistence
    onSettingChange('theme', themeId);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--cafe-text-primary)' }}>
          Theme Settings
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--cafe-text-secondary)' }}>
          Customize your POS interface appearance. Changes apply instantly without reloading.
        </p>
      </div>

      {/* Current Theme */}
      <div style={{
        background: 'var(--cafe-bg-card)',
        border: '1px solid var(--cafe-border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '32px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cafe-text-tertiary)', marginBottom: '8px' }}>
          Current Theme
        </div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cafe-text-primary)' }}>
          {themes.find(t => t.id === selectedTheme)?.name || 'Modern'}
        </div>
      </div>

      {/* Theme Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {themes.map(theme => (
          <div
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            style={{
              background: selectedTheme === theme.id ? 'var(--cafe-accent-bg)' : 'var(--cafe-bg-card)',
              border: selectedTheme === theme.id ? '2px solid var(--cafe-accent)' : '1px solid var(--cafe-border)',
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              if (selectedTheme !== theme.id) {
                e.currentTarget.style.borderColor = 'var(--cafe-border)';
              }
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{theme.icon}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--cafe-text-primary)' }}>
              {theme.name}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)' }}>
              {theme.description}
            </div>
            {selectedTheme === theme.id && (
              <div style={{
                marginTop: '12px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--cafe-accent)',
              }}>
                ✓ Active
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{
        background: 'var(--cafe-bg-surface)',
        border: '1px solid var(--cafe-border-light)',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '32px',
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--cafe-text-primary)' }}>
          About Themes
        </h3>
        <ul style={{ fontSize: '13px', color: 'var(--cafe-text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Theme changes apply instantly without reloading the application</li>
          <li style={{ marginBottom: '8px' }}>Your cart, orders, and all state remain intact when switching themes</li>
          <li>Accessibility theme meets WCAG AA/AAA compliance standards</li>
        </ul>
      </div>
    </div>
  );
}
