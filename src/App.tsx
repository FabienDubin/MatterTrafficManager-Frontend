import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppRouter } from '@/router/AppRouter';
import { Toaster } from '@/components/ui/toaster';
import { useInitConfigStore } from '@/store/config.store';
import { runMigrationIfNeeded } from '@/lib/migrateLocalStorage';

// Run localStorage migration on app startup
runMigrationIfNeeded();

// Create router with v7 future flags
const router = createBrowserRouter(
  [{
    path: '*',
    element: (
      <AppProviders>
        <AuthProvider>
          <AppRouter />
          <Toaster />
        </AuthProvider>
      </AppProviders>
    ),
  }],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);

function App() {
  // Initialize config store on app startup
  useInitConfigStore();
  
  return <RouterProvider router={router} />;
}

export default App