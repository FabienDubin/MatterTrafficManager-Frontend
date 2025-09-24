import { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useLocation } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, login, logout, checkAuth, isLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Only check auth status if we're not on the login page
    // This prevents infinite loops when the auth check fails
    if (location.pathname !== '/login') {
      checkAuth();
    }
  }, [location.pathname]);

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        user, 
        login, 
        logout,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};