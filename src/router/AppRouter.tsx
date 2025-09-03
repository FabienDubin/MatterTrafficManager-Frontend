import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/auth/Login';
import CalendarPage from '@/pages/calendar/CalendarPage';

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/calendar" replace />} />
      
      {/* Catch all - redirect to calendar */}
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Routes>
  );
}