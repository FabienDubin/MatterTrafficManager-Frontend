import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AppConfig, devLog } from '../config/app.config';

// Configuration de base pour l'API
const API_BASE_URL = AppConfig.API_URL;
const API_TIMEOUT = AppConfig.API_TIMEOUT;

// Interface pour les réponses API
interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: string;
}

// Interface pour les erreurs API
interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Créer l'instance Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requête pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem(AppConfig.JWT_STORAGE_KEY);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log des requêtes en développement
    if (AppConfig.IS_DEV) {
      devLog(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => {
    console.error('[API] Erreur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs globalement
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log des réponses en développement
    if (AppConfig.IS_DEV) {
      devLog(`[API] Response from ${response.config.url}:`, response.data);
    }

    return response;
  },
  (error) => {
    console.error('[API] Erreur de réponse:', error);

    // Gestion des erreurs d'authentification
    if (error.response?.status === 401) {
      // Supprimer le token invalide
      localStorage.removeItem(AppConfig.JWT_STORAGE_KEY);
      
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }

    // Gestion des erreurs de réseau
    if (!error.response) {
      return Promise.reject({
        message: 'Erreur de réseau - Vérifiez votre connexion',
        status: 0,
        code: 'NETWORK_ERROR',
      } as ApiError);
    }

    // Formatage de l'erreur pour le frontend
    const apiError: ApiError = {
      message: error.response.data?.message || error.message || 'Une erreur est survenue',
      status: error.response.status,
      code: error.response.data?.code,
    };

    return Promise.reject(apiError);
  }
);

// Service API générique
class ApiService {
  // GET request
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // POST request
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  // PUT request
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  // DELETE request
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  // Méthode pour tester la connectivité
  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.get('/health');
  }
}

// Instance du service API
const apiService = new ApiService();

export { apiClient, apiService, ApiError };
export type { ApiResponse };