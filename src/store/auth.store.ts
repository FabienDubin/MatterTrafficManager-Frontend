import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, User } from '@/services/api/auth.service';
import { useConfigStore } from './config.store';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearAuth: () => void;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false
          });

          // Preload config after successful login
          // Use setTimeout to avoid blocking the login flow
          setTimeout(() => {
            const configStore = useConfigStore.getState();
            // Load all config in parallel
            Promise.all([
              configStore.loadAsyncConfig(),
              configStore.loadClientColors(),
              configStore.loadClients(),
              configStore.loadDisplayedTeams()
            ]).catch(error => {
              console.error('Failed to preload config after login:', error);
            });
          }, 0);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false
          });
        }
      },

      checkAuth: async () => {
        const token = get().accessToken;
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        try {
          const user = await authService.getCurrentUser();
          set({ user, isAuthenticated: true });
        } catch (error) {
          get().clearAuth();
        }
      },

      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      getAccessToken: () => get().accessToken,

      getRefreshToken: () => get().refreshToken,
    }),
    {
      name: 'auth-storage',
      // Persist all auth state including tokens in localStorage
    }
  )
);