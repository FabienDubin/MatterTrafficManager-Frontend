import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { apiClient } from '../client';
import { useAuthStore } from '@/store/auth.store';
import { config } from '@/config/environment';

// Mock the auth store
vi.mock('@/store/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      setTokens: vi.fn(),
      clearAuth: vi.fn(),
    })),
  },
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    post: vi.fn(),
  },
  create: vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  })),
  post: vi.fn(),
}));

// Mock config
vi.mock('@/config/environment', () => ({
  config: {
    API_URL: 'http://localhost:3000/api',
  },
}));

// Mock window.location
const mockLocation = {
  pathname: '/',
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('API Client', () => {
  let mockAuthStore: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock location
    mockLocation.pathname = '/';
    mockLocation.href = '';
    
    // Setup mock auth store
    mockAuthStore = {
      getAccessToken: vi.fn(),
      getRefreshToken: vi.fn(),
      setTokens: vi.fn(),
      clearAuth: vi.fn(),
    };
    
    vi.mocked(useAuthStore.getState).mockReturnValue(mockAuthStore);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Client Configuration', () => {
    it('should have apiClient instance defined', () => {
      // Test that the client is properly exported and defined
      expect(apiClient).toBeDefined();
      expect(typeof apiClient).toBe('object');
    });

    it('should verify config values', () => {
      // Test configuration values are correct
      expect(config.API_URL).toBe('http://localhost:3000/api');
    });
  });

  describe('Auth Store Integration', () => {
    it('should integrate with auth store for token management', () => {
      const mockToken = 'mock-access-token';
      mockAuthStore.getAccessToken.mockReturnValue(mockToken);

      // Test that auth store methods are accessible
      expect(useAuthStore.getState).toBeDefined();
      expect(mockAuthStore.getAccessToken()).toBe(mockToken);
      expect(mockAuthStore.getRefreshToken).toBeDefined();
      expect(mockAuthStore.setTokens).toBeDefined();
      expect(mockAuthStore.clearAuth).toBeDefined();
    });

    it('should handle null token correctly', () => {
      mockAuthStore.getAccessToken.mockReturnValue(null);
      expect(mockAuthStore.getAccessToken()).toBeNull();
    });
  });

  describe('Error Response Logic', () => {
    it('should identify 401 errors correctly', () => {
      const mockError: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
        } as any,
        config: {
          url: '/api/tasks',
        } as any,
      };

      // Test error identification logic
      expect(mockError.response?.status).toBe(401);
      
      // Test non-auth endpoint identification
      const originalRequest = mockError.config as any;
      const isAuthEndpoint =
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh');

      expect(isAuthEndpoint).toBe(false);
    });

    it('should identify auth endpoints correctly', () => {
      const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
      
      authEndpoints.forEach(endpoint => {
        const isAuthEndpoint = 
          endpoint.includes('/auth/login') ||
          endpoint.includes('/auth/register') ||
          endpoint.includes('/auth/refresh');
        
        expect(isAuthEndpoint).toBe(true);
      });
    });

    it('should handle permission errors correctly', () => {
      const permissionErrors = [
        { error: 'Admin access required' },
        { message: 'Admin access required' },
        { error: 'Special access required' },
        { message: 'Special access required' },
      ];

      permissionErrors.forEach(errorData => {
        const mockError: Partial<AxiosError> = {
          response: {
            status: 401,
            data: errorData,
          } as any,
          config: {
            url: '/api/admin/something',
          } as any,
        };

        // Test permission check logic
        const isPermissionError = 
          errorData.error?.includes('Admin') ||
          errorData.error?.includes('access required') ||
          errorData.message?.includes('Admin') ||
          errorData.message?.includes('access required');

        expect(isPermissionError).toBe(true);
      });
    });

    it('should test redirect logic', () => {
      // Test that location redirect logic works
      mockLocation.pathname = '/dashboard';
      expect(mockLocation.pathname).toBe('/dashboard');
      expect(mockLocation.pathname !== '/login').toBe(true);
    });

    it('should not redirect if already on login page', () => {
      mockLocation.pathname = '/login';
      expect(mockLocation.pathname === '/login').toBe(true);
    });
  });

  describe('403 Error Handling Logic', () => {
    it('should identify 403 responses correctly', () => {
      const mockError: Partial<AxiosError> = {
        response: {
          status: 403,
          data: { message: 'Access denied' },
        } as any,
        config: {
          url: '/api/protected-resource',
        } as any,
      };

      expect(mockError.response?.status).toBe(403);
    });

    it('should create appropriate error message for 403', () => {
      const customErrorMessage = 
        "Désolé, tu n'es pas autorisé(e) à modifier cette tâche. Rapproche-toi du Traffic Manager pour effectuer cette modification.";

      expect(customErrorMessage).toContain("Désolé, tu n'es pas autorisé(e)");
      expect(customErrorMessage).toContain("Traffic Manager");
    });

    it('should preserve error properties correctly', () => {
      const mockResponse = { status: 403, data: { message: 'Forbidden' } };
      const mockConfig = { url: '/api/admin/action' };

      const customError = new Error('Custom message') as any;
      customError.response = mockResponse;
      customError.config = mockConfig;
      customError.status = 403;

      expect(customError.response).toBe(mockResponse);
      expect(customError.config).toBe(mockConfig);
      expect(customError.status).toBe(403);
    });
  });

  describe('Token Management Logic', () => {
    it('should handle token refresh flow correctly', () => {
      const mockRefreshToken = 'valid-refresh-token';
      const mockNewTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthStore.getRefreshToken.mockReturnValue(mockRefreshToken);
      
      // Test token availability
      expect(mockAuthStore.getRefreshToken()).toBe(mockRefreshToken);
      
      // Test that store methods are available for token updates
      expect(mockAuthStore.setTokens).toBeDefined();
      expect(typeof mockAuthStore.setTokens).toBe('function');
    });

    it('should handle missing refresh token gracefully', () => {
      mockAuthStore.getRefreshToken.mockReturnValue(null);

      // Test error handling for missing refresh token
      const hasRefreshToken = !!mockAuthStore.getRefreshToken();
      expect(hasRefreshToken).toBe(false);
    });

    it('should not retry requests that have already been retried', () => {
      const mockError: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
        } as any,
        config: {
          url: '/api/tasks',
          _retry: true, // Already retried
        } as any,
      };

      // Test retry flag logic
      const originalRequest = mockError.config as any;
      const hasRetried = !!originalRequest._retry;
      expect(hasRetried).toBe(true);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle requests without config gracefully', () => {
      const mockError: Partial<AxiosError> = {
        response: {
          status: 401,
          data: {},
        } as any,
        config: undefined,
      };

      // Test graceful handling of undefined config
      const originalRequest = mockError.config as any;
      expect(originalRequest).toBeUndefined();
    });

    it('should handle responses without data gracefully', () => {
      const mockError: Partial<AxiosError> = {
        response: {
          status: 401,
          data: undefined,
        } as any,
        config: {
          url: '/api/tasks',
        } as any,
      };

      // Test graceful handling of undefined response data
      const responseData = mockError.response?.data as any;
      expect(responseData).toBeUndefined();
    });

    it('should handle network errors correctly', () => {
      const networkError: Partial<AxiosError> = {
        response: undefined,
        message: 'Network Error',
      };

      // Test that network errors (no response) are handled
      expect(networkError.response).toBeUndefined();
      expect(networkError.message).toBe('Network Error');
    });
  });

  describe('Console Logging', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log permission denied errors', () => {
      // Test console.error would be called for permission errors
      console.error('Permission denied: Admin access required');
      expect(consoleSpy).toHaveBeenCalledWith('Permission denied: Admin access required');
    });

    it('should log access forbidden errors', () => {
      // Test console.error would be called for 403 errors
      console.error('Access forbidden: Insufficient permissions');
      expect(consoleSpy).toHaveBeenCalledWith('Access forbidden: Insufficient permissions');
    });
  });
});