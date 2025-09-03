import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/providers/AppProviders';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppRouter } from '@/router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App