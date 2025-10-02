import axios, { AxiosError } from 'axios';
import { config } from '@/config/environment';
import { useAuthStore } from '@/store/auth.store';

export const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 30000, // Connexion lente chez matter
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  config => {
    // Get token from auth store instead of localStorage directly
    const token = useAuthStore.getState().getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Intercepteur pour gérer le refresh token et les erreurs
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Don't try to refresh on auth endpoints (login, register, refresh)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/refresh');

    // Si c'est une erreur 401 et qu'on n'a pas encore essayé de refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // Vérifier si c'est vraiment un problème d'authentification ou de permissions
      const responseData = error.response.data as any;

      // Si le message indique un problème de rôle/permissions, ne pas rediriger
      if (
        responseData?.error?.includes('Admin') ||
        responseData?.error?.includes('access required') ||
        responseData?.message?.includes('Admin') ||
        responseData?.message?.includes('access required')
      ) {
        // C'est un problème de permissions, pas d'auth
        console.error('Permission denied: Admin access required');
        return Promise.reject(error);
      }

      // Sinon, essayer de refresh le token
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${config.API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in auth store
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Clean up auth on refresh failure
        useAuthStore.getState().clearAuth();

        // Only redirect to login if we're not already on the login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Pour les erreurs 403, c'est clairement un problème de permissions
    if (error.response?.status === 403) {
      console.error('Access forbidden: Insufficient permissions');
      // Ne pas rediriger, laisser le composant gérer l'erreur
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
