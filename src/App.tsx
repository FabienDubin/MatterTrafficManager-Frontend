import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppRouter } from '@/router/AppRouter';
import { Toaster } from '@/components/ui/toaster';
import { useInitConfigStore } from '@/store/config.store';

function App() {
  // Initialize config store on app startup
  useInitConfigStore();
  
  return (
    <BrowserRouter>
      <AppProviders>
        <AuthProvider>
          <AppRouter />
          <Toaster />
        </AuthProvider>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App