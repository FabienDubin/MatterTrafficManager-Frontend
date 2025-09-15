import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppRouter } from '@/router/AppRouter';
import { Toaster } from '@/components/ui/toaster';

function App() {
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