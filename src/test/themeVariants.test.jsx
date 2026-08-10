import React, { useEffect } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import registry from '../theme/ThemeRegistry';
import { ThemeProvider, useTheme } from '../theme';

describe('theme mode variants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('registers light/dark counterparts for every base theme', () => {
    [
      'modern-light',
      'classic-dark',
      'fastfood-dark',
      'fastfood-simple-dark',
      'fastfood-comprehensive-dark',
      'cafe-dark',
      'finedining-dark',
      'bar-light',
      'bakery-dark',
      'accessibility-dark',
    ].forEach((themeId) => {
      expect(registry.has(themeId)).toBe(true);
    });
  });

  it('keeps the current mode when switching to another base theme', () => {
    function Probe() {
      const { theme, setTheme } = useTheme();

      useEffect(() => {
        setTheme('cafe');
      }, [setTheme]);

      return <div>{theme.id}</div>;
    }

    render(
      <ThemeProvider defaultTheme="bar" storageKey="theme-variant-test">
        <Probe />
      </ThemeProvider>
    );

    expect(screen.getByText('cafe-dark')).toBeInTheDocument();
  });
});
