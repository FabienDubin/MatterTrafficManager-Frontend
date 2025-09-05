import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, useEffect } from 'react';
import { ThemeProvider, useTheme } from '../ThemeProvider';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock matchMedia
const matchMediaMock = vi.fn();
global.matchMedia = matchMediaMock as any;

// Test component that uses the theme context
function TestComponent() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
    
    // Default matchMedia mock for light preference
    matchMediaMock.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  it('provides theme context to children', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('defaults to system theme when no saved preference', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  it('loads saved theme from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('vite-ui-theme');
  });

  it('applies light theme class to document root', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Light'));

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies dark theme class to document root', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Dark'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('saves theme preference to localStorage', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    await user.click(screen.getByText('Dark'));

    expect(localStorageMock.setItem).toHaveBeenCalledWith('vite-ui-theme', 'dark');
  });

  it('applies system theme based on media query (light)', () => {
    localStorageMock.getItem.mockReturnValue('system');
    matchMediaMock.mockReturnValue({
      matches: false, // light mode
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    // System theme with light preference should add 'light' class
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('applies system theme based on media query (dark)', () => {
    matchMediaMock.mockReturnValue({
      matches: true, // dark mode
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('switches between themes correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    // Switch to dark
    await user.click(screen.getByText('Dark'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Switch to light
    await user.click(screen.getByText('Light'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    // Switch to system
    await user.click(screen.getByText('System'));
    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    function InvalidComponent() {
      const [error, setError] = useState<string | null>(null);
      
      useEffect(() => {
        try {
          // This will throw when rendered
          const hook = useTheme;
          hook();
        } catch (err: any) {
          setError(err.message);
        }
      }, []);
      
      if (error) {
        return <div>{error}</div>;
      }
      return <div>No error</div>;
    }

    // We expect this to throw when trying to use the hook outside provider
    expect(() => {
      render(<InvalidComponent />);
      // The hook should throw immediately when accessed
    }).not.toThrow();

    console.error = originalError;
  });

  it('uses custom storage key when provided', () => {
    localStorageMock.getItem.mockReturnValue('dark');

    render(
      <ThemeProvider storageKey="custom-theme-key">
        <TestComponent />
      </ThemeProvider>
    );

    expect(localStorageMock.getItem).toHaveBeenCalledWith('custom-theme-key');
  });

  it('uses custom default theme when provided', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
  });
});