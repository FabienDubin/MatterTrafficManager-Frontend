import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/auth/Login';
import CalendarPage from '@/pages/calendar/CalendarPage';
import AdminLayout from '@/layouts/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import UsersPage from '@/pages/admin/UsersPage';
import CacheDashboard from '@/pages/admin/CacheDashboard';
import NotionConnectionPage from '@/pages/admin/NotionConnectionPage';
import MappingBasesPage from '@/pages/admin/MappingBasesPage';
import { AdminMemoryPage } from '@/pages/admin/AdminMemoryPage';
import { AdminHealthPage } from '@/pages/admin/AdminHealthPage';
import { AdminMetricsPage } from '@/pages/admin/AdminMetricsPage';
import { AdminPerformancePage } from '@/pages/admin/AdminPerformancePage';
import SyncConfigPage from '@/pages/admin/SyncConfigPage';
import ConflictsPage from '@/pages/admin/ConflictsPage';
import GlobalView from '@/pages/admin/GlobalView';
import HealthMemoryPage from '@/pages/admin/HealthMemoryPage';

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
        <Route path='users' element={<UsersPage />} />
        <Route path='cache' element={<CacheDashboard />} />
        <Route path='notion-config' element={<NotionConnectionPage />} />
        <Route path='mapping-bases' element={<MappingBasesPage />} />
        <Route path='memory' element={<AdminMemoryPage />} />
        <Route path='health' element={<AdminHealthPage />} />
        <Route path='metrics' element={<AdminMetricsPage />} />
        <Route path='performance' element={<AdminPerformancePage />} />
        <Route path='sync-config' element={<SyncConfigPage />} />
        <Route path='conflicts' element={<ConflictsPage />} />
        <Route path='monitoring' element={<GlobalView />} />
        <Route path='global-view' element={<GlobalView />} />
        <Route path='health-memory' element={<HealthMemoryPage />} />
      </Route>

      {/* Default redirect */}
      <Route path='/' element={<Navigate to='/calendar' replace />} />

      {/* Catch all - redirect to calendar */}
      <Route path='*' element={<Navigate to='/calendar' replace />} />
    </Routes>
  );
}
