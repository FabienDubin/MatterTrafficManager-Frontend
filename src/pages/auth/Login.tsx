import { Building2 } from 'lucide-react';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/shared/feedback/ThemeToggle';

export default function LoginPage() {
  return (
    <div className='grid min-h-svh lg:grid-cols-2 bg-background'>
      <div className='flex flex-col gap-4 p-6 md:p-10 bg-background'>
        <div className='flex justify-between items-center'>
          <a href='#' className='flex items-center gap-2 font-medium text-foreground'>
            <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
              <Building2 className='size-4' />
            </div>
            MatterTraffic
          </a>
          <ThemeToggle />
        </div>
        <div className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-xs'>
            <LoginForm />
          </div>
        </div>
      </div>
      <div className='bg-muted relative hidden lg:block'>
        <div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background' />
        <div className='relative h-full flex items-center justify-center p-8'>
          <div className='max-w-md text-center'>
            <h2 className='text-3xl font-bold mb-4'>Gérez votre trafic matter</h2>
            <p className='text-muted-foreground'>
              Une solution complète pour gérer vos projets et votre calendrier en synchronisation
              avec Notion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
