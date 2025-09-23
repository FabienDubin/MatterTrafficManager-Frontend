import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps extends React.ComponentProps<'form'> {}

export function LoginForm({ className, ...props }: LoginFormProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore(state => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      await login(data.email, data.password);

      toast.success('Connexion réussie', {
        description: 'Bienvenue sur MatterTraffic',
      });

      // Redirect to calendar
      navigate('/calendar');
    } catch (error: any) {
      console.error('Login error:', error);

      toast.error('Erreur de connexion', {
        description: error.response?.data?.message || 'Email ou mot de passe incorrect',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className={cn('flex flex-col gap-6', className)}
      onSubmit={handleSubmit(onSubmit)}
      {...props}
    >
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-bold text-foreground'>Connexion à MatterTraffic</h1>
        <p className='text-muted-foreground text-sm text-balance'>
          Entrez vos identifiants pour accéder à votre compte
        </p>
      </div>

      <div className='grid gap-6'>
        <div className='grid gap-3'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='admin@mattertraffic.fr'
            disabled={isLoading}
            {...register('email')}
          />
          {errors.email && <p className='text-sm text-destructive'>{errors.email.message}</p>}
        </div>

        <div className='grid gap-3'>
          <Label htmlFor='password'>Mot de passe</Label>
          <Input
            id='password'
            type='password'
            placeholder='••••••••'
            disabled={isLoading}
            {...register('password')}
          />
          {errors.password && <p className='text-sm text-destructive'>{errors.password.message}</p>}
        </div>

        <Button type='submit' className='w-full' disabled={isLoading}>
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </div>
    </form>
  );
}
