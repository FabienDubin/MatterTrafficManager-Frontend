import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirement if specified
  if (requiredRole) {
    const userRole = user?.role;
    
    if (requiredRole === 'admin' && userRole !== 'admin' && userRole !== 'super_admin') {
      // User doesn't have admin access
      return <Navigate to="/" replace />;
    }
    
    if (requiredRole === 'super_admin' && userRole !== 'super_admin') {
      // User doesn't have super admin access
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}