import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interface pour l'état global de l'application
interface AppState {
  // État de l'application
  isLoading: boolean;
  error: string | null;
  
  // État utilisateur
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  
  // État d'authentification
  isAuthenticated: boolean;
  token: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: AppState['user']) => void;
  setAuth: (token: string, user: AppState['user']) => void;
  logout: () => void;
  clearError: () => void;
}

// Store principal de l'application avec Zustand
const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // État initial
      isLoading: false,
      error: null,
      user: null,
      isAuthenticated: false,
      token: localStorage.getItem(import.meta.env.VITE_JWT_LOCAL_STORAGE_KEY || 'matter_traffic_token'),
      
      // Actions pour gérer l'état de chargement
      setLoading: (loading: boolean) =>
        set({ isLoading: loading }, false, 'setLoading'),
      
      // Actions pour gérer les erreurs
      setError: (error: string | null) =>
        set({ error }, false, 'setError'),
      
      clearError: () =>
        set({ error: null }, false, 'clearError'),
      
      // Actions pour gérer l'utilisateur
      setUser: (user: AppState['user']) =>
        set({ user }, false, 'setUser'),
      
      // Actions pour l'authentification
      setAuth: (token: string, user: AppState['user']) => {
        localStorage.setItem(import.meta.env.VITE_JWT_LOCAL_STORAGE_KEY || 'matter_traffic_token', token);
        set(
          {
            token,
            user,
            isAuthenticated: true,
            error: null,
          },
          false,
          'setAuth'
        );
      },
      
      // Action de déconnexion
      logout: () => {
        localStorage.removeItem(import.meta.env.VITE_JWT_LOCAL_STORAGE_KEY || 'matter_traffic_token');
        set(
          {
            token: null,
            user: null,
            isAuthenticated: false,
            error: null,
          },
          false,
          'logout'
        );
      },
    }),
    {
      name: 'matter-traffic-store',
      enabled: import.meta.env.VITE_DEV_TOOLS === 'true',
    }
  )
);

// Hooks personnalisés pour accéder facilement aux parties du store
export const useAuth = () => {
  const { isAuthenticated, user, token, setAuth, logout } = useAppStore();
  return { isAuthenticated, user, token, setAuth, logout };
};

export const useLoading = () => {
  const { isLoading, setLoading } = useAppStore();
  return { isLoading, setLoading };
};

export const useError = () => {
  const { error, setError, clearError } = useAppStore();
  return { error, setError, clearError };
};

export default useAppStore;