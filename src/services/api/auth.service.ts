import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    const authData = response.data.data; // Extract nested data
    
    // Store tokens
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    
    return authData;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/refresh', {
      refreshToken
    });
    const authData = response.data.data; // Extract nested data
    
    // Update stored tokens
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('refreshToken', authData.refreshToken);
    
    return authData;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }
};