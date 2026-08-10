import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../theme';

describe('Example Test', () => {
  it('should render theme provider', () => {
    render(
      <ThemeProvider defaultTheme="modern">
        <div>Test Content</div>
      </ThemeProvider>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});
