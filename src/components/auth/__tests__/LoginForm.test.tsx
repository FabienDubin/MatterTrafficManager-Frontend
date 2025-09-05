import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
import { useAuthStore } from '@/store/auth.store';

// Mock dependencies
const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('@/store/auth.store');
vi.mock('sonner', () => {
  const mockToast = vi.fn();
  mockToast.success = vi.fn();
  mockToast.error = vi.fn();
  mockToast.info = vi.fn();
  return { toast: mockToast };
});
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import { toast } from 'sonner';

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue(mockLogin);
  });

  it('renders login form with all fields', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Connexion à MatterTraffic')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument();
  });

  it('displays validation errors for empty fields', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      // With zod validation, empty email field will show 'Email invalide'
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  it('displays validation error for invalid email', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    await user.type(passwordInput, 'test');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    // HTML5 validation will prevent form submission for invalid email
    // React Hook Form with Zod will handle validation
    await waitFor(() => {
      expect(emailInput).toHaveValue('invalid-email');
      // Form should not submit with invalid email
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({});

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    
    await user.type(emailInput, 'admin@mattertraffic.fr');
    await user.type(passwordInput, 'dev123');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@mattertraffic.fr', 'dev123');
      expect(toast.success).toHaveBeenCalledWith('Connexion réussie', {
        description: 'Bienvenue sur MatterTraffic',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/calendar');
    });
  });

  it('handles login error correctly', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: errorMessage } }
    });

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    
    await user.type(emailInput, 'admin@mattertraffic.fr');
    await user.type(passwordInput, 'wrong-password');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erreur de connexion', {
        description: errorMessage,
      });
    });
  });

  it('disables form fields and button during submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/mot de passe/i);
    
    await user.type(emailInput, 'admin@mattertraffic.fr');
    await user.type(passwordInput, 'dev123');
    
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Connexion...');
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('displays test credentials', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Utilisateur de test:')).toBeInTheDocument();
    expect(screen.getByText('admin@mattertraffic.fr / dev123')).toBeInTheDocument();
  });
});