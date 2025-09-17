import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/auth/Login';
import CalendarPage from '@/pages/calendar/CalendarPage';
import NotionConfigPage from '@/pages/admin/NotionConfigPage';
import SyncMonitoring from '@/pages/admin/SyncMonitoring';

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path='/login' element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path='/calendar'
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path='/admin/notion-config'
        element={
          <ProtectedRoute requiredRole="admin">
            <NotionConfigPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path='/admin/monitoring'
        element={
          <ProtectedRoute requiredRole="admin">
            <SyncMonitoring />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path='/' element={<Navigate to='/calendar' replace />} />

      {/* Catch all - redirect to calendar */}
      <Route path='*' element={<Navigate to='/calendar' replace />} />
    </Routes>
  );
}
