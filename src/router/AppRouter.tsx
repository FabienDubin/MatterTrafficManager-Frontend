import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/auth/Login';
import CalendarPage from '@/pages/calendar/CalendarPage';
import DayViewTest from '@/pages/calendar/DayViewTest';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';

// Configuration pages
import NotionConnectionPage from '@/pages/admin/configuration/NotionConnectionPage';
import MappingBasesPage from '@/pages/admin/configuration/MappingBasesPage';

// Monitoring pages
import GlobalView from '@/pages/admin/monitoring/GlobalView';
import HealthMemoryPage from '@/pages/admin/monitoring/HealthMemoryPage';
import CacheDashboard from '@/pages/admin/monitoring/CacheDashboard';

// Synchronisation pages
import SyncControlPage from '@/pages/admin/synchronisation/SyncControlPage';
import ConflictsPage from '@/pages/admin/synchronisation/ConflictsPage';
import WebhookLogsPage from '@/pages/admin/synchronisation/WebhookLogsPage';

// Users page
import UsersPage from '@/pages/admin/users/UsersPage';

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
      
      {/* Test route for DayView */}
      <Route
        path='/calendar/day-test'
        element={
          <ProtectedRoute>
            <DayViewTest />
          </ProtectedRoute>
        }
      />

      {/* Admin routes with layout */}
      <Route
        path='/admin'
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        
        {/* Configuration routes */}
        <Route path='configuration/notion-connection' element={<NotionConnectionPage />} />
        <Route path='configuration/mapping-bases' element={<MappingBasesPage />} />
        
        {/* Monitoring routes */}
        <Route path='monitoring/global' element={<GlobalView />} />
        <Route path='monitoring/health-memory' element={<HealthMemoryPage />} />
        <Route path='monitoring/cache' element={<CacheDashboard />} />
        
        {/* Synchronisation routes */}
        <Route path='synchronisation/sync-control' element={<SyncControlPage />} />
        <Route path='synchronisation/conflicts' element={<ConflictsPage />} />
        <Route path='synchronisation/webhook-logs' element={<WebhookLogsPage />} />
        
        {/* Users routes */}
        <Route path='users/list' element={<UsersPage />} />
      </Route>

      {/* Default redirect */}
      <Route path='/' element={<Navigate to='/calendar' replace />} />

      {/* Catch all - redirect to calendar */}
      <Route path='*' element={<Navigate to='/calendar' replace />} />
    </Routes>
  );
}
