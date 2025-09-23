import axios, { AxiosError } from 'axios';
import { config } from '@/config/environment';

export const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 10000,
  headers: { 
    "Content-Type": "application/json" 
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer le refresh token et les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Si c'est une erreur 401 et qu'on n'a pas encore essayé de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Vérifier si c'est vraiment un problème d'authentification ou de permissions
      const responseData = error.response.data as any;
      
      // Si le message indique un problème de rôle/permissions, ne pas rediriger
      if (responseData?.error?.includes('Admin') || 
          responseData?.error?.includes('access required') ||
          responseData?.message?.includes('Admin') || 
          responseData?.message?.includes('access required')) {
        // C'est un problème de permissions, pas d'auth
        console.error('Permission denied: Admin access required');
        return Promise.reject(error);
      }
      
      // Sinon, essayer de refresh le token
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${config.API_URL}/auth/refresh`, {
          refreshToken
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Redirect to login only on refresh failure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
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