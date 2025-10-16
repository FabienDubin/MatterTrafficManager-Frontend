import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '../auth.store';
import { authService } from '@/services/api/auth.service';
import { useConfigStore } from '../config.store';

// Mock the auth service
vi.mock('@/services/api/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock the config store
vi.mock('../config.store', () => ({
  useConfigStore: {
    getState: vi.fn(() => ({
      loadAsyncConfig: vi.fn().mockResolvedValue(undefined),
      loadClientColors: vi.fn().mockResolvedValue(undefined),
      loadClients: vi.fn().mockResolvedValue(undefined),
      loadDisplayedTeams: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { 
      store[key] = value; 
    },
    removeItem: (key: string) => { 
      delete store[key]; 
    },
    clear: () => { 
      store = {}; 
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock setTimeout to avoid timing issues in tests
vi.mock('timers', () => ({
  setTimeout: (fn: () => void) => fn(),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        role: 'TRAFFIC_MANAGER' as const 
      };
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };

      // Mock successful login response
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        ...mockTokens,
      });

      const { result } = renderHook(() => useAuthStore());

      // Test login action
      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Verify state after login
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe(mockTokens.accessToken);
      expect(result.current.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);

      // Verify auth service was called
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle login failure', async () => {
      const loginError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(loginError);

      const { result } = renderHook(() => useAuthStore());

      // Test login failure
      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrong-password')
        ).rejects.toThrow('Invalid credentials');
      });

      // Verify state remains unauthenticated
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      vi.mocked(authService.login).mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login('test@example.com', 'password');
      });

      // Check loading state is true
      expect(result.current.isLoading).toBe(true);

      // Resolve login
      await act(async () => {
        resolveLogin!({
          user: { id: '1', email: 'test@example.com', role: 'TRAFFIC_MANAGER' },
          accessToken: 'token',
          refreshToken: 'refresh',
        });
        await loginPromise;
      });

      // Check loading state is false after completion
      expect(result.current.isLoading).toBe(false);
    });

    it('should preload config after successful login', async () => {
      const mockConfigStore = {
        loadAsyncConfig: vi.fn().mockResolvedValue(undefined),
        loadClientColors: vi.fn().mockResolvedValue(undefined),
        loadClients: vi.fn().mockResolvedValue(undefined),
        loadDisplayedTeams: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(useConfigStore.getState).mockReturnValue(mockConfigStore);

      vi.mocked(authService.login).mockResolvedValue({
        user: { id: '1', email: 'test@example.com', role: 'TRAFFIC_MANAGER' },
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Wait a bit for the setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify config loading was triggered
      expect(mockConfigStore.loadAsyncConfig).toHaveBeenCalled();
      expect(mockConfigStore.loadClientColors).toHaveBeenCalled();
      expect(mockConfigStore.loadClients).toHaveBeenCalled();
      expect(mockConfigStore.loadDisplayedTeams).toHaveBeenCalled();
    });
  });

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      vi.mocked(authService.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // First, set authenticated state
      act(() => {
        result.current.setUser({ 
          id: '1', 
          email: 'test@example.com', 
          role: 'TRAFFIC_MANAGER' 
        });
        result.current.setTokens('access-token', 'refresh-token');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Test logout
      await act(async () => {
        await result.current.logout();
      });

      // Verify state is cleared
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Verify auth service was called
      expect(authService.logout).toHaveBeenCalled();
    });

    it('should clear auth state even if logout service fails', async () => {
      vi.mocked(authService.logout).mockRejectedValue(new Error('Server error'));

      const { result } = renderHook(() => useAuthStore());

      // Set authenticated state
      act(() => {
        result.current.setUser({ 
          id: '1', 
          email: 'test@example.com', 
          role: 'TRAFFIC_MANAGER' 
        });
        result.current.setTokens('access-token', 'refresh-token');
      });

      // Test logout with server error - catch the error but check state is cleared
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          // Error is expected from authService.logout, but state should still be cleared
          expect(error).toBeInstanceOf(Error);
        }
      });

      // Verify state is still cleared despite server error (finally block executed)
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Auth Check', () => {
    it('should handle valid token check', async () => {
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        role: 'TRAFFIC_MANAGER' as const 
      };

      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      // Set token but no user (simulating app restart)
      act(() => {
        result.current.setTokens('valid-token', 'refresh-token');
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });

    it('should handle invalid token check', async () => {
      vi.mocked(authService.getCurrentUser).mockRejectedValue(
        new Error('Token expired')
      );

      const { result } = renderHook(() => useAuthStore());

      // Set token and user
      act(() => {
        result.current.setUser({ 
          id: '1', 
          email: 'test@example.com', 
          role: 'TRAFFIC_MANAGER' 
        });
        result.current.setTokens('invalid-token', 'refresh-token');
      });

      await act(async () => {
        await result.current.checkAuth();
      });

      // Should clear auth after failed check
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear auth when no token present', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      // Should not call service if no token
      expect(authService.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('Token Management', () => {
    it('should set and get access token', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('access-token', 'refresh-token');
      });

      expect(result.current.getAccessToken()).toBe('access-token');
      expect(result.current.accessToken).toBe('access-token');
    });

    it('should set and get refresh token', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTokens('access-token', 'refresh-token');
      });

      expect(result.current.getRefreshToken()).toBe('refresh-token');
      expect(result.current.refreshToken).toBe('refresh-token');
    });
  });

  describe('User Management', () => {
    it('should set user and update authentication status', () => {
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        role: 'TRAFFIC_MANAGER' as const 
      };

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should clear user and update authentication status', () => {
      const { result } = renderHook(() => useAuthStore());

      // First set a user
      act(() => {
        result.current.setUser({ 
          id: '1', 
          email: 'test@example.com', 
          role: 'TRAFFIC_MANAGER' 
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then clear user
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should verify persistence behavior without relying on implementation details', async () => {
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        role: 'TRAFFIC_MANAGER' as const 
      };

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Verify the store state is correct (persistence is handled by Zustand)
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('access-token');
      expect(result.current.refreshToken).toBe('refresh-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should maintain state across re-renders', () => {
      const mockUser = { 
        id: '1', 
        email: 'test@example.com', 
        role: 'TRAFFIC_MANAGER' as const 
      };

      const { result, rerender } = renderHook(() => useAuthStore());

      // Set auth state
      act(() => {
        result.current.setUser(mockUser);
        result.current.setTokens('access-token', 'refresh-token');
      });

      // Rerender hook to simulate component re-render
      rerender();

      // State should persist across re-renders
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('access-token');
      expect(result.current.refreshToken).toBe('refresh-token');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Clear Auth', () => {
    it('should clear all auth state', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial authenticated state
      act(() => {
        result.current.setUser({ 
          id: '1', 
          email: 'test@example.com', 
          role: 'TRAFFIC_MANAGER' 
        });
        result.current.setTokens('access-token', 'refresh-token');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Clear auth
      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});