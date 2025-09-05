import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthProvider';
import { useAuthStore } from '@/store/auth.store';

// Mock zustand store
vi.mock('@/store/auth.store');

// Test component that uses the auth context
function TestComponent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="loading-status">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
    </div>
  );
}

// Protected route component for testing
function ProtectedTestComponent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

describe('AuthProvider', () => {
  const mockAuthStore = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    checkAuth: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockAuthStore);
  });

  it('provides authentication context to children', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('loading-status')).toHaveTextContent('ready');
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
  });

  it('checks authentication on mount', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockAuthStore.checkAuth).toHaveBeenCalled();
    });
  });

  it('provides authenticated user data', () => {
    const mockUser = {
      id: '1',
      email: 'admin@mattertraffic.fr',
      name: 'Admin User',
    };

    (useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      isAuthenticated: true,
      user: mockUser,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@mattertraffic.fr');
  });

  it('shows loading state', () => {
    (useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      isLoading: true,
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('loading-status')).toHaveTextContent('loading');
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(
        <BrowserRouter>
          <TestComponent />
        </BrowserRouter>
      );
    }).toThrow('useAuth must be used within AuthProvider');

    console.error = originalError;
  });

  it('updates context when auth state changes', async () => {
    const { rerender } = render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');

    // Simulate authentication
    (useAuthStore as any).mockReturnValue({
      ...mockAuthStore,
      isAuthenticated: true,
      user: { id: '1', email: 'admin@mattertraffic.fr', name: 'Admin' },
    });

    rerender(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('admin@mattertraffic.fr');
    });
  });
});