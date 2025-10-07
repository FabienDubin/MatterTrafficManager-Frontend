import { useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/feedback/ThemeToggle';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { Logo } from '../shared/Logo';

/**
 * CalendarHeader - Header avec logo, user info, admin et déconnexion
 */
export function CalendarHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur', {
        description: 'Impossible de se déconnecter',
      });
    }
  };

  return (
    <header className='border-b'>
      <div className='flex items-center justify-between px-6 py-4'>
        <div className='flex items-center gap-3'>
          <Logo className='size-6' />
          <h1 className='text-2xl font-semibold text-foreground'>Matter Traffic Manager</h1>
        </div>

        <div className='flex items-center gap-4'>
          {user && <span className='text-sm text-muted-foreground'>{user.email}</span>}
          <ThemeToggle />

          {/* Admin button - only visible for admin users */}
          {user?.role === 'admin' && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate('/admin')}
              className='gap-2'
            >
              <Settings className='h-4 w-4' />
              <span>Administration</span>
            </Button>
          )}

          <Button variant='outline' size='sm' onClick={handleLogout} className='gap-2'>
            <LogOut className='h-4 w-4 text-foreground' />
            <span className='text-foreground'>Déconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
